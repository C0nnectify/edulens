"""Style retrieval and profiling for SOP and LOR generation.

Aggregates stylistic features from top-matching example documents stored in
ChromaDB collections ("sop_examples" and "lor_examples"). The resulting
`style_profile` dictionary can be injected into LLM prompts to bias output
format, tone, and structure.

Core public function:
    get_style_profile(doc_type: str, query: str, k: int = 8) -> dict

Returned style_profile keys (example):
    {
        "doc_type": "sop",
        "avg_sentence_length": 18.4,
        "avg_paragraph_length": 125.2,
        "common_headings": ["Introduction", "Academic Background", ...],
        "opening_phrases": ["I am writing", "My academic journey"],
        "closing_phrases": ["Thank you for", "I am confident"],
        "tone_indicators": ["professional", "motivated", "collaborative"],
        "field_terms": ["machine learning", "data analysis"],
        "degree_levels": ["masters"],
        "countries": ["australia"],
        "recommended_structure": ["Introduction", "Academic Background", ...],
        "word_count_estimate": 980,
    }

Notes:
 - This module does NOT perform embedding queries directly; it relies on ChromaDB
   semantic search with the provided query to select representative chunks.
 - Chunks are expected to carry metadata fields: file_id, text_preview (or full text),
   and optional parsed attributes (country, field, degree_level, headings list).
 - If metadata fields are missing, heuristics attempt extraction from text.
"""
from __future__ import annotations

import re
import statistics
from collections import Counter, defaultdict
from typing import Dict, List, Any, Iterable, Tuple
import logging

from app.SOP_Generator.db import db_client, get_relevant_chunks
from app.SOP_Generator.services.embeddings import chunk_text

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Heuristic extraction helpers
# ---------------------------------------------------------------------------

_DEGREE_PATTERNS = {
    "phd": re.compile(r"\b(phd|doctoral|doctorate)\b", re.I),
    "masters": re.compile(r"\b(master'?s|msc|ms)\b", re.I),
    "bachelors": re.compile(r"\b(bachelor'?s|bsc|bs)\b", re.I),
    "undergrad": re.compile(r"\b(undergrad|undergraduate)\b", re.I),
}

_FIELD_PATTERNS = {
    "computer_science": re.compile(r"\b(computer science|cs|software engineering)\b", re.I),
    "data_science": re.compile(r"\b(data science|data analysis|analytics)\b", re.I),
    "electrical_engineering": re.compile(r"\b(electrical engineering|ee)\b", re.I),
    "mechanical_engineering": re.compile(r"\b(mechanical engineering)\b", re.I),
    "artificial_intelligence": re.compile(r"\b(artificial intelligence|ai|machine learning|deep learning)\b", re.I),
}

_COUNTRY_PATTERNS = {
    "australia": re.compile(r"\b(australia|australian)\b", re.I),
    "usa": re.compile(r"\b(united states|usa|america|american)\b", re.I),
    "canada": re.compile(r"\b(canada|canadian)\b", re.I),
    "uk": re.compile(r"\b(united kingdom|uk|britain|british)\b", re.I),
    "germany": re.compile(r"\b(germany|german)\b", re.I),
}

_OPENING_PHRASE_RE = re.compile(r"^(?:I am writing|My (?:academic|professional) journey|Throughout my|Driven by)", re.I)
_CLOSING_PHRASE_RE = re.compile(r"(?:Thank you for|I am confident|I (?:strongly|firmly) believe|I look forward)", re.I)
_TONE_INDICATORS_RE = re.compile(r"\b(dedicated|passionate|motivated|collaborative|innovative|rigorous|professional|enthusiastic)\b", re.I)
_HEADING_CANDIDATES_RE = re.compile(r"^(?:[A-Z][A-Za-z& ]{3,60})$")

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")

# ---------------------------------------------------------------------------
# Core functions
# ---------------------------------------------------------------------------


def _extract_metadata(text: str) -> Dict[str, List[str]]:
    """Infer degree_levels, fields, countries, and tone indicators from text."""
    meta: Dict[str, List[str]] = defaultdict(list)
    for label, pattern in _DEGREE_PATTERNS.items():
        if pattern.search(text):
            meta.setdefault("degree_levels", []).append(label)
    for label, pattern in _FIELD_PATTERNS.items():
        if pattern.search(text):
            meta.setdefault("fields", []).append(label)
    for label, pattern in _COUNTRY_PATTERNS.items():
        if pattern.search(text):
            meta.setdefault("countries", []).append(label)
    tones = _TONE_INDICATORS_RE.findall(text)
    if tones:
        meta.setdefault("tone_indicators", []).extend(t.lower() for t in tones)
    return meta


def _tokenize_sentences(text: str) -> List[str]:
    # Crude split; retains adequate fidelity for avg length heuristic.
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s for s in sentences if s and len(s.split()) > 2]


