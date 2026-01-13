"""
Embedding generation service (OpenAI disabled).

Supported providers:
- HuggingFace (sentence-transformers)
- Cohere
"""

from typing import List, Optional, Tuple
from app.config import settings
from app.utils.logger import logger


class EmbeddingService:
    """Service for generating text embeddings"""

    def __init__(self):
        """Initialize embedding service"""
        self.sentence_transformer = None
        self._sentence_transformer_model_name: Optional[str] = None
        self.cohere_client = None

        logger.info("Embedding service initialized (OpenAI disabled)")

    async def generate_embeddings(
        self,
        texts: List[str],
        provider: str = "huggingface",
        model: Optional[str] = None
    ) -> Tuple[List[List[float]], int]:
        """
        Generate embeddings for a list of texts

        Args:
            texts: List of text strings to embed
            provider: Provider to use (openai, huggingface, cohere)
            model: Optional specific model to use

        Returns:
            Tuple of (embeddings list, dimension count)
        """
        if not texts:
            return [], 0

        if provider == "huggingface":
            return await self._generate_huggingface_embeddings(texts, model)
        elif provider == "cohere":
            return await self._generate_cohere_embeddings(texts, model)
        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")

    # OpenAI embeddings are intentionally disabled to eradicate OpenAI usage.
    # Leaving a stub for clarity.
    async def _generate_openai_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> Tuple[List[List[float]], int]:
        raise NotImplementedError("OpenAI embeddings are disabled in this deployment")

    async def _generate_huggingface_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> Tuple[List[List[float]], int]:
        """
        Generate embeddings using HuggingFace sentence-transformers

        Args:
            texts: List of texts
            model: HuggingFace model to use

        Returns:
            Tuple of (embeddings, dimensions)
        """
        try:
            model_name = model or settings.huggingface_model

            # Import lazily to keep process startup memory low (important on Render/free tiers).
            from sentence_transformers import SentenceTransformer

            # Load model (cached after first load)
            if self.sentence_transformer is None or self._sentence_transformer_model_name != model_name:
                logger.info(f"Loading HuggingFace model: {model_name}")
                self.sentence_transformer = SentenceTransformer(model_name)
                self._sentence_transformer_model_name = model_name

            # Generate embeddings
            embeddings = self.sentence_transformer.encode(
                texts,
                show_progress_bar=False,
                convert_to_numpy=True
            )

            # Convert to list format
            embeddings_list = embeddings.tolist()
            dimensions = len(embeddings_list[0]) if embeddings_list else 0

            logger.info(
                f"Generated {len(embeddings_list)} HuggingFace embeddings "
                f"with dimension {dimensions}"
            )

            return embeddings_list, dimensions

        except Exception as e:
            logger.error(f"Error generating HuggingFace embeddings: {e}")
            raise

    async def _generate_cohere_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> Tuple[List[List[float]], int]:
        """
        Generate embeddings using Cohere

        Args:
            texts: List of texts
            model: Cohere model to use

        Returns:
            Tuple of (embeddings, dimensions)
        """
        if not settings.cohere_api_key:
            raise ValueError("Cohere API key not configured")

        try:
            import cohere

            if self.cohere_client is None:
                self.cohere_client = cohere.Client(settings.cohere_api_key)

            model_name = model or "embed-english-v3.0"

            # Process in batches
            batch_size = 96
            all_embeddings = []

            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]

                response = self.cohere_client.embed(
                    texts=batch,
                    model=model_name,
                    input_type="search_document"
                )

                all_embeddings.extend(response.embeddings)

            dimensions = len(all_embeddings[0]) if all_embeddings else 0

            logger.info(
                f"Generated {len(all_embeddings)} Cohere embeddings "
                f"with dimension {dimensions}"
            )

            return all_embeddings, dimensions

        except Exception as e:
            logger.error(f"Error generating Cohere embeddings: {e}")
            raise

    async def generate_query_embedding(
        self,
        query: str,
        provider: str = "huggingface",
        model: Optional[str] = None
    ) -> List[float]:
        """
        Generate embedding for a single query

        Args:
            query: Query text
            provider: Provider to use
            model: Optional model

        Returns:
            Query embedding vector
        """
        embeddings, _ = await self.generate_embeddings([query], provider, model)
        return embeddings[0] if embeddings else []

    @staticmethod
    def get_supported_providers() -> List[str]:
        """Get list of supported embedding providers"""
        return ["huggingface", "cohere"]


# Global instance
embedding_service = EmbeddingService()
