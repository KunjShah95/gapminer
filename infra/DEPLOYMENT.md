# GapMiner Production Deployment Guide

## Overview

This guide covers deploying GapMiner to production using Docker Compose with nginx as a reverse proxy.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- Domain name (for HTTPS/TLS)

## Quick Start

```bash
# 1. Copy environment template
cp infra/env.production.example infra/.env

# 2. Edit environment file with your values
nano infra/.env

# 3. Run deployment
cd infra && ./deploy.sh production
```

## Architecture

```
                    ┌─────────────┐
                    │    nginx    │ :80, :443
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
      ┌────▼────┐    ┌─────▼────┐    ┌─────▼─────┐
      │   web   │    │   api    │    │  ollama  │ (optional)
      │  :80    │    │  :8000   │    │  :11434  │
      └─────────┘    └─────┬─────┘    └───────────┘
                           │
                    ┌──────▼──────┐
                    │             │
               ┌────▼────┐  ┌───▼───┐
               │postgres │  │ redis │
               │  :5432  │  │ :6379 │
               └─────────┘  └───────┘
```

## Configuration

### Required Environment Variables

| Variable      | Description                                            | Example           |
| ------------- | ------------------------------------------------------ | ----------------- |
| `DOMAIN`      | Your domain name                                       | `gapminer.com`    |
| `SECRET_KEY`  | JWT signing key (generate with `openssl rand -hex 32`) | `a1b2c3...`       |
| `DB_PASSWORD` | PostgreSQL password                                    | `strong-password` |
| `DB_USER`     | PostgreSQL username                                    | `postgres`        |

### Optional Variables

| Variable            | Description               | Default               |
| ------------------- | ------------------------- | --------------------- |
| `SENTRY_DSN`        | Sentry error tracking DSN | none                  |
| `OPENAI_API_KEY`    | OpenAI API key            | none                  |
| `OLLAMA_BASE_URL`   | Ollama server URL         | `http://ollama:11434` |
| `STRIPE_SECRET_KEY` | Stripe payment processing | none                  |

## Deployment Steps

### 1. Environment Setup

```bash
# Copy the example environment file
cp infra/env.production.example infra/.env

# Edit with your values
nano infra/.env
```

### 2. Generate Secrets

```bash
# Generate a strong secret key
openssl rand -hex 32

# Generate database password
openssl rand -base64 32
```

### 3. SSL/TLS Setup (Optional)

For HTTPS, place your SSL certificates in `infra/nginx/ssl/`:

```bash
mkdir -p infra/nginx/ssl
# Copy your certificate and key
cp your-cert.pem infra/nginx/ssl/cert.pem
cp your-key.pem infra/nginx/ssl/key.pem
```

### 4. Build & Deploy

```bash
# Build and start all services
cd infra
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps
```

### 5. Verify Deployment

```bash
# API health
curl http://localhost:8000/health

# Web is responding
curl http://localhost:3000

# Nginx health
curl http://localhost/nginx-health
```

## Maintenance

### Database Migrations

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Create new migration
docker compose -f docker-compose.prod.yml exec api npx prisma migrate dev --name migration_name
```

### Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api
```

### Backup

```bash
# Database backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres gapminer > backup.sql

# Volume backup
docker compose -f docker-compose.prod.yml run --rm -v $(pwd)/backup:/backup postgres tar -czf /backup/data.tar.gz /var/lib/postgresql/data
```

### Update

```bash
# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Restart services
docker compose -f docker-compose.prod.yml up -d

# Rebuild (if needed)
docker compose -f docker-compose.prod.yml up -d --build
```

## Monitoring

### Health Endpoints

- **API**: `http://localhost:8000/health`
- **Liveness**: `http://localhost:8000/health/liveness`
- **Readiness**: `http://localhost:8000/health/readiness`
- **Nginx**: `http://localhost/nginx-health`

### Resource Usage

```bash
docker stats
```

## Troubleshooting

### Common Issues

**Database connection failed**

```bash
# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify connection
docker compose -f docker-compose.prod.yml exec api node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

**API returning 502**

```bash
# Check API logs
docker compose -f docker-compose.prod.yml logs api

# Verify API is running
docker compose -f docker-compose.prod.yml exec api node src/index.js
```

**Redis connection issues**

```bash
# Check Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

## CI/CD Integration

The repository includes GitHub Actions workflows:

1. **CI** (`.github/workflows/ci.yml`): Runs on push/PR to main/develop
2. **Deploy** (`.github/workflows/deploy.yml`): Manual trigger for staging/production

### Setting up GitHub Actions

1. Go to repository Settings → Secrets
2. Add secrets:
   - `SSH_HOST`: Your server IP/hostname
   - `SSH_USER`: SSH username
   - `SSH_KEY`: SSH private key
   - `SLACK_WEBHOOK_URL`: Slack notification webhook (optional)

## Next Steps

- Set up monitoring (Prometheus + Grafana)
- Configure automated backups
- Set up log aggregation
- Enable HTTPS with Let's Encrypt
- Configure horizontal scaling with multiple API replicas