def _paragraphs(text: str) -> List[str]:
    paras = [p.strip() for p in re.split(r"\n{2,}|\r\n{2,}", text) if p.strip()]
    return paras


def _collect_headings(chunks: Iterable[str]) -> List[str]:
    headings: List[str] = []
    for chunk in chunks:
        lines = [l.strip() for l in chunk.splitlines() if l.strip()]
        for line in lines[:6]:  # only top lines of chunk likely contain headings
            if 3 <= len(line.split()) <= 10 and line.isprintable() and _HEADING_CANDIDATES_RE.match(line):
                headings.append(line)
    return headings


def _aggregate_style(texts: List[str]) -> Dict[str, Any]:
    if not texts:
        return {}

    all_sentences: List[str] = []
    all_paragraphs: List[str] = []
    opening_phrases: Counter[str] = Counter()
    closing_phrases: Counter[str] = Counter()
    tone_indicators: Counter[str] = Counter()
    degree_levels: Counter[str] = Counter()
    fields: Counter[str] = Counter()
    countries: Counter[str] = Counter()

    for t in texts:
        sentences = _tokenize_sentences(t)
        all_sentences.extend(sentences)
        paras = _paragraphs(t)
        all_paragraphs.extend(paras)

        # Opening phrase
        if sentences:
            m = _OPENING_PHRASE_RE.match(sentences[0].strip())
            if m:
                opening_phrases[m.group(0).lower()] += 1
        # Closing phrase
        if sentences:
            tail = sentences[-1]
            for cm in _CLOSING_PHRASE_RE.findall(tail):
                closing_phrases[cm.lower()] += 1

        meta = _extract_metadata(t)
        for k, counter in [("tone_indicators", tone_indicators), ("degree_levels", degree_levels),
                           ("fields", fields), ("countries", countries)]:
            for v in meta.get(k, []):
                counter[v] += 1

    avg_sentence_len = statistics.mean(len(s.split()) for s in all_sentences) if all_sentences else 0.0
    avg_paragraph_len = statistics.mean(len(p.split()) for p in all_paragraphs) if all_paragraphs else 0.0

    headings = _collect_headings(texts)
    heading_counts = Counter(h.strip() for h in headings if h.strip())

    return {
        "avg_sentence_length": round(avg_sentence_len, 2),
        "avg_paragraph_length": round(avg_paragraph_len, 2),
        "common_headings": [h for h, _ in heading_counts.most_common(8)],
        "opening_phrases": [p for p, _ in opening_phrases.most_common(5)],
        "closing_phrases": [p for p, _ in closing_phrases.most_common(5)],
        "tone_indicators": [t for t, _ in tone_indicators.most_common(8)],
        "degree_levels": [d for d, _ in degree_levels.most_common(5)],
        "fields": [f for f, _ in fields.most_common(6)],
        "countries": [c for c, _ in countries.most_common(5)],
    }


DEFAULT_STRUCTURES = {
    "sop": ["Introduction", "Academic Background", "Relevant Experience", "Why This Program", "Goals & Conclusion"],
    "lor": ["Introduction & Relationship", "Performance & Contributions", "Skills & Examples", "Character & Potential", "Closing & Recommendation"],
}


def get_style_profile(doc_type: str, query: str, k: int = 8) -> Dict[str, Any]:
    """Retrieve top-k example chunks and synthesize a style profile.

    Args:
        doc_type: "sop" or "lor".
        query: Mixed semantic + keyword query (e.g. "computer science masters australia").
        k: number of chunks to aggregate.

    Returns:
        style_profile dict.
    """
    collection_name = "sop_examples" if doc_type == "sop" else "lor_examples"

    try:
        chunks = get_relevant_chunks(query=query, k=k, collection_name=collection_name)
    except Exception as e:  # pragma: no cover
        logger.error("Failed to query Chroma examples: %s", e)
        chunks = []

    texts: List[str] = []
    for ch in chunks:
        preview = ch.get("text_preview") or ch.get("text") or ""
        if preview:
            texts.append(preview)

    style_core = _aggregate_style(texts)

    # Word count estimate: average paragraph length * paragraphs heuristic
    para_len = style_core.get("avg_paragraph_length", 0) or 100
    para_count = len(DEFAULT_STRUCTURES.get(doc_type, [])) * 2 / 3 + 2  # heuristic
    word_estimate = int(para_len * para_count)

    style_profile = {
        "doc_type": doc_type,
        "source_chunks": len(texts),
        "recommended_structure": DEFAULT_STRUCTURES.get(doc_type, []),
        "word_count_estimate": word_estimate,
        **style_core,
    }

    # Fallback defaults if empty
    if style_profile["source_chunks"] == 0:
        style_profile.update({
            "avg_sentence_length": 18.0,
            "avg_paragraph_length": 110.0,
            "tone_indicators": ["professional", "clear"],
        })

    return style_profile


__all__ = ["get_style_profile"]
