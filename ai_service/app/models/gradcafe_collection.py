"""
Pydantic models for GradCafe data collection system
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CollectionStatus(str, Enum):
    """Status of a collection job"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class CollectionPriority(str, Enum):
    """Priority levels for collection jobs"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ScrapingStrategy(str, Enum):
    """Scraping strategy types"""
    RECENT_DECISIONS = "recent_decisions"  # Focus on recent 30 days
    TOP_UNIVERSITIES = "top_universities"  # Focus on top 50 universities
    BY_PROGRAM = "by_program"  # By specific programs
    BY_SEASON = "by_season"  # By application season
    COMPREHENSIVE = "comprehensive"  # Full scraping


class CollectionTarget(BaseModel):
    """Target configuration for data collection"""
    programs: List[str] = Field(default_factory=list, description="List of programs to scrape")
    universities: List[str] = Field(default_factory=list, description="List of universities to scrape")
    years: List[str] = Field(default_factory=list, description="Years to scrape")
    limit_per_program: int = Field(default=50, description="Max results per program", ge=1, le=500)
    strategy: ScrapingStrategy = Field(default=ScrapingStrategy.RECENT_DECISIONS)


class DataPointProfile(BaseModel):
    """Student profile data extracted from admission result"""
    gpa: Optional[float] = None
    gpa_scale: Optional[float] = None
    gpa_normalized: Optional[float] = None
    gre_verbal: Optional[int] = None
    gre_quant: Optional[int] = None
    gre_aw: Optional[float] = None
    toefl: Optional[int] = None
    ielts: Optional[float] = None
    research_pubs: Optional[int] = None
    research_years: Optional[int] = None
    research_mentions: List[str] = Field(default_factory=list)
    is_international: bool = False
    undergrad_institution: Optional[str] = None


class DataPoint(BaseModel):
    """Single admission data point collected from GradCafe"""
    data_point_id: str = Field(..., description="Unique identifier")
    university: str = Field(..., description="University name")
    program: str = Field(..., description="Program name")
    decision: str = Field(..., description="Admission decision")
    decision_method: Optional[str] = None
    season: Optional[str] = None
    decision_date: Optional[str] = None
    post_date: Optional[str] = None
    profile: DataPointProfile = Field(default_factory=DataPointProfile)
    funding: Optional[str] = None
    funding_amount: Optional[int] = None
    post_content: Optional[str] = None
    hash: str = Field(..., description="Hash for deduplication")
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    collection_job_id: Optional[str] = None
    completeness_score: float = Field(default=0.0, ge=0.0, le=1.0)
    is_verified: bool = False
    quality_flags: List[str] = Field(default_factory=list)


class CollectionStatistics(BaseModel):
    """Statistics for a collection job or overall collection"""
    total_records: int = 0
    new_records: int = 0
    duplicate_records: int = 0
    records_by_decision: Dict[str, int] = Field(default_factory=dict)
    records_by_university: Dict[str, int] = Field(default_factory=dict)
    records_by_program: Dict[str, int] = Field(default_factory=dict)
    average_completeness: float = 0.0
    high_quality_records: int = 0  # Completeness > 60%
    low_quality_records: int = 0  # Completeness < 30%
    verified_records: int = 0
    collection_errors: int = 0
    scraping_warnings: int = 0
    pages_scraped: int = 0
    rate_limit_hits: int = 0
    retry_attempts: int = 0


class CollectionJob(BaseModel):
    """Collection job definition"""
    job_id: str = Field(..., description="Unique job identifier")
    user_id: Optional[str] = None
    status: CollectionStatus = CollectionStatus.PENDING
    priority: CollectionPriority = CollectionPriority.MEDIUM
    target: CollectionTarget
    statistics: CollectionStatistics = Field(default_factory=CollectionStatistics)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    checkpoint_data: Dict[str, Any] = Field(default_factory=dict)
    progress_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    estimated_remaining_time: Optional[int] = None  # seconds
    celery_task_id: Optional[str] = None


class CollectionJobCreate(BaseModel):
    """Request model for creating a collection job"""
    programs: List[str] = Field(..., min_length=1, description="Programs to scrape")
    universities: Optional[List[str]] = Field(default=None, description="Universities to scrape (empty for all)")
    years: Optional[List[str]] = Field(default=None, description="Years to scrape")
    limit_per_program: int = Field(default=50, ge=1, le=500)
    strategy: ScrapingStrategy = Field(default=ScrapingStrategy.RECENT_DECISIONS)
    priority: CollectionPriority = Field(default=CollectionPriority.MEDIUM)


class CollectionJobUpdate(BaseModel):
    """Request model for updating a collection job"""
    status: Optional[CollectionStatus] = None
    priority: Optional[CollectionPriority] = None
    error_message: Optional[str] = None


class CollectionScheduleConfig(BaseModel):
    """Configuration for scheduled collection"""
    enabled: bool = True
    cron_expression: str = Field(default="0 3 * * *", description="Cron expression for scheduling")
    strategy: ScrapingStrategy = ScrapingStrategy.RECENT_DECISIONS
    programs: List[str] = Field(default_factory=list)
    universities: List[str] = Field(default_factory=list)
    limit_per_program: int = Field(default=50, ge=1, le=500)
    notify_on_completion: bool = True
    notify_on_error: bool = True
    notification_emails: List[str] = Field(default_factory=list)


class CollectionHistory(BaseModel):
    """Historical record of a collection run"""
    history_id: str
    job_id: str
    status: CollectionStatus
    statistics: CollectionStatistics
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: Optional[int]
    error_message: Optional[str] = None


class DataQualityCheck(BaseModel):
    """Data quality check result"""
    data_point_id: str
    is_valid: bool
    completeness_score: float
    quality_flags: List[str]
    issues: List[str] = Field(default_factory=list)


class CollectionProgressUpdate(BaseModel):
    """Real-time progress update"""
    job_id: str
    status: CollectionStatus
    progress_percentage: float
    current_operation: str
    records_collected: int
    pages_scraped: int
    errors: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class RecentDataResponse(BaseModel):
    """Response model for recent data query"""
    data_points: List[DataPoint]
    total_count: int
    page: int
    page_size: int
    filters_applied: Dict[str, Any]


class CollectionStatusResponse(BaseModel):
    """Response model for collection status"""
    job: CollectionJob
    is_running: bool
    progress: Optional[CollectionProgressUpdate] = None


class CollectionStatisticsResponse(BaseModel):
    """Response model for collection statistics"""
    overall_statistics: CollectionStatistics
    recent_jobs: List[CollectionHistory]
    collection_rate: Dict[str, int]  # records per day/week/month
    success_rate_by_university: Dict[str, float]
    profile_completeness_distribution: Dict[str, int]
    data_quality_summary: Dict[str, Any]


class ExportDataRequest(BaseModel):
    """Request model for exporting collected data"""
    format: str = Field(default="json", pattern="^(json|csv)$")
    filters: Dict[str, Any] = Field(default_factory=dict)
    include_low_quality: bool = False
    limit: Optional[int] = None


class TriggerCollectionRequest(BaseModel):
    """Request model for manually triggering collection"""
    programs: List[str] = Field(..., min_length=1)
    universities: Optional[List[str]] = None
    years: Optional[List[str]] = None
    limit_per_program: int = Field(default=50, ge=1, le=500)
    strategy: ScrapingStrategy = Field(default=ScrapingStrategy.RECENT_DECISIONS)
    run_async: bool = Field(default=True, description="Run in background")
