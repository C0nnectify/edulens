# Resume Builder API - Setup & Installation Guide

## Quick Start

Follow these steps to get the Resume Builder API up and running.

## Prerequisites

- Node.js 18+ installed
- MongoDB installed and running (or MongoDB Atlas account)
- Next.js 15 project (already configured)

## Installation Steps

### 1. Install Required Dependencies

```bash
# Install core dependencies
npm install mongoose zod

# Verify existing dependencies
# (These should already be installed in your project)
# - next@15
# - react@19
# - better-auth
# - mongodb
```

### 2. Configure Environment Variables

Create or update `.env.local` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/edulens

# Better Auth (should already be configured)
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Optional: AI Integration (for production)
# OPENAI_API_KEY=your-openai-key
# ANTHROPIC_API_KEY=your-anthropic-key
```

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB service
# macOS/Linux:
sudo systemctl start mongod

# or using Homebrew:
brew services start mongodb-community

# Windows:
net start MongoDB
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env.local`

### 4. Verify Installation

Run the development server:
```bash
npm run dev
```

The API should now be accessible at `http://localhost:3000/api/resume`

## File Structure Overview

```
src/
├── app/
│   └── api/
│       ├── resume/
│       │   ├── route.ts              # GET, POST /api/resume
│       │   ├── [id]/route.ts         # GET, PUT, DELETE /api/resume/[id]
│       │   ├── analyze/route.ts      # POST /api/resume/analyze
│       │   ├── optimize/route.ts     # POST /api/resume/optimize
│       │   ├── match-job/route.ts    # POST /api/resume/match-job
│       │   ├── templates/route.ts    # GET /api/resume/templates
│       │   └── export/route.ts       # POST /api/resume/export
│       └── job/
│           ├── analyze/route.ts      # POST /api/job/analyze
│           └── extract-keywords/route.ts # POST /api/job/extract-keywords
├── lib/
│   ├── mongoose.ts                   # MongoDB/Mongoose connection
│   ├── api-utils.ts                  # API utilities
│   ├── validations/
│   │   └── resume.ts                 # Zod validation schemas
│   ├── db/
│   │   └── models/
│   │       ├── Resume.ts             # Resume model
│   │       └── JobPosting.ts         # Job posting model
│   └── ai/
│       └── resume-prompts.ts         # AI prompts
└── types/
    └── resume.ts                     # TypeScript types
```

## Testing the API

### 1. Using cURL

**Get Templates (No Auth Required)**
```bash
curl http://localhost:3000/api/resume/templates
```

**Create Resume (Auth Required)**
```bash
curl -X POST http://localhost:3000/api/resume \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Software Engineer Resume",
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "experience": [],
    "education": [],
    "skills": []
  }'
```

**Analyze Resume**
```bash
curl -X POST http://localhost:3000/api/resume/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "resumeId": "RESUME_ID",
    "analyzeFor": "ats"
  }'
```

### 2. Using Postman or Insomnia

1. Import the collection from the documentation
2. Set authentication token in headers
3. Test each endpoint

### 3. Using Frontend (Example)

```typescript
// Create resume
const createResume = async (resumeData) => {
  const response = await fetch('/api/resume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resumeData)
  });

  const result = await response.json();
  return result.data;
};

// Analyze resume
const analyzeResume = async (resumeId) => {
  const response = await fetch('/api/resume/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resumeId,
      analyzeFor: 'ats'
    })
  });

  const result = await response.json();
  return result.data;
};
```

## Database Schema

The MongoDB collections will be automatically created when you first create a resume:

### Collections Created:
- `resumes` - Stores user resumes
- `jobpostings` - Stores analyzed job postings

### Indexes:
Automatically created for performance:
- `resumes`: userId, createdAt, title (text search)
- `jobpostings`: url (unique), text search on title/company/description

## Optional Enhancements

### 1. Add Real AI Integration

**Install OpenAI SDK:**
```bash
npm install openai
```

**Update analyze endpoint** (`src/app/api/resume/analyze/route.ts`):
```typescript
import OpenAI from 'openai';

async function analyzeWithAI(resumeContent: string, analyzeFor: string): Promise<AIScore> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: RESUME_ANALYSIS_PROMPT.replace('{resumeContent}', resumeContent)
    }],
    temperature: 0.7,
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
}
```

