# 🚀 Quick Start Guide - EduLen AI Service

Get up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- [ ] Google Gemini API key ([Get API Key](https://makersuite.google.com/app/apikey))
- [ ] Gmail account with App Password ([Setup Guide](https://support.google.com/accounts/answer/185833))
- [ ] Firecrawl API key ([Get API Key](https://www.firecrawl.dev/))

## Step 1: Setup Environment (2 minutes)

```bash
# Navigate to ai_service directory
cd ai_service

# Copy environment template
cp .env.example .env
```

Edit `.env` file with your credentials:
```env
GOOGLE_API_KEY=AIzaSy...                    # Your Gemini API key
SMTP_USERNAME=your.email@gmail.com          # Your Gmail
SMTP_PASSWORD=abcd efgh ijkl mnop           # Gmail App Password (16 chars)
SMTP_FROM_EMAIL=your.email@gmail.com        # Same as SMTP_USERNAME
FIRECRAWL_API_KEY=fc-...                    # Your Firecrawl key
SECRET_KEY=your_random_secret_key_here      # Generate random string
```

## Step 2: Start Services (1 minute)

```bash
# Build and start all services
docker-compose up -d

# Check if services are running
docker-compose ps
```

You should see 5 services running:
- ✅ edulen_api (FastAPI)
- ✅ edulen_redis (Redis)
- ✅ edulen_celery_worker (Task processor)
- ✅ edulen_celery_beat (Scheduler)
- ✅ edulen_flower (Monitoring)

## Step 3: Verify Installation (1 minute)

```bash
# Health check
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","services":{"chromadb":"operational","api":"operational"}}
```

Open browser to:
- API Docs: http://localhost:8000/docs
- Flower Monitor: http://localhost:5555

## Step 4: Test with First Request (1 minute)

### Upload a Resume

```bash
# Create a test resume file
echo "John Doe - Software Engineer\n\nExperience:\n- Python Developer at TechCorp" > test_resume.txt

# Upload it
curl -X POST "http://localhost:8000/api/v1/resume/upload" \
  -F "file=@test_resume.txt" \
  -F "user_id=test_user_123"
```

### Query the Resume

```bash
curl -X POST "http://localhost:8000/api/v1/resume/query" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "collection_type": "resume",
    "query_text": "software engineering experience",
    "n_results": 5
  }'
```

## 🎉 You're Ready!

Your AI service is now running with:
- ✅ Vector database for document storage
- ✅ AI-powered semantic search
- ✅ Background task processing
- ✅ Email notifications
- ✅ Scheduled automation

## Next Steps

### 1. Create a University Tracker
```bash
curl -X POST "http://localhost:8000/api/v1/tracker/create" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "university_url": "https://apply.stanford.edu",
    "tracking_type": "application_status",
    "email_notifications": true
  }'
```

### 2. Initiate Deep Research
```bash
curl -X POST "http://localhost:8000/api/v1/research/deep-research" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "query": "Best universities for Computer Science in USA",
    "research_type": "university",
    "depth": "deep"
  }'
```

### 3. Upload Your Actual Documents
Use the Swagger UI at http://localhost:8000/docs for easy file uploads!

## Common Issues & Solutions

### Issue: Cannot connect to ChromaDB
```bash
# Solution: Check permissions
sudo chmod -R 777 chroma_db/
docker-compose restart api
```

### Issue: Email not sending
```bash
# Solution: Verify Gmail App Password
# 1. Go to Google Account settings
# 2. Security → 2-Step Verification → App passwords
# 3. Generate new app password
# 4. Update .env file
docker-compose restart api celery_worker
```

### Issue: Celery tasks not running
```bash
# Solution: Check Redis connection
docker-compose logs redis

# Restart workers
docker-compose restart celery_worker celery_beat
```

### Issue: Port 8000 already in use
```bash
# Solution: Change port in .env
echo "API_PORT=8001" >> .env
docker-compose down && docker-compose up -d
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Access API container shell
docker-compose exec api /bin/bash

# Monitor Celery tasks
# Open browser: http://localhost:5555
```

## Development Mode

For hot-reload during development:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Production Deployment

1. Update `.env` with production values
2. Set `DEBUG=False` and `API_RELOAD=False`
3. Use production-grade secret key
4. Deploy with:
```bash
docker-compose up -d
```

## Getting Help

- 📖 Full docs: See [README.md](README.md)
- 🐛 Issues: Check logs with `docker-compose logs`
- 💬 API docs: http://localhost:8000/docs
- 📊 Monitor: http://localhost:5555

Happy coding! 🎓
