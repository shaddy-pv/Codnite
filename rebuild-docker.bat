@echo off
echo 🔄 Rebuilding Docker containers with latest code...

echo [INFO] Stopping containers...
docker-compose -f docker-compose.simple.yml down

echo [INFO] Removing old images...
docker-compose -f docker-compose.simple.yml build --no-cache

echo [INFO] Starting containers...
docker-compose -f docker-compose.simple.yml up -d

echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

echo [INFO] Checking container status...
docker-compose -f docker-compose.simple.yml ps

echo [SUCCESS] Rebuild completed!
echo Visit http://localhost to test the application
pause