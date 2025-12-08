"""
GradCafe Data Collection Service

Automated service for collecting admission data from GradCafe using the existing scraper.
Provides scheduled collection, data validation, quality checks, and statistics tracking.
"""

import asyncio
import hashlib
import json
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorCollection

from app.models.gradcafe_collection import (
    CollectionJob,
    CollectionJobCreate,
    CollectionPriority,
    CollectionStatus,
    CollectionStatistics,
    CollectionTarget,
    DataPoint,
    DataPointProfile,
    DataQualityCheck,
    ScrapingStrategy,
)
from app.database.mongodb import (
    get_database,
    get_admission_data_collection,
)
from app.config import settings

logger = logging.getLogger(__name__)


class GradCafeCollectionService:
    """Service for automated GradCafe data collection"""

    def __init__(self):
        self.scraper_module_path = Path(__file__).parent.parent.parent.parent / "train_ml"
        self.logger = logger

    def _get_collection_jobs_collection(self) -> AsyncIOMotorCollection:
        """Get collection jobs collection"""
        db = get_database()
        return db["gradcafe_collection_jobs"]

    def _get_collection_history_collection(self) -> AsyncIOMotorCollection:
        """Get collection history collection"""
        db = get_database()
        return db["gradcafe_collection_history"]

    def _get_schedule_config_collection(self) -> AsyncIOMotorCollection:
        """Get schedule config collection"""
        db = get_database()
        return db["gradcafe_schedule_config"]

    async def create_collection_job(
        self, job_request: CollectionJobCreate, user_id: Optional[str] = None
    ) -> CollectionJob:
        """
        Create a new collection job

        Args:
            job_request: Job creation request
            user_id: Optional user ID

        Returns:
            Created collection job
        """
        job_id = str(uuid4())

        target = CollectionTarget(
            programs=job_request.programs,
            universities=job_request.universities or [],
            years=job_request.years or [],
            limit_per_program=job_request.limit_per_program,
            strategy=job_request.strategy,
        )

        job = CollectionJob(
            job_id=job_id,
            user_id=user_id,
            status=CollectionStatus.PENDING,
            priority=job_request.priority,
            target=target,
        )

        # Save to database
        collection = self._get_collection_jobs_collection()
        await collection.insert_one(job.model_dump())

        self.logger.info(f"Created collection job: {job_id}")
        return job

    async def get_collection_job(self, job_id: str) -> Optional[CollectionJob]:
        """Get collection job by ID"""
        collection = self._get_collection_jobs_collection()
        job_data = await collection.find_one({"job_id": job_id})

        if job_data:
            job_data.pop("_id", None)
            return CollectionJob(**job_data)
        return None

    async def update_job_status(
        self,
        job_id: str,
        status: CollectionStatus,
        error_message: Optional[str] = None,
        statistics: Optional[CollectionStatistics] = None,
    ) -> bool:
        """Update job status"""
        collection = self._get_collection_jobs_collection()

        update_data: Dict[str, Any] = {"status": status}

        if status == CollectionStatus.RUNNING and not await self._job_has_started(job_id):
            update_data["started_at"] = datetime.utcnow()

        if status in [CollectionStatus.COMPLETED, CollectionStatus.FAILED, CollectionStatus.CANCELLED]:
            update_data["completed_at"] = datetime.utcnow()

        if error_message:
            update_data["error_message"] = error_message

        if statistics:
            update_data["statistics"] = statistics.model_dump()

        result = await collection.update_one({"job_id": job_id}, {"$set": update_data})

        return result.modified_count > 0

    async def _job_has_started(self, job_id: str) -> bool:
        """Check if job has started"""
        collection = self._get_collection_jobs_collection()
        job = await collection.find_one({"job_id": job_id, "started_at": {"$ne": None}})
        return job is not None

    async def update_job_progress(
        self, job_id: str, progress_percentage: float, checkpoint_data: Dict[str, Any]
    ) -> bool:
        """Update job progress"""
        collection = self._get_collection_jobs_collection()

        result = await collection.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "progress_percentage": progress_percentage,
                    "checkpoint_data": checkpoint_data,
                }
            },
        )

        return result.modified_count > 0

    def calculate_completeness_score(self, data_point: DataPoint) -> float:
        """
        Calculate completeness score for a data point

        Returns:
            Score between 0.0 and 1.0
        """
        fields_to_check = {
            "university": bool(data_point.university),
            "program": bool(data_point.program),
            "decision": bool(data_point.decision),
            "season": bool(data_point.season),
            "decision_date": bool(data_point.decision_date),
            "gpa": bool(data_point.profile.gpa),
            "gre_verbal": bool(data_point.profile.gre_verbal),
            "gre_quant": bool(data_point.profile.gre_quant),
            "gre_aw": bool(data_point.profile.gre_aw),
            "toefl_or_ielts": bool(data_point.profile.toefl or data_point.profile.ielts),
            "research": bool(
                data_point.profile.research_pubs
                or data_point.profile.research_years
                or data_point.profile.research_mentions
            ),
            "institution": bool(data_point.profile.undergrad_institution),
        }

        weights = {
            "university": 0.1,
            "program": 0.1,
            "decision": 0.1,
            "season": 0.05,
            "decision_date": 0.05,
            "gpa": 0.15,
            "gre_verbal": 0.1,
            "gre_quant": 0.1,
            "gre_aw": 0.05,
            "toefl_or_ielts": 0.1,
            "research": 0.05,
            "institution": 0.05,
        }

        score = sum(weights[field] for field, present in fields_to_check.items() if present)
        return round(score, 2)

    def validate_data_point(self, data_point: DataPoint) -> DataQualityCheck:
        """
        Validate data point quality

        Returns:
            Data quality check result
        """
        issues = []
        quality_flags = []

        # Check GPA range
        if data_point.profile.gpa is not None:
            if data_point.profile.gpa < 0 or data_point.profile.gpa > (data_point.profile.gpa_scale or 4.0):
                issues.append("Invalid GPA range")
                quality_flags.append("invalid_gpa")

        # Check GRE scores
        if data_point.profile.gre_verbal is not None:
            if data_point.profile.gre_verbal < 130 or data_point.profile.gre_verbal > 170:
                issues.append("Invalid GRE Verbal score")
                quality_flags.append("invalid_gre_verbal")

        if data_point.profile.gre_quant is not None:
            if data_point.profile.gre_quant < 130 or data_point.profile.gre_quant > 170:
                issues.append("Invalid GRE Quant score")
                quality_flags.append("invalid_gre_quant")

        if data_point.profile.gre_aw is not None:
            if data_point.profile.gre_aw < 0 or data_point.profile.gre_aw > 6.0:
                issues.append("Invalid GRE AW score")
                quality_flags.append("invalid_gre_aw")

        # Check TOEFL score
        if data_point.profile.toefl is not None:
            if data_point.profile.toefl < 0 or data_point.profile.toefl > 120:
                issues.append("Invalid TOEFL score")
                quality_flags.append("invalid_toefl")

        # Check IELTS score
        if data_point.profile.ielts is not None:
            if data_point.profile.ielts < 0 or data_point.profile.ielts > 9.0:
                issues.append("Invalid IELTS score")
                quality_flags.append("invalid_ielts")

        # Check for suspicious all-zero scores
        if (
            data_point.profile.gpa == 0
            and data_point.profile.gre_verbal == 0
            and data_point.profile.gre_quant == 0
        ):
            issues.append("Suspicious all-zero scores")
            quality_flags.append("suspicious_zeros")

        # Check date validity
        if data_point.decision_date and data_point.post_date:
            try:
                decision_dt = datetime.fromisoformat(data_point.decision_date)
                post_dt = datetime.fromisoformat(data_point.post_date)
                if decision_dt > post_dt:
                    issues.append("Decision date after post date")
                    quality_flags.append("invalid_dates")
            except ValueError:
                pass

        # Calculate completeness score
        completeness_score = self.calculate_completeness_score(data_point)

        # Flag low completeness
        if completeness_score < 0.3:
            quality_flags.append("low_completeness")
        elif completeness_score > 0.6:
            quality_flags.append("high_completeness")

        is_valid = len(issues) == 0

        return DataQualityCheck(
            data_point_id=data_point.data_point_id,
            is_valid=is_valid,
            completeness_score=completeness_score,
            quality_flags=quality_flags,
            issues=issues,
        )

    async def save_data_point(
        self, data_point: DataPoint, job_id: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Save data point to admission_data collection

        Returns:
            Tuple of (success, message)
        """
        # Validate data point
        quality_check = self.validate_data_point(data_point)
        data_point.completeness_score = quality_check.completeness_score
        data_point.quality_flags = quality_check.quality_flags

        if job_id:
            data_point.collection_job_id = job_id

        # Check for duplicates using hash
        collection = get_admission_data_collection()
        existing = await collection.find_one({"hash": data_point.hash})

        if existing:
            return False, "duplicate"

        # Save to database
        try:
            await collection.insert_one(data_point.model_dump())
            return True, "saved"
        except Exception as e:
            self.logger.error(f"Error saving data point: {e}")
            return False, f"error: {str(e)}"

    async def run_collection(
        self,
        job_id: str,
        programs: List[str],
        universities: Optional[List[str]] = None,
        years: Optional[List[str]] = None,
        limit_per_program: int = 50,
    ) -> Dict[str, Any]:
        """
        Run data collection using the existing GradCafe scraper

        Args:
            job_id: Collection job ID
            programs: List of programs to scrape
            universities: List of universities (None for all)
            years: List of years (None for default range)
            limit_per_program: Max results per program

        Returns:
            Collection result summary
        """
        try:
            # Update job status to running
            await self.update_job_status(job_id, CollectionStatus.RUNNING)

            # Import the scraper module
            sys.path.insert(0, str(self.scraper_module_path))
            from gradcafe_scraper import GradCafeScraper, ProfileExtractor

            # Initialize scraper
            scraper = GradCafeScraper()
            statistics = CollectionStatistics()

            # Convert scraped results to DataPoint objects
            all_data_points = []

            # Scrape data
            self.logger.info(f"Starting collection for job {job_id}")
            results = await scraper.run_scraper(
                programs=programs, universities=universities, years=years, resume=False
            )

            # Process results
            for result in results:
                # Convert to DataPoint
                profile = DataPointProfile(
                    gpa=result.get("profile", {}).get("gpa"),
                    gpa_scale=result.get("profile", {}).get("gpa_scale"),
                    gpa_normalized=result.get("profile", {}).get("gpa_normalized"),
                    gre_verbal=result.get("profile", {}).get("gre_verbal"),
                    gre_quant=result.get("profile", {}).get("gre_quant"),
                    gre_aw=result.get("profile", {}).get("gre_aw"),
                    toefl=result.get("profile", {}).get("toefl"),
                    ielts=result.get("profile", {}).get("ielts"),
                    research_pubs=result.get("profile", {}).get("research_pubs"),
                    research_years=result.get("profile", {}).get("research_years"),
                    research_mentions=result.get("profile", {}).get("research_mentions", []),
                    is_international=result.get("profile", {}).get("is_international", False),
                    undergrad_institution=result.get("profile", {}).get("undergrad_institution"),
                )

                data_point = DataPoint(
                    data_point_id=str(uuid4()),
                    university=result.get("university", ""),
                    program=result.get("program", ""),
                    decision=result.get("decision", ""),
                    decision_method=result.get("decision_method"),
                    season=result.get("season"),
                    decision_date=result.get("decision_date"),
                    post_date=result.get("post_date"),
                    profile=profile,
                    funding=result.get("funding"),
                    funding_amount=result.get("funding_amount"),
                    post_content=result.get("post_content"),
                    hash=result.get("hash", ""),
                    collection_job_id=job_id,
                )

                # Save data point
                success, message = await self.save_data_point(data_point, job_id)

                if success:
                    statistics.new_records += 1
                    all_data_points.append(data_point)

                    # Update decision count
                    decision = data_point.decision
                    statistics.records_by_decision[decision] = (
                        statistics.records_by_decision.get(decision, 0) + 1
                    )

                    # Update university count
                    university = data_point.university
                    statistics.records_by_university[university] = (
                        statistics.records_by_university.get(university, 0) + 1
                    )

                    # Update program count
                    program = data_point.program
                    statistics.records_by_program[program] = (
                        statistics.records_by_program.get(program, 0) + 1
                    )

                    # Track quality
                    if data_point.completeness_score > 0.6:
                        statistics.high_quality_records += 1
                    elif data_point.completeness_score < 0.3:
                        statistics.low_quality_records += 1

                elif message == "duplicate":
                    statistics.duplicate_records += 1
                else:
                    statistics.collection_errors += 1

            statistics.total_records = len(all_data_points)

            # Calculate average completeness
            if statistics.total_records > 0:
                statistics.average_completeness = sum(
                    dp.completeness_score for dp in all_data_points
                ) / statistics.total_records

            # Update job with final statistics
            await self.update_job_status(
                job_id, CollectionStatus.COMPLETED, statistics=statistics
            )

            # Save to history
            await self._save_to_history(job_id)

            self.logger.info(
                f"Collection job {job_id} completed: {statistics.new_records} new, "
                f"{statistics.duplicate_records} duplicates"
            )

            return {
                "job_id": job_id,
                "status": "completed",
                "statistics": statistics.model_dump(),
            }

        except Exception as e:
            error_msg = f"Collection failed: {str(e)}"
            self.logger.error(error_msg)
            await self.update_job_status(job_id, CollectionStatus.FAILED, error_message=error_msg)

            return {"job_id": job_id, "status": "failed", "error": error_msg}

    async def _save_to_history(self, job_id: str):
        """Save completed job to history"""
        job = await self.get_collection_job(job_id)
        if not job:
            return

        duration_seconds = None
        if job.started_at and job.completed_at:
            duration_seconds = int((job.completed_at - job.started_at).total_seconds())

        history_entry = {
            "history_id": str(uuid4()),
            "job_id": job_id,
            "status": job.status,
            "statistics": job.statistics.model_dump(),
            "started_at": job.started_at,
            "completed_at": job.completed_at,
            "duration_seconds": duration_seconds,
            "error_message": job.error_message,
        }

        collection = self._get_collection_history_collection()
        await collection.insert_one(history_entry)

    async def get_collection_statistics(self) -> Dict[str, Any]:
        """Get overall collection statistics"""
        collection = get_admission_data_collection()

        # Total records
        total_records = await collection.count_documents({})

        # Records by decision
        decision_pipeline = [
            {"$group": {"_id": "$decision", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        decisions = await collection.aggregate(decision_pipeline).to_list(None)
        records_by_decision = {item["_id"]: item["count"] for item in decisions}

        # Records by university (top 20)
        university_pipeline = [
            {"$group": {"_id": "$university", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 20},
        ]
        universities = await collection.aggregate(university_pipeline).to_list(None)
        records_by_university = {item["_id"]: item["count"] for item in universities}

        # Average completeness
        completeness_pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$completeness_score"}}}]
        completeness_result = await collection.aggregate(completeness_pipeline).to_list(None)
        average_completeness = completeness_result[0]["avg"] if completeness_result else 0

        # Quality distribution
        high_quality = await collection.count_documents({"completeness_score": {"$gt": 0.6}})
        low_quality = await collection.count_documents({"completeness_score": {"$lt": 0.3}})

        # Recent collection rate
        last_7_days = datetime.utcnow() - timedelta(days=7)
        last_7_days_count = await collection.count_documents({"scraped_at": {"$gte": last_7_days}})

        last_30_days = datetime.utcnow() - timedelta(days=30)
        last_30_days_count = await collection.count_documents({"scraped_at": {"$gte": last_30_days}})

        return {
            "total_records": total_records,
            "records_by_decision": records_by_decision,
            "records_by_university": records_by_university,
            "average_completeness": round(average_completeness, 2),
            "high_quality_records": high_quality,
            "low_quality_records": low_quality,
            "collection_rate": {
                "last_7_days": last_7_days_count,
                "last_30_days": last_30_days_count,
                "daily_average": round(last_7_days_count / 7, 1),
            },
        }

    async def get_recent_data(
        self,
        limit: int = 100,
        skip: int = 0,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[DataPoint]:
        """Get recent data points"""
        collection = get_admission_data_collection()

        query = filters or {}
        cursor = collection.find(query).sort("scraped_at", -1).skip(skip).limit(limit)

        data_points = []
        async for doc in cursor:
            doc.pop("_id", None)
            data_points.append(DataPoint(**doc))

        return data_points

    async def get_job_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get collection job history"""
        collection = self._get_collection_history_collection()

        cursor = collection.find({}).sort("started_at", -1).limit(limit)

        history = []
        async for doc in cursor:
            doc.pop("_id", None)
            history.append(doc)

        return history


# Global service instance
gradcafe_collection_service = GradCafeCollectionService()
