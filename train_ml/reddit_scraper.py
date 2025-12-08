#!/usr/bin/env python3
"""
Reddit Admission Results Scraper
Scrapes admission decisions from r/gradadmissions and related subreddits
"""

import argparse
import asyncio
import json
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set, Any
from collections import defaultdict
import hashlib

import praw
from praw.models import Submission, Comment
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table
from rich import print as rprint
import google.generativeai as genai

console = Console()


class ProfileExtractor:
    """Extract student profiles from Reddit posts using regex and AI"""

    def __init__(self, patterns: Dict, gemini_api_key: Optional[str] = None):
        self.patterns = patterns
        self.gemini_api_key = gemini_api_key

        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def extract_gpa(self, text: str) -> Optional[float]:
        """Extract GPA from text"""
        for pattern in self.patterns['gpa_patterns']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    gpa = float(match.group(1))
                    if 0.0 <= gpa <= 4.0:
                        return gpa
                except ValueError:
                    continue
        return None

    def extract_gre_scores(self, text: str) -> Dict[str, Optional[float]]:
        """Extract GRE scores from text"""
        scores = {"verbal": None, "quant": None, "aw": None}

        # Try combined pattern first
        for pattern in self.patterns['gre_patterns'].get('total', []):
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    scores['verbal'] = int(match.group(1))
                    scores['quant'] = int(match.group(2))
                    scores['aw'] = float(match.group(3))
                    return scores
                except (ValueError, IndexError):
                    continue

        # Try individual patterns
        for score_type, patterns in self.patterns['gre_patterns'].items():
            if score_type == 'total':
                continue
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    try:
                        value = float(match.group(1))
                        if score_type == 'aw' and 0 <= value <= 6:
                            scores[score_type] = value
                        elif score_type in ['verbal', 'quant'] and 130 <= value <= 170:
                            scores[score_type] = int(value)
                    except ValueError:
                        continue

        return scores if any(scores.values()) else {}

    def extract_test_score(self, text: str, test_name: str) -> Optional[int]:
        """Extract test score (TOEFL, GMAT, SAT, etc.)"""
        patterns = self.patterns.get(f'{test_name.lower()}_patterns', [])
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    continue
        return None

    def extract_work_experience(self, text: str) -> Optional[int]:
        """Extract years of work experience"""
        for pattern in self.patterns['work_experience_patterns']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    continue
        return None

    def extract_research_pubs(self, text: str) -> Optional[int]:
        """Extract number of research publications"""
        for pattern in self.patterns['research_patterns']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    continue
        return None

    def detect_decision(self, text: str) -> Optional[str]:
        """Detect admission decision type"""
        text_lower = text.lower()

        for decision_type, keywords in self.patterns['decision_patterns'].items():
            if any(keyword in text_lower for keyword in keywords):
                return decision_type.capitalize()

        return None

    def extract_university(self, text: str) -> Optional[str]:
        """Extract university name"""
        for pattern in self.patterns['university_patterns']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None

    def extract_program(self, text: str) -> Optional[str]:
        """Extract program/degree"""
        for pattern in self.patterns['program_patterns']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        return None

    def check_funding(self, text: str) -> Optional[str]:
        """Check if funding is mentioned"""
        text_lower = text.lower()
        for indicator in self.patterns['funding_indicators']:
            if indicator in text_lower:
                return indicator.title()
        return None

    def check_international(self, text: str) -> bool:
        """Check if applicant is international"""
        text_lower = text.lower()
        return any(indicator in text_lower for indicator in self.patterns['international_indicators'])

    def extract_profile_with_ai(self, text: str) -> Dict[str, Any]:
        """Use Gemini to extract profile information from unstructured text"""
        if not self.model:
            return {}

        prompt = f"""
Extract the following admission profile information from this Reddit post. Return ONLY valid JSON.

Required fields (use null if not found):
- gpa (float, 0.0-4.0)
- gre_verbal (int, 130-170)
- gre_quant (int, 130-170)
- gre_aw (float, 0.0-6.0)
- toefl (int, 0-120)
- gmat (int, 200-800)
- work_experience_years (int)
- research_publications (int)
- undergrad_institution (string)
- major (string)
- is_international (boolean)
- funding_mentioned (boolean)

Post text:
{text[:2000]}

Return JSON only, no explanation.
"""

        try:
            response = self.model.generate_content(prompt)
            result = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
            return result
        except Exception as e:
            console.print(f"[yellow]AI extraction failed: {e}[/yellow]")
            return {}

    def extract_full_profile(self, text: str, use_ai: bool = False) -> Dict[str, Any]:
        """Extract complete profile using regex and optionally AI"""
        profile = {}

        # Regex extraction
        gpa = self.extract_gpa(text)
        if gpa:
            profile['gpa'] = gpa

        gre = self.extract_gre_scores(text)
        if gre:
            profile['gre_scores'] = gre

        toefl = self.extract_test_score(text, 'toefl')
        if toefl:
            profile['toefl'] = toefl

        gmat = self.extract_test_score(text, 'gmat')
        if gmat:
            profile['gmat'] = gmat

        work_exp = self.extract_work_experience(text)
        if work_exp:
            profile['work_experience_years'] = work_exp

        pubs = self.extract_research_pubs(text)
        if pubs:
            profile['research_pubs'] = pubs

        profile['is_international'] = self.check_international(text)

        # AI extraction if enabled and regex didn't find much
        if use_ai and len(profile) < 3:
            ai_profile = self.extract_profile_with_ai(text)
            # Merge AI results, prefer regex results
            for key, value in ai_profile.items():
                if value is not None and key not in profile:
                    profile[key] = value

        return profile


