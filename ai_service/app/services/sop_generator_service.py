"""
SOP Generator Service with Interview-Based Approach.

This service implements an intelligent, conversational interview system that collects
information through targeted questions and generates personalized Statement of Purpose
documents using LangGraph for state management and Google Gemini for generation.
"""

import hashlib
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

from ..models.sop_generator import (
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
    ValidationResponse,
)

logger = logging.getLogger(__name__)


class InterviewState(BaseModel):
    """State model for LangGraph interview flow."""
    session_id: str
    user_id: str
    current_question_index: int = 0
    answers: Dict[str, InterviewAnswer] = {}
    questions: List[InterviewQuestion] = []
    metadata: Dict[str, Any] = {}
    should_skip: bool = False
    next_question_id: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True


class QuestionBank:
    """
    Question bank with smart follow-up logic.

    This class manages all interview questions across different categories
    and implements conditional logic for dynamic question flow.
    """

    @staticmethod
    def get_all_questions() -> List[InterviewQuestion]:
        """
        Get all interview questions across all categories.

        Returns:
            List of InterviewQuestion objects ordered by category and importance.
        """
        questions = []

        # Background Questions (5-7)
        questions.extend([
            InterviewQuestion(
                question_id="bg_001",
                category=QuestionCategory.BACKGROUND,
                question_text="Tell me about yourself and your educational background.",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=100,
                max_length=500,
                order=1,
                guidance="Share your educational journey, major achievements, and what makes you unique.",
                examples=[
                    "I completed my Bachelor's in Computer Science from XYZ University with a GPA of 3.8...",
                    "Coming from a family of educators, I developed a passion for learning early on..."
                ]
            ),
            InterviewQuestion(
                question_id="bg_002",
                category=QuestionCategory.BACKGROUND,
                question_text="What sparked your initial interest in {field_of_study}?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=400,
                order=2,
                guidance="Share a specific moment, experience, or realization that drew you to this field.",
                examples=[
                    "During my sophomore year, I took a course in machine learning that completely changed my perspective...",
                    "I was fascinated by how technology could solve real-world problems when I worked on..."
                ]
            ),
            InterviewQuestion(
                question_id="bg_003",
                category=QuestionCategory.BACKGROUND,
                question_text="Describe a challenging academic project you've completed and what you learned from it.",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=100,
                max_length=500,
                order=3,
                guidance="Focus on the challenge, your approach, and key learnings rather than just the outcome.",
                examples=[
                    "For my capstone project, I developed a machine learning model for predicting student performance..."
                ]
            ),
            InterviewQuestion(
                question_id="bg_004",
                category=QuestionCategory.BACKGROUND,
                question_text="What are your greatest academic strengths?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=60,
                max_length=300,
                order=4,
                guidance="Be specific about skills, subjects, or approaches where you excel.",
                examples=[
                    "I excel at analytical problem-solving and have consistently performed well in quantitative courses..."
                ]
            ),
            InterviewQuestion(
                question_id="bg_005",
                category=QuestionCategory.BACKGROUND,
                question_text="Have you received any academic awards, scholarships, or recognition?",
                question_type=QuestionType.MULTILINE,
                required=False,
                min_length=50,
                max_length=400,
                order=5,
                guidance="List any notable achievements, scholarships, or recognition you've received.",
                examples=[
                    "I received the Dean's List recognition for three consecutive semesters and was awarded..."
                ]
            ),
        ])

        # Academic Experience (5-7)
        questions.extend([
            InterviewQuestion(
                question_id="ac_001",
                category=QuestionCategory.ACADEMIC,
                question_text="Which courses or subjects have you enjoyed the most and why?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=400,
                order=6,
                guidance="Explain what made these courses interesting and how they relate to your goals.",
                examples=[
                    "I particularly enjoyed my Advanced Algorithms course because it challenged me to think..."
                ]
            ),
            InterviewQuestion(
                question_id="ac_002",
                category=QuestionCategory.ACADEMIC,
                question_text="Describe your strongest technical or academic skills.",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=60,
                max_length=400,
                order=7,
                guidance="Be specific about programming languages, methodologies, or technical competencies.",
                examples=[
                    "I have strong programming skills in Python, Java, and C++, with particular expertise in..."
                ]
            ),
            InterviewQuestion(
                question_id="ac_003",
                category=QuestionCategory.ACADEMIC,
                question_text="Have you worked on any significant academic projects outside of coursework?",
                question_type=QuestionType.MULTILINE,
                required=False,
                min_length=80,
                max_length=500,
                order=8,
                guidance="Include independent studies, club projects, or self-initiated learning.",
                examples=[
                    "I independently developed a mobile app for campus navigation that has been downloaded..."
                ]
            ),
            InterviewQuestion(
                question_id="ac_004",
                category=QuestionCategory.ACADEMIC,
                question_text="Have you participated in any competitions, hackathons, or academic events?",
                question_type=QuestionType.MULTILINE,
                required=False,
                min_length=60,
                max_length=400,
                order=9,
                guidance="Share your experience and what you gained from these events.",
                examples=[
                    "I participated in the ACM ICPC programming competition where our team placed in the top 10..."
                ]
            ),
            InterviewQuestion(
                question_id="ac_005",
                category=QuestionCategory.ACADEMIC,
                question_text="What has been your most significant academic challenge and how did you overcome it?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=400,
                order=10,
                guidance="Focus on the problem-solving process and personal growth.",
                examples=[
                    "I initially struggled with theoretical computer science concepts but improved by..."
                ]
            ),
        ])

        # Research Experience (5-7)
        questions.extend([
            InterviewQuestion(
                question_id="rs_001",
                category=QuestionCategory.RESEARCH,
                question_text="Do you have any research experience? If yes, please describe your research projects.",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=50,
                max_length=600,
                order=11,
                guidance="If no research experience, explain your interest in starting research. If yes, detail your projects.",
                examples=[
                    "I worked as a research assistant in Dr. Smith's lab where I investigated...",
                    "While I haven't had formal research experience yet, I'm eager to explore..."
                ]
            ),
            InterviewQuestion(
                question_id="rs_002",
                category=QuestionCategory.RESEARCH,
                question_text="What was your specific role and contribution in your research project(s)?",
                question_type=QuestionType.MULTILINE,
                required=False,
                min_length=80,
                max_length=500,
                order=12,
                depends_on="rs_001",
                condition="has_research_experience",
                guidance="Detail your responsibilities, methodologies used, and key contributions.",
                examples=[
                    "I was responsible for data collection and analysis, where I developed a novel approach to..."
                ]
            ),
            InterviewQuestion(
                question_id="rs_003",
                category=QuestionCategory.RESEARCH,
                question_text="Have you published any papers, presented at conferences, or shared your research findings?",
                question_type=QuestionType.MULTILINE,
                required=False,
                min_length=50,
                max_length=400,
                order=13,
                depends_on="rs_001",
                condition="has_research_experience",
                guidance="List publications, conference presentations, or poster sessions.",
                examples=[
                    "Our paper was accepted at the IEEE International Conference on...",
                    "I presented a poster at the undergraduate research symposium on..."
                ]
            ),
            InterviewQuestion(
                question_id="rs_004",
                category=QuestionCategory.RESEARCH,
                question_text="What research areas or topics are you most interested in exploring?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=500,
                order=14,
                guidance="Be specific about research areas, problems, or questions that fascinate you.",
                examples=[
                    "I'm particularly interested in natural language processing and its applications in education...",
                    "I want to explore sustainable computing and how to reduce the carbon footprint of AI systems..."
                ]
            ),
            InterviewQuestion(
                question_id="rs_005",
                category=QuestionCategory.RESEARCH,
                question_text="What skills or knowledge do you hope to gain through research?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=60,
                max_length=400,
                order=15,
                guidance="Explain what you want to learn and how research will develop you professionally.",
                examples=[
                    "I want to develop strong experimental design skills and learn to conduct rigorous scientific investigations..."
                ]
            ),
        ])

        # Career Goals (4-5)
        questions.extend([
            InterviewQuestion(
                question_id="cg_001",
                category=QuestionCategory.CAREER_GOALS,
                question_text="What are your short-term career goals (0-5 years after graduation)?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=400,
                order=16,
                guidance="Be specific about the role, industry, or impact you want to make.",
                examples=[
                    "After graduation, I plan to work as a data scientist in the healthcare industry, focusing on..."
                ]
            ),
            InterviewQuestion(
                question_id="cg_002",
                category=QuestionCategory.CAREER_GOALS,
                question_text="What are your long-term career goals (5-10 years)?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=400,
                order=17,
                guidance="Share your vision for your career trajectory and impact.",
                examples=[
                    "In the long term, I aspire to lead a research team developing AI solutions for climate change..."
                ]
            ),
            InterviewQuestion(
                question_id="cg_003",
                category=QuestionCategory.CAREER_GOALS,
                question_text="How will this specific graduate program help you achieve your career goals?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=100,
                max_length=500,
                order=18,
                guidance="Connect the program's offerings to your specific goals.",
                examples=[
                    "The program's focus on applied machine learning and industry partnerships will provide..."
                ]
            ),
            InterviewQuestion(
                question_id="cg_004",
                category=QuestionCategory.CAREER_GOALS,
                question_text="What impact do you hope to make in your field or community?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=400,
                order=19,
                guidance="Think about the broader contribution you want to make.",
                examples=[
                    "I hope to contribute to making education more accessible through technology..."
                ]
            ),
        ])

        # Program Fit (5-7)
        questions.extend([
            InterviewQuestion(
                question_id="pf_001",
                category=QuestionCategory.PROGRAM_FIT,
                question_text="Why are you interested in this specific program at {university_name}?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=100,
                max_length=500,
                order=20,
                guidance="Be specific about program features, curriculum, or opportunities that attract you.",
                examples=[
                    "I'm drawn to this program because of its unique curriculum combining theoretical foundations with..."
                ]
            ),
            InterviewQuestion(
                question_id="pf_002",
                category=QuestionCategory.PROGRAM_FIT,
                question_text="Which faculty members would you like to work with and why?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=500,
                order=21,
                guidance="Research faculty and explain how their work aligns with your interests.",
                examples=[
                    "Professor Johnson's work on reinforcement learning in robotics aligns perfectly with my research interests..."
                ]
            ),
            InterviewQuestion(
                question_id="pf_003",
                category=QuestionCategory.PROGRAM_FIT,
                question_text="What specific courses, labs, or research centers interest you most?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=400,
                order=22,
                guidance="Show that you've researched the program thoroughly.",
                examples=[
                    "I'm particularly interested in the Advanced Computer Vision course and the AI Research Lab..."
                ]
            ),
            InterviewQuestion(
                question_id="pf_004",
                category=QuestionCategory.PROGRAM_FIT,
                question_text="What unique perspectives or experiences will you bring to the program?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=400,
                order=23,
                guidance="Think about your unique background, experiences, or viewpoints.",
                examples=[
                    "Coming from a developing country, I can contribute perspectives on adapting technology for resource-constrained environments..."
                ]
            ),
            InterviewQuestion(
                question_id="pf_005",
                category=QuestionCategory.PROGRAM_FIT,
                question_text="How do you plan to contribute to the university community outside of academics?",
                question_type=QuestionType.MULTILINE,
                required=False,
                min_length=60,
                max_length=400,
                order=24,
                guidance="Mention clubs, organizations, or community service you'd like to participate in.",
                examples=[
                    "I plan to join the Graduate Student Association and would love to mentor undergraduate students..."
                ]
            ),
        ])

        # Personal Statement (3-4)
        questions.extend([
            InterviewQuestion(
                question_id="ps_001",
                category=QuestionCategory.PERSONAL_STATEMENT,
                question_text="What personal qualities or characteristics make you a strong candidate?",
                question_type=QuestionType.MULTILINE,
                required=True,
                min_length=80,
                max_length=400,
                order=25,
                guidance="Reflect on traits like perseverance, creativity, leadership, or adaptability.",
                examples=[
                    "I'm naturally curious and persistent, which has helped me tackle complex problems..."
                ]
            ),
            InterviewQuestion(
                question_id="ps_002",
                category=QuestionCategory.PERSONAL_STATEMENT,
                question_text="Have you overcome any significant personal or professional challenges?",
                question_type=QuestionType.MULTILINE,
                required=False,
                min_length=80,
                max_length=500,
                order=26,
                guidance="Share challenges that shaped your character or perspective (optional but impactful).",
                examples=[
                    "Growing up in a rural area with limited access to technology, I had to be resourceful..."
                ]
            ),
            InterviewQuestion(
                question_id="ps_003",
                category=QuestionCategory.PERSONAL_STATEMENT,
                question_text="Is there anything else you'd like to share that would strengthen your application?",
                question_type=QuestionType.MULTILINE,
                required=False,
                min_length=50,
                max_length=500,
                order=27,
                guidance="Include any additional context, experiences, or information not covered above.",
                examples=[
                    "I've also been involved in teaching programming to underprivileged youth in my community..."
                ]
            ),
        ])

        return questions

    @staticmethod
    def should_skip_question(
        question: InterviewQuestion,
        answers: Dict[str, InterviewAnswer],
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Determine if a question should be skipped based on conditions.

        Args:
            question: The question to evaluate
            answers: Dictionary of answered questions
            metadata: Session metadata

        Returns:
            True if question should be skipped, False otherwise
        """
        if not question.depends_on or not question.condition:
            return False

        # Check if dependent question was answered
        dependent_answer = answers.get(question.depends_on)
        if not dependent_answer:
            return True

        # Evaluate conditions
        if question.condition == "has_research_experience":
            # Check if user indicated research experience
            answer_text = dependent_answer.answer_text.lower()
            negative_indicators = ["no research", "haven't", "no formal", "no experience"]
            return any(indicator in answer_text for indicator in negative_indicators)

        return False

    @staticmethod
    def interpolate_question(
        question: InterviewQuestion,
        metadata: Dict[str, Any]
    ) -> InterviewQuestion:
        """
        Interpolate placeholders in question text with actual values.

        Args:
            question: Question with potential placeholders
            metadata: Session metadata containing values

        Returns:
            Question with interpolated text
        """
        question_text = question.question_text

        # Replace placeholders
        replacements = {
            "{field_of_study}": metadata.get("field_of_study", "your field"),
            "{university_name}": metadata.get("university_name", "this university"),
            "{program_name}": metadata.get("program_name", "this program"),
            "{degree_level}": metadata.get("degree_level", "graduate"),
        }

        for placeholder, value in replacements.items():
            question_text = question_text.replace(placeholder, value)

        # Create new question with interpolated text
        question_dict = question.model_dump()
        question_dict["question_text"] = question_text
        return InterviewQuestion(**question_dict)


class SOPGeneratorService:
    """
    Main service class for SOP generation with interview-based approach.

    This service manages interview sessions, collects user responses through
    an intelligent question flow, and generates personalized SOPs using AI.
    """

    def __init__(
        self,
        mongodb_client: AsyncIOMotorClient,
        db_name: str,
        gemini_api_key: str
    ):
        """
        Initialize the SOP generator service.

        Args:
            mongodb_client: MongoDB client for data persistence
            db_name: Database name
            gemini_api_key: Google Gemini API key for generation
        """
        self.db = mongodb_client[db_name]
        self.sessions_collection = self.db["sop_sessions"]

        # Initialize LLM for generation
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=gemini_api_key,
            temperature=0.7,
        )

        # Initialize question bank
        self.question_bank = QuestionBank()

        logger.info("SOP Generator Service initialized")

    async def create_session(
        self,
        user_id: str,
        request: SessionCreateRequest
    ) -> InterviewSession:
        """
        Create a new interview session.

        Args:
            user_id: User identifier
            request: Session creation request

        Returns:
            Created interview session
        """
        session_id = str(uuid.uuid4())

        # Get all questions
        all_questions = self.question_bank.get_all_questions()

        # Prepare metadata
        metadata = {
            "program_name": request.program_name,
            "university_name": request.university_name,
            "degree_level": request.degree_level,
            "field_of_study": request.field_of_study,
        }

        if request.additional_info:
            metadata.update(request.additional_info)

        # Interpolate questions with metadata
        interpolated_questions = [
            self.question_bank.interpolate_question(q, metadata)
            for q in all_questions
        ]

        # Create session
        session = InterviewSession(
            session_id=session_id,
            user_id=user_id,
            status=SessionStatus.STARTED,
            program_name=request.program_name,
            university_name=request.university_name,
            degree_level=request.degree_level,
            field_of_study=request.field_of_study,
            questions=interpolated_questions,
            total_questions=len(interpolated_questions),
            metadata=metadata,
        )

        # Save to database
        await self.sessions_collection.insert_one(session.model_dump())

        logger.info(f"Created session {session_id} for user {user_id}")
        return session

    async def get_session(
        self,
        session_id: str,
        user_id: str
    ) -> Optional[InterviewSession]:
        """
        Retrieve an interview session.

        Args:
            session_id: Session identifier
            user_id: User identifier for authorization

        Returns:
            Interview session or None if not found
        """
        session_data = await self.sessions_collection.find_one({
            "session_id": session_id,
            "user_id": user_id
        })

        if not session_data:
            return None

        return InterviewSession(**session_data)

    def get_current_question(
        self,
        session: InterviewSession
    ) -> Optional[InterviewQuestion]:
        """
        Get the current unanswered question.

        Args:
            session: Interview session

        Returns:
            Next question to answer or None if all answered
        """
        for question in session.questions:
            # Skip if already answered
            if question.question_id in session.answers:
                continue

            # Skip if conditions not met
            if self.question_bank.should_skip_question(
                question,
                session.answers,
                session.metadata
            ):
                continue

            return question

        return None

    async def submit_answer(
        self,
        session_id: str,
        user_id: str,
        request: AnswerSubmitRequest
    ) -> Tuple[InterviewSession, Optional[InterviewQuestion]]:
        """
        Submit an answer to a question.

        Args:
            session_id: Session identifier
            user_id: User identifier
            request: Answer submission request

        Returns:
            Tuple of (updated session, next question)
        """
        # Get session
        session = await self.get_session(session_id, user_id)
        if not session:
            raise ValueError("Session not found")

        # Find the question
        question = next(
            (q for q in session.questions if q.question_id == request.question_id),
            None
        )
        if not question:
            raise ValueError("Question not found")

        # Validate answer
        validation = await self.validate_answer(question, request.answer_text)

        # Create answer object
        answer = InterviewAnswer(
            question_id=request.question_id,
            answer_text=request.answer_text,
            answered_at=datetime.utcnow(),
            validation_passed=validation.is_valid,
            feedback=validation.feedback,
        )

        # Update session
        session.answers[request.question_id] = answer
        session.answered_questions = len(session.answers)
        session.updated_at = datetime.utcnow()

        # Update status
        if session.answered_questions >= session.total_questions * 0.7:
            session.status = SessionStatus.COMPLETED
        elif session.answered_questions > 0:
            session.status = SessionStatus.IN_PROGRESS

        # Save to database
        await self.sessions_collection.update_one(
            {"session_id": session_id, "user_id": user_id},
            {"$set": session.model_dump()}
        )

        # Get next question
        next_question = self.get_current_question(session)

        logger.info(
            f"Answer submitted for session {session_id}, question {request.question_id}"
        )

        return session, next_question

    async def edit_answer(
        self,
        session_id: str,
        user_id: str,
        question_id: str,
        request: AnswerEditRequest
    ) -> InterviewSession:
        """
        Edit an existing answer.

        Args:
            session_id: Session identifier
            user_id: User identifier
            question_id: Question identifier
            request: Answer edit request

        Returns:
            Updated session
        """
        # Get session
        session = await self.get_session(session_id, user_id)
        if not session:
            raise ValueError("Session not found")

        # Check if answer exists
        if question_id not in session.answers:
            raise ValueError("Answer not found")

        # Find the question
        question = next(
            (q for q in session.questions if q.question_id == question_id),
            None
        )
        if not question:
            raise ValueError("Question not found")

        # Validate new answer
        validation = await self.validate_answer(question, request.answer_text)

        # Update answer
        answer = session.answers[question_id]
        answer.answer_text = request.answer_text
        answer.edited_at = datetime.utcnow()
        answer.validation_passed = validation.is_valid
        answer.feedback = validation.feedback

        session.updated_at = datetime.utcnow()

        # Save to database
        await self.sessions_collection.update_one(
            {"session_id": session_id, "user_id": user_id},
            {"$set": session.model_dump()}
        )

        logger.info(f"Answer edited for session {session_id}, question {question_id}")

        return session

    async def validate_answer(
        self,
        question: InterviewQuestion,
        answer_text: str
    ) -> ValidationResponse:
        """
        Validate an answer against question requirements.

        Args:
            question: Question being answered
            answer_text: User's answer

        Returns:
            Validation response with feedback
        """
        is_valid = True
        feedback = None
        suggestions = []

        word_count = len(answer_text.split())
        char_count = len(answer_text)

        # Check length requirements
        if char_count < question.min_length:
            is_valid = False
            feedback = f"Answer is too short. Minimum {question.min_length} characters required."
            suggestions.append(f"Provide more detail. You need at least {question.min_length - char_count} more characters.")

        if char_count > question.max_length:
            is_valid = False
            feedback = f"Answer is too long. Maximum {question.max_length} characters allowed."
            suggestions.append(f"Please shorten your answer by {char_count - question.max_length} characters.")

        # Check if answer is generic or too vague
        generic_phrases = ["i think", "i believe", "maybe", "probably", "kind of", "sort of"]
        generic_count = sum(1 for phrase in generic_phrases if phrase in answer_text.lower())
        if generic_count > 3:
            suggestions.append("Try to be more specific and confident in your statements.")

        # Check if answer has sufficient detail
        if word_count < 30 and question.required:
            suggestions.append("Provide more specific examples and details to strengthen your answer.")

        # Provide positive feedback for good answers
        if is_valid and word_count >= 50:
            feedback = "Great answer! This provides good detail and context."

        return ValidationResponse(
            is_valid=is_valid,
            feedback=feedback,
            suggestions=suggestions,
            word_count=word_count,
            char_count=char_count,
        )

    async def generate_sop(
        self,
        session_id: str,
        user_id: str,
        request: GenerateSOPRequest
    ) -> SOPDraft:
        """
        Generate SOP from interview answers.

        Args:
            session_id: Session identifier
            user_id: User identifier
            request: Generation request

        Returns:
            Generated SOP draft
        """
        # Get session
        session = await self.get_session(session_id, user_id)
        if not session:
            raise ValueError("Session not found")

        # Check if enough questions answered
        if session.answered_questions < session.total_questions * 0.5:
            raise ValueError("Please answer at least 50% of questions before generating SOP")

        # Build context from answers
        context = self._build_sop_context(session)

        # Generate SOP with specific tone
        sop_content = await self._generate_with_gemini(
            context=context,
            tone=request.tone,
            word_count=request.word_count_target,
            additional_instructions=request.additional_instructions,
        )

        # Structure the SOP
        structure = self._extract_structure(sop_content)

        # Create draft
        draft_id = str(uuid.uuid4())
        draft = SOPDraft(
            draft_id=draft_id,
            generated_at=datetime.utcnow(),
            tone=request.tone,
            content=sop_content,
            structure=structure,
            metadata={
                "word_count_target": request.word_count_target,
                "questions_answered": session.answered_questions,
            }
        )

        # Add draft to session
        session.drafts.append(draft)
        session.status = SessionStatus.DRAFT_GENERATED
        session.updated_at = datetime.utcnow()

        # Save to database
        await self.sessions_collection.update_one(
            {"session_id": session_id, "user_id": user_id},
            {"$set": session.model_dump()}
        )

        logger.info(f"Generated SOP draft {draft_id} for session {session_id}")

        return draft

    async def regenerate_sop(
        self,
        session_id: str,
        user_id: str,
        request: RegenerateSOPRequest
    ) -> SOPDraft:
        """
        Regenerate SOP with different parameters.

        Args:
            session_id: Session identifier
            user_id: User identifier
            request: Regeneration request

        Returns:
            New SOP draft
        """
        # Use generate_sop with new parameters
        generation_request = GenerateSOPRequest(
            tone=request.tone,
            additional_instructions=request.additional_instructions,
            word_count_target=request.word_count_target,
        )

        new_draft = await self.generate_sop(session_id, user_id, generation_request)

        logger.info(f"Regenerated SOP for session {session_id}")

        return new_draft

    def _build_sop_context(self, session: InterviewSession) -> Dict[str, Any]:
        """
        Build structured context from interview answers.

        Args:
            session: Interview session

        Returns:
            Structured context dictionary
        """
        context = {
            "program_info": {
                "program_name": session.program_name,
                "university_name": session.university_name,
                "degree_level": session.degree_level,
                "field_of_study": session.field_of_study,
            },
            "answers_by_category": {},
        }

        # Group answers by category
        for question in session.questions:
            if question.question_id not in session.answers:
                continue

            answer = session.answers[question.question_id]
            category = question.category.value

            if category not in context["answers_by_category"]:
                context["answers_by_category"][category] = []

            context["answers_by_category"][category].append({
                "question": question.question_text,
                "answer": answer.answer_text,
            })

        return context

    async def _generate_with_gemini(
        self,
        context: Dict[str, Any],
        tone: SOPTone,
        word_count: int,
        additional_instructions: Optional[str] = None,
    ) -> str:
        """
        Generate SOP content using Google Gemini.

        Args:
            context: Structured context from interview
            tone: Desired tone for the SOP
            word_count: Target word count
            additional_instructions: Additional generation instructions

        Returns:
            Generated SOP content
        """
        # Build tone description
        tone_descriptions = {
            SOPTone.CONFIDENT: "confident and assertive, showcasing achievements and capabilities",
            SOPTone.HUMBLE: "humble and thoughtful, emphasizing learning and growth",
            SOPTone.ENTHUSIASTIC: "enthusiastic and passionate, showing excitement and motivation",
            SOPTone.BALANCED: "balanced and professional, combining confidence with humility",
        }

        tone_desc = tone_descriptions.get(tone, tone_descriptions[SOPTone.BALANCED])

        # Build prompt
        prompt = f"""You are an expert Statement of Purpose (SOP) writer helping a student apply to graduate programs.

Based on the following interview responses, write a compelling, well-structured Statement of Purpose.

PROGRAM INFORMATION:
- Program: {context['program_info']['program_name']}
- University: {context['program_info']['university_name']}
- Degree: {context['program_info']['degree_level']}
- Field: {context['program_info']['field_of_study']}

INTERVIEW RESPONSES:
"""

        # Add answers by category
        for category, qa_pairs in context['answers_by_category'].items():
            prompt += f"\n{category.upper().replace('_', ' ')}:\n"
            for qa in qa_pairs:
                prompt += f"Q: {qa['question']}\n"
                prompt += f"A: {qa['answer']}\n\n"

        prompt += f"""
INSTRUCTIONS:
1. Write a {word_count}-word Statement of Purpose
2. Use a {tone_desc} tone throughout
3. Structure: Opening hook → Academic background → Research/Projects → Career goals → Program fit → Conclusion
4. Maintain the student's authentic voice - avoid generic or robotic language
5. Include specific details from their responses
6. Show clear connection between their background and the program
7. Demonstrate genuine interest and fit for the program
8. Use transitional phrases to ensure smooth flow between paragraphs
9. Make it compelling and memorable
"""

        if additional_instructions:
            prompt += f"\n10. Additional requirements: {additional_instructions}\n"

        prompt += """
Write the Statement of Purpose now. Make it personal, specific, and compelling.
"""

        # Generate with Gemini
        try:
            response = await self.llm.ainvoke(prompt)
            sop_content = response.content

            return sop_content
        except Exception as e:
            logger.error(f"Error generating SOP with Gemini: {e}")
            raise

    def _extract_structure(self, sop_content: str) -> Dict[str, str]:
        """
        Extract structural sections from SOP content.

        Args:
            sop_content: Full SOP content

        Returns:
            Dictionary mapping section names to content
        """
        # Simple paragraph-based splitting
        paragraphs = [p.strip() for p in sop_content.split('\n\n') if p.strip()]

        structure = {}

        if len(paragraphs) >= 1:
            structure["introduction"] = paragraphs[0]

        if len(paragraphs) >= 3:
            structure["body"] = '\n\n'.join(paragraphs[1:-1])
        elif len(paragraphs) == 2:
            structure["body"] = paragraphs[1]

        if len(paragraphs) >= 2:
            structure["conclusion"] = paragraphs[-1]

        return structure

    async def get_session_progress(
        self,
        session_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Get detailed progress information for a session.

        Args:
            session_id: Session identifier
            user_id: User identifier

        Returns:
            Progress information dictionary
        """
        session = await self.get_session(session_id, user_id)
        if not session:
            raise ValueError("Session not found")

        # Count questions by category
        category_progress = {}
        for question in session.questions:
            category = question.category.value
            if category not in category_progress:
                category_progress[category] = {"total": 0, "answered": 0}

            category_progress[category]["total"] += 1
            if question.question_id in session.answers:
                category_progress[category]["answered"] += 1

        # Determine if can generate
        can_generate = session.answered_questions >= session.total_questions * 0.5

        return {
            "session_id": session_id,
            "status": session.status,
            "progress_percentage": session.progress_percentage,
            "answered_questions": session.answered_questions,
            "total_questions": session.total_questions,
            "remaining_questions": session.total_questions - session.answered_questions,
            "category_progress": category_progress,
            "can_generate": can_generate,
            "drafts_count": len(session.drafts),
        }

    async def list_sessions(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[InterviewSession]:
        """
        List all sessions for a user.

        Args:
            user_id: User identifier
            limit: Maximum number of sessions to return

        Returns:
            List of interview sessions
        """
        cursor = self.sessions_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)

        sessions = []
        async for session_data in cursor:
            sessions.append(InterviewSession(**session_data))

        return sessions

    async def delete_session(
        self,
        session_id: str,
        user_id: str
    ) -> bool:
        """
        Delete a session.

        Args:
            session_id: Session identifier
            user_id: User identifier

        Returns:
            True if deleted, False otherwise
        """
        result = await self.sessions_collection.delete_one({
            "session_id": session_id,
            "user_id": user_id
        })

        return result.deleted_count > 0
