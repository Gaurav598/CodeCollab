# 31 — Request & Response Contracts

This document defines the exact HTTP contracts for all APIs across the system. It serves as the single source of truth for both frontend integration and backend implementation.

## General Rules
- **Base URL:** `/api/v1` (implied for all endpoints below)
- **Content-Type:** `application/json` for all requests and responses (unless specified).
- **Authentication:** `Authorization: Bearer <jwt_token>` required for all endpoints except `/auth/login`, `/auth/register`, `/auth/refresh`, and OAuth flows.
- **Refresh Token:** Handled via `httpOnly` cookies (`refreshToken`).
- **Standard Error Response:**
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "details": {}
    }
  }
  ```

---

## 1. Auth APIs

### OAuth Login and Callback
* **Endpoints:** `/auth/google`, `/auth/google/callback`, `/auth/github`, `/auth/github/callback`
* **HTTP Method:** `GET`
* **Flow:**
  1. Frontend sends the user to `/auth/google` or `/auth/github`.
  2. Backend redirects to the provider consent screen.
  3. Provider redirects back to the backend callback.
  4. Backend exchanges the auth code, validates provider identity server-side, finds or creates the user, creates a server-tracked session, stores the hashed refresh token, sets the `refreshToken` httpOnly cookie, and redirects to `/auth/success`.
  5. Frontend calls `/auth/me` from `/auth/success` to restore the session and receive an access token.
* **Validation Rules:** Frontend never sends or asserts provider identity directly. Provider identity must be validated by the backend callback.

### Register User
* **Endpoint:** `/auth/register`
* **HTTP Method:** `POST`
* **Request Headers:** None
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar_url": null,
      "provider": "local"
    },
    "accessToken": "eyJhbG..."
  }
  ```
* **Error Response JSON:** Standard Error (e.g. `USER_ALREADY_EXISTS`)
* **Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`
* **Validation Rules:**
  - `username`: 3-30 chars, alphanumeric, unique.
  - `email`: Valid email format, unique.
  - `password`: Minimum 8 characters.

### Login User
* **Endpoint:** `/auth/login`
* **HTTP Method:** `POST`
* **Request Headers:** None
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "identifier": "john@example.com", 
    "password": "securepassword123"
  }
  ```
* **Success Response JSON:** Same as Register User.
* **Error Response JSON:** Standard Error (e.g. `INVALID_CREDENTIALS`)
* **Status Codes:** `200 OK`, `401 Unauthorized`, `400 Bad Request`
* **Validation Rules:** `identifier` can be username or email.

### Password Reset Request
* **Endpoint:** `/auth/password-reset-request`
* **HTTP Method:** `POST`
* **Request Headers:** None
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "email": "john@example.com"
  }
  ```
* **Success Response JSON:** `{ "message": "If an account with that email exists, a reset link has been sent." }`
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `400 Bad Request`
* **Validation Rules:** `email` must be a valid email format.

### Password Reset
* **Endpoint:** `/auth/password-reset`
* **HTTP Method:** `POST`
* **Request Headers:** None
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "token": "reset_token_here",
    "newPassword": "newsecurepassword123"
  }
  ```
* **Success Response JSON:** `{ "message": "Password successfully reset." }`
* **Error Response JSON:** Standard Error (e.g. `INVALID_TOKEN`)
* **Status Codes:** `200 OK`, `400 Bad Request`
* **Validation Rules:** `token` must be valid and not expired. `newPassword` minimum 8 characters.

### Refresh Token
* **Endpoint:** `/auth/refresh`
* **HTTP Method:** `POST`
* **Request Headers:** Cookie containing `refreshToken`
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:**
  ```json
  {
    "accessToken": "eyJhbG..."
  }
  ```
* **Error Response JSON:** Standard Error (e.g. `TOKEN_EXPIRED`)
* **Status Codes:** `200 OK`, `401 Unauthorized`
* **Validation Rules:** Valid `httpOnly` refresh token cookie required.

### Logout User
* **Endpoint:** `/auth/logout`
* **HTTP Method:** `POST`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:** `{ "message": "Logged out successfully" }`
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `401 Unauthorized`
* **Validation Rules:** Revokes session in Redis/DB and clears cookies.

