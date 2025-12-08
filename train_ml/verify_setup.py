#!/usr/bin/env python3
"""
Setup Verification Script for Reddit Scraper
Checks all requirements and configurations before first run
"""

import sys
import json
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint

console = Console()


def check_python_version():
    """Check Python version"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 9:
        return True, f"{version.major}.{version.minor}.{version.micro}"
    return False, f"{version.major}.{version.minor}.{version.micro} (Need 3.9+)"


def check_dependencies():
    """Check required Python packages"""
    required = {
        'praw': 'Reddit API',
        'pymongo': 'MongoDB',
        'google.generativeai': 'Gemini AI (optional)',
        'rich': 'CLI formatting'
    }

    results = {}
    for package, description in required.items():
        try:
            __import__(package)
            results[description] = (True, "Installed")
        except ImportError:
            results[description] = (False, "Missing")

    return results


def check_config_files():
    """Check configuration files exist"""
    required_files = {
        'reddit_config.json': 'Configuration',
        'reddit_patterns.json': 'Extraction patterns',
        'reddit_scraper.py': 'Main scraper',
        'test_reddit_scraper.py': 'Test suite',
        'analyze_results.py': 'Analysis tools'
    }

    results = {}
    for filename, description in required_files.items():
        path = Path(filename)
        if path.exists():
            results[description] = (True, f"Found ({path.stat().st_size} bytes)")
        else:
            results[description] = (False, "Missing")

    return results


def check_reddit_credentials():
    """Check Reddit API credentials"""
    try:
        with open('reddit_config.json', 'r') as f:
            config = json.load(f)

        api_config = config.get('reddit_api', {})

        checks = {
            'Client ID': api_config.get('client_id') not in [None, '', 'YOUR_CLIENT_ID'],
            'Client Secret': api_config.get('client_secret') not in [None, '', 'YOUR_CLIENT_SECRET'],
            'User Agent': bool(api_config.get('user_agent'))
        }

        return checks

    except FileNotFoundError:
        return {'Config File': False}
    except json.JSONDecodeError:
        return {'JSON Parsing': False}


def check_mongodb():
    """Check MongoDB connection"""
    try:
        with open('reddit_config.json', 'r') as f:
            config = json.load(f)

        from pymongo import MongoClient

        uri = config['mongodb']['uri']
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.server_info()

        db_name = config['mongodb']['database']
        collection_name = config['mongodb']['collection']

        client.close()
        return True, f"Connected to {db_name}.{collection_name}"

    except Exception as e:
        return False, str(e)[:50]


def check_gemini_api():
    """Check Gemini API configuration"""
    try:
        with open('reddit_config.json', 'r') as f:
            config = json.load(f)

        api_key = config.get('gemini', {}).get('api_key')

        if not api_key or api_key == 'YOUR_GEMINI_API_KEY':
            return None, "Not configured (optional)"

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            return True, "Configured"
        except Exception:
            return False, "Invalid key"

    except Exception as e:
        return False, str(e)[:50]


def test_reddit_connection():
    """Test Reddit API connection"""
    try:
        with open('reddit_config.json', 'r') as f:
            config = json.load(f)

        import praw

        api_config = config['reddit_api']
        reddit = praw.Reddit(
            client_id=api_config['client_id'],
            client_secret=api_config['client_secret'],
            user_agent=api_config['user_agent']
        )

        # Test by getting a subreddit
        subreddit = reddit.subreddit('gradadmissions')
        _ = subreddit.display_name

        return True, "Connection successful"

    except Exception as e:
        return False, str(e)[:100]


def main():
    """Run all checks"""
    console.print("\n[bold cyan]Reddit Scraper Setup Verification[/bold cyan]\n")

    # Python version
    console.print("[bold]1. Python Version[/bold]")
    py_ok, py_version = check_python_version()
    status = "[green]✓[/green]" if py_ok else "[red]✗[/red]"
    console.print(f"   {status} Python {py_version}\n")

    if not py_ok:
        console.print("[red]Error: Python 3.9+ required[/red]\n")
        return

    # Dependencies
    console.print("[bold]2. Python Dependencies[/bold]")
    deps = check_dependencies()
    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column("Status", style="bold")
    table.add_column("Package")
    table.add_column("Status")

    all_deps_ok = True
    for package, (installed, status) in deps.items():
        icon = "[green]✓[/green]" if installed else "[red]✗[/red]"
        table.add_row(icon, package, status)
        if not installed and "optional" not in package.lower():
            all_deps_ok = False

    console.print(table)
    console.print()

    if not all_deps_ok:
        console.print("[yellow]Install missing dependencies:[/yellow]")
        console.print("pip install praw pymongo google-generativeai rich\n")

    # Config files
    console.print("[bold]3. Configuration Files[/bold]")
    files = check_config_files()
    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column("Status", style="bold")
    table.add_column("File")
    table.add_column("Status")

    for file, (exists, status) in files.items():
        icon = "[green]✓[/green]" if exists else "[red]✗[/red]"
        table.add_row(icon, file, status)

    console.print(table)
    console.print()

    # Reddit credentials
    console.print("[bold]4. Reddit API Credentials[/bold]")
    creds = check_reddit_credentials()
    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column("Status", style="bold")
    table.add_column("Credential")

    all_creds_ok = True
    for cred, configured in creds.items():
        icon = "[green]✓[/green]" if configured else "[red]✗[/red]"
        table.add_row(icon, cred)
        if not configured:
            all_creds_ok = False

    console.print(table)
    console.print()

    if not all_creds_ok:
        console.print("[yellow]Configure Reddit API:[/yellow]")
        console.print("1. Visit https://www.reddit.com/prefs/apps")
        console.print("2. Create app (type: script)")
        console.print("3. Edit reddit_config.json with credentials")
        console.print("4. See AUTHENTICATION_SETUP_GUIDE.md for details\n")

    # MongoDB
    console.print("[bold]5. MongoDB Connection[/bold]")
    mongo_ok, mongo_msg = check_mongodb()
    icon = "[green]✓[/green]" if mongo_ok else "[red]✗[/red]"
    console.print(f"   {icon} {mongo_msg}\n")

    if not mongo_ok:
        console.print("[yellow]Start MongoDB:[/yellow]")
        console.print("Local: sudo systemctl start mongodb")
        console.print("Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas\n")

    # Gemini API
    console.print("[bold]6. Gemini API (Optional)[/bold]")
    gemini_ok, gemini_msg = check_gemini_api()
    if gemini_ok is None:
        icon = "[yellow]○[/yellow]"
    elif gemini_ok:
        icon = "[green]✓[/green]"
    else:
        icon = "[red]✗[/red]"
    console.print(f"   {icon} {gemini_msg}\n")

    if gemini_ok is None:
        console.print("[dim]   Gemini is optional. Regex extraction works well.[/dim]")
        console.print("[dim]   Get key at: https://makersuite.google.com/app/apikey[/dim]\n")

    # Test Reddit connection
    if all_creds_ok and all_deps_ok:
        console.print("[bold]7. Reddit API Test[/bold]")
        with console.status("[cyan]Testing connection...[/cyan]"):
            reddit_ok, reddit_msg = test_reddit_connection()

        icon = "[green]✓[/green]" if reddit_ok else "[red]✗[/red]"
        console.print(f"   {icon} {reddit_msg}\n")

        if not reddit_ok:
            console.print("[red]Connection failed. Check credentials.[/red]\n")

    # Summary
    console.print("─" * 60)

    ready = all_deps_ok and all_creds_ok and mongo_ok

    if ready:
        console.print(Panel.fit(
            "[bold green]✓ Setup Complete![/bold green]\n\n"
            "Ready to scrape Reddit admission data.\n\n"
            "[cyan]Next steps:[/cyan]\n"
            "1. python test_reddit_scraper.py\n"
            "2. python reddit_scraper.py --subreddit gradadmissions --limit 10\n"
            "3. python analyze_results.py",
            title="Status",
            border_style="green"
        ))
    else:
        missing = []
        if not all_deps_ok:
            missing.append("Install Python dependencies")
        if not all_creds_ok:
            missing.append("Configure Reddit API credentials")
        if not mongo_ok:
            missing.append("Start MongoDB")

        console.print(Panel.fit(
            "[bold yellow]⚠ Setup Incomplete[/bold yellow]\n\n"
            "Complete the following:\n" +
            "\n".join(f"{i+1}. {item}" for i, item in enumerate(missing)) +
            "\n\nSee QUICK_START_REDDIT.md for guidance.",
            title="Status",
            border_style="yellow"
        ))

    console.print()


if __name__ == "__main__":
    main()
