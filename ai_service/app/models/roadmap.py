"""
Roadmap models for Dream Mode journey stages
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    """Stage difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class StageMeta(BaseModel):
    """Metadata about a stage"""
    durationHint: str = Field(..., description="Expected time to complete this stage")
    difficulty: DifficultyLevel = Field(..., description="Difficulty level of the stage")


class FeatureHook(BaseModel):
    """EduLens feature connection for a stage"""
    title: str = Field(..., description="Title of the feature hook")
    body: str = Field(..., description="Description of how EduLens helps in this stage")


class StageConfig(BaseModel):
    """Configuration for a single roadmap stage"""
    id: str = Field(..., description="Unique stage identifier")
    order: int = Field(..., ge=1, le=12, description="Stage order (1-12)")
    shortLabel: str = Field(..., description="Short label for timeline node")
    fullTitle: str = Field(..., description="Full stage title")
    themeColor: str = Field(..., description="Hex color code for stage theme")
    goal: str = Field(..., description="Main objective of this stage")
    dos: List[str] = Field(..., description="List of recommended actions")
    donts: List[str] = Field(..., description="List of things to avoid")
    edulensFeatureHook: FeatureHook = Field(..., description="How EduLens helps in this stage")
    meta: StageMeta = Field(..., description="Stage metadata")


class StageListResponse(BaseModel):
    """Response for list of stages"""
    success: bool = True
    stages: List[StageConfig]
    total: int = Field(..., description="Total number of stages")


class StageResponse(BaseModel):
    """Response for a single stage"""
    success: bool = True
    stage: StageConfig


class AnalyticsEventType(str, Enum):
    """Types of analytics events"""
    ROADMAP_OPENED = "roadmap_opened"
    DREAM_MODE_STARTED = "dream_mode_started"
    DREAM_STAGE_VIEWED = "dream_stage_viewed"
    DREAM_MODE_COMPLETED = "dream_mode_completed"
    DREAM_TO_SIGNUP_CLICK = "dream_mode_to_signup_click"
    DREAM_TO_REALITY_CLICK = "dream_mode_to_reality_mode_click"


class AnalyticsEventRequest(BaseModel):
    """Request to track an analytics event"""
    event_type: AnalyticsEventType = Field(..., description="Type of event")
    stage_id: Optional[str] = Field(None, description="Stage ID if applicable")
    session_id: str = Field(..., description="Unique session identifier")
    user_id: Optional[str] = Field(None, description="User ID if logged in")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional event metadata")


class AnalyticsEventResponse(BaseModel):
    """Response after tracking an event"""
    success: bool = True
    message: str = "Event tracked successfully"
    event_id: str = Field(..., description="ID of the tracked event")
