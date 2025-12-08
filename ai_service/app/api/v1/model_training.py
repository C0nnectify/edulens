"""
API Routes for ML Model Training

Endpoints for model training, evaluation, and management
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import List, Optional
from datetime import datetime

from app.models.model_training import (
    TrainingConfig,
    TrainingJob,
    TrainingStatus,
    ModelVersion,
    EvaluationResults,
    ModelComparisonRequest,
    ModelComparisonResponse,
    ModelActivationRequest,
    DataQualityReport,
    ScheduledTrainingConfig
)
from app.services.model_training_service import model_training_service
from app.tasks.training_tasks import train_model_task, evaluate_model_task
from app.utils.logger import logger

router = APIRouter(prefix="/model-training", tags=["Model Training"])


# ============================================================================
# TRAINING ENDPOINTS
# ============================================================================

@router.post("/train", response_model=dict, status_code=202)
async def start_training(
    config: TrainingConfig,
    background_tasks: BackgroundTasks
) -> dict:
    """
    Start a new model training job

    This endpoint queues a training job and returns immediately.
    Use the job ID to check training status and results.

    Args:
        config: Training configuration
        background_tasks: FastAPI background tasks

    Returns:
        Job information including job_id for tracking

    Example:
        ```json
        {
            "algorithms": ["random_forest", "xgboost"],
            "min_samples": 1000,
            "hyperparameter_tuning": "random_search",
            "cross_validation_folds": 5,
            "target_metric": "f1_score",
            "version_tag": "v2.0",
            "notes": "Training with updated dataset"
        }
        ```
    """
    try:
        # Validate data quality first
        quality_report = await model_training_service.validate_data_quality(config)

        if not quality_report.passes_quality_check:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Data quality check failed",
                    "issues": quality_report.quality_issues,
                    "recommendations": quality_report.recommendations,
                    "report": quality_report.model_dump()
                }
            )

        # Generate job ID
        job_id = f"job_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

        # Queue training task
        train_model_task.apply_async(
            kwargs={
                "config_dict": config.model_dump(),
                "job_id": job_id
            }
        )

        logger.info(f"Training job queued: {job_id}")

        return {
            "success": True,
            "message": "Training job started",
            "job_id": job_id,
            "status": "queued",
            "estimated_time_minutes": 30  # Rough estimate
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start training: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start training: {str(e)}")


@router.get("/jobs/{job_id}", response_model=TrainingJob)
async def get_training_job(job_id: str) -> TrainingJob:
    """
    Get training job status and details

    Args:
        job_id: Training job ID

    Returns:
        Training job with current status, progress, and results
    """
    try:
        job = await model_training_service.get_training_job(job_id)

        if not job:
            raise HTTPException(status_code=404, detail=f"Training job not found: {job_id}")

        return job

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get training job: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs", response_model=List[TrainingJob])
async def list_training_jobs(
    limit: int = Query(50, ge=1, le=200, description="Maximum number of jobs to return"),
    status: Optional[TrainingStatus] = Query(None, description="Filter by status")
) -> List[TrainingJob]:
    """
    List training jobs

    Args:
        limit: Maximum number of jobs to return
        status: Optional status filter

    Returns:
        List of training jobs, sorted by creation date (newest first)
    """
    try:
        jobs = await model_training_service.list_training_jobs(limit=limit, status=status)
        return jobs

    except Exception as e:
        logger.error(f"Failed to list training jobs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# EVALUATION ENDPOINTS
# ============================================================================

@router.post("/evaluate/{model_id}", response_model=dict, status_code=202)
async def evaluate_model(
    model_id: str,
    generate_plots: bool = Query(True, description="Generate visualization plots")
) -> dict:
    """
    Evaluate a trained model

    This endpoint queues an evaluation task and returns immediately.
    The evaluation includes:
    - Performance metrics (accuracy, precision, recall, F1, AUC-ROC)
    - Confusion matrix
    - ROC curves
    - Feature importance
    - Calibration curves

    Args:
        model_id: Model ID to evaluate
        generate_plots: Whether to generate visualization plots

    Returns:
        Task information
    """
    try:
        # Verify model exists
        models = await model_training_service.list_model_versions(limit=1000)
        if not any(m.model_id == model_id for m in models):
            raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")

        # Queue evaluation task
        task = evaluate_model_task.apply_async(
            kwargs={
                "model_id": model_id,
                "generate_plots": generate_plots
            }
        )

        return {
            "success": True,
            "message": "Evaluation started",
            "task_id": task.id,
            "model_id": model_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start evaluation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/evaluate/{model_id}/results", response_model=EvaluationResults)
async def get_evaluation_results(model_id: str) -> EvaluationResults:
    """
    Get evaluation results for a model

    Args:
        model_id: Model ID

    Returns:
        Evaluation results with metrics and plots
    """
    try:
        results = await model_training_service.evaluate_model(model_id, generate_plots=True)
        return results

    except Exception as e:
        logger.error(f"Failed to get evaluation results: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MODEL MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/models", response_model=List[ModelVersion])
async def list_models(
    limit: int = Query(50, ge=1, le=200, description="Maximum number of models to return"),
    active_only: bool = Query(False, description="Return only active models")
) -> List[ModelVersion]:
    """
    List trained model versions

    Args:
        limit: Maximum number of models to return
        active_only: Return only active models

    Returns:
        List of model versions, sorted by training date (newest first)
    """
    try:
        models = await model_training_service.list_model_versions(
            limit=limit,
            active_only=active_only
        )
        return models

    except Exception as e:
        logger.error(f"Failed to list models: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/{model_id}", response_model=ModelVersion)
async def get_model(model_id: str) -> ModelVersion:
    """
    Get model version details

    Args:
        model_id: Model ID

    Returns:
        Model version with metadata, metrics, and configuration
    """
    try:
        models = await model_training_service.list_model_versions(limit=1000)
        model = next((m for m in models if m.model_id == model_id), None)

        if not model:
            raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")

        return model

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/activate/{model_id}", response_model=ModelVersion)
async def activate_model(model_id: str, request: ModelActivationRequest) -> ModelVersion:
    """
    Activate a model version

    This sets the specified model as the active model for predictions.
    Only one model can be active at a time.

    Args:
        model_id: Model ID to activate
        request: Activation request with optional reason

    Returns:
        Activated model version
    """
    try:
        model = await model_training_service.activate_model(model_id, request.reason)
        logger.info(f"Model activated: {model_id}")
        return model

    except Exception as e:
        logger.error(f"Failed to activate model: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare", response_model=ModelComparisonResponse)
async def compare_models(request: ModelComparisonRequest) -> ModelComparisonResponse:
    """
    Compare multiple model versions

    Compares performance metrics across multiple models to identify
    the best performing model.

    Args:
        request: Comparison request with model IDs and metrics

    Returns:
        Comparison results with metrics and best model

    Example:
        ```json
        {
            "model_ids": ["model_rf_abc123", "model_xgb_def456"],
            "metrics": ["accuracy", "f1_score", "auc_roc"],
            "include_visualizations": true
        }
        ```
    """
    try:
        comparison = await model_training_service.compare_models(
            request.model_ids,
            request.metrics
        )
        return comparison

    except Exception as e:
        logger.error(f"Failed to compare models: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/{model_id}", response_model=dict)
async def get_model_metrics(model_id: str) -> dict:
    """
    Get model performance metrics

    Args:
        model_id: Model ID

    Returns:
        Dictionary of performance metrics
    """
    try:
        models = await model_training_service.list_model_versions(limit=1000)
        model = next((m for m in models if m.model_id == model_id), None)

        if not model:
            raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")

        return {
            "model_id": model_id,
            "algorithm": model.algorithm,
            "training_date": model.training_date,
            "metrics": {
                "accuracy": model.metrics.accuracy,
                "precision": model.metrics.precision,
                "recall": model.metrics.recall,
                "f1_score": model.metrics.f1_score,
                "auc_roc": model.metrics.auc_roc,
                "cv_mean": model.metrics.cv_mean,
                "cv_std": model.metrics.cv_std
            },
            "confusion_matrix": model.metrics.confusion_matrix,
            "training_time_seconds": model.metrics.training_time_seconds
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feature-importance/{model_id}", response_model=dict)
async def get_feature_importance(model_id: str) -> dict:
    """
    Get feature importance for a model

    Args:
        model_id: Model ID

    Returns:
        Dictionary with feature importance rankings
    """
    try:
        models = await model_training_service.list_model_versions(limit=1000)
        model = next((m for m in models if m.model_id == model_id), None)

        if not model:
            raise HTTPException(status_code=404, detail=f"Model not found: {model_id}")

        return {
            "model_id": model_id,
            "algorithm": model.algorithm,
            "feature_importance": [
                {
                    "feature": fi.feature_name,
                    "importance": fi.importance_score,
                    "rank": fi.rank
                }
                for fi in model.feature_importance
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get feature importance: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DATA QUALITY ENDPOINTS
# ============================================================================

@router.post("/data-quality", response_model=DataQualityReport)
async def check_data_quality(config: TrainingConfig) -> DataQualityReport:
    """
    Validate data quality for training

    Checks:
    - Sufficient sample size
    - Class balance
    - Feature completeness
    - Data freshness
    - University coverage

    Args:
        config: Training configuration

    Returns:
        Data quality report with issues and recommendations
    """
    try:
        report = await model_training_service.validate_data_quality(config)
        return report

    except Exception as e:
        logger.error(f"Failed to check data quality: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/status", response_model=dict)
async def get_training_status() -> dict:
    """
    Get overall training system status

    Returns:
        System status with model counts, active jobs, etc.
    """
    try:
        # Get model statistics
        all_models = await model_training_service.list_model_versions(limit=1000)
        active_models = [m for m in all_models if m.is_active]

        # Get job statistics
        all_jobs = await model_training_service.list_training_jobs(limit=1000)
        running_jobs = [j for j in all_jobs if j.status == TrainingStatus.RUNNING]
        pending_jobs = [j for j in all_jobs if j.status == TrainingStatus.PENDING]
        completed_jobs = [j for j in all_jobs if j.status == TrainingStatus.COMPLETED]
        failed_jobs = [j for j in all_jobs if j.status == TrainingStatus.FAILED]

        return {
            "status": "operational",
            "models": {
                "total": len(all_models),
                "active": len(active_models),
                "active_model_id": active_models[0].model_id if active_models else None
            },
            "jobs": {
                "running": len(running_jobs),
                "pending": len(pending_jobs),
                "completed": len(completed_jobs),
                "failed": len(failed_jobs)
            },
            "latest_model": {
                "model_id": all_models[0].model_id if all_models else None,
                "algorithm": all_models[0].algorithm if all_models else None,
                "training_date": all_models[0].training_date if all_models else None,
                "f1_score": all_models[0].metrics.f1_score if all_models else None
            } if all_models else None
        }

    except Exception as e:
        logger.error(f"Failed to get training status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/jobs/{job_id}", response_model=dict)
async def cancel_training_job(job_id: str) -> dict:
    """
    Cancel a running training job

    Note: This only marks the job as cancelled in the database.
    The actual Celery task may continue running until it checks the status.

    Args:
        job_id: Training job ID

    Returns:
        Confirmation message
    """
    try:
        job = await model_training_service.get_training_job(job_id)

        if not job:
            raise HTTPException(status_code=404, detail=f"Training job not found: {job_id}")

        if job.status in [TrainingStatus.COMPLETED, TrainingStatus.FAILED, TrainingStatus.CANCELLED]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel job with status: {job.status.value}"
            )

        # Update job status
        job.status = TrainingStatus.CANCELLED
        job.completed_at = datetime.utcnow()

        # Save to database
        from app.database.mongodb import get_database
        db = get_database()
        collection = db["training_jobs"]
        await collection.update_one(
            {"_id": job_id},
            {"$set": job.model_dump()}
        )

        logger.info(f"Training job cancelled: {job_id}")

        return {
            "success": True,
            "message": "Training job cancelled",
            "job_id": job_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel job: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
