# ZTS Bakaya Server

A production-grade Bun backend server with TypeScript and MongoDB.

## Features

- 🚀 **Bun Runtime** - Fast JavaScript/TypeScript runtime
- 📦 **TypeScript** - Full type safety
- 🗄️ **MongoDB** - Document database with Mongoose ODM
- ✅ **Zod Validation** - Runtime schema validation
- 📝 **Winston Logging** - Structured JSON logging with file rotation
- 🔒 **Security Headers** - XSS, CSRF, and other protections
- 🚦 **Rate Limiting** - Request rate limiting per IP
- 🌐 **CORS** - Configurable CORS support
- 🏥 **Health Checks** - Liveness, readiness, and health endpoints
- 📊 **Request Tracking** - Request ID propagation

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [MongoDB](https://www.mongodb.com/) >= 6.0

## Getting Started

### Option 1: Docker (Recommended)

```bash
# Copy and configure environment
cp .env.example .env

# Start all services (app + MongoDB)
docker compose up -d

# View logs
docker compose logs -f app

# Stop services
docker compose down

# With MongoDB Express UI (development)
docker compose --profile dev up -d
```

Access the API at `http://localhost:3000`

> **Note**: Docker Compose uses your `.env` file for configuration. Make sure it exists before running.

### Option 2: Local Development

#### 1. Install Dependencies

```bash
bun install
```

#### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/zts_bakaya
```

#### 3. Start Development Server

```bash
bun run dev
```

#### 4. Production Build

```bash
bun run start
```

## Project Structure

```
src/
├── config/         # Configuration (database, env)
├── controllers/    # Request handlers
├── middleware/     # HTTP middleware
├── models/         # Mongoose models
├── routes/         # Route definitions
├── schemas/        # Zod validation schemas
├── services/       # Business logic
├── types/          # TypeScript types
├── utils/          # Utility functions
└── index.ts        # Application entry point
```

## API Endpoints

### Health

| Method | Endpoint  | Description           |
| ------ | --------- | --------------------- |
| GET    | `/health` | Full health status    |
| GET    | `/ready`  | Readiness check       |
| GET    | `/live`   | Liveness check        |

### Users

| Method | Endpoint            | Description      |
| ------ | ------------------- | ---------------- |
| GET    | `/api/v1/users`     | List all users   |
| POST   | `/api/v1/users`     | Create a user    |
| GET    | `/api/v1/users/:id` | Get user by ID   |
| PUT    | `/api/v1/users/:id` | Update user      |
| DELETE | `/api/v1/users/:id` | Delete user      |

### Query Parameters (GET /api/v1/users)

| Param    | Type    | Description                    |
| -------- | ------- | ------------------------------ |
| page     | number  | Page number (default: 1)       |
| limit    | number  | Items per page (default: 20)   |
| role     | string  | Filter by role (user/admin)    |
| isActive | boolean | Filter by active status        |
| search   | string  | Search by name or email        |

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Environment Variables

| Variable              | Description                    | Default                           |
| --------------------- | ------------------------------ | --------------------------------- |
| NODE_ENV              | Environment                    | development                       |
| PORT                  | Server port                    | 3000                              |
| HOST                  | Server host                    | 0.0.0.0                           |
| MONGODB_URI           | MongoDB connection string      | mongodb://localhost:27017/zts_bakaya |
| MONGODB_DB_NAME       | Database name                  | zts_bakaya                        |
| CORS_ORIGIN           | Allowed CORS origins           | *                                 |
| RATE_LIMIT_MAX        | Max requests per window        | 100                               |
| RATE_LIMIT_WINDOW_MS  | Rate limit window in ms        | 60000                             |
| LOG_LEVEL             | Logging level                  | info                              |

## Security

The server includes the following security features:

- **CORS** - Configurable Cross-Origin Resource Sharing
- **Rate Limiting** - Prevents abuse by limiting requests per IP
- **Security Headers** - X-Content-Type-Options, X-Frame-Options, etc.
- **Password Hashing** - bcrypt with Bun's built-in hasher
- **Input Validation** - Zod schemas for all inputs
- **Request ID Tracking** - Trace requests through logs

## Scripts

| Script      | Description                     |
| ----------- | ------------------------------- |
| `dev`       | Start development server        |
| `start`     | Start production server         |
| `build`     | Build for production            |
| `lint`      | Run ESLint                      |
| `format`    | Format code with Prettier       |
| `typecheck` | Run TypeScript type checking    |

## Docker

### Build & Run

```bash
# Build the image
docker build -t zts-bakaya-server .

# Run with docker compose (includes MongoDB)
docker compose up -d

# Run with dev profile (includes Mongo Express UI at :8081)
docker compose --profile dev up -d

# View logs
docker compose logs -f

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (clears data)
docker compose down -v
```

### Docker Environment Variables

| Variable            | Description                    | Default      |
| ------------------- | ------------------------------ | ------------ |
| PORT                | External app port              | 3000         |
| MONGO_PORT          | External MongoDB port          | 27017        |
| MONGO_EXPRESS_PORT  | Mongo Express UI port          | 8081         |
| MONGO_EXPRESS_USER  | Mongo Express username         | admin        |
| MONGO_EXPRESS_PASS  | Mongo Express password         | admin        |

### Production Deployment

```bash
# Build and run in production
NODE_ENV=production docker compose up -d --build

# Scale the app (if using load balancer)
docker compose up -d --scale app=3
```

## License

MIT
