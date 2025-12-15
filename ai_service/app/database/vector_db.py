"""
Vector database operations using ChromaDB for storing and searching embeddings
"""

from typing import List, Dict, Any, Optional
import uuid
from app.core.chroma_client import chroma_manager
from app.models.document import DocumentChunk
from app.models.search import SearchResult
from app.utils.logger import logger


class VectorDatabase:
    """Vector database operations using ChromaDB"""

    def __init__(self, user_id: str):
        """
        Initialize VectorDatabase for a specific user

        Args:
            user_id: User identifier
        """
        self.user_id = user_id
        self.collection = chroma_manager.create_user_collection(
            user_id=user_id,
            collection_type="documents",
            metadata={"user_id": user_id, "type": "documents"}
        )

    async def insert_chunk(self, chunk: DocumentChunk) -> str:
        """
        Insert a document chunk with embedding into the database

        Args:
            chunk: DocumentChunk to insert

        Returns:
            Inserted chunk ID
        """
        try:
            # Prepare metadata for ChromaDB (ChromaDB only accepts str, int, float, bool)
            tags = chunk.metadata.get("tags", [])
            metadata = {
                "document_id": chunk.document_id,
                "tracking_id": chunk.tracking_id,
                "chunk_index": chunk.chunk_index,
                "filename": chunk.metadata.get("filename", ""),
                "tags": ",".join(tags) if tags else "",  # Convert list to comma-separated string
                "word_count": chunk.metadata.get("word_count", 0),
                "char_count": chunk.metadata.get("char_count", 0),
                "user_id": self.user_id
            }

            # Add chunk to ChromaDB collection
            self.collection.add(
                ids=[chunk.chunk_id],
                embeddings=[chunk.embedding],
                documents=[chunk.text],
                metadatas=[metadata]
            )

            logger.info(f"Inserted chunk {chunk.chunk_id} for document {chunk.document_id}")
            return chunk.chunk_id

        except Exception as e:
            logger.error(f"Error inserting chunk {chunk.chunk_id}: {e}")
            raise

    async def insert_chunks(self, chunks: List[DocumentChunk]) -> int:
        """
        Insert multiple document chunks in batch

        Args:
            chunks: List of DocumentChunk objects

        Returns:
            Number of chunks inserted
        """
        if not chunks:
            return 0

        try:
            # Prepare data for batch insertion
            ids = []
            embeddings = []
            documents = []
            metadatas = []

            for chunk in chunks:
                ids.append(chunk.chunk_id)
                embeddings.append(chunk.embedding)
                documents.append(chunk.text)
                
                tags = chunk.metadata.get("tags", [])
                metadata = {
                    "document_id": chunk.document_id,
                    "tracking_id": chunk.tracking_id,
                    "chunk_index": chunk.chunk_index,
                    "filename": chunk.metadata.get("filename", ""),
                    "tags": ",".join(tags) if tags else "",  # Convert list to comma-separated string
                    "word_count": chunk.metadata.get("word_count", 0),
                    "char_count": chunk.metadata.get("char_count", 0),
                    "user_id": self.user_id
                }
                metadatas.append(metadata)

            # Batch insert to ChromaDB
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )

            count = len(chunks)
            logger.info(f"Inserted {count} chunks for user {self.user_id}")
            return count

        except Exception as e:
            logger.error(f"Error inserting {len(chunks)} chunks: {e}")
            raise

    async def search_by_vector(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        document_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        min_score: Optional[float] = None,
    ) -> List[SearchResult]:
        """
        Perform semantic search using vector similarity

        Args:
            query_embedding: Query vector embedding
            top_k: Number of results to return
            document_id: Optional document ID to search within
            tags: Optional tags to filter by
            min_score: Minimum similarity score threshold

        Returns:
            List of SearchResult objects
        """
        try:
            # Build where clause for filtering
            where_clause = {"user_id": self.user_id}
            if document_id:
                where_clause["document_id"] = document_id
            # Note: ChromaDB doesn't support complex tag filtering, so we'll filter after retrieval

            # Perform vector search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k * 2,  # Get more results to account for tag filtering
                where=where_clause if where_clause != {"user_id": self.user_id} else None
            )

            # Convert ChromaDB results to SearchResult objects
            search_results = []
            if results["ids"] and results["ids"][0]:
                for i, chunk_id in enumerate(results["ids"][0]):
                    score = results["distances"][0][i] if results["distances"] else 0.0
                    
                    # Convert distance to similarity score (ChromaDB returns distances, not similarities)
                    # For cosine distance: similarity = 1 - distance
                    similarity_score = 1.0 - score if score <= 1.0 else 0.0
                    
                    # Apply min_score filter
                    if min_score and similarity_score < min_score:
                        continue

                    metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                    document = results["documents"][0][i] if results["documents"] else ""

                    # Convert comma-separated tags string back to list
                    tags_str = metadata.get("tags", "")
                    tags_list = [tag.strip() for tag in tags_str.split(",") if tag.strip()] if tags_str else []

                    # Apply tags filter if specified
                    if tags and not any(tag in tags_list for tag in tags):
                        continue

                    search_results.append(
                        SearchResult(
                            chunk_id=chunk_id,
                            document_id=metadata.get("document_id", ""),
                            tracking_id=metadata.get("tracking_id", ""),
                            text=document,
                            score=similarity_score,
                            chunk_index=metadata.get("chunk_index", 0),
                            filename=metadata.get("filename", ""),
                            tags=tags_list,
                            metadata={
                                "word_count": metadata.get("word_count", 0),
                                "char_count": metadata.get("char_count", 0)
                            }
                        )
                    )

            # Limit to requested top_k after filtering
            search_results = search_results[:top_k]

            logger.info(f"Found {len(search_results)} results for user {self.user_id}")
            return search_results

        except Exception as e:
            logger.error(f"Error performing vector search: {e}")
            raise

    async def search_by_keyword(
        self,
        query: str,
        top_k: int = 5,
        document_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        query_embedding: Optional[List[float]] = None,
    ) -> List[SearchResult]:
        """
        Perform keyword-based text search using ChromaDB's text search

        Args:
            query: Search query
            top_k: Number of results to return
            document_id: Optional document ID to search within
            tags: Optional tags to filter by

        Returns:
            List of SearchResult objects
        """
        try:
            # Build where clause for filtering
            where_clause = {"user_id": self.user_id}
            if document_id:
                where_clause["document_id"] = document_id
            # Note: ChromaDB doesn't support complex tag filtering, so we'll filter after retrieval

            # Perform text search in ChromaDB
            if query_embedding:
                # Use provided embedding to ensure dimension consistency
                results = self.collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k * 2,  # Get more results to account for tag filtering
                    where=where_clause if where_clause != {"user_id": self.user_id} else None
                )
            else:
                # Fallback to text search (may cause dimension mismatch)
                results = self.collection.query(
                    query_texts=[query],
                    n_results=top_k * 2,  # Get more results to account for tag filtering
                    where=where_clause if where_clause != {"user_id": self.user_id} else None
                )

            # Convert ChromaDB results to SearchResult objects
            search_results = []
            if results["ids"] and results["ids"][0]:
                for i, chunk_id in enumerate(results["ids"][0]):
                    score = results["distances"][0][i] if results["distances"] else 0.0
                    
                    # Convert distance to similarity score
                    similarity_score = 1.0 - score if score <= 1.0 else 0.0

                    metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                    document = results["documents"][0][i] if results["documents"] else ""

                    # Convert comma-separated tags string back to list
                    tags_str = metadata.get("tags", "")
                    tags_list = [tag.strip() for tag in tags_str.split(",") if tag.strip()] if tags_str else []

                    # Apply tags filter if specified
                    if tags and not any(tag in tags_list for tag in tags):
                        continue

                    search_results.append(
                        SearchResult(
                            chunk_id=chunk_id,
                            document_id=metadata.get("document_id", ""),
                            tracking_id=metadata.get("tracking_id", ""),
                            text=document,
                            score=similarity_score,
                            chunk_index=metadata.get("chunk_index", 0),
                            filename=metadata.get("filename", ""),
                            tags=tags_list,
                            metadata={
                                "word_count": metadata.get("word_count", 0),
                                "char_count": metadata.get("char_count", 0)
                            }
                        )
                    )

            # Limit to requested top_k after filtering
            search_results = search_results[:top_k]

            logger.info(f"Found {len(search_results)} keyword results for user {self.user_id}")
            return search_results

        except Exception as e:
            logger.error(f"Error performing keyword search: {e}")
            raise

    async def delete_document_chunks(self, document_id: str) -> int:
        """
        Delete all chunks for a specific document

        Args:
            document_id: Document identifier

        Returns:
            Number of chunks deleted
        """
        try:
            # Get all chunk IDs for the document
            results = self.collection.get(
                # Collection is already scoped per user; keep filter single-key for Chroma.
                where={"document_id": document_id}
            )
            
            if not results["ids"]:
                logger.info(f"No chunks found for document {document_id}")
                return 0

            # Delete chunks by IDs
            self.collection.delete(ids=results["ids"])
            
            count = len(results["ids"])
            logger.info(f"Deleted {count} chunks for document {document_id}")
            return count

        except Exception as e:
            logger.error(f"Error deleting chunks for document {document_id}: {e}")
            raise

    async def get_document_chunks(
        self,
        document_id: str,
        include_embeddings: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get all chunks for a specific document

        Args:
            document_id: Document identifier
            include_embeddings: Whether to include embedding vectors

        Returns:
            List of chunk dictionaries
        """
        try:
            # Get chunks from ChromaDB
            results = self.collection.get(
                # Collection is already scoped per user; keep filter single-key for Chroma.
                where={"document_id": document_id},
                include=["documents", "metadatas", "embeddings"] if include_embeddings else ["documents", "metadatas"]
            )

            # Convert to list of dictionaries
            chunks = []
            if results["ids"]:
                for i, chunk_id in enumerate(results["ids"]):
                    chunk_data = {
                        "chunk_id": chunk_id,
                        "document_id": document_id,
                        "text": results["documents"][i] if results["documents"] else "",
                        "metadata": results["metadatas"][i] if results["metadatas"] else {}
                    }
                    
                    if include_embeddings and results["embeddings"]:
                        chunk_data["embedding"] = results["embeddings"][i]
                    
                    chunks.append(chunk_data)

            # Sort by chunk_index
            chunks.sort(key=lambda x: x["metadata"].get("chunk_index", 0))
            
            logger.info(f"Retrieved {len(chunks)} chunks for document {document_id}")
            return chunks

        except Exception as e:
            logger.error(f"Error retrieving chunks for document {document_id}: {e}")
            raise

    async def create_text_index(self):
        """Create text index for keyword search (ChromaDB handles this automatically)"""
        # ChromaDB automatically creates text indexes for search
        logger.info(f"Text index ready for user {self.user_id} (ChromaDB auto-managed)")

    async def list_user_documents(self) -> List[Dict[str, Any]]:
        """List unique documents for the current user from vector store.

        Returns a list of {tracking_id, document_id, filename, chunk_count}.
        """
        try:
            results = self.collection.get(where={"user_id": self.user_id})
            docs: Dict[str, Dict[str, Any]] = {}
            if results["metadatas"]:
                for md in results["metadatas"]:
                    tracking_id = md.get("tracking_id", "")
                    if not tracking_id:
                        # skip items without tracking_id
                        continue
                    if tracking_id not in docs:
                        docs[tracking_id] = {
                            "tracking_id": tracking_id,
                            "document_id": md.get("document_id", ""),
                            "filename": md.get("filename", ""),
                            "chunk_count": 0,
                        }
                    docs[tracking_id]["chunk_count"] += 1

            return list(docs.values())
        except Exception as e:
            logger.error(f"Error listing documents for user {self.user_id}: {e}")
            raise
