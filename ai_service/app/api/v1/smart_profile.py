"""
SmartProfile API - FastAPI endpoints for profile management

This module provides comprehensive CRUD operations for SmartProfile,
including section-level updates, sync operations, and chat extraction.
"""

from datetime import datetime
from typing import Optional, List, Any
from uuid import uuid4
import logging

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

from app.models.smart_profile import (
    SmartProfile,
    ProfileUpdateRequest,
    ProfileUpdateResult,
    ChatExtractionResult,
    ExtractedField,
    SyncLogEntry,
    VersionMetadata,
    SectionTimestamp,
    ModifiedBy,
    SyncAction,
    create_empty_smart_profile,
    smart_profile_to_dict,
    dict_to_smart_profile,
)
from app.database.mongodb import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/smart-profile", tags=["SmartProfile"])

COLLECTION_NAME = "smart_profiles"


# ============================================
# HELPER FUNCTIONS
# ============================================

async def get_collection():
    """Get the SmartProfile MongoDB collection"""
    db = get_database()
    return db[COLLECTION_NAME]


def update_section_meta(section_data: dict, source: ModifiedBy = ModifiedBy.USER) -> dict:
    """Update the _meta field of a section"""
    section_data["_meta"] = {
        "updated_at": datetime.utcnow(),
        "updated_by": source.value,
        "synced_to_roadmap": False,
    }
    return section_data


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class CreateProfileRequest(BaseModel):
    user_id: str
    initial_data: Optional[dict] = None


class GetProfileResponse(BaseModel):
    profile: SmartProfile
    computed: dict  # Computed fields like completeness


class UpdateSectionRequest(BaseModel):
    section: str
    data: dict
    source: str = "user"
    sync_to_roadmap: bool = True


class BulkUpdateRequest(BaseModel):
    updates: List[UpdateSectionRequest]
    source: str = "user"


class SyncToRoadmapRequest(BaseModel):
    sections: Optional[List[str]] = None  # None means all sections
    force: bool = False


class ChatMessageForExtraction(BaseModel):
    message: str
    context: Optional[dict] = None


# ============================================
# CRUD ENDPOINTS
# ============================================

@router.post("/", response_model=SmartProfile)
async def create_profile(request: CreateProfileRequest):
    """
    Create a new SmartProfile for a user.
    
    If initial_data is provided, it will be merged into the empty profile.
    """
    collection = await get_collection()
    
    # Check if profile already exists
    existing = await collection.find_one({"user_id": request.user_id})
    if existing:
        raise HTTPException(status_code=409, detail="Profile already exists for this user")
    
    # Create empty profile
    profile = create_empty_smart_profile(request.user_id)
    
    # Merge initial data if provided
    if request.initial_data:
        profile_dict = smart_profile_to_dict(profile)
        for section, data in request.initial_data.items():
            if section in profile_dict and isinstance(data, dict):
                profile_dict[section].update(data)
        profile = dict_to_smart_profile(profile_dict)
    
    # Insert into database
    profile_dict = smart_profile_to_dict(profile)
    result = await collection.insert_one(profile_dict)
    profile_dict["_id"] = str(result.inserted_id)
    
    logger.info(f"Created SmartProfile for user {request.user_id}")
    return dict_to_smart_profile(profile_dict)


@router.get("/{user_id}", response_model=GetProfileResponse)
async def get_profile(user_id: str):
    """
    Get a user's SmartProfile with computed fields.
    """
    collection = await get_collection()
    profile_doc = await collection.find_one({"user_id": user_id})
    
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile_doc["_id"] = str(profile_doc["_id"])
    profile = dict_to_smart_profile(profile_doc)
    
    # Compute additional fields
    computed = {
        "completeness": calculate_profile_completeness(profile),
        "next_actions": get_next_actions(profile),
        "pending_sync_count": profile.sync_log.pending_changes,
    }
    
    return GetProfileResponse(profile=profile, computed=computed)


