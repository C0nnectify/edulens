# Reddit Scraper - Usage Examples

Comprehensive examples for different scraping scenarios.

## Basic Usage

### 1. Test Run (Start Here)
```bash
# Scrape just 10 posts to test setup
python reddit_scraper.py --subreddit gradadmissions --limit 10
```

### 2. Single Subreddit
```bash
# Scrape r/gradadmissions with 500 posts
python reddit_scraper.py --subreddit gradadmissions --limit 500

# Export to JSON
python reddit_scraper.py --subreddit gradadmissions --limit 500 --export results.json
```

### 3. Multiple Subreddits
```bash
# Scrape all main admission subreddits
python reddit_scraper.py --all-subs --limit 1000

# Scrape university-specific subreddits
python reddit_scraper.py --university-subs --limit 500
```

## Advanced Filtering

### 4. Keyword Search
```bash
# Search for MIT acceptances
python reddit_scraper.py --keyword "MIT accepted"

# Search for PhD admissions
python reddit_scraper.py --keyword "PhD admitted" --limit 500

# Search for MS CS programs
python reddit_scraper.py --keyword "MS CS" --all-subs
```

### 5. Time-Based Filtering
```bash
# Only 2024 decisions
python reddit_scraper.py --subreddit gradadmissions --years 2024-2024

# Last 3 years
python reddit_scraper.py --subreddit gradadmissions --years 2022-2024

# Recent cycle
python reddit_scraper.py --all-subs --years 2024-2025 --limit 1000
```

### 6. University-Specific
```bash
# Target specific university
python reddit_scraper.py --keyword "Stanford" --university-subs

# Ivy League schools
python reddit_scraper.py --keyword "Harvard Yale Princeton" --limit 500

# Tech schools
python reddit_scraper.py --keyword "MIT CMU Berkeley" --all-subs
```

## Performance Optimization

### 7. Fast Scraping (Regex Only)
```bash
# Disable AI for faster processing
python reddit_scraper.py --subreddit gradadmissions --limit 1000 --no-ai

# Good for structured posts (most r/gradadmissions posts)
python reddit_scraper.py --all-subs --limit 2000 --no-ai
```

### 8. Comprehensive Scraping (AI Enabled)
```bash
# Use AI for better extraction (slower)
python reddit_scraper.py --all-subs --limit 500

# AI helps with unstructured posts
python reddit_scraper.py --university-subs --limit 300
```

## Real-World Scenarios

### 9. Daily Update Script
```bash
#!/bin/bash
# Save as daily_scrape.sh

DATE=$(date +%Y%m%d)
LOG_FILE="logs/scrape_${DATE}.log"

echo "Starting daily scrape: $(date)" | tee -a $LOG_FILE

# Scrape main subreddits
python reddit_scraper.py \
  --all-subs \
  --limit 200 \
  --years 2024-2025 \
  --export "data/daily_${DATE}.json" \
  2>&1 | tee -a $LOG_FILE

echo "Scrape completed: $(date)" | tee -a $LOG_FILE

# Analyze results
python analyze_results.py --export "analysis/analysis_${DATE}.json"
```

### 10. Target Program Analysis
```bash
# Collect CS PhD data
python reddit_scraper.py \
  --keyword "CS PhD" \
  --all-subs \
  --limit 1000 \
  --export cs_phd_admissions.json

# Analyze
python analyze_results.py
```

### 11. University Comparison
```bash
# Scrape multiple specific universities
for uni in "MIT" "Stanford" "Berkeley" "CMU"; do
  python reddit_scraper.py \
    --keyword "$uni" \
    --all-subs \
    --limit 500 \
    --export "data/${uni}_admissions.json"
done

# Combined analysis
python analyze_results.py --export university_comparison.json
```

### 12. Cycle Tracking
```bash
# Track 2024-2025 admission cycle
python reddit_scraper.py \
  --all-subs \
  --years 2024-2025 \
  --keyword "admitted accepted" \
  --limit 2000 \
  --export cycle_2024_2025.json
```

## Data Analysis

### 13. View Statistics
```bash
# Print comprehensive analysis
python analyze_results.py

# Export analysis to JSON
python analyze_results.py --export analysis.json
```

