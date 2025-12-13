"""
LOR Tool

Tool for generating Letters of Recommendation through conversational interaction.
Handles information collection from recommender perspective and LOR generation.
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
    LORCollectedData,
    LORStrength,
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
FIELD_TO_TOPIC = {
    "recommender_name": "recommender_info",
    "recommender_title": "recommender_info",
    "recommender_organization": "recommender_info",
    "relationship": "recommender_info",
    "association_duration": "recommender_info",
    "student_name": "student_info",
    "student_role": "student_info",
    "target_program": "student_info",
    "target_university": "student_info",
    "skills_observed": "observations",
    "achievements": "observations",
    "character_traits": "observations",
    "specific_examples": "observations",
    "peer_comparison": "comparison",
    "strength": "strength_level",
}


class LORTool(BaseDocumentTool):
    """
    Tool for creating Letters of Recommendation through conversation.
    
    Features:
    - Support for recommender or student perspective
    - Natural language information extraction
    - Professional tone calibration
    - Strength-appropriate language
    """

    def __init__(self, llm: ChatGoogleGenerativeAI):
        super().__init__(llm, DocumentType.LOR)

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

    async def extract_info_from_message(
        self, message: str, state: DocumentBuilderState
    ) -> Dict[str, Any]:
        """
        Extract LOR-relevant information from user's message.
        
        Extracts:
        - Recommender details
        - Student information
        - Relationship context
        - Observations and achievements
        """
        extraction_prompt = f"""
Analyze the following message and extract any information relevant to a Letter of Recommendation.

User Message:
\"\"\"{message}\"\"\"

