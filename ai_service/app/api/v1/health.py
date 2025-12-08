"""
Health check endpoints
"""

from fastapi import APIRouter
from datetime import datetime
from app.config import settings
from app.database.mongodb import _client

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": settings.environment,
    }


@router.get("/db")
async def database_health():
    """Check database connectivity"""
    try:
        if _client is None:
            return {
                "status": "disconnected",
                "message": "MongoDB client not initialized"
            }

        await _client.admin.command('ping')

        return {
            "status": "healthy",
            "database": settings.mongodb_db_name,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }
