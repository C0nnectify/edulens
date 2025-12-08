# GradCafe Collection System - Quick Start Guide

Get started with automated GradCafe data collection in 5 minutes.

## Prerequisites

- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`
- Python 3.9+ with dependencies installed
- Existing scraper at `/home/ismail/edulen/train_ml/gradcafe_scraper.py`

## Installation

1. **Install Python dependencies** (already in `pyproject.toml`):
```bash
cd ai_service
uv sync
```

2. **Install Playwright** (for scraper):
```bash
playwright install chromium
```

3. **Configure environment variables** (`.env`):
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# Redis for Celery
REDIS_URL=redis://localhost:6379/0

# GradCafe Collection
GRADCAFE_COLLECTION_ENABLED=true
GRADCAFE_DEFAULT_LIMIT=50
```

## Quick Start

### 1. Start the Services

**Terminal 1 - Start FastAPI server:**
```bash
cd ai_service
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Start Celery worker:**
```bash
cd ai_service
celery -A app.tasks.celery_app worker --loglevel=info
```

**Terminal 3 - Start Celery beat (for scheduling):**
```bash
cd ai_service
celery -A app.tasks.celery_app beat --loglevel=info
```

### 2. Trigger Your First Collection

```bash
curl -X POST "http://localhost:8000/api/v1/gradcafe/trigger" \
  -H "Content-Type: application/json" \
  -d '{
    "programs": ["Computer Science"],
    "universities": ["MIT", "Stanford"],
    "limit_per_program": 10,
    "strategy": "recent_decisions",
    "run_async": true
  }'
```

Response:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "celery_task_id": "abc123...",
  "status": "triggered",
  "message": "Collection job started in background"
}
```

### 3. Check Collection Status

```bash
# Replace {job_id} with your job ID from step 2
curl "http://localhost:8000/api/v1/gradcafe/status/{job_id}"
```

### 4. View Collected Data

```bash
curl "http://localhost:8000/api/v1/gradcafe/data/recent?page=1&page_size=10"
```

### 5. View Statistics

```bash
curl "http://localhost:8000/api/v1/gradcafe/statistics"
```

## Common Use Cases

### Collect Data for Multiple Programs

```bash
curl -X POST "http://localhost:8000/api/v1/gradcafe/trigger" \
  -H "Content-Type: application/json" \
  -d '{
    "programs": [
      "Computer Science",
      "Data Science",
      "Artificial Intelligence",
      "Machine Learning"
    ],
    "limit_per_program": 50,
    "strategy": "recent_decisions"
  }'
```

### Collect Data for a Specific University

```bash
curl -X POST "http://localhost:8000/api/v1/gradcafe/trigger/university/MIT?limit=100"
```

### Filter High-Quality Data

```bash
curl "http://localhost:8000/api/v1/gradcafe/data/recent?min_completeness=0.7&page_size=50"
```

### Export Data to CSV

```bash
curl -X POST "http://localhost:8000/api/v1/gradcafe/export" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "filters": {
      "decision": "Accepted"
    },
    "include_low_quality": false
  }'
```

## Scheduled Collection Setup

### Enable Daily Collection at 3 AM

```bash
curl -X POST "http://localhost:8000/api/v1/gradcafe/schedule" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "cron_expression": "0 3 * * *",
    "strategy": "recent_decisions",
    "programs": [
      "Computer Science",
      "Data Science",
      "AI",
      "MBA"
    ],
    "limit_per_program": 50,
    "notify_on_completion": true,
    "notification_emails": ["admin@edulen.com"]
  }'
```

### Check Current Schedule

```bash
curl "http://localhost:8000/api/v1/gradcafe/schedule"
```

## Monitoring

### View Collection History

```bash
curl "http://localhost:8000/api/v1/gradcafe/history?limit=20"
```

### Check Data Quality

```bash
curl "http://localhost:8000/api/v1/gradcafe/stats/quality"
```

### Monitor Recent Collections

```bash
# Last 7 days activity
curl "http://localhost:8000/api/v1/gradcafe/statistics" | jq '.collection_rate'
```

## API Documentation

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Navigate to the "GradCafe Collection" section for all available endpoints.

## Data Structure

### Collected Data Point Example

