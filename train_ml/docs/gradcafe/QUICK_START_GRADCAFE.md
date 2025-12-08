# GradCafe Scraper - Quick Start Guide

Get up and running with the GradCafe scraper in 5 minutes.

## Prerequisites

- Python 3.9+
- MongoDB running (locally or Docker)
- Internet connection

## Installation

### 1. Install Dependencies

```bash
cd /home/ismail/edulen/train_ml

# Install Python packages
pip install playwright beautifulsoup4 pymongo click rich

# Install Playwright browsers
playwright install chromium
```

### 2. Start MongoDB

```bash
# Option A: Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Option B: Local MongoDB
sudo systemctl start mongod
```

### 3. Verify Installation

```bash
# Make scripts executable
chmod +x gradcafe_scraper.py

# Run tests
python test_gradcafe_scraper.py
```

## Basic Usage

### Example 1: Scrape Computer Science Programs (2024)

```bash
python gradcafe_scraper.py scrape \
  --program "Computer Science" \
  --years 2024
```

### Example 2: Scrape Multiple Programs

```bash
python gradcafe_scraper.py scrape \
  -p "Computer Science" \
  -p "Data Science" \
  -p "Machine Learning" \
  --years 2023-2024
```

### Example 3: Scrape Specific Universities

```bash
python gradcafe_scraper.py scrape \
  --university MIT \
  --university Stanford \
  --university Berkeley \
  --all-programs \
  --years 2024
```

### Example 4: Resume Interrupted Scrape

```bash
python gradcafe_scraper.py scrape --resume
```

## View Results

### Show Statistics

```bash
python gradcafe_scraper.py stats
```

Output:
```
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━┓
┃ Metric             ┃ Value         ┃
┡━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━┩
│ Total Records      │ 1234          │
│ Accepted           │ 456           │
│ Rejected           │ 678           │
│ Waitlisted         │ 100           │
│ Searches Completed │ 15            │
└────────────────────┴───────────────┘
```

### Export Data

```bash
# Export all data
python gradcafe_scraper.py export --output all_data.json

# Export by university
python gradcafe_scraper.py export -o mit.json --university MIT

# Export by decision
python gradcafe_scraper.py export -o accepted.json --decision Accepted

# Export with multiple filters
python gradcafe_scraper.py export \
  -o mit_cs_accepted.json \
  --university MIT \
  --program "Computer Science" \
  --decision Accepted
```

## Query MongoDB

### Using Python

```python
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['edulens']

# Get all MIT acceptances
results = db.gradcafe_data.find({
    'university': 'MIT',
    'decision': 'Accepted'
})

for result in results:
    print(f"{result['program']} - GPA: {result['profile'].get('gpa', 'N/A')}")
```

### Using MongoDB Shell

```javascript
// Connect
mongosh

use edulens

// Count records
db.gradcafe_data.count()

// Find all CS acceptances
db.gradcafe_data.find({
  program: /Computer Science/i,
  decision: "Accepted"
})

// Average GRE scores for accepted students
db.gradcafe_data.aggregate([
  { $match: { decision: "Accepted" } },
  { $group: {
    _id: null,
    avgVerbal: { $avg: "$profile.gre_verbal" },
    avgQuant: { $avg: "$profile.gre_quant" }
  }}
])
```

## Configuration

### Edit Search Parameters

Edit `gradcafe_config.json`:

```json
{
  "search_parameters": {
    "programs": [
      "Computer Science",
      "Data Science",
      "Your Program Here"
    ],
    "years": {
      "start": 2020,
      "end": 2025
    }
  }
}
```

### Adjust Rate Limiting

```json
{
  "scraping_settings": {
    "rate_limit_delay": 2.0,  // Seconds between requests
    "max_concurrent_requests": 3,
    "max_pages_per_search": 100
  }
}
```

## Common Tasks

### Scrape All Configured Programs

```bash
python gradcafe_scraper.py scrape --all-programs --years 2020-2024
```

### Scrape Top Universities

The config includes 20 top universities by default:

```bash
python gradcafe_scraper.py scrape \
  --all-programs \
  --years 2024 \
  -u MIT -u Stanford -u Harvard -u Berkeley -u CMU
```

### Reset and Start Fresh

```bash
python gradcafe_scraper.py reset
```

## Analysis Examples

### Calculate Acceptance Rates

```python
from gradcafe_scraper import GradCafeScraper

scraper = GradCafeScraper()

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
        'rate': {'$divide': ['$accepted', '$total']}
    }},
    {'$sort': {'rate': -1}}
]

results = list(scraper.collection.aggregate(pipeline))
for result in results:
    print(f"{result['_id']}: {result['rate']*100:.1f}%")
```

### Find Matching Professors

Based on your interests, find universities where students with similar profiles got accepted:

```python
interests = ["Machine Learning", "Computer Vision", "NLP"]

matches = scraper.collection.find({
    'decision': 'Accepted',
    'program': {'$regex': '|'.join(interests), '$options': 'i'}
})

for match in matches[:10]:
    print(f"{match['university']} - {match['program']}")
    profile = match['profile']
    print(f"  GPA: {profile.get('gpa', 'N/A')}")
    print(f"  GRE: V:{profile.get('gre_verbal', 'N/A')} Q:{profile.get('gre_quant', 'N/A')}")
    print()
```

## Troubleshooting

### Issue: No results found

**Solution**: Check search parameters, verify GradCafe is accessible

```bash
# Test with broad search
python gradcafe_scraper.py scrape --program "Computer Science" --years 2024
```

### Issue: MongoDB connection error

**Solution**: Ensure MongoDB is running

```bash
# Check MongoDB status
docker ps | grep mongodb

# Or for local MongoDB
sudo systemctl status mongod
```

### Issue: Playwright browser not found

**Solution**: Install Playwright browsers

```bash
playwright install chromium
```

### Issue: Rate limiting/blocking

**Solution**: Increase delay in config

```json
{
  "scraping_settings": {
    "rate_limit_delay": 5.0,
    "max_concurrent_requests": 1
  }
}
```

## Performance Tips

1. **Start small**: Test with one program and one year first
2. **Use resume**: For large scrapes, use `--resume` if interrupted
3. **Check logs**: Monitor `train_ml/logs/gradcafe_scraper.log`
4. **Export regularly**: Export data periodically as backup
5. **MongoDB indexes**: Created automatically for fast queries

## Next Steps

1. **Collect data**: Run scraper for your target programs
2. **Analyze trends**: Use MongoDB queries or export to pandas
3. **Build ML models**: Use data for admission prediction
4. **Integrate with EduLen**: Connect to main application

## Support

- **Documentation**: `README_GRADCAFE_SCRAPER.md`
- **Examples**: `example_usage.py`
- **Tests**: `test_gradcafe_scraper.py`
- **Logs**: `train_ml/logs/gradcafe_scraper.log`

## Resources

- GradCafe: https://www.thegradcafe.com
- Playwright: https://playwright.dev/python
- MongoDB: https://docs.mongodb.com
- Pattern Reference: `profile_patterns.json`

---

**Last Updated**: 2025-01-12
