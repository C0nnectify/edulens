"""Research Agent - Deep research on study abroad topics"""

from typing import Dict, List, Optional
from langchain_core.messages import HumanMessage, AIMessage
from app.agents.base_agent import BaseAgent
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


RESEARCH_AGENT_PROMPT = """You are a Research Agent specialized in study abroad research.

Your capabilities include:
- Deep web research using Firecrawl (scraping, crawling, searching)
- University rankings and program comparisons
- Scholarship opportunity discovery
- Cost of living analysis
- Professor and alumni research
- Application requirements extraction

You have access to these tools:
- firecrawl_scrape: Scrape single URLs (university pages, program details)
- firecrawl_batch_scrape: Scrape multiple URLs in parallel
- firecrawl_crawl: Crawl entire website sections
- firecrawl_search: Web search with content extraction
- firecrawl_extract: Extract structured data (deadlines, fees, requirements)
- vector_add: Store research findings for later retrieval
- vector_query: Search previous research findings

When researching:
1. Start broad, then narrow down based on findings
2. Always verify information from multiple sources
3. Extract structured data (deadlines, costs, requirements)
4. Store important findings in vector store
5. Provide comprehensive summaries with sources

Always cite your sources and provide URLs for verification."""


class ResearchAgent(BaseAgent):
    """Agent specialized in deep research for study abroad"""

    def __init__(self, tool_registry: ToolRegistry, llm):
        super().__init__(
            name="Research Agent",
            description="Conducts deep web research on universities, programs, scholarships, and study abroad opportunities using Firecrawl MCP",
            system_prompt=RESEARCH_AGENT_PROMPT,
            tool_registry=tool_registry,
            llm=llm
        )

    def get_available_tools(self) -> List[str]:
        """Tools available to research agent"""
        return [
            "firecrawl_scrape",
            "firecrawl_batch_scrape",
            "firecrawl_crawl",
            "firecrawl_search",
            "firecrawl_extract",
            "vector_add",
            "vector_query"
        ]

    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Process research tasks.

        Research workflow:
        1. Understand the research query
        2. Plan research strategy
        3. Execute searches/scrapes
        4. Analyze and synthesize findings
        5. Store important data in vector store
        6. Return comprehensive research report
        """
        try:
            self.logger.info(f"Research Agent processing task: {state['current_task']}")

            # Get research context from scratchpad
            research_query = self.get_scratchpad_value(state, "research_query")
            if not research_query:
                # Extract from current task or last user message
                research_query = state["current_task"]

            # Update scratchpad
            state = self.update_scratchpad(state, "research_query", research_query)
            state = self.update_scratchpad(state, "status", "researching")

            # Build conversation for LLM
            messages = state["messages"][-5:]  # Last 5 messages for context

            # Add task-specific context
            task_message = HumanMessage(
                content=f"Research Task: {research_query}\n\n"
                f"Use your tools to conduct comprehensive research. "
                f"Provide findings with sources."
            )
            messages.append(task_message)

            # Get tool schemas
            available_tool_names = self.get_available_tools()
            tools = [
                self.tool_registry.get_tool(name).get_schema()
                for name in available_tool_names
                if self.tool_registry.get_tool(name)
            ]

            # Call LLM with tools
            response = await self.call_llm(messages, tools)

            # Check for tool calls
            if hasattr(response, 'tool_calls') and response.tool_calls:
                # Execute tool calls
                tool_results = await self.execute_tool_calls(response.tool_calls, state)

                # Store tool results in state
                state["tool_results"]["research"] = tool_results

                # Update scratchpad with findings
                findings = []
                for tool_name, result in tool_results.items():
                    if result.success:
                        findings.append({
                            "tool": tool_name,
                            "data": result.data
                        })

                state = self.update_scratchpad(state, "findings", findings)

                # Get final synthesis from LLM
                synthesis_message = HumanMessage(
                    content=f"Based on the research results, provide a comprehensive summary with key findings and sources."
                )
                messages.append(response)
                messages.append(synthesis_message)

                final_response = await self.call_llm(messages)
                research_summary = final_response.content

            else:
                # No tools called, use direct response
                research_summary = response.content

            # Update state with research findings
            if not state["research_findings"]:
                state["research_findings"] = []

            state["research_findings"].append({
                "query": research_query,
                "summary": research_summary,
                "timestamp": state["metadata"].get("timestamp"),
                "sources": self._extract_sources_from_findings(
                    self.get_scratchpad_value(state, "findings", [])
                )
            })

            return self.create_response(
                success=True,
                message=f"Research completed on: {research_query}",
                data={
                    "summary": research_summary,
                    "findings_count": len(self.get_scratchpad_value(state, "findings", []))
                },
                next_action="complete"
            )

        except Exception as e:
            self.logger.error(f"Research Agent error: {str(e)}", exc_info=True)
            state["errors"].append(f"Research Agent: {str(e)}")
            return self.create_response(
                success=False,
                message=f"Research failed: {str(e)}",
                next_action="error"
            )

    def _extract_sources_from_findings(self, findings: List[Dict]) -> List[str]:
        """Extract source URLs from research findings"""
        sources = []
        for finding in findings:
            data = finding.get("data", {})
            if "url" in data:
                sources.append(data["url"])
            elif "results" in data:
                for result in data.get("results", []):
                    if "url" in result:
                        sources.append(result["url"])
        return list(set(sources))  # Deduplicate
