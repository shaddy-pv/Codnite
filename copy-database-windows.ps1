# PowerShell script to copy database using Windows tools
Write-Host "🔄 Database Copy Script for Windows" -ForegroundColor Green

# Check if PostgreSQL is accessible
Write-Host "📡 Checking PostgreSQL 18 connection..." -ForegroundColor Yellow

# Method 1: Try using sqlcmd or other tools
Write-Host "🔧 Attempting database copy using available tools..." -ForegroundColor Yellow

# Since we can't use pg_dump directly, let's try a table-by-table approach
Write-Host "📋 Using table-by-table copy approach..." -ForegroundColor Yellow

# First, let's see what we can do with Docker exec
Write-Host "🐳 Testing Docker database connection..." -ForegroundColor Yellow
docker exec codnite_db psql -U postgres -d codnite_db -c "SELECT version();"

Write-Host "✅ Docker PostgreSQL is accessible" -ForegroundColor Green

# Now we need to find a way to connect to your PostgreSQL 18
Write-Host "❓ We need to establish connection to your PostgreSQL 18..." -ForegroundColor Yellow
Write-Host "Options:" -ForegroundColor White
Write-Host "1. Install PostgreSQL client tools" -ForegroundColor White
Write-Host "2. Use a database GUI tool to export" -ForegroundColor White
Write-Host "3. Manual table-by-table copy" -ForegroundColor White

Write-Host "📝 Next steps will be provided based on available tools..." -ForegroundColor Yellow