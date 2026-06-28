import logging
import asyncio
from google import genai
from core.config import settings

logger = logging.getLogger(__name__)

# Initialize Gemini Client
# The SDK automatically looks for GEMINI_API_KEY in the environment if not passed explicitly,
# but passing it directly is safer.
client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def _call_with_retry(fn, max_retries=3):
    """429/503 에러 시 지수 백오프로 최대 max_retries회 재시도"""
    for attempt in range(max_retries):
        try:
            return await fn()
        except Exception as e:
            err_str = str(e)
            if ("429" in err_str or "503" in err_str or "RESOURCE_EXHAUSTED" in err_str or "UNAVAILABLE" in err_str) and attempt < max_retries - 1:
                wait_time = 2 ** attempt  # 1초, 2초, 4초
                logger.warning(f"Rate limit/unavailable (attempt {attempt+1}/{max_retries}). Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                raise e
    raise Exception("Max retries exceeded")

async def generate_ai_reply(scenario_info: dict, conversation_history: list, mode: str) -> dict:
    """
    Generates a reply mimicking the standardized patient based on the prompt using Gemini 2.5 Flash.
    Returns a dict with 'text' and optional 'tutor_guide' (if mode is LEARNING).
    """
    logger.info(f"Generating AI reply for mode: {mode} using {settings.GEMINI_MODEL}")
    
    # 1. Construct System Prompt
    patient_info = scenario_info.get("patient_info", {})
    pe_findings = scenario_info.get("pe_findings", [])
    
    system_instruction = f"""
    당신은 의과대학 실기시험(CPX)의 표준환자(Standardized Patient)입니다.
    현재 상황:
    - 환자 이름: {patient_info.get('name', '김환자')}
    - 나이/성별: {patient_info.get('age', 45)}세 / {patient_info.get('gender', 'M')}
    - 주증상: {patient_info.get('initial_complaint', '어디가 불편해서 오셨나요?')}
    - 질환 스크립트: {patient_info.get('script', '')}
    """
    
    if pe_findings:
        findings_str = ", ".join([f"{f['nm']}({f['find']})" for f in pe_findings])
        system_instruction += f"\n[중요 상태 업데이트]\n의사가 방금 신체진찰을 완료했습니다. 의사가 발견한 진찰 소견은 다음과 같습니다: {findings_str}. \n환자는 이 진찰 과정에서 느낀 불편함이나, 의사가 소견에 대해 질문할 때 이에 맞춰 자연스럽게 반응하세요.\n"

    system_instruction += """
    규칙:
    1. 환자로서 자연스럽게 대답하세요.
    2. 전문적인 의학 용어는 피하고, 일반 환자가 쓰는 언어로 짧고 명확하게 1~2문장으로 답하세요.
    3. JSON 형태로만 응답하세요.
    """
    
    # 2. Add tutor guide instruction if PRACTICE mode
    if mode == "PRACTICE":
        system_instruction += "\n4. 현재 PRACTICE 모드입니다. 의사(학생)의 이전 질문을 분석하여, 놓친 핵심 질문이나 개선점(Tutor Guide)을 'tutor_guide' 필드에 1문장으로 적어주세요. 잘 하고 있다면 칭찬해주세요."
    
    # 3. Format Conversation History
    contents = []
    for msg in conversation_history:
        role = "model" if msg["role"] == "assistant" else "user"
        contents.append(
            {"role": role, "parts": [{"text": msg["content"]}]}
        )
    
    # If no history, wait, history includes the current question from the doctor.
    
    # 4. Call Gemini API using Structured Outputs
    response_schema = {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "환자의 대답"},
            "tutor_guide": {"type": "string", "description": "학생을 위한 튜터 가이드 (실습 모드일 때만 포함, 능동 모드일 땐 생략 가능)"}
        },
        "required": ["text"]
    }
    
    try:
        async def _call():
            return await client.aio.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config={
                    "system_instruction": system_instruction,
                    "response_mime_type": "application/json",
                    "response_schema": response_schema,
                    "temperature": 0.7,
                }
            )
        response = await _call_with_retry(_call)
        
        # Parse response text (which is JSON)
        import json
        result = json.loads(response.text)
        
        return {
            "text": result.get("text", "아... 잘 모르겠습니다."),
            "tutor_guide": result.get("tutor_guide", None) if mode == "PRACTICE" else None
        }
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return {
            "text": "죄송합니다, 잠시 말이 안 나오네요. 다시 질문해 주시겠어요?",
            "tutor_guide": None
        }

