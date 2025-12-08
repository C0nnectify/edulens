#!/usr/bin/env python3
"""
Test suite for GradCafe Scraper

Tests profile extraction, data validation, and scraping functionality.
"""

import sys
from pathlib import Path
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from gradcafe_scraper import ProfileExtractor, GradCafeScraper


def test_gpa_extraction():
    """Test GPA extraction from various formats"""
    print("=" * 60)
    print("Test 1: GPA Extraction")
    print("=" * 60)

    extractor = ProfileExtractor()

    test_cases = [
        ("GPA 3.8/4.0", 3.8, 4.0),
        ("GPA: 3.8 out of 4.0", 3.8, 4.0),
        ("CGPA: 9.2/10", 9.2, 10.0),
        ("Percentage: 85%", 3.4, 4.0),  # 85/25 = 3.4
        ("gpa 9/10", 9.0, 10.0),
    ]

    passed = 0
    failed = 0

    for text, expected_gpa, expected_scale in test_cases:
        result = extractor.extract_gpa(text)
        if result and abs(result['gpa'] - expected_gpa) < 0.01 and abs(result['gpa_scale'] - expected_scale) < 0.01:
            print(f"✓ PASS: '{text}' -> {result['gpa']}/{result['gpa_scale']}")
            passed += 1
        else:
            print(f"✗ FAIL: '{text}' -> Expected {expected_gpa}/{expected_scale}, Got {result}")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_gre_extraction():
    """Test GRE score extraction"""
    print("\n" + "=" * 60)
    print("Test 2: GRE Score Extraction")
    print("=" * 60)

    extractor = ProfileExtractor()

    test_cases = [
        ("GRE V:165, Q:170, AW:5.0", 165, 170, 5.0),
        ("GRE: 165V, 170Q, 5.0A", 165, 170, 5.0),
        ("Verbal: 165 Quant: 170 AW: 5.0", 165, 170, 5.0),
        ("GRE Verbal: 165, Quantitative: 170, Writing: 5.0", 165, 170, 5.0),
    ]

    passed = 0
    failed = 0

    for text, exp_v, exp_q, exp_aw in test_cases:
        result = extractor.extract_gre(text)
        if (result and
            result.get('verbal') == exp_v and
            result.get('quant') == exp_q and
            abs(result.get('aw', 0) - exp_aw) < 0.01):
            print(f"✓ PASS: '{text}' -> V:{result['verbal']}, Q:{result['quant']}, AW:{result['aw']}")
            passed += 1
        else:
            print(f"✗ FAIL: '{text}' -> Expected V:{exp_v}, Q:{exp_q}, AW:{exp_aw}, Got {result}")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_toefl_ielts_extraction():
    """Test TOEFL/IELTS score extraction"""
    print("\n" + "=" * 60)
    print("Test 3: TOEFL/IELTS Extraction")
    print("=" * 60)

    extractor = ProfileExtractor()

    test_cases = [
        ("TOEFL: 110", 110, None),
        ("TOEFL iBT: 110", 110, None),
        ("IELTS: 8.5", None, 8.5),
        ("TOEFL: 105, IELTS: 8.0", 105, 8.0),
    ]

    passed = 0
    failed = 0

    for text, exp_toefl, exp_ielts in test_cases:
        toefl = extractor.extract_toefl(text)
        ielts = extractor.extract_ielts(text)

        if (toefl == exp_toefl or exp_toefl is None) and (ielts == exp_ielts or exp_ielts is None):
            print(f"✓ PASS: '{text}' -> TOEFL:{toefl}, IELTS:{ielts}")
            passed += 1
        else:
            print(f"✗ FAIL: '{text}' -> Expected TOEFL:{exp_toefl}, IELTS:{exp_ielts}, Got TOEFL:{toefl}, IELTS:{ielts}")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_research_extraction():
    """Test research experience extraction"""
    print("\n" + "=" * 60)
    print("Test 4: Research Experience Extraction")
    print("=" * 60)

    extractor = ProfileExtractor()

    test_cases = [
        ("2 research papers", 2),
        ("3 publications, first author", 3),
        ("1 conference paper and 1 journal paper", 1),
        ("5 years of research experience", 0),  # Years, not pubs
    ]

    passed = 0
    failed = 0

    for text, expected_pubs in test_cases:
        result = extractor.extract_research(text)
        if result['publications'] == expected_pubs:
            print(f"✓ PASS: '{text}' -> {result['publications']} publications")
            passed += 1
        else:
            print(f"✗ FAIL: '{text}' -> Expected {expected_pubs}, Got {result['publications']}")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_international_detection():
    """Test international student detection"""
    print("\n" + "=" * 60)
    print("Test 5: International Status Detection")
    print("=" * 60)

    extractor = ProfileExtractor()

    test_cases = [
        ("I'm an international student from India", True),
        ("Indian student from IIT Delhi", True),
        ("Chinese student applying from Beijing", True),
        ("Undergrad from MIT", False),
    ]

    passed = 0
    failed = 0

    for text, expected in test_cases:
        result = extractor.detect_international(text)
        if result == expected:
            print(f"✓ PASS: '{text}' -> {result}")
            passed += 1
        else:
            print(f"✗ FAIL: '{text}' -> Expected {expected}, Got {result}")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_institution_extraction():
    """Test undergraduate institution extraction"""
    print("\n" + "=" * 60)
    print("Test 6: Institution Extraction")
    print("=" * 60)

    extractor = ProfileExtractor()

    test_cases = [
        ("Undergrad from IIT Delhi", "IIT Delhi"),
        ("UG at Stanford University", "Stanford University"),
        ("Undergraduate from MIT", "MIT"),
    ]

    passed = 0
    failed = 0

    for text, expected in test_cases:
        result = extractor.extract_institution(text)
        if result and expected.lower() in result.lower():
            print(f"✓ PASS: '{text}' -> {result}")
            passed += 1
        else:
            print(f"✗ FAIL: '{text}' -> Expected '{expected}', Got {result}")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_funding_extraction():
    """Test funding information extraction"""
    print("\n" + "=" * 60)
    print("Test 7: Funding Extraction")
    print("=" * 60)

    extractor = ProfileExtractor()

    test_cases = [
        ("Full funding with stipend", "Full funding"),
        ("Got fellowship", "Fellowship"),
        ("TA/RA assistantship", "Assistantship"),
        ("No funding, self-funded", "No funding"),
        ("Stipend of $45,000/year", None),
    ]

    passed = 0
    failed = 0

    for text, expected_type in test_cases:
        result = extractor.extract_funding(text)
        if (expected_type is None and result['type'] is not None) or \
           (expected_type and result['type'] == expected_type):
            print(f"✓ PASS: '{text}' -> {result['type']}")
            passed += 1
        else:
            print(f"✗ FAIL: '{text}' -> Expected '{expected_type}', Got {result['type']}")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_complete_profile_extraction():
    """Test complete profile extraction from realistic text"""
    print("\n" + "=" * 60)
    print("Test 8: Complete Profile Extraction")
    print("=" * 60)

    extractor = ProfileExtractor()

    sample_text = """
    Accepted to MIT Computer Science PhD!

    Profile:
    - GPA: 3.85/4.0
    - GRE: V:165, Q:170, AW:5.0
    - TOEFL: 110
    - 2 research papers (1 conference, 1 journal)
    - 3 years of research experience
    - International student from IIT Delhi
    - Full funding with $45,000 stipend
    """

    profile = extractor.extract_all(sample_text)

    print("\nExtracted Profile:")
    for key, value in profile.items():
        print(f"  {key}: {value}")

    # Validate key fields
    checks = [
        ("GPA", 'gpa' in profile and 3.8 <= profile['gpa'] <= 3.9),
        ("GRE Verbal", profile.get('gre_verbal') == 165),
        ("GRE Quant", profile.get('gre_quant') == 170),
        ("GRE AW", profile.get('gre_aw') == 5.0),
        ("TOEFL", profile.get('toefl') == 110),
        ("Research Pubs", profile.get('research_pubs') == 2),
        ("International", profile.get('is_international') == True),
        ("Institution", profile.get('undergrad_institution') is not None),
        ("Funding", profile.get('funding_info', {}).get('type') == "Full funding"),
    ]

    passed = sum(1 for _, check in checks if check)
    failed = len(checks) - passed

    print(f"\nValidation:")
    for name, check in checks:
        status = "✓ PASS" if check else "✗ FAIL"
        print(f"  {status}: {name}")

    print(f"\nResults: {passed}/{len(checks)} checks passed")
    return failed == 0


