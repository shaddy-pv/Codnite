#!/bin/bash

# Codnite Docker Hub Deployment Script

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_USERNAME=${DOCKER_USERNAME:-"your-dockerhub-username"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}
VERSION=${VERSION:-$(date +%Y%m%d-%H%M%S)}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Login to Docker Hub
docker_login() {
    print_status "Logging into Docker Hub..."
    if [ -z "$DOCKER_PASSWORD" ]; then
        print_status "Please enter your Docker Hub password:"
        docker login -u "$DOCKER_USERNAME"
    else
        echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    fi
    print_success "Logged into Docker Hub"
}

# Build images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -f Dockerfile.backend -t "$DOCKER_USERNAME/codnite-backend:$IMAGE_TAG" .
    docker tag "$DOCKER_USERNAME/codnite-backend:$IMAGE_TAG" "$DOCKER_USERNAME/codnite-backend:$VERSION"
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -f Dockerfile.frontend -t "$DOCKER_USERNAME/codnite-frontend:$IMAGE_TAG" .
    docker tag "$DOCKER_USERNAME/codnite-frontend:$IMAGE_TAG" "$DOCKER_USERNAME/codnite-frontend:$VERSION"
    
    print_success "Images built successfully"
}

# Push images to Docker Hub
push_images() {
    print_status "Pushing images to Docker Hub..."
    
    # Push backend images
    print_status "Pushing backend image..."
    docker push "$DOCKER_USERNAME/codnite-backend:$IMAGE_TAG"
    docker push "$DOCKER_USERNAME/codnite-backend:$VERSION"
    
    # Push frontend images
    print_status "Pushing frontend image..."
    docker push "$DOCKER_USERNAME/codnite-frontend:$IMAGE_TAG"
    docker push "$DOCKER_USERNAME/codnite-frontend:$VERSION"
    
    print_success "Images pushed successfully"
}

# Create production docker-compose with Docker Hub images
create_production_compose() {
    print_status "Creating production docker-compose with Docker Hub images..."
    
    cat > docker-compose.hub.yml << EOF
# Production Docker Compose using Docker Hub images
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: codnite_db_prod
    environment:
      POSTGRES_DB: \${POSTGRES_DB:-codnite_db}
      POSTGRES_USER: \${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    networks:
      - codnite_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-postgres} -d \${POSTGRES_DB:-codnite_db}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: codnite_redis_prod
    command: redis-server --requirepass \${REDIS_PASSWORD} --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data_prod:/data
    networks:
      - codnite_net
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "\${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  # Backend API Service (from Docker Hub)
  backend:
    image: $DOCKER_USERNAME/codnite-backend:$IMAGE_TAG
    container_name: codnite_backend_prod
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://\${POSTGRES_USER:-postgres}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB:-codnite_db}
      REDIS_URL: redis://:\${REDIS_PASSWORD}@redis:6379
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
    image: $DOCKER_USERNAME/codnite-frontend:$IMAGE_TAG
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
      - "\${PORT:-80}:80"
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
EOF

    print_success "Created docker-compose.hub.yml with Docker Hub images"
}

# Display deployment information
show_deployment_info() {
    print_success "Docker Hub deployment completed!"
    echo ""
    print_status "Docker Hub Images:"
    echo "  Backend:  $DOCKER_USERNAME/codnite-backend:$IMAGE_TAG"
    echo "  Frontend: $DOCKER_USERNAME/codnite-frontend:$IMAGE_TAG"
    echo ""
    print_status "Versioned Images:"
    echo "  Backend:  $DOCKER_USERNAME/codnite-backend:$VERSION"
    echo "  Frontend: $DOCKER_USERNAME/codnite-frontend:$VERSION"
    echo ""
    print_status "To deploy using Docker Hub images:"
    echo "  docker-compose -f docker-compose.hub.yml up -d"
    echo ""
    print_status "To pull images on any server:"
    echo "  docker pull $DOCKER_USERNAME/codnite-backend:$IMAGE_TAG"
    echo "  docker pull $DOCKER_USERNAME/codnite-frontend:$IMAGE_TAG"
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --username USERNAME    Docker Hub username (default: your-dockerhub-username)"
    echo "  -t, --tag TAG             Image tag (default: latest)"
    echo "  -v, --version VERSION     Version tag (default: current timestamp)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DOCKER_USERNAME          Docker Hub username"
    echo "  DOCKER_PASSWORD          Docker Hub password (optional, will prompt if not set)"
    echo "  IMAGE_TAG               Image tag"
    echo "  VERSION                 Version tag"
    echo ""
    echo "Examples:"
    echo "  $0 -u myusername -t v1.0.0"
    echo "  DOCKER_USERNAME=myuser $0"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--username)
            DOCKER_USERNAME="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate Docker username
if [ "$DOCKER_USERNAME" = "your-dockerhub-username" ]; then
    print_error "Please set your Docker Hub username using -u flag or DOCKER_USERNAME environment variable"
    usage
    exit 1
fi

# Main execution
main() {
    print_status "Starting Docker Hub deployment for Codnite..."
    print_status "Docker Hub Username: $DOCKER_USERNAME"
    print_status "Image Tag: $IMAGE_TAG"
    print_status "Version: $VERSION"
    echo ""
    
    check_docker
    docker_login
    build_images
    push_images
    create_production_compose
    show_deployment_info
}

# Run main function
main