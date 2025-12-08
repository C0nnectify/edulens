"""Tracking Agent - Monitor application portals and deadlines"""

from typing import Dict, List
from langchain_core.messages import HumanMessage
from app.agents.base_agent import BaseAgent
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


TRACKING_AGENT_PROMPT = """You are a Tracking Agent specialized in monitoring university application portals and deadlines.

Your capabilities include:
- Scraping application portal status updates
- Extracting deadlines and important dates
- Monitoring for changes in application requirements
- Sending email notifications for updates
- Tracking multiple applications simultaneously

You have access to these tools:
- firecrawl_scrape: Check portal status and extract information
- firecrawl_extract: Extract structured data (status, deadlines, requirements)
- vector_add: Store tracking history
- vector_query: Retrieve previous tracking data
- email_send: Send notifications to users

When tracking applications:
1. Scrape the application portal regularly
2. Extract key information (status, updates, deadlines)
3. Compare with previous data to detect changes
4. Send notifications for important updates
5. Store tracking history for trend analysis

Focus on:
- Accurate status detection
- Important deadline identification
- Change detection
- Timely notifications
- Historical tracking"""


class TrackingAgent(BaseAgent):
    """Agent specialized in application tracking and monitoring"""

    def __init__(self, tool_registry: ToolRegistry, llm):
        super().__init__(
            name="Tracking Agent",
            description="Monitors application portals, tracks deadlines, and sends notifications",
            system_prompt=TRACKING_AGENT_PROMPT,
            tool_registry=tool_registry,
            llm=llm
        )

    def get_available_tools(self) -> List[str]:
        """Tools available to tracking agent"""
        return [
            "firecrawl_scrape",
            "firecrawl_extract",
            "vector_add",
            "vector_query",
            "email_send"
        ]

    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Process tracking tasks.

        Workflow:
        1. Identify what to track (portal URLs, deadlines)
        2. Scrape current status
        3. Compare with historical data
        4. Detect changes
        5. Send notifications if needed
        6. Store updated tracking data
        """
        try:
            self.logger.info(f"Tracking Agent processing task: {state['current_task']}")

            # Get tracking context
            portal_url = self.get_scratchpad_value(state, "portal_url")
            tracking_type = self.get_scratchpad_value(state, "tracking_type", "status")

            state = self.update_scratchpad(state, "status", "tracking")

            messages = state["messages"][-5:]
            task_message = HumanMessage(
                content=f"Tracking Task: {state['current_task']}\n"
                f"Portal URL: {portal_url if portal_url else 'To be determined'}\n"
                f"Type: {tracking_type}\n\n"
                f"Use tools to scrape portal, extract information, and compare with previous data."
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
            tracking_results = {}
            if hasattr(response, 'tool_calls') and response.tool_calls:
                tool_results = await self.execute_tool_calls(response.tool_calls, state)
                state["tool_results"]["tracking"] = tool_results

                # Analyze results
                for tool_name, result in tool_results.items():
                    if result.success:
                        tracking_results[tool_name] = result.data

                # Get summary
                messages.append(response)
                messages.append(HumanMessage(
                    content="Summarize the tracking results. Highlight any important changes or deadlines."
                ))

                final_response = await self.call_llm(messages)
                summary = final_response.content
            else:
                summary = response.content

            # Update tracked applications
            if not state["tracked_applications"]:
                state["tracked_applications"] = []

            state["tracked_applications"].append({
                "portal_url": portal_url,
                "tracking_type": tracking_type,
                "results": tracking_results,
                "summary": summary,
                "timestamp": state["metadata"].get("timestamp")
            })

            return self.create_response(
                success=True,
                message="Tracking completed",
                data={
                    "summary": summary,
                    "tracked_items": len(tracking_results)
                },
                next_action="complete"
            )

        except Exception as e:
            self.logger.error(f"Tracking Agent error: {str(e)}", exc_info=True)
            state["errors"].append(f"Tracking Agent: {str(e)}")
            return self.create_response(
                success=False,
                message=f"Tracking failed: {str(e)}",
                next_action="error"
            )
