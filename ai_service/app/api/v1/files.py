"""
API endpoints for file management.

Provides endpoints for listing, retrieving, and managing uploaded files
that can be attached to document builder conversations.
"""

import logging
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from ...api.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["File Management"])


# ============================================================================
# Models
# ============================================================================

class FileInfo(BaseModel):
    """Information about an uploaded file."""
    id: str
    name: str
    type: str
    size: int
    uploaded_at: str
    doc_type: str = "document"
    text_preview: Optional[str] = None


class FileListResponse(BaseModel):
    """Response model for file listing."""
    files: List[FileInfo]
    total: int


class FileDetailResponse(BaseModel):
    """Response model for file details."""
    id: str
    name: str
    type: str
    size: int
    uploaded_at: str
    doc_type: str
    text_content: Optional[str] = None
    metadata: dict = Field(default_factory=dict)


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/list", response_model=FileListResponse)
async def list_user_files(
    user_id: str = Depends(get_current_user),
    doc_type: Optional[str] = Query(None, description="Filter by document type"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List all files uploaded by the current user.
    
    Files can be filtered by doc_type (cv, transcript, lor, etc.).
    """
    try:
        # Import MongoDB client
        from ...database.mongodb import get_database
        
        db = get_database()
        if db is None:
            # Return empty list if DB not available
            return FileListResponse(files=[], total=0)
        
        # Build query
        query = {"user_id": user_id}
        if doc_type:
            query["doc_type"] = doc_type
        
        # Get files collection
        files_collection = db.get_collection("uploaded_files")
        
        # Count total
        total = await files_collection.count_documents(query)
        
        # Get files with pagination
        cursor = files_collection.find(query).sort("uploaded_at", -1).skip(offset).limit(limit)
        files = []
        
        async for doc in cursor:
            files.append(FileInfo(
                id=str(doc["_id"]) if "_id" in doc else doc.get("file_id", ""),
                name=doc.get("filename", "unknown"),
                type=doc.get("content_type", "application/octet-stream"),
                size=doc.get("size", 0),
                uploaded_at=doc.get("uploaded_at", datetime.utcnow()).isoformat() if isinstance(doc.get("uploaded_at"), datetime) else str(doc.get("uploaded_at", "")),
                doc_type=doc.get("doc_type", "document"),
                text_preview=doc.get("text_preview", "")[:200] if doc.get("text_preview") else None,
            ))
        
        return FileListResponse(files=files, total=total)
        
    except Exception as e:
        logger.error(f"Error listing files: {e}")
        # Return empty list on error rather than failing
        return FileListResponse(files=[], total=0)


@router.get("/{file_id}", response_model=FileDetailResponse)
async def get_file_details(
    file_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Get detailed information about a specific file.
    """
    try:
        from ...database.mongodb import get_database
        from bson import ObjectId
        
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        files_collection = db.get_collection("uploaded_files")
        
        # Try to find by ObjectId or file_id field
        try:
            doc = await files_collection.find_one({
                "_id": ObjectId(file_id),
                "user_id": user_id
            })
        except:
            doc = await files_collection.find_one({
                "file_id": file_id,
                "user_id": user_id
            })
        
        if not doc:
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileDetailResponse(
            id=str(doc["_id"]) if "_id" in doc else doc.get("file_id", ""),
            name=doc.get("filename", "unknown"),
            type=doc.get("content_type", "application/octet-stream"),
            size=doc.get("size", 0),
            uploaded_at=doc.get("uploaded_at", "").isoformat() if isinstance(doc.get("uploaded_at"), datetime) else str(doc.get("uploaded_at", "")),
            doc_type=doc.get("doc_type", "document"),
            text_content=doc.get("text_content"),
            metadata=doc.get("metadata", {}),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve file: {str(e)}")


@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Delete a file uploaded by the current user.
    """
    try:
        from ...database.mongodb import get_database
        from bson import ObjectId
        
        db = get_database()
        if db is None:
            raise HTTPException(status_code=503, detail="Database not available")
        
        files_collection = db.get_collection("uploaded_files")
        
        # Try to delete by ObjectId or file_id field
        try:
            result = await files_collection.delete_one({
                "_id": ObjectId(file_id),
                "user_id": user_id
            })
        except:
            result = await files_collection.delete_one({
                "file_id": file_id,
                "user_id": user_id
            })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="File not found or already deleted")
        
        return {"status": "deleted", "file_id": file_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@router.get("/recent/{doc_type}", response_model=FileListResponse)
async def get_recent_files_by_type(
    doc_type: str,
    user_id: str = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get recently uploaded files of a specific type.
    
    Useful for showing relevant files when creating documents.
    For example, show recent CVs when creating an SOP.
    """
    try:
        from ...database.mongodb import get_database
        
        db = get_database()
        if db is None:
            return FileListResponse(files=[], total=0)
        
        files_collection = db.get_collection("uploaded_files")
        
        # Query for recent files of this type
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = {
            "user_id": user_id,
            "doc_type": doc_type,
            "uploaded_at": {"$gte": cutoff_date}
        }
        
        total = await files_collection.count_documents(query)
        cursor = files_collection.find(query).sort("uploaded_at", -1).limit(limit)
        
        files = []
        async for doc in cursor:
            files.append(FileInfo(
                id=str(doc["_id"]) if "_id" in doc else doc.get("file_id", ""),
                name=doc.get("filename", "unknown"),
                type=doc.get("content_type", "application/octet-stream"),
                size=doc.get("size", 0),
                uploaded_at=doc.get("uploaded_at", "").isoformat() if isinstance(doc.get("uploaded_at"), datetime) else str(doc.get("uploaded_at", "")),
                doc_type=doc.get("doc_type", "document"),
                text_preview=doc.get("text_preview", "")[:200] if doc.get("text_preview") else None,
            ))
        
        return FileListResponse(files=files, total=total)
        
    except Exception as e:
        logger.error(f"Error getting recent files: {e}")
        return FileListResponse(files=[], total=0)
