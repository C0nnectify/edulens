# Data Orchestrator Quick Reference

## Quick Setup

```bash
cd /home/ismail/edulen/train_ml
./setup.sh
source venv/bin/activate
```

## Core Commands

### Master Orchestrator

```bash
# Run everything
python run_scraping.py --all

# Run in parallel
python run_scraping.py --all --parallel

# Run specific scraper
python run_scraping.py --scraper faculty
python run_scraping.py --scraper gradcafe
python run_scraping.py --scraper reddit

# Data operations
python run_scraping.py --aggregate
python run_scraping.py --clean data/aggregated/file.csv
python run_scraping.py --prepare-ml data/clean/file.csv
```

### Individual Components

```bash
# Data Cleaning
python data_cleaner.py --input raw.csv --output clean.csv --remove-invalid

# Data Aggregation
python data_aggregator.py --mongodb-uri mongodb://localhost:27017 \
                          --db-name edulens \
                          --output-dir data/aggregated

# ML Preparation
python prepare_ml_data.py --input clean.csv \
                           --output data/ml_ready \
                           --test-size 0.15 \
                           --val-size 0.15
```

### Celery Scheduler

```bash
# Terminal 1: Worker
python scraping_scheduler.py worker

# Terminal 2: Beat (scheduler)
python scraping_scheduler.py beat

# Terminal 3: Dashboard
python scraping_scheduler.py dashboard
# Access at http://localhost:8001

# Alternative: Use celery command
celery -A scraping_scheduler worker --loglevel=info
celery -A scraping_scheduler beat --loglevel=info
```

## Configuration Files

### config.yaml

```yaml
mongodb:
  uri: "mongodb://localhost:27017"
  db_name: "edulens"

faculty_scraping:
  universities:
    - university_id: "stanford"
      university_name: "Stanford University"
      url: "https://cs.stanford.edu/people/faculty"
```

### .env

```bash
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379/0
FIRECRAWL_API_KEY=your_key
GOOGLE_API_KEY=your_key
```

## Services

### Start MongoDB

```bash
sudo systemctl start mongod
mongosh --eval "db.adminCommand('ping')"
```

### Start Redis

```bash
sudo systemctl start redis
redis-cli ping
```

## File Locations

```
train_ml/
├── data/
│   ├── raw/              # Raw scraped data
│   ├── clean/            # Cleaned data
│   ├── aggregated/       # Aggregated data
│   ├── ml_ready/         # ML datasets
│   └── visualizations/   # Generated plots
├── logs/                 # Log files
└── venv/                 # Virtual environment
```

## Common Tasks

### 1. Add New University

Edit `config.yaml`:

```yaml
faculty_scraping:
  universities:
    - university_id: "new_uni"
      university_name: "New University"
      department: "Computer Science"
      url: "https://example.edu/faculty"
      use_crawl: false
      max_pages: 20
```

### 2. Check Scraping Status

```bash
# View in dashboard
http://localhost:8001

# Or via API
curl http://localhost:8001/api/status
```

### 3. Manual Task Trigger

```bash
# Via dashboard
http://localhost:8001 → Click "Trigger Faculty Scraping"

# Or via API
curl -X POST http://localhost:8001/api/trigger/faculty
```

### 4. Monitor Celery

```bash
# Inspect active tasks
celery -A scraping_scheduler inspect active

# View registered tasks
celery -A scraping_scheduler inspect registered

# Using Flower
celery -A scraping_scheduler flower --port=5555
# Access at http://localhost:5555
```

### 5. Check Data Quality

```bash
# Generate quality report
python prepare_ml_data.py --input data/clean/file.csv \
                           --output data/ml_ready

# View report
cat data/ml_ready/quality_report_*.json
```

## Troubleshooting

### MongoDB not running

```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

### Redis not running

```bash
sudo systemctl start redis
sudo systemctl status redis
```

### Celery worker not picking up tasks

```bash
# Restart worker
pkill -f "celery worker"
python scraping_scheduler.py worker

# Clear queue
redis-cli FLUSHDB
```

### Import errors

```bash
pip install -r requirements.txt
```

## API Endpoints

### Dashboard API

```bash
# Status
GET http://localhost:8001/api/status

# Results
GET http://localhost:8001/api/results?limit=10

# Errors
GET http://localhost:8001/api/errors?limit=10

# Trigger task
POST http://localhost:8001/api/trigger/{task_name}

# Health check
GET http://localhost:8001/api/health
```

## Data Pipeline Stages

```
1. Scraping → MongoDB
2. Aggregation → CSV
3. Cleaning → Clean CSV
4. ML Prep → Train/Val/Test CSVs + Pickle
5. Training → Use with admission_prediction_service
```

## Schedule (Celery Beat)

- Faculty scraping: Monday 2 AM (weekly)
- GradCafe scraping: Daily 3 AM
- Reddit scraping: Daily 4 AM
- Data aggregation: Daily 6 AM

## Key Features

### Data Cleaner
- GPA normalization (10.0, 5.0, 100% → 4.0)
- Test score validation (GRE, GMAT, TOEFL, IELTS)
- University name normalization
- Duplicate detection
- Smart imputation

### Data Aggregator
- Fetch from MongoDB
- Cross-reference faculty with admissions
- Calculate statistics
- Generate summaries

### ML Preparator
- Feature engineering
- Train/val/test split (70/15/15)
- Export CSV/Pickle/JSON
- Visualizations
- Quality reports

## Monitoring

### Dashboard
- http://localhost:8001

### Flower
- http://localhost:5555

### Redis
```bash
redis-cli MONITOR
```

### MongoDB
```bash
mongosh edulens
db.faculty_database.countDocuments()
db.admission_data.countDocuments()
```

## Logs

```bash
# Application logs
tail -f logs/orchestrator.log

# Celery worker logs
# (in terminal where worker is running)

# Dashboard logs
# (in terminal where dashboard is running)
```

## Performance

- Max workers: 4 (configurable in config.yaml)
- Task timeout: 1 hour
- Request delay: 1 second between scrapes
- Rate limit: 60 requests/minute

## Data Export Formats

### CSV
```
X_train.csv, X_val.csv, X_test.csv
y_train.csv, y_val.csv, y_test.csv
```

### Pickle
```python
import pickle
with open('dataset.pkl', 'rb') as f:
    data = pickle.load(f)
# data contains: X_train, X_val, X_test, y_train, y_val, y_test, feature_names
```

### JSON
```json
{
  "created_at": "2025-10-12T12:00:00",
  "total_samples": 1000,
  "feature_names": ["gpa_normalized", "gre_verbal_percentile", ...]
}
```

## Documentation

- Full Guide: `README_ORCHESTRATOR.md`
- Setup: `./setup.sh`
- Examples: See README sections

---

**Last Updated:** October 12, 2025
