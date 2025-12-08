"""
Celery Tasks for ML Model Training

Handles async training, scheduled retraining, and evaluation tasks
"""

from celery import shared_task
from celery.schedules import crontab
from typing import Dict, Any, List, Optional
import logging
import asyncio
from datetime import datetime, timedelta
import traceback

from app.services.model_training_service import model_training_service
from app.models.model_training import (
    TrainingConfig,
    TrainingJob,
    TrainingStatus,
    AlgorithmType,
    TrainingTrigger
)
from app.database.mongodb import get_database

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async functions in sync Celery tasks"""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)
    except Exception as e:
        logger.error(f"Error running async function: {e}")
        raise


@shared_task(
    name="app.tasks.training_tasks.train_model",
    bind=True,
    max_retries=3,
    soft_time_limit=7200,  # 2 hours
    time_limit=7400
)
def train_model_task(self, config_dict: Dict[str, Any], job_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Train admission prediction model(s)

    Args:
        config_dict: Training configuration dictionary
        job_id: Optional job ID for tracking

    Returns:
        Dictionary with training results
    """
    try:
        logger.info(f"Starting model training job: {job_id}")

        # Parse config
        config = TrainingConfig(**config_dict)

        # Create or update job
        if not job_id:
            job_id = f"job_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

        job = TrainingJob(
            job_id=job_id,
            status=TrainingStatus.RUNNING,
            config=config,
            started_at=datetime.utcnow(),
            current_step="Initializing training"
        )

        # Save job
        run_async(_save_training_job(job))

        # Validate data quality
        logger.info("Validating data quality...")
        job.current_step = "Validating data quality"
        job.progress_percentage = 10.0
        run_async(_update_training_job(job))

        quality_report = run_async(model_training_service.validate_data_quality(config))

        if not quality_report.passes_quality_check:
            error_msg = f"Data quality check failed: {', '.join(quality_report.quality_issues)}"
            logger.error(error_msg)
            job.status = TrainingStatus.FAILED
            job.error_message = error_msg
            job.completed_at = datetime.utcnow()
            run_async(_update_training_job(job))
            return {"success": False, "error": error_msg, "job_id": job_id}

        # Train models
        logger.info(f"Training {len(config.algorithms)} algorithm(s)...")
        job.current_step = "Training models"
        job.progress_percentage = 30.0
        run_async(_update_training_job(job))

        model_versions = run_async(model_training_service.train_models(config, job_id))

        # Update job with results
        job.trained_models = [mv.model_id for mv in model_versions]

        # Find best model
        best_model = max(model_versions, key=lambda m: m.metrics.f1_score)
        job.best_model_id = best_model.model_id
        job.best_score = best_model.metrics.f1_score

        # Complete job
        job.status = TrainingStatus.COMPLETED
        job.progress_percentage = 100.0
        job.completed_at = datetime.utcnow()
        job.current_step = "Training completed"

        run_async(_update_training_job(job))

        logger.info(
            f"Training completed successfully. Best model: {best_model.model_id} "
            f"(F1: {best_model.metrics.f1_score:.3f})"
        )

        # Send notification email if configured
        try:
            run_async(_send_training_completion_notification(job, model_versions))
        except Exception as e:
            logger.warning(f"Failed to send notification email: {e}")

        return {
            "success": True,
            "job_id": job_id,
            "trained_models": job.trained_models,
            "best_model_id": job.best_model_id,
            "best_score": float(job.best_score)
        }

    except Exception as e:
        error_msg = f"Training failed: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)

        # Update job status
        if job_id:
            try:
                job = run_async(model_training_service.get_training_job(job_id))
                if job:
                    job.status = TrainingStatus.FAILED
                    job.error_message = str(e)
                    job.completed_at = datetime.utcnow()
                    run_async(_update_training_job(job))
            except Exception as update_error:
                logger.error(f"Failed to update job status: {update_error}")

        # Retry if possible
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=300)  # Retry after 5 minutes

        return {
            "success": False,
            "error": str(e),
            "job_id": job_id
        }


