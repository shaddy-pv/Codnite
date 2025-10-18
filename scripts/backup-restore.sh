#!/bin/bash

# Backup and Restore Script for Codnite Application
# Usage: ./backup-restore.sh [backup|restore] [options]

set -e

# Configuration
BACKUP_DIR="./backups"
DB_NAME="${POSTGRES_DB:-codnite_prod}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"
APP_DATA_DIR="./data"
LOG_FILE="./backup-restore.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Generate backup filename with timestamp
get_backup_filename() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    echo "codnite_backup_${timestamp}"
}

# Database backup
backup_database() {
    local backup_name="$1"
    local db_backup_file="${BACKUP_DIR}/${backup_name}_database.sql.gz"
    
    log "Starting database backup..."
    
    # Check if database is accessible
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        error "Database is not accessible"
    fi
    
    # Create database backup
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --no-owner --no-privileges --clean --if-exists \
        | gzip > "$db_backup_file"; then
        success "Database backup completed: $db_backup_file"
    else
        error "Database backup failed"
    fi
}

# Redis backup
backup_redis() {
    local backup_name="$1"
    local redis_backup_file="${BACKUP_DIR}/${backup_name}_redis.rdb"
    
    log "Starting Redis backup..."
    
    # Check if Redis is accessible
    if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} ping > /dev/null 2>&1; then
        warning "Redis is not accessible, skipping Redis backup"
        return
    fi
    
    # Trigger Redis BGSAVE
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} BGSAVE
    
    # Wait for BGSAVE to complete
    while [ "$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} LASTSAVE)" = "$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} LASTSAVE)" ]; do
        sleep 1
    done
    
    # Copy Redis dump file
    local redis_dump_file="/var/lib/redis/dump.rdb"
    if [ -f "$redis_dump_file" ]; then
        cp "$redis_dump_file" "$redis_backup_file"
        success "Redis backup completed: $redis_backup_file"
    else
        warning "Redis dump file not found, skipping Redis backup"
    fi
}

# Application data backup
backup_app_data() {
    local backup_name="$1"
    local app_backup_file="${BACKUP_DIR}/${backup_name}_app_data.tar.gz"
    
    log "Starting application data backup..."
    
    if [ -d "$APP_DATA_DIR" ]; then
        if tar -czf "$app_backup_file" -C "$(dirname "$APP_DATA_DIR")" "$(basename "$APP_DATA_DIR")"; then
            success "Application data backup completed: $app_backup_file"
        else
            error "Application data backup failed"
        fi
    else
        warning "Application data directory not found: $APP_DATA_DIR"
    fi
}

