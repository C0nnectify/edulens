# Faculty Research Scraping Service

A comprehensive service for scraping university faculty information from department websites using Firecrawl and Google Gemini AI.

## Overview

The Faculty Scraping Service automatically extracts structured faculty data from university department websites, including:

- Faculty names, titles, and contact information
- Research areas and interests
- Lab names and websites
- Publications
- Educational background
- Biography information

## Features

### 1. Web Scraping with Firecrawl
- Single page scraping for faculty/people pages
- Multi-page crawling for entire department websites
- Intelligent content extraction (focuses on main content)
- Link extraction for discovering faculty profiles
- Rate limiting and retry logic

### 2. AI-Powered Data Extraction
- Uses Google Gemini 1.5 Flash for structured data extraction
- Handles diverse page layouts (grid, list, table formats)
- Validates and cleans extracted data
- Categorizes research areas using NLP
- Standardizes research terminology

### 3. MongoDB Storage
- Stores faculty data in `faculty_database` collection
- Per-university/department organization
- Comprehensive indexing for fast queries
- Deduplication based on university + department
- Timestamp tracking for updates

### 4. Search & Query Capabilities
- Search faculty by research area across all universities
- Filter by university and department
- Get statistics about faculty database
- Support for bulk operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Faculty Scraping Service                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Firecrawl   │  │    Gemini    │  │   MongoDB    │      │
│  │   Scraper    │→ │  AI Extractor│→ │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                 ↓                  ↓               │
│  • Web scraping    • Data parsing    • Persistent storage   │
│  • Content extract • JSON extraction • Indexing             │
│  • Rate limiting   • Validation      • Querying             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### 1. Install Dependencies

The service requires the following packages (already in `pyproject.toml`):

```toml
firecrawl
google-generativeai>=0.8.0
motor==3.7.0
pymongo==4.10.1
```

Install with uv:
```bash
cd ai_service
uv sync
```

### 2. Configure Environment Variables

Add to `ai_service/.env`:

```bash
# Firecrawl API Configuration
FIRECRAWL_API_KEY=fc-your-api-key-here

# Google Gemini API Configuration
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_MODEL=gemini-1.5-flash

# MongoDB (already configured)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens
```

### 3. Get API Keys