### Current User / Restore Session
* **Endpoint:** `/auth/me`
* **HTTP Method:** `GET`
* **Request Headers:** Cookie containing `refreshToken`
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:**
  ```json
  {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "johndoe",
      "email": "john@example.com",
      "avatar_url": null,
      "provider": "local"
    },
    "accessToken": "eyJhbG..."
  }
  ```
* **Error Response JSON:** Standard Error (e.g. `UNAUTHENTICATED`)
* **Status Codes:** `200 OK`, `401 Unauthorized`
* **Validation Rules:** Used by `/auth/success` after OAuth redirects and by page refreshes. Validates the httpOnly refresh cookie against the server-side session store.

---

## 2. Room APIs

### Create Room
* **Endpoint:** `/rooms`
* **HTTP Method:** `POST`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "visibility": "public" 
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "room_code": "ABC-123-XYZ",
    "owner_id": "user-uuid",
    "visibility": "public",
    "created_at": "2026-06-24T12:00:00Z"
  }
  ```
* **Error Response JSON:** Standard Error
* **Status Codes:** `201 Created`, `400 Bad Request`
* **Validation Rules:** `visibility` enum: `public` or `private`. User becomes Owner.

### Fetch Room Details
* **Endpoint:** `/rooms/:roomCode`
* **HTTP Method:** `GET`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `roomCode` (String)
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:**
  ```json
  {
    "id": "room-uuid",
    "room_code": "ABC-123-XYZ",
    "visibility": "private",
    "members": [
      {
        "user_id": "user-uuid",
        "username": "johndoe",
        "role": "owner"
      }
    ],
    "projects": [
      {
        "id": "project-uuid",
        "name": "FrontendApp"
      }
    ]
  }
  ```
* **Error Response JSON:** Standard Error (e.g. `ROOM_NOT_FOUND`, `FORBIDDEN`)
* **Status Codes:** `200 OK`, `403 Forbidden`, `404 Not Found`
* **Validation Rules:** Read access requires membership if room is `private`.

### Join Room
* **Endpoint:** `/rooms/:roomCode/join`
* **HTTP Method:** `POST`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `roomCode` (String)
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:**
  ```json
  {
    "message": "Successfully joined",
    "role": "editor",
    "room": { /* Same as Fetch Room Details */ }
  }
  ```
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `403 Forbidden`, `404 Not Found`
* **Validation Rules:** Public rooms grant `editor` or `viewer` by default. Private rooms reject if no invite/pre-authorization exists.

### Leave Room
* **Endpoint:** `/rooms/:roomCode/leave`
* **HTTP Method:** `POST`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `roomCode` (String)
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:** `{ "message": "Left successfully" }`
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `404 Not Found`
* **Validation Rules:** Removes user from `Room Members` (if not Owner, or handles ownership transfer).

### Change Member Role
* **Endpoint:** `/rooms/:roomCode/members/:userId`
* **HTTP Method:** `PATCH`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `roomCode` (String), `userId` (UUID)
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "role": "editor"
  }
  ```
* **Success Response JSON:** `{ "message": "Role updated successfully" }`
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `403 Forbidden`
* **Validation Rules:** Requester must be `owner`. `role` enum: `editor`, `viewer`, `owner`.

### Remove Member
* **Endpoint:** `/rooms/:roomCode/members/:userId`
* **HTTP Method:** `DELETE`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `roomCode` (String), `userId` (UUID)
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:** `{ "message": "Member removed successfully" }`
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `403 Forbidden`
* **Validation Rules:** Requester must be `owner`. Cannot remove self.

### Delete Room
* **Endpoint:** `/rooms/:roomCode`
* **HTTP Method:** `DELETE`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `roomCode` (String)
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:** `{ "message": "Room deleted" }`
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `403 Forbidden`, `404 Not Found`
* **Validation Rules:** Requester must be `owner`. Deleting a room cascades to `Projects`, `Files`, `Messages`, and `Room Members`.

---

## 3. Project APIs

