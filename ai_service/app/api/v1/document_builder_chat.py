"""
Document Builder Chat API

API endpoints for chat-based document creation (SOP, LOR, CV, Resume).
Integrates with the Document Builder LangGraph orchestrator.
"""

import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from ...api.dependencies import get_current_user
from ...tools.document_builder.graph import (
    get_document_builder_orchestrator,
    DocumentBuilderOrchestrator,
)
from ...tools.document_builder.state import (
    DocumentBuilderChatRequest,
    DocumentBuilderChatResponse,
    DocumentType,
    ActionType,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/document-builder", tags=["Document Builder Chat"])


# ============================================================================
# Request/Response Models
# ============================================================================

class ChatMessageRequest(BaseModel):
    """Request model for chat messages."""
    session_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=5000)
    document_type: Optional[str] = Field(
        None,
        description="Document type: sop, lor, cv, resume"
    )
    attachments: List[str] = Field(
        default_factory=list,
        description="List of attachment file IDs"
    )


class ChatMessageResponse(BaseModel):
    """Response model for chat messages."""
    session_id: str
    message: str
    action: str
    document_type: Optional[str] = None
    document_draft: Optional[dict] = None
    progress: Optional[dict] = None
    metadata: dict = Field(default_factory=dict)


class SessionInfo(BaseModel):
    """Session information model."""
    session_id: str
    document_type: Optional[str]
    phase: str
    completion_percentage: float
    updated_at: str


class SessionListResponse(BaseModel):
    """Response model for listing sessions."""
    sessions: List[SessionInfo]


class DocumentDraftResponse(BaseModel):
    """Response model for retrieving a document draft."""
    session_id: str
    document_type: str
    title: str
    sections: List[dict]
    plain_text: str
    word_count: int
    editor_json: Optional[dict] = None
    html: Optional[str] = None


# ============================================================================
# Dependency
# ============================================================================

def get_orchestrator() -> DocumentBuilderOrchestrator:
    """Dependency to get the document builder orchestrator."""
    return get_document_builder_orchestrator()


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/chat", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    user_id: str = Depends(get_current_user),
    orchestrator: DocumentBuilderOrchestrator = Depends(get_orchestrator),
):
    """
    Send a message to the document builder chat.
    
    This endpoint handles the conversational document creation flow:
    - If no session_id is provided, a new session is created
    - The AI will guide the user through information collection
    - Once enough info is collected, the document is generated
    - Users can request refinements to the generated document
    
    **Document Types:**
    - `sop`: Statement of Purpose
    - `lor`: Letter of Recommendation
    - `cv`: Curriculum Vitae
    - `resume`: Resume
    
    **Example Flow:**
    1. User: "I want to create an SOP for MIT's CS PhD program"
    2. AI: "Great! Let's create your SOP. Tell me about your background..."
    3. User: "I have a BS in CS from Stanford with 3.9 GPA..."
    4. AI: "Excellent! What research experience do you have?"
    ... (continues until all info collected)
    5. AI: "I've generated your SOP! [draft presented]"
    6. User: "Can you make the introduction more engaging?"
    7. AI: "I've refined the introduction. [updated draft]"
    """
    try:
        response = await orchestrator.process_message(
            message=request.message,
            session_id=request.session_id,
            user_id=user_id,
            document_type=request.document_type,
        )
        
        return ChatMessageResponse(
            session_id=response.session_id,
            message=response.response,
            action=response.action.value,
            document_type=response.document_type.value if response.document_type else None,
            document_draft=response.document_draft,
            progress=response.progress.model_dump() if response.progress else None,
            metadata=response.metadata,
        )
        
    except Exception as e:
        logger.error(f"Chat message processing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process message: {str(e)}"
        )


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(
    user_id: str = Depends(get_current_user),
    orchestrator: DocumentBuilderOrchestrator = Depends(get_orchestrator),
):
    """
    List all document builder sessions for the current user.
    
    Returns a list of sessions with their status and progress.
    """
    try:
        sessions = orchestrator.list_sessions(user_id)
        return SessionListResponse(
            sessions=[
                SessionInfo(
                    session_id=s["session_id"],
                    document_type=s["document_type"],
                    phase=s["phase"],
                    completion_percentage=s["completion"],
                    updated_at=s["updated_at"],
                )
                for s in sessions
            ]
        )
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list sessions: {str(e)}"
        )


