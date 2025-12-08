"""
Pydantic models for faculty matching and scraping operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from enum import Enum


class MatchingMode(str, Enum):
    """Faculty matching mode options"""
    SEMANTIC = "semantic"  # Vector similarity based matching
    KEYWORD = "keyword"    # Keyword-based matching
    HYBRID = "hybrid"      # Combined semantic + keyword


class FacultyStatus(str, Enum):
    """Faculty accepting status"""
    ACCEPTING = "accepting"  # Actively accepting students
    NOT_ACCEPTING = "not_accepting"  # Not accepting new students
    UNKNOWN = "unknown"  # Status not specified


class FacultyInfo(BaseModel):
    """Faculty member information"""
    faculty_id: str = Field(..., description="Unique faculty identifier")
    name: str = Field(..., description="Faculty full name")
    email: Optional[str] = Field(None, description="Faculty email address")
    university: str = Field(..., description="University/institution name")
    department: str = Field(..., description="Department name")
    title: Optional[str] = Field(None, description="Academic title (Professor, Associate, etc.)")
    research_areas: List[str] = Field(default_factory=list, description="Research areas/keywords")
    lab_name: Optional[str] = Field(None, description="Lab or research group name")
    lab_website: Optional[str] = Field(None, description="Lab website URL")
    personal_website: Optional[str] = Field(None, description="Personal website URL")
    accepting_students: FacultyStatus = Field(
        default=FacultyStatus.UNKNOWN,
        description="Current student acceptance status"
    )
    publications: List[str] = Field(default_factory=list, description="Recent publication titles")
    h_index: Optional[int] = Field(None, description="H-index if available")
    citations: Optional[int] = Field(None, description="Total citations if available")
    funding: Optional[List[str]] = Field(None, description="Research funding sources")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class FacultyMatch(BaseModel):
    """Single faculty match result"""
    faculty: FacultyInfo = Field(..., description="Faculty information")
    match_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Match score from 0-100"
    )
    reasoning: str = Field(..., description="Explanation of why this faculty matches")
    matched_keywords: List[str] = Field(
        default_factory=list,
        description="Keywords that matched from research interests"
    )
    similarity_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Raw similarity score (0-1)"
    )


class FacultyMatchRequest(BaseModel):
    """Request model for faculty matching"""
    research_interests: str = Field(
        ...,
        description="Student's research interests (keywords or free text)",
        min_length=1
    )

    # Filtering options
    university: Optional[str] = Field(
        None,
        description="Filter by specific university"
    )

    universities: Optional[List[str]] = Field(
        None,
        description="Filter by list of universities"
    )

    department: Optional[str] = Field(
        None,
        description="Filter by specific department"
    )

    departments: Optional[List[str]] = Field(
        None,
        description="Filter by list of departments"
    )

    accepting_students_only: bool = Field(
        default=False,
        description="Only return faculty actively accepting students"
    )

    # Matching options
    mode: MatchingMode = Field(
        default=MatchingMode.HYBRID,
        description="Matching mode (semantic, keyword, hybrid)"
    )

    top_k: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Number of faculty matches to return per university"
    )

    min_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Minimum match score threshold (0-100)"
    )

    include_publications: bool = Field(
        default=True,
        description="Include recent publications in results"
    )

    semantic_weight: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Weight for semantic matching in hybrid mode"
    )

    keyword_weight: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Weight for keyword matching in hybrid mode"
    )


class UniversityMatches(BaseModel):
    """Faculty matches grouped by university"""
    university: str = Field(..., description="University name")
    total_matches: int = Field(..., description="Total number of matches")
    faculty_matches: List[FacultyMatch] = Field(..., description="Matched faculty members")
    avg_match_score: float = Field(..., description="Average match score")
    departments: List[str] = Field(
        default_factory=list,
        description="Departments with matches"
    )


class FacultyMatchResponse(BaseModel):
    """Response model for faculty matching"""
    matches: List[FacultyMatch] = Field(..., description="All faculty matches")
    matches_by_university: List[UniversityMatches] = Field(
        ...,
        description="Matches grouped by university"
    )
    total_matches: int = Field(..., description="Total number of matches")
    query: str = Field(..., description="Original research interests query")
    mode: MatchingMode = Field(..., description="Matching mode used")
    filters_applied: Dict[str, Any] = Field(
        default_factory=dict,
        description="Filters that were applied"
    )
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")


class FacultyProfile(BaseModel):
    """Detailed faculty profile for enrichment"""
    faculty_id: str = Field(..., description="Faculty identifier")
    bio: Optional[str] = Field(None, description="Faculty biography")
    education: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Educational background"
    )
    courses_taught: List[str] = Field(
        default_factory=list,
        description="Courses taught"
    )
    phd_students: Optional[int] = Field(
        None,
        description="Number of PhD students supervised"
    )
    awards: List[str] = Field(default_factory=list, description="Awards and honors")
    professional_service: List[str] = Field(
        default_factory=list,
        description="Professional service activities"
    )


class BulkFacultyUpload(BaseModel):
    """Model for bulk faculty data upload"""
    faculty_members: List[FacultyInfo] = Field(
        ...,
        description="List of faculty members to upload"
    )
    university: str = Field(..., description="University name for all faculty")
    overwrite_existing: bool = Field(
        default=False,
        description="Overwrite existing faculty data"
    )


# ============================================================================
# Faculty Scraping Models (for web scraping service)
# ============================================================================


class ScrapedFacultyMember(BaseModel):
    """Individual faculty member data from web scraping"""
    name: str = Field(..., description="Full name of faculty member")
    title: Optional[str] = Field(None, description="Academic title/position")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    office: Optional[str] = Field(None, description="Office location")
    website: Optional[str] = Field(None, description="Personal or lab website URL")
    researchAreas: List[str] = Field(default_factory=list, description="Research areas/interests")
    labName: Optional[str] = Field(None, description="Laboratory or research group name")
    education: Optional[str] = Field(None, description="Highest degree and institution")
    bio: Optional[str] = Field(None, description="Brief biography")
    publications: List[str] = Field(default_factory=list, description="Recent key publications")


class FacultyDatabaseEntry(BaseModel):
    """Complete faculty database entry for a department"""
    universityId: str = Field(..., description="Unique university identifier")
    universityName: str = Field(..., description="University name")
    department: str = Field(..., description="Department name")
    sourceUrl: str = Field(..., description="Source URL scraped")
    urlsScraped: List[str] = Field(default_factory=list, description="All URLs scraped")
    faculty: List[ScrapedFacultyMember] = Field(default_factory=list, description="List of faculty members")
    totalFaculty: int = Field(0, description="Total number of faculty members")
    scrapedAt: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of scraping")
    updatedAt: Optional[datetime] = Field(None, description="Last update timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class FacultyScrapeRequest(BaseModel):
    """Request model for faculty scraping"""
    url: str = Field(..., description="Faculty/people page URL to scrape")
    universityId: str = Field(..., description="Unique university identifier")
    universityName: str = Field(..., description="University name")
    department: str = Field(..., description="Department name")
    useCrawl: bool = Field(False, description="Whether to crawl multiple pages")
    maxPages: int = Field(20, ge=1, le=100, description="Max pages to crawl")
    saveToDatabase: bool = Field(True, description="Whether to save results to database")


class FacultyScrapeResponse(BaseModel):
    """Response model for faculty scraping"""
    success: bool = Field(..., description="Whether scraping was successful")
    universityId: str = Field(..., description="University identifier")
    department: str = Field(..., description="Department name")
    totalFaculty: int = Field(..., description="Number of faculty members extracted")
    faculty: List[ScrapedFacultyMember] = Field(default_factory=list, description="Extracted faculty data")
    documentId: Optional[str] = Field(None, description="MongoDB document ID if saved")
    scrapedAt: datetime = Field(default_factory=datetime.utcnow)
    message: str = Field(..., description="Status message")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional information")


class FacultySearchByAreaRequest(BaseModel):
    """Request model for searching faculty by research area"""
    researchArea: str = Field(..., description="Research area to search for", min_length=2)
    limit: int = Field(50, ge=1, le=500, description="Maximum number of results")


class FacultySearchByAreaResult(BaseModel):
    """Individual faculty search result by research area"""
    university: str = Field(..., description="University name")
    department: str = Field(..., description="Department name")
    faculty: ScrapedFacultyMember = Field(..., description="Faculty member details")


class FacultySearchByAreaResponse(BaseModel):
    """Response model for faculty search by research area"""
    researchArea: str = Field(..., description="Research area searched")
    totalResults: int = Field(..., description="Total number of matching faculty")
    results: List[FacultySearchByAreaResult] = Field(default_factory=list, description="Search results")


class FacultyQueryRequest(BaseModel):
    """Request model for querying faculty data"""
    universityId: str = Field(..., description="University identifier")
    department: Optional[str] = Field(None, description="Optional department filter")


class FacultyStatistics(BaseModel):
    """Statistics about the faculty database"""
    totalUniversities: int = Field(..., description="Total number of universities in database")
    totalFaculty: int = Field(..., description="Total number of faculty members")
    topResearchAreas: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Most common research areas with counts"
    )
    generatedAt: str = Field(..., description="Timestamp when statistics were generated")


class BatchScrapeRequest(BaseModel):
    """Request model for batch scraping multiple departments"""
    universities: List[Dict[str, Any]] = Field(
        ...,
        description="List of university/department configurations"
    )
    useCrawl: bool = Field(False, description="Whether to use crawl mode for all")
    maxPages: int = Field(20, description="Max pages per crawl")
    saveToDatabase: bool = Field(True, description="Save all results to database")


class BatchScrapeResponse(BaseModel):
    """Response model for batch scraping"""
    totalRequested: int = Field(..., description="Total number of scrapes requested")
    successful: int = Field(..., description="Number of successful scrapes")
    failed: int = Field(..., description="Number of failed scrapes")
    results: List[FacultyScrapeResponse] = Field(
        default_factory=list,
        description="Individual scrape results"
    )
    errors: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Errors encountered"
    )
    completedAt: datetime = Field(default_factory=datetime.utcnow)
