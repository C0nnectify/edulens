"""Embeddings service wrapper for Ollama (improved)"""
import os
"""Embeddings service wrapper for Ollama (improved)"""
import os
import requests
from typing import List, Optional
import numpy as np
import hashlib
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

# Basic logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Environment variables (parse boolean properly)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
def _parse_bool_env(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "y")

USE_MOCK_EMB = _parse_bool_env("USE_MOCK_EMB", "false")

# Default dimension (will be validated/updated from response when possible)
DEFAULT_DIMENSION = 384


def _deterministic_seed_from_text(text: str) -> int:
    # Use hashlib to produce deterministic seed across processes/runs
    h = hashlib.sha256(text.encode("utf-8")).digest()
    # Take 4 bytes -> 32-bit unsigned int
    return int.from_bytes(h[:4], "big")


class EmbeddingsClient:
    """Wrapper for Ollama embeddings (embeddinggemma by default)."""

    def __init__(self, model: str = "embeddinggemma", timeout: int = 30, max_workers: int = 4):
        self.model = model
        self.ollama_url = OLLAMA_URL.rstrip("/")
        self.use_mock = USE_MOCK_EMB
        self.dimension = DEFAULT_DIMENSION
        self.timeout = timeout
        self.max_workers = max_workers

    def _mock_embedding(self, text: str) -> List[float]:
        seed = _deterministic_seed_from_text(text) % (2**32)
        rng = np.random.RandomState(seed)
        return rng.rand(self.dimension).tolist()

    def _extract_embedding_from_response(self, data: dict) -> Optional[List[float]]:
        """
        Try common keys to extract embedding from the Ollama response.
        Adjust this if your API returns a different shape.
        """
        # Common possibilities — adjust to your API contract
        if "embedding" in data and isinstance(data["embedding"], list):
            return data["embedding"]
        if "data" in data and isinstance(data["data"], list):
            # e.g. {"data":[{"embedding":[...]}]} or similar
            first = data["data"][0]
            if isinstance(first, dict) and "embedding" in first:
                return first["embedding"]
        # No embedding found
        return None

    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.

        Returns:
            List[float] — embedding vector (length validated when possible).
        """
        if self.use_mock:
            return self._mock_embedding(text)

        payload = {
            "model": self.model,
            # Some embed endpoints expect "input" or "prompt". Make this configurable if needed.
            "prompt": text
        }

        try:
            resp = requests.post(f"{self.ollama_url}/api/embeddings", json=payload, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            embedding = self._extract_embedding_from_response(data)

            if not embedding:
                logger.warning("No embedding in response; falling back to mock embedding.")
                return self._mock_embedding(text)

            # update dimension if it's different (first time)
            if len(embedding) != self.dimension:
                logger.info("Detected embedding dimension %d (was %d). Updating.", len(embedding), self.dimension)
                self.dimension = len(embedding)

            return embedding
        except requests.RequestException as e:
            logger.error("Network error while calling embeddings API: %s", e, exc_info=False)
            return self._mock_embedding(text)
        except ValueError as e:
            logger.error("Invalid JSON from embeddings API: %s", e, exc_info=False)
            return self._mock_embedding(text)
        except Exception as e:
            logger.exception("Unexpected error in embed_text: %s", e)
            return self._mock_embedding(text)

    def embed_batch(self, texts: List[str], parallel: bool = True) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        If parallel=True, uses threads (beware rate limits).
        """
        if self.use_mock:
            return [self._mock_embedding(t) for t in texts]

        if not texts:
            return []

        if parallel and len(texts) > 1:
            results = [None] * len(texts)
            with ThreadPoolExecutor(max_workers=min(self.max_workers, len(texts))) as ex:
                futures = {ex.submit(self.embed_text, texts[i]): i for i in range(len(texts))}
                for fut in as_completed(futures):
                    i = futures[fut]
                    try:
                        results[i] = fut.result()
                    except Exception:
                        results[i] = self._mock_embedding(texts[i])
            return results
        else:
            return [self.embed_text(t) for t in texts]


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Split text into chunks (character-based) with overlap.
    Tries to break at sentence boundaries (., ?, !, newline) within the last 100 chars.
    """
    if not text:
        return []

    if len(text) <= chunk_size:
        return [text.strip()]

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)

        if end < text_len:
            window = text[start:end]
            # search for last sentence boundary within the last 100 chars of window
            search_window = window[-100:] if len(window) > 100 else window
            # find last occurrence in the search_window and compute global index
            candidates = [
                idx for idx in (search_window.rfind('.'), search_window.rfind('!'),
                                search_window.rfind('?'), search_window.rfind('\n')) if idx != -1
            ]
            if candidates:
                last_rel = max(candidates)
                # convert to absolute index + 1 (include punctuation)
                abs_idx = start + (len(window) - len(search_window)) + last_rel + 1
                # only use sentence break if it yields progress and not too small chunk
                if abs_idx > start and (abs_idx - start) >= int(chunk_size * 0.25):
                    end = abs_idx

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # advance start, ensure progress (avoid infinite loops)
        next_start = end - overlap
        if next_start <= start:  # fallback to force progress
            next_start = end
        start = next_start

    return chunks
 # Global instance (optional)
embeddings_client = EmbeddingsClient()
