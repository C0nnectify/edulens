# Faculty Data Scraper

A robust, AI-powered web scraper for extracting faculty information from top 20 CS/Engineering departments worldwide. Built with Firecrawl, BeautifulSoup, and Google Gemini AI for intelligent data extraction.

## Features

- **Multi-Strategy Scraping**: Primary scraping with Firecrawl, BeautifulSoup fallback
- **AI-Powered Extraction**: Google Gemini for intelligent faculty data extraction
- **Robust Error Handling**: Automatic retries, rate limiting, progress tracking
- **Resume Capability**: Continue from where you left off
- **MongoDB Storage**: Persistent storage with deduplication
- **Rich CLI**: Beautiful progress bars and logging with Rich library
- **Concurrent Processing**: Async scraping for better performance
- **Configurable**: JSON-based configuration for easy customization

## Universities Covered

Top 20 CS/Engineering departments:
- MIT, Stanford, CMU, UC Berkeley, Caltech
- Harvard, Princeton, Cornell, UIUC, Georgia Tech
- UW Seattle, UT Austin, UCLA, UCSD, USC
- Columbia, UPenn, Yale, Michigan, Wisconsin

## Architecture

```
┌─────────────────┐
│   CLI Entry     │
│   (argparse)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│    FacultyScraper Class         │
│  - Load config & progress       │
│  - Rate limiting & retries      │
│  - Orchestrate scraping         │
└────────┬────────────────────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
  ┌──────────┐   ┌──────────┐  ┌──────────────┐
  │Firecrawl │   │BeautifulS│  │FacultyExtract│
  │  Scraper │   │oup Parser│  │(Gemini AI)   │
  └──────────┘   └──────────┘  └──────────────┘
         │              │              │
         └──────────────┴──────────────┘
                        ▼
              ┌──────────────────┐
              │   MongoDB Store   │
              │  - faculty_data   │
              │  - universities   │
              └──────────────────┘
```

## Installation

### Prerequisites

- Python 3.9+
- MongoDB (local or cloud)
- Google API Key (for Gemini)
- Firecrawl API Key (optional, enhances scraping)

### Setup

1. **Clone and navigate to directory**:
```bash
cd /home/ismail/edulen/train_ml
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Set environment variables**:
```bash
export GOOGLE_API_KEY="your-google-api-key"
export FIRECRAWL_API_KEY="your-firecrawl-api-key"  # Optional
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DB_NAME="edulens"
```

Or create a `.env` file:
```env
GOOGLE_API_KEY=your-google-api-key
FIRECRAWL_API_KEY=your-firecrawl-api-key
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens
```

4. **Make script executable**:
```bash
chmod +x faculty_scraper.py
```

## Usage

### Basic Commands

**Scrape a single university**:
```bash
python faculty_scraper.py --university mit
```

**Scrape specific department**:
```bash
python faculty_scraper.py --university stanford --department cs
```

**Scrape all universities**:
```bash
python faculty_scraper.py --all
```

**Resume from last position**:
```bash
python faculty_scraper.py --all --resume
```

**Export to JSON**:
```bash
python faculty_scraper.py --all --export faculty_data.json
```

### Advanced Usage

**Custom config and progress files**:
```bash
python faculty_scraper.py \
  --all \
  --config custom_config.json \
  --progress custom_progress.json
