#!/bin/bash

# Database backup script
set -e

# Configuration
BACKUP_DIR="./backup"
ENV_FILE=".env.production"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Load environment variables
load_env() {
    if [[ -f "$ENV_FILE" ]]; then
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    else
        error "Environment file not found"
        exit 1
    fi
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
}

# Backup database
backup_database() {
    log "Creating database backup..."
    
    local backup_file="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T db pg_dump -U postgres codnite_prod > "$backup_file"; then
        success "Database backup created: $backup_file"
        echo "$backup_file" > "$BACKUP_DIR/latest_backup.txt"
        
        # Compress backup
        gzip "$backup_file"
        success "Backup compressed: ${backup_file}.gz"
    else
        error "Database backup failed"
        exit 1
    fi
}

# Backup application files
backup_files() {
    log "Creating application backup..."
    
    local backup_dir="$BACKUP_DIR/files_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup important files
    cp -r dist "$backup_dir/" 2>/dev/null || true
    cp -r backend/dist "$backup_dir/" 2>/dev/null || true
    cp package*.json "$backup_dir/" 2>/dev/null || true
    cp "$ENV_FILE" "$backup_dir/" 2>/dev/null || true
    
    # Create tar archive
    tar -czf "${backup_dir}.tar.gz" -C "$BACKUP_DIR" "$(basename "$backup_dir")"
    rm -rf "$backup_dir"
    
    success "Application backup created: ${backup_dir}.tar.gz"
    echo "${backup_dir}.tar.gz" > "$BACKUP_DIR/latest_files_backup.txt"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last N days of backups
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "files_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    success "Old backups cleaned up"
}

# Upload backup to cloud storage
upload_backup() {
    local backup_file="$1"
    
    if [[ -n "$AWS_S3_BUCKET" ]]; then
        log "Uploading backup to S3..."
        if aws s3 cp "$backup_file" "s3://$AWS_S3_BUCKET/backups/"; then
            success "Backup uploaded to S3"
        else
            warning "Failed to upload backup to S3"
        fi
    fi
}

# Main function
main() {
    case "${1:-all}" in
        "database")
            load_env
            create_backup_dir
            backup_database
            cleanup_backups
            ;;
        "files")
            load_env
            create_backup_dir
            backup_files
            cleanup_backups
            ;;
        "all")
            load_env
            create_backup_dir
            backup_database
            backup_files
            cleanup_backups
            ;;
        "cleanup")
            cleanup_backups
            ;;
        *)
            echo "Usage: $0 {database|files|all|cleanup}"
            echo ""
            echo "Commands:"
            echo "  database - Backup database only"
            echo "  files    - Backup application files only"
            echo "  all      - Backup database and files (default)"
            echo "  cleanup  - Cleanup old backups"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