@router.get("/sessions/{session_id}", response_model=ChatMessageResponse)
async def get_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
    orchestrator: DocumentBuilderOrchestrator = Depends(get_orchestrator),
):
    """
    Get the current state of a document builder session.
    
    Returns the session state including any generated draft and progress.
    """
    state = orchestrator.get_session(session_id)
    
    if not state:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    
    if state.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied to this session"
        )
    
    data = state.get_collected_data()
    progress = None
    if data:
        progress = {
            "collected_fields": data.get_filled_fields(),
            "missing_fields": data.get_missing_critical_fields() + data.get_missing_important_fields(),
            "percentage": data.get_completion_percentage(),
            "ready_for_generation": data.is_ready_for_generation(),
        }
    
    return ChatMessageResponse(
        session_id=session_id,
        message=state.last_ai_response,
        action=state.next_action.value,
        document_type=state.document_type.value if state.document_type else None,
        document_draft=state.draft.model_dump() if state.draft else None,
        progress=progress,
        metadata={
            "phase": state.phase.value,
            "completion_percentage": state.completion_percentage,
        }
    )


@router.get("/sessions/{session_id}/draft", response_model=DocumentDraftResponse)
async def get_draft(
    session_id: str,
    user_id: str = Depends(get_current_user),
    orchestrator: DocumentBuilderOrchestrator = Depends(get_orchestrator),
):
    """
    Get the generated document draft for a session.
    
    Returns the draft in multiple formats:
    - `sections`: Structured sections with headings
    - `plain_text`: Full document as plain text
    - `editor_json`: JSON format for rich text editor
    - `html`: HTML formatted document
    """
    state = orchestrator.get_session(session_id)
    
    if not state:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    
    if state.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied to this session"
        )
    
    if not state.draft:
        raise HTTPException(
            status_code=404,
            detail="No draft available for this session"
        )
    
    return DocumentDraftResponse(
        session_id=session_id,
        document_type=state.draft.document_type.value,
        title=state.draft.title,
        sections=[s.model_dump() for s in state.draft.sections],
        plain_text=state.draft.plain_text,
        word_count=state.draft.word_count,
        editor_json=state.draft.editor_json,
        html=state.draft.html,
    )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
    orchestrator: DocumentBuilderOrchestrator = Depends(get_orchestrator),
):
    """
    Delete a document builder session.
    """
    state = orchestrator.get_session(session_id)
    
    if not state:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    
    if state.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied to this session"
        )
    
    # Remove from storage
    if session_id in orchestrator.sessions:
        del orchestrator.sessions[session_id]
    
    return {"status": "deleted", "session_id": session_id}


# ============================================================================
# Quick Actions (for specific document types)
# ============================================================================

@router.post("/sop/start", response_model=ChatMessageResponse)
async def start_sop(
    program: Optional[str] = None,
    university: Optional[str] = None,
    user_id: str = Depends(get_current_user),
    orchestrator: DocumentBuilderOrchestrator = Depends(get_orchestrator),
):
    """
    Quick start a new SOP session.
    
    Optionally provide the target program and university to speed up the process.
    """
    message = "I want to create a Statement of Purpose"
    if program:
        message += f" for {program}"
    if university:
        message += f" at {university}"
    
    response = await orchestrator.process_message(
        message=message,
        user_id=user_id,
        document_type="sop",
    )
    
    return ChatMessageResponse(
        session_id=response.session_id,
        message=response.response,
        action=response.action.value,
        document_type="sop",
        progress=response.progress.model_dump() if response.progress else None,
        metadata=response.metadata,
    )


@router.post("/lor/start", response_model=ChatMessageResponse)
async def start_lor(
    student_name: Optional[str] = None,
    program: Optional[str] = None,
    user_id: str = Depends(get_current_user),
    orchestrator: DocumentBuilderOrchestrator = Depends(get_orchestrator),
):
    """
    Quick start a new LOR session.
    
    Optionally provide student name and target program.
    """
    message = "I want to create a Letter of Recommendation"
    if student_name:
        message += f" for {student_name}"
    if program:
        message += f" applying to {program}"
    
    response = await orchestrator.process_message(
        message=message,
        user_id=user_id,
        document_type="lor",
    )
    
    return ChatMessageResponse(
        session_id=response.session_id,
        message=response.response,
        action=response.action.value,
        document_type="lor",
        progress=response.progress.model_dump() if response.progress else None,
        metadata=response.metadata,
    )