### 2. Add PDF Export

**Install Puppeteer:**
```bash
npm install puppeteer
```

**Update export endpoint** (`src/app/api/resume/export/route.ts`):
```typescript
import puppeteer from 'puppeteer';

async function generatePDF(resume: Resume, template: string): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = renderResumeTemplate(resume, template);
  await page.setContent(html);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  return pdf;
}
```

### 3. Add Firecrawl Integration

**Update job analyze endpoint** (`src/app/api/job/analyze/route.ts`):
```typescript
async function scrapeWithFirecrawl(url: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:3000/mcp/firecrawl/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, mode: 'markdown' })
    });

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Firecrawl error:', error);
    throw new Error('Failed to scrape job posting');
  }
}
```

### 4. Add Redis Caching

**Install Redis:**
```bash
npm install redis ioredis
```

**Create cache utility** (`src/lib/cache.ts`):
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCache(key: string, value: any, ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value));
}
```

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoServerError: Authentication failed"**
- Check MongoDB credentials in `.env.local`
- Verify MongoDB is running: `mongod --version`
- For Atlas, ensure IP whitelist includes your IP

**Error: "MongooseError: Cannot overwrite model"**
- This is handled automatically in the model files
- Restart the dev server if persists

### Authentication Issues

**Error: "Unauthorized" on all requests**
- Verify better-auth is properly configured
- Check session cookies in browser
- Ensure `auth.ts` is set up correctly

### Type Errors

**Error: Type issues with Resume interface**
- The types file was auto-generated with extensive definitions
- Use the types as-is or simplify if needed
- Run `npm run build` to check for type errors

### Rate Limiting

**Error: "Rate limit exceeded"**
- Wait for the time window to reset (usually 1 minute)
- Adjust rate limits in `src/lib/api-utils.ts` if needed
- For development, you can temporarily disable rate limiting

## Production Deployment

### 1. Environment Variables

Set these in your production environment:
```env
MONGODB_URI=your-production-mongodb-uri
BETTER_AUTH_SECRET=your-production-secret
BETTER_AUTH_URL=https://yourdomain.com
OPENAI_API_KEY=your-openai-key (optional)
```

### 2. Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

### 3. Production Checklist

- [ ] MongoDB production instance configured
- [ ] Environment variables set
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured appropriately
- [ ] Monitoring/logging set up (Sentry, LogRocket, etc.)
- [ ] Backup strategy for MongoDB
- [ ] AI API keys added (if using real AI)
- [ ] File storage configured for exports (S3, etc.)

## API Endpoints Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/resume` | GET | ✅ | List resumes |
| `/api/resume` | POST | ✅ | Create resume |
| `/api/resume/[id]` | GET | ✅ | Get resume |
| `/api/resume/[id]` | PUT | ✅ | Update resume |
| `/api/resume/[id]` | DELETE | ✅ | Delete resume |
| `/api/resume/analyze` | POST | ✅ | Analyze resume |
| `/api/resume/optimize` | POST | ✅ | Get optimization suggestions |
| `/api/resume/match-job` | POST | ✅ | Match to job description |
| `/api/resume/templates` | GET | ❌ | Get templates |
| `/api/resume/export` | POST | ✅ | Export resume |
| `/api/job/analyze` | POST | ✅ | Analyze job URL |
| `/api/job/extract-keywords` | POST | ✅ | Extract keywords |

## Support

- **Full Documentation**: See `src/app/api/resume/README.md`
- **API Summary**: See `RESUME_API_SUMMARY.md`
- **Type Definitions**: See `src/types/resume.ts`

## Next Steps

1. ✅ Install dependencies: `npm install mongoose zod`
2. ✅ Configure `.env.local` with MongoDB URI
3. ✅ Start MongoDB
4. ✅ Run `npm run dev`
5. ✅ Test endpoints with cURL or Postman
6. 🔲 Integrate with frontend components
7. 🔲 Add real AI integration (optional)
8. 🔲 Configure Firecrawl MCP (optional)
9. 🔲 Implement PDF export (optional)
10. 🔲 Deploy to production

---

**Status**: ✅ API Implementation Complete

All endpoints are implemented and ready to use. The API includes sophisticated algorithms for resume analysis, job matching, and keyword extraction that work without AI services, with the option to integrate real AI for enhanced capabilities.
