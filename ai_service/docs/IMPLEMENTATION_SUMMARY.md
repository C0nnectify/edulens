# AI Document Processing Service - Implementation Summary

## Overview

A complete FastAPI microservice for document AI features including OCR, vector embeddings, and semantic search. This service is designed to be called from the Next.js frontend and handles all AI/ML workloads.

## What Was Created

### 1. Core Application Structure

```
ai_service/
├── app/
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Settings management with Pydantic
│   ├── models/                  # Request/Response models
│   │   ├── document.py          # Document-related models
│   │   └── search.py            # Search-related models
│   ├── services/                # Business logic
│   │   ├── document_processor.py
│   │   ├── embedding_service.py
│   │   ├── ocr_service.py
│   │   ├── chunking_service.py
│   │   └── search_service.py
│   ├── database/                # Data layer
│   │   ├── mongodb.py           # MongoDB connection & operations
│   │   └── vector_db.py         # Vector storage & search
│   ├── utils/                   # Utilities
│   │   ├── file_utils.py        # File operations & validation
│   │   └── logger.py            # Logging configuration
│   └── api/                     # API layer
│       ├── dependencies.py      # Auth & dependencies
│       └── routes/
│           ├── health.py
│           ├── documents.py
│           ├── search.py
│           ├── embeddings.py
│           └── ocr.py
```

### 2. Key Features Implemented

#### A. Document Upload & Processing
- **File Upload**: Accept PDF, DOCX, TXT, and images
- **Validation**: File type and size validation
- **Deduplication**: SHA-256 hash-based duplicate detection
- **Background Processing**: Async processing with FastAPI BackgroundTasks
- **Metadata Storage**: Document metadata in MongoDB

#### B. Text Extraction
- **PDF**: PyPDF2 for PDF text extraction
- **DOCX**: python-docx for Word documents
- **TXT**: Direct text file reading
- **Images**: Tesseract OCR for image-to-text

#### C. Document Chunking
- **Smart Chunking**: Configurable chunk size with overlap
- **Paragraph-based**: Alternative chunking by paragraphs
- **Metadata**: Track chunk position and statistics

#### D. Vector Embeddings
- **OpenAI**: text-embedding-3-small (1536 dimensions)
- **HuggingFace**: Local sentence-transformers
- **Cohere**: Cohere embed API
- **Batch Processing**: Efficient batch embedding generation

#### E. Vector Search
- **Semantic Search**: Cosine similarity on embeddings
- **Keyword Search**: MongoDB text search
- **Hybrid Search**: Combined semantic + keyword
- **Filtering**: By tags, document ID, and score threshold

#### F. User Isolation
- **Per-User Collections**: `vectors_{user_id}` in MongoDB
- **JWT Authentication**: Token-based auth from Next.js
- **Document Ownership**: Strict user-based access control

### 3. API Endpoints

#### Health Check
```
GET  /health              # Service health
GET  /health/db           # Database health
```

#### Documents
```
POST   /api/documents/upload           # Upload document
GET    /api/documents                  # List documents
GET    /api/documents/{id}             # Get document
GET    /api/documents/{id}/chunks      # Get chunks
PATCH  /api/documents/{id}             # Update metadata
DELETE /api/documents/{id}             # Delete document
```

#### Search
```
POST /api/search                                    # Search documents
GET  /api/search/similar/{document_id}/{chunk_index} # Find similar
```

#### Embeddings
```
POST /api/embeddings/generate    # Generate embeddings
GET  /api/embeddings/providers   # List providers
```

#### OCR
```
POST /api/ocr/extract             # Extract text from image
POST /api/ocr/extract-with-layout # Extract with layout
```

### 4. Database Schema

#### documents_metadata Collection
```javascript
{
  document_id: "uuid",
  tracking_id: "uuid",
  user_id: "string",
  filename: "example.pdf",
  file_hash: "sha256...",
  file_type: "pdf|docx|txt|image",
  file_path: "/uploads/user/hash.pdf",
  file_size: 1024000,
  tags: ["tag1", "tag2"],
  total_chunks: 10,
  status: "completed|processing|failed",
  uploaded_at: "2024-01-01T00:00:00Z",
  indexed_at: "2024-01-01T00:05:00Z",
  metadata: {}
}
```

#### vectors_{user_id} Collections
```javascript
{
  _id: "doc_id_chunk_0",
  chunk_id: "doc_id_chunk_0",
  document_id: "uuid",
  tracking_id: "uuid",
  user_id: "string",
  text: "Chunk content...",
  embedding: [0.1, 0.2, ...],  // 1536-d vector
  chunk_index: 0,
  total_chunks: 10,
  metadata: {
    word_count: 150,
    char_count: 800
  },
  created_at: "2024-01-01T00:00:00Z"
}
```

