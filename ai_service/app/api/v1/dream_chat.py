from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import logging
import uuid
import json
import re

from app.services.roadmap_service import roadmap_service

logger = logging.getLogger(__name__)

router = APIRouter()


class DreamChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    recent_messages: Optional[List[dict]] = Field(default_factory=list)  # [{role: user|ai, content: str}]


class RoadmapStage(BaseModel):
    order: int
    title: str
    description: str


class DreamChatResponse(BaseModel):
    session_id: str
    answer: str
    # Structured data for timeline rendering
    reflection: Optional[str] = None
    roadmap_stages: Optional[List[RoadmapStage]] = None
    next_question: Optional[str] = None


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
        "- Use the Dream Mode stages as the backbone milestones (do not invent a completely different taxonomy).\n"
        "- Select 5-7 most relevant stages from the backbone.\n\n"
        f"Dream Mode Stages (backbone):\n{stage_block}\n"
    )

    user_prompt = (
        (f"{recent_block}\n\n" if recent_block else "")
        + "User message:\n"
        + f"{req.message.strip()}\n\n"
        + "Return your response as valid JSON with this exact structure:\n"
        + '{\n'
        + '  "reflection": "1-2 motivating sentences about their dream",\n'
        + '  "roadmap_stages": [\n'
        + '    {"order": 1, "title": "Stage Title", "description": "Specific action for this stage"},\n'
        + '    {"order": 2, "title": "Stage Title", "description": "Specific action for this stage"}\n'
        + '  ],\n'
        + '  "next_question": "One clarifying question to help refine their roadmap"\n'
        + '}\n\n'
        + "Return ONLY the JSON object, no markdown formatting or code blocks."
    )

    raw_answer = _llm_chat(system_prompt, user_prompt)

    # Parse the JSON response and build structured data
    reflection = None
    roadmap_stages = None
    next_question = None

    try:
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', raw_answer)
        if json_match:
            parsed = json.loads(json_match.group())
            reflection = parsed.get("reflection")
            next_question = parsed.get("next_question")

            stages_data = parsed.get("roadmap_stages", [])
            if stages_data:
                roadmap_stages = [
                    RoadmapStage(
                        order=s.get("order", idx + 1),
                        title=s.get("title", f"Stage {idx + 1}"),
                        description=s.get("description", "")
                    )
                    for idx, s in enumerate(stages_data)
                ]
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Failed to parse JSON response: {e}")

    # Build markdown answer for backward compatibility
    answer_parts = []
    if reflection:
        answer_parts.append(f"### Reflection\n{reflection}")
    if roadmap_stages:
        stage_lines = [f"{s.order}. **{s.title}** — {s.description}" for s in roadmap_stages]
        answer_parts.append(f"### Roadmap Preview\n" + "\n".join(stage_lines))
    if next_question:
        answer_parts.append(f"### Next Question\n{next_question}")

    answer = "\n\n".join(answer_parts) if answer_parts else raw_answer

    return DreamChatResponse(
        session_id=session_id,
        answer=answer,
        reflection=reflection,
        roadmap_stages=roadmap_stages,
        next_question=next_question
    )
