@echo off
echo Testing Codnite Docker Setup...
echo.

echo Step 1: Building and starting all containers...
docker-compose -f docker-compose.simple.yml up -d --build

echo.
echo Step 2: Waiting for containers to start...
timeout /t 30 /nobreak

echo.
echo Step 3: Checking container status...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo Step 4: Testing health endpoints...
echo Testing proxy health...
curl -f http://localhost/health
echo.
echo Testing backend health...
curl -f http://localhost/api/health
echo.
echo Testing code-execution health...
curl -f http://localhost:5001/health

echo.
echo Step 5: Checking logs for any errors...
echo Backend logs:
docker logs codnite_backend --tail 10
echo.
echo Code-execution logs:
docker logs codnite_execution --tail 10

echo.
echo Docker setup test complete!
pause