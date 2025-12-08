#!/bin/bash

# GradCafe Scraper Setup Script
# Automates installation and configuration

set -e

echo "=========================================="
echo "GradCafe Scraper Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
REQUIRED_VERSION="3.9"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    print_status "Python $PYTHON_VERSION found"
else
    print_error "Python 3.9+ required. Found $PYTHON_VERSION"
    exit 1
fi

# Check if pip is installed
echo ""
echo "Checking pip..."
if command -v pip3 &> /dev/null; then
    print_status "pip3 found"
else
    print_error "pip3 not found. Please install pip3"
    exit 1
fi

# Install Python dependencies
echo ""
echo "Installing Python dependencies..."
pip3 install playwright beautifulsoup4 pymongo click rich lxml python-dateutil --quiet

if [ $? -eq 0 ]; then
    print_status "Python packages installed"
else
    print_error "Failed to install Python packages"
    exit 1
fi

# Install Playwright browsers
echo ""
echo "Installing Playwright browsers (this may take a few minutes)..."
playwright install chromium

if [ $? -eq 0 ]; then
    print_status "Playwright chromium installed"
else
    print_error "Failed to install Playwright browsers"
    exit 1
fi

# Check MongoDB
echo ""
echo "Checking MongoDB..."
if command -v mongod &> /dev/null; then
    print_status "MongoDB found"
elif docker ps &> /dev/null && docker ps | grep -q mongo; then
    print_status "MongoDB Docker container running"
else
    print_warning "MongoDB not found or not running"
    echo ""
    echo "To start MongoDB:"
    echo "  Option 1 (Docker): docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo "  Option 2 (Local):  sudo systemctl start mongod"
    echo ""
fi

# Create directories
echo ""
echo "Creating directories..."
mkdir -p data/gradcafe
mkdir -p logs
mkdir -p checkpoints

print_status "Directories created"

# Make scripts executable
echo ""
echo "Setting permissions..."
chmod +x gradcafe_scraper.py
chmod +x test_gradcafe_scraper.py

print_status "Permissions set"

# Run tests
echo ""
echo "Running tests..."
echo ""
python3 test_gradcafe_scraper.py

if [ $? -eq 0 ]; then
    print_status "All tests passed!"
else
    print_error "Some tests failed. Check output above."
    exit 1
fi

# Print success message
echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Ensure MongoDB is running"
echo "  2. Run a test scrape:"
echo "     python3 gradcafe_scraper.py scrape -p \"Computer Science\" --years 2024"
echo ""
echo "  3. View statistics:"
echo "     python3 gradcafe_scraper.py stats"
echo ""
echo "  4. Export data:"
echo "     python3 gradcafe_scraper.py export -o results.json"
echo ""
echo "For more information, see:"
echo "  - README_GRADCAFE_SCRAPER.md (full documentation)"
echo "  - QUICK_START_GRADCAFE.md (quick start guide)"
echo ""
