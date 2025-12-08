"""LangGraph state definition for multi-agent system"""

from typing import TypedDict, Annotated, Optional, List, Dict, Any
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage


class StudyAbroadAgentState(TypedDict):
    """
    Shared state across all agents in the multi-agent system.

    This state is passed between all nodes in the LangGraph and maintains
    the conversation history, task context, and coordination information.
    """

    # Message history (visible to all agents via shared scratchpad)
    messages: Annotated[List[BaseMessage], add_messages]

    # Session identification
    user_id: str
    session_id: str
    thread_id: str  # For conversation threading

    # Task tracking
    current_task: str  # Description of what we're doing
    task_type: str  # research, document, tracking, planning, general
    intent: str  # Classified user intent

    # Agent coordination
    next_agent: Optional[str]  # Which agent should act next (supervisor decision)
    agents_called: List[str]  # Track which agents have been invoked

    # Agent-specific scratchpads (isolated work areas for each agent)
    # Allows agents to maintain their own context without polluting shared state
    agent_scratchpad: Dict[str, Dict[str, Any]]

    # Tool execution results aggregation
    tool_results: Dict[str, Any]

    # Research-specific data
    research_findings: Optional[List[Dict[str, Any]]]

    # Document-specific data
    generated_documents: Optional[List[Dict[str, Any]]]

    # Tracking-specific data
    tracked_applications: Optional[List[Dict[str, Any]]]

    # Planning-specific data
    study_plan: Optional[Dict[str, Any]]

    # Final output
    final_answer: Optional[str]
    status: str  # pending, in_progress, completed, failed, needs_human

    # Error tracking
    errors: List[str]

    # Metadata
    metadata: Dict[str, Any]


class AgentResponse(TypedDict):
    """Structure for agent responses"""
    agent_name: str
    success: bool
    message: str
    data: Optional[Dict[str, Any]]
    next_action: Optional[str]  # continue, delegate, complete, error


def create_initial_state(
    user_id: str,
    session_id: str,
    thread_id: str,
    task_type: str,
    initial_message: str,
    metadata: Optional[Dict] = None
) -> StudyAbroadAgentState:
    """Create initial state for a new agent session"""
    from langchain_core.messages import HumanMessage

    return StudyAbroadAgentState(
        messages=[HumanMessage(content=initial_message)],
        user_id=user_id,
        session_id=session_id,
        thread_id=thread_id,
        current_task="",
        task_type=task_type,
        intent="",
        next_agent=None,
        agents_called=[],
        agent_scratchpad={},
        tool_results={},
        research_findings=None,
        generated_documents=None,
        tracked_applications=None,
        study_plan=None,
        final_answer=None,
        status="pending",
        errors=[],
        metadata=metadata or {}
    )
