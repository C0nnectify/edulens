"""Database clients for MongoDB and ChromaDB"""
import os
from pymongo import MongoClient
from typing import Optional, List, Dict, Any, Tuple
import chromadb
from chromadb.config import Settings
from app.config import settings
from app.services.embedding_functions import gemini_embedding_function


# Environment/config
MONGO_URI = settings.mongodb_uri or os.getenv("MONGO_URI", "mongodb://localhost:27017/edulens")
CHROMA_URL = os.getenv("CHROMA_URL", "http://localhost:8000")
USE_MOCK_EMB = os.getenv("USE_MOCK_EMB", "true").strip().lower() in ("1", "true", "yes", "y")


class DatabaseClient:
    """Singleton database client manager"""
    _instance = None
    _mongo_client: Optional[MongoClient] = None
    _chroma_client: Optional[chromadb.Client] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_mongo_client(self) -> MongoClient:
        """Get or create MongoDB client"""
        if self._mongo_client is None:
            self._mongo_client = MongoClient(MONGO_URI)
        return self._mongo_client

    def get_database(self):
        """Return the MongoDB database using configured name.

        Avoids relying on a default database in the URI. If the URI contains
        a default DB it's fine, but we explicitly select the configured
        `settings.mongodb_db_name` to prevent 'No default database defined'.
        """
        client = self.get_mongo_client()
        db_name = settings.mongodb_db_name or "edulens"
        return client[db_name]
    
    def get_chroma_client(self) -> chromadb.Client:
        """Get or create ChromaDB client"""
        if self._chroma_client is None:
            try:
                # Always prefer persistent local client to avoid unsupported 'rest' api_impl errors
                persist_dir = getattr(settings, "CHROMA_PERSIST_DIRECTORY", "./chroma_db")
                self._chroma_client = chromadb.PersistentClient(
                    path=persist_dir,
                    settings=Settings(anonymized_telemetry=False, allow_reset=True)
                )
            except Exception as e:
                print(f"[Chroma] PersistentClient init failed: {e}. Falling back to HttpClient {CHROMA_URL}.")
                try:
                    self._chroma_client = chromadb.HttpClient(host=CHROMA_URL)
                except Exception as e2:
                    raise RuntimeError(f"Unable to initialize Chroma client: {e2}")
        return self._chroma_client
    
    def get_sop_collection(self):
        """Get SOP documents collection"""
        db = self.get_database()
        return db["sop_documents"]
    
    def get_files_collection(self):
        """Get uploaded files collection"""
        db = self.get_database()
        return db["sop_files"]

    def get_lor_collection(self):
        """Get LOR documents collection (examples or generated letters)."""
        db = self.get_database()
        return db["lor_documents"]


# Global instance
db_client = DatabaseClient()


def get_relevant_chunks(query: str, k: int = 5, collection_name: str = "sop_documents") -> List[Dict[str, Any]]:
    """
    Query ChromaDB for relevant chunks
    
    Args:
        query: Search query text
        k: Number of results to return
        collection_name: ChromaDB collection name
    
    Returns:
        List of relevant chunks with metadata
    """
    # TODO: swap to real embeddings provider after MVP
    if USE_MOCK_EMB:
        # Return mock results for testing
        return [
            {
                "file_id": f"mock_file_{i}",
                "chunk_index": i,
                "text_preview": f"Mock chunk {i}: relevant context about {query[:50]}...",
                "similarity": 0.9 - (i * 0.1)
            }
            for i in range(min(k, 3))
        ]
    
    try:
        chroma = db_client.get_chroma_client()
        collection = chroma.get_or_create_collection(name=collection_name)
        
        # Compute query embedding using the same function used to store
        q_emb = gemini_embedding_function([query])[0]
        results = collection.query(
            query_embeddings=[q_emb],
            n_results=k
        )
        
        chunks = []
        if results and results.get("documents"):
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
                distance = results["distances"][0][i] if results.get("distances") else 1.0
                
                chunks.append({
                    "file_id": metadata.get("file_id", "unknown"),
                    "chunk_index": metadata.get("chunk_index", i),
                    "text_preview": doc,
                    "similarity": 1.0 - distance
                })
        
        return chunks
    except Exception as e:
        print(f"Error querying ChromaDB: {e}")
        return []


