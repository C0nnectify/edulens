from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
import asyncio

from ..tools.document_builder.graph import get_document_builder_orchestrator
from ..api.dependencies import get_current_user
from langchain_core.messages import HumanMessage, AIMessage

logger = logging.getLogger(__name__)

# Chat orchestrator with Document Builder integration
router = APIRouter(prefix="/chat-agent", tags=["chat-agent"])


class SourceItem(BaseModel):
    id: str
    title: str
    url: Optional[str] = None
    snippet: Optional[str] = None


class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    feature: Optional[str] = "general"  # document_builder | tracker | monitoring_agent | analysis | roadmap | general
    document_type: Optional[str] = None  # sop | lor | cv | resume (for document_builder)
    attachments: Optional[List[str]] = Field(default_factory=list)  # Uploaded file IDs to use as context


class ChatMessageResponse(BaseModel):
    session_id: str
    answer: str
    sources: Optional[List[SourceItem]] = None
    agents_involved: Optional[List[str]] = None
    document_draft: Optional[dict] = None  # Included when document is generated
    progress: Optional[dict] = None  # Document completion progress
    action: Optional[str] = None  # Current action (collect_info, generate_draft, etc.)


@router.post("/message", response_model=ChatMessageResponse)
async def post_message(
    req: ChatMessageRequest,
    user_id: str = Depends(get_current_user),
):
    """
    Process a chat message and route to the appropriate agent/tool.
    
    For document_builder feature, routes to the Document Builder LangGraph orchestrator
    which handles conversational document creation (SOP, LOR, CV, Resume).
    """
    session_id = req.session_id or "sess-" + str(abs(hash(req.message)) % 10_000_000)
    feature_hint = req.feature or "general"
    
    # Route document_builder to the dedicated orchestrator
    if feature_hint == "document_builder":
        return await _handle_document_builder(req, session_id, user_id)
    
    # Basic feature-to-agent mapping for other features
    agents = {
        "tracker": ["TrackerAgent"],
        "monitoring_agent": ["MonitoringAgent"],
        "analysis": ["AnalysisAgent"],
        "roadmap": ["RoadmapAgent"],
        "general": ["GeneralAgent"],
    }.get(feature_hint, ["GeneralAgent"])

    answer = f"(demo) Processed '{req.message}' under feature '{feature_hint}'."
    sources = [
        SourceItem(id="src-1", title="EduLens Docs", url="https://example.com/edulens", snippet="Overview and capabilities"),
    ]

    return ChatMessageResponse(
        session_id=session_id, 
        answer=answer, 
        sources=sources, 
        agents_involved=agents
    )


async def _handle_document_builder(
    req: ChatMessageRequest,
    session_id: str,
    user_id: str,
) -> ChatMessageResponse:
    """
    Handle document builder requests using the LangGraph orchestrator.
    """
    try:
        orchestrator = get_document_builder_orchestrator()
        
        response = await orchestrator.process_message(
            message=req.message,
            session_id=req.session_id,
            user_id=user_id,
            document_type=req.document_type,
            attachments=req.attachments or [],
        )
        
        # Map document builder response to chat response
        return ChatMessageResponse(
            session_id=response.session_id,
            answer=response.response,
            sources=None,
            agents_involved=["DocumentBuilderAgent"],
            document_draft=response.document_draft,
            progress=response.progress.model_dump() if response.progress else None,
            action=response.action.value if response.action else None,
        )
        
    except Exception as e:
        logger.error(f"Document builder error: {e}")
        return ChatMessageResponse(
            session_id=session_id,
            answer=f"I encountered an error with the document builder: {str(e)}. Please try again.",
            sources=None,
            agents_involved=["DocumentBuilderAgent"],
            action="error_recovery",
        )


class SessionItem(BaseModel):
    id: str
    title: Optional[str] = None
    updatedAt: Optional[str] = None
    document_type: Optional[str] = None


@router.get("/sessions")
def get_sessions(user_id: str = Depends(get_current_user)):
    """Return per-user chat/document-builder sessions.

    Currently this surfaces Document Builder sessions maintained by the
    LangGraph orchestrator and exposes them to the dashboard for the
    "Recent Chats" sidebar.
    """
    orchestrator = get_document_builder_orchestrator()
    sessions = orchestrator.list_sessions(user_id)

    items: list[SessionItem] = []
    for s in sessions:
        # s contains: session_id, document_type, phase, completion, updated_at
        title = "Document Builder"
        doc_type = s.get("document_type")
        if doc_type:
            title = f"{doc_type.upper()} Builder"
        items.append(
            SessionItem(
                id=s["session_id"],
                title=title,
                updatedAt=s.get("updated_at"),
                document_type=doc_type,
            )
        )

    return {"sessions": [item.dict() for item in items]}


@router.get("/history")
def get_history(
    sessionId: str = Query(..., alias="sessionId"),
    user_id: str = Depends(get_current_user),
):
    """Return chat history for a given session.

    For now this is backed by the Document Builder orchestrator state and
    returns the sequence of human/AI messages for that session, scoped to
    the current user.
    """
    orchestrator = get_document_builder_orchestrator()
    state = orchestrator.get_session(sessionId)

    if state is None:
        return {"messages": []}

    if state.user_id != user_id:
        # Do not leak other users' sessions
        return {"messages": []}

    messages = []
    for msg in state.messages:
        if isinstance(msg, HumanMessage):
            role = "user"
        elif isinstance(msg, AIMessage):
            role = "ai"
        else:
            # Skip system or tool messages
            continue
        messages.append({"role": role, "content": msg.content})

    return {
        "messages": messages,
        "document_type": state.document_type.value if state.document_type else None,
    }
