# Faculty Scraping Service - Quick Start Guide

Get started with the Faculty Scraping Service in 5 minutes!

## Prerequisites

- Python 3.11+
- MongoDB running locally or remotely
- Firecrawl API key
- Google Gemini API key

## Step 1: Install Dependencies

```bash
cd ai_service
uv sync
```

## Step 2: Configure Environment

Create or edit `ai_service/.env`:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# Firecrawl (get from https://firecrawl.dev)
FIRECRAWL_API_KEY=fc-your-api-key-here

# Google Gemini (get from https://makersuite.google.com/app/apikey)
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_MODEL=gemini-1.5-flash
```

## Step 3: Start the AI Service

```bash
cd ai_service
./start.sh
```

The service will start at `http://localhost:8000`

## Step 4: Test the Service

### Option A: Using the FastAPI Docs UI

1. Open browser to `http://localhost:8000/docs`
2. Navigate to "Faculty Matching & Scraping" section
3. Try the `POST /api/v1/faculty/scrape` endpoint

**Example Request:**
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

### Option B: Using curl

```bash
curl -X POST "http://localhost:8000/api/v1/faculty/scrape" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "url": "https://cs.stanford.edu/people/faculty",
    "universityId": "stanford",
    "universityName": "Stanford University",
    "department": "Computer Science",
    "useCrawl": false,
    "maxPages": 20,
    "saveToDatabase": true
  }'
```

### Option C: Using Python Script

```bash
cd ai_service
python example_faculty_scraping.py
```

## Step 5: Verify Data

Check MongoDB to verify data was saved:

```bash
# Connect to MongoDB
mongosh

# Switch to database
use edulens

# Check faculty database collection
db.faculty_database.find().pretty()

# Count documents
db.faculty_database.countDocuments()
```

## Common First Tasks

### 1. Scrape Your First University

```python
import asyncio
from app.services.faculty_scraping_service import faculty_scraping_service

async def scrape():
    await faculty_scraping_service.initialize()

    result = await faculty_scraping_service.scrape_and_extract_faculty(
        url="https://cs.stanford.edu/people/faculty",
        university_id="stanford",
        university_name="Stanford University",
        department="Computer Science",
        use_crawl=False
    )

    doc_id = await faculty_scraping_service.save_faculty_data(result)
    print(f"Scraped {result['totalFaculty']} faculty, saved as {doc_id}")

asyncio.run(scrape())
```

### 2. Search Faculty by Research Area

```bash
curl -X POST "http://localhost:8000/api/v1/faculty/search/research-area" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "researchArea": "Machine Learning",
    "limit": 50
  }'
```

### 3. Get Database Statistics

```bash
curl -X GET "http://localhost:8000/api/v1/faculty/scraping/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Issue: "Firecrawl API key not configured"

**Solution:** Add `FIRECRAWL_API_KEY` to your `.env` file:
```bash
FIRECRAWL_API_KEY=fc-your-key-here
```

### Issue: "Google API key not configured"

**Solution:** Add `GOOGLE_API_KEY` to your `.env` file:
```bash
GOOGLE_API_KEY=your-google-key-here
```

### Issue: "MongoDB connection failed"

**Solution:** Ensure MongoDB is running:
```bash
# Start MongoDB
mongod --dbpath /path/to/data/db

# Or using Docker
docker run -d -p 27017:27017 mongo:latest
```

### Issue: Rate limit errors

**Solution:**
- Free tier Firecrawl: 500 credits/month
- Free tier Gemini: 60 requests/minute
- Add delays between requests or upgrade API plans

## Next Steps

1. **Read the full documentation**: [FACULTY_SCRAPING_SERVICE.md](./FACULTY_SCRAPING_SERVICE.md)
2. **Explore example scripts**: [example_faculty_scraping.py](./example_faculty_scraping.py)
3. **Try batch scraping**: Use the `/api/v1/faculty/scrape/batch` endpoint
4. **Build integrations**: Connect with the faculty matching service

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/faculty/scrape` | POST | Scrape single university |
| `/api/v1/faculty/scrape/batch` | POST | Scrape multiple universities |
| `/api/v1/faculty/search/research-area` | POST | Search by research area |
| `/api/v1/faculty/query` | POST | Query university/department |
| `/api/v1/faculty/scraping/statistics` | GET | Get database stats |

## Support

- Documentation: [FACULTY_SCRAPING_SERVICE.md](./FACULTY_SCRAPING_SERVICE.md)
- API Reference: `http://localhost:8000/docs`
- Issues: GitHub Issues
- Email: team@edulen.com