def store_document_chunks(file_id: str, chunks: List[str], collection_name: str = "sop_documents"):
    """
    Store document chunks in ChromaDB
    
    Args:
        file_id: Unique file identifier
        chunks: List of text chunks
        collection_name: ChromaDB collection name
    """
    # TODO: swap to real embeddings provider after MVP
    if USE_MOCK_EMB:
        print(f"Mock: Would store {len(chunks)} chunks for file {file_id}")
        return
    
    try:
        chroma = db_client.get_chroma_client()
        collection = chroma.get_or_create_collection(name=collection_name)
        
        ids = [f"{file_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "file_id": file_id,
                "chunk_index": i,
                "text_preview": chunk[:200]
            }
            for i, chunk in enumerate(chunks)
        ]
        
        collection.add(
            documents=chunks,
            ids=ids,
            metadatas=metadatas
        )
    except Exception as e:
        print(f"Error storing chunks in ChromaDB: {e}")


def _extract_filters_from_query(query: str) -> Dict[str, str]:
    """Very light heuristic to infer field/country/degree tokens from free-text query.
    This can be expanded; for now matches simple keywords used in ingestion.
    """
    q = query.lower()
    field = None
    if any(k in q for k in ("computer", "software")):
        field = "computer_science"
    elif "data" in q:
        field = "data_science"
    elif "machine" in q or "deep" in q or "ai" in q:
        field = "artificial_intelligence"

    degree = None
    if "phd" in q or "doctoral" in q:
        degree = "phd"
    elif "master" in q or "msc" in q or "ms " in q:
        degree = "masters"
    elif "bachelor" in q or "undergrad" in q:
        degree = "bachelors"

    country = None
    if "australia" in q or "australian" in q:
        country = "australia"
    elif "canada" in q:
        country = "canada"
    elif "germany" in q:
        country = "germany"
    elif "united kingdom" in q or " uk" in q or "british" in q:
        country = "uk"
    elif "usa" in q or "united states" in q or "america" in q:
        country = "usa"

    return {k: v for k, v in {"field": field, "degree": degree, "country": country}.items() if v}


def get_relevant_chunks_hybrid(
    query: str,
    k: int = 5,
    collection_name: str = "sop_documents",
    filters: Optional[Dict[str, str]] = None,
    oversample: int = 4,
    embed_weight: float = 0.7,
    meta_weight: float = 0.3,
) -> List[Dict[str, Any]]:
    """Hybrid retrieval with metadata boosting.

    Strategy:
      1. Perform semantic query (embedding similarity) requesting k * oversample docs.
      2. For each candidate compute metadata score: +1 for each matching filter value in
         list metadata fields (degree_levels, fields, countries).
      3. Final score = embed_weight * similarity + meta_weight * (meta_matches / max_possible).
      4. Return top-k re-ranked results.

    If USE_MOCK_EMB is true, returns mock chunks (same as get_relevant_chunks) augmented
    with filters echo for traceability.
    """
    if filters is None:
        filters = _extract_filters_from_query(query)

    if USE_MOCK_EMB:
        base = get_relevant_chunks(query, k=k, collection_name=collection_name)
        for b in base:
            b["metadata_match"] = list(filters.values())
        return base

    try:
        chroma = db_client.get_chroma_client()
        collection = chroma.get_or_create_collection(name=collection_name)
        n_results = max(k * oversample, k)
        q_emb = gemini_embedding_function([query])[0]
        results = collection.query(query_embeddings=[q_emb], n_results=n_results)

        candidates: List[Tuple[float, Dict[str, Any]]] = []
        documents = results.get("documents", [[]])
        metadatas = results.get("metadatas", [[]])
        distances = results.get("distances", [[]])

        for i, doc in enumerate(documents[0]):
            metadata = metadatas[0][i] if metadatas and metadatas[0] else {}
            distance = distances[0][i] if distances and distances[0] else 1.0
            similarity = 1.0 - distance

            # Metadata matches
            match_count = 0
            max_possible = 0
            # Normalize list metadata to list
            degree_levels = metadata.get("degree_levels", []) or []
            fields_meta = metadata.get("fields", []) or []
            countries_meta = metadata.get("countries", []) or []

            if filters.get("degree"):
                max_possible += 1
                if filters["degree"] in degree_levels:
                    match_count += 1
            if filters.get("field"):
                max_possible += 1
                if filters["field"] in fields_meta:
                    match_count += 1
            if filters.get("country"):
                max_possible += 1
                if filters["country"] in countries_meta:
                    match_count += 1

            meta_score = (match_count / max_possible) if max_possible else 0.0
            final_score = embed_weight * similarity + meta_weight * meta_score

            candidates.append((final_score, {
                "file_id": metadata.get("file_id", metadata.get("file_hash", "unknown")),
                "chunk_index": metadata.get("chunk_index", i),
                "text_preview": doc,
                "similarity": similarity,
                "meta_score": round(meta_score, 3),
                "final_score": round(final_score, 3),
                "filters_applied": filters,
            }))

        # Sort by final_score desc
        candidates.sort(key=lambda x: x[0], reverse=True)
        top = [c[1] for c in candidates[:k]]
        return top
    except Exception as e:
        print(f"Error in hybrid retrieval: {e}")
        # Fallback to basic retrieval
        return get_relevant_chunks(query, k=k, collection_name=collection_name)