### Create Project
* **Endpoint:** `/projects`
* **HTTP Method:** `POST`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "room_id": "room-uuid",
    "name": "BackendApp"
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "id": "project-uuid",
    "room_id": "room-uuid",
    "name": "BackendApp",
    "created_at": "2026-06-24T12:00:00Z"
  }
  ```
* **Error Response JSON:** Standard Error
* **Status Codes:** `201 Created`, `403 Forbidden`
* **Validation Rules:** Requester must be `owner` or `editor`. `name` is required.

### Fetch Project & File Tree
* **Endpoint:** `/projects/:projectId`
* **HTTP Method:** `GET`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `projectId` (UUID)
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:**
  ```json
  {
    "id": "project-uuid",
    "name": "BackendApp",
    "files": [
      {
        "id": "file-uuid",
        "path": "src/index.js",
        "language": "javascript"
      }
    ]
  }
  ```
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `403 Forbidden`, `404 Not Found`
* **Validation Rules:** Must be a member of the room owning the project.

### Delete Project
* **Endpoint:** `/projects/:projectId`
* **HTTP Method:** `DELETE`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `projectId` (UUID)
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:** `{ "message": "Project deleted" }`
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `403 Forbidden`
* **Validation Rules:** Requester must be `owner`.

---

## 4. File APIs

### Create File
* **Endpoint:** `/files`
* **HTTP Method:** `POST`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "project_id": "project-uuid",
    "path": "src/utils.js",
    "language": "javascript",
    "content": "console.log('init');"
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "id": "file-uuid",
    "project_id": "project-uuid",
    "path": "src/utils.js",
    "language": "javascript"
  }
  ```
* **Error Response JSON:** Standard Error
* **Status Codes:** `201 Created`, `403 Forbidden`, `409 Conflict`
* **Validation Rules:** Must be `owner` or `editor`. `path` must be unique per project.

### Fetch File Content
* **Endpoint:** `/files/:fileId`
* **HTTP Method:** `GET`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `fileId` (UUID)
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:**
  ```json
  {
    "id": "file-uuid",
    "path": "src/utils.js",
    "content": "console.log('init');",
    "language": "javascript"
  }
  ```
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `403 Forbidden`, `404 Not Found`
* **Validation Rules:** Must be member of the room. Note: For active collaboration, initial load uses this, then hands off to Yjs WS.

