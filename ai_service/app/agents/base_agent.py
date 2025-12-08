"""Base agent class for multi-agent system"""

from typing import Dict, List, Optional, Any
from abc import ABC, abstractmethod
from langchain_core.messages import BaseMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base class for all specialized agents in the system.

    Each agent is responsible for a specific domain (research, documents, tracking, planning)
    and has access to a set of tools to accomplish its tasks.
    """

    def __init__(
        self,
        name: str,
        description: str,
        system_prompt: str,
        tool_registry: ToolRegistry,
        llm: Optional[ChatGoogleGenerativeAI] = None
    ):
        self.name = name
        self.description = description
        self.system_prompt = system_prompt
        self.tool_registry = tool_registry
        self.llm = llm
        self.logger = logging.getLogger(f"{__name__}.{name}")

    @abstractmethod
    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Main processing method for the agent.

        Args:
            state: Current graph state

        Returns:
            AgentResponse with agent's decision and results
        """
        pass

    def get_system_message(self) -> SystemMessage:
        """Get the system message for this agent"""
        return SystemMessage(content=self.system_prompt)

    def get_available_tools(self) -> List[str]:
        """
        Get list of tool names this agent can use.
        Override in subclasses to specify agent-specific tools.
        """
        return []

    async def call_llm(
        self,
        messages: List[BaseMessage],
        tools: Optional[List] = None
    ) -> AIMessage:
        """
        Call the LLM with conversation history and optional tools.

        Args:
            messages: Conversation history
            tools: Optional list of tools for tool calling

        Returns:
            AIMessage from the LLM
        """
        if not self.llm:
            raise ValueError(f"Agent {self.name} has no LLM configured")

        # Prepend system message
        full_messages = [self.get_system_message()] + messages

        if tools:
            # LLM with tool calling
            llm_with_tools = self.llm.bind_tools(tools)
            response = await llm_with_tools.ainvoke(full_messages)
        else:
            response = await self.llm.ainvoke(full_messages)

        return response

    async def execute_tool_calls(
        self,
        tool_calls: List[Dict],
        state: StudyAbroadAgentState
    ) -> Dict[str, Any]:
        """
        Execute multiple tool calls and aggregate results.

        Args:
            tool_calls: List of tool calls from LLM
            state: Current state for context

        Returns:
            Dict of tool results
        """
        results = {}

        for tool_call in tool_calls:
            tool_name = tool_call.get("name")
            tool_args = tool_call.get("args", {})

            self.logger.info(f"Agent {self.name} calling tool: {tool_name}")

            result = await self.tool_registry.execute_tool(tool_name, **tool_args)
            results[tool_name] = result

            # Log tool execution
            if result.success:
                self.logger.info(f"Tool {tool_name} executed successfully")
            else:
                self.logger.error(f"Tool {tool_name} failed: {result.error}")

        return results

    def update_scratchpad(
        self,
        state: StudyAbroadAgentState,
        key: str,
        value: Any
    ) -> StudyAbroadAgentState:
        """
        Update this agent's scratchpad in the state.

        Agent scratchpads provide isolated work areas for each agent.
        """
        if self.name not in state["agent_scratchpad"]:
            state["agent_scratchpad"][self.name] = {}

        state["agent_scratchpad"][self.name][key] = value
        return state

    def get_scratchpad_value(
        self,
        state: StudyAbroadAgentState,
        key: str,
        default: Any = None
    ) -> Any:
        """Get a value from this agent's scratchpad"""
        return state["agent_scratchpad"].get(self.name, {}).get(key, default)

    def create_response(
        self,
        success: bool,
        message: str,
        data: Optional[Dict] = None,
        next_action: str = "continue"
    ) -> AgentResponse:
        """
        Create a standardized agent response.

        Args:
            success: Whether the agent succeeded
            message: Response message
            data: Optional data payload
            next_action: What should happen next (continue, delegate, complete, error)

        Returns:
            AgentResponse
        """
        return AgentResponse(
            agent_name=self.name,
            success=success,
            message=message,
            data=data,
            next_action=next_action
        )

    def get_handoff_tool(self) -> Dict[str, Any]:
        """
        Get the handoff tool definition for this agent.

        Used by the supervisor to call this agent as a "tool".
        """
        return {
            "type": "function",
            "function": {
                "name": f"handoff_to_{self.name.lower().replace(' ', '_')}",
                "description": f"Hand off the task to the {self.name}. {self.description}",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task_description": {
                            "type": "string",
                            "description": "Description of the task for this agent"
                        },
                        "context": {
                            "type": "object",
                            "description": "Additional context for the agent"
                        }
                    },
                    "required": ["task_description"]
                }
            }
        }
