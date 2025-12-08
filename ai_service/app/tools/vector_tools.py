"""Vector store tools for semantic search and storage"""

from typing import Dict, Any, List, Optional
from app.tools.base_tool import BaseTool, ToolResult
from app.services.vector_store_service import VectorStoreService
import logging

logger = logging.getLogger(__name__)


class VectorStoreTool(BaseTool):
    """Base class for vector store operations"""

    def __init__(self, name: str, description: str, vector_service: VectorStoreService):
        super().__init__(name, description)
        self.vector_service = vector_service
        self.category = "storage"


class VectorAddTool(VectorStoreTool):
    """Add documents to vector store"""

    def __init__(self, vector_service: VectorStoreService):
        super().__init__(
            name="vector_add",
            description="Add documents to vector store for semantic search and retrieval",
            vector_service=vector_service
        )

    def _get_parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "User ID"
                },
                "collection_type": {
                    "type": "string",
                    "description": "Collection type (research, documents, etc.)"
                },
                "documents": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of document texts"
                },
                "metadatas": {
                    "type": "array",
                    "items": {"type": "object"},
                    "description": "Metadata for each document"
                }
            },
            "required": ["user_id", "collection_type", "documents"]
        }

    async def execute(
        self,
        user_id: str,
        collection_type: str,
        documents: List[str],
        metadatas: Optional[List[Dict]] = None,
        **kwargs
    ) -> ToolResult:
        """Add documents to vector store"""
        try:
            result = await self.vector_service.add_documents(
                user_id=user_id,
                collection_type=collection_type,
                documents=documents,
                metadatas=metadatas
            )

            return ToolResult(
                success=True,
                data=result,
                metadata={"documents_added": len(documents)}
            )

        except Exception as e:
            return await self._handle_error(e)


class VectorQueryTool(VectorStoreTool):
    """Query vector store for semantic search"""

    def __init__(self, vector_service: VectorStoreService):
        super().__init__(
            name="vector_query",
            description="Search vector store for semantically similar documents",
            vector_service=vector_service
        )

    def _get_parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "User ID"
                },
                "collection_type": {
                    "type": "string",
                    "description": "Collection type"
                },
                "query_text": {
                    "type": "string",
                    "description": "Search query"
                },
                "n_results": {
                    "type": "integer",
                    "description": "Number of results",
                    "default": 5
                }
            },
            "required": ["user_id", "collection_type", "query_text"]
        }

    async def execute(
        self,
        user_id: str,
        collection_type: str,
        query_text: str,
        n_results: int = 5,
        **kwargs
    ) -> ToolResult:
        """Query vector store"""
        try:
            results = await self.vector_service.query_collection(
                user_id=user_id,
                collection_type=collection_type,
                query_text=query_text,
                n_results=n_results
            )

            return ToolResult(
                success=True,
                data={
                    "query": query_text,
                    "results": results,
                    "count": len(results) if results else 0
                },
                metadata={"n_results": n_results}
            )

        except Exception as e:
            return await self._handle_error(e)
