import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.supabase_db import log_transcript, get_scenario_prompt
from services.llm_service import generate_ai_reply

router = APIRouter()
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_json(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

manager = ConnectionManager()

@router.websocket("/sessions/{session_id}/stream")
async def websocket_endpoint(websocket: WebSocket, session_id: str, mode: str = "EXAM"):
    """
    Real-time bidirectional WebSocket for CPX Sessions.
    Handles STT results from client, calls LLM, sends TTS binary/text back.
    """
    await manager.connect(websocket)
    logger.info(f"WebSocket connected for session: {session_id}, mode: {mode}")
    
    # Placeholder: Fetch scenario context from Supabase
    # scenario_info = await get_scenario_prompt(session_id)
    scenario_info = {}
    conversation_history = []
    
    try:
        while True:
            # Receive STT text from client (In a real app, this might be binary audio chunks)
            data = await websocket.receive_text()
            payload = json.loads(data)
            user_text = payload.get("text", "")
            
            # 1. Log User's Transcript
            conversation_history.append({"role": "user", "content": user_text})
            await log_transcript(session_id=session_id, speaker="USER", content=user_text)
            
            # 2. Get AI Response (LLM)
            ai_response = await generate_ai_reply(scenario_info, conversation_history, mode)
            reply_text = ai_response["text"]
            tutor_guide = ai_response.get("tutor_guide")
            
            # 3. Log AI's Transcript
            conversation_history.append({"role": "assistant", "content": reply_text})
            await log_transcript(session_id=session_id, speaker="AI", content=reply_text)
            
            # 4. Send AI Reply back to frontend
            await manager.send_json({
                "event": "ai_reply",
                "text": reply_text,
                "tutor_guide": tutor_guide
            }, websocket)
            
            # [TO-DO] Send binary audio (TTS) chunks here

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
