#!/usr/bin/env python3
"""
Example usage and integration scripts for faculty_scraper.py
"""

import os
import sys
from pathlib import Path
from pymongo import MongoClient
import json


def example_query_faculty():
    """Example: Query faculty data from MongoDB"""
    print("=" * 60)
    print("Example 1: Query Faculty Data")
    print("=" * 60)

    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
    db = client[os.getenv('MONGODB_DB_NAME', 'edulens')]

    # Query 1: Find all ML researchers
    print("\n1. Finding all Machine Learning researchers...")
    ml_faculty = db.faculty_data.find({
        'research_areas': {'$in': ['Machine Learning', 'ML', 'AI']}
    }).limit(5)

    for faculty in ml_faculty:
        print(f"  - {faculty.get('name')} ({faculty.get('university_name')})")
        print(f"    Email: {faculty.get('email')}")
        print(f"    Research: {', '.join(faculty.get('research_areas', []))}")
        print()

    # Query 2: Count faculty by university
    print("\n2. Faculty count by university...")
    pipeline = [
        {'$group': {
            '_id': '$university_name',
            'count': {'$sum': 1}
        }},
        {'$sort': {'count': -1}}
    ]

    results = db.faculty_data.aggregate(pipeline)
    for result in results:
        print(f"  {result['_id']}: {result['count']} faculty")

    # Query 3: Find faculty accepting students
    print("\n3. Faculty accepting students...")
    accepting = db.faculty_data.find({
        'accepting_students': True
    }).limit(5)

    for faculty in accepting:
        print(f"  - {faculty.get('name')} ({faculty.get('university_name')})")
        print(f"    Lab: {faculty.get('lab', 'N/A')}")
        print()

    client.close()


def example_export_university():
    """Example: Export data for specific university"""
    print("=" * 60)
    print("Example 2: Export University Data")
    print("=" * 60)

    university_id = 'mit'  # Change this to desired university

    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
    db = client[os.getenv('MONGODB_DB_NAME', 'edulens')]

    # Get all faculty from university
    faculty = list(db.faculty_data.find(
        {'university_id': university_id},
        {'_id': 0}
    ))

    output_file = f'{university_id}_faculty.json'
    with open(output_file, 'w') as f:
        json.dump(faculty, f, indent=2)

    print(f"\nExported {len(faculty)} faculty to {output_file}")

    client.close()


def example_research_area_analysis():
    """Example: Analyze research areas across universities"""
    print("=" * 60)
    print("Example 3: Research Area Analysis")
    print("=" * 60)

    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
    db = client[os.getenv('MONGODB_DB_NAME', 'edulens')]

    # Get all unique research areas
    research_areas = db.faculty_data.distinct('research_areas')
    print(f"\nTotal unique research areas: {len(research_areas)}")

    # Count faculty per research area
    pipeline = [
        {'$unwind': '$research_areas'},
        {'$group': {
            '_id': '$research_areas',
            'count': {'$sum': 1},
            'universities': {'$addToSet': '$university_name'}
        }},
        {'$sort': {'count': -1}},
        {'$limit': 10}
    ]

    results = db.faculty_data.aggregate(pipeline)

    print("\nTop 10 research areas:")
    for i, result in enumerate(results, 1):
        print(f"\n{i}. {result['_id']}")
        print(f"   Faculty count: {result['count']}")
        print(f"   Universities: {len(result['universities'])}")

    client.close()


def example_professor_matching(student_interests):
    """Example: Match professors with student interests"""
    print("=" * 60)
    print("Example 4: Professor Matching")
    print("=" * 60)

    print(f"\nStudent interests: {', '.join(student_interests)}")

    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
    db = client[os.getenv('MONGODB_DB_NAME', 'edulens')]

    # Find matching professors
    matches = db.faculty_data.find({
        'research_areas': {'$in': student_interests}
    }).limit(10)

    print("\nMatching professors:")
    for match in matches:
        # Calculate match score (number of matching interests)
        matching_areas = set(match.get('research_areas', [])) & set(student_interests)
        score = len(matching_areas)

        print(f"\n  {match.get('name')}")
        print(f"  {match.get('university_name')} - {match.get('department')}")
        print(f"  Email: {match.get('email')}")
        print(f"  Match score: {score}/{len(student_interests)}")
        print(f"  Matching areas: {', '.join(matching_areas)}")
        if match.get('website'):
            print(f"  Website: {match.get('website')}")
        if match.get('accepting_students'):
            print("  Status: Accepting students")

    client.close()


