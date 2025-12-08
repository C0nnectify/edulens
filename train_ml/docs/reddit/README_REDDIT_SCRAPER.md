# Reddit Admission Results Scraper

A comprehensive Python scraper for extracting admission decisions and student profiles from Reddit's graduate admissions communities.

## Overview

This scraper targets r/gradadmissions and related subreddits to collect real-world admission data including:
- University decisions (accepted/rejected/waitlisted)
- Student profiles (GPA, test scores, research, work experience)
- Program details (MS, PhD, MBA, etc.)
- Funding information
- Application timelines

## Features

- **Multi-subreddit scraping**: 20+ predefined subreddits (grad schools, universities)
- **Intelligent extraction**: Regex patterns + Google Gemini AI for profile parsing
- **Profile detection**: GPA, GRE, GMAT, TOEFL, IELTS, SAT, ACT, work experience, publications
- **Decision classification**: Accepted, rejected, waitlisted, deferred
- **Funding detection**: Fellowship, assistantship, scholarship mentions
- **Deduplication**: SHA-256 hashing to prevent duplicate posts
- **MongoDB storage**: Persistent storage with indexing
- **Rate limiting**: Respects Reddit API limits
- **Rich CLI**: Progress bars, statistics, colored output
- **Export options**: JSON export for analysis

## Installation

### Prerequisites

- Python 3.9+
- MongoDB (local or Atlas)
- Reddit API credentials
- Google Gemini API key (optional, for AI extraction)

### Install Dependencies

```bash
cd /home/ismail/edulen/train_ml

# Install required packages
pip install praw pymongo google-generativeai rich

# Or using requirements.txt
pip install -r requirements.txt
```

Create `requirements.txt`:
```
praw>=7.7.1
pymongo>=4.6.0
google-generativeai>=0.3.0
rich>=13.7.0
```

## Setup

### 1. Reddit API Credentials

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in:
   - **Name**: EduLen Admission Scraper
   - **App type**: Script
   - **Description**: Scrape admission results for research
   - **About URL**: (leave blank)
   - **Redirect URI**: http://localhost:8080
4. Click "Create app"
5. Note your:
   - **Client ID**: Under the app name (looks like: `abc123XYZ`)
   - **Client Secret**: Shown as "secret" (looks like: `def456ABC-xyz789`)

### 2. Configure Credentials

Edit `/home/ismail/edulen/train_ml/reddit_config.json`:

```json
{
  "reddit_api": {
    "client_id": "YOUR_CLIENT_ID_HERE",
    "client_secret": "YOUR_CLIENT_SECRET_HERE",
    "user_agent": "EduLen Admission Scraper v1.0 (by /u/YOUR_USERNAME)",
    "username": "YOUR_REDDIT_USERNAME",
    "password": "YOUR_REDDIT_PASSWORD"
  },
  "gemini": {
    "api_key": "YOUR_GEMINI_API_KEY",
    "model": "gemini-1.5-flash"
  }
}
```

**Note**: Username/password are optional. The scraper works in read-only mode.

### 3. Google Gemini API (Optional)

1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `reddit_config.json`

Without Gemini, the scraper uses regex-only extraction (still effective for structured posts).

### 4. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB
sudo apt-get install mongodb  # Ubuntu/Debian

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**Option B: MongoDB Atlas** (Free tier)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `mongodb.uri` in `reddit_config.json`:
   ```json
   "mongodb": {
     "uri": "mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"
   }
   ```

## Usage

### Basic Commands

```bash
# Scrape r/gradadmissions (default 1000 posts)
python reddit_scraper.py --subreddit gradadmissions

# Scrape all main subreddits
python reddit_scraper.py --all-subs

# Scrape university-specific subreddits
python reddit_scraper.py --university-subs

# Scrape with keyword search
python reddit_scraper.py --subreddit gradadmissions --keyword "MIT accepted"

# Limit posts per subreddit
python reddit_scraper.py --all-subs --limit 500

# Filter by year range
python reddit_scraper.py --subreddit gradadmissions --years 2023-2024

# Export to JSON
python reddit_scraper.py --subreddit gradadmissions --export results.json

# Disable AI extraction (faster, regex only)
python reddit_scraper.py --subreddit gradadmissions --no-ai
```

### Advanced Examples

```bash
# Comprehensive scrape: all subreddits, 1000 posts each, export
python reddit_scraper.py --all-subs --limit 1000 --export full_results.json

# Target specific university
python reddit_scraper.py --keyword "Stanford PhD" --limit 500

# Recent decisions only
python reddit_scraper.py --subreddit gradadmissions --years 2024-2025 --keyword "decision"

# Scrape university subs for specific programs
python reddit_scraper.py --university-subs --keyword "CS admission" --limit 200
```

