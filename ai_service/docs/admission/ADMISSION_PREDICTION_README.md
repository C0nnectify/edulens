# Admission Prediction Service

## Overview

The Admission Prediction Service is a comprehensive machine learning infrastructure that predicts university admission probabilities for students based on their academic profiles and target programs. It provides data-driven insights, gap analysis, and personalized recommendations to help students make informed decisions about their applications.

## Features

### 1. **ML-Powered Predictions**
- **Multiple ML Algorithms**: Supports Random Forest, Gradient Boosting, and Logistic Regression
- **Heuristic Fallback**: Provides predictions even without trained models
- **Confidence Intervals**: Returns probability ranges for better decision-making
- **Feature Importance**: Identifies key factors influencing admission decisions

### 2. **School Categorization**
- **Reach Schools**: <25% predicted chance
- **Target Schools**: 25-75% predicted chance
- **Safety Schools**: >75% predicted chance

### 3. **Gap Analysis**
- Compare student profile to average admitted students
- Identify specific areas for improvement
- Prioritized action items based on impact

### 4. **Similar Profile Matching**
- Find historical profiles with similar credentials
- View outcomes for comparable applicants
- Learn from successful strategies

### 5. **Batch Predictions**
- Evaluate multiple programs simultaneously
- Automatic school categorization
- Summary statistics across applications

## Architecture

### Data Models

#### StudentProfile
```python
{
  "gpa": 3.8,  # Normalized to 4.0 scale
  "gpa_scale": 4.0,
  "undergraduate_university": "XYZ University",
  "undergraduate_university_ranking": 150,
  "test_scores": [
    {
      "test_type": "gre",
      "total_score": 325,
      "verbal_score": 160,
      "quantitative_score": 165
    }
  ],
  "research_publications": 2,
  "work_experience_months": 24,
  "internships_count": 3,
  "academic_awards": 2
}
```

#### ProgramInfo
```python
{
  "university_name": "Stanford University",
  "university_ranking": 3,
  "program_name": "Computer Science",
  "degree_level": "masters",
  "acceptance_rate": 0.05,
  "average_gpa": 3.9,
  "gre_quant_avg": 168
}
```

#### AdmissionPrediction
```python
{
  "probability": 0.65,
  "probability_percentage": 65.0,
  "confidence_interval_lower": 0.55,
  "confidence_interval_upper": 0.75,
  "category": "target",
  "strengths": [
    "Excellent GPA (3.8/4.0)",
    "Strong research background with publications"
  ],
  "weaknesses": [
    "GRE Quantitative below average"
  ],
  "recommendation": "You have a moderate chance...",
  "suggested_improvements": [
    "Invest time in standardized test preparation",
    "Secure strong letters of recommendation"
  ]
}
```

### Feature Engineering

The service extracts and engineers 12 key features:

1. **GPA Normalized** (0-1 scale)
2. **GRE Verbal Percentile** (0-100)
3. **GRE Quantitative Percentile** (0-100)
4. **GMAT Percentile** (0-100)
5. **English Proficiency Score** (TOEFL/IELTS normalized)
6. **Research Score** (publications, conferences, patents)
7. **Professional Score** (work experience, internships)
8. **Extracurricular Score** (leadership, awards, volunteering)
9. **Undergraduate Prestige** (university ranking-based)
10. **Program Competitiveness** (acceptance rate, ranking)
11. **GPA vs Average** (difference from program average)
12. **Test Score vs Average** (difference from program average)

### MongoDB Collections

#### admission_data
Stores historical admission outcomes for training.

**Indexes:**
- `data_point_id` (unique)
- `user_id`
- `program.university_name` + `program.program_name` (compound)
- `decision`
- `application_year`
- `profile.gpa` + `decision` (compound)
- `verified`

#### profile_evaluations
Stores user evaluations and predictions.

**Indexes:**
- `evaluation_id` (unique)
- `user_id`
- `evaluation_date`
- `user_id` + `evaluation_date` (compound, descending)

#### ml_models
Stores ML model metadata and performance metrics.

**Indexes:**
- `model_id` (unique)
- `is_active` + `is_deprecated` (compound)
- `training_date`

## API Endpoints

### 1. Single Program Prediction

**POST** `/api/v1/admission/predict`

Predict admission probability for a single program.

**Request:**
```json
{
  "student_profile": {
    "gpa": 3.8,
    "test_scores": [
      {
        "test_type": "gre",
        "total_score": 325,
        "verbal_score": 160,
        "quantitative_score": 165
      }
    ],
    "research_publications": 2,
    "work_experience_months": 24
  },
  "target_program": {
    "university_name": "Stanford University",
    "program_name": "Computer Science",
    "degree_level": "masters",
    "acceptance_rate": 0.05
  },
  "include_gap_analysis": true,
  "include_similar_profiles": true
}
```

