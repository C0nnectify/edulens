"""
File utility functions for hashing, validation, and management
"""

import hashlib
import os
import aiofiles
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
from app.config import settings
from app.utils.logger import logger


async def calculate_file_hash(file: UploadFile) -> str:
    """
    Calculate SHA-256 hash of uploaded file

    Args:
        file: FastAPI UploadFile object

    Returns:
        Hexadecimal hash string
    """
    sha256_hash = hashlib.sha256()

    # Read file in chunks to handle large files
    chunk_size = 8192
    await file.seek(0)

    while chunk := await file.read(chunk_size):
        sha256_hash.update(chunk)

    # Reset file pointer
    await file.seek(0)

    return sha256_hash.hexdigest()


def get_file_extension(filename: str) -> str:
    """
    Get file extension from filename

    Args:
        filename: Name of the file

    Returns:
        File extension without dot (e.g., 'pdf', 'docx')
    """
    return Path(filename).suffix.lower().lstrip('.')


def validate_file_type(filename: str) -> bool:
    """
    Validate if file type is allowed

    Args:
        filename: Name of the file

    Returns:
        True if file type is allowed

    Raises:
        HTTPException: If file type is not allowed
    """
    ext = get_file_extension(filename)

    if ext not in settings.allowed_file_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed types: {', '.join(settings.allowed_file_types)}"
        )

    return True


def validate_file_size(file_size: int) -> bool:
    """
    Validate if file size is within limits

    Args:
        file_size: Size of file in bytes

    Returns:
        True if file size is valid

    Raises:
        HTTPException: If file size exceeds limit
    """
    if file_size > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size ({file_size / (1024*1024):.2f} MB) exceeds maximum allowed size ({settings.max_file_size_mb} MB)"
        )

    return True


async def save_upload_file(file: UploadFile, user_id: str, file_hash: str) -> str:
    """
    Save uploaded file to disk

    Args:
        file: FastAPI UploadFile object
        user_id: User identifier
        file_hash: SHA-256 hash of file

    Returns:
        Path to saved file
    """
    # Create user-specific directory
    user_dir = Path(settings.upload_dir) / user_id
    user_dir.mkdir(parents=True, exist_ok=True)

    # Use hash as filename to avoid duplicates and handle special characters
    ext = get_file_extension(file.filename)
    file_path = user_dir / f"{file_hash}.{ext}"

    # Save file
    await file.seek(0)
    async with aiofiles.open(file_path, 'wb') as f:
        while chunk := await file.read(8192):
            await f.write(chunk)

    logger.info(f"Saved file to {file_path}")
    return str(file_path)


async def delete_file(file_path: str) -> bool:
    """
    Delete file from disk

    Args:
        file_path: Path to file

    Returns:
        True if file was deleted successfully
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted file {file_path}")
            return True
        else:
            logger.warning(f"File not found: {file_path}")
            return False
    except Exception as e:
        logger.error(f"Error deleting file {file_path}: {e}")
        return False


def get_file_type_from_extension(extension: str) -> str:
    """
    Get file type category from extension

    Args:
        extension: File extension (without dot)

    Returns:
        File type category ('pdf', 'docx', 'txt', 'image')
    """
    extension = extension.lower()

    if extension == 'pdf':
        return 'pdf'
    elif extension in ['doc', 'docx']:
        return 'docx'
    elif extension == 'txt':
        return 'txt'
    elif extension in ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff']:
        return 'image'
    else:
        return 'unknown'