```json
{
  "data_point_id": "abc-123",
  "university": "MIT",
  "program": "Computer Science PhD",
  "decision": "Accepted",
  "season": "Fall 2024",
  "decision_date": "2024-03-15",
  "profile": {
    "gpa": 3.9,
    "gpa_scale": 4.0,
    "gre_verbal": 168,
    "gre_quant": 170,
    "gre_aw": 5.5,
    "toefl": 115,
    "research_pubs": 5,
    "research_years": 3,
    "is_international": true,
    "undergrad_institution": "IIT Bombay"
  },
  "funding": "Full funding",
  "funding_amount": 50000,
  "completeness_score": 0.92,
  "quality_flags": ["high_completeness"],
  "scraped_at": "2024-01-15T10:30:00Z"
}
```

## Troubleshooting

### Collection Not Starting

1. **Check Celery worker is running:**
```bash
celery -A app.tasks.celery_app inspect active
```

2. **Check Redis connection:**
```bash
redis-cli ping
```

3. **Check MongoDB connection:**
```bash
mongosh --eval "db.adminCommand('ping')"
```

### No Data Being Collected

1. **Check scraper logs:**
```bash
tail -f train_ml/logs/gradcafe_scraper.log
```

2. **Verify scraper path in config:**
```bash
echo $GRADCAFE_SCRAPER_PATH
```

3. **Test scraper directly:**
```bash
cd train_ml
python gradcafe_scraper.py scrape --program "Computer Science" --years 2024
```

### High Duplicate Rate

This is normal for frequent scraping. The system is working correctly if:
- Duplicate rate > 50% after initial collection
- New records still being found
- No errors in logs

### Low Quality Scores

Some GradCafe posts naturally lack detail. To improve:
- Focus on recent decisions (better quality)
- Target top universities (more detailed posts)
- Filter using `min_completeness` parameter

## Next Steps

1. **Set up automated collection:**
   - Configure schedule for your needs
   - Set up notification emails

2. **Integrate with ML model:**
   - Collected data automatically available for training
   - Trigger model retraining when sufficient data

3. **Monitor and optimize:**
   - Review quality statistics regularly
   - Adjust scraping strategies based on results
   - Fine-tune collection parameters

4. **Export and analyze:**
   - Export data for external analysis
   - Use statistics API for dashboards
   - Build custom reports

## Support Resources

- **Full Documentation**: `GRADCAFE_COLLECTION_README.md`
- **API Reference**: `http://localhost:8000/docs`
- **Scraper Documentation**: `train_ml/gradcafe_scraper.py`
- **Service Logs**: `logs/ai_service.log`

## Configuration Examples

### Minimal Collection (Testing)

```json
{
  "programs": ["Computer Science"],
  "limit_per_program": 5,
  "strategy": "recent_decisions"
}
```

### Comprehensive Collection (Initial Dataset)

```json
{
  "programs": [
    "Computer Science", "Data Science", "AI",
    "Electrical Engineering", "Mechanical Engineering",
    "MBA", "Business Administration", "Finance"
  ],
  "universities": null,
  "limit_per_program": 100,
  "strategy": "comprehensive"
}
```

### Targeted Collection (Specific University)

```json
{
  "programs": ["Computer Science", "Data Science", "AI"],
  "universities": ["Stanford"],
  "limit_per_program": 50,
  "strategy": "top_universities"
}
```

### Seasonal Collection (Peak Application Season)

```json
{
  "programs": [
    "Computer Science", "Data Science", "AI",
    "Machine Learning", "Software Engineering"
  ],
  "limit_per_program": 100,
  "strategy": "by_season"
}
```

## Best Practices

1. **Start Small**: Test with 1-2 programs and low limits
2. **Monitor First Run**: Watch logs during first collection
3. **Gradual Scaling**: Increase limits gradually
4. **Off-Peak Hours**: Schedule for low-traffic hours (3 AM)
5. **Quality Over Quantity**: Use `min_completeness` filters
6. **Regular Monitoring**: Check statistics weekly
7. **Backup Data**: Export data periodically

## Performance Tips

- **Rate Limiting**: Respect GradCafe's servers (2s delay default)
- **Targeted Scraping**: Use specific strategies, not comprehensive
- **Database Indexes**: Automatically created on startup
- **Async Processing**: Always use `run_async: true` for large jobs
- **Checkpointing**: System automatically saves progress

---

You're now ready to start collecting GradCafe data! For detailed information, refer to `GRADCAFE_COLLECTION_README.md`.
