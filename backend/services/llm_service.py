import logging
from google import genai
from core.config import settings

logger = logging.getLogger(__name__)

# Initialize Gemini Client
# The SDK automatically looks for GEMINI_API_KEY in the environment if not passed explicitly,
# but passing it directly is safer.
client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def generate_ai_reply(scenario_info: dict, conversation_history: list, mode: str) -> dict:
    """
    Generates a reply mimicking the standardized patient based on the prompt using Gemini 2.5 Flash.
    Returns a dict with 'text' and optional 'tutor_guide' (if mode is LEARNING).
    """
    logger.info(f"Generating AI reply for mode: {mode} using {settings.GEMINI_MODEL}")
    
    # 1. Construct System Prompt
    patient_info = scenario_info.get("patient_info", {})
    system_instruction = f"""
    당신은 의과대학 실기시험(CPX)의 표준환자(Standardized Patient)입니다.
    현재 상황:
    - 환자 이름: {patient_info.get('name', '김환자')}
    - 나이/성별: {patient_info.get('age', 45)}세 / {patient_info.get('gender', 'M')}
    - 주증상: {patient_info.get('initial_complaint', '어디가 불편해서 오셨나요?')}
    - 질환 스크립트: {patient_info.get('script', '')}
    
    규칙:
    1. 환자로서 자연스럽게 대답하세요.
    2. 전문적인 의학 용어는 피하고, 일반 환자가 쓰는 언어로 짧고 명확하게 1~2문장으로 답하세요.
    3. JSON 형태로만 응답하세요.
    """
    
    # 2. Add tutor guide instruction if LEARNING mode
    if mode == "LEARNING":
        system_instruction += "\n4. 현재 LEARNING 모드입니다. 의사(학생)의 이전 질문을 분석하여, 놓친 핵심 질문이나 개선점(Tutor Guide)을 'tutor_guide' 필드에 1문장으로 적어주세요. 잘 하고 있다면 칭찬해주세요."
    
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
            "tutor_guide": {"type": "string", "description": "학생을 위한 튜터 가이드 (학습 모드일 때만 포함, 시험 모드일 땐 생략 가능)"}
        },
        "required": ["text"]
    }
    
    try:
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json",
                "response_schema": response_schema,
                "temperature": 0.7,
            }
        )
        
        # Parse response text (which is JSON)
        import json
        result = json.loads(response.text)
        
        return {
            "text": result.get("text", "아... 잘 모르겠습니다."),
            "tutor_guide": result.get("tutor_guide", None) if mode == "LEARNING" else None
        }
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return {
            "text": "죄송합니다, 잠시 말이 안 나오네요. 다시 질문해 주시겠어요?",
            "tutor_guide": None
        }
