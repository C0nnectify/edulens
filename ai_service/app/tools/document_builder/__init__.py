"""
Document Builder Tools - Package Init
"""

from .state import (
    DocumentType,
    ConversationPhase,
    ActionType,
    SOPTone,
    LORStrength,
    SOPCollectedData,
    LORCollectedData,
    ResumeCollectedData,
    DocumentSection,
    GeneratedDocument,
    DocumentBuilderState,
    DocumentBuilderChatRequest,
    DocumentBuilderChatResponse,
    DocumentProgress,
    create_initial_state,
    get_next_question_topic,
)

from .prompts import (
    DOCUMENT_BUILDER_SYSTEM_PROMPT,
    SOP_SYSTEM_PROMPT,
    LOR_SYSTEM_PROMPT,
    RESUME_SYSTEM_PROMPT,
    get_sop_prompt,
    get_lor_prompt,
    get_resume_prompt,
    format_generation_prompt,
)

from .graph import (
    DocumentBuilderOrchestrator,
    get_document_builder_orchestrator,
)

__all__ = [
    # State models
    "DocumentType",
    "ConversationPhase",
    "ActionType",
    "SOPTone",
    "LORStrength",
    "SOPCollectedData",
    "LORCollectedData",
    "ResumeCollectedData",
    "DocumentSection",
    "GeneratedDocument",
    "DocumentBuilderState",
    "DocumentBuilderChatRequest",
    "DocumentBuilderChatResponse",
    "DocumentProgress",
    "create_initial_state",
    "get_next_question_topic",
    # Prompts
    "DOCUMENT_BUILDER_SYSTEM_PROMPT",
    "SOP_SYSTEM_PROMPT",
    "LOR_SYSTEM_PROMPT",
    "RESUME_SYSTEM_PROMPT",
    "get_sop_prompt",
    "get_lor_prompt",
    "get_resume_prompt",
    "format_generation_prompt",
    # Orchestrator
    "DocumentBuilderOrchestrator",
    "get_document_builder_orchestrator",
]
