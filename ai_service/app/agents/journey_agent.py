"""
Journey Agent - Handles roadmap-focused conversations

This agent processes user messages in Journey mode and can:
1. Answer questions about the user's roadmap
2. Update roadmap stages based on user progress
3. Extract profile updates from conversation
4. Generate personalized guidance
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
import logging
import re
import os

from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from app.database.mongodb import get_database

logger = logging.getLogger(__name__)


def get_llm():
    """Get the LLM instance for Journey agent"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable not set")
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=api_key,
        temperature=0.7,
    )


class JourneyAction(BaseModel):
    """Represents an action taken by the journey agent"""
    type: str  # 'roadmap_update', 'profile_update', 'task_complete', 'stage_advance'
    target: str  # What was updated
    details: Dict[str, Any]


class JourneyResponse(BaseModel):
    """Response from the journey agent"""
    response: str
    actions: List[JourneyAction] = []
    roadmap_updates: Optional[Dict[str, Any]] = None
    profile_updates: Optional[Dict[str, Any]] = None
    session_id: str


class JourneyAgent:
    """Agent for handling Journey mode conversations"""
    
    # Patterns to detect intent from user messages
    PROGRESS_PATTERNS = [
        (r"(?:i'?ve?|i have)\s+(?:completed?|finished|done|taken|got|received|submitted)", "progress"),
        (r"(?:just|finally)\s+(?:completed?|finished|done|submitted|got)", "progress"),
        (r"(?:my|got my)\s+(?:score|result|grade)s?\s+(?:is|are|was|were|back)", "progress"),
        (r"(?:passed|cleared|aced)\s+(?:my|the)?\s*(?:test|exam|ielts|toefl|gre|gmat)", "progress"),
    ]
    
    UPDATE_PATTERNS = [
        (r"(?:change|update|modify|set|switch)\s+(?:my)?\s*(?:target|goal|plan|deadline)", "update"),
        (r"(?:i'?m|i am)\s+(?:now|actually)\s+(?:targeting|aiming|planning|going)", "update"),
        (r"(?:decided|want|planning)\s+to\s+(?:change|switch|apply|go)", "update"),
    ]
    
    QUESTION_PATTERNS = [
        (r"(?:what|how|when|where|why|which|can|should|do|does|is|are)\s+", "question"),
        (r"\?\s*$", "question"),
    ]

    def __init__(self):
        self.llm = get_llm()
        self.db = None
    
    async def _get_db(self):
        if not self.db:
            self.db = get_database()
        return self.db
    
    async def _get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get user's current profile and roadmap context"""
        db = await self._get_db()
        
        # Get user profile
        profile = await db.user_profiles.find_one({"userId": user_id})
        smart_profile = await db.smart_profiles.find_one({"user_id": user_id})
        roadmap = await db.roadmap_plans.find_one({"userId": user_id})
        
        context = {
            "has_profile": profile is not None or smart_profile is not None,
            "has_roadmap": roadmap is not None,
            "profile": None,
            "roadmap": None,
            "current_stage": None,
            "progress": 0,
        }
        
        if smart_profile:
            context["profile"] = {
                "education": smart_profile.get("education", []),
                "test_scores": smart_profile.get("test_scores", {}),
                "application_goals": smart_profile.get("application_goals", {}),
                "readiness": smart_profile.get("readiness", {}),
            }
        elif profile:
            context["profile"] = {
                "target_countries": profile.get("dreamCountries", []),
                "target_degree": profile.get("preferredProgramType"),
                "current_degree": profile.get("currentDegree"),
                "gpa": profile.get("gpa"),
            }
        
        if roadmap:
            stages = roadmap.get("stages", [])
            current_stage_idx = roadmap.get("currentStageIndex", 0)
            completed_count = sum(1 for s in stages if s.get("status") == "completed")
            
            context["roadmap"] = {
                "stages": [{"id": s.get("id"), "title": s.get("title"), "status": s.get("status")} for s in stages],
                "total_stages": len(stages),
                "completed_stages": completed_count,
            }
            context["current_stage"] = stages[current_stage_idx] if current_stage_idx < len(stages) else None
            context["progress"] = round((completed_count / len(stages)) * 100) if stages else 0
        
        if profile:
            context["progress"] = profile.get("overallProgress", 0)
            context["stages_progress"] = profile.get("stagesProgress", [])
        
        return context
    
    def _detect_intent(self, message: str) -> str:
        """Detect the user's intent from their message"""
        message_lower = message.lower()
        
        # Check for progress updates
        for pattern, intent in self.PROGRESS_PATTERNS:
            if re.search(pattern, message_lower):
                return "progress_update"
        
        # Check for update requests
        for pattern, intent in self.UPDATE_PATTERNS:
            if re.search(pattern, message_lower):
                return "roadmap_update"
        
        # Check for questions
        for pattern, intent in self.QUESTION_PATTERNS:
            if re.search(pattern, message_lower):
                return "question"
        
        return "general"
    
    async def _extract_updates(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Use LLM to extract specific updates from the message"""
        
        prompt = f"""Analyze this user message and extract any updates they're reporting about their study abroad journey.

User message: "{message}"

Current context:
- Target countries: {context.get('profile', {}).get('application_goals', {}).get('target_countries', [])}
- Current stage: {context.get('current_stage', {}).get('title', 'Unknown') if context.get('current_stage') else 'Not started'}
- Progress: {context.get('progress', 0)}%

Extract the following if mentioned:
1. Test scores (GRE, TOEFL, IELTS, etc.) - score value and test type
2. Stage completions (which task or stage they completed)
3. Timeline changes (new target semester/year)
4. Profile updates (GPA, institution, major changes)

Return a JSON object with:
{{
    "test_scores": {{"test_type": "...", "score": ...}} or null,
    "stage_completed": "stage_name or task_name" or null,
    "timeline_change": {{"semester": "...", "year": ...}} or null,
    "profile_updates": {{...}} or null,
    "confidence": 0.0-1.0
}}

Return ONLY the JSON object, no other text."""

        try:
            response = await self.llm.ainvoke(prompt)
            content = response.content if hasattr(response, 'content') else str(response)
            
            # Parse JSON from response
            import json
            # Find JSON in response
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            logger.error(f"Failed to extract updates: {e}")
        
        return {"confidence": 0.0}
    
    async def _apply_updates(
        self, 
        user_id: str, 
        updates: Dict[str, Any], 
        context: Dict[str, Any]
    ) -> List[JourneyAction]:
        """Apply extracted updates to the database"""
        actions = []
        db = await self._get_db()
        
        # Apply test score updates
        if updates.get("test_scores") and updates.get("confidence", 0) > 0.7:
            test_data = updates["test_scores"]
            test_type = test_data.get("test_type", "").lower()
            score = test_data.get("score")
            
            if test_type and score:
                # Update smart profile
                await db.smart_profiles.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            f"test_scores.{test_type}": {
                                "overall_score": score,
                                "test_date": datetime.utcnow().isoformat(),
                                "updated_at": datetime.utcnow(),
                            },
                            "updated_at": datetime.utcnow(),
                        }
                    },
                    upsert=True
                )
                
                actions.append(JourneyAction(
                    type="profile_update",
                    target=f"test_scores.{test_type}",
                    details={"score": score}
                ))
        
        # Apply stage completion
        if updates.get("stage_completed") and updates.get("confidence", 0) > 0.6:
            stage_name = updates["stage_completed"]
            
            # Update the stage progress in user_profiles
            await db.user_profiles.update_one(
                {"userId": user_id, "stagesProgress.title": {"$regex": stage_name, "$options": "i"}},
                {
                    "$set": {
                        "stagesProgress.$.status": "completed",
                        "stagesProgress.$.completedAt": datetime.utcnow(),
                    }
                }
            )
            
            actions.append(JourneyAction(
                type="task_complete",
                target=stage_name,
                details={"completed_at": datetime.utcnow().isoformat()}
            ))
        
        # Apply timeline changes
        if updates.get("timeline_change") and updates.get("confidence", 0) > 0.7:
            timeline = updates["timeline_change"]
            
            await db.smart_profiles.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "application_goals.target_intake": timeline,
                        "updated_at": datetime.utcnow(),
                    }
                }
            )
            
            actions.append(JourneyAction(
                type="roadmap_update",
                target="target_intake",
                details=timeline
            ))
        
        return actions
    
    async def _generate_response(
        self,
        message: str,
        context: Dict[str, Any],
        intent: str,
        actions: List[JourneyAction]
    ) -> str:
        """Generate a contextual response using LLM"""
        
        actions_summary = ""
        if actions:
            actions_summary = "\n\nI've made the following updates:\n" + "\n".join(
                f"- {a.type}: {a.target}" for a in actions
            )
        
        current_stage = context.get("current_stage", {})
        stage_info = f"Current stage: {current_stage.get('title', 'Getting Started')}" if current_stage else ""
        
        prompt = f"""You are EduLens Journey Assistant, helping students with their study abroad journey.

User's context:
- Progress: {context.get('progress', 0)}%
- {stage_info}
- Target: {context.get('profile', {}).get('application_goals', {}).get('target_countries', ['Various countries'])}

User message: "{message}"
Intent detected: {intent}
{actions_summary}

Provide a helpful, encouraging response. Be conversational and supportive.
- If they reported progress, congratulate them and suggest next steps
- If they asked a question, answer based on their context
- If they want to update something, confirm the change and explain implications
- Always be specific to their journey stage

Keep response under 150 words. Be warm but professional."""

        try:
            response = await self.llm.ainvoke(prompt)
            return response.content if hasattr(response, 'content') else str(response)
        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            return "I'm here to help with your study abroad journey! What would you like to know or update?"
    
    async def process_message(
        self,
        user_id: str,
        message: str,
        session_id: str,
        context_override: Optional[Dict[str, Any]] = None
    ) -> JourneyResponse:
        """Process a Journey mode message and return response with any updates"""
        
        # Get user context
        context = await self._get_user_context(user_id)
        if context_override:
            context.update(context_override)
        
        # Detect intent
        intent = self._detect_intent(message)
        logger.info(f"Detected intent: {intent} for message: {message[:50]}...")
        
        # Extract and apply updates if reporting progress
        actions = []
        roadmap_updates = None
        profile_updates = None
        
        if intent in ["progress_update", "roadmap_update"]:
            updates = await self._extract_updates(message, context)
            
            if updates.get("confidence", 0) > 0.5:
                actions = await self._apply_updates(user_id, updates, context)
                
                # Separate roadmap and profile updates for response
                roadmap_updates = {a.target: a.details for a in actions if a.type in ["roadmap_update", "task_complete", "stage_advance"]}
                profile_updates = {a.target: a.details for a in actions if a.type == "profile_update"}
        
        # Generate response
        response_text = await self._generate_response(message, context, intent, actions)
        
        # Store conversation in database
        db = await self._get_db()
        await db.journey_conversations.insert_one({
            "user_id": user_id,
            "session_id": session_id,
            "message": message,
            "response": response_text,
            "intent": intent,
            "actions": [a.dict() for a in actions],
            "timestamp": datetime.utcnow(),
        })
        
        return JourneyResponse(
            response=response_text,
            actions=actions,
            roadmap_updates=roadmap_updates if roadmap_updates else None,
            profile_updates=profile_updates if profile_updates else None,
            session_id=session_id,
        )


# Singleton instance
_journey_agent: Optional[JourneyAgent] = None


def get_journey_agent() -> JourneyAgent:
    """Get or create the Journey agent instance"""
    global _journey_agent
    if _journey_agent is None:
        _journey_agent = JourneyAgent()
    return _journey_agent
