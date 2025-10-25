@echo off
echo ========================================
echo Codnite Deployment Verification
echo ========================================

echo.
echo Step 1: Checking Docker containers...
docker-compose -f docker-compose.simple.yml ps

echo.
echo Step 2: Testing main application...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost/' -Method Head; Write-Host '✓ Main app accessible - Status:' $response.StatusCode } catch { Write-Host '✗ Main app not accessible -' $_.Exception.Message }"

echo.
echo Step 3: Testing API health...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost/api/health' -Method Get; Write-Host '✓ API accessible - Status:' $response.StatusCode } catch { Write-Host '✗ API not accessible -' $_.Exception.Message }"

echo.
echo Step 4: Testing CSS files...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost/assets/style-C8k0FFGX.css' -Method Head; Write-Host '✓ CSS accessible - Status:' $response.StatusCode } catch { Write-Host '✗ CSS not accessible - trying alternative...' }"

echo.
echo Step 5: Checking database connection...
docker exec codnite_db psql -U postgres -d codnite_db -c "SELECT 'Database OK' as status;" 2>nul
if %errorlevel% == 0 (
    echo ✓ Database connection successful
) else (
    echo ✗ Database connection failed
)

echo.
echo Step 6: Checking Redis connection...
docker exec codnite_redis redis-cli -a myredispassword ping 2>nul
if %errorlevel% == 0 (
    echo ✓ Redis connection successful
) else (
    echo ✗ Redis connection failed
)

echo.
echo Step 7: Recent container logs...
echo.
echo Frontend logs:
docker logs codnite_frontend --tail 5 2>nul

echo.
echo Backend logs:
docker logs codnite_backend --tail 5 2>nul

echo.
echo ========================================
echo Verification Complete!
echo ========================================
echo.
echo If all checks passed, your application is ready at:
echo http://localhost
echo.
echo Useful commands:
echo   View logs: docker logs [container_name]
echo   Restart:   docker-compose -f docker-compose.simple.yml restart
echo   Stop:      docker-compose -f docker-compose.simple.yml down
echo   Rebuild:   .\rebuild-docker.bat
echo.
pause