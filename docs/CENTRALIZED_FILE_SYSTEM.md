# Centralized File Storage System

## Overview

EduLens now has a **centralized file storage system** that allows users to upload files once and access them everywhere in the application. This eliminates the need to re-upload files for different features and provides a unified experience.

## Key Features

### 1. **Single Upload, Universal Access**
- Upload a file once in any location (Document Vault, Chat, Document Builder, etc.)
- Access it everywhere across the application
- No need to re-upload the same CV, transcript, or document multiple times

### 2. **Multiple Upload Points**
Users can upload files from:
- **Document Vault** (`/dashboard/document-vault`) - Primary upload location
- **AI Chat** (`/new-dashboard`) - Via the "+" button and paperclip icon
- **Document Builders** - SOP, LOR, CV, Resume generators
- **Document Analysis** - When analyzing documents

### 3. **Unified File Access**
All uploaded files are accessible through:
- The "+" file picker in the AI chat
- Document Builder's file selection panel
- Document Vault's file list
- Document AI's document list

## Architecture

### API Endpoints

#### `GET /api/user-files`
Fetches all files uploaded by the current user from all sources.

**Query Parameters:**
- `limit` (optional): Number of files to return (default: 100)
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "file-123",
      "name": "resume.pdf",
      "type": "application/pdf",
      "size": 102400,
      "uploadedAt": "2025-12-14T10:30:00Z",
      "source": "document_builder"
    }
  ],
  "total": 1
}
```

#### `POST /api/user-files/upload`
Upload a new file to centralized storage.

**Form Data:**
- `file`: File to upload
- `doc_type` (optional): Document type (default: "document")
- `tags` (optional): Comma-separated tags

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-123",
    "name": "resume.pdf",
    "type": "application/pdf",
    "size": 102400,
    "uploadedAt": "2025-12-14T10:30:00Z",
    "textPreview": "John Doe\nSoftware Engineer..."
  }
}
```

### Custom Hook: `useUserFiles`

Located at `src/hooks/useUserFiles.ts`, this hook provides a React interface for file management:

```typescript
import { useUserFiles } from '@/hooks/useUserFiles';

function MyComponent() {
  const { 
    files,           // Array of user files
    loading,         // Loading state
    error,           // Error message
    uploadProgress,  // Upload progress array
    fetchFiles,      // Function to fetch files
    uploadFile,      // Function to upload a file
    deleteFile,      // Function to delete a file
  } = useUserFiles();

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Upload a file
  const handleUpload = async (file: File) => {
    const result = await uploadFile(file, { 
      docType: 'resume',
      tags: ['application', '2025']
    });
  };

  return (
    <div>
      {files.map(file => (
        <div key={file.id}>{file.name}</div>
      ))}
    </div>
  );
}
```

### File Storage Backend

The centralized API aggregates files from two sources:

1. **SOP/LOR Service** (`/api/sop/upload` and `/api/sop/files`)
   - Used by Document Builders and AI Chat
   - Stores files in the AI service backend
   - Provides text extraction and preview

2. **Document AI Service** (`/api/ai/documents`)
   - Used by Document AI page
   - Provides semantic search and analysis capabilities
   - Stores files with chunking and embeddings

The centralized API deduplicates files and returns a unified list.

## Usage Examples

### 1. Document Vault Page

The Document Vault page now uses the centralized file system:

```typescript
import { useUserFiles } from '@/hooks/useUserFiles';

export default function DocumentVaultPage() {
  const { files, fetchFiles, uploadFile, deleteFile } = useUserFiles();
  
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} multiple />
      {files.map(file => (
        <div key={file.id}>
          {file.name}
          <button onClick={() => deleteFile(file.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### 2. AI Chat File Picker

The new dashboard page displays previously uploaded files in the file panel:

```typescript
import { getUserFiles } from '@/lib/api/chatOrchestrator';

const [previousFiles, setPreviousFiles] = useState([]);

