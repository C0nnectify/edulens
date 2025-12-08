# SOP Generator Service

## Overview
Minimal MVP implementation of an AI-powered Statement of Purpose generator using LangChain, Gemini, and ChromaDB.

## Setup

### Install Dependencies
```bash
cd ai_service/app/SOP_Generator
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Variables
Create a `.env` file in the root directory:
```env
MONGO_URI=mongodb://localhost:27017/edulens
CHROMA_URL=http://localhost:8000
OLLAMA_URL=http://localhost:11434
GEMINI_API_KEY=your_api_key_here

# Testing/Development flags
USE_MOCK_LLM=true
USE_MOCK_EMB=true
```

## Running the Service

### Development Mode
```bash
uvicorn main:app --reload --port 8001
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

## API Endpoints

### 1. Upload Document
**POST** `/api/sop/upload`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: multipart/form-data with `file` and `doc_type`
- **Response**: `{ file_id, filename, text_preview }`

### 2. Generate SOP
**POST** `/api/sop/generate`
- **Body**: 
```json
{
  "program": "MS Computer Science",
  "university": "Stanford",
  "country": "USA",
  "background": "Bachelor's in CS...",
  "goals": "Research in AI...",
  "tone": "formal",
  "word_limit": 1000,
  "file_ids": ["file_id_1"]
}
```

### 3. Rewrite Selection
**POST** `/api/sop/rewrite`
- **Body**: `{ "selected_text": "...", "instruction": "make it formal" }`

### 4. Save SOP
**POST** `/api/sop/save`
- **Body**: `{ "title": "My SOP", "editor_json": {...}, "html": "..." }`

### 5. Get SOP
**GET** `/api/sop/{id}`

## Testing

### Quick Test
```bash
# Upload a file
curl -X POST http://localhost:8001/api/sop/upload \
  -H "Authorization: Bearer test_token" \
  -F "file=@resume.pdf" \
  -F "doc_type=resume"

# Generate SOP (mock mode)
curl -X POST http://localhost:8001/api/sop/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{"program":"MS CS","background":"undergrad","goals":"research"}'
```

## Architecture

- **models.py**: Pydantic request/response schemas
- **db.py**: MongoDB and ChromaDB client initialization
- **routes/sop.py**: All API endpoints
- **services/llm_client.py**: LangChain/Gemini wrapper
- **services/embeddings.py**: Ollama embeddings wrapper (TODO: swap provider)
- **services/storage.py**: File storage and text extraction
- **app/services/embedding_functions.py**: Gemini embedding function with fallback
- **app/services/style_retrieval.py**: Aggregates stylistic profile from example vectors
- **app/scripts/ingest_examples.py**: One-time / incremental ingestion of example PDFs

## Development Notes

- Start with `USE_MOCK_LLM=true` to avoid API quota issues
- Files are kept small (<200 lines each)
- All endpoints are JWT-protected
- Synchronous LLM calls for MVP simplicity

## Example Knowledge Base Ingestion & Style Guidance

### 1. Place Example PDFs
```
ai_service/app/data/SOP_DATA/pdfs/*.pdf
ai_service/app/data/LOR_DATA/pdfs/*.pdf
```

### 2. Ingest into ChromaDB
```bash
python -m app.scripts.ingest_examples --sop --lor
# Re-run later to add only new files
python -m app.scripts.ingest_examples --sop --lor
# Force reindex (replace existing vectors)
python -m app.scripts.ingest_examples --sop --reindex
```

### 3. Generation Flow
When `/sop/generate` is called:
- Retrieve top-k example chunks from `sop_examples`.
- Build `style_profile` (avg sentence length, headings, tone indicators).
- Inject style guidance JSON into the Gemini system prompt.

When `/lor/generate` is called:
- Retrieve style/context chunks from `lor_examples` using:
  - Top-1 by `country`
  - Top-2 by `subject`/`field`
- Build `style_profile` for letters (same heuristics).
- Inject guidance and selected example previews into the Gemini prompt for best results.

### 4. Environment Flags
| Variable | Purpose |
|----------|---------|
| `GOOGLE_API_KEY` | Enables real Gemini embeddings & LLM |
| `USE_MOCK_EMB` | If true, uses deterministic mock embedding vectors |
| `USE_MOCK_LLM` | If true or missing key, mock SOP/LOR output |

### 5. Extending Metadata
Add simple regex heuristics in `ingest_examples.py` and `style_retrieval.py` for new dimensions (e.g. specialization, university ranking). Re-run ingestion to enrich new documents; existing vectors remain valid.

### 6. Troubleshooting
- Empty style profile: No example PDFs ingested or query too sparse.
- Duplicate skipping: Uses SHA256 file hash; run with `--reindex` to force.
- Chroma connection issues: Verify `CHROMA_URL` or embedded server on port 8000.
