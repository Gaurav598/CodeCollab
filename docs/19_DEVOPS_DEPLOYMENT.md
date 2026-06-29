# 19 — DevOps & Deployment

## Docker Compose Services

The following services are managed by Docker Compose:

| Service | Image | Purpose |
|---|---|---|
| `redis` | `redis:8` | Cache, Pub/Sub, presence, rate limiting |
| `sync-service` | `./sync-service` | Yjs CRDT document sync (Node.js) |
| `backend` | `./backend` | Spring Boot REST + WebSocket API |
| `frontend` | `./frontend` | Next.js app |

**External dependencies (not in Docker Compose):**
- **MongoDB Atlas** — managed cloud database (connected via `MONGODB_URI`)
- **AWS Execution Engine** — remote code execution service (connected via `EXECUTION_ENGINE_URL`)

## Starting the Stack

```bash
# 1. Copy and fill environment variables
cp .env.example .env
# Edit .env: set MONGODB_URI and EXECUTION_ENGINE_URL

# 2. Start all services
docker-compose up -d

# 3. Or start individual services for local dev
docker-compose up -d redis
cd backend && ./gradlew bootRun
cd sync-service && npm run dev
cd frontend && npm run dev
```

## Required Environment Variables

See `.env.example` for the full list. Minimum required to start:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `REDIS_URL` | Redis connection URL |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `SERVICE_JWT_SECRET` | Internal service-to-service JWT secret |
| `EXECUTION_ENGINE_URL` | AWS Execution Engine base URL |

## CI/CD

- **GitHub Actions** — CI pipeline runs tests on every PR, builds images on merge to main.
- **Build targets:** Spring Boot JAR (Maven), Node.js services (npm), Next.js (next build).

## Kubernetes Readiness

All services are stateless where possible, with externalized config (env vars only, no hardcoded values), and health-check endpoints (`/actuator/health` for backend, `/health` for sync-service).

## Notes

- No local MongoDB container is required. MongoDB Atlas handles persistence.
- No local sandbox container is required. The AWS Execution Engine handles code execution.
- Docker is not mounted into any container (no `/var/run/docker.sock` bind mount).
