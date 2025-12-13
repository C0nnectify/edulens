"""
Document Builder LangGraph Orchestrator

This module implements the LangGraph state machine for document creation.
It coordinates the conversation flow, information collection, and document generation.
"""

import logging
import os
import uuid
from datetime import datetime
from typing import Dict, Literal, Optional, Any, List

from dotenv import load_dotenv
load_dotenv()  # Ensure env vars are loaded

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from .state import (
    DocumentBuilderState,
    DocumentType,
    ConversationPhase,
    ActionType,
    SOPCollectedData,
    LORCollectedData,
    DocumentProgress,
    DocumentBuilderChatResponse,
    create_initial_state,
    get_next_question_topic,
)
from .prompts import DOCUMENT_BUILDER_SYSTEM_PROMPT
from .tools import SOPTool, LORTool

logger = logging.getLogger(__name__)


class DocumentBuilderOrchestrator:
    """
    Orchestrates document creation through conversational interaction.
    
    Uses LangGraph to manage state transitions:
    - Initial → Collecting → Validating → Generating → Refining → Completed
    
    Supports:
    - SOP generation
    - LOR generation
    - (Future) CV and Resume generation
    """

    def __init__(
        self,
        google_api_key: Optional[str] = None,
        model_name: str = "gemini-2.5-flash",
    ):
        """
        Initialize the orchestrator.
        
        Args:
            google_api_key: Google API key for Gemini
            model_name: Model to use for generation
        """
        import os
        self.google_api_key = google_api_key or os.getenv("GOOGLE_API_KEY")
        self.groq_api_key = os.getenv("GROQ_API_KEY")

        self.llm = None
        # Prefer Gemini if available and keyed; otherwise fall back to Groq.
        if self.google_api_key:
            self.llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=self.google_api_key,
                temperature=0.7,
            )
        elif self.groq_api_key:
            logger.info("Using Groq ChatGroq as primary LLM for Document Builder")
            self.llm = ChatGroq(
                model="openai/gpt-oss-120b",
                api_key=self.groq_api_key,
                temperature=0.7,
            )
        else:
            logger.warning("No Google or Groq API key provided. Using mock responses.")
        
        # Initialize tools
        self.sop_tool = SOPTool(self.llm) if self.llm else None
        self.lor_tool = LORTool(self.llm) if self.llm else None
        
        # Build the graph
        self.graph = self._build_graph()
        self.compiled_graph = None
        
        # Session storage (in-memory for now, should be replaced with MongoDB)
        self.sessions: Dict[str, DocumentBuilderState] = {}

    def _build_graph(self) -> StateGraph:
        """
        Build the LangGraph state machine.
        
        Flow:
        START → analyze_input → [collect_info | generate | refine] → validate → ...
        """
        workflow = StateGraph(DocumentBuilderState)
        
        # Add nodes
        workflow.add_node("analyze_input", self._analyze_input_node)
        workflow.add_node("detect_document_type", self._detect_document_type_node)
        workflow.add_node("collect_info", self._collect_info_node)
        workflow.add_node("validate_state", self._validate_state_node)
        workflow.add_node("generate_document", self._generate_document_node)
        workflow.add_node("refine_document", self._refine_document_node)
        workflow.add_node("present_response", self._present_response_node)
        
        # Set entry point
        workflow.set_entry_point("analyze_input")
        
        # Add conditional edges
        workflow.add_conditional_edges(
            "analyze_input",
            self._route_after_analysis,
            {
                "detect_type": "detect_document_type",
                "collect": "collect_info",
                "generate": "generate_document",
                "refine": "refine_document",
                "respond": "present_response",
            }
        )
        
        workflow.add_edge("detect_document_type", "collect_info")
        workflow.add_edge("collect_info", "validate_state")
        
        workflow.add_conditional_edges(
            "validate_state",
            self._route_after_validation,
            {
                "collect_more": "collect_info",
                "ready_to_generate": "generate_document",
                "respond": "present_response",
            }
        )
        
        workflow.add_edge("generate_document", "present_response")
        workflow.add_edge("refine_document", "present_response")
        workflow.add_edge("present_response", END)
        
        return workflow

    def compile(self, checkpointer=None):
        """Compile the graph with optional checkpointer."""
        if checkpointer is None:
            checkpointer = MemorySaver()
        
        self.compiled_graph = self.graph.compile(checkpointer=checkpointer)
        logger.info("Document Builder graph compiled successfully")

    # =========================================================================
    # NODE IMPLEMENTATIONS
    # =========================================================================

    async def _analyze_input_node(self, state: DocumentBuilderState) -> DocumentBuilderState:
        """
        Analyze user input to understand intent and extract information.
        """
        logger.info(f"Analyzing input: {state.last_user_message[:50]}...")
        
        # Get the appropriate tool
        tool = self._get_tool_for_type(state.document_type)
        
        if tool:
            # Use tool to analyze intent
            intent_result = await tool.analyze_intent(
                state.last_user_message, 
                state
            )
            
            # Extract information from message
            extracted_info = await tool.extract_info_from_message(
                state.last_user_message,
                state
            )
            
            # Update state with extracted info
            if extracted_info:
                state = tool.update_state_with_extracted_info(state, extracted_info)
            
            # Store intent analysis in metadata
            state.metadata["last_intent"] = intent_result.get("intent", "other")
            state.metadata["extracted_info"] = extracted_info
            
            # Determine next action
            if intent_result.get("intent") == "request_change" and state.draft:
                state.next_action = ActionType.REFINE_DRAFT
            elif state.is_ready_for_generation() and intent_result.get("intent") == "confirm":
                state.next_action = ActionType.GENERATE_DRAFT
            else:
                state.next_action = ActionType.COLLECT_INFO
        
        state.updated_at = datetime.utcnow()
        return state

    async def _detect_document_type_node(self, state: DocumentBuilderState) -> DocumentBuilderState:
        """
        Detect document type from user's message if not already specified.
        """
        if state.document_type:
            return state
        
        message_lower = state.last_user_message.lower()
        
        # Simple keyword detection
        if any(word in message_lower for word in ["sop", "statement of purpose", "purpose statement"]):
            state.document_type = DocumentType.SOP
            state.sop_data = SOPCollectedData()
        elif any(word in message_lower for word in ["lor", "recommendation", "letter of rec"]):
            state.document_type = DocumentType.LOR
            state.lor_data = LORCollectedData()
        elif any(word in message_lower for word in ["cv", "curriculum vitae"]):
            state.document_type = DocumentType.CV
        elif any(word in message_lower for word in ["resume", "résumé"]):
            state.document_type = DocumentType.RESUME
        else:
            # Use LLM to detect
            if self.llm:
                detection_result = await self._detect_type_with_llm(state.last_user_message)
                state.document_type = detection_result
                
                if state.document_type == DocumentType.SOP:
                    state.sop_data = SOPCollectedData()
                elif state.document_type == DocumentType.LOR:
                    state.lor_data = LORCollectedData()
        
        state.phase = ConversationPhase.COLLECTING
        logger.info(f"Detected document type: {state.document_type}")
        
        return state

    async def _detect_type_with_llm(self, message: str) -> Optional[DocumentType]:
        """Use LLM to detect document type from message."""
        prompt = f"""
Analyze this message and determine what type of document the user wants to create.

Message: "{message}"

Options:
- sop (Statement of Purpose)
- lor (Letter of Recommendation)
- cv (Curriculum Vitae)
- resume (Resume)
- unknown

Return only one word from the options above.
"""
        try:
            response = await self._invoke_llm_with_fallback([HumanMessage(content=prompt)])
            result = response.content.strip().lower()
            
            type_map = {
                "sop": DocumentType.SOP,
                "lor": DocumentType.LOR,
                "cv": DocumentType.CV,
                "resume": DocumentType.RESUME,
            }
            
            return type_map.get(result)
        except Exception as e:
            logger.error(f"Document type detection failed: {e}")
            return None

    async def _collect_info_node(self, state: DocumentBuilderState) -> DocumentBuilderState:
        """
        Collect information from user or generate follow-up questions.
        """
        logger.info("Collecting information...")
        
        tool = self._get_tool_for_type(state.document_type)
        if not tool:
            state.last_ai_response = "I'm not sure what type of document you want to create. Would you like to create an SOP, LOR, CV, or Resume?"
            return state
        
        # Determine what to ask next
        next_topic = get_next_question_topic(state)
        
        if next_topic:
            question = tool.get_next_question(state, next_topic)
            state.current_topic = next_topic
            state.questions_asked.append(next_topic)
            state.last_ai_response = question
        else:
            # We have enough info
            state.phase = ConversationPhase.VALIDATING
        
        return state

    async def _validate_state_node(self, state: DocumentBuilderState) -> DocumentBuilderState:
        """
        Validate if we have enough information to proceed.
        """
        logger.info("Validating state...")
        
        data = state.get_collected_data()
        # If we don't have any collected data (e.g., document type is still
        # unknown), avoid looping indefinitely between collect/validate.
        # In this case we simply keep asking the user to clarify and let the
        # routing logic present the current response.
        if not data:
            state.phase = ConversationPhase.COLLECTING
            return state

        if data.is_ready_for_generation():
            state.phase = ConversationPhase.VALIDATING
            
            # Generate confirmation message
            tool = self._get_tool_for_type(state.document_type)
            if tool:
                state.last_ai_response = tool.get_next_question(state, "final_check")
        else:
            # Need more info
            state.phase = ConversationPhase.COLLECTING
        
        state.completion_percentage = data.get_completion_percentage() if data else 0
        
        return state

    async def _generate_document_node(self, state: DocumentBuilderState) -> DocumentBuilderState:
        """
        Generate the document using collected information.
        """
        logger.info(f"Generating {state.document_type.value if state.document_type else 'document'}...")
        
        state.phase = ConversationPhase.GENERATING
        
        tool = self._get_tool_for_type(state.document_type)
        if not tool:
            state.errors.append("No tool available for document type")
            return state
        
        try:
            document = await tool.generate_document(state)
            state.draft = document
            state.draft_history.append(document)
            state.phase = ConversationPhase.COMPLETED
            
            # Generate summary
            summary = tool.get_generation_summary(document)
            state.last_ai_response = f"I've generated your {state.document_type.value.upper()}!\n\n{summary}"
            
        except Exception as e:
            logger.error(f"Document generation failed: {e}")
            state.errors.append(str(e))
            state.last_ai_response = f"I encountered an error generating your document: {str(e)}. Would you like to try again?"
        
        return state

    async def _refine_document_node(self, state: DocumentBuilderState) -> DocumentBuilderState:
        """
        Refine the document based on user feedback.
        """
        logger.info("Refining document...")
        
        state.phase = ConversationPhase.REFINING
        
        if not state.draft:
            state.last_ai_response = "I don't have a draft to refine yet. Would you like me to generate one first?"
            return state
        
        tool = self._get_tool_for_type(state.document_type)
        if not tool:
            return state
        
        # Parse user feedback to determine what to refine
        feedback = state.last_user_message
        
        # Simple section detection (can be improved with NLP)
        section_keywords = {
            "introduction": "Introduction",
            "background": "Academic Background",
            "experience": "Professional Experience",
            "why": "Why This Program",
            "goals": "Goals & Conclusion",
            "conclusion": "Goals & Conclusion",
        }
        
        target_section = None
        for keyword, section_name in section_keywords.items():
            if keyword in feedback.lower():
                target_section = section_name
                break
        
        if target_section:
            try:
                refined_section = await tool.refine_section(state, target_section, feedback)
                
                # Update the draft
                for i, section in enumerate(state.draft.sections):
                    if section.heading == target_section:
                        state.draft.sections[i] = refined_section
                        break
                
                state.last_ai_response = f"I've refined the {target_section} section. Here's the updated version:\n\n**{target_section}**\n{refined_section.content_markdown}\n\nWould you like to make any other changes?"
            except Exception as e:
                state.errors.append(str(e))
                state.last_ai_response = f"I had trouble refining that section: {str(e)}. Could you be more specific about what you'd like to change?"
        else:
            state.last_ai_response = "Which section would you like me to refine? (Introduction, Background, Experience, Why This Program, or Goals)"
        
        return state

    async def _present_response_node(self, state: DocumentBuilderState) -> DocumentBuilderState:
        """
        Format and present the response to the user.
        """
        # Response is already set in previous nodes
        # This node can add formatting or additional context
        
        state.messages.append(AIMessage(content=state.last_ai_response))
        state.updated_at = datetime.utcnow()
        
        return state

    # =========================================================================
    # ROUTING FUNCTIONS
    # =========================================================================

    def _route_after_analysis(self, state: DocumentBuilderState) -> str:
        """Route after input analysis."""
        if not state.document_type:
            return "detect_type"
        
        if state.next_action == ActionType.REFINE_DRAFT:
            return "refine"
        
        if state.next_action == ActionType.GENERATE_DRAFT:
            return "generate"
        
        if state.phase == ConversationPhase.COMPLETED and state.draft:
            return "respond"
        
        return "collect"

    def _route_after_validation(self, state: DocumentBuilderState) -> str:
        """Route after state validation."""
        data = state.get_collected_data()
        # If we don't have enough structured info yet, do not loop back into
        # collect_info within the same graph run. Instead, respond with the
        # latest question/ guidance and wait for the next user message.
        if data is None or not data.is_ready_for_generation():
            return "respond"

        if data.is_ready_for_generation():
            # Check if user confirmed
            last_intent = state.metadata.get("last_intent", "")
            if last_intent == "confirm" or "yes" in state.last_user_message.lower():
                return "ready_to_generate"
            else:
                return "respond"
        
        return "collect_more"

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _get_tool_for_type(self, doc_type: Optional[DocumentType]):
        """Get the appropriate tool for the document type."""
        if doc_type == DocumentType.SOP:
            return self.sop_tool
        elif doc_type == DocumentType.LOR:
            return self.lor_tool
        return None

    async def _invoke_llm_with_fallback(self, messages: List[HumanMessage]) -> AIMessage:
        """Invoke orchestrator-level LLM with 429→Groq fallback.

        This mirrors the tool-level fallback so that early steps like
        document-type detection also survive Gemini quota exhaustion.
        When switching here, we also update the tools' LLM references.
        """

        if self.llm is None:
            raise RuntimeError("Document Builder LLM is not configured.")

        def _is_quota_error(err: Exception) -> bool:
            msg = str(err).lower()
            return (
                "resourceexhausted" in msg
                or "quota" in msg
                or "429" in msg
            )

        try:
            return self.llm.invoke(messages)
        except Exception as e:
            if not _is_quota_error(e):
                raise

            if isinstance(self.llm, ChatGoogleGenerativeAI) and self.groq_api_key:
                logger.warning(
                    "Gemini quota exhausted in orchestrator; switching LLM to "
                    "Groq (openai/gpt-oss-120b) and retrying."
                )
                self.llm = ChatGroq(
                    model="openai/gpt-oss-120b",
                    api_key=self.groq_api_key,
                    temperature=0.7,
                )
                # Keep tools in sync with the orchestrator LLM.
                if self.sop_tool is not None:
                    self.sop_tool.llm = self.llm
                if self.lor_tool is not None:
                    self.lor_tool.llm = self.llm

                return self.llm.invoke(messages)

            # Either already on Groq or no Groq key available.
            raise

    # =========================================================================
    # PUBLIC API
    # =========================================================================

    async def process_message(
        self,
        message: str,
        session_id: Optional[str] = None,
        user_id: str = "anonymous",
        document_type: Optional[str] = None,
        attachments: Optional[List[str]] = None,
    ) -> DocumentBuilderChatResponse:
        """
        Process a user message and return a response.
        
        Args:
            message: User's message
            session_id: Existing session ID (optional)
            user_id: User identifier
            document_type: Document type if known (sop, lor, cv, resume)
            
        Returns:
            DocumentBuilderChatResponse with AI response and metadata
        """
        # Get or create session
        if session_id and session_id in self.sessions:
            state = self.sessions[session_id]
        else:
            session_id = f"doc-{uuid.uuid4().hex[:12]}"
            state = create_initial_state(
                user_id=user_id,
                session_id=session_id,
                document_type=document_type,
                initial_message=message,
            )
        
        # Update state with new message
        state.last_user_message = message
        state.messages.append(HumanMessage(content=message))

         # Track any attachments provided with this message
        if attachments:
            # Replace with latest set so frontend can control which files are active
            state.attachments = list(attachments)
            state.metadata["attachments"] = list(attachments)
        
        # Compile graph if not done
        if not self.compiled_graph:
            self.compile()
        
        # Run the graph
        try:
            config = {"configurable": {"thread_id": session_id}}
            raw_result = await self.compiled_graph.ainvoke(state, config)

            # LangGraph may return a plain dict/AddableValuesDict rather than
            # our Pydantic state model. Normalize it to DocumentBuilderState so
            # we can use helper methods like get_collected_data().
            if isinstance(raw_result, DocumentBuilderState):
                result_state = raw_result
            else:
                # Some versions wrap state under a "state" key; fall back to
                # using the raw mapping if that key is absent.
                try:
                    payload = raw_result.get("state", raw_result)  # type: ignore[attr-defined]
                except AttributeError:
                    payload = raw_result
                result_state = DocumentBuilderState(**payload)

            # Update session storage
            self.sessions[session_id] = result_state
            
            # Build response
            data = result_state.get_collected_data()
            progress = None
            if data:
                progress = DocumentProgress(
                    collected_fields=data.get_filled_fields(),
                    missing_fields=data.get_missing_critical_fields() + data.get_missing_important_fields(),
                    percentage=data.get_completion_percentage(),
                    ready_for_generation=data.is_ready_for_generation(),
                )
            
            return DocumentBuilderChatResponse(
                session_id=session_id,
                response=result_state.last_ai_response,
                action=result_state.next_action,
                document_type=result_state.document_type,
                document_draft=result_state.draft.model_dump() if result_state.draft else None,
                progress=progress,
                metadata={
                    "phase": result_state.phase.value,
                    "completion_percentage": result_state.completion_percentage,
                }
            )
            
        except Exception as e:
            logger.error(f"Graph execution failed: {e}")
            return DocumentBuilderChatResponse(
                session_id=session_id,
                response=f"I encountered an error: {str(e)}. Let's try again.",
                action=ActionType.ERROR_RECOVERY,
                metadata={"error": str(e)}
            )

    def get_session(self, session_id: str) -> Optional[DocumentBuilderState]:
        """Get a session by ID."""
        return self.sessions.get(session_id)

    def list_sessions(self, user_id: str) -> list:
        """List all sessions for a user."""
        return [
            {
                "session_id": s.session_id,
                "document_type": s.document_type.value if s.document_type else None,
                "phase": s.phase.value,
                "completion": s.completion_percentage,
                "updated_at": s.updated_at.isoformat(),
            }
            for s in self.sessions.values()
            if s.user_id == user_id
        ]


# Singleton instance
_orchestrator: Optional[DocumentBuilderOrchestrator] = None


def get_document_builder_orchestrator() -> DocumentBuilderOrchestrator:
    """Get or create the document builder orchestrator singleton."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = DocumentBuilderOrchestrator()
    return _orchestrator
