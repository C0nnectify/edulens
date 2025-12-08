"""AI Agents Management API Endpoints"""
from fastapi import APIRouter, HTTPException
import logging
from app.models.schemas import APIResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/status")
async def get_agents_status():
    """Get status of all AI agents"""
    return APIResponse(
        success=True,
        message="AI agents status",
        data={
            "agents": {
                "document_agent": {"status": "operational", "capabilities": ["resume", "cv", "sop"]},
                "tracker_agent": {"status": "operational", "capabilities": ["university_tracking", "notifications"]},
                "research_agent": {"status": "operational", "capabilities": ["deep_research", "professor_search", "travel_planning"]},
            },
            "services": {
                "vector_store": "operational",
                "embeddings": "operational",
                "email": "operational",
                "celery": "operational"
            }
        }
    )

@router.get("/capabilities")
async def get_capabilities():
    """Get list of all agent capabilities"""
    return APIResponse(
        success=True,
        message="Agent capabilities",
        data={
            "vector_operations": ["upload", "query", "delete", "search"],
            "document_types": ["resume", "cv", "sop", "general"],
            "research_types": ["university", "program", "scholarship", "professor", "travel", "cost_analysis"],
            "notification_channels": ["email", "scheduled_tasks"],
            "automation": ["portal_tracking", "data_extraction", "email_summaries"]
        }
    )
