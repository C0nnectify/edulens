# Faculty Scraper - Documentation Index

Complete documentation for the faculty data scraper system.

## Quick Navigation

- [Quick Start Guide](#quick-start) - Get running in 5 minutes
- [Full Documentation](#documentation) - Complete reference
- [Integration Guide](#integration) - Connect with EduLen
- [Examples](#examples) - Usage examples and recipes
- [API Reference](#api) - API endpoints
- [Configuration](#configuration) - Setup and customization

---

## Quick Start

**Start here if you're new to the faculty scraper.**

- [QUICK_START.md](./QUICK_START.md) - Installation and basic usage
  - Installation steps
  - Environment setup
  - First scrape
  - Common issues

**Time to first scrape**: 5-10 minutes

---

## Documentation

### Main Documentation

- [README_FACULTY_SCRAPER.md](./README_FACULTY_SCRAPER.md) - Complete documentation
  - Features overview
  - Architecture
  - Full CLI reference
  - Data schema
  - Advanced usage
  - Troubleshooting

### Integration

- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - EduLen integration
  - Next.js API routes
  - React components
  - Service layer
  - Database queries
  - Production setup

---

## Files Overview

### Core Files

| File | Purpose | Documentation |
|------|---------|---------------|
| `faculty_scraper.py` | Main scraper script | [README](./README_FACULTY_SCRAPER.md#usage) |
| `university_config.json` | University configuration | [Configuration](#configuration) |
| `scraping_progress.json` | Progress tracking | [Progress Tracking](#progress-tracking) |
| `requirements.txt` | Python dependencies | [Installation](#installation) |

### Documentation Files

| File | Purpose |
|------|---------|
| `README_FACULTY_SCRAPER.md` | Complete documentation |
| `QUICK_START.md` | Quick start guide |
| `INTEGRATION_GUIDE.md` | Integration with EduLen |
| `INDEX.md` | This file |

### Support Files

| File | Purpose |
|------|---------|
| `example_usage.py` | Example queries and usage |
| `test_faculty_scraper.py` | Unit tests |
| `setup.sh` | Automated setup script |
| `.env.example` | Environment template |

---

## Getting Started Path

Follow this path for the smoothest experience:

1. **Setup** (10 min)
   - Read [QUICK_START.md](./QUICK_START.md)
   - Run `./setup.sh`
   - Configure `.env`

2. **First Scrape** (5 min)
   - Test with single university
   - Verify MongoDB storage
   - Check results

3. **Full Scrape** (2-4 hours)
   - Run `--all` command
   - Monitor progress
   - Handle any errors

4. **Query Data** (15 min)
   - Run `example_usage.py`
   - Try MongoDB queries
   - Export results

5. **Integration** (1-2 hours)
   - Read [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
   - Create API routes
   - Build UI components

---

## Configuration

### University Config

File: `university_config.json`

```json
{
  "universities": [...],
  "scraping_config": {
    "rate_limit_delay": 2,
    "max_retries": 3,
    "timeout": 30
  }
}
```

**Customization**:
- Add new universities
- Update URLs
- Configure selectors
- Adjust rate limiting

See: [README_FACULTY_SCRAPER.md#configuration](./README_FACULTY_SCRAPER.md#configuration)

### Environment Variables

File: `.env`

Required:
- `GOOGLE_API_KEY` - Google Gemini API
- `MONGODB_URI` - MongoDB connection

Optional:
- `FIRECRAWL_API_KEY` - Enhanced scraping

See: [QUICK_START.md#configure-environment](./QUICK_START.md#2-configure-environment)

---

## Examples

### Basic Usage

```bash
# Single university
python faculty_scraper.py --university mit

# All universities
python faculty_scraper.py --all

# Resume scraping
python faculty_scraper.py --all --resume

# Export results
python faculty_scraper.py --all --export faculty_data.json
```

### Data Queries

```python
# Find ML researchers
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['edulens']

ml_faculty = db.faculty_data.find({
    'research_areas': {'$in': ['Machine Learning', 'AI']}
})

for faculty in ml_faculty:
    print(f"{faculty['name']} - {faculty['university_name']}")
```

See: [example_usage.py](./example_usage.py)

---

## API Reference

### CLI Commands

```bash
faculty_scraper.py [OPTIONS]

Options:
  --university, -u ID       Scrape specific university
  --department, -d CODE     Scrape specific department
  --all, -a                 Scrape all universities
  --resume, -r              Resume from last position
  --export, -e FILE         Export to JSON file
  --config, -c FILE         Config file path
  --progress, -p FILE       Progress file path
  --help                    Show help message
```

### Data Schema

```json
{
  "name": "Dr. John Doe",
  "title": "Professor",
  "email": "jdoe@mit.edu",
  "research_areas": ["AI", "ML"],
  "university_id": "mit",
  "university_name": "MIT",
  "department": "Computer Science",
  "website": "https://jdoe.mit.edu",
  "accepting_students": true
}
```

See: [README_FACULTY_SCRAPER.md#data-schema](./README_FACULTY_SCRAPER.md#data-schema)

---

## Integration

### Next.js API Routes

```typescript
// /api/faculty/search
POST { research_areas: string[], universities: string[] }

// /api/faculty/research-areas
GET -> { research_areas: string[] }

// /api/faculty/universities
GET -> { universities: Array<{id, name, departments}> }
```

### React Components

- `ProfessorMatcher` - Faculty search interface
- `ResearchTrends` - Research area analytics
- `UniversityRecommender` - University suggestions

### Services

- `FacultyService` - Faculty data operations
- `UniversityRecommender` - Recommendation engine
- `OutreachService` - Email campaign generation

See: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

---

## Progress Tracking

File: `scraping_progress.json`

```json
{
  "last_university": "mit",
  "last_department": "cs",
  "completed": ["mit:cs", "stanford:cs"],
  "failed": ["berkeley:eecs"],
  "total_faculty_scraped": 120
}
```

**Features**:
- Resume capability
- Track completed/failed
- Monitor progress
- Auto-save

---

## Testing

### Run Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-mock

# Run all tests
pytest test_faculty_scraper.py -v

# Run specific test
pytest test_faculty_scraper.py::TestFacultyExtractor -v

# With coverage
pytest test_faculty_scraper.py --cov=faculty_scraper
```

### Test Data

Use example scripts to validate:

```bash
python example_usage.py
```

---

## Troubleshooting

### Common Issues

| Issue | Solution | Reference |
|-------|----------|-----------|
| MongoDB connection error | Check if MongoDB is running | [Quick Start](./QUICK_START.md#mongodb-connection-error) |
| Google API quota | Increase rate limiting | [Quick Start](./QUICK_START.md#google-api-quota-exceeded) |
| No faculty extracted | Check URL/selectors | [Quick Start](./QUICK_START.md#no-faculty-extracted) |
| Import errors | Reinstall dependencies | [Quick Start](./QUICK_START.md#import-error) |

### Debug Mode

Enable verbose logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## Performance

### Benchmarks

- Single university: 2-5 minutes
- All 20 universities: 2-4 hours
- MongoDB query: <10ms (with indexes)
- AI extraction: ~2s per page

### Optimization

1. Use Firecrawl API
2. Lower rate limiting (respectfully)
3. Enable MongoDB indexes
4. Run during off-peak hours
5. Use resume capability

See: [README_FACULTY_SCRAPER.md#performance](./README_FACULTY_SCRAPER.md#performance)

---

## Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB indexes created
- [ ] Rate limiting configured
- [ ] Error handling tested
- [ ] Cron job scheduled
- [ ] Monitoring setup
- [ ] Backup strategy
- [ ] API routes deployed
- [ ] Frontend integrated
- [ ] Documentation updated

---

## Support

### Documentation

- Main: [README_FACULTY_SCRAPER.md](./README_FACULTY_SCRAPER.md)
- Quick Start: [QUICK_START.md](./QUICK_START.md)
- Integration: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

### Examples

- Python: [example_usage.py](./example_usage.py)
- Tests: [test_faculty_scraper.py](./test_faculty_scraper.py)

### Configuration

- Universities: [university_config.json](./university_config.json)
- Environment: [.env.example](./.env.example)

---

## Version History

### v1.0.0 (2025-01-12)

Initial release:
- ✅ Top 20 universities supported
- ✅ Firecrawl + BeautifulSoup scraping
- ✅ Google Gemini AI extraction
- ✅ MongoDB storage
- ✅ Progress tracking
- ✅ Rich CLI interface
- ✅ Comprehensive documentation
- ✅ EduLen integration guide

---

## Directory Structure

```
train_ml/
├── faculty_scraper.py           # Main scraper
├── example_usage.py             # Usage examples
├── test_faculty_scraper.py      # Unit tests
├── setup.sh                     # Setup script
│
├── university_config.json       # Configuration
├── scraping_progress.json       # Progress
├── requirements.txt             # Dependencies
├── .env.example                 # Environment template
│
├── README_FACULTY_SCRAPER.md    # Main docs
├── QUICK_START.md               # Quick start
├── INTEGRATION_GUIDE.md         # Integration
└── INDEX.md                     # This file
```

---

## Next Steps

1. **New User**: Start with [QUICK_START.md](./QUICK_START.md)
2. **Integrating**: Read [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
3. **Advanced**: See [README_FACULTY_SCRAPER.md](./README_FACULTY_SCRAPER.md)
4. **Examples**: Run [example_usage.py](./example_usage.py)

---

**Happy Scraping!** 🎓

For questions or issues, refer to the troubleshooting sections in the documentation.