@shared_task(
    name="app.tasks.training_tasks.evaluate_model",
    soft_time_limit=600,  # 10 minutes
    time_limit=660
)
def evaluate_model_task(model_id: str, generate_plots: bool = True) -> Dict[str, Any]:
    """
    Evaluate a trained model

    Args:
        model_id: Model ID to evaluate
        generate_plots: Whether to generate visualization plots

    Returns:
        Dictionary with evaluation results
    """
    try:
        logger.info(f"Evaluating model: {model_id}")

        evaluation = run_async(
            model_training_service.evaluate_model(model_id, generate_plots)
        )

        return {
            "success": True,
            "model_id": model_id,
            "metrics": {
                "accuracy": evaluation.metrics.accuracy,
                "precision": evaluation.metrics.precision,
                "recall": evaluation.metrics.recall,
                "f1_score": evaluation.metrics.f1_score,
                "auc_roc": evaluation.metrics.auc_roc
            },
            "plots": {
                "confusion_matrix": evaluation.confusion_matrix_plot,
                "roc_curve": evaluation.roc_curve_plot,
                "feature_importance": evaluation.feature_importance_plot,
                "calibration": evaluation.calibration_plot
            }
        }

    except Exception as e:
        error_msg = f"Evaluation failed: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "model_id": model_id
        }


@shared_task(name="app.tasks.training_tasks.scheduled_training_check")
def scheduled_training_check() -> Dict[str, Any]:
    """
    Scheduled task to check if retraining is needed

    Runs weekly (Sunday 1 AM) to check:
    - Number of new data points since last training
    - Current model performance
    - Data quality

    Triggers training if conditions are met
    """
    try:
        logger.info("Running scheduled training check...")

        # Check if sufficient new data
        db = get_database()
        models_collection = db["ml_models"]

        # Get latest trained model
        latest_model = run_async(
            models_collection.find_one(
                {"is_active": True},
                sort=[("training_date", -1)]
            )
        )

        if not latest_model:
            logger.info("No existing model found. Triggering initial training.")
            return _trigger_training("scheduled", "Initial model training")

        last_training_date = latest_model.get("training_date")
        last_training_samples = latest_model.get("training_samples", 0)

        # Count current data points
        data_collection = db["admission_data"]
        current_samples = run_async(
            data_collection.count_documents({"verified": True})
        )

        new_samples = current_samples - last_training_samples

        logger.info(
            f"Last training: {last_training_date} with {last_training_samples} samples. "
            f"Current: {current_samples} samples ({new_samples} new)"
        )

        # Check if retraining threshold met
        if new_samples >= 1000:
            logger.info(f"Triggering training: {new_samples} new samples available")
            return _trigger_training(
                "data_threshold",
                f"{new_samples} new samples since last training"
            )

        # Check model age (retrain if >3 months old)
        if last_training_date:
            age_days = (datetime.utcnow() - last_training_date).days
            if age_days > 90:
                logger.info(f"Triggering training: model is {age_days} days old")
                return _trigger_training(
                    "scheduled",
                    f"Model is {age_days} days old, scheduled refresh"
                )

        logger.info("No retraining needed at this time")
        return {
            "success": True,
            "training_triggered": False,
            "reason": "No retraining conditions met",
            "new_samples": new_samples,
            "current_samples": current_samples
        }

    except Exception as e:
        error_msg = f"Scheduled training check failed: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def _trigger_training(trigger_type: str, reason: str) -> Dict[str, Any]:
    """Trigger a new training job"""
    try:
        # Create default training config
        config = TrainingConfig(
            algorithms=[
                AlgorithmType.RANDOM_FOREST,
                AlgorithmType.XGBOOST,
                AlgorithmType.GRADIENT_BOOSTING
            ],
            version_tag=f"auto_{datetime.utcnow().strftime('%Y%m%d')}",
            notes=f"Automated training triggered by {trigger_type}: {reason}"
        )

        # Create job ID
        job_id = f"job_auto_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

        # Save trigger event
        trigger = TrainingTrigger(
            trigger_type=trigger_type,
            reason=reason
        )
        run_async(_save_training_trigger(trigger))

        # Start training task
        train_model_task.apply_async(
            kwargs={
                "config_dict": config.model_dump(),
                "job_id": job_id
            }
        )

        logger.info(f"Training job queued: {job_id}")

        return {
            "success": True,
            "training_triggered": True,
            "job_id": job_id,
            "trigger_type": trigger_type,
            "reason": reason
        }

    except Exception as e:
        logger.error(f"Failed to trigger training: {e}", exc_info=True)
        return {
            "success": False,
            "training_triggered": False,
            "error": str(e)
        }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _save_training_job(job: TrainingJob) -> None:
    """Save training job to database"""
    db = get_database()
    collection = db["training_jobs"]

    doc = job.model_dump()
    doc["_id"] = job.job_id

    await collection.insert_one(doc)


