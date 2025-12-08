#!/bin/bash

# Resume Builder API Setup Script
# This script installs dependencies and sets up the Resume Builder API

echo "🚀 Resume Builder API Setup"
echo "============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js detected: $NODE_VERSION${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm detected: $NPM_VERSION${NC}"
echo ""

# Install dependencies
echo "📦 Installing required dependencies..."
echo ""

npm install mongoose zod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"

    cat > .env.local << EOF
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/edulens

# Better Auth (should already be configured)
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Optional: AI Integration (uncomment when ready)
# OPENAI_API_KEY=your-openai-key
# ANTHROPIC_API_KEY=your-anthropic-key
EOF

    echo -e "${GREEN}✅ Created .env.local${NC}"
    echo -e "${YELLOW}⚠️  Please update the values in .env.local${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

echo ""

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✅ MongoDB is installed${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB not detected locally${NC}"
    echo -e "${YELLOW}   You can either:${NC}"
    echo -e "${YELLOW}   1. Install MongoDB locally${NC}"
    echo -e "${YELLOW}   2. Use MongoDB Atlas (cloud)${NC}"
    echo -e "${YELLOW}   3. Update MONGODB_URI in .env.local${NC}"
fi

echo ""

# Print next steps
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Configure MongoDB:"
echo "   - Ensure MongoDB is running: mongod"
echo "   - Or update MONGODB_URI in .env.local for cloud MongoDB"
echo ""
echo "2. Update .env.local:"
echo "   - Set MONGODB_URI to your MongoDB connection string"
echo "   - Set BETTER_AUTH_SECRET to a secure random string"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:3000/api/resume/templates"
echo ""
echo "📚 Documentation:"
echo "   - API Docs: src/app/api/resume/README.md"
echo "   - Setup Guide: RESUME_API_SETUP.md"
echo "   - Summary: RESUME_API_SUMMARY.md"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
