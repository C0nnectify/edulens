"""
Pydantic models for admission prediction operations
"""

from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum


class AdmissionDecision(str, Enum):
    """Admission decision outcomes"""
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WAITLISTED = "waitlisted"
    DEFERRED = "deferred"
    WITHDRAWN = "withdrawn"


class SchoolCategory(str, Enum):
    """School categorization based on admission probability"""
    REACH = "reach"  # <25% predicted chance
    TARGET = "target"  # 25-75% predicted chance
    SAFETY = "safety"  # >75% predicted chance


class TestType(str, Enum):
    """Standardized test types"""
    GRE = "gre"
    GMAT = "gmat"
    TOEFL = "toefl"
    IELTS = "ielts"
    SAT = "sat"
    ACT = "act"


class DegreeLevel(str, Enum):
    """Degree level for applications"""
    BACHELORS = "bachelors"
    MASTERS = "masters"
    PHD = "phd"
    MBA = "mba"


class TestScore(BaseModel):
    """Standardized test score"""
    test_type: TestType = Field(..., description="Type of test")
    total_score: Optional[float] = Field(None, description="Total score")
    verbal_score: Optional[float] = Field(None, description="Verbal score")
    quantitative_score: Optional[float] = Field(None, description="Quantitative score")
    analytical_score: Optional[float] = Field(None, description="Analytical writing score")
    date_taken: Optional[datetime] = Field(None, description="Date test was taken")


class StudentProfile(BaseModel):
    """Student academic profile for admission prediction"""
    # Academic metrics
    gpa: float = Field(..., ge=0.0, le=4.0, description="GPA normalized to 4.0 scale")
    gpa_scale: float = Field(4.0, description="Original GPA scale (e.g., 4.0, 5.0, 10.0)")
    undergraduate_major: Optional[str] = Field(None, description="Undergraduate major")
    undergraduate_university: Optional[str] = Field(None, description="Undergraduate university name")
    undergraduate_university_ranking: Optional[int] = Field(None, description="QS/Times ranking of undergrad university")

    # Test scores
    test_scores: List[TestScore] = Field(default_factory=list, description="Standardized test scores")

    # Research and publications
    research_publications: int = Field(0, ge=0, description="Number of research publications")
    conference_papers: int = Field(0, ge=0, description="Number of conference papers")
    patents: int = Field(0, ge=0, description="Number of patents filed/granted")

    # Professional experience
    work_experience_months: int = Field(0, ge=0, description="Total work experience in months")
    relevant_work_experience_months: int = Field(0, ge=0, description="Relevant work experience in months")
    internships_count: int = Field(0, ge=0, description="Number of internships")

    # Awards and recognition
    academic_awards: int = Field(0, ge=0, description="Number of academic awards")
    professional_certifications: int = Field(0, ge=0, description="Number of professional certifications")

    # Extracurricular
    leadership_positions: int = Field(0, ge=0, description="Number of leadership positions held")
    volunteer_hours: int = Field(0, ge=0, description="Total volunteer hours")

    # Demographics (optional, for diversity consideration)
    nationality: Optional[str] = Field(None, description="Student nationality")
    gender: Optional[str] = Field(None, description="Student gender")

    @validator('gpa', pre=True)
    def normalize_gpa(cls, v, values):
        """Normalize GPA to 4.0 scale"""
        if 'gpa_scale' in values and values['gpa_scale'] != 4.0:
            # Normalize to 4.0 scale
            return (v / values['gpa_scale']) * 4.0
        return v


class ProgramInfo(BaseModel):
    """Target program information"""
    university_name: str = Field(..., description="University name")
    university_ranking: Optional[int] = Field(None, description="QS/Times world ranking")
    program_name: str = Field(..., description="Program/major name")
    degree_level: DegreeLevel = Field(..., description="Degree level")
    department: Optional[str] = Field(None, description="Department name")
    specialization: Optional[str] = Field(None, description="Specialization/concentration")

    # Program competitiveness metrics
    acceptance_rate: Optional[float] = Field(None, ge=0.0, le=1.0, description="Overall acceptance rate (0-1)")
    average_gpa: Optional[float] = Field(None, description="Average admitted student GPA")
    gre_verbal_avg: Optional[float] = Field(None, description="Average GRE verbal score")
    gre_quant_avg: Optional[float] = Field(None, description="Average GRE quant score")
    gmat_avg: Optional[float] = Field(None, description="Average GMAT score")

    # Program characteristics
    is_stem: bool = Field(False, description="Is STEM program")
    has_funding: bool = Field(False, description="Offers funding/assistantship")
    application_deadline: Optional[datetime] = Field(None, description="Application deadline")


