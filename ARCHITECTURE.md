# CodeCollab Architecture

This document describes the implementation on `codex/production-collaboration-upgrade`. It is an operational description, not a target-state diagram.

## Components

| Component | Responsibilities | State it owns |
| --- | --- | --- |
| Next.js frontend | Authentication bootstrap, Monaco/Yjs binding, workspace UI, chat, presence, WebRTC media, AI and execution clients | In-memory access token, Zustand UI state, browser media tracks, one Y.Doc/provider per open file |
| Spring Boot backend | Users, refresh sessions, rooms, membership/RBAC, file metadata, durable collaboration snapshots, STOMP, AI gateway, execution gateway | MongoDB records and Redis-backed quotas |
| Sync service | Authenticated Yjs WebSockets, read-only enforcement, Redis document fan-out, snapshot load/flush/recovery | Active Y.Docs, pending flush metadata, temporary recovery cache |
| MongoDB | Durable source of truth | Users, refresh sessions, rooms, memberships, files, Yjs snapshots and versions |
| Redis | Realtime fan-out and recoverability during transient failures | Yjs Pub/Sub, awareness Pub/Sub, expiring recovery snapshots, rate counters |
| Browser peers | Audio, camera and screen media | WebRTC mesh peer connections |
| External AI providers | Model inference | Provider-controlled |
| External execution engine | Isolated untrusted-code execution | Engine-controlled sandbox state |

## Request and realtime topology

```text
Browser
  |-- HTTPS + Bearer access token ----------------------> Spring Boot
  |      refresh cookie is sent only to auth endpoints       |-- MongoDB
  |                                                          `-- Redis quotas
  |-- STOMP /api/v1/ws + Bearer CONNECT ----------------> Spring Boot
  |      chat, presence, membership, WebRTC signaling
  |
  |-- Yjs WebSocket /sync?roomId&fileId&token ----------> Sync service
         CRDT updates and awareness                            |-- internal authenticated API --> Spring Boot --> MongoDB
                                                              `-- Redis Pub/Sub + recovery cache

Browser <------------------------ WebRTC media ------------------------> Browser
```

The Yjs access token is carried in the WebSocket URL because the browser WebSocket API and `y-websocket` cannot attach an Authorization header to the upgrade. URLs containing query strings must therefore be redacted by proxies and observability systems.

## Login-to-recovery lifecycle

1. Login creates a hashed refresh-session record and an HttpOnly refresh cookie. The short-lived access JWT is returned to the frontend and kept only in memory.
2. The frontend schedules access-token refresh before expiry. REST, STOMP and Yjs connections rotate to the new access token.
3. Room creation creates the room and an owner membership. A second user joins as `pending`; approval is delivered on a private user queue.
4. The room page loads file metadata. Opening a file creates a Y.Doc and connects to the sync service with room, file and access token.
5. The sync service verifies the JWT signature/expiry, then asks the backend to validate the exact `(roomId, fileId, userId)` tuple and returns the current role.
6. The sync service loads the MongoDB Yjs snapshot, merges any newer Redis/in-process recovery state, attaches Redis Pub/Sub and only then admits the WebSocket to the document.
7. Monaco edits produce Yjs updates. They are sent to peers immediately and flushed as a full Yjs state update after a debounce, with a maximum wait.
8. MongoDB updates use compare-and-swap on `collaboration_version`. A losing sync node loads the winner, CRDT-merges it and retries.
9. Closing the final connection triggers a final flush before the document binding is evicted. Graceful service shutdown also flushes active documents before closing sockets.
10. Reopening or restarting loads the committed MongoDB snapshot. If MongoDB is temporarily unavailable, an existing Redis recovery snapshot can reopen the document; it is later reconciled through compare-and-swap.

See [COLLABORATION_PERSISTENCE.md](COLLABORATION_PERSISTENCE.md) for failure and version details.

## Authentication and authorization

