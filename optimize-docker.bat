@echo off
echo 🚀 Optimizing Codnite Docker Setup...
echo.

echo Step 1: Cleaning up old containers and images...
docker-compose -f docker-compose.simple.yml down
docker system prune -f

echo.
echo Step 2: Building optimized images...
docker-compose -f docker-compose.simple.yml build --no-cache

echo.
echo Step 3: Starting all services...
docker-compose -f docker-compose.simple.yml up -d

echo.
echo Step 4: Waiting for services to be ready...
timeout /t 45 /nobreak

echo.
echo Step 5: Final verification...
echo Checking all containers:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo Testing all health endpoints:
echo [1/4] Proxy health...
curl -s http://localhost/health && echo " ✅ OK" || echo " ❌ FAILED"

echo [2/4] Backend health...  
curl -s http://localhost/api/health && echo " ✅ OK" || echo " ❌ FAILED"

echo [3/4] Code-execution health...
curl -s http://localhost:5001/health && echo " ✅ OK" || echo " ❌ FAILED"

echo [4/4] Frontend health...
curl -s http://localhost && echo " ✅ OK" || echo " ❌ FAILED"

echo.
echo 🎉 Optimization complete! All 6 containers should be running.
echo.
echo Access your application at: http://localhost
echo Backend API at: http://localhost/api
echo Code execution at: http://localhost/execute
echo.
pause