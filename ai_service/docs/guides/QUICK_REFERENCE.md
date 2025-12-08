# AI Document Processing Service - Quick Reference

## Quick Start Commands

```bash
# Navigate to service
cd ai_service

# Setup (first time)
cp .env.example .env
# Edit .env with your config
pip install -r requirements.txt

# Run locally
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the start script
./start.sh

# Run with Docker
docker-compose up -d

# View logs
docker-compose logs -f ai-service

# Stop
docker-compose down
```

## API Quick Reference

### Base URL
```
http://localhost:8000
```

### Authentication
All API endpoints (except /health) require JWT token:
```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Upload Document
```bash
POST /api/documents/upload
Content-Type: multipart/form-data

Form Data:
  file: <file>
  tags: "tag1,tag2"
```

#### Search Documents
```bash
POST /api/search
Content-Type: application/json

{
  "query": "search text",
  "mode": "semantic",  # or "keyword" or "hybrid"
  "top_k": 5,
  "tags": ["optional"],
  "document_id": "optional"
}
```

#### Generate Embeddings
```bash
POST /api/embeddings/generate
Content-Type: application/json

{
  "texts": ["text1", "text2"],
  "provider": "openai",  # or "huggingface" or "cohere"
  "model": "optional"
}
```

#### OCR Image
```bash
POST /api/ocr/extract
Content-Type: multipart/form-data

Form Data:
  file: <image_file>
  language: "eng"
```

#### List Documents
```bash
GET /api/documents?page=1&page_size=10&tags=tag1,tag2
```

#### Get Document Details
```bash
GET /api/documents/{document_id}
```

#### Delete Document
```bash
DELETE /api/documents/{document_id}
```

## Configuration (.env)

### Minimal Required
```env
MONGODB_URI=mongodb://localhost:27017
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
```

### Full Configuration
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens
MONGODB_MAX_POOL_SIZE=50

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=text-embedding-3-small

# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
DEBUG=True

# JWT
JWT_SECRET=your-secret
JWT_ALGORITHM=HS256

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Files
MAX_FILE_SIZE_MB=50
ALLOWED_FILE_TYPES=pdf,docx,txt,png,jpg,jpeg

# Processing
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

## File Structure

```
ai_service/
├── app/
│   ├── main.py              # Entry point
│   ├── config.py            # Settings
│   ├── models/              # Pydantic models
│   ├── services/            # Business logic
│   ├── database/            # Data layer
│   ├── utils/               # Utilities
│   └── api/
│       ├── dependencies.py  # Auth
│       └── routes/          # API endpoints
├── requirements.txt         # Dependencies
├── Dockerfile              # Docker build
├── docker-compose.yml      # Docker services
├── .env.example            # Config template
├── start.sh                # Quick start script
└── README.md               # Full docs
```

## Common Commands

### Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn app.main:app --reload

# Run with custom port
uvicorn app.main:app --port 8080

# Check dependencies
python test_service.py
```

### Docker
```bash
# Build image
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart service
docker-compose restart ai-service

# Stop services
docker-compose down

# Remove all data
docker-compose down -v
```

### Testing
```bash
# Health check
curl http://localhost:8000/health

# Database health
curl http://localhost:8000/health/db

# View API docs
open http://localhost:8000/docs
```

## Next.js Integration

### 1. Environment Setup
```env
# .env.local
AI_SERVICE_URL=http://localhost:8000
```

### 2. API Client (lib/ai-service.ts)
```typescript
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

export async function uploadDoc(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${AI_SERVICE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  return res.json();
}

export async function searchDocs(query: string, token: string) {
  const res = await fetch(`${AI_SERVICE_URL}/api/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, mode: 'semantic', top_k: 5 }),
  });

  return res.json();
}
```

### 3. Next.js API Route (app/api/ai/upload/route.ts)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();

  const res = await fetch(
    `${process.env.AI_SERVICE_URL}/api/documents/upload`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: formData,
    }
  );

  return NextResponse.json(await res.json());
}
```

## Troubleshooting

### MongoDB not connecting
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Start MongoDB
docker-compose up -d mongodb

# Check MongoDB logs
docker-compose logs mongodb
```

### Import errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Or in Docker
docker-compose build --no-cache
```

### Tesseract not found
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract

# Check installation
tesseract --version
```

### OpenAI errors
- Verify `OPENAI_API_KEY` in .env
- Check API key validity
- Monitor usage limits

## Performance Tips

1. **Embeddings**: Use HuggingFace for free local processing
2. **Chunking**: Adjust CHUNK_SIZE based on your documents
3. **Search**: Use keyword search for speed, semantic for accuracy
4. **MongoDB**: Indexes are automatically created
5. **Batch Processing**: Upload multiple documents concurrently

## Support

- **API Docs**: http://localhost:8000/docs
- **Full Guide**: See DOCUMENT_AI_README.md
- **Implementation**: See IMPLEMENTATION_SUMMARY.md
- **Issues**: Check logs in `logs/` directory

## Status Codes

- **200**: Success
- **400**: Bad request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **404**: Not found
- **500**: Server error

## Quick Test

```bash
# 1. Start service
./start.sh

# 2. Health check (should return 200)
curl http://localhost:8000/health

# 3. Check API docs
open http://localhost:8000/docs

# 4. Test with a file (replace TOKEN and FILE)
curl -X POST "http://localhost:8000/api/documents/upload" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@FILE.pdf" \
  -F "tags=test"
```
