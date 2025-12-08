# Faculty Scraper - EduLen Integration Guide

This guide shows how to integrate the faculty scraper data with the EduLen Next.js application.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Next.js Application             │
│         (Port 3000)                     │
│                                         │
│  ┌────────────────────────────────┐   │
│  │   API Routes                   │   │
│  │   /api/faculty/*              │   │
│  └────────────┬───────────────────┘   │
│               │                        │
└───────────────┼────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │   MongoDB     │
        │               │
        │  Collections: │
        │  - faculty_data
        │  - universities
        └───────────────┘
                ▲
                │
┌───────────────┼────────────────────────┐
│               │                        │
│  ┌────────────┴───────────────────┐   │
│  │   Faculty Scraper              │   │
│  │   (Python Script)              │   │
│  └────────────────────────────────┘   │
│                                        │
│         train_ml/                      │
└────────────────────────────────────────┘
```

## Integration Steps

### 1. Create Next.js API Routes

Create faculty search endpoints in your Next.js application.

**File**: `/home/ismail/edulen/src/app/api/faculty/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { research_areas, universities, limit = 20 } = body;

    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'edulens');

    // Build query
    const query: any = {};

    if (research_areas && research_areas.length > 0) {
      query.research_areas = { $in: research_areas };
    }

    if (universities && universities.length > 0) {
      query.university_id = { $in: universities };
    }

    // Execute search
    const faculty = await db
      .collection('faculty_data')
      .find(query)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      count: faculty.length,
      faculty: faculty.map(f => ({
        ...f,
        _id: f._id.toString()
      }))
    });

  } catch (error) {
    console.error('Faculty search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
```

### 2. Create Faculty Service

**File**: `/home/ismail/edulen/src/lib/services/faculty-service.ts`

```typescript
interface FacultyMember {
  name: string;
  title: string;
  email: string;
  research_areas: string[];
  university_name: string;
  department: string;
  website?: string;
  photo?: string;
  accepting_students?: boolean;
}

interface FacultySearchParams {
  research_areas?: string[];
  universities?: string[];
  accepting_students?: boolean;
  limit?: number;
}

export class FacultyService {
  /**
   * Search for faculty members
   */
  static async searchFaculty(
    params: FacultySearchParams
  ): Promise<FacultyMember[]> {
    const response = await fetch('/api/faculty/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error('Faculty search failed');
    }

    const data = await response.json();
    return data.faculty;
  }

  /**
   * Find faculty by university
   */
  static async getFacultyByUniversity(
    universityId: string
  ): Promise<FacultyMember[]> {
    return this.searchFaculty({ universities: [universityId] });
  }

  /**
   * Match faculty with student interests
   */
  static async matchProfessors(
    studentInterests: string[]
  ): Promise<FacultyMember[]> {
    const faculty = await this.searchFaculty({
      research_areas: studentInterests,
      limit: 50
    });

    // Calculate match scores
    return faculty
      .map(f => ({
        ...f,
        matchScore: this.calculateMatchScore(
          f.research_areas,
          studentInterests
        )
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate match score between faculty and student interests
   */
  private static calculateMatchScore(
    facultyAreas: string[],
    studentInterests: string[]
  ): number {
    const matches = facultyAreas.filter(area =>
      studentInterests.some(interest =>
        area.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(area.toLowerCase())
      )
    );
    return matches.length / studentInterests.length;
  }

  /**
   * Get research area suggestions
   */
  static async getResearchAreas(): Promise<string[]> {
    const response = await fetch('/api/faculty/research-areas');
    const data = await response.json();
    return data.research_areas;
  }

  /**
   * Get universities with faculty data
   */
  static async getUniversities(): Promise<any[]> {
    const response = await fetch('/api/faculty/universities');
    const data = await response.json();
    return data.universities;
  }
}
```

### 3. Create Research Areas API

**File**: `/home/ismail/edulen/src/app/api/faculty/research-areas/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'edulens');

    const researchAreas = await db
      .collection('faculty_data')
      .distinct('research_areas');

    return NextResponse.json({
      success: true,
      research_areas: researchAreas.sort()
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch research areas' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
```

### 4. Create Universities API

**File**: `/home/ismail/edulen/src/app/api/faculty/universities/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'edulens');

    const universities = await db
      .collection('universities_scraped')
      .find({})
      .toArray();

    return NextResponse.json({
      success: true,
      universities: universities.map(u => ({
        id: u.university_id,
        name: u.university_name,
        departments: u.departments,
        last_scraped: u.last_scraped
      }))
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch universities' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
```

### 5. Create Professor Matching Component

**File**: `/home/ismail/edulen/src/components/faculty/ProfessorMatcher.tsx`

```typescript
'use client';

import { useState } from 'react';
import { FacultyService } from '@/lib/services/faculty-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfessorMatcher() {
  const [interests, setInterests] = useState<string>('');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const interestsList = interests
        .split(',')
        .map(i => i.trim())
        .filter(Boolean);

      const results = await FacultyService.matchProfessors(interestsList);
      setMatches(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find Matching Professors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter research interests (comma separated)"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {matches.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {matches.length} matching professors
              </p>

              {matches.map((faculty, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{faculty.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {faculty.title}
                          </p>
                          <p className="text-sm font-medium">
                            {faculty.university_name} - {faculty.department}
                          </p>
                        </div>
                        {faculty.matchScore && (
                          <Badge variant="secondary">
                            {Math.round(faculty.matchScore * 100)}% match
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {faculty.research_areas?.map((area: string) => (
                          <Badge key={area} variant="outline">
                            {area}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-4 text-sm">
                        {faculty.email && (
                          <a
                            href={`mailto:${faculty.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            Email
                          </a>
                        )}
                        {faculty.website && (
                          <a
                            href={faculty.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Website
                          </a>
                        )}
                        {faculty.accepting_students && (
                          <Badge variant="default">Accepting Students</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6. Create Faculty Search Page

**File**: `/home/ismail/edulen/src/app/dashboard/faculty-search/page.tsx`

```typescript
import { Metadata } from 'next';
import { ProfessorMatcher } from '@/components/faculty/ProfessorMatcher';

export const metadata: Metadata = {
  title: 'Faculty Search | EduLen',
  description: 'Find professors and match research interests'
};

export default function FacultySearchPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Faculty Search</h1>
        <p className="text-muted-foreground">
          Search faculty from top universities and match with your research interests
        </p>
      </div>

      <ProfessorMatcher />
    </div>
  );
}
```

### 7. Add Navigation Link

**File**: `/home/ismail/edulen/src/components/dashboard/Sidebar.tsx`

Add to navigation:

```typescript
{
  name: 'Faculty Search',
  href: '/dashboard/faculty-search',
  icon: Users,
  description: 'Find professors and research matches'
}
```

## Advanced Integration Examples

### University Recommendation System

```typescript
// src/lib/services/university-recommender.ts

export class UniversityRecommender {
  static async recommendUniversities(
    studentProfile: {
      interests: string[];
      targetDegree: string;
      preferences: any;
    }
  ) {
    // Get faculty matching student interests
    const matchingFaculty = await FacultyService.matchProfessors(
      studentProfile.interests
    );

    // Group by university
    const universityScores = new Map<string, number>();

    matchingFaculty.forEach(faculty => {
      const currentScore = universityScores.get(faculty.university_id) || 0;
      universityScores.set(
        faculty.university_id,
        currentScore + faculty.matchScore
      );
    });

    // Sort universities by score
    return Array.from(universityScores.entries())
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score);
  }
}
```

### Email Outreach Campaign

```typescript
// src/lib/services/outreach-service.ts

export class OutreachService {
  static async generateEmailList(filters: {
    universities?: string[];
    research_areas?: string[];
  }) {
    const faculty = await FacultyService.searchFaculty({
      ...filters,
      limit: 1000
    });

    return faculty
      .filter(f => f.email && f.accepting_students)
      .map(f => ({
        name: f.name,
        email: f.email,
        university: f.university_name,
        research_areas: f.research_areas
      }));
  }

  static generateEmailTemplate(faculty: any, studentProfile: any) {
    return `
Subject: Research Interest in ${faculty.research_areas[0]}

Dear Professor ${faculty.name.split(' ').pop()},

I am a prospective graduate student interested in ${studentProfile.interests.join(', ')}.
I came across your research in ${faculty.research_areas.join(', ')} at ${faculty.university_name}.

[Student's personalized message]

Best regards,
[Student Name]
    `.trim();
  }
}
```

### Research Trends Dashboard

```typescript
// src/components/faculty/ResearchTrends.tsx

export function ResearchTrends() {
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/faculty/research-trends')
      .then(res => res.json())
      .then(data => setTrends(data.trends));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trends.map((trend, i) => (
            <div key={i} className="flex justify-between items-center">
              <span>{trend.area}</span>
              <Badge>{trend.count} faculty</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Database Indexes

Add these indexes for better performance:

```javascript
// In MongoDB shell or script
use edulens;

// Faculty collection indexes
db.faculty_data.createIndex({ "research_areas": 1 });
db.faculty_data.createIndex({ "university_id": 1, "department": 1 });
db.faculty_data.createIndex({ "accepting_students": 1 });
db.faculty_data.createIndex({ "email": 1 });

// Universities collection indexes
db.universities_scraped.createIndex({ "university_id": 1 }, { unique: true });

// Text search index for advanced queries
db.faculty_data.createIndex({
  "name": "text",
  "research_areas": "text",
  "lab": "text"
});
```

## Scheduled Updates

Add cron job to keep data fresh:

```bash
# Edit crontab
crontab -e

# Add monthly scraping job (runs 1st of month at 2 AM)
0 2 1 * * cd /home/ismail/edulen/train_ml && source venv/bin/activate && python faculty_scraper.py --all --resume >> logs/scraper.log 2>&1
```

## Monitoring

Create a monitoring dashboard:

```typescript
// src/app/api/faculty/stats/route.ts

export async function GET() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    const db = client.db('edulens');

    const stats = {
      total_faculty: await db.collection('faculty_data').countDocuments({}),
      total_universities: await db.collection('universities_scraped').countDocuments({}),
      last_update: await db.collection('universities_scraped')
        .find({})
        .sort({ last_scraped: -1 })
        .limit(1)
        .toArray(),
      by_university: await db.collection('faculty_data')
        .aggregate([
          { $group: { _id: '$university_name', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
        .toArray()
    };

    return NextResponse.json({ success: true, stats });
  } finally {
    await client.close();
  }
}
```

## Testing

Test the integration:

```typescript
// src/__tests__/faculty-service.test.ts

import { FacultyService } from '@/lib/services/faculty-service';

describe('FacultyService', () => {
  it('should search faculty by research area', async () => {
    const results = await FacultyService.searchFaculty({
      research_areas: ['Machine Learning']
    });

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });

  it('should calculate match scores correctly', async () => {
    const matches = await FacultyService.matchProfessors([
      'AI', 'Machine Learning'
    ]);

    expect(matches[0].matchScore).toBeDefined();
    expect(matches[0].matchScore).toBeGreaterThan(0);
  });
});
```

## Production Considerations

1. **Caching**: Add Redis caching for frequently accessed queries
2. **Rate Limiting**: Implement rate limiting on API endpoints
3. **Error Handling**: Add comprehensive error handling and logging
4. **Data Validation**: Validate all inputs using Zod schemas
5. **Performance**: Use MongoDB aggregation pipelines for complex queries
6. **Security**: Sanitize user inputs and use parameterized queries

---

**Integration Complete!** 🎉

Your EduLen application now has powerful faculty search and matching capabilities powered by the faculty scraper data.
