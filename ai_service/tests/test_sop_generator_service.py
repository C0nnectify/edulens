"""
Tests for SOP Generator Service.

This module contains comprehensive tests for the interview-based SOP generation system,
including session management, answer validation, and SOP generation.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.sop_generator import (
    AnswerEditRequest,
    AnswerSubmitRequest,
    GenerateSOPRequest,
    InterviewAnswer,
    InterviewQuestion,
    InterviewSession,
    QuestionCategory,
    QuestionType,
    RegenerateSOPRequest,
    SessionCreateRequest,
    SessionStatus,
    SOPDraft,
    SOPTone,
)
from app.services.sop_generator_service import QuestionBank, SOPGeneratorService


@pytest.fixture
def mock_mongodb_client():
    """Mock MongoDB client."""
    client = MagicMock()
    db = MagicMock()
    collection = MagicMock()

    # Setup async methods
    collection.insert_one = AsyncMock()
    collection.find_one = AsyncMock()
    collection.update_one = AsyncMock()
    collection.delete_one = AsyncMock()
    collection.find = MagicMock()

    db.__getitem__ = MagicMock(return_value=collection)
    client.__getitem__ = MagicMock(return_value=db)

    return client


@pytest.fixture
def mock_llm():
    """Mock LangChain LLM."""
    llm = MagicMock()

    # Mock response
    mock_response = MagicMock()
    mock_response.content = """As a passionate computer science student with a strong foundation in machine learning and artificial intelligence, I am eager to pursue my graduate studies at Stanford University's Computer Science program. My academic journey has been marked by consistent excellence and a deep curiosity about how AI can solve real-world problems.

During my undergraduate studies at XYZ University, I developed a strong foundation in algorithms, data structures, and machine learning. My capstone project on natural language processing for educational applications received the Best Project Award and sparked my interest in pursuing research in this area. I have also published two papers in international conferences, demonstrating my commitment to advancing the field.

My research interests align perfectly with Professor Johnson's work on reinforcement learning and natural language processing. I am particularly excited about the opportunity to contribute to ongoing research in AI for education and to learn from world-class faculty. After completing my graduate studies, I plan to pursue a career in research, either in academia or industry, where I can continue to push the boundaries of AI technology.

Stanford's Computer Science program offers the perfect environment for me to achieve my goals, with its cutting-edge research facilities, collaborative culture, and strong industry connections. I am confident that my background, skills, and passion make me an excellent fit for your program, and I look forward to contributing to the vibrant academic community at Stanford."""

    llm.ainvoke = AsyncMock(return_value=mock_response)

    return llm


@pytest.fixture
def sop_service(mock_mongodb_client, mock_llm):
    """Create SOP generator service with mocked dependencies."""
    with patch('app.services.sop_generator_service.ChatGoogleGenerativeAI', return_value=mock_llm):
        service = SOPGeneratorService(
            mongodb_client=mock_mongodb_client,
            db_name="test_db",
            gemini_api_key="test_api_key"
        )
        return service


@pytest.fixture
def sample_session_request():
    """Sample session creation request."""
    return SessionCreateRequest(
        program_name="Master of Science in Computer Science",
        university_name="Stanford University",
        degree_level="MS",
        field_of_study="Computer Science",
    )


@pytest.fixture
def sample_session():
    """Sample interview session."""
    questions = QuestionBank.get_all_questions()[:5]  # Use first 5 questions

    return InterviewSession(
        session_id="test_session_123",
        user_id="test_user_456",
        status=SessionStatus.IN_PROGRESS,
        program_name="Master of Science in Computer Science",
        university_name="Stanford University",
        degree_level="MS",
        field_of_study="Computer Science",
        questions=questions,
        total_questions=len(questions),
        answered_questions=0,
    )


