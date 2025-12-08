"""Cultural Adaptation Agent - Cultural preparation and language learning support"""

from typing import Dict, List, Optional
from langchain_core.messages import HumanMessage
from app.agents.base_agent import BaseAgent
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


CULTURAL_ADAPTATION_AGENT_PROMPT = """You are a Cultural Adaptation Agent specialized in preparing students for cultural transition and language learning for study abroad.

Your capabilities include:
- Cultural norms and etiquette research
- Language proficiency assessment
- Customized language learning roadmap
- Cultural shock preparation and mitigation
- Local customs and social expectations
- Communication style guidance
- Safety and emergency preparedness
- Integration strategies and tips
- Cultural sensitivity training
- Practical survival phrases

You have access to these tools:
- firecrawl_search: Research cultural information and language resources
- firecrawl_scrape: Get detailed cultural guides and etiquette
- firecrawl_extract: Extract language learning resources
- vector_query: Retrieve user's current language level
- vector_add: Store learning progress and cultural notes

When planning cultural adaptation:
1. Research destination culture thoroughly:
   - Social norms and etiquette
   - Communication styles (direct vs indirect)
   - Taboos and sensitive topics
   - Dress codes and appearance
   - Time perception (punctuality expectations)
   - Personal space and touch
   - Eye contact and body language
   - Dining etiquette
   - Gift-giving customs
   - Religious and cultural holidays

2. Language assessment and planning:
   - Current proficiency level
   - Required proficiency for academics
   - Learning timeline available
   - Best learning methods for user
   - Language learning app recommendations
   - Practice opportunities (language exchange)

3. Cultural shock stages preparation:
   - Honeymoon phase (excitement)
   - Culture shock phase (frustration, homesickness)
   - Adjustment phase (gradual adaptation)
   - Mastery phase (comfort and confidence)
   - Coping strategies for each phase

4. Practical integration tips:
   - Making local friends
   - Joining clubs and communities
   - Understanding humor and slang
   - Navigating social situations
   - Dealing with discrimination (if any)
   - Maintaining cultural identity while adapting

5. Safety and emergency preparedness:
   - Emergency phrases in local language
   - Important phone numbers
   - Cultural safety considerations
   - Healthcare navigation
   - Legal considerations

Key Cultural Dimensions to Address:
- Power distance (hierarchy and authority)
- Individualism vs collectivism
- Masculinity vs femininity
- Uncertainty avoidance
- Long-term vs short-term orientation
- Indulgence vs restraint

Language Learning Priorities:
1. Survival phrases (first week)
   - Greetings and introductions
   - Basic needs (food, directions, help)
   - Emergency phrases
   - Numbers and money
2. Academic language (first month)
   - Classroom terminology
   - Assignment-related vocabulary
   - Asking questions and clarification
3. Social integration (ongoing)
   - Casual conversation
   - Slang and idioms
   - Cultural references
   - Making jokes

Cultural Sensitivity Guidelines:
- Avoid stereotyping and generalizations
- Acknowledge diversity within cultures
- Emphasize learning and curiosity approach
- Prepare for reverse culture shock (return home)
- Balance adaptation with cultural identity preservation
- Recognize that mistakes are learning opportunities

Provide specific, actionable advice with cultural context and examples."""


