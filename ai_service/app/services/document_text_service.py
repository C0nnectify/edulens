"""Helpers to load/extract text for a stored document.

This is the shared bridge that lets SOP/LOR/Analyze reuse documents consistently
by canonical `document_id`, regardless of storage backend.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from app.database.mongodb import get_documents_collection
from app.services import DocumentProcessor
from app.services.gridfs_tempfile import gridfs_to_tempfile


async def extract_document_text_for_user(
    *,
    user_id: str,
    document_id: str,
) -> str:
    """Return extracted text for a document owned by user.

    Raises ValueError if the document is missing or cannot be read.
    """
    docs_collection = get_documents_collection()
    doc = await docs_collection.find_one({"document_id": document_id, "user_id": user_id})
    if not doc:
        raise ValueError("Document not found")

    processor = DocumentProcessor()

    storage_backend = doc.get("storage_backend") or ("gridfs" if doc.get("gridfs_id") else "disk")
    tmp_path: Optional[str] = None

    try:
        if storage_backend == "gridfs":
            gridfs_id = doc.get("gridfs_id")
            if not gridfs_id:
                raise ValueError("Missing gridfs_id")
            suffix = Path(doc.get("filename") or "").suffix
            tmp = await gridfs_to_tempfile(gridfs_id, suffix=suffix)
            tmp_path = tmp.path
            text, _ = await processor.process_document(tmp_path)
            return text or ""

        file_path = doc.get("file_path")
        if not file_path:
            raise ValueError("Missing file_path")
        text, _ = await processor.process_document(file_path)
        return text or ""

    finally:
        if tmp_path:
            try:
                os.remove(tmp_path)
            except Exception:
                pass
