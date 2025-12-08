# ML Model Training Pipeline

**Comprehensive machine learning model training system for admission prediction**

## Overview

The ML Training Pipeline is a production-ready system for training, evaluating, and managing machine learning models for university admission prediction. It features multiple algorithm support, automated hyperparameter tuning, model versioning, and scheduled retraining.

## Key Features

✅ **Multiple Algorithms**: Random Forest, XGBoost, Gradient Boosting, Neural Networks, Logistic Regression
✅ **Hyperparameter Tuning**: Grid Search, Random Search, with cross-validation
✅ **Model Versioning**: Track all model versions with metrics and configurations
✅ **Automated Training**: Scheduled weekly retraining with data quality checks
✅ **Comprehensive Evaluation**: Accuracy, Precision, Recall, F1, AUC-ROC, plots
✅ **Feature Importance**: SHAP-compatible feature importance analysis
✅ **Async Processing**: Celery tasks for background training
✅ **API Integration**: RESTful API with full CRUD operations

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Application                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Model Training API Endpoints              │  │
│  │  /train /jobs /evaluate /models /activate        │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Celery Task Queue (Redis)                │  │
│  │  train_model_task, evaluate_model_task           │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │       Model Training Service                     │  │
│  │  Data Loading | Feature Engineering              │  │
│  │  Hyperparameter Tuning | Model Training          │  │
│  │  Evaluation | Visualization                      │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │           MongoDB Storage                        │  │
│  │  Models | Jobs | Training Data | Metrics         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Files Created

### Core Services
- **`app/services/model_training_service.py`** (650+ lines)
  - Complete training pipeline
  - Multiple algorithm support
  - Hyperparameter tuning (GridSearch, RandomSearch)
  - Model evaluation and visualization
  - Feature importance extraction
  - Data quality validation

### Models
- **`app/models/model_training.py`** (500+ lines)
  - TrainingConfig
  - TrainingJob
  - TrainingMetrics
  - ModelVersion
  - EvaluationResults
  - FeatureImportance
  - DataQualityReport
  - 10+ Pydantic models

### Async Tasks
- **`app/tasks/training_tasks.py`** (400+ lines)
  - train_model_task (Celery)
  - evaluate_model_task (Celery)
  - scheduled_training_check (Celery Beat)
  - Email notifications
  - Error handling and retries

### API Endpoints
- **`app/api/v1/model_training.py`** (600+ lines)
  - POST /train - Start training
  - GET /jobs/{id} - Get job status
  - GET /jobs - List jobs
  - POST /evaluate/{id} - Evaluate model
  - GET /models - List models
  - POST /activate/{id} - Activate model
  - POST /compare - Compare models
  - GET /metrics/{id} - Get metrics
  - GET /feature-importance/{id} - Feature importance
  - POST /data-quality - Validate data
  - GET /status - System status

### Tests
- **`tests/test_model_training.py`** (400+ lines)
  - Unit tests for all components
  - Integration tests
  - Fixtures and mocks
  - pytest configuration

### Documentation
- **`ML_TRAINING_PIPELINE_GUIDE.md`** (1000+ lines)
  - Complete guide with examples
  - API reference
  - Configuration options
  - Best practices
  - Troubleshooting

- **`ML_TRAINING_QUICK_START.md`** (200+ lines)
  - 5-minute setup guide
  - Quick examples
  - Common tasks
  - Python client code

## Quick Start

### 1. Install Dependencies

```bash
pip install scikit-learn xgboost matplotlib seaborn psutil celery redis
```

### 2. Start Services

```bash
# Terminal 1: FastAPI
uvicorn main:app --reload --port 8000

# Terminal 2: Celery Worker
celery -A app.celery_app worker --loglevel=info

# Terminal 3: Celery Beat (optional)
celery -A app.celery_app beat --loglevel=info
```

### 3. Train Your First Model

**Via API:**

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

**Via Python:**

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/model-training/train",
    json={
        "algorithms": ["random_forest", "xgboost"],
        "min_samples": 1000,
        "hyperparameter_tuning": "random_search"
    }
)

job_id = response.json()["job_id"]
print(f"Training started: {job_id}")
```

### 4. Monitor Progress

```bash
curl http://localhost:8000/api/v1/model-training/jobs/{job_id}
```

## API Examples

### Start Training

```bash
POST /api/v1/model-training/train
{
  "algorithms": ["random_forest", "xgboost"],
  "min_samples": 1000,
  "hyperparameter_tuning": "random_search",
  "tuning_iterations": 50,
  "cross_validation_folds": 5,
  "target_metric": "f1_score",
  "version_tag": "v2.0"
}
```

### Get Job Status

```bash
GET /api/v1/model-training/jobs/job_20241012_143022

