"""
MongoDB connection and operations
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import Optional
from app.config import settings
from app.utils.logger import logger

# Global MongoDB client instance
_client: Optional[AsyncIOMotorClient] = None


async def connect_to_mongodb() -> AsyncIOMotorClient:
    """
    Create MongoDB connection with connection pooling

    Returns:
        AsyncIOMotorClient instance
    """
    global _client

    if _client is None:
        logger.info(f"Connecting to MongoDB at {settings.mongodb_uri}")
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            maxPoolSize=settings.mongodb_max_pool_size,
            minPoolSize=settings.mongodb_min_pool_size,
        )

        # Verify connection
        try:
            await _client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    return _client


async def close_mongodb_connection():
    """Close MongoDB connection"""
    global _client

    if _client is not None:
        logger.info("Closing MongoDB connection")
        _client.close()
        _client = None


def get_database() -> AsyncIOMotorDatabase:
    """
    Get MongoDB database instance

    Returns:
        AsyncIOMotorDatabase instance
    """
    if _client is None:
        raise RuntimeError("MongoDB client not initialized. Call connect_to_mongodb() first.")

    return _client[settings.mongodb_db_name]


def get_documents_collection() -> AsyncIOMotorCollection:
    """
    Get documents metadata collection

    Returns:
        AsyncIOMotorCollection for documents_metadata
    """
    db = get_database()
    return db["documents_metadata"]


def get_vectors_collection(user_id: str) -> AsyncIOMotorCollection:
    """
    Get user-specific vectors collection

    Args:
        user_id: User identifier

    Returns:
        AsyncIOMotorCollection for user's vectors
    """
    db = get_database()
    collection_name = f"vectors_{user_id}"
    return db[collection_name]


def get_admission_data_collection() -> AsyncIOMotorCollection:
    """
    Get admission data collection

    Returns:
        AsyncIOMotorCollection for admission_data
    """
    db = get_database()
    return db["admission_data"]


def get_profile_evaluations_collection() -> AsyncIOMotorCollection:
    """
    Get profile evaluations collection

    Returns:
        AsyncIOMotorCollection for profile_evaluations
    """
    db = get_database()
    return db["profile_evaluations"]


def get_ml_models_collection() -> AsyncIOMotorCollection:
    """
    Get ML models metadata collection

    Returns:
        AsyncIOMotorCollection for ml_models
    """
    db = get_database()
    return db["ml_models"]


async def create_indexes():
    """Create necessary database indexes for performance"""
    logger.info("Creating database indexes")

    # Documents metadata indexes
    docs_collection = get_documents_collection()
    await docs_collection.create_index("document_id", unique=True)
    await docs_collection.create_index("user_id")
    await docs_collection.create_index("tracking_id")
    await docs_collection.create_index("file_hash")
    await docs_collection.create_index([("user_id", 1), ("tags", 1)])
    await docs_collection.create_index("uploaded_at")

    # Admission data indexes
    admission_collection = get_admission_data_collection()
    await admission_collection.create_index("data_point_id", unique=True)
    await admission_collection.create_index("hash", unique=True)
    await admission_collection.create_index("user_id")
    await admission_collection.create_index([("program.university_name", 1), ("program.program_name", 1)])
    await admission_collection.create_index([("university", 1), ("program", 1)])
    await admission_collection.create_index("decision")
    await admission_collection.create_index("application_year")
    await admission_collection.create_index([("profile.gpa", 1), ("decision", 1)])
    await admission_collection.create_index("verified")
    await admission_collection.create_index("scraped_at")
    await admission_collection.create_index("collection_job_id")
    await admission_collection.create_index("completeness_score")
    await admission_collection.create_index([("university", 1), ("decision", 1)])
    await admission_collection.create_index([("season", 1), ("decision_date", -1)])

    # Profile evaluations indexes
    evaluations_collection = get_profile_evaluations_collection()
    await evaluations_collection.create_index("evaluation_id", unique=True)
    await evaluations_collection.create_index("user_id")
    await evaluations_collection.create_index("evaluation_date")
    await evaluations_collection.create_index([("user_id", 1), ("evaluation_date", -1)])

    # ML models indexes
    models_collection = get_ml_models_collection()
    await models_collection.create_index("model_id", unique=True)
    await models_collection.create_index([("is_active", 1), ("is_deprecated", 1)])
    await models_collection.create_index("training_date")

    # GradCafe collection jobs indexes
    db = get_database()
    jobs_collection = db["gradcafe_collection_jobs"]
    await jobs_collection.create_index("job_id", unique=True)
    await jobs_collection.create_index("status")
    await jobs_collection.create_index("user_id")
    await jobs_collection.create_index("celery_task_id")
    await jobs_collection.create_index("created_at")
    await jobs_collection.create_index([("status", 1), ("created_at", -1)])
    await jobs_collection.create_index([("status", 1), ("priority", 1)])

    # GradCafe collection history indexes
    history_collection = db["gradcafe_collection_history"]
    await history_collection.create_index("history_id", unique=True)
    await history_collection.create_index("job_id")
    await history_collection.create_index("started_at")
    await history_collection.create_index([("started_at", -1)])
    await history_collection.create_index("status")

    # GradCafe schedule config indexes
    schedule_collection = db["gradcafe_schedule_config"]
    await schedule_collection.create_index("name", unique=True)

    logger.info("Database indexes created successfully")
