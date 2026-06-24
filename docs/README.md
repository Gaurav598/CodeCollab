# CollabCode — Documentation

This is the complete, merged specification for the CollabCode rebuild — combining the original project analysis, Gaurav's personal upgrade requests, the AI-generated architecture roadmap, and a 23-file structured documentation set. Nothing from any of the source lists has been dropped.

## File Index

| File | Purpose |
|---|---|
| `00_PROJECT_VISION.md` | What this project is and why it exists |
| `01_PRODUCT_REQUIREMENTS.md` | Complete feature list |
| `02_SYSTEM_ARCHITECTURE.md` | Full tech stack and service architecture |
| `03_DATABASE_DESIGN.md` | PostgreSQL schema |
| `04_AUTHENTICATION.md` | Auth methods, JWT/refresh flow, RBAC |
| `05_REALTIME_COLLABORATION.md` | WebSocket/STOMP/Yjs/Redis overview |
| `06_CRDT_ENGINE.md` | **Most important file** — the CRDT sync engine deep dive |
| `07_MONACO_EDITOR.md` | Editor feature requirements |
| `08_ROOM_MANAGEMENT.md` | Room create/join/permissions |
| `09_LIVE_CURSORS.md` | Presence and cursor sharing |
| `10_CHAT_SYSTEM.md` | Realtime chat |
| `11_VIDEO_CALL_SYSTEM.md` | WebRTC video/voice/screen share |
| `12_CODE_EXECUTION_SANDBOX.md` | **Second most important file** — Docker execution sandbox |
| `13_REDIS_SCALING.md` | Horizontal scaling mechanics |
| `14_AI_ASSISTANT.md` | All 8 AI features + multi-model gateway |
| `15_MULTI_FILE_WORKSPACE.md` | VS Code-style file tree/tabs |
| `16_API_SPECIFICATION.md` | Every REST endpoint |
| `17_FRONTEND_UI_UX.md` | **Antigravity/Linear/Cursor/Vercel design direction** |
| `18_SECURITY.md` | All security fixes, mapped from old project's flaws |
| `19_DEVOPS_DEPLOYMENT.md` | Docker/CI-CD/Kubernetes-readiness |
| `20_TESTING_STRATEGY.md` | Test coverage plan |
| `21_ROADMAP.md` | Build phase order |
| `22_RESUME_POINTS.md` | Draft resume bullets (verify after building, not before) |
| `23_PROJECT_STRUCTURE.md` | Initial directory layout |
| `24_CODING_STANDARDS.md` | Conventions and rules |
| `25_DEPENDENCY_LOCK.md` | Core dependency versions |
| `26_ENVIRONMENT_VARIABLES.md` | Required .env variables |
| `27_ACCEPTANCE_CHECKLIST.md` | Comprehensive testing checklist |
| `28_NON_FUNCTIONAL_REQUIREMENTS.md` | Performance and reliability limits |
| `29_ERROR_HANDLING.md` | Global error formats |
| `30_AI_AGENT_INSTRUCTIONS.md` | Custom instructions for coding agents |
| `31_REQUEST_RESPONSE_CONTRACTS.md` | Full HTTP JSON payloads and status codes |
| `32_FRONTEND_STATE_MANAGEMENT.md` | Zustand and React Query approach |
| `33_LANGUAGE_SUPPORT_MATRIX.md` | Supported sandbox languages |
| `34_WEBRTC_NETWORKING.md` | Video/Voice call connection flows |
| `35_IMPLEMENTATION_PROGRESS.md` | Active phase and progress tracking |
| `36_HANDOFF_LOG.md` | Session-to-session handover notes |
| `37_REALTIME_EVENT_CONTRACTS.md` | STOMP/WebSocket payloads |
| `diagrams/architecture.mmd` | System architecture diagram |
| `diagrams/database.mmd` | ER diagram |
| `diagrams/auth-flow.mmd` | Auth sequence diagram |
| `diagrams/crdt-flow.mmd` | CRDT sync sequence diagram |
| `diagrams/execution-flow.mmd` | Code execution sequence diagram |
| `prompts/full-build-prompt.md` | One mega-prompt covering everything |
| `prompts/frontend-prompt.md` | Frontend-only build prompt |
| `prompts/backend-prompt.md` | Backend-only build prompt |
| `prompts/devops-prompt.md` | Infra-only build prompt |

## How to use this with an AI coding agent

**Option A — single prompt:** Use `prompts/full-build-prompt.md`, attaching or pasting this whole `docs/` folder. Simplest, but the AI is juggling the entire scope at once — quality may suffer on any single phase.

**Option B — phased (recommended):** Feed `00` and `02` once for context, then work through `21_ROADMAP.md`'s phases in order, using the matching prompt from `prompts/` for whichever layer (frontend/backend/devops) that phase touches.

## Decisions that were locked to make this buildable (confirm or override anytime)
- **Backend split:** Spring Boot for everything except CRDT sync, which lives in a small Node.js microservice (Yjs has no mature Java port).
- **RBAC:** Owner/Editor/Viewer roles, enforced server-side.
- **Multi-file workspace:** in scope for v1, not backlog.
- **AI scope:** all 8 features + multi-provider gateway (Gemini/OpenAI/Claude/DeepSeek), not just autocomplete.
- **UI reference:** Antigravity's Manager/Editor View structural split (focused workspace + dedicated AI panel) for the editor screen; Linear/Cursor/Vercel-level polish for the landing/login screen. Exact pixel-level Antigravity values weren't independently verifiable from public material — only the structural/interaction pattern is — so match exact colors by reviewing the live product directly if pixel-perfect matching matters.
- **AI quota/rate-limit handling:** solved via server-side proxying + caching + debouncing, not by circumventing any provider's rate limits — that approach was deliberately not specified anywhere in this doc set.
