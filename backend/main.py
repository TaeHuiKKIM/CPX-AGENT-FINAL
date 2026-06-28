import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.websockets.session import router as websocket_router
from api.rest.feedback import router as feedback_router
from api.rest.scenario import router as scenario_router
from core.exceptions import add_exception_handlers

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI application initialization
app = FastAPI(
    title="SPAI-CPX-AGENT AI Engine",
    description="FastAPI backend for real-time CPX AI voice streaming and evaluation.",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
add_exception_handlers(app)

# Include Routers
app.include_router(websocket_router, prefix="/api/v1")
app.include_router(feedback_router, prefix="/api/v1")
app.include_router(scenario_router, prefix="/api/v1/scenario")

@app.get("/health")
async def health_check():
    """Health check endpoint to verify the server is running."""
    return {"status": "ok", "message": "SPAI-CPX-AGENT Engine is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
