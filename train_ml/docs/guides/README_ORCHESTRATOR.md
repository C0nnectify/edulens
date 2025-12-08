# Data Collection Orchestrator

A comprehensive data collection and processing pipeline for graduate admission prediction. This orchestrator automates scraping, cleaning, aggregation, and ML data preparation from multiple sources.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Components](#components)
- [Monitoring Dashboard](#monitoring-dashboard)
- [Data Pipeline](#data-pipeline)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## 🎯 Overview

The Data Collection Orchestrator provides a unified system for:

1. **Faculty Scraping**: Scrape university faculty pages using Firecrawl and Google Gemini AI
2. **GradCafe Scraping**: Collect admission results data (placeholder for implementation)
3. **Reddit Scraping**: Extract admission discussions from relevant subreddits (placeholder)
4. **Data Aggregation**: Combine data from multiple sources with deduplication
5. **Data Cleaning**: Normalize GPA scales, standardize test scores, validate data
6. **ML Preparation**: Feature engineering and train/val/test splitting

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Data Collection Sources                    │
├─────────────────────────────────────────────────────────────┤
│  Faculty Scraping  │  GradCafe Scraping  │  Reddit Scraping │
└──────────┬──────────┴───────────┬──────────┴─────────┬──────┘
           │                      │                     │
           └──────────────────────┼─────────────────────┘
                                 │
                          ┌──────▼──────┐
                          │   MongoDB    │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │  Data       │
                          │  Aggregator │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │  Data       │
                          │  Cleaner    │
                          └──────┬──────┘
                                 │
                          ┌──────▼──────┐
                          │  ML Data    │
                          │  Preparator │
                          └──────┬──────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼────────┐      ┌────────▼─────────┐
            │  Train Dataset │      │  Visualizations  │
            │  (CSV/PKL)     │      │  & Reports       │
            └────────────────┘      └──────────────────┘
```

### Scheduling Architecture

```
┌─────────────────┐
│  Celery Beat    │  (Scheduler)
│  (Cron Jobs)    │
└────────┬────────┘
         │
         │ Triggers Tasks
         │
┌────────▼─────────┐
│  Celery Workers  │
│  (Task Queue)    │
└────────┬─────────┘
         │
         │ Stores Status
         │
┌────────▼─────────┐
│  Redis           │  (Message Broker & Status Store)
└──────────────────┘
         │
         │ Read Status
         │
┌────────▼─────────┐
│  FastAPI         │  (Monitoring Dashboard)
│  Dashboard       │
└──────────────────┘
```

## ✨ Features

### Data Cleaning (`data_cleaner.py`)

- **GPA Normalization**
  - Convert 10.0 scale → 4.0 scale
  - Convert percentages → 4.0 scale
  - Auto-detect GPA scales

- **Test Score Standardization**
  - Validate GRE (130-170 for verbal/quant, 0-6 for AWA)
  - Validate GMAT (200-800)
  - Validate TOEFL (0-120)
  - Validate IELTS (0-9)

- **University Name Normalization**
  - Fuzzy matching for similar names
  - Standardized identifiers

- **Date Parsing**
  - Multiple date format support
  - ISO 8601 output

- **Duplicate Detection**
  - Exact duplicate removal
  - Fuzzy matching for near-duplicates

- **Data Validation**
  - Flag suspicious entries
  - Validate required fields
  - Check data ranges

- **Smart Imputation**
  - Median imputation grouped by university and decision
  - Mode imputation for categorical fields

### Data Aggregation (`data_aggregator.py`)

- Fetch data from MongoDB collections
- Merge duplicate universities using fuzzy matching
- Cross-reference faculty with admission data
- Calculate acceptance rates by university
- Generate comprehensive statistics
- Export to CSV and JSON

### Scraping Scheduler (`scraping_scheduler.py`)

- **Celery-based Task Queue**
  - Scheduled tasks (cron-like)
  - Retry logic with exponential backoff
  - Task status tracking

- **FastAPI Monitoring Dashboard**
  - Real-time status monitoring
  - Manual task triggering
  - Progress tracking
  - Error logging

- **Scheduled Tasks**
  - Faculty scraping: Weekly (Monday 2 AM)
  - GradCafe scraping: Daily (3 AM)
  - Reddit scraping: Daily (4 AM)
  - Data aggregation: Daily (6 AM)

### ML Data Preparation (`prepare_ml_data.py`)

- **Feature Engineering**
  - GPA normalization to 0-1 scale
  - Test score percentile calculation
  - Research score calculation
  - Professional experience score
  - University prestige score
  - Program competitiveness score
  - Composite features

- **Data Splitting**
  - Train: 70%
  - Validation: 15%
  - Test: 15%
  - Stratified splitting

- **Multiple Export Formats**
  - CSV (for analysis)
  - Pickle (for Python ML models)
  - JSON (for metadata)

- **Visualizations**
  - Decision distribution
  - GPA distribution
  - Test score correlations
  - University distribution
  - Acceptance rate by GPA

- **Data Quality Report**
  - Missing value analysis
  - Summary statistics
  - Quality score calculation

### Master Orchestrator (`run_scraping.py`)

- Unified CLI for all operations
- Sequential or parallel execution
- Progress bars with Rich
- Comprehensive reporting
- Error tracking

## 🚀 Installation

### Prerequisites

- Python 3.9+
- MongoDB (local or remote)
- Redis (for Celery)
- Firecrawl API key
- Google Gemini API key

### Step 1: Install Dependencies

```bash
cd /home/ismail/edulen/train_ml

# Install Python dependencies
pip install -r requirements.txt

# Or using uv (faster)
uv pip install -r requirements.txt
```

### Step 2: Start Services

**MongoDB:**
```bash
# Local MongoDB
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Redis:**
```bash
# Local Redis
sudo systemctl start redis

# Or using Docker
docker run -d -p 6379:6379 --name redis redis:latest
```

### Step 3: Configure Environment

Create a `.env` file:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# Redis
REDIS_URL=redis://localhost:6379/0

# API Keys
FIRECRAWL_API_KEY=your_firecrawl_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Email (optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Reddit (optional)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=EduLen Scraper v1.0
```

### Step 4: Configure Universities

Edit `config.yaml` to add universities you want to scrape:

```yaml
faculty_scraping:
  universities:
    - university_id: "stanford"
      university_name: "Stanford University"
      department: "Computer Science"
      url: "https://cs.stanford.edu/people/faculty"
      use_crawl: false
      max_pages: 20
```

## ⚙️ Configuration

The `config.yaml` file controls all aspects of the orchestrator. Key sections:

### MongoDB Configuration
```yaml
mongodb:
  uri: "mongodb://localhost:27017"
  db_name: "edulens"
```

### Output Directories
```yaml
output:
  raw_data_dir: "data/raw"
  clean_data_dir: "data/clean"
  aggregated_dir: "data/aggregated"
  ml_ready_dir: "data/ml_ready"
```

### Faculty Scraping
```yaml
faculty_scraping:
  enabled: true
  schedule: "weekly"
  universities: [...]
```

### Data Cleaning
```yaml
data_cleaning:
  gpa_scales: [4.0, 5.0, 10.0, 100.0]
  remove_duplicates: true
  impute_missing: true
```

### ML Preparation
```yaml
ml_preparation:
  test_size: 0.15
  validation_size: 0.15
  generate_visualizations: true
```

## 📖 Usage

### Quick Start - Run Complete Pipeline

```bash
# Run all steps sequentially
python run_scraping.py --all

# Run all steps in parallel (faster)
python run_scraping.py --all --parallel

# Use custom config
python run_scraping.py --all --config custom_config.yaml
```

### Run Individual Steps

**1. Faculty Scraping Only:**
```bash
python run_scraping.py --scraper faculty
```

**2. GradCafe Scraping:**
```bash
python run_scraping.py --scraper gradcafe
```

**3. Reddit Scraping:**
```bash
python run_scraping.py --scraper reddit
```

**4. Data Aggregation:**
```bash
python run_scraping.py --aggregate
```

**5. Data Cleaning:**
```bash
python data_cleaner.py \
  --input data/aggregated/admission_data_20241012_120000.csv \
  --output data/clean/clean_data.csv \
  --remove-invalid \
  --stats-output cleaning_stats.json
```

**6. ML Data Preparation:**
```bash
python prepare_ml_data.py \
  --input data/clean/clean_data.csv \
  --output data/ml_ready \
  --test-size 0.15 \
  --val-size 0.15
```

### Scheduled Execution with Celery

**Start Celery Worker:**
```bash
# Terminal 1: Start worker
python scraping_scheduler.py worker

# Or using celery command directly
celery -A scraping_scheduler worker --loglevel=info
```

**Start Celery Beat (Scheduler):**
```bash
# Terminal 2: Start scheduler
python scraping_scheduler.py beat

# Or using celery command
celery -A scraping_scheduler beat --loglevel=info
```

**Start Monitoring Dashboard:**
```bash
# Terminal 3: Start dashboard
python scraping_scheduler.py dashboard

# Or specify port
python scraping_scheduler.py dashboard 8001
```

Access dashboard at: http://localhost:8001

### Using Flower (Advanced Monitoring)

```bash
# Start Flower
celery -A scraping_scheduler flower --port=5555
```

Access Flower at: http://localhost:5555

## 🧩 Components

### 1. data_cleaner.py

**Class: `DataCleaner`**

```python
from data_cleaner import DataCleaner, clean_csv_file

# Initialize cleaner
cleaner = DataCleaner()

# Clean DataFrame
df_clean, stats = cleaner.clean_dataframe(
    df,
    remove_duplicates=True,
    impute_missing=True,
    validate_records=True
)

# Or clean CSV file directly
stats = clean_csv_file(
    input_path='raw_data.csv',
    output_path='clean_data.csv',
    remove_invalid=True
)
```

**Key Methods:**
- `normalize_gpa(gpa, scale)` - Normalize GPA to 4.0 scale
- `standardize_test_score(test_type, score)` - Validate test scores
- `normalize_university_name(university)` - Standardize university names
- `parse_date(date_value)` - Parse dates to ISO format
- `detect_duplicates(df)` - Remove duplicates
- `validate_record(record)` - Validate single record
- `impute_missing_values(df)` - Smart imputation
- `clean_dataframe(df)` - Complete cleaning pipeline

### 2. data_aggregator.py

**Class: `DataAggregator`**

```python
from data_aggregator import DataAggregator
import asyncio

# Initialize aggregator
aggregator = DataAggregator(
    mongodb_uri='mongodb://localhost:27017',
    db_name='edulens'
)

# Aggregate all data
admission_df, faculty_df, summary = await aggregator.aggregate_all_data(
    output_dir='data/aggregated'
)
```

**Key Methods:**
- `fetch_faculty_data()` - Fetch faculty from MongoDB
- `fetch_admission_data()` - Fetch admission records
- `merge_duplicate_universities(df)` - Merge similar universities
- `cross_reference_faculty_programs()` - Cross-reference data
- `calculate_statistics(df)` - Calculate aggregate statistics
- `generate_dataset_summary()` - Generate summary report

### 3. scraping_scheduler.py

**Celery Tasks:**

```python
from scraping_scheduler import (
    scrape_faculty_task,
    scrape_gradcafe_task,
    scrape_reddit_task,
    aggregate_data_task
)

# Trigger task manually
task = scrape_faculty_task.delay(university_configs)

# Get task result
result = task.get(timeout=3600)
```

**Status Tracking:**

```python
from scraping_scheduler import ScrapingStatus

# Set status
ScrapingStatus.set_status('faculty_scraping', 'running')

# Get status
status = ScrapingStatus.get_status('faculty_scraping')

# Set progress
ScrapingStatus.set_progress('faculty_scraping', current=5, total=10)
```

### 4. prepare_ml_data.py

**Class: `MLDataPreparator`**

```python
from prepare_ml_data import MLDataPreparator

# Initialize preparator
preparator = MLDataPreparator()

# Prepare complete ML dataset
summary = preparator.prepare_ml_dataset(
    input_file='data/clean/clean_data.csv',
    output_dir='data/ml_ready',
    test_size=0.15,
    val_size=0.15,
    generate_viz=True
)
```

**Key Methods:**
- `engineer_features(df)` - Engineer ML features
- `select_ml_features(df)` - Select features for ML
- `split_data(X, y)` - Train/val/test split
- `generate_visualizations(df)` - Create plots
- `generate_quality_report(df)` - Data quality report

### 5. run_scraping.py

**Class: `ScrapingOrchestrator`**

```python
from run_scraping import ScrapingOrchestrator
import asyncio

# Initialize orchestrator
orchestrator = ScrapingOrchestrator(config_file='config.yaml')

# Run complete pipeline
results = await orchestrator.run_all(parallel=True)

# Run individual components
result = await orchestrator.run_faculty_scraping()
result = await orchestrator.aggregate_data()
result = orchestrator.clean_data(input_file, output_file)
result = orchestrator.prepare_ml_data(input_file, output_dir)
```

## 📊 Monitoring Dashboard

The FastAPI monitoring dashboard provides:

### Features

- **Real-time Status**: View current status of all scraping tasks
- **Progress Tracking**: See progress bars for running tasks
- **Manual Triggers**: Start tasks on-demand with buttons
- **Error Logs**: View recent errors and failures
- **Results History**: See completed task results
- **Health Check**: API endpoint for system health

### API Endpoints

- `GET /` - Dashboard HTML interface
- `GET /api/status` - Get all task statuses
- `GET /api/results?limit=10` - Get recent results
- `GET /api/errors?limit=10` - Get recent errors
- `POST /api/trigger/{task_name}` - Trigger a task manually
- `GET /api/health` - Health check

### Example API Usage

```bash
# Get status
curl http://localhost:8001/api/status

# Trigger faculty scraping
curl -X POST http://localhost:8001/api/trigger/faculty

# Get recent errors
curl http://localhost:8001/api/errors?limit=5
```

## 🔄 Data Pipeline

### Complete Pipeline Flow

```
1. SCRAPING
   ├── Faculty Scraping (Firecrawl + Gemini)
   ├── GradCafe Scraping (Web scraping)
   └── Reddit Scraping (PRAW API)
        ↓
2. MONGODB STORAGE
   ├── faculty_database collection
   └── admission_data collection
        ↓
3. DATA AGGREGATION
   ├── Fetch from MongoDB
   ├── Merge duplicates
   ├── Cross-reference
   └── Calculate statistics
        ↓
4. DATA CLEANING
   ├── Normalize GPA
   ├── Standardize test scores
   ├── Clean university names
   ├── Parse dates
   ├── Remove duplicates
   ├── Validate records
   └── Impute missing values
        ↓
5. ML DATA PREPARATION
   ├── Feature engineering
   ├── Feature selection
   ├── Train/val/test split (70/15/15)
   ├── Export CSV/Pickle/JSON
   ├── Generate visualizations
   └── Data quality report
        ↓
6. ML MODEL TRAINING
   └── Use prepared data with admission_prediction_service
```

### Data Flow Example

```bash
# Step 1: Scrape faculty data
python run_scraping.py --scraper faculty
# Output: MongoDB → faculty_database collection

# Step 2: Aggregate data
python run_scraping.py --aggregate
# Output: data/aggregated/admission_data_TIMESTAMP.csv

# Step 3: Clean data
python data_cleaner.py \
  --input data/aggregated/admission_data_20241012_120000.csv \
  --output data/clean/clean_data.csv
# Output: data/clean/clean_data.csv

# Step 4: Prepare ML dataset
python prepare_ml_data.py \
  --input data/clean/clean_data.csv \
  --output data/ml_ready
# Output:
#   data/ml_ready/X_train_TIMESTAMP.csv
#   data/ml_ready/X_val_TIMESTAMP.csv
#   data/ml_ready/X_test_TIMESTAMP.csv
#   data/ml_ready/y_train_TIMESTAMP.csv
#   data/ml_ready/y_val_TIMESTAMP.csv
#   data/ml_ready/y_test_TIMESTAMP.csv
#   data/ml_ready/dataset_TIMESTAMP.pkl
#   data/ml_ready/metadata_TIMESTAMP.json
#   data/ml_ready/visualizations/*.png
```

## 🐛 Troubleshooting

### Common Issues

**1. Redis Connection Error**

```
Error: redis.exceptions.ConnectionError: Error connecting to Redis
```

**Solution:**
```bash
# Start Redis
sudo systemctl start redis

# Check Redis status
redis-cli ping
# Should return: PONG
```

**2. MongoDB Connection Error**

```
Error: pymongo.errors.ServerSelectionTimeoutError
```

**Solution:**
```bash
# Start MongoDB
sudo systemctl start mongod

# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"
```

**3. Celery Worker Not Picking Up Tasks**

**Solution:**
```bash
# Restart Celery worker
pkill -f "celery worker"
python scraping_scheduler.py worker

# Clear Redis task queue
redis-cli FLUSHDB
```

**4. Import Errors**

```
ModuleNotFoundError: No module named 'fuzzywuzzy'
```

**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

**5. Scraping Timeout**

```
Error: Task scraping_scheduler.scrape_faculty_task[...] raised exception: TimeoutError
```

**Solution:**
- Increase `task_time_limit` in `config.yaml`
- Reduce `max_pages` for crawling
- Check internet connection
- Verify API keys

### Debugging Tips

**Enable Debug Logging:**

```python
# In config.yaml
logging:
  level: "DEBUG"
```

**Check Celery Task Status:**

```bash
# View all tasks
celery -A scraping_scheduler inspect active

# View registered tasks
celery -A scraping_scheduler inspect registered
```

**Monitor Redis:**

```bash
# Monitor Redis commands in real-time
redis-cli MONITOR

# Check queue length
redis-cli LLEN celery
```

**Check MongoDB Collections:**

```bash
mongosh edulens

# List collections
show collections

# Count documents
db.faculty_database.countDocuments()
db.admission_data.countDocuments()

# Sample documents
db.faculty_database.findOne()
```

## 🛠️ Development

### Project Structure

```
train_ml/
├── data_cleaner.py           # Data cleaning pipeline
├── data_aggregator.py        # Data aggregation from MongoDB
├── scraping_scheduler.py     # Celery scheduler & dashboard
├── prepare_ml_data.py        # ML data preparation
├── run_scraping.py           # Master orchestrator CLI
├── requirements.txt          # Python dependencies
├── config.yaml               # Configuration file
├── README_ORCHESTRATOR.md    # This file
├── .env                      # Environment variables (not in git)
├── data/                     # Data directory
│   ├── raw/                  # Raw scraped data
│   ├── clean/                # Cleaned data
│   ├── aggregated/           # Aggregated data
│   ├── ml_ready/             # ML-ready datasets
│   └── visualizations/       # Generated plots
└── logs/                     # Log files
    └── orchestrator.log
```

### Adding New Scrapers

To add a new data source (e.g., LinkedIn scraper):

**1. Create scraper function:**

```python
# In scraping_scheduler.py

@celery_app.task(bind=True, max_retries=3)
def scrape_linkedin_task(self, search_queries: List[str]):
    """Scrape LinkedIn profiles"""
    task_name = 'linkedin_scraping'

    try:
        ScrapingStatus.set_status(task_name, 'running')

        # Implement scraping logic
        results = []
        for query in search_queries:
            # Scrape LinkedIn
            result = scrape_linkedin(query)
            results.append(result)

        ScrapingStatus.set_status(task_name, 'completed')
        return {'status': 'success', 'results': results}

    except Exception as e:
        ScrapingStatus.set_status(task_name, 'failed')
        raise
```

**2. Add to beat schedule:**

```python
celery_app.conf.beat_schedule['scrape-linkedin-daily'] = {
    'task': 'scraping_scheduler.scrape_linkedin_task',
    'schedule': crontab(hour=5, minute=0),
    'args': [['computer science', 'machine learning']]
}
```

**3. Add to orchestrator:**

```python
# In run_scraping.py

async def run_linkedin_scraping(self) -> Dict[str, Any]:
    """Run LinkedIn scraping"""
    # Implementation
    pass
```

**4. Update config:**

```yaml
# In config.yaml

linkedin_scraping:
  enabled: true
  schedule: "daily"
  queries:
    - "computer science"
    - "machine learning"
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test
pytest test_data_cleaner.py -v
```

### Code Style

```bash
# Format code
black *.py

# Sort imports
isort *.py

# Type checking (optional)
mypy data_cleaner.py
```

## 📝 Examples

### Example 1: Complete Pipeline

```python
import asyncio
from run_scraping import ScrapingOrchestrator

async def main():
    orchestrator = ScrapingOrchestrator('config.yaml')
    results = await orchestrator.run_all(parallel=True)

    print(f"Faculty scraped: {results['faculty_scraping']['universities_scraped']}")
    print(f"Admission records: {results['aggregation']['admission_records']}")
    print(f"ML samples: {results['ml_preparation']['metadata']['total_samples']}")

asyncio.run(main())
```

### Example 2: Custom Cleaning Pipeline

```python
from data_cleaner import DataCleaner
import pandas as pd

# Load data
df = pd.read_csv('raw_data.csv')

# Initialize cleaner
cleaner = DataCleaner()

# Normalize GPA
df['gpa_normalized'] = df.apply(
    lambda row: cleaner.normalize_gpa(row['gpa'], row['gpa_scale']),
    axis=1
)

# Standardize test scores
df['gre_verbal'] = df['gre_verbal'].apply(
    lambda x: cleaner.standardize_test_score('gre', x, 'verbal')
)

# Full cleaning
df_clean, stats = cleaner.clean_dataframe(df)

print(f"Cleaned {stats.cleaned_records} records")
print(f"Removed {stats.duplicates_removed} duplicates")
```

### Example 3: Manual Task Triggering

```python
from scraping_scheduler import scrape_faculty_task

# Configure universities
universities = [
    {
        'university_id': 'stanford',
        'university_name': 'Stanford University',
        'department': 'Computer Science',
        'url': 'https://cs.stanford.edu/people/faculty',
        'use_crawl': False,
        'max_pages': 20
    }
]

# Trigger task
task = scrape_faculty_task.delay(universities)

# Wait for result
result = task.get(timeout=3600)
print(f"Scraped {len(result['results'])} universities")
```

## 📄 License

This project is part of the EduLen platform. All rights reserved.

## 🤝 Contributing

For internal development team:

1. Create a feature branch
2. Make changes
3. Run tests
4. Submit pull request

## 📞 Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review logs in `logs/orchestrator.log`
- Check Celery worker output
- Monitor Redis and MongoDB status

---

**Generated:** October 12, 2025
**Version:** 1.0.0
**Maintainer:** EduLen Development Team
