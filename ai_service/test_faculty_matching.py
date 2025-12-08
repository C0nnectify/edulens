#!/usr/bin/env python3
"""
Test script for faculty matching service

This script demonstrates the faculty matching functionality by:
1. Adding sample faculty data
2. Testing semantic matching
3. Testing keyword matching
4. Testing hybrid matching
5. Testing filtering and statistics
"""

import asyncio
import sys
from typing import List

from app.models.faculty import (
    FacultyInfo,
    FacultyMatchRequest,
    FacultyStatus,
    MatchingMode,
)
from app.services.faculty_matching_service import FacultyMatchingService
from app.database.mongodb import connect_to_mongodb, close_mongodb_connection


# Sample faculty data
SAMPLE_FACULTY: List[FacultyInfo] = [
    FacultyInfo(
        faculty_id="mit_cs_001",
        name="Dr. Regina Barzilay",
        email="regina@csail.mit.edu",
        university="MIT",
        department="Computer Science",
        title="Professor",
        research_areas=[
            "Machine Learning for Healthcare",
            "Natural Language Processing",
            "Deep Learning",
            "Drug Discovery",
            "Medical AI"
        ],
        lab_name="Clinical Machine Learning Group",
        lab_website="http://clinicalml.org/",
        personal_website="http://people.csail.mit.edu/regina/",
        accepting_students=FacultyStatus.ACCEPTING,
        publications=[
            "Learning to predict cancer treatment outcomes from patient histories",
            "Deep learning for early diagnosis of Alzheimer's disease",
            "Neural machine translation in clinical contexts"
        ],
        h_index=85,
        citations=32000,
        funding=["NSF", "NIH", "DARPA"],
    ),
    FacultyInfo(
        faculty_id="mit_cs_002",
        name="Dr. Daniela Rus",
        email="rus@csail.mit.edu",
        university="MIT",
        department="Computer Science",
        title="Professor",
        research_areas=[
            "Robotics",
            "Autonomous Systems",
            "Distributed Algorithms",
            "Self-Reconfigurable Robots",
            "Human-Robot Interaction"
        ],
        lab_name="Distributed Robotics Laboratory",
        lab_website="http://groups.csail.mit.edu/drl/",
        personal_website="http://people.csail.mit.edu/rus/",
        accepting_students=FacultyStatus.ACCEPTING,
        publications=[
            "Soft robotic fish for underwater exploration",
            "Coordination algorithms for multi-robot systems",
            "Programming by demonstration for autonomous vehicles"
        ],
        h_index=92,
        citations=45000,
        funding=["NSF", "ONR", "DARPA"],
    ),
    FacultyInfo(
        faculty_id="stanford_cs_001",
        name="Dr. Fei-Fei Li",
        email="feifeili@cs.stanford.edu",
        university="Stanford University",
        department="Computer Science",
        title="Professor",
        research_areas=[
            "Computer Vision",
            "Machine Learning",
            "Deep Learning",
            "Visual Recognition",
            "AI Ethics"
        ],
        lab_name="Stanford Vision and Learning Lab",
        lab_website="http://svl.stanford.edu/",
        personal_website="https://profiles.stanford.edu/fei-fei-li",
        accepting_students=FacultyStatus.ACCEPTING,
        publications=[
            "ImageNet: A large-scale hierarchical image database",
            "Deep learning for visual object recognition",
            "Ethical considerations in computer vision systems"
        ],
        h_index=126,
        citations=180000,
        funding=["NSF", "DARPA", "Google", "Amazon"],
    ),
    FacultyInfo(
        faculty_id="stanford_cs_002",
        name="Dr. Andrew Ng",
        email="ang@cs.stanford.edu",
        university="Stanford University",
        department="Computer Science",
        title="Associate Professor",
        research_areas=[
            "Machine Learning",
            "Deep Learning",
            "Online Education",
            "AI Applications",
            "Reinforcement Learning"
        ],
        lab_name="Stanford AI Lab",
        lab_website="http://ai.stanford.edu/",
        personal_website="https://www.andrewng.org/",
        accepting_students=FacultyStatus.NOT_ACCEPTING,
        publications=[
            "Deep learning for speech recognition",
            "Autonomous helicopter flight using reinforcement learning",
            "Democratizing AI education through online platforms"
        ],
        h_index=162,
        citations=250000,
        funding=["NSF", "DARPA"],
    ),
    FacultyInfo(
        faculty_id="cmu_cs_001",
        name="Dr. Manuela Veloso",
        email="veloso@cs.cmu.edu",
        university="Carnegie Mellon University",
        department="Computer Science",
        title="Professor",
        research_areas=[
            "Robotics",
            "Multi-Agent Systems",
            "Machine Learning",
            "Planning",
            "Robot Learning"
        ],
        lab_name="CORAL Lab",
        lab_website="http://coral.cs.cmu.edu/",
        personal_website="http://www.cs.cmu.edu/~mmv/",
        accepting_students=FacultyStatus.ACCEPTING,
        publications=[
            "CoBots: Collaborative robots in office environments",
            "Transfer learning in robot soccer",
            "Multi-robot coordination strategies"
        ],
        h_index=95,
        citations=42000,
        funding=["NSF", "ONR"],
    ),
    FacultyInfo(
        faculty_id="berkeley_ee_001",
        name="Dr. Claire Tomlin",
        email="tomlin@berkeley.edu",
        university="UC Berkeley",
        department="Electrical Engineering",
        title="Professor",
        research_areas=[
            "Hybrid Systems",
            "Autonomous Systems",
            "Control Theory",
            "Safety-Critical Systems",
            "Aerial Robotics"
        ],
        lab_name="Hybrid Systems Laboratory",
        lab_website="http://hybrid.eecs.berkeley.edu/",
        personal_website="https://ptolemy.berkeley.edu/~tomlin/",
        accepting_students=FacultyStatus.ACCEPTING,
        publications=[
            "Reachability analysis for safety verification of autonomous vehicles",
            "Collision avoidance for multi-UAV systems",
            "Learning-based control for safety-critical systems"
        ],
        h_index=78,
        citations=28000,
        funding=["NSF", "AFOSR", "NASA"],
    ),
]


