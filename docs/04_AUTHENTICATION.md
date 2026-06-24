# 04 — Authentication

## OAuth Providers
- Google
- GitHub

## Traditional Auth
- Username + Password
- Email + Password
- Password Reset (Request reset link + Confirm new password)

## Security
- JWT access tokens (short-lived, e.g. 15 min)
- Refresh tokens (longer-lived, stored hashed in the `Sessions` table, rotatable)
- Password hashing via BCrypt
- Every protected REST endpoint and every WebSocket handshake validates the JWT before proceeding — this directly closes the old project's Critical vulnerability where the backend trusted a client-supplied email/userId with zero verification

## RBAC (Role-Based Access Control)
Three roles, scoped per room via the `Room Members` table:

| Role | Can edit code | Can run code | Can manage room (invite/kick/change roles) | Can delete project/files |
|---|---|---|---|---|
| **Owner** | Yes | Yes | Yes | Yes |
| **Editor** | Yes | Yes | No | No |
| **Viewer** | No (read-only) | No | No | No |

- Room creator is automatically `Owner`.
- Owner can promote/demote other members between Editor/Viewer, and transfer ownership.
- RBAC checks happen server-side on every relevant REST call and every WebSocket message that mutates state (e.g. a Viewer's edit events are rejected even if their client UI somehow allowed typing).

## Token flow
1. User authenticates via any of the four methods above.
2. For OAuth, the backend callback exchanges the provider auth code, validates the provider identity server-side, finds/creates the user, sets the refresh token as an httpOnly cookie, and redirects the browser to `/auth/success`.
3. On `/auth/success`, the frontend restores the session by calling `/auth/me`; if the refresh cookie is valid, the backend returns the authenticated user and a fresh access token.
4. For email/username + password login, the backend issues a JWT access token and sets the refresh token as an httpOnly cookie directly in the login response.
5. Frontend stores the access token in memory and relies on the refresh token in the httpOnly cookie (avoid localStorage for tokens — reduces XSS token-theft risk, ties into `18_SECURITY.md`).
6. Access token is sent as `Authorization: Bearer <token>` on REST calls and attached during the WebSocket handshake (STOMP CONNECT frame header or query param, validated before the connection is accepted).
7. When the access token expires, frontend silently exchanges the refresh token for a new access token; if the refresh token is also expired/revoked, user is redirected to login.

## OAuth callback handoff
- `GET /auth/google/callback` and `GET /auth/github/callback` are backend-owned callbacks.
- The backend validates the provider response; the frontend never asserts OAuth identity directly.
- On success, the backend creates/rotates the server-tracked session, stores the hashed refresh token in `Sessions`, sets the `refreshToken` httpOnly cookie, and redirects to `/auth/success`.
- The frontend route `/auth/success` calls `GET /auth/me` to restore the authenticated user and receive an in-memory access token.

## See also
- `18_SECURITY.md` for the full list of related protections (rate limiting, input validation, etc.)
- `16_API_SPECIFICATION.md` for the exact `/auth/*` endpoint contracts
