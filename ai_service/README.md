# EduLen AI Service

Comprehensive AI-powered microservice for study abroad applications featuring vector stores, tracking agents, and intelligent automation.

## 🚀 Features

### 📚 Vector Store System
- **User-specific Collections**: Each user gets isolated document collections
- **Multi-format Support**: PDF, DOCX, TXT, Markdown
- **Smart Embeddings**: Google Gemini-powered semantic search
- **Specialized Collections**:
  - Professional Resumes
  - Academic CVs
  - Statements of Purpose (SOPs)
  - General Documents

### 🤖 AI Agents
- **Document Generation Agent**: Create and optimize application documents
- **University Tracker Agent**: Monitor application portals automatically
- **Research Agent**: Deep research on universities, programs, scholarships
- **Professor Finder**: LinkedIn integration for connecting with faculty

### ⚡ Automation Features
- **Scheduled Portal Checks**: Monitor university websites every 6 hours
- **Email Notifications**: Instant alerts for application updates
- **Travel Planning**: Cost analysis and itinerary generation
- **Study Abroad Planner**: Comprehensive planning with budget analysis

## 🏗️ Architecture

```
├── FastAPI Application (Port 8000)
├── Celery Workers (Async Tasks)
├── Celery Beat (Scheduler)
├── Redis (Message Broker)
├── ChromaDB (Vector Database)
└── SMTP (Email Notifications)
```

## 📋 Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Google Gemini API Key
- SMTP Email Credentials (Gmail recommended)
- Firecrawl API Key (for web scraping)

## 🔧 Installation

### Option 1: Docker (Recommended)

1. **Clone and navigate to the service directory**
```bash
cd ai_service
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys and credentials
```

3. **Build and start services**
```bash
# Using docker-compose
docker-compose up -d

# Or using Make
make up
```

4. **Check service health**
```bash
curl http://localhost:8000/health
```

### Option 2: Local Development

1. **Install dependencies**
```bash
pip install -r requirements.txt
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start services separately**

Terminal 1 - API Server:
```bash
uvicorn main:app --reload
```

Terminal 2 - Celery Worker:
```bash
celery -A app.core.celery_app:celery_app worker --loglevel=info
```

Terminal 3 - Celery Beat:
```bash
celery -A app.core.celery_app:celery_app beat --loglevel=info
```

Terminal 4 - Redis:
```bash
redis-server
```

## 🔑 Environment Variables

### Required
```env
GOOGLE_API_KEY=your_gemini_api_key
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
FIRECRAWL_API_KEY=your_firecrawl_key
SECRET_KEY=your_secret_key
```

### Optional
```env
CHROMA_PERSIST_DIRECTORY=./chroma_db
REDIS_URL=redis://localhost:6379/0
API_PORT=8000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

## 📖 API Documentation

Once running, access interactive API docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Core Endpoints

#### Vector Store
```bash
# Upload document
POST /api/v1/vector-store/upload

# Query documents
POST /api/v1/vector-store/query

# List collections
GET /api/v1/vector-store/collections/{user_id}
```

#### Resume Collection
```bash
# Upload resume
POST /api/v1/resume/upload

# Analyze resume against job
POST /api/v1/resume/{user_id}/analyze

# Query resume
POST /api/v1/resume/query
```

#### CV Collection
```bash
# Upload CV
POST /api/v1/cv/upload

# Add CV content
POST /api/v1/cv/add

# Get CV info
GET /api/v1/cv/{user_id}/info
```

#### SOP Collection
```bash
# Upload SOP
POST /api/v1/sop/upload

# Get SOP by university
GET /api/v1/sop/{user_id}/by-university/{university}
```

#### University Tracker
```bash
# Create tracker
POST /api/v1/tracker/create

# Manual check
POST /api/v1/tracker/check

# List trackers
GET /api/v1/tracker/{user_id}/trackers
```

#### Research Agent
```bash
# Deep research
POST /api/v1/research/deep-research

# Find professors
POST /api/v1/research/find-professors

# Travel planning
POST /api/v1/research/travel-plan

# Study abroad plan
POST /api/v1/research/study-abroad-plan

# Check task status
GET /api/v1/research/task/{task_id}
```

