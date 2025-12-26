# Docker Infrastructure for Gas Pipeline Leakage Detection

This directory contains Docker configurations for both development and production environments.

## Directory Structure

```
infra/docker/
├── Dockerfile.frontend          # Production frontend Dockerfile
├── Dockerfile.frontend.dev      # Development frontend Dockerfile
├── Dockerfile.backend           # Production backend Dockerfile
├── Dockerfile.backend.dev       # Development backend Dockerfile
├── docker-compose.dev.yml       # Development environment
├── docker-compose.prod.yml      # Production environment
├── nginx.conf                   # Nginx config for production frontend
├── nginx.prod.conf             # Production nginx config with SSL
├── init.sql                    # Database initialization script
├── .dockerignore.frontend      # Docker ignore file for frontend
└── README.md                   # This file
```

## Development Environment

### Setup

1. Navigate to the docker directory:
   ```bash
   cd infra/docker
   ```

2. Start the development environment:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Database: localhost:5432


## Cert config
docker run --rm -it `
  -v ${PWD}:/certs `
  alpine sh -c "
    apk add --no-cache openssl &&
    openssl req -x509 -nodes -days 365 \
      -newkey rsa:2048 \
      -keyout /certs/key.pem \
      -out /certs/cert.pem \
      -subj '/C=IT/ST=IT/L=Local/O=AvashPetro/OU=Dev/CN=localhost'
  "

## docker for dev local
docker compose -p leakage-dev -f infra/docker/compose/compose.yml -f infra/docker/compose/compose.dev.yml up -d --build

## docker for prod local
docker compose -p leakage-prod-local -f infra/docker/compose/compose.yml -f infra/docker/compose/compose.prod.yml -f infra/docker/compose/compose.prod.local.yml up -d --build

## docker for prod server 
docker compose -p leakage-prod -f infra/docker/compose/compose.yml -f infra/docker/compose/compose.prod.yml up -d --build
