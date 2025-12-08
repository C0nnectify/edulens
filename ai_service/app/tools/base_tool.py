"""Base tool class for agent tools"""

from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)


class ToolResult(BaseModel):
    """Standard result format for tool execution"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BaseTool(ABC):
    """
    Base class for all agent tools.

    Tools are modular capabilities that agents can use to perform specific tasks.
    Each tool should be stateless and focused on a single responsibility.
    """

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.logger = logging.getLogger(f"{__name__}.{name}")

    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """
        Execute the tool with given parameters.

        Args:
            **kwargs: Tool-specific parameters

        Returns:
            ToolResult: Standardized result object
        """
        pass

    def get_schema(self) -> Dict[str, Any]:
        """
        Get tool schema for LLM tool calling.

        Returns:
            Dict containing tool name, description, and parameters
        """
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self._get_parameters_schema()
        }

    @abstractmethod
    def _get_parameters_schema(self) -> Dict[str, Any]:
        """Define the parameters schema for this tool"""
        pass

    async def validate_params(self, **kwargs) -> bool:
        """
        Validate tool parameters before execution.

        Args:
            **kwargs: Parameters to validate

        Returns:
            bool: True if valid, raises exception if not
        """
        # Override in subclasses for custom validation
        return True

    async def _handle_error(self, error: Exception) -> ToolResult:
        """Standard error handling for tools"""
        self.logger.error(f"Tool {self.name} error: {str(error)}", exc_info=True)
        return ToolResult(
            success=False,
            error=str(error),
            metadata={"error_type": type(error).__name__}
        )


class ToolRegistry:
    """
    Registry for managing all available tools.

    Provides centralized access to tools and their schemas for agent use.
    """

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self.logger = logging.getLogger(__name__)

    def register(self, tool: BaseTool):
        """Register a new tool"""
        self._tools[tool.name] = tool
        self.logger.info(f"Registered tool: {tool.name}")

    def get_tool(self, name: str) -> Optional[BaseTool]:
        """Get a tool by name"""
        return self._tools.get(name)

    def get_all_tools(self) -> List[BaseTool]:
        """Get all registered tools"""
        return list(self._tools.values())

    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        """Get schemas for all tools (for LLM tool calling)"""
        return [tool.get_schema() for tool in self._tools.values()]

    def get_tools_by_category(self, category: str) -> List[BaseTool]:
        """Get all tools in a specific category"""
        return [
            tool for tool in self._tools.values()
            if hasattr(tool, 'category') and tool.category == category
        ]

    async def execute_tool(self, name: str, **kwargs) -> ToolResult:
        """Execute a tool by name with given parameters"""
        tool = self.get_tool(name)
        if not tool:
            return ToolResult(
                success=False,
                error=f"Tool '{name}' not found"
            )

        try:
            await tool.validate_params(**kwargs)
            return await tool.execute(**kwargs)
        except Exception as e:
            return await tool._handle_error(e)


# Global tool registry instance
tool_registry = ToolRegistry()
