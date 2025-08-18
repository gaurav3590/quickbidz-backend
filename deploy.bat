@echo off
REM QuickBidz Backend - Vercel Deployment Script (Windows)
REM This script automates the deployment process to Vercel

echo 🚀 Starting QuickBidz Backend deployment to Vercel...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI is not installed. Please install it first:
    echo npm install -g vercel
    pause
    exit /b 1
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Vercel. Please login first:
    echo vercel login
    pause
    exit /b 1
)

REM Check if .env file exists (for local testing)
if exist .env (
    echo ✅ Found .env file for local testing
) else (
    echo ⚠️  No .env file found. Make sure to set environment variables in Vercel dashboard.
)

REM Check if all required files exist
echo 📋 Checking required files...

if exist vercel.json (
    echo ✅ vercel.json exists
) else (
    echo ❌ vercel.json is missing
    pause
    exit /b 1
)

if exist .vercelignore (
    echo ✅ .vercelignore exists
) else (
    echo ❌ .vercelignore is missing
    pause
    exit /b 1
)

if exist package.json (
    echo ✅ package.json exists
) else (
    echo ❌ package.json is missing
    pause
    exit /b 1
)

if exist src\main.ts (
    echo ✅ src\main.ts exists
) else (
    echo ❌ src\main.ts is missing
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Run build test locally
echo 🔨 Testing build process...
call npm run vercel-build

if %errorlevel% equ 0 (
    echo ✅ Build test passed
) else (
    echo ❌ Build test failed. Please fix the issues before deploying.
    pause
    exit /b 1
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
echo Choose deployment option:
echo 1. Deploy to preview (recommended for testing)
echo 2. Deploy to production
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo 📤 Deploying to preview...
    call vercel
) else if "%choice%"=="2" (
    echo 📤 Deploying to production...
    call vercel --prod
) else (
    echo ❌ Invalid choice. Exiting.
    pause
    exit /b 1
)

if %errorlevel% equ 0 (
    echo ✅ Deployment completed successfully!
    echo.
    echo 🔗 Your API endpoints are now available at:
    echo    - API Base: https://your-project.vercel.app
    echo    - Health Check: https://your-project.vercel.app/health
    echo    - API Docs: https://your-project.vercel.app/api/docs
    echo.
    echo 📝 Next steps:
    echo 1. Set up environment variables in Vercel dashboard
    echo 2. Configure your database connection
    echo 3. Update your frontend to use the new API URL
    echo 4. Test all endpoints
) else (
    echo ❌ Deployment failed. Please check the error messages above.
    pause
    exit /b 1
)

pause 