"""
Pydantic models for ML model training operations
"""

from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class TrainingStatus(str, Enum):
    """Training job status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AlgorithmType(str, Enum):
    """ML algorithm types"""
    RANDOM_FOREST = "random_forest"
    XGBOOST = "xgboost"
    GRADIENT_BOOSTING = "gradient_boosting"
    LOGISTIC_REGRESSION = "logistic_regression"
    NEURAL_NETWORK = "neural_network"
    ENSEMBLE = "ensemble"


class DataSource(str, Enum):
    """Data source for training"""
    MONGODB = "mongodb"
    CSV = "csv"
    JSON = "json"


class FeatureSelectionMethod(str, Enum):
    """Feature selection methods"""
    AUTO = "auto"
    MANUAL = "manual"
    RFE = "rfe"  # Recursive Feature Elimination
    LASSO = "lasso"
    TREE_BASED = "tree_based"


class HyperparameterTuningMethod(str, Enum):
    """Hyperparameter tuning methods"""
    NONE = "none"
    GRID_SEARCH = "grid_search"
    RANDOM_SEARCH = "random_search"
    BAYESIAN = "bayesian"


class TrainingConfig(BaseModel):
    """Configuration for model training"""
    # Data configuration
    data_source: DataSource = Field(DataSource.MONGODB, description="Data source type")
    data_path: Optional[str] = Field(None, description="Path to data file (for CSV/JSON)")
    min_samples: int = Field(1000, ge=100, description="Minimum samples required for training")
    use_verified_only: bool = Field(True, description="Use only verified data points")

    # Algorithm configuration
    algorithms: List[AlgorithmType] = Field(
        default=[AlgorithmType.RANDOM_FOREST, AlgorithmType.XGBOOST],
        description="Algorithms to train"
    )

    # Training configuration
    test_size: float = Field(0.15, ge=0.1, le=0.3, description="Test set size")
    validation_size: float = Field(0.15, ge=0.1, le=0.3, description="Validation set size")
    random_state: int = Field(42, description="Random seed for reproducibility")

    # Feature engineering
    feature_selection: FeatureSelectionMethod = Field(
        FeatureSelectionMethod.AUTO,
        description="Feature selection method"
    )
    selected_features: Optional[List[str]] = Field(None, description="Manually selected features")
    scale_features: bool = Field(True, description="Whether to scale features")

    # Hyperparameter tuning
    hyperparameter_tuning: HyperparameterTuningMethod = Field(
        HyperparameterTuningMethod.RANDOM_SEARCH,
        description="Hyperparameter tuning method"
    )
    tuning_iterations: int = Field(50, ge=10, le=200, description="Number of tuning iterations")
    cross_validation_folds: int = Field(5, ge=3, le=10, description="K-fold CV folds")

    # Evaluation
    target_metric: str = Field("f1_score", description="Target metric for optimization")
    early_stopping_rounds: int = Field(10, description="Early stopping rounds")

    # Resource limits
    max_training_time_minutes: int = Field(60, description="Maximum training time in minutes")
    n_jobs: int = Field(-1, description="Number of parallel jobs (-1 = all cores)")

    # Model versioning
    version_tag: Optional[str] = Field(None, description="Optional version tag")
    notes: Optional[str] = Field(None, description="Training notes")


class HyperparameterGrid(BaseModel):
    """Hyperparameter search space"""
    algorithm: AlgorithmType = Field(..., description="Algorithm type")
    parameters: Dict[str, List[Any]] = Field(..., description="Parameter grid")


class TrainingMetrics(BaseModel):
    """Training and evaluation metrics"""
    # Classification metrics
    accuracy: float = Field(..., ge=0.0, le=1.0, description="Accuracy score")
    precision: float = Field(..., ge=0.0, le=1.0, description="Precision score")
    recall: float = Field(..., ge=0.0, le=1.0, description="Recall score")
    f1_score: float = Field(..., ge=0.0, le=1.0, description="F1 score")
    auc_roc: float = Field(..., ge=0.0, le=1.0, description="AUC-ROC score")

    # Detailed metrics
    confusion_matrix: List[List[int]] = Field(..., description="Confusion matrix")
    classification_report: Dict[str, Any] = Field(..., description="Detailed classification report")

    # Cross-validation metrics
    cv_scores: Optional[List[float]] = Field(None, description="Cross-validation scores")
    cv_mean: Optional[float] = Field(None, description="Mean CV score")
    cv_std: Optional[float] = Field(None, description="CV standard deviation")

    # Training progress
    training_time_seconds: float = Field(..., description="Total training time")
    iterations_completed: Optional[int] = Field(None, description="Training iterations completed")


class FeatureImportance(BaseModel):
    """Feature importance analysis"""
    feature_name: str = Field(..., description="Feature name")
    importance_score: float = Field(..., description="Importance score")
    rank: int = Field(..., description="Importance rank")


class ModelVersion(BaseModel):
    """ML model version metadata"""
    model_id: str = Field(..., description="Unique model identifier")
    version: str = Field(..., description="Model version string")
    algorithm: AlgorithmType = Field(..., description="Algorithm used")

    # Training information
    training_date: datetime = Field(default_factory=datetime.utcnow, description="Training timestamp")
    training_samples: int = Field(..., description="Number of training samples")
    training_config: TrainingConfig = Field(..., description="Training configuration used")

    # Model performance
    metrics: TrainingMetrics = Field(..., description="Model performance metrics")
    feature_importance: List[FeatureImportance] = Field(
        default_factory=list,
        description="Feature importance rankings"
    )

    # Model artifacts
    model_path: str = Field(..., description="Path to serialized model")
    scaler_path: Optional[str] = Field(None, description="Path to feature scaler")
    hyperparameters: Dict[str, Any] = Field(default_factory=dict, description="Final hyperparameters")

    # Version control
    is_active: bool = Field(False, description="Whether this is the active model")
    is_deprecated: bool = Field(False, description="Whether model is deprecated")
    parent_model_id: Optional[str] = Field(None, description="Parent model ID if incremental")

    # Metadata
    created_by: Optional[str] = Field(None, description="User who trained the model")
    version_tag: Optional[str] = Field(None, description="Custom version tag")
    notes: Optional[str] = Field(None, description="Model notes")


class TrainingJob(BaseModel):
    """Training job tracking"""
    job_id: str = Field(..., description="Unique job identifier")
    status: TrainingStatus = Field(TrainingStatus.PENDING, description="Job status")

    # Configuration
    config: TrainingConfig = Field(..., description="Training configuration")

    # Progress tracking
    progress_percentage: float = Field(0.0, ge=0.0, le=100.0, description="Training progress")
    current_step: Optional[str] = Field(None, description="Current training step")
    algorithms_completed: List[AlgorithmType] = Field(
        default_factory=list,
        description="Algorithms completed"
    )

    # Results
    trained_models: List[str] = Field(default_factory=list, description="Trained model IDs")
    best_model_id: Optional[str] = Field(None, description="Best performing model ID")
    best_score: Optional[float] = Field(None, description="Best model score")

    # Timing
    started_at: Optional[datetime] = Field(None, description="Job start time")
    completed_at: Optional[datetime] = Field(None, description="Job completion time")
    estimated_time_remaining_seconds: Optional[float] = Field(
        None,
        description="Estimated time remaining"
    )

    # Error handling
    error_message: Optional[str] = Field(None, description="Error message if failed")
    warnings: List[str] = Field(default_factory=list, description="Warning messages")

    # Resource usage
    cpu_usage_percent: Optional[float] = Field(None, description="CPU usage percentage")
    memory_usage_mb: Optional[float] = Field(None, description="Memory usage in MB")

    # Logs
    logs: List[str] = Field(default_factory=list, description="Training logs")

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Job creation time")
    created_by: Optional[str] = Field(None, description="User who created job")


class EvaluationResults(BaseModel):
    """Model evaluation results"""
    model_id: str = Field(..., description="Model being evaluated")
    evaluation_date: datetime = Field(default_factory=datetime.utcnow, description="Evaluation timestamp")

    # Metrics
    metrics: TrainingMetrics = Field(..., description="Evaluation metrics")

    # Performance by category
    performance_by_university_tier: Dict[str, Dict[str, float]] = Field(
        default_factory=dict,
        description="Performance metrics by university tier (Reach/Target/Safety)"
    )

    # Calibration
    calibration_score: Optional[float] = Field(None, description="Probability calibration score")
    calibration_bins: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Calibration curve bins"
    )

    # Feature analysis
    feature_importance: List[FeatureImportance] = Field(..., description="Feature importance")

    # Visualizations (as base64 encoded images or paths)
    confusion_matrix_plot: Optional[str] = Field(None, description="Confusion matrix plot path")
    roc_curve_plot: Optional[str] = Field(None, description="ROC curve plot path")
    feature_importance_plot: Optional[str] = Field(None, description="Feature importance plot path")
    calibration_plot: Optional[str] = Field(None, description="Calibration curve plot path")


class ModelComparisonRequest(BaseModel):
    """Request to compare multiple models"""
    model_ids: List[str] = Field(..., min_items=2, description="Model IDs to compare")
    metrics: List[str] = Field(
        default=["accuracy", "precision", "recall", "f1_score", "auc_roc"],
        description="Metrics to compare"
    )
    include_visualizations: bool = Field(True, description="Include comparison plots")


class ModelComparisonResponse(BaseModel):
    """Model comparison results"""
    models: List[ModelVersion] = Field(..., description="Model versions compared")

    # Metric comparison
    metric_comparison: Dict[str, Dict[str, float]] = Field(
        ...,
        description="Metrics by model (metric_name -> {model_id: score})"
    )

    # Statistical tests
    statistical_significance: Optional[Dict[str, Any]] = Field(
        None,
        description="Statistical significance tests between models"
    )

    # Best model
    best_model_id: str = Field(..., description="Best performing model ID")
    best_metric: str = Field(..., description="Metric used for ranking")

    # Visualizations
    comparison_plots: Optional[Dict[str, str]] = Field(
        None,
        description="Comparison visualization paths"
    )


class ModelActivationRequest(BaseModel):
    """Request to activate a model"""
    model_id: str = Field(..., description="Model ID to activate")
    reason: Optional[str] = Field(None, description="Reason for activation")


class ScheduledTrainingConfig(BaseModel):
    """Configuration for scheduled training"""
    enabled: bool = Field(True, description="Whether scheduled training is enabled")
    schedule_cron: str = Field(
        "0 1 * * 0",  # Sunday 1 AM
        description="Cron expression for schedule"
    )
    min_new_samples: int = Field(
        1000,
        description="Minimum new samples required to trigger training"
    )
    auto_activate_if_better: bool = Field(
        True,
        description="Auto-activate new model if it performs better"
    )
    improvement_threshold: float = Field(
        0.02,
        description="Minimum improvement threshold for auto-activation"
    )
    notification_emails: List[str] = Field(
        default_factory=list,
        description="Emails to notify on completion"
    )


class DataQualityReport(BaseModel):
    """Data quality validation report"""
    total_samples: int = Field(..., description="Total samples in dataset")
    verified_samples: int = Field(..., description="Verified samples")

    # Quality checks
    feature_completeness: Dict[str, float] = Field(
        ...,
        description="Completeness percentage by feature"
    )
    duplicate_count: int = Field(..., description="Number of duplicate records")
    outlier_count: int = Field(..., description="Number of outliers detected")

    # Class balance
    class_distribution: Dict[str, int] = Field(..., description="Distribution of target classes")
    class_balance_ratio: float = Field(..., description="Minority/majority class ratio")

    # Data freshness
    data_date_range: Dict[str, str] = Field(..., description="Min and max dates in dataset")
    recent_data_percentage: float = Field(..., description="Percentage of data from last 2 years")

    # Samples by university
    samples_by_university: Dict[str, int] = Field(
        ...,
        description="Sample count per university"
    )
    universities_below_threshold: List[str] = Field(
        default_factory=list,
        description="Universities with insufficient samples"
    )

    # Validation result
    passes_quality_check: bool = Field(..., description="Overall quality check result")
    quality_issues: List[str] = Field(default_factory=list, description="Identified quality issues")
    recommendations: List[str] = Field(
        default_factory=list,
        description="Recommendations for improvement"
    )


class TrainingTrigger(BaseModel):
    """Training trigger event"""
    trigger_type: Literal["manual", "scheduled", "data_threshold", "performance_drop"] = Field(
        ...,
        description="Type of trigger"
    )
    triggered_at: datetime = Field(default_factory=datetime.utcnow, description="Trigger timestamp")
    triggered_by: Optional[str] = Field(None, description="User who triggered (if manual)")
    reason: Optional[str] = Field(None, description="Trigger reason")
    new_samples_count: Optional[int] = Field(None, description="New samples since last training")
