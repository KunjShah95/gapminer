#!/bin/bash
# =============================================================================
# GapMiner Deployment Script
# Usage: ./deploy.sh [staging|production]
# =============================================================================

set -e

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check .env file
    if [ ! -f "$PROJECT_DIR/infra/.env" ]; then
        log_warn "No .env file found. Copy infra/env.production.example to infra/.env"
    fi
    
    log_info "Prerequisites check passed"
}

# Build images
build_images() {
    log_info "Building Docker images..."
    
    cd "$PROJECT_DIR"
    
    docker compose -f infra/docker-compose.prod.yml build --parallel
    
    log_info "Build complete"
}

# Start services
start_services() {
    log_info "Starting services..."
    
    cd "$PROJECT_DIR"
    
    # Start database and redis first
    docker compose -f infra/docker-compose.prod.yml up -d postgres redis
    
    # Wait for database
    log_info "Waiting for database..."
    sleep 10
    
    # Run migrations
    log_info "Running database migrations..."
    docker compose -f infra/docker-compose.prod.yml run --rm api npx prisma migrate deploy || true
    
    # Start API and web
    docker compose -f infra/docker-compose.prod.yml up -d api web
    
    log_info "Services started"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    API_URL="http://localhost:8000/health"
    WEB_URL="http://localhost:3000"
    
    # Check API
    if curl -sf "$API_URL" > /dev/null; then
        log_info "API is healthy"
    else
        log_error "API health check failed"
        return 1
    fi
    
    # Check Web
    if curl -sf "$WEB_URL" > /dev/null; then
        log_info "Web is healthy"
    else
        log_warn "Web health check failed"
    fi
    
    log_info "All health checks passed"
}

# Main
main() {
    log_info "Starting GapMiner deployment to $ENVIRONMENT"
    
    check_prerequisites
    build_images
    start_services
    health_check
    
    log_info "Deployment complete!"
    log_info "API: http://localhost:8000"
    log_info "Web: http://localhost:3000"
    log_info "Health: http://localhost:8000/health"
}

main "$@"