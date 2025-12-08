"""
Faculty matching service using embedding-based and keyword-based matching
"""

import time
import numpy as np
from typing import List, Optional, Dict, Any, Tuple
from collections import defaultdict

from app.models.faculty import (
    FacultyMatchRequest,
    FacultyMatchResponse,
    FacultyMatch,
    FacultyInfo,
    UniversityMatches,
    MatchingMode,
    FacultyStatus
)
from app.services.embedding_service import EmbeddingService
from app.database.mongodb import get_database
from app.utils.logger import logger


class FacultyMatchingService:
    """Service for matching students with faculty based on research interests"""

    def __init__(self, embedding_service: Optional[EmbeddingService] = None):
        """
        Initialize faculty matching service

        Args:
            embedding_service: Optional embedding service instance
        """
        self.embedding_service = embedding_service or EmbeddingService()
        self._db = None
        self._faculty_collection = None
        self._faculty_embeddings_collection = None

    @property
    def db(self):
        """Lazy initialization of database connection"""
        if self._db is None:
            self._db = get_database()
        return self._db

    @property
    def faculty_collection(self):
        """Lazy initialization of faculty collection"""
        if self._faculty_collection is None:
            self._faculty_collection = self.db["faculty_profiles"]
        return self._faculty_collection

    @property
    def faculty_embeddings_collection(self):
        """Lazy initialization of faculty embeddings collection"""
        if self._faculty_embeddings_collection is None:
            self._faculty_embeddings_collection = self.db["faculty_embeddings"]
        return self._faculty_embeddings_collection

    async def match_faculty(self, request: FacultyMatchRequest) -> FacultyMatchResponse:
        """
        Match faculty members based on research interests

        Args:
            request: FacultyMatchRequest with search parameters

        Returns:
            FacultyMatchResponse with matched faculty
        """
        start_time = time.time()

        # Build filters
        filters = self._build_filters(request)

        # Route to appropriate matching method
        if request.mode == MatchingMode.SEMANTIC:
            matches = await self._semantic_matching(request, filters)
        elif request.mode == MatchingMode.KEYWORD:
            matches = await self._keyword_matching(request, filters)
        elif request.mode == MatchingMode.HYBRID:
            matches = await self._hybrid_matching(request, filters)
        else:
            raise ValueError(f"Unsupported matching mode: {request.mode}")

        # Filter by minimum score if specified
        if request.min_score is not None:
            matches = [m for m in matches if m.match_score >= request.min_score]

        # Group by university
        matches_by_university = self._group_by_university(matches)

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        logger.info(
            f"Faculty matching completed: mode={request.mode}, "
            f"total_matches={len(matches)}, universities={len(matches_by_university)}, "
            f"time={processing_time:.2f}ms"
        )

        return FacultyMatchResponse(
            matches=matches,
            matches_by_university=matches_by_university,
            total_matches=len(matches),
            query=request.research_interests,
            mode=request.mode,
            filters_applied=filters,
            processing_time_ms=processing_time
        )

    def _build_filters(self, request: FacultyMatchRequest) -> Dict[str, Any]:
        """
        Build MongoDB filters from request

        Args:
            request: FacultyMatchRequest

        Returns:
            Dictionary of filters
        """
        filters = {}

        # University filters
        if request.university:
            filters["university"] = request.university
        elif request.universities:
            filters["university"] = {"$in": request.universities}

        # Department filters
        if request.department:
            filters["department"] = request.department
        elif request.departments:
            filters["department"] = {"$in": request.departments}

        # Student acceptance filter
        if request.accepting_students_only:
            filters["accepting_students"] = FacultyStatus.ACCEPTING.value

        return filters

    async def _semantic_matching(
        self,
        request: FacultyMatchRequest,
        filters: Dict[str, Any]
    ) -> List[FacultyMatch]:
        """
        Perform semantic matching using embeddings

        Args:
            request: FacultyMatchRequest
            filters: MongoDB filters

        Returns:
            List of FacultyMatch objects
        """
        # Generate query embedding
        query_embedding = await self.embedding_service.generate_query_embedding(
            request.research_interests,
            provider="openai"
        )

        # Get all faculty matching filters with embeddings
        cursor = self.faculty_embeddings_collection.find(filters)
        faculty_embeddings = await cursor.to_list(length=None)

        if not faculty_embeddings:
            logger.warning(f"No faculty found matching filters: {filters}")
            return []

        # Calculate similarities
        matches = []
        for faculty_emb in faculty_embeddings:
            if "embedding" not in faculty_emb:
                continue

            # Calculate cosine similarity
            similarity = self._cosine_similarity(
                query_embedding,
                faculty_emb["embedding"]
            )

            # Get full faculty info
            faculty_info = await self._get_faculty_info(
                faculty_emb["faculty_id"],
                request.include_publications
            )

            if faculty_info:
                # Convert similarity (0-1) to match score (0-100)
                match_score = similarity * 100

                # Generate reasoning
                reasoning = self._generate_reasoning(
                    request.research_interests,
                    faculty_info,
                    similarity,
                    mode=MatchingMode.SEMANTIC
                )

                # Extract matched keywords
                matched_keywords = self._extract_matched_keywords(
                    request.research_interests,
                    faculty_info.research_areas
                )

                match = FacultyMatch(
                    faculty=faculty_info,
                    match_score=match_score,
                    reasoning=reasoning,
                    matched_keywords=matched_keywords,
                    similarity_score=similarity
                )
                matches.append(match)

        # Sort by match score and limit
        matches.sort(key=lambda x: x.match_score, reverse=True)
        return matches[:request.top_k * 10]  # Return more for university grouping

    async def _keyword_matching(
        self,
        request: FacultyMatchRequest,
        filters: Dict[str, Any]
    ) -> List[FacultyMatch]:
        """
        Perform keyword-based matching

        Args:
            request: FacultyMatchRequest
            filters: MongoDB filters

        Returns:
            List of FacultyMatch objects
        """
        # Extract keywords from query
        query_keywords = self._extract_keywords(request.research_interests)

        # Build text search filter
        search_filters = filters.copy()
        search_filters["$text"] = {"$search": request.research_interests}

        # Query faculty with text search
        cursor = self.faculty_collection.find(
            search_filters,
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})])

        faculty_list = await cursor.to_list(length=request.top_k * 10)

        # Calculate matches
        matches = []
        for faculty_doc in faculty_list:
            faculty_info = self._doc_to_faculty_info(faculty_doc, request.include_publications)

            # Calculate keyword overlap score
            matched_keywords = self._extract_matched_keywords(
                request.research_interests,
                faculty_info.research_areas
            )

            # Calculate match score based on keyword overlap
            match_score = self._calculate_keyword_score(
                query_keywords,
                faculty_info.research_areas,
                matched_keywords
            )

            # Generate reasoning
            reasoning = self._generate_reasoning(
                request.research_interests,
                faculty_info,
                match_score / 100.0,
                mode=MatchingMode.KEYWORD
            )

            match = FacultyMatch(
                faculty=faculty_info,
                match_score=match_score,
                reasoning=reasoning,
                matched_keywords=matched_keywords,
                similarity_score=match_score / 100.0
            )
            matches.append(match)

        return matches

    async def _hybrid_matching(
        self,
        request: FacultyMatchRequest,
        filters: Dict[str, Any]
    ) -> List[FacultyMatch]:
        """
        Perform hybrid matching combining semantic and keyword approaches

        Args:
            request: FacultyMatchRequest
            filters: MongoDB filters

        Returns:
            List of FacultyMatch objects
        """
        # Perform both types of matching
        semantic_matches = await self._semantic_matching(request, filters)
        keyword_matches = await self._keyword_matching(request, filters)

        # Merge and re-rank
        merged_matches = self._merge_and_rerank(
            semantic_matches,
            keyword_matches,
            request.semantic_weight,
            request.keyword_weight
        )

        # Update reasoning for hybrid matches
        for match in merged_matches:
            match.reasoning = self._generate_reasoning(
                request.research_interests,
                match.faculty,
                match.similarity_score,
                mode=MatchingMode.HYBRID
            )

        # Sort and limit
        merged_matches.sort(key=lambda x: x.match_score, reverse=True)
        return merged_matches[:request.top_k * 10]

    def _merge_and_rerank(
        self,
        semantic_matches: List[FacultyMatch],
        keyword_matches: List[FacultyMatch],
        semantic_weight: float,
        keyword_weight: float
    ) -> List[FacultyMatch]:
        """
        Merge and re-rank results from different matching methods

        Args:
            semantic_matches: Semantic matching results
            keyword_matches: Keyword matching results
            semantic_weight: Weight for semantic scores
            keyword_weight: Weight for keyword scores

        Returns:
            Merged and re-ranked matches
        """
        # Create a map to combine scores
        faculty_map: Dict[str, Dict[str, Any]] = {}

        # Add semantic matches
        for match in semantic_matches:
            faculty_id = match.faculty.faculty_id
            faculty_map[faculty_id] = {
                "match": match,
                "semantic_score": match.match_score,
                "keyword_score": 0.0,
                "matched_keywords": set(match.matched_keywords)
            }

        # Add/update with keyword matches
        for match in keyword_matches:
            faculty_id = match.faculty.faculty_id
            if faculty_id in faculty_map:
                faculty_map[faculty_id]["keyword_score"] = match.match_score
                faculty_map[faculty_id]["matched_keywords"].update(match.matched_keywords)
            else:
                faculty_map[faculty_id] = {
                    "match": match,
                    "semantic_score": 0.0,
                    "keyword_score": match.match_score,
                    "matched_keywords": set(match.matched_keywords)
                }

        # Calculate combined scores
        merged_matches = []
        for faculty_id, data in faculty_map.items():
            combined_score = (
                semantic_weight * data["semantic_score"] +
                keyword_weight * data["keyword_score"]
            )

            match = data["match"]
            match.match_score = combined_score
            match.similarity_score = combined_score / 100.0
            match.matched_keywords = list(data["matched_keywords"])
            merged_matches.append(match)

        return merged_matches

    def _group_by_university(self, matches: List[FacultyMatch]) -> List[UniversityMatches]:
        """
        Group faculty matches by university

        Args:
            matches: List of faculty matches

        Returns:
            List of UniversityMatches
        """
        university_map: Dict[str, List[FacultyMatch]] = defaultdict(list)

        for match in matches:
            university_map[match.faculty.university].append(match)

        # Create UniversityMatches objects
        university_matches = []
        for university, faculty_matches in university_map.items():
            # Sort matches by score
            faculty_matches.sort(key=lambda x: x.match_score, reverse=True)

            # Calculate statistics
            avg_score = sum(m.match_score for m in faculty_matches) / len(faculty_matches)
            departments = list(set(m.faculty.department for m in faculty_matches))

            university_match = UniversityMatches(
                university=university,
                total_matches=len(faculty_matches),
                faculty_matches=faculty_matches,
                avg_match_score=avg_score,
                departments=departments
            )
            university_matches.append(university_match)

        # Sort universities by average match score
        university_matches.sort(key=lambda x: x.avg_match_score, reverse=True)

        return university_matches

    async def _get_faculty_info(
        self,
        faculty_id: str,
        include_publications: bool = True
    ) -> Optional[FacultyInfo]:
        """
        Get faculty information from database

        Args:
            faculty_id: Faculty identifier
            include_publications: Whether to include publications

        Returns:
            FacultyInfo object or None
        """
        faculty_doc = await self.faculty_collection.find_one({"faculty_id": faculty_id})

        if not faculty_doc:
            return None

        return self._doc_to_faculty_info(faculty_doc, include_publications)

    def _doc_to_faculty_info(
        self,
        doc: Dict[str, Any],
        include_publications: bool = True
    ) -> FacultyInfo:
        """
        Convert MongoDB document to FacultyInfo

        Args:
            doc: MongoDB document
            include_publications: Whether to include publications

        Returns:
            FacultyInfo object
        """
        publications = doc.get("publications", []) if include_publications else []

        # Limit publications to recent ones
        if len(publications) > 5:
            publications = publications[:5]

        return FacultyInfo(
            faculty_id=doc["faculty_id"],
            name=doc["name"],
            email=doc.get("email"),
            university=doc["university"],
            department=doc["department"],
            title=doc.get("title"),
            research_areas=doc.get("research_areas", []),
            lab_name=doc.get("lab_name"),
            lab_website=doc.get("lab_website"),
            personal_website=doc.get("personal_website"),
            accepting_students=FacultyStatus(doc.get("accepting_students", "unknown")),
            publications=publications,
            h_index=doc.get("h_index"),
            citations=doc.get("citations"),
            funding=doc.get("funding"),
            metadata=doc.get("metadata", {})
        )

    def _generate_reasoning(
        self,
        query: str,
        faculty: FacultyInfo,
        similarity: float,
        mode: MatchingMode
    ) -> str:
        """
        Generate reasoning for why faculty matches

        Args:
            query: Student research interests
            faculty: Faculty information
            similarity: Similarity score
            mode: Matching mode used

        Returns:
            Reasoning string
        """
        reasoning_parts = []

        # Base match quality
        if similarity >= 0.8:
            reasoning_parts.append("Excellent match")
        elif similarity >= 0.6:
            reasoning_parts.append("Strong match")
        elif similarity >= 0.4:
            reasoning_parts.append("Good match")
        else:
            reasoning_parts.append("Potential match")

        # Research areas overlap
        if faculty.research_areas:
            research_areas_str = ", ".join(faculty.research_areas[:3])
            reasoning_parts.append(f"based on research in {research_areas_str}")

        # Mode-specific reasoning
        if mode == MatchingMode.SEMANTIC:
            reasoning_parts.append("through semantic similarity analysis")
        elif mode == MatchingMode.KEYWORD:
            reasoning_parts.append("through keyword matching")
        else:
            reasoning_parts.append("through hybrid analysis")

        # Additional context
        if faculty.lab_name:
            reasoning_parts.append(f"at {faculty.lab_name}")

        if faculty.accepting_students == FacultyStatus.ACCEPTING:
            reasoning_parts.append("(actively accepting students)")

        return " ".join(reasoning_parts) + "."

    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extract keywords from text

        Args:
            text: Input text

        Returns:
            List of keywords
        """
        # Simple keyword extraction (can be enhanced with NLP)
        stopwords = {
            "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
            "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
            "to", "was", "will", "with", "i", "am", "interested", "research"
        }

        words = text.lower().split()
        keywords = [w.strip(".,;:!?()[]{}") for w in words if len(w) > 3]
        keywords = [k for k in keywords if k not in stopwords]

        return keywords

    def _extract_matched_keywords(
        self,
        query: str,
        research_areas: List[str]
    ) -> List[str]:
        """
        Extract keywords that match between query and research areas

        Args:
            query: Query text
            research_areas: Faculty research areas

        Returns:
            List of matched keywords
        """
        query_keywords = set(self._extract_keywords(query))
        research_keywords = set()

        for area in research_areas:
            research_keywords.update(self._extract_keywords(area))

        matched = query_keywords.intersection(research_keywords)
        return list(matched)

    def _calculate_keyword_score(
        self,
        query_keywords: List[str],
        research_areas: List[str],
        matched_keywords: List[str]
    ) -> float:
        """
        Calculate keyword-based match score

        Args:
            query_keywords: Keywords from query
            research_areas: Faculty research areas
            matched_keywords: Matched keywords

        Returns:
            Score from 0-100
        """
        if not query_keywords or not research_areas:
            return 0.0

        # Calculate overlap ratio
        overlap_ratio = len(matched_keywords) / len(query_keywords)

        # Boost score if many research areas match
        research_keyword_count = sum(
            len(self._extract_keywords(area)) for area in research_areas
        )
        coverage_boost = min(len(matched_keywords) / max(research_keyword_count, 1), 0.3)

        # Combine scores
        base_score = overlap_ratio * 70  # Max 70 from overlap
        final_score = min(base_score + (coverage_boost * 30), 100)

        return final_score

    @staticmethod
    def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors

        Args:
            vec1: First vector
            vec2: Second vector

        Returns:
            Similarity score (0-1)
        """
        v1 = np.array(vec1)
        v2 = np.array(vec2)

        dot_product = np.dot(v1, v2)
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = dot_product / (norm1 * norm2)
        return max(0.0, min(1.0, similarity))  # Clamp to [0, 1]

    async def add_faculty(
        self,
        faculty: FacultyInfo,
        generate_embedding: bool = True
    ) -> str:
        """
        Add a faculty member to the database

        Args:
            faculty: FacultyInfo object
            generate_embedding: Whether to generate embedding

        Returns:
            Faculty ID
        """
        # Convert to dict
        faculty_doc = faculty.model_dump()

        # Insert or update faculty profile
        await self.faculty_collection.update_one(
            {"faculty_id": faculty.faculty_id},
            {"$set": faculty_doc},
            upsert=True
        )

        # Generate and store embedding if requested
        if generate_embedding:
            await self._generate_faculty_embedding(faculty)

        logger.info(f"Added faculty: {faculty.name} ({faculty.faculty_id})")
        return faculty.faculty_id

    async def _generate_faculty_embedding(self, faculty: FacultyInfo):
        """
        Generate and store embedding for faculty research profile

        Args:
            faculty: FacultyInfo object
        """
        # Combine research areas and publications for embedding
        text_parts = []

        if faculty.research_areas:
            text_parts.append("Research areas: " + ", ".join(faculty.research_areas))

        if faculty.publications:
            text_parts.append("Publications: " + " ".join(faculty.publications[:3]))

        if faculty.lab_name:
            text_parts.append(f"Lab: {faculty.lab_name}")

        text = ". ".join(text_parts)

        # Generate embedding
        embedding = await self.embedding_service.generate_query_embedding(
            text,
            provider="openai"
        )

        # Store embedding
        await self.faculty_embeddings_collection.update_one(
            {"faculty_id": faculty.faculty_id},
            {
                "$set": {
                    "faculty_id": faculty.faculty_id,
                    "university": faculty.university,
                    "department": faculty.department,
                    "accepting_students": faculty.accepting_students.value,
                    "embedding": embedding,
                    "embedding_text": text
                }
            },
            upsert=True
        )

    async def bulk_add_faculty(
        self,
        faculty_list: List[FacultyInfo],
        generate_embeddings: bool = True
    ) -> int:
        """
        Add multiple faculty members in bulk

        Args:
            faculty_list: List of FacultyInfo objects
            generate_embeddings: Whether to generate embeddings

        Returns:
            Number of faculty added
        """
        count = 0
        for faculty in faculty_list:
            try:
                await self.add_faculty(faculty, generate_embeddings)
                count += 1
            except Exception as e:
                logger.error(f"Error adding faculty {faculty.name}: {e}")

        logger.info(f"Bulk added {count}/{len(faculty_list)} faculty members")
        return count

    async def create_indexes(self):
        """Create necessary database indexes for performance"""
        logger.info("Creating faculty indexes")

        # Faculty profiles indexes
        await self.faculty_collection.create_index("faculty_id", unique=True)
        await self.faculty_collection.create_index("university")
        await self.faculty_collection.create_index("department")
        await self.faculty_collection.create_index("accepting_students")
        await self.faculty_collection.create_index([("university", 1), ("department", 1)])

        # Text search index
        await self.faculty_collection.create_index([
            ("name", "text"),
            ("research_areas", "text"),
            ("lab_name", "text"),
            ("publications", "text")
        ])

        # Faculty embeddings indexes
        await self.faculty_embeddings_collection.create_index("faculty_id", unique=True)
        await self.faculty_embeddings_collection.create_index("university")
        await self.faculty_embeddings_collection.create_index("department")
        await self.faculty_embeddings_collection.create_index("accepting_students")

        logger.info("Faculty indexes created successfully")


# Global instance
faculty_matching_service = FacultyMatchingService()
