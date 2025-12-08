"""
Search endpoints for semantic and keyword-based document search
"""

from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user_id
from app.models.search import SearchRequest, SearchResponse
from app.services.search_service import SearchService
from app.utils.logger import logger

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("", response_model=SearchResponse)
async def search_documents(
    request: SearchRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Search documents using semantic, keyword, or hybrid search

    Args:
        request: SearchRequest with query and parameters
        user_id: Authenticated user ID

    Returns:
        SearchResponse with results
    """
    try:
        search_service = SearchService(user_id)
        results = await search_service.search(request)

        return results

    except Exception as e:
        logger.error(f"Error performing search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar/{document_id}/{chunk_index}")
async def find_similar_chunks(
    document_id: str,
    chunk_index: int,
    top_k: int = 5,
    user_id: str = Depends(get_current_user_id),
):
    """
    Find similar chunks to a specific chunk

    Args:
        document_id: Document identifier
        chunk_index: Chunk index within document
        top_k: Number of similar chunks to return
        user_id: Authenticated user ID

    Returns:
        List of similar chunks
    """
    try:
        search_service = SearchService(user_id)
        results = await search_service.search_similar_chunks(
            document_id,
            chunk_index,
            top_k
        )

        return {
            "document_id": document_id,
            "chunk_index": chunk_index,
            "similar_chunks": [result.model_dump() for result in results],
            "total": len(results),
        }

    except Exception as e:
        logger.error(f"Error finding similar chunks: {e}")
        raise HTTPException(status_code=500, detail=str(e))
