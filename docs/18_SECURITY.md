# 18 — Security

## Flaws in the current project (must all be fixed, not just acknowledged)

| Severity | Issue | Old behavior |
|---|---|---|
| Critical | No backend auth verification | Firebase Auth was frontend-only; `/api/save-code`, `/api/saved-codes/:userEmail`, `/api/delete-code/:id` trusted whatever email/id was passed in the request, with no server-side token check. Anyone could read, overwrite, or delete any user's data. |
| High | API key exposure | Gemini API key shipped in the frontend bundle (`REACT_APP_GEMINI_API_KEY`), extractable via DevTools. |
| Medium | No rate limiting | `/api/execute` had no protection against being hammered, risking quota drain or server crash. |
| Low | Weak input validation | No schema validation library in use; basic assumptions like `userEmail.trim()` without deeper checks. |

## Required fixes (mapped to where they land in the new architecture)
- **JWT validation** on every protected REST endpoint and WebSocket/STOMP connection — see `04_AUTHENTICATION.md`.
- **OAuth verification** server-side for Google and GitHub flows — never trust a client-asserted identity from an OAuth provider without validating the token/code server-side.
- **Rate limiting** on `/execution/*` and `/ai/*` specifically, backed by Redis counters — see `12_CODE_EXECUTION_SANDBOX.md`, `14_AI_ASSISTANT.md`, `13_REDIS_SCALING.md`.
- **Redis-backed session store** for distributed session/socket state — see `13_REDIS_SCALING.md`.
- **Input validation** on every endpoint (Spring's Bean Validation / `@Valid`, or equivalent schema validation in the Node.js sync service).
- **XSS protection** — sanitize any user-generated content rendered as HTML (chat messages, AI-generated content shown in the UI); rely on React/Next.js's default escaping and avoid `dangerouslySetInnerHTML` unless content is explicitly sanitized first.
- **CSRF protection** — since refresh tokens are stored in httpOnly cookies (per `04_AUTHENTICATION.md`), standard CSRF mitigations apply (SameSite cookie attributes, CSRF tokens on state-changing requests where appropriate).
- **Docker isolation** for code execution — see `12_CODE_EXECUTION_SANDBOX.md` for the full resource-limit and network-isolation requirements.

## General principles carried through the whole system
- Never trust a client-supplied identity, role, or permission claim — always re-derive and re-check server-side.
- No secret/API key of any kind (AI provider keys, OAuth client secrets) is ever present in frontend code or a frontend-served bundle.
- Every endpoint that consumes shared, costly resources (compute for execution, tokens for AI calls) is rate-limited per user, not just globally.
