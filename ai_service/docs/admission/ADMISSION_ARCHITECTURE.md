# Admission Prediction Service - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS                            │
│  (Next.js Frontend, Mobile Apps, Third-party Integrations)              │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │ HTTP/REST API
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI APPLICATION                               │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    API Layer (admission.py)                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │ /predict │  │ /batch   │  │ /contrib │  │ /train   │         │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │  │
│  └───────┼─────────────┼─────────────┼─────────────┼────────────────┘  │
│          │             │             │             │                    │
│          ▼             ▼             ▼             ▼                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │        Admission Prediction Service (admission_prediction_...py) │  │
│  │                                                                   │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │  │
│  │  │ Feature          │  │ ML Model         │  │ Gap Analysis   │ │  │
│  │  │ Engineering      │  │ Manager          │  │ Engine         │ │  │
│  │  │                  │  │                  │  │                │ │  │
│  │  │ • GPA normalize  │  │ • Random Forest  │  │ • Compare GPA  │ │  │
│  │  │ • Test scores    │  │ • Grad Boosting  │  │ • Test gaps    │ │  │
│  │  │ • Research score │  │ • Logistic Reg   │  │ • Recommendations│ │
│  │  │ • Work exp       │  │ • Heuristic      │  │                │ │  │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘ │  │
│  │                                                                   │  │
│  │  ┌──────────────────────────────────────────────────────────────┐│  │
│  │  │           Prediction Pipeline                                ││  │
│  │  │  1. Extract Features (12 features)                          ││  │
│  │  │  2. Scale Features (StandardScaler)                         ││  │
│  │  │  3. Generate Probability (ML or Heuristic)                  ││  │
│  │  │  4. Calculate Confidence Intervals                          ││  │
│  │  │  5. Identify Strengths/Weaknesses                           ││  │
│  │  │  6. Generate Recommendations                                ││  │
│  │  └──────────────────────────────────────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────┬───────────────────────────────────┬────────────────┘
                     │                                   │
                     ▼                                   ▼
┌────────────────────────────────────┐  ┌──────────────────────────────┐
│        MongoDB Collections         │  │    File System               │
│                                    │  │                              │
│  ┌──────────────────────────────┐ │  │  ┌────────────────────────┐ │
│  │ admission_data               │ │  │  │ ML Models              │ │
│  │ • Historical outcomes        │ │  │  │ • model_xxx.pkl        │ │
│  │ • Verified data points       │ │  │  │ • model_xxx_scaler.pkl │ │
│  │ • Training dataset           │ │  │  │                        │ │
│  └──────────────────────────────┘ │  │  │ uploads/ml_models/     │ │
│                                    │  │  └────────────────────────┘ │
│  ┌──────────────────────────────┐ │  └──────────────────────────────┘
│  │ profile_evaluations          │ │
│  │ • User evaluation history    │ │
│  │ • Predictions & results      │ │
│  │ • Gap analysis records       │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ ml_models                    │ │
│  │ • Model metadata             │ │
│  │ • Performance metrics        │ │
│  │ • Version tracking           │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Single Prediction Flow

```
User Request
    │
    ├─► StudentProfile (GPA, test scores, research, etc.)
    └─► ProgramInfo (university, program, acceptance rate, etc.)
         │
         ▼
    Feature Extraction
         │
         ├─► Normalize GPA (to 4.0 scale)
         ├─► Calculate test percentiles
         ├─► Compute research score (publications, conferences)
         ├─► Compute professional score (work exp, internships)
         ├─► Compute extracurricular score
         ├─► Calculate prestige scores
         └─► Relative positioning (vs program averages)
              │
              ▼
         FeatureVector (12 features)
              │
              ▼
    Feature Scaling (StandardScaler)
              │
              ▼
    ML Model Prediction
         │
         ├─► If model trained: use Random Forest/etc.
         └─► Else: use heuristic algorithm
              │
              ▼
    Probability + Confidence Interval
         │
         ▼
    Strength/Weakness Analysis
         │
         ├─► Analyze feature values
         ├─► Compare to thresholds
         └─► Identify key factors
              │
              ▼
    School Categorization
         │
         ├─► Reach (<25%)
         ├─► Target (25-75%)
         └─► Safety (>75%)
              │
              ▼
    Generate Recommendations
         │
         └─► Personalized action items
              │
              ▼
    ProfileEvaluation (Response)
```

