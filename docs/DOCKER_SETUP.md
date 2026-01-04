# Docker Setup for EduLen

This guide explains how to run the entire EduLen application stack using Docker.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd edulen
   ```

2. **Create your environment file**:
   
   Copy the environment template and fill in your values:
   ```bash
   # For the frontend (Next.js)
   cp docs/env-template.txt .env.local
   
   # For the AI service
   cp ai_service/.env.example ai_service/.env
   ```
   
   Edit these files with your actual API keys and secrets.

3. **Build and start all services**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - AI Service API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Services Overview

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 3000 | Next.js web application |
| `ai-service` | 8000 | Python FastAPI backend with AI capabilities |
| `mongodb` | 27017 | MongoDB database |

## Development Commands

### Start all services
```bash
docker-compose up
```

### Start in detached mode (background)
```bash
docker-compose up -d
```

### Rebuild containers after code changes
```bash
docker-compose up --build
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes (fresh start)
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f ai-service
```

### Enter a running container
```bash
docker-compose exec frontend sh
docker-compose exec ai-service bash
```

## Environment Variables

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017/edulens` |
| `BETTER_AUTH_SECRET` | Authentication secret key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `NEXT_PUBLIC_AI_SERVICE_URL` | AI service URL (client-side) | `http://localhost:8000` |
| `AI_SERVICE_URL` | AI service URL (server-side) | `http://ai-service:8000` |

### AI Service (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017` |
| `MONGODB_DB_NAME` | Database name | `edulens` |
| `GOOGLE_API_KEY` | Google AI API key | Required for AI features |
| `OPENAI_API_KEY` | OpenAI API key | Optional |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│    Frontend     │────▶│   AI Service    │
│   (Next.js)     │     │   (FastAPI)     │
│   Port: 3000    │     │   Port: 8000    │
│                 │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
            ┌─────────────────┐
            │                 │
            │    MongoDB      │
            │   Port: 27017   │
            │                 │
            └─────────────────┘
```

## Troubleshooting

### Port already in use
If you see an error about ports being in use, stop any local services running on ports 3000, 8000, or 27017:
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### MongoDB connection issues
Ensure MongoDB is fully started before the other services connect:
```bash
docker-compose up mongodb -d
# Wait a few seconds
docker-compose up
```

### Rebuild from scratch
If you're having persistent issues:
```bash
docker-compose down -v
docker system prune -f
docker-compose up --build
```

## Production Deployment

For production, you should:

1. Use proper secrets management (not environment files)
2. Set up HTTPS with a reverse proxy (nginx, Traefik)
3. Use managed MongoDB (Atlas) or secure your MongoDB instance
4. Set `NODE_ENV=production` and `ENVIRONMENT=production`
5. Consider using Docker Swarm or Kubernetes for orchestration
