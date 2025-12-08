#!/usr/bin/env python3
"""
GradCafe Scraper - Comprehensive admission data collection tool

Collects historical admission data from thegradcafe.com including:
- University and program information
- Admission decisions (Accepted/Rejected/Waitlisted)
- Student profiles (GPA, GRE, TOEFL, research)
- Funding information
- Application timelines

Author: EduLen Team
Date: 2025-01-12
"""

import asyncio
import json
import logging
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urljoin, urlencode

import click
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table
from pymongo import MongoClient, ASCENDING
from pymongo.errors import DuplicateKeyError
import hashlib


# Initialize console for rich output
console = Console()


class ProfileExtractor:
    """Extract structured profile data from text using regex patterns"""

    def __init__(self, patterns_file: str = "profile_patterns.json"):
        patterns_path = Path(__file__).parent / patterns_file
        with open(patterns_path, 'r') as f:
            self.patterns = json.load(f)

    def extract_gpa(self, text: str) -> Optional[Dict[str, float]]:
        """Extract GPA and scale from text"""
        for pattern_obj in self.patterns['gpa_patterns']:
            pattern = pattern_obj['pattern']
            match = re.search(pattern, text)
            if match:
                groups = pattern_obj.get('groups', {})
                if 'percentage' in groups:
                    percentage = float(match.group(groups['percentage']))
                    return {
                        'gpa': round(percentage / 25, 2),  # Convert percentage to 4.0 scale
                        'gpa_scale': 4.0,
                        'original_percentage': percentage
                    }
                elif 'gpa' in groups:
                    gpa = float(match.group(groups['gpa']))
                    scale = float(match.group(groups['scale'])) if 'scale' in groups and len(match.groups()) >= groups['scale'] else pattern_obj.get('default_scale', 4.0)

                    # Normalize to 4.0 scale
                    normalized_gpa = (gpa / scale) * 4.0

                    return {
                        'gpa': round(gpa, 2),
                        'gpa_scale': scale,
                        'gpa_normalized': round(normalized_gpa, 2)
                    }
        return None

    def extract_gre(self, text: str) -> Optional[Dict[str, float]]:
        """Extract GRE scores from text"""
        gre_data = {}

        for pattern_obj in self.patterns['gre_patterns']:
            pattern = pattern_obj['pattern']
            match = re.search(pattern, text)
            if match:
                groups = pattern_obj.get('groups', {})
                if 'verbal' in groups and len(match.groups()) >= groups['verbal']:
                    gre_data['verbal'] = int(match.group(groups['verbal']))
                if 'quant' in groups and len(match.groups()) >= groups['quant']:
                    gre_data['quant'] = int(match.group(groups['quant']))
                if 'aw' in groups and len(match.groups()) >= groups['aw']:
                    gre_data['aw'] = float(match.group(groups['aw']))

        return gre_data if gre_data else None

    def extract_toefl(self, text: str) -> Optional[int]:
        """Extract TOEFL score from text"""
        for pattern_obj in self.patterns['toefl_patterns']:
            pattern = pattern_obj['pattern']
            match = re.search(pattern, text)
            if match:
                groups = pattern_obj.get('groups', {})
                toefl_group = groups.get('toefl', 1)
                return int(match.group(toefl_group))
        return None

    def extract_ielts(self, text: str) -> Optional[float]:
        """Extract IELTS score from text"""
        for pattern_obj in self.patterns['ielts_patterns']:
            pattern = pattern_obj['pattern']
            match = re.search(pattern, text)
            if match:
                groups = pattern_obj.get('groups', {})
                return float(match.group(groups['ielts']))
        return None

    def extract_research(self, text: str) -> Dict[str, Any]:
        """Extract research experience information"""
        research_data = {
            'publications': 0,
            'years_of_research': 0,
            'mentions': []
        }

        for pattern_obj in self.patterns['research_patterns']:
            pattern = pattern_obj['pattern']
            matches = re.finditer(pattern, text)
            for match in matches:
                groups = pattern_obj.get('groups', {})
                if 'count' in groups:
                    research_data['publications'] = max(research_data['publications'], int(match.group(groups['count'])))
                elif 'years' in groups:
                    research_data['years_of_research'] = max(research_data['years_of_research'], int(match.group(groups['years'])))
                elif 'value' in pattern_obj:
                    research_data['mentions'].append(pattern_obj['description'])

        return research_data

    def detect_international(self, text: str) -> bool:
        """Detect if student is international"""
        for pattern_obj in self.patterns['international_patterns']:
            pattern = pattern_obj['pattern']
            if re.search(pattern, text):
                return pattern_obj.get('value', True)
        return False

    def extract_institution(self, text: str) -> Optional[str]:
        """Extract undergraduate institution"""
        for pattern_obj in self.patterns['institution_patterns']:
            pattern = pattern_obj['pattern']
            match = re.search(pattern, text)
            if match:
                groups = pattern_obj.get('groups', {})
                if 'institution' in groups:
                    institution = match.group(groups['institution']).strip()
                    return institution
        return None

    def extract_funding(self, text: str) -> Dict[str, Any]:
        """Extract funding information"""
        funding_data = {
            'type': None,
            'amount': None,
            'mentions': []
        }

        for pattern_obj in self.patterns['funding_patterns']:
            pattern = pattern_obj['pattern']
            match = re.search(pattern, text)
            if match:
                if 'value' in pattern_obj:
                    funding_data['type'] = pattern_obj['value']
                    funding_data['mentions'].append(pattern_obj['description'])
                elif 'amount' in pattern_obj.get('groups', {}):
                    amount_str = match.group(pattern_obj['groups']['amount'])
                    funding_data['amount'] = int(amount_str.replace(',', ''))

        return funding_data

    def extract_all(self, text: str) -> Dict[str, Any]:
        """Extract all profile information from text"""
        profile = {}

        # Extract GPA
        gpa_data = self.extract_gpa(text)
        if gpa_data:
            profile.update(gpa_data)

        # Extract GRE
        gre_data = self.extract_gre(text)
        if gre_data:
            if 'verbal' in gre_data:
                profile['gre_verbal'] = gre_data['verbal']
            if 'quant' in gre_data:
                profile['gre_quant'] = gre_data['quant']
            if 'aw' in gre_data:
                profile['gre_aw'] = gre_data['aw']

        # Extract TOEFL
        toefl = self.extract_toefl(text)
        if toefl:
            profile['toefl'] = toefl

        # Extract IELTS
        ielts = self.extract_ielts(text)
        if ielts:
            profile['ielts'] = ielts

        # Extract research
        research = self.extract_research(text)
        if research['publications'] > 0:
            profile['research_pubs'] = research['publications']
        if research['years_of_research'] > 0:
            profile['research_years'] = research['years_of_research']
        if research['mentions']:
            profile['research_mentions'] = research['mentions']

        # Detect international status
        profile['is_international'] = self.detect_international(text)

        # Extract institution
        institution = self.extract_institution(text)
        if institution:
            profile['undergrad_institution'] = institution

        # Extract funding
        funding = self.extract_funding(text)
        if funding['type'] or funding['amount']:
            profile['funding_info'] = funding

        return profile


