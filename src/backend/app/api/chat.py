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
            defect_severity=request.defect_severity
        )
        return ChatMessageResponse(response=response)
    except Exception as e:
        logger.error(f"Chat message failed: {e}")
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
