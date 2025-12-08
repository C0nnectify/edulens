#!/usr/bin/env python3
"""
Verify faculty scraper installation and dependencies
"""

import sys
import os

def check_python_version():
    """Check Python version"""
    print("Checking Python version...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 9:
        print(f"✓ Python {version.major}.{version.minor}.{version.micro} (OK)")
        return True
    else:
        print(f"✗ Python {version.major}.{version.minor}.{version.micro} (Need 3.9+)")
        return False

def check_dependencies():
    """Check required Python packages"""
    print("\nChecking dependencies...")
    required = [
        'requests',
        'bs4',
        'firecrawl',
        'google.generativeai',
        'pymongo',
        'rich'
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package)
            status = "✓" if package != 'firecrawl' else "○"
            note = "" if package != 'firecrawl' else " (optional)"
            print(f"{status} {package}{note}")
        except ImportError:
            if package == 'firecrawl':
                print(f"○ {package} (optional, not installed)")
            else:
                print(f"✗ {package} (missing)")
                missing.append(package)
    
    return len(missing) == 0

def check_files():
    """Check required files"""
    print("\nChecking files...")
    required = [
        'faculty_scraper.py',
        'university_config.json',
        'scraping_progress.json',
        'requirements.txt',
        '.env.example'
    ]
    
    all_exist = True
    for file in required:
        if os.path.exists(file):
            print(f"✓ {file}")
        else:
            print(f"✗ {file} (missing)")
            all_exist = False
    
    return all_exist

def check_env():
    """Check environment variables"""
    print("\nChecking environment...")
    
    google_key = os.getenv('GOOGLE_API_KEY')
    if google_key:
        print(f"✓ GOOGLE_API_KEY (set)")
    else:
        print(f"○ GOOGLE_API_KEY (not set - required to run)")
    
    firecrawl_key = os.getenv('FIRECRAWL_API_KEY')
    if firecrawl_key:
        print(f"✓ FIRECRAWL_API_KEY (set)")
    else:
        print(f"○ FIRECRAWL_API_KEY (not set - optional)")
    
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    print(f"✓ MONGODB_URI: {mongodb_uri}")

def check_mongodb():
    """Check MongoDB connection"""
    print("\nChecking MongoDB...")
    try:
        from pymongo import MongoClient
        client = MongoClient(
            os.getenv('MONGODB_URI', 'mongodb://localhost:27017'),
            serverSelectionTimeoutMS=5000
        )
        client.server_info()
        print("✓ MongoDB connection successful")
        client.close()
        return True
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        return False

def main():
    """Run all checks"""
    print("=" * 60)
    print("Faculty Scraper Installation Verification")
    print("=" * 60)
    
    checks = []
    checks.append(("Python Version", check_python_version()))
    checks.append(("Dependencies", check_dependencies()))
    checks.append(("Files", check_files()))
    check_env()
    checks.append(("MongoDB", check_mongodb()))
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    for name, status in checks:
        status_str = "✓ PASS" if status else "✗ FAIL"
        print(f"{name}: {status_str}")
    
    all_pass = all(status for _, status in checks)
    
    print("\n" + "=" * 60)
    if all_pass:
        print("✓ Installation verified! Ready to scrape.")
        print("\nNext steps:")
        print("  1. Set GOOGLE_API_KEY in .env")
        print("  2. Run: python faculty_scraper.py --university mit")
    else:
        print("✗ Some checks failed. Please fix the issues above.")
        print("\nTroubleshooting:")
        print("  - Install dependencies: pip install -r requirements.txt")
        print("  - Start MongoDB: sudo systemctl start mongodb")
        print("  - Set API keys in .env file")
    print("=" * 60)
    
    return 0 if all_pass else 1

if __name__ == '__main__':
    sys.exit(main())
