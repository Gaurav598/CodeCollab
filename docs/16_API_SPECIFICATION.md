# 16 — API Specification

Full endpoint surface, grouped by domain. Each group below should be fleshed out with exact request/response JSON shapes and error codes as implementation proceeds — this file defines scope and structure; exact payloads get filled in alongside the corresponding feature build (per `21_ROADMAP.md`'s phase order).

## `/auth/*`
- `POST /auth/register` — email/username + password signup
- `POST /auth/login` — email/username + password login
- `POST /auth/password-reset-request` — request a password reset email
- `POST /auth/password-reset` — confirm new password using token
- `GET /auth/google` / `GET /auth/google/callback` — Google OAuth flow
- `GET /auth/github` / `GET /auth/github/callback` — GitHub OAuth flow
- `GET /auth/me` — restore current session from the httpOnly refresh cookie and return authenticated user + access token
- `POST /auth/refresh` — exchange refresh token for new access token
- `POST /auth/logout` — revoke current session/refresh token

OAuth callbacks are handled by the backend. The backend validates the provider response, sets the httpOnly refresh cookie, and redirects to `/auth/success`; the frontend then calls `/auth/me` to restore the session.

## `/rooms/*`
- `POST /rooms` — create room
- `GET /rooms/:roomCode` — fetch room details (membership-gated for private rooms)
- `POST /rooms/:roomCode/join` — join a room
- `POST /rooms/:roomCode/leave` — leave a room
- `PATCH /rooms/:roomCode/members/:userId` — change a member's role (Owner only)
- `DELETE /rooms/:roomCode/members/:userId` — remove a member (Owner only)
- `DELETE /rooms/:roomCode` — delete a room (Owner only; cascades to projects, files, messages, and members)

## `/projects/*`
- `POST /projects` — create project within a room
- `GET /projects/:projectId` — fetch project + file tree
- `DELETE /projects/:projectId` — delete project (Owner only)

## `/files/*`
- `POST /files` — create file
- `GET /files/:fileId` — fetch file content (snapshot — live state comes from the sync service while a room is active)
- `PATCH /files/:fileId` — rename/move file
- `DELETE /files/:fileId` — delete file

## `/chat/*`
- `GET /chat/:roomId/history` — fetch message history (paginated)
- (Live message sending happens over WebSocket/STOMP, not REST — see `05_REALTIME_COLLABORATION.md`)

## `/ai/*`
- `POST /ai/autocomplete` — inline completion request
- `POST /ai/chat` — conversational assistant
- `POST /ai/refactor` — refactor suggestion for a selection
- `POST /ai/detect-bugs` — bug detection for a file/selection
- `POST /ai/explain` — code explanation
- `POST /ai/review` — code review
- `POST /ai/generate-tests` — test generation
- `POST /ai/generate-docs` — documentation generation

## `/execution/*`
- `POST /execution/run` — execute code in the sandbox, returns stdout/stderr/exit code

Supported execution languages for v1: Java, C++, Python, JavaScript, TypeScript, Go.

## `/internal/*`
- `PUT /internal/files/:fileId/content` — sync service flushes CRDT snapshots to PostgreSQL using service-to-service JWT authentication

## Cross-cutting requirements for every endpoint above
- JWT required (except the initial auth endpoints themselves and OAuth callback redirects)
- RBAC checked where relevant (see `04_AUTHENTICATION.md`)
- Consistent error response shape (e.g. `{ "error": { "code": "...", "message": "...", "details": {} } }`)
- Rate limiting applied to `/execution/*` and `/ai/*` specifically (see `12_CODE_EXECUTION_SANDBOX.md`, `14_AI_ASSISTANT.md`)