**Firecrawl API Key:**
- Visit [firecrawl.dev](https://firecrawl.dev)
- Sign up for an account
- Get your API key from dashboard
- Free tier: 500 credits/month

**Google Gemini API Key:**
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Free tier: 60 requests/minute, 1500 requests/day

## Usage

### Initialize the Service

```python
from app.services.faculty_scraping_service import faculty_scraping_service

# Initialize database connection
await faculty_scraping_service.initialize()
```

### Scrape a Single Faculty Page

```python
# Scrape and extract faculty data
result = await faculty_scraping_service.scrape_and_extract_faculty(
    url="https://cs.stanford.edu/people/faculty",
    university_id="stanford",
    university_name="Stanford University",
    department="Computer Science",
    use_crawl=False,
    max_pages=20
)

# Save to database
document_id = await faculty_scraping_service.save_faculty_data(result)

print(f"Extracted {result['totalFaculty']} faculty members")
print(f"Saved as document: {document_id}")
```

### Crawl Multiple Pages

```python
# Crawl entire department website
result = await faculty_scraping_service.scrape_and_extract_faculty(
    url="https://engineering.university.edu",
    university_id="university",
    university_name="University Name",
    department="Engineering",
    use_crawl=True,  # Enable multi-page crawling
    max_pages=30
)
```

### Search Faculty by Research Area

```python
# Find faculty working in machine learning
results = await faculty_scraping_service.search_faculty_by_research_area(
    research_area="Machine Learning",
    limit=50
)

for result in results:
    print(f"{result['faculty']['name']} - {result['university']}")
    print(f"Research: {', '.join(result['faculty']['researchAreas'])}")
```

### Get Faculty Data for a University

```python
# Get all faculty for a university
faculty_data = await faculty_scraping_service.get_faculty_data(
    university_id="stanford",
    department="Computer Science"  # Optional filter
)
```

### Get Database Statistics

```python
stats = await faculty_scraping_service.get_statistics()

print(f"Total Universities: {stats['totalUniversities']}")
print(f"Total Faculty: {stats['totalFaculty']}")
print(f"Top Research Areas: {stats['topResearchAreas']}")
```

## API Endpoints

All endpoints are available at `/api/v1/faculty/`:

### 1. Scrape Faculty Page

**POST** `/api/v1/faculty/scrape`

Scrape and extract faculty from a single page or multiple pages.

**Request Body:**
```json
{
  "url": "https://cs.stanford.edu/people/faculty",
  "universityId": "stanford",
  "universityName": "Stanford University",
  "department": "Computer Science",
  "useCrawl": false,
  "maxPages": 20,
  "saveToDatabase": true
}
```

**Response:**
```json
{
  "success": true,
  "universityId": "stanford",
  "department": "Computer Science",
  "totalFaculty": 45,
  "faculty": [...],
  "documentId": "507f1f77bcf86cd799439011",
  "scrapedAt": "2024-01-15T10:30:00Z",
  "message": "Successfully scraped 45 faculty members",
  "metadata": {
    "usedCrawl": false,
    "pagesScraped": 1,
    "extractionMethod": "gemini-1.5-flash"
  }
}
```

### 2. Batch Scrape Multiple Universities

**POST** `/api/v1/faculty/scrape/batch`

Scrape faculty from multiple universities in one request.

**Request Body:**
```json
{
  "universities": [
    {
      "url": "https://cs.stanford.edu/people",
      "universityId": "stanford",
      "universityName": "Stanford University",
      "department": "Computer Science"
    },
    {
      "url": "https://www.csail.mit.edu/people",
      "universityId": "mit",
      "universityName": "MIT",
      "department": "Computer Science"
    }
  ],
  "useCrawl": false,
  "maxPages": 20,
  "saveToDatabase": true
}
```

**Response:**
```json
{
  "totalRequested": 2,
  "successful": 2,
  "failed": 0,
  "results": [...],
  "errors": [],
  "completedAt": "2024-01-15T10:35:00Z"
}
```

### 3. Search Faculty by Research Area

**POST** `/api/v1/faculty/search/research-area`

Search for faculty across all universities by research area.

**Request Body:**
```json
{
  "researchArea": "Machine Learning",
  "limit": 50
}
```

**Response:**
```json
{
  "researchArea": "Machine Learning",
  "totalResults": 127,
  "results": [
    {
      "university": "Stanford University",
      "department": "Computer Science",
      "faculty": {
        "name": "Dr. Jane Smith",
        "email": "jsmith@stanford.edu",
        "researchAreas": ["Machine Learning", "Computer Vision"],
        ...
      }
    }
  ]
}
```

### 4. Query Faculty Data

**POST** `/api/v1/faculty/query`

Retrieve all faculty data for a specific university/department.

**Request Body:**
```json
{
  "universityId": "stanford",
  "department": "Computer Science"  // Optional
}
```

### 5. Get Database Statistics

**GET** `/api/v1/faculty/scraping/statistics`

Get comprehensive statistics about the faculty database.

**Response:**
```json
{
  "totalUniversities": 25,
  "totalFaculty": 1250,
  "topResearchAreas": [
    {"area": "Machine Learning", "count": 245},
    {"area": "Artificial Intelligence", "count": 198},
    {"area": "Data Science", "count": 156}
  ],
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

## MongoDB Schema

### Faculty Database Collection

Collection name: `faculty_database`

```javascript
{
  "_id": ObjectId("..."),
  "universityId": "stanford",
  "universityName": "Stanford University",
  "department": "Computer Science",
  "sourceUrl": "https://cs.stanford.edu/people/faculty",
  "urlsScraped": [
    "https://cs.stanford.edu/people/faculty"
  ],
  "faculty": [
    {
      "name": "Dr. Jane Smith",
      "title": "Associate Professor",
      "email": "jsmith@stanford.edu",
      "phone": "+1-650-555-0123",
      "office": "Room 305, Gates Building",
      "website": "https://jsmith.stanford.edu",
      "researchAreas": [
        "Machine Learning",
        "Natural Language Processing",
        "Deep Learning"
      ],
      "labName": "AI Research Lab",
      "education": "Ph.D. in Computer Science, MIT",
      "bio": "Dr. Smith's research focuses on...",
      "publications": [
        "Advanced NLP Techniques (ACL 2023)",
        "Deep Learning for Text (NeurIPS 2022)"
      ]
    }
  ],
  "totalFaculty": 45,
  "scrapedAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z"),
  "metadata": {
    "usedCrawl": false,
    "pagesScraped": 1,
    "extractionMethod": "gemini-1.5-flash"
  }
}
```

### Indexes

The service automatically creates these indexes:

- `universityId` - For university-level queries
- `department` - For department filtering
- `(universityId, department)` - Unique constraint, compound index
- `scrapedAt` - For temporal queries
- `faculty.email` - For email lookups
- `faculty.researchAreas` - For research area searches

## Research Area Categorization

The service automatically standardizes research area terminology:

### Computer Science
- AI, Artificial Intelligence → "Artificial Intelligence"
- ML, Machine Learning → "Machine Learning"
- NLP, Natural Language Processing → "Natural Language Processing"
- CV, Computer Vision → "Computer Vision"
- DL, Deep Learning → "Deep Learning"

### Engineering
- Electrical Engineering, EE → "Electrical Engineering"
- Mechanical Engineering, ME → "Mechanical Engineering"
- Civil Engineering, CE → "Civil Engineering"

### Other Fields
- Bioinformatics, Computational Biology
- Quantum Computing
- Robotics
- Cybersecurity
- Data Science

## Error Handling

The service implements comprehensive error handling:

### 1. Retry Logic
- Automatic retry on transient failures
- Configurable retry count (default: 3)
- Exponential backoff between retries

### 2. Validation
- URL validation
- Email format validation
- Data completeness checks
- JSON parsing with fallbacks

### 3. Logging
- Structured logging with loguru
- Request/response tracking
- Error context preservation
- Performance metrics

### 4. Rate Limiting
- Respects Firecrawl rate limits
- Configurable request delays
- Batch processing support

## Performance Considerations

### Scraping Speed
- Single page: ~5-10 seconds
- Multi-page crawl: ~1-2 minutes (20 pages)
- Batch processing: Parallel execution

### API Limits
- **Firecrawl**: 500 credits/month (free tier)
- **Google Gemini**: 60 requests/minute, 1500/day (free tier)

### Optimization Tips
1. Use single page scraping when possible
2. Batch multiple universities together
3. Implement caching for repeated requests
4. Schedule scraping during off-peak hours

## Example Use Cases

### 1. Build Faculty Directory
```python
# Scrape top CS departments
universities = [
    {"url": "https://cs.stanford.edu/people", "id": "stanford", "name": "Stanford"},
    {"url": "https://www.csail.mit.edu/people", "id": "mit", "name": "MIT"},
    {"url": "https://cs.berkeley.edu/people", "id": "berkeley", "name": "UC Berkeley"},
]