## Output Format

### MongoDB Document Structure

```json
{
  "_id": ObjectId("..."),
  "source": "reddit",
  "subreddit": "r/gradadmissions",
  "post_id": "abc123",
  "post_title": "Accepted to MIT CS PhD with full funding!",
  "post_url": "https://reddit.com/r/gradadmissions/comments/abc123/...",
  "author": "throwaway_applicant",
  "post_date": "2024-03-15T14:30:00",
  "university": "MIT",
  "program": "PhD in Computer Science",
  "decision": "Accepted",
  "profile": {
    "gpa": 3.87,
    "gre_scores": {
      "verbal": 165,
      "quant": 170,
      "aw": 5.0
    },
    "toefl": 115,
    "work_experience_years": 2,
    "research_pubs": 3,
    "undergrad_institution": "UC Berkeley",
    "is_international": false
  },
  "funding": "Full Funding",
  "post_content": "Just got my admission email! I'm so excited...",
  "upvotes": 125,
  "num_comments": 48,
  "flair": "Decision",
  "scraped_at": "2025-01-12T10:00:00"
}
```

### JSON Export Format

Same structure as MongoDB, exported as array:

```json
[
  {
    "source": "reddit",
    "subreddit": "r/gradadmissions",
    ...
  },
  {
    "source": "reddit",
    "subreddit": "r/MIT",
    ...
  }
]
```

## Subreddits Covered

### Main Subreddits (--all-subs)
- r/gradadmissions (primary source)
- r/cscareerquestions
- r/ApplyingToCollege
- r/MBA
- r/GradSchool
- r/gradschooladmissions
- r/premed
- r/lawschooladmissions

### University Subreddits (--university-subs)
- r/MIT, r/stanford, r/harvard
- r/berkeley, r/cmu, r/caltech
- r/columbia, r/princeton, r/yale
- r/cornell, r/UPenn, r/uchicago
- r/northwestern, r/jhu, r/duke
- r/brown, r/gatech, r/UIUC
- r/UMich, r/UCLA, r/UCSD

## Profile Extraction Patterns

The scraper uses comprehensive regex patterns to extract:

### Test Scores
- **GPA**: Various formats (3.85, GPA: 3.85, cGPA 3.85)
- **GRE**: Verbal (130-170), Quant (130-170), AW (0-6.0)
- **GMAT**: 200-800 scale
- **TOEFL**: 0-120 scale
- **IELTS**: 0-9.0 scale
- **SAT**: 400-1600 scale
- **ACT**: 1-36 scale

### Experience
- **Work Experience**: "2 years experience", "WE: 3 yrs"
- **Research**: "5 publications", "3 papers published"
- **International Status**: "international student", "from India", "F-1 visa"

### Decisions
- **Accepted**: "accepted", "admitted", "got in"
- **Rejected**: "rejected", "denial", "didn't get in"
- **Waitlisted**: "waitlisted", "wait list"
- **Deferred**: "deferred", "deferral"

## AI Extraction

When Gemini API is configured, the scraper uses AI for:

1. **Unstructured posts**: When regex fails to extract profile
2. **Complex formats**: Non-standard profile presentations
3. **Context understanding**: Implied information from narrative posts

The AI extraction prompt asks Gemini to return structured JSON with profile fields.

## Rate Limiting

The scraper respects Reddit API limits:

- **Default delay**: 2 seconds between requests
- **Configurable**: Edit `rate_limit_delay` in config
- **Reddit limits**: 60 requests per minute (PRAW handles this)

To avoid rate limits:
- Use smaller `--limit` values
- Increase `rate_limit_delay` in config
- Don't run multiple instances simultaneously

## Deduplication

The scraper prevents duplicate entries via:

1. **Post hashing**: SHA-256 of `post_id + author + title`
2. **MongoDB unique index**: On `post_id` field
3. **In-memory tracking**: `seen_posts` set during session

Duplicates are counted in statistics but not saved.

## Statistics Output

After scraping, the scraper displays:

```
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━┓
┃ Metric             ┃ Count ┃
┡━━━━━━━━━━━━━━━━━━━━╇━━━━━━━┩
│ Posts Checked      │ 1247  │
│ Relevant Posts     │ 382   │
│ Profiles Extracted │ 315   │
│ Saved to DB        │ 298   │
│ Duplicates Skipped │ 17    │
└────────────────────┴───────┘
```

