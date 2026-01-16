"""
LOR Tool

Tool for generating Letters of Recommendation through conversational interaction.
Handles information collection from recommender perspective and LOR generation.
"""

import json
import uuid
import logging
from typing import Any, Dict, List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from .base_document_tool import BaseDocumentTool
from ..state import (
    DocumentBuilderState,
    DocumentType,
    LORCollectedData,
    GeneratedDocument,
    DocumentSection,
    LOR_REQUIRED_FIELDS,
)
from ..prompts import (
    LOR_SYSTEM_PROMPT,
    LOR_INTENT_ANALYSIS_PROMPT,
    LOR_COLLECTION_PROMPTS,
    LOR_GENERATION_PROMPT,
)

logger = logging.getLogger(__name__)


# Field to question topic mapping for natural conversation
FIELD_TO_TOPIC: Dict[str, str] = {
    # Recommender details
    "recommender_name": "recommender_info",
    "recommender_title": "recommender_info",
    "recommender_organization": "recommender_info",
    "relationship": "recommender_info",
    "association_duration": "recommender_info",
    # Student and target program details
    "student_name": "student_info",
    "student_role": "student_info",
    "target_program": "student_info",
    "target_university": "student_info",
    "target_country": "student_info",
    # Observations and comparison
    "skills_observed": "observations",
    "achievements": "observations",
    "character_traits": "observations",
    "specific_examples": "observations",
    "areas_of_growth": "comparison",
    "peer_comparison": "comparison",
    # Strength/overall check
    "strength": "strength_level",
}


