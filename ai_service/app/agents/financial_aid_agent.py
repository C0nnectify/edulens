"""Financial Aid Agent - Scholarship discovery and financial planning"""

from typing import Dict, List, Optional
from langchain_core.messages import HumanMessage
from app.agents.base_agent import BaseAgent
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


FINANCIAL_AID_AGENT_PROMPT = """You are a Financial Aid Agent specialized in scholarship discovery and financial planning for study abroad students.

Your capabilities include:
- Scholarship database search and matching
- Financial aid eligibility assessment
- Total cost of attendance calculation
- Funding strategy optimization
- Loan comparison and recommendations
- Budget planning and optimization
- Financial aid application guidance
- Deadline tracking for scholarships
- Alternative funding source discovery

You have access to these tools:
- firecrawl_search: Search scholarship databases and opportunities
- firecrawl_scrape: Get detailed scholarship requirements and deadlines
- firecrawl_extract: Extract financial data (tuition, fees, costs)
- vector_query: Retrieve user financial profile
- vector_add: Store financial plans and scholarship matches

When planning financial aid:
1. Understand total budget and financial need
2. Calculate total cost of attendance:
   - Tuition and fees
   - Living expenses (rent, food, utilities)
   - Books and supplies
   - Health insurance
   - Travel costs
   - Personal expenses
3. Research scholarships using Firecrawl:
   - University-specific scholarships
   - Government scholarships (Fulbright, Chevening, etc.)
   - Private foundation scholarships
   - Merit-based awards
   - Need-based grants
4. Assess eligibility for each opportunity
5. Create funding mix strategy:
   - Scholarships and grants (priority)
   - Assistantships and work-study
   - Education loans (if needed)
   - Personal savings
6. Provide application timeline with deadlines
7. Draft scholarship application materials
8. Calculate ROI (return on investment)

Financial Planning Principles:
- Maximize free money (scholarships/grants) first
- Minimize loan burden
- Consider work opportunities (TA, RA, part-time)
- Plan for currency fluctuations
- Include emergency fund (3-6 months)
- Account for visa restrictions on work hours

Scholarship Matching Criteria:
- Academic merit (GPA, test scores)
- Field of study alignment
- Country of origin requirements
- Financial need demonstration
- Leadership and extracurriculars
- Diversity and underrepresented groups
- Research interests and publications

Provide realistic estimates with sources and specific scholarship names/amounts."""


