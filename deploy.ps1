# Codnite Production Deployment Script for Windows

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("deploy", "logs", "stop", "restart", "status", "health", "backup")]
    [string]$Command
)

# Colors for output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker and try again."
        return $false
    }
}

# Build and deploy
function Start-Deploy {
    Write-Status "Starting Codnite production deployment..."
    
    # Check Docker
    if (-not (Test-Docker)) {
        exit 1
    }
    
    # Stop existing containers
    Write-Status "Stopping existing containers..."
    try {
        docker-compose -f docker-compose.prod.yml down
    }
    catch {
        Write-Warning "No existing containers to stop"
    }
    
    # Build images
    Write-Status "Building Docker images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build Docker images"
        exit 1
    }
    
    # Start services
    Write-Status "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start services"
        exit 1
    }
    
    # Wait for services to be healthy
    Write-Status "Waiting for services to be healthy..."
    Start-Sleep -Seconds 30
    
    # Check health
    Test-Health
    
    Write-Success "Deployment completed successfully!"
    Write-Status "Your application is available at: http://localhost"
}

# Check application health
function Test-Health {
    Write-Status "Checking application health..."
    
    # Check if containers are running
    $containers = docker-compose -f docker-compose.prod.yml ps
    if (-not ($containers -match "Up")) {
        Write-Error "Some containers are not running"
        docker-compose -f docker-compose.prod.yml ps
        exit 1
    }
    
    # Check backend health
    $healthChecked = $false
    for ($i = 1; $i -le 10; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "Backend is healthy"
                $healthChecked = $true
                break
            }
        }
        catch {
            Write-Status "Waiting for backend... ($i/10)"
            Start-Sleep -Seconds 5
        }
    }
    
    if (-not $healthChecked) {
        Write-Error "Backend health check failed"
        exit 1
    }
    
    # Check frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend is healthy"
        }
        else {
            Write-Error "Frontend health check failed"
            exit 1
        }
    }
    catch {
        Write-Error "Frontend health check failed: $($_.Exception.Message)"
        exit 1
    }
    
    Write-Success "All services are healthy!"
}

# Show logs
function Show-Logs {
    docker-compose -f docker-compose.prod.yml logs -f
}

# Stop deployment
function Stop-Deploy {
    Write-Status "Stopping Codnite..."
    docker-compose -f docker-compose.prod.yml down
    Write-Success "Codnite stopped"
}

# Restart deployment
function Restart-Deploy {
    Write-Status "Restarting Codnite..."
    docker-compose -f docker-compose.prod.yml restart
    Write-Success "Codnite restarted"
}

# Show status
function Show-Status {
    Write-Status "Codnite Status:"
    docker-compose -f docker-compose.prod.yml ps
}

# Backup database
function Backup-Database {
    Write-Status "Creating database backup..."
    $backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres codnite_db > $backupFile
    Write-Success "Database backup created: $backupFile"
}

# Main script logic
switch ($Command) {
    "deploy" { Start-Deploy }
    "logs" { Show-Logs }
    "stop" { Stop-Deploy }
    "restart" { Restart-Deploy }
    "status" { Show-Status }
    "health" { Test-Health }
    "backup" { Backup-Database }
}