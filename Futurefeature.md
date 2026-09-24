# CodeCollab Remaining Work

This file lists deferred work after the production-collaboration upgrade. Implemented behavior is documented in `ARCHITECTURE.md` and `CHANGELOG.md`.

## Collaboration durability

- Add automated multi-client protocol tests for concurrent edits, eviction and restart recovery.
- Consider an append-only Yjs update log with snapshot compaction if full-snapshot write amplification becomes material.
- Add an optional client-visible durable-commit acknowledgement distinct from Live sync.
- Replace periodic revocation with a backend-to-sync invalidation channel if sub-30-second revocation is required.

## Realtime scale

- Replace the in-process Spring simple broker with an authenticated broker relay before running multiple backend instances.
- Load-test sync connection admission and add edge/IP limits.
- Introduce an SFU only when measured room size and media quality require it; the present WebRTC mesh is intentionally retained for small rooms.
- Add a server-side TURN credential-minting endpoint for short-lived credentials.

## Workspace

- Persist panel sizing and per-file editor view state.
- Add workspace-wide indexed search and keyboard navigation.
- Add explicit durable-save telemetry once the sync protocol exposes it.
- Expand accessible error/empty/loading states and mobile layout testing.

## AI

- Add provider contract tests and cancellation propagation from HTTP request to provider call.
- Add token-aware context budgeting rather than character-only limits.
- Add account/room usage reporting and cost controls.
- Never rotate API keys to bypass provider quotas. Fallback must use authorized configured providers and respect their limits.

## Execution

- Independently audit the remote engine's container/VM, network, filesystem, output and process limits.
- Add signed request/response correlation and idempotency where supported by the engine.
- Add integration tests for timeout, output truncation and quota failures.

## Quality and security

- Add negative STOMP/Yjs authorization tests, backend repository integration tests and Playwright two-browser collaboration coverage.
- Add dependency/SBOM scanning, SAST, CSP hardening and an external penetration test.
- Replace the static internal service credential with workload identity or mTLS in a zero-trust deployment.
