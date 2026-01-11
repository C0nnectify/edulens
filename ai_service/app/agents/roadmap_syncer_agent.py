"""
Roadmap Syncer Agent - Profile to Roadmap Synchronization

This agent handles bidirectional sync between SmartProfile and Roadmap.
When profile data changes, it updates relevant roadmap stages and tasks.
When roadmap progress changes, it can update profile readiness.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from uuid import uuid4

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ============================================
# SYNC RULES
# ============================================

class SyncRule(BaseModel):
    """Rule for syncing profile section to roadmap stages"""
    profile_section: str
    roadmap_stages: List[str]
    condition: Optional[str] = None
    update_type: str  # 'progress', 'task', 'milestone', 'readiness'
    priority: int = 0


# Default sync rules
DEFAULT_SYNC_RULES = [
    # Education → Stage 0 (Foundation)
    SyncRule(
        profile_section="education",
        roadmap_stages=["foundation", "stage_0"],
        update_type="readiness",
        priority=1
    ),
    
    # Test Scores → Stage 1 (Test Preparation)
    SyncRule(
        profile_section="testScores",
        roadmap_stages=["test_prep", "stage_1"],
        update_type="progress",
        priority=2
    ),
    
    # Research → Stage 2 (Research & Programs)
    SyncRule(
        profile_section="research",
        roadmap_stages=["research", "stage_2"],
        update_type="readiness",
        priority=3
    ),
    
    # Application Goals → Stage 3 (School Selection)
    SyncRule(
        profile_section="applicationGoals",
        roadmap_stages=["school_selection", "stage_3"],
        update_type="progress",
        priority=4
    ),
    
    # LOR Tracking → Stage 4 (Application Materials)
    SyncRule(
        profile_section="lorTracking",
        roadmap_stages=["materials", "stage_4"],
        update_type="task",
        priority=5
    ),
    
    # Financial Details → Stage 5 (Financial Planning)
    SyncRule(
        profile_section="financialDetails",
        roadmap_stages=["financial", "stage_5"],
        update_type="readiness",
        priority=6
    ),
]


# ============================================
# SYNC RESULTS
# ============================================

class SyncAction(BaseModel):
    """A single sync action to take"""
    stage_id: str
    action_type: str  # 'update_progress', 'add_task', 'complete_task', 'update_milestone'
    data: Dict[str, Any]
    reason: str


class SyncResult(BaseModel):
    """Result of a sync operation"""
    success: bool
    actions_taken: List[SyncAction] = Field(default_factory=list)
    profile_sections_synced: List[str] = Field(default_factory=list)
    roadmap_stages_updated: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================
# ROADMAP SYNCER AGENT
# ============================================

class RoadmapSyncerAgent:
    """
    Agent that synchronizes SmartProfile changes to Roadmap.
    
    Responsibilities:
    1. Monitor profile changes
    2. Determine affected roadmap stages
    3. Update stage progress/tasks
    4. Update profile readiness based on roadmap
    """
    
    def __init__(self, db=None, rules: List[SyncRule] = None):
        self.db = db
        self.rules = rules or DEFAULT_SYNC_RULES
    
    async def sync_profile_to_roadmap(
        self,
        user_id: str,
        changed_sections: List[str],
        profile_data: Dict[str, Any],
        force: bool = False
    ) -> SyncResult:
        """
        Sync profile changes to roadmap.
        
        Args:
            user_id: The user's ID
            changed_sections: List of profile sections that changed
            profile_data: Current profile data
            force: Force sync even if no changes detected
            
        Returns:
            SyncResult with actions taken
        """
        actions: List[SyncAction] = []
        errors: List[str] = []
        stages_updated: List[str] = []
        
        # Get current roadmap
        roadmap = await self._get_user_roadmap(user_id)
        if not roadmap:
            logger.warning(f"No roadmap found for user {user_id}")
            return SyncResult(
                success=False,
                errors=["No roadmap found for user"]
            )
        
        # Process each changed section
        for section in changed_sections:
            # Find applicable rules
            rules = [r for r in self.rules if r.profile_section == section]
            
            for rule in rules:
                try:
                    # Generate actions for this rule
                    section_actions = self._generate_sync_actions(
                        rule,
                        profile_data.get(section, {}),
                        roadmap
                    )
                    actions.extend(section_actions)
                    
                    # Track affected stages
                    for action in section_actions:
                        if action.stage_id not in stages_updated:
                            stages_updated.append(action.stage_id)
                            
                except Exception as e:
                    logger.error(f"Error processing rule for {section}: {e}")
                    errors.append(f"Error syncing {section}: {str(e)}")
        
        # Apply actions to roadmap
        if actions:
            apply_result = await self._apply_sync_actions(user_id, roadmap, actions)
            if not apply_result:
                errors.append("Failed to apply some sync actions")
        
        # Update profile sync status
        await self._update_profile_sync_status(user_id, changed_sections)
        
        return SyncResult(
            success=len(errors) == 0,
            actions_taken=actions,
            profile_sections_synced=changed_sections,
            roadmap_stages_updated=stages_updated,
            errors=errors
        )
    
    async def sync_roadmap_to_profile(
        self,
        user_id: str,
        stage_updates: List[Dict[str, Any]]
    ) -> SyncResult:
        """
        Sync roadmap progress back to profile readiness.
        
        Called when user completes tasks or updates stage progress.
        """
        actions = []
        errors = []
        
        # Get current profile
        profile = await self._get_user_profile(user_id)
        if not profile:
            return SyncResult(
                success=False,
                errors=["No profile found for user"]
            )
        
        # Calculate new readiness scores
        readiness_updates = self._calculate_readiness_from_roadmap(stage_updates)
        
        # Update profile readiness
        if readiness_updates:
            try:
                await self._update_profile_readiness(user_id, readiness_updates)
                actions.append(SyncAction(
                    stage_id="profile",
                    action_type="update_readiness",
                    data=readiness_updates,
                    reason="Roadmap progress updated"
                ))
            except Exception as e:
                errors.append(f"Failed to update readiness: {str(e)}")
        
        return SyncResult(
            success=len(errors) == 0,
            actions_taken=actions,
            profile_sections_synced=["readiness"],
            roadmap_stages_updated=[u.get("stage_id", "") for u in stage_updates],
            errors=errors
        )
    
    def _generate_sync_actions(
        self,
        rule: SyncRule,
        section_data: Dict[str, Any],
        roadmap: Dict[str, Any]
    ) -> List[SyncAction]:
        """Generate sync actions based on rule and data"""
        actions = []
        
        if rule.update_type == "progress":
            # Calculate progress from section data
            progress = self._calculate_section_progress(rule.profile_section, section_data)
            
            for stage_id in rule.roadmap_stages:
                if self._stage_exists(roadmap, stage_id):
                    actions.append(SyncAction(
                        stage_id=stage_id,
                        action_type="update_progress",
                        data={"progress": progress},
                        reason=f"Updated from {rule.profile_section}"
                    ))
        
        elif rule.update_type == "task":
            # Generate tasks from section data
            tasks = self._generate_tasks_from_section(rule.profile_section, section_data)
            
            for stage_id in rule.roadmap_stages:
                if self._stage_exists(roadmap, stage_id):
                    for task in tasks:
                        actions.append(SyncAction(
                            stage_id=stage_id,
                            action_type="add_task" if not task.get("completed") else "complete_task",
                            data=task,
                            reason=f"Task from {rule.profile_section}"
                        ))
        
        elif rule.update_type == "milestone":
            # Check for milestone completions
            milestones = self._check_milestones(rule.profile_section, section_data)
            
            for stage_id in rule.roadmap_stages:
                if self._stage_exists(roadmap, stage_id):
                    for milestone in milestones:
                        actions.append(SyncAction(
                            stage_id=stage_id,
                            action_type="update_milestone",
                            data=milestone,
                            reason=f"Milestone from {rule.profile_section}"
                        ))
        
        elif rule.update_type == "readiness":
            # Update stage readiness indicator
            readiness = self._calculate_section_readiness(rule.profile_section, section_data)
            
            for stage_id in rule.roadmap_stages:
                if self._stage_exists(roadmap, stage_id):
                    actions.append(SyncAction(
                        stage_id=stage_id,
                        action_type="update_progress",
                        data={"readiness": readiness},
                        reason=f"Readiness from {rule.profile_section}"
                    ))
        
        return actions
    
    def _calculate_section_progress(
        self,
        section: str,
        data: Dict[str, Any]
    ) -> int:
        """Calculate progress percentage for a section"""
        
        if section == "testScores":
            # Check which tests are completed
            tests = ["gre", "toefl", "ielts", "gmat"]
            completed = 0
            total = 0
            
            for test in tests:
                test_data = data.get(test, {})
                if test_data:
                    total += 1
                    if test_data.get("status") == "completed":
                        completed += 1
            
            return int((completed / total * 100)) if total > 0 else 0
        
        elif section == "applicationGoals":
            programs = data.get("programs", [])
            if not programs:
                return 0
            
            # Progress based on application status
            status_weights = {
                "researching": 20,
                "preparing": 40,
                "in-progress": 60,
                "submitted": 80,
                "accepted": 100,
                "enrolled": 100,
            }
            
            total_progress = sum(
                status_weights.get(p.get("status", "researching"), 0)
                for p in programs
            )
            return int(total_progress / len(programs)) if programs else 0
        
        elif section == "lorTracking":
            contacts = data.get("contacts", [])
            if not contacts:
                return 0
            
            status_weights = {
                "not-contacted": 0,
                "contacted": 25,
                "agreed": 50,
                "submitted": 100,
            }
            
            total_progress = sum(
                status_weights.get(c.get("status", "not-contacted"), 0)
                for c in contacts
            )
            return int(total_progress / len(contacts)) if contacts else 0
        
        return 0
    
    def _calculate_section_readiness(
        self,
        section: str,
        data: Dict[str, Any]
    ) -> int:
        """Calculate readiness score for a section"""
        
        if section == "education":
            entries = data.get("entries", [])
            if not entries:
                return 0
            
            # Check for complete education entry
            complete_entries = sum(
                1 for e in entries
                if e.get("institution") and e.get("degree") and e.get("major")
            )
            return min(100, complete_entries * 50)
        
        elif section == "research":
            entries = data.get("entries", [])
            interests = data.get("researchInterests", [])
            
            score = 0
            if entries:
                score += 50
            if interests:
                score += 25
            if len(entries) > 1:
                score += 25
            
            return min(100, score)
        
        elif section == "financialDetails":
            budget = data.get("budget", {})
            funding = data.get("fundingPreferences", {})
            
            score = 0
            if budget.get("totalBudget"):
                score += 40
            if funding.get("needFullFunding") is not None:
                score += 30
            if data.get("scholarshipsApplied"):
                score += 30
            
            return min(100, score)
        
        return 0
    
    def _generate_tasks_from_section(
        self,
        section: str,
        data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate roadmap tasks from section data"""
        tasks = []
        
        if section == "lorTracking":
            contacts = data.get("contacts", [])
            
            for contact in contacts:
                # Task for each LOR contact
                status = contact.get("status", "not-contacted")
                
                if status == "not-contacted":
                    tasks.append({
                        "id": f"lor-contact-{contact.get('id', uuid4())}",
                        "title": f"Contact {contact.get('name', 'recommender')} for LOR",
                        "completed": False,
                        "category": "recommendation"
                    })
                elif status == "contacted":
                    tasks.append({
                        "id": f"lor-followup-{contact.get('id', uuid4())}",
                        "title": f"Follow up with {contact.get('name', 'recommender')}",
                        "completed": False,
                        "category": "recommendation"
                    })
                elif status == "agreed":
                    tasks.append({
                        "id": f"lor-send-{contact.get('id', uuid4())}",
                        "title": f"Send portal links to {contact.get('name', 'recommender')}",
                        "completed": False,
                        "category": "recommendation"
                    })
                elif status == "submitted":
                    tasks.append({
                        "id": f"lor-complete-{contact.get('id', uuid4())}",
                        "title": f"LOR from {contact.get('name', 'recommender')} received",
                        "completed": True,
                        "category": "recommendation"
                    })
        
        return tasks
    
    def _check_milestones(
        self,
        section: str,
        data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Check for milestone completions"""
        milestones = []
        
        if section == "testScores":
            if data.get("gre", {}).get("status") == "completed":
                milestones.append({
                    "id": "gre-complete",
                    "title": "GRE Completed",
                    "completed": True,
                    "completedAt": datetime.utcnow()
                })
            
            if data.get("toefl", {}).get("status") == "completed":
                milestones.append({
                    "id": "toefl-complete",
                    "title": "TOEFL Completed",
                    "completed": True,
                    "completedAt": datetime.utcnow()
                })
            
            if data.get("ielts", {}).get("status") == "completed":
                milestones.append({
                    "id": "ielts-complete",
                    "title": "IELTS Completed",
                    "completed": True,
                    "completedAt": datetime.utcnow()
                })
        
        return milestones
    
    def _stage_exists(self, roadmap: Dict[str, Any], stage_id: str) -> bool:
        """Check if a stage exists in the roadmap"""
        stages = roadmap.get("stages", [])
        return any(s.get("id") == stage_id or s.get("key") == stage_id for s in stages)
    
    def _calculate_readiness_from_roadmap(
        self,
        stage_updates: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate profile readiness from roadmap updates"""
        # Map stage progress to profile readiness sections
        readiness = {}
        
        stage_to_readiness = {
            "foundation": "profile",
            "test_prep": "testScores",
            "research": "research",
            "school_selection": "schools",
            "materials": "documents",
            "financial": "finances",
        }
        
        for update in stage_updates:
            stage_id = update.get("stage_id", "")
            progress = update.get("progress", 0)
            
            for stage_key, readiness_key in stage_to_readiness.items():
                if stage_key in stage_id:
                    readiness[readiness_key] = progress
        
        return readiness
    
    # Database operations (to be implemented with actual DB)
    async def _get_user_roadmap(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's roadmap from database"""
        if self.db:
            return await self.db["roadmap_plans"].find_one({"userId": user_id})
        return None
    
    async def _get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's SmartProfile from database"""
        if self.db:
            return await self.db["smart_profiles"].find_one({"user_id": user_id})
        return None
    
    async def _apply_sync_actions(
        self,
        user_id: str,
        roadmap: Dict[str, Any],
        actions: List[SyncAction]
    ) -> bool:
        """Apply sync actions to roadmap"""
        if not self.db:
            logger.warning("No database connection, skipping action application")
            return True
        
        try:
            # Group actions by stage
            for action in actions:
                if action.action_type == "update_progress":
                    await self.db["roadmap_plans"].update_one(
                        {
                            "userId": user_id,
                            "stages.id": action.stage_id
                        },
                        {
                            "$set": {
                                f"stages.$.progress": action.data.get("progress", 0)
                            }
                        }
                    )
                
                elif action.action_type == "add_task":
                    await self.db["roadmap_plans"].update_one(
                        {
                            "userId": user_id,
                            "stages.id": action.stage_id
                        },
                        {
                            "$push": {
                                "stages.$.tasks": action.data
                            }
                        }
                    )
                
                elif action.action_type == "complete_task":
                    await self.db["roadmap_plans"].update_one(
                        {
                            "userId": user_id,
                            "stages.tasks.id": action.data.get("id")
                        },
                        {
                            "$set": {
                                "stages.$.tasks.$[task].completed": True
                            }
                        },
                        array_filters=[{"task.id": action.data.get("id")}]
                    )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to apply sync actions: {e}")
            return False
    
    async def _update_profile_sync_status(
        self,
        user_id: str,
        sections: List[str]
    ) -> None:
        """Update profile section sync status"""
        if not self.db:
            return
        
        now = datetime.utcnow()
        
        for section in sections:
            await self.db["smart_profiles"].update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        f"{section}._meta.synced_to_roadmap": True,
                        f"{section}._meta.last_sync_at": now,
                        "last_roadmap_sync": now
                    }
                }
            )
    
    async def _update_profile_readiness(
        self,
        user_id: str,
        readiness_updates: Dict[str, Any]
    ) -> None:
        """Update profile readiness scores"""
        if not self.db:
            return
        
        update_fields = {}
        for key, value in readiness_updates.items():
            update_fields[f"readiness.section_readiness.{key}"] = value
        
        # Calculate overall readiness
        overall = sum(readiness_updates.values()) / len(readiness_updates) if readiness_updates else 0
        update_fields["readiness.overall_readiness"] = int(overall)
        
        await self.db["smart_profiles"].update_one(
            {"user_id": user_id},
            {"$set": update_fields}
        )


