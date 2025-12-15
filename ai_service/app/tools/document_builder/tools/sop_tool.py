"""
SOP Tool

Tool for generating Statements of Purpose through conversational interaction.
Handles information collection, validation, and SOP generation.
"""

import json
import uuid
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from .base_document_tool import BaseDocumentTool
from ..state import (
    DocumentBuilderState,
    DocumentType,
    SOPCollectedData,
    GeneratedDocument,
    DocumentSection,
    SOP_REQUIRED_FIELDS,
)
from ..prompts import (
    SOP_SYSTEM_PROMPT,
    SOP_INTENT_ANALYSIS_PROMPT,
    SOP_COLLECTION_PROMPTS,
    SOP_GENERATION_PROMPT,
    SOP_REFINEMENT_PROMPT,
)

logger = logging.getLogger(__name__)


# Field to question topic mapping for natural conversation
FIELD_TO_TOPIC = {
    "target_program": "initial_greeting",
    # After we've discussed the program, ask a more focused
    # follow-up specifically about target universities.
    "target_university": "target_university_followup",
    "educational_background": "background",
    "gpa": "background",
    "relevant_experience": "experience",
    "research_experience": "research_deep_dive",
    "career_goals": "goals",
    "why_this_program": "why_program",
    "why_this_university": "why_program",
    "personal_story": "personal_story",
}


class SOPTool(BaseDocumentTool):
    """
    Tool for creating Statements of Purpose through conversation.
    
    Features:
    - Natural language information extraction
    - Progressive data collection
    - Style-aware generation
    - Iterative refinement support
    """

    def __init__(self, llm: ChatGoogleGenerativeAI):
        super().__init__(llm, DocumentType.SOP)

    @property
    def system_prompt(self) -> str:
        return SOP_SYSTEM_PROMPT

    @property
    def intent_analysis_prompt(self) -> str:
        return SOP_INTENT_ANALYSIS_PROMPT

    @property
    def collection_prompts(self) -> Dict[str, str]:
        return SOP_COLLECTION_PROMPTS

    @property
    def generation_prompt(self) -> str:
        return SOP_GENERATION_PROMPT

    def get_required_fields(self) -> Dict[str, List[str]]:
        return SOP_REQUIRED_FIELDS

    async def _get_attachment_text(self, state: DocumentBuilderState) -> str:
        """Aggregate raw text from any uploaded attachments for this SOP session.

        This mirrors the attachment handling used for LOR and supports both:
        - Files stored via the SOP_Generator storage service
        - Documents ingested through the central Document AI pipeline

        The aggregated text is used as extra context when extracting
        structured SOP information so we can infer things like target
        program/university or background details directly from a CV or
        transcript before asking the user.
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

                # 1) Try new centralized UserFile collection (MongoDB + ChromaDB)
                try:
                    from app.database.mongodb import get_mongodb_client
                    mongodb = await get_mongodb_client()
                    user_files_collection = mongodb.get_database().user_files
                    
                    user_file = await user_files_collection.find_one({
                        "fileId": file_id,
                        "userId": state.user_id,
                    })
                    
                    if user_file:
                        logger.info(f"Found UserFile {file_id}: status={user_file.get('processingStatus')}, hasText={bool(user_file.get('extractedText'))}")
                        if user_file.get("extractedText"):
                            text = user_file["extractedText"]
                            logger.info(f"Loaded {len(text)} chars from UserFile {file_id}")
                        else:
                            logger.warning(f"UserFile {file_id} found but no extractedText yet (status: {user_file.get('processingStatus')})")
                    else:
                        logger.debug(f"UserFile {file_id} not found in collection")
                except Exception as e:
                    logger.error(f"UserFile lookup failed for {file_id}: {e}")
                    text = ""

                # 2) Try SOP_Generator file store (legacy system)
                if not text:
                    try:
                        text = storage.get_file_text(file_id, state.user_id) or ""
                    except Exception:
                        text = ""

                # 3) If nothing found, fall back to Document AI documents
                if not text:
                    try:
                        doc = await docs_collection.find_one({
                            "document_id": file_id,
                            "user_id": state.user_id,
                        })
                        if doc and doc.get("file_path"):
                            file_path = doc["file_path"]
                            try:
                                text, _ = await doc_processor.process_document(file_path)
                            except Exception:
                                text = ""
                    except Exception:
                        text = ""

                if not text:
                    logger.warning(f"No text found for attachment {file_id}")
                    continue

                snippet = text.strip().replace("\n", " ")[:2000]
                collected_chunks.append(snippet)

            if not collected_chunks:
                return ""

            combined = "\n\n".join(collected_chunks)
            return combined[:8000]

        except Exception:
            return ""

    async def extract_info_from_message(
        self, message: str, state: DocumentBuilderState
    ) -> Dict[str, Any]:
        """
        Extract SOP-relevant information from user's message.
        
        Uses LLM to understand context and extract:
        - Program/university mentions
        - Background information
        - Experience details
        - Goals and motivations

        In addition to the user's message, this function also looks at any
        uploaded attachments (CVs, transcripts, etc.) attached to the
        current session so it can infer as much as possible before asking
        follow-up questions.
        """
        attachment_context = await self._get_attachment_text(state)

        extraction_prompt = f"""
