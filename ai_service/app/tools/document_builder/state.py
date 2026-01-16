"""
Document Builder State Models

This module defines the state models used by the Document Builder LangGraph.
These models track conversation state, collected information, and generation progress.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage
from typing import Annotated


# ==============================================================================
# ENUMS
# ==============================================================================

class DocumentType(str, Enum):
    """Types of documents the builder can create."""
    SOP = "sop"
    LOR = "lor"
    CV = "cv"
    RESUME = "resume"


class ConversationPhase(str, Enum):
    """Phases in the document creation conversation."""
    INITIAL = "initial"  # Just started, detecting document type
    COLLECTING = "collecting"  # Gathering information
    VALIDATING = "validating"  # Checking if we have enough info
    GENERATING = "generating"  # Creating the document
    REFINING = "refining"  # User requested changes
    COMPLETED = "completed"  # Document finalized


class ActionType(str, Enum):
    """Types of actions the system can take."""
    ASK_QUESTION = "ask_question"
    COLLECT_INFO = "collect_info"
    CLARIFY = "clarify"
    GENERATE_DRAFT = "generate_draft"
    REFINE_DRAFT = "refine_draft"
    PRESENT_DRAFT = "present_draft"
    COMPLETE = "complete"
    ERROR_RECOVERY = "error_recovery"


class SOPTone(str, Enum):
    """Tones for SOP generation."""
    CONFIDENT = "confident"
    HUMBLE = "humble"
    ENTHUSIASTIC = "enthusiastic"
    BALANCED = "balanced"


class LORStrength(str, Enum):
    """Recommendation strength levels."""
    STRONG = "strong"
    MODERATE = "moderate"
    STANDARD = "standard"


# ==============================================================================
# FIELD REQUIREMENTS
# ==============================================================================

SOP_REQUIRED_FIELDS = {
    "critical": [
        "target_program",
        "target_university",
        "educational_background",
        "career_goals",
    ],
    "important": [
        "degree_level",
        "relevant_experience",
        "why_this_program",
    ],
    "optional": [
        "research_experience",
        "publications",
        "awards",
        "personal_story",
        "gpa",
        "test_scores",
    ]
}

LOR_REQUIRED_FIELDS = {
    "critical": [
        "recommender_name",
        "student_name",
        "relationship",
        "target_program",
    ],
    "important": [
        "recommender_title",
        "skills_observed",
        "achievements",
        "association_duration",
    ],
    "optional": [
        "character_traits",
        "peer_comparison",
        "specific_examples",
        "target_university",
        "recommender_organization",
    ]
}

RESUME_REQUIRED_FIELDS = {
    "critical": [
        "full_name",
        "target_role",
    ],
    "important": [
        "contact_info",
        "professional_summary",
        "work_experience",
        "education",
    ],
    "optional": [
        "skills",
        "certifications",
        "projects",
        "languages",
        "awards",
    ]
}


# ==============================================================================
# COLLECTED DATA MODELS
# ==============================================================================

class SOPCollectedData(BaseModel):
    """Data collected for SOP generation."""
    # Target Program Info
    target_program: Optional[str] = None
    target_university: Optional[str] = None
    target_country: Optional[str] = None
    degree_level: Optional[str] = None  # MS, PhD, MBA, etc.
    
    # Background
    educational_background: Optional[str] = None
    gpa: Optional[str] = None
    major_courses: Optional[str] = None
    academic_achievements: Optional[str] = None
    
    # Experience
    relevant_experience: Optional[str] = None
    research_experience: Optional[str] = None
    projects: Optional[str] = None
    internships: Optional[str] = None
    publications: Optional[str] = None
    
    # Goals & Motivation
    career_goals: Optional[str] = None
    why_this_program: Optional[str] = None
    why_this_university: Optional[str] = None
    personal_story: Optional[str] = None
    
    # Additional
    awards: Optional[str] = None
    test_scores: Optional[str] = None
    additional_info: Optional[str] = None
    
    # Preferences
    tone: SOPTone = SOPTone.BALANCED
    word_limit: int = 1000
    special_instructions: Optional[str] = None

    def get_filled_fields(self) -> List[str]:
        """Get list of fields that have been filled."""
        return [k for k, v in self.model_dump().items() if v is not None and v != ""]

    def get_missing_critical_fields(self) -> List[str]:
        """Get list of critical fields that are still missing."""
        filled = self.get_filled_fields()
        return [f for f in SOP_REQUIRED_FIELDS["critical"] if f not in filled]

    def get_missing_important_fields(self) -> List[str]:
        """Get list of important fields that are still missing."""
        filled = self.get_filled_fields()
        return [f for f in SOP_REQUIRED_FIELDS["important"] if f not in filled]

    def is_ready_for_generation(self) -> bool:
        """Check if we have enough info to generate."""
        return len(self.get_missing_critical_fields()) == 0

    def get_completion_percentage(self) -> int:
        """Calculate how complete the data collection is (returns integer 0-100)."""
        all_required = SOP_REQUIRED_FIELDS["critical"] + SOP_REQUIRED_FIELDS["important"]
        filled = [f for f in all_required if f in self.get_filled_fields()]
        return int(round((len(filled) / len(all_required)) * 100))


class LORCollectedData(BaseModel):
    """Data collected for LOR generation."""
    # Recommender Info
    recommender_name: Optional[str] = None
    recommender_title: Optional[str] = None
    recommender_organization: Optional[str] = None
    recommender_email: Optional[str] = None
    
    # Relationship
    relationship: Optional[str] = None  # e.g., "professor", "supervisor"
    association_duration: Optional[str] = None
    context: Optional[str] = None  # e.g., "research assistant in ML lab"
    
    # Student Info
    student_name: Optional[str] = None
    student_role: Optional[str] = None
    
    # Observations
    skills_observed: Optional[List[str]] = None
    achievements: Optional[str] = None
    character_traits: Optional[str] = None
    specific_examples: Optional[str] = None
    peer_comparison: Optional[str] = None
    areas_of_growth: Optional[str] = None
    
    # Target
    target_program: Optional[str] = None
    target_university: Optional[str] = None
    target_country: Optional[str] = None
    
    # Preferences
    tone: str = "professional"
    strength: LORStrength = LORStrength.STRONG
    word_limit: int = 800
    perspective: str = "recommender"  # recommender or student_draft

    def get_filled_fields(self) -> List[str]:
        """Get list of fields that have been filled."""
        return [k for k, v in self.model_dump().items() if v is not None and v != "" and v != []]

    def get_missing_critical_fields(self) -> List[str]:
        """Get list of critical fields that are still missing."""
        filled = self.get_filled_fields()
        return [f for f in LOR_REQUIRED_FIELDS["critical"] if f not in filled]

    def get_missing_important_fields(self) -> List[str]:
        """Get list of important fields that are still missing."""
        filled = self.get_filled_fields()
        return [f for f in LOR_REQUIRED_FIELDS["important"] if f not in filled]

    def is_ready_for_generation(self) -> bool:
        """Check if we have enough info to generate."""
        return len(self.get_missing_critical_fields()) == 0

    def get_completion_percentage(self) -> int:
        """Calculate how complete the data collection is (returns integer 0-100)."""
        all_required = LOR_REQUIRED_FIELDS["critical"] + LOR_REQUIRED_FIELDS["important"]
        filled = [f for f in all_required if f in self.get_filled_fields()]
        return int(round((len(filled) / len(all_required)) * 100))


class ResumeCollectedData(BaseModel):
    """Data collected for Resume generation."""
    # Basic Info
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    contact_info: Optional[str] = None  # email, phone, linkedin
    location: Optional[str] = None
    
    # Summary
    professional_summary: Optional[str] = None
    include_summary: bool = True
    
    # Work Experience
    work_experience: Optional[str] = None
    years_of_experience: Optional[int] = None
    
    # Education
    education: Optional[str] = None
    
    # Skills
    skills: Optional[str] = None
    technical_skills: Optional[str] = None
    soft_skills: Optional[str] = None
    
    # Additional Sections
    certifications: Optional[str] = None
    projects: Optional[str] = None
    languages: Optional[str] = None
    awards: Optional[str] = None
    publications: Optional[str] = None
    
    # Preferences
    format_preference: str = "professional"  # professional, modern, creative
    emphasize_section: Optional[str] = None  # which section to highlight
    special_instructions: Optional[str] = None

    def get_filled_fields(self) -> List[str]:
        """Get list of fields that have been filled."""
        return [k for k, v in self.model_dump().items() if v is not None and v != "" and v != []]

    def get_missing_critical_fields(self) -> List[str]:
        """Get list of critical fields that are still missing."""
        filled = self.get_filled_fields()
        return [f for f in RESUME_REQUIRED_FIELDS["critical"] if f not in filled]

    def get_missing_important_fields(self) -> List[str]:
        """Get list of important fields that are still missing."""
        filled = self.get_filled_fields()
        return [f for f in RESUME_REQUIRED_FIELDS["important"] if f not in filled]

    def is_ready_for_generation(self) -> bool:
        """Check if we have enough info to generate."""
        return len(self.get_missing_critical_fields()) == 0

    def get_completion_percentage(self) -> int:
        """Calculate how complete the data collection is (returns integer 0-100)."""
        all_required = RESUME_REQUIRED_FIELDS["critical"] + RESUME_REQUIRED_FIELDS["important"]
        filled = [f for f in all_required if f in self.get_filled_fields()]
        return int(round((len(filled) / len(all_required)) * 100))


# ==============================================================================
# GENERATED DOCUMENT MODELS
# ==============================================================================

class DocumentSection(BaseModel):
    """A section of a generated document."""
    heading: str
    content_markdown: str
    word_count: int = 0

    def __init__(self, **data):
        super().__init__(**data)
        if self.content_markdown:
            self.word_count = len(self.content_markdown.split())


class GeneratedDocument(BaseModel):
    """A generated document (SOP or LOR)."""
    document_id: str
    document_type: DocumentType
    title: str
    sections: List[DocumentSection]
    plain_text: str
    word_count: int
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Metadata
    target_program: Optional[str] = None
    target_university: Optional[str] = None
    version: int = 1
    
    # AI insights
    key_strengths_highlighted: List[str] = Field(default_factory=list)
    suggestions_for_improvement: List[str] = Field(default_factory=list)
    
    # Editor format (for rich text editor)
    editor_json: Optional[Dict[str, Any]] = None
    html: Optional[str] = None
    
    # Structured resume data for frontend editor (matches frontend ResumeDraftV1 format)
    resume: Optional[Dict[str, Any]] = None


# ==============================================================================
# LANGGRAPH STATE
# ==============================================================================

class DocumentBuilderState(BaseModel):
    """
    Main state for Document Builder LangGraph.
    
    This state is passed between all nodes in the graph and maintains
    the full context of the document creation conversation.
    """
    # Session identification
    session_id: str
    user_id: str
    thread_id: str = ""
    
    # Conversation
    messages: Annotated[List[BaseMessage], add_messages] = Field(default_factory=list)
    
    # Document context
    document_type: Optional[DocumentType] = None
    phase: ConversationPhase = ConversationPhase.INITIAL
    
    # Collected data (union of SOP, LOR, and Resume data)
    sop_data: Optional[SOPCollectedData] = None
    lor_data: Optional[LORCollectedData] = None
    resume_data: Optional[ResumeCollectedData] = None

    # Uploaded files attached to this session (CV, transcripts, etc.)
    attachments: List[str] = Field(default_factory=list)
    
    # Current conversation turn
    last_user_message: str = ""
    last_ai_response: str = ""
    current_topic: Optional[str] = None  # What we're currently asking about
    
    # Action tracking
    next_action: ActionType = ActionType.ASK_QUESTION
    questions_asked: List[str] = Field(default_factory=list)
    
    # Generated content
    draft: Optional[GeneratedDocument] = None
    draft_history: List[GeneratedDocument] = Field(default_factory=list)
    
    # Progress tracking
    completion_percentage: int = 0
    # Error handling
    errors: List[str] = Field(default_factory=list)
    retry_count: int = 0
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        arbitrary_types_allowed = True

    def get_collected_data(self) -> Union[SOPCollectedData, LORCollectedData, ResumeCollectedData, None]:
        """Get the appropriate collected data based on document type."""
        if self.document_type == DocumentType.SOP:
            return self.sop_data
        elif self.document_type == DocumentType.LOR:
            return self.lor_data
        elif self.document_type == DocumentType.RESUME or self.document_type == DocumentType.CV:
            return self.resume_data
        return None

    def update_collected_data(self, field: str, value: Any):
        """Update a field in the collected data."""
        if self.document_type == DocumentType.SOP and self.sop_data:
            if hasattr(self.sop_data, field):
                setattr(self.sop_data, field, value)
        elif self.document_type == DocumentType.LOR and self.lor_data:
            if hasattr(self.lor_data, field):
                setattr(self.lor_data, field, value)
        elif (self.document_type == DocumentType.RESUME or self.document_type == DocumentType.CV) and self.resume_data:
            if hasattr(self.resume_data, field):
                setattr(self.resume_data, field, value)
        self.updated_at = datetime.utcnow()

    def is_ready_for_generation(self) -> bool:
        """Check if ready to generate document."""
        data = self.get_collected_data()
        if data:
            return data.is_ready_for_generation()
        return False

    def get_completion_percentage(self) -> int:
        """Get overall completion percentage (integer 0-100)."""
        data = self.get_collected_data()
        if data:
            return data.get_completion_percentage()
        return 0


# ==============================================================================
# API REQUEST/RESPONSE MODELS
# ==============================================================================

class DocumentBuilderChatRequest(BaseModel):
    """Request model for document builder chat endpoint."""
    session_id: Optional[str] = None
    message: str
    document_type: Optional[str] = None  # sop, lor, cv, resume
    attachments: List[str] = Field(default_factory=list)  # File IDs


class DocumentProgress(BaseModel):
    """Progress information for document creation."""
    collected_fields: List[str]
    missing_fields: List[str]
    percentage: int  # Integer 0-100
    ready_for_generation: bool


class DocumentBuilderChatResponse(BaseModel):
    """Response model for document builder chat endpoint."""
    session_id: str
    response: str
    action: ActionType
    document_type: Optional[DocumentType] = None
    document_draft: Optional[Dict[str, Any]] = None
    progress: Optional[DocumentProgress] = None
    questions: Optional[List[str]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def create_initial_state(
    user_id: str,
    session_id: str,
    document_type: Optional[str] = None,
    initial_message: str = ""
) -> DocumentBuilderState:
    """Create initial state for a new document builder session."""
    from langchain_core.messages import HumanMessage
    
    doc_type = None
    if document_type:
        doc_type = DocumentType(document_type.lower())
    
    state = DocumentBuilderState(
        session_id=session_id,
        user_id=user_id,
        document_type=doc_type,
        last_user_message=initial_message,
        messages=[HumanMessage(content=initial_message)] if initial_message else [],
    )
    
    # Initialize appropriate data collector
    if doc_type == DocumentType.SOP:
        state.sop_data = SOPCollectedData()
    elif doc_type == DocumentType.LOR:
        state.lor_data = LORCollectedData()
    elif doc_type == DocumentType.RESUME or doc_type == DocumentType.CV:
        state.resume_data = ResumeCollectedData()
    
    return state


def get_next_question_topic(state: DocumentBuilderState) -> Optional[str]:
    """Determine what to ask about next based on missing fields."""
    data = state.get_collected_data()
    if not data:
        return None
    
    # If ready for generation, don't ask more questions - let the flow proceed
    if data.is_ready_for_generation():
        return None
    
    # Priority: critical fields first, then important
    missing_critical = data.get_missing_critical_fields()
    if missing_critical:
        # Skip fields we've already asked about OR that are already filled
        filled = data.get_filled_fields()
        for field in missing_critical:
            if field not in state.questions_asked and field not in filled:
                return field
    
    # Only ask about important fields if critical are done but NOT ready for generation
    # This avoids endless loop when user has filled some important fields voluntarily
    missing_important = data.get_missing_important_fields()
    if missing_important:
        filled = data.get_filled_fields()
        for field in missing_important:
            if field not in state.questions_asked and field not in filled:
                return field
    
    return None
