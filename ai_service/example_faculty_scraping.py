"""
Example script demonstrating faculty scraping service usage

This script shows how to:
1. Initialize the faculty scraping service
2. Scrape faculty from a university department
3. Search for faculty by research area
4. Query and analyze faculty data
"""

import asyncio
from app.services.faculty_scraping_service import faculty_scraping_service
from app.utils.logger import logger


async def example_single_scrape():
    """Example: Scrape a single university department"""
    logger.info("=" * 60)
    logger.info("Example 1: Single Department Scrape")
    logger.info("=" * 60)

    try:
        # Initialize service
        await faculty_scraping_service.initialize()

        # Scrape Stanford CS department
        result = await faculty_scraping_service.scrape_and_extract_faculty(
            url="https://cs.stanford.edu/people/faculty",
            university_id="stanford",
            university_name="Stanford University",
            department="Computer Science",
            use_crawl=False,
            max_pages=20
        )

        # Print results
        logger.info(f"Successfully scraped {result['totalFaculty']} faculty members")
        logger.info(f"URLs scraped: {', '.join(result['urlsScraped'])}")

        # Show first few faculty
        for i, faculty in enumerate(result['faculty'][:3], 1):
            logger.info(f"\nFaculty {i}:")
            logger.info(f"  Name: {faculty.get('name')}")
            logger.info(f"  Title: {faculty.get('title')}")
            logger.info(f"  Email: {faculty.get('email')}")
            logger.info(f"  Research: {', '.join(faculty.get('researchAreas', []))}")

        # Save to database
        document_id = await faculty_scraping_service.save_faculty_data(result)
        logger.info(f"\nSaved to database with ID: {document_id}")

        return result

    except Exception as e:
        logger.error(f"Error in single scrape: {e}")
        raise


async def example_batch_scrape():
    """Example: Batch scrape multiple universities"""
    logger.info("\n" + "=" * 60)
    logger.info("Example 2: Batch Scrape Multiple Universities")
    logger.info("=" * 60)

    try:
        # Initialize service
        if not faculty_scraping_service.db:
            await faculty_scraping_service.initialize()

        # Define universities to scrape
        universities = [
            {
                "url": "https://cs.stanford.edu/people",
                "universityId": "stanford",
                "universityName": "Stanford University",
                "department": "Computer Science"
            },
            {
                "url": "https://www.csail.mit.edu/people",
                "universityId": "mit",
                "universityName": "MIT",
                "department": "Computer Science"
            },
            {
                "url": "https://cs.berkeley.edu/people/faculty",
                "universityId": "berkeley",
                "universityName": "UC Berkeley",
                "department": "Computer Science"
            }
        ]

        results = []
        for uni in universities:
            try:
                logger.info(f"\nScraping {uni['universityName']}...")

                result = await faculty_scraping_service.scrape_and_extract_faculty(
                    url=uni["url"],
                    university_id=uni["universityId"],
                    university_name=uni["universityName"],
                    department=uni["department"],
                    use_crawl=False
                )

                # Save to database
                await faculty_scraping_service.save_faculty_data(result)

                results.append({
                    "university": uni["universityName"],
                    "faculty_count": result["totalFaculty"]
                })

                logger.info(f"✓ {uni['universityName']}: {result['totalFaculty']} faculty")

            except Exception as e:
                logger.error(f"✗ {uni['universityName']}: {e}")

        # Summary
        logger.info("\nBatch Scrape Summary:")
        logger.info("-" * 40)
        total = sum(r["faculty_count"] for r in results)
        for r in results:
            logger.info(f"{r['university']}: {r['faculty_count']} faculty")
        logger.info(f"Total: {total} faculty across {len(results)} universities")

        return results

    except Exception as e:
        logger.error(f"Error in batch scrape: {e}")
        raise