class TestQuestionBank:
    """Tests for QuestionBank class."""

    def test_get_all_questions(self):
        """Test getting all questions."""
        questions = QuestionBank.get_all_questions()

        assert len(questions) > 0
        assert all(isinstance(q, InterviewQuestion) for q in questions)

        # Check categories are represented
        categories = {q.category for q in questions}
        assert QuestionCategory.BACKGROUND in categories
        assert QuestionCategory.ACADEMIC in categories
        assert QuestionCategory.RESEARCH in categories
        assert QuestionCategory.CAREER_GOALS in categories
        assert QuestionCategory.PROGRAM_FIT in categories

    def test_question_ordering(self):
        """Test questions are properly ordered."""
        questions = QuestionBank.get_all_questions()

        # Questions should be ordered by their order field
        orders = [q.order for q in questions]
        assert orders == sorted(orders)

    def test_should_skip_question_no_dependency(self):
        """Test skip logic for questions without dependencies."""
        question = InterviewQuestion(
            question_id="test_001",
            category=QuestionCategory.BACKGROUND,
            question_text="Test question",
            order=1,
        )

        should_skip = QuestionBank.should_skip_question(question, {}, {})
        assert should_skip is False

    def test_should_skip_question_with_research_experience(self):
        """Test skip logic based on research experience."""
        dependent_question = InterviewQuestion(
            question_id="rs_001",
            category=QuestionCategory.RESEARCH,
            question_text="Do you have research experience?",
            order=1,
        )

        followup_question = InterviewQuestion(
            question_id="rs_002",
            category=QuestionCategory.RESEARCH,
            question_text="Describe your research projects.",
            order=2,
            depends_on="rs_001",
            condition="has_research_experience",
        )

        # Case 1: Has research experience
        answers_with_research = {
            "rs_001": InterviewAnswer(
                question_id="rs_001",
                answer_text="Yes, I have worked on several research projects in machine learning.",
            )
        }

        should_skip = QuestionBank.should_skip_question(
            followup_question, answers_with_research, {}
        )
        assert should_skip is False

        # Case 2: No research experience
        answers_no_research = {
            "rs_001": InterviewAnswer(
                question_id="rs_001",
                answer_text="No, I haven't had any formal research experience yet.",
            )
        }

        should_skip = QuestionBank.should_skip_question(
            followup_question, answers_no_research, {}
        )
        assert should_skip is True

    def test_interpolate_question(self):
        """Test question text interpolation."""
        question = InterviewQuestion(
            question_id="test_001",
            category=QuestionCategory.PROGRAM_FIT,
            question_text="Why are you interested in {program_name} at {university_name}?",
            order=1,
        )

        metadata = {
            "program_name": "MS in Computer Science",
            "university_name": "Stanford University",
            "field_of_study": "Computer Science",
        }

        interpolated = QuestionBank.interpolate_question(question, metadata)

        assert "{program_name}" not in interpolated.question_text
        assert "{university_name}" not in interpolated.question_text
        assert "MS in Computer Science" in interpolated.question_text
        assert "Stanford University" in interpolated.question_text