Current Context:
- Current topic being discussed: {state.current_topic or "general"}
- Perspective: {state.lor_data.perspective if state.lor_data else "unknown"}
- Fields already collected: {state.lor_data.get_filled_fields() if state.lor_data else []}

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
            
            # Filter out null values
            return {k: v for k, v in extracted.items() if v is not None and v != "" and v != []}
            
        except Exception as e:
            self.logger.error(f"Info extraction failed: {e}")
            return {}

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
                    # If it's a string, treat as comma-separated
                    if isinstance(value, str):
                        new_skills = [s.strip() for s in value.split(",") if s.strip()]
                        state.lor_data.skills_observed = list(set(current + new_skills))
            else:
                current_value = getattr(state.lor_data, field, None)
                if current_value and isinstance(current_value, str) and isinstance(value, str):
                    setattr(state.lor_data, field, f"{current_value}\n\n{value}")
                else:
                    setattr(state.lor_data, field, value)
        
        # Update completion percentage
        state.completion_percentage = state.lor_data.get_completion_percentage()
        
        return state

    def get_next_question(
        self, state: DocumentBuilderState, topic: Optional[str] = None
    ) -> str:
        if topic is None and state.lor_data:
            # First check if we know the perspective
            if not state.lor_data.perspective or state.lor_data.perspective == "unknown":
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
        return f"Could you tell me about the {topic.replace('_', ' ')}?"

    def format_document_for_editor(self, document: GeneratedDocument) -> Dict[str, Any]:
        """Override base formatting to avoid per-section headings for LOR.

        The editor will show the title followed by continuous paragraphs built
        from the letter plain_text.
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
            "strength": state.lor_data.strength.value if state.lor_data.strength else "strong",
            "context": f" for {state.lor_data.target_program}" if state.lor_data.target_program else "",
        }
        
        # Build highlights summary for final check
        highlights = []
        if state.lor_data.skills_observed:
            highlights.append(f"- Skills: {', '.join(state.lor_data.skills_observed[:5])}")
        if state.lor_data.achievements:
            highlights.append(f"- Achievements: {state.lor_data.achievements[:100]}...")
        if state.lor_data.character_traits:
            highlights.append(f"- Character: {state.lor_data.character_traits[:100]}...")
        context["highlights_summary"] = "\n".join(highlights) if highlights else "Key observations"
        
        try:
            return template.format(**context)
        except KeyError as e:
            self.logger.debug(f"Missing template key: {e}")
            return template

    async def generate_document(
        self, state: DocumentBuilderState
    ) -> GeneratedDocument:
        """
        Generate the LOR using collected data.
        
        Returns a structured GeneratedDocument with sections and metadata.
        """
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
            "skills_observed": ", ".join(data.skills_observed) if data.skills_observed else "Not specified",
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
            
            # Build GeneratedDocument
            sections = [
                DocumentSection(
                    heading=s.get("heading", "Section"),
                    content_markdown=s.get("content_markdown", "")
                )
                for s in result.get("sections", [])
            ]
            
            document = GeneratedDocument(
                document_id=str(uuid.uuid4()),
                document_type=DocumentType.LOR,
                title=result.get("title", f"Letter of Recommendation for {data.student_name}"),
                sections=sections,
                plain_text=result.get("plain_text", ""),
                word_count=result.get("word_count", 0),
                target_program=data.target_program,
                target_university=data.target_university,
            )
            
            # Add editor format
            document.editor_json = self.format_document_for_editor(document)
            document.html = self.sections_to_html(sections, document.title)
            
            return document
            
        except Exception as e:
            self.logger.error(f"LOR generation failed: {e}")
            raise

    async def _get_style_context(self, data: LORCollectedData) -> str:
        """
        Get style context from similar successful LORs using pre-stored embeddings.
        
        Uses multiple retrieval strategies:
        1. Style profile aggregation (tone, structure, common phrases)
        2. Example chunks retrieval using hybrid search (country + field filters)
        """
        style_parts = []
        
        # Build query from available data
        query = f"{data.target_program or ''} {data.target_university or ''} {data.target_country or ''} recommendation letter".strip()
        if not query or query == "recommendation letter":
            query = "graduate program letter of recommendation"
        
        # 1. Get style profile (aggregated style features)
        try:
            from app.services.style_retrieval import get_style_profile
            
            style_profile = get_style_profile("lor", query=query, k=8)
            
            if style_profile and style_profile.get("source_chunks", 0) > 0:
                style_parts.append("**Style Profile from Similar LORs:**")
                style_parts.append(f"- Average sentence length: {style_profile.get('avg_sentence_length', 18)} words")
                style_parts.append(f"- Average paragraph length: {style_profile.get('avg_paragraph_length', 120)} words")
                
                if style_profile.get("common_headings"):
                    style_parts.append(f"- Common section structure: {', '.join(style_profile['common_headings'][:5])}")
                
                if style_profile.get("opening_phrases"):
                    style_parts.append(f"- Effective opening phrases: {', '.join(style_profile['opening_phrases'][:3])}")
                
                if style_profile.get("closing_phrases"):
                    style_parts.append(f"- Strong closing phrases: {', '.join(style_profile['closing_phrases'][:3])}")
                
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
                
                self.logger.info(f"Retrieved {len(example_chunks)} example chunks for style context")
                
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
        feedback: str
    ) -> DocumentSection:
        """
        Refine a specific section based on user feedback.
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
                content_markdown=refined_content
            )
            
        except Exception as e:
            self.logger.error(f"Section refinement failed: {e}")
            raise

    def get_generation_summary(self, document: GeneratedDocument) -> str:
        """
        Generate a summary to present with the draft.
        """
        summary_parts = [
            f"**{document.title}**\n",
            f"📝 Word Count: {document.word_count} words\n",
            f"📚 Sections: {len(document.sections)}\n",
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

    def determine_perspective(self, message: str) -> str:
        """
        Determine if the user is the recommender or student based on their message.
        """
        recommender_indicators = [
            "i am the", "as their professor", "as his/her", "my student",
            "i supervised", "i taught", "worked under me", "in my lab",
            "i recommend", "recommending"
        ]
        
        student_indicators = [
            "my professor", "my supervisor", "my mentor", "asked my",
            "for my recommender", "my lor", "letter for me",
            "preparing a draft", "on behalf of"
        ]
        
        message_lower = message.lower()
        
        recommender_score = sum(1 for ind in recommender_indicators if ind in message_lower)
        student_score = sum(1 for ind in student_indicators if ind in message_lower)
        
        if recommender_score > student_score:
            return "recommender"
        elif student_score > recommender_score:
            return "student"
        else:
            return "unknown"
