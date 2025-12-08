"""
Tests for SOP Generator API endpoints.

This module contains integration tests for the SOP generator REST API.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import status
from fastapi.testclient import TestClient

from app.main import app
from app.models.sop_generator import (
    InterviewQuestion,
    InterviewSession,
    QuestionCategory,
    SessionStatus,
    SOPDraft,
    SOPTone,
)


@pytest.fixture
def mock_sop_service():
    """Mock SOP generator service."""
    service = MagicMock()

    # Mock session
    sample_session = InterviewSession(
        session_id="test_session_123",
        user_id="test_user",
        status=SessionStatus.STARTED,
        program_name="MS in Computer Science",
        university_name="Stanford University",
        degree_level="MS",
        field_of_study="Computer Science",
        questions=[
            InterviewQuestion(
                question_id="q1",
                category=QuestionCategory.BACKGROUND,
                question_text="Test question 1",
                order=1,
            )
        ],
        total_questions=1,
        answered_questions=0,
    )

    service.create_session = AsyncMock(return_value=sample_session)
    service.get_session = AsyncMock(return_value=sample_session)
    service.get_current_question = MagicMock(return_value=sample_session.questions[0])
    service.submit_answer = AsyncMock(return_value=(sample_session, None))
    service.edit_answer = AsyncMock(return_value=sample_session)
    service.generate_sop = AsyncMock(return_value=SOPDraft(
        draft_id="draft_123",
        tone=SOPTone.BALANCED,
        content="Generated SOP content",
        structure={"introduction": "Intro", "body": "Body", "conclusion": "Conclusion"}
    ))
    service.regenerate_sop = AsyncMock(return_value=SOPDraft(
        draft_id="draft_456",
        tone=SOPTone.CONFIDENT,
        content="Regenerated SOP content",
        structure={"introduction": "Intro", "body": "Body", "conclusion": "Conclusion"}
    ))
    service.get_session_progress = AsyncMock(return_value={
        "session_id": "test_session_123",
        "status": SessionStatus.IN_PROGRESS,
        "progress_percentage": 50.0,
        "answered_questions": 5,
        "total_questions": 10,
        "remaining_questions": 5,
        "category_progress": {},
        "can_generate": True,
        "drafts_count": 0,
    })
    service.list_sessions = AsyncMock(return_value=[sample_session])
    service.delete_session = AsyncMock(return_value=True)

    return service


@pytest.fixture
def mock_auth():
    """Mock authentication dependency."""
    async def get_current_user():
        return "test_user"
    return get_current_user


@pytest.fixture
def client(mock_sop_service, mock_auth):
    """Test client with mocked dependencies."""
    with patch('app.api.v1.sop_generator.get_sop_service', return_value=mock_sop_service), \
         patch('app.api.v1.sop_generator.get_current_user', return_value="test_user"):
        client = TestClient(app)
        yield client


class TestSOPGeneratorAPI:
    """Tests for SOP Generator API endpoints."""

    def test_create_session(self, client):
        """Test POST /api/v1/sop-generator/sessions."""
        payload = {
            "program_name": "MS in Computer Science",
            "university_name": "Stanford University",
            "degree_level": "MS",
            "field_of_study": "Computer Science",
        }

        response = client.post("/api/v1/sop-generator/sessions", json=payload)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["session_id"] == "test_session_123"
        assert data["status"] == SessionStatus.STARTED
        assert "current_question" in data
        assert data["total_questions"] > 0

    def test_create_session_invalid_data(self, client):
        """Test creating session with invalid data."""
        payload = {
            "program_name": "MS in Computer Science",
            # Missing required fields
        }

        response = client.post("/api/v1/sop-generator/sessions", json=payload)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_get_session(self, client):
        """Test GET /api/v1/sop-generator/sessions/{session_id}."""
        response = client.get("/api/v1/sop-generator/sessions/test_session_123")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["session_id"] == "test_session_123"
        assert "current_question" in data
        assert "progress_percentage" in data

    def test_get_session_not_found(self, client, mock_sop_service):
        """Test getting non-existent session."""
        mock_sop_service.get_session.return_value = None

        response = client.get("/api/v1/sop-generator/sessions/nonexistent")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_sessions(self, client):
        """Test GET /api/v1/sop-generator/sessions."""
        response = client.get("/api/v1/sop-generator/sessions")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_list_sessions_with_limit(self, client):
        """Test listing sessions with limit parameter."""
        response = client.get("/api/v1/sop-generator/sessions?limit=5")

        assert response.status_code == status.HTTP_200_OK

    def test_submit_answer(self, client):
        """Test POST /api/v1/sop-generator/sessions/{session_id}/answer."""
        payload = {
            "question_id": "q1",
            "answer_text": "This is my comprehensive answer to the question.",
        }

        response = client.post(
            "/api/v1/sop-generator/sessions/test_session_123/answer",
            json=payload
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "session_id" in data
        assert "message" in data

    def test_submit_answer_invalid_short(self, client):
        """Test submitting too short answer."""
        payload = {
            "question_id": "q1",
            "answer_text": "Short",  # Too short
        }

        response = client.post(
            "/api/v1/sop-generator/sessions/test_session_123/answer",
            json=payload
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_submit_answer_invalid_question(self, client, mock_sop_service):
        """Test submitting answer to invalid question."""
        mock_sop_service.submit_answer.side_effect = ValueError("Question not found")

        payload = {
            "question_id": "invalid_q",
            "answer_text": "This is my answer.",
        }

        response = client.post(
            "/api/v1/sop-generator/sessions/test_session_123/answer",
            json=payload
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_edit_answer(self, client):
        """Test PUT /api/v1/sop-generator/sessions/{session_id}/answer/{question_id}."""
        payload = {
            "answer_text": "This is my updated and improved answer.",
        }

        response = client.put(
            "/api/v1/sop-generator/sessions/test_session_123/answer/q1",
            json=payload
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Answer updated successfully"

    def test_edit_answer_not_found(self, client, mock_sop_service):
        """Test editing non-existent answer."""
        mock_sop_service.edit_answer.side_effect = ValueError("Answer not found")

        payload = {
            "answer_text": "Updated answer",
        }

        response = client.put(
            "/api/v1/sop-generator/sessions/test_session_123/answer/nonexistent",
            json=payload
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_progress(self, client):
        """Test GET /api/v1/sop-generator/sessions/{session_id}/progress."""
        response = client.get("/api/v1/sop-generator/sessions/test_session_123/progress")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["session_id"] == "test_session_123"
        assert "progress_percentage" in data
        assert "answered_questions" in data
        assert "total_questions" in data
        assert "can_generate" in data

    def test_generate_sop(self, client):
        """Test POST /api/v1/sop-generator/sessions/{session_id}/generate."""
        payload = {
            "tone": "balanced",
            "word_count_target": 800,
        }

        response = client.post(
            "/api/v1/sop-generator/sessions/test_session_123/generate",
            json=payload
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "draft_id" in data
        assert data["tone"] == "balanced"
        assert "content" in data
        assert "word_count" in data

    def test_generate_sop_insufficient_answers(self, client, mock_sop_service):
        """Test generating SOP with insufficient answers."""
        mock_sop_service.generate_sop.side_effect = ValueError(
            "Please answer at least 50% of questions before generating SOP"
        )

        payload = {
            "tone": "balanced",
            "word_count_target": 800,
        }

        response = client.post(
            "/api/v1/sop-generator/sessions/test_session_123/generate",
            json=payload
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_generate_sop_different_tones(self, client):
        """Test generating SOPs with different tones."""
        tones = ["confident", "humble", "enthusiastic", "balanced"]

        for tone in tones:
            payload = {
                "tone": tone,
                "word_count_target": 800,
            }

            response = client.post(
                "/api/v1/sop-generator/sessions/test_session_123/generate",
                json=payload
            )

            assert response.status_code == status.HTTP_200_OK

    def test_get_drafts(self, client, mock_sop_service):
        """Test GET /api/v1/sop-generator/sessions/{session_id}/drafts."""
        # Mock session with drafts
        session_with_drafts = InterviewSession(
            session_id="test_session_123",
            user_id="test_user",
            status=SessionStatus.DRAFT_GENERATED,
            program_name="MS in Computer Science",
            university_name="Stanford University",
            degree_level="MS",
            field_of_study="Computer Science",
            questions=[],
            total_questions=0,
            drafts=[
                SOPDraft(
                    draft_id="draft_1",
                    tone=SOPTone.BALANCED,
                    content="Draft 1 content",
                    structure={}
                ),
                SOPDraft(
                    draft_id="draft_2",
                    tone=SOPTone.CONFIDENT,
                    content="Draft 2 content",
                    structure={}
                ),
            ]
        )
        mock_sop_service.get_session.return_value = session_with_drafts

        response = client.get("/api/v1/sop-generator/sessions/test_session_123/drafts")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2

    def test_get_draft_by_id(self, client, mock_sop_service):
        """Test GET /api/v1/sop-generator/sessions/{session_id}/drafts/{draft_id}."""
        session_with_draft = InterviewSession(
            session_id="test_session_123",
            user_id="test_user",
            status=SessionStatus.DRAFT_GENERATED,
            program_name="MS in Computer Science",
            university_name="Stanford University",
            degree_level="MS",
            field_of_study="Computer Science",
            questions=[],
            total_questions=0,
            drafts=[
                SOPDraft(
                    draft_id="draft_123",
                    tone=SOPTone.BALANCED,
                    content="Draft content",
                    structure={}
                )
            ]
        )
        mock_sop_service.get_session.return_value = session_with_draft

        response = client.get(
            "/api/v1/sop-generator/sessions/test_session_123/drafts/draft_123"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["draft_id"] == "draft_123"

    def test_get_draft_not_found(self, client, mock_sop_service):
        """Test getting non-existent draft."""
        session_with_draft = InterviewSession(
            session_id="test_session_123",
            user_id="test_user",
            status=SessionStatus.DRAFT_GENERATED,
            program_name="MS in Computer Science",
            university_name="Stanford University",
            degree_level="MS",
            field_of_study="Computer Science",
            questions=[],
            total_questions=0,
            drafts=[]
        )
        mock_sop_service.get_session.return_value = session_with_draft

        response = client.get(
            "/api/v1/sop-generator/sessions/test_session_123/drafts/nonexistent"
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_regenerate_sop(self, client):
        """Test POST /api/v1/sop-generator/sessions/{session_id}/regenerate."""
        payload = {
            "tone": "confident",
            "word_count_target": 900,
        }

        response = client.post(
            "/api/v1/sop-generator/sessions/test_session_123/regenerate",
            json=payload
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "draft_id" in data
        assert data["message"] == "SOP regenerated successfully!"

    def test_delete_session(self, client):
        """Test DELETE /api/v1/sop-generator/sessions/{session_id}."""
        response = client.delete("/api/v1/sop-generator/sessions/test_session_123")

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_session_not_found(self, client, mock_sop_service):
        """Test deleting non-existent session."""
        mock_sop_service.delete_session.return_value = False

        response = client.delete("/api/v1/sop-generator/sessions/nonexistent")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_all_questions(self, client, mock_sop_service):
        """Test GET /api/v1/sop-generator/sessions/{session_id}/questions."""
        session = InterviewSession(
            session_id="test_session_123",
            user_id="test_user",
            status=SessionStatus.IN_PROGRESS,
            program_name="MS in CS",
            university_name="Stanford",
            degree_level="MS",
            field_of_study="CS",
            questions=[
                InterviewQuestion(
                    question_id="q1",
                    category=QuestionCategory.BACKGROUND,
                    question_text="Question 1",
                    order=1
                ),
                InterviewQuestion(
                    question_id="q2",
                    category=QuestionCategory.ACADEMIC,
                    question_text="Question 2",
                    order=2
                ),
            ],
            total_questions=2,
        )
        mock_sop_service.get_session.return_value = session

        response = client.get("/api/v1/sop-generator/sessions/test_session_123/questions")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2

    def test_export_draft_txt(self, client, mock_sop_service):
        """Test GET /api/v1/sop-generator/sessions/{session_id}/export/{draft_id} (TXT)."""
        session_with_draft = InterviewSession(
            session_id="test_session_123",
            user_id="test_user",
            status=SessionStatus.DRAFT_GENERATED,
            program_name="MS in Computer Science",
            university_name="Stanford University",
            degree_level="MS",
            field_of_study="Computer Science",
            questions=[],
            total_questions=0,
            drafts=[
                SOPDraft(
                    draft_id="draft_123",
                    tone=SOPTone.BALANCED,
                    content="Draft content for export",
                    structure={}
                )
            ]
        )
        mock_sop_service.get_session.return_value = session_with_draft

        response = client.get(
            "/api/v1/sop-generator/sessions/test_session_123/export/draft_123?format=txt"
        )

        assert response.status_code == status.HTTP_200_OK
        assert "text/plain" in response.headers["content-type"]

    def test_export_draft_unsupported_format(self, client, mock_sop_service):
        """Test exporting with unsupported format."""
        session_with_draft = InterviewSession(
            session_id="test_session_123",
            user_id="test_user",
            status=SessionStatus.DRAFT_GENERATED,
            program_name="MS in Computer Science",
            university_name="Stanford University",
            degree_level="MS",
            field_of_study="Computer Science",
            questions=[],
            total_questions=0,
            drafts=[
                SOPDraft(
                    draft_id="draft_123",
                    tone=SOPTone.BALANCED,
                    content="Draft content",
                    structure={}
                )
            ]
        )
        mock_sop_service.get_session.return_value = session_with_draft

        response = client.get(
            "/api/v1/sop-generator/sessions/test_session_123/export/draft_123?format=xml"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unauthorized_access(self, client):
        """Test accessing endpoints without authentication."""
        # This test would need proper auth mocking
        # Placeholder for authentication tests
        pass
