"""In-memory session state manager with MongoDB persistence"""

from typing import Dict, Optional, Any
from datetime import datetime, timedelta
import asyncio
import logging

logger = logging.getLogger(__name__)


class SessionStateManager:
    """
    Manages active session states in-memory with automatic checkpointing to MongoDB.
    Implements a hybrid memory approach for performance + persistence.
    """

    def __init__(
        self,
        mongodb_manager,
        checkpoint_interval: int = 5,  # Checkpoint every N state updates
        session_timeout_minutes: int = 30
    ):
        self.mongodb_manager = mongodb_manager
        self.checkpoint_interval = checkpoint_interval
        self.session_timeout = timedelta(minutes=session_timeout_minutes)

        # In-memory storage
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.session_update_counts: Dict[str, int] = {}
        self.session_last_access: Dict[str, datetime] = {}

        # Cleanup task
        self._cleanup_task: Optional[asyncio.Task] = None

    async def start_cleanup_task(self):
        """Start background task to cleanup expired sessions"""
        self._cleanup_task = asyncio.create_task(self._cleanup_expired_sessions())

    async def _cleanup_expired_sessions(self):
        """Periodically cleanup expired sessions from memory"""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                now = datetime.utcnow()
                expired_sessions = [
                    session_id
                    for session_id, last_access in self.session_last_access.items()
                    if now - last_access > self.session_timeout
                ]

                for session_id in expired_sessions:
                    await self._checkpoint_session(session_id)
                    self._remove_from_memory(session_id)
                    logger.info(f"Cleaned up expired session: {session_id}")

            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")

    def _remove_from_memory(self, session_id: str):
        """Remove session from in-memory storage"""
        self.active_sessions.pop(session_id, None)
        self.session_update_counts.pop(session_id, None)
        self.session_last_access.pop(session_id, None)

    async def get_session_state(self, session_id: str) -> Optional[Dict]:
        """
        Get session state from memory or load from MongoDB if not in memory.
        """
        # Check in-memory first
        if session_id in self.active_sessions:
            self.session_last_access[session_id] = datetime.utcnow()
            return self.active_sessions[session_id]

        # Load from MongoDB
        session_doc = await self.mongodb_manager.get_session(session_id)
        if session_doc:
            state = session_doc.get("graph_state", {})
            self.active_sessions[session_id] = state
            self.session_update_counts[session_id] = 0
            self.session_last_access[session_id] = datetime.utcnow()
            logger.info(f"Loaded session {session_id} from MongoDB to memory")
            return state

        return None

    async def update_session_state(
        self,
        session_id: str,
        state_update: Dict,
        force_checkpoint: bool = False
    ):
        """
        Update session state in memory and conditionally checkpoint to MongoDB.
        """
        # Update in-memory state
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = {}

        self.active_sessions[session_id].update(state_update)
        self.session_last_access[session_id] = datetime.utcnow()

        # Increment update counter
        self.session_update_counts[session_id] = (
            self.session_update_counts.get(session_id, 0) + 1
        )

        # Checkpoint if interval reached or forced
        if force_checkpoint or (
            self.session_update_counts[session_id] >= self.checkpoint_interval
        ):
            await self._checkpoint_session(session_id)
            self.session_update_counts[session_id] = 0

    async def _checkpoint_session(self, session_id: str):
        """Save current state to MongoDB"""
        if session_id in self.active_sessions:
            await self.mongodb_manager.update_session_state(
                session_id=session_id,
                graph_state=self.active_sessions[session_id]
            )
            logger.debug(f"Checkpointed session {session_id} to MongoDB")

    async def create_session(
        self,
        session_id: str,
        user_id: str,
        task_type: str,
        initial_state: Optional[Dict] = None,
        metadata: Optional[Dict] = None
    ):
        """Create a new session in both memory and MongoDB"""
        # Create in MongoDB
        await self.mongodb_manager.create_session(
            session_id=session_id,
            user_id=user_id,
            task_type=task_type,
            metadata=metadata
        )

        # Initialize in memory
        self.active_sessions[session_id] = initial_state or {}
        self.session_update_counts[session_id] = 0
        self.session_last_access[session_id] = datetime.utcnow()

        logger.info(f"Created new session {session_id} for user {user_id}")

    async def end_session(self, session_id: str, status: str = "completed"):
        """End a session and perform final checkpoint"""
        # Final checkpoint
        if session_id in self.active_sessions:
            await self.mongodb_manager.update_session_state(
                session_id=session_id,
                graph_state=self.active_sessions[session_id],
                status=status
            )

        # Remove from memory
        self._remove_from_memory(session_id)
        logger.info(f"Ended session {session_id} with status: {status}")

    async def get_active_session_count(self) -> int:
        """Get count of active sessions in memory"""
        return len(self.active_sessions)

    async def shutdown(self):
        """Shutdown manager and checkpoint all active sessions"""
        logger.info("Shutting down SessionStateManager...")

        # Cancel cleanup task
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

        # Checkpoint all active sessions
        for session_id in list(self.active_sessions.keys()):
            await self._checkpoint_session(session_id)

        logger.info("SessionStateManager shutdown complete")