class RedditScraper:
    """Main Reddit scraper for admission results"""

    def __init__(self, config_path: str = "reddit_config.json", patterns_path: str = "reddit_patterns.json"):
        self.config = self._load_config(config_path)
        self.patterns = self._load_patterns(patterns_path)

        # Initialize Reddit API
        self.reddit = self._init_reddit()

        # Initialize profile extractor
        gemini_key = self.config.get('gemini', {}).get('api_key')
        if gemini_key and gemini_key != "YOUR_GEMINI_API_KEY":
            self.extractor = ProfileExtractor(self.patterns, gemini_key)
            self.use_ai = True
        else:
            self.extractor = ProfileExtractor(self.patterns)
            self.use_ai = False
            console.print("[yellow]Warning: Gemini API key not configured. AI extraction disabled.[/yellow]")

        # Initialize MongoDB
        self.db = self._init_mongodb()

        # Statistics
        self.stats = defaultdict(int)
        self.seen_posts: Set[str] = set()

    def _load_config(self, path: str) -> Dict:
        """Load configuration file"""
        with open(path, 'r') as f:
            return json.load(f)

    def _load_patterns(self, path: str) -> Dict:
        """Load extraction patterns"""
        with open(path, 'r') as f:
            return json.load(f)

    def _init_reddit(self) -> praw.Reddit:
        """Initialize PRAW Reddit instance"""
        api_config = self.config['reddit_api']

        if api_config['client_id'] == "YOUR_CLIENT_ID":
            raise ValueError("Please configure Reddit API credentials in reddit_config.json")

        return praw.Reddit(
            client_id=api_config['client_id'],
            client_secret=api_config['client_secret'],
            user_agent=api_config['user_agent'],
            username=api_config.get('username'),
            password=api_config.get('password')
        )

    def _init_mongodb(self) -> Any:
        """Initialize MongoDB connection"""
        mongo_config = self.config['mongodb']
        client = MongoClient(mongo_config['uri'])
        db = client[mongo_config['database']]
        collection = db[mongo_config['collection']]

        # Create indexes
        collection.create_index([('post_id', ASCENDING)], unique=True)
        collection.create_index([('university', ASCENDING), ('program', ASCENDING)])
        collection.create_index([('post_date', DESCENDING)])
        collection.create_index([('decision', ASCENDING)])

        return collection

    def _generate_post_hash(self, post: Submission) -> str:
        """Generate unique hash for deduplication"""
        content = f"{post.id}_{post.author}_{post.title}"
        return hashlib.sha256(content.encode()).hexdigest()

    def _is_relevant_post(self, post: Submission) -> bool:
        """Check if post is relevant for scraping"""
        title_lower = post.title.lower()

        # Check keywords
        keywords = self.config['search_config']['keywords']
        if not any(keyword in title_lower for keyword in keywords):
            return False

        # Check date range
        post_date = datetime.fromtimestamp(post.created_utc)
        year_range = self.config['search_config']['year_range']
        if not (year_range['start'] <= post_date.year <= year_range['end']):
            return False

        return True

    def _extract_post_data(self, post: Submission) -> Optional[Dict[str, Any]]:
        """Extract data from a single post"""
        try:
            # Combine title and body for analysis
            full_text = f"{post.title}\n\n{post.selftext}"

            # Extract decision
            decision = self.extractor.detect_decision(full_text)
            if not decision:
                return None

            # Extract university and program
            university = self.extractor.extract_university(full_text)
            program = self.extractor.extract_program(full_text)

            # Extract profile
            profile = self.extractor.extract_full_profile(full_text, use_ai=self.use_ai)

            # Extract funding info
            funding = self.extractor.check_funding(full_text)

            # Build result
            result = {
                "source": "reddit",
                "subreddit": f"r/{post.subreddit.display_name}",
                "post_id": post.id,
                "post_title": post.title,
                "post_url": f"https://reddit.com{post.permalink}",
                "author": str(post.author) if post.author else "[deleted]",
                "post_date": datetime.fromtimestamp(post.created_utc).isoformat(),
                "university": university,
                "program": program,
                "decision": decision,
                "profile": profile,
                "funding": funding,
                "post_content": post.selftext[:1000],  # Truncate long posts
                "upvotes": post.score,
                "num_comments": post.num_comments,
                "flair": post.link_flair_text,
                "scraped_at": datetime.utcnow().isoformat()
            }

            # Also check comments for profile info
            post.comments.replace_more(limit=0)
            for comment in post.comments.list()[:5]:  # Check top 5 comments
                if hasattr(comment, 'body'):
                    comment_profile = self.extractor.extract_full_profile(comment.body, use_ai=False)
                    # Merge comment profile if more complete
                    if len(comment_profile) > len(profile):
                        result['profile'].update(comment_profile)

            return result

        except Exception as e:
            console.print(f"[red]Error extracting post {post.id}: {e}[/red]")
            return None

    def scrape_subreddit(
        self,
        subreddit_name: str,
        limit: int = 1000,
        search_query: Optional[str] = None,
        time_filter: str = 'all'
    ) -> List[Dict[str, Any]]:
        """Scrape a single subreddit"""
        results = []

        try:
            subreddit = self.reddit.subreddit(subreddit_name)

            console.print(f"\n[cyan]Scraping r/{subreddit_name}[/cyan]")

            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TaskProgressColumn(),
                console=console
            ) as progress:
                task = progress.add_task(f"Processing posts...", total=limit)

                # Search or get hot posts
                if search_query:
                    posts = subreddit.search(search_query, limit=limit, time_filter=time_filter)
                else:
                    # Combine hot, new, and top posts
                    posts = list(subreddit.hot(limit=limit//3))
                    posts.extend(list(subreddit.new(limit=limit//3)))
                    posts.extend(list(subreddit.top(time_filter=time_filter, limit=limit//3)))

                for post in posts:
                    # Rate limiting
                    time.sleep(self.config['extraction_config']['rate_limit_delay'])

                    # Check if already seen
                    post_hash = self._generate_post_hash(post)
                    if post_hash in self.seen_posts:
                        continue

                    self.seen_posts.add(post_hash)
                    self.stats['posts_checked'] += 1

                    # Check relevance
                    if not self._is_relevant_post(post):
                        continue

                    self.stats['relevant_posts'] += 1

                    # Extract data
                    data = self._extract_post_data(post)
                    if data:
                        results.append(data)
                        self.stats['extracted_profiles'] += 1

                        # Save to MongoDB
                        try:
                            self.db.insert_one(data)
                            self.stats['saved_to_db'] += 1
                        except DuplicateKeyError:
                            self.stats['duplicates'] += 1

                    progress.update(task, advance=1)

            console.print(f"[green]Found {len(results)} results from r/{subreddit_name}[/green]")

        except Exception as e:
            console.print(f"[red]Error scraping r/{subreddit_name}: {e}[/red]")

        return results

    def scrape_multiple_subreddits(
        self,
        subreddit_list: List[str],
        limit_per_sub: int = 500,
        search_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Scrape multiple subreddits"""
        all_results = []

        for subreddit_name in subreddit_list:
            results = self.scrape_subreddit(
                subreddit_name,
                limit=limit_per_sub,
                search_query=search_query
            )
            all_results.extend(results)

        return all_results

    def export_to_json(self, results: List[Dict[str, Any]], output_path: str):
        """Export results to JSON file"""
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        console.print(f"[green]Exported {len(results)} results to {output_path}[/green]")

    def print_statistics(self):
        """Print scraping statistics"""
        table = Table(title="Scraping Statistics")
        table.add_column("Metric", style="cyan")
        table.add_column("Count", style="magenta")

        table.add_row("Posts Checked", str(self.stats['posts_checked']))
        table.add_row("Relevant Posts", str(self.stats['relevant_posts']))
        table.add_row("Profiles Extracted", str(self.stats['extracted_profiles']))
        table.add_row("Saved to DB", str(self.stats['saved_to_db']))
        table.add_row("Duplicates Skipped", str(self.stats['duplicates']))

        console.print(table)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Reddit Admission Results Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python reddit_scraper.py --subreddit gradadmissions --limit 1000
  python reddit_scraper.py --keyword "MIT accepted" --years 2023-2024
  python reddit_scraper.py --university-subs
  python reddit_scraper.py --all-subs --export results.json
        """
    )

    parser.add_argument(
        '--subreddit',
        type=str,
        help='Single subreddit to scrape (without r/)'
    )

    parser.add_argument(
        '--all-subs',
        action='store_true',
        help='Scrape all configured main subreddits'
    )

    parser.add_argument(
        '--university-subs',
        action='store_true',
        help='Scrape university-specific subreddits'
    )

    parser.add_argument(
        '--limit',
        type=int,
        default=1000,
        help='Maximum posts per subreddit (default: 1000)'
    )

    parser.add_argument(
        '--keyword',
        type=str,
        help='Search keyword'
    )

    parser.add_argument(
        '--years',
        type=str,
        help='Year range (e.g., 2023-2024)'
    )

    parser.add_argument(
        '--export',
        type=str,
        help='Export results to JSON file'
    )

    parser.add_argument(
        '--config',
        type=str,
        default='reddit_config.json',
        help='Path to config file'
    )

    parser.add_argument(
        '--patterns',
        type=str,
        default='reddit_patterns.json',
        help='Path to patterns file'
    )

    parser.add_argument(
        '--no-ai',
        action='store_true',
        help='Disable AI-based extraction'
    )

    args = parser.parse_args()

    # Resolve paths
    script_dir = Path(__file__).parent
    config_path = script_dir / args.config
    patterns_path = script_dir / args.patterns

    # Initialize scraper
    console.print("[bold green]Reddit Admission Results Scraper[/bold green]\n")

    try:
        scraper = RedditScraper(str(config_path), str(patterns_path))
    except Exception as e:
        console.print(f"[red]Failed to initialize scraper: {e}[/red]")
        return

    if args.no_ai:
        scraper.use_ai = False

    # Update year range if specified
    if args.years:
        try:
            start, end = args.years.split('-')
            scraper.config['search_config']['year_range']['start'] = int(start)
            scraper.config['search_config']['year_range']['end'] = int(end)
        except ValueError:
            console.print("[red]Invalid year format. Use: 2023-2024[/red]")
            return

    # Determine which subreddits to scrape
    subreddits = []

    if args.subreddit:
        subreddits = [args.subreddit]
    elif args.all_subs:
        subreddits = scraper.config['subreddits']['main']
    elif args.university_subs:
        subreddits = scraper.config['subreddits']['universities']
    else:
        # Default to main subreddits
        subreddits = scraper.config['subreddits']['main']

    # Scrape
    console.print(f"[cyan]Scraping {len(subreddits)} subreddit(s)[/cyan]\n")

    results = scraper.scrape_multiple_subreddits(
        subreddits,
        limit_per_sub=args.limit,
        search_query=args.keyword
    )

    # Print statistics
    scraper.print_statistics()

    # Export if requested
    if args.export:
        export_path = script_dir / args.export
        scraper.export_to_json(results, str(export_path))

    console.print(f"\n[bold green]Scraping completed! Found {len(results)} admission results.[/bold green]")


if __name__ == "__main__":
    main()