### 2. Batch Prediction Flow

```
User Request
    │
    ├─► StudentProfile
    └─► List[ProgramInfo] (multiple programs)
         │
         ▼
    For each program:
         │
         ├─► Feature Extraction
         ├─► ML Prediction
         ├─► Categorization
         └─► Store Evaluation
              │
              ▼
    Aggregate Results
         │
         ├─► Group by category (reach/target/safety)
         ├─► Calculate statistics (avg, min, max)
         └─► Sort by probability
              │
              ▼
    BatchPredictionResponse
         │
         ├─► reach_schools: List[str]
         ├─► target_schools: List[str]
         ├─► safety_schools: List[str]
         └─► summary_statistics
```

### 3. Model Training Flow

```
Admin Request
    │
    ├─► model_type (random_forest, etc.)
    └─► min_samples (default: 100)
         │
         ▼
    Fetch Training Data
         │
         └─► Query admission_data collection
              └─► Filter: verified=True
                   │
                   ▼
    Validate Sample Size
         │
         └─► If count < min_samples: Error
              │
              ▼
    Feature Engineering
         │
         └─► Extract features from each data point
              │
              ▼
    Prepare Training Data
         │
         ├─► X = feature_arrays
         └─► y = admission_decisions (0/1)
              │
              ▼
    Train/Test Split (80/20)
         │
         ▼
    Scale Features
         │
         └─► Fit StandardScaler on train set
              │
              ▼
    Train ML Model
         │
         ├─► Random Forest (default)
         ├─► Gradient Boosting
         └─► Logistic Regression
              │
              ▼
    Evaluate Model
         │
         ├─► Accuracy
         ├─► Precision
         ├─► Recall
         ├─► F1 Score
         └─► AUC-ROC
              │
              ▼
    Save Model
         │
         ├─► Pickle model → model_xxx.pkl
         ├─► Pickle scaler → model_xxx_scaler.pkl
         └─► Store metadata → ml_models collection
              │
              ▼
    Activate Model
         │
         ├─► Deactivate old models
         └─► Set new model as active
              │
              ▼
    Return MLModelMetadata
```

### 4. Gap Analysis Flow

```
StudentProfile + ProgramInfo
    │
    ▼
Calculate Gaps
    │
    ├─► GPA Gap
    │   └─► student.gpa - program.avg_gpa
    │
    ├─► Test Score Gap
    │   └─► student.test_score - program.avg_test_score
    │
    ├─► Research Gap
    │   └─► student.publications - typical_publications
    │
    └─► Work Experience Gap
        └─► student.work_months - typical_work_months
         │
         ▼
Calculate Percentiles
    │
    ├─► GPA Percentile (using normal distribution)
    └─► Test Score Percentile
         │
         ▼
Overall Competitiveness Score
    │
    └─► Weighted average of normalized metrics
         │
         ▼
Identify Priority Gaps
    │
    ├─► Sort gaps by severity
    ├─► Assign priorities (high/medium/low)
    └─► Generate action items
         │
         ▼
GapAnalysis (Response)
```

## Feature Engineering Pipeline

```
Raw Student Data
    │
    ▼
┌────────────────────────────────────────────┐
│         Quantitative Features              │
├────────────────────────────────────────────┤
│ GPA                → gpa_normalized (0-1)  │
│ GRE Verbal         → percentile (0-100)    │
│ GRE Quantitative   → percentile (0-100)    │
│ GMAT               → percentile (0-100)    │
│ TOEFL/IELTS        → normalized (0-100)    │
└────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────┐
│       Composite Scores (0-1 scale)         │
├────────────────────────────────────────────┤
│ Research Score:                            │
│   = publications*0.2 + conferences*0.15    │
│     + patents*0.25                         │
│                                            │
│ Professional Score:                        │
│   = work_exp*0.3 + relevant_exp*0.5        │
│     + internships*0.2                      │
│                                            │
│ Extracurricular Score:                     │
│   = leadership*0.15 + awards*0.15          │
│     + certifications*0.1 + volunteer*0.3   │
└────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────┐
│      Institutional Factors (0-1)           │
├────────────────────────────────────────────┤
│ Undergrad Prestige:                        │
│   = f(university_ranking)                  │
│   Top 10  → 1.0                           │
│   Top 100 → 0.8                           │
│   Top 500 → 0.5                           │
│                                            │
│ Program Competitiveness:                   │
│   = 1 - acceptance_rate                   │
│   × ranking_factor                         │
└────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────┐
│     Relative Positioning Features          │
├────────────────────────────────────────────┤
│ GPA vs Average:                            │
│   = student.gpa - program.avg_gpa          │
│                                            │
│ Test Score vs Average:                     │
│   = (student_percentile - avg_percentile)  │
│     / 100                                  │
└────────────────────────────────────────────┘
    │
    ▼
Final Feature Vector (12 dimensions)
```

