"""
API endpoints for SOP Generator service.

This module provides RESTful endpoints for the interview-based SOP generation system,
including session management, answer submission, and SOP generation.
"""

import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from ...api.dependencies import get_current_user, get_mongodb_client, get_settings
from ...models.sop_generator import (
    AnswerEditRequest,
    AnswerSubmitRequest,
    GenerateSOPRequest,
    InterviewQuestion,
    InterviewSession,
    ProgressResponse,
    RegenerateSOPRequest,
    SessionCreateRequest,
    SessionResponse,
    SessionStatus,
    SOPDraft,
    SOPDraftResponse,
    ValidationResponse,
)
from ...services.sop_export_service import SOPExportService
from ...services.sop_generator_service import SOPGeneratorService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sop-generator", tags=["SOP Generator"])


async def get_sop_service(
    mongodb_client=Depends(get_mongodb_client),
    settings=Depends(get_settings),
) -> SOPGeneratorService:
    """
    Dependency to get SOP generator service instance.

    Args:
        mongodb_client: MongoDB client
        settings: Application settings

    Returns:
        SOPGeneratorService instance
    """
    return SOPGeneratorService(
        mongodb_client=mongodb_client,
        db_name=settings.mongodb_db_name,
        gemini_api_key=settings.google_api_key,
    )


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    request: SessionCreateRequest,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> SessionResponse:
    """
    Create a new interview session.

    This endpoint initializes a new SOP generation session with personalized questions
    based on the program and university details provided.

    Args:
        request: Session creation request with program details
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        Session response with first question

    Raises:
        HTTPException: If session creation fails
    """
    try:
        session = await service.create_session(user_id, request)

        # Get first question
        first_question = service.get_current_question(session)

        return SessionResponse(
            session_id=session.session_id,
            status=session.status,
            progress_percentage=session.progress_percentage,
            current_question=first_question,
            total_questions=session.total_questions,
            answered_questions=session.answered_questions,
            message="Session created successfully. Let's begin the interview!",
        )
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create session: {str(e)}",
        )


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> SessionResponse:
    """
    Get an existing interview session.

    Retrieves the current state of an interview session including progress,
    answered questions, and the next question to answer.

    Args:
        session_id: Session identifier
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        Session response with current state

    Raises:
        HTTPException: If session not found or unauthorized
    """
    try:
        session = await service.get_session(session_id, user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )

        # Get current question
        current_question = service.get_current_question(session)

        return SessionResponse(
            session_id=session.session_id,
            status=session.status,
            progress_percentage=session.progress_percentage,
            current_question=current_question,
            total_questions=session.total_questions,
            answered_questions=session.answered_questions,
            message="Session retrieved successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve session: {str(e)}",
        )


@router.get("/sessions", response_model=List[InterviewSession])
async def list_sessions(
    limit: int = 10,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> List[InterviewSession]:
    """
    List all sessions for the current user.

    Args:
        limit: Maximum number of sessions to return (default: 10)
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        List of interview sessions

    Raises:
        HTTPException: If retrieval fails
    """
    try:
        sessions = await service.list_sessions(user_id, limit)
        return sessions
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list sessions: {str(e)}",
        )


