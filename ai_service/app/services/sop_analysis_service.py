"""
SOP (Statement of Purpose) Analysis Service

Provides comprehensive analysis of SOPs including:
- Quality scoring (uniqueness, structure, specificity, tone, program fit)
- Cliché detection
- Structure and organization validation
- Program customization checking
"""

import re
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.services.embedding_service import embedding_service
from app.database.mongodb import get_database
from app.core.config import settings
from app.utils.logger import logger


class SOPAnalysisService:
    """Service for comprehensive SOP analysis and quality assessment"""

    # Common clichés database (expandable)
    CLICHES = [
        {
            "text": "ever since i was a child",
            "severity": "major",
            "category": "childhood_dream",
            "suggestion": "Start with a specific, recent experience that demonstrates your interest"
        },
        {
            "text": "from a very young age",
            "severity": "major",
            "category": "childhood_dream",
            "suggestion": "Focus on recent experiences and concrete achievements"
        },
        {
            "text": "i am passionate about",
            "severity": "moderate",
            "category": "generic_passion",
            "suggestion": "Show your passion through specific examples and achievements"
        },
        {
            "text": "it has always been my dream",
            "severity": "major",
            "category": "generic_dream",
            "suggestion": "Replace with specific goals and concrete steps you've taken"
        },
        {
            "text": "in today's rapidly changing world",
            "severity": "moderate",
            "category": "generic_opening",
            "suggestion": "Start with a unique observation or personal experience"
        },
        {
            "text": "in this era of globalization",
            "severity": "moderate",
            "category": "generic_opening",
            "suggestion": "Begin with a specific, relevant context"
        },
        {
            "text": "since childhood",
            "severity": "major",
            "category": "childhood_dream",
            "suggestion": "Focus on recent, specific experiences"
        },
        {
            "text": "i want to make a difference",
            "severity": "moderate",
            "category": "vague_goal",
            "suggestion": "Define specific, measurable goals and impact"
        },
        {
            "text": "give back to society",
            "severity": "moderate",
            "category": "vague_goal",
            "suggestion": "Specify how and what concrete contributions you plan to make"
        },
        {
            "text": "achieve my dreams",
            "severity": "moderate",
            "category": "vague_goal",
            "suggestion": "State specific, actionable career objectives"
        },
        {
            "text": "broaden my horizons",
            "severity": "moderate",
            "category": "vague_goal",
            "suggestion": "Specify what knowledge or skills you seek"
        },
        {
            "text": "expand my knowledge",
            "severity": "minor",
            "category": "vague_goal",
            "suggestion": "Identify specific areas of knowledge and why they matter"
        },
        {
            "text": "follow my passion",
            "severity": "moderate",
            "category": "generic_passion",
            "suggestion": "Demonstrate passion through specific actions and achievements"
        },
        {
            "text": "pursue my interest",
            "severity": "minor",
            "category": "generic_passion",
            "suggestion": "Show concrete examples of how you've pursued this interest"
        },
        {
            "text": "throughout my life",
            "severity": "moderate",
            "category": "time_vague",
            "suggestion": "Be specific about timeframes and experiences"
        },
        {
            "text": "as long as i can remember",
            "severity": "major",
            "category": "childhood_dream",
            "suggestion": "Focus on recent, verifiable experiences"
        },
        {
            "text": "deeply fascinated",
            "severity": "minor",
            "category": "emotion_cliche",
            "suggestion": "Explain what specifically fascinates you and why"
        },
        {
            "text": "truly inspired",
            "severity": "minor",
            "category": "emotion_cliche",
            "suggestion": "Describe the specific source of inspiration and its impact"
        },
        {
            "text": "highly motivated",
            "severity": "minor",
            "category": "generic_trait",
            "suggestion": "Demonstrate motivation through specific actions"
        },
        {
            "text": "strongly believe",
            "severity": "minor",
            "category": "belief_cliche",
            "suggestion": "Support beliefs with evidence and examples"
        },
        {
            "text": "i believe that",
            "severity": "minor",
            "category": "belief_cliche",
            "suggestion": "Show through examples rather than stating beliefs"
        },
        {
            "text": "perfect fit",
            "severity": "moderate",
            "category": "fit_cliche",
            "suggestion": "Explain specific reasons for program alignment"
        },
        {
            "text": "ideal candidate",
            "severity": "moderate",
            "category": "fit_cliche",
            "suggestion": "Let your experiences demonstrate fit rather than claiming it"
        },
        {
            "text": "unique opportunity",
            "severity": "minor",
            "category": "generic_opportunity",
            "suggestion": "Specify what makes this opportunity unique for you"
        },
        {
            "text": "greatly contribute",
            "severity": "minor",
            "category": "vague_contribution",
            "suggestion": "Detail specific contributions you can make"
        },
        {
            "text": "diverse background",
            "severity": "minor",
            "category": "generic_background",
            "suggestion": "Highlight specific diverse experiences and their value"
        },
        {
            "text": "well-rounded",
            "severity": "minor",
            "category": "generic_trait",
            "suggestion": "Show varied experiences through specific examples"
        },
        {
            "text": "hardworking and dedicated",
            "severity": "moderate",
            "category": "generic_trait",
            "suggestion": "Prove these qualities through accomplishments"
        },
        {
            "text": "team player",
            "severity": "moderate",
            "category": "generic_trait",
            "suggestion": "Provide specific examples of team contributions"
        },
        {
            "text": "fast learner",
            "severity": "moderate",
            "category": "generic_trait",
            "suggestion": "Demonstrate learning ability with concrete examples"
        },
        {
            "text": "problem solver",
            "severity": "moderate",
            "category": "generic_trait",
            "suggestion": "Describe specific problems you've solved"
        },
        {
            "text": "attention to detail",
            "severity": "minor",
            "category": "generic_trait",
            "suggestion": "Show this through specific work examples"
        },
        {
            "text": "excellent communication skills",
            "severity": "moderate",
            "category": "generic_skill",
            "suggestion": "Demonstrate through specific communication achievements"
        },
        {
            "text": "strong work ethic",
            "severity": "moderate",
            "category": "generic_trait",
            "suggestion": "Illustrate with concrete achievements"
        },
        {
            "text": "go above and beyond",
            "severity": "moderate",
            "category": "effort_cliche",
            "suggestion": "Describe specific instances where you exceeded expectations"
        },
        {
            "text": "cutting edge",
            "severity": "minor",
            "category": "buzzword",
            "suggestion": "Be specific about technologies or methods"
        },
        {
            "text": "state of the art",
            "severity": "minor",
            "category": "buzzword",
            "suggestion": "Specify exact technologies or approaches"
        },
        {
            "text": "world-class",
            "severity": "minor",
            "category": "buzzword",
            "suggestion": "Use specific rankings or achievements"
        },
        {
            "text": "prestigious institution",
            "severity": "minor",
            "category": "flattery",
            "suggestion": "Focus on specific program features that attract you"
        },
        {
            "text": "renowned university",
            "severity": "minor",
            "category": "flattery",
            "suggestion": "Mention specific faculty, research, or resources"
        },
        {
            "text": "at the forefront",
            "severity": "minor",
            "category": "buzzword",
            "suggestion": "Cite specific innovations or leadership"
        },
        {
            "text": "leading institution",
            "severity": "minor",
            "category": "flattery",
            "suggestion": "Reference specific achievements or programs"
        },
        {
            "text": "exceptional program",
            "severity": "minor",
            "category": "flattery",
            "suggestion": "Identify specific program elements that appeal to you"
        }
    ]

    def __init__(self):
        """Initialize SOP analysis service"""
        self.llm = None
        if settings.GOOGLE_API_KEY:
            try:
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-pro",
                    google_api_key=settings.GOOGLE_API_KEY,
                    temperature=0.3  # Lower temperature for more consistent analysis
                )
                logger.info("SOP Analysis Service initialized with Google Gemini")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini LLM: {e}")
                self.llm = None
        else:
            logger.warning("GOOGLE_API_KEY not set, AI analysis will be limited")

        self._db = None
        self._sop_collection = None
        self._cliches_collection = None

        # Clichés database will be initialized lazily when first accessed

    @property
    def db(self):
        """Lazy initialization of database connection"""
        if self._db is None:
            self._db = get_database()
        return self._db

    @property
    def sop_collection(self):
        """Lazy initialization of SOP collection"""
        if self._sop_collection is None:
            self._sop_collection = self.db["sop_analysis"]
        return self._sop_collection

    @property
    def cliches_collection(self):
        """Lazy initialization of clichés collection"""
        if self._cliches_collection is None:
            self._cliches_collection = self.db["sop_cliches"]
        return self._cliches_collection

    def _init_cliches_database(self):
        """Initialize clichés in MongoDB for easy expansion"""
        try:
            # Check if clichés already exist
            count = self.cliches_collection.count_documents({})
            if count == 0:
                logger.info("Initializing clichés database")
                for cliche in self.CLICHES:
                    cliche["created_at"] = datetime.utcnow()
                    cliche["updated_at"] = datetime.utcnow()
                self.cliches_collection.insert_many(self.CLICHES)
                logger.info(f"Initialized {len(self.CLICHES)} clichés")
        except Exception as e:
            logger.error(f"Error initializing clichés database: {e}")

    async def analyze_sop(
        self,
        sop_text: str,
        user_id: str,
        university_name: Optional[str] = None,
        program_name: Optional[str] = None,
        compare_with_database: bool = True
    ) -> Dict[str, Any]:
        """
        Comprehensive SOP analysis

        Args:
            sop_text: The SOP content to analyze
            user_id: User identifier
            university_name: Target university name (optional)
            program_name: Target program name (optional)
            compare_with_database: Whether to compare with existing SOPs for uniqueness

        Returns:
            Dict containing comprehensive analysis results
        """
        logger.info(f"Starting SOP analysis for user {user_id}")

        try:
            # Run all analyses in parallel
            structure_analysis = await self._analyze_structure(sop_text)
            cliche_detection = await self._detect_cliches(sop_text)
            specificity_score = await self._analyze_specificity(sop_text)
            tone_analysis = await self._analyze_tone(sop_text)

            # Program fit analysis (if university/program provided)
            program_fit = await self._analyze_program_fit(
                sop_text,
                university_name,
                program_name
            )

            # Uniqueness score (compare with database)
            uniqueness_score = 100.0  # Default if not comparing
            if compare_with_database:
                uniqueness_score = await self._calculate_uniqueness(
                    sop_text,
                    user_id
                )

            # Calculate overall weighted score
            overall_score = self._calculate_overall_score(
                uniqueness_score=uniqueness_score,
                structure_score=structure_analysis["score"],
                specificity_score=specificity_score,
                tone_score=tone_analysis["score"],
                program_fit_score=program_fit["score"]
            )

            # Generate AI-powered recommendations
            recommendations = await self._generate_recommendations(
                sop_text=sop_text,
                structure_analysis=structure_analysis,
                cliche_detection=cliche_detection,
                specificity_score=specificity_score,
                tone_analysis=tone_analysis,
                program_fit=program_fit,
                overall_score=overall_score
            )

            # Compile complete analysis
            analysis_result = {
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "sop_length": len(sop_text),
                "word_count": len(sop_text.split()),
                "university_name": university_name,
                "program_name": program_name,
                "scores": {
                    "overall": round(overall_score, 2),
                    "uniqueness": round(uniqueness_score, 2),
                    "structure": round(structure_analysis["score"], 2),
                    "specificity": round(specificity_score, 2),
                    "tone": round(tone_analysis["score"], 2),
                    "program_fit": round(program_fit["score"], 2)
                },
                "structure_analysis": structure_analysis,
                "cliche_detection": cliche_detection,
                "tone_analysis": tone_analysis,
                "program_fit": program_fit,
                "recommendations": recommendations,
                "grade": self._get_grade(overall_score)
            }

            # Store analysis in database
            await self._store_analysis(analysis_result)

            logger.info(f"SOP analysis completed. Overall score: {overall_score:.2f}")
            return analysis_result

        except Exception as e:
            logger.error(f"Error analyzing SOP: {e}", exc_info=True)
            raise

    async def _analyze_structure(self, sop_text: str) -> Dict[str, Any]:
        """
        Analyze SOP structure and organization

        Checks for:
        - Introduction paragraph
        - Body paragraphs
        - Conclusion paragraph
        - Paragraph length consistency
        - Logical flow and transitions
        """
        paragraphs = [p.strip() for p in sop_text.split('\n\n') if p.strip()]
        num_paragraphs = len(paragraphs)

        # Initialize scoring
        score_components = {}
        issues = []
        suggestions = []

        # Check paragraph count (ideal: 4-6 paragraphs)
        if num_paragraphs < 3:
            score_components["paragraph_count"] = 50
            issues.append("Too few paragraphs - needs better organization")
            suggestions.append("Organize into at least 4-5 paragraphs: intro, 2-3 body, conclusion")
        elif num_paragraphs > 7:
            score_components["paragraph_count"] = 70
            issues.append("Too many short paragraphs - consider combining related ideas")
            suggestions.append("Combine related paragraphs for better flow")
        else:
            score_components["paragraph_count"] = 100

        # Check paragraph lengths
        paragraph_lengths = [len(p.split()) for p in paragraphs]
        avg_length = sum(paragraph_lengths) / len(paragraph_lengths) if paragraph_lengths else 0

        if avg_length < 50:
            score_components["paragraph_length"] = 60
            issues.append("Paragraphs are too short - need more development")
            suggestions.append("Expand paragraphs with specific examples and details")
        elif avg_length > 200:
            score_components["paragraph_length"] = 70
            issues.append("Paragraphs are too long - may lose reader's attention")
            suggestions.append("Break long paragraphs into more focused sections")
        else:
            score_components["paragraph_length"] = 100

        # Check for introduction (first paragraph should be engaging)
        if paragraphs:
            intro = paragraphs[0]
            intro_words = len(intro.split())

            if intro_words < 40:
                score_components["introduction"] = 60
                issues.append("Introduction is too brief")
                suggestions.append("Expand introduction with a compelling opening")
            elif intro_words > 150:
                score_components["introduction"] = 80
                issues.append("Introduction is too long")
                suggestions.append("Make introduction more concise and impactful")
            else:
                score_components["introduction"] = 100

        # Check for conclusion (last paragraph should wrap up)
        if len(paragraphs) >= 2:
            conclusion = paragraphs[-1]
            conclusion_words = len(conclusion.split())

            conclusion_indicators = [
                "in conclusion", "to conclude", "in summary",
                "finally", "looking forward", "i am confident",
                "i believe", "i look forward"
            ]

            has_conclusion_marker = any(
                indicator in conclusion.lower()
                for indicator in conclusion_indicators
            )

            if conclusion_words < 40:
                score_components["conclusion"] = 70
                issues.append("Conclusion is too brief")
                suggestions.append("Strengthen conclusion with clear future goals")
            elif not has_conclusion_marker:
                score_components["conclusion"] = 85
                suggestions.append("Consider adding a clear concluding statement")
            else:
                score_components["conclusion"] = 100

        # Check transitions between paragraphs
        transition_words = [
            "furthermore", "moreover", "additionally", "however",
            "nevertheless", "consequently", "therefore", "thus",
            "for example", "for instance", "in addition", "similarly",
            "in contrast", "on the other hand", "subsequently"
        ]

        transition_count = sum(
            1 for word in transition_words
            if word in sop_text.lower()
        )

        expected_transitions = max(0, num_paragraphs - 1)
        if transition_count >= expected_transitions * 0.5:
            score_components["transitions"] = 100
        elif transition_count >= expected_transitions * 0.25:
            score_components["transitions"] = 80
            suggestions.append("Add more transition words for better flow")
        else:
            score_components["transitions"] = 60
            issues.append("Lacks smooth transitions between ideas")
            suggestions.append("Use transition words to connect paragraphs logically")

        # Calculate overall structure score
        structure_score = sum(score_components.values()) / len(score_components)

        return {
            "score": structure_score,
            "paragraph_count": num_paragraphs,
            "average_paragraph_length": round(avg_length, 1),
            "issues": issues,
            "suggestions": suggestions,
            "score_breakdown": score_components
        }

    async def _detect_cliches(self, sop_text: str) -> Dict[str, Any]:
        """
        Detect clichés in the SOP

        Returns detailed information about found clichés including:
        - Text matches
        - Severity levels
        - Positions in text
        - Suggestions for improvement
        """
        sop_lower = sop_text.lower()
        detected_cliches = []

        # Fetch clichés from database (allows for easy expansion)
        try:
            cliches_cursor = self.cliches_collection.find({})
            cliches = await cliches_cursor.to_list(length=None)
        except:
            # Fallback to in-memory clichés
            cliches = self.CLICHES

        for cliche in cliches:
            pattern = cliche["text"]
            # Find all occurrences
            for match in re.finditer(re.escape(pattern), sop_lower):
                start_pos = match.start()
                end_pos = match.end()

                # Get context (50 chars before and after)
                context_start = max(0, start_pos - 50)
                context_end = min(len(sop_text), end_pos + 50)
                context = sop_text[context_start:context_end]

                detected_cliches.append({
                    "text": cliche["text"],
                    "severity": cliche["severity"],
                    "category": cliche["category"],
                    "position": {
                        "start": start_pos,
                        "end": end_pos
                    },
                    "context": context,
                    "suggestion": cliche["suggestion"]
                })

        # Count by severity
        severity_counts = {
            "major": sum(1 for c in detected_cliches if c["severity"] == "major"),
            "moderate": sum(1 for c in detected_cliches if c["severity"] == "moderate"),
            "minor": sum(1 for c in detected_cliches if c["severity"] == "minor")
        }

        # Calculate cliché score impact
        total_cliches = len(detected_cliches)
        cliche_penalty = (
            severity_counts["major"] * 10 +
            severity_counts["moderate"] * 5 +
            severity_counts["minor"] * 2
        )

        return {
            "total_cliches": total_cliches,
            "severity_counts": severity_counts,
            "detected_cliches": detected_cliches,
            "cliche_penalty": min(cliche_penalty, 50),  # Cap at 50 points
            "categories": list(set(c["category"] for c in detected_cliches))
        }

    async def _analyze_specificity(self, sop_text: str) -> float:
        """
        Analyze specificity vs. generic content

        Higher scores indicate more specific, concrete examples
        Lower scores indicate generic, vague statements
        """
        # Specific indicators (positive signals)
        specific_indicators = [
            r'\d{1,2}%',  # Percentages
            r'\$\d+',  # Monetary amounts
            r'\d+\s*(years?|months?|weeks?)',  # Time periods
            r'\d+\s*(projects?|papers?|publications?)',  # Quantified work
            r'published',
            r'developed',
            r'implemented',
            r'created',
            r'designed',
            r'built',
            r'led',
            r'managed',
            r'supervised',
            r'achieved',
            r'improved',
            r'increased',
            r'reduced',
            r'won',
            r'awarded',
            r'granted'
        ]

        # Generic indicators (negative signals)
        generic_indicators = [
            r'\b(very|really|quite|extremely)\b',
            r'\b(good|bad|nice|great|amazing)\b',
            r'\b(things|stuff|something|anything)\b',
            r'\b(always|never|everyone|nobody)\b',
            r'\b(interested in|passionate about|fascinated by)\b',
            r'\b(want to|would like to|hope to)\b'
        ]

        # Count specific indicators
        specific_count = sum(
            len(re.findall(pattern, sop_text, re.IGNORECASE))
            for pattern in specific_indicators
        )

        # Count generic indicators
        generic_count = sum(
            len(re.findall(pattern, sop_text, re.IGNORECASE))
            for pattern in generic_indicators
        )

        # Calculate specificity score
        word_count = len(sop_text.split())
        specific_ratio = (specific_count / word_count) * 100 if word_count > 0 else 0
        generic_ratio = (generic_count / word_count) * 100 if word_count > 0 else 0

        # Score formula: higher specific ratio is good, higher generic ratio is bad
        base_score = min(specific_ratio * 20, 70)  # Max 70 from specific indicators
        penalty = min(generic_ratio * 10, 30)  # Max 30 penalty from generic words

        specificity_score = max(0, min(100, base_score + 30 - penalty))

        return specificity_score

    async def _analyze_tone(self, sop_text: str) -> Dict[str, Any]:
        """
        Analyze tone and voice

        Evaluates:
        - Confidence level
        - Professionalism
        - Passion/enthusiasm
        - Humility vs. arrogance balance
        """
        tone_scores = {}

        # Confidence indicators
        confident_phrases = [
            r'\bi am confident\b', r'\bi can\b', r'\bi will\b',
            r'\bmy experience\b', r'\bmy skills\b', r'\bi have\b',
            r'\bmy background\b', r'\bmy research\b'
        ]

        # Weak/uncertain phrases
        weak_phrases = [
            r'\bi think\b', r'\bi feel\b', r'\bi hope\b',
            r'\bmaybe\b', r'\bperhaps\b', r'\bpossibly\b',
            r'\bi might\b', r'\bi could\b', r'\bi would like to try\b'
        ]

        confident_count = sum(
            len(re.findall(pattern, sop_text, re.IGNORECASE))
            for pattern in confident_phrases
        )

        weak_count = sum(
            len(re.findall(pattern, sop_text, re.IGNORECASE))
            for pattern in weak_phrases
        )

        # Confidence score
        if confident_count > weak_count * 2:
            tone_scores["confidence"] = 100
        elif confident_count > weak_count:
            tone_scores["confidence"] = 85
        elif confident_count == weak_count:
            tone_scores["confidence"] = 70
        else:
            tone_scores["confidence"] = 60

        # Passion indicators
        passion_words = [
            r'\bexcited\b', r'\benthusiastic\b', r'\beager\b',
            r'\bmotivated\b', r'\binspired\b', r'\bdriven\b'
        ]

        passion_count = sum(
            len(re.findall(pattern, sop_text, re.IGNORECASE))
            for pattern in passion_words
        )

        if passion_count >= 3:
            tone_scores["passion"] = 100
        elif passion_count >= 2:
            tone_scores["passion"] = 85
        elif passion_count >= 1:
            tone_scores["passion"] = 70
        else:
            tone_scores["passion"] = 60

        # Professionalism check
        informal_words = [
            r'\bgonna\b', r'\bwanna\b', r'\bkinda\b', r'\bsorta\b',
            r'\byou know\b', r'\blike\b', r'\bstuff\b', r'\bthings\b'
        ]

        informal_count = sum(
            len(re.findall(pattern, sop_text, re.IGNORECASE))
            for pattern in informal_words
        )

        if informal_count == 0:
            tone_scores["professionalism"] = 100
        elif informal_count <= 2:
            tone_scores["professionalism"] = 85
        else:
            tone_scores["professionalism"] = 60

        # Arrogance check
        arrogant_phrases = [
            r'\bi am the best\b', r'\bno one\b', r'\bbetter than\b',
            r'\bsuperior\b', r'\bexceptional\b', r'\boutstanding\b'
        ]

        arrogant_count = sum(
            len(re.findall(pattern, sop_text, re.IGNORECASE))
            for pattern in arrogant_phrases
        )

        if arrogant_count > 3:
            tone_scores["humility"] = 60
        elif arrogant_count > 0:
            tone_scores["humility"] = 80
        else:
            tone_scores["humility"] = 100

        # Calculate overall tone score
        overall_tone_score = sum(tone_scores.values()) / len(tone_scores)

        return {
            "score": overall_tone_score,
            "breakdown": tone_scores,
            "confident_phrases": confident_count,
            "weak_phrases": weak_count,
            "passion_indicators": passion_count,
            "informal_language": informal_count
        }

    async def _analyze_program_fit(
        self,
        sop_text: str,
        university_name: Optional[str],
        program_name: Optional[str]
    ) -> Dict[str, Any]:
        """
        Analyze how well the SOP is customized to the specific program

        Checks for:
        - University name mentions
        - Program name mentions
        - Faculty mentions
        - Specific courses or research areas
        - Generic vs. customized content
        """
        fit_score = 0
        mentions = {
            "university": 0,
            "program": 0,
            "faculty": 0,
            "courses": 0,
            "research_areas": 0
        }
        issues = []
        suggestions = []

        # Check university name
        if university_name:
            # Create variations of university name
            uni_variations = [
                university_name.lower(),
                university_name.replace("University of", "").strip().lower(),
                university_name.replace("The", "").strip().lower()
            ]

            mentions["university"] = sum(
                sop_text.lower().count(var) for var in uni_variations
            )

            if mentions["university"] == 0:
                issues.append("University name not mentioned - appears too generic")
                suggestions.append(f"Mention {university_name} specifically")
            elif mentions["university"] == 1:
                fit_score += 15
                suggestions.append(f"Consider mentioning {university_name} more than once")
            else:
                fit_score += 25

        # Check program name
        if program_name:
            program_lower = program_name.lower()
            mentions["program"] = sop_text.lower().count(program_lower)

            if mentions["program"] == 0:
                issues.append("Program name not mentioned")
                suggestions.append(f"Mention the {program_name} program specifically")
            elif mentions["program"] >= 1:
                fit_score += 20

        # Detect faculty mentions (common patterns)
        faculty_patterns = [
            r'Professor\s+[A-Z][a-z]+',
            r'Dr\.\s+[A-Z][a-z]+',
            r'Prof\.\s+[A-Z][a-z]+'
        ]

        for pattern in faculty_patterns:
            faculty_matches = re.findall(pattern, sop_text)
            mentions["faculty"] += len(faculty_matches)

        if mentions["faculty"] == 0:
            issues.append("No faculty members mentioned")
            suggestions.append("Research and mention specific faculty whose work aligns with your interests")
        elif mentions["faculty"] >= 1:
            fit_score += 25

        # Detect course mentions
        course_patterns = [
            r'\bcourse[s]?\s+(?:in|on)\s+\w+',
            r'\bclass(?:es)?\s+(?:in|on)\s+\w+',
            r'[A-Z]{2,4}\s+\d{3,4}'  # Course codes like CS 101
        ]

        for pattern in course_patterns:
            course_matches = re.findall(pattern, sop_text, re.IGNORECASE)
            mentions["courses"] += len(course_matches)

        if mentions["courses"] == 0:
            suggestions.append("Mention specific courses that interest you")
        elif mentions["courses"] >= 1:
            fit_score += 15

        # Detect research area mentions
        research_keywords = [
            r'\bresearch\s+(?:in|on)\s+\w+',
            r'\blab(?:oratory)?\b',
            r'\bresearch\s+group\b',
            r'\bresearch\s+center\b',
            r'\bproject[s]?\s+on\b'
        ]

        for pattern in research_keywords:
            research_matches = re.findall(pattern, sop_text, re.IGNORECASE)
            mentions["research_areas"] += len(research_matches)

        if mentions["research_areas"] == 0:
            suggestions.append("Mention specific research areas or labs")
        elif mentions["research_areas"] >= 1:
            fit_score += 15

        # Add base score if no specific info provided
        if not university_name and not program_name:
            fit_score = 70  # Neutral score when no comparison possible
            suggestions.append("Provide university and program details for better customization analysis")

        return {
            "score": min(fit_score, 100),
            "mentions": mentions,
            "issues": issues,
            "suggestions": suggestions,
            "is_customized": fit_score >= 50
        }

    async def _calculate_uniqueness(self, sop_text: str, user_id: str) -> float:
        """
        Calculate uniqueness score by comparing with existing SOPs

        Uses embeddings to find semantic similarity with other SOPs
        Lower similarity = higher uniqueness
        """
        try:
            # Generate embedding for this SOP
            embeddings, _ = await embedding_service.generate_embeddings(
                texts=[sop_text],
                provider="openai"
            )

            if not embeddings:
                logger.warning("Could not generate embeddings for uniqueness check")
                return 85.0  # Default score

            sop_embedding = embeddings[0]

            # Find similar SOPs from other users (not same user)
            # This would query the vector database
            # For now, return a high score as placeholder
            # TODO: Implement actual vector similarity search

            uniqueness_score = 85.0  # Default high uniqueness

            return uniqueness_score

        except Exception as e:
            logger.error(f"Error calculating uniqueness: {e}")
            return 85.0  # Default score on error

    def _calculate_overall_score(
        self,
        uniqueness_score: float,
        structure_score: float,
        specificity_score: float,
        tone_score: float,
        program_fit_score: float
    ) -> float:
        """
        Calculate weighted overall score

        Weights:
        - Uniqueness: 20%
        - Structure: 20%
        - Specificity: 25%
        - Tone: 15%
        - Program Fit: 20%
        """
        weights = {
            "uniqueness": 0.20,
            "structure": 0.20,
            "specificity": 0.25,
            "tone": 0.15,
            "program_fit": 0.20
        }

        overall = (
            uniqueness_score * weights["uniqueness"] +
            structure_score * weights["structure"] +
            specificity_score * weights["specificity"] +
            tone_score * weights["tone"] +
            program_fit_score * weights["program_fit"]
        )

        return overall

    async def _generate_recommendations(
        self,
        sop_text: str,
        structure_analysis: Dict,
        cliche_detection: Dict,
        specificity_score: float,
        tone_analysis: Dict,
        program_fit: Dict,
        overall_score: float
    ) -> List[Dict[str, Any]]:
        """
        Generate AI-powered recommendations using Google Gemini

        Returns prioritized list of actionable recommendations
        """
        recommendations = []

        # Add structure recommendations
        if structure_analysis["score"] < 80:
            for issue in structure_analysis["issues"]:
                recommendations.append({
                    "category": "structure",
                    "priority": "high" if structure_analysis["score"] < 60 else "medium",
                    "issue": issue,
                    "suggestions": [s for s in structure_analysis["suggestions"]]
                })

        # Add cliché recommendations
        if cliche_detection["total_cliches"] > 0:
            major_cliches = [
                c for c in cliche_detection["detected_cliches"]
                if c["severity"] == "major"
            ]

            for cliche in major_cliches[:5]:  # Top 5 major clichés
                recommendations.append({
                    "category": "cliche",
                    "priority": "high",
                    "issue": f"Remove cliché: '{cliche['text']}'",
                    "suggestions": [cliche["suggestion"]]
                })

        # Add specificity recommendations
        if specificity_score < 70:
            recommendations.append({
                "category": "specificity",
                "priority": "high",
                "issue": "SOP lacks specific examples and quantifiable achievements",
                "suggestions": [
                    "Add specific numbers, percentages, or metrics to your achievements",
                    "Replace generic statements with concrete examples",
                    "Include specific project names, technologies, or methodologies"
                ]
            })

        # Add tone recommendations
        if tone_analysis["score"] < 75:
            recommendations.append({
                "category": "tone",
                "priority": "medium",
                "issue": "Tone needs improvement for academic writing",
                "suggestions": [
                    "Use more confident language ('I am' instead of 'I think')",
                    "Show passion through achievements rather than stating it",
                    "Maintain professional language throughout"
                ]
            })

        # Add program fit recommendations
        if program_fit["score"] < 60:
            for issue in program_fit["issues"]:
                recommendations.append({
                    "category": "program_fit",
                    "priority": "high",
                    "issue": issue,
                    "suggestions": program_fit["suggestions"]
                })

        # Use Gemini for additional insights if available
        if self.llm and overall_score < 80:
            try:
                ai_recommendations = await self._get_ai_recommendations(
                    sop_text,
                    overall_score
                )
                recommendations.extend(ai_recommendations)
            except Exception as e:
                logger.error(f"Error getting AI recommendations: {e}")

        # Sort by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        recommendations.sort(key=lambda x: priority_order.get(x["priority"], 3))

        return recommendations

    async def _get_ai_recommendations(
        self,
        sop_text: str,
        overall_score: float
    ) -> List[Dict[str, Any]]:
        """
        Get AI-powered recommendations using Google Gemini
        """
        if not self.llm:
            return []

        try:
            prompt = f"""You are an expert SOP (Statement of Purpose) reviewer. Analyze the following SOP and provide 3-5 specific, actionable recommendations to improve it.

Current Overall Score: {overall_score:.1f}/100

SOP Text:
{sop_text[:2000]}  # Limit to first 2000 chars for API efficiency

Focus on:
1. Specific improvements (not generic advice)
2. Actionable changes the writer can make
3. Areas that would have the highest impact on quality

Return your recommendations in this format:
- [Category: content/writing/organization] Priority: [high/medium/low]
  Issue: [specific problem]
  Suggestion: [actionable fix]
"""

            messages = [
                SystemMessage(content="You are an expert academic admissions consultant specializing in SOP review."),
                HumanMessage(content=prompt)
            ]

            response = await self.llm.ainvoke(messages)
            ai_text = response.content

            # Parse AI response into structured recommendations
            # This is a simple parser - could be enhanced
            ai_recommendations = []
            lines = ai_text.split('\n')

            current_rec = None
            for line in lines:
                line = line.strip()
                if line.startswith('- [Category:'):
                    if current_rec:
                        ai_recommendations.append(current_rec)

                    # Parse category and priority
                    try:
                        category_match = re.search(r'Category:\s*(\w+)', line)
                        priority_match = re.search(r'Priority:\s*(\w+)', line)

                        current_rec = {
                            "category": category_match.group(1) if category_match else "general",
                            "priority": priority_match.group(1) if priority_match else "medium",
                            "issue": "",
                            "suggestions": []
                        }
                    except:
                        current_rec = None

                elif current_rec and line.startswith('Issue:'):
                    current_rec["issue"] = line.replace('Issue:', '').strip()
                elif current_rec and line.startswith('Suggestion:'):
                    suggestion = line.replace('Suggestion:', '').strip()
                    current_rec["suggestions"].append(suggestion)

            if current_rec:
                ai_recommendations.append(current_rec)

            return ai_recommendations

        except Exception as e:
            logger.error(f"Error getting AI recommendations: {e}")
            return []

    def _get_grade(self, overall_score: float) -> str:
        """Convert numerical score to letter grade"""
        if overall_score >= 90:
            return "A"
        elif overall_score >= 80:
            return "B"
        elif overall_score >= 70:
            return "C"
        elif overall_score >= 60:
            return "D"
        else:
            return "F"

    async def _store_analysis(self, analysis_result: Dict[str, Any]) -> None:
        """Store analysis results in MongoDB"""
        try:
            analysis_result["stored_at"] = datetime.utcnow()
            await self.sop_collection.insert_one(analysis_result)
            logger.info(f"Stored SOP analysis for user {analysis_result['user_id']}")
        except Exception as e:
            logger.error(f"Error storing SOP analysis: {e}")

    async def get_user_analyses(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get previous SOP analyses for a user

        Args:
            user_id: User identifier
            limit: Maximum number of results

        Returns:
            List of previous analyses
        """
        try:
            cursor = self.sop_collection.find(
                {"user_id": user_id}
            ).sort("timestamp", -1).limit(limit)

            analyses = await cursor.to_list(length=limit)

            # Convert ObjectId to string for JSON serialization
            for analysis in analyses:
                if "_id" in analysis:
                    analysis["_id"] = str(analysis["_id"])

            return analyses
        except Exception as e:
            logger.error(f"Error fetching user analyses: {e}")
            return []

    async def compare_versions(
        self,
        user_id: str,
        sop_text_1: str,
        sop_text_2: str
    ) -> Dict[str, Any]:
        """
        Compare two versions of an SOP

        Useful for tracking improvements
        """
        try:
            # Analyze both versions
            analysis_1 = await self.analyze_sop(
                sop_text_1,
                user_id,
                compare_with_database=False
            )

            analysis_2 = await self.analyze_sop(
                sop_text_2,
                user_id,
                compare_with_database=False
            )

            # Calculate improvements
            improvements = {
                "overall": analysis_2["scores"]["overall"] - analysis_1["scores"]["overall"],
                "uniqueness": analysis_2["scores"]["uniqueness"] - analysis_1["scores"]["uniqueness"],
                "structure": analysis_2["scores"]["structure"] - analysis_1["scores"]["structure"],
                "specificity": analysis_2["scores"]["specificity"] - analysis_1["scores"]["specificity"],
                "tone": analysis_2["scores"]["tone"] - analysis_1["scores"]["tone"],
                "program_fit": analysis_2["scores"]["program_fit"] - analysis_1["scores"]["program_fit"]
            }

            return {
                "version_1": analysis_1,
                "version_2": analysis_2,
                "improvements": improvements,
                "overall_change": improvements["overall"],
                "grade_change": f"{analysis_1['grade']} → {analysis_2['grade']}"
            }

        except Exception as e:
            logger.error(f"Error comparing SOP versions: {e}")
            raise

    async def add_custom_cliche(
        self,
        text: str,
        severity: str,
        category: str,
        suggestion: str
    ) -> Dict[str, Any]:
        """
        Add a custom cliché to the database

        Allows expanding the cliché detection system
        """
        try:
            cliche_doc = {
                "text": text.lower(),
                "severity": severity,
                "category": category,
                "suggestion": suggestion,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "custom": True
            }

            result = await self.cliches_collection.insert_one(cliche_doc)

            return {
                "success": True,
                "cliche_id": str(result.inserted_id),
                "message": f"Added custom cliché: {text}"
            }

        except Exception as e:
            logger.error(f"Error adding custom cliché: {e}")
            raise


# Global service instance
sop_analysis_service = SOPAnalysisService()
