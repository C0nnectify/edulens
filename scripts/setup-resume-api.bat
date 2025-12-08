@echo off
REM Resume Builder API Setup Script for Windows
REM This script installs dependencies and sets up the Resume Builder API

echo.
echo ================================
echo Resume Builder API Setup
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js detected: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm detected: %NPM_VERSION%
echo.

REM Install dependencies
echo Installing required dependencies...
echo.

call npm install mongoose zod

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

echo [OK] Dependencies installed successfully
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo [WARNING] .env.local not found. Creating from template...
    (
        echo # MongoDB Connection
        echo MONGODB_URI=mongodb://localhost:27017/edulens
        echo.
        echo # Better Auth ^(should already be configured^)
        echo BETTER_AUTH_SECRET=your-secret-key-here
        echo BETTER_AUTH_URL=http://localhost:3000
        echo.
        echo # Optional: AI Integration ^(uncomment when ready^)
        echo # OPENAI_API_KEY=your-openai-key
        echo # ANTHROPIC_API_KEY=your-anthropic-key
    ) > .env.local

    echo [OK] Created .env.local
    echo [WARNING] Please update the values in .env.local
) else (
    echo [OK] .env.local already exists
)

echo.

REM Check if MongoDB is running
echo Checking MongoDB...
where mongod >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MongoDB not detected locally
    echo    You can either:
    echo    1. Install MongoDB locally
    echo    2. Use MongoDB Atlas (cloud)
    echo    3. Update MONGODB_URI in .env.local
) else (
    echo [OK] MongoDB is installed
)

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next Steps:
echo ===========
echo.
echo 1. Configure MongoDB:
echo    - Start MongoDB: net start MongoDB
echo    - Or update MONGODB_URI in .env.local for cloud MongoDB
echo.
echo 2. Update .env.local:
echo    - Set MONGODB_URI to your MongoDB connection string
echo    - Set BETTER_AUTH_SECRET to a secure random string
echo.
echo 3. Start the development server:
echo    npm run dev
echo.
echo 4. Test the API:
echo    curl http://localhost:3000/api/resume/templates
echo.
echo Documentation:
echo    - API Docs: src\app\api\resume\README.md
echo    - Setup Guide: RESUME_API_SETUP.md
echo    - Summary: RESUME_API_SUMMARY.md
echo.
echo Happy coding!
echo.
pause
