# Next.js Frontend Integration Guide - Admission Prediction

## Overview

This guide shows how to integrate the Admission Prediction Service into your Next.js frontend application.

## Architecture

```
Next.js Frontend (Port 3000)
    │
    └─► /api/admission/* (Next.js API Routes - Proxy)
            │
            └─► http://localhost:8000/api/v1/admission/* (FastAPI AI Service)
```

## Step 1: Create Type Definitions

Create `/src/types/admission.ts`:

```typescript
// Student Profile Types
export type TestType = 'gre' | 'gmat' | 'toefl' | 'ielts' | 'sat' | 'act';
export type DegreeLevel = 'bachelors' | 'masters' | 'phd' | 'mba';
export type SchoolCategory = 'reach' | 'target' | 'safety';
export type AdmissionDecision = 'accepted' | 'rejected' | 'waitlisted' | 'deferred';

export interface TestScore {
  test_type: TestType;
  total_score?: number;
  verbal_score?: number;
  quantitative_score?: number;
  analytical_score?: number;
  date_taken?: string;
}

export interface StudentProfile {
  gpa: number;
  gpa_scale: number;
  undergraduate_major?: string;
  undergraduate_university?: string;
  undergraduate_university_ranking?: number;
  test_scores: TestScore[];
  research_publications: number;
  conference_papers: number;
  patents: number;
  work_experience_months: number;
  relevant_work_experience_months: number;
  internships_count: number;
  academic_awards: number;
  professional_certifications: number;
  leadership_positions: number;
  volunteer_hours: number;
  nationality?: string;
  gender?: string;
}

export interface ProgramInfo {
  university_name: string;
  university_ranking?: number;
  program_name: string;
  degree_level: DegreeLevel;
  department?: string;
  specialization?: string;
  acceptance_rate?: number;
  average_gpa?: number;
  gre_verbal_avg?: number;
  gre_quant_avg?: number;
  gmat_avg?: number;
  is_stem: boolean;
  has_funding: boolean;
  application_deadline?: string;
}

export interface AdmissionPrediction {
  probability: number;
  probability_percentage: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  category: SchoolCategory;
  strengths: string[];
  weaknesses: string[];
  key_factors: Record<string, number>;
  recommendation: string;
  suggested_improvements: string[];
}

export interface GapAnalysis {
  gpa_gap: number;
  test_score_gap?: number;
  research_gap: number;
  work_experience_gap: number;
  gpa_percentile: number;
  test_percentile?: number;
  overall_competitiveness: number;
  gaps_to_address: Array<{
    area: string;
    current?: any;
    target?: any;
    gap?: number;
    priority: 'high' | 'medium' | 'low';
    action: string;
  }>;
}

export interface ProfileEvaluation {
  evaluation_id: string;
  user_id: string;
  student_profile: StudentProfile;
  target_program: ProgramInfo;
  prediction: AdmissionPrediction;
  gap_analysis: GapAnalysis;
  similar_admits: any[];
  similar_rejects: any[];
  model_version: string;
  evaluation_date: string;
}

export interface BatchPredictionResponse {
  evaluations: ProfileEvaluation[];
  reach_schools: string[];
  target_schools: string[];
  safety_schools: string[];
  average_probability: number;
  highest_probability: number;
  lowest_probability: number;
}
```

## Step 2: Create API Client

Create `/src/lib/api/admission.ts`:

