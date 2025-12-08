"""
Celery tasks module
"""

from .training_tasks import (
    train_model_task,
    evaluate_model_task,
    scheduled_training_check
)

from .gradcafe_tasks import (
    collect_gradcafe_data,
    scheduled_daily_collection,
    seasonal_collection,
    collect_by_university,
    update_collection_statistics,
    check_data_quality,
    cleanup_old_jobs
)

__all__ = [
    "train_model_task",
    "evaluate_model_task",
    "scheduled_training_check",
    "collect_gradcafe_data",
    "scheduled_daily_collection",
    "seasonal_collection",
    "collect_by_university",
    "update_collection_statistics",
    "check_data_quality",
    "cleanup_old_jobs"
]
