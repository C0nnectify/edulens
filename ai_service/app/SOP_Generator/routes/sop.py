"""API routes for SOP Generator"""
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Header
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import logging
import markdown

from ..models import (
    GenerateSOPRequest, GenerateSOPResponse,
    GenerateLORRequest, GenerateLORResponse,
    RewriteRequest, RewriteResponse,
    SaveSOPRequest, SaveSOPResponse,
    SOPDocument, SOPSummary, UploadFileResponse
)
from ..db import db_client, get_relevant_chunks, store_document_chunks
from ..services.llm_client import llm_client
from ..services.storage import StorageService
from ..services.embeddings import chunk_text

router = APIRouter(prefix="/api/sop", tags=["sop"])

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Auth helper (stub for MVP - replace with actual auth)
def verify_user(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
) -> str:
    """
    Verify JWT token and return user_id
    Stub implementation for MVP - replace with actual JWT verification
    """
    # Prefer explicit x-user-id header when available so that
    # SOP uploads share the same per-user identity as the rest of
    # the AI service (document builder chat, Document AI, etc.).
    if x_user_id and x_user_id.strip():
        return x_user_id.strip()

    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # TODO: Implement real JWT verification
    # For now, extract user_id from token or use mock
    token = authorization.replace("Bearer ", "")

    # Mock: return test user ID
    if token == "test_token" or len(token) > 10:
        return "test_user_123"

    raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/upload", response_model=UploadFileResponse)
async def upload_file(
    file: UploadFile = File(...),
    doc_type: str = Form("document"),
    user_id: str = Depends(verify_user)
):
    """
    Upload a document file (PDF, DOCX, TXT)
    
    Extracts text and stores in MongoDB
    Returns file_id and text preview
    """
    try:
        # Read file bytes
        file_bytes = await file.read()
        
        # Store file
        storage = StorageService(db_client.get_files_collection())
        result = storage.store_file(
            filename=file.filename,
            file_bytes=file_bytes,
            doc_type=doc_type,
            user_id=user_id
        )
        
        # Extract and chunk text for embeddings
        file_text = storage.get_file_text(result["file_id"], user_id)
        if file_text:
            chunks = chunk_text(file_text)
            store_document_chunks(result["file_id"], chunks)
        
        return UploadFileResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.get("/files")
