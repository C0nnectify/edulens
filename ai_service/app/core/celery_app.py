"""
Celery Application Configuration
Handles async tasks and scheduled jobs
"""

from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "edulen_ai_service",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.email_tasks",
        "app.tasks.tracker_tasks",
        "app.tasks.research_tasks",
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

# Periodic tasks configuration
celery_app.conf.beat_schedule = {
    # Check university portals every 6 hours
    "check-university-updates": {
        "task": "app.tasks.tracker_tasks.check_all_university_updates",
        "schedule": crontab(minute=0, hour="*/6"),
    },
    # Clean up old data daily at 2 AM
    "cleanup-old-data": {
        "task": "app.tasks.tracker_tasks.cleanup_old_tracking_data",
        "schedule": crontab(minute=0, hour=2),
    },
    # Send daily summary emails at 8 AM
    "send-daily-summaries": {
        "task": "app.tasks.email_tasks.send_daily_summaries",
        "schedule": crontab(minute=0, hour=8),
    },
}


if __name__ == "__main__":
    celery_app.start()