@router.put("/{user_id}/section", response_model=ProfileUpdateResult)
async def update_section(user_id: str, request: UpdateSectionRequest):
    """
    Update a specific section of the profile.
    
    This is the primary way to update profile data, whether from
    the UI, chat, or imports.
    """
    collection = await get_collection()
    profile_doc = await collection.find_one({"user_id": user_id})
    
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    source = ModifiedBy(request.source)
    section = request.section
    
    # Validate section exists
    valid_sections = [
        "personal_info", "contact_info", "education", "test_scores",
        "research", "publications", "work_experience", "skills",
        "activities", "awards", "lor_tracking", "application_goals",
        "financial_details", "readiness"
    ]
    
    if section not in valid_sections:
        raise HTTPException(status_code=400, detail=f"Invalid section: {section}")
    
    # Update section with meta
    updated_data = update_section_meta(request.data, source)
    
    # Get old value for sync log
    old_value = profile_doc.get(section, {})
    
    # Update in database
    new_version = profile_doc.get("version", {}).get("version", 1) + 1
    
    update_result = await collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                section: updated_data,
                "updated_at": datetime.utcnow(),
                "version.version": new_version,
                "version.last_modified": datetime.utcnow(),
                "version.modified_by": source.value,
            },
            "$push": {
                "version.change_log": f"Updated {section}",
                "sync_log.entries": {
                    "id": str(uuid4()),
                    "timestamp": datetime.utcnow(),
                    "source": source.value,
                    "action": SyncAction.UPDATE.value,
                    "section": section,
                    "old_value": old_value,
                    "new_value": updated_data,
                    "description": f"Updated {section} from {source.value}",
                    "synced_to_roadmap": False,
                }
            },
            "$inc": {
                "sync_log.pending_changes": 1
            }
        }
    )
    
    # Trigger roadmap sync if requested
    synced = False
    if request.sync_to_roadmap:
        synced = await trigger_roadmap_sync(user_id, [section])
    
    logger.info(f"Updated {section} for user {user_id}, synced={synced}")
    
    return ProfileUpdateResult(
        success=update_result.modified_count > 0,
        updated_section=section,
        new_version=new_version,
        synced_to_roadmap=synced
    )


@router.put("/{user_id}/bulk", response_model=List[ProfileUpdateResult])
async def bulk_update_sections(user_id: str, request: BulkUpdateRequest):
    """
    Update multiple sections at once.
    
    Useful for importing data or chat extractions that touch multiple areas.
    """
    results = []
    
    for update in request.updates:
        update.source = request.source
        result = await update_section(user_id, update)
        results.append(result)
    
    return results


@router.delete("/{user_id}")
async def delete_profile(user_id: str):
    """Delete a user's SmartProfile."""
    collection = await get_collection()
    result = await collection.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    logger.info(f"Deleted SmartProfile for user {user_id}")
    return {"success": True, "message": "Profile deleted"}


# ============================================
# SYNC ENDPOINTS
# ============================================

@router.post("/{user_id}/sync-to-roadmap")
async def sync_profile_to_roadmap(user_id: str, request: SyncToRoadmapRequest):
    """
    Manually trigger sync of profile changes to roadmap.
    
    This updates the roadmap based on profile changes and clears
    the pending sync queue.
    """
    sections = request.sections or [
        "education", "test_scores", "research", "work_experience",
        "application_goals", "financial_details", "readiness"
    ]
    
    success = await trigger_roadmap_sync(user_id, sections, force=request.force)
    
    if success:
        # Clear pending changes
        collection = await get_collection()
        await collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "sync_log.pending_changes": 0,
                    "sync_log.last_full_sync": datetime.utcnow(),
                    "last_roadmap_sync": datetime.utcnow(),
                }
            }
        )
    
    return {
        "success": success,
        "synced_sections": sections,
        "timestamp": datetime.utcnow()
    }


@router.get("/{user_id}/sync-log")
async def get_sync_log(
    user_id: str,
    limit: int = Query(50, ge=1, le=200),
    section: Optional[str] = None
):
    """Get the sync log for a user's profile."""
    collection = await get_collection()
    profile_doc = await collection.find_one(
        {"user_id": user_id},
        {"sync_log": 1}
    )
    
    if not profile_doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    entries = profile_doc.get("sync_log", {}).get("entries", [])
    
    # Filter by section if specified
    if section:
        entries = [e for e in entries if e.get("section") == section]
    
    # Sort by timestamp descending and limit
    entries = sorted(entries, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit]
    
    return {
        "entries": entries,
        "total": len(entries),
        "pending_changes": profile_doc.get("sync_log", {}).get("pending_changes", 0)
    }


# ============================================
# CHAT EXTRACTION ENDPOINT
# ============================================