class TestSOPGeneratorService:
    """Tests for SOPGeneratorService class."""

    @pytest.mark.asyncio
    async def test_create_session(self, sop_service, sample_session_request, mock_mongodb_client):
        """Test creating a new interview session."""
        session = await sop_service.create_session("test_user", sample_session_request)

        assert session.session_id is not None
        assert session.user_id == "test_user"
        assert session.status == SessionStatus.STARTED
        assert session.program_name == sample_session_request.program_name
        assert session.university_name == sample_session_request.university_name
        assert len(session.questions) > 0
        assert session.total_questions == len(session.questions)

        # Verify MongoDB insert was called
        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_session(self, sop_service, sample_session, mock_mongodb_client):
        """Test retrieving a session."""
        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.find_one.return_value = sample_session.model_dump()

        session = await sop_service.get_session("test_session_123", "test_user_456")

        assert session is not None
        assert session.session_id == sample_session.session_id
        assert session.user_id == sample_session.user_id

        # Verify MongoDB query
        collection.find_one.assert_called_once_with({
            "session_id": "test_session_123",
            "user_id": "test_user_456"
        })

    @pytest.mark.asyncio
    async def test_get_session_not_found(self, sop_service, mock_mongodb_client):
        """Test retrieving non-existent session."""
        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.find_one.return_value = None

        session = await sop_service.get_session("nonexistent", "test_user")

        assert session is None

    def test_get_current_question(self, sop_service, sample_session):
        """Test getting current unanswered question."""
        current_question = sop_service.get_current_question(sample_session)

        assert current_question is not None
        assert current_question.question_id == sample_session.questions[0].question_id

    def test_get_current_question_with_answers(self, sop_service, sample_session):
        """Test getting current question when some are answered."""
        # Answer first question
        sample_session.answers[sample_session.questions[0].question_id] = InterviewAnswer(
            question_id=sample_session.questions[0].question_id,
            answer_text="This is my answer to the first question.",
        )

        current_question = sop_service.get_current_question(sample_session)

        assert current_question is not None
        assert current_question.question_id == sample_session.questions[1].question_id

    def test_get_current_question_all_answered(self, sop_service, sample_session):
        """Test getting current question when all are answered."""
        # Answer all questions
        for question in sample_session.questions:
            sample_session.answers[question.question_id] = InterviewAnswer(
                question_id=question.question_id,
                answer_text="Sample answer",
            )

        current_question = sop_service.get_current_question(sample_session)

        assert current_question is None

    @pytest.mark.asyncio
    async def test_submit_answer(self, sop_service, sample_session, mock_mongodb_client):
        """Test submitting an answer."""
        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.find_one.return_value = sample_session.model_dump()
        collection.update_one.return_value = MagicMock()

        request = AnswerSubmitRequest(
            question_id=sample_session.questions[0].question_id,
            answer_text="This is a comprehensive answer to the question with sufficient detail to pass validation.",
        )

        updated_session, next_question = await sop_service.submit_answer(
            "test_session_123", "test_user_456", request
        )

        assert request.question_id in updated_session.answers
        assert updated_session.answered_questions == 1
        assert updated_session.status == SessionStatus.IN_PROGRESS
        assert next_question is not None
        assert next_question.question_id == sample_session.questions[1].question_id

        # Verify MongoDB update
        collection.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_submit_answer_invalid_question(self, sop_service, sample_session, mock_mongodb_client):
        """Test submitting answer to invalid question."""
        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.find_one.return_value = sample_session.model_dump()

        request = AnswerSubmitRequest(
            question_id="invalid_question_id",
            answer_text="This is an answer.",
        )

        with pytest.raises(ValueError, match="Question not found"):
            await sop_service.submit_answer("test_session_123", "test_user_456", request)

    @pytest.mark.asyncio
    async def test_edit_answer(self, sop_service, sample_session, mock_mongodb_client):
        """Test editing an existing answer."""
        # Add an answer first
        question_id = sample_session.questions[0].question_id
        sample_session.answers[question_id] = InterviewAnswer(
            question_id=question_id,
            answer_text="Original answer",
        )

        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.find_one.return_value = sample_session.model_dump()
        collection.update_one.return_value = MagicMock()

        request = AnswerEditRequest(
            answer_text="Updated answer with more comprehensive details about the topic.",
        )

        updated_session = await sop_service.edit_answer(
            "test_session_123", "test_user_456", question_id, request
        )

        assert updated_session.answers[question_id].answer_text == request.answer_text
        assert updated_session.answers[question_id].edited_at is not None

        # Verify MongoDB update
        collection.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_edit_answer_not_found(self, sop_service, sample_session, mock_mongodb_client):
        """Test editing non-existent answer."""
        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.find_one.return_value = sample_session.model_dump()

        request = AnswerEditRequest(answer_text="Updated answer")

        with pytest.raises(ValueError, match="Answer not found"):
            await sop_service.edit_answer(
                "test_session_123", "test_user_456", "nonexistent_question", request
            )

    @pytest.mark.asyncio
    async def test_validate_answer_too_short(self, sop_service):
        """Test answer validation for too short answer."""
        question = InterviewQuestion(
            question_id="test_001",
            category=QuestionCategory.BACKGROUND,
            question_text="Test question",
            order=1,
            min_length=100,
        )

        validation = await sop_service.validate_answer(question, "Short answer")

        assert validation.is_valid is False
        assert validation.feedback is not None
        assert len(validation.suggestions) > 0

    @pytest.mark.asyncio
    async def test_validate_answer_too_long(self, sop_service):
        """Test answer validation for too long answer."""
        question = InterviewQuestion(
            question_id="test_001",
            category=QuestionCategory.BACKGROUND,
            question_text="Test question",
            order=1,
            max_length=50,
        )

        long_answer = "This is a very long answer " * 20
        validation = await sop_service.validate_answer(question, long_answer)

        assert validation.is_valid is False
        assert "too long" in validation.feedback.lower()

    @pytest.mark.asyncio
    async def test_validate_answer_valid(self, sop_service):
        """Test answer validation for valid answer."""
        question = InterviewQuestion(
            question_id="test_001",
            category=QuestionCategory.BACKGROUND,
            question_text="Test question",
            order=1,
            min_length=50,
            max_length=500,
        )

        good_answer = "This is a comprehensive and well-thought-out answer that provides sufficient detail and demonstrates clear thinking about the topic."
        validation = await sop_service.validate_answer(question, good_answer)

        assert validation.is_valid is True
        assert validation.word_count > 0
        assert validation.char_count > 0

    @pytest.mark.asyncio
    async def test_generate_sop(self, sop_service, sample_session, mock_mongodb_client):
        """Test generating SOP from answers."""
        # Add enough answers to meet minimum requirement
        for question in sample_session.questions:
            sample_session.answers[question.question_id] = InterviewAnswer(
                question_id=question.question_id,
                answer_text="This is a comprehensive answer with sufficient detail.",
            )
        sample_session.answered_questions = len(sample_session.questions)

        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.find_one.return_value = sample_session.model_dump()
        collection.update_one.return_value = MagicMock()

        request = GenerateSOPRequest(
            tone=SOPTone.BALANCED,
            word_count_target=800,
        )

        draft = await sop_service.generate_sop("test_session_123", "test_user_456", request)

        assert draft.draft_id is not None
        assert draft.tone == SOPTone.BALANCED
        assert draft.content is not None
        assert len(draft.content) > 0
        assert draft.word_count > 0

        # Verify MongoDB update
        collection.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_sop_insufficient_answers(self, sop_service, sample_session, mock_mongodb_client):
        """Test generating SOP with insufficient answers."""
        # Only answer 1 question (less than 50%)
        sample_session.answers[sample_session.questions[0].question_id] = InterviewAnswer(
            question_id=sample_session.questions[0].question_id,
            answer_text="Answer",
        )
        sample_session.answered_questions = 1

        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.find_one.return_value = sample_session.model_dump()

        request = GenerateSOPRequest(tone=SOPTone.BALANCED)

        with pytest.raises(ValueError, match="at least 50%"):
            await sop_service.generate_sop("test_session_123", "test_user_456", request)

    @pytest.mark.asyncio
    async def test_get_session_progress(self, sop_service, sample_session, mock_mongodb_client):
        """Test getting session progress."""
        # Answer some questions
        sample_session.answers[sample_session.questions[0].question_id] = InterviewAnswer(
            question_id=sample_session.questions[0].question_id,
            answer_text="Answer 1",
        )
        sample_session.answered_questions = 1

        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.find_one.return_value = sample_session.model_dump()

        progress = await sop_service.get_session_progress("test_session_123", "test_user_456")

        assert progress["session_id"] == "test_session_123"
        assert progress["answered_questions"] == 1
        assert progress["total_questions"] == len(sample_session.questions)
        assert progress["progress_percentage"] > 0
        assert "category_progress" in progress
        assert isinstance(progress["can_generate"], bool)

    @pytest.mark.asyncio
    async def test_list_sessions(self, sop_service, mock_mongodb_client):
        """Test listing user sessions."""
        # Mock cursor
        mock_cursor = MagicMock()
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.limit.return_value = mock_cursor

        sessions_data = [
            InterviewSession(
                session_id=f"session_{i}",
                user_id="test_user",
                status=SessionStatus.IN_PROGRESS,
                program_name="Test Program",
                university_name="Test University",
                degree_level="MS",
                field_of_study="CS",
                questions=[],
                total_questions=0,
            ).model_dump()
            for i in range(3)
        ]

        async def mock_iteration():
            for session in sessions_data:
                yield session

        mock_cursor.__aiter__ = lambda self: mock_iteration()

        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.find.return_value = mock_cursor

        sessions = await sop_service.list_sessions("test_user", limit=10)

        assert len(sessions) == 3
        assert all(isinstance(s, InterviewSession) for s in sessions)

    @pytest.mark.asyncio
    async def test_delete_session(self, sop_service, mock_mongodb_client):
        """Test deleting a session."""
        mock_result = MagicMock()
        mock_result.deleted_count = 1

        collection = mock_mongodb_client["test_db"]["sop_sessions"]
        collection.delete_one.return_value = mock_result

        deleted = await sop_service.delete_session("test_session_123", "test_user_456")

        assert deleted is True
        collection.delete_one.assert_called_once_with({
            "session_id": "test_session_123",
            "user_id": "test_user_456"
        })

    def test_build_sop_context(self, sop_service, sample_session):
        """Test building context from session."""
        # Add some answers
        for i, question in enumerate(sample_session.questions[:3]):
            sample_session.answers[question.question_id] = InterviewAnswer(
                question_id=question.question_id,
                answer_text=f"Answer {i+1}",
            )

        context = sop_service._build_sop_context(sample_session)

        assert "program_info" in context
        assert "answers_by_category" in context
        assert context["program_info"]["program_name"] == sample_session.program_name
        assert len(context["answers_by_category"]) > 0

    def test_extract_structure(self, sop_service):
        """Test extracting structure from SOP content."""
        content = """This is the introduction paragraph.

This is the first body paragraph with details.

This is the second body paragraph with more details.

This is the conclusion paragraph."""

        structure = sop_service._extract_structure(content)

        assert "introduction" in structure
        assert "body" in structure
        assert "conclusion" in structure
        assert structure["introduction"] == "This is the introduction paragraph."
        assert "conclusion" in structure["conclusion"]
