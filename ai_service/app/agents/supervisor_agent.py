"""Supervisor Agent - Orchestrates multi-agent system"""

from typing import Dict, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.agents.base_agent import BaseAgent
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


SUPERVISOR_PROMPT = """You are the Supervisor Agent that coordinates a team of specialized agents for study abroad assistance.

Your team consists of:
1. Research Agent: Deep web research on universities, programs, scholarships, costs
2. Document Agent: Creates resumes, CVs, SOPs, and other application documents
3. Tracking Agent: Monitors application portals and deadlines
4. Planning Agent: Creates comprehensive study abroad plans and timelines
5. Profile Evaluation Agent: Assesses student profiles, provides competitiveness analysis and recommendations
6. Travel Planner Agent: Plans flights, accommodation, visa, budgets, and pre-departure logistics
7. Financial Aid Agent: Discovers scholarships, plans financial aid strategy, optimizes funding
8. Peer Networking Agent: Connects with alumni and current students for mentorship and networking
9. Cultural Adaptation Agent: Cultural preparation, language learning, integration support

Your responsibilities:
- Analyze user requests and classify intent
- Route tasks to the appropriate specialist agent
- Coordinate multi-step workflows across agents
- Synthesize results from multiple agents
- Make decisions about next steps
- Determine when to complete vs continue

Decision-making guidelines:
- Use Research Agent for: university research, program comparison, scholarship search, cost analysis
- Use Document Agent for: resume/CV/SOP creation, document review, application materials
- Use Tracking Agent for: portal monitoring, deadline tracking, status updates
- Use Planning Agent for: creating comprehensive plans, timelines, budget analysis
- Use Profile Evaluation Agent for: profile assessment, competitiveness analysis, program fit, recommendations
- Use Travel Planner Agent for: flight research, accommodation, visa planning, travel budgets, pre-departure prep
- Use Financial Aid Agent for: scholarship discovery, financial planning, funding strategy, loan comparison
- Use Peer Networking Agent for: alumni connections, mentorship matching, networking introductions
- Use Cultural Adaptation Agent for: cultural preparation, language learning, integration tips, safety guidance
- Complete when: The user's question is fully answered or task is complete
- Continue when: More information or agent work is needed

When routing:
1. Analyze the user's request carefully
2. Identify which agent(s) are needed
3. Provide clear task description for the agent
4. Monitor progress and decide next steps

Available handoff tools:
- handoff_to_research_agent: For research tasks
- handoff_to_document_agent: For document creation
- handoff_to_tracking_agent: For monitoring tasks
- handoff_to_planning_agent: For planning tasks
- handoff_to_profile_evaluation_agent: For profile assessment
- handoff_to_travel_planner_agent: For travel planning
- handoff_to_financial_aid_agent: For financial planning
- handoff_to_peer_networking_agent: For networking
- handoff_to_cultural_adaptation_agent: For cultural prep

Be decisive and efficient in routing. Provide clear context to agents."""