```typescript
import { StudentProfile, ProgramInfo, ProfileEvaluation, BatchPredictionResponse } from '@/types/admission';

const API_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export class AdmissionAPI {
  /**
   * Predict admission probability for a single program
   */
  static async predictAdmission(
    profile: StudentProfile,
    program: ProgramInfo,
    options: {
      includeGapAnalysis?: boolean;
      includeSimilarProfiles?: boolean;
    } = {}
  ): Promise<ProfileEvaluation> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admission/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_profile: profile,
        target_program: program,
        include_gap_analysis: options.includeGapAnalysis ?? true,
        include_similar_profiles: options.includeSimilarProfiles ?? true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to predict admission');
    }

    return response.json();
  }

  /**
   * Predict admission for multiple programs (batch)
   */
  static async predictBatch(
    profile: StudentProfile,
    programs: ProgramInfo[]
  ): Promise<BatchPredictionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admission/predict/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_profile: profile,
        target_programs: programs,
        categorize_schools: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to predict batch');
    }

    return response.json();
  }

  /**
   * Get user's previous evaluations
   */
  static async getEvaluations(limit = 10, skip = 0): Promise<ProfileEvaluation[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/admission/evaluations?limit=${limit}&skip=${skip}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch evaluations');
    }

    return response.json();
  }

  /**
   * Get specific evaluation by ID
   */
  static async getEvaluation(evaluationId: string): Promise<ProfileEvaluation> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/admission/evaluations/${evaluationId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch evaluation');
    }

    return response.json();
  }

  /**
   * Contribute admission data
   */
  static async contributeData(data: {
    profile: StudentProfile;
    program: ProgramInfo;
    decision: AdmissionDecision;
    application_year: number;
    application_cycle: 'fall' | 'spring' | 'summer';
    scholarship_amount?: number;
    assistantship_offered?: boolean;
  }): Promise<{ status: string; data_point_id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admission/data/contribute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        allow_anonymous_use: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to contribute data');
    }

    return response.json();
  }

  /**
   * Get service statistics
   */
  static async getStatistics(): Promise<{
    data_points: { total: number; verified: number };
    evaluations: { total: number };
    models: {
      total: number;
      active: number;
      current_version: string;
      current_type: string;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admission/statistics`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch statistics');
    }

    return response.json();
  }
}
```

## Step 3: Create React Hook

Create `/src/hooks/useAdmissionPrediction.ts`:

```typescript
import { useState } from 'react';
import { AdmissionAPI } from '@/lib/api/admission';
import { StudentProfile, ProgramInfo, ProfileEvaluation, BatchPredictionResponse } from '@/types/admission';

export function useAdmissionPrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictAdmission = async (
    profile: StudentProfile,
    program: ProgramInfo
  ): Promise<ProfileEvaluation | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await AdmissionAPI.predictAdmission(profile, program);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const predictBatch = async (
    profile: StudentProfile,
    programs: ProgramInfo[]
  ): Promise<BatchPredictionResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await AdmissionAPI.predictBatch(profile, programs);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    predictAdmission,
    predictBatch,
    loading,
    error,
  };
}
```

## Step 4: Create Next.js API Route (Proxy)

Create `/src/app/api/admission/predict/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward request to AI service
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/admission/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Prediction failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admission prediction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Step 5: Create UI Components

### Admission Predictor Component

