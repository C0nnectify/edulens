"""
Document Processing API Endpoints

Endpoints for text extraction, OCR, and embedding generation
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.services.document_processor_new import comprehensive_document_processor as document_processor

router = APIRouter(prefix="/api/documents", tags=["documents"])


class EmbeddingRequest(BaseModel):
    file_id: str
    user_id: str
    text: str
    metadata: Dict
    chunk_size: int = 500
    chunk_overlap: int = 50


class SearchRequest(BaseModel):
    user_id: str
    query: str
    limit: int = 10
    filters: Optional[Dict] = None


class DeleteEmbeddingsRequest(BaseModel):
    ids: List[str]


@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from document (PDF, Word, etc.)
    Returns extracted text and whether OCR is needed
    """
    try:
        content = await file.read()
        
        if file.content_type == 'application/pdf':
            text, needs_ocr = await document_processor.extract_text_from_pdf(content)
            return {
                "success": True,
                "text": text,
                "needs_ocr": needs_ocr,
                "file_type": "pdf"
            }
        elif file.content_type in [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]:
            text = await document_processor.extract_text_from_word(content)
            return {
                "success": True,
                "text": text,
                "needs_ocr": False,
                "file_type": "word"
            }
        elif file.content_type == 'text/plain':
            text = content.decode('utf-8')
            return {
                "success": True,
                "text": text,
                "needs_ocr": False,
                "file_type": "text"
            }
        else:
            return {
                "success": False,
                "error": "Unsupported file type",
                "text": "",
                "needs_ocr": False
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")


@router.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    """
    Perform OCR on scanned PDF or image
    """
    try:
        content = await file.read()
        
        if file.content_type == 'application/pdf':
            text = await document_processor.perform_ocr_on_pdf(content)
        elif file.content_type in ['image/jpeg', 'image/png', 'image/jpg']:
            text = await document_processor.perform_ocr_on_image(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type for OCR")
        
        return {
            "success": True,
            "text": text,
            "ocr_performed": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")


@router.post("/embeddings/generate")
async def generate_embeddings(request: EmbeddingRequest):
    """
    Generate embeddings and store in ChromaDB
    """
    try:
        result = await document_processor.generate_embeddings(
            file_id=request.file_id,
            user_id=request.user_id,
            text=request.text,
            metadata=request.metadata,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")


@router.post("/embeddings/search")
async def search_documents(request: SearchRequest):
    """
    Search documents using semantic similarity
    """
    try:
        results = await document_processor.search_embeddings(
            user_id=request.user_id,
            query=request.query,
            limit=request.limit,
            filters=request.filters
        )
        
        return {
            "success": True,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/embeddings/delete")
async def delete_embeddings(request: DeleteEmbeddingsRequest):
    """
    Delete embeddings from ChromaDB
    """
    try:
        success = await document_processor.delete_embeddings(request.ids)
        
        return {
            "success": success,
            "deleted_count": len(request.ids) if success else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Check if document processing service is healthy
    """
    return {
        "status": "healthy",
        "service": "document_processor",
        "embedding_model": "all-MiniLM-L6-v2",
        "chromadb": "connected"
    }
