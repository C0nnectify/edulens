"""GridFS helpers.

We keep processors (PDF/Doc/OCR) working by materializing GridFS content into a
temporary file path.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import tempfile
import inspect
from typing import Optional

from bson import ObjectId

from app.database.mongodb import get_gridfs_bucket


@dataclass
class TempFileResult:
    path: str


async def gridfs_to_tempfile(
    gridfs_id: str,
    *,
    bucket_name: str = "user_uploads",
    suffix: Optional[str] = None,
) -> TempFileResult:
    """Download a GridFS file to a temporary file and return its path."""
    bucket = get_gridfs_bucket(bucket_name=bucket_name)

    # Normalize suffix
    if suffix and not suffix.startswith("."):
        suffix = "." + suffix

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix or "")
    tmp_path = tmp.name
    tmp.close()

    stream = await bucket.open_download_stream(ObjectId(gridfs_id))
    try:
        data = await stream.read()  # bounded by upload size limits
        Path(tmp_path).write_bytes(data)
    finally:
        close_result = stream.close()
        if inspect.isawaitable(close_result):
            await close_result

    return TempFileResult(path=tmp_path)