class GradCafeCheckpoint:
    """Manage scraping checkpoints for resume capability"""

    def __init__(self, checkpoint_file: str):
        self.checkpoint_file = Path(checkpoint_file)
        self.checkpoint_file.parent.mkdir(parents=True, exist_ok=True)
        self.data = self._load()

    def _load(self) -> Dict[str, Any]:
        """Load checkpoint data"""
        if self.checkpoint_file.exists():
            with open(self.checkpoint_file, 'r') as f:
                return json.load(f)
        return {
            'searches_completed': [],
            'current_search': None,
            'pages_scraped': {},
            'total_records': 0,
            'last_updated': None
        }

    def save(self):
        """Save checkpoint data"""
        self.data['last_updated'] = datetime.now().isoformat()
        with open(self.checkpoint_file, 'w') as f:
            json.dump(self.data, f, indent=2)

    def mark_search_complete(self, search_key: str):
        """Mark a search as completed"""
        if search_key not in self.data['searches_completed']:
            self.data['searches_completed'].append(search_key)
        self.save()

    def is_search_complete(self, search_key: str) -> bool:
        """Check if search is already completed"""
        return search_key in self.data['searches_completed']

    def update_page(self, search_key: str, page_num: int):
        """Update the last scraped page for a search"""
        self.data['pages_scraped'][search_key] = page_num
        self.save()

    def get_last_page(self, search_key: str) -> int:
        """Get the last scraped page for a search"""
        return self.data['pages_scraped'].get(search_key, 0)

    def increment_records(self, count: int = 1):
        """Increment total records count"""
        self.data['total_records'] += count
        self.save()


