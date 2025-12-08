"""
Search service for semantic and keyword-based document search
"""

import time
from typing import List, Optional
from app.models.search import SearchRequest, SearchResponse, SearchResult, SearchMode
from app.database.vector_db import VectorDatabase
from app.services.embedding_service import EmbeddingService
from app.utils.logger import logger


class SearchService:
    """Service for searching documents"""

    def __init__(self, user_id: str, embedding_service: Optional[EmbeddingService] = None):
        """
        Initialize search service

        Args:
            user_id: User identifier
            embedding_service: Optional embedding service instance
        """
        self.user_id = user_id
        self.vector_db = VectorDatabase(user_id)
        self.embedding_service = embedding_service or EmbeddingService()

    async def search(self, request: SearchRequest) -> SearchResponse:
        """
        Perform search based on request parameters

        Args:
            request: SearchRequest object

        Returns:
            SearchResponse with results
        """
        start_time = time.time()

        # Route to appropriate search method
        if request.mode == SearchMode.SEMANTIC:
            results = await self._semantic_search(request)
        elif request.mode == SearchMode.KEYWORD:
            results = await self._keyword_search(request)
        elif request.mode == SearchMode.HYBRID:
            results = await self._hybrid_search(request)
        else:
            raise ValueError(f"Unsupported search mode: {request.mode}")

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        logger.info(
            f"Search completed: mode={request.mode}, "
            f"results={len(results)}, time={processing_time:.2f}ms"
        )

        return SearchResponse(
            results=results,
            total=len(results),
            query=request.query,
            mode=request.mode,
            processing_time_ms=processing_time
        )

    async def _semantic_search(self, request: SearchRequest) -> List[SearchResult]:
        """
        Perform semantic (vector similarity) search

        Args:
            request: SearchRequest object

        Returns:
            List of SearchResult objects
        """
        # Generate query embedding
        query_embedding = await self.embedding_service.generate_query_embedding(
            request.query,
            provider="openai"  # Can be made configurable
        )

        # Perform vector search
        results = await self.vector_db.search_by_vector(
            query_embedding=query_embedding,
            top_k=request.top_k,
            document_id=request.document_id,
            tags=request.tags,
            min_score=request.min_score
        )

        return results

    async def _keyword_search(self, request: SearchRequest) -> List[SearchResult]:
        """
        Perform keyword-based text search

        Args:
            request: SearchRequest object

        Returns:
            List of SearchResult objects
        """
        # Generate query embedding to ensure dimension consistency
        query_embedding = await self.embedding_service.generate_query_embedding(
            request.query,
            provider="openai"
        )
        
        results = await self.vector_db.search_by_keyword(
            query=request.query,
            top_k=request.top_k,
            document_id=request.document_id,
            tags=request.tags,
            query_embedding=query_embedding
        )

        return results

    async def _hybrid_search(self, request: SearchRequest) -> List[SearchResult]:
        """
        Perform hybrid search combining semantic and keyword search

        Args:
            request: SearchRequest object

        Returns:
            List of SearchResult objects (merged and re-ranked)
        """
        # Perform both searches
        semantic_results = await self._semantic_search(request)
        keyword_results = await self._keyword_search(request)

        # Merge results and re-rank
        merged_results = self._merge_and_rerank(
            semantic_results,
            keyword_results,
            request.top_k
        )

        return merged_results

    @staticmethod
    def _merge_and_rerank(
        semantic_results: List[SearchResult],
        keyword_results: List[SearchResult],
        top_k: int,
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3
    ) -> List[SearchResult]:
        """
        Merge and re-rank results from semantic and keyword search

        Args:
            semantic_results: Results from semantic search
            keyword_results: Results from keyword search
            top_k: Number of results to return
            semantic_weight: Weight for semantic scores
            keyword_weight: Weight for keyword scores

        Returns:
            Merged and re-ranked results
        """
        # Create a dictionary to store combined scores
        result_map = {}

        # Add semantic results
        for result in semantic_results:
            result_map[result.chunk_id] = {
                "result": result,
                "semantic_score": result.score,
                "keyword_score": 0.0
            }

        # Add/update with keyword results
        for result in keyword_results:
            if result.chunk_id in result_map:
                result_map[result.chunk_id]["keyword_score"] = result.score
            else:
                result_map[result.chunk_id] = {
                    "result": result,
                    "semantic_score": 0.0,
                    "keyword_score": result.score
                }

        # Calculate combined scores
        ranked_results = []
        for chunk_id, data in result_map.items():
            combined_score = (
                semantic_weight * data["semantic_score"] +
                keyword_weight * data["keyword_score"]
            )

            result = data["result"]
            result.score = combined_score
            ranked_results.append(result)

        # Sort by combined score
        ranked_results.sort(key=lambda x: x.score, reverse=True)

        return ranked_results[:top_k]

    async def search_similar_chunks(
        self,
        document_id: str,
        chunk_index: int,
        top_k: int = 5
    ) -> List[SearchResult]:
        """
        Find similar chunks to a specific chunk

        Args:
            document_id: Document identifier
            chunk_index: Index of the chunk
            top_k: Number of similar chunks to return

        Returns:
            List of similar SearchResult objects
        """
        # Get the reference chunk
        chunks = await self.vector_db.get_document_chunks(
            document_id,
            include_embeddings=True
        )

        reference_chunk = None
        for chunk in chunks:
            if chunk["chunk_index"] == chunk_index:
                reference_chunk = chunk
                break

        if not reference_chunk or not reference_chunk.get("embedding"):
            logger.warning(f"Chunk not found or has no embedding: {document_id}:{chunk_index}")
            return []

        # Search using the chunk's embedding
        results = await self.vector_db.search_by_vector(
            query_embedding=reference_chunk["embedding"],
            top_k=top_k + 1  # +1 because it will include itself
        )

        # Filter out the reference chunk itself
        results = [r for r in results if r.chunk_id != reference_chunk["chunk_id"]]

        return results[:top_k]
