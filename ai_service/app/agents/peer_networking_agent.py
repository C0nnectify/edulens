"""Peer Networking Agent - Alumni and student connection matching"""

from typing import Dict, List, Optional
from langchain_core.messages import HumanMessage
from app.agents.base_agent import BaseAgent
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


PEER_NETWORKING_AGENT_PROMPT = """You are a Peer Networking Agent specialized in connecting students with alumni and current students for study abroad.

Your capabilities include:
- Alumni discovery and matching
- Current student connections
- Profile similarity analysis
- Icebreaker and introduction generation
- Networking strategy recommendations
- Mentorship program matching
- Event and community discovery
- Follow-up and relationship building tips

You have access to these tools:
- firecrawl_search: Find alumni on LinkedIn and university websites
- firecrawl_scrape: Get detailed profiles and backgrounds
- firecrawl_extract: Extract contact information and interests
- vector_query: Retrieve user profile for matching
- vector_add: Store connections and networking history

When matching peers:
1. Understand user's background and goals:
   - Target university/program
   - Field of study
   - Career aspirations
   - Geographic origin
   - Interests and hobbies
2. Search for potential connections:
   - Alumni from same university/program
   - Current students in similar programs
   - People from same country/region
   - Shared academic interests
   - Common career paths
3. Analyze compatibility:
   - Academic background similarity
   - Career trajectory alignment
   - Geographic/cultural connection
   - Shared interests and activities
   - Communication style match
4. Prioritize connections:
   - Recent graduates (last 2-3 years) for relevant advice
   - Same nationality for cultural context
   - Similar career goals for mentorship
   - Active LinkedIn users for responsiveness
5. Generate personalized introduction:
   - Common ground opener
   - Specific questions based on their experience
   - Clear purpose and value proposition
   - Respectful time consideration
6. Provide networking best practices:
   - When and how to reach out
   - What to ask (and not ask)
   - How to maintain relationships
   - Follow-up etiquette

Matching Criteria Priority:
1. Same university + program (highest relevance)
2. Same field of study (academic alignment)
3. Similar career path (professional guidance)
4. Geographic connection (cultural context)
5. Shared interests (personal rapport)

Introduction Message Template:
- Subject line: specific and compelling
- Opening: common ground connection
- Body: brief background + specific question
- Closing: appreciation and flexibility
- Length: 150-200 words max

Networking Etiquette:
- Research person thoroughly before reaching out
- Personalize every message (no templates)
- Be specific about what you're asking
- Respect their time (ask for 15-20 min chat)
- Follow up with thank you note
- Keep them updated on progress
- Offer value in return when possible

Privacy & Safety:
- Only use publicly available information
- Respect professional boundaries
- No spam or mass messages
- Follow LinkedIn terms of service
- Encourage university official channels first"""


