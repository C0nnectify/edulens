"""
Data Aggregation Module

Combines data from multiple sources:
- Faculty scraping results
- GradCafe data
- Reddit scraping data
- Manual data entry

Performs:
- Deduplication across sources
- Cross-referencing
- Statistical calculations
- Data merging and enrichment
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path
import pandas as pd
import numpy as np
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from dataclasses import dataclass, asdict
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class AggregationStats:
    """Statistics from data aggregation process"""
    faculty_records: int = 0
    gradcafe_records: int = 0
    reddit_records: int = 0
    total_input_records: int = 0
    merged_records: int = 0
    duplicates_removed: int = 0
    universities_count: int = 0
    programs_count: int = 0
    acceptance_rate_calculated: int = 0


class DataAggregator:
    """
    Aggregate and merge data from multiple sources
    """

    def __init__(self, mongodb_uri: str = "mongodb://localhost:27017", db_name: str = "edulens"):
        """
        Initialize data aggregator

        Args:
            mongodb_uri: MongoDB connection URI
            db_name: Database name
        """
        self.mongodb_uri = mongodb_uri
        self.db_name = db_name
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.stats = AggregationStats()

        logger.info("DataAggregator initialized")

    async def connect(self):
        """Connect to MongoDB"""
        self.client = AsyncIOMotorClient(self.mongodb_uri)
        self.db = self.client[self.db_name]
        logger.info(f"Connected to MongoDB: {self.db_name}")

    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

    async def fetch_faculty_data(self) -> pd.DataFrame:
        """
        Fetch faculty data from MongoDB

        Returns:
            DataFrame with faculty information
        """
        logger.info("Fetching faculty data from MongoDB...")

        collection = self.db["faculty_database"]
        cursor = collection.find({})

        records = []
        async for doc in cursor:
            university_id = doc.get('universityId', 'unknown')
            university_name = doc.get('universityName', 'Unknown')
            department = doc.get('department', 'Unknown')

            # Flatten faculty members
            for faculty in doc.get('faculty', []):
                records.append({
                    'source': 'faculty_scraping',
                    'university_id': university_id,
                    'university': university_name,
                    'department': department,
                    'faculty_name': faculty.get('name'),
                    'faculty_title': faculty.get('title'),
                    'faculty_email': faculty.get('email'),
                    'research_areas': faculty.get('researchAreas', []),
                    'website': faculty.get('website'),
                    'scraped_at': doc.get('scrapedAt'),
                })

        df = pd.DataFrame(records)
        self.stats.faculty_records = len(df)
        logger.info(f"Fetched {len(df)} faculty records")

        return df

    async def fetch_admission_data(self) -> pd.DataFrame:
        """
        Fetch admission data from MongoDB

        Returns:
            DataFrame with admission records
        """
        logger.info("Fetching admission data from MongoDB...")

        collection = self.db["admission_data"]
        cursor = collection.find({})

        records = []
        async for doc in cursor:
            profile = doc.get('profile', {})
            program = doc.get('program', {})

            # Extract test scores
            test_scores = profile.get('test_scores', [])
            gre_verbal = gre_quant = gmat = toefl = ielts = None

            for test in test_scores:
                if test.get('test_type') == 'GRE':
                    gre_verbal = test.get('verbal_score')
                    gre_quant = test.get('quantitative_score')
                elif test.get('test_type') == 'GMAT':
                    gmat = test.get('total_score')
                elif test.get('test_type') == 'TOEFL':
                    toefl = test.get('total_score')
                elif test.get('test_type') == 'IELTS':
                    ielts = test.get('total_score')

            records.append({
                'source': doc.get('source', 'gradcafe'),
                'university': program.get('university_name'),
                'program': program.get('program_name'),
                'degree': program.get('degree_level'),
                'gpa': profile.get('gpa'),
                'gpa_scale': profile.get('gpa_scale', 4.0),
                'gre_verbal': gre_verbal,
                'gre_quant': gre_quant,
                'gmat': gmat,
                'toefl': toefl,
                'ielts': ielts,
                'decision': doc.get('decision'),
                'semester': doc.get('semester'),
                'year': doc.get('application_year'),
                'research_publications': profile.get('research_publications', 0),
                'work_experience': profile.get('work_experience_months', 0),
                'added_at': doc.get('submission_date'),
            })

        df = pd.DataFrame(records)

        # Count by source
        if 'source' in df.columns:
            source_counts = df['source'].value_counts().to_dict()
            self.stats.gradcafe_records = source_counts.get('gradcafe', 0)
            self.stats.reddit_records = source_counts.get('reddit', 0)

        logger.info(f"Fetched {len(df)} admission records")

        return df

    def merge_duplicate_universities(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Merge duplicate universities with slightly different names

        Args:
            df: DataFrame with university column

        Returns:
            DataFrame with merged universities
        """
        logger.info("Merging duplicate universities...")

        if 'university' not in df.columns:
            return df

        # Get unique universities
        universities = df['university'].dropna().unique()

        # Group similar universities
        from fuzzywuzzy import fuzz, process

        merged = {}
        processed = set()

        for uni in universities:
            if uni in processed:
                continue

            # Find similar universities
            matches = process.extract(uni, universities, scorer=fuzz.token_sort_ratio, limit=10)

            # Group universities with >90% similarity
            similar = [match[0] for match in matches if match[1] > 90 and match[0] not in processed]

            if len(similar) > 1:
                # Use shortest name as canonical
                canonical = min(similar, key=len)

                for sim_uni in similar:
                    merged[sim_uni] = canonical
                    processed.add(sim_uni)

        # Apply merging
        if merged:
            df['university'] = df['university'].replace(merged)
            logger.info(f"Merged {len(merged)} duplicate university names")

        return df

    def cross_reference_faculty_programs(
        self,
        admission_df: pd.DataFrame,
        faculty_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Cross-reference admission data with faculty information

        Args:
            admission_df: Admission records
            faculty_df: Faculty records

        Returns:
            Enriched admission DataFrame
        """
        logger.info("Cross-referencing admission data with faculty...")

        if faculty_df.empty:
            logger.warning("No faculty data available for cross-referencing")
            return admission_df

        # Create faculty lookup by university and research area
        faculty_by_university = defaultdict(list)

        for _, row in faculty_df.iterrows():
            university = row.get('university')
            research_areas = row.get('research_areas', [])

            if university and research_areas:
                for area in research_areas:
                    faculty_by_university[university].append({
                        'name': row.get('faculty_name'),
                        'research_area': area,
                        'email': row.get('faculty_email'),
                    })

        # Enrich admission data
        admission_df['faculty_count'] = admission_df['university'].apply(
            lambda x: len(faculty_by_university.get(x, []))
        )

        # Add research area matches (would need program field mapping)
        logger.info(f"Cross-referenced {len(faculty_by_university)} universities")

        return admission_df

    def calculate_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate aggregate statistics

        Args:
            df: Admission DataFrame

        Returns:
            Dictionary of statistics
        """
        logger.info("Calculating aggregate statistics...")

        stats = {}

        # Overall statistics
        stats['total_records'] = len(df)
        stats['universities_count'] = df['university'].nunique() if 'university' in df.columns else 0
        stats['programs_count'] = df['program'].nunique() if 'program' in df.columns else 0

        # Decision distribution
        if 'decision' in df.columns:
            stats['decision_distribution'] = df['decision'].value_counts().to_dict()

        # Calculate acceptance rates by university
        if 'university' in df.columns and 'decision' in df.columns:
            acceptance_rates = {}

            for university in df['university'].dropna().unique():
                uni_data = df[df['university'] == university]
                total = len(uni_data)
                accepted = len(uni_data[uni_data['decision'].str.lower() == 'accepted'])

                if total > 0:
                    acceptance_rates[university] = {
                        'total_applications': total,
                        'accepted': accepted,
                        'acceptance_rate': round(accepted / total, 3)
                    }

            stats['acceptance_rates'] = acceptance_rates
            self.stats.acceptance_rate_calculated = len(acceptance_rates)

        # GPA statistics
        if 'gpa' in df.columns:
            stats['gpa_stats'] = {
                'mean': round(df['gpa'].mean(), 2),
                'median': round(df['gpa'].median(), 2),
                'std': round(df['gpa'].std(), 2),
                'min': round(df['gpa'].min(), 2),
                'max': round(df['gpa'].max(), 2),
            }

        # Test score statistics
        for test in ['gre_verbal', 'gre_quant', 'gmat', 'toefl', 'ielts']:
            if test in df.columns:
                test_data = df[test].dropna()
                if not test_data.empty:
                    stats[f'{test}_stats'] = {
                        'mean': round(test_data.mean(), 2),
                        'median': round(test_data.median(), 2),
                        'std': round(test_data.std(), 2),
                        'min': round(test_data.min(), 2),
                        'max': round(test_data.max(), 2),
                    }

        # Year distribution
        if 'year' in df.columns:
            stats['year_distribution'] = df['year'].value_counts().to_dict()

        logger.info("Statistics calculation complete")

        return stats

    def generate_dataset_summary(
        self,
        admission_df: pd.DataFrame,
        faculty_df: pd.DataFrame,
        stats: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive dataset summary

        Args:
            admission_df: Admission records
            faculty_df: Faculty records
            stats: Calculated statistics

        Returns:
            Summary dictionary
        """
        summary = {
            'generated_at': datetime.utcnow().isoformat(),
            'data_sources': {
                'faculty_records': len(faculty_df),
                'admission_records': len(admission_df),
            },
            'aggregation_stats': asdict(self.stats),
            'statistics': stats,
            'data_quality': {
                'missing_gpa': admission_df['gpa'].isna().sum() if 'gpa' in admission_df.columns else 0,
                'missing_university': admission_df['university'].isna().sum() if 'university' in admission_df.columns else 0,
                'missing_decision': admission_df['decision'].isna().sum() if 'decision' in admission_df.columns else 0,
            }
        }

        return summary

    async def aggregate_all_data(
        self,
        output_dir: str = "data/aggregated"
    ) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
        """
        Aggregate all data from MongoDB

        Args:
            output_dir: Directory to save aggregated data

        Returns:
            Tuple of (admission_df, faculty_df, summary)
        """
        logger.info("Starting data aggregation...")

        # Connect to MongoDB
        await self.connect()

        try:
            # Fetch data
            admission_df = await self.fetch_admission_data()
            faculty_df = await self.fetch_faculty_data()

            self.stats.total_input_records = len(admission_df) + len(faculty_df)

            # Merge duplicate universities
            admission_df = self.merge_duplicate_universities(admission_df)

            # Cross-reference with faculty
            admission_df = self.cross_reference_faculty_programs(admission_df, faculty_df)

            # Calculate statistics
            stats = self.calculate_statistics(admission_df)

            # Generate summary
            summary = self.generate_dataset_summary(admission_df, faculty_df, stats)

            # Update stats
            self.stats.merged_records = len(admission_df)
            self.stats.universities_count = stats.get('universities_count', 0)
            self.stats.programs_count = stats.get('programs_count', 0)

            # Save to files
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)

            admission_file = output_path / f"admission_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            faculty_file = output_path / f"faculty_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            summary_file = output_path / f"summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

            admission_df.to_csv(admission_file, index=False)
            faculty_df.to_csv(faculty_file, index=False)

            import json
            with open(summary_file, 'w') as f:
                json.dump(summary, f, indent=2, default=str)

            logger.info(f"Saved aggregated data to {output_dir}")
            logger.info(f"Admission records: {len(admission_df)}")
            logger.info(f"Faculty records: {len(faculty_df)}")

            return admission_df, faculty_df, summary

        finally:
            await self.close()


async def aggregate_data_cli(
    mongodb_uri: str,
    db_name: str,
    output_dir: str
):
    """
    CLI function to aggregate data

    Args:
        mongodb_uri: MongoDB connection URI
        db_name: Database name
        output_dir: Output directory
    """
    aggregator = DataAggregator(mongodb_uri, db_name)

    admission_df, faculty_df, summary = await aggregator.aggregate_all_data(output_dir)

    # Print summary
    print("\n" + "="*50)
    print("DATA AGGREGATION SUMMARY")
    print("="*50)
    print(f"Total admission records: {len(admission_df)}")
    print(f"Total faculty records: {len(faculty_df)}")
    print(f"Universities: {summary['statistics'].get('universities_count', 0)}")
    print(f"Programs: {summary['statistics'].get('programs_count', 0)}")
    print("="*50 + "\n")

    return summary


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Aggregate admission and faculty data')
    parser.add_argument('--mongodb-uri', default='mongodb://localhost:27017',
                       help='MongoDB connection URI')
    parser.add_argument('--db-name', default='edulens',
                       help='Database name')
    parser.add_argument('--output-dir', default='data/aggregated',
                       help='Output directory')

    args = parser.parse_args()

    # Run aggregation
    summary = asyncio.run(
        aggregate_data_cli(args.mongodb_uri, args.db_name, args.output_dir)
    )

    print("Aggregation complete!")
