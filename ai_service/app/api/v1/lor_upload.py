"""
API endpoints for upload-based LOR generation (form + files approach), mirroring SOP flow.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import sys
import markdown

# Ensure SOP_Generator path
lor_gen_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'SOP_Generator'))
if lor_gen_path not in sys.path:
    sys.path.append(lor_gen_path)

SERVICES_AVAILABLE = False
try:
    from app.SOP_Generator.services import llm_client as llm_module
    from app.SOP_Generator import db as db_module
    from app.services.style_retrieval import get_style_profile

    LLMClient = llm_module.LLMClient
    llm_client = llm_module.llm_client
    get_lor_style_context = db_module.get_lor_style_context
    SERVICES_AVAILABLE = True
    print("[OK] LOR services loaded successfully")
except Exception as e:
    print(f"[WARNING] LOR services not fully available: {e}")
    SERVICES_AVAILABLE = False

router = APIRouter(prefix="/lor")


class GenerateLORRequest(BaseModel):
    # Recommender info
    recommender_name: str
    recommender_title: Optional[str] = None
    recommender_relationship: Optional[str] = None
    recommender_association_duration: Optional[str] = None

    # Student info
    student_name: str
    student_role: Optional[str] = None
    student_under_duration: Optional[str] = None

    # Observations
    skills_observed: Optional[str] = None
    achievements: Optional[str] = None
    character_traits: Optional[str] = None

    # Target program
    target_program: str
    target_university: Optional[str] = None
    target_country: Optional[str] = None

    # Style
    tone: Optional[str] = "professional"
    recommendation_strength: Optional[str] = "strong"  # weak | moderate | strong
    word_limit: Optional[int] = 800

    # Domain hints used for retrieval
    subject: Optional[str] = None  # e.g., "Computer Science"


class LORSection(BaseModel):
    heading: str
    content_markdown: str


class GenerateLORResponse(BaseModel):
    title: str
    sections: List[LORSection]
    plain_text: str
    editor_json: Dict[str, Any]
    html: str


@router.post("/generate", response_model=GenerateLORResponse)
async def generate_lor(request: GenerateLORRequest):
    """Generate LOR using embedded example context: country k=1 + subject k=2."""
    if not SERVICES_AVAILABLE:
        return _mock_lor_response(request)

    try:
        # Retrieve style/context chunks: country top-1, subject top-2
        chunks = get_lor_style_context(
            country=(request.target_country or "").lower() or None,
            subject=(request.subject or request.target_program).lower() if (request.subject or request.target_program) else None,
            collection_name="lor_examples",
        )

        # Style profile aggregation from example letters
        style_profile = None
        try:
            query_hint = f"{request.target_program} {request.target_country or ''} {request.subject or ''}".strip()
            style_profile = get_style_profile("lor", query=query_hint, k=6)
        except Exception:
            pass

        result = llm_client.generate_lor(
            recommender_name=request.recommender_name,
            recommender_title=request.recommender_title or "",
            recommender_relationship=request.recommender_relationship or "",
            recommender_association_duration=request.recommender_association_duration or "",
            student_name=request.student_name,
            student_role=request.student_role or "",
            student_under_duration=request.student_under_duration or "",
            skills_observed=request.skills_observed or "",
            achievements=request.achievements or "",
            character_traits=request.character_traits or "",
            target_program=request.target_program,
            target_university=request.target_university or "",
            target_country=request.target_country or "",
            tone=request.tone or "professional",
            recommendation_strength=request.recommendation_strength or "strong",
            word_limit=request.word_limit or 800,
            retrieved_chunks=chunks,
            style_profile=style_profile,
        )

        editor_json = sections_to_editor_json(result["sections"], title=result.get("title"))
        html = sections_to_html(result["sections"], title=result.get("title"))

        return GenerateLORResponse(
            title=result.get("title", f"Letter of Recommendation for {request.student_name}"),
            sections=[LORSection(**s) for s in result.get("sections", [])],
            plain_text=result.get("plain_text", ""),
            editor_json=editor_json,
            html=html,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LOR generation failed: {e}")


def _mock_lor_response(request: GenerateLORRequest) -> GenerateLORResponse:
    title = f"Letter of Recommendation for {request.student_name}"
    sections = [
        LORSection(heading="Introduction & Relationship", content_markdown=f"I am pleased to recommend {request.student_name}."),
        LORSection(heading="Performance & Contributions", content_markdown=f"{request.student_name} has consistently performed well."),
        LORSection(heading="Skills & Examples", content_markdown=f"They demonstrated strong analytical and collaborative skills."),
        LORSection(heading="Character & Potential", content_markdown=f"{request.student_name} shows integrity and promising potential."),
        LORSection(heading="Closing & Recommendation", content_markdown=f"I strongly recommend {request.student_name} for the program."),
    ]
    plain_text = "\n\n".join([s.content_markdown for s in sections])
    editor_json = sections_to_editor_json([s.dict() for s in sections], title=title)
    html = sections_to_html([s.dict() for s in sections], title=title)
    return GenerateLORResponse(title=title, sections=sections, plain_text=plain_text, editor_json=editor_json, html=html)


def sections_to_editor_json(sections: List[Dict[str, str]], title: Optional[str] = None) -> Dict[str, Any]:
    content: List[Dict[str, Any]] = []
    if title:
        content.append({
            "type": "heading",
            "attrs": {"level": 1},
            "content": [{"type": "text", "text": title}],
        })
    for section in sections:
        paragraphs = section["content_markdown"].split("\n\n")
        for para in paragraphs:
            if para.strip():
                content.append({
                    "type": "paragraph",
                    "content": [{"type": "text", "text": para.strip()}],
                })
    return {"type": "doc", "content": content}


def sections_to_html(sections: List[Dict[str, str]], title: Optional[str] = None) -> str:
    html_parts: List[str] = []
    if title:
        html_parts.append(f"<h1>{title}</h1>")
    for section in sections:
        paragraphs = section["content_markdown"].split("\n\n")
        for para in paragraphs:
            if para.strip():
                html_parts.append(markdown.markdown(para.strip(), extensions=[]))
    return "\n".join(html_parts)