Analyze the following message and extract any information relevant to a Statement of Purpose.

User Message:
\"\"\"{message}\"\"\"

Attachment Context (from uploaded files, if any):
{attachment_context or "(no attachment text available)"}

Current Context:
- Current topic being discussed: {state.current_topic or "general"}
- Fields already collected: {state.sop_data.get_filled_fields() if state.sop_data else []}

Extract and return a JSON object with the following structure. Only include fields where you found relevant information:

{{
    "target_program": "program name if mentioned",
    "target_university": "university name if mentioned",
    "target_country": "country if mentioned",
    "degree_level": "MS/PhD/MBA/etc if mentioned",
    "educational_background": "education details if shared",
    "gpa": "GPA/grades if mentioned",
    "major_courses": "relevant courses if mentioned",
    "academic_achievements": "academic awards/honors if mentioned",
    "relevant_experience": "work/project experience if shared",
    "research_experience": "research experience if mentioned",
    "projects": "specific projects if mentioned",
    "internships": "internships if mentioned",
    "publications": "publications if mentioned",
    "career_goals": "career goals/aspirations if shared",
    "why_this_program": "motivation for this program if explained",
    "why_this_university": "reasons for choosing university if explained",
    "personal_story": "personal anecdotes/story if shared",
    "awards": "non-academic awards if mentioned",
    "test_scores": "GRE/TOEFL/IELTS scores if mentioned"
}}

