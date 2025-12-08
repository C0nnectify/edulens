"""Research Agent API Endpoints"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
import logging
from app.models.schemas import ResearchQuery, ProfessorSearch, TravelPlan, StudyAbroadPlan, APIResponse
from app.tasks.research_tasks import deep_research_task, find_professors_task, analyze_travel_costs_task, create_study_abroad_plan_task

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/deep-research")
async def deep_research(request: ResearchQuery, background_tasks: BackgroundTasks):
    """Initiate deep research on a topic"""
    try:
        task = deep_research_task.delay(request.user_id, request.query, request.research_type)
        return APIResponse(success=True, message="Deep research initiated", data={"task_id": task.id, "query": request.query})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/find-professors")
async def find_professors(request: ProfessorSearch, background_tasks: BackgroundTasks):
    """Find professors/seniors using LinkedIn"""
    try:
        task = find_professors_task.delay(request.user_id, request.university, request.field_of_study)
        return APIResponse(success=True, message="Professor search initiated", data={"task_id": task.id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/travel-plan")
async def plan_travel(request: TravelPlan, background_tasks: BackgroundTasks):
    """Create travel plan and cost analysis"""
    try:
        task = analyze_travel_costs_task.delay(request.user_id, request.destination, request.duration, request.budget)
        return APIResponse(success=True, message="Travel analysis initiated", data={"task_id": task.id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/study-abroad-plan")
async def create_plan(request: StudyAbroadPlan, background_tasks: BackgroundTasks):
    """Create comprehensive study abroad plan"""
    try:
        task = create_study_abroad_plan_task.delay(request.user_id, request.target_country, request.program_type, request.budget)
        return APIResponse(success=True, message="Study abroad plan creation initiated", data={"task_id": task.id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """Get status of a research task"""
    from celery.result import AsyncResult
    try:
        task = AsyncResult(task_id)
        return APIResponse(success=True, message="Task status retrieved", data={"task_id": task_id, "status": task.status, "result": task.result if task.ready() else None})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