async def _update_training_job(job: TrainingJob) -> None:
    """Update training job in database"""
    db = get_database()
    collection = db["training_jobs"]

    doc = job.model_dump()
    doc.pop("_id", None)  # Remove _id to avoid update errors

    await collection.update_one(
        {"_id": job.job_id},
        {"$set": doc},
        upsert=True
    )


async def _save_training_trigger(trigger: TrainingTrigger) -> None:
    """Save training trigger event"""
    db = get_database()
    collection = db["training_triggers"]

    doc = trigger.model_dump()
    await collection.insert_one(doc)


async def _send_training_completion_notification(
    job: TrainingJob,
    model_versions: List
) -> None:
    """Send email notification on training completion"""
    # Import here to avoid circular dependency
    from app.tasks.email_tasks import send_email_task

    if not model_versions:
        return

    best_model = max(model_versions, key=lambda m: m.metrics.f1_score)

    subject = f"Model Training Completed: {job.job_id}"

    body = f"""
Model Training Completed Successfully

Job ID: {job.job_id}
Status: {job.status.value}
Started: {job.started_at}
Completed: {job.completed_at}
Duration: {(job.completed_at - job.started_at).total_seconds() / 60:.1f} minutes

Models Trained: {len(model_versions)}
Algorithms: {', '.join([mv.algorithm.value for mv in model_versions])}

Best Model:
- ID: {best_model.model_id}
- Algorithm: {best_model.algorithm.value}
- Accuracy: {best_model.metrics.accuracy:.3f}
- Precision: {best_model.metrics.precision:.3f}
- Recall: {best_model.metrics.recall:.3f}
- F1 Score: {best_model.metrics.f1_score:.3f}
- AUC-ROC: {best_model.metrics.auc_roc:.3f}

Training Samples: {best_model.training_samples}

Top 5 Important Features:
"""
    for i, fi in enumerate(best_model.feature_importance[:5], 1):
        body += f"{i}. {fi.feature_name}: {fi.importance_score:.3f}\n"

    body += """

Next Steps:
1. Review model performance metrics
2. Evaluate model on test cases
3. Activate model if performance is satisfactory

Dashboard: http://localhost:8000/docs
"""

    html_body = f"""
<html>
<body>
<h2>Model Training Completed Successfully</h2>

<h3>Job Details</h3>
<ul>
    <li><strong>Job ID:</strong> {job.job_id}</li>
    <li><strong>Status:</strong> {job.status.value}</li>
    <li><strong>Duration:</strong> {(job.completed_at - job.started_at).total_seconds() / 60:.1f} minutes</li>
</ul>

<h3>Best Model Performance</h3>
<table border="1" cellpadding="5" cellspacing="0">
    <tr><th>Metric</th><th>Score</th></tr>
    <tr><td>Accuracy</td><td>{best_model.metrics.accuracy:.3f}</td></tr>
    <tr><td>Precision</td><td>{best_model.metrics.precision:.3f}</td></tr>
    <tr><td>Recall</td><td>{best_model.metrics.recall:.3f}</td></tr>
    <tr><td>F1 Score</td><td>{best_model.metrics.f1_score:.3f}</td></tr>
    <tr><td>AUC-ROC</td><td>{best_model.metrics.auc_roc:.3f}</td></tr>
</table>

<h3>Top 5 Important Features</h3>
<ol>
"""
    for fi in best_model.feature_importance[:5]:
        html_body += f"<li>{fi.feature_name}: {fi.importance_score:.3f}</li>\n"

    html_body += """
</ol>

<p><a href="http://localhost:8000/docs">View Full Results in Dashboard</a></p>
</body>
</html>
"""

    # Get notification emails from config (if configured)
    notification_emails = ["admin@edulens.com"]  # Default, should be from config

    # Send async
    send_email_task.apply_async(
        kwargs={
            "to_emails": notification_emails,
            "subject": subject,
            "body": body,
            "html_body": html_body
        }
    )


# ============================================================================
# CELERY BEAT SCHEDULE (for periodic tasks)
# ============================================================================

def setup_periodic_tasks(sender, **kwargs):
    """Setup periodic training tasks"""
    # Weekly training check: Sunday 1 AM
    sender.add_periodic_task(
        crontab(day_of_week=0, hour=1, minute=0),
        scheduled_training_check.s(),
        name="weekly-training-check"
    )

    logger.info("Periodic training tasks configured")


# Register with Celery beat
# This should be called from celery.py or main app
