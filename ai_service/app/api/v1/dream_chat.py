from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import logging
import uuid

from app.services.roadmap_service import roadmap_service

logger = logging.getLogger(__name__)

router = APIRouter()


class DreamChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    recent_messages: Optional[List[dict]] = Field(default_factory=list)  # [{role: user|ai, content: str}]


class DreamChatResponse(BaseModel):
    session_id: str
    answer: str


def _normalize_recent_messages(raw: Optional[List[dict]]) -> list[dict]:
    if not raw:
        return []
    out: list[dict] = []
    for m in raw:
        if not isinstance(m, dict):
            continue
        role = (m.get("role") or "").strip().lower()
        if role not in ("user", "ai"):
            continue
        content = m.get("content")
        if not isinstance(content, str):
            continue
        content = content.strip()
        if not content:
            continue
        out.append({"role": role, "content": content})
    return out


def _format_recent(recent: list[dict]) -> str:
    if not recent:
        return ""
    lines: list[str] = ["<recent_chat>"]
    for m in recent:
        prefix = "User" if m["role"] == "user" else "Assistant"
        lines.append(f"{prefix}: {m['content']}")
    lines.append("</recent_chat>")
    return "\n".join(lines)


def _llm_chat(system_prompt: str, user_prompt: str) -> str:
    """Dream chat uses Groq with gpt-oss-120b (no Gemini fallback).

    This endpoint is intentionally isolated from the main authenticated orchestration.
    """

    from app.core.config import settings

    groq_key = getattr(settings, "GROQ_API_KEY", None) or getattr(settings, "groq_api_key", None)
    if not groq_key:
        raise RuntimeError("No GROQ API key configured")

    from groq import Groq

    client = Groq(api_key=groq_key)
    chat = client.chat.completions.create(
        # Requested: Groq / GPT-OSS 120B
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
    )
    return (chat.choices[0].message.content or "").strip()


@router.post("/message", response_model=DreamChatResponse)
async def post_dream_message(
    req: DreamChatRequest,
    x_anon_id: Optional[str] = Header(default=None, alias="x-anon-id"),
):
    # Anonymous-only endpoint: requires x-anon-id (generated in browser localStorage).
    if not x_anon_id:
        raise HTTPException(status_code=401, detail="x-anon-id header is required")

    session_id = req.session_id or f"dream_{uuid.uuid4().hex}"

    recent = _normalize_recent_messages(req.recent_messages)
    recent_block = _format_recent(recent)

    # Provide the Dream Mode stage taxonomy as the stable milestone backbone.
    try:
        stages = roadmap_service.get_all_stages()
        stage_lines = [f"{s.order}. {s.title}" for s in stages]
        stage_block = "\n".join(stage_lines)
    except Exception:
        stage_block = "(stages unavailable)"

    system_prompt = (
        "You are EduLens Dream Coach. Your job is to help a new user articulate a bold study-abroad dream "
        "and translate it into a motivating, believable roadmap.\n\n"
        "Rules:\n"
        "- Stay optimistic but concrete.\n"
        "- Ask at most ONE clarifying question per turn.\n"
        "- Do NOT mention tools, APIs, or internal system details.\n"
        "- Do NOT request document uploads.\n"
        "- Output Markdown only. Use headings and blank lines for readability.\n"
        "- For the roadmap preview, use a numbered list with one stage per line.\n"
        "- Use the Dream Mode stages as the backbone milestones (do not invent a completely different taxonomy).\n\n"
        f"Dream Mode Stages (backbone):\n{stage_block}\n"
    )

    user_prompt = (
        (f"{recent_block}\n\n" if recent_block else "")
        + "User message:\n"
        + f"{req.message.strip()}\n\n"
        + "Return exactly this Markdown structure:\n\n"
        + "### Reflection\n"
        + "(1-2 sentences)\n\n"
        + "### Roadmap Preview (Dream Mode stages)\n"
        + "1. **<Stage name>** — <what to do>\n"
        + "2. **<Stage name>** — <what to do>\n"
        + "... (5-7 items total; each on its own line)\n\n"
        + "### Next Question\n"
        + "Ask exactly ONE clarifying question.\n"
    )

    answer = _llm_chat(system_prompt, user_prompt)

    return DreamChatResponse(session_id=session_id, answer=answer)
