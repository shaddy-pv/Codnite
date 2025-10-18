#!/bin/bash

# Database restore script
set -e

# Configuration
BACKUP_DIR="./backup"
ENV_FILE=".env.production"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

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

# List available backups
list_backups() {
    log "Available backups:"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null | while read -r line; do
            echo "  $line"
        done
    else
        warning "No backup directory found"
    fi
}

# Restore database
restore_database() {
    local backup_file="$1"
    
    if [[ -z "$backup_file" ]]; then
        error "Backup file not specified"
        exit 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log "Restoring database from backup: $backup_file"
    
    # Stop application services
    log "Stopping application services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" stop app
    
    # Start database service
    log "Starting database service..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d db
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 10
    
    # Restore database
    log "Restoring database..."
    if gunzip -c "$backup_file" | docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T db psql -U postgres -d codnite_prod; then
        success "Database restored successfully"
    else
        error "Database restore failed"
        exit 1
    fi
    
    # Start application services
    log "Starting application services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d app
    
    success "Database restore completed"
}

# Restore application files
restore_files() {
    local backup_file="$1"
    
    if [[ -z "$backup_file" ]]; then
        error "Backup file not specified"
        exit 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log "Restoring application files from backup: $backup_file"
    
    # Stop application services
    log "Stopping application services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" stop app
    
    # Extract backup
    log "Extracting backup..."
    tar -xzf "$backup_file" -C "$BACKUP_DIR"
    
    # Restore files
    log "Restoring files..."
    cp -r "$BACKUP_DIR"/*/dist ./dist 2>/dev/null || true
    cp -r "$BACKUP_DIR"/*/backend/dist ./backend/dist 2>/dev/null || true
    cp "$BACKUP_DIR"/*/package*.json ./ 2>/dev/null || true
    
    # Cleanup extracted files
    rm -rf "$BACKUP_DIR"/*/
    
    # Start application services
    log "Starting application services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d app
    
    success "Application files restored"
}

# Download backup from cloud storage
download_backup() {
    local backup_file="$1"
    
    if [[ -n "$AWS_S3_BUCKET" ]]; then
        log "Downloading backup from S3..."
        if aws s3 cp "s3://$AWS_S3_BUCKET/backups/$backup_file" "$BACKUP_DIR/"; then
            success "Backup downloaded from S3"
        else
            error "Failed to download backup from S3"
            exit 1
        fi
    else
        error "Cloud storage not configured"
        exit 1
    fi
}

# Main function
main() {
    case "${1:-help}" in
        "database")
            load_env
            restore_database "$2"
            ;;
        "files")
            load_env
            restore_files "$2"
            ;;
        "list")
            list_backups
            ;;
        "download")
            load_env
            download_backup "$2"
            ;;
        "help"|*)
            echo "Usage: $0 {database|files|list|download} [backup_file]"
            echo ""
            echo "Commands:"
            echo "  database <file> - Restore database from backup file"
            echo "  files <file>    - Restore application files from backup"
            echo "  list           - List available backups"
            echo "  download <file> - Download backup from cloud storage"
            echo ""
            echo "Examples:"
            echo "  $0 list"
            echo "  $0 database backup_20240101_120000.sql.gz"
            echo "  $0 files files_20240101_120000.tar.gz"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