class AdmissionDataPoint(BaseModel):
    """Historical admission data point for training"""
    data_point_id: str = Field(..., description="Unique identifier for data point")
    user_id: Optional[str] = Field(None, description="User who contributed data (anonymous)")

    # Student profile at time of application
    profile: StudentProfile = Field(..., description="Student profile")

    # Program information
    program: ProgramInfo = Field(..., description="Target program")

    # Outcome
    decision: AdmissionDecision = Field(..., description="Admission decision")
    decision_date: Optional[datetime] = Field(None, description="Date of decision")

    # Application details
    application_year: int = Field(..., description="Year of application")
    application_cycle: Literal["fall", "spring", "summer"] = Field("fall", description="Application cycle")

    # Financial aid received (if accepted)
    scholarship_amount: Optional[float] = Field(None, description="Scholarship amount in USD")
    assistantship_offered: bool = Field(False, description="Was assistantship offered")

    # Metadata
    verified: bool = Field(False, description="Is this data point verified")
    source: str = Field("user_submitted", description="Data source (user_submitted, scraped, partner)")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FeatureVector(BaseModel):
    """Engineered feature vector for ML model"""
    # Normalized features
    gpa_normalized: float = Field(..., description="GPA on 0-1 scale")
    gre_verbal_percentile: Optional[float] = Field(None, description="GRE verbal percentile")
    gre_quant_percentile: Optional[float] = Field(None, description="GRE quant percentile")
    gmat_percentile: Optional[float] = Field(None, description="GMAT percentile")
    english_proficiency_score: Optional[float] = Field(None, description="Normalized English score")

    # Composite scores
    research_score: float = Field(0.0, description="Composite research strength score")
    professional_score: float = Field(0.0, description="Composite professional experience score")
    extracurricular_score: float = Field(0.0, description="Composite extracurricular score")

    # Institutional factors
    undergrad_prestige_score: float = Field(0.0, description="Undergraduate institution prestige (0-1)")
    program_competitiveness_score: float = Field(0.0, description="Target program competitiveness (0-1)")

    # Relative positioning
    gpa_vs_avg: float = Field(0.0, description="GPA difference from program average")
    test_score_vs_avg: float = Field(0.0, description="Test score difference from program average")


class AdmissionPrediction(BaseModel):
    """Admission prediction result"""
    probability: float = Field(..., ge=0.0, le=1.0, description="Predicted admission probability (0-1)")
    probability_percentage: float = Field(..., ge=0.0, le=100.0, description="Probability as percentage")
    confidence_interval_lower: float = Field(..., ge=0.0, le=1.0, description="Lower bound of confidence interval")
    confidence_interval_upper: float = Field(..., ge=0.0, le=1.0, description="Upper bound of confidence interval")

    category: SchoolCategory = Field(..., description="School category (reach/target/safety)")

    # Key factors influencing prediction
    strengths: List[str] = Field(default_factory=list, description="Profile strengths")
    weaknesses: List[str] = Field(default_factory=list, description="Profile weaknesses")
    key_factors: Dict[str, float] = Field(default_factory=dict, description="Feature importance scores")

    # Recommendation
    recommendation: str = Field(..., description="Textual recommendation")
    suggested_improvements: List[str] = Field(default_factory=list, description="Actionable improvement suggestions")


class GapAnalysis(BaseModel):
    """Gap analysis comparing student to admitted students"""
    gpa_gap: float = Field(..., description="GPA gap from average (negative means below)")
    test_score_gap: Optional[float] = Field(None, description="Test score gap from average")
    research_gap: float = Field(..., description="Research experience gap")
    work_experience_gap: float = Field(..., description="Work experience gap")

    # Percentile rankings
    gpa_percentile: float = Field(..., ge=0.0, le=100.0, description="GPA percentile among admitted students")
    test_percentile: Optional[float] = Field(None, ge=0.0, le=100.0, description="Test score percentile")

    # Overall assessment
    overall_competitiveness: float = Field(..., ge=0.0, le=1.0, description="Overall competitiveness score (0-1)")
    gaps_to_address: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Prioritized list of gaps to address"
    )


