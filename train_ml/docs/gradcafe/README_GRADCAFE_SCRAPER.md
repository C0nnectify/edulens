# GradCafe Scraper - Comprehensive Documentation

## Overview

The GradCafe Scraper is a sophisticated web scraping tool designed to collect historical admission data from [TheGradCafe.com](https://www.thegradcafe.com). It extracts structured information about graduate school admissions including student profiles, test scores, admission decisions, and funding information.

## Features

### Core Capabilities

- **Dynamic Content Scraping**: Uses Playwright for JavaScript-rendered content
- **Intelligent Profile Parsing**: Extracts GPA, GRE, TOEFL/IELTS scores from unstructured text
- **Multi-Search Support**: Search by program, university, year range
- **Resume Capability**: Checkpoint system allows resuming interrupted scrapes
- **Deduplication**: SHA-256 hashing prevents duplicate records
- **Data Validation**: Cleans and normalizes extracted data
- **Dual Storage**: Saves to both MongoDB and JSON files
- **Rich CLI Interface**: Beautiful progress bars and statistics
- **Rate Limiting**: Respectful scraping with configurable delays
- **Concurrent Processing**: Async/await for efficient scraping

### Data Extraction

The scraper extracts:

- **Basic Information**: University, program, degree type, decision, dates
- **Student Profile**:
  - GPA (normalized to 4.0 scale, supports multiple formats)
  - GRE scores (Verbal, Quantitative, Analytical Writing)
  - TOEFL/IELTS scores
  - Research experience (publications, years)
  - Undergraduate institution
  - International status
- **Funding**: Type (fellowship, assistantship, etc.) and amount
- **Timeline**: Application and decision dates
- **Comments**: Full post content for context

## Installation

### Prerequisites

- Python 3.9+
- MongoDB 4.0+
- Playwright browsers

### Setup

1. **Navigate to the train_ml directory**:
```bash
cd /home/ismail/edulen/train_ml
```

2. **Install Python dependencies**:
```bash
pip install playwright beautifulsoup4 pymongo click rich asyncio
```

3. **Install Playwright browsers**:
```bash
playwright install chromium
```

4. **Start MongoDB**:
```bash
# If using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or start local MongoDB
sudo systemctl start mongod
```

5. **Configure the scraper**:
Edit `gradcafe_config.json` to customize:
- Search parameters (programs, universities, years)
- Rate limiting settings
- MongoDB connection
- Output paths

## Configuration

### gradcafe_config.json

```json
{
  "search_parameters": {
    "programs": ["Computer Science", "Data Science", ...],
    "degree_types": ["PhD", "MS", "MBA"],
    "years": {"start": 2020, "end": 2025}
  },
  "scraping_settings": {
    "rate_limit_delay": 2.0,
    "max_concurrent_requests": 3,
    "retry_attempts": 3,
    "page_timeout": 30000,
    "max_pages_per_search": 100,
    "checkpoint_frequency": 50
  },
  "mongodb": {
    "uri": "mongodb://localhost:27017",
    "database": "edulens",
    "collection": "gradcafe_data"
  }
}
```

### profile_patterns.json

Contains regex patterns for extracting:
- GPA formats (3.8/4.0, 9/10, 85%)
- GRE scores (multiple formats)
- TOEFL/IELTS scores
- Research experience
- Funding information
- Institution names

You can customize patterns to improve extraction accuracy.

## Usage

### Command Line Interface

The scraper provides several commands:

#### 1. Scrape Data

**Basic usage**:
```bash
python gradcafe_scraper.py scrape --program "Computer Science" --years 2020-2024
```

**Multiple programs**:
```bash
python gradcafe_scraper.py scrape -p "Computer Science" -p "Data Science" --years 2022-2024
```

**Specific university**:
```bash
python gradcafe_scraper.py scrape --university "MIT" --all-programs --years 2023-2024
```

**Resume from checkpoint**:
```bash
python gradcafe_scraper.py scrape --resume
```

**All configured programs**:
```bash
python gradcafe_scraper.py scrape --all-programs --years 2020-2024
```

#### 2. Export Data

**Export all data**:
```bash
python gradcafe_scraper.py export --output results.json
```

**Filter by university**:
```bash
python gradcafe_scraper.py export -o stanford.json --university Stanford
```

**Filter by decision**:
```bash
python gradcafe_scraper.py export -o accepted.json --decision Accepted
```

**Multiple filters**:
```bash
python gradcafe_scraper.py export -o cs_mit.json --university MIT --program "Computer Science"
```

#### 3. View Statistics

```bash
python gradcafe_scraper.py stats
```

Displays:
- Total records scraped
- Breakdown by decision (Accepted/Rejected/Waitlisted)
- Number of completed searches
- Top 10 universities by record count

#### 4. Reset Checkpoint

```bash
python gradcafe_scraper.py reset
```

Clears checkpoint data to start fresh (with confirmation prompt).

### Python API

You can also use the scraper programmatically:

```python
from gradcafe_scraper import GradCafeScraper
import asyncio

# Initialize scraper
scraper = GradCafeScraper()

# Run scraper
asyncio.run(scraper.run_scraper(
    programs=["Computer Science", "Data Science"],
    universities=["MIT", "Stanford"],
    years=["2023", "2024"],
    resume=False
))

# Export data
scraper.export_to_json("output.json", query={'decision': 'Accepted'})

# Get statistics
scraper.print_statistics()
```

## Data Output

### MongoDB Schema

```javascript
{
  "_id": ObjectId("..."),
  "hash": "abc123...",  // SHA-256 hash for deduplication
  "university": "MIT",
  "program": "Computer Science PhD",
  "decision": "Accepted",  // Normalized: Accepted/Rejected/Waitlisted/Pending
  "decision_method": "Email",
  "season": "Fall 2024",
  "decision_date": "2024-03-15",
  "post_date": "2024-03-20",
  "profile": {
    "gpa": 3.8,
    "gpa_scale": 4.0,
    "gpa_normalized": 3.8,
    "gre_verbal": 165,
    "gre_quant": 170,
    "gre_aw": 5.0,
    "toefl": 110,
    "research_pubs": 2,
    "research_years": 3,
    "is_international": true,
    "undergrad_institution": "IIT Delhi"
  },
  "funding": "Full funding",
  "funding_amount": 45000,
  "post_content": "Original post text...",
  "scraped_at": "2025-01-12T10:00:00"
}
```

### JSON Export Format

Same structure as MongoDB but in JSON array format:

```json
[
  {
    "university": "MIT",
    "program": "Computer Science PhD",
    ...
  },
  {
    "university": "Stanford",
    ...
  }
]
```

### MongoDB Indexes

The scraper automatically creates indexes for efficient querying:

- `hash` (unique) - Deduplication
- `university + program + season` - Search optimization
- `decision` - Filter by decision type
- `scraped_at` - Temporal queries

## Profile Extraction

### GPA Formats Supported

- Standard: `GPA: 3.8/4.0`, `GPA 3.8 out of 4.0`
- Indian: `CGPA: 9.2/10`, `CGPA 9.2`
- Percentage: `Percentage: 85%`

All GPAs are normalized to 4.0 scale.

### GRE Score Formats

- Standard: `GRE: V:165, Q:170, AW:5.0`
- Compact: `GRE: 165V, 170Q, 5.0A`
- Separate: `Verbal: 165`, `Quant: 170`, `AW: 5.0`

### Test Score Extraction

- **TOEFL**: `TOEFL: 110`, `TOEFL iBT: 110`
- **IELTS**: `IELTS: 8.5`

### Research Experience

Detects:
- Publication counts: "2 research papers", "3 publications"
- Research years: "2 years of research"
- Mentions: "first author", "conference paper", "journal paper"

### Institution Detection

Extracts undergraduate institution:
- Pattern: "Undergrad from IIT Delhi"
- Pattern: "UG at Stanford University"
- Indian institutes: "IIT Bombay", "NIT Trichy", "BITS Pilani"

### Funding Information

Detects:
- Types: Full funding, fellowship, assistantship, TA, RA
- Amounts: "$45,000/year", "$45000 annually"
- Unfunded: "no funding", "self-funded"

## Checkpoint System

The scraper uses a checkpoint system for resilience:

### Checkpoint File Structure

```json
{
  "searches_completed": ["cs_mit_2024", "ds_stanford_2023"],
  "current_search": "cs_stanford_2024",
  "pages_scraped": {
    "cs_mit_2024": 15,
    "ds_stanford_2023": 8
  },
  "total_records": 1234,
  "last_updated": "2025-01-12T10:30:00"
}
```

### Resume Capability

When scraping is interrupted:
1. Run with `--resume` flag
2. Scraper loads checkpoint
3. Skips completed searches
4. Resumes incomplete search from last page
5. Continues until all searches complete

## Rate Limiting

The scraper is configured to be respectful:

- **Delay between requests**: 2 seconds (configurable)
- **Page timeout**: 30 seconds
- **Retry attempts**: 3 with exponential backoff
- **User agent**: Modern Chrome browser string

### Best Practices

- Don't reduce `rate_limit_delay` below 1 second
- Use `max_concurrent_requests: 3` or less
- Schedule large scrapes during off-peak hours
- Monitor logs for errors or blocks

## Error Handling

The scraper handles:

- **Network errors**: Retries with exponential backoff
- **Timeout errors**: Logs and skips page
- **Parsing errors**: Logs warning, continues with next record
- **Duplicate records**: Silently skips with counter
- **MongoDB errors**: Logs error, continues scraping

## Performance

### Optimization Tips

1. **Concurrent searches**: Set `max_concurrent_requests` appropriately
2. **Checkpoint frequency**: Save every 50 records (configurable)
3. **Page limits**: Set `max_pages_per_search` to avoid infinite loops
4. **Headless browser**: Always use headless mode for speed

### Expected Performance

- **Speed**: ~30-50 records per minute (depends on rate limiting)
- **Large scrape**: 10,000 records in ~4-6 hours
- **Memory**: ~200-500MB RAM usage
- **Storage**: ~1KB per record (JSON), ~2KB (MongoDB with indexes)

## Monitoring

### Log Files

Logs are stored in `train_ml/logs/gradcafe_scraper.log`:

```
2025-01-12 10:00:00 - INFO - Starting scraper
2025-01-12 10:00:15 - INFO - Scraping https://...
2025-01-12 10:00:20 - INFO - Found 25 results
2025-01-12 10:00:25 - INFO - Saved 23 records (2 duplicates)
```

### Progress Display

Rich progress bars show:
- Current search being processed
- Page number within search
- Overall progress across all searches
- Time elapsed and estimated remaining

### Statistics Table

Real-time statistics include:
- Total records collected
- Breakdown by decision type
- Searches completed
- Top universities by volume

## Data Quality

### Validation

The scraper validates:
- Required fields (university, program, decision)
- Date formats (normalized to ISO)
- Score ranges (GPA 0-4.0, GRE 130-170, TOEFL 0-120, IELTS 0-9)
- Decision types (normalized to 4 categories)

### Cleaning

Automatic cleaning:
- Strips extra whitespace
- Normalizes decision strings
- Converts dates to ISO format
- Normalizes GPA to 4.0 scale

### Deduplication

Uses SHA-256 hash of:
- University + Program + Season + Decision + Post content (first 100 chars)

Duplicates are:
- Logged but not stored
- Counted in statistics
- Skipped during MongoDB insert

## Troubleshooting

### Common Issues

**1. Playwright not found**
```bash
playwright install chromium
```

**2. MongoDB connection error**
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Or start Docker container
docker ps | grep mongodb
```

**3. No results returned**
- Check internet connection
- Verify GradCafe website is accessible
- Check if search parameters are too specific
- Review logs for errors

**4. Rate limiting/blocking**
- Increase `rate_limit_delay` to 3-5 seconds
- Reduce `max_concurrent_requests` to 1
- Wait 30 minutes before retrying
- Consider using rotating proxies (advanced)

**5. Profile extraction misses data**
- Review `profile_patterns.json`
- Add custom patterns for new formats
- Check logs for unparsed posts
- Submit improvements to pattern library

### Debug Mode

Enable verbose logging:

```python
import logging
logging.getLogger().setLevel(logging.DEBUG)
```

## Advanced Usage

### Custom Patterns

Add new extraction patterns to `profile_patterns.json`:

```json
{
  "custom_patterns": [
    {
      "pattern": "(?i)work experience[:\\s]*(\\d+)\\s*years?",
      "description": "Work experience years",
      "groups": {
        "years": 1
      }
    }
  ]
}
```

### Query MongoDB

Direct MongoDB queries for analysis:

```javascript
// Connect to MongoDB
use edulens

// Find all MIT CS acceptances
db.gradcafe_data.find({
  university: "MIT",
  program: /Computer Science/i,
  decision: "Accepted"
})

// Average GRE scores for accepted students
db.gradcafe_data.aggregate([
  { $match: { decision: "Accepted" } },
  { $group: {
    _id: null,
    avgVerbal: { $avg: "$profile.gre_verbal" },
    avgQuant: { $avg: "$profile.gre_quant" },
    avgAW: { $avg: "$profile.gre_aw" }
  }}
])

// Top programs by acceptance rate
db.gradcafe_data.aggregate([
  { $group: {
    _id: "$program",
    total: { $sum: 1 },
    accepted: {
      $sum: { $cond: [{ $eq: ["$decision", "Accepted"] }, 1, 0] }
    }
  }},
  { $project: {
    program: "$_id",
    total: 1,
    accepted: 1,
    acceptanceRate: { $divide: ["$accepted", "$total"] }
  }},
  { $sort: { acceptanceRate: -1 } },
  { $limit: 20 }
])
```

### Integration with ML Pipeline

Export data for machine learning:

```python
from gradcafe_scraper import GradCafeScraper
import pandas as pd
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client['edulens']
collection = db['gradcafe_data']

# Export to DataFrame
records = list(collection.find({}, {'_id': 0}))
df = pd.DataFrame(records)

# Flatten profile data
profile_df = pd.json_normalize(df['profile'])
df = pd.concat([df.drop('profile', axis=1), profile_df], axis=1)

# Save for ML training
df.to_csv('gradcafe_ml_dataset.csv', index=False)
```

## Data Analysis Examples

### Acceptance Rate by University

```python
import matplotlib.pyplot as plt
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
collection = client['edulens']['gradcafe_data']

# Aggregate acceptance rates
pipeline = [
    {'$match': {'decision': {'$in': ['Accepted', 'Rejected']}}},
    {'$group': {
        '_id': '$university',
        'total': {'$sum': 1},
        'accepted': {
            '$sum': {'$cond': [{'$eq': ['$decision', 'Accepted']}, 1, 0]}
        }
    }},
    {'$project': {
        'university': '$_id',
        'rate': {'$divide': ['$accepted', '$total']}
    }},
    {'$match': {'total': {'$gte': 50}}},  # At least 50 records
    {'$sort': {'rate': -1}},
    {'$limit': 20}
]

results = list(collection.aggregate(pipeline))

# Plot
universities = [r['university'] for r in results]
rates = [r['rate'] * 100 for r in results]

plt.figure(figsize=(12, 6))
plt.barh(universities, rates)
plt.xlabel('Acceptance Rate (%)')
plt.title('Top 20 Universities by Acceptance Rate')
plt.tight_layout()
plt.savefig('acceptance_rates.png')
```

### GRE Score Distribution

```python
import seaborn as sns
import pandas as pd

# Load data
records = list(collection.find({
    'profile.gre_quant': {'$exists': True},
    'decision': 'Accepted'
}))

df = pd.DataFrame([{
    'verbal': r['profile'].get('gre_verbal'),
    'quant': r['profile'].get('gre_quant'),
    'program': r['program']
} for r in records])

# Plot
plt.figure(figsize=(10, 6))
sns.scatterplot(data=df, x='verbal', y='quant', hue='program', alpha=0.6)
plt.xlabel('GRE Verbal')
plt.ylabel('GRE Quantitative')
plt.title('GRE Scores for Accepted Students')
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
plt.tight_layout()
plt.savefig('gre_distribution.png')
```

## Legal and Ethical Considerations

### Terms of Service

- Review TheGradCafe.com Terms of Service before scraping
- This tool is for educational and research purposes
- Respect rate limits and website resources
- Do not redistribute scraped data commercially

### Data Privacy

- GradCafe data is publicly posted by users
- Some posts may contain personally identifiable information
- Consider anonymizing data before public sharing
- Follow GDPR/privacy regulations in your jurisdiction

### Best Practices

- Use reasonable rate limits (default: 2 seconds)
- Scrape during off-peak hours
- Cache results to avoid re-scraping
- Attribute data source in publications
- Contact website owners for bulk access if needed

## Contributing

### Improving Patterns

If you find patterns that aren't extracted correctly:

1. Add new patterns to `profile_patterns.json`
2. Test with sample text
3. Submit improvements back to the project

### Bug Reports

Report issues with:
- Sample input that failed
- Expected vs actual output
- Error messages and logs
- Configuration used

## Maintenance

### Regular Updates

GradCafe's HTML structure may change:

1. Monitor scraper logs for parsing errors
2. Use browser dev tools to inspect current HTML
3. Update selectors in `parse_result_row()` method
4. Test with small scrapes before large runs

### Database Maintenance

Periodic maintenance tasks:

```javascript
// Rebuild indexes
db.gradcafe_data.reIndex()

// Remove duplicates (if any slipped through)
db.gradcafe_data.aggregate([
  { $group: {
    _id: "$hash",
    count: { $sum: 1 },
    docs: { $push: "$_id" }
  }},
  { $match: { count: { $gt: 1 } }}
]).forEach(function(doc) {
  doc.docs.shift();
  db.gradcafe_data.remove({ _id: { $in: doc.docs }});
});

// Archive old data
db.gradcafe_data.aggregate([
  { $match: { scraped_at: { $lt: "2023-01-01" } } },
  { $out: "gradcafe_archive" }
])
```

## Roadmap

Future enhancements:

- [ ] Proxy rotation support
- [ ] Multi-threaded scraping
- [ ] Real-time scraping mode
- [ ] Email notifications on completion
- [ ] Web dashboard for monitoring
- [ ] API endpoint for data access
- [ ] Automated ML feature engineering
- [ ] Acceptance probability calculator
- [ ] Profile comparison tool

## Support

For issues or questions:

- Check logs: `train_ml/logs/gradcafe_scraper.log`
- Review documentation
- Check MongoDB connection
- Verify Playwright installation
- Test with small scrapes first

## License

This tool is provided as-is for educational purposes. Users are responsible for complying with applicable laws and terms of service.

## Changelog

### Version 1.0.0 (2025-01-12)

- Initial release
- Full GradCafe scraping support
- Profile extraction with regex patterns
- MongoDB integration
- Checkpoint system
- CLI interface
- JSON export
- Statistics reporting

---

**Last Updated**: 2025-01-12
**Author**: EduLen Team
**Version**: 1.0.0
