@echo off

echo ========================================
echo Codnite Docker Status Check
echo ========================================

echo.
echo Container Status:
docker-compose -f docker-compose.simple.yml ps

echo.
echo ========================================
echo API Health Check:
curl -s http://localhost/api/health | findstr "status"

echo.
echo ========================================
echo Frontend Access Test:
curl -s -I http://localhost | findstr "HTTP"

echo.
echo ========================================
echo Backend Logs (last 10 lines):
docker logs codnite_backend --tail 10

echo.
echo ========================================
echo Redis Status:
docker logs codnite_redis --tail 5

echo.
echo ========================================
echo Nginx Proxy Logs (last 5 lines):
docker logs codnite_proxy --tail 5

echo.
echo ========================================
echo Done! Your application should be running at:
echo http://localhost
echo.
pause