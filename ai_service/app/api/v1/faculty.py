"""
Faculty matching and scraping endpoints for program-faculty research matching
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from app.api.dependencies import get_current_user_id
from app.models.faculty import (
    FacultyMatchRequest,
    FacultyMatchResponse,
    FacultyInfo,
    BulkFacultyUpload,
    FacultyStatus,
    FacultyScrapeRequest,
    FacultyScrapeResponse,
    FacultySearchByAreaRequest,
    FacultySearchByAreaResponse,
    FacultyQueryRequest,
    FacultyStatistics,
    BatchScrapeRequest,
    BatchScrapeResponse,
)
from app.services.faculty_matching_service import FacultyMatchingService
from app.services.faculty_scraping_service import faculty_scraping_service
from app.utils.logger import logger

router = APIRouter(prefix="/faculty", tags=["Faculty Matching & Scraping"])


@router.post("/match", response_model=FacultyMatchResponse)
async def match_faculty(
    request: FacultyMatchRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Match faculty based on student research interests

    This endpoint performs semantic and/or keyword-based matching to find faculty
    whose research aligns with the student's interests.

    Args:
        request: FacultyMatchRequest with research interests and filters
        user_id: Authenticated user ID

    Returns:
        FacultyMatchResponse with matched faculty ranked by relevance
    """
    try:
        service = FacultyMatchingService()
        results = await service.match_faculty(request)

        logger.info(
            f"Faculty matching completed for user {user_id}: "
            f"{results.total_matches} matches across "
            f"{len(results.matches_by_university)} universities"
        )

        return results

    except Exception as e:
        logger.error(f"Error performing faculty matching: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-upload", response_model=dict)
async def bulk_upload_faculty(
    upload: BulkFacultyUpload,
    user_id: str = Depends(get_current_user_id),
):
    """
    Bulk upload faculty members

    This endpoint allows administrators to upload multiple faculty profiles at once.
    Embeddings are automatically generated for semantic matching.

    Args:
        upload: BulkFacultyUpload with list of faculty members
        user_id: Authenticated user ID

    Returns:
        Status message with count of successfully uploaded faculty
    """
    try:
        service = FacultyMatchingService()

        # Validate all faculty belong to specified university
        for faculty in upload.faculty_members:
            if faculty.university != upload.university:
                raise HTTPException(
                    status_code=400,
                    detail=f"Faculty {faculty.name} has mismatched university"
                )

        count = await service.bulk_add_faculty(
            upload.faculty_members,
            generate_embeddings=True
        )

        logger.info(
            f"Bulk uploaded {count} faculty members for {upload.university} "
            f"by user {user_id}"
        )

        return {
            "success": True,
            "university": upload.university,
            "uploaded_count": count,
            "total_count": len(upload.faculty_members),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error bulk uploading faculty: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add", response_model=dict)
async def add_faculty(
    faculty: FacultyInfo,
    user_id: str = Depends(get_current_user_id),
):
    """
    Add a single faculty member

    Args:
        faculty: FacultyInfo object with faculty details
        user_id: Authenticated user ID

    Returns:
        Status message with faculty ID
    """
    try:
        service = FacultyMatchingService()
        faculty_id = await service.add_faculty(faculty, generate_embedding=True)

        logger.info(f"Added faculty {faculty.name} ({faculty_id}) by user {user_id}")

        return {
            "success": True,
            "faculty_id": faculty_id,
            "name": faculty.name,
            "university": faculty.university,
        }

    except Exception as e:
        logger.error(f"Error adding faculty: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/universities", response_model=List[dict])
async def list_universities(
    user_id: str = Depends(get_current_user_id),
):
    """
    Get list of universities with faculty count

    Args:
        user_id: Authenticated user ID

    Returns:
        List of universities with faculty counts
    """
    try:
        service = FacultyMatchingService()

        # Aggregate universities
        pipeline = [
            {
                "$group": {
                    "_id": "$university",
                    "faculty_count": {"$sum": 1},
                    "departments": {"$addToSet": "$department"},
                }
            },
            {"$sort": {"faculty_count": -1}},
        ]

        cursor = service.faculty_collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)

        universities = [
            {
                "university": result["_id"],
                "faculty_count": result["faculty_count"],
                "department_count": len(result["departments"]),
                "departments": sorted(result["departments"]),
            }
            for result in results
        ]

        return universities

    except Exception as e:
        logger.error(f"Error listing universities: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/departments", response_model=List[dict])