async def setup_sample_data(service: FacultyMatchingService):
    """Add sample faculty data to database"""
    print("\n" + "=" * 80)
    print("SETTING UP SAMPLE FACULTY DATA")
    print("=" * 80)

    count = await service.bulk_add_faculty(SAMPLE_FACULTY, generate_embeddings=True)
    print(f"✓ Added {count} faculty members")

    # Create indexes
    await service.create_indexes()
    print("✓ Created database indexes")


async def test_semantic_matching(service: FacultyMatchingService):
    """Test semantic matching"""
    print("\n" + "=" * 80)
    print("TEST 1: SEMANTIC MATCHING")
    print("=" * 80)

    query = "I am interested in applying machine learning to healthcare problems, particularly for early disease diagnosis and drug discovery."

    request = FacultyMatchRequest(
        research_interests=query,
        mode=MatchingMode.SEMANTIC,
        top_k=5,
        include_publications=True,
        semantic_weight=0.7,
        keyword_weight=0.3,
    )

    print(f"\nQuery: {query}")
    print(f"\nMode: {request.mode.value}")

    response = await service.match_faculty(request)

    print(f"\n✓ Found {response.total_matches} matches in {response.processing_time_ms:.2f}ms")
    print("\nTop Matches:")
    print("-" * 80)

    for i, match in enumerate(response.matches[:5], 1):
        print(f"\n{i}. {match.faculty.name}")
        print(f"   University: {match.faculty.university}")
        print(f"   Department: {match.faculty.department}")
        print(f"   Match Score: {match.match_score:.2f}/100")
        print(f"   Similarity: {match.similarity_score:.4f}")
        print(f"   Research Areas: {', '.join(match.faculty.research_areas[:3])}")
        print(f"   Reasoning: {match.reasoning}")
        if match.matched_keywords:
            print(f"   Matched Keywords: {', '.join(match.matched_keywords)}")


