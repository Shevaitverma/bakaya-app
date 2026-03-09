# Docker Infrastructure

This directory contains Docker Compose configurations and an Nginx reverse-proxy config for running the Bakaya application stack.

## Overview

Two Docker Compose files are provided:

| File | Purpose |
|------|---------|
| `docker-compose.dev.yml` | Local development -- ports exposed on all interfaces, no health checks, no Nginx |
| `docker-compose.prod.yml` | Production -- ports bound to `127.0.0.1`, health checks, restart policies, Nginx reverse proxy, isolated `bakaya-net` network |

## Prerequisites

- **Docker** (v20+ recommended)
- **Docker Compose** (v2+ recommended, ships with Docker Desktop)
- Environment files (see [Environment Files](#environment-files) below)

## Environment Files

Before starting either environment, make sure the following files exist:

| File | Used by |
|------|---------|
| `server/.env` | The server service (database URL, secrets, etc.) |
| `web/.env.local` | The web service (Next.js runtime env vars) |

Paths are relative to the repository root.

## Running the Dev Environment

```bash
cd infra/docker

# Start all services (build images on first run)
docker compose -f docker-compose.dev.yml up --build

# Run in the background
docker compose -f docker-compose.dev.yml up --build -d
```

The dev setup starts two services:

| Service | URL |
|---------|-----|
| server  | http://localhost:8080 |
| web     | http://localhost:3000 |

Both ports are exposed on `0.0.0.0`, so they are reachable from other devices on your network.

## Running the Prod Environment

```bash
cd infra/docker

# Start all services
docker compose -f docker-compose.prod.yml up --build -d
```

The prod setup starts three services:

| Service | Bound address | Purpose |
|---------|---------------|---------|
| server  | 127.0.0.1:8080 | Go API server (not publicly accessible) |
| web     | 127.0.0.1:3000 | Next.js frontend (not publicly accessible) |
| nginx   | 0.0.0.0:80 | Reverse proxy -- the only public entry point |

In production, external traffic reaches the application exclusively through Nginx on port 80. The server and web ports are bound to `127.0.0.1` so they cannot be reached directly from outside the host.

## Services Breakdown

### server

- Built from `../../server/Dockerfile`.
- Exposes port **8080**.
- Reads environment from `server/.env`.

### web

- Built from `../../web/Dockerfile` with the build arg `NEXT_OUTPUT=standalone` (Next.js standalone output mode).
- Exposes port **3000**.
- Reads environment from `web/.env.local`.
- Depends on the server service (in prod, waits until the server is healthy).

### nginx (prod only)

- Uses the official `nginx:alpine` image.
- Mounts `nginx.conf` as a read-only config at `/etc/nginx/conf.d/default.conf`.
- Listens on port **80** and proxies requests to the server and web services.

## Nginx Routing Rules

The `nginx.conf` defines the following routing:

| Pattern | Upstream | Notes |
|---------|----------|-------|
| `/api/*` | `server:8080` | All API requests |
| `/health`, `/ready`, `/live` | `server:8080` | Health-check endpoints |
| `/*` (everything else) | `web:3000` | Next.js frontend; includes WebSocket upgrade headers |

All proxied requests forward the standard headers: `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto`. The catch-all route to the web frontend also sets `Upgrade` and `Connection` headers to support WebSocket connections (e.g., Next.js HMR or app-level WebSockets).

## Useful Commands

All commands assume you are in `infra/docker/`. Replace `<compose-file>` with either `docker-compose.dev.yml` or `docker-compose.prod.yml`.

```bash
# Build images without starting containers
docker compose -f <compose-file> build

# Start services (detached)
docker compose -f <compose-file> up -d

# Stop and remove containers
docker compose -f <compose-file> down

# View logs (follow mode)
docker compose -f <compose-file> logs -f

# View logs for a single service
docker compose -f <compose-file> logs -f server

# Rebuild and restart a single service
docker compose -f <compose-file> up --build -d server

# Remove containers, networks, and volumes
docker compose -f <compose-file> down -v
```

## Production Notes

- **Health checks** -- The server service has a health check that hits `http://localhost:8080/live` every 30 seconds (timeout 10s, 3 retries, 10s start period). The web service waits for the server to be healthy before starting (`condition: service_healthy`).
- **Restart policy** -- All prod services use `restart: unless-stopped`, so they automatically recover from crashes and survive host reboots (as long as the Docker daemon starts on boot).
- **Network** -- All prod services are placed on a dedicated `bakaya-net` bridge network, isolating them from other Docker workloads on the host.
