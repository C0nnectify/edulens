# ML Training Pipeline - Quick Start

## 5-Minute Setup

### 1. Install Dependencies

```bash
cd ai_service
pip install scikit-learn xgboost matplotlib seaborn psutil celery redis
```

### 2. Start Services

```bash
# Terminal 1: AI Service
uvicorn main:app --reload --port 8000

# Terminal 2: Celery Worker
celery -A app.celery_app worker --loglevel=info

# Terminal 3: Celery Beat (optional, for scheduled training)
celery -A app.celery_app beat --loglevel=info
```

### 3. Start Training

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

**Response:**
```json
{
  "success": true,
  "job_id": "job_20241012_143022"
}
```

### 4. Check Status

```bash
curl http://localhost:8000/api/v1/model-training/jobs/job_20241012_143022
```

---

## Common Tasks

### List All Models

```bash
curl http://localhost:8000/api/v1/model-training/models
```

### Activate Best Model

```bash
curl -X POST http://localhost:8000/api/v1/model-training/activate/model_rf_abc123 \
  -H "Content-Type: application/json" \
  -d '{"reason": "Better performance"}'
```

### Evaluate Model

```bash
curl -X POST http://localhost:8000/api/v1/model-training/evaluate/model_rf_abc123
```

### Compare Models

```bash
curl -X POST http://localhost:8000/api/v1/model-training/compare \
  -H "Content-Type: application/json" \
  -d '{
    "model_ids": ["model_rf_abc123", "model_xgb_def456"],
    "metrics": ["accuracy", "f1_score", "auc_roc"]
  }'
```

---

## Python Client Example

```python
import requests
import time

BASE_URL = "http://localhost:8000/api/v1/model-training"

# 1. Start training
config = {
    "algorithms": ["random_forest", "xgboost"],
    "min_samples": 1000,
    "hyperparameter_tuning": "random_search",
    "version_tag": "v1.0"
}

response = requests.post(f"{BASE_URL}/train", json=config)
job_id = response.json()["job_id"]
print(f"Training started: {job_id}")

# 2. Poll for completion
while True:
    job = requests.get(f"{BASE_URL}/jobs/{job_id}").json()
    status = job["status"]
    progress = job["progress_percentage"]

    print(f"Status: {status}, Progress: {progress}%")

    if status in ["completed", "failed"]:
        break

    time.sleep(10)  # Check every 10 seconds

# 3. Get best model
if status == "completed":
    best_model_id = job["best_model_id"]
    print(f"Training completed! Best model: {best_model_id}")

    # 4. Activate model
    requests.post(
        f"{BASE_URL}/activate/{best_model_id}",
        json={"reason": "Latest training"}
    )
    print(f"Model activated: {best_model_id}")

    # 5. Get evaluation results
    eval_results = requests.get(
        f"{BASE_URL}/evaluate/{best_model_id}/results"
    ).json()

    print("\nPerformance Metrics:")
    print(f"  Accuracy: {eval_results['metrics']['accuracy']:.3f}")
    print(f"  F1 Score: {eval_results['metrics']['f1_score']:.3f}")
    print(f"  AUC-ROC:  {eval_results['metrics']['auc_roc']:.3f}")
```

---

## Configuration Presets

### Development (Fast)

```json
{
  "algorithms": ["random_forest"],
  "min_samples": 500,
  "hyperparameter_tuning": "none",
  "cross_validation_folds": 3
}
```

Time: ~5 minutes

### Production (Balanced)

```json
{
  "algorithms": ["random_forest", "xgboost"],
  "min_samples": 1000,
  "hyperparameter_tuning": "random_search",
  "tuning_iterations": 50,
  "cross_validation_folds": 5
}
```

Time: ~30 minutes

### Research (Comprehensive)

```json
{
  "algorithms": ["random_forest", "xgboost", "gradient_boosting", "neural_network"],
  "min_samples": 2000,
  "hyperparameter_tuning": "random_search",
  "tuning_iterations": 100,
  "cross_validation_folds": 10
}
```

Time: ~90 minutes

---

## Monitoring

### View Training Status

```bash
curl http://localhost:8000/api/v1/model-training/status
```

### Check Celery Workers

```bash
celery -A app.celery_app inspect active
celery -A app.celery_app inspect stats
```

### View Logs

```bash
tail -f logs/ai_service.log
```

---

## Troubleshooting

### Training Not Starting?

1. Check Celery worker is running
2. Check Redis connection
3. Review logs: `tail -f logs/ai_service.log`

### Insufficient Data?

Lower `min_samples`:

```json
{
  "min_samples": 100
}
```

### Out of Memory?

Reduce algorithms or CV folds:

```json
{
  "algorithms": ["random_forest"],
  "cross_validation_folds": 3
}
```

---

## Next Steps

- Read full guide: `ML_TRAINING_PIPELINE_GUIDE.md`
- Run tests: `pytest tests/test_model_training.py -v`
- View API docs: http://localhost:8000/docs
- Check examples in documentation

---

## Support

- API Documentation: http://localhost:8000/docs
- Full Guide: ML_TRAINING_PIPELINE_GUIDE.md
- Tests: tests/test_model_training.py
