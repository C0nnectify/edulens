"""MongoDB memory management for LangGraph agents"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
import logging

logger = logging.getLogger(__name__)


class MongoDBMemoryManager:
    """Manages agent sessions and messages in MongoDB"""

    def __init__(self, connection_string: str, database_name: str = "edulen_agents"):
        self.client = AsyncIOMotorClient(connection_string)
        self.db: AsyncIOMotorDatabase = self.client[database_name]
        self.sessions = self.db["agent_sessions"]
        self.messages = self.db["agent_session_messages"]
        self.memory_store = self.db["agent_memory_store"]

    async def initialize_indexes(self):
        """Create necessary indexes for optimal query performance"""
        # Sessions indexes
        await self.sessions.create_index([("session_id", ASCENDING)], unique=True)
        await self.sessions.create_index([("user_id", ASCENDING)])
        await self.sessions.create_index([("status", ASCENDING)])
        await self.sessions.create_index([("created_at", DESCENDING)])

        # Messages indexes
        await self.messages.create_index([("session_id", ASCENDING)])
        await self.messages.create_index([("message_id", ASCENDING)], unique=True)
        await self.messages.create_index([("session_id", ASCENDING), ("sequence_number", ASCENDING)])
        await self.messages.create_index([("created_at", DESCENDING)])

        # Memory store indexes
        await self.memory_store.create_index([("user_id", ASCENDING)])
        await self.memory_store.create_index([("namespace", ASCENDING), ("key", ASCENDING)])
        await self.memory_store.create_index([("created_at", DESCENDING)])

        logger.info("MongoDB indexes initialized successfully")

    async def create_session(
        self,
        session_id: str,
        user_id: str,
        task_type: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create a new agent session"""
        session_doc = {
            "session_id": session_id,
            "user_id": user_id,
            "agent_type": "multi_agent_system",
            "status": "active",
            "context": {
                "task_type": task_type,
                "intent": "",
                "metadata": metadata or {}
            },
            "graph_state": {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "completed_at": None
        }

        await self.sessions.insert_one(session_doc)
        logger.info(f"Created session {session_id} for user {user_id}")
        return session_doc

    async def get_session(self, session_id: str) -> Optional[Dict]:
        """Retrieve a session by ID"""
        return await self.sessions.find_one({"session_id": session_id})

    async def update_session_state(
        self,
        session_id: str,
        graph_state: Dict,
        status: Optional[str] = None
    ):
        """Update session's graph state"""
        update_doc = {
            "graph_state": graph_state,
            "updated_at": datetime.utcnow()
        }

        if status:
            update_doc["status"] = status
            if status == "completed":
                update_doc["completed_at"] = datetime.utcnow()

        await self.sessions.update_one(
            {"session_id": session_id},
            {"$set": update_doc}
        )

    async def add_message(
        self,
        session_id: str,
        message_id: str,
        role: str,
        content: str,
        agent_name: Optional[str] = None,
        tool_calls: Optional[List] = None,
        tool_results: Optional[List] = None,
        metadata: Optional[Dict] = None
    ):
        """Add a message to the session history"""
        # Get sequence number
        last_message = await self.messages.find_one(
            {"session_id": session_id},
            sort=[("sequence_number", DESCENDING)]
        )
        sequence_number = (last_message["sequence_number"] + 1) if last_message else 0

        message_doc = {
            "session_id": session_id,
            "message_id": message_id,
            "role": role,
            "content": content,
            "agent_name": agent_name,
            "tool_calls": tool_calls,
            "tool_results": tool_results,
            "embedding": None,  # To be added later if needed
            "metadata": metadata or {},
            "created_at": datetime.utcnow(),
            "sequence_number": sequence_number
        }

        await self.messages.insert_one(message_doc)

    async def get_session_messages(
        self,
        session_id: str,
        limit: Optional[int] = None
    ) -> List[Dict]:
        """Retrieve all messages for a session in order"""
        cursor = self.messages.find(
            {"session_id": session_id}
        ).sort("sequence_number", ASCENDING)

        if limit:
            cursor = cursor.limit(limit)

        return await cursor.to_list(length=None)

    async def store_long_term_memory(
        self,
        user_id: str,
        namespace: str,
        key: str,
        value: Any,
        ttl_days: Optional[int] = None
    ):
        """Store long-term memory that persists across sessions"""
        memory_doc = {
            "user_id": user_id,
            "namespace": namespace,
            "key": key,
            "value": value,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        if ttl_days:
            from datetime import timedelta
            memory_doc["expires_at"] = datetime.utcnow() + timedelta(days=ttl_days)

        await self.memory_store.update_one(
            {"user_id": user_id, "namespace": namespace, "key": key},
            {"$set": memory_doc},
            upsert=True
        )

    async def get_long_term_memory(
        self,
        user_id: str,
        namespace: str,
        key: str
    ) -> Optional[Any]:
        """Retrieve long-term memory"""
        doc = await self.memory_store.find_one({
            "user_id": user_id,
            "namespace": namespace,
            "key": key
        })

        if doc and "expires_at" in doc:
            if doc["expires_at"] < datetime.utcnow():
                # Memory expired
                await self.memory_store.delete_one({"_id": doc["_id"]})
                return None

        return doc["value"] if doc else None

    async def get_user_sessions(
        self,
        user_id: str,
        limit: int = 10,
        status: Optional[str] = None
    ) -> List[Dict]:
        """Get recent sessions for a user"""
        query = {"user_id": user_id}
        if status:
            query["status"] = status

        cursor = self.sessions.find(query).sort("created_at", DESCENDING).limit(limit)
        return await cursor.to_list(length=limit)

    async def close(self):
        """Close MongoDB connection"""
        self.client.close()
