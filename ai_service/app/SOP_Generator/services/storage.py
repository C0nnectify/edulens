"""Storage service for file uploads and text extraction"""
import os
import io
from typing import Optional, Dict, Any
from datetime import datetime
import PyPDF2
import docx
from bson import ObjectId


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from PDF file
    
    Args:
        file_bytes: PDF file content as bytes
        
    Returns:
        Extracted text
    """
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        return "\n\n".join(text_parts)
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""


def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extract text from DOCX file
    
    Args:
        file_bytes: DOCX file content as bytes
        
    Returns:
        Extracted text
    """
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text_parts = [paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()]
        return "\n\n".join(text_parts)
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        return ""


def extract_text_from_txt(file_bytes: bytes) -> str:
    """
    Extract text from TXT file
    
    Args:
        file_bytes: TXT file content as bytes
        
    Returns:
        Extracted text
    """
    try:
        return file_bytes.decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error extracting TXT text: {e}")
        return ""


def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """
    Extract text from uploaded file based on extension
    
    Args:
        filename: Original filename
        file_bytes: File content as bytes
        
    Returns:
        Extracted text or empty string if extraction fails
    """
    ext = filename.lower().split('.')[-1]
    
    extractors = {
        'pdf': extract_text_from_pdf,
        'docx': extract_text_from_docx,
        'doc': extract_text_from_docx,
        'txt': extract_text_from_txt,
    }
    
    extractor = extractors.get(ext)
    if extractor:
        return extractor(file_bytes)
    
    # Fallback: try as text
    return extract_text_from_txt(file_bytes)


class StorageService:
    """Service for managing file storage in MongoDB"""
    
    def __init__(self, files_collection):
        self.files_collection = files_collection
    
    def store_file(
        self,
        filename: str,
        file_bytes: bytes,
        doc_type: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Store file metadata and extract text
        
        Args:
            filename: Original filename
            file_bytes: File content as bytes
            doc_type: Type of document (resume, transcript, etc.)
            user_id: User ID from JWT
            
        Returns:
            Dict with file_id, filename, text_preview
        """
        # Extract text
        full_text = extract_text_from_file(filename, file_bytes)
        text_preview = full_text[:500] if full_text else f"File: {filename}"
        
        # Store metadata in MongoDB
        file_doc = {
            "filename": filename,
            "doc_type": doc_type,
            "user_id": user_id,
            "file_size": len(file_bytes),
            "full_text": full_text,
            "text_preview": text_preview,
            "created_at": datetime.utcnow(),
            # Note: For production, consider using GridFS for large files
            # For MVP, storing small files directly is acceptable
            "file_data": file_bytes if len(file_bytes) < 16_000_000 else None  # 16MB limit
        }
        
        result = self.files_collection.insert_one(file_doc)
        file_id = str(result.inserted_id)
        
        return {
            "file_id": file_id,
            "filename": filename,
            "text_preview": text_preview
        }
    
    def get_file(self, file_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve file by ID
        
        Args:
            file_id: File identifier
            user_id: User ID for authorization
            
        Returns:
            File document or None
        """
        try:
            # Check if file_id looks like a valid ObjectId (24 hex chars)
            # If it's a custom format like "file-123-abc", skip ObjectId conversion
            if not (len(file_id) == 24 and all(c in '0123456789abcdef' for c in file_id.lower())):
                # Not a valid ObjectId format, skip this lookup
                return None
            
            file_doc = self.files_collection.find_one({
                "_id": ObjectId(file_id),
                "user_id": user_id
            })
            
            if file_doc:
                file_doc["_id"] = str(file_doc["_id"])
            
            return file_doc
        except Exception as e:
            # Silently fail for non-ObjectId formats (new centralized system uses custom IDs)
            return None
    
    def get_file_text(self, file_id: str, user_id: str) -> str:
        """
        Get extracted text from file
        
        Args:
            file_id: File identifier
            user_id: User ID for authorization
            
        Returns:
            Extracted text or empty string
        """
        file_doc = self.get_file(file_id, user_id)
        if file_doc:
            return file_doc.get("full_text", "")
        return ""
