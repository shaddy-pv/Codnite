@echo off
REM Health Check Script for Codnite Docker Services

echo 🏥 Checking Codnite Service Health...
echo.

REM Check Docker containers status
echo [INFO] Docker Container Status:
docker-compose -f docker-compose.simple.yml ps
echo.

REM Check individual service health
echo [INFO] Service Health Checks:

REM Check database
echo Checking Database...
docker-compose -f docker-compose.simple.yml exec -T postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database: HEALTHY
) else (
    echo ❌ Database: UNHEALTHY
)

REM Check Redis
echo Checking Redis...
docker-compose -f docker-compose.simple.yml exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis: HEALTHY
) else (
    echo ❌ Redis: UNHEALTHY
)

REM Check Backend API
echo Checking Backend API...
curl -f http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API: HEALTHY
) else (
    echo ❌ Backend API: UNHEALTHY
)

REM Check Frontend
echo Checking Frontend...
curl -f http://localhost/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend: HEALTHY
) else (
    echo ❌ Frontend: UNHEALTHY
)

echo.
echo [INFO] Health check completed!
echo.
pause