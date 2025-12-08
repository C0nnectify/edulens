"""
Celery Tasks for GradCafe Data Collection

Provides automated, scheduled, and on-demand data collection from GradCafe.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from celery import shared_task
from celery.schedules import crontab

from app.models.gradcafe_collection import (
    CollectionJobCreate,
    CollectionPriority,
    ScrapingStrategy,
)
from app.services.gradcafe_collection_service import gradcafe_collection_service

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async function in sync context"""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)


@shared_task(name="app.tasks.gradcafe_tasks.collect_gradcafe_data", bind=True)
def collect_gradcafe_data(
    self,
    programs: List[str],
    universities: Optional[List[str]] = None,
    years: Optional[List[str]] = None,
    limit_per_program: int = 50,
    strategy: str = "recent_decisions",
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Automated GradCafe data collection task

    Args:
        programs: List of programs to scrape
        universities: List of universities (None for all)
        years: List of years (None for default)
        limit_per_program: Max results per program
        strategy: Scraping strategy
        user_id: Optional user ID

    Returns:
        Collection result summary
    """
    try:
        logger.info(
            f"Starting GradCafe collection: programs={programs}, "
            f"universities={universities}, limit={limit_per_program}"
        )

        # Create collection job
        job_request = CollectionJobCreate(
            programs=programs,
            universities=universities,
            years=years,
            limit_per_program=limit_per_program,
            strategy=ScrapingStrategy(strategy),
            priority=CollectionPriority.MEDIUM,
        )

        job = run_async(
            gradcafe_collection_service.create_collection_job(job_request, user_id)
        )

        # Store Celery task ID in job
        run_async(
            gradcafe_collection_service._get_collection_jobs_collection().update_one(
                {"job_id": job.job_id}, {"$set": {"celery_task_id": self.request.id}}
            )
        )

        # Run collection
        result = run_async(
            gradcafe_collection_service.run_collection(
                job_id=job.job_id,
                programs=programs,
                universities=universities,
                years=years,
                limit_per_program=limit_per_program,
            )
        )

        logger.info(f"GradCafe collection completed: {result}")

        # Send notification email if configured
        if result.get("status") == "completed":
            try:
                from app.tasks.email_tasks import send_template_email_task

                statistics = result.get("statistics", {})
                send_template_email_task.delay(
                    to_emails=["admin@edulen.com"],  # Configure from settings
                    subject="GradCafe Collection Completed",
                    template_name="gradcafe_collection_complete",
                    template_data={
                        "job_id": job.job_id,
                        "programs": ", ".join(programs),
                        "new_records": statistics.get("new_records", 0),
                        "duplicate_records": statistics.get("duplicate_records", 0),
                        "total_records": statistics.get("total_records", 0),
                        "completion_time": datetime.utcnow().isoformat(),
                    },
                )
            except Exception as e:
                logger.warning(f"Failed to send completion email: {e}")

        return result

    except Exception as e:
        error_msg = f"Collection task failed: {str(e)}"
        logger.error(error_msg)
        return {"status": "failed", "error": error_msg}


@shared_task(name="app.tasks.gradcafe_tasks.scheduled_daily_collection")
def scheduled_daily_collection() -> Dict[str, Any]:
    """
    Scheduled daily collection task
    Runs at 3 AM daily to collect recent admission data
    """
    logger.info("Starting scheduled daily GradCafe collection")

    try:
        # Get schedule configuration
        schedule_config = run_async(
            gradcafe_collection_service._get_schedule_config_collection().find_one(
                {"name": "daily_collection"}
            )
        )

        if not schedule_config or not schedule_config.get("enabled", True):
            logger.info("Scheduled collection is disabled")
            return {"status": "skipped", "reason": "disabled"}

        # Default programs to scrape
        programs = schedule_config.get("programs") or [
            "Computer Science",
            "Data Science",
            "Artificial Intelligence",
            "Machine Learning",
            "Electrical Engineering",
            "Mechanical Engineering",
            "MBA",
            "Business Administration",
        ]

        # Focus on top universities
        universities = schedule_config.get("universities") or [
            "MIT",
            "Stanford",
            "Harvard",
            "Berkeley",
            "CMU",
            "Princeton",
            "Yale",
            "Columbia",
            "Cornell",
        ]

        # Recent decisions strategy
        strategy = schedule_config.get("strategy", "recent_decisions")
        limit_per_program = schedule_config.get("limit_per_program", 50)

        # Trigger collection
        result = collect_gradcafe_data.delay(
            programs=programs,
            universities=universities,
            years=None,  # Will use default from config
            limit_per_program=limit_per_program,
            strategy=strategy,
        )

        return {
            "status": "triggered",
            "celery_task_id": result.id,
            "programs_count": len(programs),
            "universities_count": len(universities),
        }

    except Exception as e:
        error_msg = f"Scheduled collection failed: {str(e)}"
        logger.error(error_msg)
        return {"status": "failed", "error": error_msg}


@shared_task(name="app.tasks.gradcafe_tasks.seasonal_collection")
def seasonal_collection(season: str = "fall") -> Dict[str, Any]:
    """
    Seasonal collection task - more aggressive during application season

    Args:
        season: Application season (fall, spring, winter)

    Returns:
        Collection result
    """
    logger.info(f"Starting seasonal GradCafe collection for {season} season")

    try:
        # Application season runs November to April (peak season)
        # Collect more data during this period

        current_month = datetime.utcnow().month

        # Determine if it's peak season
        is_peak_season = current_month in [11, 12, 1, 2, 3, 4]

        # Adjust collection parameters based on season
        if is_peak_season:
            limit_per_program = 100
            programs = [
                "Computer Science",
                "Data Science",
                "Artificial Intelligence",
                "Machine Learning",
                "Software Engineering",
                "Electrical Engineering",
                "Mechanical Engineering",
                "Business Administration",
                "MBA",
                "Finance",
                "Marketing",
                "Data Analytics",
            ]
        else:
            limit_per_program = 50
            programs = [
                "Computer Science",
                "Data Science",
                "Artificial Intelligence",
                "MBA",
            ]

        # Trigger collection
        result = collect_gradcafe_data.delay(
            programs=programs,
            universities=None,  # All universities
            years=None,
            limit_per_program=limit_per_program,
            strategy="by_season",
        )

        return {
            "status": "triggered",
            "season": season,
            "is_peak_season": is_peak_season,
            "celery_task_id": result.id,
        }

    except Exception as e:
        error_msg = f"Seasonal collection failed: {str(e)}"
        logger.error(error_msg)
        return {"status": "failed", "error": error_msg}


@shared_task(name="app.tasks.gradcafe_tasks.collect_by_university")
def collect_by_university(university: str, limit: int = 100) -> Dict[str, Any]:
    """
    Collect data for a specific university

    Args:
        university: University name
        limit: Max results to collect

    Returns:
        Collection result
    """
    logger.info(f"Starting collection for university: {university}")

    try:
        # All major programs
        programs = [
            "Computer Science",
            "Data Science",
            "Artificial Intelligence",
            "Machine Learning",
            "Electrical Engineering",
            "Mechanical Engineering",
            "MBA",
            "Business Administration",
            "Finance",
        ]

        result = collect_gradcafe_data.delay(
            programs=programs,
            universities=[university],
            years=None,
            limit_per_program=limit,
            strategy="top_universities",
        )

        return {
            "status": "triggered",
            "university": university,
            "celery_task_id": result.id,
        }

    except Exception as e:
        error_msg = f"University collection failed: {str(e)}"
        logger.error(error_msg)
        return {"status": "failed", "error": error_msg}


@shared_task(name="app.tasks.gradcafe_tasks.update_collection_statistics")
def update_collection_statistics() -> Dict[str, Any]:
    """
    Update collection statistics
    Runs periodically to refresh statistics
    """
    logger.info("Updating GradCafe collection statistics")

    try:
        statistics = run_async(gradcafe_collection_service.get_collection_statistics())

        logger.info(
            f"Statistics updated: {statistics.get('total_records', 0)} total records"
        )

        return {"status": "success", "statistics": statistics}

    except Exception as e:
        error_msg = f"Statistics update failed: {str(e)}"
        logger.error(error_msg)
        return {"status": "failed", "error": error_msg}


@shared_task(name="app.tasks.gradcafe_tasks.check_data_quality")
def check_data_quality() -> Dict[str, Any]:
    """
    Check data quality of recent collections
    Identifies and flags low-quality data
    """
    logger.info("Checking GradCafe data quality")

    try:
        # Get recent data (last 1000 records)
        recent_data = run_async(
            gradcafe_collection_service.get_recent_data(limit=1000, skip=0)
        )

        quality_issues = []
        high_quality_count = 0
        low_quality_count = 0

        for data_point in recent_data:
            if data_point.completeness_score > 0.6:
                high_quality_count += 1
            elif data_point.completeness_score < 0.3:
                low_quality_count += 1

            if data_point.quality_flags:
                quality_issues.append(
                    {
                        "data_point_id": data_point.data_point_id,
                        "completeness": data_point.completeness_score,
                        "flags": data_point.quality_flags,
                    }
                )

        logger.info(
            f"Quality check complete: {high_quality_count} high quality, "
            f"{low_quality_count} low quality, {len(quality_issues)} issues"
        )

        return {
            "status": "success",
            "total_checked": len(recent_data),
            "high_quality_count": high_quality_count,
            "low_quality_count": low_quality_count,
            "issues_count": len(quality_issues),
            "issues": quality_issues[:50],  # Return first 50 issues
        }

    except Exception as e:
        error_msg = f"Quality check failed: {str(e)}"
        logger.error(error_msg)
        return {"status": "failed", "error": error_msg}


@shared_task(name="app.tasks.gradcafe_tasks.cleanup_old_jobs")
def cleanup_old_jobs(days: int = 30) -> Dict[str, Any]:
    """
    Cleanup old collection jobs from database

    Args:
        days: Keep jobs from last N days

    Returns:
        Cleanup result
    """
    logger.info(f"Cleaning up collection jobs older than {days} days")

    try:
        from datetime import timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        collection = gradcafe_collection_service._get_collection_jobs_collection()

        result = run_async(
            collection.delete_many(
                {
                    "completed_at": {"$lt": cutoff_date},
                    "status": {"$in": ["completed", "failed", "cancelled"]},
                }
            )
        )

        deleted_count = result.deleted_count

        logger.info(f"Cleanup complete: {deleted_count} old jobs removed")

        return {"status": "success", "deleted_count": deleted_count}

    except Exception as e:
        error_msg = f"Cleanup failed: {str(e)}"
        logger.error(error_msg)
        return {"status": "failed", "error": error_msg}


# Periodic task configuration
# These would be configured in celery beat schedule

"""
Example celery beat schedule configuration (add to celery config):

from celery.schedules import crontab

beat_schedule = {
    'gradcafe-daily-collection': {
        'task': 'app.tasks.gradcafe_tasks.scheduled_daily_collection',
        'schedule': crontab(hour=3, minute=0),  # 3 AM daily
    },
    'gradcafe-update-statistics': {
        'task': 'app.tasks.gradcafe_tasks.update_collection_statistics',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
    },
    'gradcafe-quality-check': {
        'task': 'app.tasks.gradcafe_tasks.check_data_quality',
        'schedule': crontab(hour=12, minute=0),  # Noon daily
    },
    'gradcafe-cleanup-jobs': {
        'task': 'app.tasks.gradcafe_tasks.cleanup_old_jobs',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),  # 2 AM every Sunday
    },
}
"""
