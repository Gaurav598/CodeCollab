# 22 — Resume Points

Draft bullets to refine once the implementation is actually complete — treat these as placeholders shaped by the spec, not verified claims about finished work. Update specifics (exact latency numbers, exact tech versions used) only after they're true of the real, built system.

## Draft bullets
- Architected and built a real-time collaborative code editor supporting conflict-free concurrent editing for multiple users via CRDT (Yjs), eliminating race conditions and data loss present in a naive full-document-broadcast approach.
- Designed a distributed, horizontally-scalable backend (Spring Boot + Node.js sync microservice + Redis pub/sub) supporting multi-instance deployment without loss of real-time consistency.
- Implemented a secure, sandboxed code execution engine using the Docker Engine SDK, enforcing per-container CPU/memory/timeout limits and network isolation for untrusted user code.
- Built a multi-provider AI gateway abstracting Gemini, OpenAI, Claude, and DeepSeek behind a single internal interface, powering 8 distinct AI-assisted developer features (autocomplete, chat, refactoring, bug detection, code review, test generation, documentation generation, code explanation).
- Implemented JWT-based authentication with refresh-token rotation across four auth methods (Google OAuth, GitHub OAuth, email/password, username/password), with server-side RBAC enforcement (Owner/Editor/Viewer) closing a previously identified critical authorization vulnerability.
- Designed and implemented WebRTC-based video/voice calling with screen sharing, signaled over the application's existing WebSocket/STOMP channel.

## Note
Several of these claims (e.g. "sub-50ms latency") were aspirational targets in the original vision doc (`00_PROJECT_VISION.md`) — only put a specific number on a resume once it's been measured against the actual built system, not the target.
