"""
GradCafe Collection System - Demo Script

Demonstrates usage of the GradCafe collection API with practical examples.
"""

import asyncio
import httpx
from datetime import datetime
from typing import Dict, Any

BASE_URL = "http://localhost:8000"


class GradCafeCollectionDemo:
    """Demo client for GradCafe collection API"""

    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=300.0)

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    async def trigger_collection(
        self,
        programs: list[str],
        universities: list[str] | None = None,
        limit_per_program: int = 50,
        strategy: str = "recent_decisions",
    ) -> Dict[str, Any]:
        """
        Trigger a new collection job

        Args:
            programs: List of programs to scrape
            universities: Optional list of universities
            limit_per_program: Max results per program
            strategy: Scraping strategy

        Returns:
            Job information
        """
        url = f"{self.base_url}/api/v1/gradcafe/trigger"
        data = {
            "programs": programs,
            "universities": universities,
            "limit_per_program": limit_per_program,
            "strategy": strategy,
            "run_async": True,
        }

        response = await self.client.post(url, json=data)
        response.raise_for_status()
        return response.json()

    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get collection job status

        Args:
            job_id: Collection job ID

        Returns:
            Job status and progress
        """
        url = f"{self.base_url}/api/v1/gradcafe/status/{job_id}"
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json()

    async def get_statistics(self) -> Dict[str, Any]:
        """
        Get overall collection statistics

        Returns:
            Comprehensive statistics
        """
        url = f"{self.base_url}/api/v1/gradcafe/statistics"
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json()

    async def get_recent_data(
        self,
        page: int = 1,
        page_size: int = 100,
        university: str | None = None,
        min_completeness: float | None = None,
    ) -> Dict[str, Any]:
        """
        Get recent collected data

        Args:
            page: Page number
            page_size: Results per page
            university: Filter by university
            min_completeness: Minimum completeness score

        Returns:
            Paginated data
        """
        url = f"{self.base_url}/api/v1/gradcafe/data/recent"
        params = {"page": page, "page_size": page_size}

        if university:
            params["university"] = university
        if min_completeness is not None:
            params["min_completeness"] = min_completeness

        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()

    async def get_quality_stats(self) -> Dict[str, Any]:
        """
        Get data quality statistics

        Returns:
            Quality metrics and distribution
        """
        url = f"{self.base_url}/api/v1/gradcafe/stats/quality"
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json()

    async def export_data(
        self,
        format: str = "csv",
        filters: Dict[str, Any] | None = None,
        include_low_quality: bool = False,
    ) -> Dict[str, Any]:
        """
        Export collected data

        Args:
            format: Export format (json or csv)
            filters: Optional filters
            include_low_quality: Include low quality data

        Returns:
            Export file information
        """
        url = f"{self.base_url}/api/v1/gradcafe/export"
        data = {
            "format": format,
            "filters": filters or {},
            "include_low_quality": include_low_quality,
        }

        response = await self.client.post(url, json=data)
        response.raise_for_status()
        return response.json()


async def demo_basic_collection():
    """Demo: Basic collection workflow"""
    print("\n" + "=" * 60)
    print("DEMO 1: Basic Collection Workflow")
    print("=" * 60)

    client = GradCafeCollectionDemo()

    try:
        # 1. Trigger collection
        print("\n1. Triggering collection for Computer Science...")
        result = await client.trigger_collection(
            programs=["Computer Science"],
            universities=["MIT", "Stanford"],
            limit_per_program=10,
        )

        job_id = result["job_id"]
        print(f"   ✓ Job created: {job_id}")
        print(f"   ✓ Celery task: {result.get('celery_task_id', 'N/A')}")

        # 2. Check status
        print("\n2. Checking job status...")
        await asyncio.sleep(2)  # Wait a bit

        status = await client.get_job_status(job_id)
        print(f"   ✓ Status: {status['job']['status']}")
        print(f"   ✓ Progress: {status['job'].get('progress_percentage', 0)}%")

        print("\n   Job will continue running in background.")
        print(f"   Monitor at: {BASE_URL}/api/v1/gradcafe/status/{job_id}")

    finally:
        await client.close()


async def demo_view_statistics():
    """Demo: View collection statistics"""
    print("\n" + "=" * 60)
    print("DEMO 2: View Collection Statistics")
    print("=" * 60)

    client = GradCafeCollectionDemo()

    try:
        # Get overall statistics
        print("\n1. Overall Collection Statistics:")
        stats = await client.get_statistics()

        print(f"   Total Records: {stats['total_records']}")
        print(f"   Average Completeness: {stats['average_completeness']}")
        print(f"   High Quality Records: {stats['high_quality_records']}")

        print("\n2. Records by Decision:")
        for decision, count in stats["records_by_decision"].items():
            print(f"   {decision}: {count}")

        print("\n3. Collection Rate:")
        rate = stats["collection_rate"]
        print(f"   Last 7 days: {rate['last_7_days']} records")
        print(f"   Last 30 days: {rate['last_30_days']} records")
        print(f"   Daily average: {rate['daily_average']} records/day")

        # Get quality statistics
        print("\n4. Data Quality Distribution:")
        quality = await client.get_quality_stats()

        dist = quality["completeness_distribution"]
        print(f"   Low (0-0.3): {dist.get('low (0-0.3)', 0)}")
        print(f"   Medium (0.3-0.6): {dist.get('medium (0.3-0.6)', 0)}")
        print(f"   High (0.6-0.9): {dist.get('high (0.6-0.9)', 0)}")
        print(f"   Excellent (0.9-1.0): {dist.get('excellent (0.9-1.0)', 0)}")

    finally:
        await client.close()


async def demo_query_data():
    """Demo: Query collected data"""
    print("\n" + "=" * 60)
    print("DEMO 3: Query Collected Data")
    print("=" * 60)

    client = GradCafeCollectionDemo()

    try:
        # Query high-quality data from MIT
        print("\n1. Querying high-quality data from MIT...")
        result = await client.get_recent_data(
            page=1, page_size=5, university="MIT", min_completeness=0.7
        )

        print(f"   Total matching records: {result['total_count']}")
        print(f"   Showing {len(result['data_points'])} results:")

        for i, data_point in enumerate(result["data_points"], 1):
            print(f"\n   Record {i}:")
            print(f"   - University: {data_point['university']}")
            print(f"   - Program: {data_point['program']}")
            print(f"   - Decision: {data_point['decision']}")
            print(f"   - Season: {data_point['season']}")

            profile = data_point["profile"]
            if profile.get("gpa"):
                print(f"   - GPA: {profile['gpa']}")
            if profile.get("gre_verbal") and profile.get("gre_quant"):
                print(
                    f"   - GRE: V{profile['gre_verbal']} Q{profile['gre_quant']}"
                )
            if profile.get("toefl"):
                print(f"   - TOEFL: {profile['toefl']}")

            print(f"   - Completeness: {data_point['completeness_score']:.2f}")

        # Query all accepted applications
        print("\n2. Querying accepted applications (all universities)...")
        result = await client.get_recent_data(page=1, page_size=10)

        accepted = [dp for dp in result["data_points"] if dp["decision"] == "Accepted"]
        print(f"   Found {len(accepted)} accepted applications in recent data")

    finally:
        await client.close()


async def demo_export_data():
    """Demo: Export collected data"""
    print("\n" + "=" * 60)
    print("DEMO 4: Export Collected Data")
    print("=" * 60)

    client = GradCafeCollectionDemo()

    try:
        # Export accepted applications to CSV
        print("\n1. Exporting accepted applications to CSV...")
        result = await client.export_data(
            format="csv",
            filters={"decision": "Accepted"},
            include_low_quality=False,
        )

        print(f"   ✓ Exported {result['records_exported']} records")
        print(f"   ✓ Filename: {result['filename']}")
        print(f"   ✓ Location: {result['filepath']}")

        # Export high-quality data to JSON
        print("\n2. Exporting all data to JSON...")
        result = await client.export_data(format="json", include_low_quality=True)

        print(f"   ✓ Exported {result['records_exported']} records")
        print(f"   ✓ Filename: {result['filename']}")
        print(f"   ✓ Location: {result['filepath']}")

    finally:
        await client.close()


async def demo_advanced_collection():
    """Demo: Advanced collection scenarios"""
    print("\n" + "=" * 60)
    print("DEMO 5: Advanced Collection Scenarios")
    print("=" * 60)

    client = GradCafeCollectionDemo()

    try:
        # Scenario 1: Multiple programs, top universities
        print("\n1. Collecting data for multiple CS-related programs...")
        result = await client.trigger_collection(
            programs=[
                "Computer Science",
                "Data Science",
                "Artificial Intelligence",
                "Machine Learning",
            ],
            limit_per_program=25,
            strategy="top_universities",
        )

        print(f"   ✓ Job created: {result['job_id']}")
        print("   ✓ Strategy: Top Universities")
        print("   ✓ Programs: 4 CS-related programs")
        print("   ✓ Expected records: ~100 (25 per program)")

        # Scenario 2: Comprehensive MBA collection
        print("\n2. Collecting MBA data (comprehensive)...")
        result = await client.trigger_collection(
            programs=["MBA", "Business Administration", "Finance", "Marketing"],
            limit_per_program=50,
            strategy="comprehensive",
        )

        print(f"   ✓ Job created: {result['job_id']}")
        print("   ✓ Strategy: Comprehensive")
        print("   ✓ Programs: 4 business programs")
        print("   ✓ Expected records: ~200 (50 per program)")

    finally:
        await client.close()


async def main():
    """Run all demos"""
    print("\n" + "=" * 60)
    print("GradCafe Collection System - Demo Script")
    print("=" * 60)
    print(f"\nBase URL: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Check if service is running
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health", timeout=5.0)
            response.raise_for_status()
        print("✓ Service is running")
    except Exception as e:
        print(f"✗ Service not available: {e}")
        print("\nPlease start the service first:")
        print("  cd ai_service")
        print("  uvicorn main:app --reload --port 8000")
        return

    try:
        # Run demos
        await demo_basic_collection()
        await asyncio.sleep(1)

        await demo_view_statistics()
        await asyncio.sleep(1)

        await demo_query_data()
        await asyncio.sleep(1)

        await demo_export_data()
        await asyncio.sleep(1)

        await demo_advanced_collection()

        print("\n" + "=" * 60)
        print("All demos completed!")
        print("=" * 60)

        print("\nNext Steps:")
        print("1. Check API documentation: http://localhost:8000/docs")
        print("2. Monitor jobs: http://localhost:8000/api/v1/gradcafe/history")
        print("3. View statistics: http://localhost:8000/api/v1/gradcafe/statistics")
        print("4. Read full docs: ai_service/GRADCAFE_COLLECTION_README.md")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