class FinancialAidAgent(BaseAgent):
    """Agent specialized in financial aid and scholarship discovery"""

    def __init__(self, tool_registry: ToolRegistry, llm):
        super().__init__(
            name="Financial Aid Agent",
            description="Discovers scholarships, plans financial aid strategy, and optimizes funding for study abroad",
            system_prompt=FINANCIAL_AID_AGENT_PROMPT,
            tool_registry=tool_registry,
            llm=llm
        )

    def get_available_tools(self) -> List[str]:
        """Tools available to financial aid agent"""
        return [
            "firecrawl_search",
            "firecrawl_scrape",
            "firecrawl_extract",
            "vector_query",
            "vector_add"
        ]

    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Process financial aid tasks.

        Workflow:
        1. Get user financial profile and needs
        2. Calculate total cost of attendance
        3. Search scholarships using Firecrawl
        4. Match scholarships to user profile
        5. Create optimal funding strategy
        6. Generate application timeline
        7. Store financial plan
        """
        try:
            self.logger.info(f"Financial Aid Agent processing task: {state['current_task']}")

            # Get financial context
            target_university = self.get_scratchpad_value(state, "target_university")
            program_level = self.get_scratchpad_value(state, "program_level", "Masters")
            country = self.get_scratchpad_value(state, "country")
            budget = self.get_scratchpad_value(state, "budget")
            field_of_study = self.get_scratchpad_value(state, "field_of_study")

            state = self.update_scratchpad(state, "status", "researching_financial_aid")

            # Build context message
            context_parts = [f"Task: {state['current_task']}"]
            if target_university:
                context_parts.append(f"University: {target_university}")
            if country:
                context_parts.append(f"Country: {country}")
            if program_level:
                context_parts.append(f"Program: {program_level}")
            if field_of_study:
                context_parts.append(f"Field: {field_of_study}")
            if budget:
                context_parts.append(f"Available Budget: ${budget}")

            messages = state["messages"][-5:]
            task_message = HumanMessage(
                content="\n".join(context_parts) + "\n\n" +
                "Financial Aid Planning Process:\n"
                "1. First, retrieve user's financial profile from vector store (user_id: " + state['user_id'] + ", collection: 'financial_profile')\n"
                "2. Research total cost of attendance for the target university:\n"
                "   - Use firecrawl_search to find tuition information\n"
                "   - Search for living cost estimates\n"
                "   - Include all fees and expenses\n"
                "3. Search for scholarships using firecrawl_search:\n"
                "   - University-specific scholarships\n"
                "   - Government scholarships (Fulbright, Chevening, DAAD, etc.)\n"
                "   - Private foundation scholarships\n"
                "   - Field-specific scholarships\n"
                "4. Extract detailed requirements using firecrawl_scrape\n"
                "5. Match scholarships to user profile:\n"
                "   - Check eligibility criteria\n"
                "   - Calculate match score\n"
                "   - Prioritize by amount and likelihood\n"
                "6. Create funding strategy:\n"
                "   - Total cost breakdown\n"
                "   - Scholarship recommendations (top 10)\n"
                "   - Loan options (if needed)\n"
                "   - Work opportunities\n"
                "   - Timeline with deadlines\n"
                "7. Calculate ROI and payback period\n\n"
                "Be specific with scholarship names, amounts, deadlines, and application URLs."
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
            financial_data = {}
            if hasattr(response, 'tool_calls') and response.tool_calls:
                tool_results = await self.execute_tool_calls(response.tool_calls, state)
                state["tool_results"]["financial_aid"] = tool_results

                # Collect data from tools
                for tool_name, result in tool_results.items():
                    if result.success:
                        financial_data[tool_name] = result.data

                # Generate final financial plan
                messages.append(response)
                messages.append(HumanMessage(
                    content="Based on the research, create a comprehensive financial aid plan:\n\n"
                    "## Total Cost of Attendance\n"
                    "Break down all costs with sources:\n"
                    "- Tuition: $X\n"
                    "- Living expenses: $X\n"
                    "- Books & supplies: $X\n"
                    "- Health insurance: $X\n"
                    "- Travel: $X\n"
                    "- Total: $X\n\n"
                    "## Scholarship Recommendations\n"
                    "List top 10 scholarships (prioritized by fit):\n"
                    "For each scholarship:\n"
                    "1. Name and provider\n"
                    "2. Amount (full/partial tuition, stipend)\n"
                    "3. Eligibility requirements\n"
                    "4. Application deadline\n"
                    "5. Match score (High/Medium/Low)\n"
                    "6. Application link\n\n"
                    "## Funding Strategy\n"
                    "Recommended funding mix:\n"
                    "- Scholarships: $X (list which ones)\n"
                    "- Personal savings: $X\n"
                    "- Education loan (if needed): $X\n"
                    "- Work (TA/RA/part-time): $X\n"
                    "- Total coverage: $X\n"
                    "- Gap (if any): $X\n\n"
                    "## Application Timeline\n"
                    "Chronological list of scholarship deadlines with actions\n\n"
                    "## Financial Aid Tips\n"
                    "Specific recommendations to maximize funding"
                ))

                final_response = await self.call_llm(messages)
                financial_plan = final_response.content
            else:
                financial_plan = response.content

            # Structure financial aid results
            financial_aid_results = {
                "user_id": state["user_id"],
                "target_university": target_university,
                "program_level": program_level,
                "country": country,
                "field_of_study": field_of_study,
                "budget": budget,
                "plan": financial_plan,
                "research_data": financial_data,
                "timestamp": state["metadata"].get("timestamp"),
                "total_cost": self._extract_total_cost(financial_plan),
                "scholarships_found": self._extract_scholarships(financial_plan),
                "funding_gap": self._calculate_funding_gap(financial_plan, budget)
            }

            # Store in state
            state = self.update_scratchpad(state, "financial_aid_plan", financial_aid_results)

            return self.create_response(
                success=True,
                message="Financial aid plan created successfully",
                data={
                    "financial_plan": financial_aid_results,
                    "summary": self._create_summary(financial_aid_results)
                },
                next_action="complete"
            )

        except Exception as e:
            self.logger.error(f"Financial Aid Agent error: {str(e)}", exc_info=True)
            state["errors"].append(f"Financial Aid Agent: {str(e)}")
            return self.create_response(
                success=False,
                message=f"Financial aid planning failed: {str(e)}",
                next_action="error"
            )

    def _extract_total_cost(self, plan: str) -> Optional[float]:
        """Extract total cost from financial plan"""
        import re

        # Look for "Total: $X" or "Total cost: $X"
        patterns = [
            r'Total[:\s]+\$?([\d,]+)',
            r'Total cost[:\s]+\$?([\d,]+)',
            r'Cost of attendance[:\s]+\$?([\d,]+)'
        ]

        for pattern in patterns:
            match = re.search(pattern, plan, re.IGNORECASE)
            if match:
                cost_str = match.group(1).replace(',', '')
                try:
                    return float(cost_str)
                except ValueError:
                    continue

        return None

    def _extract_scholarships(self, plan: str) -> List[Dict[str, any]]:
        """Extract scholarship information from plan"""
        scholarships = []

        if "## Scholarship Recommendations" in plan:
            section = plan.split("## Scholarship Recommendations")[1].split("##")[0]
            lines = section.strip().split("\n")

            current_scholarship = {}
            for line in lines:
                line = line.strip()
                if not line or line.startswith("#"):
                    if current_scholarship:
                        scholarships.append(current_scholarship)
                        current_scholarship = {}
                    continue

                # Parse scholarship details
                if ". " in line and line[0].isdigit():
                    parts = line.split(". ", 1)
                    if len(parts) == 2:
                        if "Name" in parts[1] or current_scholarship == {}:
                            current_scholarship["name"] = parts[1]
                        elif "Amount" in parts[0]:
                            current_scholarship["amount"] = parts[1]
                        elif "Eligibility" in parts[0]:
                            current_scholarship["eligibility"] = parts[1]
                        elif "deadline" in parts[0].lower():
                            current_scholarship["deadline"] = parts[1]
                        elif "Match" in parts[0]:
                            current_scholarship["match_score"] = parts[1]

            if current_scholarship:
                scholarships.append(current_scholarship)

        return scholarships[:10]  # Return top 10

    def _calculate_funding_gap(self, plan: str, budget: Optional[float]) -> Optional[float]:
        """Calculate funding gap (cost - available funding)"""
        total_cost = self._extract_total_cost(plan)
        if not total_cost:
            return None

        # Try to extract total coverage from funding strategy
        if "Total coverage" in plan:
            import re
            match = re.search(r'Total coverage[:\s]+\$?([\d,]+)', plan, re.IGNORECASE)
            if match:
                coverage = float(match.group(1).replace(',', ''))
                gap = total_cost - coverage
                return gap if gap > 0 else 0

        # Fallback: use budget if provided
        if budget:
            gap = total_cost - budget
            return gap if gap > 0 else 0

        return None

    def _create_summary(self, financial_aid_results: Dict) -> str:
        """Create a concise summary of the financial plan"""
        summary_parts = [
            f"Financial aid plan for {financial_aid_results.get('target_university', 'study abroad')}"
        ]

        total_cost = financial_aid_results.get('total_cost')
        if total_cost:
            summary_parts.append(f"Total cost: ${total_cost:,.0f}")

        scholarships = financial_aid_results.get('scholarships_found', [])
        if scholarships:
            summary_parts.append(f"{len(scholarships)} scholarships identified")

        funding_gap = financial_aid_results.get('funding_gap')
        if funding_gap is not None:
            if funding_gap > 0:
                summary_parts.append(f"Funding gap: ${funding_gap:,.0f}")
            else:
                summary_parts.append("Fully funded")

        return " | ".join(summary_parts)
