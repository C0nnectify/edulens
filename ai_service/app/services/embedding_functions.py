"""Embedding function utilities.

Provides a GeminiEmbeddingFunction suitable for ChromaDB collections.
Falls back to existing Ollama EmbeddingsClient when Gemini API key is
unavailable or errors occur.

Usage:
    from app.services.embedding_functions import gemini_embedding_function
    client = chromadb.Client(...)
    collection = client.get_or_create_collection(
        name="sop_examples", embedding_function=gemini_embedding_function
    )

Environment:
    GOOGLE_API_KEY - Gemini API key (required for real embeddings)
    USE_MOCK_EMB   - if true, forces deterministic mock embeddings.

The mock embeddings delegate to the Ollama EmbeddingsClient mock logic
for consistency of vector size.
"""
from __future__ import annotations

import os
import logging
from typing import List, Sequence

try:
    import google.generativeai as genai  # type: ignore
except ImportError:  # pragma: no cover - dependency guaranteed by pyproject
    genai = None  # type: ignore

try:
    from chromadb import EmbeddingFunction  # type: ignore
except ImportError:  # pragma: no cover
    class EmbeddingFunction:  # minimal fallback so type hints still work
        def __call__(self, input: Sequence[str]) -> List[List[float]]:  # noqa: D401
            raise RuntimeError("Chromadb not installed; EmbeddingFunction unavailable.")

from app.SOP_Generator.services.embeddings import EmbeddingsClient as OllamaEmbeddingsClient

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()
USE_MOCK_EMB = os.getenv("USE_MOCK_EMB", "false").strip().lower() in ("1", "true", "yes", "y")
GEMINI_MODEL = os.getenv("GEMINI_EMBED_MODEL", "models/text-embedding-004")

# Singleton Ollama client (used for fallback & mock)
_ollama_client = OllamaEmbeddingsClient()


class GeminiEmbeddingFunction(EmbeddingFunction):
    """Custom Embedding Function for ChromaDB using Google Gemini API.

    Falls back to Ollama mock embeddings if Gemini is unavailable.
    """

    def __init__(self, model: str = GEMINI_MODEL, task_type: str = "retrieval_document") -> None:
        self.model = model
        self.task_type = task_type
        self.use_gemini = bool(GOOGLE_API_KEY) and not USE_MOCK_EMB and genai is not None

        if self.use_gemini:
            try:
                genai.configure(api_key=GOOGLE_API_KEY)
                logger.info("Gemini embedding function initialized (model=%s)", model)
            except Exception as e:  # pragma: no cover - defensive
                logger.warning("Failed to configure Gemini; falling back to mock embeddings: %s", e)
                self.use_gemini = False
        else:
            if not GOOGLE_API_KEY:
                logger.warning("GOOGLE_API_KEY not set; using mock embeddings (Ollama fallback).")
            if USE_MOCK_EMB:
                logger.info("USE_MOCK_EMB=true; forcing mock embeddings.")
            if genai is None:
                logger.warning("google-generativeai package not available; using mock embeddings.")

    def __call__(self, input: Sequence[str]) -> List[List[float]]:  # type: ignore[override]
        # Normalize input to list of strings
        texts: List[str] = list(input)
        if not texts:
            return []

        if not self.use_gemini:
            # Use Ollama client's embedding (which may itself be mock)
            return _ollama_client.embed_batch(texts, parallel=False)

        embeddings: List[List[float]] = []
        for text in texts:
            try:
                result = genai.embed_content(
                    model=self.model,
                    content=text,
                    task_type=self.task_type,
                )
                emb = result.get("embedding") if isinstance(result, dict) else None
                if not emb:
                    logger.warning("Gemini returned no embedding; using mock fallback for this text.")
                    emb = _ollama_client.embed_text(text)
                embeddings.append(emb)
            except Exception as e:  # pragma: no cover - network/runtime
                logger.error("Gemini embedding error; using mock for current text: %s", e)
                embeddings.append(_ollama_client.embed_text(text))
        return embeddings


# Public singleton instance
gemini_embedding_function = GeminiEmbeddingFunction()

__all__ = ["GeminiEmbeddingFunction", "gemini_embedding_function"]
