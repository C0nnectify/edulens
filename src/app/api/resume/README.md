# Resume Builder API Documentation

Complete backend API architecture for an AI-powered resume builder with ATS optimization, job matching, and intelligent analysis.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Data Models](#data-models)
- [AI Integration](#ai-integration)
- [Dependencies](#dependencies)

## Architecture Overview

The API is built using **Next.js 15 App Router** with the following architectural principles:

- **Modular Design**: Each endpoint is isolated in its own route file
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Authentication**: Integrated with better-auth for user authentication
- **Database**: MongoDB with Mongoose ODM
- **AI-Powered**: Integrated AI analysis for resume optimization
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes

### Directory Structure

```
src/app/api/
├── resume/
│   ├── route.ts                  # GET (list), POST (create)
│   ├── [id]/route.ts             # GET, PUT, DELETE (specific resume)
│   ├── analyze/route.ts          # POST (AI analysis)
│   ├── optimize/route.ts         # POST (AI optimization)
│   ├── match-job/route.ts        # POST (job matching)
│   ├── templates/route.ts        # GET (available templates)
│   └── export/route.ts           # POST (PDF/DOCX export)
└── job/
    ├── analyze/route.ts          # POST (analyze job URL with Firecrawl)
    └── extract-keywords/route.ts # POST (extract keywords from text)
```

## API Endpoints

### Resume CRUD Operations

#### 1. List Resumes
```http
GET /api/resume
```

**Query Parameters:**
- `page` (number, default: 1): Page number for pagination
- `limit` (number, default: 10, max: 100): Items per page
- `sort` (string, default: '-createdAt'): Sort field (prefix with '-' for descending)
- `search` (string, optional): Search term for filtering

**Response:**
```json
{
  "success": true,
  "data": {
    "resumes": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### 2. Create Resume
```http
POST /api/resume
```

**Request Body:**
```json
{
  "title": "Software Engineer Resume",
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-234-567-8900",
    "location": {
      "city": "San Francisco",
      "state": "CA",
      "country": "USA"
    },
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  },
  "summary": "Experienced software engineer...",
  "experience": [...],
  "education": [...],
  "skills": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "resume_id",
    ...resumeData
  },
  "message": "Resume created successfully"
}
```

#### 3. Get Resume by ID
```http
GET /api/resume/[id]
```

#### 4. Update Resume
```http
PUT /api/resume/[id]
```

**Note**: All fields are optional for updates

#### 5. Delete Resume
```http
DELETE /api/resume/[id]
```

### AI-Powered Features

#### 6. Analyze Resume
```http
POST /api/resume/analyze
```

**Request Body:**
```json
{
  "resumeId": "resume_id",
  "analyzeFor": "general" // Options: general, ats, impact, keywords
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": 78,
    "sections": {
      "personalInfo": 90,
      "summary": 75,
      "experience": 80,
      "education": 85,
      "skills": 70,
      "formatting": 75,
      "keywords": 65,
      "impact": 80
    },
    "atsCompatibility": 72,
    "strengths": [
      "Comprehensive experience section",
      "Contains quantifiable achievements"
    ],
    "weaknesses": [
      "Missing professional summary",
      "Lacks quantifiable metrics"
    ],
    "suggestions": [
      "Add a professional summary...",
      "Include quantifiable achievements..."
    ],
    "cached": false,
    "analyzedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Features:**
- Analyzes 30+ parameters
- ATS compatibility scoring
- Section-by-section breakdown
- Actionable suggestions
- 24-hour caching for performance

#### 7. Optimize Resume
```http
POST /api/resume/optimize
```

**Request Body:**
```json
{
  "resumeId": "resume_id",
  "targetRole": "Senior Software Engineer",
  "industry": "Technology",
  "optimizeFor": "ats" // Options: ats, impact, clarity, keywords
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resumeId": "resume_id",
    "currentScore": 65,
    "potentialScore": 80,
    "scoreImprovement": 15,
    "suggestions": [
      {
        "section": "summary",
        "type": "keyword",
        "current": "Experienced developer...",
        "suggested": "Results-driven Senior Software Engineer...",
        "reason": "Include target role and key skills",
        "impact": "high"
      }
    ],
    "keywordSuggestions": [
      "Python", "JavaScript", "React", "AWS"
    ],
    "overallRecommendations": [
      "Use standard section headings",
      "Include both acronyms and full forms"
    ]
  }
}
```

#### 8. Match Resume to Job
```http
POST /api/resume/match-job
```

**Request Body:**
```json
{
  "resumeId": "resume_id",
  "jobDescription": "We are seeking a Senior Software Engineer...",
  // OR
  "jobUrl": "https://company.com/jobs/123",
  // OR
  "jobPostingId": "job_posting_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "matchScore": 73,
    "matchedSkills": ["JavaScript", "React", "Node.js"],
    "missingSkills": ["TypeScript", "AWS"],
    "matchedKeywords": ["development", "agile", "team"],
    "missingKeywords": ["ci/cd", "docker"],
    "recommendations": [
      {
        "category": "skills",
        "suggestion": "Add TypeScript and AWS to your skills",
        "priority": "high"
      }
    ],
    "sectionScores": {
      "skills": 75,
      "experience": 80,
      "education": 70,
      "overall": 73
    }
  }
}
```

**Matching Algorithm:**
- Uses cosine similarity for text matching
- Keyword extraction and comparison
- Skills gap analysis
- Prioritized recommendations

### Job Analysis Features

#### 9. Analyze Job Posting (Firecrawl Integration)
```http
POST /api/job/analyze
```

**Request Body:**
```json
{
  "url": "https://company.com/careers/job/123",
  "extractKeywords": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job_posting_id",
    "title": "Senior Software Engineer",
    "company": "TechCorp Inc.",
    "location": "San Francisco, CA",
    "description": "Full job description...",
    "requirements": [
      "5+ years of software development",
      "Strong proficiency in JavaScript"
    ],
    "skills": ["JavaScript", "React", "Node.js"],
    "keywords": [
      { "word": "javascript", "score": 95 },
      { "word": "react", "score": 88 }
    ],
    "experienceLevel": "Senior",
    "employmentType": "full-time",
    "cached": false
  }
}
```

**Firecrawl Integration:**
- Scrapes job posting content from URL
- Parses structured data
- Extracts requirements and qualifications
- 24-hour caching to reduce scraping

#### 10. Extract Keywords from Text
```http
POST /api/job/extract-keywords
```

**Request Body:**
```json
{
  "description": "We are seeking an experienced...",
  "extractTop": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "keywords": [
      {
        "word": "javascript",
        "score": 95.5,
        "category": "technical",
        "frequency": 8
      }
    ],
    "topKeywords": ["javascript", "react", "node"],
    "keywordsByCategory": {
      "technical": ["javascript", "react"],
      "softSkills": ["communication", "teamwork"],
      "qualifications": ["bachelor", "5 years"]
    },
    "requirements": {
      "mustHave": ["javascript", "react"],
      "niceToHave": ["typescript"],
      "preferred": ["aws", "docker"]
    },
    "seniorityIndicators": ["Senior Level"],
    "cultureKeywords": ["fast-paced", "collaborative"]
  }
}
```

**NLP Techniques:**
- TF-IDF-like scoring
- N-gram extraction (bigrams, trigrams)
- Category classification
- Requirement classification (must-have vs. nice-to-have)

### Templates & Export

#### 11. Get Resume Templates
```http
GET /api/resume/templates
```

**Query Parameters:**
- `category` (string, optional): Filter by category
- `premium` (boolean, optional): Show only premium templates
- `free` (boolean, optional): Show only free templates

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "modern",
        "name": "Modern Professional",
        "description": "Clean and contemporary design...",
        "category": "modern",
        "isPremium": false,
        "features": ["Two-column layout", "ATS-friendly"]
      }
    ],
    "total": 10,
    "categories": ["modern", "professional", "creative"],
    "stats": {
      "totalTemplates": 10,
      "freeTemplates": 6,
      "premiumTemplates": 4
    }
  }
}
```

**Available Templates:**
- Modern Professional (Free)
- Classic Elegance (Free)
- ATS Optimized (Free)
- Creative Portfolio (Premium)
- Minimalist (Free)
- Executive (Premium)
- Tech Modern (Premium)
- Academic (Free)
- Startup Ready (Premium)
- International (Premium)

#### 12. Export Resume
```http
POST /api/resume/export
```

**Request Body:**
```json
{
  "resumeId": "resume_id",
  "format": "pdf", // Options: pdf, docx, txt
  "template": "modern",
  "includePhoto": false,
  "colorScheme": "blue",
  "fontSize": "medium" // Options: small, medium, large
}
```

**Response:**
- Returns file as downloadable attachment
- Content-Type set based on format
- Filename: `FirstName_LastName_Resume.{format}`

**Export Features:**
- PDF generation (planned: Puppeteer integration)
- DOCX generation (planned: docx library)
- Plain text export (implemented)
- Template-based styling
- Customizable formatting

## Authentication

All endpoints (except template browsing) require authentication using **better-auth**.

**Headers Required:**
```http
Authorization: Bearer <token>
Cookie: better-auth.session_token=<session_token>
```

**Authentication Flow:**
1. Request is intercepted by `authenticateRequest()` utility
2. Session is validated using better-auth API
3. User information is extracted and attached to request
4. Unauthorized requests receive 401 status

## Rate Limiting

Built-in rate limiting prevents API abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Resume CRUD | 100 req | 1 min |
| AI Analysis | 10 req | 1 min |
| AI Optimization | 10 req | 1 min |
| Job Matching | 20 req | 1 min |
| Job Analysis | 15 req | 1 min |
| Keyword Extraction | 30 req | 1 min |
| Export | 10 req | 1 min |

**Rate Limit Response:**
```json
{
  "error": "API Error",
  "message": "Rate limit exceeded",
  "statusCode": 429
}
```

## Error Handling

All errors return consistent JSON format:

```json
{
  "error": "API Error",
  "message": "Detailed error message",
  "statusCode": 400,
  "details": {} // Optional additional details
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

**Validation Errors:**
```json
{
  "error": "API Error",
  "message": "Validation failed",
  "statusCode": 400,
  "details": [
    {
      "field": "personalInfo.email",
      "message": "Invalid email address"
    }
  ]
}
```

## Data Models

### Resume Model
```typescript
interface Resume {
  _id?: string;
  userId: string;
  title: string;
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects?: Project[];
  certifications?: Certification[];
  languages?: Language[];
  customSections?: CustomSection[];
  template?: string;
  aiScore?: AIScore;
  lastAnalyzedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Job Posting Model
```typescript
interface JobPosting {
  _id?: string;
  url?: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements: string[];
  skills: string[];
  keywords: { word: string; score: number }[];
  experienceLevel?: string;
  employmentType?: string;
  scrapedAt?: Date;
}
```

Full type definitions available in: `src/types/resume.ts`

## AI Integration

### Current Implementation

The API includes **simulated AI analysis** with sophisticated algorithms:

1. **Resume Analysis**:
   - Content completeness scoring
   - Keyword density analysis
   - Impact statement detection
   - ATS compatibility checks

2. **Optimization Suggestions**:
   - Context-aware recommendations
   - Target role alignment
   - Industry-specific keywords
   - Quantifiable metrics suggestions

3. **Job Matching**:
   - Text similarity algorithms
   - Skills gap analysis
   - Keyword matching
   - Prioritized recommendations

### Production AI Integration

To integrate with real AI services (OpenAI, Claude, etc.):

**1. Update Environment Variables:**
```env
OPENAI_API_KEY=your_api_key
# or
ANTHROPIC_API_KEY=your_api_key
```

**2. Replace Simulation Functions:**

In `src/app/api/resume/analyze/route.ts`:
```typescript
import OpenAI from 'openai';

async function analyzeWithAI(resumeContent: string, analyzeFor: string): Promise<AIScore> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = RESUME_ANALYSIS_PROMPT.replace('{resumeContent}', resumeContent);

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const result = JSON.parse(completion.choices[0].message.content);
  return result;
}
```

**3. Similarly update:**
- `optimize/route.ts` - for optimization suggestions
- `match-job/route.ts` - for job matching (optional, current algorithm works well)

## Dependencies

### Required Packages

Add to `package.json`:

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "mongodb": "^6.0.0",
    "mongoose": "^8.0.0",
    "zod": "^3.22.0",
    "better-auth": "^1.0.0"
  }
}
```

