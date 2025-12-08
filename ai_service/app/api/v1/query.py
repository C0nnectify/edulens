"""
Query API routes

Enhanced query endpoint supporting:
- Query entire user collection
- Query specific document
- Query set of documents by tracking_id
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import time
from collections import defaultdict

from app.models.search import (
    QueryRequest,
    QueryResponse,
    SearchResult,
    DocumentGroup,
    QueryScope,
    SearchMode
)
from app.api.dependencies import get_current_user
from app.services.search_service import SearchService
from app.services.embedding_service import EmbeddingService
from app.database.vector_db import VectorDatabase
from app.database.mongodb import get_database
from app.utils.logger import logger

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Enhanced query endpoint with multiple scope options

    Supports:
    - scope=collection: Query entire user collection
    - scope=document: Query specific document by document_id
    - scope=tracking_ids: Query set of documents by tracking_id(s)

    Example requests:

    1. Query entire collection:
    ```json
    {
        "query": "machine learning algorithms",
        "scope": "collection",
        "mode": "semantic",
        "top_k": 10
    }
    ```

    2. Query specific document:
    ```json
    {
        "query": "neural networks",
        "scope": "document",
        "document_id": "abc-123",
        "mode": "semantic"
    }
    ```

    3. Query multiple documents by tracking_id:
    ```json
    {
        "query": "deep learning",
        "scope": "tracking_ids",
        "tracking_ids": ["track-1", "track-2", "track-3"],
        "mode": "hybrid",
        "group_by_document": true
    }
    ```
    """
    start_time = time.time()
    user_id = current_user

    try:
        # Validate scope-specific requirements
        if request.scope == QueryScope.DOCUMENT and not request.document_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="document_id is required when scope=document"
            )

        if request.scope == QueryScope.TRACKING_IDS and not request.tracking_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="tracking_ids is required when scope=tracking_ids"
            )

        # Initialize services
        embedding_service = EmbeddingService()
        search_service = SearchService(user_id, embedding_service)
        vector_db = VectorDatabase(user_id)

        # Generate query embedding for semantic/hybrid search
        query_embedding = None
        if request.mode in [SearchMode.SEMANTIC, SearchMode.HYBRID]:
            logger.info(f"Generating embedding for query: {request.query[:50]}...")
            embeddings, dimensions = await embedding_service.generate_embeddings(
                [request.query],
                provider="openai"
            )
            query_embedding = embeddings[0]

        # Build filter criteria based on scope
        filters = {}

        # Add tag filters if provided
        if request.tags:
            filters["tags"] = {"$in": request.tags}

        # Apply scope-specific filters
        if request.scope == QueryScope.DOCUMENT:
            filters["document_id"] = request.document_id
            logger.info(f"Querying document: {request.document_id}")

        elif request.scope == QueryScope.TRACKING_IDS:
            filters["tracking_id"] = {"$in": request.tracking_ids}
            logger.info(f"Querying {len(request.tracking_ids)} tracking IDs")

        else:  # COLLECTION
            logger.info(f"Querying entire collection for user: {user_id}")

        # Perform search based on mode
        results = []

        if request.mode == SearchMode.SEMANTIC:
            # Vector similarity search
            results = await vector_db.search_by_vector(
                query_embedding=query_embedding,
                top_k=request.top_k,
                document_id=request.document_id,
                tags=request.tags,
                min_score=request.min_score
            )

        elif request.mode == SearchMode.KEYWORD:
            # Keyword search
            from app.models.search import SearchRequest
            search_request = SearchRequest(
                query=request.query,
                mode=SearchMode.KEYWORD,
                top_k=request.top_k,
                tags=request.tags,
                document_id=request.document_id,
                min_score=request.min_score
            )
            search_response = await search_service.search(search_request)
            results = search_response.results

        elif request.mode == SearchMode.HYBRID:
            # Hybrid search (combines semantic + keyword)
            from app.models.search import SearchRequest
            search_request = SearchRequest(
                query=request.query,
                mode=SearchMode.HYBRID,
                top_k=request.top_k,
                tags=request.tags,
                document_id=request.document_id,
                min_score=request.min_score
            )
            search_response = await search_service.search(search_request)
            results = search_response.results

        # Filter by minimum score if specified
        if request.min_score:
            results = [r for r in results if r.score >= request.min_score]

        # Results are already SearchResult objects, no conversion needed
        search_results = results

        # Group by document if requested
        grouped_results = None
        if request.group_by_document:
            grouped_results = _group_by_document(search_results)

        # Build filters applied summary
        filters_applied = {
            "scope": request.scope.value,
            "mode": request.mode.value,
            "top_k": request.top_k
        }

        if request.tags:
            filters_applied["tags"] = request.tags
        if request.document_id:
            filters_applied["document_id"] = request.document_id
        if request.tracking_ids:
            filters_applied["tracking_ids"] = request.tracking_ids
        if request.min_score:
            filters_applied["min_score"] = request.min_score

        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000

        logger.info(
            f"Query completed: {len(search_results)} results in {processing_time_ms:.2f}ms"
        )

        return QueryResponse(
            results=search_results,
            grouped_results=grouped_results,
            total=len(search_results),
            query=request.query,
            scope=request.scope,
            mode=request.mode,
            filters_applied=filters_applied,
            processing_time_ms=processing_time_ms
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query failed: {str(e)}"
        )


