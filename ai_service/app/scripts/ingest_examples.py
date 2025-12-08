"""Ingest SOP and LOR example PDFs into ChromaDB collections.

Collections:
  - sop_examples
  - lor_examples

Steps per file:
  1. Read PDF text.
  2. Derive metadata (hash, degree level, field, country heuristics).
  3. Chunk text.
  4. Embed chunks with Gemini (fallback to Ollama/mock).
  5. Add to ChromaDB if not previously ingested.

Duplicate avoidance:
  - Uses SHA256(file_bytes) as file_hash.
  - Skips ingestion if any existing chunk id starts with file_hash.

Environment:
  GOOGLE_API_KEY (optional; fallback to mock embeddings)
  USE_MOCK_EMB   (true/false)

Usage:
  python -m app.scripts.ingest_examples --sop --lor
  python -m app.scripts.ingest_examples --sop --reindex  # force re-add

Folder conventions (create if absent):
  app/data/SOP_DATA/pdfs
  app/data/LOR_DATA/pdfs
"""
from __future__ import annotations

import argparse
import hashlib
import os
import sys
from typing import List, Dict, Any
import logging
from dotenv import load_dotenv

load_dotenv()  # Load .env BEFORE importing embedding functions so GOOGLE_API_KEY is visible

from pypdf import PdfReader
import chromadb
from chromadb.config import Settings

from app.services.embedding_functions import gemini_embedding_function
from app.SOP_Generator.services.embeddings import chunk_text
from app.SOP_Generator.db import db_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingest_examples")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
# Expect PDFs inside dedicated subfolders 'pdfs'; create them if absent.
SOP_PDF_DIR = os.path.join(BASE_DIR, "SOP_DATA")
LOR_PDF_DIR = os.path.join(BASE_DIR, "LOR_DATA")

# Heuristic regex patterns (simplified); duplicates of style module for consistency
import re
_DEGREE_PATTERNS = {
    "phd": re.compile(r"\b(phd|doctoral|doctorate)\b", re.I),
    "masters": re.compile(r"\b(master'?s|msc|ms)\b", re.I),
    "bachelors": re.compile(r"\b(bachelor'?s|bsc|bs)\b", re.I),
}
_FIELD_PATTERNS = {
    "computer_science": re.compile(r"\b(computer science|software engineering|cs)\b", re.I),
    "data_science": re.compile(r"\b(data science|analytics|data analysis)\b", re.I),
    "artificial_intelligence": re.compile(r"\b(artificial intelligence|machine learning|deep learning|ai)\b", re.I),
}
_COUNTRY_PATTERNS = {
    "australia": re.compile(r"\b(australia|australian)\b", re.I),
    "usa": re.compile(r"\b(united states|usa|america|american)\b", re.I),
    "canada": re.compile(r"\b(canada|canadian)\b", re.I),
    "uk": re.compile(r"\b(united kingdom|uk|britain|british)\b", re.I),
    "germany": re.compile(r"\b(germany|german)\b", re.I),
}


def _read_pdf(path: str) -> str:
    try:
        reader = PdfReader(path)
        text_parts: List[str] = []
        for page in reader.pages:
            try:
                text_parts.append(page.extract_text() or "")
            except Exception:
                pass
        return "\n".join(text_parts)
    except Exception as e:
        logger.warning("Failed to read PDF %s: %s", path, e)
        return ""


def _file_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _infer_metadata(text: str) -> Dict[str, Any]:
    meta: Dict[str, Any] = {}
    for label, pat in _DEGREE_PATTERNS.items():
        if pat.search(text):
            meta.setdefault("degree_levels", []).append(label)
    for label, pat in _FIELD_PATTERNS.items():
        if pat.search(text):
            meta.setdefault("fields", []).append(label)
    for label, pat in _COUNTRY_PATTERNS.items():
        if pat.search(text):
            meta.setdefault("countries", []).append(label)
    meta["word_count"] = len(text.split())
    return meta


