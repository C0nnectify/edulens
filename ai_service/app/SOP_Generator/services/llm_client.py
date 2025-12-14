"""LLM client for SOP generation using LangChain and Gemini with Groq fallback"""

import os
import json
from typing import Dict, Any, List, Optional
import logging

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage
from google.api_core.exceptions import ResourceExhausted

from app.config import settings

# -------------------------------------------------------------------
# Config
# -------------------------------------------------------------------

GEMINI_API_KEY = settings.google_api_key or os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
USE_MOCK_LLM = os.getenv("USE_MOCK_LLM", "false").strip().lower() in ("1", "true", "yes", "y")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# -------------------------------------------------------------------
# Prompt templates
# -------------------------------------------------------------------

SOP_GENERATION_SYSTEM_PROMPT = """
You are an expert admissions writer who crafts clear, truthful, and persuasive
Statements of Purpose (SOPs) for international university applications.

Constraints:
- Do NOT invent facts (dates, awards, scores, names). If a fact is not present in
  the provided context or uploaded documents, either omit it or ask ONE short
  clarifying question before generating.
- When you use information from uploaded documents, mark it with a short
    citation token like [file:{{file_id}}] where file_id is provided inside the
  "retrieved_docs" block.
- Be honest about any missing information instead of guessing.
- Prefer first-person voice ("I") and a professional, confident tone matching
  the user's requested tone.

Output requirements:
- You MUST output VALID JSON only, with NO extra commentary or code fences.
- The JSON MUST follow this exact schema:

{
  "title": "string",
  "word_count": integer,
  "sections": [
    {"heading": "Introduction",          "content_markdown": "..."},
    {"heading": "Academic Background",   "content_markdown": "..."},
    {"heading": "Relevant Experience",   "content_markdown": "..."},
    {"heading": "Why This Program",      "content_markdown": "..."},
    {"heading": "Goals & Conclusion",    "content_markdown": "..."}
  ],
  "plain_text": "full SOP in plain text"
}
""".strip()

LOR_GENERATION_SYSTEM_PROMPT = """
You are an expert academic and professional reference letter writer. Craft truthful,
evidence-based Letters of Recommendation (LOR) that support a candidate's application.

Constraints:
- Do NOT invent facts (dates, scores, titles). Use only provided context or explicitly
    state if a detail is missing.
- Cite derived evidence from uploaded documents with tokens [file:{{file_id}}] when used.
- Keep a professional, consistent tone based on the requested tone and strength.

Output: VALID JSON ONLY matching schema:
{
    "title": "string",
    "word_count": integer,
    "sections": [
        {"heading": "Introduction & Relationship", "content_markdown": "..."},
        {"heading": "Performance & Contributions", "content_markdown": "..."},
        {"heading": "Skills & Examples", "content_markdown": "..."},
        {"heading": "Character & Potential", "content_markdown": "..."},
        {"heading": "Closing & Recommendation", "content_markdown": "..."}
    ],
    "plain_text": "full letter"
}
""".strip()

LOR_GENERATION_USER_PROMPT = """
Recommender:
- Name: {recommender_name}
- Title / Organization: {recommender_title}
- Relationship: {recommender_relationship}
- Association Duration: {recommender_association_duration}

Student:
- Name: {student_name}
- Role/Degree: {student_role}
- Under supervision duration: {student_under_duration}

Observed:
- Skills Observed: {skills_observed}
- Achievements / Examples: {achievements}
- Character Traits: {character_traits}

Target Program:
- Program: {target_program}
- University: {target_university}
- Country: {target_country}

Tone: {tone}
Recommendation Strength: {recommendation_strength}
Word Limit: {word_limit}

Retrieved documents:
{retrieved_docs}

Task: Write a Letter of Recommendation following SYSTEM instructions. Integrate relevant
evidence and cite with [file:{{file_id}}] tokens where appropriate. Adapt closing language
to match recommendation strength.
""".strip()