async def test_keyword_matching(service: FacultyMatchingService):
    """Test keyword matching"""
    print("\n" + "=" * 80)
    print("TEST 2: KEYWORD MATCHING")
    print("=" * 80)

    query = "robotics autonomous systems multi-robot coordination"

    request = FacultyMatchRequest(
        research_interests=query,
        mode=MatchingMode.KEYWORD,
        top_k=5,
        include_publications=True,
    )

    print(f"\nQuery: {query}")
    print(f"\nMode: {request.mode.value}")

    response = await service.match_faculty(request)

    print(f"\n✓ Found {response.total_matches} matches in {response.processing_time_ms:.2f}ms")
    print("\nTop Matches:")
    print("-" * 80)

    for i, match in enumerate(response.matches[:5], 1):
        print(f"\n{i}. {match.faculty.name}")
        print(f"   University: {match.faculty.university}")
        print(f"   Match Score: {match.match_score:.2f}/100")
        print(f"   Research Areas: {', '.join(match.faculty.research_areas[:3])}")
        print(f"   Matched Keywords: {', '.join(match.matched_keywords) if match.matched_keywords else 'None'}")


async def test_hybrid_matching(service: FacultyMatchingService):
    """Test hybrid matching"""
    print("\n" + "=" * 80)
    print("TEST 3: HYBRID MATCHING")
    print("=" * 80)

    query = "computer vision deep learning image recognition visual understanding"

    request = FacultyMatchRequest(
        research_interests=query,
        mode=MatchingMode.HYBRID,
        top_k=5,
        include_publications=True,
        semantic_weight=0.6,
        keyword_weight=0.4,
    )

    print(f"\nQuery: {query}")
    print(f"\nMode: {request.mode.value}")
    print(f"Weights: Semantic={request.semantic_weight}, Keyword={request.keyword_weight}")

    response = await service.match_faculty(request)

    print(f"\n✓ Found {response.total_matches} matches in {response.processing_time_ms:.2f}ms")
    print("\nTop Matches:")
    print("-" * 80)

    for i, match in enumerate(response.matches[:5], 1):
        print(f"\n{i}. {match.faculty.name}")
        print(f"   University: {match.faculty.university}")
        print(f"   Match Score: {match.match_score:.2f}/100")
        print(f"   Research Areas: {', '.join(match.faculty.research_areas[:3])}")


async def test_university_filtering(service: FacultyMatchingService):
    """Test filtering by university"""
    print("\n" + "=" * 80)
    print("TEST 4: UNIVERSITY FILTERING")
    print("=" * 80)

    query = "machine learning artificial intelligence"

    request = FacultyMatchRequest(
        research_interests=query,
        university="Stanford University",
        mode=MatchingMode.HYBRID,
        top_k=10,
    )

    print(f"\nQuery: {query}")
    print(f"Filter: University = {request.university}")

    response = await service.match_faculty(request)

    print(f"\n✓ Found {response.total_matches} matches at {request.university}")
    print("\nMatches:")
    print("-" * 80)

    for i, match in enumerate(response.matches, 1):
        print(f"{i}. {match.faculty.name} - {match.match_score:.2f}/100")