```

**Scrape multiple universities sequentially**:
```bash
python faculty_scraper.py --university mit
python faculty_scraper.py --university stanford
python faculty_scraper.py --university cmu
```

## Configuration

### University Config (`university_config.json`)

```json
{
  "universities": [
    {
      "id": "mit",
      "name": "Massachusetts Institute of Technology",
      "departments": [
        {
          "name": "Computer Science",
          "code": "cs",
          "faculty_url": "https://www.csail.mit.edu/people",
          "selectors": {
            "faculty_list": ".view-people .views-row",
            "name": ".views-field-title a",
            "email": ".views-field-field-email a"
          }
        }
      ]
    }
  ],
  "scraping_config": {
    "rate_limit_delay": 2,
    "max_retries": 3,
    "timeout": 30,
    "concurrent_requests": 3
  }
}
```

### Adding New Universities

1. Open `university_config.json`
2. Add new university object:
```json
{
  "id": "newu",
  "name": "New University",
  "short_name": "NewU",
  "departments": [
    {
      "name": "Computer Science",
      "code": "cs",
      "faculty_url": "https://cs.newu.edu/faculty",
      "selectors": {}
    }
  ]
}
```
3. Run scraper: `python faculty_scraper.py --university newu`

## Data Schema

### Faculty Document

```json
{
  "name": "Dr. John Doe",
  "title": "Professor",
  "email": "jdoe@mit.edu",
  "research_areas": ["Machine Learning", "Computer Vision", "AI"],
  "publications": [],
  "lab": "MIT AI Lab",
  "website": "https://jdoe.mit.edu",
  "photo": "https://mit.edu/photos/jdoe.jpg",
  "accepting_students": true,
  "university_id": "mit",
  "university_name": "MIT",
  "department": "Computer Science",
  "source_url": "https://csail.mit.edu/people",
  "faculty_hash": "a1b2c3d4e5f6g7h8",
  "scraped_at": "2025-01-12T10:00:00"
}
```

### MongoDB Collections

**`faculty_data`**: Individual faculty records with indexes on:
- `(university_id, department, email)` - unique index
- `research_areas` - for filtering

**`universities_scraped`**: University metadata:
```json
{
  "university_id": "mit",
  "university_name": "MIT",
  "departments": [
    {
      "name": "Computer Science",
      "url": "...",
      "faculty_count": 45
    }
  ],
  "last_scraped": "2025-01-12T10:00:00"
}
```

## Progress Tracking

The scraper maintains progress in `scraping_progress.json`:

```json
{
  "last_university": "mit",
  "last_department": "cs",
  "completed": ["mit:cs", "stanford:cs"],
  "failed": ["berkeley:eecs"],
  "total_faculty_scraped": 120,
  "last_updated": "2025-01-12T10:00:00"
}
```

Use `--resume` flag to skip completed universities.

## AI Extraction

The scraper uses Google Gemini 2.0 Flash for intelligent extraction when:
- CSS selectors are not provided
- Selector-based parsing fails
- Complex page structures

**Prompt Strategy**:
1. Provides HTML content and university context
2. Requests structured JSON output
3. Validates and cleans AI response
4. Falls back to empty list on failure

**Configuration** (`university_config.json`):
```json
{
  "ai_extraction_config": {
    "model": "gemini-2.0-flash-exp",
    "temperature": 0.1,
    "max_tokens": 2000
  }
}
```

## Rate Limiting

The scraper implements respectful crawling:
- Default: 2 seconds between requests
- Configurable via `scraping_config.rate_limit_delay`
- Automatic delays before each request
- Timeout: 30 seconds per request

## Error Handling

**Automatic Retries**:
- Network errors: 3 retries with exponential backoff
- Rate limit errors: Automatic delay and retry
- Parse errors: Fallback to AI extraction

**Failure Tracking**:
- Failed scrapes logged in `scraping_progress.json`
- Manual retry: `python faculty_scraper.py --university <id>`

**Logging**:
- INFO: Progress and successful operations
- WARNING: Fallbacks and retries
- ERROR: Failures and exceptions

## Querying Data

### Python Examples

**Find faculty by research area**:
```python
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['edulens']

# Find all ML researchers
ml_faculty = db.faculty_data.find({
    'research_areas': {'$in': ['Machine Learning', 'AI']}
})

for faculty in ml_faculty:
    print(f"{faculty['name']} - {faculty['university_name']}")
```

**Count faculty by university**:
```python
pipeline = [
    {'$group': {
        '_id': '$university_id',
        'count': {'$sum': 1}
    }},
    {'$sort': {'count': -1}}
]

results = db.faculty_data.aggregate(pipeline)
for r in results:
    print(f"{r['_id']}: {r['count']} faculty")
```

**Export specific university**:
```python
import json

mit_faculty = list(db.faculty_data.find(
    {'university_id': 'mit'},
    {'_id': 0}
))

