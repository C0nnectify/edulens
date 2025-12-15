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
    use_entire_collection: Optional[bool] = False  # When true and no attachments, analyze whole collection


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
    feature_hint = (req.feature or "general").lower()

    # Auto-route to analysis when user selected documents (attachments) or message hints
    message_lower = req.message.strip().lower()
    analysis_hints = ["analyze", "analysis", "summarize", "summary", "insights"]
    # Normalize explicit Analyze feature selections
    if "analy" in feature_hint:  # matches "analyze", "analysis"
        feature_hint = "analysis"

    # Prefer analysis when attachments are present or message hints suggest analysis
    if feature_hint in ("general", "document_builder") and (
        req.attachments or any(h in message_lower for h in analysis_hints)
    ):
        feature_hint = "analysis"
    
    # Route document_builder to the dedicated orchestrator
    if feature_hint == "document_builder":
        return await _handle_document_builder(req, session_id, user_id)
    if feature_hint == "analysis":
        return await _handle_document_analysis(req, session_id, user_id)
    
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


async def _handle_document_analysis(
    req: ChatMessageRequest,
    session_id: str,
    user_id: str,
) -> ChatMessageResponse:
    """Analyze user-selected documents in chat mode using analyzer pipeline."""
    try:
        # Prefer attached documents: resolve attachments to tracking_ids/document_ids and fetch chunks directly
        attachments = req.attachments or []
        context_blocks: list[str] = []
        sources: list[SourceItem] = []

        if attachments:
            from ..database.vector_db import VectorDatabase
            vdb = VectorDatabase(user_id)
            docs = await vdb.list_user_documents()

            # Map attachments to document_ids (preferred), then tracking_ids, then filenames (backward compatibility)
            selected_docs: list[dict] = []
            for att in attachments:
                match = next((d for d in docs if d.get("document_id") == att), None)
                if not match:
                    match = next((d for d in docs if d.get("tracking_id") == att), None)
                if not match:
                    match = next((d for d in docs if (d.get("filename") or "") == att), None)
                if match:
                    selected_docs.append(match)

            # Fetch chunks for selected documents with size-limited context
            MAX_CONTEXT_CHUNKS = 20
            MAX_CONTEXT_CHARS = 12000
            total_chars = 0
            total_chunks = 0
            for d in selected_docs:
                chunks = await vdb.get_document_chunks(d["document_id"], include_embeddings=False)
                for ch in chunks:
                    text = ch.get("text") or ""
                    filename = ch.get("metadata", {}).get("filename", d.get("filename") or d.get("document_id"))
                    block = f"Source[{filename}]\n{text}"
                    if total_chunks < MAX_CONTEXT_CHUNKS and (total_chars + len(block)) <= MAX_CONTEXT_CHARS:
                        context_blocks.append(block)
                        sources.append(
                            SourceItem(
                                id=ch.get("chunk_id"),
                                title=filename,
                                url=None,
                                snippet=text[:180],
                            )
                        )
                        total_chunks += 1
                        total_chars += len(block)
                    else:
                        break

            # If embeddings/chunks aren't available yet, fall back to raw extraction
            if not context_blocks:
                try:
                    from app.services.document_text_service import extract_document_text_for_user
                    for d in selected_docs:
                        filename = d.get("filename") or d.get("document_id")
                        raw = await extract_document_text_for_user(user_id=user_id, document_id=d["document_id"])
                        raw = (raw or "").strip()
                        if not raw:
                            continue
                        block = f"Source[{filename}]\n{raw[:4000]}"
                        if (total_chars + len(block)) <= MAX_CONTEXT_CHARS:
                            context_blocks.append(block)
                            sources.append(SourceItem(id=d.get("document_id"), title=filename, url=None, snippet=raw[:180]))
                            total_chars += len(block)
                except Exception:
                    pass

        # If no attachments (or not enough context) and use_entire_collection, perform hybrid search
        if (not attachments or not context_blocks) and (req.use_entire_collection or not attachments):
            from ..services.search_service import SearchService
            from ..services.embedding_service import EmbeddingService
            from ..models.search import SearchRequest, SearchMode
            embedding = EmbeddingService()
            search = SearchService(user_id, embedding)
            sr = SearchRequest(
                query=req.message,
                mode=SearchMode.HYBRID,
                top_k=12,
                tags=None,
                document_id=None,
                min_score=None,
            )
            search_resp = await search.search(sr)
            results = search_resp.results[:sr.top_k]
            for r in results:
                block = f"Source[{r.filename}]\n{r.text}"
                context_blocks.append(block)
                sources.append(
                    SourceItem(id=r.chunk_id, title=r.filename or r.document_id, url=None, snippet=r.text[:180])
                )

        context = "\n\n".join(context_blocks)

        # Generate answer via Gemini or Groq
        from ..config import settings
        system_prompt = (
            "You are a helpful document analyst. Answer the user question "
            "using ONLY the provided context. Cite filenames where relevant. "
            "If the answer is not in context, say you don't have enough information."
        )
        user_prompt = f"Question: {req.message}\n\nContext:\n{context}"

        answer: str
        try:
            if getattr(settings, "google_api_key", None):
                import google.generativeai as genai
                genai.configure(api_key=settings.google_api_key)
                model_name = getattr(settings, "google_model", "gemini-2.5-flash")
                model = genai.GenerativeModel(model_name)
                resp = model.generate_content([
                    {"role": "user", "parts": [system_prompt]},
                    {"role": "user", "parts": [user_prompt]},
                ])
                answer = resp.text or ""
            elif getattr(settings, "groq_api_key", None):
                from groq import Groq
                client = Groq(api_key=settings.groq_api_key)
                chat = client.chat.completions.create(
                    model="llama-3.1-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.2,
                )
                answer = chat.choices[0].message.content
            else:
                raise RuntimeError("No LLM API key configured (Gemini/Groq)")
        except Exception as e:
            logger.warning(f"LLM call failed: {e}")
            preview = "\n\n".join([blk[:500] for blk in context_blocks[:3]])
            answer = (
                "LLM is not configured. Here's a grounded summary from your documents:\n\n"
                + preview
            )

        return ChatMessageResponse(
            session_id=session_id,
            answer=answer,
            sources=sources,
            agents_involved=["DocumentAnalysisAgent"],
        )
    except Exception as e:
        logger.error(f"Document analysis error: {e}")
        return ChatMessageResponse(
            session_id=session_id,
            answer=f"I encountered an error while analyzing documents: {str(e)}.",
            sources=None,
            agents_involved=["DocumentAnalysisAgent"],
            action="error_recovery",
        )
