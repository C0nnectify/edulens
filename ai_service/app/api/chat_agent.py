from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
import asyncio
import uuid

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
    generate_draft: Optional[bool] = False  # Only when true should a document_draft be produced

    # In-chat memory (provided by Next.js from MongoDB)
    session_summary: Optional[str] = ""
    recent_messages: Optional[List[dict]] = Field(default_factory=list)  # [{role: user|ai, content: str}, ...]


class ChatMessageResponse(BaseModel):
    session_id: str
    answer: str
    sources: Optional[List[SourceItem]] = None
    agents_involved: Optional[List[str]] = None
    document_draft: Optional[dict] = None  # Included when document is generated
    progress: Optional[dict] = None  # Document completion progress
    action: Optional[str] = None  # Current action (collect_info, generate_draft, etc.)
    updated_summary: Optional[str] = None  # Rolling summary updated every turn


def _normalize_recent_messages(raw: Optional[List[dict]]) -> list[dict]:
    """Ensure recent messages are well-formed and role-limited."""
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


def _format_memory_block(summary: str, recent: list[dict]) -> str:
    """Build the memory block injected into the assistant prompt."""
    parts: list[str] = []
    s = (summary or "").strip()
    if s:
        # Keep the exact tag style you asked for, but this is internal-only.
        parts.append(f"<summary>\n{s}\n</summary>")

    if recent:
        lines: list[str] = ["<recent_chat>"]
        for m in recent:
            prefix = "User" if m["role"] == "user" else "Assistant"
            lines.append(f"{prefix}: {m['content']}")
        lines.append("</recent_chat>")
        parts.append("\n".join(lines))

    return "\n\n".join(parts).strip()


def _llm_chat(system_prompt: str, user_prompt: str) -> str:
    """Best-effort chat completion using Gemini or Groq based on settings."""
    from ..config import settings

    if getattr(settings, "google_api_key", None):
        import google.generativeai as genai
        genai.configure(api_key=settings.google_api_key)
        model_name = getattr(settings, "google_model", "gemini-2.5-flash")
        model = genai.GenerativeModel(model_name)
        resp = model.generate_content(
            [
                {"role": "user", "parts": [system_prompt]},
                {"role": "user", "parts": [user_prompt]},
            ]
        )
        return (resp.text or "").strip()

    if getattr(settings, "groq_api_key", None):
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
        return (chat.choices[0].message.content or "").strip()

    raise RuntimeError("No LLM API key configured (Gemini/Groq)")