for uni in universities:
    result = await faculty_scraping_service.scrape_and_extract_faculty(
        url=uni["url"],
        university_id=uni["id"],
        university_name=uni["name"],
        department="Computer Science"
    )
    await faculty_scraping_service.save_faculty_data(result)
```

### 2. Research Area Analysis
```python
# Find faculty in specific research area
ml_faculty = await faculty_scraping_service.search_faculty_by_research_area(
    research_area="Machine Learning",
    limit=100
)

# Analyze distribution
universities = {}
for result in ml_faculty:
    uni = result["university"]
    universities[uni] = universities.get(uni, 0) + 1

print("ML Faculty by University:")
for uni, count in sorted(universities.items(), key=lambda x: x[1], reverse=True):
    print(f"{uni}: {count} faculty")
```

### 3. Faculty Recommendation System
```python
# Student's research interests
student_interests = "Natural Language Processing and Machine Learning"

# Find matching faculty
faculty = await faculty_scraping_service.search_faculty_by_research_area(
    research_area="Natural Language Processing",
    limit=50
)

# Filter and rank
matches = []
for result in faculty:
    overlap = set(result["faculty"]["researchAreas"]) & {"NLP", "Machine Learning", "Deep Learning"}
    if len(overlap) >= 2:
        matches.append(result)

print(f"Found {len(matches)} highly relevant faculty")
```

## Testing

Run tests with pytest:

```bash
cd ai_service
pytest tests/test_faculty_scraping_service.py -v
```

## Troubleshooting

### Common Issues

1. **"Firecrawl API key not configured"**
   - Ensure `FIRECRAWL_API_KEY` is set in `.env`
   - Verify key is valid at firecrawl.dev

2. **"Google API key not configured"**
   - Set `GOOGLE_API_KEY` in `.env`
   - Check quota at Google AI Studio

3. **Empty faculty list returned**
   - Verify URL is accessible
   - Check page structure (may need custom parsing)
   - Review Gemini extraction prompt

4. **Rate limit errors**
   - Reduce request frequency
   - Implement request delays
   - Upgrade API plan if needed

## Future Enhancements

- [ ] Support for more LLM providers (OpenAI, Anthropic)
- [ ] Custom extraction schemas per university
- [ ] Automated periodic updates
- [ ] Faculty profile enrichment from Google Scholar
- [ ] Publication tracking and citation analysis
- [ ] Research collaboration network analysis
- [ ] Email verification and validation
- [ ] Integration with faculty matching service

## License

Part of the EduLen AI Service platform.

## Support

For issues and questions:
- GitHub Issues: [edulen/ai-service/issues](https://github.com/edulen/ai-service/issues)
- Email: team@edulen.com
- Documentation: [docs.edulen.com](https://docs.edulen.com)
