# GradCafe Scraper - EduLen Integration Guide

## Overview

This guide explains how to integrate the GradCafe scraper with the EduLen platform for admission prediction and student guidance.

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        EduLen Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │────│   Backend    │────│   MongoDB    │  │
│  │  (Next.js)   │    │  (FastAPI)   │    │   (Shared)   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              GradCafe Data Layer                     │   │
│  │  - Scraper (Python)                                  │   │
│  │  - Profile Extractor                                 │   │
│  │  - MongoDB Collections                               │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ML Training Pipeline                    │   │
│  │  - Feature Engineering                               │   │
│  │  - Model Training                                    │   │
│  │  - Admission Prediction                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Integration

### Phase 1: Data Collection

#### 1.1 Setup GradCafe Scraper

```bash
cd /home/ismail/edulen/train_ml
./setup_gradcafe.sh
```

#### 1.2 Initial Data Collection

Collect baseline data for analysis:

```bash
# Scrape top programs (will take 4-6 hours)
python gradcafe_scraper.py scrape \
  --all-programs \
  --years 2020-2024 \
  -u MIT -u Stanford -u Berkeley -u CMU -u Harvard
```

#### 1.3 Verify Data Quality

```bash
# Check statistics
python gradcafe_scraper.py stats

# Export sample for review
python gradcafe_scraper.py export \
  -o sample_data.json \
  --university MIT \
  --decision Accepted
```

### Phase 2: Database Integration

#### 2.1 Shared MongoDB Setup

The GradCafe scraper uses the same MongoDB instance as EduLen:

```javascript
// MongoDB connection (already configured)
URI: mongodb://localhost:27017
Database: edulens
Collections:
  - gradcafe_data (scraper)
  - documents_metadata (existing)
  - users (existing)
```

#### 2.2 Verify MongoDB Connection

```python
# In EduLen backend
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['edulens']

# Test query
sample = db.gradcafe_data.find_one()
print(f"Sample record: {sample}")

# Count records
total = db.gradcafe_data.count_documents({})
print(f"Total GradCafe records: {total}")
```

### Phase 3: API Integration

#### 3.1 Create FastAPI Endpoints

Create `/home/ismail/edulen/ai_service/app/api/v1/admissions.py`:

```python
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from pymongo import MongoClient
import os

router = APIRouter()

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
db = client[os.getenv('MONGODB_DB_NAME', 'edulens')]
collection = db['gradcafe_data']


@router.get("/similar-profiles")
async def get_similar_profiles(
    program: str,
    gpa: float,
    gre_verbal: Optional[int] = None,
    gre_quant: Optional[int] = None,
    limit: int = Query(10, le=100)
):
    """Get similar student profiles from GradCafe data"""

    query = {
        'program': {'$regex': program, '$options': 'i'},
        'decision': 'Accepted',
        'profile.gpa_normalized': {
            '$gte': gpa - 0.3,
            '$lte': gpa + 0.3
        }
    }

    if gre_quant:
        query['profile.gre_quant'] = {
            '$gte': gre_quant - 5,
            '$lte': gre_quant + 5
        }

    results = list(collection.find(query, {'_id': 0}).limit(limit))
    return {'profiles': results, 'count': len(results)}


@router.get("/admission-stats")
async def get_admission_stats(
    program: Optional[str] = None,
    university: Optional[str] = None
):
    """Get admission statistics for programs/universities"""

    match_query = {}
    if program:
        match_query['program'] = {'$regex': program, '$options': 'i'}
    if university:
        match_query['university'] = {'$regex': university, '$options': 'i'}

    pipeline = [
        {'$match': match_query},
        {'$group': {
            '_id': '$decision',
            'count': {'$sum': 1},
            'avg_gpa': {'$avg': '$profile.gpa_normalized'},
            'avg_gre_verbal': {'$avg': '$profile.gre_verbal'},
            'avg_gre_quant': {'$avg': '$profile.gre_quant'}
        }}
    ]

    results = list(collection.aggregate(pipeline))

    stats = {
        'total': sum(r['count'] for r in results),
        'by_decision': {}
    }

    for result in results:
        decision = result['_id']
        stats['by_decision'][decision] = {
            'count': result['count'],
            'avg_gpa': round(result.get('avg_gpa', 0), 2),
            'avg_gre_verbal': round(result.get('avg_gre_verbal', 0), 1),
            'avg_gre_quant': round(result.get('avg_gre_quant', 0), 1)
        }

    return stats


@router.get("/acceptance-probability")
async def calculate_acceptance_probability(
    university: str,
    program: str,
    gpa: float,
    gre_verbal: int,
    gre_quant: int
):
    """Calculate acceptance probability based on historical data"""

    # Find accepted students
    accepted = collection.count_documents({
        'university': {'$regex': university, '$options': 'i'},
        'program': {'$regex': program, '$options': 'i'},
        'decision': 'Accepted',
        'profile.gpa_normalized': {'$lte': gpa + 0.5},
        'profile.gre_verbal': {'$lte': gre_verbal + 10},
        'profile.gre_quant': {'$lte': gre_quant + 10}
    })

    # Find all applicants
    total = collection.count_documents({
        'university': {'$regex': university, '$options': 'i'},
        'program': {'$regex': program, '$options': 'i'}
    })

    if total == 0:
        raise HTTPException(status_code=404, detail="No data found")

    probability = accepted / total

    return {
        'probability': round(probability * 100, 1),
        'confidence': 'high' if total >= 50 else 'medium' if total >= 20 else 'low',
        'sample_size': total,
        'methodology': 'Historical data analysis'
    }


@router.get("/universities-by-profile")
async def get_matching_universities(
    gpa: float,
    gre_verbal: int,
    gre_quant: int,
    limit: int = Query(20, le=50)
):
    """Get universities where similar profiles got accepted"""

    pipeline = [
        {'$match': {
            'decision': 'Accepted',
            'profile.gpa_normalized': {'$gte': gpa - 0.5, '$lte': gpa + 0.2},
            'profile.gre_verbal': {'$gte': gre_verbal - 10, '$lte': gre_verbal + 5},
            'profile.gre_quant': {'$gte': gre_quant - 10, '$lte': gre_quant + 5}
        }},
        {'$group': {
            '_id': {
                'university': '$university',
                'program': '$program'
            },
            'count': {'$sum': 1},
            'avg_gpa': {'$avg': '$profile.gpa_normalized'},
            'avg_gre_v': {'$avg': '$profile.gre_verbal'},
            'avg_gre_q': {'$avg': '$profile.gre_quant'}
        }},
        {'$sort': {'count': -1}},
        {'$limit': limit}
    ]

    results = list(collection.aggregate(pipeline))

    matches = []
    for r in results:
        matches.append({
            'university': r['_id']['university'],
            'program': r['_id']['program'],
            'acceptance_count': r['count'],
            'avg_profile': {
                'gpa': round(r.get('avg_gpa', 0), 2),
                'gre_verbal': round(r.get('avg_gre_v', 0)),
                'gre_quant': round(r.get('avg_gre_q', 0))
            }
        })

    return {'matches': matches}
```

