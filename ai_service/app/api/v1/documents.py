"""
Document upload and management endpoints
"""

import uuid
import os
import inspect
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks, Query
from app.api.dependencies import get_current_user_id
from app.models.document import (
    DocumentUploadResponse,
    DocumentMetadata,
    DocumentListResponse,
    DocumentUpdateRequest,
    DocumentChunk,
    ProcessingStatus,
)
from app.services import (
    DocumentProcessor,
    OCRService,
    ChunkingService,
    EmbeddingService,
)
from app.database.mongodb import get_documents_collection
from app.database.mongodb import get_gridfs_bucket
from app.database.vector_db import VectorDatabase
from app.services.gridfs_tempfile import gridfs_to_tempfile
from app.utils import (
    calculate_file_hash,
    validate_file_type,
    validate_file_size,
    save_upload_file,
    delete_file,
    get_file_type_from_extension,
    logger,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


async def process_document_background(
    storage_backend: str,
    file_path: Optional[str],
    gridfs_id: Optional[str],
    file_hash: str,
    document_id: str,
    tracking_id: str,
    user_id: str,
    filename: str,
    file_type: str,
    tags: List[str],
):
    """
    Background task to process document

    Args:
        file_path: Path to uploaded file
        file_hash: SHA-256 hash of file
        document_id: Document identifier
        tracking_id: Tracking identifier
        user_id: User identifier
        filename: Original filename
        file_type: Type of file
        tags: Document tags
    """
    try:
        logger.info(f"Processing document {document_id} in background")

        # Initialize services
        doc_processor = DocumentProcessor()
        ocr_service = OCRService()
        chunking_service = ChunkingService()
        embedding_service = EmbeddingService()
        vector_db = VectorDatabase(user_id)
        docs_collection = get_documents_collection()

        # Materialize to a local path (processors expect file paths)
        tmp_path: Optional[str] = None
        try:
            if storage_backend == "gridfs":
                if not gridfs_id:
                    raise ValueError("gridfs_id is required for gridfs backend")
                from pathlib import Path
                suffix = Path(filename).suffix
                tmp = await gridfs_to_tempfile(gridfs_id, suffix=suffix)
                tmp_path = tmp.path
                local_path = tmp_path
            else:
                if not file_path:
                    raise ValueError("file_path is required for disk backend")
                local_path = file_path

            # Extract text based on file type
            if file_type == 'image':
                ocr_result = await ocr_service.extract_text_from_image(local_path)
                text = ocr_result["text"]
            else:
                text, _ = await doc_processor.process_document(local_path)
        finally:
            if tmp_path:
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

        # Validate extracted text
        if not doc_processor.validate_extracted_text(text):
            raise ValueError("Extracted text is too short or empty")

        # Chunk the document
        chunks_data = chunking_service.chunk_text(
            text,
            metadata={
                "document_id": document_id,
                "tracking_id": tracking_id,
                "filename": filename,
                "tags": tags,
            }
        )

        # Generate embeddings
        chunk_texts = [chunk["text"] for chunk in chunks_data]
        embeddings, _ = await embedding_service.generate_embeddings(chunk_texts)

        # Create DocumentChunk objects
        chunks = []
        for idx, (chunk_data, embedding) in enumerate(zip(chunks_data, embeddings)):
            chunk = DocumentChunk(
                chunk_id=f"{document_id}_chunk_{idx}",
                document_id=document_id,
                tracking_id=tracking_id,
                user_id=user_id,
                text=chunk_data["text"],
                embedding=embedding,
                chunk_index=idx,
                total_chunks=len(chunks_data),
                metadata={
                    "filename": filename,
                    "tags": tags,
                    "word_count": chunk_data.get("word_count", 0),
                    "char_count": chunk_data.get("char_count", 0),
                }
            )
            chunks.append(chunk)

        # Store chunks in vector database
        await vector_db.insert_chunks(chunks)

        # Create text index for keyword search
        await vector_db.create_text_index()

        # Update document status to completed
        await docs_collection.update_one(
            {"document_id": document_id},
            {
                "$set": {
                    "status": ProcessingStatus.COMPLETED,
                    "total_chunks": len(chunks),
                    "indexed_at": datetime.utcnow(),
                }
            }
        )

        logger.info(f"Successfully processed document {document_id} with {len(chunks)} chunks")

    except Exception as e:
        # Include stack trace to diagnose background processing failures
        try:
            logger.exception(f"Error processing document {document_id}: {e}")
        except Exception:
            logger.error(f"Error processing document {document_id}: {e}")

        # Update document status to failed
        try:
            await docs_collection.update_one(
                {"document_id": document_id},
                {"$set": {"status": ProcessingStatus.FAILED}}
            )
        except:
            pass


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    tags: str = Form(default="general"),
    user_id: str = Depends(get_current_user_id),
):
    """
    Upload and process a document

    Args:
        file: Uploaded file
        tags: Comma-separated tags
        user_id: Authenticated user ID

    Returns:
        DocumentUploadResponse with processing status
    """
    try:
        # Validate file type
        validate_file_type(file.filename)

        # Get file size and validate
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        validate_file_size(file_size)

        # Calculate file hash
        file_hash = await calculate_file_hash(file)

        # Check for duplicate
        docs_collection = get_documents_collection()
        existing_doc = await docs_collection.find_one({
            "user_id": user_id,
            "file_hash": file_hash
        })

        if existing_doc:
            return DocumentUploadResponse(
                document_id=existing_doc["document_id"],
                tracking_id=existing_doc["tracking_id"],
                filename=existing_doc["filename"],
                file_hash=file_hash,
                file_type=existing_doc["file_type"],
                status=ProcessingStatus(existing_doc["status"]),
                total_chunks=existing_doc.get("total_chunks", 0),
                message="Document already exists (duplicate detected)",
                uploaded_at=existing_doc["uploaded_at"],
            )

        # Generate IDs
        document_id = str(uuid.uuid4())
        tracking_id = str(uuid.uuid4())

        # Store file blob in Mongo GridFS (canonical storage)
        await file.seek(0)
        bucket = get_gridfs_bucket(bucket_name="user_uploads")
        grid_in = bucket.open_upload_stream(
            filename=file.filename,
            metadata={
                "user_id": user_id,
                "file_hash": file_hash,
                "document_id": document_id,
                "tracking_id": tracking_id,
                "content_type": file.content_type,
            },
        )
        try:
            while chunk := await file.read(8192):
                await grid_in.write(chunk)
        finally:
            close_result = grid_in.close()
            if inspect.isawaitable(close_result):
                await close_result
            await file.seek(0)

        gridfs_id = str(grid_in._id)
        file_path = None

        # Determine file type
        from pathlib import Path
        extension = Path(file.filename).suffix.lower().lstrip('.')
        file_type = get_file_type_from_extension(extension)

        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]

        # Create document metadata
        doc_metadata = DocumentMetadata(
            document_id=document_id,
            tracking_id=tracking_id,
            user_id=user_id,
            filename=file.filename,
            file_hash=file_hash,
            file_type=file_type,
            storage_backend="gridfs",
            file_path=file_path,
            gridfs_id=gridfs_id,
            content_type=file.content_type,
            file_size=file_size,
            tags=tag_list,
            total_chunks=0,
            status=ProcessingStatus.PROCESSING,
        )

        # Store metadata in database
        await docs_collection.insert_one(doc_metadata.model_dump())

        # Process document in background
        background_tasks.add_task(
            process_document_background,
            storage_backend="gridfs",
            file_path=None,
            gridfs_id=gridfs_id,
            file_hash=file_hash,
            document_id=document_id,
            tracking_id=tracking_id,
            user_id=user_id,
            filename=file.filename,
            file_type=file_type,
            tags=tag_list,
        )

        logger.info(f"Document upload initiated: {document_id}")

        return DocumentUploadResponse(
            document_id=document_id,
            tracking_id=tracking_id,
            filename=file.filename,
            file_hash=file_hash,
            file_type=file_type,
            status=ProcessingStatus.PROCESSING,
            total_chunks=0,
            message="Document uploaded successfully and processing started",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    tags: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user_id),
):
    """
    List all documents for a user

    Args:
        page: Page number
        page_size: Items per page
        tags: Filter by comma-separated tags
        user_id: Authenticated user ID

    Returns:
        DocumentListResponse with documents
    """
    try:
        docs_collection = get_documents_collection()

        # Build query
        query = {"user_id": user_id}

        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            query["tags"] = {"$in": tag_list}

        # Get total count
        total = await docs_collection.count_documents(query)

        # Get paginated documents
        skip = (page - 1) * page_size
        cursor = docs_collection.find(query).sort("uploaded_at", -1).skip(skip).limit(page_size)
        docs = await cursor.to_list(length=page_size)

        # Convert to DocumentMetadata objects
        documents = [DocumentMetadata(**doc) for doc in docs]

        return DocumentListResponse(
            documents=documents,
            total=total,
            page=page,
            page_size=page_size,
        )

    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}", response_model=DocumentMetadata)
