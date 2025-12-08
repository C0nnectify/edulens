# Reddit API Authentication Setup Guide

Complete step-by-step guide to set up Reddit API access for the scraper.

## Why You Need Reddit API Credentials

Reddit requires authentication for all API access, even for reading public posts. The credentials identify your application to Reddit's servers and enable:

- Access to post data, comments, and subreddit information
- Rate limiting (60 requests/minute with authentication vs 10/minute without)
- Compliance with Reddit's Terms of Service

## Step-by-Step Setup

### Step 1: Create or Login to Reddit Account

1. Go to https://www.reddit.com
2. If you don't have an account:
   - Click "Sign Up"
   - Enter email, username, and password
   - Verify email if required
3. Login to your account

**Note**: You can use a throwaway account - the scraper only reads public data.

### Step 2: Navigate to App Preferences

1. Once logged in, go to: https://www.reddit.com/prefs/apps
2. Alternatively:
   - Click your username (top right)
   - Go to "User Settings"
   - Click "Safety & Privacy"
   - Scroll to bottom, find "Apps" section
   - Click "Manage third-party app authorization"
   - Or directly visit https://old.reddit.com/prefs/apps/

### Step 3: Create Application

1. Scroll to the bottom of the page
2. Click **"Create App"** or **"Create Another App"** button

### Step 4: Fill Application Form

Fill in the following details:

#### Name
```
EduLen Admission Scraper
```
*You can use any name - this is just for your reference*

#### App Type
Select: **"script"**

Important: Must be "script", not "web app" or "installed app"

#### Description
```
Research tool to scrape admission results from graduate admission subreddits for educational data analysis
```
*Optional but recommended*

#### About URL
Leave **blank** (optional field)

#### Redirect URI
```
http://localhost:8080
```
*Required field even though we don't use it for scripts*

#### Permissions
No checkboxes to select - scripts have read-only access by default

### Step 5: Create App

Click the **"Create app"** button at the bottom

### Step 6: Get Your Credentials

After creation, you'll see your app listed with these details:

#### Client ID
- Located **under the app name**
- Looks like: `dkj3h4kj2h3k4j` (14 characters)
- This is NOT the app name

Example:
```
EduLen Admission Scraper              <-- App name
personal use script                    <-- App type
dkj3h4kj2h3k4j                        <-- CLIENT ID (this is what you need)
secret  • regenerate                   <-- Client secret below
```

#### Client Secret
- Located next to the word **"secret"**
- Looks like: `asdkj23h4kj2h3k4j2h3k4j2h3` (27 characters)
- Click the text to reveal it

### Step 7: Configure Scraper

1. Open `reddit_config.json` in the `train_ml` directory:
   ```bash
   cd /home/ismail/edulen/train_ml
   nano reddit_config.json
   # or use your preferred editor
   ```

2. Replace the placeholder values:
   ```json
   {
     "reddit_api": {
       "client_id": "dkj3h4kj2h3k4j",           // Your Client ID here
       "client_secret": "asdkj23h4kj2h3k4j2h3k4j2h3",  // Your Client Secret here
       "user_agent": "EduLen Admission Scraper v1.0 (by /u/your_username)",
       "username": "your_reddit_username",       // Optional
       "password": "your_reddit_password"        // Optional
     }
   }
   ```

3. **Important**:
   - Replace `your_username` in `user_agent` with your Reddit username
   - Username and password fields are optional
   - The scraper works in read-only mode without password authentication

### Step 8: Verify Setup

Run the test script:
```bash
cd /home/ismail/edulen/train_ml
python test_reddit_scraper.py
```

You should see:
```
Configuration Status
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━┓
┃ Check              ┃ Status            ┃
┡━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━┩
│ Reddit Client ID   │ ✓ Configured      │
│ Reddit Client Se.. │ ✓ Configured      │
└────────────────────┴───────────────────┘
```

### Step 9: Test Scraping

Try a small test scrape:
```bash
python reddit_scraper.py --subreddit gradadmissions --limit 5
```

