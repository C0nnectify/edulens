# Faculty Matching API - Quick Reference

## Base URL
```
http://localhost:8000/api/v1/faculty
```

## Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Match Faculty
**POST** `/match`

Match faculty based on student research interests.

**Request:**
```json
{
  "research_interests": "machine learning for healthcare and medical image analysis",
  "mode": "hybrid",
  "top_k": 10,
  "university": "Stanford University",
  "accepting_students_only": true,
  "min_score": 70.0,
  "semantic_weight": 0.7,
  "keyword_weight": 0.3,
  "include_publications": true
}
```

**Parameters:**
- `research_interests` (required): Student's research interests (text)
- `mode`: `"semantic"` | `"keyword"` | `"hybrid"` (default: `"hybrid"`)
- `top_k`: Number of results per university (default: 10, max: 50)
- `university`: Filter by single university
- `universities`: Filter by multiple universities (array)
- `department`: Filter by single department
- `departments`: Filter by multiple departments (array)
- `accepting_students_only`: Only show faculty accepting students (default: false)
- `min_score`: Minimum match score 0-100
- `semantic_weight`: Weight for semantic matching (default: 0.7)
- `keyword_weight`: Weight for keyword matching (default: 0.3)
- `include_publications`: Include recent publications (default: true)

**Response:**
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
        "research_areas": ["Machine Learning for Healthcare", "NLP"],
        "lab_name": "Clinical ML Group",
        "accepting_students": "accepting",
        "publications": ["Paper 1", "Paper 2"],
        "h_index": 85,
        "citations": 32000
      },
      "match_score": 89.5,
      "similarity_score": 0.895,
      "reasoning": "Excellent match based on research in...",
      "matched_keywords": ["machine", "learning", "healthcare"]
    }
  ],
  "matches_by_university": [
    {
      "university": "MIT",
      "total_matches": 3,
      "avg_match_score": 82.3,
      "departments": ["Computer Science"],
      "faculty_matches": [...]
    }
  ],
  "total_matches": 8,
  "query": "machine learning for healthcare...",
  "mode": "hybrid",
  "filters_applied": {...},
  "processing_time_ms": 245.67
}
```

---

### 2. Add Single Faculty
**POST** `/add`

Add a single faculty member to the database.

**Request:**
```json
{
  "faculty_id": "stanford_cs_003",
  "name": "Dr. Andrew Ng",
  "email": "ang@cs.stanford.edu",
  "university": "Stanford University",
  "department": "Computer Science",
  "title": "Associate Professor",
  "research_areas": ["Machine Learning", "Deep Learning"],
  "lab_name": "Stanford AI Lab",
  "lab_website": "http://ai.stanford.edu/",
  "accepting_students": "accepting",
  "publications": ["Paper 1", "Paper 2"],
  "h_index": 162,
  "citations": 250000,
  "funding": ["NSF", "DARPA"]
}
```

**Response:**
```json
{
  "success": true,
  "faculty_id": "stanford_cs_003",
  "name": "Dr. Andrew Ng",
  "university": "Stanford University"
}
```

---

### 3. Bulk Upload Faculty
**POST** `/bulk-upload`

Upload multiple faculty members at once.

**Request:**
```json
{
  "faculty_members": [
    {
      "faculty_id": "mit_cs_001",
      "name": "Dr. Regina Barzilay",
      "university": "MIT",
      ...
    },
    {
      "faculty_id": "mit_cs_002",
      "name": "Dr. Daniela Rus",
      "university": "MIT",
      ...
    }
  ],
  "university": "MIT",
  "overwrite_existing": false
}
```

**Response:**
```json
{
  "success": true,
  "university": "MIT",
  "uploaded_count": 2,
  "total_count": 2
}
```

---

### 4. List Universities
**GET** `/universities`

Get all universities with faculty counts.

**Response:**
```json
[
  {
    "university": "MIT",
    "faculty_count": 15,
    "department_count": 3,
    "departments": ["Computer Science", "Electrical Engineering", "Biology"]
  },
  {
    "university": "Stanford University",
    "faculty_count": 12,
    "department_count": 2,
    "departments": ["Computer Science", "Electrical Engineering"]
  }
]
```

---

### 5. List Departments
**GET** `/departments?university=MIT`

Get all departments with faculty counts, optionally filtered by university.

**Query Parameters:**
- `university`: Filter by university name (optional)

**Response:**
```json
[
  {
    "university": "MIT",
    "department": "Computer Science",
    "faculty_count": 8,
    "accepting_count": 5
  },
  {
    "university": "MIT",
    "department": "Electrical Engineering",
    "faculty_count": 7,
    "accepting_count": 4
  }
]
```

---

### 6. Get Faculty Details
**GET** `/faculty/{faculty_id}`

Get detailed information about a specific faculty member.

**Response:**
```json
{
  "faculty_id": "mit_cs_001",
  "name": "Dr. Regina Barzilay",
  "email": "regina@csail.mit.edu",
  "university": "MIT",
  "department": "Computer Science",
  "title": "Professor",
  "research_areas": ["Machine Learning for Healthcare"],
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

---

### 7. Get Statistics
**GET** `/stats`

Get database statistics.

**Response:**
```json
{
  "total_faculty": 50,
  "accepting_students": 35,
  "embeddings_generated": 50,
  "top_universities": [
    {"university": "MIT", "count": 15},
    {"university": "Stanford University", "count": 12},
    {"university": "Carnegie Mellon University", "count": 10}
  ]
}
```

---

### 8. Initialize Indexes
**POST** `/initialize-indexes`

Create database indexes (run once during setup).

**Response:**
```json
{
  "success": true,
  "message": "Faculty indexes created successfully"
}
```

---

## Usage Examples

### cURL Examples

#### 1. Match Faculty (Semantic)
```bash
curl -X POST http://localhost:8000/api/v1/faculty/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "research_interests": "machine learning healthcare",
    "mode": "semantic",
    "top_k": 5
  }'
```

#### 2. Match Faculty (With Filters)
```bash
curl -X POST http://localhost:8000/api/v1/faculty/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "research_interests": "robotics autonomous systems",
    "mode": "hybrid",
    "university": "MIT",
    "accepting_students_only": true,
    "min_score": 75.0
  }'
```

#### 3. Add Faculty
```bash
curl -X POST http://localhost:8000/api/v1/faculty/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "faculty_id": "stanford_cs_001",
    "name": "Dr. Fei-Fei Li",
    "email": "feifeili@cs.stanford.edu",
    "university": "Stanford University",
    "department": "Computer Science",
    "research_areas": ["Computer Vision", "Machine Learning"],
    "accepting_students": "accepting"
  }'
```

#### 4. List Universities
```bash
curl -X GET http://localhost:8000/api/v1/faculty/universities \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5. Get Statistics
```bash
curl -X GET http://localhost:8000/api/v1/faculty/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### JavaScript/TypeScript Examples

#### Match Faculty
```typescript
const matchFaculty = async (researchInterests: string) => {
  const response = await fetch('http://localhost:8000/api/v1/faculty/match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      research_interests: researchInterests,
      mode: 'hybrid',
      top_k: 10,
      accepting_students_only: true
    })
  });

  return await response.json();
};
```

#### Add Faculty
```typescript
const addFaculty = async (faculty: FacultyInfo) => {
  const response = await fetch('http://localhost:8000/api/v1/faculty/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(faculty)
  });

  return await response.json();
};
```

---

### Python Examples

#### Match Faculty
```python
import requests

def match_faculty(research_interests: str, token: str):
    url = "http://localhost:8000/api/v1/faculty/match"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    data = {
        "research_interests": research_interests,
        "mode": "hybrid",
        "top_k": 10,
        "accepting_students_only": True
    }

    response = requests.post(url, json=data, headers=headers)
    return response.json()

# Usage
results = match_faculty("machine learning for healthcare", "YOUR_TOKEN")
print(f"Found {results['total_matches']} matches")
```

#### Bulk Upload
```python
def bulk_upload_faculty(faculty_list: list, university: str, token: str):
    url = "http://localhost:8000/api/v1/faculty/bulk-upload"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    data = {
        "faculty_members": faculty_list,
        "university": university,
        "overwrite_existing": False
    }

    response = requests.post(url, json=data, headers=headers)
    return response.json()
```

---

## Matching Modes

### Semantic Mode
- Uses vector embeddings and cosine similarity
- Best for: Finding conceptually similar research areas
- Example: "medical imaging" matches "healthcare diagnostics"

### Keyword Mode
- Uses text-based keyword matching
- Best for: Exact keyword matches
- Example: "machine learning" requires those exact words

### Hybrid Mode (Recommended)
- Combines semantic and keyword matching
- Configurable weights (default: 70% semantic, 30% keyword)
- Best for: Most accurate results

---

## Filtering Options

### By University
```json
{
  "university": "Stanford University"
}
// OR multiple
{
  "universities": ["MIT", "Stanford University", "Carnegie Mellon"]
}
```

### By Department
```json
{
  "department": "Computer Science"
}
// OR multiple
{
  "departments": ["Computer Science", "Electrical Engineering"]
}
```

### By Accepting Status
```json
{
  "accepting_students_only": true
}
```

### By Match Score
```json
{
  "min_score": 75.0  // Only show matches above 75/100
}
```

---

## Response Fields

### Faculty Match Object
- `match_score`: 0-100 score indicating match quality
- `similarity_score`: 0-1 raw similarity score
- `reasoning`: Explanation of why this faculty matches
- `matched_keywords`: Keywords that appeared in both query and faculty profile

### Faculty Status Values
- `"accepting"`: Actively accepting new students
- `"not_accepting"`: Not accepting students currently
- `"unknown"`: Status not specified

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "detail": "Faculty not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error message"
}
```

---

## Best Practices

1. **Always use hybrid mode** for best results
2. **Set min_score** to filter low-quality matches (recommended: 60-70)
3. **Use accepting_students_only** when actively searching for advisors
4. **Adjust weights** based on your needs:
   - Higher semantic weight: More conceptual matching
   - Higher keyword weight: More exact matches
5. **Limit top_k** to reasonable values (10-20) for better performance
6. **Initialize indexes** once before first use

---

## Performance Tips

- Average response time: 100-300ms for semantic search
- Keyword search is faster (~50-100ms)
- Hybrid search takes slightly longer (~200-400ms)
- Results are returned sorted by match score
- Use `min_score` to reduce result set size

---

**API Documentation**: http://localhost:8000/docs
**Last Updated**: 2025-10-12
