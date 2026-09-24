# Changelog

## Unreleased — production collaboration upgrade

This entry describes the uncommitted implementation on `codex/production-collaboration-upgrade`. The starting commit is `494079170c77ca2a680d8635b8401e98386331ba`.

### Recovered and completed from the interrupted implementation

- Integrated Yjs persistence into the actual `y-websocket` lifecycle.
- Added MongoDB Yjs state, collaboration version and update timestamp to files.
- Added protected internal snapshot load and compare-and-swap write APIs.
- Added CRDT conflict merge/retry, debounced and maximum-wait flush, final eviction flush and graceful-shutdown flush.
- Added Redis document fan-out, awareness fan-out and expiring recovery snapshots while retaining MongoDB as durable authority.
- Replaced decoded-only sync JWT trust with cryptographic signature/expiry verification.
- Bound sync authorization to room, file, user and current role; added read-only viewer protocol enforcement and periodic revocation checks.
- Removed frontend shared-file plaintext autosave. Shared content now has one server-owned persistence path.
- Added accurate `connecting`, `syncing`, `live` and `offline` editor states without claiming durable acknowledgement.
- Rotated STOMP and Yjs credentials when the in-memory access token refreshes.

### Collaboration and communication

- Reworked WebRTC sender selection around semantic audio/camera/screen senders and negotiated MIDs instead of transceiver indexes.
- Added queued ICE handling, generation-aware candidate deduplication, bounded queues and initiator ICE restart.
- Added deterministic repeated join/reconnect cleanup and STOMP room rejoin.
- Added independent camera, microphone and screen track replacement/cleanup and device-permission feedback.
- Added optional TURN configuration without embedded service credentials.
- Hardened signaling and media presence with authenticated identities, room/editor checks, event allowlists and payload limits.
- Made presence session-aware so multiple tabs for one user do not cause false leave events.
- Moved approval and direct membership notifications to private user queues.
- Reauthorized room-topic deliveries against current membership and added immediate cooperative-client revocation cleanup.

### Authentication and security

- Preserved HttpOnly refresh-cookie and in-memory access-token architecture.
- Added Origin-based CSRF defense for refresh-cookie auth POST endpoints.
- Rejected wildcard credentialed CORS configuration.
- Removed internal service-secret logging.
- Rejected public plaintext file-content PATCHes with an explicit migration error.
- Added cross-room context-file validation for AI requests.

### Workspace UX

- Added collapsible/resizable workspace sidebar without remounting Monaco.
- Closed tabs when their server-side files disappear.
- Improved realtime connection and permission/device error feedback.

### AI and execution

- Added provider HTTP timeouts, transient error classification, bounded retry/backoff and configured-provider fallback.
- Added Claude's native request/response contract.
- Disabled synthetic local provider responses and return an honest 503 if all providers fail.
- Bounded/sanitized active code, context files and recent conversation context.
- Retained cancellation of superseded frontend autocomplete requests.
- Added Redis-backed AI limits with process-local outage fallback.
- Added execution per-user and per-room quotas with outage fallback, bounded timeouts and native/Piston response handling.
- Kept all code execution remote and return an explicit error when the engine is unconfigured.

### Infrastructure and documentation

- Enabled Redis AOF `everysec` in Compose.
- Corrected container-internal backend and public STOMP URLs.
- Required JWT and internal-service secrets at Compose startup.
- Propagated Yjs, AI, execution, cookie, CORS and optional TURN settings.
- Added architecture, persistence, security and manual verification documents.

### Verification status

Minimal compilation/type validation is recorded in the final handoff and repository history. Real-device media, multi-browser, outage and full end-to-end tests are intentionally left to the manual guide; they must not be inferred from this changelog.
