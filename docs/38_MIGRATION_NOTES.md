# 38 — Migration Notes: Production Architecture Migration

**Date:** 2026-06-29  
**Migration:** Local MongoDB + Local Sandbox → MongoDB Atlas + AWS Execution Engine

---

## What Was Removed

### 1. MongoDB Docker Container (`mongodb` service)
- **Removed from:** `docker-compose.yml`
- **Replaced by:** MongoDB Atlas (cloud-managed MongoDB)
- **Why:** Production-grade managed database with built-in replica set, backups, and Atlas Search.
- **Connection:** `MONGODB_URI` environment variable (already pointing to Atlas in `.env`)

### 2. MongoDB Volume (`mongodb-data`)
- **Removed from:** `docker-compose.yml`
- **Why:** Data now lives in Atlas, not locally.

### 3. Local Sandbox Service (`sandbox-service` and `sandbox-runner`)
- **Removed from:** `docker-compose.yml`
- **Source code preserved in:** `sandbox-service/` directory (not deleted — kept for reference)
- **Replaced by:** Remote AWS Execution Engine
- **Why:** Production-grade isolated execution with no dependency on Docker daemon availability.

---

## What Was Changed

### Backend — Execution Module

| Old | New |
|---|---|
| `SandboxProperties.java` | `ExecutionEngineProperties.java` |
| `SandboxClient.java` | `ExecutionEngineClient.java` |
| `collabcode.sandbox.*` config | `collabcode.execution.*` config |
| `SANDBOX_SERVICE_URL` env var | `EXECUTION_ENGINE_URL` env var |
| — | `EXECUTION_ENGINE_API_KEY` env var |

### application.yml

- MongoDB URI no longer has a `localhost` default — will fail fast if `MONGODB_URI` is not set.
- `collabcode.sandbox` config block renamed to `collabcode.execution`.

### docker-compose.yml

- Removed: `mongodb`, `mongodb-data`, `sandbox-service`, `sandbox-runner`
- Remaining: `redis`, `backend`, `sync-service`, `frontend`

### .env / .env.example

- Removed: `DOCKER_HOST`
- Added: `EXECUTION_ENGINE_URL`, `EXECUTION_ENGINE_API_KEY`

---

## What Was NOT Changed

- Redis service — unchanged, still handles Yjs pub/sub, presence, rate limiting
- sync-service — unchanged, still handles CRDT document sync via Yjs
- All collaboration features — chat, video, screen share, live cursors, file sync
- Frontend — no changes
- Auth, RBAC, room management — no changes
- AI gateway — no changes
- Rate limiting — preserved (now under `ExecutionEngineProperties`)

---

## Environment Variables Required After Migration

```bash
# Required
MONGODB_URI=mongodb+srv://...     # Atlas connection string
REDIS_URL=redis://localhost:6379
JWT_SECRET=...
SERVICE_JWT_SECRET=...
EXECUTION_ENGINE_URL=https://...  # AWS execution engine base URL

# Optional
EXECUTION_ENGINE_API_KEY=...      # Auth key for execution engine
```

---

## Rollback Plan

If rollback is needed:
1. Restore `docker-compose.yml` from git: `git checkout docker-compose.yml`
2. Restore `SandboxProperties.java` and `SandboxClient.java` from git
3. Restore `CollabCodeApplication.java`, `ExecutionService.java`, `ExecutionRateLimiter.java` from git
4. Remove `ExecutionEngineProperties.java` and `ExecutionEngineClient.java`
5. Restore `application.yml` from git
