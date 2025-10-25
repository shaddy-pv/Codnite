@echo off
echo ========================================
echo CSS Debugging for Codnite
echo ========================================

echo.
echo Step 1: Checking if CSS files exist in dist...
if exist "dist\assets\*.css" (
    echo ✓ CSS files found in dist/assets:
    dir "dist\assets\*.css" /b
) else (
    echo ✗ No CSS files found in dist/assets
)

echo.
echo Step 2: Checking built HTML file...
if exist "dist\index.html" (
    echo ✓ Built HTML file exists
    echo CSS references in HTML:
    findstr /i "\.css" "dist\index.html"
) else (
    echo ✗ Built HTML file not found
)

echo.
echo Step 3: Testing CSS file accessibility...
echo Checking if CSS files are accessible via HTTP...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost/assets/index-JCCXblbK.css' -Method Head; Write-Host '✓ Main CSS accessible - Status:' $response.StatusCode } catch { Write-Host '✗ Main CSS not accessible -' $_.Exception.Message }"

echo.
echo Step 4: Checking container status...
docker-compose -f docker-compose.simple.yml ps

echo.
echo Step 5: Checking frontend container logs for CSS errors...
echo Recent frontend logs:
docker logs codnite_frontend --tail 20 | findstr /i "css\|error\|404"

echo.
echo Step 6: Testing Tailwind CSS compilation...
echo Checking if Tailwind classes are present in CSS...
if exist "dist\assets\index-JCCXblbK.css" (
    findstr /i "tailwind\|tw-" "dist\assets\index-JCCXblbK.css" > nul
    if %errorlevel% == 0 (
        echo ✓ Tailwind CSS classes found in compiled CSS
    ) else (
        echo ✗ Tailwind CSS classes not found - compilation issue
    )
) else (
    echo ✗ Main CSS file not found
)

echo.
echo ========================================
echo CSS Debug Complete!
echo ========================================
pause