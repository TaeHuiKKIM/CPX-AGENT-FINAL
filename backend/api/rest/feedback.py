from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from services.evaluation_service import evaluate_session
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class EvaluateResponse(BaseModel):
    status: str
    message: str

@router.post("/feedback/{session_id}/evaluate", response_model=EvaluateResponse)
async def trigger_evaluation(session_id: str, background_tasks: BackgroundTasks):
    """
    Triggers the LLM evaluation for a completed session.
    Since LLM calls can take 10-30 seconds, this is processed in the background.
    The frontend should listen to Supabase Realtime for the 'feedback_results' table insert.
    """
    logger.info(f"Received evaluation request for session: {session_id}")
    
    # Run the evaluation as a background task to prevent blocking the HTTP response
    background_tasks.add_task(evaluate_session, session_id)
    
    return EvaluateResponse(
        status="processing_started",
        message="Evaluation is running in the background. Please subscribe to Supabase Realtime for results."
    )
