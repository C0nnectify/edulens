"""
Roadmap API endpoints for Dream Mode
"""

from fastapi import APIRouter, HTTPException, status
from typing import List
import logging

from app.models.roadmap import (
    StageConfig,
    StageListResponse,
    StageResponse,
    AnalyticsEventRequest,
    AnalyticsEventResponse
)
from app.services.roadmap_service import roadmap_service
from app.services.roadmap_analytics_service import roadmap_analytics_service

logger = logging.getLogger(__name__)


router = APIRouter(tags=["Roadmap"])

@router.get("/")
async def roadmap_root():
    """Check if roadmap router is active"""
    return {"status": "active", "module": "roadmap"}

@router.get("/stages", response_model=StageListResponse)
async def get_all_stages():
    """
    Get all Dream Mode stages in order
    
    Returns list of 12 stages from Dream to Thrive
    """
    try:
        logger.info("Fetching all roadmap stages")
        stages = roadmap_service.get_all_stages()
        logger.info(f"Retrieved {len(stages)} stages")
        
        return StageListResponse(
            success=True,
            stages=stages,
            total=len(stages)
        )
    
    except Exception as e:
        logger.error(f"Failed to get stages: {e}")
        print(f"Roadmap Error: {e}")
        # Fallback for debugging
        return StageListResponse(
            success=False,
            stages=[],
            total=0
        )


@router.get("/stages/{stage_id}", response_model=StageResponse)
async def get_stage_by_id(stage_id: str):
    """
    Get a specific stage by ID
    
    Args:
        stage_id: Stage identifier (e.g., "stage_1_dream_permission")
    """
    try:
        stage = roadmap_service.get_stage_by_id(stage_id)
        
        if not stage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stage not found: {stage_id}"
            )
        
        return StageResponse(
            success=True,
            stage=stage
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get stage {stage_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve stage: {str(e)}"
        )


@router.get("/stages/order/{order}", response_model=StageResponse)
async def get_stage_by_order(order: int):
    """
    Get a specific stage by order number
    
    Args:
        order: Stage order (1-12)
    """
    try:
        if order < 1 or order > 12:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stage order must be between 1 and 12"
            )
        
        stage = roadmap_service.get_stage_by_order(order)
        
        if not stage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stage not found for order: {order}"
            )
        
        return StageResponse(
            success=True,
            stage=stage
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get stage by order {order}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve stage: {str(e)}"
        )


@router.post("/analytics/track", response_model=AnalyticsEventResponse)
async def track_analytics_event(event: AnalyticsEventRequest):
    """
    Track a Dream Mode analytics event
    
    Events: roadmap_opened, dream_mode_started, dream_stage_viewed,
            dream_mode_completed, dream_to_signup_click, dream_to_reality_mode_click
    """
    try:
        event_id = await roadmap_analytics_service.track_event(event)
        
        return AnalyticsEventResponse(
            success=True,
            message="Event tracked successfully",
            event_id=event_id
        )
    
    except Exception as e:
        logger.error(f"Failed to track analytics event: {e}")
        # Return success even on error to not break user experience
        return AnalyticsEventResponse(
            success=True,
            message="Event received",
            event_id="unknown"
        )


@router.get("/analytics/stats")
async def get_analytics_stats():
    """
    Get analytics statistics (admin endpoint)
    
    Returns summary of Dream Mode usage
    """
    try:
        stats = await roadmap_analytics_service.get_event_stats()
        return {
            "success": True,
            "data": stats
        }
    
    except Exception as e:
        logger.error(f"Failed to get analytics stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )
