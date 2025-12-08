"""LangGraph orchestrator for multi-agent system"""

from typing import Dict, Literal, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import HumanMessage, AIMessage
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    ChatGoogleGenerativeAI = None

from app.graph.state import StudyAbroadAgentState, create_initial_state
from app.agents.supervisor_agent import SupervisorAgent
from app.agents.research_agent import ResearchAgent
from app.agents.document_agent import DocumentAgent
from app.agents.tracking_agent import TrackingAgent
from app.agents.planning_agent import PlanningAgent
from app.agents.profile_evaluation_agent import ProfileEvaluationAgent
from app.agents.travel_planner_agent import TravelPlannerAgent
from app.agents.financial_aid_agent import FinancialAidAgent
from app.agents.peer_networking_agent import PeerNetworkingAgent
from app.agents.cultural_adaptation_agent import CulturalAdaptationAgent
from app.tools.base_tool import tool_registry
from app.memory.session_manager import SessionStateManager
import logging
import os

logger = logging.getLogger(__name__)


class MultiAgentOrchestrator:
    """
    Orchestrates the multi-agent system using LangGraph.

    Implements supervisor pattern where specialist agents are coordinated
    by a supervisor agent that makes routing decisions.
    """

    def __init__(
        self,
        session_manager: SessionStateManager,
        google_api_key: Optional[str] = None
    ):
        self.session_manager = session_manager
        self.google_api_key = google_api_key or os.getenv("GOOGLE_API_KEY")

        # Initialize LLM
        if ChatGoogleGenerativeAI is None:
            raise ImportError("langchain_google_genai is not installed. Please install it with: pip install langchain-google-genai")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=self.google_api_key,
            temperature=0.7
        )

        # Initialize specialist agents
        self.research_agent = ResearchAgent(tool_registry, self.llm)
        self.document_agent = DocumentAgent(tool_registry, self.llm)
        self.tracking_agent = TrackingAgent(tool_registry, self.llm)
        self.planning_agent = PlanningAgent(tool_registry, self.llm)
        self.profile_evaluation_agent = ProfileEvaluationAgent(tool_registry, self.llm)
        self.travel_planner_agent = TravelPlannerAgent(tool_registry, self.llm)
        self.financial_aid_agent = FinancialAidAgent(tool_registry, self.llm)
        self.peer_networking_agent = PeerNetworkingAgent(tool_registry, self.llm)
        self.cultural_adaptation_agent = CulturalAdaptationAgent(tool_registry, self.llm)

        # Initialize supervisor
        self.supervisor = SupervisorAgent(
            tool_registry=tool_registry,
            llm=self.llm,
            specialist_agents={
                "Research Agent": self.research_agent,
                "Document Agent": self.document_agent,
                "Tracking Agent": self.tracking_agent,
                "Planning Agent": self.planning_agent,
                "Profile Evaluation Agent": self.profile_evaluation_agent,
                "Travel Planner Agent": self.travel_planner_agent,
                "Financial Aid Agent": self.financial_aid_agent,
                "Peer Networking Agent": self.peer_networking_agent,
                "Cultural Adaptation Agent": self.cultural_adaptation_agent
            }
        )

        # Build graph
        self.graph = self._build_graph()
        self.compiled_graph = None

    def _build_graph(self) -> StateGraph:
        """
        Build the LangGraph state machine.

        Flow:
        START -> supervisor -> [all 9 specialized agents] -> supervisor -> END
        """
        workflow = StateGraph(StudyAbroadAgentState)

        # Add nodes
        workflow.add_node("supervisor", self._supervisor_node)
        workflow.add_node("research_agent", self._research_node)
        workflow.add_node("document_agent", self._document_node)
        workflow.add_node("tracking_agent", self._tracking_node)
        workflow.add_node("planning_agent", self._planning_node)
        workflow.add_node("profile_evaluation_agent", self._profile_evaluation_node)
        workflow.add_node("travel_planner_agent", self._travel_planner_node)
        workflow.add_node("financial_aid_agent", self._financial_aid_node)
        workflow.add_node("peer_networking_agent", self._peer_networking_node)
        workflow.add_node("cultural_adaptation_agent", self._cultural_adaptation_node)

        # Set entry point
        workflow.set_entry_point("supervisor")

        # Add conditional edges from supervisor
        workflow.add_conditional_edges(
            "supervisor",
            self._should_continue,
            {
                "research_agent": "research_agent",
                "document_agent": "document_agent",
                "tracking_agent": "tracking_agent",
                "planning_agent": "planning_agent",
                "profile_evaluation_agent": "profile_evaluation_agent",
                "travel_planner_agent": "travel_planner_agent",
                "financial_aid_agent": "financial_aid_agent",
                "peer_networking_agent": "peer_networking_agent",
                "cultural_adaptation_agent": "cultural_adaptation_agent",
                "complete": END
            }
        )

        # All agents return to supervisor
        workflow.add_edge("research_agent", "supervisor")
        workflow.add_edge("document_agent", "supervisor")
        workflow.add_edge("tracking_agent", "supervisor")
        workflow.add_edge("planning_agent", "supervisor")
        workflow.add_edge("profile_evaluation_agent", "supervisor")
        workflow.add_edge("travel_planner_agent", "supervisor")
        workflow.add_edge("financial_aid_agent", "supervisor")
        workflow.add_edge("peer_networking_agent", "supervisor")
        workflow.add_edge("cultural_adaptation_agent", "supervisor")

        return workflow

    def compile_graph(self, checkpointer=None):
        """Compile the graph with optional checkpointer"""
        if checkpointer is None:
            checkpointer = MemorySaver()  # Default in-memory checkpointer

        self.compiled_graph = self.graph.compile(checkpointer=checkpointer)
        logger.info("LangGraph compiled successfully")

    async def _supervisor_node(self, state: StudyAbroadAgentState) -> StudyAbroadAgentState:
        """Supervisor node - routes to specialist agents"""
        logger.info("Executing supervisor node")

        response = await self.supervisor.process(state)

        # Add supervisor message to history
        state["messages"].append(
            AIMessage(content=response["message"], name="Supervisor")
        )

        # Update state based on response
        if response["next_action"] == "delegate" and response["data"]:
            state["next_agent"] = response["data"].get("next_agent")

        return state

    async def _research_node(self, state: StudyAbroadAgentState) -> StudyAbroadAgentState:
        """Research agent node"""
        logger.info("Executing research agent node")

        response = await self.research_agent.process(state)

        # Add agent response to messages
        state["messages"].append(
            AIMessage(content=response["message"], name="Research Agent")
        )

        # Clear next_agent to return to supervisor
        state["next_agent"] = None

        return state

    async def _document_node(self, state: StudyAbroadAgentState) -> StudyAbroadAgentState:
        """Document agent node"""
        logger.info("Executing document agent node")

        response = await self.document_agent.process(state)

        state["messages"].append(
            AIMessage(content=response["message"], name="Document Agent")
        )

        state["next_agent"] = None
        return state

    async def _tracking_node(self, state: StudyAbroadAgentState) -> StudyAbroadAgentState:
        """Tracking agent node"""
        logger.info("Executing tracking agent node")

        response = await self.tracking_agent.process(state)

        state["messages"].append(
            AIMessage(content=response["message"], name="Tracking Agent")
        )

        state["next_agent"] = None
        return state

    async def _planning_node(self, state: StudyAbroadAgentState) -> StudyAbroadAgentState:
        """Planning agent node"""
        logger.info("Executing planning agent node")

        response = await self.planning_agent.process(state)

        state["messages"].append(
            AIMessage(content=response["message"], name="Planning Agent")
        )

        state["next_agent"] = None
        return state

    async def _profile_evaluation_node(self, state: StudyAbroadAgentState) -> StudyAbroadAgentState:
        """Profile evaluation agent node"""
        logger.info("Executing profile evaluation agent node")

        response = await self.profile_evaluation_agent.process(state)

        state["messages"].append(
            AIMessage(content=response["message"], name="Profile Evaluation Agent")
        )

        state["next_agent"] = None
        return state

    async def _travel_planner_node(self, state: StudyAbroadAgentState) -> StudyAbroadAgentState:
        """Travel planner agent node"""
        logger.info("Executing travel planner agent node")

        response = await self.travel_planner_agent.process(state)

        state["messages"].append(
            AIMessage(content=response["message"], name="Travel Planner Agent")
        )

        state["next_agent"] = None
        return state

    async def _financial_aid_node(self, state: StudyAbroadAgentState) -> StudyAbroadAgentState:
        """Financial aid agent node"""
        logger.info("Executing financial aid agent node")

        response = await self.financial_aid_agent.process(state)

        state["messages"].append(
            AIMessage(content=response["message"], name="Financial Aid Agent")
        )

        state["next_agent"] = None
        return state

    async def _peer_networking_node(self, state: StudyAbroadAgentState) -> StudyAbroadAgentState:
        """Peer networking agent node"""
        logger.info("Executing peer networking agent node")

        response = await self.peer_networking_agent.process(state)

        state["messages"].append(
            AIMessage(content=response["message"], name="Peer Networking Agent")
        )

        state["next_agent"] = None
        return state

    async def _cultural_adaptation_node(self, state: StudyAbroadAgentState) -> StudyAbroadAgentState:
        """Cultural adaptation agent node"""
        logger.info("Executing cultural adaptation agent node")

        response = await self.cultural_adaptation_agent.process(state)

        state["messages"].append(
            AIMessage(content=response["message"], name="Cultural Adaptation Agent")
        )

        state["next_agent"] = None
        return state

    def _should_continue(
        self,
        state: StudyAbroadAgentState
    ) -> Literal["research_agent", "document_agent", "tracking_agent", "planning_agent", "profile_evaluation_agent", "travel_planner_agent", "financial_aid_agent", "peer_networking_agent", "cultural_adaptation_agent", "complete"]:
        """
        Determine next step based on supervisor's decision.

        Returns the name of the next agent or 'complete' to end.
        """
        next_agent = state.get("next_agent")

        if next_agent == "Research Agent":
            return "research_agent"
        elif next_agent == "Document Agent":
            return "document_agent"
        elif next_agent == "Tracking Agent":
            return "tracking_agent"
        elif next_agent == "Planning Agent":
            return "planning_agent"
        elif next_agent == "Profile Evaluation Agent":
            return "profile_evaluation_agent"
        elif next_agent == "Travel Planner Agent":
            return "travel_planner_agent"
        elif next_agent == "Financial Aid Agent":
            return "financial_aid_agent"
        elif next_agent == "Peer Networking Agent":
            return "peer_networking_agent"
        elif next_agent == "Cultural Adaptation Agent":
            return "cultural_adaptation_agent"
        else:
            # No next agent means we're done
            return "complete"

    async def execute(
        self,
        user_id: str,
        session_id: str,
        user_message: str,
        task_type: str = "general",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Execute the multi-agent workflow.

        Args:
            user_id: User identifier
            session_id: Session identifier
            user_message: User's message/request
            task_type: Type of task (research, document, tracking, planning, general)
            metadata: Additional metadata

        Returns:
            Dict with execution results
        """
        if not self.compiled_graph:
            self.compile_graph()

        try:
            # Create or load session
            existing_state = await self.session_manager.get_session_state(session_id)

            if existing_state:
                # Continue existing session
                state = existing_state
                state["messages"].append(HumanMessage(content=user_message))
                state["current_task"] = user_message
            else:
                # Create new session
                await self.session_manager.create_session(
                    session_id=session_id,
                    user_id=user_id,
                    task_type=task_type,
                    metadata=metadata
                )

                # Create initial state
                state = create_initial_state(
                    user_id=user_id,
                    session_id=session_id,
                    thread_id=session_id,  # Using session_id as thread_id
                    task_type=task_type,
                    initial_message=user_message,
                    metadata=metadata
                )

                # Classify intent
                state["intent"] = self.supervisor.classify_intent(user_message)
                state["current_task"] = user_message

            # Execute graph
            config = {"configurable": {"thread_id": session_id}}

            final_state = await self.compiled_graph.ainvoke(state, config)

            # Update session state
            await self.session_manager.update_session_state(
                session_id=session_id,
                state_update=final_state,
                force_checkpoint=True
            )

            # Extract results
            return {
                "success": True,
                "session_id": session_id,
                "status": final_state["status"],
                "final_answer": final_state.get("final_answer"),
                "agents_involved": final_state["agents_called"],
                "research_findings": final_state.get("research_findings"),
                "generated_documents": final_state.get("generated_documents"),
                "tracked_applications": final_state.get("tracked_applications"),
                "study_plan": final_state.get("study_plan"),
                "errors": final_state["errors"],
                "message_count": len(final_state["messages"])
            }

        except Exception as e:
            logger.error(f"Orchestrator execution error: {str(e)}", exc_info=True)
            return {
                "success": False,
                "session_id": session_id,
                "error": str(e)
            }

    async def get_session_history(self, session_id: str) -> Optional[Dict]:
        """Get the full history of a session"""
        state = await self.session_manager.get_session_state(session_id)
        if state:
            return {
                "session_id": session_id,
                "messages": [msg.dict() for msg in state.get("messages", [])],
                "agents_called": state.get("agents_called", []),
                "status": state.get("status", "unknown")
            }
        return None
