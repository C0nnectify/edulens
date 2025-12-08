# 🚀 START HERE - EduLen ML Training Pipeline

**Welcome!** This directory contains a complete data collection and ML training system for graduate admission predictions.

---

## ⚡ Quick Start (5 Minutes)

```bash
# 1. Navigate to directory
cd /home/ismail/edulen/train_ml

# 2. Run setup
./setup.sh

# 3. Activate environment
source venv/bin/activate

# 4. Add API keys to .env
cp .env.example .env
nano .env  # Add your API keys

# 5. Test it works
python verify_setup.py

# 6. Run your first scrape
python faculty_scraper.py --university mit --limit 1
```

**Done!** You've successfully set up the system.

---

## 📚 What's Included?

### **1. Faculty Scraper**
Scrapes faculty data from 20 top universities (MIT, Stanford, etc.)
- **Quick Start**: `QUICK_START.md`
- **Full Guide**: `README_FACULTY_SCRAPER.md`
- **Run**: `python faculty_scraper.py --all`

### **2. GradCafe Scraper**
Collects historical admission results
- **Quick Start**: `QUICK_START_GRADCAFE.md`
- **Full Guide**: `README_GRADCAFE_SCRAPER.md`
- **Run**: `python gradcafe_scraper.py scrape -p "Computer Science"`

### **3. Reddit Scraper**
Gathers student-reported outcomes from 25+ subreddits
- **Quick Start**: `QUICK_START_REDDIT.md`
- **Full Guide**: `README_REDDIT_SCRAPER.md`
- **Run**: `python reddit_scraper.py --subreddit gradadmissions`

### **4. Data Orchestrator**
Automated pipeline with cleaning, aggregation, and ML prep
- **Quick Start**: `QUICK_REFERENCE.md`
- **Full Guide**: `README_ORCHESTRATOR.md`
- **Run**: `python run_scraping.py --all`

---

## 📖 Documentation Quick Links

### **Getting Started**
- 🎯 **You are here**: `START_HERE.md`
- 📋 **Complete Summary**: `COMPLETE_IMPLEMENTATION_SUMMARY.md`
- 🏗️ **System Overview**: `SYSTEM_OVERVIEW.txt`

### **Setup Guides**
- Faculty: `README_START_HERE.md`
- GradCafe: `AUTHENTICATION_SETUP_GUIDE.md` (for GradCafe)
- Reddit: `AUTHENTICATION_SETUP_GUIDE.md` (for Reddit)
- Orchestrator: `setup.sh`

### **Component Documentation**
1. **Faculty Scraper** (14 KB)
   - `README_FACULTY_SCRAPER.md`
   - `INTEGRATION_GUIDE.md`
   - `example_usage.py`

2. **GradCafe Scraper** (18 KB)
   - `README_GRADCAFE_COMPLETE.md`
   - `GRADCAFE_INTEGRATION_GUIDE.md`
   - `analyze_results.py`

3. **Reddit Scraper** (20+ KB)
   - `README_REDDIT_SCRAPER.md`
   - `EXAMPLES.md` (25+ usage examples)
   - `verify_setup.py`

4. **Orchestrator** (25 KB)
   - `README_ORCHESTRATOR.md`
   - `ORCHESTRATOR_SUMMARY.md`
   - `QUICK_REFERENCE.md`

---

## 🎯 Common Tasks

### **Collect Initial Data** (24-48 hours)
```bash
# Run all scrapers
python run_scraping.py --all

# Or individually
python faculty_scraper.py --all
python gradcafe_scraper.py scrape -p "Computer Science" --years 2020-2024
python reddit_scraper.py --all-subs --limit 2000
```

### **Clean and Prepare Data**
```bash
# Clean raw data
python data_cleaner.py --input raw_data/ --output clean_data/

# Prepare for ML
python prepare_ml_data.py --output ml_dataset/
```

### **Train ML Model**
```bash
# Export data
ls output/ml_ready/  # Check files

# Train via AI service
cd ../ai_service
curl -X POST http://localhost:8000/api/v1/admission/model/train
```

### **Automate Collection**
```bash
# Start scheduler
python scraping_scheduler.py worker     # Terminal 1
python scraping_scheduler.py beat       # Terminal 2
python scraping_scheduler.py dashboard  # Terminal 3

# Access dashboard: http://localhost:8001
```

---

## 🗂️ File Structure

```
train_ml/
├── 📖 START_HERE.md                     ⬅️ You are here!
├── 📋 COMPLETE_IMPLEMENTATION_SUMMARY.md (Full overview)
│
├── 📁 Faculty Scraper
│   ├── faculty_scraper.py              (Main scraper)
│   ├── university_config.json          (20 universities)
│   ├── README_FACULTY_SCRAPER.md       (Documentation)
│   └── ... (15+ more files)
│
├── 📁 GradCafe Scraper
│   ├── gradcafe_scraper.py             (Main scraper)
│   ├── gradcafe_config.json            (Configuration)
│   ├── README_GRADCAFE_COMPLETE.md     (Documentation)
│   └── ... (10+ more files)
│
├── 📁 Reddit Scraper
│   ├── reddit_scraper.py               (Main scraper)
│   ├── reddit_config.json              (25+ subreddits)
│   ├── README_REDDIT_SCRAPER.md        (Documentation)
│   └── ... (10+ more files)
│
└── 📁 Orchestrator
    ├── run_scraping.py                 (Master orchestrator)
    ├── data_cleaner.py                 (Data cleaning)
    ├── prepare_ml_data.py              (ML preparation)
    ├── scraping_scheduler.py           (Automation)
    ├── README_ORCHESTRATOR.md          (Documentation)
    └── ... (8+ more files)
```

---

## 🔑 Required API Keys

Add these to `.env` file:

