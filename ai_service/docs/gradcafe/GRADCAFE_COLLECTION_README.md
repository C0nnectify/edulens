# GradCafe Automated Data Collection System

Complete automated system for collecting admission data from GradCafe (thegradcafe.com) integrated with the AI service.

## Overview

The GradCafe collection system provides:

- **Automated Daily Scraping**: Scheduled collection at 3 AM daily
- **Manual Collection Triggers**: API endpoints for on-demand collection
- **Data Quality Validation**: Automatic validation and quality scoring
- **Smart Scraping Strategies**: Focus on recent decisions, top universities, or specific programs
- **Statistics Tracking**: Comprehensive collection and data quality metrics
- **Deduplication**: SHA-256 hash-based duplicate detection
- **Background Processing**: Celery-based async task execution
- **MongoDB Storage**: Persistent storage in admission_data collection

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GradCafe Collection System                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │   API       │───▶│   Service    │───▶│  Scraper Engine │  │
│  │  Endpoints  │    │   Layer      │    │  (Playwright)   │  │
│  └─────────────┘    └──────────────┘    └─────────────────┘  │
│         │                   │                      │           │
│         │                   ▼                      │           │
│         │          ┌──────────────┐                │           │
│         │          │  Celery      │                │           │
│         │          │  Tasks       │                │           │
│         │          └──────────────┘                │           │
│         │                   │                      │           │
│         ▼                   ▼                      ▼           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              MongoDB Collections                        │  │
│  │  • admission_data (scraped results)                    │  │
│  │  • gradcafe_collection_jobs (job tracking)             │  │
│  │  • gradcafe_collection_history (historical runs)       │  │
│  │  • gradcafe_schedule_config (schedule settings)        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Models (`app/models/gradcafe_collection.py`)

**Pydantic Models:**

- `CollectionJob`: Tracks collection job state
- `CollectionTarget`: Defines scraping targets
- `DataPoint`: Individual admission result
- `DataPointProfile`: Student profile data (GPA, GRE, etc.)
- `CollectionStatistics`: Job and overall statistics
- `CollectionScheduleConfig`: Schedule configuration
- Various request/response models

### 2. Service (`app/services/gradcafe_collection_service.py`)

**Core Service Class: `GradCafeCollectionService`**

Key methods:
- `create_collection_job()`: Create new collection job
- `run_collection()`: Execute scraping using existing scraper
- `save_data_point()`: Save with validation and deduplication
- `validate_data_point()`: Quality validation
- `calculate_completeness_score()`: Completeness scoring (0-1)
- `get_collection_statistics()`: Overall statistics
- `get_recent_data()`: Paginated recent data

### 3. Celery Tasks (`app/tasks/gradcafe_tasks.py`)

**Background Tasks:**

- `collect_gradcafe_data()`: Main collection task
- `scheduled_daily_collection()`: Daily scheduled collection (3 AM)
- `seasonal_collection()`: Seasonal collection (more during peak)
- `collect_by_university()`: University-specific collection
- `update_collection_statistics()`: Refresh statistics
- `check_data_quality()`: Quality audits
- `cleanup_old_jobs()`: Clean old job records

### 4. API Endpoints (`app/api/v1/gradcafe_collection.py`)

**Available Endpoints:**

```
POST   /api/v1/gradcafe/trigger                    - Trigger collection
GET    /api/v1/gradcafe/status/{job_id}           - Get job status
GET    /api/v1/gradcafe/statistics                - Overall statistics
GET    /api/v1/gradcafe/history                   - Collection history
GET    /api/v1/gradcafe/data/recent               - Recent data points
POST   /api/v1/gradcafe/schedule                  - Update schedule
GET    /api/v1/gradcafe/schedule                  - Get schedule config
POST   /api/v1/gradcafe/export                    - Export data
DELETE /api/v1/gradcafe/job/{job_id}              - Cancel job
GET    /api/v1/gradcafe/stats/quality             - Quality statistics
POST   /api/v1/gradcafe/trigger/university/{name} - University collection
```

## Configuration

### Environment Variables (`.env`)