If successful, you'll see:
```
Scraping r/gradadmissions
Processing posts... ━━━━━━━━━━━━━━━━━━ 100% 0:00:10
Found 3 results from r/gradadmissions
```

## Complete Configuration Example

Here's a fully configured `reddit_config.json`:

```json
{
  "reddit_api": {
    "client_id": "abc123XYZ456",
    "client_secret": "xyz789ABC012def345GHI678",
    "user_agent": "EduLen Admission Scraper v1.0 (by /u/john_doe)",
    "username": "john_doe",
    "password": "my_secure_password"
  },
  "subreddits": {
    "main": [
      "gradadmissions",
      "cscareerquestions",
      "ApplyingToCollege",
      "MBA"
    ],
    "universities": [
      "MIT",
      "stanford",
      "harvard"
    ]
  },
  "search_config": {
    "keywords": [
      "decision",
      "accepted",
      "rejected"
    ],
    "year_range": {
      "start": 2020,
      "end": 2025
    }
  },
  "mongodb": {
    "uri": "mongodb://localhost:27017",
    "database": "edulens",
    "collection": "admission_results"
  },
  "gemini": {
    "api_key": "AIzaSyABC123XYZ789",
    "model": "gemini-1.5-flash"
  }
}
```

## Security Best Practices

### 1. Keep Credentials Private

**DO**:
- Store credentials in `reddit_config.json`
- Add `reddit_config.json` to `.gitignore`
- Use environment variables for production

**DON'T**:
- Commit credentials to Git
- Share credentials publicly
- Hardcode credentials in scripts

### 2. Use Environment Variables (Production)

Create `.env` file:
```bash
REDDIT_CLIENT_ID=abc123XYZ456
REDDIT_CLIENT_SECRET=xyz789ABC012def345GHI678
REDDIT_USER_AGENT="EduLen Scraper v1.0"
```

Load in Python:
```python
import os
from dotenv import load_dotenv

load_dotenv()

reddit = praw.Reddit(
    client_id=os.getenv('REDDIT_CLIENT_ID'),
    client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
    user_agent=os.getenv('REDDIT_USER_AGENT')
)
```

### 3. Limit Permissions

- Use read-only scripts (no posting/commenting)
- Don't request unnecessary permissions
- Create separate apps for different purposes

### 4. Rotate Credentials

If credentials are compromised:
1. Go to https://www.reddit.com/prefs/apps
2. Click "edit" on your app
3. Click "regenerate secret"
4. Update `reddit_config.json` with new secret

## Troubleshooting

### Error: "Invalid credentials"

**Cause**: Wrong client_id or client_secret

**Solution**:
1. Double-check credentials on https://www.reddit.com/prefs/apps
2. Ensure no extra spaces or quotes
3. Verify you copied the correct fields:
   - Client ID is under app name (14 chars)
   - Client secret is next to "secret" (27 chars)

### Error: "401 Unauthorized"

**Cause**: Incorrect username/password or app type

**Solution**:
1. Remove username/password from config (optional fields)
2. Verify app type is "script" not "web app"
3. Try regenerating client secret

### Error: "429 Too Many Requests"

**Cause**: Rate limit exceeded

**Solution**:
1. Wait 10 minutes
2. Increase `rate_limit_delay` in config to 5 seconds
3. Reduce `--limit` parameter

### Error: "403 Forbidden"

**Cause**: Subreddit is private or banned

**Solution**:
1. Check if subreddit exists: https://reddit.com/r/subreddit_name
2. Try a different subreddit
3. Ensure subreddit name is correct (case-sensitive)

### Warning: "Gemini API key not configured"

**Cause**: Gemini API key missing (optional)

**Solution**:
1. This is OK - regex extraction still works
2. To enable AI: Get key from https://makersuite.google.com/app/apikey
3. Add to `reddit_config.json` under `gemini.api_key`

## Rate Limits & Best Practices

### Reddit API Limits

- **With Authentication**: 60 requests/minute
- **Without**: 10 requests/minute
- **Burst**: ~100 requests then rate limited

### Staying Within Limits

1. **Use Default Delay**:
   ```json
   "rate_limit_delay": 2  // 2 seconds = 30 requests/min
   ```

