#!/bin/bash
# Setup script for Reddit Admission Results Scraper

set -e

echo "========================================="
echo "Reddit Scraper Setup"
echo "========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Edit reddit_config.json with your API credentials"
echo "2. Ensure MongoDB is running"
echo "3. Run the scraper:"
echo "   python reddit_scraper.py --subreddit gradadmissions --limit 100"
echo ""
echo "For detailed instructions, see README_REDDIT_SCRAPER.md"
echo ""
