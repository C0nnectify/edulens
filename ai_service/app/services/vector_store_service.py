"""
Vector Store Service
Manages user-specific vector collections in ChromaDB
"""

from typing import List, Dict, Any, Optional
import logging
import uuid
from datetime import datetime

from app.core.chroma_client import chroma_manager
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Service for managing vector stores"""

    def __init__(self):
        self.chroma_manager = chroma_manager

    def create_user_collection(
        self,
        user_id: str,
        collection_type: str = "documents",
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Create a new collection for a user

        Args:
            user_id: User ID
            collection_type: Type of collection (documents, resume, cv, sop)
            metadata: Optional metadata for the collection

        Returns:
            Collection object
        """
        try:
            collection_metadata = {
                "user_id": user_id,
                "collection_type": collection_type,
                "created_at": datetime.utcnow().isoformat(),
                **(metadata or {})
            }

            collection = self.chroma_manager.create_user_collection(
                user_id=user_id,
                collection_type=collection_type,
                metadata=collection_metadata
            )

            logger.info(f"Created collection for user {user_id} - type: {collection_type}")
            return collection
        except Exception as e:
            logger.error(f"Error creating user collection: {e}")
            raise

    def add_documents(
        self,
        user_id: str,
        collection_type: str,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Add documents to a user's collection

        Args:
            user_id: User ID
            collection_type: Type of collection
            documents: List of document texts
            metadatas: Optional list of metadata dicts for each document
            ids: Optional list of document IDs

        Returns:
            Dictionary with operation results
        """
        try:
            # Get or create collection
            collection = self.create_user_collection(user_id, collection_type)

            # Generate IDs if not provided
            if ids is None:
                ids = [str(uuid.uuid4()) for _ in documents]

            # Create embeddings
            embeddings = embedding_service.create_embeddings(documents)

            # Prepare metadatas
            if metadatas is None:
                metadatas = [{"user_id": user_id} for _ in documents]
            else:
                for metadata in metadatas:
                    metadata["user_id"] = user_id
                    metadata["added_at"] = datetime.utcnow().isoformat()

            # Add to collection
            collection.add(
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )

            logger.info(f"Added {len(documents)} documents to collection for user {user_id}")

            return {
                "success": True,
                "collection_name": collection.name,
                "document_count": len(documents),
                "ids": ids
            }
        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            raise

    def query_documents(
        self,
        user_id: str,
        collection_type: str,
        query_text: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Query documents in a user's collection

        Args:
            user_id: User ID
            collection_type: Type of collection
            query_text: Query text
            n_results: Number of results to return
            where: Optional filter conditions

        Returns:
            Query results
        """
        try:
            collection_name = self.chroma_manager.get_user_collection_name(
                user_id,
                collection_type
            )
            collection = self.chroma_manager.get_or_create_collection(collection_name)

            # Create query embedding
            query_embedding = embedding_service.create_query_embedding(query_text)

            # Query collection
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where
            )

            logger.info(f"Queried collection for user {user_id} - found {len(results['ids'][0])} results")

            return {
                "query": query_text,
                "results": results,
                "result_count": len(results["ids"][0])
            }
        except Exception as e:
            logger.error(f"Error querying documents: {e}")
            raise

    def get_collection_info(
        self,
        user_id: str,
        collection_type: str
    ) -> Dict[str, Any]:
        """
        Get information about a user's collection

        Args:
            user_id: User ID
            collection_type: Type of collection

        Returns:
            Collection information
        """
        try:
            collection_name = self.chroma_manager.get_user_collection_name(
                user_id,
                collection_type
            )
            collection = self.chroma_manager.get_or_create_collection(collection_name)

            count = collection.count()

            return {
                "collection_name": collection_name,
                "user_id": user_id,
                "collection_type": collection_type,
                "document_count": count,
                "metadata": collection.metadata
            }
        except Exception as e:
            logger.error(f"Error getting collection info: {e}")
            raise

    def delete_documents(
        self,
        user_id: str,
        collection_type: str,
        ids: List[str]
    ) -> Dict[str, Any]:
        """
        Delete documents from a user's collection

        Args:
            user_id: User ID
            collection_type: Type of collection
            ids: List of document IDs to delete

        Returns:
            Operation result
        """
        try:
            collection_name = self.chroma_manager.get_user_collection_name(
                user_id,
                collection_type
            )
            collection = self.chroma_manager.get_or_create_collection(collection_name)

            collection.delete(ids=ids)

            logger.info(f"Deleted {len(ids)} documents from collection for user {user_id}")

            return {
                "success": True,
                "deleted_count": len(ids),
                "deleted_ids": ids
            }
        except Exception as e:
            logger.error(f"Error deleting documents: {e}")
            raise

    def delete_user_collection(
        self,
        user_id: str,
        collection_type: str
    ) -> Dict[str, Any]:
        """
        Delete an entire user collection

        Args:
            user_id: User ID
            collection_type: Type of collection

        Returns:
            Operation result
        """
        try:
            collection_name = self.chroma_manager.get_user_collection_name(
                user_id,
                collection_type
            )
            self.chroma_manager.delete_collection(collection_name)

            logger.info(f"Deleted collection for user {user_id} - type: {collection_type}")

            return {
                "success": True,
                "collection_name": collection_name,
                "user_id": user_id
            }
        except Exception as e:
            logger.error(f"Error deleting user collection: {e}")
            raise

    def list_user_collections(self, user_id: str) -> List[Dict[str, Any]]:
        """
        List all collections for a user

        Args:
            user_id: User ID

        Returns:
            List of collection information
        """
        try:
            all_collections = self.chroma_manager.list_collections()

            user_collections = []
            for collection in all_collections:
                if collection.metadata.get("user_id") == user_id:
                    user_collections.append({
                        "name": collection.name,
                        "metadata": collection.metadata,
                        "count": collection.count()
                    })

            logger.info(f"Found {len(user_collections)} collections for user {user_id}")
            return user_collections
        except Exception as e:
            logger.error(f"Error listing user collections: {e}")
            raise


# Global vector store service instance
vector_store_service = VectorStoreService()