Create `/src/components/admission/AdmissionPredictor.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAdmissionPrediction } from '@/hooks/useAdmissionPrediction';
import { StudentProfile, ProgramInfo } from '@/types/admission';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function AdmissionPredictor() {
  const { predictAdmission, loading, error } = useAdmissionPrediction();
  const [result, setResult] = useState<any>(null);

  // Sample data for demonstration
  const sampleProfile: StudentProfile = {
    gpa: 3.8,
    gpa_scale: 4.0,
    test_scores: [
      {
        test_type: 'gre',
        total_score: 325,
        verbal_score: 160,
        quantitative_score: 165,
      },
    ],
    research_publications: 2,
    conference_papers: 1,
    patents: 0,
    work_experience_months: 24,
    relevant_work_experience_months: 18,
    internships_count: 3,
    academic_awards: 2,
    professional_certifications: 1,
    leadership_positions: 2,
    volunteer_hours: 50,
  };

  const sampleProgram: ProgramInfo = {
    university_name: 'Stanford University',
    university_ranking: 3,
    program_name: 'Computer Science',
    degree_level: 'masters',
    acceptance_rate: 0.05,
    average_gpa: 3.9,
    gre_quant_avg: 168,
    is_stem: true,
    has_funding: true,
  };

  const handlePredict = async () => {
    const evaluation = await predictAdmission(sampleProfile, sampleProgram);
    setResult(evaluation);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Admission Probability Calculator</h2>

        {/* Profile Summary */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Your Profile:</h3>
          <p>GPA: {sampleProfile.gpa} / {sampleProfile.gpa_scale}</p>
          <p>GRE: {sampleProfile.test_scores[0].total_score}</p>
          <p>Publications: {sampleProfile.research_publications}</p>
        </div>

        {/* Program Info */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Target Program:</h3>
          <p>{sampleProgram.university_name}</p>
          <p>{sampleProgram.program_name} - {sampleProgram.degree_level}</p>
          <p>Acceptance Rate: {(sampleProgram.acceptance_rate! * 100).toFixed(1)}%</p>
        </div>

        {/* Predict Button */}
        <Button
          onClick={handlePredict}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Predict Admission Probability'
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
      </Card>

      {/* Results Display */}
      {result && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Prediction Results</h3>

          {/* Probability */}
          <div className="mb-6">
            <div className="text-4xl font-bold text-blue-600">
              {result.prediction.probability_percentage.toFixed(1)}%
            </div>
            <p className="text-gray-600">Admission Probability</p>
            <p className="text-sm text-gray-500">
              Confidence: {(result.prediction.confidence_interval_lower * 100).toFixed(1)}% -
              {(result.prediction.confidence_interval_upper * 100).toFixed(1)}%
            </p>
          </div>

          {/* Category Badge */}
          <div className="mb-6">
            <span className={`
              px-4 py-2 rounded-full font-semibold
              ${result.prediction.category === 'safety' ? 'bg-green-100 text-green-800' : ''}
              ${result.prediction.category === 'target' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${result.prediction.category === 'reach' ? 'bg-red-100 text-red-800' : ''}
            `}>
              {result.prediction.category.toUpperCase()} SCHOOL
            </span>
          </div>

          {/* Strengths */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2 text-green-600">Strengths:</h4>
            <ul className="list-disc list-inside space-y-1">
              {result.prediction.strengths.map((strength: string, i: number) => (
                <li key={i}>{strength}</li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          {result.prediction.weaknesses.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2 text-red-600">Areas to Improve:</h4>
              <ul className="list-disc list-inside space-y-1">
                {result.prediction.weaknesses.map((weakness: string, i: number) => (
                  <li key={i}>{weakness}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Recommendation:</h4>
            <p className="text-gray-700">{result.prediction.recommendation}</p>
          </div>

          {/* Suggested Improvements */}
          <div>
            <h4 className="font-semibold mb-2">Action Items:</h4>
            <ol className="list-decimal list-inside space-y-2">
              {result.prediction.suggested_improvements.map((item: string, i: number) => (
                <li key={i} className="text-gray-700">{item}</li>
              ))}
            </ol>
          </div>
        </Card>
      )}
    </div>
  );
}
```

### Batch School Evaluator

Create `/src/components/admission/BatchSchoolEvaluator.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAdmissionPrediction } from '@/hooks/useAdmissionPrediction';
import { StudentProfile, ProgramInfo } from '@/types/admission';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function BatchSchoolEvaluator() {
  const { predictBatch, loading } = useAdmissionPrediction();
  const [results, setResults] = useState<any>(null);

  // Sample schools list
  const schools: ProgramInfo[] = [
    {
      university_name: 'Stanford University',
      program_name: 'Computer Science',
      degree_level: 'masters',
      acceptance_rate: 0.05,
      is_stem: true,
      has_funding: true,
    },
    {
      university_name: 'UC Berkeley',
      program_name: 'Computer Science',
      degree_level: 'masters',
      acceptance_rate: 0.08,
      is_stem: true,
      has_funding: true,
    },
    // Add more schools...
  ];

  const handleEvaluate = async (profile: StudentProfile) => {
    const result = await predictBatch(profile, schools);
    setResults(result);
  };

  return (
    <div className="space-y-6">
      {/* Results by Category */}
      {results && (
        <>
          <Card className="p-6 bg-red-50">
            <h3 className="font-bold text-red-800 mb-2">
              Reach Schools ({results.reach_schools.length})
            </h3>
            <ul className="space-y-1">
              {results.reach_schools.map((school: string, i: number) => (
                <li key={i} className="text-sm">{school}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 bg-yellow-50">
            <h3 className="font-bold text-yellow-800 mb-2">
              Target Schools ({results.target_schools.length})
            </h3>
            <ul className="space-y-1">
              {results.target_schools.map((school: string, i: number) => (
                <li key={i} className="text-sm">{school}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 bg-green-50">
            <h3 className="font-bold text-green-800 mb-2">
              Safety Schools ({results.safety_schools.length})
            </h3>
            <ul className="space-y-1">
              {results.safety_schools.map((school: string, i: number) => (
                <li key={i} className="text-sm">{school}</li>
              ))}
            </ul>
          </Card>

          {/* Statistics */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Summary Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Average</p>
                <p className="text-2xl font-bold">
                  {(results.average_probability * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Highest</p>
                <p className="text-2xl font-bold">
                  {(results.highest_probability * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lowest</p>
                <p className="text-2xl font-bold">
                  {(results.lowest_probability * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
```

## Step 6: Create Page

Create `/src/app/dashboard/admission-predictor/page.tsx`:

```typescript
import { AdmissionPredictor } from '@/components/admission/AdmissionPredictor';

export default function AdmissionPredictorPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admission Probability Calculator</h1>
      <AdmissionPredictor />
    </div>
  );
}
```

## Step 7: Environment Variables

Add to `.env.local`:

```env
# AI Service URL
AI_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

## Usage Example

```typescript
import { AdmissionAPI } from '@/lib/api/admission';

// In your component or API route
const profile = {
  gpa: 3.8,
  gpa_scale: 4.0,
  test_scores: [{ test_type: 'gre', total_score: 325 }],
  research_publications: 2,
  // ... other fields
};

const program = {
  university_name: 'Stanford University',
  program_name: 'Computer Science',
  degree_level: 'masters',
  // ... other fields
};

// Single prediction
const result = await AdmissionAPI.predictAdmission(profile, program);
console.log(`Probability: ${result.prediction.probability_percentage}%`);

// Batch prediction
const programs = [program1, program2, program3];
const batchResult = await AdmissionAPI.predictBatch(profile, programs);
console.log(`Reach schools: ${batchResult.reach_schools.length}`);
```

## Testing

```bash
# Start AI service
cd ai_service
uvicorn app.main:app --reload

# Start Next.js dev server
npm run dev

# Visit
http://localhost:3000/dashboard/admission-predictor
```

## Production Deployment

1. **Update Environment Variables**:
   ```env
   AI_SERVICE_URL=https://ai-service.yourdomain.com
   ```

2. **Add Authentication**:
   - Extract JWT token from Better Auth
   - Pass token to AI service
   - Update API routes to include auth headers

3. **Add Error Handling**:
   - Implement retry logic
   - Add fallback UI
   - Log errors for monitoring

4. **Optimize Performance**:
   - Cache predictions
   - Implement loading states
   - Add skeleton screens

## Next Steps

1. Build profile form for user input
2. Add visualization (charts, progress bars)
3. Implement evaluation history
4. Add school comparison features
5. Create PDF export of results

---

**Need Help?**
- API Documentation: http://localhost:8000/docs
- Check `ADMISSION_PREDICTION_README.md` for details
- Run test script: `python test_admission_example.py`