class GradCafeScraper:
    """Main scraper class for GradCafe data collection"""

    BASE_URL = "https://www.thegradcafe.com"
    SEARCH_URL = f"{BASE_URL}/survey/index.php"

    def __init__(self, config_file: str = "gradcafe_config.json"):
        config_path = Path(__file__).parent / config_file
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        self.profile_extractor = ProfileExtractor()
        self.setup_logging()
        self.setup_checkpoint()
        self.setup_mongodb()
        self.seen_hashes: Set[str] = set()

    def setup_logging(self):
        """Setup logging configuration"""
        log_file = Path(self.config['output']['log_file'])
        log_file.parent.mkdir(parents=True, exist_ok=True)

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)

    def setup_checkpoint(self):
        """Setup checkpoint manager"""
        checkpoint_file = self.config['output']['checkpoint_file']
        self.checkpoint = GradCafeCheckpoint(checkpoint_file)

    def setup_mongodb(self):
        """Setup MongoDB connection"""
        mongo_config = self.config['mongodb']
        self.mongo_client = MongoClient(mongo_config['uri'])
        self.db = self.mongo_client[mongo_config['database']]
        self.collection = self.db[mongo_config['collection']]

        # Create indexes
        self.collection.create_index([('hash', ASCENDING)], unique=True)
        self.collection.create_index([('university', ASCENDING), ('program', ASCENDING), ('season', ASCENDING)])
        self.collection.create_index([('decision', ASCENDING)])
        self.collection.create_index([('scraped_at', ASCENDING)])

        self.logger.info("MongoDB connection established")

    def generate_hash(self, record: Dict[str, Any]) -> str:
        """Generate unique hash for deduplication"""
        hash_string = f"{record.get('university', '')}_{record.get('program', '')}_{record.get('season', '')}_{record.get('decision', '')}_{record.get('post_content', '')[:100]}"
        return hashlib.sha256(hash_string.encode()).hexdigest()

    async def init_browser(self) -> Browser:
        """Initialize Playwright browser"""
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        return browser

    async def create_page(self, browser: Browser) -> Page:
        """Create a new page with configured settings"""
        page = await browser.new_page(
            user_agent=self.config['scraping_settings']['user_agent']
        )
        page.set_default_timeout(self.config['scraping_settings']['page_timeout'])
        return page

    def build_search_url(self, program: str = "", university: str = "", year: str = "", page: int = 1) -> str:
        """Build search URL with parameters"""
        params = {}

        if program:
            params['q'] = program
        if university:
            params['t'] = university
        if year:
            params['pp'] = year
        if page > 1:
            params['p'] = str(page)

        if params:
            return f"{self.SEARCH_URL}?{urlencode(params)}"
        return self.SEARCH_URL

    def generate_search_key(self, program: str = "", university: str = "", year: str = "") -> str:
        """Generate unique key for search"""
        return f"{program}_{university}_{year}".replace(" ", "_").lower()

    async def scrape_page(self, page: Page, url: str) -> List[Dict[str, Any]]:
        """Scrape a single page of results"""
        try:
            await page.goto(url, wait_until='networkidle')
            await asyncio.sleep(self.config['scraping_settings']['rate_limit_delay'])

            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')

            results = []

            # Find all result rows (adjust selectors based on actual HTML structure)
            # GradCafe uses table rows for results
            result_rows = soup.find_all('tr', class_='row0') + soup.find_all('tr', class_='row1')

            for row in result_rows:
                try:
                    record = self.parse_result_row(row)
                    if record:
                        results.append(record)
                except Exception as e:
                    self.logger.warning(f"Error parsing row: {e}")
                    continue

            return results

        except PlaywrightTimeout:
            self.logger.error(f"Timeout loading page: {url}")
            return []
        except Exception as e:
            self.logger.error(f"Error scraping page {url}: {e}")
            return []

    def parse_result_row(self, row) -> Optional[Dict[str, Any]]:
        """Parse a single result row"""
        try:
            cells = row.find_all('td')
            if len(cells) < 8:
                return None

            # Extract basic information (adjust indices based on actual structure)
            university = cells[0].get_text(strip=True) if len(cells) > 0 else ""
            program = cells[1].get_text(strip=True) if len(cells) > 1 else ""
            decision = cells[2].get_text(strip=True) if len(cells) > 2 else ""
            decision_method = cells[3].get_text(strip=True) if len(cells) > 3 else ""
            season = cells[4].get_text(strip=True) if len(cells) > 4 else ""
            decision_date = cells[5].get_text(strip=True) if len(cells) > 5 else ""
            post_date = cells[6].get_text(strip=True) if len(cells) > 6 else ""

            # Get the post content (student profile and comments)
            post_content = ""
            if len(cells) > 7:
                post_content = cells[7].get_text(separator=" ", strip=True)

            # Extract profile information from post content
            profile = self.profile_extractor.extract_all(post_content)

            # Extract funding information
            funding_info = self.profile_extractor.extract_funding(post_content)
            funding = funding_info.get('type') or ""

            # Create record
            record = {
                'university': university,
                'program': program,
                'decision': self.normalize_decision(decision),
                'decision_method': decision_method,
                'season': season,
                'decision_date': self.parse_date(decision_date),
                'post_date': self.parse_date(post_date),
                'profile': profile,
                'funding': funding,
                'funding_amount': funding_info.get('amount'),
                'post_content': post_content,
                'scraped_at': datetime.now().isoformat()
            }

            # Generate hash for deduplication
            record['hash'] = self.generate_hash(record)

            return record

        except Exception as e:
            self.logger.warning(f"Error parsing result row: {e}")
            return None

    def normalize_decision(self, decision: str) -> str:
        """Normalize decision strings"""
        decision_lower = decision.lower()

        if 'accept' in decision_lower or 'admit' in decision_lower:
            return "Accepted"
        elif 'reject' in decision_lower:
            return "Rejected"
        elif 'waitlist' in decision_lower:
            return "Waitlisted"
        elif 'pending' in decision_lower or 'wait' in decision_lower:
            return "Pending"
        else:
            return decision

    def parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string to ISO format"""
        if not date_str or date_str == "—":
            return None

        # Try common date formats
        date_formats = [
            "%d %b %Y",  # 15 Mar 2024
            "%b %d, %Y",  # Mar 15, 2024
            "%Y-%m-%d",  # 2024-03-15
            "%m/%d/%Y",  # 03/15/2024
        ]

        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                return parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                continue

        return None

    def save_to_json(self, records: List[Dict[str, Any]], filename: str):
        """Save records to JSON file"""
        output_dir = Path(self.config['output']['json_output_dir'])
        output_dir.mkdir(parents=True, exist_ok=True)

        filepath = output_dir / filename

        # Load existing data if file exists
        existing_data = []
        if filepath.exists():
            with open(filepath, 'r') as f:
                existing_data = json.load(f)

        # Append new records
        existing_data.extend(records)

        # Save
        with open(filepath, 'w') as f:
            json.dump(existing_data, f, indent=2)

        self.logger.info(f"Saved {len(records)} records to {filepath}")

    def save_to_mongodb(self, records: List[Dict[str, Any]]) -> int:
        """Save records to MongoDB"""
        saved_count = 0
        duplicate_count = 0

        for record in records:
            try:
                # Check if hash already seen in this session
                if record['hash'] in self.seen_hashes:
                    duplicate_count += 1
                    continue

                self.collection.insert_one(record)
                self.seen_hashes.add(record['hash'])
                saved_count += 1

            except DuplicateKeyError:
                duplicate_count += 1
                continue
            except Exception as e:
                self.logger.error(f"Error saving record to MongoDB: {e}")
                continue

        self.logger.info(f"Saved {saved_count} records to MongoDB ({duplicate_count} duplicates skipped)")
        return saved_count

    async def scrape_search(
        self,
        browser: Browser,
        program: str = "",
        university: str = "",
        year: str = "",
        progress: Optional[Progress] = None,
        task_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Scrape all pages for a specific search"""
        search_key = self.generate_search_key(program, university, year)

        # Check if already completed
        if self.checkpoint.is_search_complete(search_key):
            self.logger.info(f"Search already completed: {search_key}")
            return []

        all_results = []
        page_num = self.checkpoint.get_last_page(search_key) + 1
        max_pages = self.config['scraping_settings']['max_pages_per_search']

        page_obj = await self.create_page(browser)

        try:
            while page_num <= max_pages:
                url = self.build_search_url(program, university, year, page_num)

                if progress and task_id is not None:
                    progress.update(task_id, description=f"Scraping page {page_num} for {search_key}")

                self.logger.info(f"Scraping {url}")
                results = await self.scrape_page(page_obj, url)

                if not results:
                    self.logger.info(f"No more results for {search_key}")
                    break

                all_results.extend(results)

                # Save periodically
                if len(all_results) % self.config['scraping_settings']['checkpoint_frequency'] == 0:
                    saved = self.save_to_mongodb(all_results[-self.config['scraping_settings']['checkpoint_frequency']:])
                    self.checkpoint.increment_records(saved)
                    self.checkpoint.update_page(search_key, page_num)

                if progress and task_id is not None:
                    progress.update(task_id, advance=1)

                page_num += 1

                # Rate limiting
                await asyncio.sleep(self.config['scraping_settings']['rate_limit_delay'])

            # Mark search as complete
            self.checkpoint.mark_search_complete(search_key)

        finally:
            await page_obj.close()

        return all_results

    async def run_scraper(
        self,
        programs: Optional[List[str]] = None,
        universities: Optional[List[str]] = None,
        years: Optional[List[str]] = None,
        resume: bool = False
    ):
        """Run the scraper with specified parameters"""
        console.print("[bold blue]Starting GradCafe Scraper[/bold blue]")

        # Use config defaults if not specified
        if programs is None:
            programs = self.config['search_parameters']['programs']
        if universities is None:
            universities = [""]  # Empty string for all universities
        if years is None:
            year_range = self.config['search_parameters']['years']
            years = [str(y) for y in range(year_range['start'], year_range['end'] + 1)]

        # Generate search combinations
        searches = []
        for program in programs:
            for university in universities:
                for year in years:
                    search_key = self.generate_search_key(program, university, year)
                    if resume or not self.checkpoint.is_search_complete(search_key):
                        searches.append((program, university, year))

        console.print(f"[yellow]Total searches to perform: {len(searches)}[/yellow]")

        browser = await self.init_browser()

        try:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TaskProgressColumn(),
                console=console
            ) as progress:

                main_task = progress.add_task("[cyan]Overall progress", total=len(searches))

                for program, university, year in searches:
                    search_desc = f"{program} @ {university if university else 'All'} ({year})"
                    progress.update(main_task, description=f"Scraping: {search_desc}")

                    results = await self.scrape_search(
                        browser,
                        program,
                        university,
                        year,
                        progress=progress,
                        task_id=main_task
                    )

                    if results:
                        # Save to MongoDB
                        saved = self.save_to_mongodb(results)
                        self.checkpoint.increment_records(saved)

                        # Also save to JSON
                        json_filename = f"{self.generate_search_key(program, university, year)}.json"
                        self.save_to_json(results, json_filename)

                    progress.update(main_task, advance=1)

        finally:
            await browser.close()

        self.print_statistics()

    def print_statistics(self):
        """Print scraping statistics"""
        table = Table(title="Scraping Statistics")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")

        total_records = self.collection.count_documents({})
        total_accepted = self.collection.count_documents({'decision': 'Accepted'})
        total_rejected = self.collection.count_documents({'decision': 'Rejected'})
        total_waitlisted = self.collection.count_documents({'decision': 'Waitlisted'})

        table.add_row("Total Records", str(total_records))
        table.add_row("Accepted", str(total_accepted))
        table.add_row("Rejected", str(total_rejected))
        table.add_row("Waitlisted", str(total_waitlisted))
        table.add_row("Searches Completed", str(len(self.checkpoint.data['searches_completed'])))

        console.print(table)

        # Top universities
        top_unis = self.collection.aggregate([
            {'$group': {'_id': '$university', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ])

        uni_table = Table(title="Top 10 Universities")
        uni_table.add_column("University", style="cyan")
        uni_table.add_column("Records", style="green")

        for uni in top_unis:
            uni_table.add_row(uni['_id'], str(uni['count']))

        console.print(uni_table)

    def export_to_json(self, output_file: str, query: Optional[Dict] = None):
        """Export data to JSON file"""
        query = query or {}
        records = list(self.collection.find(query, {'_id': 0}))

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(records, f, indent=2)

        console.print(f"[green]Exported {len(records)} records to {output_file}[/green]")


@click.group()
def cli():
    """GradCafe Scraper - Collect admission data from thegradcafe.com"""
    pass


@cli.command()
@click.option('--program', '-p', multiple=True, help='Program to search (e.g., cs, engineering)')
@click.option('--university', '-u', multiple=True, help='University to search')
@click.option('--years', '-y', help='Year range (e.g., 2020-2024)')
@click.option('--resume', '-r', is_flag=True, help='Resume from last checkpoint')
@click.option('--all-programs', is_flag=True, help='Search all configured programs')
def scrape(program, university, years, resume, all_programs):
    """Run the scraper"""
    scraper = GradCafeScraper()

    # Parse parameters
    programs = list(program) if program else None
    universities = list(university) if university else None

    if all_programs:
        programs = scraper.config['search_parameters']['programs']

    year_list = None
    if years:
        if '-' in years:
            start, end = years.split('-')
            year_list = [str(y) for y in range(int(start), int(end) + 1)]
        else:
            year_list = [years]

    # Run scraper
    asyncio.run(scraper.run_scraper(
        programs=programs,
        universities=universities,
        years=year_list,
        resume=resume
    ))


@cli.command()
@click.option('--output', '-o', required=True, help='Output JSON file')
@click.option('--university', '-u', help='Filter by university')
@click.option('--program', '-p', help='Filter by program')
@click.option('--decision', '-d', help='Filter by decision')
def export(output, university, program, decision):
    """Export data to JSON"""
    scraper = GradCafeScraper()

    query = {}
    if university:
        query['university'] = {'$regex': university, '$options': 'i'}
    if program:
        query['program'] = {'$regex': program, '$options': 'i'}
    if decision:
        query['decision'] = decision

    scraper.export_to_json(output, query)


@cli.command()
def stats():
    """Show scraping statistics"""
    scraper = GradCafeScraper()
    scraper.print_statistics()


@cli.command()
def reset():
    """Reset checkpoint (start fresh)"""
    if click.confirm('Are you sure you want to reset the checkpoint?'):
        scraper = GradCafeScraper()
        scraper.checkpoint.data = {
            'searches_completed': [],
            'current_search': None,
            'pages_scraped': {},
            'total_records': 0,
            'last_updated': None
        }
        scraper.checkpoint.save()
        console.print("[green]Checkpoint reset successfully[/green]")


if __name__ == '__main__':
    cli()