## Querying MongoDB

### Connect to Database
```javascript
// Using mongosh
mongosh
use edulens
db.admission_results.find()
```

### Example Queries

```javascript
// Find all MIT acceptances
db.admission_results.find({
  university: "MIT",
  decision: "Accepted"
})

// Find profiles with high GRE scores
db.admission_results.find({
  "profile.gre_scores.quant": { $gte: 168 }
})

// Count decisions by university
db.admission_results.aggregate([
  { $group: { _id: "$university", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Find international students
db.admission_results.find({
  "profile.is_international": true
})

// Average GPA by university
db.admission_results.aggregate([
  { $match: { "profile.gpa": { $exists: true } } },
  { $group: { _id: "$university", avgGPA: { $avg: "$profile.gpa" } } },
  { $sort: { avgGPA: -1 } }
])
```

### Export from MongoDB

```bash
# Export to JSON
mongoexport --db=edulens --collection=admission_results --out=results.json

# Export to CSV
mongoexport --db=edulens --collection=admission_results --type=csv \
  --fields=university,program,decision,profile.gpa,profile.gre_scores.quant \
  --out=results.csv
```

## Troubleshooting

### Reddit API Errors

**Error**: `Invalid credentials`
- Check `client_id` and `client_secret` in config
- Ensure no extra spaces in credentials
- Verify app type is "Script" on Reddit

**Error**: `429 Too Many Requests`
- Increase `rate_limit_delay` in config
- Reduce `--limit` value
- Wait 10 minutes before retrying

### MongoDB Errors

**Error**: `Connection refused`
- Check MongoDB is running: `sudo systemctl status mongodb`
- Verify `mongodb.uri` in config
- Test connection: `mongosh`

**Error**: `Duplicate key error`
- This is normal - post already exists
- Counted in "Duplicates Skipped" statistic

### Extraction Issues

**Low extraction rate**:
- Enable AI extraction (configure Gemini API)
- Check `reddit_patterns.json` for pattern updates
- Some posts don't contain structured profiles

**AI extraction fails**:
- Verify Gemini API key is valid
- Check internet connection
- AI has rate limits - reduce frequency

## Best Practices

1. **Start small**: Test with `--limit 100` before large scrapes
2. **Use keywords**: Target specific posts with `--keyword`
3. **Regular scraping**: Run weekly to catch new posts
4. **Respect rate limits**: Don't hammer the API
5. **Check data quality**: Review extracted profiles manually
6. **Backup database**: Export results regularly
7. **Update patterns**: Add new universities/patterns as needed

## Data Privacy

This scraper collects publicly available Reddit posts. However:

- **Anonymization**: Consider removing/hashing usernames for analysis
- **Ethics**: Use data responsibly for research/education
- **Terms of Service**: Comply with Reddit's API Terms
- **Personal info**: Don't scrape/store personal identifiable information

## Extending the Scraper

### Add New Subreddits

Edit `reddit_config.json`:
```json
{
  "subreddits": {
    "main": [
      "gradadmissions",
      "YOUR_NEW_SUBREDDIT"
    ]
  }
}
```

### Add New Patterns

Edit `reddit_patterns.json`:
```json
{
  "your_pattern_name": [
    "regex_pattern_1",
    "regex_pattern_2"
  ]
}
```

### Customize Extraction

Modify `ProfileExtractor` class methods in `reddit_scraper.py`:
- `extract_gpa()` - GPA extraction logic
- `extract_gre_scores()` - GRE extraction logic
- `extract_profile_with_ai()` - AI prompt customization

## Performance

### Scraping Speed
- **Regex only**: ~2 seconds per post (rate limit)
- **With AI**: ~4 seconds per post (API calls)
- **1000 posts**: ~30-60 minutes

### Optimization Tips
1. Disable AI with `--no-ai` for speed
2. Use specific keywords to filter posts
3. Scrape university subs separately (smaller, focused)
4. Run overnight for large scrapes

## License

MIT License - See project root for details

## Support

For issues or questions:
- Check MongoDB logs: `sudo journalctl -u mongodb`
- Check Reddit API status: https://www.redditstatus.com
- Review PRAW documentation: https://praw.readthedocs.io

## Changelog

### v1.0.0 (2025-01-12)
- Initial release
- Multi-subreddit scraping
- Regex and AI extraction
- MongoDB integration
- CLI interface with rich output
- JSON export
- Deduplication
- Statistics tracking
