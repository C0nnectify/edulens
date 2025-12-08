"""
Quick test script to verify AI service setup
"""

import sys
import importlib.util

def check_module(module_name):
    """Check if a module can be imported"""
    try:
        spec = importlib.util.find_spec(module_name)
        if spec is not None:
            print(f"✓ {module_name}")
            return True
        else:
            print(f"✗ {module_name} - Not found")
            return False
    except Exception as e:
        print(f"✗ {module_name} - Error: {e}")
        return False

def main():
    print("=" * 60)
    print("AI Document Processing Service - Dependency Check")
    print("=" * 60)
    print()

    # Core dependencies
    print("Core Dependencies:")
    core_deps = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "motor",
        "pymongo",
    ]

    core_results = [check_module(dep) for dep in core_deps]
    print()

    # Document processing
    print("Document Processing:")
    doc_deps = [
        "PyPDF2",
        "docx",
        "PIL",
        "pytesseract",
    ]

    doc_results = [check_module(dep) for dep in doc_deps]
    print()

    # AI/ML dependencies
    print("AI/ML Dependencies:")
    ai_deps = [
        "openai",
        "sentence_transformers",
        "tiktoken",
    ]

    ai_results = [check_module(dep) for dep in ai_deps]
    print()

    # Utilities
    print("Utilities:")
    util_deps = [
        "aiofiles",
        "loguru",
        "jose",
    ]

    util_results = [check_module(dep) for dep in util_deps]
    print()

    # Summary
    all_results = core_results + doc_results + ai_results + util_results
    total = len(all_results)
    passed = sum(all_results)

    print("=" * 60)
    print(f"Results: {passed}/{total} dependencies available")
    print("=" * 60)

    if passed == total:
        print("✓ All dependencies installed successfully!")
        return 0
    else:
        print("✗ Some dependencies are missing. Run: pip install -r requirements.txt")
        return 1

if __name__ == "__main__":
    sys.exit(main())