### Optional for Enhanced Features

```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "puppeteer": "^21.0.0",
    "docx": "^8.0.0",
    "pdfkit": "^0.13.0",
    "natural": "^6.0.0",
    "compromise": "^14.0.0"
  }
}
```

### Firecrawl MCP Integration

The job analysis endpoint is designed to integrate with **Firecrawl MCP** server:

```typescript
// In src/app/api/job/analyze/route.ts
async function scrapeWithFirecrawl(url: string): Promise<string> {
  const firecrawlResponse = await fetch('http://localhost:3000/mcp/firecrawl/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, mode: 'markdown' })
  });

  const data = await firecrawlResponse.json();
  return data.content;
}
```

## Usage Examples

### Create and Analyze Resume

```typescript
// 1. Create resume
const createResponse = await fetch('/api/resume', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(resumeData)
});

const { data: resume } = await createResponse.json();

// 2. Analyze resume
const analysisResponse = await fetch('/api/resume/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    resumeId: resume.id,
    analyzeFor: 'ats'
  })
});

const { data: analysis } = await analysisResponse.json();
console.log(`Overall Score: ${analysis.overall}`);
```

### Match Resume to Job

```typescript
// 1. Analyze job posting
const jobResponse = await fetch('/api/job/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    url: 'https://company.com/jobs/123',
    extractKeywords: true
  })
});

const { data: job } = await jobResponse.json();

// 2. Match resume to job
const matchResponse = await fetch('/api/resume/match-job', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    resumeId: resume.id,
    jobPostingId: job.id
  })
});

const { data: match } = await matchResponse.json();
console.log(`Match Score: ${match.matchScore}%`);
console.log(`Missing Skills:`, match.missingSkills);
```

### Export Resume

```typescript
const exportResponse = await fetch('/api/resume/export', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    resumeId: resume.id,
    format: 'pdf',
    template: 'modern',
    fontSize: 'medium'
  })
});

// Download file
const blob = await exportResponse.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'resume.pdf';
a.click();
```

## Testing

### Test with cURL

```bash
# List resumes
curl -X GET "http://localhost:3000/api/resume?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create resume
curl -X POST "http://localhost:3000/api/resume" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @resume.json

# Analyze resume
curl -X POST "http://localhost:3000/api/resume/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"resumeId": "123", "analyzeFor": "ats"}'
```

## Deployment Notes

1. **Environment Variables**: Ensure all required env vars are set in production
2. **Database**: MongoDB connection string must be configured
3. **Rate Limiting**: Consider using Redis for distributed rate limiting
4. **File Storage**: For exports, integrate with S3 or similar for file storage
5. **AI Service**: Configure OpenAI/Claude API keys for production AI features
6. **Monitoring**: Add logging and monitoring (Sentry, LogRocket, etc.)
7. **Caching**: Implement Redis caching for AI results and job analysis

## License

This API is part of the EduLen platform. All rights reserved.
