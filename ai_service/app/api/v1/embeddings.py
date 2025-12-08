"""
Embedding generation endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.api.dependencies import get_current_user_id
from app.services.embedding_service import EmbeddingService
from app.utils.logger import logger

router = APIRouter(prefix="/embeddings", tags=["Embeddings"])


class EmbeddingRequest(BaseModel):
    """Request model for generating embeddings"""
    texts: List[str] = Field(..., description="List of texts to embed", min_length=1)
    provider: str = Field(default="openai", description="Embedding provider (openai, cohere, huggingface)")
    model: Optional[str] = Field(None, description="Specific model to use")


class EmbeddingResponse(BaseModel):
    """Response model for embedding generation"""
    embeddings: List[List[float]] = Field(..., description="Generated embeddings")
    dimensions: int = Field(..., description="Embedding dimensions")
    provider: str = Field(..., description="Provider used")
    count: int = Field(..., description="Number of embeddings generated")


@router.post("/generate", response_model=EmbeddingResponse)
async def generate_embeddings(
    request: EmbeddingRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate embeddings for a list of texts

    Args:
        request: EmbeddingRequest with texts and provider
        user_id: Authenticated user ID

    Returns:
        EmbeddingResponse with generated embeddings
    """
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="No texts provided")

        embedding_service = EmbeddingService()

        # Generate embeddings
        embeddings, dimensions = await embedding_service.generate_embeddings(
            texts=request.texts,
            provider=request.provider,
            model=request.model
        )

        return EmbeddingResponse(
            embeddings=embeddings,
            dimensions=dimensions,
            provider=request.provider,
            count=len(embeddings),
        )

    except ValueError as e:
        logger.error(f"Invalid embedding request: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers")
async def get_providers():
    """
    Get list of supported embedding providers

    Returns:
        List of supported providers
    """
    providers = EmbeddingService.get_supported_providers()

    return {
        "providers": providers,
        "default": "openai",
    }
