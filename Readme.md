# CodeCollab

CodeCollab is a browser-based collaborative development workspace built with Next.js, Monaco, Yjs, Spring Boot, MongoDB, Redis, STOMP and WebRTC.

This branch includes the production-collaboration upgrade: durable versioned Yjs snapshots, file-level authorization, authenticated realtime channels, reconnect-safe collaboration, semantic WebRTC media handling, a resizable workspace, bounded AI fallback and remote-execution controls.

## Capabilities

- Multi-file Monaco workspace with tabs, file tree and collapsible/resizable sidebar.
- Conflict-free collaborative editing and awareness using Yjs.
- MongoDB-backed Yjs snapshots with optimistic versioning and recovery buffering.
- Owner/editor/viewer room roles, approval flow and active revocation.
- STOMP chat, participant presence and authenticated WebRTC signaling.
- Peer-to-peer microphone, camera and screen sharing with optional TURN.
- Context-aware AI autocomplete/provider gateway when credentials are configured.
- Remote code execution through a separately operated sandbox service.
- Email/password and optional Google/GitHub OAuth authentication.

The browser’s Live sync indicator reports realtime Yjs synchronization, not a per-edit MongoDB acknowledgement. WebRTC remains a small-room mesh and real-device verification is required before deployment.

## Architecture

```text
Next.js browser
  +-- REST / STOMP ----------------> Spring Boot ----> MongoDB
  |                                      |
  |                                      +----------> Redis quotas
  |                                      +----------> AI providers
  |                                      `----------> remote execution engine
  +-- Yjs WebSocket ---------------> sync service --> Spring internal API/MongoDB
  |                                      `----------> Redis Pub/Sub + recovery
  `-- WebRTC media <--------------------------------> other browsers
```

MongoDB is the durable collaborative-document authority. Redis supports multi-process live convergence and temporary recovery; it is not treated as the durable commit. See:

- [Architecture](ARCHITECTURE.md)
- [Collaboration persistence](COLLABORATION_PERSISTENCE.md)
- [Security review](SECURITY_REVIEW.md)
- [Manual testing guide](MANUAL_TESTING_GUIDE.md)
- [Changelog](CHANGELOG.md)

`Analysis.md` is the historical baseline audit and may describe defects fixed on this branch. `Futurefeature.md` contains remaining work rather than current guarantees.

## Repository layout

```text
backend/        Spring Boot API, persistence, STOMP, AI and execution gateways
frontend/       Next.js application, Monaco/Yjs, Zustand and WebRTC UI
sync-service/   Authenticated y-websocket server and snapshot lifecycle
docker-compose.yml
```

## Requirements

- Java 21
- Node.js 20+ and npm
- MongoDB
- Redis 7/8
- Docker Compose (recommended for local integration)

AI and remote code execution require external services. CodeCollab does not execute untrusted code inside the backend container.

## Configuration

Copy the template and replace every placeholder secret:

```bash
cp .env.example .env
```

Required:

- `MONGODB_URI`
- `JWT_SECRET` — at least 32 random bytes, identical in backend and sync service
- `SERVICE_JWT_SECRET` — a separate high-entropy internal-service credential

Local public endpoints default to:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_SYNC_WS_URL=ws://localhost:1234
NEXT_PUBLIC_STOMP_WS_URL=ws://localhost:8080/api/v1/ws
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
REFRESH_COOKIE_SECURE=false
```

For production use HTTPS/WSS URLs, exact origins and `REFRESH_COOKIE_SECURE=true`. The `NEXT_PUBLIC_*` values are compiled into the frontend. TURN credentials placed there are public; use short-lived or restricted credentials.

Optional groups in `.env.example` cover OAuth, AI providers, document flush/recheck intervals, TURN and the remote execution engine. No provider key rotation is implemented or recommended to evade quotas.

## Run with Docker Compose

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080/api/v1`
- Sync service: `ws://localhost:1234/sync`
- Redis: `localhost:6379`

Follow collaboration logs with:

```bash
docker compose logs -f backend sync-service
```

Compose enables Redis AOF with `appendfsync everysec`. MongoDB remains external through `MONGODB_URI`.

## Run services directly

Use separate terminals:

```bash
docker compose up -d redis
```

```bash
cd backend
./gradlew bootRun
```

```bash
cd sync-service
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

## Build and checks

```bash
cd backend && ./gradlew compileJava
cd sync-service && npm run build
cd frontend && npm run lint
```

Additional repository scripts exist for Gradle, Vitest and Playwright, but the presence of a script is not a claim of comprehensive coverage. Consult the current branch handoff and [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md) for the checks actually performed and the required two-user/media verification.

## Key API and realtime routes

- REST auth: `/api/v1/auth/*`
- Rooms/files: `/api/v1/rooms/*`, `/api/v1/files/*`
- AI: `/api/v1/ai/*`
- Execution: `/api/v1/execution/*`
- STOMP endpoint: `/api/v1/ws`
- Yjs endpoint: sync-service `/sync?roomId=<uuid>&fileId=<uuid>&token=<access-jwt>`

Shared file content is written only through the sync-service snapshot path. Public file PATCH remains available for path/language metadata, but rejects `content` with `COLLABORATIVE_CONTENT_MANAGED_BY_SYNC`.

## Operational limits

- WebRTC mesh bandwidth/CPU grows with every peer; use small rooms.
- The built-in STOMP broker is process-local. Multi-instance backend deployment needs a broker relay or an explicitly single/sticky topology.
- Yjs access revocation is periodically rechecked (30 seconds by default).
- The current protocol does not expose a durable-commit acknowledgement to the browser.
- External AI availability, TURN reachability and execution isolation are operator responsibilities.

## License

See the repository license.
