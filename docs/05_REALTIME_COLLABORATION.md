# 05 — Realtime Collaboration

## What's being removed
The old project's Socket.io-based "broadcast the entire file content on every keystroke" approach is removed entirely — not patched, replaced.

## New approach
- **WebSocket** as the transport layer
- **STOMP** as the messaging protocol for room-level events handled by Spring Boot (presence, chat, join/leave, video signaling)
- **Yjs (CRDT)** for the actual document state and conflict resolution, handled by the dedicated Node.js sync microservice (see `02_SYSTEM_ARCHITECTURE.md` for why this is a separate service)
- **Redis** for fanning out updates across multiple instances of either service, enabling horizontal scaling

## Event flow
```
User A edits code
      │
      ▼
Yjs generates a delta update (not the whole file)
      │
      ▼
WebSocket → Node.js Sync Service
      │
      ▼
Redis Pub/Sub (broadcasts to all sync-service instances)
      │
      ▼
Other Sync Service Nodes
      │
      ▼
WebSocket → Other Users' Browsers
```

Separately, room-level events (chat messages, user joined/left, video call signaling) flow through Spring Boot via STOMP:
```
User action (chat / join / signal)
      │
      ▼
WebSocket/STOMP → Spring Boot
      │
      ▼
Redis Pub/Sub (if multiple Spring Boot instances)
      │
      ▼
Other Spring Boot Nodes → Connected Users
```

## Why two separate realtime channels instead of one
Document sync (Yjs) is high-frequency, binary-delta traffic that benefits from a purpose-built protocol (`y-websocket`). Room/chat/presence/signaling events are lower-frequency and benefit from STOMP's structured pub/sub semantics already native to Spring. Keeping them separate avoids forcing one protocol to do a job it wasn't designed for.

## See also
- `06_CRDT_ENGINE.md` for the deep technical detail on the CRDT engine itself
- `09_LIVE_CURSORS.md` for how presence/awareness rides on top of this
- `13_REDIS_SCALING.md` for the scaling mechanics in detail
