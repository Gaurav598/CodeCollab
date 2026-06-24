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
- PostgreSQL — primary relational store (users, rooms, projects, files, messages, sessions)

**Cache / Pub-Sub:**
- Redis — used for (a) CRDT update fan-out across sync-service instances, (b) session/socket presence state across Spring Boot instances, (c) AI response caching

**Realtime transport:**
- WebSocket, using STOMP as the messaging protocol on the Spring Boot side for room/presence/chat/signaling events
- Raw WebSocket (via `y-websocket` protocol) for the dedicated CRDT sync microservice's document-update stream

**Collaboration engine:**
- Yjs (CRDT)

**Containerization:**
- Docker (used both for deployment and for the code-execution sandbox)

**Object storage:**
- S3-compatible storage — for larger file/project assets if/when file sizes outgrow comfortable PostgreSQL TEXT column storage (start with PostgreSQL for file content; migrate specific large-file paths to S3-compatible storage only if needed)

**Deployment:**
- Docker Compose for local/single-host deployment
- Kubernetes-ready (manifests can be added later without re-architecting)

## High-level diagram
See `diagrams/architecture.mmd` for the full Mermaid diagram. Summary:

```
Next.js Frontend
   │  REST (auth, rooms, projects, files, chat, AI, execution)
   ▼
Spring Boot Backend ──────────────► PostgreSQL
   │  WS/STOMP (presence, chat, signaling, room events)
   │
   │  proxies AI calls to ──────────► AI Model Gateway ──► Gemini / OpenAI / Claude / DeepSeek
   │
   │  invokes ──────────────────────► Docker Execution Sandbox (ephemeral containers)
   │
Next.js Frontend
   │  WS (Yjs protocol — document sync only)
   ▼
Node.js CRDT Sync Microservice ───► Redis (pub/sub, cross-instance fan-out)
```

## Why this split (Spring Boot + Node.js sync service)
Gaurav's preference is Spring Boot for the main backend. Yjs (the CRDT library that solves the old project's "naive full-string overwrite" flaw) is JavaScript-native with no equivalent mature Java library. Rather than reimplementing CRDT/OT logic by hand in Java (high effort, high risk of subtle bugs in exactly the area that matters most), the sync engine is isolated into its own small Node.js service. Spring Boot remains the system of record for everything else: auth, persistence, REST APIs, execution orchestration, and the AI gateway.
