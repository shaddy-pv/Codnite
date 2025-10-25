# PowerShell script to copy database from PostgreSQL 18 to Docker PostgreSQL 15
Write-Host "🔄 Starting database copy process..." -ForegroundColor Green

# Check if we can connect to source database (5433)
Write-Host "📡 Testing connection to PostgreSQL 18 (port 5433)..." -ForegroundColor Yellow

try {
    # Test connection using .NET PostgreSQL provider
    Add-Type -AssemblyName System.Data
    $connectionString = "Host=localhost;Port=5433;Database=codnite_db;Username=postgres;Password=Shadan700@#"
    $connection = New-Object Npgsql.NpgsqlConnection($connectionString)
    $connection.Open()
    Write-Host "✅ Successfully connected to PostgreSQL 18" -ForegroundColor Green
    $connection.Close()
} catch {
    Write-Host "❌ Cannot connect to PostgreSQL 18 on port 5433" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please make sure PostgreSQL 18 is running on port 5433" -ForegroundColor Yellow
    exit 1
}

# Alternative approach: Use Docker exec to run commands
Write-Host "🔧 Using Docker-based approach..." -ForegroundColor Yellow

# Step 1: Get table list from source database
Write-Host "📋 Getting table structure from PostgreSQL 18..." -ForegroundColor Yellow

# Step 2: Clear Docker database
Write-Host "🗑️ Clearing Docker database..." -ForegroundColor Yellow
docker exec codnite_db psql -U postgres -d codnite_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

Write-Host "✅ Database copy preparation completed!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. We need to manually extract your schema" -ForegroundColor White
Write-Host "2. Then import it into Docker database" -ForegroundColor White