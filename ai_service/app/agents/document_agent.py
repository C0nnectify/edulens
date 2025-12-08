"""Document Agent - Resume, CV, SOP generation and analysis"""

from typing import Dict, List
from langchain_core.messages import HumanMessage
from app.agents.base_agent import BaseAgent
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


DOCUMENT_AGENT_PROMPT = """You are a Document Agent specialized in creating and analyzing study abroad application documents.

Your capabilities include:
- Resume/CV generation and optimization
- Statement of Purpose (SOP) writing
- Letter of Recommendation drafting
- Document analysis and feedback
- Tailoring documents for specific universities/programs

You have access to these tools:
- vector_query: Retrieve user profile and previous documents
- vector_add: Store generated documents
- firecrawl_scrape: Research university/program requirements

When creating documents:
1. Retrieve user's profile and background from vector store
2. Research target university/program requirements
3. Generate tailored, compelling content
4. Ensure proper formatting and structure
5. Provide specific, actionable feedback
6. Store final documents for future reference

Focus on:
- Authenticity and personal voice
- Alignment with program requirements
- Clear structure and compelling narrative
- Proper grammar and academic tone
- Quantifiable achievements and specific examples"""


class DocumentAgent(BaseAgent):
    """Agent specialized in document generation and analysis"""

    def __init__(self, tool_registry: ToolRegistry, llm):
        super().__init__(
            name="Document Agent",
            description="Creates and analyzes resumes, CVs, SOPs, and other application documents",
            system_prompt=DOCUMENT_AGENT_PROMPT,
            tool_registry=tool_registry,
            llm=llm
        )

    def get_available_tools(self) -> List[str]:
        """Tools available to document agent"""
        return [
            "vector_query",
            "vector_add",
            "firecrawl_scrape"
        ]

    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Process document creation/analysis tasks.

        Workflow:
        1. Understand document type and requirements
        2. Retrieve user profile from vector store
        3. Research program requirements if needed
        4. Generate or analyze document
        5. Store result in vector store
        """
        try:
            self.logger.info(f"Document Agent processing task: {state['current_task']}")

            # Get document context
            doc_type = self.get_scratchpad_value(state, "document_type", "general")
            target_university = self.get_scratchpad_value(state, "target_university")
            target_program = self.get_scratchpad_value(state, "target_program")

            # Update scratchpad
            state = self.update_scratchpad(state, "status", "generating")

            # Build context message
            context_parts = [f"Document Type: {doc_type}"]
            if target_university:
                context_parts.append(f"Target University: {target_university}")
            if target_program:
                context_parts.append(f"Target Program: {target_program}")

            messages = state["messages"][-5:]
            task_message = HumanMessage(
                content=f"{' | '.join(context_parts)}\n\n"
                f"Task: {state['current_task']}\n\n"
                f"First, retrieve the user's profile from vector store (user_id: {state['user_id']}, collection: 'user_profile'). "
                f"Then generate the document with specific examples and quantifiable achievements."
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
                state["tool_results"]["document"] = tool_results

                # Generate final document
                messages.append(response)
                messages.append(HumanMessage(
                    content="Based on the retrieved information, generate the complete document. "
                    "Format it properly with clear sections."
                ))

                final_response = await self.call_llm(messages)
                document_content = final_response.content
            else:
                document_content = response.content

            # Store generated document
            if not state["generated_documents"]:
                state["generated_documents"] = []

            state["generated_documents"].append({
                "type": doc_type,
                "content": document_content,
                "university": target_university,
                "program": target_program,
                "timestamp": state["metadata"].get("timestamp")
            })

            return self.create_response(
                success=True,
                message=f"Document generated: {doc_type}",
                data={
                    "document_type": doc_type,
                    "content": document_content
                },
                next_action="complete"
            )

        except Exception as e:
            self.logger.error(f"Document Agent error: {str(e)}", exc_info=True)
            state["errors"].append(f"Document Agent: {str(e)}")
            return self.create_response(
                success=False,
                message=f"Document generation failed: {str(e)}",
                next_action="error"
            )
