"""
Pydantic models for SOP template library
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, validator
from enum import Enum
from datetime import datetime


class DegreeLevel(str, Enum):
    """Academic degree levels"""
    PHD = "PhD"
    MASTERS = "Masters"
    UNDERGRADUATE = "Undergraduate"
    MBA = "MBA"
    POST_DOC = "Post-doc"


class FieldCategory(str, Enum):
    """Academic field categories"""
    COMPUTER_SCIENCE = "Computer Science"
    ENGINEERING = "Engineering"
    PHYSICS = "Physics"
    BIOLOGY = "Biology"
    CHEMISTRY = "Chemistry"
    MATHEMATICS = "Mathematics"
    BUSINESS = "Business"
    MBA = "MBA"
    HUMANITIES = "Humanities"
    SOCIAL_SCIENCES = "Social Sciences"
    DESIGN = "Design"
    DATA_SCIENCE = "Data Science"
    ARTIFICIAL_INTELLIGENCE = "Artificial Intelligence"
    MECHANICAL_ENGINEERING = "Mechanical Engineering"
    ELECTRICAL_ENGINEERING = "Electrical Engineering"
    CIVIL_ENGINEERING = "Civil Engineering"
    BIOMEDICAL_ENGINEERING = "Biomedical Engineering"
    OTHER = "Other"


class SOPPurpose(str, Enum):
    """Purpose of the SOP"""
    RESEARCH_FOCUSED = "Research-focused"
    PROFESSIONAL = "Professional"
    CAREER_CHANGE = "Career-change"
    GAP_YEAR = "Gap year explanation"
    INDUSTRY_TO_ACADEMIA = "Industry to academia"
    ACADEMIA_TO_INDUSTRY = "Academia to industry"
    CAREER_ADVANCEMENT = "Career advancement"
    ENTREPRENEURSHIP = "Entrepreneurship"
    FIRST_GEN = "First-gen student"
    INTERNATIONAL = "International student"
    PORTFOLIO_BASED = "Portfolio-based"
    INTERDISCIPLINARY = "Interdisciplinary"


class ToneIndicator(str, Enum):
    """Tone of the SOP"""
    FORMAL = "Formal"
    CONFIDENT = "Confident"
    HUMBLE = "Humble"
    PASSIONATE = "Passionate"
    ANALYTICAL = "Analytical"
    NARRATIVE = "Narrative"
    BALANCED = "Balanced"


class SectionType(str, Enum):
    """SOP section types"""
    INTRODUCTION = "Introduction"
    BACKGROUND = "Background"
    ACADEMIC_PREPARATION = "Academic Preparation"
    RESEARCH_EXPERIENCE = "Research Experience"
    PROFESSIONAL_EXPERIENCE = "Professional Experience"
    RESEARCH_INTERESTS = "Research Interests"
    CAREER_GOALS = "Career Goals"
    PROGRAM_FIT = "Program Fit"
    FACULTY_INTERESTS = "Faculty Interests"
    CONCLUSION = "Conclusion"
    GAP_EXPLANATION = "Gap Explanation"
    DIVERSITY_STATEMENT = "Diversity Statement"


class SectionStructure(BaseModel):
    """Structure for a single section of the SOP"""
    section_type: SectionType
    paragraphs: int = Field(ge=1, le=5, description="Number of paragraphs in this section")
    word_count_min: int = Field(ge=50, description="Minimum words for this section")
    word_count_max: int = Field(ge=50, description="Maximum words for this section")
    word_count_target: int = Field(ge=50, description="Target word count for this section")
    tips: List[str] = Field(default_factory=list, description="Writing tips for this section")
    key_elements: List[str] = Field(default_factory=list, description="Key elements to include")
    common_mistakes: List[str] = Field(default_factory=list, description="Common mistakes to avoid")
    example_phrases: List[str] = Field(default_factory=list, description="Example phrases or sentences")

    @validator("word_count_target")
    def validate_target(cls, v, values):
        """Ensure target is within min and max"""
        if "word_count_min" in values and "word_count_max" in values:
            if not (values["word_count_min"] <= v <= values["word_count_max"]):
                raise ValueError("Target word count must be between min and max")
        return v


class TemplateCategory(BaseModel):
    """Category classification for templates"""
    degree: DegreeLevel
    field: FieldCategory
    purpose: SOPPurpose
    specialization: Optional[str] = None


class SuccessExample(BaseModel):
    """Anonymized success example"""
    excerpt: str = Field(description="Anonymized excerpt from successful SOP")
    university: str = Field(description="University where accepted")
    program: str = Field(description="Program name")
    year: int = Field(description="Acceptance year")
    why_successful: str = Field(description="Analysis of why this was successful")


class TemplateVariable(BaseModel):
    """Variable that can be substituted in the template"""
    name: str = Field(description="Variable name (e.g., 'name', 'university')")
    placeholder: str = Field(description="Placeholder in template (e.g., '{{name}}')")
    description: str = Field(description="Description of what this variable represents")
    example: str = Field(description="Example value")
    required: bool = Field(default=True, description="Whether this variable is required")
    validation_pattern: Optional[str] = Field(None, description="Regex pattern for validation")


class SOPTemplateContent(BaseModel):
    """Full content of an SOP template"""
    template_id: str = Field(description="Unique template identifier")
    raw_content: str = Field(description="Full template content with placeholders")
    sections: Dict[str, str] = Field(description="Content broken down by section")
    variables: List[TemplateVariable] = Field(description="All variables used in template")
    alternative_intros: List[str] = Field(default_factory=list, description="Alternative introduction paragraphs")
    alternative_conclusions: List[str] = Field(default_factory=list, description="Alternative conclusion paragraphs")


class SOPTemplate(BaseModel):
    """Complete SOP template model"""
    id: str = Field(description="Unique template identifier")
    title: str = Field(description="Template title")
    description: str = Field(description="Brief description of template")
    category: TemplateCategory
    word_count_min: int = Field(ge=400, le=2000)
    word_count_max: int = Field(ge=500, le=2000)
    word_count_target: int = Field(ge=450, le=2000)
    structure: List[SectionStructure] = Field(description="Section-by-section structure")
    content: SOPTemplateContent
    tone: List[ToneIndicator] = Field(description="Recommended tone(s)")
    target_audience: str = Field(description="Who this template is for")
    success_examples: List[SuccessExample] = Field(default_factory=list)
    common_mistakes: List[str] = Field(default_factory=list)
    customization_guide: List[str] = Field(default_factory=list)
    field_specific_terminology: List[str] = Field(default_factory=list)
    faculty_mention_tips: List[str] = Field(default_factory=list)
    research_methodology_examples: List[str] = Field(default_factory=list)
    usage_count: int = Field(default=0, description="Number of times used")
    success_rate: Optional[float] = Field(None, ge=0, le=1, description="Success rate (0-1)")
    tags: List[str] = Field(default_factory=list, description="Searchable tags")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = Field(default=1, description="Template version")

    @validator("word_count_target")
    def validate_word_count_target(cls, v, values):
        """Ensure target is within min and max"""
        if "word_count_min" in values and "word_count_max" in values:
            if not (values["word_count_min"] <= v <= values["word_count_max"]):
                raise ValueError("Target word count must be between min and max")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "id": "phd_cs_research_focused",
                "title": "PhD Computer Science - Research Focused",
                "description": "For PhD CS applicants with strong research background",
                "category": {
                    "degree": "PhD",
                    "field": "Computer Science",
                    "purpose": "Research-focused"
                },
                "word_count_min": 900,
                "word_count_max": 1100,
                "word_count_target": 1000,
                "tone": ["Formal", "Confident", "Analytical"]
            }
        }


class TemplateSearchFilters(BaseModel):
    """Filters for searching templates"""
    degree: Optional[DegreeLevel] = None
    field: Optional[FieldCategory] = None
    purpose: Optional[SOPPurpose] = None
    word_count_min: Optional[int] = None
    word_count_max: Optional[int] = None
    tags: Optional[List[str]] = None


class TemplateSearchRequest(BaseModel):
    """Request model for searching templates"""
    filters: Optional[TemplateSearchFilters] = None
    query: Optional[str] = Field(None, description="Text search query")
    sort_by: Optional[str] = Field(None, description="Field to sort by (usage_count, success_rate)")
    limit: int = Field(default=10, ge=1, le=50)
    offset: int = Field(default=0, ge=0)


class TemplateSearchResponse(BaseModel):
    """Response model for template search"""
    templates: List[SOPTemplate]
    total: int
    limit: int
    offset: int


class PersonalizationData(BaseModel):
    """User data for personalizing a template"""
    name: str
    university: str
    program: str
    department: Optional[str] = None
    faculty_names: Optional[List[str]] = Field(default_factory=list)
    research_interests: Optional[List[str]] = Field(default_factory=list)
    background_summary: Optional[str] = None
    career_goals: Optional[str] = None
    relevant_experience: Optional[List[str]] = Field(default_factory=list)
    publications: Optional[List[str]] = Field(default_factory=list)
    custom_variables: Optional[Dict[str, str]] = Field(default_factory=dict)


class PersonalizeTemplateRequest(BaseModel):
    """Request to personalize a template"""
    template_id: str
    personalization_data: PersonalizationData
    sections_to_include: Optional[List[SectionType]] = None
    target_word_count: Optional[int] = None
    tone_preference: Optional[ToneIndicator] = None


class PersonalizeTemplateResponse(BaseModel):
    """Response with personalized SOP"""
    template_id: str
    personalized_content: str
    sections: Dict[str, str]
    word_count: int
    variables_used: Dict[str, str]
    suggestions: List[str] = Field(default_factory=list)


class CustomizeTemplateRequest(BaseModel):
    """Request for AI-powered template customization"""
    template_id: str
    personalization_data: PersonalizationData
    customization_instructions: Optional[str] = None
    enhance_sections: Optional[List[SectionType]] = None
    tone_adjustment: Optional[str] = Field(None, description="e.g., 'more confident', 'more humble'")
    focus_areas: Optional[List[str]] = Field(default_factory=list)


class CustomizeTemplateResponse(BaseModel):
    """Response with AI-customized SOP"""
    template_id: str
    original_content: str
    customized_content: str
    sections: Dict[str, str]
    word_count: int
    changes_made: List[str] = Field(description="List of changes made by AI")
    improvement_suggestions: List[str] = Field(description="Additional suggestions")


class TemplateRecommendationRequest(BaseModel):
    """Request for template recommendations"""
    user_profile: PersonalizationData
    degree: DegreeLevel
    field: FieldCategory
    purpose: Optional[SOPPurpose] = None
    preferences: Optional[Dict[str, Any]] = None


class TemplateRecommendation(BaseModel):
    """Single template recommendation"""
    template: SOPTemplate
    relevance_score: float = Field(ge=0, le=1)
    match_reasons: List[str]


class TemplateRecommendationResponse(BaseModel):
    """Response with recommended templates"""
    recommendations: List[TemplateRecommendation]
    total: int


class SectionMixRequest(BaseModel):
    """Request to mix sections from different templates"""
    section_selections: Dict[SectionType, str] = Field(
        description="Map of section type to template_id"
    )
    personalization_data: PersonalizationData
    transitions: bool = Field(default=True, description="Generate transitions between sections")


class SectionMixResponse(BaseModel):
    """Response with mixed-section SOP"""
    mixed_content: str
    sections: Dict[str, str]
    source_templates: Dict[SectionType, str]
    word_count: int


class ToneAdjustmentRequest(BaseModel):
    """Request to adjust tone of existing content"""
    content: str
    current_tone: Optional[ToneIndicator] = None
    target_tone: ToneIndicator
    section_type: Optional[SectionType] = None


class ToneAdjustmentResponse(BaseModel):
    """Response with tone-adjusted content"""
    original_content: str
    adjusted_content: str
    changes_description: str
    word_count_change: int


class SectionEnhancementRequest(BaseModel):
    """Request to enhance specific section"""
    content: str
    section_type: SectionType
    enhancement_type: str = Field(
        description="e.g., 'add_more_detail', 'make_more_specific', 'add_examples'"
    )
    context: Optional[Dict[str, Any]] = None


class SectionEnhancementResponse(BaseModel):
    """Response with enhanced section"""
    original_content: str
    enhanced_content: str
    improvements: List[str]
    word_count_change: int


class CreateTemplateRequest(BaseModel):
    """Request to create custom template (admin)"""
    title: str
    description: str
    category: TemplateCategory
    word_count_min: int
    word_count_max: int
    word_count_target: int
    structure: List[SectionStructure]
    content: SOPTemplateContent
    tone: List[ToneIndicator]
    target_audience: str
    tags: List[str] = Field(default_factory=list)


class UpdateTemplateRequest(BaseModel):
    """Request to update existing template"""
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[SOPTemplateContent] = None
    structure: Optional[List[SectionStructure]] = None
    success_rate: Optional[float] = None
    tags: Optional[List[str]] = None


class TemplateStatistics(BaseModel):
    """Statistics about template usage"""
    template_id: str
    title: str
    usage_count: int
    success_rate: Optional[float]
    average_rating: Optional[float]
    last_used: Optional[datetime]
    popular_customizations: List[str] = Field(default_factory=list)


class BulkTemplateStatistics(BaseModel):
    """Bulk statistics across all templates"""
    total_templates: int
    total_usage: int
    average_success_rate: float
    most_popular_templates: List[TemplateStatistics]
    templates_by_degree: Dict[str, int]
    templates_by_field: Dict[str, int]
    templates_by_purpose: Dict[str, int]
