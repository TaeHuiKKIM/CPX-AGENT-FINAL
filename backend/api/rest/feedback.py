from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from services.evaluation_service import evaluate_session, evaluate_transcript
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class EvaluateRequest(BaseModel):
    pe_log: Dict[str, Any] = None

class EvaluateResponse(BaseModel):
    status: str
    message: str

class AnonymousEvaluateRequest(BaseModel):
    scenario_id: str
    transcripts: List[Dict[str, Any]]
    rubric_data: Dict[str, Any] = None
    pe_log: Dict[str, Any] = None

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
async def trigger_evaluation_anonymous(request: AnonymousEvaluateRequest):
    """
    Directly evaluates a transcript without DB dependency.
    Used for local test-sessions where users don't log in.
    Returns the evaluation JSON synchronously so the frontend can display it immediately.
    """
    logger.info(f"Received anonymous evaluation request for scenario: {request.scenario_id}")
    
    if not request.transcripts:
        raise HTTPException(status_code=400, detail="Transcripts are required")
        
    eval_result = await evaluate_transcript(request.transcripts, request.scenario_id, request.rubric_data, request.pe_log)
    return eval_result
