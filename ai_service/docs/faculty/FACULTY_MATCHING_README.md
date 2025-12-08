# Faculty Matching Service

A comprehensive program-faculty matching service for EduLen AI Service that uses embedding-based semantic search and keyword matching to connect students with faculty members whose research aligns with their interests.

## Features

### Core Functionality

1. **Embedding-Based Matching**
   - Generates vector embeddings for student research interests
   - Generates embeddings for faculty research areas and publications
   - Uses cosine similarity for accurate matching
   - Powered by OpenAI embeddings (configurable provider)

2. **Multiple Matching Modes**
   - **Semantic**: Pure vector similarity matching
   - **Keyword**: Traditional keyword-based matching with TF-IDF scoring
   - **Hybrid**: Combines semantic and keyword matching with configurable weights

3. **Advanced Filtering**
   - Filter by university (single or multiple)
   - Filter by department (single or multiple)
   - Filter by faculty accepting students status
   - Minimum match score threshold

4. **Results Enrichment**
   - Match scores (0-100) with explanations
   - Matched keywords highlighting
   - Faculty research areas and publications
   - Lab/group information
   - Contact details and websites
   - H-index and citation metrics

5. **University Grouping**
   - Automatically groups results by university
   - Provides university-level statistics
   - Shows department coverage per university

## Architecture

### Service Layer

**File**: `/home/ismail/edulen/ai_service/app/services/faculty_matching_service.py`

The `FacultyMatchingService` class provides:

- `match_faculty()`: Main matching endpoint
- `add_faculty()`: Add single faculty member
- `bulk_add_faculty()`: Bulk upload faculty data
- `create_indexes()`: Initialize MongoDB indexes

### Data Models

**File**: `/home/ismail/edulen/ai_service/app/models/faculty.py`

Key models:
- `FacultyInfo`: Faculty member profile
- `FacultyMatchRequest`: Matching query parameters
- `FacultyMatchResponse`: Matching results
- `FacultyMatch`: Individual match result
- `UniversityMatches`: University-grouped results

### API Endpoints

**File**: `/home/ismail/edulen/ai_service/app/api/v1/faculty.py`

Available endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/faculty/match` | POST | Match faculty based on research interests |
| `/api/v1/faculty/add` | POST | Add single faculty member |
| `/api/v1/faculty/bulk-upload` | POST | Bulk upload faculty members |
| `/api/v1/faculty/universities` | GET | List universities with counts |
| `/api/v1/faculty/departments` | GET | List departments with counts |
| `/api/v1/faculty/faculty/{id}` | GET | Get faculty details |
| `/api/v1/faculty/stats` | GET | Database statistics |
| `/api/v1/faculty/initialize-indexes` | POST | Create database indexes |

## Database Schema

### Collections

#### `faculty_profiles`
Stores complete faculty information:

```json
{
  "faculty_id": "mit_cs_001",
  "name": "Dr. Regina Barzilay",
  "email": "regina@csail.mit.edu",
  "university": "MIT",
  "department": "Computer Science",
  "title": "Professor",
  "research_areas": ["Machine Learning", "Healthcare AI"],
  "lab_name": "Clinical ML Group",
  "lab_website": "http://clinicalml.org/",
  "personal_website": "http://people.csail.mit.edu/regina/",
  "accepting_students": "accepting",
  "publications": ["Paper 1", "Paper 2"],
  "h_index": 85,
  "citations": 32000,
  "funding": ["NSF", "NIH"],
  "metadata": {}
}
```

#### `faculty_embeddings`
Stores vector embeddings for semantic search:

```json
{
  "faculty_id": "mit_cs_001",
  "university": "MIT",
  "department": "Computer Science",
  "accepting_students": "accepting",
  "embedding": [0.123, -0.456, ...],  // 1536-dimensional vector
  "embedding_text": "Research areas: Machine Learning..."
}
```

### Indexes

The service creates the following indexes for optimal performance:

**faculty_profiles**:
- `faculty_id` (unique)
- `university`
- `department`
- `accepting_students`
- `(university, department)` compound
- Text search on `name`, `research_areas`, `lab_name`, `publications`

**faculty_embeddings**:
- `faculty_id` (unique)
- `university`
- `department`
- `accepting_students`

## Usage Examples

### 1. Match Faculty (Semantic Search)

```python
from app.services.faculty_matching_service import FacultyMatchingService
from app.models.faculty import FacultyMatchRequest, MatchingMode

service = FacultyMatchingService()