class PeerNetworkingAgent(BaseAgent):
    """Agent specialized in peer matching and networking facilitation"""

    def __init__(self, tool_registry: ToolRegistry, llm):
        super().__init__(
            name="Peer Networking Agent",
            description="Connects students with alumni and peers for mentorship, advice, and networking",
            system_prompt=PEER_NETWORKING_AGENT_PROMPT,
            tool_registry=tool_registry,
            llm=llm
        )

    def get_available_tools(self) -> List[str]:
        """Tools available to peer networking agent"""
        return [
            "firecrawl_search",
            "firecrawl_scrape",
            "firecrawl_extract",
            "vector_query",
            "vector_add"
        ]

    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Process peer networking tasks.

        Workflow:
        1. Get user profile and networking goals
        2. Search for potential connections
        3. Analyze compatibility and match score
        4. Prioritize top matches
        5. Generate personalized introductions
        6. Provide networking strategy
        7. Store connections for tracking
        """
        try:
            self.logger.info(f"Peer Networking Agent processing task: {state['current_task']}")

            # Get networking context
            target_university = self.get_scratchpad_value(state, "target_university")
            field_of_study = self.get_scratchpad_value(state, "field_of_study")
            country_of_origin = self.get_scratchpad_value(state, "country_of_origin")
            networking_goal = self.get_scratchpad_value(state, "networking_goal", "general_advice")
            num_connections = self.get_scratchpad_value(state, "num_connections", 5)

            state = self.update_scratchpad(state, "status", "searching_connections")

            # Build context message
            context_parts = [f"Task: {state['current_task']}"]
            if target_university:
                context_parts.append(f"University: {target_university}")
            if field_of_study:
                context_parts.append(f"Field: {field_of_study}")
            if country_of_origin:
                context_parts.append(f"Origin: {country_of_origin}")
            context_parts.append(f"Goal: {networking_goal}")
            context_parts.append(f"Requested connections: {num_connections}")

            messages = state["messages"][-5:]
            task_message = HumanMessage(
                content="\n".join(context_parts) + "\n\n" +
                "Peer Networking Process:\n"
                "1. First, retrieve user's profile from vector store (user_id: " + state['user_id'] + ", collection: 'user_profile')\n"
                "2. Search for potential connections using firecrawl_search:\n"
                "   - LinkedIn search: \"" + (target_university or "target university") + " alumni " + (field_of_study or "") + "\"\n"
                "   - University website alumni directories\n"
                "   - Student organizations and clubs\n"
                "   - Focus on recent graduates (2-3 years) and current students\n"
                "3. For each potential match, scrape their profile:\n"
                "   - Educational background\n"
                "   - Work experience\n"
                "   - Skills and interests\n"
                "   - Current location\n"
                "   - Activity level (recent posts/updates)\n"
                "4. Calculate match score based on:\n"
                "   - University/program match (40%)\n"
                "   - Field alignment (25%)\n"
                "   - Geographic connection (15%)\n"
                "   - Career path similarity (15%)\n"
                "   - Shared interests (5%)\n"
                "5. Select top " + str(num_connections) + " matches\n"
                "6. For each match, generate:\n"
                "   - Introduction message (personalized)\n"
                "   - 3-5 specific questions to ask\n"
                "   - Why they're a good match\n"
                "   - Best time/way to reach out\n"
                "7. Create networking strategy:\n"
                "   - Prioritized outreach order\n"
                "   - Timeline (when to contact each)\n"
                "   - Alternative contacts (if primary doesn't respond)\n"
                "   - Follow-up plan\n\n"
                "Be specific with names, profiles, and personalized messages."
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
            networking_data = {}
            if hasattr(response, 'tool_calls') and response.tool_calls:
                tool_results = await self.execute_tool_calls(response.tool_calls, state)
                state["tool_results"]["peer_networking"] = tool_results

                # Collect data from tools
                for tool_name, result in tool_results.items():
                    if result.success:
                        networking_data[tool_name] = result.data

                # Generate final networking plan
                messages.append(response)
                messages.append(HumanMessage(
                    content="Based on the connections found, create a comprehensive networking plan:\n\n"
                    "## Top Matches (Prioritized)\n"
                    "For each of top " + str(num_connections) + " connections:\n\n"
                    "### Match 1: [Name]\n"
                    "- **Profile**: [Current role/position]\n"
                    "- **Background**: [University, program, graduation year]\n"
                    "- **Match Score**: [X/100] - [Why good match]\n"
                    "- **LinkedIn**: [URL if available]\n"
                    "- **Best Contact Method**: [LinkedIn/Email/etc]\n\n"
                    "**Personalized Introduction Message:**\n"
                    "```\n"
                    "[Draft complete message ready to send]\n"
                    "```\n\n"
                    "**Questions to Ask:**\n"
                    "1. [Specific question about their experience]\n"
                    "2. [Question about program/university]\n"
                    "3. [Career-related question]\n"
                    "4. [Advice question]\n"
                    "5. [Follow-up opportunity]\n\n"
                    "[Repeat for all matches]\n\n"
                    "## Networking Strategy\n"
                    "- **Week 1**: Contact matches 1-2 (highest priority)\n"
                    "- **Week 2**: Follow up + contact matches 3-4\n"
                    "- **Week 3**: Contact match 5 + follow-ups\n"
                    "- **Ongoing**: Nurture relationships\n\n"
                    "## Networking Tips\n"
                    "- Best time to reach out: [When]\n"
                    "- Response rate improvement: [Specific tips]\n"
                    "- What to do after first contact\n"
                    "- How to maintain relationships\n"
                    "- Alternative connections if no response"
                ))

                final_response = await self.call_llm(messages)
                networking_plan = final_response.content
            else:
                networking_plan = response.content

            # Structure networking results
            networking_results = {
                "user_id": state["user_id"],
                "target_university": target_university,
                "field_of_study": field_of_study,
                "networking_goal": networking_goal,
                "plan": networking_plan,
                "search_data": networking_data,
                "timestamp": state["metadata"].get("timestamp"),
                "connections_found": self._extract_connections(networking_plan),
                "introduction_messages": self._extract_messages(networking_plan),
                "networking_timeline": self._extract_timeline(networking_plan)
            }

            # Store in state
            state = self.update_scratchpad(state, "networking_plan", networking_results)

            return self.create_response(
                success=True,
                message="Peer networking plan created successfully",
                data={
                    "networking_plan": networking_results,
                    "summary": self._create_summary(networking_results)
                },
                next_action="complete"
            )

        except Exception as e:
            self.logger.error(f"Peer Networking Agent error: {str(e)}", exc_info=True)
            state["errors"].append(f"Peer Networking Agent: {str(e)}")
            return self.create_response(
                success=False,
                message=f"Peer networking failed: {str(e)}",
                next_action="error"
            )

    def _extract_connections(self, plan: str) -> List[Dict[str, any]]:
        """Extract connection information from plan"""
        connections = []

        if "## Top Matches" in plan:
            section = plan.split("## Top Matches")[1].split("## Networking Strategy")[0]

            # Split by "### Match" to find individual connections
            matches = section.split("### Match")[1:]  # Skip first empty split

            for match in matches[:10]:  # Max 10 connections
                lines = match.strip().split("\n")
                connection = {}

                for line in lines:
                    line = line.strip()
                    if ": " in line and line.startswith("-"):
                        parts = line.split(": ", 1)
                        if len(parts) == 2:
                            key = parts[0].replace("-", "").replace("*", "").strip().lower()
                            value = parts[1].strip()
                            connection[key] = value
                    elif not line.startswith("-") and not line.startswith("*") and len(line) > 5:
                        if not connection.get("name"):
                            connection["name"] = line.split(":", 1)[0].strip() if ":" in line else line

                if connection:
                    connections.append(connection)

        return connections

    def _extract_messages(self, plan: str) -> List[str]:
        """Extract introduction messages from plan"""
        messages = []

        # Find all code blocks (introduction messages)
        import re
        code_blocks = re.findall(r'```(.*?)```', plan, re.DOTALL)

        for block in code_blocks:
            message = block.strip()
            if len(message) > 50:  # Filter out short snippets
                messages.append(message)

        return messages

    def _extract_timeline(self, plan: str) -> List[Dict[str, str]]:
        """Extract networking timeline from plan"""
        timeline = []

        if "## Networking Strategy" in plan:
            section = plan.split("## Networking Strategy")[1].split("##")[0]
            lines = section.strip().split("\n")

            for line in lines:
                line = line.strip()
                if line.startswith("-") and ("Week" in line or "Day" in line):
                    parts = line.split(":", 1)
                    if len(parts) == 2:
                        timeframe = parts[0].replace("-", "").replace("*", "").strip()
                        action = parts[1].strip()
                        timeline.append({
                            "timeframe": timeframe,
                            "action": action
                        })

        return timeline

    def _create_summary(self, networking_results: Dict) -> str:
        """Create a concise summary of the networking plan"""
        summary_parts = [
            f"Networking plan for {networking_results.get('target_university', 'target university')}"
        ]

        connections = networking_results.get('connections_found', [])
        if connections:
            summary_parts.append(f"{len(connections)} connections identified")

        messages = networking_results.get('introduction_messages', [])
        if messages:
            summary_parts.append(f"{len(messages)} introduction messages drafted")

        timeline = networking_results.get('networking_timeline', [])
        if timeline:
            summary_parts.append(f"{len(timeline)}-step outreach plan")

        return " | ".join(summary_parts)
