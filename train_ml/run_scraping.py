"""
Master Orchestrator CLI

Unified command-line interface for running all scraping and data processing operations:
- Run all scrapers sequentially or in parallel
- Monitor progress
- Aggregate results
- Generate reports
"""

import asyncio
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import json
import argparse

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint
from rich.logging import RichHandler

# Import local modules
from data_cleaner import DataCleaner, clean_csv_file
from data_aggregator import DataAggregator
from prepare_ml_data import MLDataPreparator

# Configure logging with Rich
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger(__name__)

console = Console()


class ScrapingOrchestrator:
    """
    Master orchestrator for all scraping and data processing operations
    """

    def __init__(self, config_file: str = "config.yaml"):
        """
        Initialize orchestrator

        Args:
            config_file: Path to configuration file
        """
        self.config_file = config_file
        self.config = self.load_config()
        self.results = {}
        self.errors = []

        console.print(f"[bold green]Scraping Orchestrator initialized[/bold green]")

    def load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        import yaml

        config_path = Path(self.config_file)

        if not config_path.exists():
            console.print(f"[yellow]Config file {self.config_file} not found. Using defaults.[/yellow]")
            return self.get_default_config()

        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)

        console.print(f"[green]Loaded configuration from {self.config_file}[/green]")
        return config

    def get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            'mongodb': {
                'uri': 'mongodb://localhost:27017',
                'db_name': 'edulens'
            },
            'redis': {
                'url': 'redis://localhost:6379/0'
            },
            'output': {
                'raw_data_dir': 'data/raw',
                'clean_data_dir': 'data/clean',
                'aggregated_dir': 'data/aggregated',
                'ml_ready_dir': 'data/ml_ready'
            },
            'faculty_scraping': {
                'universities': []
            },
            'gradcafe_scraping': {
                'queries': []
            },
            'reddit_scraping': {
                'subreddits': ['gradadmissions', 'gradschool', 'ApplyingToCollege'],
                'keywords': ['admission', 'acceptance', 'rejection', 'GRE', 'GPA']
            }
        }

    async def run_faculty_scraping(self) -> Dict[str, Any]:
        """Run faculty scraping"""
        console.print("\n[bold cyan]Running Faculty Scraping...[/bold cyan]")

        try:
            # Import scraping service
            sys.path.insert(0, str(Path(__file__).parent.parent / 'ai_service'))
            from app.services.faculty_scraping_service import faculty_scraping_service

            universities = self.config.get('faculty_scraping', {}).get('universities', [])

            if not universities:
                console.print("[yellow]No universities configured for faculty scraping[/yellow]")
                return {'status': 'skipped', 'reason': 'no universities configured'}

            results = []

            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                TimeElapsedColumn(),
                console=console
            ) as progress:

                task = progress.add_task(
                    "[cyan]Scraping universities...",
                    total=len(universities)
                )

                for uni in universities:
                    progress.update(
                        task,
                        description=f"[cyan]Scraping {uni.get('university_name', 'Unknown')}..."
                    )

                    try:
                        await faculty_scraping_service.initialize()

                        result = await faculty_scraping_service.scrape_and_extract_faculty(
                            url=uni['url'],
                            university_id=uni['university_id'],
                            university_name=uni['university_name'],
                            department=uni['department'],
                            use_crawl=uni.get('use_crawl', False),
                            max_pages=uni.get('max_pages', 20)
                        )

                        await faculty_scraping_service.save_faculty_data(result, overwrite=True)

                        results.append({
                            'university': uni['university_name'],
                            'faculty_count': result['totalFaculty'],
                            'status': 'success'
                        })

                        console.print(
                            f"[green]✓[/green] {uni['university_name']}: {result['totalFaculty']} faculty"
                        )

                    except Exception as e:
                        error_msg = f"Error scraping {uni['university_name']}: {str(e)}"
                        logger.error(error_msg)
                        self.errors.append(error_msg)

                        results.append({
                            'university': uni['university_name'],
                            'status': 'error',
                            'error': str(e)
                        })

                    progress.advance(task)

            return {
                'status': 'completed',
                'universities_scraped': len(results),
                'results': results
            }

        except Exception as e:
            error_msg = f"Faculty scraping failed: {str(e)}"
            logger.error(error_msg)
            self.errors.append(error_msg)
            return {'status': 'failed', 'error': str(e)}

    async def run_gradcafe_scraping(self) -> Dict[str, Any]:
        """Run GradCafe scraping (placeholder)"""
        console.print("\n[bold cyan]Running GradCafe Scraping...[/bold cyan]")
        console.print("[yellow]GradCafe scraper not implemented yet[/yellow]")

        return {
            'status': 'skipped',
            'reason': 'not implemented'
        }

    async def run_reddit_scraping(self) -> Dict[str, Any]:
        """Run Reddit scraping (placeholder)"""
        console.print("\n[bold cyan]Running Reddit Scraping...[/bold cyan]")
        console.print("[yellow]Reddit scraper not implemented yet[/yellow]")

        return {
            'status': 'skipped',
            'reason': 'not implemented'
        }

    async def aggregate_data(self) -> Dict[str, Any]:
        """Aggregate all scraped data"""
        console.print("\n[bold cyan]Aggregating Data...[/bold cyan]")

        try:
            mongodb_uri = self.config['mongodb']['uri']
            db_name = self.config['mongodb']['db_name']
            output_dir = self.config['output']['aggregated_dir']

            aggregator = DataAggregator(mongodb_uri, db_name)

            with console.status("[bold green]Fetching data from MongoDB..."):
                admission_df, faculty_df, summary = await aggregator.aggregate_all_data(output_dir)

            console.print(f"[green]✓[/green] Aggregated {len(admission_df)} admission records")
            console.print(f"[green]✓[/green] Aggregated {len(faculty_df)} faculty records")

            return {
                'status': 'completed',
                'admission_records': len(admission_df),
                'faculty_records': len(faculty_df),
                'output_dir': output_dir
            }

        except Exception as e:
            error_msg = f"Data aggregation failed: {str(e)}"
            logger.error(error_msg)
            self.errors.append(error_msg)
            return {'status': 'failed', 'error': str(e)}

    def clean_data(self, input_file: str, output_file: str) -> Dict[str, Any]:
        """Clean aggregated data"""
        console.print("\n[bold cyan]Cleaning Data...[/bold cyan]")

        try:
            with console.status("[bold green]Cleaning data..."):
                stats = clean_csv_file(input_file, output_file, remove_invalid=True)

            console.print(f"[green]✓[/green] Cleaned {stats['cleaned_records']} records")
            console.print(f"[green]✓[/green] Removed {stats['duplicates_removed']} duplicates")

            return {
                'status': 'completed',
                'stats': stats,
                'output_file': output_file
            }

        except Exception as e:
            error_msg = f"Data cleaning failed: {str(e)}"
            logger.error(error_msg)
            self.errors.append(error_msg)
            return {'status': 'failed', 'error': str(e)}

    def prepare_ml_data(self, input_file: str, output_dir: str) -> Dict[str, Any]:
        """Prepare ML-ready dataset"""
        console.print("\n[bold cyan]Preparing ML Dataset...[/bold cyan]")

        try:
            preparator = MLDataPreparator()

            with console.status("[bold green]Engineering features and preparing datasets..."):
                summary = preparator.prepare_ml_dataset(
                    input_file=input_file,
                    output_dir=output_dir,
                    generate_viz=True
                )

            console.print(f"[green]✓[/green] Prepared ML dataset with {summary['metadata']['total_samples']} samples")
            console.print(f"[green]✓[/green] Features: {len(summary['metadata']['feature_names'])}")

            return summary

        except Exception as e:
            error_msg = f"ML data preparation failed: {str(e)}"
            logger.error(error_msg)
            self.errors.append(error_msg)
            return {'status': 'failed', 'error': str(e)}

    async def run_all(self, parallel: bool = False) -> Dict[str, Any]:
        """
        Run all scraping and processing tasks

        Args:
            parallel: Whether to run scrapers in parallel

        Returns:
            Summary of all operations
        """
        start_time = time.time()

        console.print(Panel.fit(
            "[bold green]🚀 Starting Data Collection & Processing Pipeline[/bold green]",
            border_style="green"
        ))

        # Step 1: Scraping
        if parallel:
            console.print("\n[bold]Running scrapers in parallel...[/bold]")
            scraping_tasks = [
                self.run_faculty_scraping(),
                self.run_gradcafe_scraping(),
                self.run_reddit_scraping()
            ]
            scraping_results = await asyncio.gather(*scraping_tasks, return_exceptions=True)

            self.results['faculty_scraping'] = scraping_results[0] if not isinstance(scraping_results[0], Exception) else {'status': 'failed', 'error': str(scraping_results[0])}
            self.results['gradcafe_scraping'] = scraping_results[1] if not isinstance(scraping_results[1], Exception) else {'status': 'failed', 'error': str(scraping_results[1])}
            self.results['reddit_scraping'] = scraping_results[2] if not isinstance(scraping_results[2], Exception) else {'status': 'failed', 'error': str(scraping_results[2])}
        else:
            console.print("\n[bold]Running scrapers sequentially...[/bold]")
            self.results['faculty_scraping'] = await self.run_faculty_scraping()
            self.results['gradcafe_scraping'] = await self.run_gradcafe_scraping()
            self.results['reddit_scraping'] = await self.run_reddit_scraping()

        # Step 2: Aggregation
        self.results['aggregation'] = await self.aggregate_data()

        # Step 3: Data Cleaning (if aggregation succeeded)
        if self.results['aggregation'].get('status') == 'completed':
            # Find most recent aggregated file
            aggregated_dir = Path(self.config['output']['aggregated_dir'])
            admission_files = sorted(aggregated_dir.glob('admission_data_*.csv'), reverse=True)

            if admission_files:
                input_file = str(admission_files[0])
                output_file = str(Path(self.config['output']['clean_data_dir']) / f"clean_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")

                self.results['cleaning'] = self.clean_data(input_file, output_file)

                # Step 4: ML Preparation (if cleaning succeeded)
                if self.results['cleaning'].get('status') == 'completed':
                    ml_output_dir = self.config['output']['ml_ready_dir']
                    self.results['ml_preparation'] = self.prepare_ml_data(output_file, ml_output_dir)

        elapsed_time = time.time() - start_time

        # Generate summary report
        self.print_summary_report(elapsed_time)

        return self.results

    def print_summary_report(self, elapsed_time: float):
        """Print summary report of all operations"""

        console.print("\n")
        console.print(Panel.fit(
            "[bold green]📊 Pipeline Execution Summary[/bold green]",
            border_style="green"
        ))

        # Create results table
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Stage", style="cyan")
        table.add_column("Status", justify="center")
        table.add_column("Details")

        for stage, result in self.results.items():
            status = result.get('status', 'unknown')

            if status == 'completed':
                status_text = "[green]✓ Completed[/green]"
            elif status == 'failed':
                status_text = "[red]✗ Failed[/red]"
            elif status == 'skipped':
                status_text = "[yellow]⊘ Skipped[/yellow]"
            else:
                status_text = "[dim]? Unknown[/dim]"

            details = []
            if 'universities_scraped' in result:
                details.append(f"Universities: {result['universities_scraped']}")
            if 'admission_records' in result:
                details.append(f"Admission: {result['admission_records']}")
            if 'faculty_records' in result:
                details.append(f"Faculty: {result['faculty_records']}")
            if 'error' in result:
                details.append(f"Error: {result['error'][:50]}...")

            table.add_row(
                stage.replace('_', ' ').title(),
                status_text,
                ", ".join(details) if details else "-"
            )

        console.print(table)

        # Print errors if any
        if self.errors:
            console.print("\n[bold red]Errors:[/bold red]")
            for error in self.errors:
                console.print(f"  [red]•[/red] {error}")

        console.print(f"\n[bold]Total execution time:[/bold] {elapsed_time:.2f} seconds")

        # Save report to file
        report_file = Path(self.config['output']['aggregated_dir']) / f"pipeline_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_file.parent.mkdir(parents=True, exist_ok=True)

        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'elapsed_time_seconds': elapsed_time,
            'results': self.results,
            'errors': self.errors
        }

        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        console.print(f"\n[dim]Report saved to: {report_file}[/dim]")


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Data Collection and Processing Orchestrator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run all scrapers sequentially
  python run_scraping.py --all

  # Run specific scraper
  python run_scraping.py --scraper faculty

  # Run all in parallel
  python run_scraping.py --all --parallel

  # Custom config
  python run_scraping.py --all --config custom_config.yaml
        """
    )

    parser.add_argument('--all', action='store_true', help='Run complete pipeline')
    parser.add_argument('--scraper', choices=['faculty', 'gradcafe', 'reddit'],
                       help='Run specific scraper')
    parser.add_argument('--aggregate', action='store_true', help='Run data aggregation only')
    parser.add_argument('--clean', help='Clean data from specified file')
    parser.add_argument('--prepare-ml', help='Prepare ML dataset from cleaned file')
    parser.add_argument('--config', default='config.yaml', help='Configuration file')
    parser.add_argument('--parallel', action='store_true', help='Run scrapers in parallel')

    args = parser.parse_args()

    orchestrator = ScrapingOrchestrator(args.config)

    if args.all:
        await orchestrator.run_all(parallel=args.parallel)

    elif args.scraper:
        if args.scraper == 'faculty':
            result = await orchestrator.run_faculty_scraping()
        elif args.scraper == 'gradcafe':
            result = await orchestrator.run_gradcafe_scraping()
        elif args.scraper == 'reddit':
            result = await orchestrator.run_reddit_scraping()

        console.print(f"\n[bold]Result:[/bold] {json.dumps(result, indent=2)}")

    elif args.aggregate:
        result = await orchestrator.aggregate_data()
        console.print(f"\n[bold]Result:[/bold] {json.dumps(result, indent=2)}")

    elif args.clean:
        output_file = args.clean.replace('.csv', '_clean.csv')
        result = orchestrator.clean_data(args.clean, output_file)
        console.print(f"\n[bold]Result:[/bold] {json.dumps(result, indent=2)}")

    elif args.prepare_ml:
        output_dir = 'data/ml_ready'
        result = orchestrator.prepare_ml_data(args.prepare_ml, output_dir)
        console.print(f"\n[bold]Result:[/bold] {json.dumps(result, indent=2, default=str)}")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