def _update_summary_every_turn(prev_summary: str, user_msg: str, ai_msg: str) -> str:
    """Generate a new rolling summary based on previous summary + latest exchange."""
    prev = (prev_summary or "").strip()
    # Cap the raw inputs so summarization stays fast even if answer is huge.
    u = (user_msg or "").strip()[:2000]
    a = (ai_msg or "").strip()[:2500]

    system_prompt = (
        "You are a summarization engine. Maintain a rolling summary of a conversation. "
        "Update the summary using ONLY the previous summary and the newest user+assistant exchange. "
        "Keep it compact, factual, and useful for future turns (preferences, decisions, entities, constraints). "
        "Output plain text only (no bullets required), max ~1200 characters."
    )

    user_prompt = (
        f"Previous summary (may be empty):\n{prev}\n\n"
        f"Newest exchange:\nUser: {u}\nAssistant: {a}\n\n"
        "Return the updated summary only."
    )

    try:
        updated = _llm_chat(system_prompt, user_prompt)
        updated = (updated or "").strip()
        return updated[:1200]
    except Exception as e:
        logger.warning(f"Summary update failed, using fallback: {e}")
        # Fallback: append a compact line and truncate.
        fallback = prev
        addition = f"User: {u}\nAssistant: {a}".strip()
        combined = (fallback + "\n\n" + addition).strip() if fallback else addition
        return combined[-1200:]


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
    # IMPORTANT: respect a provided session_id so the caller can maintain continuity.
    # If missing, generate a new stable id.
    session_id = req.session_id or f"chat_{uuid.uuid4().hex}"
    feature_hint = (req.feature or "general").lower()

    recent_messages = _normalize_recent_messages(req.recent_messages)
    memory_block = _format_memory_block(req.session_summary or "", recent_messages)

    # Auto-route to analysis when user selected documents (attachments) or message hints
    message_lower = req.message.strip().lower()
    analysis_hints = ["analyze", "analysis", "summarize", "summary", "insights"]
    # Normalize explicit Analyze feature selections
    if "analy" in feature_hint:  # matches "analyze", "analysis"
        feature_hint = "analysis"

    # Prefer analysis when attachments are present or message hints suggest analysis,
    # but only when the caller did NOT explicitly choose a document_builder type.
    # If document_type is set (resume/cv/sop/lor), keep routing to document_builder.
    if feature_hint in ("general", "document_builder") and (not req.document_type) and (
        req.attachments or any(h in message_lower for h in analysis_hints)
    ):
        feature_hint = "analysis"
    
    # Route document_builder to the dedicated orchestrator
    if feature_hint == "document_builder":
        # Resume/CV drafts are generated explicitly (button-triggered) using the analysis-style
        # extraction + structured draft synthesis.
        doc_type = (req.document_type or "").strip().lower()
        if doc_type in ("resume", "cv"):
            resp = await _handle_resume_cv_builder(req, session_id, user_id)
        else:
            resp = await _handle_document_builder(req, session_id, user_id)
        resp.updated_summary = _update_summary_every_turn(req.session_summary or "", req.message, resp.answer)
        return resp
    if feature_hint == "analysis":
        resp = await _handle_document_analysis(req, session_id, user_id)
        resp.updated_summary = _update_summary_every_turn(req.session_summary or "", req.message, resp.answer)
        return resp
    
    # Basic feature-to-agent mapping for other features
    agents = {
        "tracker": ["TrackerAgent"],
        "monitoring_agent": ["MonitoringAgent"],
        "analysis": ["AnalysisAgent"],
        "roadmap": ["RoadmapAgent"],
        "general": ["GeneralAgent"],
    }.get(feature_hint, ["GeneralAgent"])

    # General / other tools: use an LLM-based assistant with short+long term memory.
    system_prompt = (
        "You are a helpful assistant. Use the provided memory to stay consistent within the chat session. "
        "If the user references earlier parts of the conversation, rely on the summary and recent turns."
    )
    user_prompt_parts = []
    if memory_block:
        user_prompt_parts.append(memory_block)
    user_prompt_parts.append(req.message)
    user_prompt = "\n\n".join(user_prompt_parts)

    try:
        answer = _llm_chat(system_prompt, user_prompt)
    except Exception as e:
        logger.warning(f"LLM call failed for general chat: {e}")
        # Fallback: minimal response that still acknowledges memory.
        answer = "I can help, but the LLM is not configured on the server right now."

    updated_summary = _update_summary_every_turn(req.session_summary or "", req.message, answer)

    return ChatMessageResponse(
        session_id=session_id,
        answer=answer,
        sources=None,
        agents_involved=agents,
        updated_summary=updated_summary,
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
            # Use the resolved session_id so the orchestrator stays consistent.
            session_id=session_id,
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


async def _handle_resume_cv_builder(
    req: ChatMessageRequest,
    session_id: str,
    user_id: str,
) -> ChatMessageResponse:
    """Resume/CV builder behavior:

    - No automatic draft generation.
    - When req.generate_draft is true, synthesize a structured draft from the selected attachments.
    """

    doc_type = (req.document_type or "resume").strip().lower()
    attachments = req.attachments or []

    def _safe_json_loads(text: str):
        """Best-effort JSON parser for LLM output (handles code fences and extra text)."""
        import json

        if not isinstance(text, str):
            raise ValueError("Expected JSON text")

        cleaned = text.strip()

        # Strip fenced blocks like ```json ...``` or ``` ...```.
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            # If the model wrote a language hint on the first line, drop it.
            parts = cleaned.splitlines()
            if parts and parts[0].strip().lower() in {"json", "javascript"}:
                cleaned = "\n".join(parts[1:]).strip()

        # Try direct parse first.
        try:
            return json.loads(cleaned)
        except Exception:
            pass

        # Try to extract the largest JSON object substring.
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(cleaned[start : end + 1])

        raise ValueError("No JSON object found")

    def _calc_progress(extracted: dict) -> dict:
        # Minimal progress heuristic to help the UI show "what's missing".
        # We keep it intentionally simple and deterministic.
        collected: list[str] = []
        missing: list[str] = []

        personal = extracted.get("personalInfo") or {}
        if isinstance(personal, dict) and (personal.get("fullName") or "").strip():
            collected.append("fullName")
        else:
            missing.append("fullName")

        if isinstance(extracted.get("summary"), str) and extracted.get("summary").strip():
            collected.append("summary")
        else:
            missing.append("summary")

        exp = extracted.get("experience")
        if isinstance(exp, list) and len(exp) > 0:
            collected.append("experience")
        else:
            missing.append("experience")

        edu = extracted.get("education")
        if isinstance(edu, list) and len(edu) > 0:
            collected.append("education")
        else:
            missing.append("education")

        skills = extracted.get("skills")
        if isinstance(skills, list) and len(skills) > 0:
            collected.append("skills")
        else:
            missing.append("skills")

        # Percentage: 5 key groups.
        pct = int(round((len(collected) / 5) * 100))
        return {
            "collected_fields": collected,
            "missing_fields": missing,
            "percentage": pct,
            "ready_for_generation": len(missing) <= 2,  # allow partial drafts
        }

    def _conversation_text() -> str:
        # The Next.js proxy provides both a rolling summary and last N turns.
        parts: list[str] = []
        if req.session_summary:
            parts.append(f"Session summary:\n{req.session_summary}")
        if req.recent_messages:
            try:
                for m in req.recent_messages:
                    role = (m.get("role") if isinstance(m, dict) else "") or ""
                    content = (m.get("content") if isinstance(m, dict) else "") or ""
                    if isinstance(role, str) and isinstance(content, str) and content.strip():
                        parts.append(f"{role.title()}: {content.strip()}")
            except Exception:
                pass
        # Current message last.
        parts.append(f"User: {req.message}")
        return "\n".join(parts)

    def _blank_draft() -> dict:
        return {
            "version": 1,
            "title": "",
            "personalInfo": {
                "fullName": "",
                "email": "",
                "phone": "",
                "location": {"city": "", "state": "", "country": ""},
                "linkedin": "",
                "github": "",
                "portfolio": "",
            },
            "summary": "",
            "experience": [],
            "education": [],
            "skills": [],
        }

    def _merge_drafts(base: dict, incoming: dict) -> dict:
        # Merge only when incoming has a meaningful value.
        if not isinstance(base, dict):
            base = {}
        if not isinstance(incoming, dict):
            return base

        out = {**base}
        for k, v in incoming.items():
            if v is None:
                continue
            if isinstance(v, str):
                if v.strip():
                    out[k] = v
                continue
            if isinstance(v, list):
                if len(v) > 0:
                    out[k] = v
                continue
            if isinstance(v, dict):
                out[k] = _merge_drafts(out.get(k, {}), v)
                continue
            out[k] = v
        return out

    def _heuristic_extract(text: str) -> dict:
        """Cheap, deterministic extraction for common fields (name/education/skills)."""
        import re

        draft = _blank_draft()
        if not isinstance(text, str) or not text.strip():
            return draft

        # Normalize for scanning but keep original lines for value capture.
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        joined = "\n".join(lines)

        # Full name patterns.
        name_patterns = [
            r"\bfull\s*name\s*[:\-]\s*(.+)$",
            r"\bname\s*[:\-]\s*(.+)$",
            r"\bi\s*am\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4})\b",
            r"\bi'm\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4})\b",
        ]
        for ln in lines:
            for pat in name_patterns[:2]:
                m = re.search(pat, ln, re.IGNORECASE)
                if m:
                    candidate = m.group(1).strip()
                    # Stop at common separators.
                    candidate = re.split(r"\s+(stud\w+|study\w+|education|skills|experience)\b", candidate, flags=re.IGNORECASE)[0].strip()
                    candidate = candidate.strip(" .,-")
                    if candidate:
                        draft["personalInfo"]["fullName"] = candidate
                        break
            if draft["personalInfo"]["fullName"]:
                break

        if not draft["personalInfo"]["fullName"]:
            for pat in name_patterns[2:]:
                m = re.search(pat, joined)
                if m:
                    draft["personalInfo"]["fullName"] = m.group(1).strip(" .,-")
                    break

        # Education heuristics (very lightweight).
        # Examples handled: "Studying in North South University in CSE", "Student at X", "Studying at X".
        edu_line = None
        for ln in lines:
            if re.search(r"\bstud\w*\b", ln, re.IGNORECASE) and re.search(r"\b(at|in)\b", ln, re.IGNORECASE):
                edu_line = ln
                break
        if edu_line:
            # Capture after "in" or "at".
            m = re.search(r"\b(?:at|in)\s+(.+)$", edu_line, re.IGNORECASE)
            if m:
                remainder = m.group(1).strip()
                # If the user wrote "... University in CSE", treat last " in " as field.
                institution = remainder
                field = ""
                if " in " in remainder.lower():
                    parts = re.split(r"\s+in\s+", remainder, maxsplit=1, flags=re.IGNORECASE)
                    if len(parts) == 2:
                        institution = parts[0].strip()
                        field = parts[1].strip()
                draft["education"] = [
                    {
                        "institution": institution,
                        "degree": "",
                        "field": field,
                        "location": "",
                        "startDate": "",
                        "endDate": "",
                        "current": True,
                    }
                ]

        # Skills-style lines (category: list, list, list)
        skill_labels = {
            "skills": "Skills",
            "programming languages": "Programming Languages",
            "languages": "Programming Languages",
            "web technologies": "Web Technologies",
            "databases": "Databases",
            "tools": "Tools",
            "tools & platforms": "Tools & Platforms",
            "platforms": "Tools & Platforms",
        }
        skills: list[dict] = []
        for ln in lines:
            if ":" not in ln:
                continue
            left, right = ln.split(":", 1)
            left_norm = re.sub(r"\s+", " ", left.strip().lower())
            cat = skill_labels.get(left_norm)
            if not cat:
                continue
            items = [x.strip() for x in right.split(",") if x.strip()]
            for it in items:
                skills.append({"name": it, "category": cat})
        if skills:
            draft["skills"] = skills

        return draft

    # Extract best-effort structured data from conversation only.
    convo_text = _conversation_text()
    extracted_from_chat: dict = _heuristic_extract(convo_text)
    missing_fields: list[str] = []
    try:
        system_prompt = (
            "You extract resume/CV information from a conversation. "
            "Only extract facts explicitly stated by the user. Do NOT guess or invent. "
            "Return ONLY valid JSON (no markdown, no commentary)."
        )
        user_prompt = (
            "From the conversation, extract a structured resume draft candidate and missing fields.\n\n"
            "Return JSON with:\n"
            "{\n"
            "  \"extracted\": {\n"
            "    \"title\": string,\n"
            "    \"personalInfo\": {\"fullName\": string, \"email\": string, \"phone\": string, \"location\": {\"city\": string, \"state\": string, \"country\": string}, \"linkedin\": string, \"github\": string, \"portfolio\": string},\n"
            "    \"summary\": string,\n"
            "    \"experience\": [{\"company\": string, \"position\": string, \"location\": string, \"startDate\": string, \"endDate\": string, \"current\": boolean, \"bullets\": [string]}],\n"
            "    \"education\": [{\"institution\": string, \"degree\": string, \"field\": string, \"location\": string, \"startDate\": string, \"endDate\": string, \"current\": boolean}],\n"
            "    \"skills\": [{\"name\": string, \"category\": string}]\n"
            "  },\n"
            "  \"missing\": [string]\n"
            "}\n\n"
            "Rules: fill unknown fields with empty strings/empty arrays; missing should include key things not present (e.g. fullName, education, experience, skills).\n\n"
            f"Conversation:\n{_conversation_text()}"
        )
        raw = _llm_chat(system_prompt, user_prompt)
        parsed = _safe_json_loads(raw)
        llm_extracted = parsed.get("extracted") if isinstance(parsed, dict) else {}
        if not isinstance(llm_extracted, dict):
            llm_extracted = {}
        extracted_from_chat = _merge_drafts(extracted_from_chat, llm_extracted)
        missing = parsed.get("missing") if isinstance(parsed, dict) else []
        if isinstance(missing, list):
            missing_fields = [str(x) for x in missing if str(x).strip()]
    except Exception as e:
        logger.warning(f"Resume/CV conversation extraction failed: {e}")
        missing_fields = ["fullName", "education", "experience", "skills"]

    progress_payload = _calc_progress(extracted_from_chat)

    if not req.generate_draft:
        # Ask for the next most useful missing item.
        next_q: str
        if "fullName" in missing_fields or "fullName" in progress_payload.get("missing_fields", []):
            next_q = "What is your full name?"
        elif "education" in progress_payload.get("missing_fields", []):
            next_q = "Tell me your education (degree, university, dates)."
        elif "experience" in progress_payload.get("missing_fields", []):
            next_q = "Tell me your work experience (role, company, dates) and 2–4 bullet achievements."
        elif "skills" in progress_payload.get("missing_fields", []):
            next_q = "List your key skills (technical + soft skills)."
        else:
            next_q = "What role are you targeting, and do you want a 1–2 line summary included?"

        return ChatMessageResponse(
            session_id=session_id,
            answer=(
                "Got it. I can build your "
                + ("resume" if doc_type == "resume" else "CV")
                + " from what you share here.\n\n"
                + next_q
                + "\n\nWhen you’re ready, write \"Generate "
                + ("Resume" if doc_type == "resume" else "CV")
                + "\" and I will generate it."
            ),
            sources=None,
            agents_involved=["DocumentBuilderAgent"],
            document_draft=None,
            progress=progress_payload,
            action="collect_info",
        )

    # Build context from attachments (selected docs only), if provided.
    context_blocks: list[str] = []
    sources: list[SourceItem] = []
    try:
        from ..database.vector_db import VectorDatabase
        vdb = VectorDatabase(user_id)
        docs = await vdb.list_user_documents()

        selected_docs: list[dict] = []
        for att in attachments:
            match = next((d for d in docs if d.get("document_id") == att), None)
            if not match:
                match = next((d for d in docs if d.get("tracking_id") == att), None)
            if not match:
                match = next((d for d in docs if (d.get("filename") or "") == att), None)
            if match:
                selected_docs.append(match)

        MAX_CONTEXT_CHARS = 14000
        total_chars = 0
        for d in selected_docs:
            chunks = await vdb.get_document_chunks(d["document_id"], include_embeddings=False)
            for ch in chunks:
                text = (ch.get("text") or "").strip()
                if not text:
                    continue
                filename = ch.get("metadata", {}).get("filename", d.get("filename") or d.get("document_id"))
                block = f"Source[{filename}]\n{text}"
                if total_chars + len(block) > MAX_CONTEXT_CHARS:
                    break
                context_blocks.append(block)
                sources.append(SourceItem(id=str(ch.get("chunk_id") or d.get("document_id")), title=filename, url=None, snippet=text[:180]))
                total_chars += len(block)

        if not context_blocks:
            from app.services.document_text_service import extract_document_text_for_user
            for d in selected_docs:
                raw = await extract_document_text_for_user(user_id=user_id, document_id=d["document_id"])
                raw = (raw or "").strip()
                if not raw:
                    continue
                filename = d.get("filename") or d.get("document_id")
                block = f"Source[{filename}]\n{raw[:6000]}"
                if total_chars + len(block) > MAX_CONTEXT_CHARS:
                    break
                context_blocks.append(block)
                sources.append(SourceItem(id=str(d.get("document_id")), title=filename, url=None, snippet=raw[:180]))
                total_chars += len(block)
    except Exception as e:
        logger.warning(f"Resume/CV draft context build failed: {e}")

    # Conversation context is always available; attachments are optional.
    context = "\n\n".join([_conversation_text()] + context_blocks)

    # Ask the LLM to produce a structured draft JSON.
    system_prompt = (
        "You are a resume/CV drafting assistant. Convert the provided context (conversation + optional attachments) into a clean structured draft. "
        "Only use facts stated in the context; do NOT invent. Return ONLY valid JSON (no markdown, no commentary)."
    )
    user_prompt = (
        "Create a JSON object with this schema:\n"
        "{\n"
        "  \"version\": 1,\n"
        "  \"title\": string,\n"
        "  \"personalInfo\": {\"fullName\": string, \"email\": string, \"phone\": string, \"location\": {\"city\": string, \"state\": string, \"country\": string}, \"linkedin\": string, \"github\": string, \"portfolio\": string},\n"
        "  \"summary\": string,\n"
        "  \"experience\": [{\"company\": string, \"position\": string, \"location\": string, \"startDate\": string, \"endDate\": string, \"current\": boolean, \"bullets\": [string]}],\n"
        "  \"education\": [{\"institution\": string, \"degree\": string, \"field\": string, \"location\": string, \"startDate\": string, \"endDate\": string, \"current\": boolean}],\n"
        "  \"skills\": [{\"name\": string, \"category\": string}]\n"
        "}\n\n"
        "Rules: fill unknown fields with empty strings/empty arrays; do not invent facts not present in the text.\n\n"
        "Use conversation facts first; supplement from attachments if present.\n\n"
        f"Context:\n{context}"
    )

    try:
        raw = _llm_chat(system_prompt, user_prompt)
        draft_obj = _safe_json_loads(raw)
    except Exception as e:
        logger.warning(f"Draft generation failed: {e}")

        # If we have any extracted info, generate a basic draft instead of failing.
        has_any = False
        try:
            pi = extracted_from_chat.get("personalInfo") if isinstance(extracted_from_chat, dict) else {}
            has_any = bool((pi.get("fullName") or "").strip())
            has_any = has_any or bool((extracted_from_chat.get("summary") or "").strip())
            has_any = has_any or bool(extracted_from_chat.get("education"))
            has_any = has_any or bool(extracted_from_chat.get("experience"))
            has_any = has_any or bool(extracted_from_chat.get("skills"))
        except Exception:
            has_any = False

        if has_any:
            fallback_draft = _merge_drafts(_blank_draft(), extracted_from_chat)
            return ChatMessageResponse(
                session_id=session_id,
                answer=(
                    "Draft generated (basic) from the info you provided. "
                    "Open it in the editor to refine details and formatting."
                ),
                sources=sources or None,
                agents_involved=["DocumentBuilderAgent"],
                document_draft=fallback_draft,
                progress=progress_payload,
                action="generate_draft",
            )

        # Provide a helpful, chat-based recovery message instead of blaming PDFs.
        missing = progress_payload.get("missing_fields", []) if isinstance(progress_payload, dict) else []
        if isinstance(missing, list) and missing:
            missing_text = ", ".join(missing[:5])
            recovery = (
                "I couldn’t generate a structured draft yet because some key details are missing. "
                f"Please share: {missing_text}.\n\n"
                "When you’re ready, write \"Generate "
                + ("Resume" if doc_type == "resume" else "CV")
                + "\" and I will generate it."
            )
        else:
            recovery = (
                "I couldn’t generate a structured draft from the information provided. "
                "Please share your education, experience, and skills (even short bullet points), then try again.\n\n"
                "When you’re ready, write \"Generate "
                + ("Resume" if doc_type == "resume" else "CV")
                + "\" and I will generate it."
            )
        return ChatMessageResponse(
            session_id=session_id,
            answer=recovery,
            sources=sources or None,
            agents_involved=["DocumentBuilderAgent"],
            document_draft=None,
            progress=progress_payload,
            action="collect_info",
        )

    return ChatMessageResponse(
        session_id=session_id,
        answer=(
            "Draft generated. Click ‘Open in "
            + ("Resume Builder" if doc_type == "resume" else "CV Builder")
            + "’ to edit, save, and export."
        ),
        sources=sources or None,
        agents_involved=["DocumentBuilderAgent"],
        document_draft=draft_obj,
        progress=progress_payload,
        action="generate_draft",
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
        recent_messages = _normalize_recent_messages(req.recent_messages)
        memory_block = _format_memory_block(req.session_summary or "", recent_messages)

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

        # If explicitly enabled, and we have no (or insufficient) attachment-derived context,
        # perform hybrid search over the user's collection.
        # IMPORTANT: do NOT default to searching the entire collection when no attachments are selected.
        if (not attachments or not context_blocks) and bool(req.use_entire_collection):
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
            "You are a helpful document analyst. Answer the user question using the provided document context. "
            "You may use the conversation summary and recent turns for intent/preferences, "
            "but ground factual claims in the document context and cite filenames where relevant. "
            "If the answer is not in the document context, say you don't have enough information."
        )
        user_prompt_parts: list[str] = []
        if memory_block:
            user_prompt_parts.append(memory_block)
        user_prompt_parts.append(f"Question: {req.message}\n\nContext:\n{context}")
        user_prompt = "\n\n".join(user_prompt_parts)

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