Only include fields where the user actually provided information. Use null for fields not mentioned.
Return valid JSON only.
"""
        try:
            response = self._invoke_with_fallback([
                SystemMessage(content="You are an information extraction assistant. Extract structured data from text."),
                HumanMessage(content=extraction_prompt),
            ])
            
            extracted = self._extract_json(response.content)
            
            # Filter out null values
            return {k: v for k, v in extracted.items() if v is not None and v != ""}
            
        except Exception as e:
            self.logger.error(f"Info extraction failed: {e}")
            return {}

    def update_state_with_extracted_info(
        self, state: DocumentBuilderState, extracted_info: Dict[str, Any]
    ) -> DocumentBuilderState:
        """Update the state's SOP data with extracted information."""
        if not state.sop_data:
            state.sop_data = SOPCollectedData()
        
        for field, value in extracted_info.items():
            if hasattr(state.sop_data, field) and value:
                current_value = getattr(state.sop_data, field)
                if current_value:
                    # Append to existing value
                    setattr(state.sop_data, field, f"{current_value}\n\n{value}")
                else:
                    setattr(state.sop_data, field, value)
        
        # Update completion percentage
        state.completion_percentage = state.sop_data.get_completion_percentage()
        
        return state

    def get_next_question(
        self, state: DocumentBuilderState, topic: Optional[str] = None
    ) -> str:
        """Get the next question to ask, with SOP-specific context filling."""
        if topic is None and state.sop_data:
            missing = state.sop_data.get_missing_critical_fields()
            if missing:
                topic = missing[0]
            else:
                missing = state.sop_data.get_missing_important_fields()
                if missing:
                    topic = missing[0]
        
        # Map field to conversation topic
        prompt_key = FIELD_TO_TOPIC.get(topic, topic)
        
        if prompt_key in self.collection_prompts:
            template = self.collection_prompts[prompt_key]
            return self._fill_sop_context(template, state)
        
        # Fallback generic question
        return f"Could you tell me about your {topic.replace('_', ' ')}?"

    def _fill_sop_context(self, template: str, state: DocumentBuilderState) -> str:
        """Fill SOP-specific context into template."""
        if not state.sop_data:
            return template
        
        context = {
            "program": state.sop_data.target_program or "[your target program]",
            "university": state.sop_data.target_university or "[your target university]",
            "country": state.sop_data.target_country or "",
            "degree_level": state.sop_data.degree_level or "",
            "field_of_study": state.sop_data.target_program or "your field",
            "tone": state.sop_data.tone.value if state.sop_data.tone else "balanced",
            "word_limit": state.sop_data.word_limit or 1000,
            "university_context": f" for {state.sop_data.target_university}" if state.sop_data.target_university else "",
        }
        
        # Build highlights summary for final check
        highlights = []
        if state.sop_data.educational_background:
            highlights.append(f"- Education: {state.sop_data.educational_background[:100]}...")
        if state.sop_data.relevant_experience:
            highlights.append(f"- Experience: {state.sop_data.relevant_experience[:100]}...")
        if state.sop_data.career_goals:
            highlights.append(f"- Goals: {state.sop_data.career_goals[:100]}...")
        context["highlights_summary"] = "\n".join(highlights) if highlights else "Your background and goals"
        
        try:
            return template.format(**context)
        except KeyError as e:
            self.logger.debug(f"Missing template key: {e}")
            return template

    async def generate_document(
        self, state: DocumentBuilderState
    ) -> GeneratedDocument:
        """
        Generate the SOP using collected data.
        
        Returns a structured GeneratedDocument with sections, plain text, and metadata.
        """
        if not state.sop_data:
            raise ValueError("No SOP data collected")
        
        data = state.sop_data
        
        # Try to get style context from examples (if available) and enrich
        # it with key information extracted from the user's uploaded files.
        style_context = await self._get_style_context(state)
        
        # Build generation prompt
        generation_data = {
            "program": data.target_program or "Not specified",
            "university": data.target_university or "Not specified",
            "country": data.target_country or "Not specified",
            "degree_level": data.degree_level or "Graduate",
            "about": data.educational_background or "",
            "background": self._compile_background(data),
            "experience": self._compile_experience(data),
            "research": data.research_experience or "No research experience shared",
            "goals": data.career_goals or "",
            "personal_notes": data.personal_story or "",
            "tone": data.tone.value if data.tone else "balanced",
            "word_limit": data.word_limit or 1000,
            "special_instructions": data.special_instructions or "None",
            "style_context": style_context,
            "attachment_context": await self._get_attachment_context(state),
        }
        
        prompt = self.generation_prompt.format(**generation_data)

        try:
            response = self._invoke_with_fallback([
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=prompt),
            ])

            result = self._extract_json(response.content)

            # Prefer a single continuous body of text for the SOP.
            plain_text = result.get("plain_text") or ""
            if not plain_text:
                plain_text = "\n\n".join(
                    s.get("content_markdown", "") for s in result.get("sections", [])
                ).strip()

            # Represent as a single logical section internally.
            sections = [
                DocumentSection(
                    heading="Body",
                    content_markdown=plain_text,
                )
            ]

            document = GeneratedDocument(
                document_id=str(uuid.uuid4()),
                document_type=DocumentType.SOP,
                title=result.get("title", f"Statement of Purpose for {data.target_program}"),
                sections=sections,
                plain_text=plain_text,
                word_count=result.get("word_count", 0),
                target_program=data.target_program,
                target_university=data.target_university,
                key_strengths_highlighted=result.get("key_strengths_highlighted", []),
                suggestions_for_improvement=result.get("suggestions_for_improvement", []),
            )

            # Editor and HTML representations without per-section headings.
            document.editor_json = self.format_document_for_editor(document)
            document.html = self._sop_to_html(document)

            return document
            
        except Exception as e:
            self.logger.error(f"SOP generation failed: {e}")
            raise

    def _compile_background(self, data: SOPCollectedData) -> str:
        """Compile all background information into a single string."""
        parts = []
        if data.educational_background:
            parts.append(f"Education: {data.educational_background}")
        if data.gpa:
            parts.append(f"GPA/Grades: {data.gpa}")
        if data.major_courses:
            parts.append(f"Key Courses: {data.major_courses}")
        if data.academic_achievements:
            parts.append(f"Academic Achievements: {data.academic_achievements}")
        if data.test_scores:
            parts.append(f"Test Scores: {data.test_scores}")
        
        return "\n".join(parts) if parts else "Not provided"

    def _compile_experience(self, data: SOPCollectedData) -> str:
        """Compile all experience information into a single string."""
        parts = []
        if data.relevant_experience:
            parts.append(f"Work/Project Experience: {data.relevant_experience}")
        if data.projects:
            parts.append(f"Notable Projects: {data.projects}")
        if data.internships:
            parts.append(f"Internships: {data.internships}")
        if data.publications:
            parts.append(f"Publications: {data.publications}")
        if data.awards:
            parts.append(f"Awards: {data.awards}")
        
        return "\n".join(parts) if parts else "Not provided"

    async def _get_style_context(self, state: DocumentBuilderState) -> str:
        """
        Get style context from similar successful SOPs using pre-stored embeddings.
        
        Uses multiple retrieval strategies:
        1. Style profile aggregation (tone, structure, common phrases)
        2. Example chunks retrieval using hybrid search (country + field filters)
        """
        data = state.sop_data or SOPCollectedData()

        style_parts = []
        
        # Build query from available data
        query = f"{data.target_program or ''} {data.target_university or ''} {data.target_country or ''}".strip()
        if not query:
            query = "graduate program statement of purpose"
        
        # 1. Get style profile (aggregated style features)
        try:
            from app.services.style_retrieval import get_style_profile
            
            style_profile = get_style_profile("sop", query=query, k=8)
            
            if style_profile and style_profile.get("source_chunks", 0) > 0:
                style_parts.append("**Style Profile from Similar SOPs:**")
                style_parts.append(f"- Average sentence length: {style_profile.get('avg_sentence_length', 15)} words")
                style_parts.append(f"- Average paragraph length: {style_profile.get('avg_paragraph_length', 100)} words")
                
                if style_profile.get("common_headings"):
                    style_parts.append(f"- Common section headings: {', '.join(style_profile['common_headings'][:5])}")
                
                if style_profile.get("opening_phrases"):
                    style_parts.append(f"- Effective opening phrases: {', '.join(style_profile['opening_phrases'][:3])}")
                
                if style_profile.get("tone_indicators"):
                    style_parts.append(f"- Tone indicators to use: {', '.join(style_profile['tone_indicators'][:5])}")
                
                if style_profile.get("recommended_structure"):
                    style_parts.append(f"- Recommended structure: {' → '.join(style_profile['recommended_structure'])}")
                
                self.logger.info(f"Retrieved style profile from {style_profile.get('source_chunks', 0)} example chunks")
                
        except ImportError:
            self.logger.debug("Style retrieval service not available")
        except Exception as e:
            self.logger.warning(f"Failed to get style profile: {e}")
        
        # 2. Get specific example chunks using hybrid retrieval
        try:
            from app.SOP_Generator.db import get_sop_style_context
            
            example_chunks = get_sop_style_context(
                country=(data.target_country or "").lower() or None,
                subject=(data.target_program or "").lower() or None,
                collection_name="sop_examples",
            )
            
            if example_chunks:
                style_parts.append("\n**Example Excerpts from Similar SOPs:**")
                for i, chunk in enumerate(example_chunks[:3], 1):
                    preview = chunk.get("text_preview", "")[:300]
                    if preview:
                        style_parts.append(f"{i}. \"{preview}...\"")
                
                self.logger.info(f"Retrieved {len(example_chunks)} example chunks for style context")
                
        except ImportError:
            self.logger.debug("SOP_Generator db module not available")
        except Exception as e:
            self.logger.warning(f"Failed to get example chunks: {e}")
        
        # 3. Fallback to basic retrieval if hybrid failed
        if not style_parts:
            try:
                from app.SOP_Generator.db import get_relevant_chunks
                
                chunks = get_relevant_chunks(query, k=5, collection_name="sop_examples")
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

        return "No style context available - use general best practices for SOPs."

    async def _get_attachment_context(self, state: DocumentBuilderState) -> str:
        """Build context string from any uploaded files attached to this session.

        This now supports both:
        - SOP/LOR uploads stored via the SOP_Generator storage service
        - Documents ingested through the central Document AI pipeline

        For each attachment ID we first try to read from the SOP_Generator
        files collection; if nothing is found, we fall back to the Document
        AI documents metadata and re-extract text from the stored file path.
        """
        if not getattr(state, "attachments", None):
            return "No additional documents were provided. Focus on the chat information only."

        try:
            from app.SOP_Generator.services import storage as storage_module
            from app.SOP_Generator import db as db_module
            from app.database.mongodb import get_documents_collection
            from app.services import DocumentProcessor

            db_client = db_module.DatabaseClient()
            storage = storage_module.StorageService(db_client.get_files_collection())

            docs_collection = get_documents_collection()
            doc_processor = DocumentProcessor()

            snippets: List[str] = []
            for file_id in state.attachments:
                text: str = ""

                # 1) Try SOP_Generator file store (used by SOP/LOR and chat uploads)
                try:
                    text = storage.get_file_text(file_id, state.user_id) or ""
                except Exception:
                    text = ""

                # 2) If nothing found, fall back to Document AI documents
                if not text:
                    try:
                        from app.services.document_text_service import extract_document_text_for_user
                        text = await extract_document_text_for_user(user_id=state.user_id, document_id=file_id)
                    except Exception:
                        text = ""

                if not text:
                    continue

                snippet = text.strip().replace("\n", " ")[:600]
                snippets.append(f"File {file_id}: {snippet}...")

            if not snippets:
                return "Uploaded documents could not be read; rely on the chat details instead."

            header = (
                "The applicant has uploaded documents such as a CV, resume, "
                "and academic transcripts. Here are key excerpts you should "
                "implicitly leverage (do not quote verbatim, but use them to "
                "ground the SOP):\n"
            )
            return header + "\n".join(f"- {s}" for s in snippets)

        except Exception:
            return (
                "Uploaded documents are available but could not be loaded; "
                "rely on the chat details while still writing a grounded, "
                "specific SOP."
            )

    def format_document_for_editor(self, document: GeneratedDocument) -> Dict[str, Any]:
        """Override base formatting to avoid per-section headings for SOP.

        The editor will show the title followed by continuous paragraphs built
        from the SOP plain_text.
        """

        editor_content: Dict[str, Any] = {
            "type": "doc",
            "content": [],
        }

        # Title as a single H1 node.
        editor_content["content"].append(
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": document.title}],
            }
        )

        body = document.plain_text or "\n\n".join(
            section.content_markdown for section in document.sections
        )
        paragraphs = [p for p in body.split("\n\n") if p.strip()]

        for para in paragraphs:
            editor_content["content"].append(
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": para.strip()}],
                }
            )

        return editor_content

    def _sop_to_html(self, document: GeneratedDocument) -> str:
        """Render SOP as a title plus justified paragraphs without headings."""
        import markdown

        body = document.plain_text or "\n\n".join(
            section.content_markdown for section in document.sections
        )
        # Convert markdown to basic HTML, then wrap in a justified container.
        body_html = markdown.markdown(body)

        return (
            f"<h1>{document.title}</h1>"
            f"<div style='text-align: justify;'>{body_html}</div>"
        )

    async def refine_section(
        self,
        state: DocumentBuilderState,
        section_heading: str,
        feedback: str
    ) -> DocumentSection:
        """
        Refine a specific section based on user feedback.
        
        Args:
            state: Current document builder state (with draft)
            section_heading: Which section to refine
            feedback: User's feedback on what to change
            
        Returns:
            Refined DocumentSection
        """
        if not state.draft:
            raise ValueError("No draft to refine")
        
        # Find the section
        current_section = None
        for section in state.draft.sections:
            if section.heading.lower() == section_heading.lower():
                current_section = section
                break
        
        if not current_section:
            raise ValueError(f"Section '{section_heading}' not found in draft")
        
        # Build refinement prompt
        prompt = SOP_REFINEMENT_PROMPT.format(
            current_section=current_section.content_markdown,
            user_feedback=feedback,
            program=state.sop_data.target_program if state.sop_data else "N/A",
            university=state.sop_data.target_university if state.sop_data else "N/A",
            tone=state.sop_data.tone.value if state.sop_data and state.sop_data.tone else "balanced",
        )
        
        try:
            response = self._invoke_with_fallback([
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=prompt),
            ])
            
            refined_content = response.content.strip()
            
            return DocumentSection(
                heading=current_section.heading,
                content_markdown=refined_content
            )
            
        except Exception as e:
            self.logger.error(f"Section refinement failed: {e}")
            raise

    def get_generation_summary(self, document: GeneratedDocument) -> str:
        """
        Generate a summary to present with the draft.
        
        Returns a user-friendly summary of the generated SOP.
        """
        summary_parts = [
            f"**{document.title}**\n",
            f"📝 Word Count: {document.word_count} words\n",
            f"📚 Sections: {len(document.sections)}\n",
        ]
        
        if document.key_strengths_highlighted:
            summary_parts.append("\n**Key Strengths Highlighted:**")
            for strength in document.key_strengths_highlighted[:5]:
                summary_parts.append(f"  ✓ {strength}")
        
        if document.suggestions_for_improvement:
            summary_parts.append("\n**Suggestions for Improvement:**")
            for suggestion in document.suggestions_for_improvement[:3]:
                summary_parts.append(f"  💡 {suggestion}")
        
        summary_parts.append("\n\n**What would you like to do?**")
        summary_parts.append("1. Review and edit in the document editor")
        summary_parts.append("2. Refine a specific section")
        summary_parts.append("3. Adjust the tone or style")
        summary_parts.append("4. Save and export")
        
        return "\n".join(summary_parts)
