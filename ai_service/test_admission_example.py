"""
Example test script for admission prediction service
Run this to test the admission prediction infrastructure
"""

import asyncio
import json
from datetime import datetime

# Test data
sample_student_profile = {
    "gpa": 3.8,
    "gpa_scale": 4.0,
    "undergraduate_major": "Computer Science",
    "undergraduate_university": "State University",
    "undergraduate_university_ranking": 150,
    "test_scores": [
        {
            "test_type": "gre",
            "total_score": 325,
            "verbal_score": 160,
            "quantitative_score": 165,
            "analytical_score": 4.5,
        },
        {
            "test_type": "toefl",
            "total_score": 105,
        }
    ],
    "research_publications": 2,
    "conference_papers": 1,
    "patents": 0,
    "work_experience_months": 24,
    "relevant_work_experience_months": 18,
    "internships_count": 3,
    "academic_awards": 2,
    "professional_certifications": 1,
    "leadership_positions": 2,
    "volunteer_hours": 50,
}

sample_program_stanford = {
    "university_name": "Stanford University",
    "university_ranking": 3,
    "program_name": "Computer Science",
    "degree_level": "masters",
    "department": "Computer Science",
    "acceptance_rate": 0.05,
    "average_gpa": 3.9,
    "gre_verbal_avg": 163,
    "gre_quant_avg": 168,
    "is_stem": True,
    "has_funding": True,
}

sample_program_state = {
    "university_name": "State University",
    "university_ranking": 200,
    "program_name": "Computer Science",
    "degree_level": "masters",
    "department": "Computer Science",
    "acceptance_rate": 0.35,
    "average_gpa": 3.5,
    "gre_quant_avg": 160,
    "is_stem": True,
    "has_funding": False,
}

sample_program_berkeley = {
    "university_name": "UC Berkeley",
    "university_ranking": 4,
    "program_name": "Computer Science",
    "degree_level": "masters",
    "department": "EECS",
    "acceptance_rate": 0.08,
    "average_gpa": 3.85,
    "gre_quant_avg": 167,
    "is_stem": True,
    "has_funding": True,
}


async def test_single_prediction():
    """Test single program prediction"""
    from app.services.admission_prediction_service import admission_service
    from app.models.admission import StudentProfile, ProgramInfo

    print("\n" + "="*80)
    print("TEST 1: Single Program Prediction")
    print("="*80)

    profile = StudentProfile(**sample_student_profile)
    program = ProgramInfo(**sample_program_stanford)

    print(f"\nStudent Profile:")
    print(f"  GPA: {profile.gpa}")
    print(f"  GRE: V{sample_student_profile['test_scores'][0]['verbal_score']} "
          f"Q{sample_student_profile['test_scores'][0]['quantitative_score']}")
    print(f"  Research Publications: {profile.research_publications}")
    print(f"  Work Experience: {profile.work_experience_months} months")

    print(f"\nTarget Program:")
    print(f"  {program.university_name} - {program.program_name}")
    print(f"  Ranking: #{program.university_ranking}")
    print(f"  Acceptance Rate: {program.acceptance_rate*100:.1f}%")

    # Generate prediction
    prediction = await admission_service.predict_admission_probability(
        profile=profile,
        program=program,
        include_gap_analysis=True
    )

    print(f"\n{'='*80}")
    print(f"PREDICTION RESULTS")
    print(f"{'='*80}")
    print(f"Admission Probability: {prediction.probability_percentage:.1f}%")
    print(f"Confidence Interval: {prediction.confidence_interval_lower*100:.1f}% - "
          f"{prediction.confidence_interval_upper*100:.1f}%")
    print(f"School Category: {prediction.category.value.upper()}")

    print(f"\nStrengths:")
    for strength in prediction.strengths:
        print(f"  ✓ {strength}")

    if prediction.weaknesses:
        print(f"\nWeaknesses:")
        for weakness in prediction.weaknesses:
            print(f"  ✗ {weakness}")

    print(f"\nRecommendation:")
    print(f"  {prediction.recommendation}")

    print(f"\nSuggested Improvements:")
    for i, suggestion in enumerate(prediction.suggested_improvements[:3], 1):
        print(f"  {i}. {suggestion}")

    if prediction.key_factors:
        print(f"\nKey Factors (Feature Importance):")
        for factor, importance in sorted(
            prediction.key_factors.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]:
            print(f"  {factor}: {importance:.3f}")