async def test_accepting_students_filter(service: FacultyMatchingService):
    """Test filtering by accepting students status"""
    print("\n" + "=" * 80)
    print("TEST 5: ACCEPTING STUDENTS FILTER")
    print("=" * 80)

    query = "deep learning neural networks"

    # Test with all faculty
    request_all = FacultyMatchRequest(
        research_interests=query,
        mode=MatchingMode.HYBRID,
        top_k=10,
        accepting_students_only=False,
    )

    response_all = await service.match_faculty(request_all)

    # Test with only accepting faculty
    request_accepting = FacultyMatchRequest(
        research_interests=query,
        mode=MatchingMode.HYBRID,
        top_k=10,
        accepting_students_only=True,
    )

    response_accepting = await service.match_faculty(request_accepting)

    print(f"\nQuery: {query}")
    print(f"\n✓ Total matches (all faculty): {response_all.total_matches}")
    print(f"✓ Matches (accepting students only): {response_accepting.total_matches}")

    print("\nFaculty Accepting Students:")
    print("-" * 80)
    for i, match in enumerate(response_accepting.matches[:5], 1):
        print(f"{i}. {match.faculty.name} ({match.faculty.university})")
        print(f"   Status: {match.faculty.accepting_students.value}")
        print(f"   Match Score: {match.match_score:.2f}/100")


async def test_university_grouping(service: FacultyMatchingService):
    """Test grouping results by university"""
    print("\n" + "=" * 80)
    print("TEST 6: UNIVERSITY GROUPING")
    print("=" * 80)

    query = "artificial intelligence robotics machine learning"

    request = FacultyMatchRequest(
        research_interests=query,
        mode=MatchingMode.HYBRID,
        top_k=20,
    )

    response = await service.match_faculty(request)

    print(f"\nQuery: {query}")
    print(f"\n✓ Found matches at {len(response.matches_by_university)} universities")
    print("\nMatches by University:")
    print("-" * 80)

    for uni_match in response.matches_by_university:
        print(f"\n{uni_match.university}")
        print(f"  Total Matches: {uni_match.total_matches}")
        print(f"  Avg Score: {uni_match.avg_match_score:.2f}/100")
        print(f"  Departments: {', '.join(uni_match.departments)}")
        print(f"  Top Faculty:")
        for i, faculty in enumerate(uni_match.faculty_matches[:3], 1):
            print(f"    {i}. {faculty.faculty.name} ({faculty.match_score:.2f}/100)")


async def test_statistics(service: FacultyMatchingService):
    """Test statistics endpoint functionality"""
    print("\n" + "=" * 80)
    print("TEST 7: FACULTY DATABASE STATISTICS")
    print("=" * 80)

    # Count total faculty
    total = await service.faculty_collection.count_documents({})

    # Count by accepting status
    accepting = await service.faculty_collection.count_documents(
        {"accepting_students": FacultyStatus.ACCEPTING.value}
    )

    # Count embeddings
    embeddings = await service.faculty_embeddings_collection.count_documents({})

    # Get universities
    pipeline = [
        {"$group": {"_id": "$university", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    cursor = service.faculty_collection.aggregate(pipeline)
    universities = await cursor.to_list(length=None)

    print(f"\nTotal Faculty: {total}")
    print(f"Accepting Students: {accepting}")
    print(f"Not Accepting: {total - accepting}")
    print(f"Embeddings Generated: {embeddings}")

    print("\nFaculty by University:")
    print("-" * 80)
    for uni in universities:
        print(f"  {uni['_id']}: {uni['count']} faculty")


async def main():
    """Main test function"""
    print("\n")
    print("=" * 80)
    print("FACULTY MATCHING SERVICE - COMPREHENSIVE TEST")
    print("=" * 80)

    # Connect to MongoDB
    print("\nConnecting to MongoDB...")
    await connect_to_mongodb()
    print("✓ Connected to MongoDB")

    # Initialize service
    service = FacultyMatchingService()

    try:
        # Setup sample data
        await setup_sample_data(service)

        # Run tests
        await test_semantic_matching(service)
        await test_keyword_matching(service)
        await test_hybrid_matching(service)
        await test_university_filtering(service)
        await test_accepting_students_filter(service)
        await test_university_grouping(service)
        await test_statistics(service)

        print("\n" + "=" * 80)
        print("ALL TESTS COMPLETED SUCCESSFULLY")
        print("=" * 80 + "\n")

    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        # Close MongoDB connection
        await close_mongodb_connection()
        print("\n✓ Closed MongoDB connection")


if __name__ == "__main__":
    asyncio.run(main())