class LORTool(BaseDocumentTool):
    """Tool for creating Letters of Recommendation through conversation."""

    def __init__(self, llm: ChatGoogleGenerativeAI):
        super().__init__(llm, DocumentType.LOR)

    # ------------------------------------------------------------------
    # Prompt accessors
    # ------------------------------------------------------------------
    @property
    def system_prompt(self) -> str:
        return LOR_SYSTEM_PROMPT

    @property
    def intent_analysis_prompt(self) -> str:
        return LOR_INTENT_ANALYSIS_PROMPT

    @property
    def collection_prompts(self) -> Dict[str, str]:
        return LOR_COLLECTION_PROMPTS

    @property
    def generation_prompt(self) -> str:
        return LOR_GENERATION_PROMPT

    def get_required_fields(self) -> Dict[str, List[str]]:
        return LOR_REQUIRED_FIELDS

    # ------------------------------------------------------------------
    # Attachment helpers
    # ------------------------------------------------------------------
    async def _get_attachment_text(self, state: DocumentBuilderState) -> str:
        """Aggregate raw text from any uploaded attachments for this LOR session.

        Supports both:
        - Files stored via the SOP_Generator storage service
        - Documents ingested through the central Document AI pipeline

        The aggregated text is used as extra context when extracting
        structured LOR information so we can infer things like the
        student's name, target program/university, or achievements
        directly from a CV or transcript before asking the user.
        """
        if not getattr(state, "attachments", None):
            return ""

        try:
            from app.SOP_Generator.services import storage as storage_module
            from app.SOP_Generator import db as db_module
            from app.database.mongodb import get_documents_collection
            from app.services import DocumentProcessor

            db_client = db_module.DatabaseClient()
            storage = storage_module.StorageService(db_client.get_files_collection())

            docs_collection = get_documents_collection()
            doc_processor = DocumentProcessor()

            collected_chunks: List[str] = []
            for file_id in state.attachments:
                text: str = ""

                # 1) Try SOP_Generator file store (legacy system)
                if not text:
                    try:
                        text = storage.get_file_text(file_id, state.user_id) or ""
                    except Exception:
                        text = ""

                # 2) If nothing found, fall back to canonical Document AI documents
                if not text:
                    try:
                        from app.services.document_text_service import extract_document_text_for_user
                        text = await extract_document_text_for_user(user_id=state.user_id, document_id=file_id)
                    except Exception:
                        text = ""

                if not text:
                    continue

                snippet = text.strip().replace("\n", " ")[:2000]
                collected_chunks.append(snippet)

            if not collected_chunks:
                return ""

            combined = "\n\n".join(collected_chunks)
            return combined[:8000]

        except Exception:
            return ""

    # ------------------------------------------------------------------
    # Information extraction & state updates
    # ------------------------------------------------------------------
    async def extract_info_from_message(
        self, message: str, state: DocumentBuilderState
    ) -> Dict[str, Any]:
        """Extract LOR-relevant information from user's message.
        Now delegates to extract_and_respond for AI-driven extraction with contextual responses.
        """
        self.logger.info(f"=== extract_info_from_message called ===")
        self.logger.info(f"Message length: {len(message)}")
        
        result = await self.extract_and_respond(message, state)
        
        self.logger.info(f"extract_and_respond returned keys: {list(result.keys())}")
        
        # Store the AI response in state metadata for later use
        if "ai_response" in result and result["ai_response"]:
            self.logger.info(f"Storing AI response in metadata: {result['ai_response'][:100]}...")
            state.metadata["pending_ai_response"] = result["ai_response"]
        else:
            self.logger.warning("No ai_response in result!")
            
        if "ready_for_generation" in result:
            state.metadata["ai_says_ready"] = result["ready_for_generation"]
        
        # Return just the extracted data for compatibility
        extracted = result.get("extracted_data", {})
        self.logger.info(f"Returning extracted_data with keys: {list(extracted.keys()) if extracted else 'empty'}")
        return extracted

    async def extract_and_respond(
        self, message: str, state: DocumentBuilderState
    ) -> Dict[str, Any]:
        """
        Extract LOR data and generate a contextual AI response.
        
        Extracts:
        - Recommender details
        - Student information
        - Relationship context
        - Observations and achievements

        Then generates a specific, contextual response acknowledging what was provided.
        """
        self.logger.info("=== extract_and_respond for LOR ===")
        
        attachment_context = await self._get_attachment_text(state)
        current_filled = state.lor_data.get_filled_fields() if state.lor_data else []

        extraction_prompt = f"""
    Analyze the following message and extract any information relevant to a Letter of Recommendation.

    User Message:
    {message}

    Attachment Context (from uploaded files, if any):
    {attachment_context or "(no attachment text available)"}

Current Context:
- Current topic being discussed: {state.current_topic or "general"}
- Perspective: {state.lor_data.perspective if state.lor_data else "unknown"}
- Fields already collected: {current_filled}

Extract and return a JSON object with the following structure. Only include fields where you found relevant information:

{{
    "perspective": "recommender or student (who is providing this info)",
    "recommender_name": "recommender's full name if mentioned",
    "recommender_title": "recommender's title/position if mentioned",
    "recommender_organization": "recommender's organization if mentioned",
    "relationship": "relationship type (professor, supervisor, mentor, etc.)",
    "association_duration": "how long they've known each other",
    "context": "context of their association (class, lab, project, etc.)",
    "student_name": "student's name if mentioned",
    "student_role": "student's role when they knew them",
    "skills_observed": ["list", "of", "skills"] if mentioned,
    "achievements": "specific achievements mentioned",
    "character_traits": "personality/character traits mentioned",
    "specific_examples": "any specific examples or anecdotes",
    "peer_comparison": "how student compares to peers if mentioned",
    "areas_of_growth": "growth areas witnessed if mentioned",
    "target_program": "target program if mentioned",
    "target_university": "target university if mentioned",
    "target_country": "target country if mentioned",
    "strength": "recommendation strength if indicated (strong/moderate/standard)"
}}

Only include fields where the user actually provided information. Use null for fields not mentioned.
Return valid JSON only.
"""
        extracted = {}
        try:
            response = self._invoke_with_fallback([
                SystemMessage(content="You are an information extraction assistant. Extract structured data from text."),
                HumanMessage(content=extraction_prompt),
            ])

            extracted = self._extract_json(response.content)

            # Handle skills_observed as list
            if "skills_observed" in extracted:
                skills = extracted["skills_observed"]
                if isinstance(skills, str):
                    extracted["skills_observed"] = [s.strip() for s in skills.split(",")]

            # Filter out null/empty values
            extracted = {
                k: v
                for k, v in extracted.items()
                if v is not None and v != "" and v != []
            }

        except Exception as e:
            self.logger.error(f"Info extraction failed: {e}")
            extracted = {}
        
        self.logger.info(f"Extracted fields: {list(extracted.keys())}")
        
        # Merge with existing data to calculate completeness
        current_data = {}
        if state.lor_data:
            current_data = {k: v for k, v in state.lor_data.model_dump().items() if v}
        
        all_data = {**current_data, **extracted}
        
        # Calculate what we have and what's missing
        filled_fields = [k for k, v in all_data.items() if v]
        critical_fields = ["student_name", "recommender_name", "relationship"]
        important_fields = ["skills_observed", "achievements", "specific_examples"]
        
        missing_critical = [f for f in critical_fields if f not in filled_fields]
        has_important = any(f in filled_fields for f in important_fields)
        ready = len(missing_critical) == 0 and has_important
        
        self.logger.info(f"Filled: {filled_fields}")
        self.logger.info(f"Missing critical: {missing_critical}")
        self.logger.info(f"Ready: {ready}")
        
        # Generate contextual response
        ai_response = self._generate_lor_response(
            all_data, filled_fields, missing_critical, ready, extracted
        )
        self.logger.info(f"Generated response: {ai_response[:100]}...")
        
        return {
            "extracted_data": extracted,
            "ai_response": ai_response,
            "ready_for_generation": ready,
            "missing_critical": missing_critical
        }
    
    def _generate_lor_response(
        self, 
        data: Dict[str, Any], 
        filled: List[str], 
        missing_critical: List[str],
        ready: bool,
        newly_extracted: Dict[str, Any]
    ) -> str:
        """Generate a contextual LOR response based on extracted data."""
        
        # Get key info for personalization
        student_name = data.get("student_name", "")
        recommender_name = data.get("recommender_name", "")
        relationship = data.get("relationship", "")
        target_program = data.get("target_program", "")
        target_university = data.get("target_university", "")
        skills = data.get("skills_observed", [])
        achievements = data.get("achievements", "")
        
        # Build acknowledgment of what was just provided
        newly_extracted_keys = list(newly_extracted.keys())
        ack_parts = []
        
        if newly_extracted_keys:
            if "student_name" in newly_extracted_keys:
                ack_parts.append(f"Got it – this LOR is for **{student_name}**.")
            if "recommender_name" in newly_extracted_keys:
                ack_parts.append(f"Thanks, **{recommender_name}**!")
            if "relationship" in newly_extracted_keys:
                ack_parts.append(f"I understand your {relationship} relationship.")
            if "target_program" in newly_extracted_keys or "target_university" in newly_extracted_keys:
                if target_program and target_university:
                    ack_parts.append(f"Targeting {target_program} at {target_university}.")
                elif target_university:
                    ack_parts.append(f"Targeting {target_university}.")
            if "skills_observed" in newly_extracted_keys:
                ack_parts.append("Those skills will strengthen the letter!")
            if "achievements" in newly_extracted_keys:
                ack_parts.append("Great achievements noted!")
            if "specific_examples" in newly_extracted_keys:
                ack_parts.append("Those specific examples are gold for an LOR!")
        
        # If nothing meaningful was extracted but message had content
        if not ack_parts and len(newly_extracted_keys) == 0:
            ack_parts.append("Thanks for sharing!")
        
        acknowledgment = " ".join(ack_parts) if ack_parts else ""
        
        if ready:
            # Ready to generate
            parts = []
            if acknowledgment:
                parts.append(acknowledgment)
            parts.append("\n\nI now have enough information to draft the Letter of Recommendation!")
            
            # Show what we captured
            captured = []
            if student_name:
                captured.append(f"Student: {student_name}")
            if recommender_name:
                captured.append(f"From: {recommender_name}")
            if relationship:
                captured.append(f"Relationship: {relationship}")
            if skills:
                captured.append(f"Key skills: {', '.join(skills[:3])}")
            
            if captured:
                parts.append(f"\n\n**Summary:** {'; '.join(captured[:4])}")
            
            parts.append('\n\nSay **"Generate LOR"** when you\'re ready, or add more details about the student!')
            return "".join(parts)
        
        elif missing_critical:
            # Need critical info
            parts = []
            if acknowledgment:
                parts.append(acknowledgment + "\n\n")
            
            if "student_name" in missing_critical and "recommender_name" in missing_critical:
                parts.append("To create this LOR, I need to know:\n")
                parts.append("- **Who is the student?** (name and role)\n")
                parts.append("- **Who is the recommender?** (your name and position)")
            elif "student_name" in missing_critical:
                parts.append("What is the **student's name** and their role when you knew them?")
            elif "recommender_name" in missing_critical:
                parts.append("What is **your name and position** as the recommender?")
            elif "relationship" in missing_critical:
                parts.append("How do you know this student? (professor, supervisor, mentor, etc.)")
            
            return "".join(parts)
        
        else:
            # Have critical info but missing important content
            parts = []
            if acknowledgment:
                parts.append(acknowledgment + "\n\n")
            
            # Ask for what's missing
            missing_important = []
            if not skills:
                missing_important.append("specific skills you've observed")
            if not achievements:
                missing_important.append("achievements or accomplishments")
            if not data.get("specific_examples"):
                missing_important.append("specific examples or anecdotes")
            
            if missing_important:
                if student_name:
                    parts.append(f"To write a compelling LOR for {student_name}, please share ")
                else:
                    parts.append("Please share ")
                parts.append(f"**{missing_important[0]}**.")
                if len(missing_important) > 1:
                    parts.append(f"\n\nI'll also need: {', '.join(missing_important[1:])}")
            else:
                parts.append("Is there anything else unique about this student that should be highlighted?")
            
            return "".join(parts)

    def update_state_with_extracted_info(
        self, state: DocumentBuilderState, extracted_info: Dict[str, Any]
    ) -> DocumentBuilderState:
        """Update the state's LOR data with extracted information."""
        if not state.lor_data:
            state.lor_data = LORCollectedData()

        for field, value in extracted_info.items():
            if field == "perspective":
                state.lor_data.perspective = value
            elif field == "skills_observed":
                current = state.lor_data.skills_observed or []
                if isinstance(value, list):
                    state.lor_data.skills_observed = list(set(current + value))
                else:
                    if isinstance(value, str):
                        new_skills = [s.strip() for s in value.split(",") if s.strip()]
                        state.lor_data.skills_observed = list(set(current + new_skills))
            else:
                current_value = getattr(state.lor_data, field, None)
                if (
                    current_value
                    and isinstance(current_value, str)
                    and isinstance(value, str)
                ):
                    setattr(state.lor_data, field, f"{current_value}\n\n{value}")
                else:
                    setattr(state.lor_data, field, value)

        # Update completion percentage
        state.completion_percentage = state.lor_data.get_completion_percentage()

        return state

    # ------------------------------------------------------------------
    # Question selection
    # ------------------------------------------------------------------
    def get_next_question(
        self, state: DocumentBuilderState, topic: Optional[str] = None
    ) -> str:
        if topic is None and state.lor_data:
            # First check if we know the perspective
            if (
                not state.lor_data.perspective
                or state.lor_data.perspective == "unknown"
            ):
                return self.collection_prompts.get("initial_greeting", "")

            missing = state.lor_data.get_missing_critical_fields()
            if missing:
                topic = missing[0]
            else:
                missing = state.lor_data.get_missing_important_fields()
                if missing:
                    topic = missing[0]

        # Map field to conversation topic
        prompt_key = FIELD_TO_TOPIC.get(topic, topic)

        if prompt_key in self.collection_prompts:
            template = self.collection_prompts[prompt_key]
            return self._fill_lor_context(template, state)

        # Fallback generic question
        return f"Could you tell me about the {str(topic).replace('_', ' ')}?"

    # ------------------------------------------------------------------
    # Formatting helpers
    # ------------------------------------------------------------------
    def format_document_for_editor(self, document: GeneratedDocument) -> Dict[str, Any]:
        """Override base formatting to avoid per-section headings for LOR.

        The editor will show the title followed by continuous paragraphs built
        from the letter plain_text.
        """
        import re
        
        editor_content: Dict[str, Any] = {
            "type": "doc",
            "content": [],
        }

        # Title as a single H1 node with center alignment.
        editor_content["content"].append(
            {
                "type": "heading",
                "attrs": {"level": 1, "textAlign": "center", "lineHeight": "1.5"},
                "content": [{"type": "text", "text": document.title}],
            }
        )

        body = document.plain_text or "\n\n".join(
            section.content_markdown for section in document.sections
        )
        
        # Normalize the text to fix single-line sentence breaks:
        # 1. First, preserve intentional paragraph breaks (2+ newlines) with a placeholder
        normalized = re.sub(r'\n{2,}', '\n\n', body.strip())
        # 2. Replace single newlines with spaces (sentences on separate lines -> one paragraph)
        normalized = re.sub(r'(?<!\n)\n(?!\n)', ' ', normalized)
        # 3. Clean up multiple spaces
        normalized = re.sub(r' {2,}', ' ', normalized)
        
        # Split into paragraphs by double newlines
        paragraphs = [p.strip() for p in normalized.split("\n\n") if p.strip()]

        for para in paragraphs:
            editor_content["content"].append(
                {
                    "type": "paragraph",
                    "attrs": {"textAlign": "justify", "lineHeight": "1.5"},
                    "content": [{"type": "text", "text": para}],
                }
            )

        return editor_content

    def _lor_to_html(self, document: GeneratedDocument) -> str:
        """Render LOR as a title plus continuous paragraphs (no headings)."""
        import markdown

        body = document.plain_text or "\n\n".join(
            section.content_markdown for section in document.sections
        )
        body_html = markdown.markdown(body)

        return f"<h1>{document.title}</h1>" + body_html

    def _fill_lor_context(self, template: str, state: DocumentBuilderState) -> str:
        """Fill LOR-specific context into template."""
        if not state.lor_data:
            return template

        context = {
            "recommender_name": state.lor_data.recommender_name or "[recommender]",
            "recommender_title": state.lor_data.recommender_title or "",
            "student_name": state.lor_data.student_name or "[student]",
            "relationship": state.lor_data.relationship or "your relationship",
            "duration": state.lor_data.association_duration or "the duration",
            "program": state.lor_data.target_program or "[target program]",
            "university": state.lor_data.target_university or "[target university]",
            "strength": state.lor_data.strength.value
            if state.lor_data.strength
            else "strong",
            "context": f" for {state.lor_data.target_program}"
            if state.lor_data.target_program
            else "",
        }

        # Build highlights summary for final check
        highlights: List[str] = []
        if state.lor_data.skills_observed:
            highlights.append(
                f"- Skills: {', '.join(state.lor_data.skills_observed[:5])}"
            )
        if state.lor_data.achievements:
            highlights.append(
                f"- Achievements: {state.lor_data.achievements[:100]}..."
            )
        if state.lor_data.character_traits:
            highlights.append(
                f"- Character: {state.lor_data.character_traits[:100]}..."
            )
        context["highlights_summary"] = (
            "\n".join(highlights) if highlights else "Key observations"
        )

        try:
            return template.format(**context)
        except KeyError as e:
            self.logger.debug(f"Missing template key: {e}")
            return template

    # ------------------------------------------------------------------
    # Generation and refinement
    # ------------------------------------------------------------------
    async def generate_document(
        self, state: DocumentBuilderState
    ) -> GeneratedDocument:
        """Generate the LOR using collected data."""
        if not state.lor_data:
            raise ValueError("No LOR data collected")

        data = state.lor_data

        # Try to get style context from examples
        style_context = await self._get_style_context(data)

        # Build generation data
        generation_data = {
            "recommender_name": data.recommender_name or "Not specified",
            "recommender_title": data.recommender_title or "Not specified",
            "organization": data.recommender_organization or "",
            "relationship": data.relationship or "Not specified",
            "duration": data.association_duration or "Not specified",
            "student_name": data.student_name or "the student",
            "student_role": data.student_role or "student",
            "supervision_duration": data.association_duration or "N/A",
            "skills_observed": ", ".join(data.skills_observed)
            if data.skills_observed
            else "Not specified",
            "achievements": data.achievements or "Not specified",
            "character_traits": data.character_traits or "Not specified",
            "peer_comparison": data.peer_comparison or "Not provided",
            "examples": data.specific_examples or "Not provided",
            "target_program": data.target_program or "Not specified",
            "target_university": data.target_university or "Not specified",
            "target_country": data.target_country or "",
            "tone": data.tone or "professional",
            "strength": data.strength.value if data.strength else "strong",
            "word_limit": data.word_limit or 800,
            "style_context": style_context,
        }

        prompt = self.generation_prompt.format(**generation_data)

        try:
            response = self._invoke_with_fallback([
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=prompt),
            ])

            result = self._extract_json(response.content)

            # --- Sanitize text to prevent invisible/control characters ---
            def _sanitize(text: str) -> str:
                if not isinstance(text, str):
                    return text
                # Remove zero-width and BOM characters and normalize spaces
                bad_chars = [
                    "\u200B",  # zero-width space
                    "\u200C",  # zero-width non-joiner
                    "\u200D",  # zero-width joiner
                    "\uFEFF",  # BOM
                ]
                for ch in bad_chars:
                    text = text.replace(ch, "")
                # Replace non-breaking space with regular space
                text = text.replace("\u00A0", " ")
                # Remove other control characters except newline and tab
                text = "".join(
                    c for c in text
                    if (ord(c) >= 32 or c in "\n\t")
                )
                # Collapse excess whitespace that may confuse renderers
                return " ".join(text.split())

            # Sanitize plain_text and sections
            if "plain_text" in result and isinstance(result["plain_text"], str):
                result["plain_text"] = _sanitize(result["plain_text"]) 

            if "sections" in result and isinstance(result["sections"], list):
                for s in result["sections"]:
                    if isinstance(s, dict) and "content_markdown" in s and isinstance(s["content_markdown"], str):
                        s["content_markdown"] = _sanitize(s["content_markdown"]) 

            # Build GeneratedDocument
            sections = [
                DocumentSection(
                    heading=s.get("heading", "Section"),
                    content_markdown=s.get("content_markdown", ""),
                )
                for s in result.get("sections", [])
            ]

            document = GeneratedDocument(
                document_id=str(uuid.uuid4()),
                document_type=DocumentType.LOR,
                title=result.get(
                    "title",
                    f"Letter of Recommendation for {data.student_name}",
                ),
                sections=sections,
                plain_text=result.get("plain_text", ""),
                word_count=result.get("word_count", 0),
                target_program=data.target_program,
                target_university=data.target_university,
            )

            # Add editor and HTML formats
            document.editor_json = self.format_document_for_editor(document)
            document.html = self.sections_to_html(sections, document.title)

            return document

        except Exception as e:
            self.logger.error(f"LOR generation failed: {e}")
            raise

    async def _get_style_context(self, data: LORCollectedData) -> str:
        """Get style context from similar successful LORs using embeddings."""
        style_parts: List[str] = []

        # Build query from available data
        query = (
            f"{data.target_program or ''} {data.target_university or ''} {data.target_country or ''} recommendation letter".strip()
        )
        if not query or query == "recommendation letter":
            query = "graduate program letter of recommendation"

        # 1. Get style profile (aggregated style features)
        try:
            from app.services.style_retrieval import get_style_profile

            style_profile = get_style_profile("lor", query=query, k=8)

            if style_profile and style_profile.get("source_chunks", 0) > 0:
                style_parts.append("**Style Profile from Similar LORs:**")
                style_parts.append(
                    f"- Average sentence length: {style_profile.get('avg_sentence_length', 18)} words"
                )
                style_parts.append(
                    f"- Average paragraph length: {style_profile.get('avg_paragraph_length', 120)} words"
                )

                if style_profile.get("common_headings"):
                    style_parts.append(
                        f"- Common section structure: {', '.join(style_profile['common_headings'][:5])}"
                    )

                if style_profile.get("opening_phrases"):
                    style_parts.append(
                        f"- Effective opening phrases: {', '.join(style_profile['opening_phrases'][:3])}"
                    )

                if style_profile.get("closing_phrases"):
                    style_parts.append(
                        f"- Strong closing phrases: {', '.join(style_profile['closing_phrases'][:3])}"
                    )

                if style_profile.get("tone_indicators"):
                    style_parts.append(
                        f"- Tone indicators to use: {', '.join(style_profile['tone_indicators'][:5])}"
                    )

                if style_profile.get("recommended_structure"):
                    style_parts.append(
                        f"- Recommended structure: {' → '.join(style_profile['recommended_structure'])}"
                    )

                self.logger.info(
                    f"Retrieved style profile from {style_profile.get('source_chunks', 0)} example chunks"
                )

        except ImportError:
            self.logger.debug("Style retrieval service not available")
        except Exception as e:
            self.logger.warning(f"Failed to get style profile: {e}")

        # 2. Get specific example chunks using hybrid retrieval
        try:
            from app.SOP_Generator.db import get_lor_style_context

            example_chunks = get_lor_style_context(
                country=(data.target_country or "").lower() or None,
                subject=(data.target_program or "").lower() or None,
                collection_name="lor_examples",
            )

            if example_chunks:
                style_parts.append("\n**Example Excerpts from Similar LORs:**")
                for i, chunk in enumerate(example_chunks[:3], 1):
                    preview = chunk.get("text_preview", "")[:300]
                    if preview:
                        style_parts.append(f"{i}. \"{preview}...\"")

                self.logger.info(
                    f"Retrieved {len(example_chunks)} example chunks for style context"
                )

        except ImportError:
            self.logger.debug("SOP_Generator db module not available")
        except Exception as e:
            self.logger.warning(f"Failed to get example chunks: {e}")

        # 3. Fallback to basic retrieval if hybrid failed
        if not style_parts:
            try:
                from app.SOP_Generator.db import get_relevant_chunks

                chunks = get_relevant_chunks(query, k=5, collection_name="lor_examples")
                if chunks:
                    style_parts.append("**Reference Examples:**")
                    for chunk in chunks[:3]:
                        preview = chunk.get("text_preview", "")[:250]
                        if preview:
                            style_parts.append(f"- \"{preview}...\"")

            except Exception as e:
                self.logger.debug(f"Basic retrieval also failed: {e}")

        if style_parts:
            return "\n".join(style_parts)

        return "No style context available - use general best practices for LORs."

    async def refine_section(
        self,
        state: DocumentBuilderState,
        section_heading: str,
        feedback: str,
    ) -> DocumentSection:
        """Refine a specific section based on user feedback."""
        if not state.draft:
            raise ValueError("No draft to refine")

        # Find the section
        current_section: Optional[DocumentSection] = None
        for section in state.draft.sections:
            if section.heading.lower() == section_heading.lower():
                current_section = section
                break

        if not current_section:
            raise ValueError(f"Section '{section_heading}' not found in draft")

        refinement_prompt = f"""
Refine this Letter of Recommendation section based on user feedback.

**Current Section ({current_section.heading}):**
{current_section.content_markdown}

**User Feedback:**
{feedback}

**Context:**
- For: {state.lor_data.student_name if state.lor_data else "the student"}
- Recommender: {state.lor_data.recommender_name if state.lor_data else "N/A"}
- Recommendation Strength: {state.lor_data.strength.value if state.lor_data and state.lor_data.strength else "strong"}

**Instructions:**
1. Address the user's specific feedback
2. Maintain the professional/academic tone
3. Keep the same approximate length unless asked to change
4. Ensure it sounds like it's written by the recommender

Return only the refined section content (no JSON, no heading).
"""

        try:
            response = self._invoke_with_fallback([
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=refinement_prompt),
            ])

            refined_content = response.content.strip()

            return DocumentSection(
                heading=current_section.heading,
                content_markdown=refined_content,
            )

        except Exception as e:
            self.logger.error(f"Section refinement failed: {e}")
            raise

    def get_generation_summary(self, document: GeneratedDocument) -> str:
        """Generate a summary to present with the draft."""
        summary_parts = [
            f"**{document.title}**\n",
            f"��� Word Count: {document.word_count} words\n",
            f"��� Sections: {len(document.sections)}\n",
        ]

        summary_parts.append("\n**Sections:**")
        for section in document.sections:
            summary_parts.append(f"  • {section.heading}")

        summary_parts.append("\n\n**What would you like to do?**")
        summary_parts.append("1. Review and edit in the document editor")
        summary_parts.append("2. Adjust the recommendation strength")
        summary_parts.append("3. Add more specific examples")
        summary_parts.append("4. Save and export")

        return "\n".join(summary_parts)

    # ------------------------------------------------------------------
    # Utility
    # ------------------------------------------------------------------
    def determine_perspective(self, message: str) -> str:
        """Determine if the user is the recommender or student."""
        recommender_indicators = [
            "i am the",
            "as their professor",
            "as his/her",
            "my student",
            "i supervised",
            "i taught",
            "worked under me",
            "in my lab",
            "i recommend",
            "recommending",
        ]

        student_indicators = [
            "my professor",
            "my supervisor",
            "my mentor",
            "asked my",
            "for my recommender",
            "my lor",
            "letter for me",
            "preparing a draft",
            "on behalf of",
        ]

        message_lower = message.lower()

        recommender_score = sum(
            1 for ind in recommender_indicators if ind in message_lower
        )
        student_score = sum(1 for ind in student_indicators if ind in message_lower)

        if recommender_score > student_score:
            return "recommender"
        if student_score > recommender_score:
            return "student"
        return "unknown"

