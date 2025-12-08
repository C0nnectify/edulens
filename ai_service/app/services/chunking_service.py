"""
Text chunking service for splitting documents into processable chunks
"""

from typing import List, Dict, Any
import re
from app.config import settings
from app.utils.logger import logger


class ChunkingService:
    """Service for chunking text documents"""

    def __init__(
        self,
        chunk_size: int = None,
        chunk_overlap: int = None
    ):
        """
        Initialize chunking service

        Args:
            chunk_size: Size of each chunk in characters
            chunk_overlap: Overlap between chunks in characters
        """
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap or settings.chunk_overlap

    def chunk_text(
        self,
        text: str,
        metadata: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Split text into overlapping chunks

        Args:
            text: Text to chunk
            metadata: Optional metadata to attach to each chunk

        Returns:
            List of chunk dictionaries
        """
        if not text or not text.strip():
            return []

        # Clean text
        text = self._clean_text(text)

        # Split into chunks
        chunks = []
        start = 0

        while start < len(text):
            # Calculate end position
            end = start + self.chunk_size

            # Find the last sentence boundary before end
            if end < len(text):
                # Look for sentence endings
                last_period = text.rfind('.', start, end)
                last_newline = text.rfind('\n', start, end)
                last_boundary = max(last_period, last_newline)

                # Use boundary if found, otherwise use chunk_size
                if last_boundary > start:
                    end = last_boundary + 1

            # Extract chunk
            chunk_text = text[start:end].strip()

            if chunk_text:
                chunk_data = {
                    "text": chunk_text,
                    "start_index": start,
                    "end_index": end,
                    "char_count": len(chunk_text),
                    "word_count": len(chunk_text.split()),
                }

                # Add metadata if provided
                if metadata:
                    chunk_data.update(metadata)

                chunks.append(chunk_data)

            # Move to next chunk with overlap
            start = end - self.chunk_overlap if end < len(text) else end

        logger.info(f"Created {len(chunks)} chunks from text of length {len(text)}")
        return chunks

    def chunk_by_paragraphs(
        self,
        text: str,
        max_chunk_size: int = None,
        metadata: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Split text into chunks based on paragraph boundaries

        Args:
            text: Text to chunk
            max_chunk_size: Maximum size for each chunk
            metadata: Optional metadata

        Returns:
            List of chunk dictionaries
        """
        max_size = max_chunk_size or self.chunk_size

        # Split by double newlines (paragraphs)
        paragraphs = re.split(r'\n\s*\n', text)

        chunks = []
        current_chunk = ""

        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            # If paragraph alone exceeds max size, split it
            if len(paragraph) > max_size:
                if current_chunk:
                    chunks.append({
                        "text": current_chunk.strip(),
                        "char_count": len(current_chunk),
                        "word_count": len(current_chunk.split()),
                        **(metadata or {})
                    })
                    current_chunk = ""

                # Split large paragraph
                sub_chunks = self.chunk_text(paragraph, metadata)
                chunks.extend(sub_chunks)

            # If adding paragraph exceeds max size, save current chunk
            elif len(current_chunk) + len(paragraph) > max_size:
                if current_chunk:
                    chunks.append({
                        "text": current_chunk.strip(),
                        "char_count": len(current_chunk),
                        "word_count": len(current_chunk.split()),
                        **(metadata or {})
                    })
                current_chunk = paragraph

            # Add paragraph to current chunk
            else:
                current_chunk += "\n\n" + paragraph if current_chunk else paragraph

        # Add remaining chunk
        if current_chunk:
            chunks.append({
                "text": current_chunk.strip(),
                "char_count": len(current_chunk),
                "word_count": len(current_chunk.split()),
                **(metadata or {})
            })

        logger.info(f"Created {len(chunks)} paragraph-based chunks")
        return chunks

    @staticmethod
    def _clean_text(text: str) -> str:
        """
        Clean text by removing excessive whitespace

        Args:
            text: Text to clean

        Returns:
            Cleaned text
        """
        # Replace multiple spaces with single space
        text = re.sub(r' +', ' ', text)

        # Replace multiple newlines with double newline
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)

        return text.strip()

    def estimate_chunks(self, text: str) -> int:
        """
        Estimate number of chunks that will be created

        Args:
            text: Text to estimate

        Returns:
            Estimated number of chunks
        """
        if not text:
            return 0

        effective_chunk_size = self.chunk_size - self.chunk_overlap
        return max(1, (len(text) + effective_chunk_size - 1) // effective_chunk_size)
