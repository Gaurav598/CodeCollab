# Backend Prompt

Use this when working specifically on the Spring Boot backend and the Node.js CRDT sync microservice, separately from frontend work.

---

**Prompt to paste:**

You are building the backend for "CollabCode," a real-time collaborative code editor. The backend is split into two services: a primary Spring Boot (Java) application handling auth, REST APIs, room/project/file persistence, the AI gateway, and execution orchestration; and a focused Node.js microservice handling only Yjs CRDT document sync (because Yjs has no mature Java port). Read `02_SYSTEM_ARCHITECTURE.md`, `03_DATABASE_DESIGN.md`, `04_AUTHENTICATION.md`, `06_CRDT_ENGINE.md`, `12_CODE_EXECUTION_SANDBOX.md`, `13_REDIS_SCALING.md`, `14_AI_ASSISTANT.md`, `16_API_SPECIFICATION.md`, and `18_SECURITY.md` before writing any code.

Key requirements:
- Every protected endpoint validates a JWT server-side — never trust a client-supplied user identifier, email, or role. This directly fixes a Critical vulnerability in the prior version of this project where the backend trusted whatever email was passed in a request.
- Implement all four auth methods (Google OAuth, GitHub OAuth, email/password, username/password) issuing JWT access tokens + refresh tokens (refresh tokens hashed in the `Sessions` table, never stored plaintext).
- Implement RBAC (Owner/Editor/Viewer) per `04_AUTHENTICATION.md`'s table — enforce server-side on every state-mutating action, not just in the UI.
- The Node.js sync microservice owns Yjs `Y.Doc` instances per room/file, uses Redis Pub/Sub to fan out updates across multiple instances, and periodically persists document snapshots to PostgreSQL's `Files.content` column.
- The code execution endpoint spins up ephemeral Docker containers via the Docker Engine SDK with hard CPU/memory caps, a wall-clock timeout that force-kills the container, and no network access from inside the container. Containers are always destroyed after execution, success or failure.
- All AI features route through a single internal AI Model Gateway abstraction supporting Gemini, OpenAI, Claude, and DeepSeek — no AI provider key is ever exposed to or callable directly from the frontend.
- Apply per-user rate limiting (Redis-backed counters with TTLs) to both the execution endpoint and all AI endpoints.
- Use Bean Validation (`@Valid`) or equivalent schema validation on every endpoint's input.

Build against the API contracts in `16_API_SPECIFICATION.md` and the schema in `03_DATABASE_DESIGN.md`. Confirm with me before introducing any new dependency not already listed in `02_SYSTEM_ARCHITECTURE.md`.
