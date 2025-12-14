# MongoDB + ChromaDB File Storage System

## Overview

The file storage system has been completely redesigned to use:
- **MongoDB** for storing file metadata and extracted text
- **ChromaDB** for semantic search embeddings
- **OCR** (Tesseract) for scanned PDFs and images
- **Intelligent text extraction** for various document formats

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    File Upload Flow                          │
└─────────────────────────────────────────────────────────────┘

User uploads file (PDF/Word/Image)
       │
       ▼
┌──────────────────┐
│  Next.js API     │ /api/user-files/upload
│  (POST)          │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│   FileProcessingService              │
│   (Node.js/TypeScript)               │
├──────────────────────────────────────┤
│ 1. Calculate file hash               │
│ 2. Check for duplicates              │
│ 3. Save metadata to MongoDB          │
│ 4. Start background processing       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│   AI Service (Python FastAPI)       │
│   /api/documents/*                   │
├──────────────────────────────────────┤
│ 1. Extract text from document        │
│ 2. Perform OCR if needed             │
│ 3. Chunk text intelligently          │
│ 4. Generate embeddings               │
│ 5. Store in ChromaDB                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│            Storage Layer                    │
├─────────────────────┬──────────────────────┤
│     MongoDB         │      ChromaDB        │
│  (File Metadata)    │   (Vector Store)     │
│                     │                      │
│ • File info         │ • Text chunks        │
│ • Processing status │ • Embeddings         │
│ • Extracted text    │ • Semantic search    │
│ • OCR results       │ • Similarity queries │
└─────────────────────┴──────────────────────┘
```

## MongoDB Schema

### UserFile Collection

```typescript
{
  _id: ObjectId,
  fileId: "file-1234567890-abc",
  userId: "user-xyz",
  
  // File information
  fileName: "resume.pdf",
  originalName: "John_Doe_Resume.pdf",
  mimeType: "application/pdf",
  fileSize: 204800, // bytes
  fileHash: "sha256-hash-here",
  
  // Storage
  storagePath: "uploads/user-xyz/file-1234567890-abc",
  storageProvider: "local",
  
  // Classification
  documentType: "resume",
  category: ["application", "professional"],
  tags: ["resume", "software-engineer", "2025"],
  
  // Processing status
  processingStatus: "completed",
  ocrStatus: "completed",
  embeddingStatus: "completed",
  
  // Extracted content
  extractedText: "Full document text...",
  textPreview: "John Doe\nSoftware Engineer...",
  pageCount: 2,
  wordCount: 450,
  
  // OCR results (for scanned PDFs/images)
  ocrText: "OCR extracted text...",
  ocrConfidence: 0.95,
  ocrLanguage: "eng",
  
  // ChromaDB references
  embeddingCollection: "user_documents",
  embeddingIds: [
    "file-1234567890-abc_chunk_0",
    "file-1234567890-abc_chunk_1",
    "file-1234567890-abc_chunk_2"
  ],
  chunkCount: 3,
  
  // Metadata
  metadata: {
    author: "John Doe",
    createdDate: ISODate("2025-01-01"),
    keywords: ["software", "engineering"],
    language: "en"
  },
  
  // Timestamps
  uploadedAt: ISODate("2025-12-14T10:00:00Z"),
  updatedAt: ISODate("2025-12-14T10:05:00Z"),
  lastAccessedAt: ISODate("2025-12-14T15:30:00Z"),
  processedAt: ISODate("2025-12-14T10:05:00Z"),
  
  // Usage tracking
  accessCount: 15,
  usedInDocuments: ["sop-123", "lor-456"],
  
  // Error tracking
  errors: []
}
```

### Indexes

```javascript
db.user_files.createIndex({ fileId: 1 }, { unique: true });
db.user_files.createIndex({ userId: 1, uploadedAt: -1 });
db.user_files.createIndex({ userId: 1, documentType: 1 });
db.user_files.createIndex({ fileHash: 1 });
db.user_files.createIndex({ processingStatus: 1 });
db.user_files.createIndex({ tags: 1 });
db.user_files.createIndex({ "metadata.keywords": 1 });
```

## ChromaDB Schema

### Collection: user_documents

Each text chunk is stored with:

```python
{
  "id": "file-1234567890-abc_chunk_0",
  "document": "Text chunk content here...",
  "embedding": [0.1, 0.2, -0.3, ...], # 384-dimensional vector
  "metadata": {
    "file_id": "file-1234567890-abc",
    "user_id": "user-xyz",
    "chunk_index": 0,
    "file_name": "resume.pdf",
    "document_type": "resume",
    "tags": "resume,software-engineer,2025",
    "upload_date": "2025-12-14T10:00:00Z"
  }
}
```

## File Processing Pipeline

### 1. Upload & Initial Storage

```typescript
// User uploads file
POST /api/user-files/upload
{
  file: File,
  doc_type: "resume",
  tags: "software,engineer",
  generate_embeddings: true
}

// Response (immediate)
{
  success: true,
  file: {
    id: "file-123",
    name: "resume.pdf",
    processingStatus: "pending",
    message: "File uploaded. Processing in background..."
  }
}
```

### 2. Text Extraction

**For PDFs:**
```typescript
// 1. Try to extract text directly
const text = extractTextFromPDF(buffer);

// 2. Check if text is sufficient
if (wordCount < 50) {
  // PDF is likely scanned/image-based
  needsOCR = true;
}
```

**For Images:**
```typescript
// Always perform OCR on images
const text = performOCR(imageBuffer);
```

**For Word Documents:**
```typescript
// Extract text using docx parser
const text = extractTextFromWord(buffer);
```

### 3. OCR Processing

For scanned PDFs and images:

```python
# Convert PDF to images
images = pdf2image.convert_from_bytes(pdf_content)

# Perform OCR on each page
for i, image in enumerate(images):
    page_text = pytesseract.image_to_string(image, lang='eng')
    extracted_text += f"\n--- Page {i+1} ---\n{page_text}"
```

**Supported OCR Languages:**
- English (eng)
- Spanish (spa)
- French (fra)
- German (deu)
- Chinese (chi_sim, chi_tra)
- And 100+ more via Tesseract

### 4. Text Chunking

```python
def chunk_text(text, chunk_size=500, chunk_overlap=50):
    """
    Split text into overlapping chunks
    
    chunk_size: Number of words per chunk
    chunk_overlap: Words to overlap between chunks
    """
    words = text.split()
    chunks = []
    
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunk_text = ' '.join(chunk_words)
        chunks.append(chunk_text)
        i += chunk_size - chunk_overlap
    
    return chunks
```

**Why chunking?**
- Most embedding models have token limits (512 tokens)
- Smaller chunks = more precise search results
- Overlap ensures context isn't lost at boundaries

### 5. Embedding Generation

```python
from sentence_transformers import SentenceTransformer

# Initialize model (384-dimensional embeddings)
model = SentenceTransformer('all-MiniLM-L6-v2')

# Generate embeddings for all chunks
embeddings = model.encode(chunks).tolist()

# Store in ChromaDB
collection.add(
    ids=chunk_ids,
    embeddings=embeddings,
    documents=chunks,
    metadatas=chunk_metadata
)
```

**Embedding Models:**

| Model | Dimensions | Speed | Quality |
|-------|-----------|-------|---------|
| all-MiniLM-L6-v2 | 384 | Fast | Good |
| all-mpnet-base-v2 | 768 | Medium | Better |
| OpenAI text-embedding-3-small | 1536 | API | Best |

### 6. Status Updates

Throughout processing, MongoDB is updated:

```typescript
// Initial
{ processingStatus: "pending" }

// Text extraction started
{ processingStatus: "processing", ocrStatus: "processing" }

// Text extracted
{ extractedText: "...", ocrStatus: "completed" }

// Embedding generation
{ embeddingStatus: "processing" }

// Completed
{ 
  processingStatus: "completed",
  embeddingStatus: "completed",
  chunkCount: 5,
  processedAt: new Date()
}
```

## API Endpoints

### Frontend (Next.js)

#### GET /api/user-files
Fetch user's files from MongoDB

**Query Parameters:**
- `limit` - Number of files (default: 50)
- `page` - Page number (default: 1)
- `documentType` - Filter by type
- `tags` - Comma-separated tags
- `sortBy` - uploadedAt|fileName|fileSize
- `sortOrder` - asc|desc
- `search` - Semantic search query

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "file-123",
      "name": "resume.pdf",
      "type": "application/pdf",
      "size": 204800,
      "uploadedAt": "2025-12-14T10:00:00Z",
      "documentType": "resume",
      "tags": ["resume", "software"],
      "textPreview": "John Doe\n...",
      "processingStatus": "completed",
      "ocrStatus": "completed",
      "embeddingStatus": "completed",
      "wordCount": 450,
      "chunkCount": 3
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

#### POST /api/user-files/upload
Upload and process file

**Body (FormData):**
- `file` - File to upload
- `doc_type` - Document type
- `tags` - Comma-separated tags
- `generate_embeddings` - true|false

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-123",
    "name": "resume.pdf",
    "processingStatus": "pending",
    "message": "File uploaded successfully. Processing in background..."
  }
}
```

#### DELETE /api/user-files?id=file-123
Delete file and embeddings

### Backend (Python FastAPI)

#### POST /api/documents/extract-text
Extract text from document

#### POST /api/documents/ocr
Perform OCR on image/scanned PDF

#### POST /api/embeddings/generate
Generate embeddings for text

#### POST /api/embeddings/search
Semantic search across documents

#### POST /api/embeddings/delete
Delete embeddings from ChromaDB

## Semantic Search

### How It Works

```
User Query: "software engineer experience"
       │
       ▼
1. Generate query embedding
   embedding = model.encode(query)
   
       │
       ▼
2. Search ChromaDB for similar vectors
   results = collection.query(
       query_embeddings=[embedding],
       n_results=10,
       where={"user_id": "user-xyz"}
   )
   
       │
       ▼
3. Return matching files
   [
     { file_id: "resume-1", score: 0.95 },
     { file_id: "cover-letter-1", score: 0.87 }
   ]
```

### Search Example

```typescript
// Search for files related to "python experience"
const response = await fetch('/api/user-files?search=python experience');

// Results ranked by semantic similarity
const { files } = await response.json();
// [
//   { name: "resume.pdf", score: 0.95 },
//   { name: "projects.pdf", score: 0.87 }
// ]
```

## Error Handling

### Failed Processing

Files that fail processing are marked with error status:

```typescript
{
  processingStatus: "failed",
  errors: [
    {
      stage: "ocr",
      message: "Tesseract OCR failed: timeout",
      timestamp: "2025-12-14T10:05:00Z"
    }
  ]
}
```

### Retry Logic

Users can trigger reprocessing:

```typescript
POST /api/user-files/reprocess
{
  fileId: "file-123"
}
```

## Performance Considerations

### 1. Duplicate Detection

- Files are hashed (SHA-256) on upload
- Duplicate files are detected and not reprocessed
- Saves storage and processing time

### 2. Background Processing

- Upload returns immediately
- Processing happens asynchronously
- User can continue working while file is processed

### 3. Chunking Strategy

- Chunk size: 500 words (optimal for search)
- Overlap: 50 words (maintains context)
- Adjustable per document type

### 4. Caching

- Frequently accessed files cached in memory
- Embeddings cached in ChromaDB
- MongoDB indexes for fast queries

### 5. Scaling

- **MongoDB**: Horizontal scaling with sharding
- **ChromaDB**: Distributed mode for large collections
- **Processing**: Queue-based system (future: Redis Queue)

## Security

### 1. File Isolation

- Files stored per user (userId in path)
- MongoDB queries always filter by userId
- ChromaDB metadata includes userId

### 2. File Validation

- File type whitelist
- File size limits (50MB default)
- Virus scanning (TODO)

### 3. Data Privacy

- Embeddings don't contain raw text
- Text can be encrypted at rest (TODO)
- GDPR-compliant deletion

## Usage Examples

### Upload File with Full Processing

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('doc_type', 'resume');
formData.append('tags', 'software,engineer,2025');
formData.append('generate_embeddings', 'true');

const response = await fetch('/api/user-files/upload', {
  method: 'POST',
  headers: { 'x-user-id': userId },
  body: formData,
});

const { file } = await response.json();
console.log(file.processingStatus); // "pending"

// Check status later
const statusResponse = await fetch(`/api/user-files?id=${file.id}`);
const { file: updatedFile } = await statusResponse.json();
console.log(updatedFile.processingStatus); // "completed"
```

### Semantic Search

```typescript
// Search for files about "machine learning projects"
const response = await fetch(
  '/api/user-files?search=machine learning projects&limit=5',
  {
    headers: { 'x-user-id': userId }
  }
);

const { files } = await response.json();
files.forEach(file => {
  console.log(`${file.name} - Score: ${file.score}`);
});
```

### Get Files by Type

```typescript
// Get all resumes
const response = await fetch(
  '/api/user-files?documentType=resume&limit=20',
  {
    headers: { 'x-user-id': userId }
  }
);
```

## Monitoring

### File Processing Status

```typescript
// Get processing statistics
const stats = await FileProcessingService.getStats(userId);
console.log({
  totalFiles: stats.total,
  processing: stats.processing,
  completed: stats.completed,
  failed: stats.failed,
});
```

### ChromaDB Collection Stats

```python
# Get collection statistics
collection = chroma_client.get_collection("user_documents")
count = collection.count()
print(f"Total chunks: {count}")
```

## Future Enhancements

1. **Advanced OCR**
   - Handwriting recognition
   - Table extraction
   - Multi-language support

2. **Smart Chunking**
   - Semantic chunking (by paragraphs/sections)
   - Context-aware boundaries
   - Document structure preservation

3. **Enhanced Search**
   - Hybrid search (semantic + keyword)
   - Reranking with cross-encoders
   - Multimodal search (text + images)

4. **Performance**
   - Redis queue for processing
   - Distributed ChromaDB
   - CDN for file delivery

5. **Features**
   - File versioning
   - Collaborative annotations
   - AI-powered summarization

## Troubleshooting

### OCR Not Working

```bash
# Install Tesseract
brew install tesseract # macOS
sudo apt-get install tesseract-ocr # Ubuntu

# Verify installation
tesseract --version
```

### ChromaDB Connection Issues

```python
# Check ChromaDB path
import os
print(os.environ.get('CHROMA_DB_PATH', './chroma_db'))

# Verify collection exists
collections = chroma_client.list_collections()
print(collections)
```

### Embedding Generation Slow

```python
# Use GPU acceleration
model = SentenceTransformer('all-MiniLM-L6-v2', device='cuda')

# Or reduce chunk size
chunk_size = 300  # instead of 500
```

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [Sentence Transformers](https://www.sbert.net/)
- [pdf2image](https://github.com/Belval/pdf2image)

## Summary

The new file storage system provides:

✅ **Centralized storage** in MongoDB  
✅ **Intelligent text extraction** for all formats  
✅ **OCR support** for scanned documents  
✅ **Semantic search** via ChromaDB embeddings  
✅ **Background processing** for smooth UX  
✅ **Duplicate detection** to save resources  
✅ **Comprehensive error handling**  
✅ **Scalable architecture** for growth  

All files are now stored intelligently with full-text search capabilities, making them easily discoverable and usable across the entire application!