# Configuration backup
backup_config() {
    local backup_name="$1"
    local config_backup_file="${BACKUP_DIR}/${backup_name}_config.tar.gz"
    
    log "Starting configuration backup..."
    
    local config_files=(
        ".env"
        "docker-compose.yml"
        "docker-compose.prod.yml"
        "nginx.conf"
        "package.json"
        "package-lock.json"
    )
    
    local files_to_backup=()
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            files_to_backup+=("$file")
        fi
    done
    
    if [ ${#files_to_backup[@]} -gt 0 ]; then
        if tar -czf "$config_backup_file" "${files_to_backup[@]}"; then
            success "Configuration backup completed: $config_backup_file"
        else
            error "Configuration backup failed"
        fi
    else
        warning "No configuration files found to backup"
    fi
}

# Full backup
full_backup() {
    local backup_name=$(get_backup_filename)
    local backup_manifest="${BACKUP_DIR}/${backup_name}_manifest.json"
    
    log "Starting full backup: $backup_name"
    
    create_backup_dir
    
    # Create backup manifest
    cat > "$backup_manifest" << EOF
{
    "backup_name": "$backup_name",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "environment": "${NODE_ENV:-production}",
    "components": {
        "database": true,
        "redis": true,
        "app_data": true,
        "config": true
    }
}
EOF
    
    # Perform backups
    backup_database "$backup_name"
    backup_redis "$backup_name"
    backup_app_data "$backup_name"
    backup_config "$backup_name"
    
    # Create backup summary
    local backup_summary="${BACKUP_DIR}/${backup_name}_summary.txt"
    cat > "$backup_summary" << EOF
Codnite Application Backup Summary
==================================
Backup Name: $backup_name
Timestamp: $(date)
Environment: ${NODE_ENV:-production}
Version: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')

Files Created:
$(ls -la "${BACKUP_DIR}/${backup_name}"*)

Backup Size:
$(du -sh "${BACKUP_DIR}/${backup_name}"*)

Next Steps:
1. Verify backup files are complete
2. Test restore procedure
3. Store backup in secure location
4. Update backup retention policy
EOF
    
    success "Full backup completed: $backup_name"
    log "Backup summary saved to: $backup_summary"
}

# Database restore
restore_database() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Starting database restore from: $backup_file"
    
    # Check if database is accessible
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        error "Database is not accessible"
    fi
    
    # Confirm restore
    echo -n "Are you sure you want to restore the database? This will overwrite existing data. (yes/no): "
    read -r confirmation
    if [ "$confirmation" != "yes" ]; then
        log "Database restore cancelled"
        return
    fi
    
    # Restore database
    if gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        success "Database restore completed"
    else
        error "Database restore failed"
    fi
}

# Redis restore
restore_redis() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Starting Redis restore from: $backup_file"
    
    # Check if Redis is accessible
    if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} ping > /dev/null 2>&1; then
        error "Redis is not accessible"
    fi
    
    # Confirm restore
    echo -n "Are you sure you want to restore Redis? This will overwrite existing data. (yes/no): "
    read -r confirmation
    if [ "$confirmation" != "yes" ]; then
        log "Redis restore cancelled"
        return
    fi
    
    # Stop Redis
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} SHUTDOWN SAVE
    
    # Copy backup file
    local redis_dump_file="/var/lib/redis/dump.rdb"
    cp "$backup_file" "$redis_dump_file"
    
    # Start Redis
    systemctl start redis || service redis start
    
    success "Redis restore completed"
}

# Application data restore
restore_app_data() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Starting application data restore from: $backup_file"
    
    # Confirm restore
    echo -n "Are you sure you want to restore application data? This will overwrite existing data. (yes/no): "
    read -r confirmation
    if [ "$confirmation" != "yes" ]; then
        log "Application data restore cancelled"
        return
    fi
    
    # Restore application data
    if tar -xzf "$backup_file" -C "$(dirname "$APP_DATA_DIR")"; then
        success "Application data restore completed"
    else
        error "Application data restore failed"
    fi
}

# Configuration restore
restore_config() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Starting configuration restore from: $backup_file"
    
    # Confirm restore
    echo -n "Are you sure you want to restore configuration? This will overwrite existing files. (yes/no): "
    read -r confirmation
    if [ "$confirmation" != "yes" ]; then
        log "Configuration restore cancelled"
        return
    fi
    
    # Restore configuration
    if tar -xzf "$backup_file"; then
        success "Configuration restore completed"
    else
        error "Configuration restore failed"
    fi
}

# List available backups
list_backups() {
    log "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR" | grep "codnite_backup_" | awk '{print $9}' | sort -r
    else
        warning "No backup directory found"
    fi
}

# Clean old backups
cleanup_backups() {
    local retention_days="${1:-30}"
    
    log "Cleaning backups older than $retention_days days..."
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "codnite_backup_*" -type f -mtime +$retention_days -delete
        success "Old backups cleaned up"
    else
        warning "No backup directory found"
    fi
}

# Main function
main() {
    case "${1:-help}" in
        "backup")
            full_backup
            ;;
        "restore")
            if [ -z "$2" ]; then
                error "Please specify backup name for restore"
            fi
            local backup_name="$2"
            restore_database "${BACKUP_DIR}/${backup_name}_database.sql.gz"
            restore_redis "${BACKUP_DIR}/${backup_name}_redis.rdb"
            restore_app_data "${BACKUP_DIR}/${backup_name}_app_data.tar.gz"
            restore_config "${BACKUP_DIR}/${backup_name}_config.tar.gz"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_backups "$2"
            ;;
        "help"|*)
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  backup                    Create a full backup"
            echo "  restore <backup_name>     Restore from backup"
            echo "  list                      List available backups"
            echo "  cleanup [days]            Clean old backups (default: 30 days)"
            echo "  help                      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 backup"
            echo "  $0 restore codnite_backup_20240101_120000"
            echo "  $0 list"
            echo "  $0 cleanup 7"
            ;;
    esac
}

# Run main function
main "$@"
