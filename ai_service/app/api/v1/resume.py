"""
Resume Collection API Endpoints
Specialized endpoints for professional resume management
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import logging

from app.models.schemas import ResumeData, APIResponse, DocumentQuery
from app.services.vector_store_service import vector_store_service
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

router = APIRouter()

COLLECTION_TYPE = "resume"


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """
    Upload and process a resume document

    Args:
        file: Resume file (PDF, DOCX, TXT)
        user_id: User ID

    Returns:
        Upload confirmation with processing results
    """
    try:
        # Read file content
        content = await file.read()

        # Process file and create embeddings
        result = embedding_service.process_uploaded_file(
            file_content=content,
            filename=file.filename,
            user_id=user_id,
            document_type="resume"
        )

        # Add to resume collection
        texts = [chunk.page_content for chunk in result["chunks"]]
        metadatas = [chunk.metadata for chunk in result["chunks"]]

        store_result = vector_store_service.add_documents(
            user_id=user_id,
            collection_type=COLLECTION_TYPE,
            documents=texts,
            metadatas=metadatas
        )

        return APIResponse(
            success=True,
            message=f"Resume '{file.filename}' processed successfully",
            data={
                "filename": file.filename,
                "chunks": result["chunk_count"],
                **store_result
            }
        )
    except Exception as e:
        logger.error(f"Error uploading resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add")
async def add_resume_content(request: ResumeData):
    """
    Add resume content directly (text format)

    Args:
        request: Resume data with content and metadata

    Returns:
        Addition confirmation
    """
    try:
        # Create embeddings for resume content
        result = embedding_service.create_resume_embeddings(
            resume_text=request.content,
            metadata={
                **request.metadata,
                "user_id": request.user_id,
                "document_type": "resume"
            } if request.metadata else {"user_id": request.user_id, "document_type": "resume"}
        )

        # Add to resume collection
        store_result = vector_store_service.add_documents(
            user_id=request.user_id,
            collection_type=COLLECTION_TYPE,
            documents=result["chunks"],
            metadatas=[result["metadata"]] * len(result["chunks"])
        )

        return APIResponse(
            success=True,
            message="Resume content added successfully",
            data={
                "chunks": result["chunk_count"],
                **store_result
            }
        )
    except Exception as e:
        logger.error(f"Error adding resume content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def query_resume(request: DocumentQuery):
    """
    Search within resume collection

    Args:
        request: Query request

    Returns:
        Relevant resume sections
    """
    try:
        result = vector_store_service.query_documents(
            user_id=request.user_id,
            collection_type=COLLECTION_TYPE,
            query_text=request.query_text,
            n_results=request.n_results,
            where=request.where
        )

        return APIResponse(
            success=True,
            message=f"Found {result['result_count']} relevant resume sections",
            data=result
        )
    except Exception as e:
        logger.error(f"Error querying resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/info")
async def get_resume_collection_info(user_id: str):
    """
    Get information about user's resume collection

    Args:
        user_id: User ID

    Returns:
        Resume collection information
    """
    try:
        result = vector_store_service.get_collection_info(
            user_id=user_id,
            collection_type=COLLECTION_TYPE
        )

        return APIResponse(
            success=True,
            message="Resume collection information retrieved",
            data=result
        )
    except Exception as e:
        logger.error(f"Error getting resume collection info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}")
async def delete_resume_collection(user_id: str):
    """
    Delete user's resume collection

    Args:
        user_id: User ID

    Returns:
        Deletion confirmation
    """
    try:
        result = vector_store_service.delete_user_collection(
            user_id=user_id,
            collection_type=COLLECTION_TYPE
        )

        return APIResponse(
            success=True,
            message="Resume collection deleted successfully",
            data=result
        )
    except Exception as e:
        logger.error(f"Error deleting resume collection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{user_id}/analyze")
async def analyze_resume(user_id: str, job_description: str = Form(...)):
    """
    Analyze resume against a job description

    Args:
        user_id: User ID
        job_description: Target job description

    Returns:
        Analysis results with match score and suggestions
    """
    try:
        # Query resume for relevant sections
        result = vector_store_service.query_documents(
            user_id=user_id,
            collection_type=COLLECTION_TYPE,
            query_text=job_description,
            n_results=10
        )

        # TODO: Implement AI-powered analysis using Gemini
        # For now, return query results

        return APIResponse(
            success=True,
            message="Resume analysis complete",
            data={
                "job_description": job_description,
                "relevant_sections": result["results"],
                "match_score": 0.75,  # Placeholder
                "suggestions": [
                    "Add more specific technical skills",
                    "Quantify achievements with numbers"
                ]  # Placeholder
            }
        )
    except Exception as e:
        logger.error(f"Error analyzing resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))