def get_lor_style_context(
    country: Optional[str],
    subject: Optional[str],
    collection_name: str = "lor_examples",
) -> List[Dict[str, Any]]:
    """Retrieve style/context chunks for LOR using two-step selection:

    - Top-1 by country (metadata boost focuses on country)
    - Top-2 by subject/field (metadata boost focuses on field)

    Returns a merged unique list of up to 3 chunks.
    """
    selected: List[Dict[str, Any]] = []

    # Country-focused retrieval (k=1)
    if country:
        try:
            query = f"{country} recommendation letter style"
            filters = {"country": country.lower()}
            country_top = get_relevant_chunks_hybrid(
                query=query,
                k=1,
                collection_name=collection_name,
                filters=filters,
                oversample=4,
                embed_weight=0.6,
                meta_weight=0.4,
            )
            selected.extend(country_top)
        except Exception as e:
            print(f"[LOR] Country retrieval failed: {e}")

    # Subject/field-focused retrieval (k=2)
    if subject:
        try:
            field_token = subject.lower().strip()
            query = f"{subject} field letter of recommendation examples"
            filters = {"field": field_token}
            subject_top = get_relevant_chunks_hybrid(
                query=query,
                k=2,
                collection_name=collection_name,
                filters=filters,
                oversample=4,
                embed_weight=0.7,
                meta_weight=0.3,
            )
            selected.extend(subject_top)
        except Exception as e:
            print(f"[LOR] Subject retrieval failed: {e}")

    # Deduplicate by (file_id, chunk_index)
    uniq: Dict[Tuple[str, int], Dict[str, Any]] = {}
    for ch in selected:
        fid = ch.get("file_id", "unknown")
        idx = int(ch.get("chunk_index", 0))
        uniq[(fid, idx)] = ch

    return list(uniq.values())[:3]


def get_sop_style_context(
    country: Optional[str],
    subject: Optional[str],
    collection_name: str = "sop_examples",
) -> List[Dict[str, Any]]:
    """Retrieve style/context chunks for SOP using the same scheme:

    - Top-1 by country
    - Top-2 by subject/field
    """
    selected: List[Dict[str, Any]] = []

    if country:
        try:
            query = f"{country} SOP style examples"
            filters = {"country": country.lower()}
            top_country = get_relevant_chunks_hybrid(
                query=query,
                k=1,
                collection_name=collection_name,
                filters=filters,
                oversample=4,
                embed_weight=0.6,
                meta_weight=0.4,
            )
            selected.extend(top_country)
        except Exception as e:
            print(f"[SOP] Country retrieval failed: {e}")

    if subject:
        try:
            field_token = subject.lower().strip()
            query = f"{subject} SOP examples"
            filters = {"field": field_token}
            top_subject = get_relevant_chunks_hybrid(
                query=query,
                k=2,
                collection_name=collection_name,
                filters=filters,
                oversample=4,
                embed_weight=0.7,
                meta_weight=0.3,
            )
            selected.extend(top_subject)
        except Exception as e:
            print(f"[SOP] Subject retrieval failed: {e}")

    uniq: Dict[Tuple[str, int], Dict[str, Any]] = {}
    for ch in selected:
        fid = ch.get("file_id", "unknown")
        idx = int(ch.get("chunk_index", 0))
        uniq[(fid, idx)] = ch

    return list(uniq.values())[:3]
