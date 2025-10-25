@echo off
echo 🔄 Starting complete database copy from PostgreSQL 18 to Docker PostgreSQL 15...

echo.
echo Step 1: Starting Docker containers...
docker-compose -f docker-compose.simple.yml up -d postgres redis

echo.
echo Step 2: Waiting for PostgreSQL to be ready...
timeout /t 10

echo.
echo Step 3: Creating temporary PostgreSQL 18 container for export...
docker run --name temp_pg18 --rm -d ^
  -e POSTGRES_PASSWORD=temppass ^
  -p 5434:5432 ^
  postgres:18

echo.
echo Step 4: Waiting for temporary container...
timeout /t 15

echo.
echo Step 5: Using pg_dump from PostgreSQL 18 container...
docker exec temp_pg18 pg_dump ^
  -h host.docker.internal ^
  -p 5433 ^
  -U postgres ^
  -d codnite_db ^
  --verbose ^
  --no-owner ^
  --no-privileges ^
  --clean ^
  --if-exists > backup_from_5433.sql

echo.
echo Step 6: Stopping temporary container...
docker stop temp_pg18

echo.
echo Step 7: Importing into Docker PostgreSQL 15...
docker exec -i codnite_db psql -U postgres -d codnite_db < backup_from_5433.sql

echo.
echo ✅ Database copy completed!
echo.
echo Step 8: Starting all containers...
docker-compose -f docker-compose.simple.yml up -d

pause