#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERBOSE=false
FORCE=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${BLUE}[INFO]${NC} $1"
    fi
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

show_help() {
    cat << EOF
Mechanico Database Initialization Script

Usage: $0 [options]

Options:
    -u, --user USER        Database user
    -p, --password PASS    Database password
    -h, --host HOST        Database host
    -d, --dbname NAME      Database name
    -P, --port PORT        Database port
    -f, --force            Force re-initialization
    -v, --verbose          Verbose output
    -h, --help             Show this help message

Environment Variables:
    DATABASE_URL           Full database connection URL
    DIRECT_URL             Direct database connection URL

Examples:
    ./init-db.sh
    ./init-db.sh -u postgres -p password -h localhost -d mechanico_dev
    ./init-db.sh --force

EOF
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -p|--password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -d|--dbname)
            DB_NAME="$2"
            shift 2
            ;;
        -P|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

if [[ -f "$SCRIPT_DIR/.env" ]]; then
    log_info "Loading environment from .env file"
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
fi

parse_database_url() {
    local url="$1"
    
    if [[ -z "$url" ]]; then
        return 1
    fi
    
    if [[ $url =~ ^postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)$ ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASSWORD="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        return 0
    else
        log_error "Invalid DATABASE_URL format"
        return 1
    fi
}

if [[ -n "${DATABASE_URL:-}" ]]; then
    parse_database_url "$DATABASE_URL"
elif [[ -n "${DIRECT_URL:-}" ]]; then
    parse_database_url "$DIRECT_URL"
fi

if [[ -n "${DB_USER:-}" ]]; then
    PGPASSWORD="$DB_PASSWORD"
    export PGPASSWORD
fi

validate_params() {
    local missing_params=()
    
    if [[ -z "${DB_USER:-}" ]]; then
        missing_params+=("user")
    fi
    if [[ -z "${DB_PASSWORD:-}" ]]; then
        missing_params+=("password")
    fi
    if [[ -z "${DB_HOST:-}" ]]; then
        missing_params+=("host")
    fi
    if [[ -z "${DB_PORT:-}" ]]; then
        missing_params+=("port")
    fi
    if [[ -z "${DB_NAME:-}" ]]; then
        missing_params+=("database name")
    fi
    
    if [[ ${#missing_params[@]} -gt 0 ]]; then
        log_error "Missing required parameters: ${missing_params[*]}"
        log_error "Please set them via environment variables or command line arguments"
        show_help
        exit 1
    fi
}

test_connection() {
    log_info "Testing database connection..."
    
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log_error "Failed to connect to database"
        log_error "Please check your connection parameters:"
        log_error "  Host: $DB_HOST"
        log_error "  Port: $DB_PORT"
        log_error "  User: $DB_USER"
        log_error "  Database: $DB_NAME"
        exit 1
    fi
    
    log_success "Database connection successful"
}

check_existing_data() {
    log_info "Checking for existing data..."
    
    local table_count
    table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'User', 'Profile', 'Vehicle', 'ServiceCategory', 
            'Service', 'Booking', 'Rating', 'AuditLog',
            'SavedPlace', 'ChatMessage', 'BookingItem',
            'BookingAttachment', 'AvailabilityWindow',
            'AvailabilityException', 'BookingOffer', 'Region'
        );
    " 2>/dev/null | xargs)
    
    if [[ "$table_count" -gt 0 ]]; then
        if [[ "$FORCE" == true ]]; then
            log_warn "Database already initialized. Force flag detected - proceeding with initialization."
            return 0
        else
            log_warn "Database appears to already be initialized."
            log_warn "Tables found: $table_count"
            log_warn "Use --force flag to re-initialize"
            log_warn "Or run with --help for usage information"
            exit 0
        fi
    fi
    
    log_info "No existing tables found. Proceeding with initialization."
}

execute_sql() {
    local sql_file="$1"
    local description="$2"
    
    log_info "Executing: $description"
    
    if [[ ! -f "$sql_file" ]]; then
        log_error "SQL file not found: $sql_file"
        return 1
    fi
    
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file" 2>&1; then
        log_error "Failed to execute: $description"
        log_error "Check the SQL file: $sql_file"
        return 1
    fi
    
    log_success "Completed: $description"
}

main() {
    echo "=================================="
    echo "Mechanico Database Initialization"
    echo "=================================="
    echo ""
    
    validate_params
    test_connection
    check_existing_data
    
    echo ""
    log_info "Starting database initialization..."
    echo ""
    
    execute_sql "$SCRIPT_DIR/schema.sql" "PostGIS extension and schema creation"
    execute_sql "$SCRIPT_DIR/postgis_indexes.sql" "PostGIS indexes and constraints"
    execute_sql "$SCRIPT_DIR/sample_data.sql" "Sample data insertion"
    
    echo ""
    log_success "Database initialization completed successfully!"
    echo ""
    log_info "Next steps:"
    log_info "1. Run 'npx prisma generate' to update Prisma client"
    log_info "2. Run 'npm run dev' to start the application"
    echo ""
    log_info "For more information, see DB_INIT_GUIDE.md"
    echo ""
}

trap 'log_error "Script interrupted"; exit 1' INT TERM

main "$@"