async def example_search_by_research_area():
    """Example: Search faculty by research area"""
    logger.info("\n" + "=" * 60)
    logger.info("Example 3: Search Faculty by Research Area")
    logger.info("=" * 60)

    try:
        # Initialize service
        if not faculty_scraping_service.db:
            await faculty_scraping_service.initialize()

        # Search for Machine Learning faculty
        research_area = "Machine Learning"
        results = await faculty_scraping_service.search_faculty_by_research_area(
            research_area=research_area,
            limit=50
        )

        logger.info(f"Found {len(results)} faculty working in {research_area}")

        # Group by university
        universities = {}
        for result in results:
            uni = result["university"]
            if uni not in universities:
                universities[uni] = []
            universities[uni].append(result["faculty"])

        # Print summary
        logger.info(f"\nFaculty Distribution:")
        logger.info("-" * 40)
        for uni, faculty_list in sorted(
            universities.items(),
            key=lambda x: len(x[1]),
            reverse=True
        ):
            logger.info(f"{uni}: {len(faculty_list)} faculty")

        # Show some examples
        logger.info(f"\nExample Faculty in {research_area}:")
        logger.info("-" * 40)
        for i, result in enumerate(results[:5], 1):
            faculty = result["faculty"]
            logger.info(f"\n{i}. {faculty.get('name')}")
            logger.info(f"   {result['university']} - {result['department']}")
            logger.info(f"   Research: {', '.join(faculty.get('researchAreas', []))}")
            if faculty.get('email'):
                logger.info(f"   Email: {faculty.get('email')}")

        return results

    except Exception as e:
        logger.error(f"Error in search: {e}")
        raise


async def example_query_faculty_data():
    """Example: Query faculty data for a university"""
    logger.info("\n" + "=" * 60)
    logger.info("Example 4: Query Faculty Data")
    logger.info("=" * 60)

    try:
        # Initialize service
        if not faculty_scraping_service.db:
            await faculty_scraping_service.initialize()

        # Query Stanford CS faculty
        faculty_data = await faculty_scraping_service.get_faculty_data(
            university_id="stanford",
            department="Computer Science"
        )

        if not faculty_data:
            logger.warning("No faculty data found for Stanford CS")
            return None

        logger.info(f"Retrieved {len(faculty_data)} department records")

        # Analyze data
        for record in faculty_data:
            logger.info(f"\nUniversity: {record['universityName']}")
            logger.info(f"Department: {record['department']}")
            logger.info(f"Total Faculty: {record['totalFaculty']}")
            logger.info(f"Scraped At: {record['scrapedAt']}")
            logger.info(f"Source: {record['sourceUrl']}")

            # Research area distribution
            research_areas = {}
            for faculty in record['faculty']:
                for area in faculty.get('researchAreas', []):
                    research_areas[area] = research_areas.get(area, 0) + 1

            logger.info("\nTop Research Areas:")
            logger.info("-" * 40)
            for area, count in sorted(
                research_areas.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]:
                logger.info(f"  {area}: {count} faculty")

        return faculty_data

    except Exception as e:
        logger.error(f"Error in query: {e}")
        raise


async def example_get_statistics():
    """Example: Get database statistics"""
    logger.info("\n" + "=" * 60)
    logger.info("Example 5: Database Statistics")
    logger.info("=" * 60)

    try:
        # Initialize service
        if not faculty_scraping_service.db:
            await faculty_scraping_service.initialize()

        # Get statistics
        stats = await faculty_scraping_service.get_statistics()

        logger.info(f"Total Universities: {stats['totalUniversities']}")
        logger.info(f"Total Faculty: {stats['totalFaculty']}")

        logger.info("\nTop Research Areas:")
        logger.info("-" * 40)
        for i, area in enumerate(stats['topResearchAreas'][:15], 1):
            logger.info(f"{i:2d}. {area['area']:<35} {area['count']:>4} faculty")

        logger.info(f"\nStatistics generated at: {stats['generatedAt']}")

        return stats

    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise


async def main():
    """Run all examples"""
    logger.info("\n" + "=" * 60)
    logger.info("Faculty Scraping Service - Examples")
    logger.info("=" * 60)

    try:
        # Example 1: Single scrape
        # Uncomment to run:
        # await example_single_scrape()

        # Example 2: Batch scrape
        # WARNING: This will make multiple API calls
        # Uncomment to run:
        # await example_batch_scrape()

        # Example 3: Search by research area
        # (requires data to be scraped first)
        # await example_search_by_research_area()

        # Example 4: Query faculty data
        # (requires data to be scraped first)
        # await example_query_faculty_data()

        # Example 5: Get statistics
        # (requires data to be scraped first)
        await example_get_statistics()

        logger.info("\n" + "=" * 60)
        logger.info("All examples completed successfully!")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Error running examples: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
