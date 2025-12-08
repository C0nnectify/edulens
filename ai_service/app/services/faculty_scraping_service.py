"""
Faculty research scraping service using Firecrawl and Google Gemini AI

This service scrapes university department websites to extract faculty information
including research areas, publications, contact details, and more. It uses Firecrawl
for web scraping and Google Gemini for intelligent data extraction.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import hashlib
import re
import asyncio
from firecrawl import FirecrawlApp
from google import generativeai as genai
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.utils.logger import logger
from app.database.mongodb import get_database


class FacultyScrapingService:
    """
    Service for scraping and extracting faculty research data from university websites.

    Features:
    - Scrape department faculty pages using Firecrawl
    - Extract structured faculty data using Google Gemini AI
    - Categorize research areas with NLP
    - Store in MongoDB with proper schema
    - Handle rate limits and retries
    - Support multiple department structures
    """

    def __init__(
        self,
        firecrawl_api_key: Optional[str] = None,
        google_api_key: Optional[str] = None
    ):
        """
        Initialize the faculty scraping service.

        Args:
            firecrawl_api_key: Firecrawl API key (defaults to FIRECRAWL_API_KEY env var)
            google_api_key: Google Gemini API key (defaults to GOOGLE_API_KEY env var)
        """
        # Initialize Firecrawl client
        self.firecrawl_api_key = firecrawl_api_key or settings.firecrawl_api_key
        if not self.firecrawl_api_key:
            logger.warning("Firecrawl API key not configured")
        self.firecrawl_client = FirecrawlApp(api_key=self.firecrawl_api_key) if self.firecrawl_api_key else None

        # Initialize Google Gemini
        self.google_api_key = google_api_key or settings.google_api_key
        if not self.google_api_key:
            logger.warning("Google API key not configured")
        if self.google_api_key:
            genai.configure(api_key=self.google_api_key)
            self.gemini_model = genai.GenerativeModel(settings.google_model)
        else:
            self.gemini_model = None

        # MongoDB database
        self.db: Optional[AsyncIOMotorDatabase] = None

        # Rate limiting configuration
        self.max_retries = 3
        self.retry_delay = 2  # seconds
        self.request_delay = 1  # seconds between requests

        logger.info("Faculty scraping service initialized")

    async def initialize(self) -> None:
        """Initialize database connection"""
        self.db = get_database()
        await self._ensure_indexes()
        logger.info("Faculty scraping service database initialized")

    async def _ensure_indexes(self) -> None:
        """Create necessary indexes for faculty database collection"""
        if not self.db:
            return

        collection = self.db["faculty_database"]

        # Create indexes for efficient querying
        await collection.create_index("universityId")
        await collection.create_index("department")
        await collection.create_index([("universityId", 1), ("department", 1)], unique=True)
        await collection.create_index("scrapedAt")
        await collection.create_index("faculty.email")
        await collection.create_index("faculty.researchAreas")

        logger.info("Faculty database indexes created")

    async def scrape_faculty_page(
        self,
        url: str,
        formats: List[str] = None,
        include_links: bool = True
    ) -> Dict[str, Any]:
        """
        Scrape a faculty/people page using Firecrawl.

        Args:
            url: URL of the faculty/people page
            formats: Output formats (default: ["markdown", "links"])
            include_links: Whether to include extracted links

        Returns:
            Dict containing scraped content, metadata, and links

        Raises:
            Exception: If scraping fails after retries
        """
        if not self.firecrawl_client:
            raise ValueError("Firecrawl API key not configured. Please set FIRECRAWL_API_KEY environment variable.")

        formats = formats or ["markdown", "links"]

        for attempt in range(self.max_retries):
            try:
                logger.info(f"Scraping faculty page: {url} (attempt {attempt + 1})")

                result = self.firecrawl_client.scrape_url(
                    url=url,
                    params={
                        'formats': formats,
                        'onlyMainContent': True,
                        'includeTags': ['a', 'p', 'h1', 'h2', 'h3', 'div', 'span'],
                        'waitFor': 2000  # Wait for dynamic content
                    }
                )

                # Extract content
                content = result.get("markdown", result.get("html", ""))
                metadata = result.get("metadata", {})
                links = result.get("links", []) if include_links else []

                logger.info(f"Successfully scraped {url}")

                return {
                    "url": url,
                    "content": content,
                    "metadata": metadata,
                    "links": links,
                    "scraped_at": datetime.utcnow().isoformat()
                }

            except Exception as e:
                logger.warning(f"Scraping attempt {attempt + 1} failed for {url}: {e}")

                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
                else:
                    logger.error(f"Failed to scrape {url} after {self.max_retries} attempts")
                    raise

        raise Exception(f"Failed to scrape {url}")

    async def crawl_department_pages(
        self,
        base_url: str,
        max_pages: int = 20,
        include_patterns: Optional[List[str]] = None,
        exclude_patterns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Crawl entire department website for faculty information.

        Args:
            base_url: Starting URL (e.g., department homepage)
            max_pages: Maximum number of pages to crawl
            include_patterns: URL patterns to include (e.g., ["/faculty/", "/people/"])
            exclude_patterns: URL patterns to exclude

        Returns:
            Dict containing all crawled pages and metadata
        """
        # Default patterns for faculty pages
        if include_patterns is None:
            include_patterns = [
                "/faculty/",
                "/people/",
                "/staff/",
                "/team/",
                "/researchers/",
                "/professors/"
            ]

        # Default exclusions
        if exclude_patterns is None:
            exclude_patterns = [
                "/news/",
                "/events/",
                "/calendar/",
                "/courses/",
                "/admissions/"
            ]

        try:
            logger.info(f"Crawling department pages from: {base_url}")

            crawl_params = {
                'limit': max_pages,
                'scrapeOptions': {
                    'formats': ['markdown', 'links'],
                    'onlyMainContent': True
                },
                'includePaths': include_patterns,
                'excludePaths': exclude_patterns
            }

            result = self.firecrawl_client.crawl_url(
                base_url,
                params=crawl_params,
                wait_until_done=True
            )

            pages = result.get("data", [])

            logger.info(f"Successfully crawled {len(pages)} pages from {base_url}")

            return {
                "base_url": base_url,
                "total_pages": len(pages),
                "pages": pages,
                "crawled_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to crawl {base_url}: {e}")
            raise

    def _build_extraction_prompt(self, content: str, department: str) -> str:
        """
        Build a prompt for Gemini to extract structured faculty data.

        Args:
            content: Scraped content (markdown)
            department: Department name

        Returns:
            Structured prompt for LLM
        """
        prompt = f"""
You are an expert at extracting structured faculty information from university department websites.

Extract ALL faculty members from the following {department} department page content. For each faculty member, extract:

1. **name**: Full name (required)
2. **title**: Academic title/position (e.g., "Professor", "Associate Professor", "Assistant Professor")
3. **email**: Email address (if available)
4. **phone**: Phone number (if available)
5. **office**: Office location (if available)
6. **website**: Personal or lab website URL (if available)
7. **researchAreas**: List of research areas/interests (be specific)
8. **labName**: Laboratory or research group name (if mentioned)
9. **education**: Highest degree and institution (e.g., "Ph.D. in Computer Science, MIT")
10. **bio**: Brief biography or description (2-3 sentences max)
11. **publications**: List of recent key publications (if mentioned, max 3)

**IMPORTANT INSTRUCTIONS:**
- Extract information EXACTLY as it appears, don't invent data
- If a field is not available, use null
- For researchAreas, extract specific topics (e.g., "Machine Learning", "Natural Language Processing", not just "AI")
- Categorize research areas using standard academic terminology
- Include all faculty members, not just full professors
- Parse different page structures (grid, list, table)

Return the data as a valid JSON array of objects:

```json
[
  {{
    "name": "Dr. John Smith",
    "title": "Professor",
    "email": "jsmith@university.edu",
    "phone": "+1-555-0123",
    "office": "Room 301, CS Building",
    "website": "https://example.com/jsmith",
    "researchAreas": ["Machine Learning", "Computer Vision", "Deep Learning"],
    "labName": "Vision and Learning Lab",
    "education": "Ph.D. in Computer Science, Stanford University",
    "bio": "Dr. Smith's research focuses on computer vision and deep learning...",
    "publications": [
      "Paper title 1 (Conference 2023)",
      "Paper title 2 (Journal 2022)"
    ]
  }}
]
```

**Content to extract from:**

{content[:15000]}

Return ONLY the JSON array, no additional text or explanation.
"""
        return prompt

    async def extract_faculty_data(
        self,
        content: str,
        department: str,
        university_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Extract structured faculty data from scraped content using Gemini AI.

        Args:
            content: Scraped markdown content
            department: Department name (e.g., "Computer Science")
            university_name: University name (for context)

        Returns:
            List of faculty member dictionaries
        """
        if not self.gemini_model:
            raise ValueError("Google API key not configured. Please set GOOGLE_API_KEY environment variable.")

        try:
            logger.info(f"Extracting faculty data for {department} department")

            # Build extraction prompt
            prompt = self._build_extraction_prompt(content, department)

            # Generate with retry logic
            for attempt in range(self.max_retries):
                try:
                    response = self.gemini_model.generate_content(prompt)
                    response_text = response.text

                    # Extract JSON from response
                    faculty_data = self._parse_json_response(response_text)

                    # Validate and clean data
                    faculty_data = self._validate_faculty_data(faculty_data)

                    # Categorize research areas
                    for faculty in faculty_data:
                        faculty['researchAreas'] = self._categorize_research_areas(
                            faculty.get('researchAreas', [])
                        )

                    logger.info(f"Extracted {len(faculty_data)} faculty members")
                    return faculty_data

                except Exception as e:
                    logger.warning(f"Extraction attempt {attempt + 1} failed: {e}")
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(self.retry_delay)
                    else:
                        raise

        except Exception as e:
            logger.error(f"Failed to extract faculty data: {e}")
            return []

    def _parse_json_response(self, response_text: str) -> List[Dict[str, Any]]:
        """
        Parse JSON from LLM response, handling markdown code blocks.

        Args:
            response_text: Raw LLM response

        Returns:
            Parsed JSON data
        """
        import json

        # Remove markdown code blocks
        response_text = re.sub(r'```json\s*', '', response_text)
        response_text = re.sub(r'```\s*', '', response_text)
        response_text = response_text.strip()

        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Response text: {response_text[:500]}")
            return []

    def _validate_faculty_data(self, faculty_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Validate and clean extracted faculty data.

        Args:
            faculty_data: Raw faculty data

        Returns:
            Validated and cleaned faculty data
        """
        validated = []

        for faculty in faculty_data:
            # Ensure required field exists
            if not faculty.get('name'):
                continue

            # Clean and validate email
            if 'email' in faculty and faculty['email']:
                email = faculty['email'].lower().strip()
                if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                    faculty['email'] = None
                else:
                    faculty['email'] = email

            # Ensure researchAreas is a list
            if not isinstance(faculty.get('researchAreas'), list):
                faculty['researchAreas'] = []

            # Clean up strings
            for field in ['name', 'title', 'office', 'website', 'bio', 'education', 'labName']:
                if field in faculty and faculty[field]:
                    faculty[field] = str(faculty[field]).strip()

            validated.append(faculty)

        return validated

    def _categorize_research_areas(self, research_areas: List[str]) -> List[str]:
        """
        Categorize and normalize research areas using NLP.

        Args:
            research_areas: Raw research areas

        Returns:
            Categorized and normalized research areas
        """
        if not research_areas:
            return []

        # Mapping of common variations to standard terms
        standard_terms = {
            # Computer Science
            "ai": "Artificial Intelligence",
            "artificial intelligence": "Artificial Intelligence",
            "ml": "Machine Learning",
            "machine learning": "Machine Learning",
            "deep learning": "Deep Learning",
            "neural networks": "Neural Networks",
            "nlp": "Natural Language Processing",
            "natural language processing": "Natural Language Processing",
            "computer vision": "Computer Vision",
            "cv": "Computer Vision",
            "robotics": "Robotics",
            "data science": "Data Science",
            "big data": "Big Data",
            "cloud computing": "Cloud Computing",
            "cybersecurity": "Cybersecurity",
            "security": "Cybersecurity",
            "hci": "Human-Computer Interaction",
            "human computer interaction": "Human-Computer Interaction",
            "software engineering": "Software Engineering",
            "databases": "Database Systems",
            "database systems": "Database Systems",
            "networks": "Computer Networks",
            "computer networks": "Computer Networks",

            # Engineering
            "electrical engineering": "Electrical Engineering",
            "mechanical engineering": "Mechanical Engineering",
            "civil engineering": "Civil Engineering",
            "chemical engineering": "Chemical Engineering",
            "biomedical engineering": "Biomedical Engineering",

            # Biology & Medicine
            "bioinformatics": "Bioinformatics",
            "computational biology": "Computational Biology",
            "genomics": "Genomics",
            "genetics": "Genetics",
            "neuroscience": "Neuroscience",

            # Physics & Math
            "quantum computing": "Quantum Computing",
            "algorithms": "Algorithms",
            "optimization": "Optimization",
            "statistics": "Statistics",

            # Business
            "economics": "Economics",
            "finance": "Finance",
            "marketing": "Marketing",
            "management": "Management",
        }

        categorized = set()

        for area in research_areas:
            if not area:
                continue

            area_lower = area.lower().strip()

            # Check for standard term mapping
            if area_lower in standard_terms:
                categorized.add(standard_terms[area_lower])
            else:
                # Keep original if not in mapping (but capitalize properly)
                categorized.add(area.strip().title())

        return sorted(list(categorized))

    async def scrape_and_extract_faculty(
        self,
        url: str,
        university_id: str,
        university_name: str,
        department: str,
        use_crawl: bool = False,
        max_pages: int = 20
    ) -> Dict[str, Any]:
        """
        Complete pipeline: scrape faculty page(s) and extract structured data.

        Args:
            url: Faculty/people page URL
            university_id: Unique university identifier
            university_name: University name
            department: Department name
            use_crawl: Whether to crawl multiple pages (default: single page scrape)
            max_pages: Max pages to crawl if use_crawl=True

        Returns:
            Dict containing extracted faculty data and metadata
        """
        try:
            logger.info(f"Starting faculty scrape for {university_name} - {department}")

            # Step 1: Scrape content
            if use_crawl:
                crawl_result = await self.crawl_department_pages(
                    base_url=url,
                    max_pages=max_pages
                )

                # Combine content from all pages
                all_content = "\n\n---\n\n".join([
                    page.get("markdown", "") for page in crawl_result["pages"]
                ])

                urls_scraped = [page.get("url", url) for page in crawl_result["pages"]]

            else:
                scrape_result = await self.scrape_faculty_page(url)
                all_content = scrape_result["content"]
                urls_scraped = [url]

            # Step 2: Extract faculty data using Gemini
            faculty_data = await self.extract_faculty_data(
                content=all_content,
                department=department,
                university_name=university_name
            )

            # Step 3: Build result
            result = {
                "universityId": university_id,
                "universityName": university_name,
                "department": department,
                "sourceUrl": url,
                "urlsScraped": urls_scraped,
                "faculty": faculty_data,
                "totalFaculty": len(faculty_data),
                "scrapedAt": datetime.utcnow(),
                "metadata": {
                    "usedCrawl": use_crawl,
                    "pagesScraped": len(urls_scraped),
                    "extractionMethod": "gemini-1.5-flash"
                }
            }

            logger.info(
                f"Successfully extracted {len(faculty_data)} faculty members "
                f"from {university_name} - {department}"
            )

            return result

        except Exception as e:
            logger.error(f"Failed to scrape and extract faculty: {e}")
            raise

    async def save_faculty_data(
        self,
        faculty_data: Dict[str, Any],
        overwrite: bool = True
    ) -> str:
        """
        Save faculty data to MongoDB.

        Args:
            faculty_data: Faculty data from scrape_and_extract_faculty()
            overwrite: Whether to overwrite existing data (default: True)

        Returns:
            Document ID of saved record
        """
        if not self.db:
            await self.initialize()

        collection = self.db["faculty_database"]

        try:
            # Create unique identifier
            unique_key = {
                "universityId": faculty_data["universityId"],
                "department": faculty_data["department"]
            }

            # Add timestamps
            faculty_data["updatedAt"] = datetime.utcnow()
            if not overwrite:
                faculty_data["createdAt"] = datetime.utcnow()

            if overwrite:
                # Update or insert
                result = await collection.update_one(
                    unique_key,
                    {"$set": faculty_data},
                    upsert=True
                )

                doc_id = str(result.upserted_id) if result.upserted_id else "updated"
                logger.info(f"Saved faculty data for {faculty_data['universityName']} - {faculty_data['department']}")

            else:
                # Insert only if doesn't exist
                existing = await collection.find_one(unique_key)
                if existing:
                    logger.warning(f"Faculty data already exists for {unique_key}")
                    return str(existing["_id"])

                result = await collection.insert_one(faculty_data)
                doc_id = str(result.inserted_id)
                logger.info(f"Inserted new faculty data: {doc_id}")

            return doc_id

        except Exception as e:
            logger.error(f"Failed to save faculty data: {e}")
            raise

    async def get_faculty_data(
        self,
        university_id: str,
        department: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve faculty data from MongoDB.

        Args:
            university_id: University identifier
            department: Optional department filter

        Returns:
            List of faculty data documents
        """
        if not self.db:
            await self.initialize()

        collection = self.db["faculty_database"]

        query = {"universityId": university_id}
        if department:
            query["department"] = department

        try:
            cursor = collection.find(query).sort("scrapedAt", -1)
            results = await cursor.to_list(length=None)

            # Convert ObjectId to string
            for result in results:
                result["_id"] = str(result["_id"])

            logger.info(f"Retrieved {len(results)} faculty records")
            return results

        except Exception as e:
            logger.error(f"Failed to retrieve faculty data: {e}")
            raise

    async def search_faculty_by_research_area(
        self,
        research_area: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Search for faculty by research area across all universities.

        Args:
            research_area: Research area to search for
            limit: Maximum number of results

        Returns:
            List of matching faculty members with university context
        """
        if not self.db:
            await self.initialize()

        collection = self.db["faculty_database"]

        try:
            # Search in faculty.researchAreas array
            pipeline = [
                {
                    "$match": {
                        "faculty.researchAreas": {
                            "$regex": research_area,
                            "$options": "i"
                        }
                    }
                },
                {
                    "$unwind": "$faculty"
                },
                {
                    "$match": {
                        "faculty.researchAreas": {
                            "$regex": research_area,
                            "$options": "i"
                        }
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "university": "$universityName",
                        "department": "$department",
                        "faculty": "$faculty"
                    }
                },
                {
                    "$limit": limit
                }
            ]

            cursor = collection.aggregate(pipeline)
            results = await cursor.to_list(length=limit)

            logger.info(f"Found {len(results)} faculty members in {research_area}")
            return results

        except Exception as e:
            logger.error(f"Faculty search failed: {e}")
            raise

    async def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the faculty database.

        Returns:
            Dict containing database statistics
        """
        if not self.db:
            await self.initialize()

        collection = self.db["faculty_database"]

        try:
            total_universities = await collection.count_documents({})

            # Total faculty count
            pipeline = [
                {
                    "$project": {
                        "facultyCount": {"$size": "$faculty"}
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "totalFaculty": {"$sum": "$facultyCount"}
                    }
                }
            ]

            result = await collection.aggregate(pipeline).to_list(length=1)
            total_faculty = result[0]["totalFaculty"] if result else 0

            # Most common research areas
            research_areas_pipeline = [
                {"$unwind": "$faculty"},
                {"$unwind": "$faculty.researchAreas"},
                {
                    "$group": {
                        "_id": "$faculty.researchAreas",
                        "count": {"$sum": 1}
                    }
                },
                {"$sort": {"count": -1}},
                {"$limit": 20}
            ]

            top_areas = await collection.aggregate(research_areas_pipeline).to_list(length=20)

            return {
                "totalUniversities": total_universities,
                "totalFaculty": total_faculty,
                "topResearchAreas": [
                    {"area": item["_id"], "count": item["count"]}
                    for item in top_areas
                ],
                "generatedAt": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to generate statistics: {e}")
            raise


# Global service instance
faculty_scraping_service = FacultyScrapingService()
