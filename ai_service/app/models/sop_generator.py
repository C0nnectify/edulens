"""
Pydantic models for SOP Generator service.

This module defines the data models for the interview-based SOP generation system,
including interview sessions, questions, answers, and generated drafts.
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class QuestionCategory(str, Enum):
    """Categories for interview questions."""
    BACKGROUND = "background"
    ACADEMIC = "academic"
    RESEARCH = "research"
    CAREER_GOALS = "career_goals"
    PROGRAM_FIT = "program_fit"
    PERSONAL_STATEMENT = "personal_statement"


class QuestionType(str, Enum):
    """Types of questions."""
    TEXT = "text"
    MULTILINE = "multiline"
    CHOICE = "choice"
    NUMERIC = "numeric"


class SessionStatus(str, Enum):
    """Status of interview session."""
    STARTED = "started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DRAFT_GENERATED = "draft_generated"


class SOPTone(str, Enum):
    """Tones for SOP generation."""
    CONFIDENT = "confident"
    HUMBLE = "humble"
    ENTHUSIASTIC = "enthusiastic"
    BALANCED = "balanced"


class InterviewQuestion(BaseModel):
    """Model for an interview question."""
    question_id: str = Field(..., description="Unique identifier for the question")
    category: QuestionCategory = Field(..., description="Question category")
    question_text: str = Field(..., description="The actual question text")
    question_type: QuestionType = Field(default=QuestionType.MULTILINE, description="Type of question")
    required: bool = Field(default=True, description="Whether answer is required")
    min_length: int = Field(default=50, description="Minimum answer length in characters")
    max_length: int = Field(default=2000, description="Maximum answer length in characters")
    order: int = Field(..., description="Order in the interview flow")
    depends_on: Optional[str] = Field(None, description="Question ID this depends on")
    condition: Optional[str] = Field(None, description="Condition for showing this question")
    examples: List[str] = Field(default_factory=list, description="Example answers")
    guidance: Optional[str] = Field(None, description="Guidance text for the question")

    class Config:
        use_enum_values = True


class InterviewAnswer(BaseModel):
    """Model for an interview answer."""
    question_id: str = Field(..., description="Question this answers")
    answer_text: str = Field(..., description="User's answer")
    answered_at: datetime = Field(default_factory=datetime.utcnow, description="When answered")
    edited_at: Optional[datetime] = Field(None, description="When last edited")
    word_count: int = Field(default=0, description="Word count of answer")
    char_count: int = Field(default=0, description="Character count of answer")
    validation_passed: bool = Field(default=False, description="Whether answer passes validation")
    feedback: Optional[str] = Field(None, description="Feedback on the answer")

    @field_validator('word_count', mode='before')
    def calculate_word_count(cls, v, info):
        """Calculate word count from answer text."""
        if info.data.get('answer_text'):
            return len(info.data['answer_text'].split())
        return 0

    @field_validator('char_count', mode='before')
    def calculate_char_count(cls, v, info):
        """Calculate character count from answer text."""
        if info.data.get('answer_text'):
            return len(info.data['answer_text'])
        return 0

    class Config:
        use_enum_values = True


class SOPDraft(BaseModel):
    """Model for a generated SOP draft."""
    draft_id: str = Field(..., description="Unique identifier for the draft")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="When generated")
    tone: SOPTone = Field(..., description="Tone used for generation")
    content: str = Field(..., description="The generated SOP content")
    word_count: int = Field(default=0, description="Word count of the SOP")
    structure: Dict[str, str] = Field(
        default_factory=dict,
        description="Structured sections (intro, body, conclusion)"
    )
    metadata: Dict[str, any] = Field(default_factory=dict, description="Additional metadata")

    @field_validator('word_count', mode='before')
    def calculate_word_count(cls, v, info):
        """Calculate word count from content."""
        if info.data.get('content'):
            return len(info.data['content'].split())
        return 0

    class Config:
        use_enum_values = True


class InterviewSession(BaseModel):
    """Model for an interview session."""
    session_id: str = Field(..., description="Unique session identifier")
    user_id: str = Field(..., description="User who owns this session")
    status: SessionStatus = Field(default=SessionStatus.STARTED, description="Session status")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    # Program details
    program_name: Optional[str] = Field(None, description="Target program name")
    university_name: Optional[str] = Field(None, description="Target university")
    degree_level: Optional[str] = Field(None, description="Degree level (MS, PhD, etc.)")
    field_of_study: Optional[str] = Field(None, description="Field of study")

    # Interview data
    current_question_index: int = Field(default=0, description="Current question index")
    questions: List[InterviewQuestion] = Field(default_factory=list, description="All questions")
    answers: Dict[str, InterviewAnswer] = Field(default_factory=dict, description="User answers")

    # Progress tracking
    total_questions: int = Field(default=0, description="Total number of questions")
    answered_questions: int = Field(default=0, description="Number of answered questions")
    progress_percentage: int = Field(default=0, description="Completion percentage (0-100)")

    # Generated drafts
    drafts: List[SOPDraft] = Field(default_factory=list, description="Generated SOP drafts")

    # Additional metadata
    metadata: Dict[str, any] = Field(default_factory=dict, description="Additional metadata")

    @field_validator('progress_percentage', mode='before')
    def calculate_progress(cls, v, info):
        """Calculate progress percentage as integer 0-100."""
        total = info.data.get('total_questions', 0)
        answered = info.data.get('answered_questions', 0)
        if total > 0:
            return int(round((answered / total) * 100))
        return 0

    class Config:
        use_enum_values = True


class SessionCreateRequest(BaseModel):
    """Request model for creating a new interview session."""
    program_name: str = Field(..., description="Target program name")
    university_name: str = Field(..., description="Target university")
    degree_level: str = Field(..., description="Degree level (MS, PhD, etc.)")
    field_of_study: str = Field(..., description="Field of study")
    additional_info: Optional[Dict[str, any]] = Field(None, description="Additional information")


class SessionResponse(BaseModel):
    """Response model for session operations."""
    session_id: str
    status: SessionStatus
    progress_percentage: int
    current_question: Optional[InterviewQuestion] = None
    total_questions: int
    answered_questions: int
    message: str = "Session retrieved successfully"

    class Config:
        use_enum_values = True


class AnswerSubmitRequest(BaseModel):
    """Request model for submitting an answer."""
    question_id: str = Field(..., description="Question ID being answered")
    answer_text: str = Field(..., min_length=10, description="User's answer")

    @field_validator('answer_text')
    def validate_answer(cls, v):
        """Validate answer is not empty or too short."""
        if not v or len(v.strip()) < 10:
            raise ValueError("Answer must be at least 10 characters long")
        return v.strip()


class AnswerEditRequest(BaseModel):
    """Request model for editing an existing answer."""
    answer_text: str = Field(..., min_length=10, description="Updated answer text")

    @field_validator('answer_text')
    def validate_answer(cls, v):
        """Validate answer is not empty or too short."""
        if not v or len(v.strip()) < 10:
            raise ValueError("Answer must be at least 10 characters long")
        return v.strip()


class GenerateSOPRequest(BaseModel):
    """Request model for generating SOP."""
    tone: SOPTone = Field(default=SOPTone.BALANCED, description="Tone for generation")
    additional_instructions: Optional[str] = Field(
        None,
        description="Additional instructions for generation"
    )
    word_count_target: int = Field(
        default=800,
        ge=500,
        le=1500,
        description="Target word count for SOP"
    )

    class Config:
        use_enum_values = True


class RegenerateSOPRequest(BaseModel):
    """Request model for regenerating SOP with different parameters."""
    tone: SOPTone = Field(..., description="New tone for generation")
    additional_instructions: Optional[str] = Field(
        None,
        description="Additional instructions"
    )
    word_count_target: int = Field(
        default=800,
        ge=500,
        le=1500,
        description="Target word count"
    )
    draft_id_to_replace: Optional[str] = Field(
        None,
        description="Draft ID to replace (optional)"
    )

    class Config:
        use_enum_values = True


class SOPDraftResponse(BaseModel):
    """Response model for SOP draft operations."""
    draft_id: str
    generated_at: datetime
    tone: SOPTone
    content: str
    word_count: int
    structure: Dict[str, str]
    message: str = "Draft generated successfully"

    class Config:
        use_enum_values = True


class ProgressResponse(BaseModel):
    """Response model for progress tracking."""
    session_id: str
    progress_percentage: int
    answered_questions: int
    total_questions: int
    remaining_questions: int
    status: SessionStatus
    can_generate: bool = Field(
        default=False,
        description="Whether user can generate SOP"
    )

    class Config:
        use_enum_values = True


class ValidationResponse(BaseModel):
    """Response model for answer validation."""
    is_valid: bool
    feedback: Optional[str] = None
    suggestions: List[str] = Field(default_factory=list)
    word_count: int
    char_count: int