### 5. Configuration

All settings managed via environment variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=text-embedding-3-small

# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

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

### 6. Docker Setup

**Dockerfile**: Multi-stage build with Tesseract OCR
**docker-compose.yml**: Service + MongoDB container
**.dockerignore**: Optimized for Docker builds

### 7. Documentation

- **DOCUMENT_AI_README.md**: Comprehensive usage guide
- **.env.example**: Environment variable template
- **Swagger/ReDoc**: Auto-generated API docs at `/docs` and `/redoc`

## How to Run

### Option 1: Local Development

```bash
cd ai_service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
uvicorn app.main:app --reload
```

### Option 2: Docker

```bash
cd ai_service
cp .env.example .env
# Edit .env
docker-compose up -d
```

### Option 3: Quick Start Script

```bash
cd ai_service
./start.sh
```

## Integration with Next.js

### 1. Environment Setup
```env
# Next.js .env.local
AI_SERVICE_URL=http://localhost:8000
```

### 2. Create API Client
```typescript
// lib/ai-service.ts
export async function uploadDocument(file: File, tags: string[], token: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tags', tags.join(','));

  const response = await fetch(`${AI_SERVICE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });

  return response.json();
}
```

### 3. Use in Next.js Route
```typescript
// app/api/documents/upload/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const formData = await req.formData();

  // Forward to AI service
  const response = await fetch(`${AI_SERVICE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.accessToken}` },
    body: formData,
  });

  return NextResponse.json(await response.json());
}
```

## Key Design Decisions

### 1. Architecture
- **Async-First**: All I/O operations use async/await
- **Background Tasks**: Long-running operations in background
- **Dependency Injection**: Clean separation via FastAPI dependencies

### 2. Database
- **MongoDB**: Flexible schema for metadata and vectors
- **Per-User Collections**: Isolation and scalability
- **Indexes**: Automatic index creation for performance

### 3. Processing
- **Chunking Strategy**: Configurable with sentence-boundary awareness
- **Multiple Providers**: Fallback options for embeddings
- **Caching**: File hash deduplication

### 4. Security
- **JWT Validation**: Token verification on all endpoints
- **File Validation**: Type, size, and content checks
- **User Isolation**: Strict data access controls

### 5. Performance
- **Batch Processing**: Embeddings processed in batches
- **Connection Pooling**: MongoDB connection pool
- **Async Operations**: Non-blocking I/O throughout

## Testing

Test the service:
```bash
# Check dependencies
python test_service.py

# Test health endpoint
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

## Next Steps

### Immediate
1. Copy `.env.example` to `.env` and configure
2. Install dependencies: `pip install -r requirements.txt`
3. Start MongoDB: `docker-compose up -d mongodb`
4. Run service: `uvicorn app.main:app --reload`
5. Test: `curl http://localhost:8000/health`

### Integration
1. Add `AI_SERVICE_URL` to Next.js environment
2. Create API client in `lib/ai-service.ts`
3. Create Next.js API routes to proxy requests
4. Update frontend to use document AI features

### Production
1. Set `ENVIRONMENT=production` in .env
2. Configure proper JWT secret
3. Set up MongoDB replica set
4. Enable rate limiting
5. Configure monitoring and alerts

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check MongoDB is running
docker ps | grep mongodb
# Or start it
docker-compose up -d mongodb
```

**Tesseract Not Found**
```bash
# Install Tesseract
sudo apt-get install tesseract-ocr
# Or on Mac
brew install tesseract
```

**Import Errors**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

**OpenAI API Errors**
- Check OPENAI_API_KEY in .env
- Verify API key is valid
- Check rate limits

## Performance Metrics

Expected performance (on standard hardware):
- **Document Upload**: 1-5 seconds (depending on size)
- **Text Extraction**: 0.5-3 seconds
- **Chunking**: < 0.1 seconds
- **Embedding Generation**: 1-2 seconds (OpenAI), 5-10 seconds (local)
- **Vector Search**: 50-200ms (semantic), 10-50ms (keyword)

## Conclusion

The AI Document Processing Service is now complete and ready for integration with your Next.js application. It provides:

- ✅ Complete document upload and processing pipeline
- ✅ Multi-format support (PDF, DOCX, TXT, images)
- ✅ OCR capabilities with Tesseract
- ✅ Vector embeddings with multiple providers
- ✅ Semantic, keyword, and hybrid search
- ✅ User-isolated data storage
- ✅ JWT authentication
- ✅ Docker deployment support
- ✅ Comprehensive API documentation
- ✅ Production-ready code with error handling

All code follows FastAPI best practices with proper type hints, error handling, logging, and documentation.