2. **Start Small**:
   ```bash
   python reddit_scraper.py --subreddit gradadmissions --limit 50
   ```

3. **Schedule Off-Peak**:
   - Run scraping during night hours
   - Distribute throughout the day

4. **Monitor Usage**:
   - PRAW automatically handles rate limiting
   - Watch for 429 errors in output

## Optional: Gemini API Setup

For enhanced profile extraction from unstructured posts:

### Step 1: Get Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Select or create a project
5. Copy the API key (starts with `AIzaSy...`)

### Step 2: Add to Config

```json
{
  "gemini": {
    "api_key": "AIzaSyABC123XYZ789...",
    "model": "gemini-1.5-flash",
    "temperature": 0.1
  }
}
```

### Step 3: Test

```bash
python test_reddit_scraper.py
```

Look for: "AI extraction enabled" message

## Alternative: Using .env File

Instead of editing `reddit_config.json`, you can use environment variables:

### Create .env file

```bash
cd /home/ismail/edulen/train_ml
cp .env.example .env
nano .env
```

### Add credentials:

```env
REDDIT_CLIENT_ID=abc123XYZ456
REDDIT_CLIENT_SECRET=xyz789ABC012def345GHI678
REDDIT_USER_AGENT="EduLen Scraper v1.0 (by /u/your_username)"
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password

GEMINI_API_KEY=AIzaSyABC123XYZ789

MONGODB_URI=mongodb://localhost:27017
```

### Modify scraper to use .env:

```python
# Add to top of reddit_scraper.py
from dotenv import load_dotenv
import os

load_dotenv()

# Then in _init_reddit():
return praw.Reddit(
    client_id=os.getenv('REDDIT_CLIENT_ID'),
    client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
    user_agent=os.getenv('REDDIT_USER_AGENT'),
    username=os.getenv('REDDIT_USERNAME'),
    password=os.getenv('REDDIT_PASSWORD')
)
```

## FAQ

### Q: Do I need a username and password?

**A**: No, they're optional. The scraper works in read-only mode with just client_id and client_secret.

### Q: Can I use a throwaway account?

**A**: Yes, any Reddit account works. The scraper only reads public posts.

### Q: How long do credentials last?

**A**: Indefinitely, unless you regenerate the secret or delete the app.

### Q: Can multiple people use the same credentials?

**A**: Yes, but you'll share the rate limit (60 requests/min total). Better to create separate apps.

### Q: Is Gemini API required?

**A**: No, it's optional. Regex extraction works well for most posts. Gemini improves accuracy on unstructured posts.

### Q: What if my credentials leak?

**A**: Regenerate the client secret immediately at https://www.reddit.com/prefs/apps

### Q: Can I scrape private subreddits?

**A**: No, only public subreddits are accessible via the API.

### Q: How do I delete the app?

**A**: Go to https://www.reddit.com/prefs/apps and click "delete" under your app.

## Next Steps

After authentication setup:

1. **Run Tests**:
   ```bash
   python test_reddit_scraper.py
   ```

2. **Test Scrape**:
   ```bash
   python reddit_scraper.py --subreddit gradadmissions --limit 10
   ```

3. **View Results**:
   ```bash
   python analyze_results.py
   ```

4. **Scale Up**:
   ```bash
   python reddit_scraper.py --all-subs --limit 1000
   ```

## Resources

- **Reddit API Documentation**: https://www.reddit.com/dev/api/
- **PRAW Documentation**: https://praw.readthedocs.io/
- **Create Reddit App**: https://www.reddit.com/prefs/apps
- **Gemini API**: https://makersuite.google.com/app/apikey
- **Reddit API Terms**: https://www.redditinc.com/policies/data-api-terms

## Support

If you encounter issues:

1. Check `README_REDDIT_SCRAPER.md` for detailed troubleshooting
2. Run `python test_reddit_scraper.py` to diagnose problems
3. Verify credentials at https://www.reddit.com/prefs/apps
4. Check Reddit API status: https://www.redditstatus.com/

---

**Setup Complete!** You're now ready to start scraping admission data from Reddit.
