"""Pydantic models for SOP Generator API"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class UploadFileRequest(BaseModel):
    """Request model for file upload (multipart form data)"""
    doc_type: str = Field(default="document", description="Type of document")


class UploadFileResponse(BaseModel):
    """Response model for file upload"""
    file_id: str
    filename: str
    text_preview: str


class GenerateSOPRequest(BaseModel):
    """Request model for SOP generation"""
    program: str = Field(..., description="Target program name")
    university: Optional[str] = Field(None, description="University name")
    country: Optional[str] = Field(None, description="Country")
    about_you: Optional[str] = Field(None, description="Personal introduction/about you")
    background: str = Field(..., description="Academic/professional background")
    projects_summary: Optional[str] = Field(None, description="Summary of key projects")
    goals: str = Field(..., description="Career and academic goals")
    others: Optional[str] = Field(None, description="Other relevant information")
    tone: Optional[str] = Field("formal", description="Tone: formal, conversational")
    word_limit: Optional[int] = Field(1000, description="Target word count")
    file_ids: List[str] = Field(default_factory=list, description="Uploaded file IDs")

class GenerateLORRequest(BaseModel):
    """Request model for Letter of Recommendation generation"""
    # Recommender details
    recommender_name: str = Field(..., description="Full name of recommender")
    recommender_title: str = Field(..., description="Designation & organization, or academic title")
    recommender_relationship: str = Field(..., description="Relationship to student (professor, manager, etc.)")
    recommender_association_duration: str = Field(..., description="Duration of association (e.g., 2 years)")
    # Student details
    student_name: str = Field(..., description="Student full name")
    student_role: Optional[str] = Field(None, description="Student degree or job role")
    student_under_duration: Optional[str] = Field(None, description="Duration student worked/studied under recommender")
    # Observations
    skills_observed: Optional[str] = Field(None, description="Key skills or traits observed")
    achievements: Optional[str] = Field(None, description="Notable achievements or examples")
    character_traits: Optional[str] = Field(None, description="Character / personal qualities")
    # Target program
    target_program: str = Field(..., description="Program applying to")
    target_university: Optional[str] = Field(None, description="Target university")
    target_country: Optional[str] = Field(None, description="Country of institution")
    # Tone & strength
    tone: str = Field("academic", description="Tone: academic | managerial | balanced")
    recommendation_strength: str = Field("strongly recommended", description="Strength: recommended | strongly recommended | highly recommended")
    word_limit: Optional[int] = Field(800, description="Target word count")
    # Evidence file IDs (uploaded pdfs, CV, transcript etc.)
    evidence_file_ids: List[str] = Field(default_factory=list, description="Uploaded evidence file IDs")
    cv_file_ids: List[str] = Field(default_factory=list, description="CV file IDs")
    transcript_file_ids: List[str] = Field(default_factory=list, description="Transcript file IDs")

class LORSection(BaseModel):
    """A section of the Letter of Recommendation"""
    heading: str
    content_markdown: str

class GenerateLORResponse(BaseModel):
    """Response model for LOR generation"""
    title: str
    sections: List[LORSection]
    plain_text: str
    editor_json: Dict[str, Any]
    html: str


class SOPSection(BaseModel):
    """A section of the SOP"""
    heading: str
    content_markdown: str


class GenerateSOPResponse(BaseModel):
    """Response model for SOP generation"""
    sop_id: Optional[str] = None
    title: str
    sections: List[SOPSection]
    plain_text: str
    editor_json: Dict[str, Any]
    html: str


class RewriteRequest(BaseModel):
    """Request model for rewriting text"""
    sop_id: Optional[str] = None
    selected_text: str
    instruction: str
    program: Optional[str] = None
    university: Optional[str] = None
    file_ids: List[str] = Field(default_factory=list, description="Uploaded file IDs for context")


class RewriteResponse(BaseModel):
    """Response model for rewrite"""
    rewritten_text: str


class SaveSOPRequest(BaseModel):
    """Request model for saving SOP"""
    sop_id: Optional[str] = None
    title: str
    editor_json: Dict[str, Any]
    html: str
    metadata: Optional[Dict[str, Any]] = None


class SaveSOPResponse(BaseModel):
    """Response model for save"""
    sop_id: str


class SOPDocument(BaseModel):
    """Full SOP document model"""
    id: str
    title: str
    editor_json: Dict[str, Any]
    html: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    user_id: str

class SOPSummary(BaseModel):
    """Lightweight SOP summary for listings"""
    id: str
    title: str
    updated_at: datetime
    created_at: datetime


class RetrievedChunk(BaseModel):
    """Retrieved document chunk from vector DB"""
    file_id: str
    chunk_index: int
    text_preview: str
    similarity: float