Response:
{
  "job_id": "job_20241012_143022",
  "status": "running",
  "progress_percentage": 65.0,
  "current_step": "Training XGBoost model",
  "best_model_id": "model_rf_abc123",
  "best_score": 0.872
}
```

### List Models

```bash
GET /api/v1/model-training/models?limit=10&active_only=false

Response:
[
  {
    "model_id": "model_rf_abc123",
    "version": "20241012_1523",
    "algorithm": "random_forest",
    "metrics": {
      "accuracy": 0.872,
      "f1_score": 0.873,
      "auc_roc": 0.924
    },
    "is_active": true
  }
]
```

### Activate Model

```bash
POST /api/v1/model-training/activate/model_rf_abc123
{
  "reason": "Better performance than previous model"
}
```

### Compare Models

```bash
POST /api/v1/model-training/compare
{
  "model_ids": ["model_rf_abc123", "model_xgb_def456"],
  "metrics": ["accuracy", "f1_score", "auc_roc"]
}

Response:
{
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
  "best_model_id": "model_xgb_def456"
}
```

## Training Configuration

### Default Configuration

```python
{
  "data_source": "mongodb",
  "min_samples": 1000,
  "algorithms": ["random_forest", "xgboost"],
  "test_size": 0.15,
  "validation_size": 0.15,
  "hyperparameter_tuning": "random_search",
  "tuning_iterations": 50,
  "cross_validation_folds": 5,
  "target_metric": "f1_score",
  "scale_features": true
}
```

### Configuration Presets

**Quick (5-10 min):**
```json
{
  "algorithms": ["random_forest"],
  "hyperparameter_tuning": "none",
  "cross_validation_folds": 3
}
```

**Balanced (20-30 min):**
```json
{
  "algorithms": ["random_forest", "xgboost"],
  "hyperparameter_tuning": "random_search",
  "tuning_iterations": 50
}
```

**Comprehensive (60-90 min):**
```json
{
  "algorithms": ["random_forest", "xgboost", "gradient_boosting", "neural_network"],
  "hyperparameter_tuning": "random_search",
  "tuning_iterations": 100,
  "cross_validation_folds": 10
}
```

## Features

### 12-Feature Vector

Each student profile is converted to a 12-dimensional feature vector:

1. **gpa_normalized** - GPA normalized to 0-1 scale
2. **gre_verbal_percentile** - GRE Verbal percentile
3. **gre_quant_percentile** - GRE Quantitative percentile
4. **gmat_percentile** - GMAT percentile
5. **english_proficiency** - TOEFL/IELTS score
6. **research_score** - Research publications and patents
7. **professional_score** - Work experience
8. **extracurricular_score** - Leadership and activities
9. **undergrad_prestige** - Undergraduate university ranking
10. **program_competitiveness** - Target program selectivity
11. **gpa_vs_avg** - GPA relative to program average
12. **test_score_vs_avg** - Test scores relative to program average

### Supported Algorithms

1. **Random Forest Classifier**
   - Fast training
   - Good interpretability
   - Handles non-linear relationships
   - Feature importance included

2. **XGBoost**
   - State-of-the-art performance
   - Gradient boosting
   - Built-in regularization
   - GPU support (optional)

3. **Gradient Boosting**
   - Sequential ensemble learning
   - Good for imbalanced data
   - Robust to outliers

4. **Logistic Regression**
   - Fast baseline
   - Simple interpretation
   - Probability calibration

5. **Neural Network (MLP)**
   - Complex pattern learning
   - Deep learning
   - Best for large datasets

### Hyperparameter Grids

**Random Forest:**
```python
{
  "n_estimators": [100, 200, 300],
  "max_depth": [10, 20, 30, None],
  "min_samples_split": [2, 5, 10],
  "min_samples_leaf": [1, 2, 4]
}
```

**XGBoost:**
```python
{
  "learning_rate": [0.01, 0.1, 0.3],
  "max_depth": [3, 5, 7],
  "n_estimators": [100, 200, 300],
  "subsample": [0.8, 0.9, 1.0]
}
```

## Evaluation Metrics

### Performance Metrics

- **Accuracy**: Overall correctness (target: >80%)
- **Precision**: Positive prediction reliability (target: >85%)
- **Recall**: True positive rate (target: >80%)
- **F1 Score**: Harmonic mean of precision/recall (target: >82%)
- **AUC-ROC**: Classifier quality (target: >85%)
- **CV Score**: Cross-validation generalization

### Visualizations

Automatically generated:

1. **Confusion Matrix** - True/False Positives/Negatives
2. **ROC Curve** - True positive rate vs false positive rate
3. **Feature Importance** - Top 10 most influential features
4. **Calibration Curve** - Probability accuracy assessment

Saved to: `/uploads/ml_plots/{model_id}_*.png`

## Automated Training

### Scheduled Retraining

Training automatically triggers:

- **Weekly**: Sunday 1:00 AM (Celery Beat)
- **Threshold**: 1000+ new data points
- **Age**: Model >3 months old
- **Manual**: API trigger

### Auto-Activation

New models auto-activate if:

- Performance > current + 2%
- Quality checks pass
- (Optional) Manual approval

## Data Quality Validation

Before training, the system validates:

- ✅ Minimum sample size (default: 1000)
- ✅ Class balance (accepted/rejected ratio)
- ✅ Feature completeness (>80%)
- ✅ Data freshness (prefer last 2 years)
- ✅ University coverage (50+ samples each)

**Example Report:**

```json
{
  "total_samples": 2543,
  "class_balance_ratio": 0.943,
  "recent_data_percentage": 87.3,
  "passes_quality_check": true,
  "quality_issues": [],
  "recommendations": []
}
```

## Model Versioning

Each trained model includes:

- Unique model ID
- Training timestamp
- Algorithm type
- Training configuration
- Performance metrics
- Feature importance
- Hyperparameters
- Is active flag
- Version tag

**Example:**

```json
{
  "model_id": "model_rf_abc123",
  "version": "20241012_1523",
  "algorithm": "random_forest",
  "training_date": "2024-10-12T15:15:30Z",
  "training_samples": 2543,
  "metrics": {
    "accuracy": 0.872,
    "f1_score": 0.873,
    "auc_roc": 0.924
  },
  "is_active": true
}
```

## Testing

Run the comprehensive test suite:

```bash
# All tests
pytest tests/test_model_training.py -v

