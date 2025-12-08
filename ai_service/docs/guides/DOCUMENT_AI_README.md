# AI Document Processing Service

A comprehensive FastAPI service for AI-powered document processing, including OCR, vector embeddings, and semantic search capabilities.

## Features

- **Document Upload & Processing**: Support for PDF, DOCX, TXT, and image files
- **OCR**: Extract text from images using Tesseract
- **Text Chunking**: Smart document chunking with configurable overlap
- **Vector Embeddings**: Multiple provider support (OpenAI, HuggingFace, Cohere)
- **Vector Search**: Semantic search, keyword search, and hybrid search
- **Deduplication**: SHA-256 hash-based file deduplication
- **Multi-tenancy**: User-isolated document collections
- **Background Processing**: Async document processing with FastAPI BackgroundTasks
- **MongoDB Storage**: Document metadata and vector embeddings

## Architecture

```
ai_service/
├── app/
│   ├── main.py                    # FastAPI application entry point
│   ├── config.py                  # Configuration management
│   ├── models/                    # Pydantic models
│   │   ├── document.py
│   │   └── search.py
│   ├── services/                  # Business logic
│   │   ├── document_processor.py
│   │   ├── embedding_service.py
│   │   ├── ocr_service.py
│   │   ├── chunking_service.py
│   │   └── search_service.py
│   ├── database/                  # Database operations
│   │   ├── mongodb.py
│   │   └── vector_db.py
│   ├── utils/                     # Utility functions
│   │   ├── file_utils.py
│   │   └── logger.py
│   └── api/                       # API routes
│       ├── dependencies.py
│       └── routes/
│           ├── health.py
│           ├── documents.py
│           ├── search.py
│           ├── embeddings.py
│           └── ocr.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Quick Start

### Prerequisites

- Python 3.11+
- MongoDB 7.0+
- Tesseract OCR
- OpenAI API key (optional, for embeddings)

### Local Development

1. **Clone and navigate to the service directory:**
```bash
cd ai_service
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run the service:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

6. **Access the API documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Docker Deployment

1. **Build and run with Docker Compose:**
```bash
docker-compose up -d
```

2. **View logs:**
```bash
docker-compose logs -f ai-service
```

3. **Stop services:**
```bash
docker-compose down
```

## API Endpoints

### Health Check
- `GET /health` - Service health status
- `GET /health/db` - Database connectivity check

### Document Management
- `POST /api/documents/upload` - Upload and process document
- `GET /api/documents` - List all documents (paginated)
- `GET /api/documents/{document_id}` - Get document metadata
- `GET /api/documents/{document_id}/chunks` - Get document chunks
- `PATCH /api/documents/{document_id}` - Update document metadata
- `DELETE /api/documents/{document_id}` - Delete document and chunks

### Search
- `POST /api/search` - Semantic/keyword/hybrid search
- `GET /api/search/similar/{document_id}/{chunk_index}` - Find similar chunks

### Embeddings
- `POST /api/embeddings/generate` - Generate embeddings for texts
- `GET /api/embeddings/providers` - List supported providers

### OCR
- `POST /api/ocr/extract` - Extract text from image
- `POST /api/ocr/extract-with-layout` - Extract text with layout preservation

## Configuration

### Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=10

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536

# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
DEBUG=True

# JWT (for Next.js integration)
JWT_SECRET=your-secret
JWT_ALGORITHM=HS256

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# File Upload
MAX_FILE_SIZE_MB=50
ALLOWED_FILE_TYPES=pdf,docx,txt,png,jpg,jpeg

# Processing
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

## Usage Examples

### Upload a Document

```bash
curl -X POST "http://localhost:8000/api/documents/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pdf" \
  -F "tags=research,important"
```

### Search Documents

```bash
curl -X POST "http://localhost:8000/api/search" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning algorithms",
    "mode": "semantic",
    "top_k": 5
  }'
```

### Generate Embeddings

```bash
curl -X POST "http://localhost:8000/api/embeddings/generate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello world", "AI is amazing"],
    "provider": "openai"
  }'
```

### OCR Image

```bash
curl -X POST "http://localhost:8000/api/ocr/extract" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@image.png" \
  -F "language=eng"
```

## Integration with Next.js

### 1. Set up environment variable in Next.js

```env
# .env.local
AI_SERVICE_URL=http://localhost:8000
```

### 2. Create API client

```typescript
// lib/ai-service.ts
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function uploadDocument(
  file: File,
  tags: string[],
  token: string
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tags', tags.join(','));

  const response = await fetch(`${AI_SERVICE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}

export async function searchDocuments(
  query: string,
  mode: 'semantic' | 'keyword' | 'hybrid',
  token: string
) {
  const response = await fetch(`${AI_SERVICE_URL}/api/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, mode, top_k: 10 }),
  });

  return response.json();
}
```

### 3. Use in Next.js API routes

```typescript
// app/api/ai/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();

  // Forward to AI service
  const response = await fetch(`${process.env.AI_SERVICE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessToken}`,
    },
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

## MongoDB Schema

### documents_metadata Collection

```javascript
{
  "document_id": "uuid",
  "tracking_id": "uuid",
  "user_id": "string",
  "filename": "example.pdf",
  "file_hash": "sha256...",
  "file_type": "pdf",
  "file_path": "/uploads/user_id/hash.pdf",
  "file_size": 1024000,
  "tags": ["research", "important"],
  "total_chunks": 10,
  "status": "completed",
  "uploaded_at": "2024-01-01T00:00:00Z",
  "indexed_at": "2024-01-01T00:05:00Z",
  "metadata": {}
}
```

### vectors_{user_id} Collections

```javascript
{
  "_id": "document_id_chunk_0",
  "chunk_id": "document_id_chunk_0",
  "document_id": "uuid",
  "tracking_id": "uuid",
  "user_id": "string",
  "text": "Chunk text content...",
  "embedding": [0.1, 0.2, ...], // 1536-dimensional vector
  "chunk_index": 0,
  "total_chunks": 10,
  "metadata": {
    "word_count": 150,
    "char_count": 800
  },
  "created_at": "2024-01-01T00:05:00Z"
}
```

## Performance Considerations

- **Chunking**: Adjust `CHUNK_SIZE` and `CHUNK_OVERLAP` based on your use case
- **Embeddings**: OpenAI is fast but costs money; HuggingFace is free but slower
- **Search**: Semantic search is more accurate but slower than keyword search
- **MongoDB Indexing**: Indexes are automatically created for optimal performance

## Security

- JWT token validation for all endpoints
- User-isolated collections (per-user vector storage)
- File size limits to prevent abuse
- File type validation
- SHA-256 hashing for deduplication

## Troubleshooting

### Tesseract OCR not found
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-eng

# macOS
brew install tesseract

# Windows
# Download from https://github.com/UB-Mannheim/tesseract/wiki
```

### MongoDB connection issues
```bash
# Check MongoDB is running
docker ps | grep mongodb

# View MongoDB logs
docker-compose logs mongodb
```

### Import errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact the development team.
