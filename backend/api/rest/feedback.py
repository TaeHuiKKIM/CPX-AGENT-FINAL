from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.evaluation_service import evaluate_session, evaluate_transcript
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class EvaluateRequest(BaseModel):
    session_id: str
    pe_log: Optional[Dict[str, Any]] = None

class EvaluateResponse(BaseModel):
    status: str
    message: str

class AnonymousEvaluateRequest(BaseModel):
    scenario_id: str
    transcripts: List[Dict[str, Any]]
    rubric_data: Optional[Dict[str, Any]] = None
    pe_log: Optional[Dict[str, Any]] = None

@router.post("/feedback/{session_id}/evaluate", response_model=EvaluateResponse)
async def trigger_evaluation(session_id: str, background_tasks: BackgroundTasks, request: EvaluateRequest = None):
    """
    Triggers the LLM evaluation for a completed session (saved in DB).
    Since LLM calls can take 10-30 seconds, this is processed in the background.
    """
    logger.info(f"Received evaluation request for DB session: {session_id}")
    pe_log = request.pe_log if request else None
    background_tasks.add_task(evaluate_session, session_id, pe_log)
    return EvaluateResponse(
        status="processing_started",
        message="Evaluation is running in the background."
    )

@router.post("/feedback/evaluate_anonymous")
async def evaluate_anonymous_session(request: AnonymousEvaluateRequest):
    logger.info(f"Received anonymous evaluation request for scenario: {request.scenario_id}")
    
    # 빈 transcripts라도 AI가 "대화 기록 없음"으로 0점 처리하도록 허용
    try:
        eval_result = await evaluate_transcript(request.transcripts, request.scenario_id, request.rubric_data, request.pe_log)
        return eval_result
    except Exception as e:
        logger.error(f"Anonymous Evaluation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