### 14. MongoDB Queries
```javascript
// Connect to MongoDB
mongosh
use edulens

// Count total results
db.admission_results.countDocuments()

// Find MIT acceptances
db.admission_results.find({
  university: "MIT",
  decision: "Accepted"
}).limit(10)

// GPA distribution
db.admission_results.aggregate([
  { $match: { "profile.gpa": { $exists: true } } },
  { $bucket: {
    groupBy: "$profile.gpa",
    boundaries: [3.0, 3.3, 3.5, 3.7, 3.9, 4.0],
    default: "Other",
    output: { count: { $sum: 1 } }
  }}
])

// Top universities by applications
db.admission_results.aggregate([
  { $group: { _id: "$university", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 20 }
])

// Average GRE by university
db.admission_results.aggregate([
  { $match: {
    university: { $exists: true },
    "profile.gre_scores.quant": { $exists: true }
  }},
  { $group: {
    _id: "$university",
    avgQuant: { $avg: "$profile.gre_scores.quant" },
    avgVerbal: { $avg: "$profile.gre_scores.verbal" },
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 } },
  { $limit: 15 }
])
```

### 15. Export Filtered Data
```bash
# Export only acceptances
mongoexport --db=edulens \
  --collection=admission_results \
  --query='{"decision":"Accepted"}' \
  --out=acceptances.json

# Export with profiles
mongoexport --db=edulens \
  --collection=admission_results \
  --query='{"profile.gpa":{"$exists":true}}' \
  --out=profiles.json

# Export to CSV
mongoexport --db=edulens \
  --collection=admission_results \
  --type=csv \
  --fields=university,program,decision,profile.gpa,profile.gre_scores.quant,upvotes \
  --out=results.csv
```

## Automation

### 16. Scheduled Scraping (Cron)
```bash
# Edit crontab
crontab -e

# Add these lines:

# Daily scrape at 2 AM
0 2 * * * cd /home/ismail/edulen/train_ml && python reddit_scraper.py --all-subs --limit 200

# Weekly comprehensive scrape (Sunday 3 AM)
0 3 * * 0 cd /home/ismail/edulen/train_ml && python reddit_scraper.py --all-subs --limit 1000 --export weekly_$(date +\%Y\%m\%d).json

# Monthly university scrape
0 4 1 * * cd /home/ismail/edulen/train_ml && python reddit_scraper.py --university-subs --limit 500
```

### 17. Automated Analysis Script
```python
#!/usr/bin/env python3
# weekly_report.py

from analyze_results import AdmissionAnalyzer
from datetime import datetime

analyzer = AdmissionAnalyzer()

# Generate report
report_date = datetime.now().strftime("%Y-%m-%d")
print(f"Weekly Admission Report - {report_date}")
print("=" * 60)

analyzer.print_summary()
analyzer.export_analysis(f"reports/weekly_{report_date}.json")

# Email report (optional - add your email logic)
```

### 18. Monitor for New Posts
```python
#!/usr/bin/env python3
# monitor_new.py - Real-time monitoring

import praw
import time
from reddit_scraper import RedditScraper, ProfileExtractor

scraper = RedditScraper()

subreddit = scraper.reddit.subreddit("gradadmissions")

print("Monitoring r/gradadmissions for new posts...")

for submission in subreddit.stream.submissions():
    if scraper._is_relevant_post(submission):
        print(f"\nNew relevant post: {submission.title}")
        data = scraper._extract_post_data(submission)
        if data:
            scraper.db.insert_one(data)
            print("Saved to database!")
    time.sleep(2)
```

## Machine Learning Preparation

### 19. Export Training Data
```python
#!/usr/bin/env python3
# prepare_ml_data.py

from pymongo import MongoClient
import json
import pandas as pd

client = MongoClient('mongodb://localhost:27017')
db = client['edulens']
collection = db['admission_results']

# Get all results with profiles
results = list(collection.find({
    "profile.gpa": {"$exists": True},
    "decision": {"$in": ["Accepted", "Rejected"]}
}))

# Convert to DataFrame
data = []
for r in results:
    profile = r.get('profile', {})
    data.append({
        'university': r.get('university'),
        'program': r.get('program'),
        'gpa': profile.get('gpa'),
        'gre_quant': profile.get('gre_scores', {}).get('quant'),
        'gre_verbal': profile.get('gre_scores', {}).get('verbal'),
        'work_exp': profile.get('work_experience_years'),
        'research_pubs': profile.get('research_pubs'),
        'is_international': profile.get('is_international'),
        'decision': 1 if r.get('decision') == 'Accepted' else 0
    })

df = pd.DataFrame(data)
df.to_csv('ml_training_data.csv', index=False)
print(f"Exported {len(df)} records for ML training")
```

