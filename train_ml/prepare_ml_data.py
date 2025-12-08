"""
ML Data Preparation Module

Prepares cleaned and aggregated data for machine learning:
- Feature engineering (as per admission_prediction_service)
- Train/test/validation split (70/15/15)
- Export to multiple formats (CSV, JSON, pickle)
- Data quality reports
- Visualizations
"""

import os
from typing import Dict, List, Any, Tuple, Optional
from pathlib import Path
from datetime import datetime
import pandas as pd
import numpy as np
import logging
import json
import pickle

# Visualization
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

# ML libraries
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MLDataPreparator:
    """
    Prepare data for machine learning models
    """

    def __init__(self):
        """Initialize ML data preparator"""
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = []

        logger.info("MLDataPreparator initialized")

    def normalize_gpa(self, gpa: float, scale: float = 4.0) -> float:
        """Normalize GPA to 0-1 scale"""
        if pd.isna(gpa) or pd.isna(scale):
            return 0.5  # Default
        return gpa / scale

    def calculate_test_percentile(self, test_type: str, score: float) -> float:
        """Calculate approximate percentile for test scores"""
        if pd.isna(score):
            return 50.0

        percentile_maps = {
            'gre_verbal': {170: 99, 165: 95, 160: 85, 155: 70, 150: 50, 145: 30, 140: 15, 130: 5},
            'gre_quant': {170: 97, 165: 89, 160: 76, 155: 59, 150: 38, 145: 20, 140: 10, 130: 3},
            'gmat': {760: 99, 740: 95, 720: 90, 700: 80, 680: 70, 660: 60, 640: 50, 620: 40, 600: 30},
            'toefl': {118: 99, 115: 95, 110: 90, 105: 80, 100: 70, 95: 60, 90: 50, 85: 40, 80: 30},
            'ielts': {9.0: 99, 8.5: 95, 8.0: 90, 7.5: 80, 7.0: 70, 6.5: 60, 6.0: 50, 5.5: 40, 5.0: 30}
        }

        percentile_map = percentile_maps.get(test_type, {})
        if not percentile_map:
            return 50.0

        sorted_scores = sorted(percentile_map.keys(), reverse=True)
        for threshold_score in sorted_scores:
            if score >= threshold_score:
                return float(percentile_map[threshold_score])

        return 10.0

    def calculate_university_prestige_score(self, ranking: Optional[int]) -> float:
        """Calculate prestige score based on ranking"""
        if pd.isna(ranking):
            return 0.5

        ranking = int(ranking)
        if ranking <= 10:
            return 1.0
        elif ranking <= 50:
            return 0.9
        elif ranking <= 100:
            return 0.8
        elif ranking <= 200:
            return 0.7
        elif ranking <= 500:
            return 0.5
        else:
            return 0.3

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer features for ML models

        Args:
            df: Input DataFrame

        Returns:
            DataFrame with engineered features
        """
        logger.info("Engineering features...")

        df_features = df.copy()

        # 1. GPA normalization
        if 'gpa_normalized' not in df_features.columns:
            if 'gpa' in df_features.columns:
                gpa_scale = df_features['gpa_scale'] if 'gpa_scale' in df_features.columns else 4.0
                df_features['gpa_normalized'] = df_features.apply(
                    lambda row: self.normalize_gpa(row['gpa'], gpa_scale),
                    axis=1
                )

        # 2. Test score percentiles
        if 'gre_verbal' in df_features.columns:
            df_features['gre_verbal_percentile'] = df_features['gre_verbal'].apply(
                lambda x: self.calculate_test_percentile('gre_verbal', x)
            )

        if 'gre_quant' in df_features.columns:
            df_features['gre_quant_percentile'] = df_features['gre_quant'].apply(
                lambda x: self.calculate_test_percentile('gre_quant', x)
            )

        if 'gmat' in df_features.columns:
            df_features['gmat_percentile'] = df_features['gmat'].apply(
                lambda x: self.calculate_test_percentile('gmat', x)
            )

        if 'toefl' in df_features.columns:
            df_features['toefl_percentile'] = df_features['toefl'].apply(
                lambda x: self.calculate_test_percentile('toefl', x)
            )

        if 'ielts' in df_features.columns:
            df_features['ielts_percentile'] = df_features['ielts'].apply(
                lambda x: self.calculate_test_percentile('ielts', x)
            )

        # 3. Composite test score
        df_features['test_score_composite'] = 0
        count = 0

        for col in ['gre_verbal_percentile', 'gre_quant_percentile', 'gmat_percentile']:
            if col in df_features.columns:
                df_features['test_score_composite'] += df_features[col].fillna(50)
                count += 1

        if count > 0:
            df_features['test_score_composite'] /= count

        # 4. Research score
        if 'research_publications' in df_features.columns:
            df_features['research_score'] = df_features['research_publications'].apply(
                lambda x: min(float(x) * 0.2, 1.0) if pd.notna(x) else 0.0
            )

        # 5. Professional score
        if 'work_experience' in df_features.columns:
            df_features['professional_score'] = df_features['work_experience'].apply(
                lambda x: min(float(x) / 60, 1.0) if pd.notna(x) else 0.0
            )

        # 6. University prestige
        if 'university_ranking' in df_features.columns:
            df_features['university_prestige'] = df_features['university_ranking'].apply(
                self.calculate_university_prestige_score
            )

        # 7. Program competitiveness (inverse of acceptance rate)
        if 'acceptance_rate' in df_features.columns:
            df_features['program_competitiveness'] = df_features['acceptance_rate'].apply(
                lambda x: 1.0 - x if pd.notna(x) and 0 <= x <= 1 else 0.5
            )

        # 8. Season encoding (Fall=1, Spring=0.5, Summer=0)
        if 'semester' in df_features.columns:
            season_map = {'fall': 1.0, 'spring': 0.5, 'summer': 0.0}
            df_features['season_encoded'] = df_features['semester'].apply(
                lambda x: season_map.get(str(x).lower(), 0.5)
            )

        # 9. Decision encoding (target variable)
        if 'decision' in df_features.columns:
            decision_map = {
                'accepted': 1,
                'admit': 1,
                'admitted': 1,
                'rejected': 0,
                'reject': 0,
                'waitlisted': 0.5,
                'waitlist': 0.5
            }
            df_features['decision_binary'] = df_features['decision'].apply(
                lambda x: decision_map.get(str(x).lower(), 0) if pd.notna(x) else np.nan
            )

        logger.info(f"Feature engineering complete. Shape: {df_features.shape}")

        return df_features

    def select_ml_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """
        Select features for ML model

        Args:
            df: DataFrame with engineered features

        Returns:
            Tuple of (feature DataFrame, feature names)
        """
        logger.info("Selecting ML features...")

        # Primary features for admission prediction
        feature_columns = [
            'gpa_normalized',
            'gre_verbal_percentile',
            'gre_quant_percentile',
            'gmat_percentile',
            'toefl_percentile',
            'ielts_percentile',
            'test_score_composite',
            'research_score',
            'professional_score',
            'university_prestige',
            'program_competitiveness',
            'season_encoded'
        ]

        # Select available features
        available_features = [col for col in feature_columns if col in df.columns]

        if not available_features:
            raise ValueError("No ML features available in dataset")

        df_ml = df[available_features].copy()

        # Handle missing values
        imputer = SimpleImputer(strategy='median')
        df_ml_imputed = pd.DataFrame(
            imputer.fit_transform(df_ml),
            columns=df_ml.columns,
            index=df_ml.index
        )

        logger.info(f"Selected {len(available_features)} features: {available_features}")

        self.feature_names = available_features

        return df_ml_imputed, available_features

    def split_data(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.15,
        val_size: float = 0.15,
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
        """
        Split data into train/validation/test sets (70/15/15)

        Args:
            X: Features
            y: Target
            test_size: Test set proportion
            val_size: Validation set proportion
            random_state: Random seed

        Returns:
            Tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
        """
        logger.info("Splitting data into train/val/test sets...")

        # First split: separate test set
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y if y.nunique() < 10 else None
        )

        # Second split: separate validation from train
        val_size_adjusted = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=val_size_adjusted, random_state=random_state,
            stratify=y_temp if y_temp.nunique() < 10 else None
        )

        logger.info(f"Train set: {len(X_train)} samples")
        logger.info(f"Validation set: {len(X_val)} samples")
        logger.info(f"Test set: {len(X_test)} samples")

        return X_train, X_val, X_test, y_train, y_val, y_test

    def generate_visualizations(
        self,
        df: pd.DataFrame,
        output_dir: str
    ):
        """
        Generate data visualizations

        Args:
            df: DataFrame
            output_dir: Output directory for plots
        """
        logger.info("Generating visualizations...")

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        sns.set_style("whitegrid")
        plt.rcParams['figure.figsize'] = (12, 8)

        # 1. Decision distribution
        if 'decision' in df.columns:
            plt.figure(figsize=(10, 6))
            df['decision'].value_counts().plot(kind='bar', color='skyblue')
            plt.title('Admission Decision Distribution')
            plt.xlabel('Decision')
            plt.ylabel('Count')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(output_path / 'decision_distribution.png', dpi=300)
            plt.close()

        # 2. GPA distribution
        if 'gpa_normalized' in df.columns:
            plt.figure(figsize=(10, 6))
            df['gpa_normalized'].hist(bins=30, color='lightgreen', edgecolor='black')
            plt.title('GPA Distribution (Normalized)')
            plt.xlabel('GPA (4.0 scale)')
            plt.ylabel('Frequency')
            plt.tight_layout()
            plt.savefig(output_path / 'gpa_distribution.png', dpi=300)
            plt.close()

        # 3. Test scores correlation
        test_cols = ['gre_verbal', 'gre_quant', 'gmat', 'toefl']
        available_test_cols = [col for col in test_cols if col in df.columns]

        if len(available_test_cols) >= 2:
            plt.figure(figsize=(10, 8))
            correlation_matrix = df[available_test_cols].corr()
            sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0)
            plt.title('Test Scores Correlation Matrix')
            plt.tight_layout()
            plt.savefig(output_path / 'test_scores_correlation.png', dpi=300)
            plt.close()

        # 4. University distribution
        if 'university' in df.columns:
            plt.figure(figsize=(12, 8))
            top_unis = df['university'].value_counts().head(20)
            top_unis.plot(kind='barh', color='coral')
            plt.title('Top 20 Universities by Application Volume')
            plt.xlabel('Number of Applications')
            plt.ylabel('University')
            plt.tight_layout()
            plt.savefig(output_path / 'university_distribution.png', dpi=300)
            plt.close()

        # 5. Acceptance rate by GPA
        if 'gpa_normalized' in df.columns and 'decision_binary' in df.columns:
            plt.figure(figsize=(10, 6))

            df_plot = df[['gpa_normalized', 'decision_binary']].dropna()
            df_plot['gpa_bin'] = pd.cut(df_plot['gpa_normalized'], bins=10)

            acceptance_by_gpa = df_plot.groupby('gpa_bin')['decision_binary'].mean()

            acceptance_by_gpa.plot(kind='bar', color='mediumseagreen')
            plt.title('Acceptance Rate by GPA Range')
            plt.xlabel('GPA Range')
            plt.ylabel('Acceptance Rate')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(output_path / 'acceptance_by_gpa.png', dpi=300)
            plt.close()

        logger.info(f"Visualizations saved to {output_dir}")

    def generate_quality_report(
        self,
        df: pd.DataFrame,
        output_path: str
    ):
        """
        Generate data quality report

        Args:
            df: DataFrame
            output_path: Output file path (JSON)
        """
        logger.info("Generating data quality report...")

        report = {
            'generated_at': datetime.utcnow().isoformat(),
            'total_records': len(df),
            'total_features': len(df.columns),
            'missing_values': {},
            'data_types': {},
            'summary_statistics': {},
            'quality_score': 0.0
        }

        # Missing values
        for col in df.columns:
            missing_count = df[col].isna().sum()
            missing_pct = (missing_count / len(df)) * 100
            report['missing_values'][col] = {
                'count': int(missing_count),
                'percentage': round(missing_pct, 2)
            }

        # Data types
        report['data_types'] = {col: str(dtype) for col, dtype in df.dtypes.items()}

        # Summary statistics for numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            report['summary_statistics'][col] = {
                'mean': round(df[col].mean(), 4),
                'median': round(df[col].median(), 4),
                'std': round(df[col].std(), 4),
                'min': round(df[col].min(), 4),
                'max': round(df[col].max(), 4)
            }

        # Calculate quality score
        completeness_score = 1 - (df.isna().sum().sum() / (len(df) * len(df.columns)))
        report['quality_score'] = round(completeness_score * 100, 2)

        # Save report
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)

        logger.info(f"Quality report saved to {output_path}")
        logger.info(f"Data quality score: {report['quality_score']}%")

    def prepare_ml_dataset(
        self,
        input_file: str,
        output_dir: str,
        test_size: float = 0.15,
        val_size: float = 0.15,
        generate_viz: bool = True
    ) -> Dict[str, Any]:
        """
        Complete ML data preparation pipeline

        Args:
            input_file: Input CSV file (cleaned data)
            output_dir: Output directory
            test_size: Test set size
            val_size: Validation set size
            generate_viz: Whether to generate visualizations

        Returns:
            Summary dictionary
        """
        logger.info(f"Starting ML data preparation from {input_file}")

        # Load data
        df = pd.read_csv(input_file)
        logger.info(f"Loaded {len(df)} records")

        # Engineer features
        df_features = self.engineer_features(df)

        # Select ML features
        X, feature_names = self.select_ml_features(df_features)

        # Get target variable
        if 'decision_binary' not in df_features.columns:
            raise ValueError("Target variable 'decision_binary' not found")

        y = df_features['decision_binary'].dropna()
        X = X.loc[y.index]  # Align with target

        logger.info(f"Dataset size: {len(X)} samples with {len(feature_names)} features")

        # Split data
        X_train, X_val, X_test, y_train, y_val, y_test = self.split_data(
            X, y, test_size, val_size
        )

        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Save datasets in multiple formats

        # 1. CSV format
        X_train.to_csv(output_path / f'X_train_{timestamp}.csv', index=False)
        X_val.to_csv(output_path / f'X_val_{timestamp}.csv', index=False)
        X_test.to_csv(output_path / f'X_test_{timestamp}.csv', index=False)

        y_train.to_csv(output_path / f'y_train_{timestamp}.csv', index=False, header=True)
        y_val.to_csv(output_path / f'y_val_{timestamp}.csv', index=False, header=True)
        y_test.to_csv(output_path / f'y_test_{timestamp}.csv', index=False, header=True)

        # 2. Pickle format (for Python)
        with open(output_path / f'dataset_{timestamp}.pkl', 'wb') as f:
            pickle.dump({
                'X_train': X_train,
                'X_val': X_val,
                'X_test': X_test,
                'y_train': y_train,
                'y_val': y_val,
                'y_test': y_test,
                'feature_names': feature_names
            }, f)

        # 3. JSON format (metadata)
        metadata = {
            'created_at': datetime.utcnow().isoformat(),
            'source_file': input_file,
            'total_samples': len(X),
            'train_samples': len(X_train),
            'val_samples': len(X_val),
            'test_samples': len(X_test),
            'feature_names': feature_names,
            'target_variable': 'decision_binary',
            'class_distribution': {
                'train': y_train.value_counts().to_dict(),
                'val': y_val.value_counts().to_dict(),
                'test': y_test.value_counts().to_dict()
            }
        }

        with open(output_path / f'metadata_{timestamp}.json', 'w') as f:
            json.dump(metadata, f, indent=2)

        # Generate quality report
        self.generate_quality_report(
            df_features,
            output_path / f'quality_report_{timestamp}.json'
        )

        # Generate visualizations
        if generate_viz:
            viz_dir = output_path / 'visualizations'
            self.generate_visualizations(df_features, str(viz_dir))

        summary = {
            'status': 'success',
            'output_directory': str(output_path),
            'timestamp': timestamp,
            'metadata': metadata
        }

        logger.info("ML data preparation complete")

        return summary


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Prepare ML dataset')
    parser.add_argument('--input', required=True, help='Input CSV file (cleaned data)')
    parser.add_argument('--output', default='data/ml_ready', help='Output directory')
    parser.add_argument('--test-size', type=float, default=0.15, help='Test set size')
    parser.add_argument('--val-size', type=float, default=0.15, help='Validation set size')
    parser.add_argument('--no-viz', action='store_true', help='Skip visualizations')

    args = parser.parse_args()

    preparator = MLDataPreparator()
    summary = preparator.prepare_ml_dataset(
        input_file=args.input,
        output_dir=args.output,
        test_size=args.test_size,
        val_size=args.val_size,
        generate_viz=not args.no_viz
    )

    print("\n" + "="*50)
    print("ML DATA PREPARATION COMPLETE")
    print("="*50)
    print(f"Output directory: {summary['output_directory']}")
    print(f"Total samples: {summary['metadata']['total_samples']}")
    print(f"Train: {summary['metadata']['train_samples']}")
    print(f"Validation: {summary['metadata']['val_samples']}")
    print(f"Test: {summary['metadata']['test_samples']}")
    print(f"Features: {len(summary['metadata']['feature_names'])}")
    print("="*50 + "\n")
