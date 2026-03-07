# Bakaya Web

Next.js 15 web application with App Router.

## Setup

```bash
cp .env.example .env.local
bun install
```

## Development

```bash
bun run dev
```

App starts on `http://localhost:3000`.

## Environment Variables

| Variable               | Required | Default                  | Description     |
| ---------------------- | -------- | ------------------------ | --------------- |
| `NEXT_PUBLIC_API_URL`  | No       | `http://localhost:8080`  | API server URL  |

## Build & Docker

```bash
# Build
bun run build

# Docker (from repo root)
docker compose -f infra/docker/docker-compose.yml build web
```

## Structure

```
src/
├── app/            # App Router pages and layouts
├── lib/            # API client and service modules
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```
