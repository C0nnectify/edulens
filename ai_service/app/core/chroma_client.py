"""
ChromaDB Client Manager
Handles ChromaDB connections and collection management
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import Optional, Dict, Any
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class ChromaManager:
    """Manages ChromaDB client and collections"""

    def __init__(self):
        self._client: Optional[chromadb.Client] = None
        self._collections: Dict[str, Any] = {}

    def initialize(self):
        """Initialize ChromaDB client with persistent storage"""
        try:
            self._client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIRECTORY,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            logger.info(f"ChromaDB initialized at {settings.CHROMA_PERSIST_DIRECTORY}")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise

    def get_client(self) -> chromadb.Client:
        """Get ChromaDB client instance"""
        if self._client is None:
            raise RuntimeError("ChromaDB client not initialized. Call initialize() first.")
        return self._client

    def get_or_create_collection(
        self,
        collection_name: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Get or create a collection"""
        if collection_name in self._collections:
            return self._collections[collection_name]

        try:
            collection = self._client.get_or_create_collection(
                name=collection_name,
                metadata=metadata or {}
            )
            self._collections[collection_name] = collection
            logger.info(f"Collection '{collection_name}' ready")
            return collection
        except Exception as e:
            logger.error(f"Error creating collection '{collection_name}': {e}")
            raise

    def get_user_collection_name(self, user_id: str, collection_type: str = "documents") -> str:
        """Generate user-specific collection name"""
        return f"{settings.COLLECTION_PREFIX}_user_{user_id}_{collection_type}"

    def create_user_collection(
        self,
        user_id: str,
        collection_type: str = "documents",
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Create a user-specific collection"""
        collection_name = self.get_user_collection_name(user_id, collection_type)
        user_metadata = {
            "user_id": user_id,
            "type": collection_type,
            **(metadata or {})
        }
        return self.get_or_create_collection(collection_name, user_metadata)

    def delete_collection(self, collection_name: str):
        """Delete a collection"""
        try:
            self._client.delete_collection(collection_name)
            if collection_name in self._collections:
                del self._collections[collection_name]
            logger.info(f"Collection '{collection_name}' deleted")
        except Exception as e:
            logger.error(f"Error deleting collection '{collection_name}': {e}")
            raise

    def list_collections(self):
        """List all collections"""
        try:
            return self._client.list_collections()
        except Exception as e:
            logger.error(f"Error listing collections: {e}")
            raise

    def heartbeat(self) -> int:
        """Check ChromaDB connection"""
        try:
            return self._client.heartbeat()
        except Exception as e:
            logger.error(f"ChromaDB heartbeat failed: {e}")
            raise

    def reset(self):
        """Reset ChromaDB (use with caution!)"""
        try:
            self._client.reset()
            self._collections.clear()
            logger.warning("ChromaDB reset performed")
        except Exception as e:
            logger.error(f"Error resetting ChromaDB: {e}")
            raise

    def close(self):
        """Close ChromaDB client"""
        self._collections.clear()
        self._client = None
        logger.info("ChromaDB client closed")


# Global ChromaDB manager instance
chroma_manager = ChromaManager()
