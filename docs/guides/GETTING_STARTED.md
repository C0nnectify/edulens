# 🚀 Getting Started with EduLen Platform

**Welcome!** This guide will get you up and running in 10 minutes.

---

## ⚡ Quick Start

### Prerequisites

```bash
# Check you have:
- Node.js 18+ installed
- Python 3.11+ installed
- MongoDB running
- Redis running (for background tasks)
```

### 1. Start AI Service (Terminal 1)

```bash
cd /home/ismail/edulen/ai_service

# Initialize SOP templates (one-time)
python scripts/init_sop_templates.py init

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit: `http://localhost:8000/docs` to see API documentation

### 2. Start Background Workers (Terminal 2 & 3)

```bash
# Terminal 2: Celery Worker
cd /home/ismail/edulen/ai_service
celery -A app.tasks.celery_app worker --loglevel=info

# Terminal 3: Celery Beat (scheduler)
celery -A app.tasks.celery_app beat --loglevel=info
```

### 3. Start Next.js Frontend (Terminal 4)

```bash
cd /home/ismail/edulen
npm run dev
```

Visit: `http://localhost:3000`

---

## 📋 What's Available

### 🎓 For Students

1. **SOP Generator** - Interview-based SOP creation
   - Visit: `/dashboard/document-builder/sop`
   - API: `http://localhost:8000/api/v1/sop-generator/`

2. **SOP Templates** - 20+ professional templates
   - Visit: `/dashboard/templates`
   - API: `http://localhost:8000/api/v1/sop-templates/`

3. **SOP Analysis** - Quality scoring and feedback
   - Visit: `/dashboard/document-ai`
   - API: `http://localhost:8000/api/v1/sop-analysis/`

4. **Admission Predictions** - ML-powered probability
   - Visit: `/dashboard/insights`
   - API: `http://localhost:8000/api/v1/admission/`

5. **Faculty Matching** - Find professors by research area
   - Visit: `/dashboard/faculty`
   - API: `http://localhost:8000/api/v1/faculty/`

6. **Application Tracker** - Track all applications
   - Visit: `/dashboard/application-tracker`
   - API: `http://localhost:8000/api/v1/applications/`

### 🔬 For Data Collection

1. **Faculty Scraper** - Scrape 20 universities
   ```bash
   cd /home/ismail/edulen/train_ml
   python faculty_scraper.py --all
   ```

2. **GradCafe Scraper** - Collect admission data
   ```bash
   cd /home/ismail/edulen/train_ml
   python gradcafe_scraper.py scrape -p "Computer Science"
   ```

3. **Reddit Scraper** - Student outcomes
   ```bash
   cd /home/ismail/edulen/train_ml
   python reddit_scraper.py --all-subs --limit 1000
   ```

4. **Automated Collection** - Scheduled scraping
   - Endpoint: `POST /api/v1/gradcafe/trigger`
   - Runs daily at 3 AM automatically

### 🤖 For ML Training

1. **Train Model**
   ```bash
   curl -X POST http://localhost:8000/api/v1/model-training/train \
     -H "Content-Type: application/json" \
     -d '{"algorithms": ["random_forest", "xgboost"]}'
   ```

2. **Check Model Status**
   ```bash
   curl http://localhost:8000/api/v1/model-training/models
   ```

3. **Get Predictions**
   ```bash
   curl -X POST http://localhost:8000/api/v1/admission/predict \
     -H "Content-Type: application/json" \
     -d '{
       "student_profile": {"gpa": 3.8, "gre_verbal": 165, "gre_quant": 170},
       "program_info": {"university_id": "mit", "program_name": "CS PhD"}
     }'
   ```

---

## 🔑 Required Configuration

### Environment Variables

Create `ai_service/.env`:
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# AI APIs
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
FIRECRAWL_API_KEY=fc-...

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=...
SMTP_PASSWORD=...

# Redis
REDIS_URL=redis://localhost:6379/0
```

Create `train_ml/.env`:
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017

# APIs
GOOGLE_API_KEY=...
FIRECRAWL_API_KEY=fc-...

# Reddit
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USERNAME=...
REDDIT_PASSWORD=...
```

---

## 📊 Key Features

### Phase 1: Core Automation ✅
- Smart notifications (email, SMS, push)
- Portal status monitoring
- Document requirements checker
- Deadline tracking
- Application import

### Phase 2: AI-Powered Insights ✅
- SOP analysis with scoring
- SOP generator (interview-based)
- SOP template library (20+)
- Faculty scraping & matching
- Admission prediction (ML)
- Automated data collection
- Model training pipeline
- AI insights dashboard UI

---

## 🎯 Common Tasks

### Generate an SOP

```bash
# 1. Create interview session
curl -X POST http://localhost:8000/api/v1/sop-generator/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "university": "Stanford",
    "program": "PhD Computer Science",
    "user_id": "user-123"
  }'

# 2. Answer questions (repeat for each question)
curl -X POST http://localhost:8000/api/v1/sop-generator/sessions/{id}/answer \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "personal_background_1",
    "answer": "Your answer here"
  }'

# 3. Generate SOP
curl -X POST http://localhost:8000/api/v1/sop-generator/sessions/{id}/generate \
  -H "Content-Type: application/json" \
  -d '{"tone": "confident", "word_count": 1000}'
```

### Use a Template

```bash
# 1. Search templates
curl http://localhost:8000/api/v1/sop-templates/search?degree=PhD&field=CS

# 2. Personalize template
curl -X POST http://localhost:8000/api/v1/sop-templates/{id}/personalize \
  -H "Content-Type: application/json" \
  -d '{
    "personalization_data": {
      "name": "John Doe",
      "university": "MIT",
      "program": "PhD Computer Science"
    }
  }'
```

