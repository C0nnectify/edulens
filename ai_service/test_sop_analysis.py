"""
Test script for SOP Analysis Service

Run this script to test the SOP analysis functionality.
Requires the AI service to be running on localhost:8000
"""

import asyncio
import sys
from app.services.sop_analysis_service import sop_analysis_service

# Sample SOP texts for testing
SAMPLE_SOP_POOR = """
Ever since I was a child, I have been passionate about technology. I am a hardworking and dedicated student who wants to make a difference in the world. I believe that your prestigious institution is the perfect fit for me.

I want to study computer science because it's interesting. I am a fast learner and team player with excellent communication skills. I hope to achieve my dreams at your renowned university.

In today's rapidly changing world, technology is important. I would like to contribute to society and give back. I look forward to studying at your world-class institution.
"""

SAMPLE_SOP_GOOD = """
During my undergraduate research on neural network optimization at XYZ University, I reduced training time by 35% through novel pruning techniques. This experience solidified my commitment to advancing machine learning efficiency, particularly in resource-constrained environments.

My interest in efficient AI stems from a two-year internship at TechCorp, where I developed edge computing solutions for IoT devices. Leading a team of four engineers, we deployed models 50% smaller while maintaining 95% accuracy. This work resulted in two patent applications and sparked my curiosity about Professor Smith's research on neural architecture search.

Stanford's Computer Science PhD program aligns perfectly with my goals. Professor Smith's recent paper on automated model compression resonates with my work, and I'm eager to contribute to his lab. The CS229 and CS231N courses would complement my background in optimization theory, while the interdisciplinary ML/Systems group offers the collaborative environment I thrive in.

My 3.9 GPA, three first-author publications, and contributions to open-source projects like TensorFlow Lite demonstrate my technical capabilities. I aim to develop scalable AI systems accessible to resource-limited communities, combining my research skills with Stanford's resources to create meaningful impact.
"""


