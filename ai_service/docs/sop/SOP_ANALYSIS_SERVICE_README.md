# SOP Analysis Service Documentation

## Overview

The SOP (Statement of Purpose) Analysis Service provides comprehensive AI-powered analysis of Statement of Purpose documents for graduate school applications. It uses Google Gemini AI, embeddings, and advanced NLP techniques to evaluate SOPs across multiple dimensions.

## Features

### 1. **Comprehensive Quality Scoring** (0-100 scale)

- **Overall Score**: Weighted combination of all metrics
- **Uniqueness Score** (20% weight): Compares with existing SOPs in database
- **Structure Score** (20% weight): Evaluates organization and flow
- **Specificity Score** (25% weight): Measures concrete vs. generic content
- **Tone Score** (15% weight): Analyzes confidence, professionalism, and passion
- **Program Fit Score** (20% weight): Assesses customization to specific program

### 2. **Cliché Detection Engine**

- **Database of 40+ Common Clichés** (expandable)
- **Severity Ratings**: Major, Moderate, Minor
- **Categories**: Childhood dreams, generic passion, vague goals, buzzwords, etc.
- **Context-Aware Detection**: Shows surrounding text
- **Improvement Suggestions**: Specific recommendations for each cliché

### 3. **Structure Analysis**

- Paragraph count and length validation
- Introduction quality assessment
- Conclusion strength evaluation
- Transition word usage detection
- Logical flow analysis

### 4. **Program Customization Checker**

- University name mentions
- Program name mentions
- Faculty name detection
- Course/research area references
- Generic vs. customized content scoring

### 5. **Tone & Voice Analysis**

- Confidence level measurement
- Professionalism assessment
- Passion indicators
- Humility vs. arrogance balance
- Informal language detection

### 6. **AI-Powered Recommendations**

