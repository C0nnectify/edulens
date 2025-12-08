#!/usr/bin/env python3
"""
Faculty Data Scraper for Top 20 Universities
Scrapes faculty information from CS/Engineering departments using Firecrawl and BeautifulSoup
"""

import os
import sys
import json
import time
import asyncio
import argparse
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any
from urllib.parse import urljoin, urlparse

# Third-party imports
import requests
from bs4 import BeautifulSoup
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.logging import RichHandler
from rich.table import Table
from firecrawl import FirecrawlApp
import google.generativeai as genai
from pymongo import MongoClient, ASCENDING
from pymongo.errors import DuplicateKeyError

# Setup logging with Rich
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger(__name__)
console = Console()


class FacultyExtractor:
    """AI-powered faculty information extraction using Google Gemini"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("Google API key not found. Set GOOGLE_API_KEY environment variable.")

        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')

    def extract_faculty_info(self, html_content: str, url: str) -> List[Dict[str, Any]]:
        """Extract structured faculty information from HTML using AI"""

        prompt = f"""
You are an expert at extracting faculty information from university web pages.

Extract faculty member information from the following HTML content from {url}.

For each faculty member, extract:
- name (full name)
- title (Professor, Associate Professor, Assistant Professor, etc.)
- email (if available)
- research_areas (list of research interests/areas)
- lab (lab or group name, if mentioned)
- website (personal website URL)
- photo (profile photo URL)
- accepting_students (boolean, true if explicitly mentioned they're accepting students)

Return ONLY a valid JSON array of faculty objects. If no faculty found, return empty array [].

HTML Content:
{html_content[:15000]}  # Limit to avoid token limits

Respond with ONLY the JSON array, no markdown formatting, no explanations.
"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=2000
                )
            )

            # Clean response
            text = response.text.strip()

            # Remove markdown code blocks if present
            if text.startswith('```'):
                text = text.split('```')[1]
                if text.startswith('json'):
                    text = text[4:]
                text = text.strip()

            faculty_list = json.loads(text)

            if not isinstance(faculty_list, list):
                logger.warning(f"AI returned non-list response for {url}")
                return []

            return faculty_list

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON for {url}: {e}")
            return []
        except Exception as e:
            logger.error(f"AI extraction failed for {url}: {e}")
            return []


