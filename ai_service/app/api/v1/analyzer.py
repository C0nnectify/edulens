"""
Analyzer API

Provides endpoints to:
- Upload documents to a user's collection
- Query across uploaded documents
- Generate RAG answers with cited sources
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional, List, Dict, Any
import logging

from app.services.embedding_service import embedding_service, EmbeddingService
from app.services.vector_store_service import vector_store_service
from app.services.search_service import SearchService
from app.models.search import SearchMode, SearchResult
from app.models.schemas import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    collection_type: str = Form(default="documents"),
    document_type: str = Form(default="general"),
):
    """Upload a document, chunk, embed, and store in the user's collection."""
    try:
        content = await file.read()

        result = embedding_service.process_uploaded_file(
            file_content=content,
            filename=file.filename,
            user_id=user_id,
            document_type=document_type,
        )

        texts = [c.page_content for c in result["chunks"]]
        metadatas = [c.metadata for c in result["chunks"]]

        store_result = vector_store_service.add_documents(
            user_id=user_id,
            collection_type=collection_type,
            documents=texts,
            metadatas=metadatas,
        )

        return APIResponse(
            success=True,
            message=f"Uploaded and indexed '{file.filename}'",
            data={
                "filename": file.filename,
                "chunk_count": result["chunk_count"],
                **store_result,
            },
        )
    except Exception as e:
        logger.error(f"Analyzer upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def query(
    user_id: str,
    question: str,
    collection_type: str = "documents",
    mode: SearchMode = SearchMode.HYBRID,
    top_k: int = 8,
    min_score: Optional[float] = None,
    tracking_ids: Optional[List[str]] = None,
):
    """Query a user's collection and return a RAG-style answer with sources."""
    try:
        embedding = EmbeddingService()
        search = SearchService(user_id, embedding)

        # Perform search over entire collection or constrained to tracking_ids
        from app.models.search import SearchRequest

        sr = SearchRequest(
            query=question,
            mode=mode,
            top_k=top_k,
            tags=None,
            document_id=None,
            min_score=min_score,
        )
        if tracking_ids:
            # Use the existing query-by-tracking endpoint behavior via SearchService hybrid path
            # We'll filter results post-search to those tracking_ids
            search_resp = await search.search(sr)
            filtered = [r for r in search_resp.results if r.tracking_id in tracking_ids]
            results: List[SearchResult] = filtered[:top_k]
        else:
            search_resp = await search.search(sr)
            results: List[SearchResult] = search_resp.results

        # Build a concise context from top chunks
        context_blocks = []
        sources = []
        for r in results:
            context_blocks.append(f"Source[{r.filename}]\n{r.text}")
            sources.append(
                {
                    "document_id": r.document_id,
                    "tracking_id": r.tracking_id,
                    "filename": r.filename,
                    "score": r.score,
                    "chunk_index": r.chunk_index,
                }
            )

        context = "\n\n".join(context_blocks[:top_k])

        # Try to generate an answer via Gemini or Groq if configured; otherwise, fallback
        answer: str
        try:
            from app.config import settings
            system_prompt = (
                "You are a helpful document analyst. Answer the user question "
                "using ONLY the provided context. Cite filenames where relevant. "
                "If the answer is not in context, say you don't have enough information."
            )
            user_prompt = (f"Question: {question}\n\nContext:\n{context}")

            if getattr(settings, "google_api_key", None):
                # Gemini via google.generativeai
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=settings.google_api_key)
                    model_name = getattr(settings, "google_model", "gemini-2.5-flash")
                    model = genai.GenerativeModel(model_name)
                    resp = model.generate_content([
                        {"role": "user", "parts": [system_prompt]},
                        {"role": "user", "parts": [user_prompt]},
                    ])
                    answer = resp.text or ""
                except Exception as ge:
                    logger.warning(f"Gemini call failed: {ge}")
                    raise
            elif getattr(settings, "groq_api_key", None):
                # Groq via groq SDK
                try:
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
                except Exception as ge:
                    logger.warning(f"Groq call failed: {ge}")
                    raise
            else:
                raise RuntimeError("No Gemini or Groq API key configured")
        except Exception:
            # Fallback: return a grounded summary from top sources
            preview = "\n\n".join([blk[:500] for blk in context_blocks[:3]])
            answer = (
                "LLM is not configured. Here's a grounded summary from your documents:\n\n"
                + preview
            )

        return APIResponse(
            success=True,
            message="Query completed",
            data={
                "answer": answer,
                "sources": sources,
                "total_results": len(results),
                "mode": mode.value,
            },
        )
    except Exception as e:
        logger.error(f"Analyzer query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents")
async def list_documents(user_id: str):
    """List documents available for the user to select for analysis."""
    try:
        from app.database.vector_db import VectorDatabase
        vdb = VectorDatabase(user_id)
        docs = await vdb.list_user_documents()
        return APIResponse(success=True, message="Documents listed", data={"documents": docs})
    except Exception as e:
        logger.error(f"List documents failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resolve")
async def resolve_identifiers(
    user_id: str,
    filenames: Optional[List[str]] = None,
    tracking_ids: Optional[List[str]] = None,
):
    """Resolve filenames and/or tracking_ids to canonical document identifiers.

    Returns a list of objects: {tracking_id, document_id, filename} for matches.
    """
    try:
        from app.database.vector_db import VectorDatabase
        vdb = VectorDatabase(user_id)
        docs = await vdb.list_user_documents()

        filenames = filenames or []
        tracking_ids = tracking_ids or []

        resolved: List[Dict[str, Any]] = []
        for d in docs:
            if d.get("tracking_id") in tracking_ids or (d.get("filename") or "") in filenames:
                resolved.append(
                    {
                        "tracking_id": d.get("tracking_id"),
                        "document_id": d.get("document_id"),
                        "filename": d.get("filename"),
                    }
                )

        return APIResponse(
            success=True,
            message=f"Resolved {len(resolved)} identifiers",
            data={"documents": resolved},
        )
    except Exception as e:
        logger.error(f"Resolve identifiers failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