#### 3.2 Register Routes

In `/home/ismail/edulen/ai_service/app/main.py`:

```python
from app.api.v1 import admissions

app.include_router(
    admissions.router,
    prefix="/api/admissions",
    tags=["admissions"]
)
```

### Phase 4: Frontend Integration

#### 4.1 Create Admission Predictor Component

Create `/home/ismail/edulen/src/components/admission-predictor/AdmissionPredictor.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PredictionResult {
  probability: number;
  confidence: string;
  sample_size: number;
}

export default function AdmissionPredictor() {
  const [formData, setFormData] = useState({
    university: '',
    program: '',
    gpa: '',
    greVerbal: '',
    greQuant: '',
  });
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admissions/acceptance-probability?` +
        `university=${formData.university}&` +
        `program=${formData.program}&` +
        `gpa=${formData.gpa}&` +
        `gre_verbal=${formData.greVerbal}&` +
        `gre_quant=${formData.greQuant}`
      );
      const data = await response.json();
      setPrediction(data);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admission Probability Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>University</Label>
            <Input
              value={formData.university}
              onChange={(e) => setFormData({...formData, university: e.target.value})}
              placeholder="e.g., MIT, Stanford"
            />
          </div>
          <div>
            <Label>Program</Label>
            <Input
              value={formData.program}
              onChange={(e) => setFormData({...formData, program: e.target.value})}
              placeholder="e.g., Computer Science PhD"
            />
          </div>
          <div>
            <Label>GPA (4.0 scale)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.gpa}
              onChange={(e) => setFormData({...formData, gpa: e.target.value})}
              placeholder="3.8"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>GRE Verbal</Label>
              <Input
                type="number"
                value={formData.greVerbal}
                onChange={(e) => setFormData({...formData, greVerbal: e.target.value})}
                placeholder="165"
              />
            </div>
            <div>
              <Label>GRE Quant</Label>
              <Input
                type="number"
                value={formData.greQuant}
                onChange={(e) => setFormData({...formData, greQuant: e.target.value})}
                placeholder="170"
              />
            </div>
          </div>
          <Button onClick={handlePredict} disabled={loading} className="w-full">
            {loading ? 'Calculating...' : 'Calculate Probability'}
          </Button>

          {prediction && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-xl font-bold text-center mb-2">
                {prediction.probability}% Acceptance Probability
              </h3>
              <p className="text-sm text-center text-gray-600">
                Confidence: {prediction.confidence.toUpperCase()}
                (based on {prediction.sample_size} historical records)
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 4.2 Create Dashboard Page

Create `/home/ismail/edulen/src/app/dashboard/admission-predictor/page.tsx`:

```typescript
import AdmissionPredictor from '@/components/admission-predictor/AdmissionPredictor';

export default function AdmissionPredictorPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admission Predictor</h1>
      <AdmissionPredictor />
    </div>
  );
}
```

### Phase 5: Scheduled Scraping

#### 5.1 Create Cron Job

Create `/home/ismail/edulen/train_ml/daily_scrape.sh`:

```bash
#!/bin/bash

# Daily GradCafe scraping
cd /home/ismail/edulen/train_ml

# Get current year
YEAR=$(date +%Y)

# Scrape recent data
python3 gradcafe_scraper.py scrape \
  --all-programs \
  --years $YEAR \
  --resume

# Export statistics
python3 gradcafe_scraper.py stats > logs/daily_stats_$(date +%Y%m%d).txt
```

#### 5.2 Setup Cron

```bash
chmod +x /home/ismail/edulen/train_ml/daily_scrape.sh

# Add to crontab (run daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /home/ismail/edulen/train_ml/daily_scrape.sh
```

### Phase 6: ML Pipeline Integration

#### 6.1 Feature Engineering

Create `/home/ismail/edulen/train_ml/features.py`:

```python
import pandas as pd
from pymongo import MongoClient

def extract_features():
    """Extract ML features from GradCafe data"""

    client = MongoClient('mongodb://localhost:27017')
    db = client['edulens']

    # Load data
    data = list(db.gradcafe_data.find())
    df = pd.DataFrame(data)

    # Flatten profile data
    profile_df = pd.json_normalize(df['profile'])
    df = pd.concat([df.drop('profile', axis=1), profile_df], axis=1)

    # Feature engineering
    df['decision_binary'] = df['decision'].map({
        'Accepted': 1,
        'Rejected': 0,
        'Waitlisted': 0.5
    })

    df['gre_total'] = df['gre_verbal'] + df['gre_quant']
    df['has_research'] = (df['research_pubs'] > 0).astype(int)
    df['international'] = df['is_international'].astype(int)

    # Select features
    features = [
        'gpa_normalized',
        'gre_verbal',
        'gre_quant',
        'gre_total',
        'toefl',
        'research_pubs',
        'has_research',
        'international'
    ]

    return df[features + ['decision_binary']]
```

#### 6.2 Train Model

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

# Load features
df = extract_features()
df = df.dropna()

X = df.drop('decision_binary', axis=1)
y = (df['decision_binary'] > 0.5).astype(int)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model
joblib.dump(model, 'admission_predictor.pkl')

# Evaluate
score = model.score(X_test, y_test)
print(f"Model accuracy: {score:.2%}")
```

## Testing Integration

### Test API Endpoints

```bash
# Test similar profiles
curl "http://localhost:8000/api/admissions/similar-profiles?program=Computer%20Science&gpa=3.8&gre_quant=170"

# Test admission stats
curl "http://localhost:8000/api/admissions/admission-stats?university=MIT"

# Test probability
curl "http://localhost:8000/api/admissions/acceptance-probability?university=MIT&program=Computer%20Science&gpa=3.8&gre_verbal=165&gre_quant=170"
```

## Monitoring

### Dashboard Metrics

Monitor these metrics:
- Total GradCafe records
- Records added (daily/weekly)
- Data quality scores
- API response times
- User engagement with predictor

### Alerts

Set up alerts for:
- Scraping failures
- Data quality degradation
- API errors
- Low confidence predictions

## Best Practices

1. **Data Quality**: Regularly validate scraped data
2. **Rate Limiting**: Respect GradCafe's servers
3. **Caching**: Cache API responses (1 hour)
4. **Privacy**: Anonymize user queries in logs
5. **Accuracy**: Display confidence levels with predictions
6. **Updates**: Refresh data weekly minimum

## Troubleshooting

### Issue: API returns 404

**Cause**: No matching data in database
**Solution**: Check MongoDB has data, adjust query parameters

### Issue: Predictions are inaccurate

**Cause**: Insufficient training data
**Solution**: Collect more data, at least 100 records per program

### Issue: Slow API responses

**Cause**: Complex MongoDB queries
**Solution**: Add indexes, implement caching

## Next Steps

1. Collect initial dataset (10,000+ records)
2. Deploy API endpoints
3. Test frontend integration
4. Train ML models
5. Launch admission predictor feature
6. Monitor and iterate

---

**Integration Complete**: Follow this guide step-by-step for full integration.
