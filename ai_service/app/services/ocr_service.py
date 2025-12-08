"""
OCR service for extracting text from images using pytesseract
"""

from typing import Dict, Any
from pathlib import Path
import pytesseract
from PIL import Image
from app.config import settings
from app.utils.logger import logger


class OCRService:
    """Optical Character Recognition service"""

    def __init__(self):
        """Initialize OCR service"""
        # Set tesseract path if configured
        if settings.tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = settings.tesseract_path

    async def extract_text_from_image(
        self,
        file_path: str,
        language: str = None
    ) -> Dict[str, Any]:
        """
        Extract text from image using OCR

        Args:
            file_path: Path to image file
            language: OCR language (default from settings)

        Returns:
            Dictionary with extracted text and metadata
        """
        try:
            # Open image
            image = Image.open(file_path)

            # Use configured language or default
            lang = language or settings.ocr_languages

            # Extract text
            text = pytesseract.image_to_string(image, lang=lang)

            # Get detailed data with confidence scores
            data = pytesseract.image_to_data(image, lang=lang, output_type=pytesseract.Output.DICT)

            # Calculate average confidence
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            logger.info(
                f"Extracted {len(text)} characters from image {file_path} "
                f"with avg confidence {avg_confidence:.2f}%"
            )

            return {
                "text": text.strip(),
                "confidence": avg_confidence,
                "language": lang,
                "word_count": len(text.split()),
            }

        except Exception as e:
            logger.error(f"Error performing OCR on {file_path}: {e}")
            raise

    async def extract_text_with_layout(
        self,
        file_path: str,
        language: str = None
    ) -> Dict[str, Any]:
        """
        Extract text from image preserving layout

        Args:
            file_path: Path to image file
            language: OCR language

        Returns:
            Dictionary with extracted text and layout information
        """
        try:
            image = Image.open(file_path)
            lang = language or settings.ocr_languages

            # Get hOCR output (preserves layout)
            hocr = pytesseract.image_to_pdf_or_hocr(image, lang=lang, extension='hocr')

            # Get plain text
            text = pytesseract.image_to_string(image, lang=lang)

            logger.info(f"Extracted text with layout from {file_path}")

            return {
                "text": text.strip(),
                "hocr": hocr.decode('utf-8'),
                "language": lang,
            }

        except Exception as e:
            logger.error(f"Error performing layout OCR on {file_path}: {e}")
            raise

    @staticmethod
    def is_image_file(file_path: str) -> bool:
        """
        Check if file is an image

        Args:
            file_path: Path to file

        Returns:
            True if file is an image
        """
        image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.tif'}
        return Path(file_path).suffix.lower() in image_extensions

    async def validate_image(self, file_path: str) -> bool:
        """
        Validate that image can be processed

        Args:
            file_path: Path to image file

        Returns:
            True if image is valid
        """
        try:
            image = Image.open(file_path)
            image.verify()
            return True
        except Exception as e:
            logger.error(f"Invalid image file {file_path}: {e}")
            return False