async def generate_new_scenario(disease: str, symptom: str) -> dict:
    """
    Generates a new CPX scenario based on the provided disease and symptom.
    Uses Gemini Structured Outputs to return a strictly formatted JSON.
    """
    logger.info(f"Generating new scenario for disease: {disease}, symptom: {symptom}")
    
    system_instruction = f"""
    당신은 의과대학 실기시험(CPX) 시나리오 출제 위원입니다.
    사용자가 요청한 질환명({disease})과 주증상({symptom})을 바탕으로, 
    CPX 시험에 적합한 표준환자 시나리오를 작성해주세요.
    
    반드시 제공된 JSON 스키마에 맞추어 응답해야 합니다.
    Rubrics는 병력청취, 진단계획, 의사소통, 설명교육 카테고리를 포함하여 총 5개 작성하세요.
    """
    
    response_schema = {
        "type": "object",
        "properties": {
            "id": {"type": "string", "description": "영문 소문자와 하이픈으로 구성된 고유 ID (예: scen-acute-pancreatitis)"},
            "subject": {"type": "string", "description": "진료과 (예: 소화기내과)"},
            "difficulty": {"type": "string", "description": "상, 중, 하 중 하나"},
            "patientName": {"type": "string", "description": "가상의 환자 이름"},
            "age": {"type": "integer", "description": "환자 나이"},
            "gender": {"type": "string", "description": "남 또는 여"},
            "tag": {"type": "string", "description": "질환명 (예: 급성 췌장염 의증)"},
            "cc": {"type": "string", "description": "주증상 (환자의 1인칭 발화 형태)"},
            "vs": {"type": "string", "description": "바이탈 사인 (BT, BP, HR, RR 포함)"},
            "notes": {"type": "string", "description": "진료 메모 (의사가 유의해야 할 점)"},
            "goals": {
                "type": "array",
                "items": {"type": "string"},
                "description": "5가지 학습 목표"
            },
            "rubrics": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "r1, r2, r3, r4, r5"},
                        "category": {"type": "string", "description": "병력청취, 진단계획, 의사소통, 설명교육 중 하나"},
                        "item": {"type": "string", "description": "채점 기준 내용"},
                        "weight": {"type": "integer", "description": "각 20점으로 고정"},
                        "checked": {"type": "boolean", "description": "false로 고정"},
                        "keyword": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "채점을 위한 주요 키워드 배열"
                        }
                    },
                    "required": ["id", "category", "item", "weight", "checked", "keyword"]
                },
                "description": "5개의 루브릭"
            },
            "script": {
                "type": "object",
                "properties": {
                    "initial": {"type": "string", "description": "환자의 최초 불만 호소 문장"},
                    "fallback": {"type": "string", "description": "의도와 다른 질문을 받았을 때 대답 (예: 배가 너무 아파서 정신이 없네요)"},
                    "dialogs": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "keywords": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "response": {"type": "string"}
                            },
                            "required": ["keywords", "response"]
                        },
                        "description": "예상되는 질문 키워드와 그에 따른 환자의 구체적 응답 리스트"
                    }
                },
                "required": ["initial", "fallback", "dialogs"]
            }
        },
        "required": ["id", "subject", "difficulty", "patientName", "age", "gender", "tag", "cc", "vs", "notes", "goals", "rubrics", "script"]
    }
    
    try:
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[{"role": "user", "parts": [{"text": f"질환명: {disease}, 주증상: {symptom}"}]}],
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json",
                "response_schema": response_schema,
                "temperature": 0.7,
            }
        )
        
        import json
        result = json.loads(response.text)
        
        # Add basic layout properties
        result["attempts"] = 0
        result["bestScore"] = 0
        result["distribution"] = [0, 0, 0, 0, 0]
        result["avatar"] = "🧑"
        
        return result
    except Exception as e:
        logger.error(f"Generate Scenario Error: {e}")
        raise e