def _flatten_metadata(meta: Dict[str, Any]) -> Dict[str, Any]:
    """Convert list values to comma-separated strings (Chroma expects primitives)."""
    flat: Dict[str, Any] = {}
    for k, v in meta.items():
        if isinstance(v, list):
            flat[k] = ",".join(str(x) for x in v)
        else:
            flat[k] = v
    return flat


def _ensure_dir(path: str) -> None:
    if not os.path.isdir(path):
        os.makedirs(path, exist_ok=True)


def _get_chroma_collection(name: str) -> chromadb.Collection:
    client = db_client.get_chroma_client()
    # Attach the same embedding function used for adding to ensure query dimensionality matches
    from app.services.embedding_functions import gemini_embedding_function
    return client.get_or_create_collection(name=name, embedding_function=gemini_embedding_function, metadata={"source": "examples"})


def _already_ingested(collection: chromadb.Collection, file_hash: str) -> bool:
    # Simple heuristic: fetch ids and check prefix match
    try:
        existing = collection.get(include=["ids"], limit=5_000)  # limit for safety
        for _id in existing.get("ids", []):
            if _id.startswith(file_hash + "_"):
                return True
    except Exception:
        pass
    return False


def ingest_folder(folder: str, collection_name: str, reindex: bool = False) -> None:
    _ensure_dir(folder)
    pdf_files = [f for f in os.listdir(folder) if f.lower().endswith(".pdf")]
    if not pdf_files:
        logger.info("No PDFs found in %s", folder)
        return

    collection = _get_chroma_collection(collection_name)

    for fname in pdf_files:
        path = os.path.join(folder, fname)
        try:
            with open(path, "rb") as f:
                data = f.read()
            file_hash = _file_hash(data)
        except OSError as e:
            logger.warning("Cannot read %s: %s", path, e)
            continue

        if not reindex and _already_ingested(collection, file_hash):
            logger.info("Skipping already ingested file %s", fname)
            continue

        text = _read_pdf(path)
        if not text.strip():
            logger.warning("Empty text extracted for %s; skipping", fname)
            continue

        meta = _infer_metadata(text)
        chunks = chunk_text(text, chunk_size=1100, overlap=120)
        if not chunks:
            logger.warning("No chunks derived for %s; skipping", fname)
            continue

        # Embed
        embeddings = gemini_embedding_function(chunks)
        ids = [f"{file_hash}_{i}" for i in range(len(chunks))]
        flat_meta = _flatten_metadata(meta)
        metadatas = [
            {
                "file_hash": file_hash,
                "filename": fname,
                "chunk_index": i,
                "text_preview": chunk[:250],
                **flat_meta,
            }
            for i, chunk in enumerate(chunks)
        ]

        try:
            collection.add(documents=chunks, embeddings=embeddings, ids=ids, metadatas=metadatas)
            logger.info("Ingested %s (%d chunks)", fname, len(chunks))
        except Exception as e:
            logger.error("Failed to add chunks for %s: %s", fname, e)


def main(argv: List[str] = None) -> None:
    parser = argparse.ArgumentParser(description="Ingest SOP/LOR example PDFs into ChromaDB")
    parser.add_argument("--sop", action="store_true", help="Ingest SOP examples")
    parser.add_argument("--lor", action="store_true", help="Ingest LOR examples")
    parser.add_argument("--reindex", action="store_true", help="Force re-ingest even if file hash exists")
    args = parser.parse_args(argv)

    if not (args.sop or args.lor):
        parser.error("At least one of --sop or --lor must be specified")

    if args.sop:
        ingest_folder(SOP_PDF_DIR, "sop_examples", reindex=args.reindex)
    if args.lor:
        ingest_folder(LOR_PDF_DIR, "lor_examples", reindex=args.reindex)

    logger.info("Ingestion complete.")


if __name__ == "__main__":  # pragma: no cover
    main(sys.argv[1:])
