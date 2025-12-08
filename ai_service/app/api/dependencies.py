"""
API dependencies for authentication and authorization
"""

from typing import Optional
from fastapi import HTTPException, status, Header
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings as app_settings
from app.database.mongodb import get_database
from app.utils.logger import logger


async def get_current_user_id(x_user_id: Optional[str] = Header(None, alias="x-user-id")) -> str:
    """
    Extract and validate user ID from x-user-id header

    Args:
        x_user_id: User ID from x-user-id header

    Returns:
        User ID from header

    Raises:
        HTTPException: If user ID is missing or invalid
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="x-user-id header missing",
        )

    # Basic validation - ensure it's not empty and has reasonable length
    if not x_user_id.strip() or len(x_user_id.strip()) < 1:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
        )

    return x_user_id.strip()


# Alias for backward compatibility
get_current_user = get_current_user_id


async def get_mongodb_client() -> AsyncIOMotorClient:
    """
    Get MongoDB client instance.

    Returns:
        AsyncIOMotorClient instance
    """
    db = await get_database()
    return db.client


def get_settings():
    """
    Get application settings.

    Returns:
        Application settings
    """
    return app_settings