@router.post("/{user_id}/extract-from-chat", response_model=ChatExtractionResult)
async def extract_from_chat(user_id: str, request: ChatMessageForExtraction):
    """
    Extract profile information from a chat message.
    
    This uses NLP to identify profile-relevant information in the message
    and returns suggested updates for user confirmation.
    """
    # This will be implemented with the Profile Updater Agent
    # For now, return a placeholder that indicates the feature
    
    extracted_fields = await analyze_chat_for_profile_data(
        request.message,
        request.context
    )
    
    suggested_updates = []
    for field in extracted_fields:
        if field.confidence >= 0.7:
            suggested_updates.append(ProfileUpdateRequest(
                section=field.section,
                data={field.field: field.value},
                source=ModifiedBy.CHAT,
                sync_to_roadmap=True
            ))
    
    requires_confirmation = any(f.confidence < 0.9 for f in extracted_fields)
    
    return ChatExtractionResult(
        extracted_fields=extracted_fields,
        suggested_updates=suggested_updates,
        requires_confirmation=requires_confirmation,
        message=f"Found {len(extracted_fields)} potential profile updates"
    )


@router.post("/{user_id}/apply-chat-extraction")
async def apply_chat_extraction(user_id: str, updates: List[ProfileUpdateRequest]):
    """
    Apply confirmed chat extractions to the profile.
    
    This is called after user confirms the extracted data.
    """
    results = []
    
    for update in updates:
        update.source = ModifiedBy.CHAT
        request = UpdateSectionRequest(
            section=update.section,
            data=update.data,
            source="chat",
            sync_to_roadmap=update.sync_to_roadmap
        )
        result = await update_section(user_id, request)
        results.append(result)
    
    return {
        "applied_count": len(results),
        "results": results
    }


# ============================================
# UTILITY FUNCTIONS
# ============================================

def calculate_profile_completeness(profile: SmartProfile) -> dict:
    """Calculate profile completeness by section and overall."""
    
    sections = {
        "personal_info": check_personal_info_complete(profile.personal_info),
        "contact_info": check_contact_info_complete(profile.contact_info),
        "education": len(profile.education.entries) > 0,
        "test_scores": check_test_scores_complete(profile.test_scores),
        "research": len(profile.research.entries) > 0 or len(profile.research.research_interests) > 0,
        "work_experience": len(profile.work_experience.entries) > 0,
        "skills": len(profile.skills.skills) > 0,
        "application_goals": len(profile.application_goals.programs) > 0,
        "lor_tracking": len(profile.lor_tracking.contacts) > 0,
    }
    
    completed = sum(1 for v in sections.values() if v)
    total = len(sections)
    overall = int((completed / total) * 100) if total > 0 else 0
    
    return {
        "overall": overall,
        "sections": sections,
        "completed_count": completed,
        "total_count": total
    }


def check_personal_info_complete(info) -> bool:
    """Check if personal info section is reasonably complete."""
    return bool(info.first_name and info.last_name and info.nationality)


def check_contact_info_complete(info) -> bool:
    """Check if contact info section is reasonably complete."""
    return bool(info.email)


def check_test_scores_complete(scores) -> bool:
    """Check if any test scores are recorded."""
    return any([
        scores.gre and scores.gre.status.value == "completed",
        scores.toefl and scores.toefl.status.value == "completed",
        scores.ielts and scores.ielts.status.value == "completed",
        scores.gmat and scores.gmat.status.value == "completed",
    ])


def get_next_actions(profile: SmartProfile) -> List[dict]:
    """Get suggested next actions based on profile state."""
    actions = []
    
    if not profile.personal_info.first_name:
        actions.append({
            "section": "personal_info",
            "action": "Complete your personal information",
            "priority": "high"
        })
    
    if len(profile.education.entries) == 0:
        actions.append({
            "section": "education",
            "action": "Add your educational background",
            "priority": "high"
        })
    
    if not check_test_scores_complete(profile.test_scores):
        actions.append({
            "section": "test_scores",
            "action": "Add or plan your test scores",
            "priority": "medium"
        })
    
    if len(profile.application_goals.programs) == 0:
        actions.append({
            "section": "application_goals",
            "action": "Add your target programs",
            "priority": "high"
        })
    
    if len(profile.lor_tracking.contacts) == 0:
        actions.append({
            "section": "lor_tracking",
            "action": "Identify potential recommenders",
            "priority": "medium"
        })
    
    return actions[:5]  # Return top 5 actions


async def trigger_roadmap_sync(
    user_id: str,
    sections: List[str],
    force: bool = False
) -> bool:
    """
    Trigger roadmap sync for specific sections.
    
    Uses the RoadmapSyncerAgent for actual synchronization.
    """
    try:
        from app.agents.roadmap_syncer_agent import create_roadmap_syncer_agent
        
        # Get user's profile data
        collection = await get_collection()
        profile_doc = await collection.find_one({"user_id": user_id})
        
        if not profile_doc:
            logger.warning(f"No profile found for user {user_id}")
            return False
        
        # Create agent with database connection
        db = get_database()
        agent = create_roadmap_syncer_agent(db=db)
        
        # Run sync
        result = await agent.sync_profile_to_roadmap(
            user_id=user_id,
            changed_sections=sections,
            profile_data=profile_doc,
            force=force
        )
        
        logger.info(f"Roadmap sync for user {user_id}: success={result.success}, actions={len(result.actions_taken)}")
        return result.success
        
    except Exception as e:
        logger.error(f"Roadmap sync failed for user {user_id}: {e}")
        return False


