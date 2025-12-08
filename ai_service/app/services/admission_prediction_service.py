"""
Admission prediction service using machine learning
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import numpy as np
from collections import defaultdict
import uuid
import pickle
import os

# ML imports
try:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from motor.motor_asyncio import AsyncIOMotorCollection

from app.models.admission import (
    StudentProfile,
    ProgramInfo,
    AdmissionDataPoint,
    AdmissionDecision,
    AdmissionPrediction,
    GapAnalysis,
    ProfileEvaluation,
    MLModelMetadata,
    FeatureVector,
    SchoolCategory,
    TestType,
    BatchPredictionResponse
)
from app.database.mongodb import get_database
from app.config import settings
from app.utils.logger import logger


class AdmissionPredictionService:
    """Service for admission prediction and profile evaluation"""

    def __init__(self):
        """Initialize admission prediction service"""
        if not SKLEARN_AVAILABLE:
            logger.warning("scikit-learn not available. ML features will be limited.")

        self.model = None
        self.scaler = None
        self.model_metadata = None
        self.feature_names = []

        # Model storage path
        self.models_dir = os.path.join(settings.upload_dir, "ml_models")
        os.makedirs(self.models_dir, exist_ok=True)

        logger.info("Admission prediction service initialized")

    def _get_admission_data_collection(self) -> AsyncIOMotorCollection:
        """Get admission data collection"""
        db = get_database()
        return db["admission_data"]

    def _get_evaluations_collection(self) -> AsyncIOMotorCollection:
        """Get evaluations collection"""
        db = get_database()
        return db["profile_evaluations"]

    def _get_models_collection(self) -> AsyncIOMotorCollection:
        """Get ML models metadata collection"""
        db = get_database()
        return db["ml_models"]

    def _normalize_gpa(self, gpa: float, scale: float = 4.0) -> float:
        """Normalize GPA to 0-1 scale"""
        return gpa / scale

    def _calculate_test_percentile(self, test_type: TestType, score: float) -> float:
        """
        Calculate approximate percentile for test scores
        Based on typical score distributions
        """
        percentile_maps = {
            TestType.GRE: {
                # GRE total score percentiles (approximate)
                340: 99, 335: 95, 330: 90, 325: 80, 320: 70, 315: 60, 310: 50,
                305: 40, 300: 30, 295: 20, 290: 10
            },
            TestType.GMAT: {
                # GMAT score percentiles (approximate)
                760: 99, 740: 95, 720: 90, 700: 80, 680: 70, 660: 60, 640: 50,
                620: 40, 600: 30, 580: 20, 560: 10
            },
            TestType.TOEFL: {
                # TOEFL score percentiles (approximate)
                118: 99, 115: 95, 110: 90, 105: 80, 100: 70, 95: 60, 90: 50,
                85: 40, 80: 30, 75: 20, 70: 10
            },
            TestType.IELTS: {
                # IELTS band percentiles (approximate)
                9.0: 99, 8.5: 95, 8.0: 90, 7.5: 80, 7.0: 70, 6.5: 60, 6.0: 50,
                5.5: 40, 5.0: 30, 4.5: 20, 4.0: 10
            }
        }

        percentile_map = percentile_maps.get(test_type, {})
        if not percentile_map:
            return 50.0  # Default to 50th percentile if no map

        # Find closest score in map
        sorted_scores = sorted(percentile_map.keys(), reverse=True)
        for threshold_score in sorted_scores:
            if score >= threshold_score:
                return float(percentile_map[threshold_score])

        return 10.0  # Below all thresholds

    def _calculate_university_prestige_score(self, ranking: Optional[int]) -> float:
        """
        Calculate prestige score based on university ranking
        Returns score from 0-1
        """
        if not ranking:
            return 0.5  # Default for unranked universities

        # Logarithmic scale: top 10 = 1.0, top 100 = 0.7, top 500 = 0.4
        if ranking <= 10:
            return 1.0
        elif ranking <= 50:
            return 0.9
        elif ranking <= 100:
            return 0.8
        elif ranking <= 200:
            return 0.7
        elif ranking <= 500:
            return 0.5
        else:
            return 0.3

    def _calculate_research_score(self, profile: StudentProfile) -> float:
        """
        Calculate composite research strength score
        Returns score from 0-1
        """
        # Weights for different research activities
        publications_score = min(profile.research_publications * 0.2, 1.0)
        conference_score = min(profile.conference_papers * 0.15, 0.5)
        patents_score = min(profile.patents * 0.25, 0.5)

        total = publications_score + conference_score + patents_score
        return min(total, 1.0)

    def _calculate_professional_score(self, profile: StudentProfile) -> float:
        """
        Calculate composite professional experience score
        Returns score from 0-1
        """
        # Normalize work experience (5 years = 1.0)
        work_exp_score = min(profile.work_experience_months / 60, 1.0)
        relevant_exp_score = min(profile.relevant_work_experience_months / 48, 1.0)
        internship_score = min(profile.internships_count * 0.2, 0.4)

        # Weighted average
        total = (work_exp_score * 0.3 + relevant_exp_score * 0.5 + internship_score * 0.2)
        return min(total, 1.0)

    def _calculate_extracurricular_score(self, profile: StudentProfile) -> float:
        """
        Calculate composite extracurricular activities score
        Returns score from 0-1
        """
        leadership_score = min(profile.leadership_positions * 0.15, 0.4)
        awards_score = min(profile.academic_awards * 0.15, 0.3)
        certifications_score = min(profile.professional_certifications * 0.1, 0.3)
        volunteer_score = min(profile.volunteer_hours / 200, 0.3)

        total = leadership_score + awards_score + certifications_score + volunteer_score
        return min(total, 1.0)

    def _calculate_program_competitiveness(self, program: ProgramInfo) -> float:
        """
        Calculate program competitiveness score
        Returns score from 0-1
        """
        # Start with acceptance rate (inverted - lower acceptance = higher competitiveness)
        if program.acceptance_rate:
            comp_score = 1.0 - program.acceptance_rate
        else:
            comp_score = 0.5  # Default if unknown

        # Adjust for university ranking
        if program.university_ranking:
            ranking_factor = self._calculate_university_prestige_score(program.university_ranking)
            comp_score = comp_score * 0.7 + ranking_factor * 0.3

        return comp_score

    def _extract_features(
        self,
        profile: StudentProfile,
        program: ProgramInfo
    ) -> Tuple[FeatureVector, np.ndarray]:
        """
        Extract and engineer features from profile and program
        Returns feature vector and numpy array for ML model
        """
        # Extract test scores
        gre_verbal = gre_quant = gmat_score = english_score = None

        for test in profile.test_scores:
            if test.test_type == TestType.GRE:
                if test.verbal_score:
                    gre_verbal = self._calculate_test_percentile(TestType.GRE, test.verbal_score * 2)
                if test.quantitative_score:
                    gre_quant = self._calculate_test_percentile(TestType.GRE, test.quantitative_score * 2)
            elif test.test_type == TestType.GMAT and test.total_score:
                gmat_score = self._calculate_test_percentile(TestType.GMAT, test.total_score)
            elif test.test_type in [TestType.TOEFL, TestType.IELTS] and test.total_score:
                english_score = self._calculate_test_percentile(test.test_type, test.total_score)

        # Calculate composite scores
        research_score = self._calculate_research_score(profile)
        professional_score = self._calculate_professional_score(profile)
        extracurricular_score = self._calculate_extracurricular_score(profile)

        # Institutional factors
        undergrad_prestige = self._calculate_university_prestige_score(
            profile.undergraduate_university_ranking
        )
        program_competitiveness = self._calculate_program_competitiveness(program)

        # GPA normalized
        gpa_normalized = self._normalize_gpa(profile.gpa, profile.gpa_scale)

        # Relative positioning
        gpa_vs_avg = 0.0
        test_vs_avg = 0.0

        if program.average_gpa:
            gpa_vs_avg = profile.gpa - program.average_gpa

        if gre_quant and program.gre_quant_avg:
            # Approximate comparison
            test_vs_avg = (gre_quant - self._calculate_test_percentile(TestType.GRE, program.gre_quant_avg * 2)) / 100

        # Create feature vector object
        feature_vector = FeatureVector(
            gpa_normalized=gpa_normalized,
            gre_verbal_percentile=gre_verbal,
            gre_quant_percentile=gre_quant,
            gmat_percentile=gmat_score,
            english_proficiency_score=english_score if english_score else 75.0,  # Default
            research_score=research_score,
            professional_score=professional_score,
            extracurricular_score=extracurricular_score,
            undergrad_prestige_score=undergrad_prestige,
            program_competitiveness_score=program_competitiveness,
            gpa_vs_avg=gpa_vs_avg,
            test_score_vs_avg=test_vs_avg
        )

        # Create numpy array for ML model
        # Feature order matters - keep consistent
        feature_array = np.array([
            gpa_normalized,
            gre_verbal if gre_verbal else 50.0,
            gre_quant if gre_quant else 50.0,
            gmat_score if gmat_score else 50.0,
            english_score if english_score else 75.0,
            research_score,
            professional_score,
            extracurricular_score,
            undergrad_prestige,
            program_competitiveness,
            gpa_vs_avg,
            test_vs_avg,
        ])

        return feature_vector, feature_array

    def _identify_strengths_weaknesses(
        self,
        feature_vector: FeatureVector,
        feature_importance: Optional[Dict[str, float]] = None
    ) -> Tuple[List[str], List[str]]:
        """Identify profile strengths and weaknesses"""
        strengths = []
        weaknesses = []

        # GPA analysis
        if feature_vector.gpa_normalized >= 0.9:
            strengths.append(f"Excellent GPA ({feature_vector.gpa_normalized * 4:.2f}/4.0)")
        elif feature_vector.gpa_normalized < 0.75:
            weaknesses.append(f"GPA below typical admitted students ({feature_vector.gpa_normalized * 4:.2f}/4.0)")

        # Test scores
        if feature_vector.gre_quant_percentile and feature_vector.gre_quant_percentile >= 80:
            strengths.append(f"Strong GRE Quantitative (top {100 - feature_vector.gre_quant_percentile:.0f}%)")
        elif feature_vector.gre_quant_percentile and feature_vector.gre_quant_percentile < 50:
            weaknesses.append("GRE Quantitative below average")

        if feature_vector.gre_verbal_percentile and feature_vector.gre_verbal_percentile >= 80:
            strengths.append(f"Strong GRE Verbal (top {100 - feature_vector.gre_verbal_percentile:.0f}%)")
        elif feature_vector.gre_verbal_percentile and feature_vector.gre_verbal_percentile < 50:
            weaknesses.append("GRE Verbal below average")

        # Research
        if feature_vector.research_score >= 0.7:
            strengths.append("Strong research background with publications")
        elif feature_vector.research_score < 0.2:
            weaknesses.append("Limited research experience")

        # Professional experience
        if feature_vector.professional_score >= 0.7:
            strengths.append("Significant professional experience")
        elif feature_vector.professional_score < 0.3:
            weaknesses.append("Limited professional experience")

        # Extracurricular
        if feature_vector.extracurricular_score >= 0.6:
            strengths.append("Strong extracurricular profile")
        elif feature_vector.extracurricular_score < 0.2:
            weaknesses.append("Limited extracurricular activities")

        # Undergraduate institution
        if feature_vector.undergrad_prestige_score >= 0.8:
            strengths.append("Prestigious undergraduate institution")

        return strengths, weaknesses

    def _generate_recommendations(
        self,
        probability: float,
        weaknesses: List[str],
        program: ProgramInfo
    ) -> Tuple[str, List[str]]:
        """Generate recommendations based on prediction"""
        suggestions = []

        # Main recommendation
        if probability >= 0.75:
            recommendation = (
                f"You have a strong chance of admission to {program.university_name}. "
                "Continue highlighting your strengths in your application essays and interviews."
            )
        elif probability >= 0.50:
            recommendation = (
                f"You have a moderate chance of admission to {program.university_name}. "
                "Focus on strengthening weak areas and crafting compelling application materials."
            )
        elif probability >= 0.25:
            recommendation = (
                f"Admission to {program.university_name} is competitive for your profile. "
                "Consider this as a reach school and strengthen your overall application package."
            )
        else:
            recommendation = (
                f"Admission to {program.university_name} is highly competitive for your profile. "
                "Consider applying, but also include target and safety schools in your list."
            )

        # Specific improvement suggestions based on weaknesses
        for weakness in weaknesses:
            if "GPA" in weakness:
                suggestions.append("Consider retaking key courses to improve GPA or explain circumstances in personal statement")
            elif "GRE" in weakness or "test" in weakness.lower():
                suggestions.append("Invest time in standardized test preparation to improve scores")
            elif "research" in weakness.lower():
                suggestions.append("Seek research opportunities, publish papers, or participate in conferences")
            elif "professional" in weakness.lower():
                suggestions.append("Gain relevant work experience or internships in your field")
            elif "extracurricular" in weakness.lower():
                suggestions.append("Engage in leadership roles, volunteer work, or relevant projects")

        # General suggestions
        suggestions.append("Secure strong letters of recommendation from professors or supervisors who know you well")
        suggestions.append("Craft a compelling statement of purpose that highlights your unique story and fit for the program")

        if program.is_stem:
            suggestions.append("Highlight technical projects, coding skills, and domain-specific achievements")

        return recommendation, suggestions

    async def predict_admission_probability(
        self,
        profile: StudentProfile,
        program: ProgramInfo,
        include_gap_analysis: bool = True
    ) -> AdmissionPrediction:
        """
        Predict admission probability for a given profile and program

        Args:
            profile: Student profile
            program: Target program
            include_gap_analysis: Whether to include detailed gap analysis

        Returns:
            Admission prediction with probability and recommendations
        """
        # Extract features
        feature_vector, feature_array = self._extract_features(profile, program)

        # Calculate base probability using heuristic if no model trained
        if self.model is None or not SKLEARN_AVAILABLE:
            probability = await self._heuristic_probability(feature_vector)
            confidence_lower = max(0.0, probability - 0.15)
            confidence_upper = min(1.0, probability + 0.15)
            feature_importance = {}
        else:
            # Use trained ML model
            probability, confidence_lower, confidence_upper, feature_importance = await self._ml_probability(
                feature_array
            )

        # Determine category
        if probability < 0.25:
            category = SchoolCategory.REACH
        elif probability <= 0.75:
            category = SchoolCategory.TARGET
        else:
            category = SchoolCategory.SAFETY

        # Identify strengths and weaknesses
        strengths, weaknesses = self._identify_strengths_weaknesses(feature_vector, feature_importance)

        # Generate recommendations
        recommendation, suggestions = self._generate_recommendations(probability, weaknesses, program)

        # Create prediction object
        prediction = AdmissionPrediction(
            probability=probability,
            probability_percentage=probability * 100,
            confidence_interval_lower=confidence_lower,
            confidence_interval_upper=confidence_upper,
            category=category,
            strengths=strengths,
            weaknesses=weaknesses,
            key_factors=feature_importance,
            recommendation=recommendation,
            suggested_improvements=suggestions
        )

        return prediction

    async def _heuristic_probability(self, features: FeatureVector) -> float:
        """
        Calculate admission probability using heuristic rules
        Used when ML model is not available
        """
        # Weighted scoring
        weights = {
            'gpa': 0.25,
            'test_scores': 0.20,
            'research': 0.15,
            'professional': 0.10,
            'extracurricular': 0.10,
            'prestige': 0.10,
            'competitiveness': -0.10  # Negative weight (harder programs reduce probability)
        }

        # Calculate weighted score
        score = (
            features.gpa_normalized * weights['gpa'] +
            ((features.gre_verbal_percentile or 50) / 100) * weights['test_scores'] * 0.5 +
            ((features.gre_quant_percentile or 50) / 100) * weights['test_scores'] * 0.5 +
            features.research_score * weights['research'] +
            features.professional_score * weights['professional'] +
            features.extracurricular_score * weights['extracurricular'] +
            features.undergrad_prestige_score * weights['prestige']
        )

        # Adjust for program competitiveness
        competitiveness_penalty = features.program_competitiveness_score * abs(weights['competitiveness'])
        score = score - competitiveness_penalty

        # Normalize to 0-1 range
        probability = np.clip(score, 0.0, 1.0)

        return float(probability)

    async def _ml_probability(
        self,
        features: np.ndarray
    ) -> Tuple[float, float, float, Dict[str, float]]:
        """
        Calculate admission probability using trained ML model

        Returns:
            Tuple of (probability, confidence_lower, confidence_upper, feature_importance)
        """
        # Reshape for single prediction
        features = features.reshape(1, -1)

        # Scale features
        if self.scaler:
            features = self.scaler.transform(features)

        # Predict probability
        probability = self.model.predict_proba(features)[0][1]  # Probability of class 1 (admitted)

        # Calculate confidence interval (simplified)
        confidence_interval = 0.1  # 10% confidence interval
        confidence_lower = max(0.0, probability - confidence_interval)
        confidence_upper = min(1.0, probability + confidence_interval)

        # Get feature importance
        feature_importance = {}
        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
            for i, importance in enumerate(importances):
                if i < len(self.feature_names):
                    feature_importance[self.feature_names[i]] = float(importance)

        return float(probability), confidence_lower, confidence_upper, feature_importance

    async def perform_gap_analysis(
        self,
        profile: StudentProfile,
        program: ProgramInfo
    ) -> GapAnalysis:
        """
        Perform gap analysis comparing profile to average admitted student

        Args:
            profile: Student profile
            program: Target program

        Returns:
            Gap analysis with specific gaps and recommendations
        """
        # Calculate gaps
        gpa_gap = 0.0
        if program.average_gpa:
            gpa_gap = profile.gpa - program.average_gpa

        # Test score gap (use GRE quant as proxy if available)
        test_score_gap = None
        for test in profile.test_scores:
            if test.test_type == TestType.GRE and test.quantitative_score and program.gre_quant_avg:
                test_score_gap = test.quantitative_score - program.gre_quant_avg

        # Research gap (compare to typical - assume 2 publications average for competitive programs)
        typical_research = 2 if program.university_ranking and program.university_ranking <= 100 else 1
        research_gap = profile.research_publications - typical_research

        # Work experience gap (assume 24 months average for master's programs)
        typical_experience = 24
        work_experience_gap = profile.work_experience_months - typical_experience

        # Calculate percentiles
        gpa_percentile = self._calculate_percentile(profile.gpa, 3.8, 0.2)  # Assume avg 3.8, std 0.2
        test_percentile = None
        if test_score_gap is not None:
            test_percentile = self._calculate_percentile(
                profile.test_scores[0].quantitative_score,
                program.gre_quant_avg if program.gre_quant_avg else 165,
                3.0
            )

        # Overall competitiveness (composite)
        feature_vector, _ = self._extract_features(profile, program)
        overall_competitiveness = (
            feature_vector.gpa_normalized * 0.3 +
            feature_vector.research_score * 0.2 +
            feature_vector.professional_score * 0.2 +
            ((feature_vector.gre_quant_percentile or 50) / 100) * 0.3
        )

        # Identify gaps to address
        gaps_to_address = []

        if gpa_gap < -0.2:
            gaps_to_address.append({
                "area": "GPA",
                "current": profile.gpa,
                "target": program.average_gpa,
                "gap": gpa_gap,
                "priority": "high",
                "action": "Highlight strong recent academic performance or explain circumstances"
            })

        if test_score_gap and test_score_gap < -5:
            gaps_to_address.append({
                "area": "Test Scores",
                "gap": test_score_gap,
                "priority": "high",
                "action": "Consider retaking GRE/GMAT to improve scores"
            })

        if research_gap < 0:
            gaps_to_address.append({
                "area": "Research Experience",
                "current": profile.research_publications,
                "target": typical_research,
                "priority": "medium",
                "action": "Pursue research opportunities and aim for publications"
            })

        if work_experience_gap < -12:
            gaps_to_address.append({
                "area": "Work Experience",
                "current_months": profile.work_experience_months,
                "target_months": typical_experience,
                "priority": "medium",
                "action": "Gain relevant work experience or internships"
            })

        return GapAnalysis(
            gpa_gap=gpa_gap,
            test_score_gap=test_score_gap,
            research_gap=float(research_gap),
            work_experience_gap=float(work_experience_gap),
            gpa_percentile=gpa_percentile,
            test_percentile=test_percentile,
            overall_competitiveness=overall_competitiveness,
            gaps_to_address=gaps_to_address
        )

    def _calculate_percentile(self, value: float, mean: float, std: float) -> float:
        """Calculate percentile using normal distribution assumption"""
        from scipy import stats
        try:
            z_score = (value - mean) / std
            percentile = stats.norm.cdf(z_score) * 100
            return float(np.clip(percentile, 0.0, 100.0))
        except:
            # Fallback if scipy not available
            if value >= mean + std:
                return 84.0
            elif value >= mean:
                return 65.0
            elif value >= mean - std:
                return 35.0
            else:
                return 16.0

    async def evaluate_profile(
        self,
        user_id: str,
        profile: StudentProfile,
        program: ProgramInfo,
        include_gap_analysis: bool = True,
        include_similar_profiles: bool = True
    ) -> ProfileEvaluation:
        """
        Complete profile evaluation with prediction and gap analysis

        Args:
            user_id: User identifier
            profile: Student profile
            program: Target program
            include_gap_analysis: Include gap analysis
            include_similar_profiles: Include similar profiles

        Returns:
            Complete profile evaluation
        """
        evaluation_id = f"eval_{uuid.uuid4().hex[:12]}"

        # Generate prediction
        prediction = await self.predict_admission_probability(profile, program, include_gap_analysis)

        # Perform gap analysis
        gap_analysis = None
        if include_gap_analysis:
            gap_analysis = await self.perform_gap_analysis(profile, program)

        # Find similar profiles (if requested)
        similar_admits = []
        similar_rejects = []
        if include_similar_profiles:
            similar_admits, similar_rejects = await self._find_similar_profiles(profile, program)

        # Create evaluation
        evaluation = ProfileEvaluation(
            evaluation_id=evaluation_id,
            user_id=user_id,
            student_profile=profile,
            target_program=program,
            prediction=prediction,
            gap_analysis=gap_analysis,
            similar_admits=similar_admits,
            similar_rejects=similar_rejects,
            model_version=self.model_metadata.version if self.model_metadata else "heuristic_v1.0"
        )

        # Store evaluation
        await self._store_evaluation(evaluation)

        return evaluation

    async def evaluate_multiple_programs(
        self,
        user_id: str,
        profile: StudentProfile,
        programs: List[ProgramInfo]
    ) -> BatchPredictionResponse:
        """
        Evaluate student profile against multiple programs

        Args:
            user_id: User identifier
            profile: Student profile
            programs: List of target programs

        Returns:
            Batch prediction response with categorized schools
        """
        evaluations = []
        reach_schools = []
        target_schools = []
        safety_schools = []

        for program in programs:
            evaluation = await self.evaluate_profile(
                user_id=user_id,
                profile=profile,
                program=program,
                include_gap_analysis=False,  # Skip for batch to improve performance
                include_similar_profiles=False
            )
            evaluations.append(evaluation)

            # Categorize schools
            school_name = f"{program.university_name} - {program.program_name}"
            if evaluation.prediction.category == SchoolCategory.REACH:
                reach_schools.append(school_name)
            elif evaluation.prediction.category == SchoolCategory.TARGET:
                target_schools.append(school_name)
            else:
                safety_schools.append(school_name)

        # Calculate summary statistics
        probabilities = [e.prediction.probability for e in evaluations]
        avg_prob = np.mean(probabilities)
        highest_prob = np.max(probabilities)
        lowest_prob = np.min(probabilities)

        return BatchPredictionResponse(
            evaluations=evaluations,
            reach_schools=reach_schools,
            target_schools=target_schools,
            safety_schools=safety_schools,
            average_probability=float(avg_prob),
            highest_probability=float(highest_prob),
            lowest_probability=float(lowest_prob)
        )

    async def _find_similar_profiles(
        self,
        profile: StudentProfile,
        program: ProgramInfo,
        limit: int = 5
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Find similar profiles from historical data"""
        collection = self._get_admission_data_collection()

        # Query for similar profiles (simplified - in production use vector similarity)
        gpa_range = 0.3
        query = {
            "program.university_name": program.university_name,
            "program.program_name": program.program_name,
            "profile.gpa": {
                "$gte": profile.gpa - gpa_range,
                "$lte": profile.gpa + gpa_range
            }
        }

        # Find admits
        admits_cursor = collection.find({
            **query,
            "decision": AdmissionDecision.ACCEPTED.value
        }).limit(limit)

        # Find rejects
        rejects_cursor = collection.find({
            **query,
            "decision": AdmissionDecision.REJECTED.value
        }).limit(limit)

        similar_admits = []
        async for doc in admits_cursor:
            similar_admits.append({
                "gpa": doc.get("profile", {}).get("gpa"),
                "test_scores": doc.get("profile", {}).get("test_scores", []),
                "research_publications": doc.get("profile", {}).get("research_publications", 0),
                "decision": doc.get("decision"),
                "year": doc.get("application_year")
            })

        similar_rejects = []
        async for doc in rejects_cursor:
            similar_rejects.append({
                "gpa": doc.get("profile", {}).get("gpa"),
                "test_scores": doc.get("profile", {}).get("test_scores", []),
                "research_publications": doc.get("profile", {}).get("research_publications", 0),
                "decision": doc.get("decision"),
                "year": doc.get("application_year")
            })

        return similar_admits, similar_rejects

    async def _store_evaluation(self, evaluation: ProfileEvaluation) -> None:
        """Store evaluation in database"""
        collection = self._get_evaluations_collection()

        doc = evaluation.model_dump()
        doc["_id"] = evaluation.evaluation_id

        await collection.insert_one(doc)
        logger.info(f"Stored evaluation: {evaluation.evaluation_id}")

    async def add_admission_data(
        self,
        user_id: str,
        data_point: AdmissionDataPoint
    ) -> str:
        """
        Add historical admission data point

        Args:
            user_id: User contributing data
            data_point: Admission data point

        Returns:
            Data point ID
        """
        collection = self._get_admission_data_collection()

        doc = data_point.model_dump()
        doc["_id"] = data_point.data_point_id
        doc["contributing_user_id"] = user_id

        await collection.insert_one(doc)
        logger.info(f"Added admission data point: {data_point.data_point_id}")

        return data_point.data_point_id

    async def train_model(
        self,
        model_type: str = "random_forest",
        min_samples: int = 100
    ) -> MLModelMetadata:
        """
        Train ML model on historical admission data

        Args:
            model_type: Type of model (random_forest, gradient_boosting, logistic_regression)
            min_samples: Minimum samples required for training

        Returns:
            Model metadata
        """
        if not SKLEARN_AVAILABLE:
            raise RuntimeError("scikit-learn not installed. Cannot train model.")

        collection = self._get_admission_data_collection()

        # Fetch all admission data
        cursor = collection.find({"verified": True})  # Only use verified data
        data_points = []
        async for doc in cursor:
            data_points.append(AdmissionDataPoint(**doc))

        if len(data_points) < min_samples:
            raise ValueError(f"Insufficient data for training. Need at least {min_samples} samples, got {len(data_points)}")

        logger.info(f"Training model on {len(data_points)} data points")

        # Prepare training data
        X = []
        y = []

        for dp in data_points:
            _, features = self._extract_features(dp.profile, dp.program)
            X.append(features)
            # Binary classification: admitted (1) vs rejected (0)
            y.append(1 if dp.decision == AdmissionDecision.ACCEPTED else 0)

        X = np.array(X)
        y = np.array(y)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model
        if model_type == "random_forest":
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        elif model_type == "gradient_boosting":
            self.model = GradientBoostingClassifier(n_estimators=100, random_state=42)
        elif model_type == "logistic_regression":
            self.model = LogisticRegression(random_state=42)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

        self.model.fit(X_train_scaled, y_train)

        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]

        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        auc_roc = roc_auc_score(y_test, y_pred_proba)

        logger.info(f"Model performance - Accuracy: {accuracy:.3f}, AUC-ROC: {auc_roc:.3f}")

        # Feature names
        self.feature_names = [
            "gpa_normalized", "gre_verbal_percentile", "gre_quant_percentile",
            "gmat_percentile", "english_proficiency", "research_score",
            "professional_score", "extracurricular_score", "undergrad_prestige",
            "program_competitiveness", "gpa_vs_avg", "test_score_vs_avg"
        ]

        # Create model metadata
        model_id = f"model_{uuid.uuid4().hex[:12]}"
        version = f"1.0.{len(data_points)}"  # Version includes training sample count

        metadata = MLModelMetadata(
            model_id=model_id,
            version=version,
            model_type=model_type,
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            auc_roc=auc_roc,
            training_samples=len(data_points),
            features_used=self.feature_names,
            hyperparameters=self.model.get_params() if hasattr(self.model, 'get_params') else {},
            is_active=True
        )

        # Save model to disk
        model_path = os.path.join(self.models_dir, f"{model_id}.pkl")
        scaler_path = os.path.join(self.models_dir, f"{model_id}_scaler.pkl")

        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)

        logger.info(f"Model saved to {model_path}")

        # Store metadata in database
        models_collection = self._get_models_collection()
        doc = metadata.model_dump()
        doc["_id"] = model_id
        doc["model_path"] = model_path
        doc["scaler_path"] = scaler_path

        # Deactivate old models
        await models_collection.update_many(
            {"is_active": True},
            {"$set": {"is_active": False}}
        )

        # Insert new model
        await models_collection.insert_one(doc)

        self.model_metadata = metadata

        return metadata

    async def load_latest_model(self) -> Optional[MLModelMetadata]:
        """Load the latest trained model from database"""
        if not SKLEARN_AVAILABLE:
            logger.warning("scikit-learn not available. Using heuristic predictions.")
            return None

        models_collection = self._get_models_collection()

        # Find active model
        doc = await models_collection.find_one(
            {"is_active": True, "is_deprecated": False},
            sort=[("training_date", -1)]
        )

        if not doc:
            logger.info("No trained model found. Using heuristic predictions.")
            return None

        # Load model from disk
        model_path = doc.get("model_path")
        scaler_path = doc.get("scaler_path")

        if not model_path or not os.path.exists(model_path):
            logger.error(f"Model file not found: {model_path}")
            return None

        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)

        if scaler_path and os.path.exists(scaler_path):
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)

        self.model_metadata = MLModelMetadata(**doc)
        self.feature_names = doc.get("features_used", [])

        logger.info(f"Loaded model {self.model_metadata.model_id} (version {self.model_metadata.version})")

        return self.model_metadata


# Global instance
admission_service = AdmissionPredictionService()
