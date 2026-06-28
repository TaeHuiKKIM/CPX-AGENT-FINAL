import logging
import json
from core.exceptions import CPXException
from services.supabase_db import get_supabase_client
from services.llm_service import client
from core.config import settings

logger = logging.getLogger(__name__)

async def evaluate_transcript(transcripts: list, scenario_id: str, rubric_data: dict, pe_log: dict = None) -> dict:
    """
    Core function to evaluate a transcript against a rubric using Gemini 2.5 Flash.
    Returns the structured evaluation JSON.
    """
    logger.info(f"Generating AI Evaluation for scenario: {scenario_id}")
    
    # 1. Format transcripts into a single string for the prompt
    conversation_text = ""
    for msg in transcripts:
        # Support both {"speaker": "doctor", "text": "..."} and {"role": "user", "content": "..."}
        speaker = msg.get("speaker", msg.get("role", "unknown"))
        speaker_role = "의사(학생)" if speaker in ["doctor", "user"] else "환자(AI)"
        content = msg.get("text", msg.get("content", ""))
        conversation_text += f"{speaker_role}: {content}\n"
        
    rubric_text = json.dumps(rubric_data, ensure_ascii=False) if rubric_data else "루브릭 정보 없음"
    
    system_instruction = f"""
    당신은 의과대학 실기시험(CPX)의 전문 평가 교수입니다.
    학생(의사)과 표준환자(AI) 간의 대화 기록(Transcript)을 바탕으로 학생의 진료 역량을 평가하십시오.
    
    평가는 다음 글로벌 표준지표(PMR) 및 루브릭을 기준으로 합니다:
    1. 병력 기술 (History Taking): 증상(Onset, Location, Duration, Character, Aggravating, Relieving, Severity) 및 동반증상 탐색.
    2. 환자 안심 및 이해 (Communication): 환자의 통증과 불안에 대한 적절한 공감.
    3. 환자 정보 (Patient Info): 과거력, 가족력, 사회력 수집 완성도.
    4. 감별 진단 (DDx) & 진단 계획.
    5. 환자 교육 (Patient Education): 일반인 수준의 설명.
    
    [시나리오 ID]
    {scenario_id}
    
    [평가 루브릭 (참고용 JSON)]
    {rubric_text}
    """
    
    prompt = f"""
    아래 대화 기록을 분석하여 지정된 JSON 스키마에 맞춰 평가 결과를 반환하십시오.
    채점은 매우 엄격하고 객관적으로 진행해야 하며, 학생이 질문하지 않은 필수 정보는 감점 요인이 됩니다.
    
    [대화 기록]
    {conversation_text}
    """
    
    response_schema = {
        "type": "object",
        "properties": {
            "score_history_taking": {"type": "number", "description": "병력 청취 점수 (0~100)"},
            "score_communication": {"type": "number", "description": "의사소통 및 공감 점수 (0~100)"},
            "score_education": {"type": "number", "description": "환자 교육 및 진단 계획 점수 (0~100)"},
            "total_score": {"type": "number", "description": "종합 점수 (0~100, 위 세 점수의 평균 가중치 반영)"},
            "strengths": {
                "type": "array",
                "items": {"type": "string"},
                "description": "학생의 강점 (긍정적인 피드백) 2~3가지"
            },
            "weaknesses": {
                "type": "array",
                "items": {"type": "string"},
                "description": "학생의 약점 (개선점) 2~3가지"
            },
            "clinical_reasoning_flow": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string", "description": "루브릭 또는 문진상 확인했어야 할 핵심 질문 요약"},
                        "category": {"type": "string", "description": "병력(O,L,D,C,A,R,S), 과거력, 가족력, 공감 등 카테고리"},
                        "status": {"type": "string", "description": "'asked' (질문함) 또는 'missed' (놓침)"}
                    },
                    "required": ["question", "category", "status"]
                },
                "description": "임상 추론 흐름 검증 (주요 질문들의 달성 여부 분석)"
            },
            "explainable_feedback": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "topic": {"type": "string", "description": "피드백 주제 (예: 가족력 확인 누락, 공감 표현 우수)"},
                        "reason": {"type": "string", "description": "해당 질문을 해야 하는 의학적 이유 또는 칭찬 사유"}
                    },
                    "required": ["topic", "reason"]
                },
                "description": "상세한 교정 피드백"
            }
        },
        "required": ["score_history_taking", "score_communication", "score_education", "total_score", "strengths", "weaknesses", "clinical_reasoning_flow", "explainable_feedback"]
    }
    
    try:
        response = await client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[{"role": "user", "parts": [{"text": prompt}]}],
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json",
                "response_schema": response_schema,
                "temperature": 0.2,
            }
        )
        
        result_json = json.loads(response.text)
        
        # PE 점수 병합
        if pe_log:
            pe_score, pe_feedback = calculate_pe_score(pe_log)
            result_json["score_physical_exam"] = pe_score
            result_json["physical_exam_logs"] = pe_log
            
            # 8개 루브릭 기반으로 총점에 20% 정도 반영하거나 별도 표시 (여기서는 점수 필드에만 추가)
            # 기존 총점을 AI 채점 3개와 PE 채점 1개로 재계산
            old_total = result_json.get("total_score", 0)
            result_json["total_score"] = round((result_json.get("score_history_taking", 0) + result_json.get("score_communication", 0) + result_json.get("score_education", 0) + pe_score) / 4, 1)
            
            # 피드백 추가
            if pe_feedback:
                if "weaknesses" in result_json:
                    result_json["weaknesses"].extend(pe_feedback)
                else:
                    result_json["weaknesses"] = pe_feedback
                    
        return result_json
    except Exception as e:
        logger.error(f"Gemini Evaluation Error: {e}")
        return {
            "score_history_taking": 0.0,
            "score_communication": 0.0,
            "score_education": 0.0,
            "total_score": 0.0,
            "strengths": ["채점 중 오류가 발생했습니다."],
            "weaknesses": [str(e)],
            "clinical_reasoning_flow": [],
            "explainable_feedback": []
        }

