@echo off
REM Codnite Production Deployment Script for Windows
REM This script handles the complete production deployment process

echo 🚀 Starting Codnite Production Deployment...

REM Check if .env.production exists
if not exist ".env.production" (
    echo [ERROR] .env.production file not found. Please create it first.
    exit /b 1
)

REM Step 1: Environment Setup
echo [INFO] Setting up production environment...
copy .env.production .env
echo [SUCCESS] Environment file configured

REM Step 2: Install Dependencies
echo [INFO] Installing production dependencies...
npm ci --only=production
echo [SUCCESS] Dependencies installed

REM Step 3: Build Application
echo [INFO] Building application for production...
npm run build:prod
echo [SUCCESS] Application built successfully

REM Step 4: Database Migration
echo [INFO] Running database migrations...
npm run migrate:up
echo [SUCCESS] Database migrations completed

REM Step 5: Health Check
echo [INFO] Performing health check...
curl -f http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Health check passed
) else (
    echo [WARNING] Health check failed - server may not be running
)

REM Step 6: Security Check
echo [INFO] Performing security checks...
findstr /C:"development-jwt-secret" .env >nul
if %errorlevel% equ 0 (
    echo [ERROR] JWT secret is still using development value!
    exit /b 1
)

findstr /C:"RATE_LIMIT_MAX_REQUESTS=1000" .env >nul
if %errorlevel% equ 0 (
    echo [WARNING] Rate limiting is set to development values
)

echo [SUCCESS] Security checks completed

REM Step 7: Start Production Server
echo [INFO] Starting production server...
start /B node backend/dist/server.js > logs/app.log 2>&1
echo [SUCCESS] Server started in background

REM Step 8: Final Verification
echo [INFO] Performing final verification...
timeout /t 5 /nobreak >nul

curl -f http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] ✅ Production deployment completed successfully!
    echo [INFO] Application is running at: http://localhost:3000
    echo [INFO] Health check: http://localhost:3000/api/health
) else (
    echo [ERROR] ❌ Deployment verification failed
    echo [INFO] Check logs for errors: type logs\app.log
    exit /b 1
)

echo.
echo [SUCCESS] 🎉 Codnite is now running in production mode!
echo [INFO] Next steps:
echo [INFO] 1. Set up reverse proxy (Nginx)
echo [INFO] 2. Configure SSL certificates
echo [INFO] 3. Set up monitoring and logging
echo [INFO] 4. Configure automated backups
echo.