async def test_basic_analysis():
    """Test basic SOP analysis"""
    print("=" * 80)
    print("TEST 1: Basic SOP Analysis - Poor Quality SOP")
    print("=" * 80)

    try:
        result = await sop_analysis_service.analyze_sop(
            sop_text=SAMPLE_SOP_POOR,
            user_id="test_user_1",
            university_name="Stanford University",
            program_name="Computer Science PhD",
            compare_with_database=False
        )

        print(f"\n✓ Analysis completed successfully")
        print(f"  Overall Score: {result['scores']['overall']:.1f}/100")
        print(f"  Grade: {result['grade']}")
        print(f"\n  Score Breakdown:")
        for key, value in result['scores'].items():
            if key != 'overall':
                print(f"    - {key.capitalize()}: {value:.1f}")

        print(f"\n  Clichés Detected: {result['cliche_detection']['total_cliches']}")
        print(f"    - Major: {result['cliche_detection']['severity_counts']['major']}")
        print(f"    - Moderate: {result['cliche_detection']['severity_counts']['moderate']}")
        print(f"    - Minor: {result['cliche_detection']['severity_counts']['minor']}")

        print(f"\n  Top 3 Recommendations:")
        for i, rec in enumerate(result['recommendations'][:3], 1):
            print(f"    {i}. [{rec['priority'].upper()}] {rec['issue']}")

        return True

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_good_sop_analysis():
    """Test analysis on a well-written SOP"""
    print("\n" + "=" * 80)
    print("TEST 2: Basic SOP Analysis - High Quality SOP")
    print("=" * 80)

    try:
        result = await sop_analysis_service.analyze_sop(
            sop_text=SAMPLE_SOP_GOOD,
            user_id="test_user_2",
            university_name="Stanford University",
            program_name="Computer Science PhD",
            compare_with_database=False
        )

        print(f"\n✓ Analysis completed successfully")
        print(f"  Overall Score: {result['scores']['overall']:.1f}/100")
        print(f"  Grade: {result['grade']}")
        print(f"\n  Score Breakdown:")
        for key, value in result['scores'].items():
            if key != 'overall':
                print(f"    - {key.capitalize()}: {value:.1f}")

        print(f"\n  Clichés Detected: {result['cliche_detection']['total_cliches']}")
        print(f"\n  Structure Score: {result['structure_analysis']['score']:.1f}")
        print(f"    - Paragraphs: {result['structure_analysis']['paragraph_count']}")
        print(f"    - Avg Length: {result['structure_analysis']['average_paragraph_length']:.0f} words")

        return True

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_version_comparison():
    """Test SOP version comparison"""
    print("\n" + "=" * 80)
    print("TEST 3: Version Comparison")
    print("=" * 80)

    try:
        result = await sop_analysis_service.compare_versions(
            user_id="test_user_3",
            sop_text_1=SAMPLE_SOP_POOR,
            sop_text_2=SAMPLE_SOP_GOOD
        )

        print(f"\n✓ Comparison completed successfully")
        print(f"\n  Version 1 Score: {result['version_1']['scores']['overall']:.1f} (Grade: {result['version_1']['grade']})")
        print(f"  Version 2 Score: {result['version_2']['scores']['overall']:.1f} (Grade: {result['version_2']['grade']})")
        print(f"\n  Overall Improvement: {result['overall_change']:+.1f} points")
        print(f"  Grade Change: {result['grade_change']}")

        print(f"\n  Improvement Breakdown:")
        for key, value in result['improvements'].items():
            if key != 'overall':
                print(f"    - {key.capitalize()}: {value:+.1f}")

        return True

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_cliche_detection():
    """Test cliché detection specifically"""
    print("\n" + "=" * 80)
    print("TEST 4: Cliché Detection")
    print("=" * 80)

    cliche_heavy_text = """
    Ever since I was a child, I have been passionate about science. I am a hardworking
    and dedicated individual who wants to make a difference in the world. Throughout my
    life, I have always been fascinated by technology. I believe that your prestigious
    institution would be the perfect fit for my goals.
    """

    try:
        result = await sop_analysis_service._detect_cliches(cliche_heavy_text)

        print(f"\n✓ Cliché detection completed")
        print(f"  Total Clichés: {result['total_cliches']}")
        print(f"  Severity Breakdown:")
        print(f"    - Major: {result['severity_counts']['major']}")
        print(f"    - Moderate: {result['severity_counts']['moderate']}")
        print(f"    - Minor: {result['severity_counts']['minor']}")

        print(f"\n  Detected Clichés:")
        for cliche in result['detected_cliches'][:5]:
            print(f"    - \"{cliche['text']}\" [{cliche['severity']}]")
            print(f"      Category: {cliche['category']}")
            print(f"      Suggestion: {cliche['suggestion']}\n")

        return True

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_custom_cliche():
    """Test adding custom cliché"""
    print("\n" + "=" * 80)
    print("TEST 5: Add Custom Cliché")
    print("=" * 80)

    try:
        result = await sop_analysis_service.add_custom_cliche(
            text="at the end of the day",
            severity="minor",
            category="filler_phrase",
            suggestion="Replace with more specific language"
        )

        print(f"\n✓ Custom cliché added successfully")
        print(f"  Cliché ID: {result['cliche_id']}")
        print(f"  Message: {result['message']}")

        return True

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def run_all_tests():
    """Run all tests"""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "SOP ANALYSIS SERVICE - TEST SUITE" + " " * 24 + "║")
    print("╚" + "=" * 78 + "╝")
    print()

    tests = [
        ("Basic Analysis - Poor SOP", test_basic_analysis),
        ("Basic Analysis - Good SOP", test_good_sop_analysis),
        ("Version Comparison", test_version_comparison),
        ("Cliché Detection", test_cliche_detection),
        ("Custom Cliché", test_custom_cliche)
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))

    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {test_name}")

    print(f"\n  Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n  🎉 All tests passed!")
        return 0
    else:
        print(f"\n  ⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(run_all_tests())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nFatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
