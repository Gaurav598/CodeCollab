# Security Review

## Scope

This review covers the current browser, Spring Boot, sync-service, STOMP, AI and remote-execution trust boundaries. It records implemented controls and remaining risks; it is not a penetration-test report.

## Authentication

### Browser sessions

- Short-lived access JWTs are returned in response bodies and stored only in JavaScript memory.
- Opaque refresh tokens are stored in an HttpOnly cookie and as SHA-256 hashes in MongoDB session records. Refresh rotates the token; logout revokes it.
- The frontend refreshes shortly before JWT expiry and retries one failed authenticated REST request after a single-flight refresh.
- STOMP reconnects and Yjs providers are recreated when the access token rotates. Logout clears the in-memory token and realtime connections.

### JWT validation

Spring Boot verifies access JWT signatures and expiry through JJWT. The sync service now uses `jsonwebtoken.verify` with the shared HMAC secret and only accepts HMAC algorithms used by the backend (`HS256`, `HS384`, `HS512`), requires `sub` and `exp`, and checks expiration before authorization.

Issuer and audience are not emitted by the current backend, so neither service validates them. Introducing them must be an atomic issuer-and-consumer migration.

### Refresh-cookie CSRF and CORS

Spring CSRF tokens remain disabled because general state-changing APIs are authenticated with a Bearer access token rather than ambient cookies. POSTs that create, rotate or revoke the refresh cookie (`login`, `register`, `refresh`, `logout`) pass through explicit Origin validation. Credentialed CORS rejects wildcard origin configuration and uses the exact `ALLOWED_ORIGINS` list.

Set `REFRESH_COOKIE_SECURE=true` behind HTTPS. Keep `FRONTEND_URL` and `ALLOWED_ORIGINS` exact; do not add `*`.

## Internal service authentication

`/internal/**` requires a separate static Bearer credential, compared in constant time. The sync service sends `Authorization: Bearer <SERVICE_JWT_SECRET>`. The value is never intentionally logged and Compose requires it.

Despite the historical class name `ServiceJwtFilter`, this credential is not a JWT. It should be a high-entropy independent secret. Rotate it through the deployment secret manager. For a multi-tenant or zero-trust deployment, replace it with short-lived workload identity or mTLS.

## Room and file authorization

- REST file operations load the file first and derive its room; caller-provided room IDs do not grant access.
- Yjs admission validates the exact room, file and authenticated user tuple. A mismatched room/file returns forbidden.
- Pending members cannot read room data. Viewers can read and synchronize but cannot mutate Yjs content.
- Public file PATCH cannot write `content`; the sync service is the sole CRDT/content writer.
- AI requests require membership, require editor for write-intent features, and reject active/context files outside the requested room.
- Execution derives the room from the requested file and requires editor before dispatch.
- File/room deletion and member removal invalidate active Yjs access on periodic recheck. Private membership messages immediately clean up cooperative clients.

## Yjs WebSocket security

- The JWT is signature/expiry checked before backend authorization.
- The document name is built from the validated file ID, not arbitrary URL path input.
- Viewers can send awareness and state-vector queries. Sync-step-2 is ignored and document updates close the socket.
- Active access is rechecked every `AUTHORIZATION_RECHECK_MS`.
- Snapshot loads/writes use protected internal APIs and include room ownership in compare-and-swap.
- State and projection sizes are bounded server-side.

Remaining risk: browser WebSockets cannot attach custom upgrade headers, so the access JWT is in the query string. Reverse proxies, APM tools and access logs must redact `token`. A future short-lived, single-purpose WebSocket ticket would reduce exposure.

## STOMP security

- CONNECT requires a valid Bearer access token.
- SUBSCRIBE accepts only authorized `/topic/room.<uuid>...` or the caller's resolved `/user/queue/...` destinations.
- Clients cannot SEND directly to `/topic` or `/queue`; application destinations must pass message handlers.
- Room-topic outbound delivery resolves the recipient STOMP session back to its authenticated user and revalidates membership. Revoked subscribers do not continue receiving room data.
- Chat, presence and signaling handlers derive sender identity from the authenticated Principal.
- WebRTC signaling validates room, sender, target, editor roles, signal type, target-not-self and payload size.
- Media presence validates editor role and allowlisted event types. Client-supplied `userId` is ignored.
- Presence tracks multiple sessions per user, preventing another tab from being incorrectly signed out of presence.

The built-in simple broker is suitable for a single backend process. A production multi-instance deployment needs a secured broker relay and equivalent destination authorization.

## AI

- Provider credentials are backend-only.
- Context files must belong to the authorized room.
- Prompt inputs are bounded and redact common secret/JWT/private-key patterns. Redaction is defense-in-depth, not a guarantee that arbitrary secrets will be recognized.
- User and feature rate limits are Redis-backed with per-process fallback during Redis failure.
- Only configured providers are used; providers receive bounded retries for transient failures. The disabled local adapter cannot masquerade synthetic text as model output.
- Provider failures return a clear 503 after the configured chain is exhausted.

Model prompt injection and provider data-retention policies remain external risks. Do not send sensitive repositories to a provider unless its terms and account configuration are acceptable.

## Code execution

- Source is never executed by the Spring Boot application.
- File membership/editor authorization happens before dispatch.
- Source is limited to 64 KiB and stdin to 8 KiB; languages are allowlisted.
- Per-user and per-room minute quotas are applied, with local fallback when Redis is unavailable.
- Requested run/compile timeout is bounded by server configuration and the HTTP client has a finite read timeout.
- Engine credentials remain server-side and an unconfigured engine returns an explicit error.

The external engine is the actual isolation boundary. It must enforce container/VM isolation, CPU/memory/process/file/network limits, image provenance, output limits and cleanup. This repository cannot attest to those controls.

## Credentials and production configuration

- Compose fails early if `JWT_SECRET` or `SERVICE_JWT_SECRET` is absent.
- Never reuse the two secrets or commit real values.
- TURN variables are compiled into frontend JavaScript and are therefore public. Use time-limited TURN credentials or a narrowly restricted TURN account.
- Use `https://` and `wss://` public URLs in production.
- MongoDB, Redis, provider and execution endpoints should be private/TLS protected and authenticated.
- Avoid logging request URLs on the sync-service ingress unless query parameters are redacted.

## Remaining concerns

1. No automated adversarial WebSocket/security suite is included in this continuation.
2. Yjs revocation has a configurable polling delay (30 seconds by default).
3. The static internal service credential lacks per-request expiry/audience.
4. No global rate limiter protects sync-service upgrade attempts; deploy edge connection/IP limits.
5. The simple STOMP broker and in-process fallback quotas are instance-local.
6. TURN credentials are public by browser design unless a credential-minting endpoint is added.
7. External execution isolation and AI-provider behavior require independent vendor/infrastructure review.
8. A formal CSP, dependency audit, SAST/DAST run and penetration test were not performed in this implementation pass.