def test_hash_generation():
    """Test hash generation for deduplication"""
    print("\n" + "=" * 60)
    print("Test 9: Hash Generation")
    print("=" * 60)

    scraper = GradCafeScraper()

    record1 = {
        'university': 'MIT',
        'program': 'Computer Science PhD',
        'season': 'Fall 2024',
        'decision': 'Accepted',
        'post_content': 'Got accepted! Very happy.'
    }

    record2 = {
        'university': 'MIT',
        'program': 'Computer Science PhD',
        'season': 'Fall 2024',
        'decision': 'Accepted',
        'post_content': 'Got accepted! Very happy.'
    }

    record3 = {
        'university': 'Stanford',
        'program': 'Computer Science PhD',
        'season': 'Fall 2024',
        'decision': 'Accepted',
        'post_content': 'Got accepted! Very happy.'
    }

    hash1 = scraper.generate_hash(record1)
    hash2 = scraper.generate_hash(record2)
    hash3 = scraper.generate_hash(record3)

    print(f"Record 1 hash: {hash1[:16]}...")
    print(f"Record 2 hash: {hash2[:16]}...")
    print(f"Record 3 hash: {hash3[:16]}...")

    passed = 0
    failed = 0

    if hash1 == hash2:
        print("✓ PASS: Identical records produce same hash")
        passed += 1
    else:
        print("✗ FAIL: Identical records should have same hash")
        failed += 1

    if hash1 != hash3:
        print("✓ PASS: Different records produce different hashes")
        passed += 1
    else:
        print("✗ FAIL: Different records should have different hashes")
        failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_url_generation():
    """Test search URL generation"""
    print("\n" + "=" * 60)
    print("Test 10: URL Generation")
    print("=" * 60)

    scraper = GradCafeScraper()

    # Test basic URL
    url1 = scraper.build_search_url(program="Computer Science", year="2024")
    print(f"URL 1: {url1}")
    assert "q=Computer+Science" in url1 or "q=Computer%20Science" in url1, "Program parameter missing"
    assert "pp=2024" in url1, "Year parameter missing"
    print("✓ PASS: Basic URL generation")

    # Test with university
    url2 = scraper.build_search_url(university="MIT", year="2024")
    print(f"URL 2: {url2}")
    assert "t=MIT" in url2, "University parameter missing"
    print("✓ PASS: University URL generation")

    # Test with page
    url3 = scraper.build_search_url(program="CS", page=2)
    print(f"URL 3: {url3}")
    assert "p=2" in url3, "Page parameter missing"
    print("✓ PASS: Pagination URL generation")

    print("\nResults: All URL generation tests passed")
    return True


