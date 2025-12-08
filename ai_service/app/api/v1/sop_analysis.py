"""
SOP Analysis API Endpoints

Provides endpoints for comprehensive SOP analysis including:
- Full SOP analysis with scoring and recommendations
- Version comparison
- User analysis history
- Custom cliché management
"""

from fastapi import APIRouter, HTTPException, status
from typing import List

from app.models.schemas import (
    SOPAnalysisRequest,
    SOPComparisonRequest,
    CustomClicheRequest,
    APIResponse
)
from app.services.sop_analysis_service import sop_analysis_service
from app.utils.logger import logger

router = APIRouter(prefix="/sop-analysis", tags=["SOP Analysis"])


@router.post("/analyze", status_code=status.HTTP_200_OK)
async def analyze_sop(request: SOPAnalysisRequest):
    """
    Analyze an SOP and provide comprehensive feedback

    **Includes:**
    - Overall quality score (0-100)
    - Score breakdown (uniqueness, structure, specificity, tone, program fit)
    - Cliché detection with severity ratings
    - Structure and organization analysis
    - Tone and voice evaluation
    - Program customization assessment
    - Prioritized recommendations
    - Letter grade (A-F)

    **Example Request:**
    ```json
    {
        "user_id": "user123",
        "sop_text": "My statement of purpose text here...",
        "university_name": "Stanford University",
        "program_name": "Computer Science PhD",
        "compare_with_database": true
    }
    ```
    """
    try:
        logger.info(f"Analyzing SOP for user {request.user_id}")

        result = await sop_analysis_service.analyze_sop(
            sop_text=request.sop_text,
            user_id=request.user_id,
            university_name=request.university_name,
            program_name=request.program_name,
            compare_with_database=request.compare_with_database
        )

        return APIResponse(
            success=True,
            message=f"SOP analysis complete. Overall score: {result['scores']['overall']:.1f}/100 (Grade: {result['grade']})",
            data=result
        )

    except Exception as e:
        logger.error(f"Error analyzing SOP: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze SOP: {str(e)}"
        )


@router.post("/compare", status_code=status.HTTP_200_OK)
async def compare_sop_versions(request: SOPComparisonRequest):
    """
    Compare two versions of an SOP to track improvements

    **Returns:**
    - Analysis for both versions
    - Score improvements across all categories
    - Overall change in quality
    - Grade change

    **Example Request:**
    ```json
    {
        "user_id": "user123",
        "sop_text_1": "First version of SOP...",
        "sop_text_2": "Improved version of SOP..."
    }
    ```
    """
    try:
        logger.info(f"Comparing SOP versions for user {request.user_id}")

        result = await sop_analysis_service.compare_versions(
            user_id=request.user_id,
            sop_text_1=request.sop_text_1,
            sop_text_2=request.sop_text_2
        )

        improvement = result["overall_change"]
        message = f"Version comparison complete. "
        if improvement > 0:
            message += f"Improvement: +{improvement:.1f} points ({result['grade_change']})"
        elif improvement < 0:
            message += f"Score decreased: {improvement:.1f} points ({result['grade_change']})"
        else:
            message += f"No change in score ({result['grade_change']})"

        return APIResponse(
            success=True,
            message=message,
            data=result
        )

    except Exception as e:
        logger.error(f"Error comparing SOP versions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare SOP versions: {str(e)}"
        )


@router.get("/history/{user_id}", status_code=status.HTTP_200_OK)
async def get_analysis_history(user_id: str, limit: int = 10):
    """
    Get analysis history for a user

    **Parameters:**
    - user_id: User identifier
    - limit: Maximum number of results (default: 10, max: 50)

    **Returns:**
    - List of previous SOP analyses
    - Sorted by most recent first
    """
    try:
        # Validate limit
        if limit > 50:
            limit = 50

        logger.info(f"Fetching analysis history for user {user_id}")

        analyses = await sop_analysis_service.get_user_analyses(
            user_id=user_id,
            limit=limit
        )

        return APIResponse(
            success=True,
            message=f"Retrieved {len(analyses)} previous analyses",
            data={
                "user_id": user_id,
                "count": len(analyses),
                "analyses": analyses
            }
        )

    except Exception as e:
        logger.error(f"Error fetching analysis history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analysis history: {str(e)}"
        )


@router.post("/cliche/add", status_code=status.HTTP_201_CREATED)
async def add_custom_cliche(request: CustomClicheRequest):
    """
    Add a custom cliché to the detection database

    **Allows expansion of cliché detection system**

    **Example Request:**
    ```json
    {
        "text": "needless to say",
        "severity": "minor",
        "category": "redundant_phrase",
        "suggestion": "Remove this redundant phrase"
    }
    ```

    **Severity Levels:**
    - major: Critical issues that significantly harm the SOP
    - moderate: Notable problems that should be addressed
    - minor: Small improvements that would enhance quality
    """
    try:
        # Validate severity
        valid_severities = ["major", "moderate", "minor"]
        if request.severity not in valid_severities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid severity. Must be one of: {', '.join(valid_severities)}"
            )

        logger.info(f"Adding custom cliché: {request.text}")

        result = await sop_analysis_service.add_custom_cliche(
            text=request.text,
            severity=request.severity,
            category=request.category,
            suggestion=request.suggestion
        )

        return APIResponse(
            success=True,
            message=result["message"],
            data=result
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding custom cliché: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add custom cliché: {str(e)}"
        )