# ============================================
# FACTORY FUNCTION
# ============================================

def create_roadmap_syncer_agent(db=None, rules: List[SyncRule] = None) -> RoadmapSyncerAgent:
    """Factory function to create a RoadmapSyncerAgent"""
    return RoadmapSyncerAgent(db=db, rules=rules)


# ============================================
# DREAM ROADMAP GENERATION FROM PROFILE
# ============================================

class DreamRoadmapStage(BaseModel):
    """Stage for dream roadmap"""
    order: int
    title: str
    description: str
    category: str = "general"
    estimated_duration_weeks: int = 4


def generate_dream_stages_from_profile(profile_data: Dict[str, Any]) -> List[DreamRoadmapStage]:
    """
    Generate dream roadmap stages from SmartProfile data.
    This creates a personalized dream roadmap for users who signed up directly
    without using the dream chat flow.
    
    Args:
        profile_data: SmartProfile data from onboarding
        
    Returns:
        List of DreamRoadmapStage objects
    """
    stages = []
    
    # Extract key info from profile
    target_degree = profile_data.get("application_goals", {}).get("target_degree", "masters")
    target_countries = profile_data.get("application_goals", {}).get("target_countries", [])
    target_intake = profile_data.get("application_goals", {}).get("target_intake", {})
    education = profile_data.get("education", [{}])[0] if profile_data.get("education") else {}
    test_scores = profile_data.get("test_scores", {})
    financial = profile_data.get("financial_details", {})
    
    field_of_study = education.get("field_of_study") or profile_data.get("application_goals", {}).get("field_of_interest", "your field")
    target_semester = target_intake.get("semester", "fall")
    target_year = target_intake.get("year", datetime.utcnow().year + 1)
    
    # Determine country string
    if target_countries:
        if len(target_countries) == 1:
            country_str = target_countries[0]
        else:
            country_str = f"{', '.join(target_countries[:-1])} or {target_countries[-1]}"
    else:
        country_str = "abroad"
    
    # Stage 1: Foundation - Self Assessment
    stages.append(DreamRoadmapStage(
        order=1,
        title="Solidify Your Foundation",
        description=f"Reflect on your passion for {field_of_study} and clarify why pursuing a {target_degree} in {country_str} aligns with your career goals.",
        category="foundation",
        estimated_duration_weeks=2
    ))
    
    # Stage 2: Test Preparation (conditional)
    english_test = test_scores.get("english", {})
    gre_data = test_scores.get("gre", {})
    
    needs_english = not english_test.get("overall_score")
    needs_gre = target_degree in ["masters", "phd"] and not gre_data.get("total_score")
    
    if needs_english or needs_gre:
        test_list = []
        if needs_english:
            test_list.append("TOEFL/IELTS")
        if needs_gre:
            test_list.append("GRE")
        
        stages.append(DreamRoadmapStage(
            order=2,
            title="Conquer Your Tests",
            description=f"Prepare and excel in {' and '.join(test_list)} to strengthen your application profile.",
            category="test_prep",
            estimated_duration_weeks=12 if needs_gre else 8
        ))
    
    # Stage 3: Research Programs
    stages.append(DreamRoadmapStage(
        order=3,
        title="Discover Your Perfect Programs",
        description=f"Research {target_degree} programs in {field_of_study} across {country_str}, identifying universities that match your profile and aspirations.",
        category="research",
        estimated_duration_weeks=4
    ))
    
    # Stage 4: Build Your Profile
    if target_degree == "phd":
        profile_desc = "Strengthen your research profile through publications, connect with potential advisors, and identify research opportunities."
    elif target_degree == "mba":
        profile_desc = "Highlight your leadership experiences, professional achievements, and clearly articulate your post-MBA goals."
    else:
        profile_desc = f"Build a compelling profile through relevant projects, internships, or research in {field_of_study}."
    
    stages.append(DreamRoadmapStage(
        order=4,
        title="Build Your Unique Story",
        description=profile_desc,
        category="profile_building",
        estimated_duration_weeks=8
    ))
    
    # Stage 5: Application Materials
    stages.append(DreamRoadmapStage(
        order=5,
        title="Craft Your Applications",
        description="Create compelling SOPs, secure strong recommendation letters, and polish your resume to tell your unique story.",
        category="materials",
        estimated_duration_weeks=6
    ))
    
    # Stage 6: Financial Planning
    budget = financial.get("budget_range", {})
    needs_funding = financial.get("need_scholarship", False)
    
    if needs_funding:
        funding_desc = "Research and apply for scholarships, assistantships, and financial aid to fund your education."
    else:
        funding_desc = "Plan your finances, explore funding options, and ensure you're prepared for the investment in your future."
    
    stages.append(DreamRoadmapStage(
        order=6,
        title="Secure Your Funding",
        description=funding_desc,
        category="financial",
        estimated_duration_weeks=4
    ))
    
    # Stage 7: Submit & Track
    stages.append(DreamRoadmapStage(
        order=7,
        title="Submit & Succeed",
        description=f"Submit your applications before deadlines for {target_semester.capitalize()} {target_year}, track your status, and prepare for interviews.",
        category="submission",
        estimated_duration_weeks=4
    ))
    
    return stages


async def create_dream_roadmap_from_profile(
    user_id: str,
    profile_data: Dict[str, Any],
    db=None
) -> Dict[str, Any]:
    """
    Create a dream roadmap for users who signed up directly (not through dream chat).
    Regenerates the roadmap from combined profile context.
    
    Args:
        user_id: The user's ID
        profile_data: SmartProfile data
        db: Database connection (optional)
        
    Returns:
        Created roadmap data
    """
    # Generate dream stages from profile
    dream_stages = generate_dream_stages_from_profile(profile_data)
    
    # Convert to serializable format
    roadmap_data = {
        "userId": user_id,
        "createdFromProfile": True,
        "createdAt": datetime.utcnow(),
        "dreamStages": [
            {
                "order": stage.order,
                "title": stage.title,
                "description": stage.description,
                "category": stage.category,
                "estimatedDurationWeeks": stage.estimated_duration_weeks,
                "status": "not_started" if stage.order > 1 else "in_progress",
            }
            for stage in dream_stages
        ],
        "profileContext": {
            "targetDegree": profile_data.get("application_goals", {}).get("target_degree"),
            "targetCountries": profile_data.get("application_goals", {}).get("target_countries", []),
            "targetIntake": profile_data.get("application_goals", {}).get("target_intake"),
            "fieldOfStudy": profile_data.get("application_goals", {}).get("field_of_interest"),
        }
    }
    
    # Store in database if available
    if db:
        result = await db["roadmap_plans"].update_one(
            {"userId": user_id},
            {"$set": roadmap_data},
            upsert=True
        )
        roadmap_data["_id"] = str(result.upserted_id) if result.upserted_id else None
    
    return roadmap_data


# ============================================
# CONVENIENCE FUNCTIONS
# ============================================

async def sync_profile_changes(
    user_id: str,
    changed_sections: List[str],
    profile_data: Dict[str, Any],
    db=None
) -> SyncResult:
    """Convenience function for syncing profile changes"""
    agent = create_roadmap_syncer_agent(db=db)
    return await agent.sync_profile_to_roadmap(user_id, changed_sections, profile_data)


async def sync_roadmap_progress(
    user_id: str,
    stage_updates: List[Dict[str, Any]],
    db=None
) -> SyncResult:
    """Convenience function for syncing roadmap progress to profile"""
    agent = create_roadmap_syncer_agent(db=db)
    return await agent.sync_roadmap_to_profile(user_id, stage_updates)