def calculate_pe_score(pe_log: dict):
    # 8개 신체진찰 채점 축
    score = 100
    feedbacks = []
    
    if not pe_log.get("introDone"):
        score -= 10
        feedbacks.append("[신체진찰] 진입 선언(개방형 환자 확인)이 누락되었습니다.")
        
    hyg = pe_log.get("hygEvents", [])
    if len(hyg) == 0:
        score -= 20
        feedbacks.append("[신체진찰] 손소독을 한 번도 수행하지 않았습니다.")
    elif len(hyg) < 2:
        score -= 10
        feedbacks.append("[신체진찰] 손소독 횟수가 부족합니다. (권장: 접촉 전/후)")
        
    if pe_log.get("usedTime", 0) > 40: # 과도한 시간 차감
        score -= 10
        feedbacks.append("[신체진찰] 진찰에 불필요한 과도한 시간을 소모했습니다.")
        
    return max(0, score), feedbacks

async def evaluate_session(session_id: str, pe_log: dict = None):
    """
    Evaluates a DB-saved CPX session based on its transcripts and rubric.
    Generates explainable feedback and updates the feedback_results table.
    """
    logger.info(f"Starting DB evaluation for session: {session_id}")
    supabase = get_supabase_client()
    
    # 1. Fetch Transcripts
    transcripts_resp = supabase.table("transcripts") \
        .select("*") \
        .eq("session_id", session_id) \
        .order("timestamp", desc=False) \
        .execute()
        
    if not transcripts_resp.data:
        raise CPXException("No transcripts found for this session.", status_code=404)
        
    # 2. Fetch Session & Scenario context
    session_resp = supabase.table("sessions").select("scenario_id").eq("session_id", session_id).execute()
    if not session_resp.data:
        raise CPXException("Session not found.", status_code=404)
        
    scenario_id = session_resp.data[0]["scenario_id"]
    
    # 3. Fetch Rubric
    rubric_resp = supabase.table("rubrics").select("*").eq("scenario_id", scenario_id).execute()
    rubric_data = rubric_resp.data[0] if rubric_resp.data else None
    
    # 4. Call LLM for Evaluation
    eval_result = await evaluate_transcript(transcripts_resp.data, scenario_id, rubric_data, pe_log)
    
    # 5. Insert / Update Feedback Results in Supabase
    feedback_data = {
        "session_id": session_id,
        "rubric_id": rubric_data["rubric_id"] if rubric_data else None,
        "score_history_taking": eval_result.get("score_history_taking"),
        "score_communication": eval_result.get("score_communication"),
        "score_education": eval_result.get("score_education"),
        "score_physical_exam": eval_result.get("score_physical_exam"),
        "physical_exam_logs": eval_result.get("physical_exam_logs"),
        "total_score": eval_result.get("total_score"),
        "strengths": eval_result.get("strengths"),
        "weaknesses": eval_result.get("weaknesses"),
        "clinical_reasoning_flow": eval_result.get("clinical_reasoning_flow"),
        "explainable_feedback": eval_result.get("explainable_feedback"),
    }
    
    existing = supabase.table("feedback_results").select("result_id").eq("session_id", session_id).execute()
    if existing.data:
        res = supabase.table("feedback_results").update(feedback_data).eq("session_id", session_id).execute()
    else:
        res = supabase.table("feedback_results").insert(feedback_data).execute()
        
    logger.info(f"Evaluation completed for DB session: {session_id}")
    return res.data[0] if res.data else None