@router.post("/sessions/{session_id}/answer", response_model=SessionResponse)
async def submit_answer(
    session_id: str,
    request: AnswerSubmitRequest,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> SessionResponse:
    """
    Submit an answer to a question.

    This endpoint accepts a user's answer to a specific question, validates it,
    and returns the next question in the interview flow.

    Args:
        session_id: Session identifier
        request: Answer submission request
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        Session response with next question

    Raises:
        HTTPException: If session not found or answer submission fails
    """
    try:
        session, next_question = await service.submit_answer(
            session_id, user_id, request
        )

        message = "Answer submitted successfully"
        if not next_question:
            message = "Interview completed! You can now generate your SOP."

        return SessionResponse(
            session_id=session.session_id,
            status=session.status,
            progress_percentage=session.progress_percentage,
            current_question=next_question,
            total_questions=session.total_questions,
            answered_questions=session.answered_questions,
            message=message,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit answer: {str(e)}",
        )


@router.put("/sessions/{session_id}/answer/{question_id}", response_model=SessionResponse)
async def edit_answer(
    session_id: str,
    question_id: str,
    request: AnswerEditRequest,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> SessionResponse:
    """
    Edit an existing answer.

    This endpoint allows users to modify their previous answers to questions.

    Args:
        session_id: Session identifier
        question_id: Question identifier
        request: Answer edit request
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        Session response with updated state

    Raises:
        HTTPException: If session or answer not found
    """
    try:
        session = await service.edit_answer(
            session_id, user_id, question_id, request
        )

        # Get current question (might be same or next unanswered)
        current_question = service.get_current_question(session)

        return SessionResponse(
            session_id=session.session_id,
            status=session.status,
            progress_percentage=session.progress_percentage,
            current_question=current_question,
            total_questions=session.total_questions,
            answered_questions=session.answered_questions,
            message="Answer updated successfully",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error editing answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to edit answer: {str(e)}",
        )


@router.get("/sessions/{session_id}/progress", response_model=ProgressResponse)
async def get_progress(
    session_id: str,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> ProgressResponse:
    """
    Get detailed progress information for a session.

    This endpoint provides comprehensive progress tracking including category-wise
    progress and generation readiness status.

    Args:
        session_id: Session identifier
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        Progress response with detailed metrics

    Raises:
        HTTPException: If session not found
    """
    try:
        progress = await service.get_session_progress(session_id, user_id)

        return ProgressResponse(
            session_id=progress["session_id"],
            progress_percentage=progress["progress_percentage"],
            answered_questions=progress["answered_questions"],
            total_questions=progress["total_questions"],
            remaining_questions=progress["remaining_questions"],
            status=progress["status"],
            can_generate=progress["can_generate"],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error getting progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get progress: {str(e)}",
        )


@router.post("/sessions/{session_id}/generate", response_model=SOPDraftResponse)
async def generate_sop(
    session_id: str,
    request: GenerateSOPRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> SOPDraftResponse:
    """
    Generate SOP from interview answers.

    This endpoint uses AI to generate a personalized Statement of Purpose based on
    the user's interview responses. The SOP is tailored to the specified tone and
    maintains the student's authentic voice.

    Args:
        session_id: Session identifier
        request: Generation request with tone and parameters
        background_tasks: Background tasks for async processing
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        Generated SOP draft

    Raises:
        HTTPException: If insufficient answers or generation fails
    """
    try:
        draft = await service.generate_sop(session_id, user_id, request)

        return SOPDraftResponse(
            draft_id=draft.draft_id,
            generated_at=draft.generated_at,
            tone=draft.tone,
            content=draft.content,
            word_count=draft.word_count,
            structure=draft.structure,
            message="SOP generated successfully!",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error generating SOP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate SOP: {str(e)}",
        )


@router.get("/sessions/{session_id}/drafts", response_model=List[SOPDraftResponse])
async def get_drafts(
    session_id: str,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> List[SOPDraftResponse]:
    """
    Get all generated drafts for a session.

    This endpoint retrieves all previously generated SOP drafts, allowing users
    to compare different versions with various tones.

    Args:
        session_id: Session identifier
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        List of SOP drafts

    Raises:
        HTTPException: If session not found
    """
    try:
        session = await service.get_session(session_id, user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )

        return [
            SOPDraftResponse(
                draft_id=draft.draft_id,
                generated_at=draft.generated_at,
                tone=draft.tone,
                content=draft.content,
                word_count=draft.word_count,
                structure=draft.structure,
                message="Draft retrieved successfully",
            )
            for draft in session.drafts
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting drafts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get drafts: {str(e)}",
        )


@router.get("/sessions/{session_id}/drafts/{draft_id}", response_model=SOPDraftResponse)
async def get_draft(
    session_id: str,
    draft_id: str,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> SOPDraftResponse:
    """
    Get a specific draft by ID.

    Args:
        session_id: Session identifier
        draft_id: Draft identifier
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        SOP draft

    Raises:
        HTTPException: If session or draft not found
    """
    try:
        session = await service.get_session(session_id, user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )

        draft = next((d for d in session.drafts if d.draft_id == draft_id), None)
        if not draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Draft not found",
            )

        return SOPDraftResponse(
            draft_id=draft.draft_id,
            generated_at=draft.generated_at,
            tone=draft.tone,
            content=draft.content,
            word_count=draft.word_count,
            structure=draft.structure,
            message="Draft retrieved successfully",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting draft: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get draft: {str(e)}",
        )


@router.post("/sessions/{session_id}/regenerate", response_model=SOPDraftResponse)
async def regenerate_sop(
    session_id: str,
    request: RegenerateSOPRequest,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> SOPDraftResponse:
    """
    Regenerate SOP with different tone or parameters.

    This endpoint allows users to generate a new version of their SOP with
    different styling or requirements while maintaining the same interview data.

    Args:
        session_id: Session identifier
        request: Regeneration request with new parameters
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        New SOP draft

    Raises:
        HTTPException: If generation fails
    """
    try:
        draft = await service.regenerate_sop(session_id, user_id, request)

        return SOPDraftResponse(
            draft_id=draft.draft_id,
            generated_at=draft.generated_at,
            tone=draft.tone,
            content=draft.content,
            word_count=draft.word_count,
            structure=draft.structure,
            message="SOP regenerated successfully!",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error regenerating SOP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate SOP: {str(e)}",
        )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
):
    """
    Delete a session.

    This endpoint permanently deletes an interview session and all associated data.

    Args:
        session_id: Session identifier
        user_id: Current user ID from JWT token
        service: SOP generator service

    Raises:
        HTTPException: If session not found or deletion fails
    """
    try:
        deleted = await service.delete_session(session_id, user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}",
        )


@router.get("/sessions/{session_id}/questions", response_model=List[InterviewQuestion])
async def get_all_questions(
    session_id: str,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
) -> List[InterviewQuestion]:
    """
    Get all questions for a session.

    This endpoint returns all interview questions including answered and unanswered ones,
    useful for navigation and editing previous answers.

    Args:
        session_id: Session identifier
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        List of all interview questions

    Raises:
        HTTPException: If session not found
    """
    try:
        session = await service.get_session(session_id, user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )

        return session.questions
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get questions: {str(e)}",
        )


@router.get("/sessions/{session_id}/export/{draft_id}")
async def export_draft(
    session_id: str,
    draft_id: str,
    format: str = "txt",
    applicant_name: Optional[str] = None,
    program_name: Optional[str] = None,
    university_name: Optional[str] = None,
    user_id: str = Depends(get_current_user),
    service: SOPGeneratorService = Depends(get_sop_service),
):
    """
    Export a draft in specified format.

    This endpoint exports an SOP draft in the requested format (txt, docx, or pdf)
    with professional formatting.

    Args:
        session_id: Session identifier
        draft_id: Draft identifier
        format: Export format (txt, docx, pdf)
        applicant_name: Name to include in header (optional)
        program_name: Program name to include in header (optional)
        university_name: University name to include in header (optional)
        user_id: Current user ID from JWT token
        service: SOP generator service

    Returns:
        File download response

    Raises:
        HTTPException: If session, draft not found or format unsupported
    """
    try:
        session = await service.get_session(session_id, user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found",
            )

        draft = next((d for d in session.drafts if d.draft_id == draft_id), None)
        if not draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Draft not found",
            )

        # Use session data if not provided
        if not program_name and session.program_name:
            program_name = session.program_name
        if not university_name and session.university_name:
            university_name = session.university_name

        # Export using export service
        content, media_type, filename = SOPExportService.export_draft(
            draft=draft,
            format=format,
            applicant_name=applicant_name,
            program_name=program_name,
            university_name=university_name,
        )

        # Return file
        from io import BytesIO
        return StreamingResponse(
            BytesIO(content),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting draft: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export draft: {str(e)}",
        )
