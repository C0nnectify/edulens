# Faculty Scraper - Quick Start Guide

Get up and running with the faculty scraper in 5 minutes.

## Prerequisites

- Python 3.9+
- MongoDB running locally or remote
- Google API Key (free tier works)

## Installation

### 1. Run Setup Script

```bash
cd /home/ismail/edulen/train_ml
chmod +x setup.sh
./setup.sh
```

This will:
- Create a virtual environment
- Install all dependencies
- Copy `.env.example` to `.env`
- Check MongoDB connection

### 2. Configure Environment

Edit `.env` file:

```bash
nano .env
```

Add your API keys:

```env
GOOGLE_API_KEY=your-actual-google-api-key
FIRECRAWL_API_KEY=your-firecrawl-key  # Optional
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens
```

**Get API Keys**:
- Google API Key: https://makersuite.google.com/app/apikey
- Firecrawl Key: https://firecrawl.dev (optional)

### 3. Start MongoDB

If MongoDB isn't running:

```bash
# Ubuntu/Debian
sudo systemctl start mongodb

# macOS (Homebrew)
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Usage

### Test with Single University

Start small to test everything works:

```bash
source venv/bin/activate
python faculty_scraper.py --university mit
```

This will:
- Scrape MIT Computer Science faculty
- Save to MongoDB
- Show progress with rich output

### Scrape All Universities

Once tested, scrape all 20 universities:

```bash
python faculty_scraper.py --all
```

**Estimated time**: 2-4 hours for all universities

### Resume if Interrupted

If scraping is interrupted:

```bash
python faculty_scraper.py --all --resume
```

This skips already completed universities.

### Export Results

Export all data to JSON:

```bash
python faculty_scraper.py --all --export faculty_data.json
```

## Verify Results

### Check MongoDB

```bash
mongosh mongodb://localhost:27017/edulens
```

```javascript
// Count total faculty
db.faculty_data.countDocuments({})

// View sample faculty
db.faculty_data.findOne()

// Count by university
db.faculty_data.aggregate([
  { $group: { _id: "$university_name", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Run Examples

```bash
python example_usage.py
```

This demonstrates various queries and analysis.

## Common Issues

### MongoDB Connection Error

```
Error: MongoClient cannot connect
```

**Solution**:
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Start if not running
sudo systemctl start mongodb
```

### Google API Quota Exceeded

```
Error: 429 Resource exhausted
```

**Solution**:
- Wait for quota reset (1 minute for free tier)
- Increase `rate_limit_delay` in `university_config.json`
- Upgrade to paid Google API plan

### No Faculty Extracted

```
Warning: No faculty found for [university]
```

**Possible causes**:
1. University website changed structure
2. CSS selectors are incorrect
3. Website blocks scrapers

**Solution**:
- Check URL in `university_config.json`
- Remove selectors to force AI extraction
- Ensure Firecrawl API key is set

### Import Error

```
ModuleNotFoundError: No module named 'firecrawl'
```

**Solution**:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

## Next Steps

### 1. Analyze Data

Run analysis scripts:

```bash
python example_usage.py
```

### 2. Integrate with EduLen

Use scraped data in your application:

```typescript
// In Next.js API route
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

const faculty = await client
  .db('edulens')
  .collection('faculty_data')
  .find({ research_areas: { $in: ['AI', 'ML'] } })
  .limit(10)
  .toArray();
```

### 3. Customize Configuration

Edit `university_config.json` to:
- Add new universities
- Update URLs
- Adjust rate limiting
- Add CSS selectors

### 4. Schedule Regular Updates

Add to crontab for monthly updates:

```bash
crontab -e
```

Add:
```
0 2 1 * * cd /home/ismail/edulen/train_ml && ./venv/bin/python faculty_scraper.py --all --resume
```

## CLI Reference

```bash
# Scrape single university
python faculty_scraper.py --university <id>

# Scrape specific department
python faculty_scraper.py --university <id> --department <code>

# Scrape all universities
python faculty_scraper.py --all

# Resume scraping
python faculty_scraper.py --all --resume

# Export to JSON
python faculty_scraper.py --all --export <file.json>

# Custom config
python faculty_scraper.py --all --config <config.json> --progress <progress.json>

# Help
python faculty_scraper.py --help
```

## Performance Tips

1. **Use Firecrawl**: Set `FIRECRAWL_API_KEY` for faster, more reliable scraping
2. **Adjust rate limiting**: Lower `rate_limit_delay` if you're not being blocked
3. **Run at off-peak hours**: Less likely to be rate-limited
4. **Resume capability**: Use `--resume` to avoid re-scraping
5. **MongoDB indexes**: Already created automatically for fast queries

## Data Usage Examples

### Find professors by research area

```python
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['edulens']

# Find ML researchers
ml_profs = db.faculty_data.find({
    'research_areas': {'$in': ['Machine Learning', 'AI']}
})

for prof in ml_profs:
    print(f"{prof['name']} - {prof['university_name']}")
```

### Generate email list

```python
# Get all emails for specific university
mit_emails = db.faculty_data.find(
    {'university_id': 'mit'},
    {'name': 1, 'email': 1, '_id': 0}
)

for faculty in mit_emails:
    print(f"{faculty['name']}: {faculty['email']}")
```

### Match students with professors

```python
student_interests = ['NLP', 'Machine Learning', 'AI']

matches = db.faculty_data.find({
    'research_areas': {'$in': student_interests}
}).limit(10)

for match in matches:
    print(f"{match['name']} ({match['university_name']})")
    print(f"  Research: {', '.join(match['research_areas'])}")
```

## Support

- Documentation: `README_FACULTY_SCRAPER.md`
- Examples: `example_usage.py`
- Tests: `pytest test_faculty_scraper.py`

## Updates

Check for configuration updates:

```bash
cd /home/ismail/edulen/train_ml
git pull origin main
```

Update dependencies:

```bash
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

---

**Happy Scraping!** 🎓

For detailed documentation, see `README_FACULTY_SCRAPER.md`
