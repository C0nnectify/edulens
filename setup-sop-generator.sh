#!/bin/bash
# SOP Generator - Quick Setup Script

set -e

echo "========================================="
echo "SOP Generator - Quick Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing Frontend Dependencies..."
echo ""

# Install TipTap packages
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-heading @tiptap/extension-paragraph @tiptap/extension-text
elif command -v npm &> /dev/null; then
    echo "Using npm..."
    npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-heading @tiptap/extension-paragraph @tiptap/extension-text
else
    echo "Error: npm or pnpm not found. Please install Node.js"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

# Setup backend
echo "🐍 Setting up Backend..."
echo ""

cd ai_service/app/SOP_Generator

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}! Virtual environment already exists${NC}"
fi

echo ""
echo "Activating virtual environment and installing dependencies..."
source venv/bin/activate

pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

# Return to root
cd ../../..

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local..."
    cat > .env.local << EOF
# SOP Generator API URL
NEXT_PUBLIC_SOP_API_URL=http://localhost:8001
EOF
    echo -e "${GREEN}✓ .env.local created${NC}"
else
    echo -e "${YELLOW}! .env.local already exists${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Start the backend:"
echo "   cd ai_service/app/SOP_Generator"
echo "   source venv/bin/activate"
echo "   uvicorn main:app --reload --port 8001"
echo ""
echo "2. Start the frontend (in a new terminal):"
echo "   npm run dev"
echo "   # or: pnpm dev"
echo ""
echo "3. Open your browser:"
echo "   http://localhost:3000/dashboard/document-builder/sop-generator"
echo ""
echo "Optional: Set environment variables for real APIs:"
echo "   export GEMINI_API_KEY=your_key"
echo "   export USE_MOCK_LLM=false"
echo ""
echo "========================================="
