"""Profile Evaluation Agent - Assess student profiles and provide recommendations"""

from typing import Dict, List
from langchain_core.messages import HumanMessage
from app.agents.base_agent import BaseAgent
from app.graph.state import StudyAbroadAgentState, AgentResponse
from app.tools.base_tool import ToolRegistry
import logging

logger = logging.getLogger(__name__)


PROFILE_EVALUATION_PROMPT = """You are a Profile Evaluation Agent specialized in assessing student profiles for study abroad applications.

Your capabilities include:
- Academic profile analysis (GPA, test scores, coursework)
- Extracurricular and leadership evaluation
- Research/work experience assessment
- University fit analysis and recommendations
- Gap analysis and improvement suggestions
- Competitiveness scoring for target programs
- Profile strengthening strategies
- Timeline and milestone planning based on profile

You have access to these tools:
- vector_query: Retrieve user's academic and professional history
- vector_add: Store profile evaluation results
- firecrawl_search: Research university admission requirements
- firecrawl_scrape: Get detailed program requirements
- firecrawl_extract: Extract admission statistics and requirements

When evaluating profiles:
1. Retrieve complete user profile from vector store
2. Research target programs' admission requirements
3. Compare profile against successful admits data
4. Identify strengths and weaknesses
5. Provide actionable improvement recommendations
6. Suggest realistic university targets (reach, target, safety)
7. Create timeline for profile improvement
8. Store evaluation results for future reference

Evaluation criteria:
- Academic performance (GPA, test scores, coursework rigor)
- Research experience (publications, projects, impact)
- Work experience (internships, full-time, relevance)
- Extracurricular activities (leadership, impact, uniqueness)
- Statement of purpose quality
- Letters of recommendation strength
- Fit with target programs
- Overall competitiveness

Provide honest, constructive feedback with specific examples and quantifiable metrics."""