## 🎯 Usage Examples

### Upload and Query Resume

```python
import requests

# Upload resume
with open('resume.pdf', 'rb') as f:
    files = {'file': f}
    data = {'user_id': 'user123'}
    response = requests.post(
        'http://localhost:8000/api/v1/resume/upload',
        files=files,
        data=data
    )
    print(response.json())

# Query resume
query_data = {
    'user_id': 'user123',
    'collection_type': 'resume',
    'query_text': 'software engineering experience',
    'n_results': 5
}
response = requests.post(
    'http://localhost:8000/api/v1/resume/query',
    json=query_data
)
print(response.json())
```

### Create University Tracker

```python
tracker_data = {
    'user_id': 'user123',
    'university_url': 'https://apply.stanford.edu',
    'tracking_type': 'application_status',
    'email_notifications': True
}
response = requests.post(
    'http://localhost:8000/api/v1/tracker/create',
    json=tracker_data
)
print(response.json())
```

### Initiate Deep Research

```python
research_data = {
    'user_id': 'user123',
    'query': 'Best Computer Science programs in USA',
    'research_type': 'university',
    'depth': 'deep'
}
response = requests.post(
    'http://localhost:8000/api/v1/research/deep-research',
    json=research_data
)
task_id = response.json()['data']['task_id']

# Check task status
status_response = requests.get(
    f'http://localhost:8000/api/v1/research/task/{task_id}'
)
print(status_response.json())
```

## 🐳 Docker Commands

```bash
# Build images
make build

# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Restart services
make restart

# Clean up (removes volumes)
make clean

# Development mode (with hot reload)
make dev-up
```

## 📊 Monitoring

### Flower (Celery Monitoring)
Access Celery task monitoring at: http://localhost:5555

### Health Check
```bash
curl http://localhost:8000/health
```

### Service Status
```bash
curl http://localhost:8000/api/v1/agents/status
```

## 🔐 Security

- API keys stored in environment variables
- User data isolated in separate collections
- SMTP credentials encrypted in transit
- Rate limiting on API endpoints
- Input validation with Pydantic

## 🧪 Testing

```bash
# Run tests in Docker
make test

# Run tests locally
pytest
```

## 📝 Scheduled Tasks

### Automatic Schedules
- **University Portal Checks**: Every 6 hours
- **Daily Summaries**: 8:00 AM UTC
- **Data Cleanup**: 2:00 AM UTC daily

### Custom Schedules
Edit `app/core/celery_app.py` to modify schedules.

## 🛠️ Development

### Project Structure
```
ai_service/
├── app/
│   ├── api/v1/          # API endpoints
│   ├── core/            # Config, ChromaDB, Celery
│   ├── models/          # Pydantic schemas
│   ├── services/        # Business logic
│   └── tasks/           # Celery tasks
├── chroma_db/           # Vector database storage
├── logs/                # Application logs
├── main.py              # FastAPI app
├── requirements.txt     # Python dependencies
├── Dockerfile           # Docker image
└── docker-compose.yml   # Multi-container setup
```

### Adding New Features
1. Create service in `app/services/`
2. Add Celery task in `app/tasks/`
3. Create API endpoint in `app/api/v1/`
4. Update schemas in `app/models/schemas.py`

## 🐛 Troubleshooting

### ChromaDB Connection Issues
```bash
# Check ChromaDB directory permissions
ls -la chroma_db/

# Recreate ChromaDB
rm -rf chroma_db/*
docker-compose restart api
```

### Celery Tasks Not Running
```bash
# Check Redis connection
docker-compose logs redis

# Restart Celery workers
docker-compose restart celery_worker celery_beat
```

### Email Not Sending
```bash
# Verify SMTP credentials
# For Gmail, use App Password, not account password
# Enable "Less secure app access" if using regular password
```

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Firecrawl Documentation](https://www.firecrawl.dev/)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📧 Support

For issues and questions:
- GitHub Issues: [Create an issue](#)
- Email: support@edulen.com
