"""
Pydantic models for search operations
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class SearchMode(str, Enum):
    """Search mode options"""
    SEMANTIC = "semantic"  # Vector similarity search
    KEYWORD = "keyword"    # Text-based keyword search
    HYBRID = "hybrid"      # Combined semantic + keyword


class QueryScope(str, Enum):
    """Query scope options"""
    COLLECTION = "collection"    # Query entire user collection
    DOCUMENT = "document"        # Query specific document
    TRACKING_IDS = "tracking_ids"  # Query specific tracking_ids


class SearchRequest(BaseModel):
    """Request model for search operations"""
    query: str = Field(..., description="Search query text", min_length=1)
    mode: SearchMode = Field(
        default=SearchMode.SEMANTIC,
        description="Search mode (semantic, keyword, hybrid)"
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=100,
        description="Number of results to return"
    )
    tags: Optional[List[str]] = Field(
        None,
        description="Filter by specific tags"
    )
    document_id: Optional[str] = Field(
        None,
        description="Search within specific document only"
    )
    min_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score threshold"
    )


class QueryRequest(BaseModel):
    """Enhanced query request with multiple scope options"""
    query: str = Field(..., description="Query text", min_length=1)

    # Scope options
    scope: QueryScope = Field(
        default=QueryScope.COLLECTION,
        description="Query scope: collection, document, or tracking_ids"
    )

    # For document scope
    document_id: Optional[str] = Field(
        None,
        description="Document ID when scope=document"
    )

    # For tracking_ids scope
    tracking_ids: Optional[List[str]] = Field(
        None,
        description="List of tracking IDs when scope=tracking_ids"
    )

    # Search options
    mode: SearchMode = Field(
        default=SearchMode.SEMANTIC,
        description="Search mode (semantic, keyword, hybrid)"
    )

    top_k: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Number of results to return"
    )

    # Filters
    tags: Optional[List[str]] = Field(
        None,
        description="Filter by specific tags"
    )

    min_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score threshold"
    )

    # Grouping options
    group_by_document: bool = Field(
        default=False,
        description="Group results by document"
    )

    include_metadata: bool = Field(
        default=True,
        description="Include full metadata in results"
    )


class SearchResult(BaseModel):
    """Single search result"""
    chunk_id: str = Field(..., description="Chunk identifier")
    document_id: str = Field(..., description="Document identifier")
    tracking_id: str = Field(..., description="Tracking ID")
    text: str = Field(..., description="Chunk text content")
    score: float = Field(..., description="Similarity/relevance score")
    chunk_index: int = Field(..., description="Chunk index in document")
    filename: str = Field(..., description="Original filename")
    tags: List[str] = Field(default_factory=list, description="Document tags")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata"
    )


class DocumentGroup(BaseModel):
    """Grouped results by document"""
    document_id: str = Field(..., description="Document identifier")
    tracking_id: str = Field(..., description="Tracking ID")
    filename: str = Field(..., description="Original filename")
    tags: List[str] = Field(default_factory=list, description="Document tags")
    chunks: List[SearchResult] = Field(..., description="Matching chunks from this document")
    avg_score: float = Field(..., description="Average score across chunks")
    max_score: float = Field(..., description="Maximum score among chunks")


class SearchResponse(BaseModel):
    """Response model for search operations"""
    results: List[SearchResult] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results")
    query: str = Field(..., description="Original query")
    mode: SearchMode = Field(..., description="Search mode used")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")


class QueryResponse(BaseModel):
    """Enhanced query response"""
    results: List[SearchResult] = Field(..., description="Search results")
    grouped_results: Optional[List[DocumentGroup]] = Field(
        None,
        description="Results grouped by document (if group_by_document=true)"
    )
    total: int = Field(..., description="Total number of results")
    query: str = Field(..., description="Original query")
    scope: QueryScope = Field(..., description="Query scope used")
    mode: SearchMode = Field(..., description="Search mode used")
    filters_applied: Dict[str, Any] = Field(
        default_factory=dict,
        description="Filters that were applied"
    )
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