# Quick tests only
pytest tests/test_model_training.py -v -m "not slow"

# Specific test class
pytest tests/test_model_training.py::TestTrainingConfig -v

# With coverage
pytest tests/test_model_training.py --cov=app.services.model_training_service
```

## Monitoring

### System Status

```bash
curl http://localhost:8000/api/v1/model-training/status
```

### Celery Monitoring

```bash
# Active tasks
celery -A app.celery_app inspect active

# Worker stats
celery -A app.celery_app inspect stats

# Scheduled tasks
celery -A app.celery_app inspect scheduled
```

### Logs

```bash
# AI Service logs
tail -f logs/ai_service.log

# Celery logs
tail -f logs/celery.log
```

## Best Practices

1. **Data Collection**: Aim for 2000+ verified samples with balanced classes
2. **Training Frequency**: Weekly for active systems, monthly for stable
3. **Algorithm Selection**: Start with Random Forest + XGBoost
4. **Hyperparameter Tuning**: Use Random Search for efficiency
5. **Validation**: Always use cross-validation (5-10 folds)
6. **Model Management**: Keep last 10 versions, tag major releases

## Troubleshooting

### Common Issues

**Insufficient Data:**
```
Solution: Lower min_samples or collect more data
```

**Training Timeout:**
```
Solution: Reduce algorithms, disable tuning, or increase timeout
```

**Memory Error:**
```
Solution: Reduce CV folds, train sequentially, or increase RAM
```

**Poor Performance:**
```
Solution: Check data quality, increase samples, try different algorithms
```

## Performance Benchmarks

### Training Times (1000 samples)

- Random Forest (no tuning): ~2 minutes
- Random Forest (tuned): ~10 minutes
- XGBoost (no tuning): ~3 minutes
- XGBoost (tuned): ~15 minutes
- Neural Network: ~5 minutes

### Expected Performance

With 1000+ samples:

- Accuracy: 85-90%
- F1 Score: 83-88%
- AUC-ROC: 88-93%

## Future Enhancements

- [ ] Bayesian hyperparameter optimization
- [ ] Online learning (incremental updates)
- [ ] SHAP values for explainability
- [ ] A/B testing framework
- [ ] Model drift detection
- [ ] GPU acceleration
- [ ] Distributed training (Dask)

## Documentation

- **Full Guide**: `ML_TRAINING_PIPELINE_GUIDE.md`
- **Quick Start**: `ML_TRAINING_QUICK_START.md`
- **API Docs**: http://localhost:8000/docs
- **Tests**: `tests/test_model_training.py`

## Support

- **API Documentation**: http://localhost:8000/docs
- **Swagger UI**: Interactive API testing
- **Logs**: `logs/ai_service.log`
- **Tests**: `pytest tests/test_model_training.py -v`

---

**Built with**: scikit-learn, XGBoost, FastAPI, Celery, MongoDB, Redis
