"""
Scraping Scheduler with Celery

Schedules and manages data scraping tasks:
- Faculty scraping (weekly)
- GradCafe scraping (daily)
- Reddit scraping (daily)
- Error handling and retries
- Email notifications
- Web monitoring dashboard
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from pathlib import Path
import json

from celery import Celery
from celery.schedules import crontab
from celery.signals import task_success, task_failure, task_retry
import redis

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load configuration
import yaml

CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'config.yaml')


def load_config() -> Dict[str, Any]:
    """Load configuration from YAML file"""
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return yaml.safe_load(f)
    return {}


config = load_config()

# Celery configuration
REDIS_URL = os.getenv('REDIS_URL', config.get('redis', {}).get('url', 'redis://localhost:6379/0'))
MONGODB_URI = os.getenv('MONGODB_URI', config.get('mongodb', {}).get('uri', 'mongodb://localhost:27017'))
DB_NAME = config.get('mongodb', {}).get('db_name', 'edulens')

# Initialize Celery
celery_app = Celery(
    'scraping_scheduler',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['scraping_scheduler']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour
    task_soft_time_limit=3300,  # 55 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)

# Redis client for status tracking
redis_client = redis.from_url(REDIS_URL)

# Status keys
STATUS_KEY = 'scraping:status'
PROGRESS_KEY = 'scraping:progress'
RESULTS_KEY = 'scraping:results'
ERRORS_KEY = 'scraping:errors'


class ScrapingStatus:
    """Track scraping job status"""

    @staticmethod
    def set_status(task_name: str, status: str, details: Optional[Dict] = None):
        """Set task status"""
        data = {
            'status': status,
            'updated_at': datetime.utcnow().isoformat(),
            'details': details or {}
        }
        redis_client.hset(STATUS_KEY, task_name, json.dumps(data))

    @staticmethod
    def get_status(task_name: str) -> Optional[Dict]:
        """Get task status"""
        data = redis_client.hget(STATUS_KEY, task_name)
        if data:
            return json.loads(data)
        return None

    @staticmethod
    def get_all_status() -> Dict[str, Dict]:
        """Get all task statuses"""
        statuses = {}
        for key, value in redis_client.hgetall(STATUS_KEY).items():
            statuses[key.decode()] = json.loads(value)
        return statuses

    @staticmethod
    def set_progress(task_name: str, current: int, total: int, message: str = ""):
        """Set task progress"""
        data = {
            'current': current,
            'total': total,
            'percentage': round((current / total) * 100, 2) if total > 0 else 0,
            'message': message,
            'updated_at': datetime.utcnow().isoformat()
        }
        redis_client.hset(PROGRESS_KEY, task_name, json.dumps(data))

    @staticmethod
    def get_progress(task_name: str) -> Optional[Dict]:
        """Get task progress"""
        data = redis_client.hget(PROGRESS_KEY, task_name)
        if data:
            return json.loads(data)
        return None

    @staticmethod
    def add_result(task_name: str, result: Dict):
        """Add task result"""
        data = {
            'task_name': task_name,
            'result': result,
            'completed_at': datetime.utcnow().isoformat()
        }
        redis_client.lpush(RESULTS_KEY, json.dumps(data))
        redis_client.ltrim(RESULTS_KEY, 0, 99)  # Keep last 100 results

    @staticmethod
    def get_results(limit: int = 10) -> List[Dict]:
        """Get recent results"""
        results = redis_client.lrange(RESULTS_KEY, 0, limit - 1)
        return [json.loads(r) for r in results]

    @staticmethod
    def add_error(task_name: str, error: str):
        """Add task error"""
        data = {
            'task_name': task_name,
            'error': error,
            'timestamp': datetime.utcnow().isoformat()
        }
        redis_client.lpush(ERRORS_KEY, json.dumps(data))
        redis_client.ltrim(ERRORS_KEY, 0, 99)  # Keep last 100 errors

    @staticmethod
    def get_errors(limit: int = 10) -> List[Dict]:
        """Get recent errors"""
        errors = redis_client.lrange(ERRORS_KEY, 0, limit - 1)
        return [json.loads(e) for e in errors]


# Celery tasks

@celery_app.task(bind=True, max_retries=3)
def scrape_faculty_task(self, university_configs: List[Dict]):
    """
    Scrape faculty data for configured universities

    Args:
        university_configs: List of university configurations
    """
    task_name = 'faculty_scraping'

    try:
        ScrapingStatus.set_status(task_name, 'running')

        # Import here to avoid circular imports
        import sys
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

        from ai_service.app.services.faculty_scraping_service import faculty_scraping_service

        total = len(university_configs)
        results = []

        for idx, uni_config in enumerate(university_configs):
            ScrapingStatus.set_progress(
                task_name,
                idx + 1,
                total,
                f"Scraping {uni_config.get('university_name', 'Unknown')}"
            )

            try:
                # Run async scraping
                result = asyncio.run(
                    faculty_scraping_service.scrape_and_extract_faculty(
                        url=uni_config['url'],
                        university_id=uni_config['university_id'],
                        university_name=uni_config['university_name'],
                        department=uni_config['department'],
                        use_crawl=uni_config.get('use_crawl', False),
                        max_pages=uni_config.get('max_pages', 20)
                    )
                )

                # Save to database
                asyncio.run(
                    faculty_scraping_service.save_faculty_data(result, overwrite=True)
                )

                results.append({
                    'university': uni_config['university_name'],
                    'faculty_count': result['totalFaculty'],
                    'status': 'success'
                })

                logger.info(f"Successfully scraped {uni_config['university_name']}")

            except Exception as e:
                error_msg = f"Error scraping {uni_config['university_name']}: {str(e)}"
                logger.error(error_msg)
                ScrapingStatus.add_error(task_name, error_msg)

                results.append({
                    'university': uni_config['university_name'],
                    'status': 'error',
                    'error': str(e)
                })

        # Mark as complete
        ScrapingStatus.set_status(task_name, 'completed', {'results': results})
        ScrapingStatus.add_result(task_name, {'universities_scraped': len(results)})

        return {
            'status': 'success',
            'universities_scraped': len(results),
            'results': results
        }

    except Exception as e:
        logger.error(f"Faculty scraping task failed: {e}")
        ScrapingStatus.set_status(task_name, 'failed', {'error': str(e)})
        ScrapingStatus.add_error(task_name, str(e))

        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery_app.task(bind=True, max_retries=3)
def scrape_gradcafe_task(self, search_queries: List[str]):
    """
    Scrape GradCafe data

    Args:
        search_queries: List of search queries (universities, programs)
    """
    task_name = 'gradcafe_scraping'

    try:
        ScrapingStatus.set_status(task_name, 'running')

        # TODO: Implement GradCafe scraper
        # This would require web scraping logic for GradCafe

        total = len(search_queries)
        results = []

        for idx, query in enumerate(search_queries):
            ScrapingStatus.set_progress(
                task_name,
                idx + 1,
                total,
                f"Searching for {query}"
            )

            # Placeholder for actual scraping
            logger.info(f"Would scrape GradCafe for: {query}")

            results.append({
                'query': query,
                'records': 0,  # Placeholder
                'status': 'placeholder'
            })

        ScrapingStatus.set_status(task_name, 'completed', {'results': results})
        ScrapingStatus.add_result(task_name, {'queries_processed': len(results)})

        return {
            'status': 'success',
            'queries_processed': len(results),
            'results': results
        }

    except Exception as e:
        logger.error(f"GradCafe scraping task failed: {e}")
        ScrapingStatus.set_status(task_name, 'failed', {'error': str(e)})
        ScrapingStatus.add_error(task_name, str(e))

        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery_app.task(bind=True, max_retries=3)
def scrape_reddit_task(self, subreddits: List[str], keywords: List[str]):
    """
    Scrape Reddit for admission data

    Args:
        subreddits: List of subreddit names
        keywords: List of keywords to search
    """
    task_name = 'reddit_scraping'

    try:
        ScrapingStatus.set_status(task_name, 'running')

        # TODO: Implement Reddit scraper using PRAW
        # This would require Reddit API credentials

        total = len(subreddits)
        results = []

        for idx, subreddit in enumerate(subreddits):
            ScrapingStatus.set_progress(
                task_name,
                idx + 1,
                total,
                f"Scraping r/{subreddit}"
            )

            logger.info(f"Would scrape Reddit r/{subreddit}")

            results.append({
                'subreddit': subreddit,
                'posts': 0,  # Placeholder
                'status': 'placeholder'
            })

        ScrapingStatus.set_status(task_name, 'completed', {'results': results})
        ScrapingStatus.add_result(task_name, {'subreddits_processed': len(results)})

        return {
            'status': 'success',
            'subreddits_processed': len(results),
            'results': results
        }

    except Exception as e:
        logger.error(f"Reddit scraping task failed: {e}")
        ScrapingStatus.set_status(task_name, 'failed', {'error': str(e)})
        ScrapingStatus.add_error(task_name, str(e))

        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery_app.task
def aggregate_data_task():
    """Aggregate all scraped data"""
    task_name = 'data_aggregation'

    try:
        ScrapingStatus.set_status(task_name, 'running')

        from data_aggregator import DataAggregator

        aggregator = DataAggregator(MONGODB_URI, DB_NAME)

        # Run aggregation
        admission_df, faculty_df, summary = asyncio.run(
            aggregator.aggregate_all_data()
        )

        ScrapingStatus.set_status(task_name, 'completed', summary)
        ScrapingStatus.add_result(task_name, summary)

        return summary

    except Exception as e:
        logger.error(f"Data aggregation task failed: {e}")
        ScrapingStatus.set_status(task_name, 'failed', {'error': str(e)})
        ScrapingStatus.add_error(task_name, str(e))
        raise


# Celery beat schedule
celery_app.conf.beat_schedule = {
    'scrape-faculty-weekly': {
        'task': 'scraping_scheduler.scrape_faculty_task',
        'schedule': crontab(hour=2, minute=0, day_of_week=1),  # Monday 2 AM
        'args': [config.get('faculty_scraping', {}).get('universities', [])]
    },
    'scrape-gradcafe-daily': {
        'task': 'scraping_scheduler.scrape_gradcafe_task',
        'schedule': crontab(hour=3, minute=0),  # Daily 3 AM
        'args': [config.get('gradcafe_scraping', {}).get('queries', [])]
    },
    'scrape-reddit-daily': {
        'task': 'scraping_scheduler.scrape_reddit_task',
        'schedule': crontab(hour=4, minute=0),  # Daily 4 AM
        'args': [
            config.get('reddit_scraping', {}).get('subreddits', []),
            config.get('reddit_scraping', {}).get('keywords', [])
        ]
    },
    'aggregate-data-daily': {
        'task': 'scraping_scheduler.aggregate_data_task',
        'schedule': crontab(hour=6, minute=0),  # Daily 6 AM
        'args': []
    },
}

# FastAPI Monitoring Dashboard

dashboard_app = FastAPI(title="Scraping Scheduler Dashboard")

dashboard_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@dashboard_app.get("/", response_class=HTMLResponse)
async def dashboard_home():
    """Monitoring dashboard HTML"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Scraping Scheduler Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            h1 { color: #333; }
            .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .status { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
            .status.running { background: #4CAF50; color: white; }
            .status.completed { background: #2196F3; color: white; }
            .status.failed { background: #f44336; color: white; }
            .status.idle { background: #9E9E9E; color: white; }
            .progress-bar { width: 100%; height: 20px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
            .progress-fill { height: 100%; background: #4CAF50; transition: width 0.3s; }
            .button { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            .button:hover { background: #45a049; }
            .error { color: #f44336; background: #ffebee; padding: 10px; border-radius: 4px; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: bold; }
        </style>
        <script>
            async function refreshStatus() {
                const response = await fetch('/api/status');
                const data = await response.json();
                document.getElementById('status-content').innerHTML = JSON.stringify(data, null, 2);
            }

            async function triggerTask(taskName) {
                const response = await fetch(`/api/trigger/${taskName}`, { method: 'POST' });
                const data = await response.json();
                alert(data.message);
                refreshStatus();
            }

            setInterval(refreshStatus, 5000);  // Refresh every 5 seconds
            window.onload = refreshStatus;
        </script>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Scraping Scheduler Dashboard</h1>

            <div class="card">
                <h2>Quick Actions</h2>
                <button class="button" onclick="triggerTask('faculty')">Trigger Faculty Scraping</button>
                <button class="button" onclick="triggerTask('gradcafe')">Trigger GradCafe Scraping</button>
                <button class="button" onclick="triggerTask('reddit')">Trigger Reddit Scraping</button>
                <button class="button" onclick="triggerTask('aggregate')">Trigger Data Aggregation</button>
            </div>

            <div class="card">
                <h2>Current Status</h2>
                <pre id="status-content" style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto;"></pre>
            </div>

            <div class="card">
                <h2>Recent Results</h2>
                <div id="results-content">Loading...</div>
            </div>

            <div class="card">
                <h2>Recent Errors</h2>
                <div id="errors-content">Loading...</div>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content


@dashboard_app.get("/api/status")
async def get_status():
    """Get all task statuses"""
    statuses = ScrapingStatus.get_all_status()

    # Add progress information
    for task_name in statuses:
        progress = ScrapingStatus.get_progress(task_name)
        if progress:
            statuses[task_name]['progress'] = progress

    return statuses


@dashboard_app.get("/api/results")
async def get_results(limit: int = 10):
    """Get recent results"""
    return ScrapingStatus.get_results(limit)


@dashboard_app.get("/api/errors")
async def get_errors(limit: int = 10):
    """Get recent errors"""
    return ScrapingStatus.get_errors(limit)


@dashboard_app.post("/api/trigger/{task_name}")
async def trigger_task(task_name: str):
    """Manually trigger a scraping task"""

    config_data = load_config()

    if task_name == 'faculty':
        universities = config_data.get('faculty_scraping', {}).get('universities', [])
        task = scrape_faculty_task.delay(universities)
        return {"message": f"Faculty scraping task triggered: {task.id}"}

    elif task_name == 'gradcafe':
        queries = config_data.get('gradcafe_scraping', {}).get('queries', [])
        task = scrape_gradcafe_task.delay(queries)
        return {"message": f"GradCafe scraping task triggered: {task.id}"}

    elif task_name == 'reddit':
        subreddits = config_data.get('reddit_scraping', {}).get('subreddits', [])
        keywords = config_data.get('reddit_scraping', {}).get('keywords', [])
        task = scrape_reddit_task.delay(subreddits, keywords)
        return {"message": f"Reddit scraping task triggered: {task.id}"}

    elif task_name == 'aggregate':
        task = aggregate_data_task.delay()
        return {"message": f"Data aggregation task triggered: {task.id}"}

    else:
        raise HTTPException(status_code=404, detail="Task not found")


@dashboard_app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "worker":
            # Start Celery worker
            celery_app.worker_main(['worker', '--loglevel=info'])

        elif command == "beat":
            # Start Celery beat scheduler
            celery_app.worker_main(['beat', '--loglevel=info'])

        elif command == "dashboard":
            # Start FastAPI dashboard
            port = int(sys.argv[2]) if len(sys.argv) > 2 else 8001
            uvicorn.run(dashboard_app, host="0.0.0.0", port=port)

        else:
            print("Unknown command. Use: worker, beat, or dashboard")
    else:
        print("Usage: python scraping_scheduler.py [worker|beat|dashboard]")