async def get_document(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    Get document metadata by ID

    Args:
        document_id: Document identifier
        user_id: Authenticated user ID

    Returns:
        DocumentMetadata
    """
    try:
        docs_collection = get_documents_collection()

        doc = await docs_collection.find_one({
            "document_id": document_id,
            "user_id": user_id,
        })

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        return DocumentMetadata(**doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: str,
    include_embeddings: bool = Query(False),
    user_id: str = Depends(get_current_user_id),
):
    """
    Get all chunks for a document

    Args:
        document_id: Document identifier
        include_embeddings: Whether to include embedding vectors
        user_id: Authenticated user ID

    Returns:
        List of document chunks
    """
    try:
        # Verify document ownership
        docs_collection = get_documents_collection()
        doc = await docs_collection.find_one({
            "document_id": document_id,
            "user_id": user_id,
        })

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Get chunks
        vector_db = VectorDatabase(user_id)
        chunks = await vector_db.get_document_chunks(
            document_id,
            include_embeddings=include_embeddings
        )

        return {
            "document_id": document_id,
            "total_chunks": len(chunks),
            "chunks": chunks,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chunks for document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{document_id}", response_model=DocumentMetadata)
async def update_document(
    document_id: str,
    update_data: DocumentUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Update document metadata

    Args:
        document_id: Document identifier
        update_data: Update request data
        user_id: Authenticated user ID

    Returns:
        Updated DocumentMetadata
    """
    try:
        docs_collection = get_documents_collection()

        # Build update dict
        update_dict = {}
        if update_data.tags is not None:
            update_dict["tags"] = update_data.tags
        if update_data.metadata is not None:
            update_dict["metadata"] = update_data.metadata

        if not update_dict:
            raise HTTPException(status_code=400, detail="No updates provided")

        # Update document
        result = await docs_collection.find_one_and_update(
            {"document_id": document_id, "user_id": user_id},
            {"$set": update_dict},
            return_document=True,
        )

        if not result:
            raise HTTPException(status_code=404, detail="Document not found")

        return DocumentMetadata(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    Delete a document and all its chunks

    Args:
        document_id: Document identifier
        user_id: Authenticated user ID

    Returns:
        Deletion confirmation
    """
    try:
        docs_collection = get_documents_collection()

        # Get document
        doc = await docs_collection.find_one({
            "document_id": document_id,
            "user_id": user_id,
        })

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        # Delete chunks from vector database
        vector_db = VectorDatabase(user_id)
        deleted_chunks = await vector_db.delete_document_chunks(document_id)

        # Delete stored file (GridFS preferred, but keep disk backward compatibility)
        if doc.get("storage_backend") == "gridfs" and doc.get("gridfs_id"):
            try:
                from bson import ObjectId
                bucket = get_gridfs_bucket(bucket_name="user_uploads")
                await bucket.delete(ObjectId(doc["gridfs_id"]))
            except Exception:
                pass
        elif doc.get("file_path"):
            await delete_file(doc["file_path"])

        # Delete metadata
        await docs_collection.delete_one({"document_id": document_id})

        logger.info(f"Deleted document {document_id} with {deleted_chunks} chunks")

        return {
            "message": "Document deleted successfully",
            "document_id": document_id,
            "deleted_chunks": deleted_chunks,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