async def analyze_chat_for_profile_data(
    message: str,
    context: Optional[dict] = None
) -> List[ExtractedField]:
    """
    Analyze a chat message for profile-relevant information.
    
    Uses the ProfileUpdaterAgent for NLP extraction.
    """
    try:
        from app.agents.profile_updater_agent import create_profile_updater_agent
        
        # Create agent (optionally with LLM client)
        agent = create_profile_updater_agent()
        
        # Run extraction
        result = await agent.analyze_message(message, context)
        
        # Convert to API response format
        return [
            ExtractedField(
                section=f.section,
                field=f.field,
                value=f.value,
                confidence=f.confidence
            )
            for f in result.extracted_fields
        ]
        
    except Exception as e:
        logger.error(f"Chat extraction failed: {e}")
        return []


# ============================================
# MIGRATION ENDPOINT
# ============================================

@router.post("/{user_id}/migrate-from-legacy")
async def migrate_from_legacy_profile(user_id: str):
    """
    Migrate data from the legacy UserProfile to SmartProfile.
    
    This reads the old profile format and converts it to SmartProfile.
    """
    db = get_database()
    
    # Get legacy profile
    legacy_collection = db["user_profiles"]
    legacy_profile = await legacy_collection.find_one({"userId": user_id})
    
    if not legacy_profile:
        raise HTTPException(status_code=404, detail="Legacy profile not found")
    
    # Check if SmartProfile already exists
    smart_collection = await get_collection()
    existing = await smart_collection.find_one({"user_id": user_id})
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail="SmartProfile already exists. Use update endpoints instead."
        )
    
    # Create SmartProfile from legacy data
    profile = create_empty_smart_profile(user_id)
    
    # Map legacy fields
    if legacy_profile.get("academicBackground"):
        bg = legacy_profile["academicBackground"]
        if bg.get("currentInstitution"):
            from app.models.smart_profile import EducationEntry, DegreeType
            profile.education.entries.append(EducationEntry(
                id=str(uuid4()),
                institution=bg.get("currentInstitution", ""),
                degree=bg.get("degreeType", ""),
                degree_type=DegreeType.BACHELORS,  # Default, needs manual update
                major=bg.get("fieldOfStudy", ""),
                gpa=bg.get("gpa"),
                start_date=datetime.now(),  # Placeholder
                is_currently=True
            ))
    
    if legacy_profile.get("testScores"):
        ts = legacy_profile["testScores"]
        from app.models.smart_profile import GREScore, TOEFLScore, TestStatus
        
        if ts.get("gre"):
            gre = ts["gre"]
            profile.test_scores.gre = GREScore(
                verbal=gre.get("verbal"),
                quantitative=gre.get("quantitative"),
                analytical_writing=gre.get("analyticalWriting"),
                status=TestStatus.COMPLETED if gre.get("verbal") else TestStatus.NOT_PLANNED
            )
        
        if ts.get("toefl"):
            toefl = ts["toefl"]
            profile.test_scores.toefl = TOEFLScore(
                total_score=toefl.get("total"),
                status=TestStatus.COMPLETED if toefl.get("total") else TestStatus.NOT_PLANNED
            )
    
    if legacy_profile.get("targetPrograms"):
        from app.models.smart_profile import TargetProgram, ProgramPriority, ApplicationStatus
        
        for tp in legacy_profile["targetPrograms"]:
            profile.application_goals.programs.append(TargetProgram(
                id=tp.get("id", str(uuid4())),
                university=tp.get("university", ""),
                program=tp.get("program", ""),
                degree=DegreeType.MASTERS,  # Default
                deadline=tp.get("deadline", datetime.now()),
                priority=ProgramPriority(tp.get("priority", "target")),
                status=ApplicationStatus(tp.get("status", "researching"))
            ))
    
    # Save SmartProfile
    profile_dict = smart_profile_to_dict(profile)
    result = await smart_collection.insert_one(profile_dict)
    profile_dict["_id"] = str(result.inserted_id)
    
    logger.info(f"Migrated legacy profile to SmartProfile for user {user_id}")
    
    return {
        "success": True,
        "message": "Profile migrated successfully",
        "profile_id": str(result.inserted_id)
    }
