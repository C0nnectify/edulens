# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduLen is a Next.js 15 educational platform for study abroad services with an integrated AI-powered document processing microservice. The system consists of:

- **Frontend**: Next.js 15 App Router with TypeScript and React 19
- **Backend AI Service**: FastAPI Python service for document AI, OCR, embeddings, and semantic search
- **Database**: MongoDB for both Next.js (Better Auth) and AI service data persistence
- **Authentication**: Better Auth with MongoDB adapter

## Monorepo Structure

This is a dual-stack monorepo with two main applications:

```
/home/ismail/edulen/
├── src/                    # Next.js frontend application
│   ├── app/               # App Router pages and API routes
│   ├── components/        # React components
│   ├── lib/              # Utilities and configurations
│   └── types/            # TypeScript type definitions
├── ai_service/           # FastAPI Python microservice
│   ├── app/             # FastAPI application
│   │   ├── api/routes/  # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── database/    # MongoDB and vector DB
│   │   └── models/      # Pydantic models
│   └── pyproject.toml   # Python dependencies (uv)
└── package.json          # Next.js dependencies
```

## Development Commands

### Next.js Frontend

- **Development**: `npm run dev` (uses Turbopack)
- **Build**: `npm run build`
- **Production**: `npm start`
- **Linting**: `npm run lint`

Note: The Next.js config has `ignoreDuringBuilds: true` for both ESLint and TypeScript.

### AI Service (FastAPI)

From the `ai_service/` directory:

- **Development**: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- **Quick Start**: `./start.sh` (creates venv, installs deps, runs server)
- **Docker**: `docker-compose up -d` (includes MongoDB)
- **Tests**: `pytest` (with optional dependencies installed)
- **Format**: `black app/` and `isort app/`
- **Type Check**: `mypy app/`

The AI service uses `uv` for dependency management (modern Python package manager).

## Architecture

### Next.js Frontend Architecture

**App Router Structure**:
- `/` - Landing page
- `/dashboard` - Main dashboard hub
- `/dashboard/chat` - AI chat interface
- `/dashboard/document-ai` - Document AI features
- `/dashboard/document-builder/resume` - Resume builder with templates
- `/dashboard/application-tracker` - Application tracking
- `/marketplace` - Service marketplace
- `/scholarships` - Scholarship information
- `/signin` & `/signup` - Authentication pages

**API Routes** (Next.js proxies to AI service):
- `/api/document/*` - Document upload, search, chunks
- `/api/resume/*` - Resume CRUD, import, export, optimization
- `/api/ai/*` - AI service proxy endpoints
- `/api/embedding/*` - Embedding generation
- `/api/ocr/*` - OCR processing

**Key Frontend Patterns**:
- Path aliases: `@/components`, `@/lib`, `@/types`
- Shadcn/ui components in `src/components/ui/`
- React Hook Form + Zod for form validation
- TanStack Query for data fetching
- Better Auth for authentication (JWT-based)
- Theme system via next-themes with CSS variables

### AI Service Architecture

**FastAPI Service** (`ai_service/app/`):
- `main.py` - Application entry point with lifespan management
- `config.py` - Pydantic Settings for environment-based configuration
- `api/routes/` - Endpoint handlers (health, documents, search, embeddings, ocr, query)
- `services/` - Business logic (document_processor, embedding_service, ocr_service, chunking_service, search_service)
- `database/` - MongoDB operations and vector database management
- `models/` - Pydantic models for request/response validation
- `utils/` - File utilities and logging

**Key AI Service Features**:
- **Document Processing**: PDF, DOCX, TXT, images (OCR via Tesseract)
- **Text Chunking**: Configurable size and overlap for better embeddings
- **Vector Embeddings**: OpenAI, HuggingFace, Cohere providers
- **Semantic Search**: Vector similarity, keyword, and hybrid search
- **Multi-tenancy**: User-isolated vector collections (`vectors_{user_id}`)
- **Deduplication**: SHA-256 file hashing
- **Background Tasks**: Async processing with FastAPI BackgroundTasks

**MongoDB Collections**:
- `documents_metadata` - Document metadata, tracking IDs, file hashes
- `vectors_{user_id}` - Per-user vector embeddings with 1536-dimensional vectors

### Authentication Flow

The system uses Better Auth with MongoDB:

