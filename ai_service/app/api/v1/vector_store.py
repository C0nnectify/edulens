"""
Vector Store API Endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List
import logging

from app.models.schemas import (
    DocumentAdd,
    DocumentQuery,
    DocumentDelete,
    CollectionInfo,
    APIResponse
)
from app.services.vector_store_service import vector_store_service
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    collection_type: str = Form(default="documents"),
    document_type: str = Form(default="general")
):
    """
    Upload and process a document for vector storage

    Args:
        file: Document file to upload
        user_id: User ID
        collection_type: Collection type (documents, resume, cv, sop)
        document_type: Document type for classification

    Returns:
        Upload confirmation with document IDs
    """
    try:
        # Read file content
        content = await file.read()

        # Process file and create embeddings
        result = embedding_service.process_uploaded_file(
            file_content=content,
            filename=file.filename,
            user_id=user_id,
            document_type=document_type
        )

        # Add to vector store
        texts = [chunk.page_content for chunk in result["chunks"]]
        metadatas = [chunk.metadata for chunk in result["chunks"]]

        store_result = vector_store_service.add_documents(
            user_id=user_id,
            collection_type=collection_type,
            documents=texts,
            metadatas=metadatas
        )

        return APIResponse(
            success=True,
            message=f"Document '{file.filename}' uploaded and processed successfully",
            data={
                "filename": file.filename,
                "chunks": result["chunk_count"],
                **store_result
            }
        )
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add")
async def add_documents(request: DocumentAdd):
    """
    Add documents directly to a collection

    Args:
        request: Document add request with texts and metadata

    Returns:
        Addition confirmation
    """
    try:
        result = vector_store_service.add_documents(
            user_id=request.user_id,
            collection_type=request.collection_type,
            documents=request.documents,
            metadatas=request.metadatas,
            ids=request.ids
        )

        return APIResponse(
            success=True,
            message=f"Added {result['document_count']} documents to collection",
            data=result
        )
    except Exception as e:
        logger.error(f"Error adding documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def query_documents(request: DocumentQuery):
    """
    Query documents in a user's collection

    Args:
        request: Query request with search parameters

    Returns:
        Query results with relevant documents
    """
    try:
        result = vector_store_service.query_documents(
            user_id=request.user_id,
            collection_type=request.collection_type,
            query_text=request.query_text,
            n_results=request.n_results,
            where=request.where
        )

        return APIResponse(
            success=True,
            message=f"Found {result['result_count']} results",
            data=result
        )
    except Exception as e:
        logger.error(f"Error querying documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents")
async def delete_documents(request: DocumentDelete):
    """
    Delete specific documents from a collection

    Args:
        request: Delete request with document IDs

    Returns:
        Deletion confirmation
    """
    try:
        result = vector_store_service.delete_documents(
            user_id=request.user_id,
            collection_type=request.collection_type,
            ids=request.ids
        )

        return APIResponse(
            success=True,
            message=f"Deleted {result['deleted_count']} documents",
            data=result
        )
    except Exception as e:
        logger.error(f"Error deleting documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collection/info")
async def get_collection_info(request: CollectionInfo):
    """
    Get information about a user's collection

    Args:
        request: Collection info request

    Returns:
        Collection information
    """
    try:
        result = vector_store_service.get_collection_info(
            user_id=request.user_id,
            collection_type=request.collection_type
        )

        return APIResponse(
            success=True,
            message="Collection information retrieved",
            data=result
        )
    except Exception as e:
        logger.error(f"Error getting collection info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collections/{user_id}")
async def list_user_collections(user_id: str):
    """
    List all collections for a user

    Args:
        user_id: User ID

    Returns:
        List of user collections
    """
    try:
        collections = vector_store_service.list_user_collections(user_id)

        return APIResponse(
            success=True,
            message=f"Found {len(collections)} collections",
            data={"collections": collections}
        )
    except Exception as e:
        logger.error(f"Error listing collections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/collection")
async def delete_collection(request: CollectionInfo):
    """
    Delete an entire user collection

    Args:
        request: Collection info request

    Returns:
        Deletion confirmation
    """
    try:
        result = vector_store_service.delete_user_collection(
            user_id=request.user_id,
            collection_type=request.collection_type
        )

        return APIResponse(
            success=True,
            message="Collection deleted successfully",
            data=result
        )
    except Exception as e:
        logger.error(f"Error deleting collection: {e}")
        raise HTTPException(status_code=500, detail=str(e))
