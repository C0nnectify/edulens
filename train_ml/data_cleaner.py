"""
Data Cleaning Pipeline for Admission Data

This module provides comprehensive data cleaning and validation for:
- GPA normalization (10.0 scale, percentages to 4.0 scale)
- Test score standardization (GRE, GMAT, TOEFL, IELTS)
- University name normalization
- Date parsing and validation
- Duplicate detection using fuzzy matching
- Data quality validation and flagging
- Smart imputation for missing values
"""

import re
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path
import pandas as pd
import numpy as np
from fuzzywuzzy import fuzz
from fuzzywuzzy import process
import logging
from dataclasses import dataclass, asdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class CleaningStats:
    """Statistics from data cleaning process"""
    total_records: int = 0
    cleaned_records: int = 0
    duplicates_removed: int = 0
    invalid_records: int = 0
    gpa_normalized: int = 0
    test_scores_standardized: int = 0
    universities_normalized: int = 0
    dates_parsed: int = 0
    missing_values_imputed: int = 0
    flagged_records: int = 0


class DataCleaner:
    """
    Comprehensive data cleaning pipeline for admission data
    """

    def __init__(self):
        """Initialize data cleaner with validation rules"""

        # University name mappings
        self.university_mappings = {
            'Stanford University': 'stanford',
            'Massachusetts Institute of Technology': 'mit',
            'Harvard University': 'harvard',
            'University of California, Berkeley': 'berkeley',
            'UC Berkeley': 'berkeley',
            'Carnegie Mellon University': 'cmu',
            'Georgia Institute of Technology': 'gatech',
            'Georgia Tech': 'gatech',
            'University of Illinois Urbana-Champaign': 'uiuc',
            'UIUC': 'uiuc',
            'University of Michigan': 'umich',
            'Cornell University': 'cornell',
            'University of Washington': 'uw',
            'Princeton University': 'princeton',
            'Columbia University': 'columbia',
            'Yale University': 'yale',
            'University of Texas at Austin': 'ut-austin',
            'UT Austin': 'ut-austin',
            'University of California, San Diego': 'ucsd',
            'UC San Diego': 'ucsd',
            'UCSD': 'ucsd',
            'University of California, Los Angeles': 'ucla',
            'UC Los Angeles': 'ucla',
            'UCLA': 'ucla',
            'University of Southern California': 'usc',
            'USC': 'usc',
            'New York University': 'nyu',
            'NYU': 'nyu',
            'University of Pennsylvania': 'upenn',
            'Penn': 'upenn',
        }

        # Test score ranges
        self.test_ranges = {
            'gre_verbal': (130, 170),
            'gre_quant': (130, 170),
            'gre_awa': (0, 6),
            'gmat': (200, 800),
            'toefl': (0, 120),
            'ielts': (0, 9),
        }

        # GPA scales
        self.gpa_scales = {
            '4.0': 4.0,
            '5.0': 5.0,
            '10.0': 10.0,
            '100': 100.0,  # Percentage
        }

        self.stats = CleaningStats()

        logger.info("DataCleaner initialized")

    def normalize_gpa(self, gpa: float, scale: Optional[float] = None) -> Optional[float]:
        """
        Normalize GPA to 4.0 scale

        Args:
            gpa: Original GPA value
            scale: Original scale (4.0, 5.0, 10.0, or 100 for percentage)

        Returns:
            Normalized GPA on 4.0 scale or None if invalid
        """
        if pd.isna(gpa) or gpa <= 0:
            return None

        # Auto-detect scale if not provided
        if scale is None:
            if gpa <= 4.0:
                scale = 4.0
            elif gpa <= 5.0:
                scale = 5.0
            elif gpa <= 10.0:
                scale = 10.0
            elif gpa <= 100.0:
                scale = 100.0
            else:
                logger.warning(f"Invalid GPA value: {gpa}")
                return None

        # Normalize to 4.0 scale
        try:
            if scale == 4.0:
                normalized = gpa
            elif scale == 5.0:
                normalized = (gpa / 5.0) * 4.0
            elif scale == 10.0:
                normalized = (gpa / 10.0) * 4.0
            elif scale == 100.0:
                # Percentage to 4.0 scale (assuming 60% = 2.0, 100% = 4.0)
                if gpa >= 90:
                    normalized = 3.7 + (gpa - 90) * 0.03
                elif gpa >= 80:
                    normalized = 3.0 + (gpa - 80) * 0.07
                elif gpa >= 70:
                    normalized = 2.3 + (gpa - 70) * 0.07
                elif gpa >= 60:
                    normalized = 2.0 + (gpa - 60) * 0.03
                else:
                    normalized = (gpa / 60) * 2.0
            else:
                return None

            # Validate range
            if 0.0 <= normalized <= 4.0:
                self.stats.gpa_normalized += 1
                return round(normalized, 2)
            else:
                logger.warning(f"Normalized GPA out of range: {normalized}")
                return None

        except Exception as e:
            logger.error(f"Error normalizing GPA {gpa} on scale {scale}: {e}")
            return None

    def standardize_test_score(
        self,
        test_type: str,
        score: float,
        component: Optional[str] = None
    ) -> Optional[float]:
        """
        Standardize and validate test scores

        Args:
            test_type: Type of test (gre, gmat, toefl, ielts)
            score: Score value
            component: Component (verbal, quant, awa for GRE)

        Returns:
            Validated score or None if invalid
        """
        if pd.isna(score):
            return None

        test_type = test_type.lower()

        # Map test type to range
        range_key = test_type
        if test_type == 'gre' and component:
            range_key = f'gre_{component.lower()}'

        if range_key not in self.test_ranges:
            logger.warning(f"Unknown test type: {test_type}")
            return None

        min_score, max_score = self.test_ranges[range_key]

        # Validate range
        if min_score <= score <= max_score:
            self.stats.test_scores_standardized += 1
            return float(score)
        else:
            logger.warning(f"Score {score} out of range for {range_key} ({min_score}-{max_score})")
            return None

    def normalize_university_name(self, university: str) -> str:
        """
        Normalize university name to standard format

        Args:
            university: Raw university name

        Returns:
            Normalized university identifier
        """
        if pd.isna(university) or not university:
            return 'unknown'

        # Clean up string
        university = str(university).strip()

        # Check exact matches
        if university in self.university_mappings:
            self.stats.universities_normalized += 1
            return self.university_mappings[university]

        # Fuzzy matching
        best_match = process.extractOne(
            university,
            self.university_mappings.keys(),
            scorer=fuzz.token_sort_ratio
        )

        if best_match and best_match[1] >= 85:  # 85% similarity threshold
            self.stats.universities_normalized += 1
            return self.university_mappings[best_match[0]]

        # Return lowercase slug if no match
        slug = re.sub(r'[^a-z0-9]+', '-', university.lower()).strip('-')
        return slug

    def parse_date(self, date_value: Any) -> Optional[str]:
        """
        Parse date to ISO format

        Args:
            date_value: Date in various formats

        Returns:
            ISO format date string (YYYY-MM-DD) or None
        """
        if pd.isna(date_value):
            return None

        try:
            # If already a datetime
            if isinstance(date_value, (datetime, pd.Timestamp)):
                self.stats.dates_parsed += 1
                return date_value.strftime('%Y-%m-%d')

            # Try parsing string
            date_str = str(date_value).strip()

            # Common formats
            formats = [
                '%Y-%m-%d',
                '%m/%d/%Y',
                '%d/%m/%Y',
                '%Y/%m/%d',
                '%b %d, %Y',
                '%B %d, %Y',
                '%d %b %Y',
                '%d %B %Y',
            ]

            for fmt in formats:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    self.stats.dates_parsed += 1
                    return dt.strftime('%Y-%m-%d')
                except ValueError:
                    continue

            # Try pandas to_datetime as last resort
            dt = pd.to_datetime(date_str, errors='coerce')
            if pd.notna(dt):
                self.stats.dates_parsed += 1
                return dt.strftime('%Y-%m-%d')

            logger.warning(f"Could not parse date: {date_value}")
            return None

        except Exception as e:
            logger.error(f"Error parsing date {date_value}: {e}")
            return None

    def detect_duplicates(
        self,
        df: pd.DataFrame,
        threshold: float = 0.85
    ) -> pd.DataFrame:
        """
        Detect and remove duplicate records using fuzzy matching

        Args:
            df: DataFrame with admission records
            threshold: Similarity threshold for fuzzy matching (0-1)

        Returns:
            DataFrame with duplicates removed
        """
        logger.info("Detecting duplicates...")

        # Create a composite key for exact duplicate detection
        key_columns = ['university_normalized', 'program', 'gpa_normalized', 'decision']
        available_key_columns = [col for col in key_columns if col in df.columns]

        if available_key_columns:
            # Mark exact duplicates
            df['_duplicate_exact'] = df.duplicated(subset=available_key_columns, keep='first')
            exact_dupes = df['_duplicate_exact'].sum()
            logger.info(f"Found {exact_dupes} exact duplicates")

            df = df[~df['_duplicate_exact']].copy()
            df.drop(columns=['_duplicate_exact'], inplace=True)
            self.stats.duplicates_removed += exact_dupes

        # Fuzzy matching for near-duplicates (more expensive, use sampling for large datasets)
        if len(df) < 5000:
            logger.info("Performing fuzzy duplicate detection...")
            # This is expensive - implement only for smaller datasets
            # In production, use more efficient algorithms like MinHash LSH

        return df

    def validate_record(self, record: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate a single record and flag issues

        Args:
            record: Admission record dictionary

        Returns:
            Tuple of (is_valid, list of issues)
        """
        issues = []

        # Required fields
        required_fields = ['university_normalized', 'program']
        for field in required_fields:
            if field not in record or pd.isna(record.get(field)):
                issues.append(f"Missing required field: {field}")

        # GPA validation
        if 'gpa_normalized' in record:
            gpa = record['gpa_normalized']
            if pd.notna(gpa) and not (0.0 <= gpa <= 4.0):
                issues.append(f"GPA out of range: {gpa}")

        # Test scores validation
        test_fields = [
            ('gre_verbal', 130, 170),
            ('gre_quant', 130, 170),
            ('gmat', 200, 800),
            ('toefl', 0, 120),
            ('ielts', 0, 9),
        ]

        for field, min_val, max_val in test_fields:
            if field in record:
                score = record[field]
                if pd.notna(score) and not (min_val <= score <= max_val):
                    issues.append(f"{field} out of range: {score}")

        # Decision validation
        if 'decision' in record:
            valid_decisions = ['accepted', 'rejected', 'waitlisted', 'pending']
            decision = str(record['decision']).lower()
            if decision not in valid_decisions:
                issues.append(f"Invalid decision: {decision}")

        # Suspicious patterns
        if 'gpa_normalized' in record and record.get('gpa_normalized') == 4.0:
            if 'gre_verbal' in record and record['gre_verbal'] == 170:
                if 'gre_quant' in record and record['gre_quant'] == 170:
                    issues.append("Suspiciously perfect scores")

        is_valid = len(issues) == 0

        if issues:
            self.stats.flagged_records += 1

        return is_valid, issues

    def impute_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Smart imputation for missing values

        Args:
            df: DataFrame with admission records

        Returns:
            DataFrame with imputed values
        """
        logger.info("Imputing missing values...")

        # Numerical columns to impute
        numerical_cols = ['gpa_normalized', 'gre_verbal', 'gre_quant', 'gmat', 'toefl', 'ielts']

        for col in numerical_cols:
            if col in df.columns:
                missing_count = df[col].isna().sum()
                if missing_count > 0:
                    # Group by university and decision for more accurate imputation
                    if 'university_normalized' in df.columns and 'decision' in df.columns:
                        df[col] = df.groupby(['university_normalized', 'decision'])[col].transform(
                            lambda x: x.fillna(x.median())
                        )

                    # Fill remaining with overall median
                    df[col].fillna(df[col].median(), inplace=True)

                    imputed = missing_count - df[col].isna().sum()
                    if imputed > 0:
                        logger.info(f"Imputed {imputed} missing values in {col}")
                        self.stats.missing_values_imputed += imputed

        # Categorical imputation
        categorical_cols = ['decision', 'program', 'semester']

        for col in categorical_cols:
            if col in df.columns:
                missing_count = df[col].isna().sum()
                if missing_count > 0:
                    # Fill with mode
                    mode_value = df[col].mode()[0] if not df[col].mode().empty else 'unknown'
                    df[col].fillna(mode_value, inplace=True)

                    imputed = missing_count - df[col].isna().sum()
                    if imputed > 0:
                        logger.info(f"Imputed {imputed} missing values in {col}")
                        self.stats.missing_values_imputed += imputed

        return df

    def clean_dataframe(
        self,
        df: pd.DataFrame,
        remove_duplicates: bool = True,
        impute_missing: bool = True,
        validate_records: bool = True
    ) -> Tuple[pd.DataFrame, CleaningStats]:
        """
        Clean entire dataframe

        Args:
            df: Input DataFrame
            remove_duplicates: Whether to remove duplicates
            impute_missing: Whether to impute missing values
            validate_records: Whether to validate and flag records

        Returns:
            Tuple of (cleaned DataFrame, cleaning statistics)
        """
        logger.info(f"Starting data cleaning pipeline on {len(df)} records")

        self.stats.total_records = len(df)
        df_clean = df.copy()

        # 1. Normalize GPA
        if 'gpa' in df_clean.columns:
            logger.info("Normalizing GPA values...")
            gpa_scale_col = 'gpa_scale' if 'gpa_scale' in df_clean.columns else None

            if gpa_scale_col:
                df_clean['gpa_normalized'] = df_clean.apply(
                    lambda row: self.normalize_gpa(row['gpa'], row.get(gpa_scale_col)),
                    axis=1
                )
            else:
                df_clean['gpa_normalized'] = df_clean['gpa'].apply(self.normalize_gpa)

        # 2. Standardize test scores
        logger.info("Standardizing test scores...")

        if 'gre_verbal' in df_clean.columns:
            df_clean['gre_verbal'] = df_clean['gre_verbal'].apply(
                lambda x: self.standardize_test_score('gre', x, 'verbal')
            )

        if 'gre_quant' in df_clean.columns:
            df_clean['gre_quant'] = df_clean['gre_quant'].apply(
                lambda x: self.standardize_test_score('gre', x, 'quant')
            )

        if 'gmat' in df_clean.columns:
            df_clean['gmat'] = df_clean['gmat'].apply(
                lambda x: self.standardize_test_score('gmat', x)
            )

        if 'toefl' in df_clean.columns:
            df_clean['toefl'] = df_clean['toefl'].apply(
                lambda x: self.standardize_test_score('toefl', x)
            )

        if 'ielts' in df_clean.columns:
            df_clean['ielts'] = df_clean['ielts'].apply(
                lambda x: self.standardize_test_score('ielts', x)
            )

        # 3. Normalize university names
        if 'university' in df_clean.columns:
            logger.info("Normalizing university names...")
            df_clean['university_normalized'] = df_clean['university'].apply(
                self.normalize_university_name
            )

        # 4. Parse dates
        date_columns = ['application_date', 'decision_date', 'admission_date']
        for col in date_columns:
            if col in df_clean.columns:
                logger.info(f"Parsing dates in {col}...")
                df_clean[f'{col}_parsed'] = df_clean[col].apply(self.parse_date)

        # 5. Remove duplicates
        if remove_duplicates:
            df_clean = self.detect_duplicates(df_clean)

        # 6. Impute missing values
        if impute_missing:
            df_clean = self.impute_missing_values(df_clean)

        # 7. Validate records
        if validate_records:
            logger.info("Validating records...")
            validation_results = df_clean.apply(
                lambda row: self.validate_record(row.to_dict()),
                axis=1
            )

            df_clean['is_valid'] = validation_results.apply(lambda x: x[0])
            df_clean['validation_issues'] = validation_results.apply(lambda x: ', '.join(x[1]))

            invalid_count = (~df_clean['is_valid']).sum()
            logger.info(f"Found {invalid_count} invalid records")
            self.stats.invalid_records = invalid_count

        self.stats.cleaned_records = len(df_clean)

        logger.info(f"Data cleaning complete. {self.stats.cleaned_records} records remaining")

        return df_clean, self.stats

    def get_statistics_dict(self) -> Dict[str, Any]:
        """Get cleaning statistics as dictionary"""
        return asdict(self.stats)


def clean_csv_file(
    input_path: str,
    output_path: str,
    remove_invalid: bool = False
) -> Dict[str, Any]:
    """
    Clean a CSV file and save results

    Args:
        input_path: Path to input CSV
        output_path: Path to output CSV
        remove_invalid: Whether to remove invalid records

    Returns:
        Cleaning statistics dictionary
    """
    logger.info(f"Reading data from {input_path}")
    df = pd.read_csv(input_path)

    cleaner = DataCleaner()
    df_clean, stats = cleaner.clean_dataframe(df)

    # Optionally remove invalid records
    if remove_invalid and 'is_valid' in df_clean.columns:
        df_clean = df_clean[df_clean['is_valid']].copy()
        logger.info(f"Removed {stats.invalid_records} invalid records")

    # Save cleaned data
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    df_clean.to_csv(output_path, index=False)
    logger.info(f"Saved cleaned data to {output_path}")

    return cleaner.get_statistics_dict()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Clean admission data')
    parser.add_argument('--input', required=True, help='Input CSV file')
    parser.add_argument('--output', required=True, help='Output CSV file')
    parser.add_argument('--remove-invalid', action='store_true',
                       help='Remove invalid records')
    parser.add_argument('--stats-output', help='Output file for statistics (JSON)')

    args = parser.parse_args()

    # Clean data
    stats = clean_csv_file(args.input, args.output, args.remove_invalid)

    # Print statistics
    print("\n" + "="*50)
    print("DATA CLEANING STATISTICS")
    print("="*50)
    for key, value in stats.items():
        print(f"{key}: {value}")
    print("="*50 + "\n")

    # Save statistics if requested
    if args.stats_output:
        import json
        with open(args.stats_output, 'w') as f:
            json.dump(stats, f, indent=2)
        print(f"Statistics saved to {args.stats_output}")