request = FacultyMatchRequest(
    research_interests="machine learning for healthcare, medical image analysis",
    mode=MatchingMode.SEMANTIC,
    top_k=10,
    min_score=70.0,
    include_publications=True
)

response = await service.match_faculty(request)

print(f"Found {response.total_matches} matches")
for match in response.matches[:5]:
    print(f"{match.faculty.name} ({match.faculty.university})")
    print(f"  Match Score: {match.match_score:.2f}/100")
    print(f"  Reasoning: {match.reasoning}")
```

### 2. Filter by University

```python
request = FacultyMatchRequest(
    research_interests="robotics and autonomous systems",
    university="Stanford University",
    mode=MatchingMode.HYBRID,
    top_k=10
)

response = await service.match_faculty(request)
```

### 3. Filter by Accepting Students

```python
request = FacultyMatchRequest(
    research_interests="deep learning computer vision",
    accepting_students_only=True,
    mode=MatchingMode.HYBRID,
    top_k=20
)

response = await service.match_faculty(request)
```

### 4. Hybrid Matching with Custom Weights

```python
request = FacultyMatchRequest(
    research_interests="natural language processing",
    mode=MatchingMode.HYBRID,
    semantic_weight=0.8,  # 80% semantic
    keyword_weight=0.2,   # 20% keyword
    top_k=10
)

response = await service.match_faculty(request)
```

### 5. Add Faculty Data

```python
from app.models.faculty import FacultyInfo, FacultyStatus

faculty = FacultyInfo(
    faculty_id="stanford_cs_003",
    name="Dr. Andrew Ng",
    email="ang@cs.stanford.edu",
    university="Stanford University",
    department="Computer Science",
    title="Associate Professor",
    research_areas=["Machine Learning", "Deep Learning", "AI Education"],
    accepting_students=FacultyStatus.ACCEPTING,
    publications=["Deep Learning Specialization", "ML Yearning"]
)

faculty_id = await service.add_faculty(faculty, generate_embedding=True)
```

### 6. Bulk Upload

```python
from app.models.faculty import BulkFacultyUpload

upload = BulkFacultyUpload(
    faculty_members=[faculty1, faculty2, faculty3],
    university="MIT",
    overwrite_existing=False
)

count = await service.bulk_add_faculty(
    upload.faculty_members,
    generate_embeddings=True
)
```

## API Usage Examples

### Match Faculty via REST API

```bash
curl -X POST http://localhost:8000/api/v1/faculty/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "research_interests": "machine learning healthcare medical imaging",
    "mode": "hybrid",
    "top_k": 10,
    "university": "MIT",
    "accepting_students_only": true,
    "semantic_weight": 0.7,
    "keyword_weight": 0.3
  }'
```

### Response Format

```json
{
  "matches": [
    {
      "faculty": {
        "faculty_id": "mit_cs_001",
        "name": "Dr. Regina Barzilay",
        "email": "regina@csail.mit.edu",
        "university": "MIT",
        "department": "Computer Science",
        "title": "Professor",
        "research_areas": ["Machine Learning for Healthcare", "Medical AI"],
        "lab_name": "Clinical Machine Learning Group",
        "accepting_students": "accepting",
        "publications": ["Learning to predict cancer treatment outcomes"]
      },
      "match_score": 89.5,
      "reasoning": "Excellent match based on research in Machine Learning for Healthcare through hybrid analysis at Clinical Machine Learning Group (actively accepting students).",
      "matched_keywords": ["machine", "learning", "healthcare", "medical"],
      "similarity_score": 0.895
    }
  ],
  "matches_by_university": [
    {
      "university": "MIT",
      "total_matches": 3,
      "faculty_matches": [...],
      "avg_match_score": 82.3,
      "departments": ["Computer Science", "Electrical Engineering"]
    }
  ],
  "total_matches": 8,
  "query": "machine learning healthcare medical imaging",
  "mode": "hybrid",
  "filters_applied": {
    "university": "MIT",
    "accepting_students": "accepting"
  },
  "processing_time_ms": 245.67
}
```

## Testing

### Run Comprehensive Tests

```bash
cd /home/ismail/edulen/ai_service
python test_faculty_matching.py
```

The test script includes:
1. Sample data setup (6 faculty from MIT, Stanford, CMU, Berkeley)
2. Semantic matching test
3. Keyword matching test
4. Hybrid matching test
5. University filtering test
6. Accepting students filter test
7. University grouping test
8. Statistics test

### Manual Testing via API

1. Start the AI service:
```bash
cd /home/ismail/edulen/ai_service
uvicorn app.main:app --reload --port 8000
```

2. Access API documentation:
```
http://localhost:8000/docs
```

3. Initialize indexes:
```bash
curl -X POST http://localhost:8000/api/v1/faculty/initialize-indexes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

