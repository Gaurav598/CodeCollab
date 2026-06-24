# 13 — Redis Scaling

## Current state (old project)
Single Node.js instance, with Socket.io room/user state held entirely in memory (`userSocketMap`). This means the app cannot run more than one backend instance — there is no shared state between instances, so users connected to different instances couldn't see each other.

## Target state: distributed, Redis-backed

### What Redis is used for
1. **CRDT update fan-out** — when the Node.js sync microservice (`06_CRDT_ENGINE.md`) runs as multiple instances, Redis Pub/Sub broadcasts Yjs updates from whichever instance received them to all other instances, so users land on any instance and still see each other's edits.
2. **Spring Boot session/socket state** — similarly, if Spring Boot runs as multiple instances behind a load balancer, Redis holds shared presence/room-membership state so STOMP messages (chat, signaling, join/leave events) reach users regardless of which instance they're connected to.
3. **AI response caching** — short-lived cache of recent AI completion requests (see `14_AI_ASSISTANT.md`) to reduce redundant calls to the underlying model provider.
4. **Rate limiting counters** — per-user request counters for execution and AI endpoints (see `12_CODE_EXECUTION_SANDBOX.md`, `14_AI_ASSISTANT.md`) are naturally implemented as Redis-backed counters with TTLs, which also makes rate limits consistent across multiple backend instances.

### Mechanism
- **Redis Pub/Sub** for the fan-out patterns above (CRDT updates, presence events).
- A **Redis adapter** pattern (conceptually similar to the `@socket.io/redis-adapter` idea from the original analysis, adapted to whichever WebSocket/STOMP library is used) so that broadcasting "to a room" transparently reaches users on any instance.

## Acceptance criteria
- Running two instances of the sync microservice locally (pointed at the same Redis), with User A connected to instance 1 and User B connected to instance 2, both in the same room: edits from A appear for B and vice versa.
- Killing one instance does not disconnect users permanently — they reconnect (e.g. via load balancer or client retry logic) to a surviving instance and continue syncing.