class SupervisorAgent(BaseAgent):
    """
    Supervisor agent that orchestrates the multi-agent system.

    Uses tool-calling pattern where each specialist agent is exposed as a tool.
    """

    def __init__(
        self,
        tool_registry: ToolRegistry,
        llm,
        specialist_agents: Dict[str, BaseAgent]
    ):
        super().__init__(
            name="Supervisor",
            description="Coordinates specialist agents and routes tasks",
            system_prompt=SUPERVISOR_PROMPT,
            tool_registry=tool_registry,
            llm=llm
        )
        self.specialist_agents = specialist_agents

    def get_handoff_tools(self) -> List[Dict]:
        """Get handoff tools for all specialist agents"""
        return [agent.get_handoff_tool() for agent in self.specialist_agents.values()]

    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Supervisor processing: Route to appropriate agent or complete.

        Decision flow:
        1. Analyze conversation and current state
        2. Determine if task needs agent or can be completed
        3. Route to agent or provide final answer
        """
        try:
            self.logger.info("Supervisor analyzing request and routing...")

            messages = state["messages"]

            # Add supervisor context
            context_message = HumanMessage(
                content=f"Current task: {state['current_task']}\n"
                f"Task type: {state['task_type']}\n"
                f"Agents called so far: {', '.join(state['agents_called']) if state['agents_called'] else 'None'}\n\n"
                f"Decide: Should you hand off to a specialist agent, or is the task complete?"
            )

            # Get handoff tools
            handoff_tools = self.get_handoff_tools()

            # Call supervisor LLM with handoff tools
            response = await self.call_llm(
                messages + [context_message],
                tools=handoff_tools
            )

            # Check if supervisor made a handoff decision
            if hasattr(response, 'tool_calls') and response.tool_calls:
                # Supervisor wants to hand off to an agent
                tool_call = response.tool_calls[0]  # Take first handoff
                agent_name = self._parse_agent_from_handoff(tool_call["name"])

                if agent_name:
                    self.logger.info(f"Supervisor routing to: {agent_name}")

                    # Update state
                    state["next_agent"] = agent_name
                    state["agents_called"].append(agent_name)

                    # Get task description from tool call
                    task_description = tool_call.get("args", {}).get("task_description", state["current_task"])
                    state["current_task"] = task_description

                    return self.create_response(
                        success=True,
                        message=f"Routing to {agent_name}",
                        data={"next_agent": agent_name, "task": task_description},
                        next_action="delegate"
                    )

            # No handoff - supervisor is completing the task
            self.logger.info("Supervisor completing task directly")

            # Extract final answer
            final_answer = response.content if isinstance(response, AIMessage) else str(response)
            state["final_answer"] = final_answer
            state["status"] = "completed"

            return self.create_response(
                success=True,
                message="Task completed",
                data={"final_answer": final_answer},
                next_action="complete"
            )

        except Exception as e:
            self.logger.error(f"Supervisor error: {str(e)}", exc_info=True)
            state["errors"].append(f"Supervisor: {str(e)}")
            return self.create_response(
                success=False,
                message=f"Supervisor error: {str(e)}",
                next_action="error"
            )

    def _parse_agent_from_handoff(self, handoff_tool_name: str) -> Optional[str]:
        """Parse agent name from handoff tool name"""
        # handoff_to_research_agent -> Research Agent
        if "research_agent" in handoff_tool_name:
            return "Research Agent"
        elif "document_agent" in handoff_tool_name:
            return "Document Agent"
        elif "tracking_agent" in handoff_tool_name:
            return "Tracking Agent"
        elif "planning_agent" in handoff_tool_name:
            return "Planning Agent"
        elif "profile_evaluation_agent" in handoff_tool_name:
            return "Profile Evaluation Agent"
        elif "travel_planner_agent" in handoff_tool_name:
            return "Travel Planner Agent"
        elif "financial_aid_agent" in handoff_tool_name:
            return "Financial Aid Agent"
        elif "peer_networking_agent" in handoff_tool_name:
            return "Peer Networking Agent"
        elif "cultural_adaptation_agent" in handoff_tool_name:
            return "Cultural Adaptation Agent"
        return None

    def classify_intent(self, user_message: str) -> str:
        """
        Classify user intent to help routing.

        Returns: research, document, tracking, planning, profile_evaluation, travel_planning,
                 financial_aid, peer_networking, cultural_adaptation, or general
        """
        user_lower = user_message.lower()

        # Financial aid keywords
        if any(kw in user_lower for kw in [
            "scholarship", "financial aid", "funding", "grant", "loan",
            "tuition", "cost", "afford", "budget", "expensive",
            "money", "finance", "stipend", "assistantship", "aid"
        ]):
            return "financial_aid"

        # Peer networking keywords
        if any(kw in user_lower for kw in [
            "alumni", "connect", "network", "mentor", "students",
            "meet", "introduction", "peer", "senior", "current student",
            "talk to", "advice from", "linkedin"
        ]):
            return "peer_networking"

        # Cultural adaptation keywords
        if any(kw in user_lower for kw in [
            "culture", "language", "adapt", "integration", "custom",
            "etiquette", "cultural", "learn language", "practice",
            "cultural shock", "fit in", "local", "phrases", "communication"
        ]):
            return "cultural_adaptation"

        # Profile evaluation keywords
        if any(kw in user_lower for kw in [
            "evaluate", "assess", "profile", "chances", "competitive",
            "fit", "strength", "weakness", "recommend", "improve profile",
            "admission chances", "competitiveness"
        ]):
            return "profile_evaluation"

        # Travel planning keywords
        if any(kw in user_lower for kw in [
            "flight", "travel", "accommodation", "housing", "visa",
            "ticket", "hotel", "arrival", "departure", "moving",
            "shipping", "luggage", "pre-departure", "travel budget"
        ]):
            return "travel_planning"

        # Research keywords
        if any(kw in user_lower for kw in [
            "university", "search", "find", "research", "compare",
            "ranking", "scholarship", "cost", "program", "admission"
        ]):
            return "research"

        # Document keywords
        if any(kw in user_lower for kw in [
            "resume", "cv", "sop", "statement", "letter", "document",
            "write", "create", "draft"
        ]):
            return "document"

        # Tracking keywords
        if any(kw in user_lower for kw in [
            "track", "status", "portal", "deadline", "monitor",
            "application status", "check"
        ]):
            return "tracking"

        # Planning keywords
        if any(kw in user_lower for kw in [
            "plan", "timeline", "budget", "strategy", "prepare",
            "roadmap", "schedule"
        ]):
            return "planning"

        return "general"
