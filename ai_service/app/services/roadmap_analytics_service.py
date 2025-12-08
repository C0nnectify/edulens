"""
Analytics service for tracking Dream Mode events
"""

from datetime import datetime
from typing import Optional, Dict, Any
from bson import ObjectId
import logging

from app.models.roadmap import AnalyticsEventRequest, AnalyticsEventType
from app.database.mongodb import get_database

logger = logging.getLogger(__name__)


class RoadmapAnalyticsService:
    """Service for tracking and storing roadmap analytics"""
    
    def __init__(self):
        self.collection_name = "roadmap_analytics"
    
    async def track_event(
        self,
        event: AnalyticsEventRequest
    ) -> str:
        """
        Track an analytics event to MongoDB
        
        Args:
            event: Analytics event request
            
        Returns:
            ID of the inserted event document
        """
        try:
            db = await get_database()
            collection = db[self.collection_name]
            
            # Prepare document
            event_doc = {
                "event_type": event.event_type.value,
                "stage_id": event.stage_id,
                "session_id": event.session_id,
                "user_id": event.user_id,
                "metadata": event.metadata or {},
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow()
            }
            
            # Insert into MongoDB
            result = await collection.insert_one(event_doc)
            
            logger.info(
                f"Tracked event: {event.event_type.value} "
                f"(session: {event.session_id[:8]}...)"
            )
            
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Failed to track analytics event: {e}")
            # Don't raise - analytics failures shouldn't break the app
            return str(ObjectId())
    
    async def get_event_stats(
        self,
        event_type: Optional[AnalyticsEventType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get analytics statistics
        
        Args:
            event_type: Optional filter by event type
            start_date: Optional start date filter
            end_date: Optional end date filter
            
        Returns:
            Dictionary with statistics
        """
        try:
            db = await get_database()
            collection = db[self.collection_name]
            
            # Build query
            query: Dict[str, Any] = {}
            if event_type:
                query["event_type"] = event_type.value
            if start_date or end_date:
                query["timestamp"] = {}
                if start_date:
                    query["timestamp"]["$gte"] = start_date
                if end_date:
                    query["timestamp"]["$lte"] = end_date
            
            # Get counts
            total_events = await collection.count_documents(query)
            
            # Get unique sessions
            unique_sessions = await collection.distinct("session_id", query)
            
            # Get event type breakdown
            pipeline = [
                {"$match": query},
                {"$group": {
                    "_id": "$event_type",
                    "count": {"$sum": 1}
                }}
            ]
            event_breakdown = await collection.aggregate(pipeline).to_list(None)
            
            return {
                "total_events": total_events,
                "unique_sessions": len(unique_sessions),
                "event_breakdown": {
                    item["_id"]: item["count"] 
                    for item in event_breakdown
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get analytics stats: {e}")
            return {
                "total_events": 0,
                "unique_sessions": 0,
                "event_breakdown": {}
            }


# Global service instance
roadmap_analytics_service = RoadmapAnalyticsService()
