"""
Initialize MongoDB with SOP templates

This script loads all template definitions and inserts them into MongoDB.
Run this script to populate the database with the template library.

Usage:
    python scripts/init_sop_templates.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.data.sop_templates_data import get_all_templates
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_templates():
    """Initialize SOP templates in MongoDB"""

    logger.info("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    collection = db["sop_templates"]

    try:
        # Get all template definitions
        templates = get_all_templates()
        logger.info(f"Loaded {len(templates)} template definitions")

        # Check if templates already exist
        existing_count = await collection.count_documents({})
        if existing_count > 0:
            logger.warning(f"Found {existing_count} existing templates")
            response = input("Do you want to replace all templates? (yes/no): ")
            if response.lower() != 'yes':
                logger.info("Aborted. No changes made.")
                return

            # Delete existing templates
            delete_result = await collection.delete_many({})
            logger.info(f"Deleted {delete_result.deleted_count} existing templates")

        # Insert templates
        logger.info("Inserting templates...")
        template_dicts = [template.model_dump() for template in templates]
        result = await collection.insert_many(template_dicts)
        logger.info(f"Successfully inserted {len(result.inserted_ids)} templates")

        # Create indexes
        logger.info("Creating indexes...")
        await collection.create_index([("id", 1)], unique=True)
        await collection.create_index([("category.degree", 1)])
        await collection.create_index([("category.field", 1)])
        await collection.create_index([("category.purpose", 1)])
        await collection.create_index([("tags", 1)])
        await collection.create_index([("usage_count", -1)])
        await collection.create_index([("success_rate", -1)])
        await collection.create_index([
            ("title", "text"),
            ("description", "text"),
            ("target_audience", "text")
        ])
        logger.info("Indexes created successfully")

        # Print summary
        logger.info("\n=== Template Library Summary ===")

        # Count by degree
        pipeline = [
            {"$group": {"_id": "$category.degree", "count": {"$sum": 1}}}
        ]
        degree_counts = await collection.aggregate(pipeline).to_list(None)
        logger.info("\nBy Degree:")
        for item in sorted(degree_counts, key=lambda x: x["count"], reverse=True):
            logger.info(f"  {item['_id']}: {item['count']}")

        # Count by field
        pipeline = [
            {"$group": {"_id": "$category.field", "count": {"$sum": 1}}}
        ]
        field_counts = await collection.aggregate(pipeline).to_list(None)
        logger.info("\nBy Field:")
        for item in sorted(field_counts, key=lambda x: x["count"], reverse=True):
            logger.info(f"  {item['_id']}: {item['count']}")

        # Count by purpose
        pipeline = [
            {"$group": {"_id": "$category.purpose", "count": {"$sum": 1}}}
        ]
        purpose_counts = await collection.aggregate(pipeline).to_list(None)
        logger.info("\nBy Purpose:")
        for item in sorted(purpose_counts, key=lambda x: x["count"], reverse=True):
            logger.info(f"  {item['_id']}: {item['count']}")

        logger.info("\n=== Initialization Complete ===")
        logger.info(f"Total templates: {len(templates)}")
        logger.info(f"Database: {settings.mongodb_db_name}")
        logger.info(f"Collection: sop_templates")

    except Exception as e:
        logger.error(f"Error initializing templates: {e}")
        raise
    finally:
        client.close()


async def list_templates():
    """List all templates in database"""

    logger.info("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    collection = db["sop_templates"]

    try:
        templates = await collection.find({}, {
            "id": 1,
            "title": 1,
            "category": 1,
            "usage_count": 1,
            "success_rate": 1
        }).to_list(None)

        logger.info(f"\n=== Templates in Database ({len(templates)}) ===\n")

        for template in templates:
            category = template.get("category", {})
            logger.info(
                f"ID: {template['id']}\n"
                f"  Title: {template['title']}\n"
                f"  Degree: {category.get('degree', 'N/A')}\n"
                f"  Field: {category.get('field', 'N/A')}\n"
                f"  Purpose: {category.get('purpose', 'N/A')}\n"
                f"  Usage: {template.get('usage_count', 0)}\n"
                f"  Success Rate: {template.get('success_rate', 'N/A')}\n"
            )

    except Exception as e:
        logger.error(f"Error listing templates: {e}")
        raise
    finally:
        client.close()


async def delete_all_templates():
    """Delete all templates from database"""

    logger.info("Connecting to MongoDB...")
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    collection = db["sop_templates"]

    try:
        count = await collection.count_documents({})
        logger.warning(f"Found {count} templates")

        if count == 0:
            logger.info("No templates to delete")
            return

        response = input(f"Are you sure you want to delete all {count} templates? (yes/no): ")
        if response.lower() != 'yes':
            logger.info("Aborted. No changes made.")
            return

        result = await collection.delete_many({})
        logger.info(f"Deleted {result.deleted_count} templates")

    except Exception as e:
        logger.error(f"Error deleting templates: {e}")
        raise
    finally:
        client.close()


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python scripts/init_sop_templates.py init    - Initialize/reload templates")
        print("  python scripts/init_sop_templates.py list    - List all templates")
        print("  python scripts/init_sop_templates.py delete  - Delete all templates")
        sys.exit(1)

    command = sys.argv[1]

    if command == "init":
        asyncio.run(init_templates())
    elif command == "list":
        asyncio.run(list_templates())
    elif command == "delete":
        asyncio.run(delete_all_templates())
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