1. **Configuration**: `src/lib/auth-config.ts` sets up betterAuth with mongodbAdapter
2. **Session Management**: 7-day session expiration, cookie-based with 5-minute cache
3. **JWT Integration**: AI service validates JWT tokens from Next.js
4. **User Isolation**: `user_id` from JWT used to isolate data in AI service

## Technology Stack

### Frontend
- **Framework**: Next.js 15, React 19
- **Styling**: Tailwind CSS with shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form + @hookform/resolvers + Zod
- **State**: Zustand (for client state), TanStack Query (for server state)
- **Auth**: Better Auth with better-sqlite3 and MongoDB adapter
- **UI Libraries**: Lucide React (icons), Framer Motion (animations), Recharts (charts)
- **Document Handling**: react-markdown, remark-gfm, react-dropzone

### Backend (AI Service)
- **Framework**: FastAPI 0.115.0, Uvicorn 0.32.0
- **Database**: MongoDB (Motor async driver), PyMongo
- **Vector DB**: ChromaDB 0.5.18
- **LLM/AI**: LangChain 0.3.7, LangGraph 0.2.62, Google Generative AI
- **Embeddings**: OpenAI, Sentence Transformers, Cohere
- **Document Processing**: PyPDF, python-docx, python-pptx, Unstructured, Pytesseract
- **Validation**: Pydantic 2.10.2, Pydantic Settings 2.6.1
- **Task Queue**: Celery 5.4.0, Redis 5.2.0

## Environment Setup

### Next.js (.env.local)
```
MONGODB_URI=mongodb://localhost:27017/edulens
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
```

### AI Service (ai_service/.env)
```
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=text-embedding-3-small

# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
DEBUG=True

# JWT (must match Next.js secret)
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Processing
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_FILE_SIZE_MB=50
```

## Inter-Service Communication

The Next.js frontend communicates with the AI service via:

1. **Proxy Pattern**: Next.js API routes in `/api/document/*`, `/api/ai/*`, etc. forward requests to the AI service
2. **JWT Tokens**: Next.js extracts Better Auth session, generates JWT for AI service
3. **Service URL**: Set via `AI_SERVICE_URL` environment variable (defaults to `http://localhost:8000`)

Example flow:
```
User → Next.js API Route (/api/document/upload)
     → Validates session (Better Auth)
     → Forwards to AI service (http://localhost:8000/api/documents/upload)
     → AI service validates JWT
     → Returns processed data
```

## Key Integration Points

### Resume Builder
- Frontend: `src/components/dashboard/resume/` contains EnhancedResumeBuilderV2, forms, sections
- API: `/api/resume/*` routes handle CRUD, import (PDF parsing), export (PDF/DOCX)
- Templates: `src/lib/templates/` defines resume structures
- Export: `src/lib/exporters/` handles PDF/DOCX generation

### Document AI
- Frontend: `src/app/dashboard/document-ai/page.tsx` and `src/components/document-ai/`
- Hook: `src/hooks/useDocumentAI.ts` for client-side document operations
- API: `/api/document/*` proxies to AI service
- Backend: `ai_service/app/api/routes/documents.py` handles processing

### Chat Interface
- Frontend: `src/app/dashboard/chat/page.tsx` and `src/components/chat/`
- Uses streaming responses for AI conversations
- Integrated with document context from AI service

## MongoDB Schema Patterns

### Better Auth Collections
- `user` - User accounts with role field
- `session` - Active sessions
- `account` - Linked accounts

### Document AI Collections
- `documents_metadata` - File metadata, tracking IDs, hashes, tags, status
- `vectors_{user_id}` - Per-user vector embeddings with chunk text and metadata

## Development Notes

- **Dual Runtime**: Next.js dev server on `:3000`, AI service on `:8000`
- **MongoDB Required**: Both services share MongoDB instance
- **Docker Available**: `ai_service/docker-compose.yml` includes MongoDB + AI service
- **Type Safety**: TypeScript strict mode enabled, but builds ignore errors
- **API Documentation**: AI service exposes Swagger UI at `http://localhost:8000/docs`
- **Path Aliases**: Use `@/` for all imports in Next.js code
- **Component Library**: Use shadcn/ui components, avoid creating custom primitives
- **Form Pattern**: Always use React Hook Form + Zod schemas
- **Authentication**: Use `auth` from `@/lib/auth` for server-side session checks
