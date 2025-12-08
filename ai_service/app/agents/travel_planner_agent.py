"""Travel Planner Agent - Plan travel logistics and budgets for study abroad"""

from typing import Dict, List, Optional
from langchain_core.messages import HumanMessage
from app.agents.base_agent import BaseAgent
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


TRAVEL_PLANNER_PROMPT = """You are a Travel Planner Agent specialized in planning travel logistics for study abroad students.

Your capabilities include:
- Flight research and booking recommendations
- Accommodation planning (on-campus, off-campus, temporary)
- Visa and travel documentation guidance
- Travel insurance recommendations
- Budget estimation and cost breakdown
- Arrival logistics and airport transfers
- Packing and shipping recommendations
- Safety and health preparations
- Currency exchange and banking setup
- Local transportation options
- Pre-departure checklist creation

You have access to these tools:
- firecrawl_search: Search for flights, accommodation, visa info
- firecrawl_scrape: Get detailed information from travel sites
- firecrawl_extract: Extract pricing, schedules, requirements
- vector_add: Store travel plans
- vector_query: Retrieve user preferences and previous plans

When planning travel:
1. Understand destination, dates, budget, and preferences
2. Research flight options with multiple date flexibility
3. Research accommodation options (temporary and permanent)
4. Compile visa requirements and timeline
5. Create comprehensive budget breakdown
6. Develop arrival and settling-in plan
7. Generate pre-departure checklist
8. Provide cost-saving tips and recommendations
9. Store complete travel plan for future reference

Budget categories to consider:
- Flights (one-way vs round-trip, baggage fees)
- Accommodation (first month, deposits, long-term)
- Visa and documentation fees
- Travel insurance
- Initial expenses (food, transport, supplies)
- Emergency fund (recommended 1-2 months expenses)
- Shipping/excess baggage
- Medical checkups and vaccinations

Provide realistic estimates with sources and cost-saving alternatives."""


