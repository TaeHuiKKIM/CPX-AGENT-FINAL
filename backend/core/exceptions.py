from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class CPXException(Exception):
    """Base custom exception for SPAI-CPX-AGENT"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

def add_exception_handlers(app: FastAPI):
    @app.exception_handler(CPXException)
    async def cpx_exception_handler(request: Request, exc: CPXException):
        logger.error(f"CPX Error: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": True, "message": exc.message},
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": True, "message": "An unexpected server error occurred."},
        )
