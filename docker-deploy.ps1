# Codnite Docker Hub Deployment Script for Windows

param(
    [string]$Username = $env:DOCKER_USERNAME,
    [string]$Tag = "latest",
    [string]$Version = (Get-Date -Format "yyyyMMdd-HHmmss"),
    [switch]$Help
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

# Show usage
function Show-Usage {
    Write-Host "Codnite Docker Hub Deployment Script"
    Write-Host ""
    Write-Host "Usage: .\docker-deploy.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Username STRING    Docker Hub username"
    Write-Host "  -Tag STRING        Image tag (default: latest)"
    Write-Host "  -Version STRING    Version tag (default: current timestamp)"
    Write-Host "  -Help              Show this help message"
    Write-Host ""
    Write-Host "Environment Variables:"
    Write-Host "  DOCKER_USERNAME    Docker Hub username"
    Write-Host "  DOCKER_PASSWORD    Docker Hub password"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\docker-deploy.ps1 -Username myusername -Tag v1.0.0"
    Write-Host "  `$env:DOCKER_USERNAME='myuser'; .\docker-deploy.ps1"
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

# Login to Docker Hub
function Connect-DockerHub {
    param([string]$Username)
    
    Write-Status "Logging into Docker Hub..."
    
    if ($env:DOCKER_PASSWORD) {
        $env:DOCKER_PASSWORD | docker login -u $Username --password-stdin
    }
    else {
        docker login -u $Username
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Logged into Docker Hub"
        return $true
    }
    else {
        Write-Error "Failed to login to Docker Hub"
        return $false
    }
}

# Build Docker images
function Build-Images {
    param([string]$Username, [string]$Tag, [string]$Version)
    
    Write-Status "Building Docker images..."
    
    # Build backend image
    Write-Status "Building backend image..."
    docker build -f Dockerfile.backend -t "$Username/codnite-backend:$Tag" .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build backend image"
        return $false
    }
    
    docker tag "$Username/codnite-backend:$Tag" "$Username/codnite-backend:$Version"
    
    # Build frontend image
    Write-Status "Building frontend image..."
    docker build -f Dockerfile.frontend -t "$Username/codnite-frontend:$Tag" .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build frontend image"
        return $false
    }
    
    docker tag "$Username/codnite-frontend:$Tag" "$Username/codnite-frontend:$Version"
    
    Write-Success "Images built successfully"
    return $true
}

# Push images to Docker Hub
function Push-Images {
    param([string]$Username, [string]$Tag, [string]$Version)
    
    Write-Status "Pushing images to Docker Hub..."
    
    # Push backend images
    Write-Status "Pushing backend image..."
    docker push "$Username/codnite-backend:$Tag"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push backend image"
        return $false
    }
    
    docker push "$Username/codnite-backend:$Version"
    
    # Push frontend images
    Write-Status "Pushing frontend image..."
    docker push "$Username/codnite-frontend:$Tag"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to push frontend image"
        return $false
    }
    
    docker push "$Username/codnite-frontend:$Version"
    
    Write-Success "Images pushed successfully"
    return $true
}

# Create production docker-compose with Docker Hub images
function New-ProductionCompose {
    param([string]$Username, [string]$Tag)
    
    Write-Status "Creating production docker-compose with Docker Hub images..."
    
    $composeContent = @"
# Production Docker Compose using Docker Hub images
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: codnite_db_prod
    environment:
      POSTGRES_DB: `${POSTGRES_DB:-codnite_db}
      POSTGRES_USER: `${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: `${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    networks:
      - codnite_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U `${POSTGRES_USER:-postgres} -d `${POSTGRES_DB:-codnite_db}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: codnite_redis_prod
    command: redis-server --requirepass `${REDIS_PASSWORD} --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data_prod:/data
    networks:
      - codnite_net
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "`${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  # Backend API Service (from Docker Hub)
  backend:
    image: $Username/codnite-backend:$Tag
    container_name: codnite_backend_prod
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://`${POSTGRES_USER:-postgres}:`${POSTGRES_PASSWORD}@postgres:5432/`${POSTGRES_DB:-codnite_db}
      REDIS_URL: redis://:`${REDIS_PASSWORD}@redis:6379
    env_file: .env.production
    volumes:
      - uploads_data_prod:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - codnite_net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

  # Frontend Application (from Docker Hub)
  frontend:
    image: $Username/codnite-frontend:$Tag
    container_name: codnite_frontend_prod
    networks:
      - codnite_net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Nginx Reverse Proxy
  proxy:
    image: nginx:1.25-alpine
    container_name: codnite_proxy_prod
    ports:
      - "`${PORT:-80}:80"
    volumes:
      - ./nginx.simple.conf:/etc/nginx/conf.d/default.conf:ro
      - uploads_data_prod:/usr/share/nginx/html/uploads:ro
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    networks:
      - codnite_net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

networks:
  codnite_net:
    driver: bridge
    name: codnite_network

volumes:
  postgres_data_prod:
    name: codnite_postgres_data
  redis_data_prod:
    name: codnite_redis_data
  uploads_data_prod:
    name: codnite_uploads_data
"@

    $composeContent | Out-File -FilePath "docker-compose.hub.yml" -Encoding UTF8
    Write-Success "Created docker-compose.hub.yml with Docker Hub images"
}

# Display deployment information
function Show-DeploymentInfo {
    param([string]$Username, [string]$Tag, [string]$Version)
    
    Write-Success "Docker Hub deployment completed!"
    Write-Host ""
    Write-Status "Docker Hub Images:"
    Write-Host "  Backend:  $Username/codnite-backend:$Tag"
    Write-Host "  Frontend: $Username/codnite-frontend:$Tag"
    Write-Host ""
    Write-Status "Versioned Images:"
    Write-Host "  Backend:  $Username/codnite-backend:$Version"
    Write-Host "  Frontend: $Username/codnite-frontend:$Version"
    Write-Host ""
    Write-Status "To deploy using Docker Hub images:"
    Write-Host "  docker-compose -f docker-compose.hub.yml up -d"
    Write-Host ""
    Write-Status "To pull images on any server:"
    Write-Host "  docker pull $Username/codnite-backend:$Tag"
    Write-Host "  docker pull $Username/codnite-frontend:$Tag"
}

# Main execution
function Start-Deployment {
    param([string]$Username, [string]$Tag, [string]$Version)
    
    Write-Status "Starting Docker Hub deployment for Codnite..."
    Write-Status "Docker Hub Username: $Username"
    Write-Status "Image Tag: $Tag"
    Write-Status "Version: $Version"
    Write-Host ""
    
    if (-not (Test-Docker)) {
        exit 1
    }
    
    if (-not (Connect-DockerHub -Username $Username)) {
        exit 1
    }
    
    if (-not (Build-Images -Username $Username -Tag $Tag -Version $Version)) {
        exit 1
    }
    
    if (-not (Push-Images -Username $Username -Tag $Tag -Version $Version)) {
        exit 1
    }
    
    New-ProductionCompose -Username $Username -Tag $Tag
    Show-DeploymentInfo -Username $Username -Tag $Tag -Version $Version
}

# Show help if requested
if ($Help) {
    Show-Usage
    exit 0
}

# Validate Docker username
if (-not $Username) {
    Write-Error "Please provide Docker Hub username using -Username parameter or set DOCKER_USERNAME environment variable"
    Show-Usage
    exit 1
}

# Start deployment
Start-Deployment -Username $Username -Tag $Tag -Version $Version