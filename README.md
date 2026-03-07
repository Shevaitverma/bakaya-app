# Bakaya App

A multi-platform expense tracking and group splitting application.

## Structure

```
bakaya-app/
├── server/     # Bun + Express API (port 8080)
├── web/        # Next.js 15 (port 3000)
├── mobile/     # Expo (React Native)
└── infra/
    └── docker/ # Docker Compose setup
```

Each app is fully independent with its own dependencies, types, and utilities — no shared packages.

## Quick Start

```bash
# Server
cd server && bun install && bun run dev

# Web
cd web && bun install && bun run dev

# Mobile
cd mobile && bun install && bun run start
```

## Docker

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

See each app's README for detailed docs.
