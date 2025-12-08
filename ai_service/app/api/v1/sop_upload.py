"""
API endpoints for upload-based SOP generation (form + files approach)
This is separate from the interview-based sop_generator
"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import sys
import os
import markdown

# Add SOP_Generator to Python path
sop_gen_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'SOP_Generator'))
if sop_gen_path not in sys.path:
    # Append to end to avoid shadowing 'main' module
    sys.path.append(sop_gen_path)

# Try to import SOP_Generator services
SERVICES_AVAILABLE = False
try:
    # Import directly from the modules (not main.py which has relative imports)
    # Prefer absolute imports; path injection above kept for legacy
    from app.SOP_Generator.services import storage as storage_module
    from app.SOP_Generator.services import embeddings as embeddings_module
    from app.SOP_Generator.services import llm_client as llm_module
    from app.SOP_Generator import db as db_module
    
    StorageService = storage_module.StorageService
    chunk_text = embeddings_module.chunk_text
    EmbeddingsClient = embeddings_module.EmbeddingsClient
    LLMClient = llm_module.LLMClient
    DatabaseClient = db_module.DatabaseClient
    get_relevant_chunks = db_module.get_relevant_chunks
    store_document_chunks = db_module.store_document_chunks
    
    # Initialize services
    db_client = DatabaseClient()
    llm_client = LLMClient()
    embeddings_client = EmbeddingsClient()
    
    SERVICES_AVAILABLE = True
    print("[OK] SOP_Generator services loaded successfully")
except Exception as e:
    print(f"[WARNING] Warning: Could not load SOP_Generator services: {e}")
    print("   Falling back to mock responses")
    SERVICES_AVAILABLE = False

router = APIRouter(prefix="/sop")

class UploadFileResponse(BaseModel):
    file_id: str
    filename: str
    text_preview: str


class GenerateSOPRequest(BaseModel):
    program: str
    university: Optional[str] = None
    country: Optional[str] = None
    about_you: Optional[str] = None
    background: str
    projects_summary: Optional[str] = None
    goals: str
    others: Optional[str] = None
    tone: Optional[str] = "formal"
    word_limit: Optional[int] = 1000
    file_ids: List[str] = []


class SOPSection(BaseModel):
    heading: str
    content_markdown: str


class GenerateSOPResponse(BaseModel):
    sop_id: Optional[str] = None
    title: str
    sections: List[SOPSection]
    plain_text: str
    editor_json: Dict[str, Any]
    html: str


@router.post("/upload", response_model=UploadFileResponse)
async def upload_file(
    file: UploadFile = File(...),
    doc_type: str = Form("document")
):
    """
    Upload a file (CV, transcript, etc.) for SOP generation
    """
    if not SERVICES_AVAILABLE:
        # Fallback to simple response if services not available
        return UploadFileResponse(
            file_id=f"file_{datetime.now().timestamp()}",
            filename=file.filename or "unknown",
            text_preview=f"Preview for {file.filename}"
        )
    
    try:
        # Read file bytes
        file_bytes = await file.read()
        
        # Store file using SOP_Generator storage service
        storage = StorageService(db_client.get_files_collection())
        result = storage.store_file(
            filename=file.filename or "unknown",
            file_bytes=file_bytes,
            doc_type=doc_type,
            user_id="default_user"  # TODO: Get from auth
        )
        
        # Extract and chunk text for embeddings
        file_text = storage.get_file_text(result["file_id"], "default_user")
        if file_text:
            chunks = chunk_text(file_text)
            store_document_chunks(result["file_id"], chunks)
        
        return UploadFileResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/generate", response_model=GenerateSOPResponse)
async def generate_sop(request: GenerateSOPRequest):
    """
    Generate SOP based on form inputs and uploaded files using Gemini LLM
    """
    if not SERVICES_AVAILABLE:
        # Fallback to mock response if services not available
        return generate_mock_sop(request)
    
    try:
        # Build semantic + metadata query string
        query = f"{request.program} {request.background} {request.goals} {request.university or ''} {request.country or ''}".strip()

        # Retrieval using country top-1 + subject top-2 scheme
        try:
            from app.SOP_Generator.db import get_sop_style_context
            subject = request.program or request.background
            retrieved_chunks = get_sop_style_context(
                country=(request.country or "").lower() or None,
                subject=(subject or "").lower() or None,
                collection_name="sop_examples",
            )
            # Fallback to hybrid if no chunks found
            if not retrieved_chunks:
                from app.SOP_Generator.db import get_relevant_chunks_hybrid
                retrieved_chunks = get_relevant_chunks_hybrid(query, k=6, collection_name="sop_examples")
        except Exception:
            retrieved_chunks = get_relevant_chunks(query, k=6, collection_name="sop_examples")

        # Style profile aggregation from examples (may be empty)
        try:
            from app.services.style_retrieval import get_style_profile
            # Boost with subject/country terms for better style profile retrieval
            q_hint = f"{request.program} {request.country or ''} {request.university or ''}".strip()
            style_profile = get_style_profile("sop", query=q_hint, k=8)
        except Exception:
            style_profile = None

        # Generate SOP using LLM with style profile
        sop_data = llm_client.generate_sop(
            program=request.program,
            university=request.university,
            country=request.country,
            about_you=request.about_you,
            background=request.background,
            projects_summary=request.projects_summary,
            goals=request.goals,
            others=request.others,
            tone=request.tone or "formal",
            word_limit=request.word_limit or 1000,
            retrieved_chunks=retrieved_chunks,
            style_profile=style_profile,
        )
        
        # Convert to TipTap editor JSON format
        editor_json = sections_to_editor_json(sop_data["sections"])
        
        # Generate HTML
        html = sections_to_html(sop_data["sections"])
        
        return GenerateSOPResponse(
            title=sop_data["title"],
            sections=[SOPSection(**s) for s in sop_data["sections"]],
            plain_text=sop_data["plain_text"],
            editor_json=editor_json,
            html=html
        )
    except Exception as e:
        print(f"Error generating SOP: {e}")
        # Fallback to mock on error
        return generate_mock_sop(request)


def generate_mock_sop(request: GenerateSOPRequest) -> GenerateSOPResponse:
    """Generate a mock SOP for testing"""
    sections = [
        SOPSection(
            heading="Introduction",
            content_markdown=f"I am writing to express my strong interest in the {request.program} program at {request.university or 'your esteemed institution'}."
        ),
        SOPSection(
            heading="Academic Background",
            content_markdown=request.background
        ),
        SOPSection(
            heading="Projects and Experience",
            content_markdown=request.projects_summary or "Throughout my academic journey, I have engaged in various projects that have strengthened my skills."
        ),
        SOPSection(
            heading="Career Goals",
            content_markdown=request.goals
        ),
        SOPSection(
            heading="Why This Program",
            content_markdown=f"The {request.program} program aligns perfectly with my career aspirations and offers the ideal environment for my growth."
        )
    ]
    
    title = f"Statement of Purpose - {request.program}"
    editor_json = sections_to_editor_json([s.dict() for s in sections], title=title)
    html = sections_to_html([s.dict() for s in sections], title=title)
    plain_text = "\n\n".join([f"## {s.heading}\n{s.content_markdown}" for s in sections])
    
    return GenerateSOPResponse(
        title=f"Statement of Purpose - {request.program}",
        sections=sections,
        plain_text=plain_text,
        editor_json=editor_json,
        html=html
    )


def sections_to_editor_json(sections: List[Dict[str, str]], title: Optional[str] = None) -> Dict[str, Any]:
    """Convert sections to TipTap editor JSON format (H1 title + paragraphs only)."""
    content: List[Dict[str, Any]] = []

    if title:
        content.append({
            "type": "heading",
            "attrs": {"level": 1},
            "content": [{"type": "text", "text": title}]
        })

    for section in sections:
        # Add content paragraphs (split by newlines)
        paragraphs = section["content_markdown"].split("\n\n")
        for para in paragraphs:
            if para.strip():
                content.append({
                    "type": "paragraph",
                    "content": [{"type": "text", "text": para.strip()}]
                })

    return {"type": "doc", "content": content}


def sections_to_html(sections: List[Dict[str, str]], title: Optional[str] = None) -> str:
    """Convert sections to HTML (H1 title + paragraphs only), rendering markdown like **bold**."""
    html_parts: List[str] = []
    if title:
        html_parts.append(f"<h1>{title}</h1>")

    for section in sections:
        paragraphs = section["content_markdown"].split("\n\n")
        for para in paragraphs:
            if para.strip():
                html_parts.append(markdown.markdown(para.strip(), extensions=[]))

    return "\n".join(html_parts)