### Rename/Move File
* **Endpoint:** `/files/:fileId`
* **HTTP Method:** `PATCH`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `fileId` (UUID)
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "path": "src/helpers.js",
    "language": "javascript"
  }
  ```
* **Success Response JSON:** `{ "message": "File updated successfully" }`
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `403 Forbidden`, `409 Conflict`
* **Validation Rules:** Must be `owner` or `editor`. Path must not collide.

### Delete File
* **Endpoint:** `/files/:fileId`
* **HTTP Method:** `DELETE`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `fileId` (UUID)
* **Query Parameters:** None
* **Request Body JSON:** None
* **Success Response JSON:** `{ "message": "File deleted" }`
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `403 Forbidden`
* **Validation Rules:** Must be `owner` or `editor`.

---

## 5. Chat APIs

### Fetch Chat History
* **Endpoint:** `/chat/:roomId/history`
* **HTTP Method:** `GET`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** `roomId` (UUID)
* **Query Parameters:** 
  - `limit` (Int, default 50)
  - `before` (Timestamp, for pagination)
* **Request Body JSON:** None
* **Success Response JSON:**
  ```json
  {
    "messages": [
      {
        "id": "msg-uuid",
        "sender_id": "user-uuid",
        "sender_name": "johndoe",
        "message": "Hello team!",
        "created_at": "2026-06-24T12:00:00Z"
      }
    ]
  }
  ```
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `403 Forbidden`
* **Validation Rules:** Must be a member of the room. Live messages happen over STOMP, not REST.

---

## 6. AI APIs

*Note: All AI endpoints are rate-limited per user. Code-mutating actions require `editor` or `owner` roles.*

### AI Autocomplete
* **Endpoint:** `/ai/autocomplete`
* **HTTP Method:** `POST`
* **Request Headers:** `Authorization: Bearer <token>`
* **Request Body JSON:**
  ```json
  {
    "file_id": "file-uuid",
    "prefix": "function calculateSum(",
    "suffix": "}",
    "language": "javascript"
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "completion": "a, b) {\n  return a + b;\n"
  }
  ```
* **Status Codes:** `200 OK`, `429 Too Many Requests`
* **Validation Rules:** Rate limited. Should be debounced by frontend.

### AI Chat
* **Endpoint:** `/ai/chat`
* **HTTP Method:** `POST`
* **Request Body JSON:**
  ```json
  {
    "room_id": "room-uuid",
    "message": "How do I optimize this?",
    "context_files": ["file-uuid-1", "file-uuid-2"]
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "response": "You can optimize this by using a Set instead of an Array..."
  }
  ```

### AI Refactor
* **Endpoint:** `/ai/refactor`
* **HTTP Method:** `POST`
* **Request Body JSON:**
  ```json
  {
    "file_id": "file-uuid",
    "selected_code": "for(let i=0; i<arr.length; i++) { ... }",
    "language": "javascript"
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "suggested_code": "arr.forEach(item => { ... });",
    "explanation": "Using forEach is more idiomatic."
  }
  ```
* **Validation Rules:** Requires `editor` role to apply (read is allowed for all).

### AI Detect Bugs
* **Endpoint:** `/ai/detect-bugs`
* **HTTP Method:** `POST`
* **Request Body JSON:**
  ```json
  {
    "file_id": "file-uuid",
    "code": "const x = 10; x = 20;",
    "language": "javascript"
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "bugs": [
      {
        "line": 1,
        "description": "Assignment to constant variable.",
        "suggested_fix": "let x = 10; x = 20;"
      }
    ]
  }
  ```

### AI Explain
* **Endpoint:** `/ai/explain`
* **HTTP Method:** `POST`
* **Request Body JSON:**
  ```json
  {
    "code": "regex...",
    "language": "javascript"
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "explanation": "This regex matches..."
  }
  ```

### AI Code Review
* **Endpoint:** `/ai/review`
* **HTTP Method:** `POST`
* **Request Body JSON:**
  ```json
  {
    "file_id": "file-uuid"
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "review_comments": [
      {
        "line": 42,
        "comment": "Consider extracting this logic to a separate function."
      }
    ]
  }
  ```

### AI Generate Tests
* **Endpoint:** `/ai/generate-tests`
* **HTTP Method:** `POST`
* **Request Body JSON:**
  ```json
  {
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript"
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "tests": "describe('add', () => { it('adds numbers', () => { expect(add(1,2)).toBe(3); }); });"
  }
  ```

### AI Generate Docs
* **Endpoint:** `/ai/generate-docs`
* **HTTP Method:** `POST`
* **Request Body JSON:**
  ```json
  {
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript"
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "documentation": "/**\n * Adds two numbers together.\n * @param {number} a\n * @param {number} b\n * @returns {number}\n */"
  }
  ```

---

## 7. Execution APIs

### Run Code
* **Endpoint:** `/execution/run`
* **HTTP Method:** `POST`
* **Request Headers:** `Authorization: Bearer <token>`
* **Path Parameters:** None
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "file_id": "file-uuid",
    "code": "console.log('Hello World');",
    "language": "javascript",
    "stdin": ""
  }
  ```
* **Success Response JSON:**
  ```json
  {
    "stdout": "Hello World\n",
    "stderr": "",
    "exit_code": 0,
    "execution_time_ms": 120
  }
  ```
* **Error Response JSON:** Standard Error (e.g. `EXECUTION_TIMEOUT`)
* **Status Codes:** `200 OK`, `429 Too Many Requests`, `403 Forbidden`
* **Validation Rules:** Rate limited. Must be `owner` or `editor`. Language must be supported by the Sandbox. Timeouts will return a `200 OK` with non-zero exit code and stderr detailing the timeout, rather than a `500 Server Error`.

Supported sandbox languages for v1: Java, C++, Python, JavaScript, TypeScript, Go.

---

## 8. Internal Service APIs

These endpoints are strictly for internal microservice communication (e.g., from the Node.js CRDT service to Spring Boot) and must NOT be exposed to the public internet.

### Flush CRDT Document State to DB
* **Endpoint:** `/internal/files/:fileId/content`
* **HTTP Method:** `PUT`
* **Request Headers:** `Authorization: Bearer <service_to_service_jwt>`
* **Path Parameters:** `fileId` (UUID)
* **Query Parameters:** None
* **Request Body JSON:**
  ```json
  {
    "content": "console.log('latest synced state');"
  }
  ```
* **Success Response JSON:** `{ "message": "Content updated" }`
* **Error Response JSON:** Standard Error
* **Status Codes:** `200 OK`, `401 Unauthorized`, `404 Not Found`
* **Validation Rules:** Requires service-to-service JWT authentication issued only to trusted internal services. Validates `fileId` existence. Used by the Node.js sync service to persist the `Y.Doc` state periodically or when the room becomes empty. This endpoint must not accept browser JWTs.
