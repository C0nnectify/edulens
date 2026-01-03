"""
SmartProfile - Pydantic Models for AI Service

This module defines the comprehensive user profile schema that serves as
the single source of truth for all user data. These models are used for:
- MongoDB document validation
- API request/response validation
- Chat extraction and profile updates
- Roadmap synchronization
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Any, Union
from pydantic import BaseModel, Field
from bson import ObjectId


# ============================================
# ENUMS
# ============================================

class ModifiedBy(str, Enum):
    USER = "user"
    CHAT = "chat"
    IMPORT = "import"
    SYSTEM = "system"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non-binary"
    PREFER_NOT_TO_SAY = "prefer-not-to-say"


class DegreeType(str, Enum):
    BACHELORS = "bachelors"
    MASTERS = "masters"
    PHD = "phd"
    ASSOCIATE = "associate"
    DIPLOMA = "diploma"
    CERTIFICATE = "certificate"
    OTHER = "other"


class TestStatus(str, Enum):
    NOT_PLANNED = "not-planned"
    PLANNED = "planned"
    COMPLETED = "completed"


class EmploymentType(str, Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    INTERNSHIP = "internship"
    CONTRACT = "contract"
    FREELANCE = "freelance"


class ResearchRole(str, Enum):
    PRINCIPAL_INVESTIGATOR = "principal-investigator"
    CO_INVESTIGATOR = "co-investigator"
    RESEARCH_ASSISTANT = "research-assistant"
    LAB_MEMBER = "lab-member"
    OTHER = "other"


class PublicationType(str, Enum):
    JOURNAL = "journal"
    CONFERENCE = "conference"
    BOOK_CHAPTER = "book-chapter"
    THESIS = "thesis"
    PREPRINT = "preprint"
    OTHER = "other"


class PublicationStatus(str, Enum):
    PUBLISHED = "published"
    ACCEPTED = "accepted"
    UNDER_REVIEW = "under-review"
    IN_PREPARATION = "in-preparation"


class AwardType(str, Enum):
    ACADEMIC = "academic"
    RESEARCH = "research"
    PROFESSIONAL = "professional"
    COMMUNITY = "community"
    COMPETITION = "competition"
    SCHOLARSHIP = "scholarship"
    FELLOWSHIP = "fellowship"
    OTHER = "other"


class SkillCategory(str, Enum):
    TECHNICAL = "technical"
    LANGUAGE = "language"
    SOFT = "soft"
    DOMAIN = "domain"
    TOOL = "tool"


class SkillProficiency(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class LanguageProficiency(str, Enum):
    NATIVE = "native"
    FLUENT = "fluent"
    ADVANCED = "advanced"
    INTERMEDIATE = "intermediate"
    BASIC = "basic"


class ActivityType(str, Enum):
    LEADERSHIP = "leadership"
    VOLUNTEER = "volunteer"
    CLUB = "club"
    SPORTS = "sports"
    ARTS = "arts"
    COMMUNITY = "community"
    PROFESSIONAL = "professional"
    OTHER = "other"


class LORRelationship(str, Enum):
    PROFESSOR = "professor"
    RESEARCH_ADVISOR = "research-advisor"
    EMPLOYER = "employer"
    MENTOR = "mentor"
    OTHER = "other"


class LORStatus(str, Enum):
    NOT_CONTACTED = "not-contacted"
    CONTACTED = "contacted"
    AGREED = "agreed"
    SUBMITTED = "submitted"
    DECLINED = "declined"


class ProgramPriority(str, Enum):
    DREAM = "dream"
    TARGET = "target"
    SAFETY = "safety"


class ApplicationStatus(str, Enum):
    RESEARCHING = "researching"
    PREPARING = "preparing"
    IN_PROGRESS = "in-progress"
    SUBMITTED = "submitted"
    INTERVIEW = "interview"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WAITLISTED = "waitlisted"
    ENROLLED = "enrolled"
    DECLINED = "declined"


class DocumentStatus(str, Enum):
    NOT_STARTED = "not-started"
    DRAFTING = "drafting"
    REVIEW = "review"
    FINAL = "final"


class MilestoneStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class MilestoneCategory(str, Enum):
    TEST = "test"
    DOCUMENT = "document"
    APPLICATION = "application"
    RESEARCH = "research"
    NETWORKING = "networking"
    OTHER = "other"


class SyncAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


class ScholarshipStatus(str, Enum):
    RESEARCHING = "researching"
    APPLYING = "applying"
    SUBMITTED = "submitted"
    AWARDED = "awarded"
    REJECTED = "rejected"


# ============================================
# METADATA MODELS
# ============================================

class VersionMetadata(BaseModel):
    version: int = 1
    last_modified: datetime = Field(default_factory=datetime.utcnow)
    modified_by: ModifiedBy = ModifiedBy.SYSTEM
    change_log: List[str] = Field(default_factory=list)


class SectionTimestamp(BaseModel):
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: ModifiedBy = ModifiedBy.SYSTEM
    synced_to_roadmap: bool = False
    last_sync_at: Optional[datetime] = None


# ============================================
# ADDRESS & LOCATION
# ============================================

class Address(BaseModel):
    street: Optional[str] = None
    city: str
    state: Optional[str] = None
    country: str
    zip_code: Optional[str] = None


class Location(BaseModel):
    city: str
    country: str


# ============================================
# PERSONAL INFORMATION
# ============================================

class PersonalInfo(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    first_name: str = ""
    last_name: str = ""
    preferred_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    nationality: str = ""
    country_of_residence: str = ""
    gender: Optional[Gender] = None
    pronouns: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None

    class Config:
        populate_by_name = True


class ContactInfo(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    email: str = ""
    phone: Optional[str] = None
    alternate_email: Optional[str] = None
    address: Optional[Address] = None
    timezone: Optional[str] = None

    class Config:
        populate_by_name = True


# ============================================
# EDUCATION
# ============================================

class Thesis(BaseModel):
    title: str
    advisor: Optional[str] = None
    abstract: Optional[str] = None


class EducationEntry(BaseModel):
    id: str
    institution: str
    institution_location: Optional[Location] = None
    degree: str
    degree_type: DegreeType
    major: str
    minor: Optional[str] = None
    gpa: Optional[float] = None
    gpa_scale: Optional[float] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    is_currently: bool = False
    honors: List[str] = Field(default_factory=list)
    relevant_coursework: List[str] = Field(default_factory=list)
    thesis: Optional[Thesis] = None
    ranking: Optional[str] = None


class Education(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    entries: List[EducationEntry] = Field(default_factory=list)
    highest_degree: Optional[str] = None

    class Config:
        populate_by_name = True


# ============================================
# TEST SCORES
# ============================================

class GREScore(BaseModel):
    verbal: Optional[int] = None
    quantitative: Optional[int] = None
    analytical_writing: Optional[float] = None
    total_score: Optional[int] = None
    test_date: Optional[datetime] = None
    planned_date: Optional[datetime] = None
    status: TestStatus = TestStatus.NOT_PLANNED


class TOEFLScore(BaseModel):
    reading: Optional[int] = None
    listening: Optional[int] = None
    speaking: Optional[int] = None
    writing: Optional[int] = None
    total_score: Optional[int] = None
    test_date: Optional[datetime] = None
    planned_date: Optional[datetime] = None
    status: TestStatus = TestStatus.NOT_PLANNED


class IELTSScore(BaseModel):
    reading: Optional[float] = None
    listening: Optional[float] = None
    speaking: Optional[float] = None
    writing: Optional[float] = None
    overall_band: Optional[float] = None
    test_date: Optional[datetime] = None
    planned_date: Optional[datetime] = None
    status: TestStatus = TestStatus.NOT_PLANNED


class GMATScore(BaseModel):
    verbal: Optional[int] = None
    quantitative: Optional[int] = None
    integrated_reasoning: Optional[int] = None
    analytical_writing: Optional[float] = None
    total_score: Optional[int] = None
    test_date: Optional[datetime] = None
    planned_date: Optional[datetime] = None
    status: TestStatus = TestStatus.NOT_PLANNED


class OtherTest(BaseModel):
    name: str
    score: str
    test_date: Optional[datetime] = None


class TestScores(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    gre: Optional[GREScore] = None
    toefl: Optional[TOEFLScore] = None
    ielts: Optional[IELTSScore] = None
    gmat: Optional[GMATScore] = None
    other_tests: List[OtherTest] = Field(default_factory=list)

    class Config:
        populate_by_name = True


# ============================================
# WORK EXPERIENCE
# ============================================

class Supervisor(BaseModel):
    name: str
    title: Optional[str] = None
    email: Optional[str] = None
    can_contact: bool = False


class WorkExperienceEntry(BaseModel):
    id: str
    company: str
    company_location: Optional[Location] = None
    position: str
    employment_type: EmploymentType
    start_date: datetime
    end_date: Optional[datetime] = None
    is_currently: bool = False
    responsibilities: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    supervisor: Optional[Supervisor] = None


class WorkExperience(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    entries: List[WorkExperienceEntry] = Field(default_factory=list)
    total_years_experience: Optional[float] = None

    class Config:
        populate_by_name = True


# ============================================
# RESEARCH EXPERIENCE
# ============================================

class ResearchAdvisor(BaseModel):
    name: str
    title: Optional[str] = None
    email: Optional[str] = None
    can_contact: bool = False


class ResearchEntry(BaseModel):
    id: str
    title: str
    institution: str
    role: ResearchRole
    advisor: Optional[ResearchAdvisor] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    is_currently: bool = False
    description: str
    methodology: List[str] = Field(default_factory=list)
    outcomes: List[str] = Field(default_factory=list)
    publications: List[str] = Field(default_factory=list)
    presentations: List[str] = Field(default_factory=list)
    funding_source: Optional[str] = None
    skills: List[str] = Field(default_factory=list)


class Research(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    entries: List[ResearchEntry] = Field(default_factory=list)
    research_interests: List[str] = Field(default_factory=list)
    preferred_methodologies: List[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True


# ============================================
# PUBLICATIONS
# ============================================

class PublicationEntry(BaseModel):
    id: str
    title: str
    authors: List[str]
    author_position: int
    type: PublicationType
    venue: str
    year: int
    doi: Optional[str] = None
    url: Optional[str] = None
    abstract: Optional[str] = None
    citations: Optional[int] = None
    impact_factor: Optional[float] = None
    status: PublicationStatus = PublicationStatus.PUBLISHED


class Publications(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    entries: List[PublicationEntry] = Field(default_factory=list)
    total_publications: Optional[int] = None
    h_index: Optional[int] = None

    class Config:
        populate_by_name = True


# ============================================
# AWARDS
# ============================================

class MonetaryAmount(BaseModel):
    amount: float
    currency: str = "USD"


class AwardEntry(BaseModel):
    id: str
    title: str
    issuer: str
    date: datetime
    description: Optional[str] = None
    type: AwardType
    monetary: Optional[MonetaryAmount] = None
    url: Optional[str] = None


class Awards(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    entries: List[AwardEntry] = Field(default_factory=list)

    class Config:
        populate_by_name = True


# ============================================
# SKILLS & CERTIFICATIONS
# ============================================

class SkillEntry(BaseModel):
    name: str
    category: SkillCategory
    proficiency: SkillProficiency
    years_of_experience: Optional[float] = None


class CertificationEntry(BaseModel):
    id: str
    name: str
    issuer: str
    issue_date: datetime
    expiry_date: Optional[datetime] = None
    credential_id: Optional[str] = None
    url: Optional[str] = None


class LanguageSkill(BaseModel):
    language: str
    proficiency: LanguageProficiency


class Skills(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    skills: List[SkillEntry] = Field(default_factory=list)
    certifications: List[CertificationEntry] = Field(default_factory=list)
    languages: List[LanguageSkill] = Field(default_factory=list)

    class Config:
        populate_by_name = True


# ============================================
# ACTIVITIES
# ============================================

class ActivityEntry(BaseModel):
    id: str
    organization: str
    role: str
    type: ActivityType
    start_date: datetime
    end_date: Optional[datetime] = None
    is_currently: bool = False
    description: str
    achievements: List[str] = Field(default_factory=list)
    hours_per_week: Optional[float] = None


class Activities(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    entries: List[ActivityEntry] = Field(default_factory=list)

    class Config:
        populate_by_name = True


# ============================================
# LOR TRACKING
# ============================================

class LORContact(BaseModel):
    id: str
    name: str
    title: str
    institution: str
    email: str
    phone: Optional[str] = None
    relationship: LORRelationship
    relationship_description: str
    years_known: int
    capacity: str
    status: LORStatus = LORStatus.NOT_CONTACTED
    notes: Optional[str] = None
    deadline_reminders: List[datetime] = Field(default_factory=list)
    universities: List[str] = Field(default_factory=list)


class LORTracking(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    contacts: List[LORContact] = Field(default_factory=list)
    total_needed: Optional[int] = None
    total_secured: Optional[int] = None

    class Config:
        populate_by_name = True


# ============================================
# FINANCIAL DETAILS
# ============================================

class Budget(BaseModel):
    total_budget: Optional[float] = None
    currency: str = "USD"
    includes_living: bool = True


class FundingPreferences(BaseModel):
    need_full_funding: bool = False
    accept_partial_funding: bool = True
    can_self_fund: bool = False
    self_fund_amount: Optional[float] = None


class ScholarshipApplication(BaseModel):
    name: str
    status: ScholarshipStatus = ScholarshipStatus.RESEARCHING
    amount: Optional[float] = None
    deadline: Optional[datetime] = None


class FinancialAid(BaseModel):
    has_applied: bool = False
    fafsa_completed: Optional[bool] = None
    css_profile_completed: Optional[bool] = None


class FinancialDetails(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    budget: Budget = Field(default_factory=Budget)
    funding_preferences: FundingPreferences = Field(default_factory=FundingPreferences)
    scholarships_applied: List[ScholarshipApplication] = Field(default_factory=list)
    financial_aid: Optional[FinancialAid] = None

    class Config:
        populate_by_name = True


# ============================================
# APPLICATION GOALS
# ============================================

class FacultyOfInterest(BaseModel):
    name: str
    research_area: str
    contacted: bool = False
    contact_date: Optional[datetime] = None
    response: Optional[str] = None


class ProgramRequirements(BaseModel):
    gre: bool = False
    toefl: bool = False
    ielts: bool = False
    writing_sample: bool = False
    portfolio: bool = False
    interview: bool = False
    other_requirements: List[str] = Field(default_factory=list)


class DocumentTracker(BaseModel):
    status: DocumentStatus = DocumentStatus.NOT_STARTED
    document_id: Optional[str] = None


class ProgramDocuments(BaseModel):
    sop: DocumentTracker = Field(default_factory=DocumentTracker)
    resume: DocumentTracker = Field(default_factory=DocumentTracker)
    writing_sample: Optional[DocumentTracker] = None
    diversity_statement: Optional[DocumentTracker] = None


class TargetProgram(BaseModel):
    id: str
    university: str
    university_ranking: Optional[int] = None
    program: str
    degree: DegreeType
    department: Optional[str] = None
    deadline: datetime
    priority: ProgramPriority
    status: ApplicationStatus = ApplicationStatus.RESEARCHING
    faculty_of_interest: List[FacultyOfInterest] = Field(default_factory=list)
    application_fee: Optional[float] = None
    requirements: Optional[ProgramRequirements] = None
    documents: Optional[ProgramDocuments] = None
    notes: Optional[str] = None


class ApplicationGoals(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    target_season: str = ""
    target_year: int = Field(default_factory=lambda: datetime.now().year + 1)
    target_degree: DegreeType = DegreeType.MASTERS
    target_countries: List[str] = Field(default_factory=list)
    target_fields: List[str] = Field(default_factory=list)
    programs: List[TargetProgram] = Field(default_factory=list)
    total_target_programs: Optional[int] = None

    class Config:
        populate_by_name = True


# ============================================
# READINESS
# ============================================

class SectionReadiness(BaseModel):
    profile: int = 0
    education: int = 0
    test_scores: int = 0
    research: int = 0
    work_experience: int = 0
    documents: int = 0
    recommendations: int = 0
    schools: int = 0
    finances: int = 0


class Milestone(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    target_date: datetime
    completed_date: Optional[datetime] = None
    status: MilestoneStatus = MilestoneStatus.PENDING
    category: MilestoneCategory


class NextDeadline(BaseModel):
    title: str
    date: datetime
    university: Optional[str] = None


class ApplicationReadiness(BaseModel):
    meta: SectionTimestamp = Field(default_factory=SectionTimestamp, alias="_meta")
    overall_readiness: int = 0
    section_readiness: SectionReadiness = Field(default_factory=SectionReadiness)
    milestones: List[Milestone] = Field(default_factory=list)
    next_deadline: Optional[NextDeadline] = None

    class Config:
        populate_by_name = True


# ============================================
# SYNC LOG
# ============================================

class SyncLogEntry(BaseModel):
    id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: ModifiedBy
    action: SyncAction
    section: str
    field: Optional[str] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    description: str
    synced_to_roadmap: bool = False
    synced_at: Optional[datetime] = None


class SyncLog(BaseModel):
    entries: List[SyncLogEntry] = Field(default_factory=list)
    last_full_sync: Optional[datetime] = None
    pending_changes: int = 0


# ============================================
# SMART PROFILE - MAIN MODEL
# ============================================

class SmartProfile(BaseModel):
    """
    The comprehensive user profile that serves as the single source of truth.
    All components (Roadmap, Documents, Tracker, Applications) derive from this.
    """
    
    # Metadata
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    version: VersionMetadata = Field(default_factory=VersionMetadata)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Personal
    personal_info: PersonalInfo = Field(default_factory=PersonalInfo)
    contact_info: ContactInfo = Field(default_factory=ContactInfo)
    
    # Academic
    education: Education = Field(default_factory=Education)
    test_scores: TestScores = Field(default_factory=TestScores)
    research: Research = Field(default_factory=Research)
    publications: Publications = Field(default_factory=Publications)
    
    # Professional
    work_experience: WorkExperience = Field(default_factory=WorkExperience)
    skills: Skills = Field(default_factory=Skills)
    activities: Activities = Field(default_factory=Activities)
    awards: Awards = Field(default_factory=Awards)
    
    # Application Materials
    lor_tracking: LORTracking = Field(default_factory=LORTracking)
    application_goals: ApplicationGoals = Field(default_factory=ApplicationGoals)
    
    # Financial
    financial_details: FinancialDetails = Field(default_factory=FinancialDetails)
    
    # Readiness
    readiness: ApplicationReadiness = Field(default_factory=ApplicationReadiness)
    
    # Sync
    sync_log: SyncLog = Field(default_factory=SyncLog)
    
    # Flags
    is_profile_complete: bool = False
    profile_completeness: int = 0
    last_chat_sync: Optional[datetime] = None
    last_roadmap_sync: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


# ============================================
# UPDATE TYPES
# ============================================

class ProfileUpdateRequest(BaseModel):
    """Request to update a section of the profile"""
    section: str
    data: dict
    source: ModifiedBy = ModifiedBy.USER
    sync_to_roadmap: bool = True


class ProfileUpdateResult(BaseModel):
    """Result of a profile update operation"""
    success: bool
    updated_section: str
    new_version: int
    synced_to_roadmap: bool
    error: Optional[str] = None


class ExtractedField(BaseModel):
    """A field extracted from chat conversation"""
    section: str
    field: str
    value: Any
    confidence: float


class ChatExtractionResult(BaseModel):
    """Result of extracting profile data from chat"""
    extracted_fields: List[ExtractedField] = Field(default_factory=list)
    suggested_updates: List[ProfileUpdateRequest] = Field(default_factory=list)
    requires_confirmation: bool = True
    message: str = ""


# ============================================
# MONGODB HELPERS
# ============================================

def smart_profile_to_dict(profile: SmartProfile) -> dict:
    """Convert SmartProfile to MongoDB-compatible dict"""
    data = profile.model_dump(by_alias=True, exclude_none=True)
    if data.get("_id") is None:
        data.pop("_id", None)
    return data


def dict_to_smart_profile(data: dict) -> SmartProfile:
    """Convert MongoDB document to SmartProfile"""
    if "_id" in data:
        data["_id"] = str(data["_id"])
    return SmartProfile(**data)


def create_empty_smart_profile(user_id: str) -> SmartProfile:
    """Factory function to create an empty SmartProfile"""
    return SmartProfile(
        user_id=user_id,
        version=VersionMetadata(
            version=1,
            change_log=["Profile created"]
        )
    )