async def test_batch_prediction():
    """Test batch program prediction"""
    from app.services.admission_prediction_service import admission_service
    from app.models.admission import StudentProfile, ProgramInfo

    print("\n\n" + "="*80)
    print("TEST 2: Batch Program Prediction")
    print("="*80)

    profile = StudentProfile(**sample_student_profile)
    programs = [
        ProgramInfo(**sample_program_stanford),
        ProgramInfo(**sample_program_berkeley),
        ProgramInfo(**sample_program_state),
    ]

    print(f"\nEvaluating {len(programs)} programs...")

    # Generate batch predictions
    response = await admission_service.evaluate_multiple_programs(
        user_id="test_user",
        profile=profile,
        programs=programs
    )

    print(f"\n{'='*80}")
    print(f"BATCH PREDICTION RESULTS")
    print(f"{'='*80}")

    print(f"\nReach Schools (<25% chance):")
    for school in response.reach_schools:
        print(f"  • {school}")

    print(f"\nTarget Schools (25-75% chance):")
    for school in response.target_schools:
        print(f"  • {school}")

    print(f"\nSafety Schools (>75% chance):")
    for school in response.safety_schools:
        print(f"  • {school}")

    print(f"\nSummary Statistics:")
    print(f"  Average Probability: {response.average_probability*100:.1f}%")
    print(f"  Highest Probability: {response.highest_probability*100:.1f}%")
    print(f"  Lowest Probability: {response.lowest_probability*100:.1f}%")

    print(f"\nDetailed Results:")
    for eval in response.evaluations:
        print(f"\n  {eval.target_program.university_name} - {eval.target_program.program_name}")
        print(f"    Probability: {eval.prediction.probability_percentage:.1f}%")
        print(f"    Category: {eval.prediction.category.value}")


async def test_gap_analysis():
    """Test gap analysis"""
    from app.services.admission_prediction_service import admission_service
    from app.models.admission import StudentProfile, ProgramInfo

    print("\n\n" + "="*80)
    print("TEST 3: Gap Analysis")
    print("="*80)

    profile = StudentProfile(**sample_student_profile)
    program = ProgramInfo(**sample_program_stanford)

    # Perform gap analysis
    gap_analysis = await admission_service.perform_gap_analysis(
        profile=profile,
        program=program
    )

    print(f"\n{'='*80}")
    print(f"GAP ANALYSIS RESULTS")
    print(f"{'='*80}")

    print(f"\nComparison to Average Admitted Student:")
    print(f"  GPA Gap: {gap_analysis.gpa_gap:+.2f}")
    if gap_analysis.test_score_gap:
        print(f"  Test Score Gap: {gap_analysis.test_score_gap:+.1f}")
    print(f"  Research Gap: {gap_analysis.research_gap:+.0f} publications")
    print(f"  Work Experience Gap: {gap_analysis.work_experience_gap:+.0f} months")

    print(f"\nPercentile Rankings:")
    print(f"  GPA Percentile: {gap_analysis.gpa_percentile:.1f}th")
    if gap_analysis.test_percentile:
        print(f"  Test Score Percentile: {gap_analysis.test_percentile:.1f}th")

    print(f"\nOverall Competitiveness: {gap_analysis.overall_competitiveness*100:.1f}%")

    if gap_analysis.gaps_to_address:
        print(f"\nPriority Gaps to Address:")
        for i, gap in enumerate(gap_analysis.gaps_to_address, 1):
            print(f"\n  {i}. {gap['area']} (Priority: {gap['priority']})")
            print(f"     Action: {gap['action']}")


