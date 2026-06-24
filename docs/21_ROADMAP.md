# 21 — Roadmap

## Phase 1 — Foundation + Auth
- Scaffold Next.js frontend, Spring Boot backend, PostgreSQL, Redis.
- Implement all four auth methods (Google, GitHub, email/password, username/password) with JWT + refresh tokens.
- Implement RBAC (Owner/Editor/Viewer) at the data-model and middleware level.
- See: `04_AUTHENTICATION.md`, `03_DATABASE_DESIGN.md`, `18_SECURITY.md`

## Phase 2 — Realtime Core (CRDT Sync Engine)
- Stand up the Node.js Yjs sync microservice.
- Integrate Monaco Editor + `y-monaco` binding in the frontend.
- Implement Redis pub/sub fan-out for multi-instance sync.
- Implement live cursors / Awareness Protocol.
- This is the heart of the product — do not proceed to later phases until two clients can co-edit conflict-free.
- See: `06_CRDT_ENGINE.md`, `05_REALTIME_COLLABORATION.md`, `07_MONACO_EDITOR.md`, `09_LIVE_CURSORS.md`, `13_REDIS_SCALING.md`

## Phase 3 — Workspace + Rooms
- Room creation/join/leave/permissions.
- Multi-file workspace (file tree, tabs, CRUD).
- See: `08_ROOM_MANAGEMENT.md`, `15_MULTI_FILE_WORKSPACE.md`

## Phase 4 — Execution Sandbox
- Docker-based ephemeral execution containers with resource limits and timeouts.
- Per-user rate limiting on the run endpoint.
- See: `12_CODE_EXECUTION_SANDBOX.md`

## Phase 5 — AI Assistant
- Build the AI Model Gateway (multi-provider abstraction).
- Implement all 8 AI features (autocomplete, chat, refactor, bug detection, explanation, review, test generation, doc generation).
- Reuse rate-limiting infrastructure from Phase 4.
- See: `14_AI_ASSISTANT.md`

## Phase 6 — Communication
- Chat system (with history, mentions, emoji, notifications).
- Video/voice call + screen sharing via WebRTC.
- See: `10_CHAT_SYSTEM.md`, `11_VIDEO_CALL_SYSTEM.md`

## Phase 7 — UI/UX Polish
- Apply the full design system (Tailwind + shadcn/ui) across all screens.
- Build the Antigravity-style editor workspace layout and the industry-grade landing/login screen.
- Can be done incrementally alongside earlier phases instead of strictly last, depending on how Gaurav wants to pace the work.
- See: `17_FRONTEND_UI_UX.md`

## Phase 8 — DevOps + Testing Hardening
- Full Docker Compose setup, CI/CD via GitHub Actions, Kubernetes-readiness pass.
- Backfill test coverage per the priority order in `20_TESTING_STRATEGY.md` if not already done alongside each phase.
- See: `19_DEVOPS_DEPLOYMENT.md`, `20_TESTING_STRATEGY.md`

## Why this order
Auth gates everything else, so it's first. The CRDT sync engine is the core value proposition and the most technically risky piece, so it comes second, before any "nice to have" feature work, to validate the hardest problem early. Execution and AI build on patterns (rate limiting, gateway abstraction) that benefit from being designed once and reused. UI polish is positioned to happen last (or in parallel) so it isn't repeatedly redone as underlying functionality changes.