## School Categorization Logic

```
Predicted Probability
    │
    ├─── < 0.25 ───────► REACH
    │                    • Long shot
    │                    • High selectivity
    │                    • Apply anyway
    │
    ├─── 0.25 - 0.75 ──► TARGET
    │                    • Realistic chance
    │                    • Good fit
    │                    • Primary focus
    │
    └─── > 0.75 ───────► SAFETY
                         • High probability
                         • Backup option
                         • Likely acceptance
```

## Model Selection Strategy

```
                    Training Data Available?
                            │
                ┌───────────┴───────────┐
                │                       │
              YES                      NO
                │                       │
                ▼                       ▼
         Sample Size >= 100?      Use Heuristic
                │                  Algorithm
        ┌───────┴───────┐              │
       YES              NO              │
        │                │              │
        ▼                ▼              ▼
   Train ML Model    Use Heuristic  Weighted
        │               │            Scoring
        ▼               │              │
   Select Algorithm     │              │
        │               │              │
   ┌────┼────┐         │              │
   │    │    │         │              │
   RF  GBM  LR         │              │
   │    │    │         │              │
   └────┼────┘         │              │
        │              │              │
        └──────────────┴──────────────┘
                       │
                       ▼
              Generate Prediction
```

## Component Interactions

```
┌──────────────────────────────────────────────────────────┐
│                  API Endpoint Layer                      │
│  (admission.py)                                          │
│  • Request validation                                    │
│  • Response formatting                                   │
│  • Error handling                                        │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│              Service Layer                               │
│  (admission_prediction_service.py)                       │
│  • Business logic                                        │
│  • Feature engineering                                   │
│  • ML operations                                         │
│  • Gap analysis                                          │
└─────┬──────────────┬──────────────────┬─────────────────┘
      │              │                  │
      ▼              ▼                  ▼
┌──────────┐  ┌──────────┐      ┌──────────┐
│ MongoDB  │  │ Scikit   │      │  File    │
│          │  │ Learn    │      │  System  │
│ • Data   │  │          │      │          │
│ • Eval   │  │ • RF     │      │ • Models │
│ • Models │  │ • GBM    │      │ • Scaler │
└──────────┘  │ • LR     │      └──────────┘
              └──────────┘
```

## Security & Isolation

```
Request with JWT
    │
    ▼
Extract user_id
    │
    ├─► All queries filtered by user_id
    ├─► Evaluations isolated per user
    └─► Data contribution attributed to user
         │
         ▼
    User can only access:
         │
         ├─► Their own evaluations
         ├─► Their contributed data (optional anonymization)
         └─► Public aggregate statistics
```

## Performance Optimization

```
Startup Phase:
    │
    ├─► Load ML model into memory (once)
    ├─► Load StandardScaler into memory (once)
    └─► Cache feature names and metadata
         │
         ▼
Request Phase:
    │
    ├─► Feature extraction (~5ms)
    ├─► Model prediction (~10-20ms)
    ├─► Gap analysis (~5-10ms)
    └─► MongoDB queries (indexed, ~10-30ms)
         │
         ▼
Total Response Time: 50-150ms
```

## Scaling Considerations

```
Horizontal Scaling:
    │
    ├─► Stateless service (model loaded in memory)
    ├─► MongoDB handles concurrent access
    └─► Load balancer distributes requests
         │
         ▼
    Multiple instances can run in parallel

Vertical Scaling:
    │
    ├─► Model size: ~50-100MB
    ├─► Memory per instance: ~500MB-1GB
    └─► CPU: Prediction is fast, no GPU needed
```

---

This architecture provides:
- ✅ Modular design (easy to extend)
- ✅ Clear separation of concerns
- ✅ Scalable and performant
- ✅ Type-safe with Pydantic
- ✅ Well-documented APIs
- ✅ Production-ready error handling
