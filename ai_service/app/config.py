"""
Application configuration and settings
"""

from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # MongoDB Configuration
    mongodb_uri: str = Field(default="mongodb://127.0.0.1:27017", env="MONGODB_URI")
    mongodb_db_name: str = Field(default="edulens", env="MONGODB_DB_NAME")
    mongodb_database: str = Field(default="edulen_agents", env="MONGODB_DATABASE")
    mongodb_max_pool_size: int = Field(default=50, env="MONGODB_MAX_POOL_SIZE")
    mongodb_min_pool_size: int = Field(default=10, env="MONGODB_MIN_POOL_SIZE")

    # OpenAI Configuration
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    openai_model: str = Field(default="text-embedding-3-small", env="OPENAI_MODEL")
    openai_embedding_dimensions: int = Field(default=1536, env="OPENAI_EMBEDDING_DIMENSIONS")

    # Cohere Configuration
    cohere_api_key: Optional[str] = Field(default=None, env="COHERE_API_KEY")

    # HuggingFace Configuration
    huggingface_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        env="HUGGINGFACE_MODEL"
    )

    # Firecrawl Configuration (for web scraping)
    firecrawl_api_key: Optional[str] = Field(default=None, env="FIRECRAWL_API_KEY")

    # Google Gemini Configuration (for AI extraction)
    google_api_key: Optional[str] = Field(default=None, env="GOOGLE_API_KEY")
    google_model: str = Field(default="gemini-2.5-flash", env="GOOGLE_MODEL")

    # GROQ (Sanity) Configuration
    groq_api_key: Optional[str] = Field(default=None, env="GROQ_API_KEY")

    # SMTP Email Configuration
    smtp_host: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    smtp_port: int = Field(default=587, env="SMTP_PORT")
    smtp_username: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    smtp_password: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    smtp_from_email: Optional[str] = Field(default=None, env="SMTP_FROM_EMAIL")
    smtp_from_name: str = Field(default="EduLen AI Service", env="SMTP_FROM_NAME")

    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    workers: int = Field(default=4, env="WORKERS")

    # Security Configuration
    secret_key: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
    
    # Redis Configuration
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")

    # JWT Configuration
    jwt_secret: str = Field(default="your-secret-key-here", env="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiration_minutes: int = Field(default=1440, env="JWT_EXPIRATION_MINUTES")

    # CORS Configuration
    allowed_origins: Union[List[str], str] = Field(
        default=["http://localhost:3000"],
        env="ALLOWED_ORIGINS"
    )

    # File Upload Configuration
    max_file_size_mb: int = Field(default=50, env="MAX_FILE_SIZE_MB")
    allowed_file_types: Union[List[str], str] = Field(
        default=["pdf", "docx", "txt", "png", "jpg", "jpeg"],
        env="ALLOWED_FILE_TYPES"
    )
    upload_dir: str = Field(default="./uploads", env="UPLOAD_DIR")

    # Processing Configuration
    chunk_size: int = Field(default=1000, env="CHUNK_SIZE")
    chunk_overlap: int = Field(default=200, env="CHUNK_OVERLAP")
    max_concurrent_uploads: int = Field(default=5, env="MAX_CONCURRENT_UPLOADS")

    # OCR Configuration
    tesseract_path: str = Field(default="/usr/bin/tesseract", env="TESSERACT_PATH")
    ocr_languages: str = Field(default="eng", env="OCR_LANGUAGES")

    # Logging Configuration
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file: str = Field(default="logs/ai_service.log", env="LOG_FILE")

    # GradCafe Collection Configuration
    gradcafe_collection_enabled: bool = Field(default=True, env="GRADCAFE_COLLECTION_ENABLED")
    gradcafe_daily_collection_time: str = Field(default="03:00", env="GRADCAFE_DAILY_COLLECTION_TIME")
    gradcafe_default_limit: int = Field(default=50, env="GRADCAFE_DEFAULT_LIMIT", ge=1, le=500)
    gradcafe_scraper_path: str = Field(
        default="./train_ml/gradcafe_scraper.py",
        env="GRADCAFE_SCRAPER_PATH"
    )
    gradcafe_notification_emails: Union[List[str], str] = Field(
        default=[],
        env="GRADCAFE_NOTIFICATION_EMAILS"
    )

    @field_validator("gradcafe_notification_emails", mode="before")
    @classmethod
    def parse_notification_emails(cls, v):
        """Parse comma-separated notification emails string"""
        if isinstance(v, str):
            if v.strip() == "":
                return []
            return [email.strip() for email in v.split(",") if email.strip()]
        elif isinstance(v, list):
            return v
        else:
            return []

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v):
        """Parse comma-separated origins string"""
        if isinstance(v, str):
            if v.strip() == "":
                return ["http://localhost:3000"]  # Default value if empty
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        else:
            return ["http://localhost:3000"]  # Default fallback

    @field_validator("allowed_file_types", mode="before")
    @classmethod
    def parse_file_types(cls, v):
        """Parse comma-separated file types string"""
        if isinstance(v, str):
            if v.strip() == "":
                return ["pdf", "docx", "txt", "png", "jpg", "jpeg"]  # Default value if empty
            return [ft.strip() for ft in v.split(",") if ft.strip()]
        elif isinstance(v, list):
            return v
        else:
            return ["pdf", "docx", "txt", "png", "jpg", "jpeg"]  # Default fallback

    @property
    def max_file_size_bytes(self) -> int:
        """Convert max file size from MB to bytes"""
        return self.max_file_size_mb * 1024 * 1024

    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment.lower() == "production"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(os.path.dirname(settings.log_file) if settings.log_file else "logs", exist_ok=True)
