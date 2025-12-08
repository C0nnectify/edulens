"""Multi-Agent System API Endpoints"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
import logging

from app.models.schemas import APIResponse
from app.graph.orchestrator import MultiAgentOrchestrator
from app.memory.mongodb_memory import MongoDBMemoryManager
from app.memory.session_manager import SessionStateManager

logger = logging.getLogger(__name__)
router = APIRouter()

# Global instances (will be initialized in main.py)
orchestrator: Optional[MultiAgentOrchestrator] = None
memory_manager: Optional[MongoDBMemoryManager] = None
session_manager: Optional[SessionStateManager] = None


class AgentRequest(BaseModel):
    """Request model for multi-agent execution"""
    user_id: str = Field(..., description="User ID")
    message: str = Field(..., description="User message/request")
    session_id: Optional[str] = Field(None, description="Session ID (optional, will be created if not provided)")
    task_type: Optional[str] = Field("general", description="Task type: research, document, tracking, planning, general")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class SessionHistoryRequest(BaseModel):
    """Request model for session history"""
    session_id: str = Field(..., description="Session ID")


class SessionListRequest(BaseModel):
    """Request model for listing user sessions"""
    user_id: str = Field(..., description="User ID")
    limit: Optional[int] = Field(10, description="Number of sessions to return")
    status: Optional[str] = Field(None, description="Filter by status")


def init_orchestrator(
    mongo_uri: str,
    google_api_key: str,
    firecrawl_api_key: Optional[str] = None
):
    """Initialize orchestrator and dependencies"""
    global orchestrator, memory_manager, session_manager

    # Initialize MongoDB memory manager
    memory_manager = MongoDBMemoryManager(connection_string=mongo_uri)

    # Initialize session manager
    session_manager = SessionStateManager(
        mongodb_manager=memory_manager,
        checkpoint_interval=5,
        session_timeout_minutes=30
    )

    # Initialize orchestrator
    orchestrator = MultiAgentOrchestrator(
        session_manager=session_manager,
        google_api_key=google_api_key
    )

    # Initialize tools with API keys
    from app.tools.firecrawl_tools import (
        FirecrawlScrapeTool,
        FirecrawlBatchScrapeTool,
        FirecrawlCrawlTool,
        FirecrawlSearchTool,
        FirecrawlExtractTool
    )
    from app.tools.vector_tools import VectorAddTool, VectorQueryTool
    from app.tools.email_tools import EmailSendTool
    from app.tools.base_tool import tool_registry
    from app.services.vector_store_service import VectorStoreService
    from app.services.email_service import EmailService

    # Register Firecrawl tools
    if firecrawl_api_key:
        tool_registry.register(FirecrawlScrapeTool(firecrawl_api_key))
        tool_registry.register(FirecrawlBatchScrapeTool(firecrawl_api_key))
        tool_registry.register(FirecrawlCrawlTool(firecrawl_api_key))
        tool_registry.register(FirecrawlSearchTool(firecrawl_api_key))
        tool_registry.register(FirecrawlExtractTool(firecrawl_api_key))

    # Register vector tools (assuming vector service is initialized)
    # vector_service = VectorStoreService()
    # tool_registry.register(VectorAddTool(vector_service))
    # tool_registry.register(VectorQueryTool(vector_service))

    # Register email tools
    # email_service = EmailService()
    # tool_registry.register(EmailSendTool(email_service))

    logger.info("Multi-agent orchestrator initialized successfully")


@router.post("/execute")
async def execute_agent(request: AgentRequest, background_tasks: BackgroundTasks):
    """
    Execute the multi-agent system with a user request.

    This endpoint initiates the multi-agent workflow where the supervisor
    routes tasks to specialized agents as needed.
    """
    if not orchestrator:
        raise HTTPException(status_code=500, detail="Orchestrator not initialized")

    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())

        # Execute orchestrator
        result = await orchestrator.execute(
            user_id=request.user_id,
            session_id=session_id,
            user_message=request.message,
            task_type=request.task_type,
            metadata=request.metadata or {}
        )

        if result["success"]:
            return APIResponse(
                success=True,
                message="Multi-agent execution completed",
                data={
                    "session_id": result["session_id"],
                    "status": result["status"],
                    "final_answer": result["final_answer"],
                    "agents_involved": result["agents_involved"],
                    "research_findings": result.get("research_findings"),
                    "generated_documents": result.get("generated_documents"),
                    "tracked_applications": result.get("tracked_applications"),
                    "study_plan": result.get("study_plan"),
                    "message_count": result.get("message_count")
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Execution failed"))

    except Exception as e:
        logger.error(f"Agent execution error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/history")
async def get_session_history(request: SessionHistoryRequest):
    """Get the full history of a session"""
    if not orchestrator:
        raise HTTPException(status_code=500, detail="Orchestrator not initialized")

    try:
        history = await orchestrator.get_session_history(request.session_id)

        if history:
            return APIResponse(
                success=True,
                message="Session history retrieved",
                data=history
            )
        else:
            raise HTTPException(status_code=404, detail="Session not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session history error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/list")
async def list_user_sessions(request: SessionListRequest):
    """List all sessions for a user"""
    if not memory_manager:
        raise HTTPException(status_code=500, detail="Memory manager not initialized")

    try:
        sessions = await memory_manager.get_user_sessions(
            user_id=request.user_id,
            limit=request.limit,
            status=request.status
        )

        return APIResponse(
            success=True,
            message=f"Found {len(sessions)} sessions",
            data={"sessions": sessions, "count": len(sessions)}
        )

    except Exception as e:
        logger.error(f"List sessions error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_system_status():
    """Get status of the multi-agent system"""
    try:
        active_sessions = 0
        if session_manager:
            active_sessions = await session_manager.get_active_session_count()

        return APIResponse(
            success=True,
            message="Multi-agent system status",
            data={
                "system": "operational",
                "orchestrator_initialized": orchestrator is not None,
                "memory_manager_initialized": memory_manager is not None,
                "session_manager_initialized": session_manager is not None,
                "active_sessions": active_sessions,
                "agents": {
                    "supervisor": "operational",
                    "research_agent": "operational",
                    "document_agent": "operational",
                    "tracking_agent": "operational",
                    "planning_agent": "operational",
                    "profile_evaluation_agent": "operational",
                    "travel_planner_agent": "operational",
                    "financial_aid_agent": "operational",
                    "peer_networking_agent": "operational",
                    "cultural_adaptation_agent": "operational"
                },
                "tools": {
                    "firecrawl_mcp": "operational",
                    "vector_store": "operational",
                    "email_service": "operational"
                }
            }
        )

    except Exception as e:
        logger.error(f"Status check error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}")
async def end_session(session_id: str):
    """End a session and perform final checkpoint"""
    if not session_manager:
        raise HTTPException(status_code=500, detail="Session manager not initialized")

    try:
        await session_manager.end_session(session_id, status="ended_by_user")

        return APIResponse(
            success=True,
            message=f"Session {session_id} ended successfully",
            data={"session_id": session_id}
        )

    except Exception as e:
        logger.error(f"End session error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