- Prioritized improvement suggestions (high, medium, low)
- Specific, actionable feedback
- Google Gemini AI-generated insights
- Category-based organization

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1/sop-analysis
```

### 1. Analyze SOP

**POST** `/api/v1/sop-analysis/analyze`

Perform comprehensive SOP analysis.

**Request Body:**
```json
{
  "user_id": "user123",
  "sop_text": "Your statement of purpose text here...",
  "university_name": "Stanford University",
  "program_name": "Computer Science PhD",
  "compare_with_database": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "SOP analysis complete. Overall score: 82.5/100 (Grade: B)",
  "data": {
    "user_id": "user123",
    "timestamp": "2025-10-12T10:30:00",
    "sop_length": 3500,
    "word_count": 625,
    "university_name": "Stanford University",
    "program_name": "Computer Science PhD",
    "scores": {
      "overall": 82.5,
      "uniqueness": 85.0,
      "structure": 90.0,
      "specificity": 75.0,
      "tone": 88.0,
      "program_fit": 78.0
    },
    "grade": "B",
    "structure_analysis": {
      "score": 90.0,
      "paragraph_count": 5,
      "average_paragraph_length": 125,
      "issues": [],
      "suggestions": ["Add more transition words"],
      "score_breakdown": {
        "paragraph_count": 100,
        "paragraph_length": 100,
        "introduction": 100,
        "conclusion": 85,
        "transitions": 80
      }
    },
    "cliche_detection": {
      "total_cliches": 3,
      "severity_counts": {
        "major": 1,
        "moderate": 2,
        "minor": 0
      },
      "detected_cliches": [
        {
          "text": "ever since i was a child",
          "severity": "major",
          "category": "childhood_dream",
          "position": {"start": 45, "end": 69},
          "context": "...technology. Ever since I was a child, I have been fascinated by...",
          "suggestion": "Start with a specific, recent experience that demonstrates your interest"
        }
      ],
      "cliche_penalty": 20,
      "categories": ["childhood_dream", "generic_passion"]
    },
    "tone_analysis": {
      "score": 88.0,
      "breakdown": {
        "confidence": 90,
        "passion": 85,
        "professionalism": 100,
        "humility": 80
      },
      "confident_phrases": 8,
      "weak_phrases": 2,
      "passion_indicators": 4,
      "informal_language": 0
    },
    "program_fit": {
      "score": 78.0,
      "mentions": {
        "university": 3,
        "program": 2,
        "faculty": 2,
        "courses": 1,
        "research_areas": 3
      },
      "issues": [],
      "suggestions": ["Mention specific courses that interest you"],
      "is_customized": true
    },
    "recommendations": [
      {
        "category": "cliche",
        "priority": "high",
        "issue": "Remove cliché: 'ever since i was a child'",
        "suggestions": ["Start with a specific, recent experience that demonstrates your interest"]
      },
      {
        "category": "specificity",
        "priority": "medium",
        "issue": "Add more quantifiable achievements",
        "suggestions": ["Include specific numbers, percentages, or metrics"]
      }
    ]
  }
}
```

### 2. Compare SOP Versions

**POST** `/api/v1/sop-analysis/compare`

Compare two versions of an SOP to track improvements.

**Request Body:**
```json
{
  "user_id": "user123",
  "sop_text_1": "First version of your SOP...",
  "sop_text_2": "Improved version of your SOP..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Version comparison complete. Improvement: +8.5 points (C → B)",
  "data": {
    "version_1": { /* Full analysis of version 1 */ },
    "version_2": { /* Full analysis of version 2 */ },
    "improvements": {
      "overall": 8.5,
      "uniqueness": 5.0,
      "structure": 10.0,
      "specificity": 12.0,
      "tone": 5.0,
      "program_fit": 10.0
    },
    "overall_change": 8.5,
    "grade_change": "C → B"
  }
}
```

### 3. Get Analysis History

**GET** `/api/v1/sop-analysis/history/{user_id}?limit=10`

Retrieve previous SOP analyses for a user.

**Response:**
```json
{
  "success": true,
  "message": "Retrieved 5 previous analyses",
  "data": {
    "user_id": "user123",
    "count": 5,
    "analyses": [
      { /* Most recent analysis */ },
      { /* Second most recent */ }
    ]
  }
}
```

### 4. Get User Statistics

**GET** `/api/v1/sop-analysis/statistics/{user_id}`

Get aggregate statistics for a user's SOP analyses.

**Response:**
```json
{
  "success": true,
  "message": "Statistics for 10 analyses",
  "data": {
    "user_id": "user123",
    "total_analyses": 10,
    "average_scores": {
      "overall": 78.5,
      "uniqueness": 82.0,
      "structure": 85.0,
      "specificity": 72.0,
      "tone": 80.0,
      "program_fit": 73.0
    },
    "overall_improvement": 15.5,
    "grade_distribution": {
      "A": 2,
      "B": 5,
      "C": 3
    },
    "top_cliche_categories": [
      {"category": "generic_passion", "count": 8},
      {"category": "childhood_dream", "count": 5}
    ],
    "latest_score": 85.0,
    "latest_grade": "B"
  }
}
```

### 5. Add Custom Cliché

**POST** `/api/v1/sop-analysis/cliche/add`

Add a custom cliché to the detection database.

**Request Body:**
```json
{
  "text": "needless to say",
  "severity": "minor",
  "category": "redundant_phrase",
  "suggestion": "Remove this redundant phrase"
}
```

**Severity Options:**
- `major`: Critical issues that significantly harm the SOP
- `moderate`: Notable problems that should be addressed
- `minor`: Small improvements that would enhance quality

### 6. Get All Clichés

**GET** `/api/v1/sop-analysis/cliches?limit=100&category=generic_passion`

Retrieve all clichés in the detection database.

**Response:**
```json
{
  "success": true,
  "message": "Retrieved 42 clichés",
  "data": {
    "count": 42,
    "cliches": [
      {
        "text": "ever since i was a child",
        "severity": "major",
        "category": "childhood_dream",
        "suggestion": "Start with a specific, recent experience"
      }
    ]
  }
}
```

### 7. Health Check

**GET** `/api/v1/sop-analysis/health`

Check service health and availability.

**Response:**
```json
{
  "success": true,
  "message": "SOP Analysis Service is operational",
  "data": {
    "status": "healthy",
    "ai_model_available": true,
    "database_available": true,
    "cliche_count": 42,
    "features": {
      "full_analysis": true,
      "cliche_detection": true,
      "structure_analysis": true,
      "tone_analysis": true,
      "program_fit_analysis": true,
      "ai_recommendations": true,
      "uniqueness_scoring": true,
      "version_comparison": true
    }
  }
}
```

## Cliché Categories

The service detects clichés across multiple categories:

1. **childhood_dream**: "Ever since I was a child", "From a very young age"
2. **generic_passion**: "I am passionate about", "Follow my passion"
3. **generic_dream**: "It has always been my dream"
4. **generic_opening**: "In today's rapidly changing world"
5. **vague_goal**: "Make a difference", "Give back to society"
6. **generic_trait**: "Hardworking and dedicated", "Team player"
7. **generic_skill**: "Excellent communication skills"
8. **buzzword**: "Cutting edge", "State of the art"
9. **flattery**: "Prestigious institution", "Renowned university"
10. **belief_cliche**: "I strongly believe", "I believe that"

## Scoring System

### Overall Score Calculation

```
Overall Score = (Uniqueness × 0.20) + (Structure × 0.20) +
                (Specificity × 0.25) + (Tone × 0.15) +
                (Program Fit × 0.20)