async def test_feature_extraction():
    """Test feature extraction"""
    from app.services.admission_prediction_service import admission_service
    from app.models.admission import StudentProfile, ProgramInfo

    print("\n\n" + "="*80)
    print("TEST 4: Feature Extraction")
    print("="*80)

    profile = StudentProfile(**sample_student_profile)
    program = ProgramInfo(**sample_program_stanford)

    # Extract features
    feature_vector, feature_array = admission_service._extract_features(profile, program)

    print(f"\n{'='*80}")
    print(f"EXTRACTED FEATURES")
    print(f"{'='*80}")

    print(f"\nNormalized Features:")
    print(f"  GPA Normalized: {feature_vector.gpa_normalized:.3f}")
    print(f"  GRE Verbal Percentile: {feature_vector.gre_verbal_percentile:.1f}")
    print(f"  GRE Quant Percentile: {feature_vector.gre_quant_percentile:.1f}")
    print(f"  English Proficiency: {feature_vector.english_proficiency_score:.1f}")

    print(f"\nComposite Scores:")
    print(f"  Research Score: {feature_vector.research_score:.3f}")
    print(f"  Professional Score: {feature_vector.professional_score:.3f}")
    print(f"  Extracurricular Score: {feature_vector.extracurricular_score:.3f}")

    print(f"\nInstitutional Factors:")
    print(f"  Undergrad Prestige: {feature_vector.undergrad_prestige_score:.3f}")
    print(f"  Program Competitiveness: {feature_vector.program_competitiveness_score:.3f}")

    print(f"\nRelative Positioning:")
    print(f"  GPA vs Avg: {feature_vector.gpa_vs_avg:+.3f}")
    print(f"  Test Score vs Avg: {feature_vector.test_score_vs_avg:+.3f}")

    print(f"\nFeature Array Shape: {feature_array.shape}")
    print(f"Feature Values: {feature_array}")


async def test_data_contribution():
    """Test admission data contribution"""
    from app.services.admission_prediction_service import admission_service
    from app.models.admission import StudentProfile, ProgramInfo, AdmissionDataPoint, AdmissionDecision
    import uuid

    print("\n\n" + "="*80)
    print("TEST 5: Data Contribution")
    print("="*80)

    profile = StudentProfile(**sample_student_profile)
    program = ProgramInfo(**sample_program_berkeley)

    # Create data point
    data_point = AdmissionDataPoint(
        data_point_id=f"dp_{uuid.uuid4().hex[:12]}",
        user_id="test_user",
        profile=profile,
        program=program,
        decision=AdmissionDecision.ACCEPTED,
        application_year=2024,
        application_cycle="fall",
        scholarship_amount=25000.0,
        assistantship_offered=True,
        verified=False,
        source="test_data"
    )

    print(f"\nData Point:")
    print(f"  ID: {data_point.data_point_id}")
    print(f"  Program: {program.university_name} - {program.program_name}")
    print(f"  Decision: {data_point.decision.value}")
    print(f"  Year: {data_point.application_year}")
    print(f"  Scholarship: ${data_point.scholarship_amount:,.0f}")

    # Note: Actual storage would require MongoDB connection
    print(f"\n✓ Data point created successfully (not stored in test mode)")


async def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("ADMISSION PREDICTION SERVICE - TEST SUITE")
    print("="*80)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Run tests
        await test_single_prediction()
        await test_batch_prediction()
        await test_gap_analysis()
        await test_feature_extraction()
        await test_data_contribution()

        print("\n\n" + "="*80)
        print("ALL TESTS COMPLETED SUCCESSFULLY ✓")
        print("="*80)

    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()

    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    # Run tests
    asyncio.run(main())
