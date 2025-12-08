# SOP Analysis Service - Quick Start Guide

## Prerequisites

1. **AI Service Running**
   ```bash
   cd /home/ismail/edulen/ai_service
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Environment Variables Set**
   ```bash
   export GOOGLE_API_KEY="your_google_api_key"
   export MONGODB_URI="mongodb://localhost:27017"
   export MONGODB_DB_NAME="edulens"
   export OPENAI_API_KEY="your_openai_api_key"  # Optional
   ```

3. **MongoDB Running**
   ```bash
   # Start MongoDB if not running
   sudo systemctl start mongodb
   # OR
   mongod --dbpath /path/to/data
   ```

## Quick Test

### 1. Health Check

```bash
curl http://localhost:8000/api/v1/sop-analysis/health
```

Expected response:
```json
{
  "success": true,
  "message": "SOP Analysis Service is operational",
  "data": {
    "status": "healthy",
    "ai_model_available": true,
    "database_available": true,
    "cliche_count": 42
  }
}
```

### 2. Analyze a Sample SOP

```bash
curl -X POST "http://localhost:8000/api/v1/sop-analysis/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "sop_text": "During my undergraduate research on neural network optimization, I reduced training time by 35% through novel pruning techniques. This experience solidified my commitment to advancing machine learning efficiency. My interest stems from a two-year internship where I developed edge computing solutions. I led a team of four engineers, deploying models 50% smaller while maintaining 95% accuracy. Stanford'\''s Computer Science PhD program aligns perfectly with my goals. Professor Smith'\''s recent paper on automated model compression resonates with my work. The CS229 course would complement my background, while the interdisciplinary ML group offers the collaborative environment I thrive in.",
    "university_name": "Stanford University",
    "program_name": "Computer Science PhD",
    "compare_with_database": false
  }'
```

### 3. View All Clichés

```bash
curl "http://localhost:8000/api/v1/sop-analysis/cliches?limit=10"
```

## Integration with Next.js Frontend

### Create API Client

```typescript
// lib/api/sop-analysis.ts
import { AIServiceClient } from '@/lib/ai-service-client';

export interface SOPAnalysisRequest {
  user_id: string;
  sop_text: string;
  university_name?: string;
  program_name?: string;
  compare_with_database?: boolean;
}

export interface SOPAnalysisResponse {
  success: boolean;
  message: string;
  data: {
    scores: {
      overall: number;
      uniqueness: number;
      structure: number;
      specificity: number;
      tone: number;
      program_fit: number;
    };
    grade: string;
    recommendations: Array<{
      category: string;
      priority: string;
      issue: string;
      suggestions: string[];
    }>;
    // ... other fields
  };
}

export class SOPAnalysisAPI {
  private client: AIServiceClient;

  constructor() {
    this.client = new AIServiceClient();
  }

  async analyze(request: SOPAnalysisRequest): Promise<SOPAnalysisResponse> {
    return this.client.post('/api/v1/sop-analysis/analyze', request);
  }

  async compare(userId: string, text1: string, text2: string) {
    return this.client.post('/api/v1/sop-analysis/compare', {
      user_id: userId,
      sop_text_1: text1,
      sop_text_2: text2
    });
  }

  async getHistory(userId: string, limit = 10) {
    return this.client.get(`/api/v1/sop-analysis/history/${userId}?limit=${limit}`);
  }

  async getStatistics(userId: string) {
    return this.client.get(`/api/v1/sop-analysis/statistics/${userId}`);
  }
}

export const sopAnalysisAPI = new SOPAnalysisAPI();
```

### React Component Example

```tsx
// components/sop/SOPAnalyzer.tsx
'use client';