```

### Grade Mapping

- **A**: 90-100 (Excellent)
- **B**: 80-89 (Good)
- **C**: 70-79 (Satisfactory)
- **D**: 60-69 (Needs Improvement)
- **F**: 0-59 (Poor)

## MongoDB Collections

### 1. `sop_analysis`

Stores complete analysis results.

**Schema:**
```javascript
{
  user_id: String,
  timestamp: ISODate,
  sop_length: Number,
  word_count: Number,
  university_name: String,
  program_name: String,
  scores: {
    overall: Number,
    uniqueness: Number,
    structure: Number,
    specificity: Number,
    tone: Number,
    program_fit: Number
  },
  grade: String,
  structure_analysis: Object,
  cliche_detection: Object,
  tone_analysis: Object,
  program_fit: Object,
  recommendations: Array,
  stored_at: ISODate
}
```

### 2. `sop_cliches`

Stores cliché definitions (expandable).

**Schema:**
```javascript
{
  text: String,
  severity: String, // "major", "moderate", "minor"
  category: String,
  suggestion: String,
  custom: Boolean,
  created_at: ISODate,
  updated_at: ISODate
}
```

## Configuration

### Environment Variables

```bash
# Google AI (Required for AI recommendations)
GOOGLE_API_KEY=your_google_api_key

# MongoDB (Required)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# OpenAI (Optional, for uniqueness scoring)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=text-embedding-3-small
```

## Usage Examples

### Python Client Example

```python
import requests

# Analyze SOP
response = requests.post(
    "http://localhost:8000/api/v1/sop-analysis/analyze",
    json={
        "user_id": "user123",
        "sop_text": "Your statement of purpose here...",
        "university_name": "MIT",
        "program_name": "Computer Science PhD",
        "compare_with_database": True
    }
)

result = response.json()
print(f"Overall Score: {result['data']['scores']['overall']}")
print(f"Grade: {result['data']['grade']}")

# Display recommendations
for rec in result['data']['recommendations']:
    print(f"[{rec['priority'].upper()}] {rec['issue']}")
    for suggestion in rec['suggestions']:
        print(f"  → {suggestion}")
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

async function analyzeSOP(sopText, universityName, programName) {
  try {
    const response = await axios.post(
      'http://localhost:8000/api/v1/sop-analysis/analyze',
      {
        user_id: 'user123',
        sop_text: sopText,
        university_name: universityName,
        program_name: programName,
        compare_with_database: true
      }
    );

    const { scores, grade, recommendations } = response.data.data;

    console.log(`Overall Score: ${scores.overall}/100 (Grade: ${grade})`);
    console.log('\nScore Breakdown:');
    Object.entries(scores).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\nTop Recommendations:');
    recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority}] ${rec.issue}`);
    });

    return response.data;
  } catch (error) {
    console.error('Analysis failed:', error.response?.data || error.message);
  }
}

// Usage
analyzeSOP(
  'Your SOP text here...',
  'Stanford University',
  'Computer Science PhD'
);
```

### cURL Example

```bash
# Analyze SOP
curl -X POST "http://localhost:8000/api/v1/sop-analysis/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "sop_text": "Your statement of purpose text...",
    "university_name": "Harvard University",
    "program_name": "MBA",
    "compare_with_database": true
  }'

# Get user statistics
curl "http://localhost:8000/api/v1/sop-analysis/statistics/user123"

# Compare versions
curl -X POST "http://localhost:8000/api/v1/sop-analysis/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "sop_text_1": "First version...",
    "sop_text_2": "Improved version..."
  }'
```

## Best Practices

### For Students

1. **Run Analysis Early**: Get feedback before finalizing
2. **Address High Priority Issues First**: Focus on major clichés and structure
3. **Track Improvements**: Use version comparison to see progress
4. **Customize for Each Program**: Ensure program fit score is high
5. **Aim for Specificity**: Target 75+ on specificity score

### For Developers

1. **Cache Analysis Results**: Store in database to track history
2. **Batch Processing**: Use async processing for multiple SOPs
3. **Error Handling**: Always check `success` field in responses
4. **Rate Limiting**: Implement client-side rate limiting for AI calls
5. **Extend Clichés**: Add domain-specific clichés via `/cliche/add` endpoint

## Performance

- **Average Analysis Time**: 3-5 seconds
- **With AI Recommendations**: 8-12 seconds (depends on Gemini API)
- **Database Operations**: < 100ms
- **Concurrent Requests**: Supports up to 50 simultaneous analyses

## Limitations

1. **Language**: Currently supports English only
2. **Length**: Optimal for 500-1000 word SOPs
3. **AI Availability**: Some features require Google API key
4. **Context Understanding**: Cannot verify factual claims

## Troubleshooting

### Common Issues

**Issue**: "GOOGLE_API_KEY not set, AI analysis will be limited"
- **Solution**: Set `GOOGLE_API_KEY` environment variable for AI recommendations

**Issue**: Analysis returns low scores for good SOP
- **Solution**: Check for clichés, ensure program customization, add specific examples

**Issue**: Slow response times
- **Solution**: Check network connection to Google AI, consider caching embeddings

## Support

For issues or feature requests, please contact the development team or open an issue in the repository.

## License

Part of the EduLen AI Service platform.