class ProfileEvaluation(BaseModel):
    """Complete profile evaluation with prediction and gap analysis"""
    evaluation_id: str = Field(..., description="Unique evaluation identifier")
    user_id: str = Field(..., description="User identifier")

    # Input data
    student_profile: StudentProfile = Field(..., description="Student profile")
    target_program: ProgramInfo = Field(..., description="Target program")

    # Results
    prediction: AdmissionPrediction = Field(..., description="Admission prediction")
    gap_analysis: GapAnalysis = Field(..., description="Gap analysis")

    # Similar profiles
    similar_admits: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Similar profiles that were admitted"
    )
    similar_rejects: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Similar profiles that were rejected"
    )

    # Metadata
    model_version: str = Field(..., description="ML model version used")
    evaluation_date: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "evaluation_id": "eval_123456",
                "user_id": "user_789",
                "student_profile": {
                    "gpa": 3.8,
                    "gpa_scale": 4.0,
                    "test_scores": [
                        {"test_type": "gre", "total_score": 325, "verbal_score": 160, "quantitative_score": 165}
                    ],
                    "research_publications": 2
                },
                "target_program": {
                    "university_name": "Stanford University",
                    "program_name": "Computer Science",
                    "degree_level": "masters"
                }
            }
        }


class MLModelMetadata(BaseModel):
    """ML model version and metadata"""
    model_id: str = Field(..., description="Unique model identifier")
    version: str = Field(..., description="Model version (e.g., 1.0.0)")
    model_type: str = Field(..., description="Type of model (random_forest, logistic_regression, etc.)")

    # Performance metrics
    accuracy: Optional[float] = Field(None, description="Model accuracy")
    precision: Optional[float] = Field(None, description="Model precision")
    recall: Optional[float] = Field(None, description="Model recall")
    f1_score: Optional[float] = Field(None, description="Model F1 score")
    auc_roc: Optional[float] = Field(None, description="AUC-ROC score")

    # Training information
    training_samples: int = Field(..., description="Number of training samples")
    training_date: datetime = Field(default_factory=datetime.utcnow)
    features_used: List[str] = Field(default_factory=list, description="Features used in model")
    hyperparameters: Dict[str, Any] = Field(default_factory=dict, description="Model hyperparameters")

    # Status
    is_active: bool = Field(True, description="Is this the active production model")
    is_deprecated: bool = Field(False, description="Is this model deprecated")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PredictionRequest(BaseModel):
    """Request model for admission prediction"""
    student_profile: StudentProfile = Field(..., description="Student profile")
    target_program: ProgramInfo = Field(..., description="Target program")
    include_gap_analysis: bool = Field(True, description="Include gap analysis in response")
    include_similar_profiles: bool = Field(True, description="Include similar profiles in response")


class BatchPredictionRequest(BaseModel):
    """Request model for batch admission predictions"""
    student_profile: StudentProfile = Field(..., description="Student profile")
    target_programs: List[ProgramInfo] = Field(..., description="List of target programs")
    categorize_schools: bool = Field(True, description="Categorize schools into reach/target/safety")


class BatchPredictionResponse(BaseModel):
    """Response model for batch predictions"""
    evaluations: List[ProfileEvaluation] = Field(..., description="List of evaluations")

    # Categorized schools
    reach_schools: List[str] = Field(default_factory=list, description="Reach schools (< 25%)")
    target_schools: List[str] = Field(default_factory=list, description="Target schools (25-75%)")
    safety_schools: List[str] = Field(default_factory=list, description="Safety schools (> 75%)")

    # Summary statistics
    average_probability: float = Field(..., description="Average admission probability across all programs")
    highest_probability: float = Field(..., description="Highest admission probability")
    lowest_probability: float = Field(..., description="Lowest admission probability")


class AdmissionDataContribution(BaseModel):
    """User contribution of admission data"""
    profile: StudentProfile = Field(..., description="Student profile")
    program: ProgramInfo = Field(..., description="Program applied to")
    decision: AdmissionDecision = Field(..., description="Admission decision")
    application_year: int = Field(..., ge=2000, le=2030, description="Application year")
    application_cycle: Literal["fall", "spring", "summer"] = Field("fall", description="Application cycle")

    # Optional financial info
    scholarship_amount: Optional[float] = Field(None, ge=0, description="Scholarship amount in USD")
    assistantship_offered: bool = Field(False, description="Was assistantship offered")

    # Consent
    allow_anonymous_use: bool = Field(True, description="Allow anonymous use for improving predictions")
