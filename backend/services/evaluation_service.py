import logging
from core.exceptions import CPXException
from services.supabase_db import get_supabase_client
# from openai import AsyncOpenAI
# from core.config import settings

logger = logging.getLogger(__name__)
# client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def evaluate_session(session_id: str):
    """
    Evaluates a completed CPX session based on its transcripts and rubric.
    Generates explainable feedback and updates the feedback_results table.
    """
    logger.info(f"Starting evaluation for session: {session_id}")
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
    
    # [TO-DO] 4. Call LLM for Evaluation
    # Prompt the LLM to act as a medical professor evaluating the transcript against the rubric
    # Expecting a structured JSON output (score_history_taking, strengths, explainable_feedback, etc.)
    
    # Mocking the LLM Response for now
    mock_llm_result = {
        "score_history_taking": 85.0,
        "score_communication": 90.0,
        "score_education": 80.0,
        "total_score": 85.0,
        "strengths": ["환자의 감정에 공감하는 태도가 좋았습니다."],
        "weaknesses": ["가족력을 묻지 않았습니다."],
        "clinical_reasoning_flow": [
            {"question": "어디가 아프신가요?", "category": "O", "status": "asked"},
            {"question": "비슷한 증상이 예전에도 있었나요?", "category": "P", "status": "missed"}
        ],
        "explainable_feedback": [
            {
                "topic": "가족력 확인 누락",
                "reason": "발열 환자의 경우 유전적 요인이나 가족 내 감염병 전파 가능성을 배제하기 위해 가족력 질문이 필수적입니다."
            }
        ]
    }
    
    # 5. Insert / Update Feedback Results in Supabase
    feedback_data = {
        "session_id": session_id,
        "rubric_id": rubric_data["rubric_id"] if rubric_data else None,
        **mock_llm_result
    }
    
    # Check if exists to update, else insert
    existing = supabase.table("feedback_results").select("result_id").eq("session_id", session_id).execute()
    if existing.data:
        res = supabase.table("feedback_results").update(feedback_data).eq("session_id", session_id).execute()
    else:
        res = supabase.table("feedback_results").insert(feedback_data).execute()
        
    logger.info(f"Evaluation completed for session: {session_id}")
    return res.data[0] if res.data else None
