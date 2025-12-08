# Reddit Scraper - Quick Start Guide

Get up and running with the Reddit Admission Results Scraper in 5 minutes.

## 1. Install Dependencies

```bash
cd /home/ismail/edulen/train_ml

# Install Python packages
pip install praw pymongo google-generativeai rich

# Or use requirements.txt
pip install -r requirements.txt
```

## 2. Get Reddit API Credentials

### Step-by-Step:

1. **Login to Reddit**
   - Go to https://www.reddit.com/
   - Login with your account (create one if needed)

2. **Create App**
   - Visit https://www.reddit.com/prefs/apps
   - Scroll to bottom, click "Create App" or "Create Another App"

3. **Fill Form**:
   - **Name**: `EduLen Scraper` (or any name)
   - **App type**: Select **"script"**
   - **Description**: `Scrape admission data for research`
   - **About URL**: Leave blank
   - **Redirect URI**: `http://localhost:8080`

4. **Get Credentials**:
   - Click "Create app"
   - **Client ID**: Small text under app name (e.g., `dkj3h4kj2h3`)
   - **Client Secret**: Next to "secret:" (e.g., `asdkj23h4kj2h3k4j2h3k4j`)

## 3. Configure Credentials

Edit `reddit_config.json`:

```json
{
  "reddit_api": {
    "client_id": "YOUR_CLIENT_ID_HERE",
    "client_secret": "YOUR_CLIENT_SECRET_HERE",
    "user_agent": "EduLen Scraper v1.0 (by /u/YOUR_USERNAME)",
    "username": "your_reddit_username",
    "password": "your_reddit_password"
  }
}
```

**Note**: Username/password are optional - the scraper works read-only.

## 4. Start MongoDB

### Option A: Local MongoDB
```bash
# Install
sudo apt-get install mongodb  # Ubuntu/Debian
brew install mongodb-community  # macOS

# Start
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS
```

### Option B: MongoDB Atlas (Free Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free tier
3. Create cluster
4. Get connection string
5. Update `reddit_config.json`:
   ```json
   "mongodb": {
     "uri": "mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority"
   }
   ```

## 5. Test Setup

```bash
python test_reddit_scraper.py
```

This will verify:
- Configuration files are valid
- MongoDB is accessible
- Pattern extraction works

## 6. Run First Scrape

```bash
# Start small - test with 10 posts
python reddit_scraper.py --subreddit gradadmissions --limit 10

# If successful, scale up
python reddit_scraper.py --subreddit gradadmissions --limit 100
```

## 7. View Results

### In Terminal:
```bash
python analyze_results.py
```

### In MongoDB:
```bash
mongosh
use edulens
db.admission_results.find().limit(5).pretty()
```

### Export to JSON:
```bash
python reddit_scraper.py --subreddit gradadmissions --export results.json
```

## Common Commands

```bash
# Scrape main admission subreddits
python reddit_scraper.py --all-subs --limit 500

# Search for specific university
python reddit_scraper.py --keyword "MIT accepted" --limit 200

# Scrape university subreddits
python reddit_scraper.py --university-subs --limit 300

# Filter by year
python reddit_scraper.py --subreddit gradadmissions --years 2024-2025

# Disable AI (faster, regex only)
python reddit_scraper.py --subreddit gradadmissions --no-ai

# Export and analyze
python reddit_scraper.py --all-subs --export data.json
python analyze_results.py --export analysis.json
```

## Troubleshooting

### "Invalid credentials"
- Double-check `client_id` and `client_secret` in config
- Ensure app type is "script" on Reddit
- No extra spaces in credentials

### "Connection refused" (MongoDB)
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb
```

### "Rate limit exceeded"
- Wait 10 minutes
- Increase `rate_limit_delay` in config to 3-5 seconds
- Use smaller `--limit` values

### "No results found"
- Some posts don't have structured profiles
- Try different subreddits: `--all-subs`
- Use broader keywords: `--keyword "accepted"`

## Optional: Gemini AI Setup

For better extraction of unstructured posts:

1. Get API key: https://makersuite.google.com/app/apikey
2. Add to `reddit_config.json`:
   ```json
   "gemini": {
     "api_key": "YOUR_GEMINI_API_KEY"
   }
   ```

Without Gemini, the scraper still works well with regex patterns.

## Next Steps

1. **Scrape systematically**:
   ```bash
   # Morning: grad schools
   python reddit_scraper.py --all-subs --limit 1000

   # Afternoon: university subs
   python reddit_scraper.py --university-subs --limit 500
   ```

2. **Analyze data**:
   ```bash
   python analyze_results.py
   ```

3. **Export for ML**:
   ```bash
   mongoexport --db=edulens --collection=admission_results --out=training_data.json
   ```

4. **Schedule regular scraping** (Linux/macOS):
   ```bash
   # Add to crontab
   crontab -e

   # Run daily at 2 AM
   0 2 * * * cd /home/ismail/edulen/train_ml && python reddit_scraper.py --all-subs --limit 500
   ```

## File Structure

```
train_ml/
├── reddit_scraper.py          # Main scraper
├── reddit_config.json         # Configuration (credentials, settings)
├── reddit_patterns.json       # Extraction patterns (regex)
├── test_reddit_scraper.py     # Test suite
├── analyze_results.py         # Analysis tools
├── requirements.txt           # Python dependencies
├── README_REDDIT_SCRAPER.md   # Full documentation
└── QUICK_START_REDDIT.md      # This file
```

## Support

- **Full docs**: See `README_REDDIT_SCRAPER.md`
- **Test extraction**: Run `test_reddit_scraper.py`
- **Check MongoDB**: Run `python analyze_results.py`
- **Reddit API docs**: https://www.reddit.com/dev/api
- **PRAW docs**: https://praw.readthedocs.io

Happy scraping!