import { useState } from 'react';
import { sopAnalysisAPI } from '@/lib/api/sop-analysis';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export function SOPAnalyzer() {
  const [sopText, setSOPText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!sopText || sopText.length < 100) {
      alert('Please enter at least 100 characters');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await sopAnalysisAPI.analyze({
        user_id: 'current_user_id', // Get from auth
        sop_text: sopText,
        university_name: 'Stanford University',
        program_name: 'Computer Science PhD'
      });

      setResult(response.data);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze SOP');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={sopText}
        onChange={(e) => setSOPText(e.target.value)}
        placeholder="Paste your Statement of Purpose here..."
        rows={15}
        className="w-full"
      />

      <Button
        onClick={handleAnalyze}
        disabled={analyzing || sopText.length < 100}
      >
        {analyzing ? 'Analyzing...' : 'Analyze SOP'}
      </Button>

      {result && (
        <Card className="p-6">
          <h3 className="text-2xl font-bold mb-4">
            Analysis Results
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-4xl font-bold text-blue-600">
                {result.scores.overall.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">
                {result.grade}
              </div>
              <div className="text-sm text-gray-600">Grade</div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <h4 className="font-semibold">Score Breakdown</h4>
            {Object.entries(result.scores).map(([key, value]) => (
              key !== 'overall' && (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key}</span>
                  <span className="font-medium">{value.toFixed(1)}</span>
                </div>
              )
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Recommendations</h4>
            {result.recommendations.slice(0, 5).map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border-l-4 ${
                  rec.priority === 'high'
                    ? 'border-red-500 bg-red-50'
                    : rec.priority === 'medium'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="font-medium">{rec.issue}</div>
                <ul className="mt-2 text-sm space-y-1">
                  {rec.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
```

## Common Use Cases

### 1. Real-time Analysis as User Types

```typescript
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect, useState } from 'react';

function LiveSOPAnalysis() {
  const [text, setText] = useState('');
  const debouncedText = useDebounce(text, 2000); // Wait 2s after typing stops
  const [quickScore, setQuickScore] = useState(null);

  useEffect(() => {
    if (debouncedText.length > 100) {
      // Quick analysis without AI recommendations for faster response
      sopAnalysisAPI.analyze({
        user_id: 'user123',
        sop_text: debouncedText,
        compare_with_database: false
      }).then(result => {
        setQuickScore(result.data.scores.overall);
      });
    }
  }, [debouncedText]);

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {quickScore && (
        <div>Current Score: {quickScore.toFixed(1)}/100</div>
      )}
    </div>
  );
}
```

### 2. Version Comparison Dashboard

```typescript
function SOPVersionComparison() {
  const [versions, setVersions] = useState([]);

  const compareLatestTwo = async () => {
    if (versions.length < 2) return;

    const result = await sopAnalysisAPI.compare(
      'user123',
      versions[versions.length - 2].text,
      versions[versions.length - 1].text
    );

    return result.data;
  };

  return (
    <div>
      {/* Show improvement metrics */}
      <ComparisonChart data={comparisonResult} />
    </div>
  );
}
```

### 3. Progress Tracking

```typescript
function SOPProgressTracker({ userId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    sopAnalysisAPI.getStatistics(userId).then(response => {
      setStats(response.data);
    });
  }, [userId]);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <h3>Total Analyses</h3>
        <p>{stats.total_analyses}</p>
      </div>
      <div>
        <h3>Average Score</h3>
        <p>{stats.average_scores.overall.toFixed(1)}</p>
      </div>
      <div>
        <h3>Improvement</h3>
        <p className={stats.overall_improvement > 0 ? 'text-green-600' : ''}>
          {stats.overall_improvement > 0 ? '+' : ''}
          {stats.overall_improvement.toFixed(1)}
        </p>
      </div>
    </div>
  );
}
```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/sop-analysis/analyze` | POST | Analyze SOP |
| `/sop-analysis/compare` | POST | Compare versions |
| `/sop-analysis/history/{user_id}` | GET | Get history |
| `/sop-analysis/statistics/{user_id}` | GET | Get stats |
| `/sop-analysis/cliche/add` | POST | Add cliché |
| `/sop-analysis/cliches` | GET | List clichés |
| `/sop-analysis/health` | GET | Health check |

## Troubleshooting

### Issue: "Service unavailable"
**Solution**: Ensure AI service is running on port 8000

### Issue: "AI model not available"
**Solution**: Set `GOOGLE_API_KEY` environment variable

### Issue: "Database connection failed"
**Solution**: Start MongoDB and check connection string

### Issue: Low scores for good SOP
**Solution**: Ensure SOP mentions university, program, faculty names

## Next Steps

1. ✅ Service is operational
2. ✅ API endpoints are ready
3. ✅ Documentation complete
4. 🔲 Integrate with Next.js frontend
5. 🔲 Add to dashboard UI
6. 🔲 Create user-facing documentation

## Support

- **API Documentation**: http://localhost:8000/docs
- **Service README**: `/ai_service/SOP_ANALYSIS_SERVICE_README.md`
- **Implementation Details**: `/ai_service/SOP_ANALYSIS_IMPLEMENTATION_SUMMARY.md`

Happy analyzing! 🎓
