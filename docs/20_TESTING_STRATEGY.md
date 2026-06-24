# 20 — Testing Strategy

## Current state
The old project had no unit tests, no integration tests, and no E2E tests (only the default unused CRA `App.test.js`).

## Required testing layers

### Backend (Spring Boot)
- **JUnit** for unit tests on service/business logic (auth flows, RBAC checks, room/file CRUD logic).
- **Mockito** for mocking dependencies (database, Redis, AI gateway, Docker SDK) in unit tests.
- **Integration tests** for REST endpoints (e.g. using Spring's test slices / `@SpringBootTest` with a test database) — particularly critical for the auth and security-sensitive endpoints flagged in `18_SECURITY.md`.

### Sync microservice (Node.js)
- Unit tests for the Yjs/CRDT integration logic and Redis fan-out behavior — at minimum, a test simulating two concurrent clients editing the same document and asserting both edits are present in the final state (directly testing the acceptance criteria in `06_CRDT_ENGINE.md`).

### Frontend / E2E
- **Playwright** for end-to-end tests covering critical user flows: login (all three methods), room creation/joining, basic collaborative editing between two simulated clients, running code, sending a chat message.

## Priority order for test coverage
1. Auth + RBAC (highest risk area, given the old project's Critical vulnerability here)
2. CRDT conflict resolution (the core value proposition of the rebuild)
3. Execution sandbox isolation and resource limits
4. Everything else, as time allows
