"""
Pydantic models for document operations
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class ProcessingStatus(str, Enum):
    """Document processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentUploadResponse(BaseModel):
    """Response model for document upload"""
    document_id: str = Field(..., description="Unique document identifier")
    tracking_id: str = Field(..., description="Tracking ID for all chunks of this document")
    filename: str = Field(..., description="Original filename")
    file_hash: str = Field(..., description="SHA-256 hash of the file")
    file_type: str = Field(..., description="File type (pdf, docx, txt, image)")
    status: ProcessingStatus = Field(..., description="Processing status")
    total_chunks: int = Field(..., description="Total number of chunks created")
    message: str = Field(..., description="Status message")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentMetadata(BaseModel):
    """Document metadata model"""
    document_id: str = Field(..., description="Unique document identifier")
    tracking_id: str = Field(..., description="Tracking ID for document chunks")
    user_id: str = Field(..., description="User identifier")
    filename: str = Field(..., description="Original filename")
    file_hash: str = Field(..., description="SHA-256 hash")
    file_type: str = Field(..., description="File type")
    # Storage backends
    storage_backend: str = Field(default="disk", description="Where the file is stored: 'disk' or 'gridfs'")
    file_path: Optional[str] = Field(default=None, description="Path to stored file (disk backend)")
    gridfs_id: Optional[str] = Field(default=None, description="GridFS file id (gridfs backend)")
    content_type: Optional[str] = Field(default=None, description="MIME type")
    file_size: int = Field(..., description="File size in bytes")
    tags: List[str] = Field(default_factory=list, description="User-defined tags")
    total_chunks: int = Field(..., description="Total number of chunks")
    status: ProcessingStatus = Field(..., description="Processing status")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    indexed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class DocumentChunk(BaseModel):
    """Document chunk model"""
    chunk_id: str = Field(..., description="Unique chunk identifier")
    document_id: str = Field(..., description="Parent document ID")
    tracking_id: str = Field(..., description="Tracking ID")
    user_id: str = Field(..., description="User identifier")
    text: str = Field(..., description="Chunk text content")
    embedding: Optional[List[float]] = Field(None, description="Vector embedding")
    chunk_index: int = Field(..., description="Index of this chunk")
    total_chunks: int = Field(..., description="Total chunks in document")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Chunk metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentListResponse(BaseModel):
    """Response model for listing documents"""
    documents: List[DocumentMetadata]
    total: int = Field(..., description="Total number of documents")
    page: int = Field(1, description="Current page number")
    page_size: int = Field(10, description="Items per page")


class DocumentUpdateRequest(BaseModel):
    """Request model for updating document metadata"""
    tags: Optional[List[str]] = Field(None, description="Update document tags")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Update additional metadata")


class EmbeddingRequest(BaseModel):
    """Request model for generating embeddings"""
    texts: List[str] = Field(..., description="List of texts to embed")
    provider: str = Field(default="openai", description="Embedding provider (openai, cohere, huggingface)")
    model: Optional[str] = Field(None, description="Specific model to use")


class EmbeddingResponse(BaseModel):
    """Response model for embedding generation"""
    embeddings: List[List[float]] = Field(..., description="Generated embeddings")
    dimensions: int = Field(..., description="Embedding dimensions")
    provider: str = Field(..., description="Provider used")
    model: str = Field(..., description="Model used")