4. Add sample faculty and test matching

## Configuration

### Environment Variables

Set these in `/home/ismail/edulen/ai_service/.env`:

```bash
# Required for embeddings
OPENAI_API_KEY=sk-...
OPENAI_MODEL=text-embedding-3-small

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# Optional
HUGGINGFACE_MODEL=sentence-transformers/all-MiniLM-L6-v2
COHERE_API_KEY=your_cohere_key
```

### Embedding Provider

The service uses OpenAI embeddings by default, but supports:
- **OpenAI**: `text-embedding-3-small` (1536 dimensions)
- **HuggingFace**: Local sentence transformers
- **Cohere**: `embed-english-v3.0`

Change provider in `faculty_matching_service.py`:

```python
query_embedding = await self.embedding_service.generate_query_embedding(
    request.research_interests,
    provider="huggingface"  # or "cohere"
)
```

## Performance Considerations

### Optimization Tips

1. **Embeddings Pre-generation**: Generate embeddings for all faculty during bulk upload
2. **MongoDB Indexes**: Always run `create_indexes()` after adding data
3. **Text Search**: Use MongoDB text indexes for keyword matching
4. **Batch Size**: Process embeddings in batches (default: 100)
5. **Caching**: Consider caching frequently searched queries

### Scaling

For large datasets (10K+ faculty):

1. Use compound indexes on frequently filtered fields
2. Implement pagination in API responses
3. Consider vector database (Pinecone, Weaviate) for embeddings
4. Cache university/department lists
5. Pre-compute match scores for popular queries

## Integration with Next.js Frontend

### API Client Example

```typescript
// src/lib/faculty-matching.ts

export interface FacultyMatchRequest {
  research_interests: string;
  mode?: 'semantic' | 'keyword' | 'hybrid';
  top_k?: number;
  university?: string;
  universities?: string[];
  department?: string;
  accepting_students_only?: boolean;
  min_score?: number;
}

export async function matchFaculty(
  request: FacultyMatchRequest,
  token: string
): Promise<FacultyMatchResponse> {
  const response = await fetch(
    `${process.env.AI_SERVICE_URL}/api/v1/faculty/match`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    }
  );

  if (!response.ok) {
    throw new Error('Faculty matching failed');
  }

  return response.json();
}
```

### Next.js API Route Proxy

```typescript
// src/app/api/faculty/match/route.ts

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const response = await fetch(
    `${process.env.AI_SERVICE_URL}/api/v1/faculty/match`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${generateJWT(session.user.id)}`
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();
  return Response.json(data);
}
```

## Troubleshooting

### Common Issues

1. **No matches found**
   - Check if faculty data exists: `GET /api/v1/faculty/stats`
   - Verify embeddings are generated
   - Lower `min_score` threshold
   - Try different matching modes

2. **Slow query performance**
   - Run `POST /api/v1/faculty/initialize-indexes`
   - Check MongoDB connection
   - Reduce `top_k` value
   - Use keyword mode instead of semantic

3. **Embedding generation fails**
   - Verify `OPENAI_API_KEY` is set
   - Check API rate limits
   - Try alternative provider (HuggingFace)

4. **Import errors**
   - Install dependencies: `pip install numpy sentence-transformers`
   - Verify Python version >= 3.9

## Future Enhancements

### Planned Features

1. **Publication Analysis**
   - Scrape faculty publications from Google Scholar
   - Extract research trends over time
   - Co-authorship network analysis

2. **Collaboration Recommendations**
   - Suggest faculty who frequently collaborate
   - Identify research group dynamics

3. **Acceptance Prediction**
   - ML model to predict student acceptance likelihood
   - Historical data analysis

4. **Multi-modal Matching**
   - Include student CV/resume in matching
   - Compare student publications with faculty

5. **Real-time Updates**
   - Web scraping for latest faculty information
   - Automated acceptance status updates

## Contributing

When extending the faculty matching service:

1. Follow existing code patterns
2. Add tests for new features
3. Update this README
4. Maintain backward compatibility
5. Document API changes

## License

Part of EduLen AI Service - Educational Technology Platform

---

**Last Updated**: 2025-10-12
**Version**: 1.0.0
**Maintainer**: EduLen Development Team