with open('mit_faculty.json', 'w') as f:
    json.dump(mit_faculty, f, indent=2)
```

### MongoDB Shell Examples

```bash
# Connect to database
mongosh mongodb://localhost:27017/edulens

# Count total faculty
db.faculty_data.countDocuments({})

# Find faculty accepting students
db.faculty_data.find({ accepting_students: true })

# Get all research areas
db.faculty_data.distinct('research_areas')

# Universities with most faculty
db.faculty_data.aggregate([
  { $group: { _id: '$university_name', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## Performance

**Expected Performance**:
- 20-30 faculty per minute (with rate limiting)
- 100-200 faculty per department (avg)
- Full scrape (20 universities): 2-4 hours

**Optimization Tips**:
1. Use Firecrawl for faster, more reliable scraping
2. Reduce `rate_limit_delay` for faster scraping (be respectful)
3. Use `--resume` to avoid re-scraping
4. Run during off-peak hours

## Troubleshooting

**Issue: No faculty extracted**
- Check if URL is correct in config
- Try AI extraction by removing selectors
- Verify university website hasn't changed structure

**Issue: MongoDB connection error**
- Ensure MongoDB is running: `sudo systemctl start mongodb`
- Check connection string: `echo $MONGODB_URI`
- Test connection: `mongosh $MONGODB_URI`

**Issue: Google API quota exceeded**
- Check quota: https://console.cloud.google.com
- Reduce scraping rate
- Use selector-based extraction when possible

**Issue: Firecrawl errors**
- Check API key is set
- Verify API credits
- Fallback to BeautifulSoup (automatic)

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-mock

# Run tests
pytest test_faculty_scraper.py -v
```

### Code Structure

```
train_ml/
├── faculty_scraper.py          # Main scraper
├── university_config.json      # University list and config
├── scraping_progress.json      # Progress tracking
├── requirements.txt            # Dependencies
└── README_FACULTY_SCRAPER.md   # This file
```

### Adding Features

**Example: Add LinkedIn URL extraction**

1. Update AI prompt in `FacultyExtractor.extract_faculty_info()`:
```python
prompt = f"""
...
- linkedin (LinkedIn profile URL)
...
"""
```

2. Update schema documentation

3. Re-run scraper

## Integration with EduLen

The scraped faculty data integrates with EduLen's AI service:

**Use Cases**:
1. **Professor Matching**: Match students with faculty based on research interests
2. **Email Finder**: Provide contact information for prospective students
3. **Program Recommendations**: Suggest universities based on faculty expertise
4. **Research Trends**: Analyze research areas across top universities

**Integration Example**:
```typescript
// In Next.js API route
import { MongoClient } from 'mongodb';

export async function POST(req: Request) {
  const { research_interests } = await req.json();

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  const faculty = await client
    .db('edulens')
    .collection('faculty_data')
    .find({
      research_areas: { $in: research_interests }
    })
    .limit(10)
    .toArray();

  return Response.json({ faculty });
}
```

## Maintenance

**Update URLs** (quarterly):
- Check if university URLs have changed
- Update `university_config.json`
- Re-run affected universities

**Clean Old Data** (annually):
```javascript
// Remove data older than 1 year
db.faculty_data.deleteMany({
  scraped_at: {
    $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  }
})
```

**Verify Data Quality**:
```bash
# Check for missing emails
python faculty_scraper.py --university mit --export test.json
grep -c '"email": ""' test.json
```

## Contributing

To add support for new universities:

1. Research faculty directory URL
2. Inspect page structure and identify CSS selectors
3. Add configuration to `university_config.json`
4. Test with single university scrape
5. Submit configuration update

## License

MIT License - Part of EduLen project

## Support

For issues or questions:
- GitHub Issues: [edulen/issues](https://github.com/edulen/issues)
- Documentation: [edulen/docs](https://github.com/edulen/docs)

## Changelog

### v1.0.0 (2025-01-12)
- Initial release
- Support for top 20 universities
- Firecrawl + BeautifulSoup scraping
- Google Gemini AI extraction
- MongoDB storage
- Progress tracking and resume capability
- Rich CLI interface

---

**Happy Scraping!** 🚀
