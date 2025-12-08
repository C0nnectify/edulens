"""CV Collection API Endpoints - Similar to Resume but for Academic CVs"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import logging
from app.models.schemas import CVData, APIResponse, DocumentQuery
from app.services.vector_store_service import vector_store_service
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)
router = APIRouter()
COLLECTION_TYPE = "cv"

@router.post("/upload")
async def upload_cv(file: UploadFile = File(...), user_id: str = Form(...)):
    try:
        content = await file.read()
        result = embedding_service.process_uploaded_file(content, file.filename, user_id, "cv")
        texts = [chunk.page_content for chunk in result["chunks"]]
        metadatas = [chunk.metadata for chunk in result["chunks"]]
        store_result = vector_store_service.add_documents(user_id, COLLECTION_TYPE, texts, metadatas)
        return APIResponse(success=True, message=f"CV '{file.filename}' processed", data={**result, **store_result})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add")
async def add_cv_content(request: CVData):
    try:
        metadata = request.metadata or {}
        metadata.update({
            "user_id": request.user_id,
            "document_type": "cv"
        })
        result = embedding_service.create_resume_embeddings(request.content, metadata)
        store_result = vector_store_service.add_documents(request.user_id, COLLECTION_TYPE, result["chunks"], [result["metadata"]] * len(result["chunks"]))
        return APIResponse(success=True, message="CV content added", data={**result, **store_result})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_cv(request: DocumentQuery):
    try:
        result = vector_store_service.query_documents(request.user_id, COLLECTION_TYPE, request.query_text, request.n_results, request.where)
        return APIResponse(success=True, message=f"Found {result['result_count']} CV sections", data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/info")
async def get_cv_info(user_id: str):
    try:
        result = vector_store_service.get_collection_info(user_id, COLLECTION_TYPE)
        return APIResponse(success=True, message="CV collection info", data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}")
async def delete_cv_collection(user_id: str):
    try:
        result = vector_store_service.delete_user_collection(user_id, COLLECTION_TYPE)
        return APIResponse(success=True, message="CV collection deleted", data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