```bash
# GradCafe Collection
GRADCAFE_COLLECTION_ENABLED=true
GRADCAFE_DAILY_COLLECTION_TIME="03:00"
GRADCAFE_DEFAULT_LIMIT=50
GRADCAFE_SCRAPER_PATH="./train_ml/gradcafe_scraper.py"
GRADCAFE_NOTIFICATION_EMAILS="admin@edulen.com,team@edulen.com"

# MongoDB (existing)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# Redis for Celery (existing)
REDIS_URL=redis://localhost:6379/0
```

### Celery Beat Schedule

Add to your Celery configuration:

```python
from celery.schedules import crontab

beat_schedule = {
    'gradcafe-daily-collection': {
        'task': 'app.tasks.gradcafe_tasks.scheduled_daily_collection',
        'schedule': crontab(hour=3, minute=0),  # 3 AM daily
    },
    'gradcafe-update-statistics': {
        'task': 'app.tasks.gradcafe_tasks.update_collection_statistics',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
    },
    'gradcafe-quality-check': {
        'task': 'app.tasks.gradcafe_tasks.check_data_quality',
        'schedule': crontab(hour=12, minute=0),  # Noon daily
    },
    'gradcafe-cleanup-jobs': {
        'task': 'app.tasks.gradcafe_tasks.cleanup_old_jobs',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),  # 2 AM Sunday
    },
}
```

## Usage Examples

### 1. Manual Collection Trigger

```bash
# Trigger collection for specific programs
curl -X POST "http://localhost:8000/api/v1/gradcafe/trigger" \
  -H "Content-Type: application/json" \
  -d '{
    "programs": ["Computer Science", "Data Science"],
    "universities": ["MIT", "Stanford"],
    "limit_per_program": 50,
    "strategy": "recent_decisions",
    "run_async": true
  }'

# Response
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "celery_task_id": "abc123...",
  "status": "triggered",
  "message": "Collection job started in background"
}
```

### 2. Check Collection Status

```bash
curl "http://localhost:8000/api/v1/gradcafe/status/{job_id}"

# Response
{
  "job": {
    "job_id": "550e8400-...",
    "status": "running",
    "progress_percentage": 45.5,
    "statistics": {
      "total_records": 230,
      "new_records": 180,
      "duplicate_records": 50
    }
  },
  "is_running": true
}
```

### 3. Get Collection Statistics

```bash
curl "http://localhost:8000/api/v1/gradcafe/statistics"

# Response
{
  "total_records": 15430,
  "records_by_decision": {
    "Accepted": 8520,
    "Rejected": 5210,
    "Waitlisted": 1700
  },
  "records_by_university": {
    "MIT": 1250,
    "Stanford": 1180,
    ...
  },
  "average_completeness": 0.72,
  "high_quality_records": 10240,
  "low_quality_records": 1820,
  "collection_rate": {
    "last_7_days": 850,
    "last_30_days": 3420,
    "daily_average": 121.4
  }
}
```

### 4. Get Recent Data

```bash
curl "http://localhost:8000/api/v1/gradcafe/data/recent?page=1&page_size=100&university=MIT&min_completeness=0.6"

# Response
{
  "data_points": [
    {
      "data_point_id": "abc123...",
      "university": "MIT",
      "program": "Computer Science PhD",
      "decision": "Accepted",
      "season": "Fall 2024",
      "profile": {
        "gpa": 3.9,
        "gre_verbal": 168,
        "gre_quant": 170,
        "toefl": 115,
        "research_pubs": 5
      },
      "completeness_score": 0.85,
      "scraped_at": "2024-01-15T10:30:00"
    },
    ...
  ],
  "total_count": 1250,
  "page": 1,
  "page_size": 100
}
```

### 5. Update Collection Schedule

```bash
curl -X POST "http://localhost:8000/api/v1/gradcafe/schedule" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "cron_expression": "0 3 * * *",
    "strategy": "recent_decisions",
    "programs": ["Computer Science", "Data Science", "AI"],
    "limit_per_program": 100,
    "notify_on_completion": true,
    "notification_emails": ["admin@edulen.com"]
  }'
```