async def list_departments(
    university: Optional[str] = Query(None, description="Filter by university"),
    user_id: str = Depends(get_current_user_id),
):
    """
    Get list of departments with faculty count

    Args:
        university: Optional university filter
        user_id: Authenticated user ID

    Returns:
        List of departments with faculty counts
    """
    try:
        service = FacultyMatchingService()

        # Build match filter
        match_filter = {}
        if university:
            match_filter["university"] = university

        # Aggregate departments
        pipeline = [
            {"$match": match_filter} if match_filter else {"$match": {}},
            {
                "$group": {
                    "_id": {
                        "university": "$university",
                        "department": "$department",
                    },
                    "faculty_count": {"$sum": 1},
                    "accepting_count": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$accepting_students", "accepting"]},
                                1,
                                0,
                            ]
                        }
                    },
                }
            },
            {"$sort": {"_id.university": 1, "_id.department": 1}},
        ]

        cursor = service.faculty_collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)

        departments = [
            {
                "university": result["_id"]["university"],
                "department": result["_id"]["department"],
                "faculty_count": result["faculty_count"],
                "accepting_count": result["accepting_count"],
            }
            for result in results
        ]

        return departments

    except Exception as e:
        logger.error(f"Error listing departments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/faculty/{faculty_id}", response_model=FacultyInfo)
