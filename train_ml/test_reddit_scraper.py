#!/usr/bin/env python3
"""
Test script for Reddit scraper functionality
Run this to verify your setup is working correctly
"""

import json
from pathlib import Path
from reddit_scraper import ProfileExtractor, RedditScraper
from rich.console import Console
from rich.table import Table

console = Console()


def test_profile_extractor():
    """Test profile extraction patterns"""
    console.print("\n[bold cyan]Testing Profile Extractor[/bold cyan]\n")

    # Load patterns
    with open('reddit_patterns.json', 'r') as f:
        patterns = json.load(f)

    extractor = ProfileExtractor(patterns)

    # Test cases
    test_posts = [
        {
            "name": "Structured Profile",
            "text": """
            Got into MIT CS PhD!

            Profile:
            GPA: 3.87/4.0
            GRE: 165V/170Q/5.0AW
            TOEFL: 115
            Research: 3 publications
            Work Experience: 2 years at Google
            Undergrad: UC Berkeley
            """
        },
        {
            "name": "Unstructured Post",
            "text": """
            I'm so happy! Just got accepted to Stanford for MS CS.
            My GPA was 3.9 and I had a 340 on GRE (170Q 170V).
            I had 2 research papers published during undergrad.
            """
        },
        {
            "name": "MBA Profile",
            "text": """
            Admitted to Harvard MBA!
            GMAT: 760
            Work Experience: 5 years in consulting
            Undergrad GPA: 3.5
            """
        }
    ]

    results_table = Table(title="Extraction Test Results")
    results_table.add_column("Test Case", style="cyan")
    results_table.add_column("GPA", style="green")
    results_table.add_column("GRE/GMAT", style="yellow")
    results_table.add_column("Work Exp", style="magenta")

    for test in test_posts:
        profile = extractor.extract_full_profile(test["text"])

        gpa = str(profile.get('gpa', 'N/A'))

        test_score = "N/A"
        if 'gre_scores' in profile:
            gre = profile['gre_scores']
            test_score = f"GRE: V{gre.get('verbal', '?')} Q{gre.get('quant', '?')}"
        elif 'gmat' in profile:
            test_score = f"GMAT: {profile['gmat']}"

        work = str(profile.get('work_experience_years', 'N/A'))

        results_table.add_row(test["name"], gpa, test_score, work)

    console.print(results_table)
    console.print("[green]Profile extraction test completed![/green]\n")


def test_decision_detection():
    """Test decision type detection"""
    console.print("\n[bold cyan]Testing Decision Detection[/bold cyan]\n")

    with open('reddit_patterns.json', 'r') as f:
        patterns = json.load(f)

    extractor = ProfileExtractor(patterns)

    test_titles = [
        "Accepted to MIT CS PhD with full funding!",
        "Rejected from all my dream schools",
        "Waitlisted at Stanford - what are my chances?",
        "Got into Berkeley! So excited",
        "Admission decision - unfortunately rejected",
        "Deferred from Harvard to regular decision"
    ]

    table = Table(title="Decision Detection Test")
    table.add_column("Post Title", style="cyan")
    table.add_column("Detected Decision", style="yellow")

    for title in test_titles:
        decision = extractor.detect_decision(title)
        table.add_row(title[:50] + "...", decision or "Not Detected")

    console.print(table)
    console.print("[green]Decision detection test completed![/green]\n")


def test_university_extraction():
    """Test university name extraction"""
    console.print("\n[bold cyan]Testing University Extraction[/bold cyan]\n")

    with open('reddit_patterns.json', 'r') as f:
        patterns = json.load(f)

    extractor = ProfileExtractor(patterns)

    test_texts = [
        "Accepted to MIT for Computer Science",
        "Got into Stanford PhD program!",
        "UC Berkeley MS CS admission",
        "Carnegie Mellon University - admitted!",
        "University of Michigan acceptance"
    ]

    table = Table(title="University Extraction Test")
    table.add_column("Text", style="cyan")
    table.add_column("Detected University", style="yellow")

    for text in test_texts:
        university = extractor.extract_university(text)
        table.add_row(text, university or "Not Detected")

    console.print(table)
    console.print("[green]University extraction test completed![/green]\n")


def test_config_loading():
    """Test configuration file loading"""
    console.print("\n[bold cyan]Testing Configuration Loading[/bold cyan]\n")

    try:
        with open('reddit_config.json', 'r') as f:
            config = json.load(f)

        checks = [
            ("Reddit Client ID", config['reddit_api']['client_id'] != "YOUR_CLIENT_ID"),
            ("Reddit Client Secret", config['reddit_api']['client_secret'] != "YOUR_CLIENT_SECRET"),
            ("MongoDB URI", 'mongodb' in config['mongodb']['uri']),
            ("Subreddits configured", len(config['subreddits']['main']) > 0),
        ]

        table = Table(title="Configuration Status")
        table.add_column("Check", style="cyan")
        table.add_column("Status", style="yellow")

        for check_name, passed in checks:
            status = "[green]✓ Configured[/green]" if passed else "[red]✗ Not Configured[/red]"
            table.add_row(check_name, status)

        console.print(table)

        if not all(check[1] for check in checks[:2]):
            console.print("\n[yellow]Warning: Reddit API credentials not configured.[/yellow]")
            console.print("Edit reddit_config.json to add your credentials.\n")

    except FileNotFoundError:
        console.print("[red]Error: reddit_config.json not found![/red]")
    except json.JSONDecodeError:
        console.print("[red]Error: reddit_config.json is not valid JSON![/red]")


def test_mongodb_connection():
    """Test MongoDB connection"""
    console.print("\n[bold cyan]Testing MongoDB Connection[/bold cyan]\n")

    try:
        with open('reddit_config.json', 'r') as f:
            config = json.load(f)

        from pymongo import MongoClient

        uri = config['mongodb']['uri']
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)

        # Test connection
        client.server_info()

        console.print("[green]✓ MongoDB connection successful![/green]")

        # List databases
        dbs = client.list_database_names()
        console.print(f"Available databases: {', '.join(dbs)}")

        client.close()

    except Exception as e:
        console.print(f"[red]✗ MongoDB connection failed: {e}[/red]")
        console.print("\nTroubleshooting:")
        console.print("1. Check if MongoDB is running: sudo systemctl status mongodb")
        console.print("2. Verify connection URI in reddit_config.json")
        console.print("3. For Atlas, check network access settings\n")


def run_all_tests():
    """Run all tests"""
    console.print("\n[bold green]Reddit Scraper Test Suite[/bold green]")
    console.print("=" * 60)

    test_config_loading()
    test_mongodb_connection()
    test_profile_extractor()
    test_decision_detection()
    test_university_extraction()

    console.print("\n[bold green]All tests completed![/bold green]")
    console.print("\nNext steps:")
    console.print("1. Configure Reddit API credentials if not done")
    console.print("2. Run: python reddit_scraper.py --subreddit gradadmissions --limit 10")
    console.print("3. Check MongoDB for results: mongosh -> use edulens -> db.admission_results.find()\n")


if __name__ == "__main__":
    run_all_tests()