def test_decision_normalization():
    """Test decision string normalization"""
    print("\n" + "=" * 60)
    print("Test 11: Decision Normalization")
    print("=" * 60)

    scraper = GradCafeScraper()

    test_cases = [
        ("Accepted", "Accepted"),
        ("Admitted", "Accepted"),
        ("Rejected", "Rejected"),
        ("Waitlisted", "Waitlisted"),
        ("Pending", "Pending"),
        ("Wait", "Pending"),
    ]

    passed = 0
    failed = 0

    for input_val, expected in test_cases:
        result = scraper.normalize_decision(input_val)
        if result == expected:
            print(f"✓ PASS: '{input_val}' -> '{result}'")
            passed += 1
        else:
            print(f"✗ FAIL: '{input_val}' -> Expected '{expected}', Got '{result}'")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_date_parsing():
    """Test date parsing"""
    print("\n" + "=" * 60)
    print("Test 12: Date Parsing")
    print("=" * 60)

    scraper = GradCafeScraper()

    test_cases = [
        ("15 Mar 2024", "2024-03-15"),
        ("Mar 15, 2024", "2024-03-15"),
        ("2024-03-15", "2024-03-15"),
        ("03/15/2024", "2024-03-15"),
        ("—", None),
        ("", None),
    ]

    passed = 0
    failed = 0

    for input_val, expected in test_cases:
        result = scraper.parse_date(input_val)
        if result == expected:
            print(f"✓ PASS: '{input_val}' -> '{result}'")
            passed += 1
        else:
            print(f"✗ FAIL: '{input_val}' -> Expected '{expected}', Got '{result}'")
            failed += 1

    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def run_all_tests():
    """Run all tests"""
    print("\n" + "=" * 80)
    print(" GradCafe Scraper - Test Suite")
    print("=" * 80)

    tests = [
        ("GPA Extraction", test_gpa_extraction),
        ("GRE Extraction", test_gre_extraction),
        ("TOEFL/IELTS Extraction", test_toefl_ielts_extraction),
        ("Research Extraction", test_research_extraction),
        ("International Detection", test_international_detection),
        ("Institution Extraction", test_institution_extraction),
        ("Funding Extraction", test_funding_extraction),
        ("Complete Profile", test_complete_profile_extraction),
        ("Hash Generation", test_hash_generation),
        ("URL Generation", test_url_generation),
        ("Decision Normalization", test_decision_normalization),
        ("Date Parsing", test_date_parsing),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ ERROR in {name}: {e}")
            results.append((name, False))

    # Print summary
    print("\n" + "=" * 80)
    print(" Test Summary")
    print("=" * 80)

    passed = sum(1 for _, result in results if result)
    failed = len(results) - passed

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    print("\n" + "=" * 80)
    print(f" Total: {passed} passed, {failed} failed")
    print("=" * 80)

    return failed == 0


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