def example_department_comparison():
    """Example: Compare departments across universities"""
    print("=" * 60)
    print("Example 5: Department Comparison")
    print("=" * 60)

    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
    db = client[os.getenv('MONGODB_DB_NAME', 'edulens')]

    # Get department stats
    pipeline = [
        {'$group': {
            '_id': {
                'university': '$university_name',
                'department': '$department'
            },
            'faculty_count': {'$sum': 1},
            'research_areas': {'$push': '$research_areas'}
        }},
        {'$sort': {'faculty_count': -1}},
        {'$limit': 10}
    ]

    results = db.faculty_data.aggregate(pipeline)

    print("\nTop 10 departments by faculty count:")
    for i, result in enumerate(results, 1):
        # Flatten research areas
        all_areas = []
        for areas in result['research_areas']:
            if areas:
                all_areas.extend(areas)
        unique_areas = len(set(all_areas))

        print(f"\n{i}. {result['_id']['university']}")
        print(f"   Department: {result['_id']['department']}")
        print(f"   Faculty: {result['faculty_count']}")
        print(f"   Research areas: {unique_areas}")

    client.close()


def example_email_list_generator(university_id=None, research_area=None):
    """Example: Generate email list for outreach"""
    print("=" * 60)
    print("Example 6: Email List Generator")
    print("=" * 60)

    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
    db = client[os.getenv('MONGODB_DB_NAME', 'edulens')]

    # Build query
    query = {}
    if university_id:
        query['university_id'] = university_id
    if research_area:
        query['research_areas'] = research_area

    print(f"\nFilters:")
    print(f"  University: {university_id or 'All'}")
    print(f"  Research area: {research_area or 'All'}")

    # Get faculty emails
    faculty = db.faculty_data.find(query, {
        'name': 1,
        'email': 1,
        'university_name': 1,
        'title': 1,
        '_id': 0
    })

    emails = []
    for f in faculty:
        if f.get('email'):
            emails.append({
                'name': f.get('name'),
                'email': f.get('email'),
                'title': f.get('title'),
                'university': f.get('university_name')
            })

    print(f"\nFound {len(emails)} faculty with emails")

    # Save to CSV
    import csv
    output_file = 'faculty_emails.csv'
    with open(output_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['name', 'email', 'title', 'university'])
        writer.writeheader()
        writer.writerows(emails)

    print(f"Saved to {output_file}")

    client.close()


def example_statistics():
    """Example: Generate statistics report"""
    print("=" * 60)
    print("Example 7: Statistics Report")
    print("=" * 60)

    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
    db = client[os.getenv('MONGODB_DB_NAME', 'edulens')]

    # Total counts
    total_faculty = db.faculty_data.count_documents({})
    total_universities = len(db.faculty_data.distinct('university_id'))
    total_departments = db.faculty_data.distinct('department')

    print(f"\nOverall Statistics:")
    print(f"  Total faculty: {total_faculty}")
    print(f"  Total universities: {total_universities}")
    print(f"  Total departments: {len(total_departments)}")

    # Faculty with websites
    with_websites = db.faculty_data.count_documents({'website': {'$exists': True, '$ne': ''}})
    print(f"  Faculty with websites: {with_websites} ({with_websites/total_faculty*100:.1f}%)")

    # Faculty accepting students
    accepting = db.faculty_data.count_documents({'accepting_students': True})
    print(f"  Accepting students: {accepting} ({accepting/total_faculty*100:.1f}%)")

    # Average faculty per university
    avg_faculty = total_faculty / total_universities
    print(f"  Average faculty per university: {avg_faculty:.1f}")

    client.close()


def main():
    """Run all examples"""
    print("\n" + "=" * 60)
    print("Faculty Scraper - Example Usage Scripts")
    print("=" * 60)

    # Check MongoDB connection
    try:
        client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
        db = client[os.getenv('MONGODB_DB_NAME', 'edulens')]
        count = db.faculty_data.count_documents({})

        if count == 0:
            print("\nWarning: No faculty data found in database.")
            print("Please run the scraper first:")
            print("  python faculty_scraper.py --all")
            sys.exit(1)

        print(f"\nConnected to MongoDB. Found {count} faculty records.")
        client.close()
    except Exception as e:
        print(f"\nError connecting to MongoDB: {e}")
        print("Please ensure MongoDB is running and MONGODB_URI is set correctly.")
        sys.exit(1)

    # Run examples
    print("\n")
    example_query_faculty()

    print("\n")
    example_research_area_analysis()

    print("\n")
    example_professor_matching(['Machine Learning', 'AI', 'Computer Vision'])

    print("\n")
    example_department_comparison()

    print("\n")
    example_statistics()

    print("\n" + "=" * 60)
    print("Examples completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