@router.get("/cliches", status_code=status.HTTP_200_OK)
async def get_all_cliches(limit: int = 100, category: str = None):
    """
    Get all clichés in the detection database

    **Parameters:**
    - limit: Maximum number of results (default: 100)
    - category: Filter by category (optional)

    **Returns:**
    - List of all clichés with their severity and suggestions
    """
    try:
        logger.info("Fetching clichés from database")

        # Build query
        query = {}
        if category:
            query["category"] = category

        # Fetch from database
        cursor = sop_analysis_service.cliches_collection.find(query).limit(limit)
        cliches = await cursor.to_list(length=limit)

        # Convert ObjectId to string
        for cliche in cliches:
            if "_id" in cliche:
                cliche["_id"] = str(cliche["_id"])

        return APIResponse(
            success=True,
            message=f"Retrieved {len(cliches)} clichés",
            data={
                "count": len(cliches),
                "cliches": cliches
            }
        )

    except Exception as e:
        logger.error(f"Error fetching clichés: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch clichés: {str(e)}"
        )


@router.get("/statistics/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_statistics(user_id: str):
    """
    Get aggregate statistics for a user's SOP analyses

    **Returns:**
    - Average scores across all analyses
    - Score trends over time
    - Most common issues
    - Improvement rate
    """
    try:
        logger.info(f"Fetching statistics for user {user_id}")

        # Get all user analyses
        analyses = await sop_analysis_service.get_user_analyses(
            user_id=user_id,
            limit=100  # Get more for better statistics
        )

        if not analyses:
            return APIResponse(
                success=True,
                message="No analyses found for this user",
                data={
                    "user_id": user_id,
                    "total_analyses": 0
                }
            )

        # Calculate statistics
        total = len(analyses)

        # Average scores
        avg_scores = {
            "overall": sum(a["scores"]["overall"] for a in analyses) / total,
            "uniqueness": sum(a["scores"]["uniqueness"] for a in analyses) / total,
            "structure": sum(a["scores"]["structure"] for a in analyses) / total,
            "specificity": sum(a["scores"]["specificity"] for a in analyses) / total,
            "tone": sum(a["scores"]["tone"] for a in analyses) / total,
            "program_fit": sum(a["scores"]["program_fit"] for a in analyses) / total
        }

        # Score trend (comparing first and last analysis)
        if total >= 2:
            first_score = analyses[-1]["scores"]["overall"]  # Oldest (reversed order)
            last_score = analyses[0]["scores"]["overall"]  # Most recent
            improvement = last_score - first_score
        else:
            improvement = 0

        # Most common cliché categories
        cliche_categories = {}
        for analysis in analyses:
            for category in analysis["cliche_detection"].get("categories", []):
                cliche_categories[category] = cliche_categories.get(category, 0) + 1

        # Sort categories by frequency
        top_cliche_categories = sorted(
            cliche_categories.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        # Grade distribution
        grade_distribution = {}
        for analysis in analyses:
            grade = analysis["grade"]
            grade_distribution[grade] = grade_distribution.get(grade, 0) + 1

        statistics = {
            "user_id": user_id,
            "total_analyses": total,
            "average_scores": {k: round(v, 2) for k, v in avg_scores.items()},
            "overall_improvement": round(improvement, 2),
            "grade_distribution": grade_distribution,
            "top_cliche_categories": [
                {"category": cat, "count": count}
                for cat, count in top_cliche_categories
            ],
            "latest_score": round(analyses[0]["scores"]["overall"], 2),
            "latest_grade": analyses[0]["grade"]
        }

        return APIResponse(
            success=True,
            message=f"Statistics for {total} analyses",
            data=statistics
        )

    except Exception as e:
        logger.error(f"Error fetching statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch statistics: {str(e)}"
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health check endpoint for SOP analysis service

    **Returns:**
    - Service status
    - AI model availability
    - Database connectivity
    """
    try:
        # Check AI model
        ai_available = sop_analysis_service.llm is not None

        # Check database
        db_available = True
        try:
            await sop_analysis_service.sop_collection.count_documents({}, limit=1)
        except:
            db_available = False

        # Check cliché database
        cliche_count = await sop_analysis_service.cliches_collection.count_documents({})

        health_status = {
            "status": "healthy" if (ai_available and db_available) else "degraded",
            "ai_model_available": ai_available,
            "database_available": db_available,
            "cliche_count": cliche_count,
            "features": {
                "full_analysis": True,
                "cliche_detection": True,
                "structure_analysis": True,
                "tone_analysis": True,
                "program_fit_analysis": True,
                "ai_recommendations": ai_available,
                "uniqueness_scoring": True,
                "version_comparison": True
            }
        }

        return APIResponse(
            success=True,
            message="SOP Analysis Service is operational",
            data=health_status
        )

    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service health check failed"
        )