```bash
# Required for all
MONGODB_URI=mongodb://localhost:27017
OPENAI_API_KEY=sk-...              # For embeddings

# For AI extraction
GOOGLE_API_KEY=...                  # Google Gemini

# For faculty scraping
FIRECRAWL_API_KEY=fc-...           # Firecrawl service

# For Reddit scraping
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USERNAME=...
REDDIT_PASSWORD=...
```

**How to get keys:**
- OpenAI: https://platform.openai.com/api-keys
- Google: https://makersuite.google.com/app/apikey
- Firecrawl: https://firecrawl.dev
- Reddit: See `AUTHENTICATION_SETUP_GUIDE.md`

---

## 📊 What You'll Get

### **After Initial Scraping (24-48 hours):**
- ✅ 2,000-4,000 faculty profiles
- ✅ 5,000-10,000 GradCafe admission results
- ✅ 2,000-3,000 Reddit student outcomes
- ✅ **Total: 7,000-13,000 data points**

### **After Data Preparation:**
- ✅ Clean, normalized dataset
- ✅ 12 engineered ML features
- ✅ Train/val/test split (70/15/15)
- ✅ Multiple export formats (CSV, JSON, Pickle)
- ✅ Data quality report with visualizations

### **After ML Training:**
- ✅ Trained admission prediction model
- ✅ 70-80% accuracy target
- ✅ Integrated with EduLen platform
- ✅ Real-time predictions available

---

## 🐛 Troubleshooting

### **Setup Issues**
```bash
# Verify Python version (3.11+)
python --version

# Reinstall dependencies
pip install -r requirements.txt

# Check MongoDB connection
python -c "from pymongo import MongoClient; MongoClient().server_info()"
```

### **Scraping Issues**
```bash
# Test with single record first
python faculty_scraper.py --university mit --limit 1
python gradcafe_scraper.py scrape -p "CS" --limit 1
python reddit_scraper.py --limit 1

# Check logs
tail -f logs/*.log
```

### **Need Help?**
1. Check component README files
2. Run verification scripts (`verify_*.py`)
3. Review `COMPLETE_IMPLEMENTATION_SUMMARY.md`
4. Check logs in `logs/` directory

---

## ✅ Verification Checklist

Before running scrapers, verify:

- [ ] Python 3.11+ installed
- [ ] MongoDB running (`sudo systemctl status mongod`)
- [ ] Redis running (`sudo systemctl status redis`)
- [ ] Virtual environment activated
- [ ] Dependencies installed (`pip list`)
- [ ] .env file configured with API keys
- [ ] MongoDB accessible (`python verify_setup.py`)
- [ ] Test scraper works (`--limit 1`)

---

## 🎓 Learning Path

### **Beginner** (Day 1)
1. Read this file
2. Run `./setup.sh`
3. Test single university scrape
4. Review `COMPLETE_IMPLEMENTATION_SUMMARY.md`

### **Intermediate** (Week 1)
1. Scrape all 20 universities
2. Run GradCafe and Reddit scrapers
3. Clean and prepare data
4. Review statistics

### **Advanced** (Month 1)
1. Set up automated scheduling
2. Train ML model
3. Integrate with EduLen frontend
4. Monitor and optimize

---

## 📈 Performance Expectations

| Task | Time | Output |
|------|------|--------|
| Setup | 5 min | Environment ready |
| Single university scrape | 10-20 min | 100-200 faculty |
| All universities scrape | 2-4 hours | 2,000-4,000 faculty |
| GradCafe scrape (1K) | 30-60 min | 1,000 records |
| Reddit scrape (1K) | 35-70 min | 1,000 records |
| Data cleaning | 5-10 min | Normalized data |
| ML preparation | 5-10 min | Train/val/test sets |
| Model training | 10-30 min | Trained model |

---

## 🔄 Maintenance Schedule

**Daily** (Automated):
- GradCafe scraping (3 AM)
- Reddit scraping (4 AM)
- Data aggregation (6 AM)

**Weekly** (Automated):
- Faculty scraping (Monday 2 AM)
- Model retraining (Sunday 1 AM)

**Monthly** (Manual):
- Review data quality
- Update configurations
- Optimize performance

---

## 🎉 You're Ready!

### **Next Steps:**
1. ✅ Read this file (you're here!)
2. ⏭️ Run `./setup.sh`
3. ⏭️ Configure `.env` file
4. ⏭️ Test with `python verify_setup.py`
5. ⏭️ Run first scrape: `python faculty_scraper.py --university mit`

### **Questions?**
- 📖 See `COMPLETE_IMPLEMENTATION_SUMMARY.md` for full details
- 🏗️ See `SYSTEM_OVERVIEW.txt` for architecture
- 📚 See component README files for specific guides
- 🔍 Run `python verify_*.py` for diagnostics

---

## 📞 Quick Reference

### **Most Used Commands**
```bash
# Setup
./setup.sh && source venv/bin/activate

# Scrape
python run_scraping.py --all

# Monitor
python scraping_scheduler.py dashboard

# Analyze
python analyze_results.py

# Clean
python data_cleaner.py
```

### **Key Files**
- Main: `run_scraping.py`
- Config: `config.yaml`
- Logs: `logs/*.log`
- Output: `output/ml_ready/`

### **Key URLs**
- Dashboard: http://localhost:8001
- API Docs: http://localhost:8000/docs
- Flower: http://localhost:5555

---

**🚀 Ready to start? Run:** `./setup.sh`

**📖 Need more info? Read:** `COMPLETE_IMPLEMENTATION_SUMMARY.md`

**🎯 Have API keys? Edit:** `.env`

---

*Happy Data Collection! 🎓*

**Version**: 1.0.0
**Updated**: January 12, 2025
**Location**: `/home/ismail/edulen/train_ml/`