**Response:**
```json
{
  "evaluation_id": "eval_abc123",
  "user_id": "user_789",
  "prediction": {
    "probability": 0.35,
    "probability_percentage": 35.0,
    "category": "reach",
    "strengths": ["Excellent GPA", "Strong research background"],
    "weaknesses": ["GRE Quantitative below average"],
    "recommendation": "Consider this as a reach school...",
    "suggested_improvements": [...]
  },
  "gap_analysis": {
    "gpa_gap": -0.1,
    "test_score_gap": -3,
    "overall_competitiveness": 0.72,
    "gaps_to_address": [...]
  },
  "similar_admits": [...],
  "model_version": "1.0.150"
}
```

### 2. Batch Program Prediction

**POST** `/api/v1/admission/predict/batch`

Evaluate multiple programs at once.

**Request:**
```json
{
  "student_profile": {...},
  "target_programs": [
    {
      "university_name": "Stanford University",
      "program_name": "Computer Science",
      "degree_level": "masters"
    },
    {
      "university_name": "UC Berkeley",
      "program_name": "Computer Science",
      "degree_level": "masters"
    }
  ],
  "categorize_schools": true
}
```

**Response:**
```json
{
  "evaluations": [...],
  "reach_schools": ["Stanford University - Computer Science"],
  "target_schools": ["UC Berkeley - Computer Science"],
  "safety_schools": [],
  "average_probability": 0.42,
  "highest_probability": 0.65,
  "lowest_probability": 0.35
}
```

### 3. Contribute Admission Data

**POST** `/api/v1/admission/data/contribute`

Contribute historical admission data to improve predictions.

**Request:**
```json
{
  "profile": {...},
  "program": {...},
  "decision": "accepted",
  "application_year": 2024,
  "application_cycle": "fall",
  "scholarship_amount": 25000,
  "assistantship_offered": true,
  "allow_anonymous_use": true
}
```

### 4. Get Previous Evaluations

**GET** `/api/v1/admission/evaluations?limit=10&skip=0`

Retrieve user's previous evaluations.

**GET** `/api/v1/admission/evaluations/{evaluation_id}`

Retrieve specific evaluation by ID.

### 5. Model Management (Admin)

**POST** `/api/v1/admission/model/train`

Train a new ML model on historical data.

**Query Parameters:**
- `model_type`: "random_forest" | "gradient_boosting" | "logistic_regression"
- `min_samples`: Minimum samples required (default: 100)

**GET** `/api/v1/admission/model/current`

Get information about currently active model.

**GET** `/api/v1/admission/models?limit=10`

List all trained models.

### 6. Service Statistics

**GET** `/api/v1/admission/statistics`

Get service statistics including data points, evaluations, and model info.

**Response:**
```json
{
  "data_points": {
    "total": 1500,
    "verified": 1200
  },
  "evaluations": {
    "total": 5000
  },
  "models": {
    "total": 5,
    "active": 1,
    "current_version": "1.0.1200",
    "current_type": "random_forest"
  }
}
```

## Machine Learning Pipeline

### 1. Data Collection
- Users contribute historical admission data
- Manual verification for data quality
- Minimum 100 verified samples required for training

### 2. Feature Engineering
- Normalize GPA to 4.0 scale
- Convert test scores to percentiles
- Calculate composite scores (research, professional, extracurricular)
- Compute relative positioning vs program averages

### 3. Model Training
```python
from app.services.admission_prediction_service import admission_service

# Train model
metadata = await admission_service.train_model(
    model_type="random_forest",
    min_samples=100
)

print(f"Accuracy: {metadata.accuracy:.3f}")
print(f"AUC-ROC: {metadata.auc_roc:.3f}")
```

### 4. Model Evaluation
- 80/20 train-test split
- Metrics: Accuracy, Precision, Recall, F1, AUC-ROC
- Cross-validation for robustness
- Feature importance analysis

### 5. Model Deployment
- Automatic versioning (version includes training sample count)
- Previous models deactivated automatically
- Models stored in `uploads/ml_models/` directory
- Metadata stored in MongoDB

### 6. Prediction Flow
1. Extract features from student profile and program
2. Scale features using trained StandardScaler
3. Generate probability using trained model
4. Calculate confidence intervals
5. Identify strengths/weaknesses based on feature importance
6. Generate personalized recommendations

## Heuristic Algorithm (Fallback)

When no trained model is available, the service uses a weighted heuristic:

```
score = (
    gpa_normalized * 0.25 +
    test_percentile * 0.20 +
    research_score * 0.15 +
    professional_score * 0.10 +
    extracurricular_score * 0.10 +
    prestige_score * 0.10 -
    competitiveness_penalty * 0.10
)

probability = clip(score, 0.0, 1.0)
```

## Usage Examples

### Python Client Example

```python
import httpx
import json

# Prepare request
payload = {
    "student_profile": {
        "gpa": 3.8,
        "gpa_scale": 4.0,
        "undergraduate_major": "Computer Science",
        "undergraduate_university_ranking": 150,
        "test_scores": [
            {
                "test_type": "gre",
                "total_score": 325,
                "verbal_score": 160,
                "quantitative_score": 165
            },
            {
                "test_type": "toefl",
                "total_score": 105
            }
        ],
        "research_publications": 2,
        "work_experience_months": 24,
        "internships_count": 3,
        "academic_awards": 2,
        "leadership_positions": 1
    },
    "target_program": {
        "university_name": "Stanford University",
        "university_ranking": 3,
        "program_name": "Computer Science",
        "degree_level": "masters",
        "acceptance_rate": 0.05,
        "average_gpa": 3.9,
        "gre_quant_avg": 168,
        "is_stem": True
    },
    "include_gap_analysis": True,
    "include_similar_profiles": True
}

# Make request
async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/v1/admission/predict",
        json=payload
    )

    evaluation = response.json()
    print(f"Admission Probability: {evaluation['prediction']['probability_percentage']:.1f}%")
    print(f"Category: {evaluation['prediction']['category']}")
    print(f"Recommendation: {evaluation['prediction']['recommendation']}")
```

