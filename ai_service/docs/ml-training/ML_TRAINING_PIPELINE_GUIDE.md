# ML Model Training Pipeline - Complete Guide

## Overview

This document provides a comprehensive guide to the ML model training pipeline for admission prediction in the EduLen AI service. The pipeline supports multiple algorithms, automated hyperparameter tuning, model versioning, and scheduled retraining.

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [API Reference](#api-reference)
5. [Training Configuration](#training-configuration)
6. [Model Evaluation](#model-evaluation)
7. [Automated Training](#automated-training)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ML Training Pipeline                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   FastAPI    │───▶│    Celery    │───▶│   MongoDB    │  │
│  │   Endpoints  │    │    Tasks     │    │   Storage    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Training   │───▶│    Model     │───▶│  Evaluation  │  │
│  │   Service    │    │  Versioning  │    │    Plots     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
ai_service/
├── app/
│   ├── models/
│   │   └── model_training.py          # Pydantic models
│   ├── services/
│   │   └── model_training_service.py  # Training logic
│   ├── tasks/
│   │   └── training_tasks.py          # Celery tasks
│   └── api/
│       └── v1/
│           └── model_training.py      # API endpoints
├── tests/
│   └── test_model_training.py         # Unit tests
└── uploads/
    ├── ml_models/                     # Trained models
    └── ml_plots/                      # Evaluation plots
```

---

## Features

### 1. Multiple Algorithm Support

Train and compare multiple algorithms simultaneously:

- **Random Forest Classifier**
- **XGBoost**
- **Gradient Boosting**
- **Logistic Regression**
- **Neural Network (MLP)**
- **Ensemble Models** (combining multiple algorithms)

### 2. Hyperparameter Tuning

Optimize model performance with:

- **Grid Search**: Exhaustive search over parameter space
- **Random Search**: Efficient random sampling (recommended)
- **Bayesian Optimization**: Intelligent parameter exploration (future)

### 3. Model Versioning

Track all model versions with:

- Unique model IDs
- Training configuration
- Performance metrics
- Feature importance
- Timestamps and metadata

### 4. Automated Training Triggers

Training automatically starts when:

- 1000+ new data points collected
- Weekly scheduled retraining (Sunday 1 AM)
- Current model performance drops
- Manual API trigger

### 5. Comprehensive Evaluation

Evaluate models with:

- Accuracy, Precision, Recall, F1, AUC-ROC
- Confusion matrices
- ROC curves
- Feature importance plots
- Calibration curves
- Cross-validation scores

### 6. Data Quality Validation

Validate data before training:

- Minimum sample size checks
- Class balance analysis
- Feature completeness
- Data freshness (prefer recent data)
- University coverage

---

## Getting Started

### Prerequisites

```bash
# Install required packages
pip install scikit-learn xgboost matplotlib seaborn psutil

# Or using the project's pyproject.toml
cd ai_service
uv sync
```

### Environment Setup

Add to `.env`:

```bash
# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# Model Storage
UPLOAD_DIR=./uploads

# Training Configuration
MIN_TRAINING_SAMPLES=1000
AUTO_TRAINING_ENABLED=true
```

### Start Services

```bash
# Terminal 1: Start AI Service
cd ai_service
uvicorn main:app --reload --port 8000

# Terminal 2: Start Celery Worker
cd ai_service
celery -A app.celery_app worker --loglevel=info

# Terminal 3: Start Celery Beat (for scheduled tasks)
cd ai_service
celery -A app.celery_app beat --loglevel=info
```

---

## API Reference

### Base URL

```
http://localhost:8000/api/v1/model-training
```

### Endpoints

#### 1. Start Training

**POST** `/train`

Start a new model training job.

**Request Body:**

```json
{
  "algorithms": ["random_forest", "xgboost", "gradient_boosting"],
  "min_samples": 1000,
  "test_size": 0.15,
  "validation_size": 0.15,
  "hyperparameter_tuning": "random_search",
  "tuning_iterations": 50,
  "cross_validation_folds": 5,
  "target_metric": "f1_score",
  "scale_features": true,
  "version_tag": "v2.0",
  "notes": "Training with updated dataset"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Training job started",
  "job_id": "job_20241012_143022",
  "status": "queued",
  "estimated_time_minutes": 30
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/api/v1/model-training/train \
  -H "Content-Type: application/json" \
  -d '{
    "algorithms": ["random_forest", "xgboost"],
    "min_samples": 1000,
    "hyperparameter_tuning": "random_search",
    "target_metric": "f1_score"
  }'
```

#### 2. Get Training Job Status

**GET** `/jobs/{job_id}`

Get the status and progress of a training job.

**Response:**

```json
{
  "job_id": "job_20241012_143022",
  "status": "running",
  "progress_percentage": 65.0,
  "current_step": "Training XGBoost model",
  "algorithms_completed": ["random_forest"],
  "started_at": "2024-10-12T14:30:22Z",
  "estimated_time_remaining_seconds": 600,
  "trained_models": ["model_rf_abc123"],
  "best_model_id": "model_rf_abc123",
  "best_score": 0.872
}
```

**Example:**

```bash
curl http://localhost:8000/api/v1/model-training/jobs/job_20241012_143022
```

#### 3. List Training Jobs

**GET** `/jobs?limit=50&status=completed`

List recent training jobs.

**Query Parameters:**

- `limit` (int): Max jobs to return (default: 50, max: 200)
- `status` (string): Filter by status (pending, running, completed, failed, cancelled)

**Response:**

```json
[
  {
    "job_id": "job_20241012_143022",
    "status": "completed",
    "config": {...},
    "trained_models": ["model_rf_abc123", "model_xgb_def456"],
    "best_model_id": "model_rf_abc123",
    "completed_at": "2024-10-12T15:15:30Z"
  }
]
```

#### 4. Evaluate Model

**POST** `/evaluate/{model_id}?generate_plots=true`

Evaluate a trained model with comprehensive metrics.

**Response:**

```json
{
  "success": true,
  "message": "Evaluation started",
  "task_id": "celery_task_xyz",
  "model_id": "model_rf_abc123"
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/api/v1/model-training/evaluate/model_rf_abc123
```

#### 5. Get Evaluation Results

**GET** `/evaluate/{model_id}/results`

Get complete evaluation results.

**Response:**

```json
{
  "model_id": "model_rf_abc123",
  "evaluation_date": "2024-10-12T15:20:00Z",
  "metrics": {
    "accuracy": 0.872,
    "precision": 0.865,
    "recall": 0.881,
    "f1_score": 0.873,
    "auc_roc": 0.924,
    "cv_mean": 0.868,
    "cv_std": 0.012
  },
  "feature_importance": [...],
  "confusion_matrix_plot": "/uploads/ml_plots/model_rf_abc123_confusion_matrix.png",
  "roc_curve_plot": "/uploads/ml_plots/model_rf_abc123_roc_curve.png"
}
```

#### 6. List Models

**GET** `/models?limit=50&active_only=false`

List trained model versions.

**Response:**

```json
[
  {
    "model_id": "model_rf_abc123",
    "version": "20241012_1523",
    "algorithm": "random_forest",
    "training_date": "2024-10-12T15:15:30Z",
    "metrics": {...},
    "is_active": true,
    "training_samples": 2543
  }
]
```

#### 7. Activate Model

**POST** `/activate/{model_id}`

Set a model as active for predictions.

**Request Body:**

```json
{
  "model_id": "model_rf_abc123",
  "reason": "Better performance than previous model"
}
```

**Response:**

```json
{
  "model_id": "model_rf_abc123",
  "is_active": true,
  "activated_at": "2024-10-12T15:30:00Z"
}
```

#### 8. Compare Models

**POST** `/compare`

Compare multiple model versions.

**Request Body:**

```json
{
  "model_ids": ["model_rf_abc123", "model_xgb_def456"],
  "metrics": ["accuracy", "f1_score", "auc_roc"],
  "include_visualizations": true
}
```

**Response:**

```json
{
  "models": [...],
  "metric_comparison": {
    "accuracy": {
      "model_rf_abc123": 0.872,
      "model_xgb_def456": 0.885
    },
    "f1_score": {
      "model_rf_abc123": 0.873,
      "model_xgb_def456": 0.881
    }
  },
  "best_model_id": "model_xgb_def456",
  "best_metric": "f1_score"
}
```

#### 9. Get Model Metrics

**GET** `/metrics/{model_id}`

Get performance metrics for a specific model.

#### 10. Get Feature Importance

**GET** `/feature-importance/{model_id}`

Get feature importance rankings.

**Response:**

```json
{
  "model_id": "model_rf_abc123",
  "feature_importance": [
    {
      "feature": "gpa_normalized",
      "importance": 0.245,
      "rank": 1
    },
    {
      "feature": "gre_quant_percentile",
      "importance": 0.198,
      "rank": 2
    }
  ]
}
```

#### 11. Check Data Quality

**POST** `/data-quality`

Validate data quality before training.

**Response:**

```json
{
  "total_samples": 2543,
  "verified_samples": 2543,
  "class_distribution": {
    "accepted": 1234,
    "rejected": 1309
  },
  "class_balance_ratio": 0.943,
  "passes_quality_check": true,
  "quality_issues": [],
  "recommendations": []
}
```

#### 12. Get Training Status

**GET** `/status`

Get overall training system status.

**Response:**

```json
{
  "status": "operational",
  "models": {
    "total": 15,
    "active": 1,
    "active_model_id": "model_rf_abc123"
  },
  "jobs": {
    "running": 0,
    "pending": 0,
    "completed": 12,
    "failed": 3
  },
  "latest_model": {
    "model_id": "model_rf_abc123",
    "f1_score": 0.873
  }
}
```

---

## Training Configuration

### Configuration Options

```python
class TrainingConfig:
    # Data Configuration
    data_source: DataSource = "mongodb"
    min_samples: int = 1000
    use_verified_only: bool = True

    # Algorithm Selection
    algorithms: List[AlgorithmType] = [
        "random_forest",
        "xgboost",
        "gradient_boosting"
    ]

    # Data Splitting
    test_size: float = 0.15          # 15% for testing
    validation_size: float = 0.15    # 15% for validation
    random_state: int = 42           # For reproducibility

    # Feature Engineering
    feature_selection: str = "auto"
    scale_features: bool = True

    # Hyperparameter Tuning
    hyperparameter_tuning: str = "random_search"
    tuning_iterations: int = 50
    cross_validation_folds: int = 5

    # Optimization
    target_metric: str = "f1_score"
    early_stopping_rounds: int = 10

    # Resource Limits
    max_training_time_minutes: int = 60
    n_jobs: int = -1  # Use all CPU cores

    # Versioning
    version_tag: str = None
    notes: str = None
```

### Recommended Configurations

#### Quick Training (Development)

```json
{
  "algorithms": ["random_forest"],
  "min_samples": 500,
  "hyperparameter_tuning": "none",
  "cross_validation_folds": 3
}
```

Estimated time: 5-10 minutes

#### Balanced Training (Default)

```json
{
  "algorithms": ["random_forest", "xgboost"],
  "min_samples": 1000,
  "hyperparameter_tuning": "random_search",
  "tuning_iterations": 50,
  "cross_validation_folds": 5
}
```

Estimated time: 20-30 minutes

#### Comprehensive Training (Production)

```json
{
  "algorithms": [
    "random_forest",
    "xgboost",
    "gradient_boosting",
    "neural_network"
  ],
  "min_samples": 2000,
  "hyperparameter_tuning": "random_search",
  "tuning_iterations": 100,
  "cross_validation_folds": 10
}
```

Estimated time: 60-90 minutes

---

## Model Evaluation

### Evaluation Metrics

1. **Accuracy**: Overall correctness
2. **Precision**: Positive prediction reliability
3. **Recall**: True positive detection rate
4. **F1 Score**: Harmonic mean of precision and recall
5. **AUC-ROC**: Area under ROC curve (classifier quality)
6. **Cross-Validation Score**: Model generalization

### Visualizations

The pipeline automatically generates:

1. **Confusion Matrix**: True/False Positives/Negatives
2. **ROC Curve**: True positive rate vs false positive rate
3. **Feature Importance**: Most influential features
4. **Calibration Curve**: Probability accuracy

### Interpreting Results

#### Good Model Indicators

- F1 Score > 0.80
- AUC-ROC > 0.85
- Low CV standard deviation (<0.05)
- Balanced confusion matrix
- Well-calibrated probabilities

#### Warning Signs

- High variance in CV scores (overfitting)
- Imbalanced confusion matrix (bias)
- Poor calibration (probability estimates unreliable)
- Very high training score, low test score (overfitting)

---

## Automated Training

### Scheduled Training

Training automatically triggers weekly (Sunday 1 AM) if:

- 1000+ new verified data points collected
- Current model is > 3 months old
- Data quality checks pass

### Manual Trigger

Trigger training via API or Python:

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/model-training/train",
    json={
        "algorithms": ["random_forest", "xgboost"],
        "version_tag": "manual_trigger"
    }
)
```

### Auto-Activation

New models automatically activate if:

- Performance > current model + 2% threshold
- All quality checks pass
- Manual approval (configurable)

---

## Best Practices

### 1. Data Collection

- Collect at least 1000 verified data points
- Ensure balanced classes (accepted/rejected ~50/50)
- Include diverse universities (50+ samples each)
- Prioritize recent data (last 2 years)

### 2. Training Frequency

- Weekly for active systems
- Monthly for stable systems
- Immediate after major data updates

### 3. Model Selection

Start with **Random Forest** and **XGBoost**:
- Fast training
- Good performance
- Interpretable feature importance

Add **Neural Networks** for:
- Large datasets (5000+ samples)
- Complex patterns
- Better performance (usually)

### 4. Hyperparameter Tuning

- Use **Random Search** for efficiency
- Use **Grid Search** for final tuning
- Start with 50 iterations, increase if needed

### 5. Validation

- Always use cross-validation (5-10 folds)
- Evaluate on holdout test set
- Compare with previous model
- Check calibration curves

### 6. Model Management

- Keep last 10 model versions
- Tag major versions (v1.0, v2.0)
- Document significant changes
- Maintain rollback capability

---

## Troubleshooting

### Common Issues

#### 1. Insufficient Data

**Error:** "Insufficient data: 500 samples, need 1000"

**Solution:**
- Lower `min_samples` threshold (for testing)
- Collect more admission data
- Use synthetic data generation (SMOTE)

#### 2. Training Timeout

**Error:** "Training exceeded max_training_time_minutes"

**Solution:**
- Reduce algorithms count
- Disable hyperparameter tuning
- Reduce tuning iterations
- Increase timeout limit

#### 3. Memory Error

**Error:** "MemoryError during training"

**Solution:**
- Reduce cross-validation folds
- Train algorithms sequentially
- Reduce dataset size
- Increase system RAM

#### 4. Poor Model Performance

**Symptoms:** F1 score < 0.70

**Solutions:**
- Check data quality (balanced classes?)
- Increase training samples
- Try different algorithms
- Feature engineering improvements
- More hyperparameter tuning

#### 5. Celery Task Not Starting

**Symptoms:** Training job stuck in "pending"

**Solutions:**
- Check Celery worker is running
- Check Redis connection
- Review Celery logs
- Restart Celery worker

### Debugging

Enable detailed logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check training logs:

```bash
tail -f logs/ai_service.log
```

Monitor Celery tasks:

```bash
celery -A app.celery_app inspect active
```

---

## Performance Optimization

### Training Speed

1. **Use Random Search** instead of Grid Search (5-10x faster)
2. **Reduce CV folds** (5 instead of 10)
3. **Parallel processing** (`n_jobs=-1`)
4. **Early stopping** for boosting algorithms

### Model Quality

1. **Collect more data** (diminishing returns after 5000 samples)
2. **Feature engineering** (domain knowledge)
3. **Ensemble methods** (combine multiple models)
4. **Calibration** (improve probability estimates)

### Resource Usage

1. **Batch processing** (train offline, serve online)
2. **Model compression** (reduce size without performance loss)
3. **Caching** (Redis for predictions)
4. **Async operations** (Celery for long tasks)

---

## Future Enhancements

### Planned Features

- [ ] Bayesian hyperparameter optimization
- [ ] Online learning (incremental updates)
- [ ] SHAP values for explainability
- [ ] A/B testing framework
- [ ] Model drift detection
- [ ] Automated feature selection
- [ ] GPU acceleration support
- [ ] Distributed training (Dask)

---

## Support

For issues, questions, or contributions:

- **Documentation**: `/docs` endpoint on FastAPI
- **API Testing**: Swagger UI at `http://localhost:8000/docs`
- **Logs**: `logs/ai_service.log`
- **Tests**: `pytest tests/test_model_training.py -v`

---

## License

Part of EduLen AI Service - Educational use and study abroad applications.
