"""
Chat API endpoints for AI assistant
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

from app.services.chat_service import ChatService
from app.api.auth import get_current_user
from app.models.user import User


router = APIRouter()
logger = logging.getLogger(__name__)


class ChatMessageRequest(BaseModel):
    """Request model for chat messages."""
    message: str
    sensor_context: Optional[str] = ""
    ml_status_context: Optional[str] = ""
    defect_id: Optional[str] = None
    defect_type: Optional[str] = None
    defect_location: Optional[str] = None
    defect_severity: Optional[str] = None
    control_system_sign: Optional[str] = None
    drone_sign: Optional[str] = None


class InitialDefectMessageRequest(BaseModel):
    """Request model for initial defect message."""
    defect_type: str
    location: str
    severity: str
    control_system_sign: Optional[str] = "Unknown"
    drone_sign: Optional[str] = "Unknown"


class ChatMessageResponse(BaseModel):
    """Response model for chat messages."""
    response: str


# Initialize chat service
chat_service = ChatService(logger)


@router.post("/send", response_model=ChatMessageResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user)
) -> ChatMessageResponse:
    """
    Send chat message to AI assistant and get response.
    """
    try:
        response = chat_service.send_message(
            message=request.message,
            sensor_context=request.sensor_context or "",
            ml_status_context=request.ml_status_context or "",
            defect_id=request.defect_id,
            defect_type=request.defect_type,
            defect_location=request.defect_location,
            defect_severity=request.defect_severity,
            control_system_sign=request.control_system_sign,
            drone_sign=request.drone_sign
        )
        return ChatMessageResponse(response=response)
    except Exception as e:
        logger.error(f"Chat message failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")


@router.post("/initial-defect-message", response_model=ChatMessageResponse)
async def get_initial_defect_message(
    request: InitialDefectMessageRequest,
    current_user: User = Depends(get_current_user)
) -> ChatMessageResponse:
    """
    Get initial detailed message for a defect when chat is opened.
    """
    try:
        response = chat_service.get_initial_defect_message(
            defect_type=request.defect_type,
            location=request.location,
            severity=request.severity,
            control_system_sign=request.control_system_sign or "Unknown",
            drone_sign=request.drone_sign or "Unknown"
        )
        return ChatMessageResponse(response=response)
    except Exception as e:
        logger.error(f"Initial defect message failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")


@router.get("/health")
async def chat_health_check():
    """
    Check if chat service is available.
    """
    try:
        # Simple health check - verify API key is configured
        from app.core.config import settings
        api_key_configured = bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip())
        return {
            "status": "healthy" if api_key_configured else "unhealthy",
            "api_key_configured": api_key_configured,
            "model": settings.OPENAI_MODEL
        }
    except Exception as e:
        logger.error(f"Chat health check failed: {e}")
        return {"status": "error", "error": str(e)}
