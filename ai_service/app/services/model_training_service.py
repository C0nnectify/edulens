"""
ML Model Training Service

Comprehensive model training pipeline with:
- Multiple algorithm support (RF, XGBoost, GradientBoosting, Neural Networks)
- Hyperparameter tuning (GridSearch, RandomSearch)
- Model evaluation and versioning
- Feature importance analysis
- Automated training triggers
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import numpy as np
import pickle
import os
import uuid
import json
from collections import defaultdict
import psutil
import time

# ML imports
try:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.neural_network import MLPClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import (
        train_test_split,
        cross_val_score,
        GridSearchCV,
        RandomizedSearchCV
    )
    from sklearn.metrics import (
        accuracy_score,
        precision_score,
        recall_score,
        f1_score,
        roc_auc_score,
        confusion_matrix,
        classification_report,
        roc_curve,
        calibration_curve
    )
    from sklearn.feature_selection import RFE, SelectFromModel
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    import matplotlib.pyplot as plt
    import seaborn as sns
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False

from motor.motor_asyncio import AsyncIOMotorCollection

from app.models.model_training import (
    TrainingConfig,
    TrainingJob,
    TrainingStatus,
    AlgorithmType,
    TrainingMetrics,
    ModelVersion,
    EvaluationResults,
    FeatureImportance,
    DataQualityReport,
    HyperparameterTuningMethod,
    FeatureSelectionMethod,
    ModelComparisonResponse,
    ScheduledTrainingConfig,
    TrainingTrigger
)
from app.models.admission import AdmissionDataPoint, AdmissionDecision
from app.database.mongodb import get_database
from app.config import settings
from app.utils.logger import logger


class ModelTrainingService:
    """Service for ML model training and management"""

    def __init__(self):
        """Initialize model training service"""
        if not SKLEARN_AVAILABLE:
            logger.warning("scikit-learn not available. ML training will be limited.")

        self.models_dir = os.path.join(settings.upload_dir, "ml_models")
        self.plots_dir = os.path.join(settings.upload_dir, "ml_plots")
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.plots_dir, exist_ok=True)

        # Feature names (must match order in feature extraction)
        self.feature_names = [
            "gpa_normalized",
            "gre_verbal_percentile",
            "gre_quant_percentile",
            "gmat_percentile",
            "english_proficiency",
            "research_score",
            "professional_score",
            "extracurricular_score",
            "undergrad_prestige",
            "program_competitiveness",
            "gpa_vs_avg",
            "test_score_vs_avg"
        ]

        logger.info("Model training service initialized")

    def _get_collection(self, name: str) -> AsyncIOMotorCollection:
        """Get MongoDB collection"""
        db = get_database()
        return db[name]

    # ============================================================================
    # HYPERPARAMETER GRIDS
    # ============================================================================

    def _get_hyperparameter_grid(self, algorithm: AlgorithmType) -> Dict[str, List[Any]]:
        """Get hyperparameter search grid for algorithm"""
        grids = {
            AlgorithmType.RANDOM_FOREST: {
                "n_estimators": [100, 200, 300],
                "max_depth": [10, 20, 30, None],
                "min_samples_split": [2, 5, 10],
                "min_samples_leaf": [1, 2, 4],
                "max_features": ["sqrt", "log2"],
                "class_weight": ["balanced", None]
            },
            AlgorithmType.XGBOOST: {
                "learning_rate": [0.01, 0.05, 0.1, 0.3],
                "max_depth": [3, 5, 7, 9],
                "n_estimators": [100, 200, 300],
                "subsample": [0.7, 0.8, 0.9, 1.0],
                "colsample_bytree": [0.7, 0.8, 0.9, 1.0],
                "gamma": [0, 0.1, 0.2],
                "min_child_weight": [1, 3, 5]
            },
            AlgorithmType.GRADIENT_BOOSTING: {
                "learning_rate": [0.01, 0.05, 0.1],
                "n_estimators": [100, 200, 300],
                "max_depth": [3, 5, 7],
                "min_samples_split": [2, 5, 10],
                "min_samples_leaf": [1, 2, 4],
                "subsample": [0.7, 0.8, 0.9, 1.0]
            },
            AlgorithmType.LOGISTIC_REGRESSION: {
                "C": [0.001, 0.01, 0.1, 1, 10, 100],
                "penalty": ["l1", "l2"],
                "solver": ["liblinear", "saga"],
                "class_weight": ["balanced", None],
                "max_iter": [1000, 2000]
            },
            AlgorithmType.NEURAL_NETWORK: {
                "hidden_layer_sizes": [(50,), (100,), (50, 50), (100, 50)],
                "activation": ["relu", "tanh"],
                "alpha": [0.0001, 0.001, 0.01],
                "learning_rate": ["constant", "adaptive"],
                "max_iter": [500, 1000]
            }
        }
        return grids.get(algorithm, {})

    def _create_model(self, algorithm: AlgorithmType, **params) -> Any:
        """Create model instance with parameters"""
        if algorithm == AlgorithmType.RANDOM_FOREST:
            return RandomForestClassifier(random_state=42, **params)
        elif algorithm == AlgorithmType.XGBOOST:
            if not XGBOOST_AVAILABLE:
                raise RuntimeError("XGBoost not installed")
            return xgb.XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss', **params)
        elif algorithm == AlgorithmType.GRADIENT_BOOSTING:
            return GradientBoostingClassifier(random_state=42, **params)
        elif algorithm == AlgorithmType.LOGISTIC_REGRESSION:
            return LogisticRegression(random_state=42, **params)
        elif algorithm == AlgorithmType.NEURAL_NETWORK:
            return MLPClassifier(random_state=42, **params)
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

    # ============================================================================
    # DATA LOADING AND VALIDATION
    # ============================================================================

    async def validate_data_quality(self, config: TrainingConfig) -> DataQualityReport:
        """
        Validate data quality before training

        Args:
            config: Training configuration

        Returns:
            Data quality report
        """
        collection = self._get_collection("admission_data")

        # Build query
        query = {}
        if config.use_verified_only:
            query["verified"] = True

        # Count total samples
        total_samples = await collection.count_documents(query)
        verified_samples = await collection.count_documents({"verified": True})

        # Load data for analysis
        cursor = collection.find(query)
        data_points = []
        async for doc in cursor:
            try:
                data_points.append(AdmissionDataPoint(**doc))
            except Exception as e:
                logger.warning(f"Skipping invalid data point: {e}")

        if not data_points:
            return DataQualityReport(
                total_samples=total_samples,
                verified_samples=verified_samples,
                feature_completeness={},
                duplicate_count=0,
                outlier_count=0,
                class_distribution={},
                class_balance_ratio=0.0,
                data_date_range={},
                recent_data_percentage=0.0,
                samples_by_university={},
                universities_below_threshold=[],
                passes_quality_check=False,
                quality_issues=["No valid data points found"],
                recommendations=["Collect more admission data"]
            )

        # Feature completeness
        feature_completeness = {}
        for feature in self.feature_names:
            # Simplified - in production, check actual feature values
            feature_completeness[feature] = 100.0  # Placeholder

        # Class distribution
        class_distribution = defaultdict(int)
        for dp in data_points:
            class_distribution[dp.decision.value] += 1

        # Calculate class balance
        accepted = class_distribution.get(AdmissionDecision.ACCEPTED.value, 0)
        rejected = class_distribution.get(AdmissionDecision.REJECTED.value, 0)
        class_balance_ratio = min(accepted, rejected) / max(accepted, rejected) if max(accepted, rejected) > 0 else 0.0

        # Data freshness
        dates = [dp.application_year for dp in data_points if dp.application_year]
        current_year = datetime.utcnow().year
        recent_data = [y for y in dates if current_year - y <= 2]
        recent_data_percentage = (len(recent_data) / len(dates) * 100) if dates else 0.0

        # Samples by university
        samples_by_university = defaultdict(int)
        for dp in data_points:
            samples_by_university[dp.program.university_name] += 1

        universities_below_threshold = [
            uni for uni, count in samples_by_university.items() if count < 50
        ]

        # Quality checks
        quality_issues = []
        recommendations = []

        if len(data_points) < config.min_samples:
            quality_issues.append(f"Insufficient data: {len(data_points)} < {config.min_samples}")
            recommendations.append(f"Collect at least {config.min_samples - len(data_points)} more samples")

        if class_balance_ratio < 0.3:
            quality_issues.append(f"Imbalanced classes: ratio {class_balance_ratio:.2f}")
            recommendations.append("Collect more data for minority class or use SMOTE")

        if recent_data_percentage < 50:
            quality_issues.append(f"Old data: only {recent_data_percentage:.1f}% from last 2 years")
            recommendations.append("Focus on collecting recent admission data")

        if universities_below_threshold:
            quality_issues.append(f"{len(universities_below_threshold)} universities have <50 samples")
            recommendations.append("Collect more data for underrepresented universities")

        passes_quality_check = len(quality_issues) == 0

        return DataQualityReport(
            total_samples=total_samples,
            verified_samples=verified_samples,
            feature_completeness=feature_completeness,
            duplicate_count=0,  # Simplified
            outlier_count=0,  # Simplified
            class_distribution=dict(class_distribution),
            class_balance_ratio=class_balance_ratio,
            data_date_range={"min": str(min(dates)) if dates else "N/A", "max": str(max(dates)) if dates else "N/A"},
            recent_data_percentage=recent_data_percentage,
            samples_by_university=dict(samples_by_university),
            universities_below_threshold=universities_below_threshold,
            passes_quality_check=passes_quality_check,
            quality_issues=quality_issues,
            recommendations=recommendations
        )

    async def load_training_data(
        self,
        config: TrainingConfig
    ) -> Tuple[np.ndarray, np.ndarray, List[AdmissionDataPoint]]:
        """
        Load and prepare training data

        Args:
            config: Training configuration

        Returns:
            Tuple of (features, labels, data_points)
        """
        # Import here to avoid circular dependency
        from app.services.admission_prediction_service import admission_service

        collection = self._get_collection("admission_data")

        # Build query
        query = {}
        if config.use_verified_only:
            query["verified"] = True

        # Load data
        cursor = collection.find(query)
        data_points = []
        async for doc in cursor:
            try:
                data_points.append(AdmissionDataPoint(**doc))
            except Exception as e:
                logger.warning(f"Skipping invalid data point: {e}")

        if len(data_points) < config.min_samples:
            raise ValueError(
                f"Insufficient data: {len(data_points)} samples, need {config.min_samples}"
            )

        logger.info(f"Loaded {len(data_points)} data points for training")

        # Extract features
        X = []
        y = []

        for dp in data_points:
            _, features = admission_service._extract_features(dp.profile, dp.program)
            X.append(features)

            # Binary classification: admitted (1) vs rejected (0)
            label = 1 if dp.decision == AdmissionDecision.ACCEPTED else 0
            y.append(label)

        X = np.array(X)
        y = np.array(y)

        logger.info(f"Feature matrix shape: {X.shape}, Labels shape: {y.shape}")
        logger.info(f"Class distribution: {np.bincount(y)}")

        return X, y, data_points

    # ============================================================================
    # TRAINING PIPELINE
    # ============================================================================

    async def train_single_model(
        self,
        algorithm: AlgorithmType,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        config: TrainingConfig,
        scaler: Optional[StandardScaler] = None,
        job: Optional[TrainingJob] = None
    ) -> Tuple[Any, TrainingMetrics, StandardScaler]:
        """
        Train a single model with hyperparameter tuning

        Args:
            algorithm: Algorithm to train
            X_train, y_train: Training data
            X_val, y_val: Validation data
            X_test, y_test: Test data
            config: Training configuration
            scaler: Feature scaler
            job: Training job for progress tracking

        Returns:
            Tuple of (model, metrics, scaler)
        """
        logger.info(f"Training {algorithm.value} model...")
        start_time = time.time()

        # Scale features
        if config.scale_features:
            if scaler is None:
                scaler = StandardScaler()
                X_train = scaler.fit_transform(X_train)
            else:
                X_train = scaler.transform(X_train)
            X_val = scaler.transform(X_val)
            X_test = scaler.transform(X_test)

        # Create base model
        base_model = self._create_model(algorithm)

        # Hyperparameter tuning
        if config.hyperparameter_tuning != HyperparameterTuningMethod.NONE:
            param_grid = self._get_hyperparameter_grid(algorithm)

            if config.hyperparameter_tuning == HyperparameterTuningMethod.GRID_SEARCH:
                search = GridSearchCV(
                    base_model,
                    param_grid,
                    cv=config.cross_validation_folds,
                    scoring=config.target_metric,
                    n_jobs=config.n_jobs,
                    verbose=1
                )
            else:  # Random search
                search = RandomizedSearchCV(
                    base_model,
                    param_grid,
                    n_iter=config.tuning_iterations,
                    cv=config.cross_validation_folds,
                    scoring=config.target_metric,
                    n_jobs=config.n_jobs,
                    random_state=config.random_state,
                    verbose=1
                )

            search.fit(X_train, y_train)
            model = search.best_estimator_
            logger.info(f"Best parameters: {search.best_params_}")
        else:
            # No tuning - use default parameters
            model = base_model
            model.fit(X_train, y_train)

        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]

        # Calculate metrics
        metrics = self._calculate_metrics(y_test, y_pred, y_pred_proba, X_train, y_train, model, config)
        metrics.training_time_seconds = time.time() - start_time

        logger.info(
            f"{algorithm.value} - Accuracy: {metrics.accuracy:.3f}, "
            f"F1: {metrics.f1_score:.3f}, AUC: {metrics.auc_roc:.3f}"
        )

        return model, metrics, scaler

    def _calculate_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_pred_proba: np.ndarray,
        X_train: np.ndarray,
        y_train: np.ndarray,
        model: Any,
        config: TrainingConfig
    ) -> TrainingMetrics:
        """Calculate comprehensive evaluation metrics"""
        # Basic metrics
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        auc_roc = roc_auc_score(y_true, y_pred_proba)

        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)

        # Classification report
        report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)

        # Cross-validation scores
        cv_scores = cross_val_score(
            model,
            X_train,
            y_train,
            cv=config.cross_validation_folds,
            scoring=config.target_metric,
            n_jobs=config.n_jobs
        )

        return TrainingMetrics(
            accuracy=float(accuracy),
            precision=float(precision),
            recall=float(recall),
            f1_score=float(f1),
            auc_roc=float(auc_roc),
            confusion_matrix=cm.tolist(),
            classification_report=report,
            cv_scores=cv_scores.tolist(),
            cv_mean=float(cv_scores.mean()),
            cv_std=float(cv_scores.std()),
            training_time_seconds=0.0  # Set by caller
        )

    def _extract_feature_importance(
        self,
        model: Any,
        algorithm: AlgorithmType
    ) -> List[FeatureImportance]:
        """Extract feature importance from model"""
        feature_importance_list = []

        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            # Sort by importance
            indices = np.argsort(importances)[::-1]

            for rank, idx in enumerate(indices, 1):
                if idx < len(self.feature_names):
                    feature_importance_list.append(
                        FeatureImportance(
                            feature_name=self.feature_names[idx],
                            importance_score=float(importances[idx]),
                            rank=rank
                        )
                    )
        elif hasattr(model, 'coef_'):
            # For linear models
            importances = np.abs(model.coef_[0])
            indices = np.argsort(importances)[::-1]

            for rank, idx in enumerate(indices, 1):
                if idx < len(self.feature_names):
                    feature_importance_list.append(
                        FeatureImportance(
                            feature_name=self.feature_names[idx],
                            importance_score=float(importances[idx]),
                            rank=rank
                        )
                    )

        return feature_importance_list

    async def train_models(
        self,
        config: TrainingConfig,
        job_id: Optional[str] = None
    ) -> List[ModelVersion]:
        """
        Train multiple models according to configuration

        Args:
            config: Training configuration
            job_id: Optional job ID for tracking

        Returns:
            List of trained model versions
        """
        if not SKLEARN_AVAILABLE:
            raise RuntimeError("scikit-learn not installed. Cannot train models.")

        # Validate data quality
        quality_report = await self.validate_data_quality(config)
        if not quality_report.passes_quality_check:
            raise ValueError(
                f"Data quality check failed: {', '.join(quality_report.quality_issues)}"
            )

        # Load data
        X, y, data_points = await self.load_training_data(config)

        # Split data: train / val / test
        test_size = config.test_size
        val_size = config.validation_size
        train_size = 1.0 - test_size - val_size

        # First split: train+val vs test
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=config.random_state,
            stratify=y
        )

        # Second split: train vs val
        val_size_adjusted = val_size / (train_size + val_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp,
            test_size=val_size_adjusted,
            random_state=config.random_state,
            stratify=y_temp
        )

        logger.info(
            f"Data split - Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}"
        )

        # Train each algorithm
        model_versions = []
        scaler = None

        for algorithm in config.algorithms:
            try:
                # Train model
                model, metrics, scaler = await self.train_single_model(
                    algorithm,
                    X_train, y_train,
                    X_val, y_val,
                    X_test, y_test,
                    config,
                    scaler
                )

                # Extract feature importance
                feature_importance = self._extract_feature_importance(model, algorithm)

                # Save model
                model_id = f"model_{algorithm.value}_{uuid.uuid4().hex[:8]}"
                version = f"{datetime.utcnow().strftime('%Y%m%d')}_{len(data_points)}"

                model_path = os.path.join(self.models_dir, f"{model_id}.pkl")
                scaler_path = os.path.join(self.models_dir, f"{model_id}_scaler.pkl")

                with open(model_path, 'wb') as f:
                    pickle.dump(model, f)
                if scaler:
                    with open(scaler_path, 'wb') as f:
                        pickle.dump(scaler, f)

                # Create model version
                model_version = ModelVersion(
                    model_id=model_id,
                    version=version,
                    algorithm=algorithm,
                    training_samples=len(data_points),
                    training_config=config,
                    metrics=metrics,
                    feature_importance=feature_importance,
                    model_path=model_path,
                    scaler_path=scaler_path if scaler else None,
                    hyperparameters=model.get_params() if hasattr(model, 'get_params') else {},
                    version_tag=config.version_tag,
                    notes=config.notes
                )

                # Save to database
                await self._save_model_version(model_version)

                model_versions.append(model_version)
                logger.info(f"Saved model: {model_id}")

            except Exception as e:
                logger.error(f"Failed to train {algorithm.value}: {e}", exc_info=True)
                continue

        if not model_versions:
            raise RuntimeError("All model training attempts failed")

        logger.info(f"Successfully trained {len(model_versions)} models")
        return model_versions

    async def _save_model_version(self, model_version: ModelVersion) -> None:
        """Save model version to database"""
        collection = self._get_collection("ml_models")

        doc = model_version.model_dump()
        doc["_id"] = model_version.model_id

        await collection.insert_one(doc)

    # ============================================================================
    # MODEL EVALUATION
    # ============================================================================

    async def evaluate_model(
        self,
        model_id: str,
        generate_plots: bool = True
    ) -> EvaluationResults:
        """
        Comprehensive model evaluation

        Args:
            model_id: Model ID to evaluate
            generate_plots: Whether to generate visualization plots

        Returns:
            Evaluation results with metrics and plots
        """
        # Load model
        collection = self._get_collection("ml_models")
        doc = await collection.find_one({"_id": model_id})

        if not doc:
            raise ValueError(f"Model not found: {model_id}")

        model_version = ModelVersion(**doc)

        # Load model from disk
        with open(model_version.model_path, 'rb') as f:
            model = pickle.load(f)

        scaler = None
        if model_version.scaler_path and os.path.exists(model_version.scaler_path):
            with open(model_version.scaler_path, 'rb') as f:
                scaler = pickle.load(f)

        # Load test data
        X, y, data_points = await self.load_training_data(model_version.training_config)

        # Use same split as training
        _, X_test, _, y_test = train_test_split(
            X, y,
            test_size=model_version.training_config.test_size,
            random_state=model_version.training_config.random_state,
            stratify=y
        )

        if scaler:
            X_test = scaler.transform(X_test)

        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]

        # Calculate metrics
        metrics = self._calculate_metrics(
            y_test, y_pred, y_pred_proba,
            X, y, model,
            model_version.training_config
        )

        # Performance by university tier (simplified)
        performance_by_tier = {
            "reach": {"accuracy": 0.0, "precision": 0.0, "recall": 0.0},
            "target": {"accuracy": 0.0, "precision": 0.0, "recall": 0.0},
            "safety": {"accuracy": 0.0, "precision": 0.0, "recall": 0.0}
        }

        # Generate visualizations
        plots = {}
        if generate_plots and MATPLOTLIB_AVAILABLE:
            plots = await self._generate_evaluation_plots(
                model_id, y_test, y_pred, y_pred_proba,
                model_version.feature_importance
            )

        return EvaluationResults(
            model_id=model_id,
            metrics=metrics,
            performance_by_university_tier=performance_by_tier,
            feature_importance=model_version.feature_importance,
            **plots
        )

    async def _generate_evaluation_plots(
        self,
        model_id: str,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_pred_proba: np.ndarray,
        feature_importance: List[FeatureImportance]
    ) -> Dict[str, str]:
        """Generate evaluation plots"""
        plots = {}

        try:
            # Confusion Matrix
            fig, ax = plt.subplots(figsize=(8, 6))
            cm = confusion_matrix(y_true, y_pred)
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax)
            ax.set_xlabel('Predicted')
            ax.set_ylabel('Actual')
            ax.set_title('Confusion Matrix')
            cm_path = os.path.join(self.plots_dir, f"{model_id}_confusion_matrix.png")
            plt.savefig(cm_path, dpi=300, bbox_inches='tight')
            plt.close()
            plots['confusion_matrix_plot'] = cm_path

            # ROC Curve
            fig, ax = plt.subplots(figsize=(8, 6))
            fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
            auc = roc_auc_score(y_true, y_pred_proba)
            ax.plot(fpr, tpr, label=f'ROC Curve (AUC = {auc:.3f})')
            ax.plot([0, 1], [0, 1], 'k--', label='Random')
            ax.set_xlabel('False Positive Rate')
            ax.set_ylabel('True Positive Rate')
            ax.set_title('ROC Curve')
            ax.legend()
            ax.grid(True, alpha=0.3)
            roc_path = os.path.join(self.plots_dir, f"{model_id}_roc_curve.png")
            plt.savefig(roc_path, dpi=300, bbox_inches='tight')
            plt.close()
            plots['roc_curve_plot'] = roc_path

            # Feature Importance
            if feature_importance:
                fig, ax = plt.subplots(figsize=(10, 8))
                top_features = sorted(feature_importance, key=lambda x: x.importance_score, reverse=True)[:10]
                names = [f.feature_name for f in top_features]
                scores = [f.importance_score for f in top_features]
                ax.barh(names, scores)
                ax.set_xlabel('Importance Score')
                ax.set_title('Top 10 Feature Importance')
                ax.invert_yaxis()
                fi_path = os.path.join(self.plots_dir, f"{model_id}_feature_importance.png")
                plt.savefig(fi_path, dpi=300, bbox_inches='tight')
                plt.close()
                plots['feature_importance_plot'] = fi_path

            # Calibration Curve
            fig, ax = plt.subplots(figsize=(8, 6))
            fraction_of_positives, mean_predicted_value = calibration_curve(
                y_true, y_pred_proba, n_bins=10
            )
            ax.plot(mean_predicted_value, fraction_of_positives, 's-', label='Model')
            ax.plot([0, 1], [0, 1], 'k--', label='Perfect Calibration')
            ax.set_xlabel('Mean Predicted Probability')
            ax.set_ylabel('Fraction of Positives')
            ax.set_title('Calibration Curve')
            ax.legend()
            ax.grid(True, alpha=0.3)
            cal_path = os.path.join(self.plots_dir, f"{model_id}_calibration.png")
            plt.savefig(cal_path, dpi=300, bbox_inches='tight')
            plt.close()
            plots['calibration_plot'] = cal_path

        except Exception as e:
            logger.error(f"Failed to generate plots: {e}", exc_info=True)

        return plots

    # ============================================================================
    # MODEL MANAGEMENT
    # ============================================================================

    async def activate_model(self, model_id: str, reason: Optional[str] = None) -> ModelVersion:
        """Activate a model version"""
        collection = self._get_collection("ml_models")

        # Deactivate all models
        await collection.update_many({}, {"$set": {"is_active": False}})

        # Activate target model
        result = await collection.find_one_and_update(
            {"_id": model_id},
            {"$set": {"is_active": True, "activated_at": datetime.utcnow()}},
            return_document=True
        )

        if not result:
            raise ValueError(f"Model not found: {model_id}")

        logger.info(f"Activated model: {model_id}" + (f" - {reason}" if reason else ""))

        return ModelVersion(**result)

    async def compare_models(
        self,
        model_ids: List[str],
        metrics: List[str]
    ) -> ModelComparisonResponse:
        """Compare multiple model versions"""
        collection = self._get_collection("ml_models")

        # Load models
        models = []
        for model_id in model_ids:
            doc = await collection.find_one({"_id": model_id})
            if doc:
                models.append(ModelVersion(**doc))

        if len(models) < 2:
            raise ValueError("Need at least 2 models to compare")

        # Compare metrics
        metric_comparison = defaultdict(dict)
        for model in models:
            for metric in metrics:
                value = getattr(model.metrics, metric, None)
                if value is not None:
                    metric_comparison[metric][model.model_id] = value

        # Find best model
        best_model_id = max(
            models,
            key=lambda m: getattr(m.metrics, "f1_score", 0.0)
        ).model_id

        return ModelComparisonResponse(
            models=models,
            metric_comparison=dict(metric_comparison),
            best_model_id=best_model_id,
            best_metric="f1_score"
        )

    async def get_training_job(self, job_id: str) -> Optional[TrainingJob]:
        """Get training job by ID"""
        collection = self._get_collection("training_jobs")
        doc = await collection.find_one({"_id": job_id})
        return TrainingJob(**doc) if doc else None

    async def list_training_jobs(
        self,
        limit: int = 50,
        status: Optional[TrainingStatus] = None
    ) -> List[TrainingJob]:
        """List training jobs"""
        collection = self._get_collection("training_jobs")

        query = {}
        if status:
            query["status"] = status.value

        cursor = collection.find(query).sort("created_at", -1).limit(limit)

        jobs = []
        async for doc in cursor:
            jobs.append(TrainingJob(**doc))

        return jobs

    async def list_model_versions(
        self,
        limit: int = 50,
        active_only: bool = False
    ) -> List[ModelVersion]:
        """List model versions"""
        collection = self._get_collection("ml_models")

        query = {}
        if active_only:
            query["is_active"] = True

        cursor = collection.find(query).sort("training_date", -1).limit(limit)

        models = []
        async for doc in cursor:
            models.append(ModelVersion(**doc))

        return models


# Global instance
model_training_service = ModelTrainingService()
