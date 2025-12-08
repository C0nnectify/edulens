"""
Configuration management for EduLen AI Service
"""

from pydantic_settings import BaseSettings
from pydantic import Field, ConfigDict, field_validator
from typing import Optional, List, Union


class Settings(BaseSettings):
    """Application settings"""

    # Google Gemini API
    GOOGLE_API_KEY: Optional[str] = Field(default=None, env="GOOGLE_API_KEY")

    # ChromaDB Configuration
    CHROMA_PERSIST_DIRECTORY: str = Field(default="./chroma_db", env="CHROMA_PERSIST_DIRECTORY")
    CHROMA_HOST: str = Field(default="localhost", env="CHROMA_HOST")
    CHROMA_PORT: int = Field(default=8000, env="CHROMA_PORT")

    # SMTP Email Configuration
    SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    SMTP_FROM_EMAIL: Optional[str] = Field(default=None, env="SMTP_FROM_EMAIL")
    SMTP_FROM_NAME: str = Field(default="EduLen AI Service", env="SMTP_FROM_NAME")

    # LinkedIn API
    LINKEDIN_EMAIL: Optional[str] = Field(default=None, env="LINKEDIN_EMAIL")
    LINKEDIN_PASSWORD: Optional[str] = Field(default=None, env="LINKEDIN_PASSWORD")

    # Firecrawl API
    FIRECRAWL_API_KEY: Optional[str] = Field(default=None, env="FIRECRAWL_API_KEY")

    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")

    # FastAPI Configuration
    API_HOST: str = Field(default="0.0.0.0", env="API_HOST")
    API_PORT: int = Field(default=8000, env="API_PORT")
    API_RELOAD: bool = Field(default=True, env="API_RELOAD")
    DEBUG: bool = Field(default=True, env="DEBUG")

    # Security
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    RATE_LIMIT_PER_HOUR: int = Field(default=1000, env="RATE_LIMIT_PER_HOUR")

    # Embedding Model Configuration
    EMBEDDING_MODEL: str = Field(default="models/embedding-001", env="EMBEDDING_MODEL")
    EMBEDDING_DIMENSION: int = Field(default=768, env="EMBEDDING_DIMENSION")

    # Collection Names
    COLLECTION_PREFIX: str = Field(default="edulen", env="COLLECTION_PREFIX")

    # MongoDB Configuration (for multi-agent system)
    MONGODB_URI: str = Field(default="mongodb://localhost:27017", env="MONGODB_URI")
    MONGODB_DATABASE: str = Field(default="edulen_agents", env="MONGODB_DATABASE")

    # Multi-Agent System Configuration
    AGENT_CHECKPOINT_INTERVAL: int = Field(default=5, env="AGENT_CHECKPOINT_INTERVAL")
    AGENT_SESSION_TIMEOUT_MINUTES: int = Field(default=30, env="AGENT_SESSION_TIMEOUT_MINUTES")

    # Additional MongoDB Configuration
    MONGODB_DB_NAME: str = Field(default="edulens", env="MONGODB_DB_NAME")
    MONGODB_MAX_POOL_SIZE: int = Field(default=50, env="MONGODB_MAX_POOL_SIZE")
    MONGODB_MIN_POOL_SIZE: int = Field(default=10, env="MONGODB_MIN_POOL_SIZE")

    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field(default="text-embedding-3-small", env="OPENAI_MODEL")
    OPENAI_EMBEDDING_DIMENSIONS: int = Field(default=1536, env="OPENAI_EMBEDDING_DIMENSIONS")

    # Cohere Configuration
    COHERE_API_KEY: Optional[str] = Field(default=None, env="COHERE_API_KEY")

    # Hugging Face Configuration
    HUGGINGFACE_MODEL: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", env="HUGGINGFACE_MODEL")

    # Server Configuration
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    WORKERS: int = Field(default=4, env="WORKERS")

    # JWT Configuration
    JWT_SECRET: str = Field(default="your-jwt-secret-key-here", env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_EXPIRATION_MINUTES: int = Field(default=1440, env="JWT_EXPIRATION_MINUTES")

    # CORS Configuration
    ALLOWED_ORIGINS: Union[List[str], str] = Field(default=["http://localhost:3000", "http://localhost:3001"], env="ALLOWED_ORIGINS")

    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

    # File Upload Configuration
    MAX_FILE_SIZE_MB: int = Field(default=50, env="MAX_FILE_SIZE_MB")
    ALLOWED_FILE_TYPES: Union[List[str], str] = Field(default=["pdf", "docx", "txt", "png", "jpg", "jpeg"], env="ALLOWED_FILE_TYPES")
    UPLOAD_DIR: str = Field(default="./uploads", env="UPLOAD_DIR")

    @field_validator('ALLOWED_FILE_TYPES', mode='before')
    @classmethod
    def parse_allowed_file_types(cls, v):
        if isinstance(v, str):
            return [file_type.strip() for file_type in v.split(',')]
        return v

    # Document Processing Configuration
    CHUNK_SIZE: int = Field(default=1000, env="CHUNK_SIZE")
    CHUNK_OVERLAP: int = Field(default=200, env="CHUNK_OVERLAP")
    MAX_CONCURRENT_UPLOADS: int = Field(default=5, env="MAX_CONCURRENT_UPLOADS")

    # OCR Configuration
    TESSERACT_PATH: str = Field(default="/usr/bin/tesseract", env="TESSERACT_PATH")
    OCR_LANGUAGES: str = Field(default="eng", env="OCR_LANGUAGES")

    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FILE: str = Field(default="logs/ai_service.log", env="LOG_FILE")

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"  # Allow extra fields to prevent validation errors
    )

    @property
    def google_api_key(self) -> str:
        """Alias for GOOGLE_API_KEY for compatibility."""
        return self.GOOGLE_API_KEY or ""

    @property
    def mongodb_db_name(self) -> str:
        """Alias for MONGODB_DB_NAME for compatibility."""
        return self.MONGODB_DB_NAME


# Global settings instance
settings = Settings()