### 6. Export Data

```bash
curl -X POST "http://localhost:8000/api/v1/gradcafe/export" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "filters": {
      "university": "Stanford",
      "decision": "Accepted"
    },
    "include_low_quality": false,
    "limit": 5000
  }'

# Response
{
  "status": "success",
  "filename": "gradcafe_export_20240115_103000.csv",
  "filepath": "/uploads/exports/gradcafe_export_20240115_103000.csv",
  "records_exported": 1250,
  "format": "csv"
}
```

## Data Quality System

### Completeness Scoring

The system calculates a completeness score (0-1) based on:

**Weighted Fields:**
- University (10%)
- Program (10%)
- Decision (10%)
- Season (5%)
- Decision Date (5%)
- GPA (15%)
- GRE Verbal (10%)
- GRE Quant (10%)
- GRE AW (5%)
- TOEFL/IELTS (10%)
- Research Experience (5%)
- Institution (5%)

**Quality Thresholds:**
- High Quality: > 0.6 completeness
- Medium Quality: 0.3 - 0.6
- Low Quality: < 0.3

### Validation Checks

Automatic validation for:

1. **GPA Range**: 0.0 - (scale value)
2. **GRE Scores**:
   - Verbal: 130-170
   - Quant: 130-170
   - AW: 0-6.0
3. **TOEFL**: 0-120
4. **IELTS**: 0-9.0
5. **Date Logic**: Decision date ≤ Post date
6. **Suspicious Patterns**: All-zero scores flagged

### Quality Flags

- `high_completeness`: Score > 0.6
- `low_completeness`: Score < 0.3
- `invalid_gpa`: GPA out of range
- `invalid_gre_verbal/quant/aw`: GRE scores invalid
- `invalid_toefl`: TOEFL score invalid
- `invalid_ielts`: IELTS score invalid
- `invalid_dates`: Date logic error
- `suspicious_zeros`: All scores are zero

## Scraping Strategies

### 1. Recent Decisions (`recent_decisions`)
- Focus on last 30 days
- Higher priority for recent data
- Default for daily collection

### 2. Top Universities (`top_universities`)
- Focus on top 50 universities
- Comprehensive program coverage
- Good for building baseline dataset

### 3. By Program (`by_program`)
- Specific program targeting
- Useful for program-specific analysis
- Can target multiple programs

### 4. By Season (`by_season`)
- Seasonal collection patterns
- More aggressive during peak (Nov-Apr)
- Adjusts limits automatically

### 5. Comprehensive (`comprehensive`)
- Full scraping across all parameters
- Use sparingly (resource intensive)
- Best for initial data collection

## Integration with ML Service

The collected data feeds directly into the admission prediction ML model:

1. **Data Collection**: GradCafe scraper collects admission results
2. **Quality Validation**: Service validates and scores data
3. **Storage**: Saved to `admission_data` collection
4. **ML Training**: Model training service uses this data
5. **Prediction**: Trained model provides predictions

### Triggering Model Retraining

When sufficient new data is collected:

```python
from app.tasks.training_tasks import train_model_task

# Check if retraining needed
if new_records_count > 500:
    train_model_task.delay(
        min_samples=1000,
        test_size=0.2
    )
```

## Monitoring and Logging

### Key Metrics to Monitor

1. **Collection Rate**: Records per day
2. **Success Rate**: % of successful collections
3. **Duplicate Rate**: % of duplicates encountered
4. **Quality Distribution**: % high/medium/low quality
5. **Error Rate**: Collection errors and warnings
6. **Processing Time**: Time per collection job

### Logs Location

- Service logs: `logs/ai_service.log`
- Scraper logs: `train_ml/logs/gradcafe_scraper.log`
- Celery logs: Check Celery worker output

### Health Checks

```bash
# Check service health
curl "http://localhost:8000/health"

# Check recent collection activity
curl "http://localhost:8000/api/v1/gradcafe/history?limit=10"

# Check quality statistics
curl "http://localhost:8000/api/v1/gradcafe/stats/quality"
```

## Database Schema

### Collections

