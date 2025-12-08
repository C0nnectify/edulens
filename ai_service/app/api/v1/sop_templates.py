"""
SOP Template API Endpoints
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
import logging

from app.models.sop_template import (
    SOPTemplate,
    TemplateSearchRequest,
    TemplateSearchResponse,
    PersonalizeTemplateRequest,
    PersonalizeTemplateResponse,
    CustomizeTemplateRequest,
    CustomizeTemplateResponse,
    TemplateRecommendationRequest,
    TemplateRecommendationResponse,
    SectionMixRequest,
    SectionMixResponse,
    ToneAdjustmentRequest,
    ToneAdjustmentResponse,
    SectionEnhancementRequest,
    SectionEnhancementResponse,
    CreateTemplateRequest,
    UpdateTemplateRequest,
    TemplateStatistics,
    BulkTemplateStatistics,
    DegreeLevel,
    FieldCategory,
    SOPPurpose,
)
from app.services.sop_template_service import sop_template_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/sop-templates", tags=["SOP Templates"])


@router.get("/", response_model=List[SOPTemplate])
async def list_templates(
    skip: int = Query(0, ge=0, description="Number of templates to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of templates to return"),
):
    """
    List all SOP templates with pagination

    Returns:
        List of SOP templates
    """
    try:
        templates = await sop_template_service.list_templates(skip=skip, limit=limit)
        return templates
    except Exception as e:
        logger.error(f"Error listing templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{template_id}", response_model=SOPTemplate)
async def get_template(template_id: str):
    """
    Get a specific SOP template by ID

    Args:
        template_id: Unique template identifier

    Returns:
        SOP template details
    """
    try:
        template = await sop_template_service.get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail=f"Template not found: {template_id}")
        return template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting template {template_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=TemplateSearchResponse)
async def search_templates(request: TemplateSearchRequest):
    """
    Search SOP templates with filters

    Request body:
        - filters: Optional filters (degree, field, purpose, word_count, tags)
        - query: Optional text search query
        - sort_by: Optional sort field (usage_count, success_rate)
        - limit: Maximum results to return
        - offset: Number of results to skip

    Returns:
        Search results with matching templates
    """
    try:
        results = await sop_template_service.search_templates(request)
        return results
    except Exception as e:
        logger.error(f"Error searching templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{template_id}/personalize", response_model=PersonalizeTemplateResponse)
async def personalize_template(
    template_id: str,
    request: PersonalizeTemplateRequest
):
    """
    Personalize a template with user data

    This endpoint replaces template variables with actual user information
    and generates a customized SOP based on the template structure.

    Args:
        template_id: Template to personalize
        request: Personalization data including name, university, program, etc.

    Returns:
        Personalized SOP content with sections and suggestions
    """
    try:
        # Ensure template_id matches request
        request.template_id = template_id

        result = await sop_template_service.personalize_template(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error personalizing template {template_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{template_id}/customize", response_model=CustomizeTemplateResponse)
async def customize_template(
    template_id: str,
    request: CustomizeTemplateRequest
):
    """
    AI-powered template customization

    This endpoint uses Google Gemini AI to enhance and customize the template
    beyond simple variable replacement. It can adjust tone, enhance sections,
    and make the content more specific and compelling.

    Args:
        template_id: Template to customize
        request: Customization instructions and user data

    Returns:
        AI-customized SOP with improvements and change log
    """
    try:
        request.template_id = template_id
        result = await sop_template_service.customize_template(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error customizing template {template_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations", response_model=TemplateRecommendationResponse)
async def get_recommendations(request: TemplateRecommendationRequest):
    """
    Get recommended templates for user profile

    This endpoint analyzes user profile and preferences to recommend
    the most suitable SOP templates with relevance scores.

    Request body:
        - user_profile: User's background and goals
        - degree: Target degree level
        - field: Academic field
        - purpose: SOP purpose (optional)
        - preferences: Additional preferences (optional)

    Returns:
        Ranked list of recommended templates with match reasons
    """
    try:
        recommendations = await sop_template_service.get_recommendations(request)
        return recommendations
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mix-sections", response_model=SectionMixResponse)
async def mix_sections(request: SectionMixRequest):
    """
    Mix sections from different templates

    This endpoint allows combining sections from multiple templates
    to create a hybrid SOP. Optionally generates smooth transitions.

    Request body:
        - section_selections: Map of section type to template ID
        - personalization_data: User data for variable substitution
        - transitions: Whether to generate AI transitions (default: true)

    Returns:
        Mixed SOP with sections from different templates
    """
    try:
        result = await sop_template_service.mix_sections(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error mixing sections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adjust-tone", response_model=ToneAdjustmentResponse)
async def adjust_tone(request: ToneAdjustmentRequest):
    """
    Adjust tone of SOP content

    Uses AI to adjust the tone of existing content to match
    target tone (formal, confident, humble, etc.)

    Request body:
        - content: Original content
        - current_tone: Current tone (optional)
        - target_tone: Desired tone
        - section_type: Type of section (optional)

    Returns:
        Tone-adjusted content with description of changes
    """
    try:
        result = await sop_template_service.adjust_tone(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error adjusting tone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance-section", response_model=SectionEnhancementResponse)
async def enhance_section(request: SectionEnhancementRequest):
    """
    Enhance a specific section with AI

    Uses AI to improve a specific section by adding detail,
    examples, specificity, or other enhancements.

    Request body:
        - content: Section content to enhance
        - section_type: Type of section
        - enhancement_type: Type of enhancement (add_more_detail, etc.)
        - context: Additional context (optional)

    Returns:
        Enhanced section with list of improvements
    """
    try:
        result = await sop_template_service.enhance_section(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error enhancing section: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=SOPTemplate)
async def create_template(request: CreateTemplateRequest):
    """
    Create a new SOP template (Admin)

    This endpoint allows administrators to add new templates
    to the library.

    Request body: Complete template definition

    Returns: Created template
    """
    try:
        template = await sop_template_service.create_template(request)
        return template
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{template_id}", response_model=SOPTemplate)
async def update_template(
    template_id: str,
    request: UpdateTemplateRequest
):
    """
    Update existing template (Admin)

    Args:
        template_id: Template to update
        request: Fields to update (only provided fields will be updated)

    Returns: Updated template
    """
    try:
        template = await sop_template_service.update_template(template_id, request)
        return template
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating template {template_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """
    Delete a template (Admin)

    Args:
        template_id: Template to delete

    Returns: Success message
    """
    try:
        success = await sop_template_service.delete_template(template_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Template not found: {template_id}")
        return {"message": f"Template {template_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting template {template_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{template_id}/statistics", response_model=TemplateStatistics)
async def get_template_statistics(template_id: str):
    """
    Get usage statistics for a template

    Args:
        template_id: Template ID

    Returns: Template statistics including usage count, success rate, etc.
    """
    try:
        stats = await sop_template_service.get_template_statistics(template_id)
        return stats
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting statistics for {template_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics/bulk", response_model=BulkTemplateStatistics)
async def get_bulk_statistics():
    """
    Get statistics across all templates

    Returns comprehensive statistics including:
    - Total templates and usage
    - Average success rate
    - Most popular templates
    - Distribution by degree, field, and purpose
    """
    try:
        stats = await sop_template_service.get_bulk_statistics()
        return stats
    except Exception as e:
        logger.error(f"Error getting bulk statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/filters/degrees", response_model=List[str])
async def get_available_degrees():
    """Get list of available degree levels"""
    return [degree.value for degree in DegreeLevel]


@router.get("/filters/fields", response_model=List[str])
async def get_available_fields():
    """Get list of available academic fields"""
    return [field.value for field in FieldCategory]


@router.get("/filters/purposes", response_model=List[str])
async def get_available_purposes():
    """Get list of available SOP purposes"""
    return [purpose.value for purpose in SOPPurpose]