SOP_GENERATION_USER_PROMPT = """
Context:
- Program: {program}
- University: {university}
- Country: {country}
- Tone: {tone}
- Word limit: {word_limit}

About the applicant:
- Short bio / about you: {about_you}
- Background (education / degrees / GPA / major): {background}
- Projects / internships / publications (brief): {projects_summary}
- Career & academic goals: {goals}
- Extra notes: {others}

Retrieved documents (top-k summaries).
Each entry has: file_id, filename, text_preview, page:

{retrieved_docs}

Task:
Using the context above and the retrieved documents, write a program-specific
Statement of Purpose following the SYSTEM instructions.

Requirements:
 - Use relevant facts from retrieved_docs and cite them inline as [file:{{file_id}}]
  where you used that file.
- If a key factual detail (such as degree, GPA, or main project) is required for
  a strong SOP but missing, ask ONE clarifying question instead of inventing the
  information. The clarifying question should be a single sentence.
- Keep length close to the requested word_limit (±10%).
- Structure the SOP into the 5 sections in the schema (Introduction,
  Academic Background, Relevant Experience, Why This Program,
  Goals & Conclusion).
- Be specific and concrete: mention 1–2 key projects or achievements (if available),
  tie them to what the program offers, and end with a clear statement of goals.
""".strip()


REWRITE_SYSTEM_PROMPT = """
You are an SOP editor. Given a selection of text and an instruction, rewrite the
selection while preserving its meaning and factual content.

Rules:
- Do NOT add new factual claims (degrees, scores, dates, names) that are not
  present in the original text.
- Follow the instruction carefully (e.g., shorten, formalize, emphasize fit
  with a university).
- Keep the tone consistent with the overall SOP (professional and clear).
- Return only the rewritten text (no explanations, no JSON).
""".strip()


REWRITE_USER_PROMPT = """
Selected text:
\"\"\"{selected_text}\"\"\"

Instruction: "{instruction}"

Context:
- Program: {program}
- University: {university}
- Surrounding text (if provided): {surrounding_text}

Relevant documents (if available):
{retrieved_docs}

Return ONLY the rewritten selected text, in markdown if you use emphasis or lists.
""".strip()


# -------------------------------------------------------------------
# Client implementation
# -------------------------------------------------------------------


