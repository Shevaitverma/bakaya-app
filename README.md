# Bakaya App

A multi-platform expense tracking and group splitting application built with TypeScript across all layers.

## Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Server     | Bun + Express, MongoDB, Mongoose              |
| Web        | Next.js 16, React 19, App Router              |
| Mobile     | Expo SDK 54, React Native, React Navigation   |
| Infra      | Docker Compose, Nginx, Terraform (AWS)        |

## Folder Structure

```
bakaya-app/
├── server/                         # Bun + Express API (port 8080)
│   ├── src/
│   │   ├── config/                 # Database & env configuration
│   │   │   ├── database.ts
│   │   │   └── env.ts
│   │   ├── controllers/            # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── expense.controller.ts
│   │   │   ├── group.controller.ts
│   │   │   ├── groupExpense.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── middleware/             # HTTP middleware
│   │   │   ├── auth.ts
│   │   │   ├── cors.ts
│   │   │   ├── rateLimit.ts
│   │   │   ├── requestId.ts
│   │   │   └── security.ts
│   │   ├── models/                 # Mongoose models
│   │   │   ├── Device.ts
│   │   │   ├── Expense.ts
│   │   │   ├── Group.ts
│   │   │   ├── GroupExpense.ts
│   │   │   └── User.ts
│   │   ├── routes/                 # Route definitions
│   │   │   ├── health.ts
│   │   │   └── index.ts
│   │   ├── schemas/                # Zod validation schemas
│   │   ├── services/               # Business logic
│   │   ├── types/                  # TypeScript type definitions
│   │   ├── utils/                  # Utility functions
│   │   └── index.ts                # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── web/                            # Next.js 16 web app (port 3000)
│   ├── src/
│   │   ├── app/                    # App Router pages & layouts
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── login/              # Login page
│   │   │   ├── register/           # Register page
│   │   │   └── dashboard/
│   │   │       ├── page.tsx        # Dashboard home
│   │   │       ├── expenses/       # Expense list & add
│   │   │       └── groups/         # Group detail & group expenses
│   │   ├── lib/                    # API client & service modules
│   │   │   ├── api-client.ts
│   │   │   └── api/
│   │   ├── types/
│   │   └── utils/
│   ├── Dockerfile
│   └── package.json
│
├── mobile/                         # Expo React Native app
│   ├── src/
│   │   ├── App.tsx                 # Root component
│   │   ├── index.js                # Entry point
│   │   ├── components/             # Reusable UI components
│   │   ├── constants/              # App constants & theme
│   │   ├── context/                # React context providers
│   │   ├── navigation/             # React Navigation setup
│   │   ├── screens/                # App screens
│   │   ├── services/               # API service modules
│   │   ├── types/
│   │   └── utils/
│   └── package.json
│
├── infra/                          # Infrastructure & DevOps
│   ├── docker/
│   │   ├── docker-compose.dev.yml  # Local development setup
│   │   ├── docker-compose.prod.yml # Production setup (nginx + 127.0.0.1 bindings)
│   │   ├── nginx.conf              # Reverse proxy config
│   │   └── README.md
│   └── terraform/                  # AWS infrastructure as code
│       ├── provider.tf
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── terraform.tfvars.example
│       ├── README.md
│       └── modules/
│           ├── vpc/                # VPC, subnets, IGW, route tables
│           ├── security-group/     # ALB & EC2 security groups
│           ├── ec2/                # EC2 instance, EIP, IAM, Docker bootstrap
│           └── load-balancer/      # ALB, target group, HTTPS/HTTP listeners
│
└── README.md
```

