# 02 — System Architecture

## Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Monaco Editor

**Backend:**
- Spring Boot (Java) — primary backend: auth, REST APIs, room/project/file management, AI gateway, execution orchestration

**Realtime sync engine (CRDT):**
- A focused Node.js microservice running Yjs (`y-websocket` or equivalent), since Yjs is JS-native with no mature Java port. Spring Boot owns everything else; this service owns only document sync state.
- See `06_CRDT_ENGINE.md` and `05_REALTIME_COLLABORATION.md` for why this split exists and how the two services talk to each other.

**Database:**
- MongoDB Atlas — cloud-hosted MongoDB used as the primary database (users, rooms, projects, files, messages, sessions). Atlas provides a managed replica set, enabling full ACID transaction support via Spring Data MongoDB's `MongoTransactionManager`.

**Cache / Pub-Sub:**
- Redis — used for (a) CRDT update fan-out across sync-service instances, (b) session/socket presence state across Spring Boot instances, (c) execution rate limiting, (d) AI response caching

**Realtime transport:**
- WebSocket, using STOMP as the messaging protocol on the Spring Boot side for room/presence/chat/signaling events
- Raw WebSocket (via `y-websocket` protocol) for the dedicated CRDT sync microservice's document-update stream

**Collaboration engine:**
- Yjs (CRDT)

**Code Execution:**
- Remote AWS Execution Engine — all code execution is proxied through the Spring Boot backend to a remote AWS execution engine via REST API. No local Docker container is used for execution.

**Containerization:**
- Docker (services only — no local execution sandbox container)

**Object storage:**
- S3-compatible storage — for larger file/project assets if/when file sizes outgrow comfortable MongoDB document storage

**Deployment:**
- Docker Compose for local/single-host deployment (Redis, sync-service, backend, frontend)
- Kubernetes-ready (manifests can be added later without re-architecting)

## High-level diagram

```
Next.js Frontend
   │  REST (auth, rooms, projects, files, chat, AI, execution)
   ▼
Spring Boot Backend ──────────────► MongoDB Atlas (Cloud)
   │  WS/STOMP (presence, chat, signaling, room events)
   │
   │  proxies AI calls to ──────────► AI Model Gateway ──► Gemini / OpenAI / Claude / DeepSeek
   │
   │  proxies execution to ──────────► AWS Execution Engine (Remote REST API)
   │
Next.js Frontend
   │  WS (Yjs protocol — document sync only)
   ▼
Node.js CRDT Sync Microservice ───► Redis (pub/sub, cross-instance fan-out)
```

## Services in Docker Compose

| Service | Description | Status |
|---|---|---|
| `redis` | Cache, Pub/Sub, presence, rate limiting | ✅ Local container |
| `sync-service` | Yjs CRDT sync engine | ✅ Local container |
| `backend` | Spring Boot REST + WebSocket API | ✅ Local container |
| `frontend` | Next.js app | ✅ Local container |
| `mongodb` | ~~Local MongoDB~~ | ❌ **Removed** — uses Atlas |
| `sandbox-service` | ~~Local code sandbox~~ | ❌ **Removed** — uses AWS engine |

## Why this split (Spring Boot + Node.js sync service)
Gaurav's preference is Spring Boot for the main backend. Yjs (the CRDT library that solves the old project's "naive full-string overwrite" flaw) is JavaScript-native with no equivalent mature Java library. Rather than reimplementing CRDT/OT logic by hand in Java (high effort, high risk of subtle bugs in exactly the area that matters most), the sync engine is isolated into its own small Node.js service. Spring Boot remains the system of record for everything else: auth, persistence, REST APIs, execution orchestration, and the AI gateway.
