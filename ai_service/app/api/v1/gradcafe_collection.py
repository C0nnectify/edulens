"""
API endpoints for GradCafe data collection management

Provides endpoints to:
- Trigger manual collection
- Get collection status
- View collection statistics
- Manage collection schedule
- Export collected data
- View collection history
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from datetime import datetime

from app.models.gradcafe_collection import (
    CollectionJob,
    CollectionJobCreate,
    CollectionScheduleConfig,
    CollectionStatus,
    CollectionStatisticsResponse,
    CollectionStatusResponse,
    DataPoint,
    ExportDataRequest,
    RecentDataResponse,
    TriggerCollectionRequest,
)
from app.services.gradcafe_collection_service import gradcafe_collection_service
from app.tasks.gradcafe_tasks import collect_gradcafe_data

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/trigger", response_model=Dict[str, Any])
async def trigger_collection(
    request: TriggerCollectionRequest,
    background_tasks: BackgroundTasks,
) -> Dict[str, Any]:
    """
    Manually trigger a data collection job

    Args:
        request: Collection trigger request
        background_tasks: FastAPI background tasks

    Returns:
        Job creation response
    """
    try:
        logger.info(
            f"Triggering collection: programs={request.programs}, "
            f"strategy={request.strategy}"
        )

        # Create collection job
        job_request = CollectionJobCreate(
            programs=request.programs,
            universities=request.universities,
            years=request.years,
            limit_per_program=request.limit_per_program,
            strategy=request.strategy,
        )

        job = await gradcafe_collection_service.create_collection_job(job_request)

        # Run async or sync based on request
        if request.run_async:
            # Trigger Celery task
            task = collect_gradcafe_data.delay(
                programs=request.programs,
                universities=request.universities,
                years=request.years,
                limit_per_program=request.limit_per_program,
                strategy=request.strategy.value,
            )

            # Update job with celery task ID
            await gradcafe_collection_service._get_collection_jobs_collection().update_one(
                {"job_id": job.job_id}, {"$set": {"celery_task_id": task.id}}
            )

            return {
                "job_id": job.job_id,
                "celery_task_id": task.id,
                "status": "triggered",
                "message": "Collection job started in background",
            }
        else:
            # Run synchronously in background task
            background_tasks.add_task(
                gradcafe_collection_service.run_collection,
                job_id=job.job_id,
                programs=request.programs,
                universities=request.universities,
                years=request.years,
                limit_per_program=request.limit_per_program,
            )

            return {
                "job_id": job.job_id,
                "status": "started",
                "message": "Collection job started",
            }

    except Exception as e:
        logger.error(f"Failed to trigger collection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{job_id}", response_model=CollectionStatusResponse)
async def get_collection_status(job_id: str) -> CollectionStatusResponse:
    """
    Get status of a collection job

    Args:
        job_id: Collection job ID

    Returns:
        Job status and progress
    """
    try:
        job = await gradcafe_collection_service.get_collection_job(job_id)

        if not job:
            raise HTTPException(status_code=404, detail="Collection job not found")

        is_running = job.status == CollectionStatus.RUNNING

        return CollectionStatusResponse(job=job, is_running=is_running)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get collection status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics", response_model=Dict[str, Any])
async def get_collection_statistics() -> Dict[str, Any]:
    """
    Get overall collection statistics

    Returns:
        Comprehensive collection statistics
    """
    try:
        statistics = await gradcafe_collection_service.get_collection_statistics()
        return statistics

    except Exception as e:
        logger.error(f"Failed to get statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=List[Dict[str, Any]])
async def get_collection_history(
    limit: int = Query(50, ge=1, le=500, description="Max history entries to return")
) -> List[Dict[str, Any]]:
    """
    Get collection job history

    Args:
        limit: Maximum number of history entries

    Returns:
        List of historical collection jobs
    """
    try:
        history = await gradcafe_collection_service.get_job_history(limit=limit)
        return history

    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data/recent", response_model=RecentDataResponse)
async def get_recent_data(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=500, description="Results per page"),
    university: Optional[str] = Query(None, description="Filter by university"),
    program: Optional[str] = Query(None, description="Filter by program"),
    decision: Optional[str] = Query(None, description="Filter by decision"),
    min_completeness: Optional[float] = Query(
        None, ge=0.0, le=1.0, description="Minimum completeness score"
    ),
) -> RecentDataResponse:
    """
    Get recent collected data points

    Args:
        page: Page number
        page_size: Results per page
        university: Filter by university
        program: Filter by program
        decision: Filter by decision
        min_completeness: Minimum completeness score

    Returns:
        Paginated recent data
    """
    try:
        # Build filters
        filters = {}
        if university:
            filters["university"] = {"$regex": university, "$options": "i"}
        if program:
            filters["program"] = {"$regex": program, "$options": "i"}
        if decision:
            filters["decision"] = decision
        if min_completeness is not None:
            filters["completeness_score"] = {"$gte": min_completeness}

        # Calculate skip
        skip = (page - 1) * page_size

        # Get data
        data_points = await gradcafe_collection_service.get_recent_data(
            limit=page_size, skip=skip, filters=filters
        )

        # Get total count
        collection = gradcafe_collection_service._get_collection_jobs_collection()
        total_count = await collection.count_documents(filters)

        return RecentDataResponse(
            data_points=data_points,
            total_count=total_count,
            page=page,
            page_size=page_size,
            filters_applied=filters,
        )

    except Exception as e:
        logger.error(f"Failed to get recent data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/schedule", response_model=Dict[str, Any])
async def update_collection_schedule(
    config: CollectionScheduleConfig,
) -> Dict[str, Any]:
    """
    Update scheduled collection configuration

    Args:
        config: Schedule configuration

    Returns:
        Updated configuration
    """
    try:
        logger.info(f"Updating collection schedule: enabled={config.enabled}")

        # Save to database
        collection = gradcafe_collection_service._get_schedule_config_collection()

        schedule_data = config.model_dump()
        schedule_data["name"] = "daily_collection"
        schedule_data["updated_at"] = datetime.utcnow()

        await collection.update_one(
            {"name": "daily_collection"},
            {"$set": schedule_data},
            upsert=True,
        )

        return {
            "status": "success",
            "message": "Schedule configuration updated",
            "config": config.model_dump(),
        }

    except Exception as e:
        logger.error(f"Failed to update schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedule", response_model=CollectionScheduleConfig)
async def get_collection_schedule() -> CollectionScheduleConfig:
    """
    Get current scheduled collection configuration

    Returns:
        Current schedule configuration
    """
    try:
        collection = gradcafe_collection_service._get_schedule_config_collection()
        config_data = await collection.find_one({"name": "daily_collection"})

        if config_data:
            config_data.pop("_id", None)
            config_data.pop("name", None)
            config_data.pop("updated_at", None)
            return CollectionScheduleConfig(**config_data)
        else:
            # Return default configuration
            return CollectionScheduleConfig()

    except Exception as e:
        logger.error(f"Failed to get schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export", response_model=Dict[str, Any])
async def export_collected_data(
    request: ExportDataRequest,
) -> Dict[str, Any]:
    """
    Export collected data to JSON or CSV

    Args:
        request: Export request parameters

    Returns:
        Export file information
    """
    try:
        import json
        import csv
        from io import StringIO
        from pathlib import Path

        logger.info(f"Exporting data: format={request.format}")

        # Get data
        filters = request.filters.copy()
        if not request.include_low_quality:
            filters["completeness_score"] = {"$gte": 0.3}

        data_points = await gradcafe_collection_service.get_recent_data(
            limit=request.limit or 10000, skip=0, filters=filters
        )

        # Create export directory
        export_dir = Path(settings.upload_dir) / "exports"
        export_dir.mkdir(exist_ok=True, parents=True)

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"gradcafe_export_{timestamp}.{request.format}"
        filepath = export_dir / filename

        if request.format == "json":
            # Export as JSON
            export_data = [dp.model_dump() for dp in data_points]
            with open(filepath, "w") as f:
                json.dump(export_data, f, indent=2, default=str)

        elif request.format == "csv":
            # Export as CSV
            if data_points:
                with open(filepath, "w", newline="") as f:
                    # Flatten the data structure for CSV
                    fieldnames = [
                        "data_point_id",
                        "university",
                        "program",
                        "decision",
                        "season",
                        "decision_date",
                        "gpa",
                        "gre_verbal",
                        "gre_quant",
                        "gre_aw",
                        "toefl",
                        "ielts",
                        "research_pubs",
                        "is_international",
                        "funding",
                        "completeness_score",
                        "scraped_at",
                    ]

                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()

                    for dp in data_points:
                        row = {
                            "data_point_id": dp.data_point_id,
                            "university": dp.university,
                            "program": dp.program,
                            "decision": dp.decision,
                            "season": dp.season,
                            "decision_date": dp.decision_date,
                            "gpa": dp.profile.gpa,
                            "gre_verbal": dp.profile.gre_verbal,
                            "gre_quant": dp.profile.gre_quant,
                            "gre_aw": dp.profile.gre_aw,
                            "toefl": dp.profile.toefl,
                            "ielts": dp.profile.ielts,
                            "research_pubs": dp.profile.research_pubs,
                            "is_international": dp.profile.is_international,
                            "funding": dp.funding,
                            "completeness_score": dp.completeness_score,
                            "scraped_at": dp.scraped_at.isoformat(),
                        }
                        writer.writerow(row)

        return {
            "status": "success",
            "filename": filename,
            "filepath": str(filepath),
            "records_exported": len(data_points),
            "format": request.format,
        }

    except Exception as e:
        logger.error(f"Failed to export data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/job/{job_id}", response_model=Dict[str, Any])
async def cancel_collection_job(job_id: str) -> Dict[str, Any]:
    """
    Cancel a running collection job

    Args:
        job_id: Collection job ID

    Returns:
        Cancellation status
    """
    try:
        job = await gradcafe_collection_service.get_collection_job(job_id)

        if not job:
            raise HTTPException(status_code=404, detail="Collection job not found")

        if job.status not in [CollectionStatus.PENDING, CollectionStatus.RUNNING]:
            raise HTTPException(
                status_code=400, detail=f"Cannot cancel job with status: {job.status}"
            )

        # Cancel Celery task if exists
        if job.celery_task_id:
            from celery import current_app

            current_app.control.revoke(job.celery_task_id, terminate=True)

        # Update job status
        await gradcafe_collection_service.update_job_status(
            job_id, CollectionStatus.CANCELLED
        )

        logger.info(f"Cancelled collection job: {job_id}")

        return {
            "status": "success",
            "job_id": job_id,
            "message": "Collection job cancelled",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/quality", response_model=Dict[str, Any])
async def get_quality_statistics() -> Dict[str, Any]:
    """
    Get data quality statistics

    Returns:
        Quality metrics and distribution
    """
    try:
        from app.database.mongodb import get_admission_data_collection

        collection = get_admission_data_collection()

        # Completeness distribution
        pipeline = [
            {
                "$bucket": {
                    "_id": "$completeness_score",
                    "boundaries": [0, 0.3, 0.6, 0.9, 1.0],
                    "default": "other",
                    "output": {"count": {"$sum": 1}},
                }
            }
        ]

        distribution = await collection.aggregate(pipeline).to_list(None)

        # Quality flags distribution
        flags_pipeline = [
            {"$unwind": "$quality_flags"},
            {"$group": {"_id": "$quality_flags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]

        flags_dist = await collection.aggregate(flags_pipeline).to_list(None)

        return {
            "completeness_distribution": {
                "low (0-0.3)": next(
                    (item["count"] for item in distribution if item["_id"] == 0), 0
                ),
                "medium (0.3-0.6)": next(
                    (item["count"] for item in distribution if item["_id"] == 0.3), 0
                ),
                "high (0.6-0.9)": next(
                    (item["count"] for item in distribution if item["_id"] == 0.6), 0
                ),
                "excellent (0.9-1.0)": next(
                    (item["count"] for item in distribution if item["_id"] == 0.9), 0
                ),
            },
            "quality_flags": {item["_id"]: item["count"] for item in flags_dist},
        }

    except Exception as e:
        logger.error(f"Failed to get quality statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger/university/{university}", response_model=Dict[str, Any])
async def trigger_university_collection(
    university: str, limit: int = Query(100, ge=1, le=500)
) -> Dict[str, Any]:
    """
    Trigger collection for a specific university

    Args:
        university: University name
        limit: Max results to collect

    Returns:
        Trigger response
    """
    try:
        from app.tasks.gradcafe_tasks import collect_by_university

        task = collect_by_university.delay(university=university, limit=limit)

        return {
            "status": "triggered",
            "university": university,
            "celery_task_id": task.id,
            "message": f"Collection started for {university}",
        }

    except Exception as e:
        logger.error(f"Failed to trigger university collection: {e}")
        raise HTTPException(status_code=500, detail=str(e))
