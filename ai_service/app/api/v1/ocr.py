"""
OCR (Optical Character Recognition) endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from pydantic import BaseModel, Field
from app.api.dependencies import get_current_user_id
from app.services.ocr_service import OCRService
from app.utils import save_upload_file, delete_file, logger

router = APIRouter(prefix="/ocr", tags=["OCR"])


class OCRResponse(BaseModel):
    """Response model for OCR extraction"""
    text: str = Field(..., description="Extracted text")
    confidence: float = Field(..., description="Average confidence score")
    language: str = Field(..., description="OCR language used")
    word_count: int = Field(..., description="Number of words extracted")


@router.post("/extract", response_model=OCRResponse)
async def extract_text_from_image(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
):
    """
    Extract text from an image using OCR

    Args:
        file: Image file to process
        language: OCR language (optional, defaults to 'eng')
        user_id: Authenticated user ID

    Returns:
        OCRResponse with extracted text and metadata
    """
    try:
        ocr_service = OCRService()

        # Validate that file is an image
        if not ocr_service.is_image_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (png, jpg, jpeg, gif, bmp, tiff)"
            )

        # Calculate file hash for saving
        from app.utils import calculate_file_hash
        file_hash = await calculate_file_hash(file)

        # Save file temporarily
        file_path = await save_upload_file(file, user_id, file_hash)

        try:
            # Validate image
            is_valid = await ocr_service.validate_image(file_path)
            if not is_valid:
                raise HTTPException(status_code=400, detail="Invalid or corrupted image file")

            # Perform OCR
            result = await ocr_service.extract_text_from_image(file_path, language)

            return OCRResponse(
                text=result["text"],
                confidence=result["confidence"],
                language=result["language"],
                word_count=result["word_count"],
            )

        finally:
            # Clean up temporary file
            await delete_file(file_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing OCR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-with-layout")
async def extract_text_with_layout(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
):
    """
    Extract text from image preserving layout (returns hOCR format)

    Args:
        file: Image file to process
        language: OCR language
        user_id: Authenticated user ID

    Returns:
        Extracted text with layout information
    """
    try:
        ocr_service = OCRService()

        if not ocr_service.is_image_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )

        from app.utils import calculate_file_hash
        file_hash = await calculate_file_hash(file)
        file_path = await save_upload_file(file, user_id, file_hash)

        try:
            is_valid = await ocr_service.validate_image(file_path)
            if not is_valid:
                raise HTTPException(status_code=400, detail="Invalid image file")

            result = await ocr_service.extract_text_with_layout(file_path, language)

            return result

        finally:
            await delete_file(file_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing layout OCR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
