"""Planning Agent - Comprehensive study abroad planning"""

from typing import Dict, List
from langchain_core.messages import HumanMessage
from app.agents.base_agent import BaseAgent
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


PLANNING_AGENT_PROMPT = """You are a Planning Agent specialized in creating comprehensive study abroad plans.

Your capabilities include:
- Creating end-to-end study abroad timelines
- Budget planning and cost analysis
- Application strategy development
- Timeline coordination
- Resource allocation

You coordinate with other agents to gather information:
- Research Agent: For university research, cost analysis
- Document Agent: For document preparation timelines
- Tracking Agent: For deadline monitoring

When creating plans:
1. Understand the user's goals, timeline, and budget
2. Delegate research to Research Agent
3. Create comprehensive timeline with milestones
4. Break down tasks into actionable steps
5. Identify resource requirements
6. Set up tracking for key deadlines

Focus on:
- Realistic timelines
- Budget feasibility
- Task dependencies
- Risk mitigation
- Regular check-ins and milestones"""


class PlanningAgent(BaseAgent):
    """Agent specialized in study abroad planning and coordination"""

    def __init__(self, tool_registry: ToolRegistry, llm):
        super().__init__(
            name="Planning Agent",
            description="Creates comprehensive study abroad plans, timelines, and budgets",
            system_prompt=PLANNING_AGENT_PROMPT,
            tool_registry=tool_registry,
            llm=llm
        )

    def get_available_tools(self) -> List[str]:
        """Tools available to planning agent"""
        return [
            "vector_query",
            "vector_add",
            "firecrawl_search"
        ]

    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Process planning tasks.

        Workflow:
        1. Understand user goals and constraints
        2. Gather necessary information (may delegate to other agents)
        3. Create comprehensive plan with timeline
        4. Break down into actionable tasks
        5. Identify milestones and deadlines
        6. Store plan for future reference
        """
        try:
            self.logger.info(f"Planning Agent processing task: {state['current_task']}")

            # Get planning context
            target_country = self.get_scratchpad_value(state, "target_country")
            program_type = self.get_scratchpad_value(state, "program_type")
            budget = self.get_scratchpad_value(state, "budget")
            timeline = self.get_scratchpad_value(state, "timeline")

            state = self.update_scratchpad(state, "status", "planning")

            # Build planning context
            context_parts = [f"Task: {state['current_task']}"]
            if target_country:
                context_parts.append(f"Country: {target_country}")
            if program_type:
                context_parts.append(f"Program: {program_type}")
            if budget:
                context_parts.append(f"Budget: ${budget}")
            if timeline:
                context_parts.append(f"Timeline: {timeline}")

            messages = state["messages"][-5:]
            task_message = HumanMessage(
                content="\n".join(context_parts) + "\n\n" +
                "Create a comprehensive study abroad plan with:\n"
                "1. Timeline with key milestones\n"
                "2. Budget breakdown\n"
                "3. Application strategy\n"
                "4. Required documents and deadlines\n"
                "5. Actionable next steps\n\n"
                "You may need to query the vector store for user information or previous research."
            )
            messages.append(task_message)

            # Get tools
            available_tool_names = self.get_available_tools()
            tools = [
                self.tool_registry.get_tool(name).get_schema()
                for name in available_tool_names
                if self.tool_registry.get_tool(name)
            ]

            # Call LLM
            response = await self.call_llm(messages, tools)

            # Handle tool calls
            if hasattr(response, 'tool_calls') and response.tool_calls:
                tool_results = await self.execute_tool_calls(response.tool_calls, state)
                state["tool_results"]["planning"] = tool_results

                # Generate final plan
                messages.append(response)
                messages.append(HumanMessage(
                    content="Based on the information gathered, create the comprehensive study abroad plan. "
                    "Be specific with dates, costs, and action items."
                ))

                final_response = await self.call_llm(messages)
                plan_content = final_response.content
            else:
                plan_content = response.content

            # Store study plan
            study_plan = {
                "target_country": target_country,
                "program_type": program_type,
                "budget": budget,
                "timeline": timeline,
                "plan_content": plan_content,
                "timestamp": state["metadata"].get("timestamp"),
                "status": "active"
            }

            state["study_plan"] = study_plan

            return self.create_response(
                success=True,
                message="Study abroad plan created",
                data={"plan": study_plan},
                next_action="complete"
            )

        except Exception as e:
            self.logger.error(f"Planning Agent error: {str(e)}", exc_info=True)
            state["errors"].append(f"Planning Agent: {str(e)}")
            return self.create_response(
                success=False,
                message=f"Planning failed: {str(e)}",
                next_action="error"
            )