def _group_by_document(results: list[SearchResult]) -> list[DocumentGroup]:
    """
    Group search results by document
    """
    groups = defaultdict(list)

    # Group results by tracking_id (represents a document)
    for result in results:
        groups[result.tracking_id].append(result)

    # Create DocumentGroup objects
    document_groups = []
    for tracking_id, chunks in groups.items():
        if not chunks:
            continue

        # Calculate aggregate scores
        scores = [chunk.score for chunk in chunks]
        avg_score = sum(scores) / len(scores)
        max_score = max(scores)

        # Sort chunks by score descending
        sorted_chunks = sorted(chunks, key=lambda x: x.score, reverse=True)

        # Use first chunk's metadata for document info
        first_chunk = sorted_chunks[0]

        document_groups.append(
            DocumentGroup(
                document_id=first_chunk.document_id,
                tracking_id=tracking_id,
                filename=first_chunk.filename,
                tags=first_chunk.tags,
                chunks=sorted_chunks,
                avg_score=avg_score,
                max_score=max_score
            )
        )

    # Sort groups by max score descending
    document_groups.sort(key=lambda x: x.max_score, reverse=True)

    return document_groups


@router.post("/query/collection", response_model=QueryResponse)
async def query_collection(
    query: str,
    mode: SearchMode = SearchMode.SEMANTIC,
    top_k: int = 10,
    tags: list[str] = None,
    min_score: float = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Quick endpoint for querying entire user collection

    Simple query without needing to specify scope
    """
    request = QueryRequest(
        query=query,
        scope=QueryScope.COLLECTION,
        mode=mode,
        top_k=top_k,
        tags=tags,
        min_score=min_score
    )

    return await query_documents(request, current_user, db)


@router.post("/query/document/{document_id}", response_model=QueryResponse)
async def query_document(
    document_id: str,
    query: str,
    mode: SearchMode = SearchMode.SEMANTIC,
    top_k: int = 10,
    min_score: float = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Quick endpoint for querying specific document

    Simplified version for single document queries
    """
    request = QueryRequest(
        query=query,
        scope=QueryScope.DOCUMENT,
        document_id=document_id,
        mode=mode,
        top_k=top_k,
        min_score=min_score
    )

    return await query_documents(request, current_user, db)


@router.post("/query/tracking", response_model=QueryResponse)
async def query_by_tracking_ids(
    tracking_ids: list[str],
    query: str,
    mode: SearchMode = SearchMode.SEMANTIC,
    top_k: int = 10,
    group_by_document: bool = False,
    min_score: float = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Quick endpoint for querying by tracking IDs

    Query across multiple documents by their tracking_id
    """
    request = QueryRequest(
        query=query,
        scope=QueryScope.TRACKING_IDS,
        tracking_ids=tracking_ids,
        mode=mode,
        top_k=top_k,
        group_by_document=group_by_document,
        min_score=min_score
    )

    return await query_documents(request, current_user, db)