Each app is fully independent with its own dependencies, types, and utilities — no shared packages.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [MongoDB](https://www.mongodb.com/) >= 6.0 (or MongoDB Atlas)
- [Node.js](https://nodejs.org/) >= 18 (for Next.js and Expo)

## Quick Start

### Server (port 8080)

```bash
cd server
cp .env.example .env    # configure MongoDB URI, etc.
bun install
bun run dev
```

### Web (port 3000)

```bash
cd web
cp .env.example .env.local
bun install
bun run dev
```

### Mobile

```bash
cd mobile
cp .env.example .env    # set EXPO_PUBLIC_API_URL to your LAN IP
bun install
bun run start           # scan QR with Expo Go
```

## Docker

### Development

```bash
docker compose -f infra/docker/docker-compose.dev.yml up --build
```

### Production

```bash
docker compose -f infra/docker/docker-compose.prod.yml up --build
```

| Service | Dev Port         | Prod Port           |
| ------- | ---------------- | ------------------- |
| Server  | 0.0.0.0:8080     | 127.0.0.1:8080      |
| Web     | 0.0.0.0:3000     | 127.0.0.1:3000      |
| Nginx   | —                | 0.0.0.0:80          |

See [infra/docker/README.md](infra/docker/README.md) for details.

## Infrastructure

### AWS Deployment Architecture

```
Users → ALB (HTTPS:443) → EC2 → Docker (server + web + nginx)
```

- **Terraform** provisions VPC, security groups, EC2, and ALB on AWS
- ALB terminates SSL (ACM certificate), forwards to EC2 on port 80
- Nginx routes `/api/*` to the server, everything else to the web app
- MongoDB hosted on Atlas (no DB provisioning needed)

See [infra/terraform/README.md](infra/terraform/README.md) for setup instructions.

## Environment Variables

### Server (`server/.env`)

| Variable             | Default                  | Description                    |
| -------------------- | ------------------------ | ------------------------------ |
| NODE_ENV             | development              | Environment mode               |
| PORT                 | 3001                     | Server port                    |
| HOST                 | 0.0.0.0                  | Server host                    |
| MONGODB_URI          | —                        | MongoDB connection string      |
| MONGODB_DB_NAME      | zts_bakaya               | Database name                  |
| CORS_ORIGIN          | http://localhost:3000     | Allowed CORS origins           |
| RATE_LIMIT_MAX       | 100                      | Max requests per window        |
| RATE_LIMIT_WINDOW_MS | 60000                    | Rate limit window (ms)         |
| LOG_LEVEL            | info                     | Logging level                  |

### Web (`web/.env.local`)

| Variable              | Default                 | Description    |
| --------------------- | ----------------------- | -------------- |
| NEXT_PUBLIC_API_URL   | http://localhost:8080    | API server URL |

### Mobile (`mobile/.env`)

| Variable              | Default                     | Description    |
| --------------------- | --------------------------- | -------------- |
| EXPO_PUBLIC_API_URL   | http://YOUR_LOCAL_IP:8080   | API server URL |

## API Endpoints

### Health

| Method | Endpoint  | Auth | Description        |
| ------ | --------- | ---- | ------------------ |
| GET    | /health   | No   | Full health status |
| GET    | /ready    | No   | Readiness check    |
| GET    | /live     | No   | Liveness check     |

### Auth — `/api/v1/auth`

| Method | Endpoint               | Auth | Description      |
| ------ | ---------------------- | ---- | ---------------- |
| POST   | /api/v1/auth/login     | No   | Login            |
| POST   | /api/v1/auth/register  | No   | Register         |

### Users — `/api/v1/users`

| Method | Endpoint             | Auth | Description    |
| ------ | -------------------- | ---- | -------------- |
| POST   | /api/v1/users        | No   | Create user    |
| GET    | /api/v1/users        | Yes  | List users     |
| GET    | /api/v1/users/:id    | Yes  | Get user       |
| PUT    | /api/v1/users/:id    | Yes  | Update user    |
| DELETE | /api/v1/users/:id    | Yes  | Delete user    |

### Personal Expenses — `/api/v1/personal-expenses`

| Method | Endpoint                        | Auth | Description       |
| ------ | ------------------------------- | ---- | ----------------- |
| GET    | /api/v1/personal-expenses       | Yes  | List expenses     |
| POST   | /api/v1/personal-expenses       | Yes  | Create expense    |
| DELETE | /api/v1/personal-expenses/:id   | Yes  | Delete expense    |

### Groups — `/api/v1/groups`

| Method | Endpoint                                  | Auth | Description          |
| ------ | ----------------------------------------- | ---- | -------------------- |
| GET    | /api/v1/groups                            | Yes  | List groups          |
| POST   | /api/v1/groups                            | Yes  | Create group         |
| GET    | /api/v1/groups/:id                        | Yes  | Get group            |
| PUT    | /api/v1/groups/:id                        | Yes  | Update group         |
| DELETE | /api/v1/groups/:id                        | Yes  | Delete group         |
| POST   | /api/v1/groups/:id/members                | Yes  | Add member           |
| DELETE | /api/v1/groups/:id/members/:memberId      | Yes  | Remove member        |
| GET    | /api/v1/groups/:id/balances               | Yes  | Get group balances   |

### Group Expenses — `/api/v1/groups/:id/expenses`

| Method | Endpoint                                  | Auth | Description            |
| ------ | ----------------------------------------- | ---- | ---------------------- |
| GET    | /api/v1/groups/:id/expenses               | Yes  | List group expenses    |
| POST   | /api/v1/groups/:id/expenses               | Yes  | Create group expense   |
| DELETE | /api/v1/groups/:id/expenses/:expenseId    | Yes  | Delete group expense   |

## Scripts

| App    | Command             | Description               |
| ------ | ------------------- | ------------------------- |
| Server | `bun run dev`       | Dev server with hot reload|
| Server | `bun run start`     | Production server         |
| Server | `bun run build`     | Build for production      |
| Server | `bun run lint`      | Run ESLint                |
| Server | `bun run format`    | Format with Prettier      |
| Server | `bun run typecheck` | TypeScript type check     |
| Web    | `bun run dev`       | Next.js dev server        |
| Web    | `bun run build`     | Production build          |
| Web    | `bun run typecheck` | TypeScript type check     |
| Mobile | `bun run start`     | Expo dev server           |
| Mobile | `bun run android`   | Start on Android          |
| Mobile | `bun run ios`       | Start on iOS              |
| Mobile | `bun run typecheck` | TypeScript type check     |