async def get_faculty_details(
    faculty_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    Get detailed information about a specific faculty member

    Args:
        faculty_id: Faculty identifier
        user_id: Authenticated user ID

    Returns:
        FacultyInfo with full details
    """
    try:
        service = FacultyMatchingService()
        faculty = await service._get_faculty_info(faculty_id, include_publications=True)

        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty not found")

        return faculty

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting faculty details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/initialize-indexes")
async def initialize_indexes(
    user_id: str = Depends(get_current_user_id),
):
    """
    Initialize database indexes for faculty collections

    This should be called once during setup to create necessary indexes
    for optimal query performance.

    Args:
        user_id: Authenticated user ID

    Returns:
        Status message
    """
    try:
        service = FacultyMatchingService()
        await service.create_indexes()

        logger.info(f"Faculty indexes initialized by user {user_id}")

        return {
            "success": True,
            "message": "Faculty indexes created successfully",
        }

    except Exception as e:
        logger.error(f"Error initializing indexes: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=dict)
async def get_faculty_stats(
    user_id: str = Depends(get_current_user_id),
):
    """
    Get statistics about faculty database

    Args:
        user_id: Authenticated user ID

    Returns:
        Statistics including counts by university, department, and status
    """
    try:
        service = FacultyMatchingService()

        # Total faculty count
        total_count = await service.faculty_collection.count_documents({})

        # Count by accepting status
        accepting_count = await service.faculty_collection.count_documents(
            {"accepting_students": FacultyStatus.ACCEPTING.value}
        )

        # Count by university
        university_pipeline = [
            {"$group": {"_id": "$university", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        cursor = service.faculty_collection.aggregate(university_pipeline)
        top_universities = await cursor.to_list(length=None)

        # Count embeddings
        embeddings_count = await service.faculty_embeddings_collection.count_documents({})

        return {
            "total_faculty": total_count,
            "accepting_students": accepting_count,
            "embeddings_generated": embeddings_count,
            "top_universities": [
                {"university": u["_id"], "count": u["count"]}
                for u in top_universities
            ],
        }

    except Exception as e:
        logger.error(f"Error getting faculty stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Faculty Scraping Endpoints
# ============================================================================


@router.post("/scrape", response_model=FacultyScrapeResponse)
async def scrape_faculty_page(
    request: FacultyScrapeRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
):
    """
    Scrape faculty information from a university department page

    This endpoint uses Firecrawl to scrape faculty pages and Google Gemini AI
    to extract structured faculty data including names, research areas, publications, etc.

    Args:
        request: FacultyScrapeRequest with URL and university details
        background_tasks: FastAPI background tasks for async processing
        user_id: Authenticated user ID

    Returns:
        FacultyScrapeResponse with extracted faculty data

    Example:
        ```json
        {
            "url": "https://cs.stanford.edu/people/faculty",
            "universityId": "stanford",
            "universityName": "Stanford University",
            "department": "Computer Science",
            "useCrawl": false,
            "maxPages": 20,
            "saveToDatabase": true
        }
        ```
    """
    try:
        # Initialize service if needed
        if not faculty_scraping_service.db:
            await faculty_scraping_service.initialize()

        # Scrape and extract faculty data
        logger.info(
            f"Starting faculty scrape for {request.universityName} - {request.department}"
        )

        result = await faculty_scraping_service.scrape_and_extract_faculty(
            url=request.url,
            university_id=request.universityId,
            university_name=request.universityName,
            department=request.department,
            use_crawl=request.useCrawl,
            max_pages=request.maxPages,
        )

        # Save to database if requested
        document_id = None
        if request.saveToDatabase:
            document_id = await faculty_scraping_service.save_faculty_data(result)

        logger.info(
            f"Faculty scrape completed: {len(result['faculty'])} faculty members extracted"
        )

        return FacultyScrapeResponse(
            success=True,
            universityId=result["universityId"],
            department=result["department"],
            totalFaculty=result["totalFaculty"],
            faculty=result["faculty"],
            documentId=document_id,
            scrapedAt=result["scrapedAt"],
            message=f"Successfully scraped {result['totalFaculty']} faculty members",
            metadata=result["metadata"],
        )

    except Exception as e:
        logger.error(f"Error scraping faculty page: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to scrape faculty page: {str(e)}",
        )


@router.post("/scrape/batch", response_model=BatchScrapeResponse)
async def batch_scrape_faculty(
    request: BatchScrapeRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
):
    """
    Batch scrape faculty from multiple universities/departments

    This endpoint processes multiple faculty pages in parallel for efficiency.

    Args:
        request: BatchScrapeRequest with list of universities to scrape
        background_tasks: FastAPI background tasks
        user_id: Authenticated user ID

    Returns:
        BatchScrapeResponse with results and errors

    Example:
        ```json
        {
            "universities": [
                {
                    "url": "https://cs.stanford.edu/people",
                    "universityId": "stanford",
                    "universityName": "Stanford University",
                    "department": "Computer Science"
                },
                {
                    "url": "https://www.csail.mit.edu/people",
                    "universityId": "mit",
                    "universityName": "MIT",
                    "department": "Computer Science"
                }
            ],
            "useCrawl": false,
            "maxPages": 20,
            "saveToDatabase": true
        }
        ```
    """
    try:
        # Initialize service
        if not faculty_scraping_service.db:
            await faculty_scraping_service.initialize()

        results = []
        errors = []
        successful = 0
        failed = 0

        logger.info(f"Starting batch scrape of {len(request.universities)} universities")

        # Process each university
        for uni_config in request.universities:
            try:
                result = await faculty_scraping_service.scrape_and_extract_faculty(
                    url=uni_config["url"],
                    university_id=uni_config["universityId"],
                    university_name=uni_config["universityName"],
                    department=uni_config["department"],
                    use_crawl=request.useCrawl,
                    max_pages=request.maxPages,
                )

                # Save to database if requested
                document_id = None
                if request.saveToDatabase:
                    document_id = await faculty_scraping_service.save_faculty_data(result)

                results.append(
                    FacultyScrapeResponse(
                        success=True,
                        universityId=result["universityId"],
                        department=result["department"],
                        totalFaculty=result["totalFaculty"],
                        faculty=result["faculty"],
                        documentId=document_id,
                        scrapedAt=result["scrapedAt"],
                        message=f"Successfully scraped {result['totalFaculty']} faculty",
                        metadata=result["metadata"],
                    )
                )

                successful += 1

            except Exception as e:
                logger.error(
                    f"Error scraping {uni_config['universityName']} - {uni_config['department']}: {e}"
                )
                errors.append(
                    {
                        "university": uni_config["universityName"],
                        "department": uni_config["department"],
                        "error": str(e),
                    }
                )
                failed += 1

        logger.info(
            f"Batch scrape completed: {successful} successful, {failed} failed"
        )

        return BatchScrapeResponse(
            totalRequested=len(request.universities),
            successful=successful,
            failed=failed,
            results=results,
            errors=errors,
        )

    except Exception as e:
        logger.error(f"Error in batch scrape: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Batch scrape failed: {str(e)}",
        )


@router.post("/search/research-area", response_model=FacultySearchByAreaResponse)
async def search_faculty_by_research_area(
    request: FacultySearchByAreaRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Search for faculty by research area across all universities

    This searches the scraped faculty database to find faculty working in
    specific research areas.

    Args:
        request: FacultySearchByAreaRequest with research area and limit
        user_id: Authenticated user ID

    Returns:
        FacultySearchByAreaResponse with matching faculty

    Example:
        ```json
        {
            "researchArea": "Machine Learning",
            "limit": 50
        }
        ```
    """
    try:
        # Initialize service
        if not faculty_scraping_service.db:
            await faculty_scraping_service.initialize()

        logger.info(
            f"Searching faculty by research area: {request.researchArea}"
        )

        results = await faculty_scraping_service.search_faculty_by_research_area(
            research_area=request.researchArea,
            limit=request.limit,
        )

        return FacultySearchByAreaResponse(
            researchArea=request.researchArea,
            totalResults=len(results),
            results=results,
        )

    except Exception as e:
        logger.error(f"Error searching faculty by research area: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}",
        )


@router.post("/query", response_model=List[dict])
async def query_faculty_data(
    request: FacultyQueryRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Query faculty data for a specific university/department

    Retrieve all scraped faculty data for a given university, optionally
    filtered by department.

    Args:
        request: FacultyQueryRequest with university ID and optional department
        user_id: Authenticated user ID

    Returns:
        List of faculty database entries

    Example:
        ```json
        {
            "universityId": "stanford",
            "department": "Computer Science"
        }
        ```
    """
    try:
        # Initialize service
        if not faculty_scraping_service.db:
            await faculty_scraping_service.initialize()

        logger.info(
            f"Querying faculty data for {request.universityId}"
            + (f" - {request.department}" if request.department else "")
        )

        results = await faculty_scraping_service.get_faculty_data(
            university_id=request.universityId,
            department=request.department,
        )

        return results

    except Exception as e:
        logger.error(f"Error querying faculty data: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {str(e)}",
        )


@router.get("/scraping/statistics", response_model=FacultyStatistics)
async def get_scraping_statistics(
    user_id: str = Depends(get_current_user_id),
):
    """
    Get statistics about the scraped faculty database

    Returns comprehensive statistics including:
    - Total number of universities and faculty
    - Most common research areas
    - Database coverage metrics

    Args:
        user_id: Authenticated user ID

    Returns:
        FacultyStatistics with database metrics
    """
    try:
        # Initialize service
        if not faculty_scraping_service.db:
            await faculty_scraping_service.initialize()

        logger.info("Generating faculty database statistics")

        stats = await faculty_scraping_service.get_statistics()

        return FacultyStatistics(**stats)

    except Exception as e:
        logger.error(f"Error generating statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate statistics: {str(e)}",
        )