### Analyze an SOP

```bash
curl -X POST http://localhost:8000/api/v1/sop-analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your SOP text here...",
    "user_id": "user-123",
    "university": "Stanford",
    "program": "PhD Computer Science"
  }'
```

### Match Faculty

```bash
curl -X POST http://localhost:8000/api/v1/faculty/match \
  -H "Content-Type: application/json" \
  -d '{
    "research_interests": "machine learning, natural language processing",
    "universities": ["mit", "stanford"],
    "top_k": 10
  }'
```

---

## 📚 Documentation

### Essential Guides
- **This file** - Quick start
- `PHASE_2_COMPLETE_SUMMARY.md` - Complete overview
- `ai_service/README.md` - AI service documentation
- `train_ml/START_HERE.md` - Data collection guide

### Specific Features
- `ai_service/SOP_GENERATOR_QUICKSTART.md` - SOP generator
- `ai_service/docs/SOP_QUICK_START.md` - Templates
- `ai_service/GRADCAFE_QUICK_START.md` - Data collection
- `ai_service/ML_TRAINING_QUICK_START.md` - Model training
- `src/components/dashboard/ai-insights/AI_INSIGHTS_QUICK_START.md` - Dashboard

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🧪 Testing

```bash
# Test AI service
cd ai_service
pytest tests/ -v

# Test scrapers
cd train_ml
python test_faculty_scraper.py
python test_gradcafe_scraper.py
python test_reddit_scraper.py

# Test specific features
pytest tests/test_sop_generator_service.py -v
pytest tests/test_sop_template_service.py -v
pytest tests/test_gradcafe_collection.py -v
```

---

## 🔍 Monitoring

### Check Service Status
```bash
# AI service health
curl http://localhost:8000/api/v1/health

# Scraping status
curl http://localhost:8000/api/v1/gradcafe/status

# Model status
curl http://localhost:8000/api/v1/model-training/status
```

### View Logs
```bash
# AI service
tail -f ai_service/logs/ai_service.log

# Celery worker
tail -f logs/celery_worker.log

# Scrapers
tail -f train_ml/logs/*.log
```

### Dashboards
- Scraping Dashboard: `http://localhost:8001`
- Celery Flower: `http://localhost:5555`
- API Docs: `http://localhost:8000/docs`

---

## 🐛 Troubleshooting

### MongoDB Not Running
```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

### Redis Not Running
```bash
sudo systemctl start redis
sudo systemctl status redis
```

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000
kill -9 <PID>

# Or use different port
uvicorn main:app --port 8001
```

### Dependencies Missing
```bash
# AI service
cd ai_service
pip install -r requirements.txt
# or with uv
uv sync

# Scrapers
cd train_ml
pip install -r requirements.txt
```

### API Key Errors
```bash
# Check .env file exists
ls -la ai_service/.env
ls -la train_ml/.env

# Verify keys are loaded
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('GOOGLE_API_KEY'))"
```

---

## 🎓 Learning Path

### Beginner (Day 1)
1. Read this guide
2. Start all services
3. Visit `http://localhost:8000/docs`
4. Try one API endpoint
5. Explore the dashboard at `http://localhost:3000`

### Intermediate (Week 1)
1. Generate an SOP using the interview system
2. Analyze an SOP for quality
3. Use a template and personalize it
4. Run faculty scraper for one university
5. Get admission prediction for a profile

### Advanced (Month 1)
1. Collect data from all sources (2-4 days)
2. Train ML model with real data
3. Set up automated daily collection
4. Integrate dashboard with frontend
5. Monitor and optimize performance

---

## 📞 Quick Reference

### Most Used Commands

```bash
# Start everything
cd ai_service && uvicorn main:app --reload &
cd ai_service && celery -A app.tasks.celery_app worker --loglevel=info &
cd ai_service && celery -A app.tasks.celery_app beat --loglevel=info &
cd .. && npm run dev

# Initialize templates
python ai_service/scripts/init_sop_templates.py init

# Scrape data
cd train_ml && python run_scraping.py --all

# Train model
curl -X POST http://localhost:8000/api/v1/model-training/train

# Check status
curl http://localhost:8000/api/v1/health
```

### Key URLs
- Frontend: `http://localhost:3000`
- API Docs: `http://localhost:8000/docs`
- Scraping Dashboard: `http://localhost:8001`
- Celery Flower: `http://localhost:5555`

### Key Directories
- AI Service: `/home/ismail/edulen/ai_service/`
- Scrapers: `/home/ismail/edulen/train_ml/`
- Frontend: `/home/ismail/edulen/src/`
- Components: `/home/ismail/edulen/src/components/`

---

## ✅ Checklist

Before using the platform:
- [ ] MongoDB running
- [ ] Redis running
- [ ] Environment variables configured (`.env` files)
- [ ] AI service started (`http://localhost:8000/docs` accessible)
- [ ] Celery workers started
- [ ] SOP templates initialized
- [ ] Next.js running (`http://localhost:3000` accessible)

---

## 🎉 You're Ready!

Everything is set up and ready to use!

**Next Steps:**
1. Visit `http://localhost:3000/dashboard`
2. Try generating an SOP
3. Analyze document quality
4. Explore the insights dashboard
5. Start collecting data for ML training

**Need Help?**
- Check `PHASE_2_COMPLETE_SUMMARY.md` for complete details
- Visit `http://localhost:8000/docs` for API reference
- Look at component READMEs for specific features
- Check logs in respective directories

---

**Happy Building! 🚀**

*EduLen Platform - Empowering Students Worldwide* 🎓