- Access tokens are HMAC-signed JWTs. The backend and sync service use the same `JWT_SECRET`; the sync service cryptographically verifies the signature and expiration before using `sub`.
- Refresh tokens are opaque, rotated, hashed in MongoDB and carried in an HttpOnly cookie. Cookie-mutating auth POSTs validate browser `Origin` against configured origins.
- General APIs use Bearer access tokens. Room services derive authorization from persisted membership, never from client-supplied roles.
- Internal collaboration APIs are protected with a separate static Bearer service credential (`SERVICE_JWT_SECRET`) and are not public user APIs.
- A viewer may receive Yjs state and publish awareness but cannot submit document updates. Editor/owner is required for writes, WebRTC signaling, media presence and code execution.
- STOMP authenticates CONNECT, authorizes subscriptions, blocks direct client SENDs to broker destinations and checks current membership for room-topic deliveries. Server message handlers separately validate sender and target.
- Active Yjs connections are reauthorized periodically. File/room deletion or membership removal closes access on the next check; failed persistence to a deleted resource is treated as permanent and its recovery cache is removed.

## File and workspace model

`FileEntry` stores metadata, a plain-text projection (`content`), the Base64 Yjs snapshot (`yjs_state`), an optimistic version and update time. The text projection is written in the same atomic sync-service snapshot and supports existing reads, AI context and operational inspection. It is not a second writer.

Public file PATCH accepts path and language only. Supplying content returns `COLLABORATIVE_CONTENT_MANAGED_BY_SYNC`, preventing legacy autosave from overwriting CRDT state. The Save Code action remains a separate, explicit personal checkpoint and does not mutate the shared file.

File and room deletion remove their MongoDB records. Workspace events make clients close deleted tabs; active sync sockets are invalidated by reauthorization.

## STOMP, chat and presence

- `/app/room.join` and `/app/room.leave` manage server-derived presence.
- Presence is tracked by room, user and STOMP session so closing one of several tabs does not mark the user offline.
- Room topics are membership protected. Approval and membership-revocation messages also use private `/user/queue/...` destinations.
- The client remembers joined rooms and resends joins after STOMP reconnect. Ephemeral WebRTC signals are deliberately not queued while disconnected.
- Chat continues to use the existing backend service. Its current in-memory/cleanup behavior remains separate from Yjs durability.

## WebRTC

The implementation remains a peer-to-peer mesh. STOMP transports authenticated signaling; media never traverses Spring Boot.

- One deterministic peer initiates each connection, limiting glare and duplicate connections.
- Audio, camera and screen senders are stored semantically. SDP MIDs are exchanged with offers/answers; no transceiver-array indexes are assumed.
- ICE candidates wait until a remote description exists. Dedupe state is scoped by remote ICE username fragment and cleared on a new generation.
- Initiators request ICE restart after a sustained disconnect or failure. STOMP reconnection clears stale peers and reannounces presence.
- Camera, microphone and screen tracks are independently replaced/stopped. Leaving the room closes peers, stops local media and removes listeners/state.
- Google STUN is the default. Optional TURN URLs and credentials are build-time public frontend configuration; use restricted or short-lived credentials.

Mesh cost grows quadratically. The current design is suitable for small rooms, not large conferences. No SFU is included.

## AI gateway

The backend builds sanitized, bounded workspace context only from files in the authorized room. Configured providers are attempted in order. A provider receives at most one bounded retry for transient network, 429 or 5xx failures; HTTP calls have explicit timeouts. If all configured providers fail, the API returns an honest 503. The legacy synthetic local adapter is disabled.

Frontend autocomplete is debounced and aborts superseded requests. Redis rate limits have a bounded in-process fallback when Redis is unavailable. Credentials remain server-side.

## Code execution boundary

Spring Boot does not execute source code locally. It validates language, source/stdin sizes, exact file-derived room access and editor role, then applies per-user and per-room quotas before calling the configured remote engine with bounded timeouts. The remote engine must provide the real container/VM sandbox, process limits, network policy and filesystem isolation. If it is not configured or unavailable, the UI receives an explicit failure.

## Deployment

Docker Compose starts Redis with AOF `everysec`, backend, sync service and frontend. MongoDB and optional provider/execution services are external. Required secrets fail Compose interpolation when absent. For HTTPS deployments set secure cookies, WSS/HTTPS public URLs and exact allowed origins.

The current simple STOMP broker is process-local. Redis distributes Yjs/awareness, but production multi-instance STOMP requires a broker relay or sticky/single backend deployment. See the security and persistence documents for other limits.