useEffect(() => {
  const loadFiles = async () => {
    const result = await getUserFiles();
    setPreviousFiles(result.files);
  };
  loadFiles();
}, []);

// Display files in the "+" panel
{showFilePanel && (
  <div>
    {previousFiles.map(file => (
      <button key={file.id} onClick={() => selectFile(file.id)}>
        {file.name}
      </button>
    ))}
  </div>
)}
```

### 3. Document Builder Integration

Document builders (SOP, LOR, CV, Resume) can access centralized files:

```typescript
import { getUserFiles } from '@/lib/api/chatOrchestrator';

// In UploadPanel or similar component
const loadPreviousFiles = async () => {
  const result = await getUserFiles();
  // Display files for selection
};
```

## User Experience Flow

### Scenario 1: First-time User

1. User visits Document Vault
2. Uploads CV, transcripts, and certificates
3. Files are stored centrally
4. User goes to AI Chat → files appear in "+" picker
5. User creates SOP → files are available for context
6. User analyzes documents → same files are accessible

### Scenario 2: Existing User

1. User previously uploaded files via SOP generator
2. User opens AI Chat → files automatically appear
3. User switches to Document Vault → sees all previously uploaded files
4. User creates LOR → can attach previously uploaded files

## File Metadata

Each file in the centralized system includes:

- `id`: Unique identifier
- `name`: Original filename
- `type`: MIME type or document type
- `size`: File size in bytes
- `uploadedAt`: Upload timestamp (ISO 8601)
- `source`: Upload source ("document_builder", "document_vault", etc.)
- `textPreview`: Extracted text preview (when available)

## Benefits

1. **User Convenience**: Upload once, use everywhere
2. **Data Consistency**: Single source of truth for user files
3. **Better UX**: No confusion about which files are available where
4. **Simplified Development**: One API for all file operations
5. **Easy Maintenance**: Centralized file management logic

## Future Enhancements

- File tagging and categorization
- Advanced search and filtering
- File versioning
- Shared files between users
- Cloud storage integration (S3, Azure Blob)
- File preview and thumbnail generation
- Automatic file type detection and OCR

## Migration Notes

### For Developers

If you're working on a feature that needs file upload/access:

1. **Use the centralized API**: Import from `/api/user-files`
2. **Use the hook**: `useUserFiles()` for React components
3. **Don't create new upload endpoints**: Extend the centralized one if needed
4. **Consistent user experience**: Files uploaded anywhere should be accessible everywhere

### Backward Compatibility

The system maintains backward compatibility with:
- Existing SOP/LOR upload endpoints
- Document AI upload endpoints
- Existing file IDs and references

Files uploaded through old endpoints are automatically included in the centralized file list.

## Troubleshooting

### Files not appearing in centralized list

1. Check that the file was uploaded successfully
2. Verify the user ID is consistent across requests
3. Check both backend services (SOP service and Document AI service)
4. Review browser console for API errors

### Upload failures

1. Check file size limits (backend configuration)
2. Verify file type is supported
3. Check network connectivity
4. Review server logs for detailed error messages

## Technical Details

### User Identification

Files are associated with users via the `x-user-id` header. The system generates a unique user ID stored in localStorage:

```typescript
function getOrCreateUserId(): string {
  const key = "edulens_user_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated = `user-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  localStorage.setItem(key, generated);
  return generated;
}
```

### File Deduplication

When aggregating files from multiple sources, the API:
1. Creates a Map keyed by file ID
2. Keeps the most recent version if duplicates exist
3. Sorts by upload date (newest first)
4. Returns unique files only

### Security Considerations

- Files are isolated per user (based on `x-user-id`)
- No cross-user file access
- Files are stored securely in backend services
- Authentication required for all file operations (Bearer token)

## API Reference

See the full API documentation in:
- `/src/app/api/user-files/route.ts` - Centralized file API
- `/src/hooks/useUserFiles.ts` - React hook for file management
- `/src/lib/api/chatOrchestrator.ts` - Chat orchestrator with file support