### JavaScript/TypeScript Client Example

```typescript
interface PredictionRequest {
  student_profile: StudentProfile;
  target_program: ProgramInfo;
  include_gap_analysis?: boolean;
  include_similar_profiles?: boolean;
}

async function predictAdmission(request: PredictionRequest) {
  const response = await fetch('http://localhost:8000/api/v1/admission/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Prediction failed');
  }

  const evaluation = await response.json();
  return evaluation;
}

// Usage
const evaluation = await predictAdmission({
  student_profile: {
    gpa: 3.8,
    test_scores: [{
      test_type: 'gre',
      total_score: 325,
      verbal_score: 160,
      quantitative_score: 165
    }],
    research_publications: 2,
    work_experience_months: 24
  },
  target_program: {
    university_name: 'Stanford University',
    program_name: 'Computer Science',
    degree_level: 'masters'
  }
});

console.log(`Probability: ${evaluation.prediction.probability_percentage}%`);
```

## Configuration

### Environment Variables

Add to `ai_service/.env`:

```env
# Admission Prediction Settings
ADMISSION_MIN_SAMPLES=100
ADMISSION_MODEL_TYPE=random_forest

# Model Storage
ML_MODELS_DIR=./uploads/ml_models
```

### Dependencies

Already included in `pyproject.toml`:
- `scikit-learn==1.4.0` - ML algorithms
- `scipy==1.11.4` - Statistical functions
- `numpy==1.26.3` - Numerical operations

## Performance Considerations

### Optimization Tips

1. **Batch Predictions**: Use `/predict/batch` for multiple programs to reduce overhead
2. **Skip Similar Profiles**: Set `include_similar_profiles=false` for faster responses
3. **Model Caching**: Models are loaded once at startup and cached in memory
4. **Feature Scaling**: StandardScaler is pre-fitted and cached

### Expected Response Times

- Single prediction: 50-150ms
- Batch prediction (10 programs): 200-500ms
- Model training (1000 samples): 5-15 seconds

### Scalability

- Service is stateless (except for loaded model)
- MongoDB handles concurrent reads/writes
- Can be horizontally scaled with load balancer
- Model training should be done offline/scheduled

## Testing

### Unit Tests

```bash
cd ai_service
pytest app/tests/test_admission_service.py -v
```

### Integration Tests

```bash
# Test API endpoint
curl -X POST "http://localhost:8000/api/v1/admission/predict" \
  -H "Content-Type: application/json" \
  -d @test_data/sample_prediction_request.json

# Check service statistics
curl "http://localhost:8000/api/v1/admission/statistics"
```

## Roadmap

### Phase 1 (Completed)
- ✅ Data models and feature engineering
- ✅ ML service with multiple algorithms
- ✅ API endpoints
- ✅ MongoDB integration
- ✅ Heuristic fallback

### Phase 2 (Planned)
- [ ] JWT authentication integration
- [ ] Real admission data scraping
- [ ] Advanced feature engineering (SOP analysis, LOR quality)
- [ ] Deep learning models (LSTM for time-series trends)
- [ ] A/B testing framework for model comparison

### Phase 3 (Future)
- [ ] Real-time model retraining
- [ ] Collaborative filtering (similar student recommendations)
- [ ] Program recommendation engine
- [ ] Financial aid prediction
- [ ] Visa probability estimation

## Troubleshooting

### Issue: "scikit-learn not available"
```bash
cd ai_service
uv pip install scikit-learn scipy
```

### Issue: Model training fails with "Insufficient data"
- Contribute more admission data using `/data/contribute`
- Reduce `min_samples` parameter (minimum 50 recommended)

### Issue: Predictions seem inaccurate
- Check if model is trained (`/model/current`)
- Verify data quality in `admission_data` collection
- Retrain model with more verified data

### Issue: High memory usage
- Model size ~50-100MB depending on algorithm
- Consider using Logistic Regression for lower memory footprint
- Use `del` to unload unused models

## Contributing

To contribute admission data:

1. Ensure data accuracy
2. Use `/data/contribute` endpoint
3. Data will be marked for verification
4. Admin will verify and approve

## License

MIT License - See LICENSE file

## Support

For questions or issues:
- GitHub Issues: https://github.com/edulen/ai-service/issues
- Email: support@edulen.com
- Documentation: https://docs.edulen.com/admission-prediction

---

**Built with**: FastAPI, scikit-learn, MongoDB, Pydantic
**Version**: 1.0.0
**Last Updated**: 2025-10-12
