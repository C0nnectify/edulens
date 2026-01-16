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
    ResumeCollectedData,
    DocumentProgress,
    DocumentBuilderChatResponse,
    create_initial_state,
    get_next_question_topic,
)
from .prompts import DOCUMENT_BUILDER_SYSTEM_PROMPT
from .tools import SOPTool, LORTool, ResumeTool


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
        # Use Groq gpt-oss-120b as primary (more reliable)
        if self.groq_api_key:
            logger.info("Using Groq gpt-oss-120b as primary LLM for Document Builder")
            self.llm = ChatGroq(
                model="openai/gpt-oss-120b",
                api_key=self.groq_api_key,
                temperature=0.7,
            )
        elif self.google_api_key:
            logger.info("Using Gemini as fallback LLM for Document Builder")
            self.llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=self.google_api_key,
                temperature=0.7,
            )
        else:
            logger.warning("No Groq or Google API key provided. Using mock responses.")
        
        # Initialize tools
        self.sop_tool = SOPTool(self.llm) if self.llm else None
        self.lor_tool = LORTool(self.llm) if self.llm else None
        self.resume_tool = ResumeTool(self.llm) if self.llm else None
        
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
        logger.info(f"=== _analyze_input_node ===")
        logger.info(f"Input message: {state.last_user_message[:100]}...")
        
        # Get the appropriate tool
        tool = self._get_tool_for_type(state.document_type)
        
        if tool:
            # Extract information from message (this also generates AI response)
            # Note: extract_info_from_message modifies state.metadata directly
            extracted_info = await tool.extract_info_from_message(
                state.last_user_message,
                state
            )
            
            logger.info(f"Extracted info keys: {list(extracted_info.keys()) if extracted_info else 'None'}")
            logger.info(f"State metadata after extraction: {list(state.metadata.keys())}")
            logger.info(f"pending_ai_response in metadata: {'pending_ai_response' in state.metadata}")
            
            # CRITICAL: Set last_ai_response HERE, right after extraction
            # Don't wait for collect_info_node - LangGraph may not preserve metadata
            if "pending_ai_response" in state.metadata:
                ai_response = state.metadata["pending_ai_response"]
                logger.info(f"Setting last_ai_response directly: {ai_response[:100]}...")
                state.last_ai_response = ai_response
            
            # Update state with extracted info
            if extracted_info:
                state = tool.update_state_with_extracted_info(state, extracted_info)
            
            # Log current state after extraction
            data = state.get_collected_data()
            if data:
                logger.info(f"Filled fields: {data.get_filled_fields()}")
                logger.info(f"Missing critical: {data.get_missing_critical_fields()}")
                logger.info(f"Ready for generation: {data.is_ready_for_generation()}")
            
            # Check if AI says we're ready
            ai_says_ready = state.metadata.get("ai_says_ready", False)
            logger.info(f"AI says ready: {ai_says_ready}")
            
            # Store extracted info in metadata
            state.metadata["extracted_info"] = extracted_info

            # Heuristic: treat affirmative/generate replies as confirmation when ready
            message_lower = (state.last_user_message or "").lower().strip()
            positive_tokens = [
                "yes", "yep", "yeah", "yup", "sure", "okay", "ok", "ready",
                "go ahead", "go", "please", "generate", "genrate", "generte",
                "gnerate", "create", "build", "make", "do it", "let's do it",
                "lets do it", "proceed", "continue"
            ]
            is_affirmative = any(token in message_lower for token in positive_tokens)
            is_generate_cmd = "generate resume" in message_lower or "generate" in message_lower
            
            # Determine next action based on AI assessment and user intent
            data_ready = state.is_ready_for_generation() or ai_says_ready
            
            if state.draft and any(word in message_lower for word in ["change", "modify", "update", "edit", "refine"]):
                state.next_action = ActionType.REFINE_DRAFT
            elif data_ready and (is_affirmative or is_generate_cmd):
                state.next_action = ActionType.GENERATE_DRAFT
            else:
                state.next_action = ActionType.COLLECT_INFO
            
            logger.info(f"Next action: {state.next_action}")
        
        state.updated_at = datetime.utcnow()
        return state

    async def _detect_document_type_node(self, state: DocumentBuilderState) -> DocumentBuilderState:
        """
        Detect document type from user's message if not already specified.
        Also extracts information from the first message after detection.
        """
        logger.info("=== _detect_document_type_node ===")
        
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
            state.resume_data = ResumeCollectedData()
        elif any(word in message_lower for word in ["resume", "résumé"]):
            state.document_type = DocumentType.RESUME
            state.resume_data = ResumeCollectedData()
        else:
            # Use LLM to detect
            if self.llm:
                detection_result = await self._detect_type_with_llm(state.last_user_message)
                state.document_type = detection_result
                
                if state.document_type == DocumentType.SOP:
                    state.sop_data = SOPCollectedData()
                elif state.document_type == DocumentType.LOR:
                    state.lor_data = LORCollectedData()
                elif state.document_type == DocumentType.RESUME or state.document_type == DocumentType.CV:
                    state.resume_data = ResumeCollectedData()
        
        state.phase = ConversationPhase.COLLECTING
        logger.info(f"Detected document type: {state.document_type}")
        
        # IMPORTANT: Now that we have a document type, extract info from the first message
        # This ensures the first message content is processed, not just used for type detection
        tool = self._get_tool_for_type(state.document_type)
        if tool:
            logger.info("Running extraction on first message after type detection...")
            try:
                extracted_info = await tool.extract_info_from_message(
                    state.last_user_message,
                    state
                )
                
                logger.info(f"Extraction complete. Metadata keys: {list(state.metadata.keys())}")
                
                # Set AI response if available
                if "pending_ai_response" in state.metadata and state.metadata["pending_ai_response"]:
                    ai_response = state.metadata["pending_ai_response"]
                    logger.info(f"Setting AI response from extraction: {ai_response[:100]}...")
                    state.last_ai_response = ai_response
                else:
                    logger.warning("No pending_ai_response in metadata after extraction")
                
                # Update state with extracted data
                if extracted_info:
                    state = tool.update_state_with_extracted_info(state, extracted_info)
                    data = state.get_collected_data()
                    if data:
                        logger.info(f"Filled fields: {data.get_filled_fields()}")
            except Exception as e:
                logger.error(f"Extraction failed: {e}", exc_info=True)
        
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
        This node should preserve the AI response set during extraction.
        Only generates fallback if no response exists.
        """
        logger.info("=== _collect_info_node ===")
        logger.info(f"Existing response: {state.last_ai_response[:80] if state.last_ai_response else 'None'}...")
        
        # If we already have an AI response (from extraction), keep it
        if state.last_ai_response:
            logger.info("Keeping existing AI response")
            return state
        
        # Only generate fallback if no response exists
        logger.info("No AI response - generating fallback")
        tool = self._get_tool_for_type(state.document_type)
        if not tool:
            state.last_ai_response = "I'm not sure what type of document you want to create. Would you like to create an SOP, LOR, CV, or Resume?"
            return state
        
        data = state.get_collected_data()
        if data and data.is_ready_for_generation():
            state.last_ai_response = tool.get_next_question(state, "final_check")
        elif data:
            missing = data.get_missing_critical_fields()
            if missing:
                state.last_ai_response = tool.get_next_question(state, missing[0])
            else:
                state.last_ai_response = tool.get_next_question(state, "final_check")
        else:
            state.last_ai_response = "Please share your resume information - name, experience, education, and target role."
        
        return state

    async def _validate_state_node(self, state: DocumentBuilderState) -> DocumentBuilderState:
        """
        Validate if we have enough information to proceed.
        IMPORTANT: Never overwrite last_ai_response - it's set by extraction.
        """
        logger.info("=== _validate_state_node ===")
        logger.info(f"Current response: {state.last_ai_response[:80] if state.last_ai_response else 'None'}...")
        
        data = state.get_collected_data()
        if not data:
            state.phase = ConversationPhase.COLLECTING
            return state

        # Update completion percentage
        state.completion_percentage = data.get_completion_percentage()
        
        if data.is_ready_for_generation():
            state.phase = ConversationPhase.VALIDATING
        else:
            state.phase = ConversationPhase.COLLECTING
        
        # DO NOT overwrite last_ai_response here - it was set during extraction
        logger.info(f"Phase: {state.phase}, Completion: {state.completion_percentage}%")
        
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
            msg = (state.last_user_message or "").lower()
            affirm_tokens = ["yes", "yep", "yeah", "yup", "sure", "ok", "okay", "ready", "go ahead", "generate", "genrate", "generte", "gnerate", "create", "build", "make", "do it", "proceed", "continue"]
            is_affirmative = any(token in msg for token in affirm_tokens)
            if last_intent == "confirm" or is_affirmative:
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
        elif doc_type == DocumentType.RESUME or doc_type == DocumentType.CV:
            return self.resume_tool
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
                if self.resume_tool is not None:
                    self.resume_tool.llm = self.llm

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
            logger.info(f"Loaded existing session {session_id}, completion: {state.completion_percentage}%")
            # Log current data
            if state.resume_data:
                logger.info(f"Session has resume_data with fields: {state.resume_data.get_filled_fields()}")
        else:
            # Use the provided session_id if given, otherwise generate a new one
            # This ensures consistency with the calling system's session tracking
            if not session_id:
                session_id = f"doc-{uuid.uuid4().hex[:12]}"
            state = create_initial_state(
                user_id=user_id,
                session_id=session_id,
                document_type=document_type,
                initial_message=message,
            )
            logger.info(f"Created new session {session_id}")
        
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
                
                # Handle nested Pydantic models that might have been converted to dicts
                if isinstance(payload, dict):
                    # Reconstruct resume_data if it's a dict
                    if "resume_data" in payload and isinstance(payload["resume_data"], dict):
                        payload["resume_data"] = ResumeCollectedData(**payload["resume_data"])
                    # Reconstruct sop_data if it's a dict
                    if "sop_data" in payload and isinstance(payload["sop_data"], dict):
                        from .state import SOPCollectedData
                        payload["sop_data"] = SOPCollectedData(**payload["sop_data"])
                    # Reconstruct lor_data if it's a dict
                    if "lor_data" in payload and isinstance(payload["lor_data"], dict):
                        from .state import LORCollectedData
                        payload["lor_data"] = LORCollectedData(**payload["lor_data"])
                
                result_state = DocumentBuilderState(**payload)
            
            logger.info(f"After graph execution - completion: {result_state.completion_percentage}%")
            if result_state.resume_data:
                logger.info(f"Resume data fields: {result_state.resume_data.get_filled_fields()}")

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
