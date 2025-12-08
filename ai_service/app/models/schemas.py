"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


# Vector Store Models
class DocumentUpload(BaseModel):
    """Model for document upload request"""
    user_id: str = Field(..., description="User ID")
    collection_type: str = Field(default="documents", description="Collection type")
    document_type: str = Field(default="general", description="Document type (resume, cv, sop, general)")


class DocumentAdd(BaseModel):
    """Model for adding documents to collection"""
    user_id: str = Field(..., description="User ID")
    collection_type: str = Field(..., description="Collection type")
    documents: List[str] = Field(..., description="List of document texts")
    metadatas: Optional[List[Dict[str, Any]]] = Field(None, description="Optional metadata for each document")
    ids: Optional[List[str]] = Field(None, description="Optional document IDs")


class DocumentQuery(BaseModel):
    """Model for querying documents"""
    user_id: str = Field(..., description="User ID")
    collection_type: str = Field(..., description="Collection type")
    query_text: str = Field(..., description="Query text")
    n_results: int = Field(default=5, description="Number of results to return")
    where: Optional[Dict[str, Any]] = Field(None, description="Optional filter conditions")


class DocumentDelete(BaseModel):
    """Model for deleting documents"""
    user_id: str = Field(..., description="User ID")
    collection_type: str = Field(..., description="Collection type")
    ids: List[str] = Field(..., description="Document IDs to delete")


class CollectionInfo(BaseModel):
    """Model for collection information request"""
    user_id: str = Field(..., description="User ID")
    collection_type: str = Field(..., description="Collection type")


# Resume/CV/SOP Models
class ResumeData(BaseModel):
    """Model for resume data"""
    user_id: str = Field(..., description="User ID")
    content: str = Field(..., description="Resume content")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata")


class CVData(BaseModel):
    """Model for CV data"""
    user_id: str = Field(..., description="User ID")
    content: str = Field(..., description="CV content")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata")


class SOPData(BaseModel):
    """Model for SOP data"""
    user_id: str = Field(..., description="User ID")
    content: str = Field(..., description="SOP content")
    university: str = Field(..., description="Target university")
    program: str = Field(..., description="Target program")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata")


# Tracker Models
class UniversityTracker(BaseModel):
    """Model for university tracking request"""
    user_id: str = Field(..., description="User ID")
    university_url: str = Field(..., description="University website URL")
    tracking_type: str = Field(..., description="Type of information to track")
    email_notifications: bool = Field(default=True, description="Enable email notifications")


class TrackerStatus(BaseModel):
    """Model for tracker status"""
    tracker_id: str = Field(..., description="Tracker ID")
    user_id: str = Field(..., description="User ID")


# Research Agent Models
class ResearchQuery(BaseModel):
    """Model for research query"""
    user_id: str = Field(..., description="User ID")
    query: str = Field(..., description="Research query")
    research_type: str = Field(..., description="Type of research (university, program, scholarship, etc.)")
    depth: str = Field(default="standard", description="Research depth (quick, standard, deep)")


class ProfessorSearch(BaseModel):
    """Model for professor/senior search"""
    user_id: str = Field(..., description="User ID")
    university: str = Field(..., description="University name")
    field_of_study: str = Field(..., description="Field of study")
    search_type: str = Field(default="professor", description="Search type (professor, senior)")


class TravelPlan(BaseModel):
    """Model for travel planning"""
    user_id: str = Field(..., description="User ID")
    destination: str = Field(..., description="Destination country/city")
    duration: int = Field(..., description="Duration in days")
    budget: Optional[float] = Field(None, description="Budget in USD")


class StudyAbroadPlan(BaseModel):
    """Model for study abroad planning"""
    user_id: str = Field(..., description="User ID")
    target_country: str = Field(..., description="Target country")
    program_type: str = Field(..., description="Program type")
    budget: float = Field(..., description="Available budget")
    start_date: Optional[str] = Field(None, description="Expected start date")


# Response Models
class APIResponse(BaseModel):
    """Standard API response model"""
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = Field(default=False, description="Always false for errors")
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")


# SOP Analysis Models
class SOPAnalysisRequest(BaseModel):
    """Model for SOP analysis request"""
    user_id: str = Field(..., description="User ID")
    sop_text: str = Field(..., min_length=100, description="SOP text content (minimum 100 characters)")
    university_name: Optional[str] = Field(None, description="Target university name")
    program_name: Optional[str] = Field(None, description="Target program name")
    compare_with_database: bool = Field(default=True, description="Compare with existing SOPs for uniqueness")


class SOPComparisonRequest(BaseModel):
    """Model for comparing two SOP versions"""
    user_id: str = Field(..., description="User ID")
    sop_text_1: str = Field(..., min_length=100, description="First SOP version")
    sop_text_2: str = Field(..., min_length=100, description="Second SOP version")


class CustomClicheRequest(BaseModel):
    """Model for adding custom cliché"""
    text: str = Field(..., min_length=2, description="Cliché text")
    severity: str = Field(..., description="Severity level (major, moderate, minor)")
    category: str = Field(..., description="Cliché category")
    suggestion: str = Field(..., description="Suggestion for improvement")


class ClicheInfo(BaseModel):
    """Model for cliché information"""
    text: str = Field(..., description="Cliché text")
    severity: str = Field(..., description="Severity level")
    category: str = Field(..., description="Category")
    position: Dict[str, int] = Field(..., description="Position in text (start, end)")
    context: str = Field(..., description="Surrounding context")
    suggestion: str = Field(..., description="Improvement suggestion")


class ScoreBreakdown(BaseModel):
    """Model for score breakdown"""
    overall: float = Field(..., ge=0, le=100, description="Overall score")
    uniqueness: float = Field(..., ge=0, le=100, description="Uniqueness score")
    structure: float = Field(..., ge=0, le=100, description="Structure score")
    specificity: float = Field(..., ge=0, le=100, description="Specificity score")
    tone: float = Field(..., ge=0, le=100, description="Tone score")
    program_fit: float = Field(..., ge=0, le=100, description="Program fit score")


class SOPAnalysisResponse(BaseModel):
    """Model for SOP analysis response"""
    user_id: str = Field(..., description="User ID")
    timestamp: str = Field(..., description="Analysis timestamp")
    sop_length: int = Field(..., description="Character count")
    word_count: int = Field(..., description="Word count")
    university_name: Optional[str] = Field(None, description="Target university")
    program_name: Optional[str] = Field(None, description="Target program")
    scores: ScoreBreakdown = Field(..., description="Score breakdown")
    grade: str = Field(..., description="Letter grade (A-F)")
    structure_analysis: Dict[str, Any] = Field(..., description="Structure analysis details")
    cliche_detection: Dict[str, Any] = Field(..., description="Detected clichés")
    tone_analysis: Dict[str, Any] = Field(..., description="Tone analysis")
    program_fit: Dict[str, Any] = Field(..., description="Program fit analysis")
    recommendations: List[Dict[str, Any]] = Field(..., description="Improvement recommendations")