### 20. Profile Completeness Check
```python
#!/usr/bin/env python3
# check_data_quality.py

from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['edulens']
collection = db['admission_results']

total = collection.count_documents({})

fields = [
    'university',
    'program',
    'profile.gpa',
    'profile.gre_scores',
    'profile.work_experience_years',
    'profile.research_pubs'
]

print("Data Completeness Report")
print("=" * 60)
print(f"Total Records: {total}\n")

for field in fields:
    count = collection.count_documents({field: {"$exists": True, "$ne": None}})
    pct = (count / total * 100) if total > 0 else 0
    print(f"{field:40} {count:6} ({pct:5.1f}%)")
```

## Troubleshooting Examples

### 21. Check Rate Limiting
```bash
# Increase delay between requests
# Edit reddit_config.json:
# "rate_limit_delay": 5

# Then run with smaller batches
python reddit_scraper.py --subreddit gradadmissions --limit 100
```

### 22. Verify Extraction
```bash
# Run test suite
python test_reddit_scraper.py

# Check specific patterns
python -c "
from reddit_scraper import ProfileExtractor
import json

with open('reddit_patterns.json') as f:
    patterns = json.load(f)

extractor = ProfileExtractor(patterns)

text = 'GPA: 3.85, GRE: 170Q 165V'
profile = extractor.extract_full_profile(text)
print(profile)
"
```

### 23. Debug MongoDB Connection
```bash
# Test connection
python -c "
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=5000)
print('Databases:', client.list_database_names())
"

# Check collection
mongosh
use edulens
db.admission_results.countDocuments()
db.admission_results.findOne()
```

## Best Practices

### 24. Production Scraping Workflow
```bash
#!/bin/bash
# production_scrape.sh

# 1. Test connection
python test_reddit_scraper.py

# 2. Small test run
python reddit_scraper.py --subreddit gradadmissions --limit 10

# 3. Main scrape
python reddit_scraper.py --all-subs --limit 1000 --export "data/$(date +%Y%m%d).json"

# 4. Analyze
python analyze_results.py --export "analysis/$(date +%Y%m%d).json"

# 5. Backup database
mongoexport --db=edulens --collection=admission_results --out="backup/$(date +%Y%m%d).json"

# 6. Verify results
echo "Total records in database:"
mongosh edulens --eval "db.admission_results.countDocuments()"
```

### 25. Data Validation
```python
#!/usr/bin/env python3
# validate_data.py

from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['edulens']
collection = db['admission_results']

# Check for invalid GPAs
invalid_gpa = collection.count_documents({
    "profile.gpa": {"$not": {"$gte": 0.0, "$lte": 4.0}}
})

# Check for invalid GRE scores
invalid_gre = collection.count_documents({
    "$or": [
        {"profile.gre_scores.quant": {"$not": {"$gte": 130, "$lte": 170}}},
        {"profile.gre_scores.verbal": {"$not": {"$gte": 130, "$lte": 170}}}
    ]
})

print(f"Invalid GPA records: {invalid_gpa}")
print(f"Invalid GRE records: {invalid_gre}")

# Fix common issues
collection.update_many(
    {"profile.gpa": {"$gt": 4.0}},
    {"$set": {"profile.gpa": None}}
)
```

## Additional Resources

- **Full Documentation**: `README_REDDIT_SCRAPER.md`
- **Quick Start**: `QUICK_START_REDDIT.md`
- **Test Suite**: `test_reddit_scraper.py`
- **Analysis Tools**: `analyze_results.py`

## Tips

1. **Start small**: Test with `--limit 10-50` first
2. **Use keywords**: More specific = better results
3. **Check MongoDB**: Verify data after each run
4. **Respect limits**: Don't overwhelm Reddit API
5. **Regular backups**: Export data frequently
6. **Monitor quality**: Use `analyze_results.py` to check completeness
7. **Update patterns**: Add new universities/programs as needed
8. **AI optional**: Regex works great for structured posts
9. **Schedule wisely**: Run during off-peak hours
10. **Document changes**: Keep notes on what works

Happy scraping!