class LLMClient:
    """LangChain wrapper for Gemini LLM used for SOP generation and editing."""

    def __init__(self) -> None:
        # Use mock if explicitly requested or if no API key is available
        self.use_mock = USE_MOCK_LLM or (not bool(GEMINI_API_KEY) and not bool(GROQ_API_KEY))

        self.llm = None
        self.groq_llm = None
        
        if not self.use_mock:
            # Initialize Gemini as primary
            if GEMINI_API_KEY:
                model_name = settings.google_model or "gemini-2.5-flash"
                logger.info("Initializing Gemini LLM with model=%s", model_name)
                self.llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    google_api_key=GEMINI_API_KEY,
                    temperature=0.3,  # lower temp for factual consistency
                )
            
            # Initialize Groq as fallback
            if GROQ_API_KEY:
                logger.info("Initializing Groq LLM as fallback (llama-3.3-70b-versatile)")
                self.groq_llm = ChatGroq(
                    model="llama-3.3-70b-versatile",
                    api_key=GROQ_API_KEY,
                    temperature=0.3,
                )
        else:
            logger.warning("Using MOCK LLM for SOP generation (no API keys or USE_MOCK_LLM=true).")

    # ---------------------------- helpers ---------------------------- #
    
    def _invoke_with_fallback(self, messages: List) -> Any:
        """
        Invoke LLM with automatic fallback to Groq if Gemini quota is exceeded.
        
        Returns:
            LLM response
        """
        # Try Gemini first
        if self.llm:
            try:
                return self.llm.invoke(messages)
            except ResourceExhausted as e:
                logger.warning(f"Gemini quota exceeded: {e}. Falling back to Groq...")
                if self.groq_llm:
                    try:
                        return self.groq_llm.invoke(messages)
                    except Exception as groq_error:
                        logger.error(f"Groq fallback also failed: {groq_error}")
                        raise
                else:
                    logger.error("No Groq API key available for fallback")
                    raise
            except Exception as e:
                logger.error(f"Gemini invocation failed: {e}")
                raise
        
        # If no Gemini, try Groq directly
        elif self.groq_llm:
            try:
                return self.groq_llm.invoke(messages)
            except Exception as e:
                logger.error(f"Groq invocation failed: {e}")
                raise
        
        else:
            raise RuntimeError("No LLM available (neither Gemini nor Groq)")

    def _mock_sop_response(self, program: str, university: str) -> Dict[str, Any]:
        """Generate a simple mock SOP JSON for testing without hitting Gemini."""
        title = f"Statement of Purpose for {program}"
        sections = [
            {
                "heading": "Introduction",
                "content_markdown": (
                    f"I am writing to express my strong interest in the {program} program at "
                    f"{university or 'your esteemed institution'}. My motivation for this field "
                    "has grown through my academic journey and hands-on experiences."
                ),
            },
            {
                "heading": "Academic Background",
                "content_markdown": (
                    "Throughout my academic career, I have built a solid foundation in the core "
                    "subjects relevant to this program, consistently performing well in key courses."
                ),
            },
            {
                "heading": "Relevant Experience",
                "content_markdown": (
                    "I have complemented my academics with projects and internships where I applied "
                    "my knowledge to real-world problems and collaborated with diverse teams."
                ),
            },
            {
                "heading": "Why This Program",
                "content_markdown": (
                    f"The {program} curriculum and learning environment align strongly with my "
                    "aspirations. I am particularly drawn to the program's emphasis on practical "
                    "learning and research exposure."
                ),
            },
            {
                "heading": "Goals & Conclusion",
                "content_markdown": (
                    "After completing this program, I aim to contribute meaningfully to my field, "
                    "leveraging the skills and perspectives gained to solve impactful problems."
                ),
            },
        ]

        plain_text = " ".join(s["content_markdown"] for s in sections)
        word_count = len(plain_text.split())

        return {
            "title": title,
            "word_count": word_count,
            "sections": sections,
            "plain_text": plain_text,
        }

    @staticmethod
    def _format_retrieved_docs(chunks: List[Dict[str, Any]]) -> str:
        """Format retrieved document chunks into a compact string for the prompt."""
        if not chunks:
            return "No additional documents provided."

        lines: List[str] = []
        for chunk in chunks[:8]:  # safety: cap at 8 chunks
            file_id = chunk.get("file_id") or chunk.get("id") or "unknown"
            filename = chunk.get("filename", "unknown")
            page = chunk.get("page", "")
            preview = (chunk.get("text_preview") or chunk.get("text") or "").strip()
            preview = preview.replace("\n", " ")
            if len(preview) > 260:
                preview = preview[:260].rstrip() + "..."
            line = f'- {{"file_id":"{file_id}","filename":"{filename}","page":{page},"text_preview":"{preview}"}}'
            lines.append(line)

        return "\n".join(lines)

    @staticmethod
    def _extract_json_from_llm(content: str) -> Dict[str, Any]:
        """
        Try to robustly extract and parse JSON from LLM output.
        Handles accidental code fences or leading/trailing text.
        """
        text = content.strip()

        # Remove common markdown fences if present
        if text.startswith("```"):
            # e.g. ```json { ... } ```
            parts = text.split("```")
            # find first chunk that looks like JSON
            for part in parts:
                part = part.strip()
                if part.startswith("{") and part.endswith("}"):
                    text = part
                    break

        # Fallback: try to locate the first '{' and last '}'
        if not (text.startswith("{") and text.endswith("}")):
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and start < end:
                text = text[start : end + 1]

        return json.loads(text)

    # ------------------------- public methods ------------------------ #

    def generate_sop(
        self,
        program: str,
        university: Optional[str],
        country: Optional[str],
        about_you: Optional[str],
        background: str,
        projects_summary: Optional[str],
        goals: str,
        others: Optional[str],
        tone: str,
        word_limit: int,
        retrieved_chunks: List[Dict[str, Any]],
        style_profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate SOP content.

        Returns:
            Dict with keys: title, word_count, sections, plain_text
        """
        # Use mock when configured or Gemini unavailable
        if self.use_mock or not self.llm:
            logger.info("Using mock SOP response (generate_sop).")
            return self._mock_sop_response(program, university or "")

        retrieved_docs_str = self._format_retrieved_docs(retrieved_chunks)

        # Incorporate style profile hints if available
        style_hint = ""
        if style_profile:
            try:
                # Trim potentially large lists
                sp = {
                    k: v for k, v in style_profile.items() if k in (
                        "avg_sentence_length",
                        "avg_paragraph_length",
                        "common_headings",
                        "tone_indicators",
                        "recommended_structure",
                    )
                }
                import json as _json
                style_hint = f"\nStyle guidance (derived from examples):\n{_json.dumps(sp, ensure_ascii=False)}\n"
            except Exception:
                style_hint = ""

        messages = [
            SystemMessage(content=SOP_GENERATION_SYSTEM_PROMPT + style_hint),
            HumanMessage(
                content=SOP_GENERATION_USER_PROMPT.format(
                    program=program,
                    university=university or "N/A",
                    country=country or "N/A",
                    about_you=about_you or "N/A",
                    background=background,
                    projects_summary=projects_summary or "N/A",
                    goals=goals,
                    others=others or "N/A",
                    tone=tone,
                    word_limit=word_limit,
                    retrieved_docs=retrieved_docs_str,
                )
            ),
        ]

        try:
            logger.info("Invoking LLM for SOP generation: program=%s, university=%s", program, university)
            response = self._invoke_with_fallback(messages)
            content = response.content
            logger.debug("Raw LLM response: %s", content)

            result = self._extract_json_from_llm(content)
            # Basic sanity: ensure required keys
            if "sections" not in result or "plain_text" not in result:
                raise ValueError("Missing required keys in LLM JSON output.")
            return result

        except Exception as e:
            logger.error("Error generating SOP via LLM: %s", e, exc_info=True)
            # Fallback to mock on error
            return self._mock_sop_response(program, university or "")

    def _mock_lor_response(self, student_name: str) -> Dict[str, Any]:
        title = f"Letter of Recommendation for {student_name}"
        sections = [
            {"heading": "Introduction & Relationship", "content_markdown": f"I am pleased to recommend {student_name}."},
            {"heading": "Performance & Contributions", "content_markdown": f"{student_name} has consistently performed well."},
            {"heading": "Skills & Examples", "content_markdown": f"They demonstrated strong analytical and collaborative skills."},
            {"heading": "Character & Potential", "content_markdown": f"{student_name} shows integrity and promising potential."},
            {"heading": "Closing & Recommendation", "content_markdown": f"I strongly recommend {student_name} for the program."}
        ]
        plain_text = " ".join(s["content_markdown"] for s in sections)
        return {"title": title, "word_count": len(plain_text.split()), "sections": sections, "plain_text": plain_text}

    def generate_lor(
        self,
        recommender_name: str,
        recommender_title: str,
        recommender_relationship: str,
        recommender_association_duration: str,
        student_name: str,
        student_role: Optional[str],
        student_under_duration: Optional[str],
        skills_observed: Optional[str],
        achievements: Optional[str],
        character_traits: Optional[str],
        target_program: str,
        target_university: Optional[str],
        target_country: Optional[str],
        tone: str,
        recommendation_strength: str,
        word_limit: int,
        retrieved_chunks: List[Dict[str, Any]],
        style_profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if self.use_mock or not self.llm:
            logger.info("Using mock LOR response (generate_lor).")
            return self._mock_lor_response(student_name)

        retrieved_docs_str = self._format_retrieved_docs(retrieved_chunks)
        lor_style_hint = ""
        if style_profile:
            try:
                import json as _json
                sp = {
                    k: v for k, v in style_profile.items() if k in (
                        "avg_sentence_length",
                        "avg_paragraph_length",
                        "common_headings",
                        "tone_indicators",
                        "recommended_structure",
                    )
                }
                lor_style_hint = f"\nStyle guidance (derived from letters):\n{_json.dumps(sp, ensure_ascii=False)}\n"
            except Exception:
                lor_style_hint = ""

        messages = [
            SystemMessage(content=LOR_GENERATION_SYSTEM_PROMPT + lor_style_hint),
            HumanMessage(content=LOR_GENERATION_USER_PROMPT.format(
                recommender_name=recommender_name,
                recommender_title=recommender_title,
                recommender_relationship=recommender_relationship,
                recommender_association_duration=recommender_association_duration,
                student_name=student_name,
                student_role=student_role or "N/A",
                student_under_duration=student_under_duration or "N/A",
                skills_observed=skills_observed or "N/A",
                achievements=achievements or "N/A",
                character_traits=character_traits or "N/A",
                target_program=target_program,
                target_university=target_university or "N/A",
                target_country=target_country or "N/A",
                tone=tone,
                recommendation_strength=recommendation_strength,
                word_limit=word_limit,
                retrieved_docs=retrieved_docs_str,
            ))
        ]

        try:
            logger.info("Invoking LLM for LOR generation: student=%s program=%s", student_name, target_program)
            response = self._invoke_with_fallback(messages)
            content = response.content
            result = self._extract_json_from_llm(content)
            if "sections" not in result or "plain_text" not in result:
                raise ValueError("Missing required keys in LOR JSON output.")

            # ---------------- Post-processing for formatting ----------------
            # Remove inline file citation tokens like [file:mock_file_0]
            def _clean(text: str) -> str:
                import re
                return re.sub(r"\[file:[^\]]+\]", "", text).strip()

            for section in result.get("sections", []):
                section["content_markdown"] = _clean(section.get("content_markdown", ""))

            # Build conventional header & signature with placeholders where info is missing
            from datetime import datetime
            today_str = datetime.utcnow().strftime("%B %d, %Y")

            # Header placeholders (we don't have address fields yet)
            header_lines = [
                recommender_name or "[Recommender Name]",
                recommender_title or "[Title / Position]",
                "[Department / Organization]",
                "[Address Line]",
                "[City, State ZIP]",
                "[Country]",
                "",
                today_str,
                "",
            ]

            # Salutation logic based on program keywords
            program_lower = (target_program or "").lower()
            if "residency" in program_lower:
                salutation = "Dear Program Director,"  # medical residency style
            else:
                salutation = "Dear Admissions Committee,"  # general academic

            header_block = "\n".join(header_lines) + f"{salutation}\n\n"

            # Prepend header to first section
            if result["sections"]:
                result["sections"][0]["content_markdown"] = header_block + result["sections"][0]["content_markdown"].lstrip()

            # Append closing signature to last section
            signature_block = (
                "\n\nSincerely,\n\n"
                f"{recommender_name or '[Recommender Name]'}\n"
                f"{recommender_title or '[Title / Position]'}\n"
            )
            if result["sections"]:
                result["sections"][-1]["content_markdown"] = result["sections"][-1]["content_markdown"].rstrip() + signature_block

            # Rebuild plain_text from cleaned & augmented sections
            plain_text = "\n\n".join(s.get("content_markdown", "") for s in result["sections"])
            result["plain_text"] = plain_text
            result["word_count"] = len(plain_text.split())

            return result
        except Exception as e:
            logger.error("Error generating LOR via LLM: %s", e, exc_info=True)
            return self._mock_lor_response(student_name)

    def rewrite_selection(
        self,
        selected_text: str,
        instruction: str,
        program: Optional[str] = None,
        university: Optional[str] = None,
        surrounding_text: Optional[str] = None,
        retrieved_chunks: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """
        Rewrite selected text based on an instruction.

        Returns:
            Rewritten text (string). On error, returns the original selection.
        """
        if self.use_mock or not self.llm:
            # Very simple mock behaviour for dev
            logger.info("Using mock rewrite response.")
            return f"[{instruction}] {selected_text}"

        retrieved_docs_str = self._format_retrieved_docs(retrieved_chunks or [])

        messages = [
            SystemMessage(content=REWRITE_SYSTEM_PROMPT),
            HumanMessage(
                content=REWRITE_USER_PROMPT.format(
                    selected_text=selected_text,
                    instruction=instruction,
                    program=program or "N/A",
                    university=university or "N/A",
                    surrounding_text=surrounding_text or "N/A",
                    retrieved_docs=retrieved_docs_str,
                )
            ),
        ]

        try:
            response = self._invoke_with_fallback(messages)
            rewritten = response.content.strip()
            return rewritten or selected_text
        except Exception as e:
            logger.error("Error rewriting text via LLM: %s", e, exc_info=True)
            return selected_text


# Global singleton instance (import this in your routes)
llm_client = LLMClient()