**1. admission_data** (Main data storage)
```json
{
  "data_point_id": "uuid",
  "hash": "sha256_hash",
  "university": "string",
  "program": "string",
  "decision": "Accepted|Rejected|Waitlisted",
  "decision_method": "string",
  "season": "Fall 2024",
  "decision_date": "2024-03-15",
  "post_date": "2024-03-20",
  "profile": {
    "gpa": 3.8,
    "gpa_scale": 4.0,
    "gre_verbal": 165,
    "gre_quant": 170,
    "gre_aw": 5.0,
    "toefl": 110,
    "research_pubs": 3,
    "is_international": true
  },
  "funding": "Full funding",
  "funding_amount": 50000,
  "completeness_score": 0.85,
  "quality_flags": ["high_completeness"],
  "collection_job_id": "uuid",
  "scraped_at": "2024-01-15T10:30:00"
}
```

**2. gradcafe_collection_jobs** (Job tracking)
```json
{
  "job_id": "uuid",
  "status": "completed",
  "priority": "medium",
  "target": {
    "programs": ["Computer Science"],
    "universities": ["MIT"],
    "strategy": "recent_decisions"
  },
  "statistics": {...},
  "created_at": "2024-01-15T03:00:00",
  "started_at": "2024-01-15T03:00:05",
  "completed_at": "2024-01-15T03:45:20",
  "celery_task_id": "abc123..."
}
```

**3. gradcafe_collection_history** (Historical runs)

**4. gradcafe_schedule_config** (Schedule settings)

## Troubleshooting

### Common Issues

**1. Scraper not collecting data**
- Check if GradCafe website structure changed
- Verify Playwright installation
- Check network connectivity

**2. High duplicate rate**
- Normal for frequent scraping
- Indicates good deduplication working
- Consider adjusting scraping frequency

**3. Low quality scores**
- Some GradCafe posts lack detail
- Filter using `min_completeness` parameter
- Focus on recent decisions (better quality)

**4. Celery tasks not running**
- Verify Celery worker is running
- Check Redis connection
- Verify beat schedule configuration

**5. MongoDB connection issues**
- Check MongoDB is running
- Verify connection string
- Check database permissions

## Performance Optimization

### Tips for Efficient Collection

1. **Rate Limiting**: Respect GradCafe's servers
   - Default: 2 seconds between requests
   - Increase if rate-limited

2. **Targeted Scraping**: Use specific strategies
   - Recent decisions for updates
   - Top universities for baseline
   - Avoid comprehensive unless necessary

3. **Scheduled Collections**: Use off-peak hours
   - Default: 3 AM daily
   - Adjust based on time zone

4. **Checkpoint Resume**: System can resume from failures
   - Automatic checkpoint saving
   - Resume capability built-in

5. **Database Indexes**: Ensure indexes created
   - Automatic on startup
   - Improves query performance

## Testing

Run tests:

```bash
# Run all collection tests
pytest ai_service/tests/test_gradcafe_collection.py -v

# Run specific test
pytest ai_service/tests/test_gradcafe_collection.py::TestGradCafeCollectionService::test_create_collection_job -v

# Run with coverage
pytest ai_service/tests/test_gradcafe_collection.py --cov=app/services/gradcafe_collection_service --cov-report=html
```

## Future Enhancements

Potential improvements:

1. **Real-time Scraping**: WebSocket-based live scraping
2. **ML-Enhanced Extraction**: Use ML for profile extraction
3. **Distributed Scraping**: Multiple workers for parallel collection
4. **Advanced Deduplication**: Fuzzy matching for near-duplicates
5. **User Profiles**: Link to registered users
6. **Verification System**: User-verified data points
7. **API Rate Limiting**: Per-user rate limits
8. **Webhooks**: Notify external services on collection
9. **Dashboard**: Real-time monitoring dashboard
10. **A/B Testing**: Test different scraping strategies

## Support

For issues or questions:
- Check logs: `logs/ai_service.log`
- Review API docs: `http://localhost:8000/docs`
- Contact: team@edulen.com

## License

Internal use only - EduLen Platform