class ProfileEvaluationAgent(BaseAgent):
    """Agent specialized in evaluating student profiles for study abroad"""

    def __init__(self, tool_registry: ToolRegistry, llm):
        super().__init__(
            name="Profile Evaluation Agent",
            description="Evaluates student profiles, assesses competitiveness, and provides recommendations for university applications",
            system_prompt=PROFILE_EVALUATION_PROMPT,
            tool_registry=tool_registry,
            llm=llm
        )

    def get_available_tools(self) -> List[str]:
        """Tools available to profile evaluation agent"""
        return [
            "vector_query",
            "vector_add",
            "firecrawl_search",
            "firecrawl_scrape",
            "firecrawl_extract"
        ]

    async def process(self, state: StudyAbroadAgentState) -> AgentResponse:
        """
        Process profile evaluation tasks.

        Workflow:
        1. Retrieve user's complete profile from vector store
        2. Research target programs and their requirements
        3. Analyze profile strengths and weaknesses
        4. Compare with admission statistics
        5. Provide competitiveness score
        6. Generate recommendations and action plan
        7. Store evaluation results
        """
        try:
            self.logger.info(f"Profile Evaluation Agent processing task: {state['current_task']}")

            # Get evaluation context
            target_programs = self.get_scratchpad_value(state, "target_programs", [])
            evaluation_type = self.get_scratchpad_value(state, "evaluation_type", "comprehensive")

            state = self.update_scratchpad(state, "status", "evaluating")

            # Build context message
            context_parts = [f"Task: {state['current_task']}"]
            if target_programs:
                context_parts.append(f"Target Programs: {', '.join(target_programs)}")
            context_parts.append(f"Evaluation Type: {evaluation_type}")

            messages = state["messages"][-5:]
            task_message = HumanMessage(
                content="\n".join(context_parts) + "\n\n" +
                "Evaluation Process:\n"
                "1. First, retrieve the user's complete profile from vector store (user_id: " + state['user_id'] + ", collection: 'user_profile')\n"
                "2. Research admission requirements for target programs using firecrawl tools\n"
                "3. Compare profile against requirements and successful admit profiles\n"
                "4. Provide detailed evaluation with:\n"
                "   - Strengths (what makes profile stand out)\n"
                "   - Weaknesses (areas needing improvement)\n"
                "   - Competitiveness score (reach/target/safety for each program)\n"
                "   - Specific recommendations with actionable steps\n"
                "   - Timeline for improvements\n"
                "5. Be honest but constructive. Use data and examples."
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
            evaluation_data = {}
            if hasattr(response, 'tool_calls') and response.tool_calls:
                tool_results = await self.execute_tool_calls(response.tool_calls, state)
                state["tool_results"]["profile_evaluation"] = tool_results

                # Collect data from tools
                for tool_name, result in tool_results.items():
                    if result.success:
                        evaluation_data[tool_name] = result.data

                # Generate final evaluation
                messages.append(response)
                messages.append(HumanMessage(
                    content="Based on the profile data and program requirements, provide a comprehensive evaluation:\n\n"
                    "**Academic Assessment**:\n"
                    "- GPA/Test Scores analysis\n"
                    "- Coursework strength\n\n"
                    "**Experience Assessment**:\n"
                    "- Research/Work experience\n"
                    "- Publications/Projects\n\n"
                    "**Extracurricular Assessment**:\n"
                    "- Leadership roles\n"
                    "- Impact and uniqueness\n\n"
                    "**Program Fit Analysis**:\n"
                    "For each target program:\n"
                    "- Match level (Reach/Target/Safety)\n"
                    "- Probability estimate\n"
                    "- Key factors\n\n"
                    "**Recommendations**:\n"
                    "1. Immediate actions (0-3 months)\n"
                    "2. Short-term goals (3-6 months)\n"
                    "3. Long-term strategy (6-12 months)\n\n"
                    "**Overall Score**: X/10 with justification"
                ))

                final_response = await self.call_llm(messages)
                evaluation_report = final_response.content
            else:
                evaluation_report = response.content

            # Parse and structure evaluation results
            evaluation_results = {
                "user_id": state["user_id"],
                "evaluation_type": evaluation_type,
                "target_programs": target_programs,
                "report": evaluation_report,
                "data": evaluation_data,
                "timestamp": state["metadata"].get("timestamp"),
                "recommendations": self._extract_recommendations(evaluation_report),
                "competitiveness_scores": self._extract_scores(evaluation_report)
            }

            # Store in state
            state = self.update_scratchpad(state, "evaluation_results", evaluation_results)

            return self.create_response(
                success=True,
                message="Profile evaluation completed",
                data={
                    "evaluation": evaluation_results,
                    "summary": self._create_summary(evaluation_results)
                },
                next_action="complete"
            )

        except Exception as e:
            self.logger.error(f"Profile Evaluation Agent error: {str(e)}", exc_info=True)
            state["errors"].append(f"Profile Evaluation Agent: {str(e)}")
            return self.create_response(
                success=False,
                message=f"Profile evaluation failed: {str(e)}",
                next_action="error"
            )

    def _extract_recommendations(self, report: str) -> List[Dict[str, str]]:
        """Extract actionable recommendations from evaluation report"""
        recommendations = []

        # Simple extraction - look for numbered lists in Recommendations section
        if "**Recommendations**" in report:
            rec_section = report.split("**Recommendations**")[1].split("**")[0]
            lines = rec_section.strip().split("\n")

            current_category = ""
            for line in lines:
                line = line.strip()
                if line and ("months)" in line.lower() or "strategy" in line.lower()):
                    current_category = line
                elif line and line[0].isdigit():
                    recommendations.append({
                        "category": current_category,
                        "action": line,
                        "priority": "high" if "immediate" in current_category.lower() else "medium"
                    })

        return recommendations

    def _extract_scores(self, report: str) -> Dict[str, any]:
        """Extract competitiveness scores from report"""
        scores = {}

        # Extract overall score
        if "**Overall Score**" in report:
            score_section = report.split("**Overall Score**")[1].split("\n")[0]
            # Simple regex to extract X/10
            import re
            match = re.search(r'(\d+(?:\.\d+)?)/10', score_section)
            if match:
                scores["overall"] = float(match.group(1))

        # Extract program-specific classifications
        if "**Program Fit Analysis**" in report:
            fit_section = report.split("**Program Fit Analysis**")[1].split("**")[0]
            lines = fit_section.strip().split("\n")

            current_program = ""
            for line in lines:
                if ":" in line and not line.strip().startswith("-"):
                    current_program = line.split(":")[0].strip()
                elif "Match level" in line or "Reach" in line or "Target" in line or "Safety" in line:
                    if current_program:
                        if "Reach" in line:
                            scores[current_program] = "Reach"
                        elif "Target" in line:
                            scores[current_program] = "Target"
                        elif "Safety" in line:
                            scores[current_program] = "Safety"

        return scores

    def _create_summary(self, evaluation_results: Dict) -> str:
        """Create a concise summary of the evaluation"""
        summary_parts = [
            f"Profile evaluation completed for {len(evaluation_results.get('target_programs', []))} programs."
        ]

        scores = evaluation_results.get("competitiveness_scores", {})
        if "overall" in scores:
            summary_parts.append(f"Overall profile strength: {scores['overall']}/10")

        recommendations = evaluation_results.get("recommendations", [])
        if recommendations:
            high_priority = [r for r in recommendations if r.get("priority") == "high"]
            summary_parts.append(f"Generated {len(recommendations)} recommendations ({len(high_priority)} high priority)")

        return " | ".join(summary_parts)
