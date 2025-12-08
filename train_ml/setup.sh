#!/bin/bash
# Setup script for Data Collection Orchestrator

set -e  # Exit on error

echo "================================================"
echo "Data Collection Orchestrator Setup"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python 3 is installed
echo -e "${YELLOW}[1/6] Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3.9 or higher.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"

# Create virtual environment
echo -e "\n${YELLOW}[2/6] Creating virtual environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo -e "\n${YELLOW}[3/6] Upgrading pip...${NC}"
pip install --upgrade pip > /dev/null 2>&1
echo -e "${GREEN}✓ pip upgraded${NC}"

# Install dependencies
echo -e "\n${YELLOW}[4/6] Installing dependencies...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create directory structure
echo -e "\n${YELLOW}[5/6] Creating directory structure...${NC}"
mkdir -p data/raw
mkdir -p data/clean
mkdir -p data/aggregated
mkdir -p data/ml_ready
mkdir -p data/visualizations
mkdir -p logs
echo -e "${GREEN}✓ Directories created${NC}"

# Create .env file if it doesn't exist
echo -e "\n${YELLOW}[6/6] Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=edulens

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# API Keys
FIRECRAWL_API_KEY=your_firecrawl_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Email Configuration (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Reddit API (Optional)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=EduLen Scraper v1.0

# Environment
ENVIRONMENT=development
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please edit .env file with your API keys${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Check if MongoDB is running
echo -e "\n${YELLOW}Checking MongoDB connection...${NC}"
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MongoDB is running${NC}"
    else
        echo -e "${RED}✗ MongoDB is not running${NC}"
        echo -e "${YELLOW}  Start MongoDB with: sudo systemctl start mongod${NC}"
    fi
else
    echo -e "${YELLOW}⚠ mongosh not found. Please install MongoDB${NC}"
fi

# Check if Redis is running
echo -e "\n${YELLOW}Checking Redis connection...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${RED}✗ Redis is not running${NC}"
        echo -e "${YELLOW}  Start Redis with: sudo systemctl start redis${NC}"
    fi
else
    echo -e "${YELLOW}⚠ redis-cli not found. Please install Redis${NC}"
fi

# Print next steps
echo ""
echo "================================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file with your API keys:"
echo "   nano .env"
echo ""
echo "2. Edit config.yaml to configure universities:"
echo "   nano config.yaml"
echo ""
echo "3. Activate virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "4. Run the orchestrator:"
echo "   python run_scraping.py --all"
echo ""
echo "5. Or start the scheduler:"
echo "   python scraping_scheduler.py worker    # Terminal 1"
echo "   python scraping_scheduler.py beat      # Terminal 2"
echo "   python scraping_scheduler.py dashboard # Terminal 3"
echo ""
echo "For more information, see README_ORCHESTRATOR.md"
echo ""
