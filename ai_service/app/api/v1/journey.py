"""
Journey API - Roadmap-focused chat endpoint

Handles Journey mode conversations that can update roadmap and profile.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from app.agents.journey_agent import get_journey_agent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/journey", tags=["journey"])


class JourneyChatRequest(BaseModel):
    """Request for journey chat"""
    user_id: str
    message: str
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class JourneyChatResponse(BaseModel):
    """Response from journey chat"""
    response: str
    actions: list = []
    roadmap_updates: Optional[Dict[str, Any]] = None
    profile_updates: Optional[Dict[str, Any]] = None
    session_id: str


@router.post("/chat", response_model=JourneyChatResponse)
async def journey_chat(request: JourneyChatRequest):
    """
    Process a Journey mode chat message.
    
    This endpoint handles roadmap-focused conversations and can:
    - Answer questions about the user's roadmap
    - Update progress when user reports completions
    - Modify roadmap based on user requests
    - Extract profile updates from conversation
    """
    try:
        agent = get_journey_agent()
        
        session_id = request.session_id or f"journey-{request.user_id}-{int(__import__('time').time())}"
        
        result = await agent.process_message(
            user_id=request.user_id,
            message=request.message,
            session_id=session_id,
            context_override=request.context,
        )
        
        return JourneyChatResponse(
            response=result.response,
            actions=[a.dict() for a in result.actions],
            roadmap_updates=result.roadmap_updates,
            profile_updates=result.profile_updates,
            session_id=result.session_id,
        )
        
    except Exception as e:
        logger.error(f"Journey chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/context/{user_id}")
async def get_journey_context(user_id: str):
    """Get the current journey context for a user"""
    try:
        agent = get_journey_agent()
        context = await agent._get_user_context(user_id)
        return context
    except Exception as e:
        logger.error(f"Failed to get journey context: {e}")
        raise HTTPException(status_code=500, detail=str(e))
