# Train ML Documentation

This directory contains documentation for the machine learning training and data collection components of the EduLen platform.

## Quick Start

**New here?** Start with these files:
- [`START_HERE.md`](./START_HERE.md) - Complete getting started guide
- [`README_START_HERE.md`](./README_START_HERE.md) - Quick reference for setup
- [`INDEX.md`](./INDEX.md) - Documentation index
- [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - Common commands and operations

## Documentation Structure

### `/gradcafe/` - GradCafe Scraping System
Automated scraping and processing of graduate admission results from GradCafe forums.

- [`README_GRADCAFE_COMPLETE.md`](./gradcafe/README_GRADCAFE_COMPLETE.md) - Complete GradCafe system overview
- [`README_GRADCAFE_SCRAPER.md`](./gradcafe/README_GRADCAFE_SCRAPER.md) - Scraper implementation
- [`GRADCAFE_IMPLEMENTATION_SUMMARY.md`](./gradcafe/GRADCAFE_IMPLEMENTATION_SUMMARY.md) - Implementation details
- [`GRADCAFE_INTEGRATION_GUIDE.md`](./gradcafe/GRADCAFE_INTEGRATION_GUIDE.md) - Integration guide
- [`QUICK_START_GRADCAFE.md`](./gradcafe/QUICK_START_GRADCAFE.md) - Quick start guide

### `/reddit/` - Reddit Data Collection
Reddit scraping for graduate school discussions and admission insights.

- [`README_REDDIT.md`](./reddit/README_REDDIT.md) - Reddit scraper overview
- [`README_REDDIT_SCRAPER.md`](./reddit/README_REDDIT_SCRAPER.md) - Scraper implementation
- [`QUICK_START_REDDIT.md`](./reddit/QUICK_START_REDDIT.md) - Quick start guide

### `/faculty/` - Faculty Data Collection
Faculty research information scraping for PhD program matching.

- [`README_FACULTY_SCRAPER.md`](./faculty/README_FACULTY_SCRAPER.md) - Faculty scraper overview
- [`FACULTY_SCRAPER_SUMMARY.md`](./faculty/FACULTY_SCRAPER_SUMMARY.md) - Implementation summary

### `/guides/` - Configuration & Integration Guides
Setup guides and orchestration documentation.

- [`AUTHENTICATION_SETUP_GUIDE.md`](./guides/AUTHENTICATION_SETUP_GUIDE.md) - Authentication configuration
- [`INTEGRATION_GUIDE.md`](./guides/INTEGRATION_GUIDE.md) - System integration guide
- [`ORCHESTRATOR_SUMMARY.md`](./guides/ORCHESTRATOR_SUMMARY.md) - Orchestrator overview
- [`README_ORCHESTRATOR.md`](./guides/README_ORCHESTRATOR.md) - Orchestrator setup
- [`EXAMPLES.md`](./guides/EXAMPLES.md) - Code examples and usage patterns

### Root Documentation
- [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) - Overall implementation summary
- [`COMPLETE_IMPLEMENTATION_SUMMARY.md`](./COMPLETE_IMPLEMENTATION_SUMMARY.md) - Complete system summary
- [`QUICK_START.md`](./QUICK_START.md) - General quick start guide

## System Overview

The train_ml component provides:

1. **Data Collection**
   - GradCafe admission results scraping
   - Reddit graduate school discussions
   - Faculty research profiles and interests

2. **Data Processing**
   - Text cleaning and normalization
   - Structured data extraction
   - Deduplication and validation

3. **Training Pipeline**
   - Feature engineering from collected data
   - Model training for admission prediction
   - Integration with AI service ML endpoints

## Common Tasks

### Run GradCafe Scraper
```bash
python gradcafe_scraper.py --universities "MIT,Stanford"
```

### Run Reddit Scraper
```bash
python reddit_scraper.py --subreddits "gradadmissions,PhD"
```

### Run Faculty Scraper
```bash
python faculty_scraper.py --university "MIT" --department "Computer Science"
```

## Data Flow

```
Data Sources (GradCafe, Reddit, Faculty Pages)
    ↓
Scrapers (collect raw data)
    ↓
Processors (clean & structure)
    ↓
MongoDB (store processed data)
    ↓
Training Pipeline (feature engineering)
    ↓
ML Models (admission prediction, faculty matching)
    ↓
AI Service APIs (serve predictions)
```

## Integration with AI Service

This training component feeds data into the AI service:
- Scraped data is stored in MongoDB
- AI service accesses this data for model training
- Trained models are deployed via AI service APIs
- See [`guides/INTEGRATION_GUIDE.md`](./guides/INTEGRATION_GUIDE.md) for details

## Authentication & Rate Limiting

Many data sources require authentication and have rate limits:
- See [`guides/AUTHENTICATION_SETUP_GUIDE.md`](./guides/AUTHENTICATION_SETUP_GUIDE.md) for setup
- Configure credentials in `.env` file
- Scrapers implement exponential backoff and retry logic

## Contributing

When adding new scrapers or documentation:
1. Place documentation in the appropriate category folder
2. Include code examples and configuration details
3. Update this README with links to new docs
4. Document rate limits and authentication requirements
5. Add error handling and retry logic examples