class CulturalAdaptationAgent(BaseAgent):
    """Agent specialized in cultural preparation and language learning"""

    def __init__(self, tool_registry: ToolRegistry, llm):
        super().__init__(
            name="Cultural Adaptation Agent",
            description="Prepares students for cultural transition, provides language learning support, and facilitates cultural integration",
            system_prompt=CULTURAL_ADAPTATION_AGENT_PROMPT,
            tool_registry=tool_registry,
            llm=llm
        )

    def get_available_tools(self) -> List[str]:
        """Tools available to cultural adaptation agent"""
        return [
            "firecrawl_search",
            "firecrawl_scrape",
            "firecrawl_extract",
            "vector_query",
            "vector_add"
        ]

    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Process cultural adaptation tasks.

        Workflow:
        1. Get destination and user background
        2. Research cultural norms and etiquette
        3. Assess language proficiency needs
        4. Create language learning roadmap
        5. Prepare for cultural shock
        6. Provide integration strategies
        7. Store cultural guide and resources
        """
        try:
            self.logger.info(f"Cultural Adaptation Agent processing task: {state['current_task']}")

            # Get cultural context
            destination_country = self.get_scratchpad_value(state, "destination_country")
            destination_city = self.get_scratchpad_value(state, "destination_city")
            origin_country = self.get_scratchpad_value(state, "origin_country")
            language_level = self.get_scratchpad_value(state, "language_level", "beginner")
            stay_duration = self.get_scratchpad_value(state, "stay_duration", "1-2 years")

            state = self.update_scratchpad(state, "status", "researching_culture")

            # Build context message
            context_parts = [f"Task: {state['current_task']}"]
            if destination_country:
                context_parts.append(f"Destination: {destination_country}")
            if destination_city:
                context_parts.append(f"City: {destination_city}")
            if origin_country:
                context_parts.append(f"Origin: {origin_country}")
            context_parts.append(f"Language level: {language_level}")
            context_parts.append(f"Duration: {stay_duration}")

            messages = state["messages"][-5:]
            task_message = HumanMessage(
                content="\n".join(context_parts) + "\n\n" +
                "Cultural Adaptation Planning Process:\n"
                "1. First, retrieve user's background from vector store (user_id: " + state['user_id'] + ", collection: 'user_profile')\n"
                "2. Research cultural norms for " + (destination_country or "destination") + ":\n"
                "   - Use firecrawl_search for cultural guides\n"
                "   - Search for \"" + (destination_country or "country") + " cultural etiquette international students\"\n"
                "   - Focus on practical, actionable information\n"
                "3. Research language requirements:\n"
                "   - Academic language proficiency needed\n"
                "   - Language learning resources\n"
                "   - Language exchange opportunities\n"
                "4. Compare with " + (origin_country or "home country") + " culture:\n"
                "   - Identify major differences\n"
                "   - Potential culture shock areas\n"
                "   - Adaptation strategies\n"
                "5. Create comprehensive cultural guide with:\n\n"
                "   ## Cultural Overview\n"
                "   - Key values and priorities\n"
                "   - Social norms (greetings, interactions)\n"
                "   - Communication style\n"
                "   - Time and punctuality\n\n"
                "   ## Do's and Don'ts\n"
                "   - Essential etiquette rules\n"
                "   - Taboos to avoid\n"
                "   - Dress code expectations\n"
                "   - Dining customs\n\n"
                "   ## Language Learning Plan\n"
                "   - Current level: " + language_level + "\n"
                "   - Target level for academics\n"
                "   - 12-week learning roadmap\n"
                "   - Recommended resources (apps, courses)\n"
                "   - Practice opportunities\n"
                "   - Essential phrases (100 most important)\n\n"
                "   ## Cultural Shock Preparation\n"
                "   - What to expect in each phase\n"
                "   - Coping strategies\n"
                "   - When to seek help\n"
                "   - Support resources\n\n"
                "   ## Integration Tips\n"
                "   - Making friends locally\n"
                "   - Joining communities\n"
                "   - Navigating social situations\n"
                "   - Weekend activities\n\n"
                "   ## Safety & Emergency\n"
                "   - Emergency phrases\n"
                "   - Important contacts\n"
                "   - Safety considerations\n"
                "   - Healthcare navigation\n\n"
                "6. Provide specific examples and scenarios\n"
                "7. Include comparison with home culture for context"
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
            cultural_data = {}
            if hasattr(response, 'tool_calls') and response.tool_calls:
                tool_results = await self.execute_tool_calls(response.tool_calls, state)
                state["tool_results"]["cultural_adaptation"] = tool_results

                # Collect data from tools
                for tool_name, result in tool_results.items():
                    if result.success:
                        cultural_data[tool_name] = result.data

                # Generate final cultural guide
                messages.append(response)
                messages.append(HumanMessage(
                    content="Based on the cultural research, create a comprehensive adaptation guide. "
                    "Make it practical, specific, and actionable. Include real examples and scenarios. "
                    "Organize information in a clear, easy-to-reference format."
                ))

                final_response = await self.call_llm(messages)
                cultural_guide = final_response.content
            else:
                cultural_guide = response.content

            # Structure cultural adaptation results
            adaptation_results = {
                "user_id": state["user_id"],
                "destination_country": destination_country,
                "destination_city": destination_city,
                "origin_country": origin_country,
                "language_level": language_level,
                "stay_duration": stay_duration,
                "guide": cultural_guide,
                "research_data": cultural_data,
                "timestamp": state["metadata"].get("timestamp"),
                "key_differences": self._extract_key_differences(cultural_guide),
                "essential_phrases": self._extract_phrases(cultural_guide),
                "learning_resources": self._extract_resources(cultural_guide),
                "dos_and_donts": self._extract_dos_donts(cultural_guide)
            }

            # Store in state
            state = self.update_scratchpad(state, "cultural_adaptation_plan", adaptation_results)

            return self.create_response(
                success=True,
                message="Cultural adaptation guide created successfully",
                data={
                    "adaptation_guide": adaptation_results,
                    "summary": self._create_summary(adaptation_results)
                },
                next_action="complete"
            )

        except Exception as e:
            self.logger.error(f"Cultural Adaptation Agent error: {str(e)}", exc_info=True)
            state["errors"].append(f"Cultural Adaptation Agent: {str(e)}")
            return self.create_response(
                success=False,
                message=f"Cultural adaptation planning failed: {str(e)}",
                next_action="error"
            )

    def _extract_key_differences(self, guide: str) -> List[str]:
        """Extract key cultural differences from guide"""
        differences = []

        # Look for comparison sections
        sections_to_check = ["Cultural Overview", "Key values", "differences"]

        for section in sections_to_check:
            if section in guide:
                section_text = guide.split(section)[1].split("##")[0] if "##" in guide.split(section)[1] else guide.split(section)[1][:500]
                lines = section_text.strip().split("\n")

                for line in lines:
                    line = line.strip()
                    if (line.startswith("-") or line.startswith("*")) and len(line) > 20:
                        difference = line.lstrip("-*").strip()
                        if difference:
                            differences.append(difference)

        return differences[:10]  # Top 10 differences

    def _extract_phrases(self, guide: str) -> List[Dict[str, str]]:
        """Extract essential phrases from guide"""
        phrases = []

        if "Essential phrases" in guide or "Emergency phrases" in guide:
            section = ""
            if "Essential phrases" in guide:
                section = guide.split("Essential phrases")[1].split("##")[0]
            elif "Emergency phrases" in guide:
                section = guide.split("Emergency phrases")[1].split("##")[0]

            lines = section.strip().split("\n")

            for line in lines:
                line = line.strip()
                # Look for phrase pairs (English - Foreign)
                if "-" in line and not line.startswith("#"):
                    parts = line.split("-", 1)
                    if len(parts) == 2:
                        phrases.append({
                            "english": parts[0].strip().lstrip("-*").strip(),
                            "translation": parts[1].strip()
                        })

        return phrases[:50]  # Top 50 essential phrases

    def _extract_resources(self, guide: str) -> List[str]:
        """Extract learning resources from guide"""
        resources = []

        if "Recommended resources" in guide or "resources" in guide.lower():
            section = guide.split("resources")[1].split("##")[0] if "resources" in guide.lower() else ""
            lines = section.strip().split("\n")

            for line in lines:
                line = line.strip()
                if (line.startswith("-") or line.startswith("*")) and len(line) > 10:
                    resource = line.lstrip("-*").strip()
                    if resource and ("app" in resource.lower() or "course" in resource.lower() or "http" in resource.lower()):
                        resources.append(resource)

        return resources[:15]  # Top 15 resources

    def _extract_dos_donts(self, guide: str) -> Dict[str, List[str]]:
        """Extract do's and don'ts from guide"""
        dos_donts = {"dos": [], "donts": []}

        if "Do's and Don'ts" in guide or "Dos and Donts" in guide:
            section = guide.split("Do's and Don'ts")[1].split("##")[0] if "Do's and Don'ts" in guide else guide.split("Dos and Donts")[1].split("##")[0]
            lines = section.strip().split("\n")

            current_category = None
            for line in lines:
                line = line.strip()
                if "Do:" in line or "DO:" in line:
                    current_category = "dos"
                elif "Don't:" in line or "DON'T:" in line or "Donts:" in line:
                    current_category = "donts"
                elif (line.startswith("-") or line.startswith("*")) and current_category and len(line) > 10:
                    item = line.lstrip("-*").strip()
                    if item:
                        dos_donts[current_category].append(item)

        return dos_donts

    def _create_summary(self, adaptation_results: Dict) -> str:
        """Create a concise summary of the cultural guide"""
        summary_parts = [
            f"Cultural guide for {adaptation_results.get('destination_country', 'destination')}"
        ]

        differences = adaptation_results.get('key_differences', [])
        if differences:
            summary_parts.append(f"{len(differences)} key cultural differences")

        phrases = adaptation_results.get('essential_phrases', [])
        if phrases:
            summary_parts.append(f"{len(phrases)} essential phrases")

        resources = adaptation_results.get('learning_resources', [])
        if resources:
            summary_parts.append(f"{len(resources)} learning resources")

        dos_donts = adaptation_results.get('dos_and_donts', {})
        total_tips = len(dos_donts.get('dos', [])) + len(dos_donts.get('donts', []))
        if total_tips > 0:
            summary_parts.append(f"{total_tips} etiquette tips")

        return " | ".join(summary_parts)