class FacultyScraper:
    """Main scraper class with Firecrawl and BeautifulSoup fallback"""

    def __init__(self, config_path: str, progress_path: str):
        self.config_path = Path(config_path)
        self.progress_path = Path(progress_path)
        self.config = self.load_config()
        self.progress = self.load_progress()

        # Initialize Firecrawl
        firecrawl_key = os.getenv('FIRECRAWL_API_KEY')
        self.firecrawl = FirecrawlApp(api_key=firecrawl_key) if firecrawl_key else None

        # Initialize AI extractor
        self.ai_extractor = FacultyExtractor()

        # Initialize MongoDB
        self.setup_mongodb()

        # Rate limiting
        self.last_request_time = 0
        self.rate_limit = self.config['scraping_config']['rate_limit_delay']

        # Session for requests
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.config['scraping_config']['user_agent']
        })

    def load_config(self) -> Dict:
        """Load university configuration"""
        with open(self.config_path, 'r') as f:
            return json.load(f)

    def load_progress(self) -> Dict:
        """Load scraping progress"""
        if self.progress_path.exists():
            with open(self.progress_path, 'r') as f:
                return json.load(f)
        return {
            'last_university': None,
            'last_department': None,
            'completed': [],
            'failed': [],
            'total_faculty_scraped': 0
        }

    def save_progress(self):
        """Save scraping progress"""
        with open(self.progress_path, 'w') as f:
            json.dump(self.progress, f, indent=2)

    def setup_mongodb(self):
        """Setup MongoDB connection and collections"""
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
        db_name = os.getenv('MONGODB_DB_NAME', 'edulens')

        self.mongo_client = MongoClient(mongodb_uri)
        self.db = self.mongo_client[db_name]

        # Create collections
        self.faculty_collection = self.db['faculty_data']
        self.universities_collection = self.db['universities_scraped']

        # Create indexes
        self.faculty_collection.create_index([
            ('university_id', ASCENDING),
            ('department', ASCENDING),
            ('email', ASCENDING)
        ], unique=True, sparse=True)

        self.faculty_collection.create_index('research_areas')
        self.universities_collection.create_index('university_id', unique=True)

    def rate_limit_delay(self):
        """Implement rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit:
            time.sleep(self.rate_limit - elapsed)
        self.last_request_time = time.time()

    def fetch_with_firecrawl(self, url: str) -> Optional[str]:
        """Fetch content using Firecrawl"""
        if not self.firecrawl:
            return None

        try:
            self.rate_limit_delay()
            result = self.firecrawl.scrape_url(url, params={
                'formats': ['markdown', 'html']
            })

            if result and 'html' in result:
                return result['html']
            elif result and 'markdown' in result:
                return result['markdown']

            return None

        except Exception as e:
            logger.warning(f"Firecrawl failed for {url}: {e}")
            return None

    def fetch_with_requests(self, url: str) -> Optional[str]:
        """Fallback fetch using requests and BeautifulSoup"""
        try:
            self.rate_limit_delay()
            response = self.session.get(
                url,
                timeout=self.config['scraping_config']['timeout']
            )
            response.raise_for_status()
            return response.text

        except Exception as e:
            logger.error(f"Request failed for {url}: {e}")
            return None

    def parse_with_selectors(self, html: str, selectors: Dict) -> List[Dict]:
        """Parse HTML using CSS selectors"""
        if not selectors:
            return []

        soup = BeautifulSoup(html, 'html.parser')
        faculty_list = []

        try:
            faculty_elements = soup.select(selectors.get('faculty_list', ''))

            for element in faculty_elements:
                faculty = {}

                # Extract fields based on selectors
                if 'name' in selectors:
                    name_elem = element.select_one(selectors['name'])
                    if name_elem:
                        faculty['name'] = name_elem.get_text(strip=True)

                if 'title' in selectors:
                    title_elem = element.select_one(selectors['title'])
                    if title_elem:
                        faculty['title'] = title_elem.get_text(strip=True)

                if 'email' in selectors:
                    email_elem = element.select_one(selectors['email'])
                    if email_elem:
                        faculty['email'] = email_elem.get('href', '').replace('mailto:', '')

                if 'research' in selectors:
                    research_elem = element.select_one(selectors['research'])
                    if research_elem:
                        research_text = research_elem.get_text(strip=True)
                        faculty['research_areas'] = [r.strip() for r in research_text.split(',')]

                if faculty.get('name'):
                    faculty_list.append(faculty)

            return faculty_list

        except Exception as e:
            logger.error(f"Selector parsing failed: {e}")
            return []

    def generate_faculty_hash(self, university_id: str, department: str, email: str) -> str:
        """Generate unique hash for faculty member"""
        data = f"{university_id}:{department}:{email}".encode()
        return hashlib.sha256(data).hexdigest()[:16]

    async def scrape_department(self, university: Dict, department: Dict) -> Dict:
        """Scrape a single department"""
        url = department['faculty_url']
        university_id = university['id']
        university_name = university['name']
        department_name = department['name']

        logger.info(f"Scraping {university_name} - {department_name}")

        # Try Firecrawl first
        html_content = self.fetch_with_firecrawl(url)

        # Fallback to requests
        if not html_content:
            html_content = self.fetch_with_requests(url)

        if not html_content:
            logger.error(f"Failed to fetch {url}")
            return {
                'university_id': university_id,
                'university_name': university_name,
                'department': department_name,
                'url': url,
                'faculty': [],
                'total_faculty': 0,
                'scraped_at': datetime.utcnow().isoformat(),
                'status': 'failed',
                'error': 'Could not fetch content'
            }

        # Try selector-based parsing first
        faculty_list = self.parse_with_selectors(html_content, department.get('selectors', {}))

        # If selectors didn't work, use AI extraction
        if not faculty_list:
            logger.info(f"Using AI extraction for {url}")
            faculty_list = self.ai_extractor.extract_faculty_info(html_content, url)

        # Enrich and deduplicate
        enriched_faculty = []
        for faculty in faculty_list:
            if not faculty.get('email'):
                continue

            # Add metadata
            faculty['university_id'] = university_id
            faculty['university_name'] = university_name
            faculty['department'] = department_name
            faculty['source_url'] = url
            faculty['scraped_at'] = datetime.utcnow().isoformat()

            # Generate hash for deduplication
            faculty_hash = self.generate_faculty_hash(
                university_id,
                department_name,
                faculty['email']
            )
            faculty['faculty_hash'] = faculty_hash

            enriched_faculty.append(faculty)

        result = {
            'university_id': university_id,
            'university_name': university_name,
            'department': department_name,
            'url': url,
            'faculty': enriched_faculty,
            'total_faculty': len(enriched_faculty),
            'scraped_at': datetime.utcnow().isoformat(),
            'status': 'success'
        }

        # Save to MongoDB
        self.save_to_mongodb(result)

        return result

    def save_to_mongodb(self, result: Dict):
        """Save results to MongoDB"""
        try:
            # Save university metadata
            self.universities_collection.update_one(
                {'university_id': result['university_id']},
                {
                    '$set': {
                        'university_name': result['university_name'],
                        'last_scraped': result['scraped_at']
                    },
                    '$addToSet': {
                        'departments': {
                            'name': result['department'],
                            'url': result['url'],
                            'faculty_count': result['total_faculty']
                        }
                    }
                },
                upsert=True
            )

            # Save faculty data
            for faculty in result['faculty']:
                try:
                    self.faculty_collection.insert_one(faculty)
                except DuplicateKeyError:
                    # Update existing record
                    self.faculty_collection.update_one(
                        {
                            'university_id': faculty['university_id'],
                            'department': faculty['department'],
                            'email': faculty['email']
                        },
                        {'$set': faculty}
                    )

            logger.info(f"Saved {result['total_faculty']} faculty members to MongoDB")

        except Exception as e:
            logger.error(f"MongoDB save failed: {e}")

    async def scrape_university(self, university_id: str, department_code: Optional[str] = None):
        """Scrape all departments of a university"""
        university = next(
            (u for u in self.config['universities'] if u['id'] == university_id),
            None
        )

        if not university:
            logger.error(f"University {university_id} not found in config")
            return

        departments = university['departments']
        if department_code:
            departments = [d for d in departments if d['code'] == department_code]

        results = []
        for department in departments:
            result = await self.scrape_department(university, department)
            results.append(result)

            # Update progress
            self.progress['last_university'] = university_id
            self.progress['last_department'] = department['code']
            self.progress['total_faculty_scraped'] += result['total_faculty']

            if result['status'] == 'success':
                key = f"{university_id}:{department['code']}"
                if key not in self.progress['completed']:
                    self.progress['completed'].append(key)
            else:
                key = f"{university_id}:{department['code']}"
                if key not in self.progress['failed']:
                    self.progress['failed'].append(key)

            self.save_progress()

        return results

    async def scrape_all(self, resume: bool = False):
        """Scrape all universities"""
        universities = self.config['universities']

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:

            task = progress.add_task(
                "[cyan]Scraping universities...",
                total=len(universities)
            )

            for university in universities:
                university_id = university['id']

                # Skip if resume is enabled and already completed
                if resume:
                    all_completed = all(
                        f"{university_id}:{dept['code']}" in self.progress['completed']
                        for dept in university['departments']
                    )
                    if all_completed:
                        logger.info(f"Skipping {university['name']} (already completed)")
                        progress.update(task, advance=1)
                        continue

                await self.scrape_university(university_id)
                progress.update(task, advance=1)

        self.print_summary()

    def print_summary(self):
        """Print scraping summary"""
        table = Table(title="Scraping Summary")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")

        table.add_row("Total Faculty Scraped", str(self.progress['total_faculty_scraped']))
        table.add_row("Completed", str(len(self.progress['completed'])))
        table.add_row("Failed", str(len(self.progress['failed'])))

        console.print(table)

    def export_to_json(self, output_path: str):
        """Export all scraped data to JSON"""
        data = list(self.faculty_collection.find({}, {'_id': 0}))

        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        logger.info(f"Exported {len(data)} faculty records to {output_path}")


async def main():
    parser = argparse.ArgumentParser(description='Faculty Data Scraper for Top 20 Universities')
    parser.add_argument('--university', '-u', help='University ID to scrape (e.g., mit, stanford)')
    parser.add_argument('--department', '-d', help='Department code to scrape (e.g., cs, eecs)')
    parser.add_argument('--all', '-a', action='store_true', help='Scrape all configured universities')
    parser.add_argument('--resume', '-r', action='store_true', help='Resume from last position')
    parser.add_argument('--export', '-e', help='Export results to JSON file')
    parser.add_argument('--config', '-c', default='train_ml/university_config.json', help='Config file path')
    parser.add_argument('--progress', '-p', default='train_ml/scraping_progress.json', help='Progress file path')

    args = parser.parse_args()

    # Validate environment variables
    required_env = ['GOOGLE_API_KEY']
    missing_env = [var for var in required_env if not os.getenv(var)]

    if missing_env:
        console.print(f"[red]Missing required environment variables: {', '.join(missing_env)}[/red]")
        console.print("[yellow]Set GOOGLE_API_KEY environment variable[/yellow]")
        console.print("[yellow]Optional: Set FIRECRAWL_API_KEY for enhanced scraping[/yellow]")
        sys.exit(1)

    # Get absolute paths
    script_dir = Path(__file__).parent
    config_path = script_dir / args.config if not Path(args.config).is_absolute() else Path(args.config)
    progress_path = script_dir / args.progress if not Path(args.progress).is_absolute() else Path(args.progress)

    scraper = FacultyScraper(str(config_path), str(progress_path))

    try:
        if args.all:
            await scraper.scrape_all(resume=args.resume)
        elif args.university:
            await scraper.scrape_university(args.university, args.department)
        else:
            parser.print_help()
            return

        if args.export:
            scraper.export_to_json(args.export)

    except KeyboardInterrupt:
        console.print("\n[yellow]Scraping interrupted. Progress saved.[/yellow]")
        scraper.save_progress()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        scraper.save_progress()
        sys.exit(1)
    finally:
        if scraper.mongo_client:
            scraper.mongo_client.close()


if __name__ == '__main__':
    asyncio.run(main())
