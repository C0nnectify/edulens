@echo off
REM SOP Generator - Quick Setup Script for Windows

echo =========================================
echo SOP Generator - Quick Setup
echo =========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: Please run this script from the project root directory
    exit /b 1
)

echo Installing Frontend Dependencies...
echo.

REM Install TipTap packages
where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using pnpm...
    call pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-heading @tiptap/extension-paragraph @tiptap/extension-text
) else (
    where npm >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Using npm...
        call npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-heading @tiptap/extension-paragraph @tiptap/extension-text
    ) else (
        echo Error: npm or pnpm not found. Please install Node.js
        exit /b 1
    )
)

echo.
echo [92m✓ Frontend dependencies installed[0m
echo.

REM Setup backend
echo Setting up Backend...
echo.

cd ai_service\app\SOP_Generator

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo [92m✓ Virtual environment created[0m
) else (
    echo [93m! Virtual environment already exists[0m
)

echo.
echo Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat

python -m pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt

echo [92m✓ Backend dependencies installed[0m
echo.

REM Return to root
cd ..\..\..

REM Create .env.local if it doesn't exist
if not exist ".env.local" (
    echo Creating .env.local...
    (
        echo # SOP Generator API URL
        echo NEXT_PUBLIC_SOP_API_URL=http://localhost:8001
    ) > .env.local
    echo [92m✓ .env.local created[0m
) else (
    echo [93m! .env.local already exists[0m
)

echo.
echo =========================================
echo [92mSetup Complete![0m
echo =========================================
echo.
echo Next Steps:
echo.
echo 1. Start the backend:
echo    cd ai_service\app\SOP_Generator
echo    venv\Scripts\activate
echo    uvicorn main:app --reload --port 8001
echo.
echo 2. Start the frontend (in a new terminal):
echo    npm run dev
echo    REM or: pnpm dev
echo.
echo 3. Open your browser:
echo    http://localhost:3000/dashboard/document-builder/sop-generator
echo.
echo Optional: Set environment variables for real APIs:
echo    set GEMINI_API_KEY=your_key
echo    set USE_MOCK_LLM=false
echo.
echo =========================================

pause
