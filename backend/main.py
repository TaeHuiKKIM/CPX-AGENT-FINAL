import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
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

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