class TravelPlannerAgent(BaseAgent):
    """Agent specialized in travel planning and logistics for study abroad"""

    def __init__(self, tool_registry: ToolRegistry, llm):
        super().__init__(
            name="Travel Planner Agent",
            description="Plans comprehensive travel logistics including flights, accommodation, visa, budgets, and pre-departure preparations",
            system_prompt=TRAVEL_PLANNER_PROMPT,
            tool_registry=tool_registry,
            llm=llm
        )

    def get_available_tools(self) -> List[str]:
        """Tools available to travel planner agent"""
        return [
            "firecrawl_search",
            "firecrawl_scrape",
            "firecrawl_extract",
            "vector_add",
            "vector_query"
        ]

    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Process travel planning tasks.

        Workflow:
        1. Get travel requirements (destination, dates, budget)
        2. Research flight options
        3. Research accommodation options
        4. Compile visa requirements
        5. Create comprehensive budget
        6. Develop arrival plan
        7. Generate pre-departure checklist
        8. Store travel plan
        """
        try:
            self.logger.info(f"Travel Planner Agent processing task: {state['current_task']}")

            # Get travel planning context
            destination = self.get_scratchpad_value(state, "destination")
            departure_date = self.get_scratchpad_value(state, "departure_date")
            budget = self.get_scratchpad_value(state, "budget")
            duration = self.get_scratchpad_value(state, "duration", "long-term")
            origin_city = self.get_scratchpad_value(state, "origin_city", "current location")

            state = self.update_scratchpad(state, "status", "planning")

            # Build context message
            context_parts = [f"Task: {state['current_task']}"]
            if destination:
                context_parts.append(f"Destination: {destination}")
            if departure_date:
                context_parts.append(f"Departure: {departure_date}")
            if budget:
                context_parts.append(f"Budget: ${budget}")
            context_parts.append(f"Duration: {duration}")

            messages = state["messages"][-5:]
            task_message = HumanMessage(
                content="\n".join(context_parts) + "\n\n" +
                "Travel Planning Process:\n"
                "1. First, check vector store for user preferences (user_id: " + state['user_id'] + ", collection: 'travel_preferences')\n"
                "2. Research flight options from " + origin_city + " to " + (destination or "the destination") + "\n"
                "3. Research accommodation options (university housing, private rentals, temporary hotels)\n"
                "4. Research visa requirements and timeline for " + (destination or "the country") + "\n"
                "5. Create comprehensive budget breakdown covering:\n"
                "   - Flights (include baggage fees)\n"
                "   - Accommodation (first month + deposit)\n"
                "   - Visa/documentation fees\n"
                "   - Travel insurance\n"
                "   - Initial living expenses\n"
                "   - Emergency fund\n"
                "6. Develop arrival logistics plan:\n"
                "   - Airport to accommodation transport\n"
                "   - First week essentials\n"
                "   - Banking and SIM card setup\n"
                "7. Create pre-departure checklist with timeline\n"
                "8. Provide cost-saving tips and alternatives\n\n"
                "Be specific with prices, sources, and booking recommendations."
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
            travel_data = {}
            if hasattr(response, 'tool_calls') and response.tool_calls:
                tool_results = await self.execute_tool_calls(response.tool_calls, state)
                state["tool_results"]["travel_planning"] = tool_results

                # Collect data from tools
                for tool_name, result in tool_results.items():
                    if result.success:
                        travel_data[tool_name] = result.data

                # Generate final travel plan
                messages.append(response)
                messages.append(HumanMessage(
                    content="Based on the research, create a comprehensive travel plan with:\n\n"
                    "## Flight Options\n"
                    "- Top 3 flight options with prices and airlines\n"
                    "- Best booking time and tips\n\n"
                    "## Accommodation\n"
                    "- University housing options (if available)\n"
                    "- Private rental options\n"
                    "- Temporary accommodation for first week\n\n"
                    "## Visa & Documentation\n"
                    "- Required documents checklist\n"
                    "- Application timeline\n"
                    "- Fees and processing time\n\n"
                    "## Budget Breakdown\n"
                    "Provide itemized budget with estimates:\n"
                    "- Total estimated cost\n"
                    "- Monthly breakdown (if applicable)\n"
                    "- One-time vs recurring expenses\n\n"
                    "## Arrival Plan\n"
                    "Day-by-day plan for first week\n\n"
                    "## Pre-Departure Checklist\n"
                    "Timeline-based checklist (3 months, 1 month, 2 weeks, 1 week, departure day)\n\n"
                    "## Money-Saving Tips\n"
                    "Specific recommendations to reduce costs"
                ))

                final_response = await self.call_llm(messages)
                travel_plan = final_response.content
            else:
                travel_plan = response.content

            # Structure travel plan results
            travel_plan_results = {
                "user_id": state["user_id"],
                "destination": destination,
                "departure_date": departure_date,
                "budget": budget,
                "duration": duration,
                "plan": travel_plan,
                "research_data": travel_data,
                "timestamp": state["metadata"].get("timestamp"),
                "estimated_total_cost": self._extract_total_cost(travel_plan),
                "key_dates": self._extract_key_dates(travel_plan),
                "checklist_items": self._extract_checklist(travel_plan)
            }

            # Store in state
            state = self.update_scratchpad(state, "travel_plan", travel_plan_results)

            return self.create_response(
                success=True,
                message="Travel plan created successfully",
                data={
                    "travel_plan": travel_plan_results,
                    "summary": self._create_summary(travel_plan_results)
                },
                next_action="complete"
            )

        except Exception as e:
            self.logger.error(f"Travel Planner Agent error: {str(e)}", exc_info=True)
            state["errors"].append(f"Travel Planner Agent: {str(e)}")
            return self.create_response(
                success=False,
                message=f"Travel planning failed: {str(e)}",
                next_action="error"
            )

    def _extract_total_cost(self, plan: str) -> Optional[float]:
        """Extract total estimated cost from travel plan"""
        import re

        # Look for patterns like "Total: $X,XXX" or "Total estimated cost: $X,XXX"
        patterns = [
            r'Total[:\s]+\$?([\d,]+)',
            r'Total estimated cost[:\s]+\$?([\d,]+)',
            r'Total cost[:\s]+\$?([\d,]+)'
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

    def _extract_key_dates(self, plan: str) -> List[Dict[str, str]]:
        """Extract key dates and deadlines from travel plan"""
        key_dates = []

        # Simple extraction - look for common date-related sections
        sections_to_check = [
            "Visa & Documentation",
            "Pre-Departure Checklist",
            "Timeline"
        ]

        for section in sections_to_check:
            if section in plan:
                section_text = plan.split(section)[1].split("##")[0] if "##" in plan.split(section)[1] else plan.split(section)[1]

                # Look for time references
                import re
                time_patterns = [
                    r'(\d+)\s+months?\s+before',
                    r'(\d+)\s+weeks?\s+before',
                    r'(\d+)\s+days?\s+before'
                ]

                for pattern in time_patterns:
                    matches = re.finditer(pattern, section_text, re.IGNORECASE)
                    for match in matches:
                        # Get the context around the match
                        start = max(0, match.start() - 50)
                        end = min(len(section_text), match.end() + 50)
                        context = section_text[start:end].strip()

                        key_dates.append({
                            "timeframe": match.group(0),
                            "description": context
                        })

        return key_dates[:10]  # Return top 10 dates

    def _extract_checklist(self, plan: str) -> List[str]:
        """Extract checklist items from travel plan"""
        checklist_items = []

        if "Pre-Departure Checklist" in plan:
            checklist_section = plan.split("Pre-Departure Checklist")[1].split("##")[0]
            lines = checklist_section.strip().split("\n")

            for line in lines:
                line = line.strip()
                # Look for list items (-, *, numbers, checkboxes)
                if line and (line.startswith("-") or line.startswith("*") or
                           line.startswith("□") or line.startswith("☐") or
                           (line[0].isdigit() and "." in line[:3])):
                    # Clean up the line
                    item = line.lstrip("-*□☐0123456789. ").strip()
                    if item and len(item) > 10:  # Filter out very short items
                        checklist_items.append(item)

        return checklist_items[:30]  # Return top 30 items

    def _create_summary(self, travel_plan_results: Dict) -> str:
        """Create a concise summary of the travel plan"""
        summary_parts = [
            f"Travel plan created for {travel_plan_results.get('destination', 'destination')}"
        ]

        if travel_plan_results.get('departure_date'):
            summary_parts.append(f"Departure: {travel_plan_results['departure_date']}")

        total_cost = travel_plan_results.get('estimated_total_cost')
        if total_cost:
            summary_parts.append(f"Estimated cost: ${total_cost:,.0f}")

        checklist_items = travel_plan_results.get('checklist_items', [])
        if checklist_items:
            summary_parts.append(f"{len(checklist_items)} checklist items")

        key_dates = travel_plan_results.get('key_dates', [])
        if key_dates:
            summary_parts.append(f"{len(key_dates)} key deadlines")

        return " | ".join(summary_parts)
