"""Firecrawl MCP tools for web scraping and research"""

from typing import Dict, Any, List, Optional
from app.tools.base_tool import BaseTool, ToolResult
from firecrawl import FirecrawlApp
import os
import logging

logger = logging.getLogger(__name__)


class FirecrawlScrapeTool(BaseTool):
    """Scrape content from a single URL using Firecrawl"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(
            name="firecrawl_scrape",
            description="Scrape content from a single URL. Use for university pages, program details, or any web page."
        )
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        self.client = FirecrawlApp(api_key=self.api_key) if self.api_key else None
        self.category = "research"

    def _get_parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to scrape"
                },
                "formats": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Output formats (markdown, html, links, etc.)",
                    "default": ["markdown"]
                },
                "only_main_content": {
                    "type": "boolean",
                    "description": "Extract only main content, excluding nav/footer",
                    "default": True
                }
            },
            "required": ["url"]
        }

    async def execute(
        self,
        url: str,
        formats: List[str] = None,
        only_main_content: bool = True,
        **kwargs
    ) -> ToolResult:
        """Execute web scraping on a single URL"""
        if not self.client:
            return ToolResult(
                success=False,
                error="Firecrawl API key not configured"
            )

        try:
            formats = formats or ["markdown"]

            result = self.client.scrape_url(
                url=url,
                params={
                    'formats': formats,
                    'onlyMainContent': only_main_content
                }
            )

            return ToolResult(
                success=True,
                data={
                    "url": url,
                    "content": result.get("markdown", result.get("html", "")),
                    "metadata": result.get("metadata", {}),
                    "links": result.get("links", [])
                },
                metadata={"scraped_url": url}
            )

        except Exception as e:
            return await self._handle_error(e)


class FirecrawlBatchScrapeTool(BaseTool):
    """Batch scrape multiple URLs in parallel"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(
            name="firecrawl_batch_scrape",
            description="Scrape multiple URLs in parallel. Efficient for comparing universities or programs."
        )
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        self.client = FirecrawlApp(api_key=self.api_key) if self.api_key else None
        self.category = "research"

    def _get_parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "urls": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of URLs to scrape"
                },
                "formats": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Output formats",
                    "default": ["markdown"]
                }
            },
            "required": ["urls"]
        }

    async def execute(
        self,
        urls: List[str],
        formats: List[str] = None,
        **kwargs
    ) -> ToolResult:
        """Execute batch scraping"""
        if not self.client:
            return ToolResult(
                success=False,
                error="Firecrawl API key not configured"
            )

        try:
            formats = formats or ["markdown"]

            # Firecrawl handles batch scraping
            results = []
            for url in urls:
                result = self.client.scrape_url(
                    url=url,
                    params={'formats': formats, 'onlyMainContent': True}
                )
                results.append({
                    "url": url,
                    "content": result.get("markdown", ""),
                    "metadata": result.get("metadata", {})
                })

            return ToolResult(
                success=True,
                data={"results": results, "total_scraped": len(results)},
                metadata={"urls_count": len(urls)}
            )

        except Exception as e:
            return await self._handle_error(e)


class FirecrawlCrawlTool(BaseTool):
    """Crawl entire website or section"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(
            name="firecrawl_crawl",
            description="Crawl an entire website or section. Use for comprehensive university website exploration."
        )
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        self.client = FirecrawlApp(api_key=self.api_key) if self.api_key else None
        self.category = "research"

    def _get_parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "Starting URL for crawl"
                },
                "max_pages": {
                    "type": "integer",
                    "description": "Maximum pages to crawl",
                    "default": 10
                },
                "include_patterns": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "URL patterns to include"
                },
                "exclude_patterns": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "URL patterns to exclude"
                }
            },
            "required": ["url"]
        }

    async def execute(
        self,
        url: str,
        max_pages: int = 10,
        include_patterns: List[str] = None,
        exclude_patterns: List[str] = None,
        **kwargs
    ) -> ToolResult:
        """Execute website crawling"""
        if not self.client:
            return ToolResult(
                success=False,
                error="Firecrawl API key not configured"
            )

        try:
            crawl_params = {
                'limit': max_pages,
                'scrapeOptions': {'formats': ['markdown']}
            }

            if include_patterns:
                crawl_params['includePaths'] = include_patterns
            if exclude_patterns:
                crawl_params['excludePaths'] = exclude_patterns

            result = self.client.crawl_url(url, params=crawl_params, wait_until_done=True)

            pages = result.get("data", [])

            return ToolResult(
                success=True,
                data={
                    "pages": pages,
                    "total_pages": len(pages),
                    "base_url": url
                },
                metadata={"crawled_pages": len(pages)}
            )

        except Exception as e:
            return await self._handle_error(e)


class FirecrawlSearchTool(BaseTool):
    """Web search with content extraction"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(
            name="firecrawl_search",
            description="Search the web and extract content from results. Perfect for finding universities, programs, scholarships."
        )
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        self.client = FirecrawlApp(api_key=self.api_key) if self.api_key else None
        self.category = "research"

    def _get_parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query"
                },
                "limit": {
                    "type": "integer",
                    "description": "Number of results",
                    "default": 5
                },
                "scrape_results": {
                    "type": "boolean",
                    "description": "Whether to scrape content from results",
                    "default": True
                }
            },
            "required": ["query"]
        }

    async def execute(
        self,
        query: str,
        limit: int = 5,
        scrape_results: bool = True,
        **kwargs
    ) -> ToolResult:
        """Execute web search"""
        if not self.client:
            return ToolResult(
                success=False,
                error="Firecrawl API key not configured"
            )

        try:
            result = self.client.search(
                query=query,
                params={'limit': limit, 'scrapeOptions': {'formats': ['markdown']}}
            )

            return ToolResult(
                success=True,
                data={
                    "query": query,
                    "results": result.get("data", []),
                    "total_results": len(result.get("data", []))
                },
                metadata={"search_query": query}
            )

        except Exception as e:
            return await self._handle_error(e)


class FirecrawlExtractTool(BaseTool):
    """Extract structured data from URLs using AI"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(
            name="firecrawl_extract",
            description="Extract structured data (deadlines, fees, requirements) from web pages using AI."
        )
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        self.client = FirecrawlApp(api_key=self.api_key) if self.api_key else None
        self.category = "research"

    def _get_parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "urls": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "URLs to extract from"
                },
                "schema": {
                    "type": "object",
                    "description": "JSON schema for extraction"
                },
                "prompt": {
                    "type": "string",
                    "description": "Additional extraction instructions"
                }
            },
            "required": ["urls", "schema"]
        }

    async def execute(
        self,
        urls: List[str],
        schema: Dict[str, Any],
        prompt: Optional[str] = None,
        **kwargs
    ) -> ToolResult:
        """Execute structured extraction"""
        if not self.client:
            return ToolResult(
                success=False,
                error="Firecrawl API key not configured"
            )

        try:
            extract_params = {'schema': schema}
            if prompt:
                extract_params['prompt'] = prompt

            result = self.client.extract(urls=urls, params=extract_params)

            return ToolResult(
                success=True,
                data={
                    "extracted_data": result.get("data", []),
                    "total_extracted": len(result.get("data", []))
                },
                metadata={"urls_count": len(urls)}
            )

        except Exception as e:
            return await self._handle_error(e)
