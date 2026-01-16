"""Base Document Tool

Abstract base class for all document generation tools.
Provides common functionality for information extraction, validation, and
generation, including runtime LLM fallback when Gemini quota is exhausted.
"""

import json
import logging
import os
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple, Union

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

LLMType = Union[ChatGoogleGenerativeAI, ChatGroq]

from ..state import (
    DocumentBuilderState,
    DocumentType,
    ConversationPhase,
    ActionType,
    GeneratedDocument,
    DocumentSection,
)

logger = logging.getLogger(__name__)


class BaseDocumentTool(ABC):
    """
    Base class for document generation tools.
    
    Provides common functionality:
    - Intent analysis
    - Information extraction from user messages
    - Validation of collected data
    - Document generation coordination
    """

    def __init__(
        self,
        llm: LLMType,
        document_type: DocumentType,
    ):
        """
        Initialize the document tool.
        
        Args:
            llm: LangChain LLM instance for generation
            document_type: Type of document this tool handles
        """
        self.llm = llm
        self.document_type = document_type
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """Get the system prompt for this document type."""
        pass

    @property
    @abstractmethod
    def intent_analysis_prompt(self) -> str:
        """Get the intent analysis prompt template."""
        pass

    @property
    @abstractmethod
    def collection_prompts(self) -> Dict[str, str]:
        """Get the collection prompts for this document type."""
        pass

    @property
    @abstractmethod
    def generation_prompt(self) -> str:
        """Get the generation prompt template."""
        pass

    @abstractmethod
    def get_required_fields(self) -> Dict[str, List[str]]:
        """Get required fields organized by priority."""
        pass

    @abstractmethod
    def extract_info_from_message(
        self, message: str, state: DocumentBuilderState
    ) -> Dict[str, Any]:
        """Extract relevant information from user message."""
        pass

    @abstractmethod
    async def generate_document(
        self, state: DocumentBuilderState
    ) -> GeneratedDocument:
        """Generate the document using collected data."""
        pass

    async def analyze_intent(
        self, message: str, state: DocumentBuilderState
    ) -> Dict[str, Any]:
        """
        Analyze user intent from their message.
        
        Returns dict with:
        - intent: start_doc, provide_info, request_change, ask_question, confirm, other
        - extracted_info: any information extracted from message
        - next_action: what action to take next
        - next_question_topic: what to ask about next (if applicable)
        """
        try:
            # Build context from state
            state_context = self._build_state_context(state)
            
            prompt = self.intent_analysis_prompt.format(
                message=message,
                session_state=state_context
            )
            
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=prompt),
            ]

            response = self._invoke_with_fallback(messages)
            
            # Parse JSON response
            result = self._extract_json(response.content)
            return result
            
        except Exception as e:
            self.logger.error(f"Intent analysis failed: {e}")
            return {
                "intent": "other",
                "extracted_info": {},
                "next_action": "ask_question",
                "error": str(e)
            }

    def _build_state_context(self, state: DocumentBuilderState) -> str:
        """Build a context string from the current state."""
        data = state.get_collected_data()
        if not data:
            return "No data collected yet."
        
        filled_fields = data.get_filled_fields()
        missing_critical = data.get_missing_critical_fields()
        missing_important = data.get_missing_important_fields()
        
        context_parts = [
            f"Document Type: {state.document_type.value if state.document_type else 'unknown'}",
            f"Phase: {state.phase.value}",
            f"Filled Fields: {', '.join(filled_fields) if filled_fields else 'none'}",
            f"Missing Critical: {', '.join(missing_critical) if missing_critical else 'none'}",
            f"Missing Important: {', '.join(missing_important) if missing_important else 'none'}",
            f"Questions Asked: {', '.join(state.questions_asked) if state.questions_asked else 'none'}",
            f"Completion: {data.get_completion_percentage():.1f}%"
        ]
        
        return "\n".join(context_parts)

    def _extract_json(self, content: str) -> Dict[str, Any]:
        """Extract JSON from LLM response with robust error handling."""
        import re
        
        text = content.strip()
        
        # Remove markdown code fences if present
        if text.startswith("```"):
            parts = text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{") and part.endswith("}"):
                    text = part
                    break
        
        # Try to locate JSON object
        if not (text.startswith("{") and text.endswith("}")):
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and start < end:
                text = text[start:end + 1]
        
        # First attempt: direct parsing
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Second attempt: fix common JSON issues
        try:
            fixed = text
            # Remove trailing commas before } or ]
            fixed = re.sub(r',(\s*[}\]])', r'\1', fixed)
            # Fix unescaped newlines in strings (common LLM issue)
            # This is tricky - we need to be careful not to break valid escapes
            fixed = re.sub(r'(?<!\\)\n', r'\\n', fixed)
            # Remove control characters that break JSON
            fixed = re.sub(r'[\x00-\x1f]', ' ', fixed)
            return json.loads(fixed)
        except json.JSONDecodeError:
            pass
        
        # Third attempt: try to extract just the plain_text field if present
        try:
            # Find plain_text value even in malformed JSON
            match = re.search(r'"plain_text"\s*:\s*"((?:[^"\\]|\\.)*)"', text, re.DOTALL)
            if match:
                plain_text = match.group(1)
                plain_text = plain_text.replace('\\n', '\n').replace('\\"', '"')
                # Also try to get title
                title_match = re.search(r'"title"\s*:\s*"([^"]*)"', text)
                title = title_match.group(1) if title_match else "Generated Document"
                return {
                    "title": title,
                    "plain_text": plain_text,
                    "sections": [],
                    "word_count": len(plain_text.split())
                }
        except Exception:
            pass
        
        self.logger.warning(f"Failed to parse JSON after all attempts")
        return {}

    # =====================================================================
    # LLM HELPER METHODS WITH RUNTIME FALLBACK
    # =====================================================================

    def _is_quota_error(self, error: Exception) -> bool:
        """Heuristically detect quota/429 errors from the provider.

        We avoid importing provider-specific exception types and instead
        rely on the error message, which for Gemini typically contains
        strings like "ResourceExhausted" or "429" and "quota".
        """

        message = str(error).lower()
        return (
            "resourceexhausted" in message
            or "quota" in message
            or "429" in message
        )

    def _switch_llm_to_groq(self) -> bool:
        """Switch the underlying LLM from Gemini to Groq if possible.

        Returns True if the switch succeeded, False otherwise.
        """

        # If we're already using Groq there is nothing to do.
        if isinstance(self.llm, ChatGroq):
            return False

        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            self.logger.warning(
                "Attempted to fall back to Groq due to quota exhaustion, "
                "but GROQ_API_KEY is not configured."
            )
            return False

        self.logger.warning(
            "Gemini quota exhausted; switching document tool LLM to Groq "
            "(openai/gpt-oss-120b)."
        )

        self.llm = ChatGroq(
            model="openai/gpt-oss-120b",
            api_key=groq_key,
            temperature=0.7,
        )
        return True

    def _invoke_with_fallback(self, messages: List[AIMessage]) -> AIMessage:
        """Invoke the current LLM with automatic 429→Groq fallback.

        - First try the configured LLM (typically Gemini).
        - If we hit a quota/429 error and GROQ_API_KEY is set, switch to
          Groq and retry once.
        - Any other errors are propagated as-is.
        """

        if self.llm is None:
            raise RuntimeError("LLM is not configured for this tool.")

        try:
            return self.llm.invoke(messages)
        except Exception as e:
            if not self._is_quota_error(e):
                raise

            # Only attempt fallback when coming from Gemini.
            if isinstance(self.llm, ChatGoogleGenerativeAI) and self._switch_llm_to_groq():
                self.logger.info("Retrying LLM call with Groq after quota error.")
                return self.llm.invoke(messages)

            # Either we are already on Groq or fallback failed.
            raise

    def get_next_question(
        self, state: DocumentBuilderState, topic: Optional[str] = None
    ) -> str:
        """
        Get the next question to ask the user.
        
        Args:
            state: Current document builder state
            topic: Specific topic to ask about (optional)
            
        Returns:
            Question string to present to user
        """
        if topic is None:
            # Determine topic from missing fields
            data = state.get_collected_data()
            if data:
                missing = data.get_missing_critical_fields()
                if missing:
                    topic = missing[0]
                else:
                    missing = data.get_missing_important_fields()
                    if missing:
                        topic = missing[0]
        
        if topic and topic in self.collection_prompts:
            # Get topic-specific prompt and fill in context
            prompt_template = self.collection_prompts[topic]
            return self._fill_prompt_context(prompt_template, state)
        
        # Fallback to generic collection
        return self.collection_prompts.get(
            "generic",
            "Could you tell me more about your background and experience?"
        )

    def _fill_prompt_context(
        self, prompt_template: str, state: DocumentBuilderState
    ) -> str:
        """Fill in prompt template with context from state."""
        data = state.get_collected_data()
        if not data:
            return prompt_template
        
        # Build context dict from collected data
        context = data.model_dump()
        
        # Add computed fields
        context['completion_percentage'] = data.get_completion_percentage()
        
        # Try to fill template
        try:
            return prompt_template.format(**{k: v or "" for k, v in context.items()})
        except KeyError:
            # Return template as-is if some keys are missing
            return prompt_template

    async def generate_response(
        self, 
        state: DocumentBuilderState,
        user_message: str,
        context: Dict[str, Any]
    ) -> Tuple[str, ActionType]:
        """
        Generate conversational response based on current state.
        
        Returns:
            Tuple of (response_text, next_action)
        """
        data = state.get_collected_data()
        completion = data.get_completion_percentage() if data else 0
        missing_fields = data.get_missing_critical_fields() if data else []
        
        # Determine what kind of response to generate
        if state.phase == ConversationPhase.INITIAL:
            # Just started - provide greeting and first question
            response = self.collection_prompts.get("initial_greeting", "")
            return response, ActionType.ASK_QUESTION
        
        elif state.phase == ConversationPhase.COLLECTING:
            # Collecting info - acknowledge and ask next question
            if missing_fields:
                next_topic = missing_fields[0]
                question = self.get_next_question(state, next_topic)
                
                # Build acknowledgment + question
                if context.get("extracted_info"):
                    ack = "Thanks for sharing that! "
                else:
                    ack = ""
                
                return f"{ack}{question}", ActionType.COLLECT_INFO
            else:
                # All critical fields collected, check if ready
                if data and data.is_ready_for_generation():
                    confirm_prompt = self.collection_prompts.get("final_check", "")
                    confirm_prompt = self._fill_prompt_context(confirm_prompt, state)
                    return confirm_prompt, ActionType.GENERATE_DRAFT
        
        elif state.phase == ConversationPhase.GENERATING:
            # Should be generating document
            return "Generating your document...", ActionType.GENERATE_DRAFT
        
        elif state.phase == ConversationPhase.REFINING:
            # User wants to refine the draft
            return "I'll refine the draft based on your feedback.", ActionType.REFINE_DRAFT
        
        # Default fallback
        return "How can I help you with your document?", ActionType.ASK_QUESTION

    def validate_answer(
        self, 
        field: str, 
        answer: str,
        min_length: int = 20
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate a user's answer for a specific field.
        
        Returns:
            Tuple of (is_valid, feedback_if_invalid)
        """
        if not answer or len(answer.strip()) < min_length:
            return False, f"Could you provide a bit more detail? (at least {min_length} characters)"
        
        # Field-specific validation can be added here
        return True, None

    def format_document_for_editor(
        self, document: GeneratedDocument
    ) -> Dict[str, Any]:
        """
        Format generated document for rich text editor.
        
        Returns editor-compatible JSON structure.
        """
        import re
        
        editor_content = {
            "type": "doc",
            "content": []
        }
        
        # Add title with center alignment
        editor_content["content"].append({
            "type": "heading",
            "attrs": {"level": 1, "textAlign": "center", "lineHeight": "1.5"},
            "content": [{"type": "text", "text": document.title}]
        })
        
        # Add each section
        for section in document.sections:
            # Section heading
            editor_content["content"].append({
                "type": "heading",
                "attrs": {"level": 2, "textAlign": "left", "lineHeight": "1.5"},
                "content": [{"type": "text", "text": section.heading}]
            })
            
            # Normalize the section content to fix single-line sentence breaks
            body = section.content_markdown.strip()
            # 1. Preserve intentional paragraph breaks (2+ newlines)
            normalized = re.sub(r'\n{2,}', '\n\n', body)
            # 2. Replace single newlines with spaces
            normalized = re.sub(r'(?<!\n)\n(?!\n)', ' ', normalized)
            # 3. Clean up multiple spaces
            normalized = re.sub(r' {2,}', ' ', normalized)
            
            # Section content as paragraphs with justify alignment
            paragraphs = [p.strip() for p in normalized.split("\n\n") if p.strip()]
            for para in paragraphs:
                editor_content["content"].append({
                    "type": "paragraph",
                    "attrs": {"textAlign": "justify", "lineHeight": "1.5"},
                    "content": [{"type": "text", "text": para}]
                })
        
        return editor_content
        
        return editor_content
        
        return editor_content

    def sections_to_html(
        self, sections: List[DocumentSection], title: str
    ) -> str:
        """Convert sections to HTML format."""
        import markdown
        
        html_parts = [f"<h1>{title}</h1>"]
        
        for section in sections:
            html_parts.append(f"<h2>{section.heading}</h2>")
            html_parts.append(markdown.markdown(section.content_markdown))
        
        return "\n".join(html_parts)