async def list_user_files(limit: int = 50, user_id: str = Depends(verify_user)):
    """List uploaded files for current user (most recent first)."""
    try:
        collection = db_client.get_files_collection()
        cursor = collection.find({"user_id": user_id}).sort("upload_date", -1).limit(limit)
        files = []
        for doc in cursor:
            files.append({
                "file_id": str(doc["_id"]),
                "filename": doc.get("filename", "Unknown"),
                "doc_type": doc.get("doc_type", "document"),
                "upload_date": doc.get("upload_date", datetime.utcnow()).isoformat(),
                "text_preview": doc.get("text_preview", "")[:100] if doc.get("text_preview") else ""
            })
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@router.post("/generate", response_model=GenerateSOPResponse)
async def generate_sop(
    request: GenerateSOPRequest,
    user_id: str = Depends(verify_user)
):
    """
    Generate SOP based on user inputs and uploaded documents
    
    Returns structured SOP with sections and editor JSON
    """
    try:
        logger.info("Generating SOP for user_id=%s, program=%s", user_id, request.program)  
        # Retrieve relevant chunks from uploaded files
        query = f"{request.program} {request.background} {request.goals}"
        retrieved_chunks = get_relevant_chunks(query, k=5)
        
        # Generate SOP using LLM
        sop_data = llm_client.generate_sop(
            program=request.program,
            university=request.university,
            country=request.country,
            about_you=request.about_you,
            background=request.background,
            projects_summary=request.projects_summary,
            goals=request.goals,
            others=request.others,
            tone=request.tone,
            word_limit=request.word_limit,
            retrieved_chunks=retrieved_chunks
        )
        
        # Convert to TipTap editor JSON format (title + paragraphs only)
        editor_json = sections_to_editor_json(sop_data["sections"], title=sop_data.get("title"))
        
        # Generate HTML (title + paragraphs only)
        html = sections_to_html(sop_data["sections"], title=sop_data.get("title"))
        
        return GenerateSOPResponse(
            title=sop_data["title"],
            sections=sop_data["sections"],
            plain_text=sop_data["plain_text"],
            editor_json=editor_json,
            html=html
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SOP generation failed: {str(e)}")

@router.post("/generate-lor", response_model=GenerateLORResponse)
async def generate_lor(
    request: GenerateLORRequest,
    user_id: str = Depends(verify_user)
):
    """Generate Letter of Recommendation using shared LLM client."""
    try:
        logger.info("Generating LOR for student=%s program=%s", request.student_name, request.target_program)

        # Combine all evidence-related file IDs for retrieval
        all_file_ids = request.evidence_file_ids + request.cv_file_ids + request.transcript_file_ids
        query = f"{request.student_name} {request.target_program} {request.skills_observed or ''} {request.achievements or ''}"
        # Be defensive: if vector lookup has schema inconsistencies (e.g., missing 'file_id'),
        # continue without retrieved chunks rather than failing the entire request.
        if all_file_ids:
            try:
                retrieved_chunks = get_relevant_chunks(query, k=5)
            except Exception as ex:
                logger.warning("get_relevant_chunks failed; continuing without evidence: %s", ex)
                retrieved_chunks = []
        else:
            retrieved_chunks = []

        lor_data = llm_client.generate_lor(
            recommender_name=request.recommender_name,
            recommender_title=request.recommender_title,
            recommender_relationship=request.recommender_relationship,
            recommender_association_duration=request.recommender_association_duration,
            student_name=request.student_name,
            student_role=request.student_role,
            student_under_duration=request.student_under_duration,
            skills_observed=request.skills_observed,
            achievements=request.achievements,
            character_traits=request.character_traits,
            target_program=request.target_program,
            target_university=request.target_university,
            target_country=request.target_country,
            tone=request.tone,
            recommendation_strength=request.recommendation_strength,
            word_limit=request.word_limit or 800,
            retrieved_chunks=retrieved_chunks
        )

        editor_json = sections_to_editor_json(lor_data["sections"], title=lor_data.get("title"))
        html = sections_to_html(lor_data["sections"], title=lor_data.get("title"))

        return GenerateLORResponse(
            title=lor_data["title"],
            sections=lor_data["sections"],
            plain_text=lor_data["plain_text"],
            editor_json=editor_json,
            html=html
        )
    except Exception as e:
        # Log full traceback and fall back to a minimal, safe LOR so UX isn't blocked
        logger.exception("LOR generation failed; returning fallback letter: %s", e)
        title = f"Letter of Recommendation for {request.student_name}"
        sections = [
            {"heading": "Introduction & Relationship", "content_markdown": f"I am pleased to recommend {request.student_name}."},
            {"heading": "Summary", "content_markdown": f"{request.student_name} is a strong candidate for {request.target_program}."},
            {"heading": "Closing", "content_markdown": "I recommend the candidate without reservation."},
        ]
        editor_json = sections_to_editor_json(sections, title=title)
        html = sections_to_html(sections, title=title)
        return GenerateLORResponse(
            title=title,
            sections=sections,
            plain_text=" ".join(s.get("content_markdown", "") for s in sections),
            editor_json=editor_json,
            html=html,
        )


@router.post("/rewrite", response_model=RewriteResponse)
async def rewrite_text(
    request: RewriteRequest,
    user_id: str = Depends(verify_user)
):
    """
    Rewrite selected text based on instruction
    
    Returns rewritten text segment
    """
    try:
        # Retrieve relevant chunks from uploaded files if provided
        retrieved_chunks = []
        if request.file_ids:
            query = f"{request.instruction} {request.selected_text[:200]}"
            retrieved_chunks = get_relevant_chunks(query, k=3)
        
        rewritten = llm_client.rewrite_selection(
            selected_text=request.selected_text,
            instruction=request.instruction,
            program=request.program,
            university=request.university,
            retrieved_chunks=retrieved_chunks
        )
        
        return RewriteResponse(rewritten_text=rewritten)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rewrite failed: {str(e)}")


@router.post("/save", response_model=SaveSOPResponse)
async def save_sop(
    request: SaveSOPRequest,
    user_id: str = Depends(verify_user)
):
    """
    Save or update SOP document
    
    Returns sop_id
    """
    try:
        collection = db_client.get_sop_collection()
        
        now = datetime.utcnow()
        
        if request.sop_id:
            # Update existing
            result = collection.update_one(
                {"_id": ObjectId(request.sop_id), "user_id": user_id},
                {
                    "$set": {
                        "title": request.title,
                        "editor_json": request.editor_json,
                        "html": request.html,
                        "metadata": request.metadata or {},
                        "updated_at": now
                    }
                }
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="SOP not found")
            
            sop_id = request.sop_id
        else:
            # Create new
            doc = {
                "title": request.title,
                "editor_json": request.editor_json,
                "html": request.html,
                "metadata": request.metadata or {},
                "user_id": user_id,
                "created_at": now,
                "updated_at": now
            }
            result = collection.insert_one(doc)
            sop_id = str(result.inserted_id)
        
        return SaveSOPResponse(sop_id=sop_id)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")


@router.get("/{sop_id}", response_model=SOPDocument)
async def get_sop(
    sop_id: str,
    user_id: str = Depends(verify_user)
):
    """
    Retrieve saved SOP by ID
    """
    try:
        collection = db_client.get_sop_collection()
        
        doc = collection.find_one({
            "_id": ObjectId(sop_id),
            "user_id": user_id
        })
        
        if not doc:
            raise HTTPException(status_code=404, detail="SOP not found")
        
        return SOPDocument(
            id=str(doc["_id"]),
            title=doc["title"],
            editor_json=doc["editor_json"],
            html=doc["html"],
            metadata=doc.get("metadata", {}),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            user_id=doc["user_id"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval failed: {str(e)}")


@router.get("/", response_model=List[SOPSummary])
async def list_sops(limit: int = 10, doc_type: Optional[str] = None, user_id: str = Depends(verify_user)):
    """List SOP/LOR documents for current user (most recent first).

    When ``doc_type`` is provided, we filter primarily via ``metadata.doc_type``.
    For backward compatibility, when ``doc_type == 'sop'`` we also include legacy
    documents that have no ``metadata.doc_type`` set at all (these were the
    original SOPs before typed documents were introduced).
    """
    try:
        collection = db_client.get_sop_collection()
        base_filter: dict = {"user_id": user_id}

        if doc_type:
            if doc_type == "sop":
                # Treat documents with no explicit doc_type as SOPs so that
                # older SOPs continue to appear in listings.
                base_filter["$or"] = [
                    {"metadata.doc_type": {"$exists": False}},
                    {"metadata.doc_type": "sop"},
                ]
            else:
                # For LOR and any other future types, require an exact match.
                base_filter["metadata.doc_type"] = doc_type

        cursor = collection.find(base_filter).sort("updated_at", -1).limit(limit)
        items: List[SOPSummary] = []
        for doc in cursor:
            items.append(SOPSummary(
                id=str(doc["_id"]),
                title=doc.get("title", "Untitled"),
                updated_at=doc.get("updated_at"),
                created_at=doc.get("created_at")
            ))
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List failed: {str(e)}")


@router.delete("/{sop_id}", status_code=204)
async def delete_sop(sop_id: str, user_id: str = Depends(verify_user)):
    """Delete a SOP document for the current user."""
    try:
        collection = db_client.get_sop_collection()
        result = collection.delete_one({"_id": ObjectId(sop_id), "user_id": user_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="SOP not found")
        # Note: vector chunks removal (if any) can be added here later
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


# Helper functions

def sections_to_editor_json(sections: List[dict], title: Optional[str] = None) -> dict:
    """Convert sections to TipTap editor JSON format with a single H1 title and paragraphs only."""
    content: List[dict] = []

    if title:
        content.append({
            "type": "heading",
            "attrs": {"level": 1},
            "content": [{"type": "text", "text": title}]
        })

    for section in sections:
        markdown = section.get("content_markdown", "")
        paragraphs = markdown.split("\n\n")

        for para in paragraphs:
            if para.strip():
                content.append({
                    "type": "paragraph",
                    "content": [{"type": "text", "text": para.strip()}]
                })

    return {"type": "doc", "content": content}


def sections_to_html(sections: List[dict], title: Optional[str] = None) -> str:
    """Convert sections to HTML with a single H1 title and paragraph-only body."""
    html_parts: List[str] = []

    if title:
        html_parts.append(f"<h1>{title}</h1>")

    for section in sections:
        markdown = section.get("content_markdown", "")
        paragraphs = markdown.split("\n\n")

        for para in paragraphs:
            if para.strip():
                # Convert markdown (e.g., **bold**) to HTML
                html_parts.append(markdown_module(para.strip()))

    return "\n".join(html_parts)

def markdown_module(text: str) -> str:
    # Wrap with markdown conversion ensuring paragraphs
    html = markdown.markdown(text, extensions=[])
    return html
