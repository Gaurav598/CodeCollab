# 27 — Production Acceptance Checklist

AUTHENTICATION & SESSIONS

[ ] User can login with Google OAuth
Test: Click Google Login → authenticate → redirected back.
Expected: JWT + refresh token issued.

[ ] User can login with GitHub OAuth
Test: Click GitHub Login → authenticate → redirected back.
Expected: JWT + refresh token issued.

[ ] User can register with Email and Password
Test: Enter valid email and password → submit registration.
Expected: Account created successfully, JWT issued.

[ ] User can login with Email and Password
Test: Enter registered credentials → login.
Expected: JWT + refresh token issued.

[ ] User can login with Username and Password
Test: Enter registered credentials → login.
Expected: JWT + refresh token issued.

[ ] Password reset flow
Test: Click "Forgot Password" → enter email → click link in email → set new password.
Expected: Password updated, old tokens invalidated.

[ ] Expired access token automatically refreshes
Test: Expire JWT manually and trigger an API request.
Expected: New access token generated seamlessly using the httpOnly refresh cookie.

[ ] Server-side JWT signature validation
Test: Tamper with JWT payload and send request.
Expected: Server rejects token (401 Unauthorized).

[ ] Server-side JWT expiration validation
Test: Send request with expired JWT (without triggering refresh).
Expected: Server rejects token (401 Unauthorized).

[ ] Session revocation on logout
Test: User clicks logout.
Expected: Refresh token invalidated server-side; JWT access revoked; active websockets disconnected.

[ ] Redis-backed session store resilience
Test: Two backend instances running. User connects to one, then it's killed.
Expected: Session state remains valid on the surviving instance.

[ ] No third-party OAuth keys in frontend bundle
Test: Inspect the Next.js production build output using DevTools.
Expected: No client secrets or API keys are exposed.

AUTHORIZATION & RBAC

[ ] Owner permissions enforced
Test: Room owner attempts to delete the room or change user roles.
Expected: Action succeeds.

[ ] Editor permissions enforced
Test: Editor attempts to edit code or trigger execution.
Expected: Action succeeds; code changes sync.

[ ] Viewer permissions enforced (Read-only)
Test: Viewer attempts to edit code or trigger code execution.
Expected: UI blocks action; backend API explicitly rejects the request (403 Forbidden).

[ ] Role promotion/demotion
Test: Owner promotes Viewer to Editor.
Expected: Viewer's UI unlocks edit capabilities instantly without refresh.

[ ] Server-side identity verification
Test: Send API request bypassing frontend UI with forged role/identity payload.
Expected: Backend re-verifies JWT and DB role; rejects request.

REALTIME COLLABORATION & CRDT ENGINE

[ ] WebSocket connection establishment
Test: User opens a room.
Expected: WebSocket connects successfully to the Node.js sync service.

[ ] Concurrent editing conflict resolution
Test: Two users type on the exact same line and character simultaneously.
Expected: Both inputs are preserved and merged deterministically. No keystrokes lost.

[ ] Delta updates (No full-document broadcast)
Test: Inspect WebSocket frames while typing.
Expected: Only binary Yjs deltas are transmitted.

[ ] No `setValue()` editor destruction
Test: Receive remote update while local text is highlighted or undo stack has items.
Expected: Highlight is maintained; undo/redo stack is preserved perfectly.

[ ] Offline edit buffering
Test: Disconnect internet, type code, reconnect.
Expected: Buffered Yjs updates sync to server instantly upon reconnection.

[ ] Large file delta sync performance
Test: Paste a 10,000 line file.
Expected: Initial sync handles payload without crashing; subsequent edits remain small deltas.

[ ] Live cursors broadcast
Test: User moves cursor or selects text.
Expected: Other clients see cursor position and user name instantly.

[ ] Distinct cursor color assignment
Test: Multiple users join room.
Expected: Each user is assigned a distinct color for their cursor.

[ ] Cursor unmount on leave
Test: User closes browser tab.
Expected: Their live cursor vanishes from other users' screens immediately.

[ ] Typing indicators
Test: User types in the editor.
Expected: UI shows typing indicator for that user to others.

[ ] Redis fan-out for multi-instance sync
Test: Connect two clients to different Node.js sync instances and type.
Expected: Edits sync perfectly via Redis Pub/Sub.

[ ] Multi-instance reconnection resilience
Test: Kill the sync-service instance a client is connected to.
Expected: Client reconnects to surviving instance; resumes sync without data loss.

[ ] Document persistence to PostgreSQL
Test: All users leave room. Wait for persistence interval, then reopen.
Expected: Exact latest CRDT state is restored from database.

WORKSPACE & ROOM MANAGEMENT

[ ] Room creation
Test: Authenticated user clicks "Create Room".
Expected: Room created with unique ID; user assigned Owner role.

[ ] Room joining via link
Test: User pastes a room URL.
Expected: User joins room if public or granted access.

[ ] Room joining via code
Test: User enters a room code in UI.
Expected: User joins room.

[ ] Private vs Public room access
Test: Unauthorized user tries to join a private room.
Expected: Access denied (403).

[ ] Multi-file workspace support
Test: User creates multiple files.
Expected: Files listed correctly in the file tree explorer.

[ ] Folder nesting
Test: Create a folder inside another folder.
Expected: Renders and collapses correctly in tree.

[ ] Create new files/folders sync
Test: Create file/folder.
Expected: Appears in tree and syncs to all users in room.

[ ] Rename files/folders sync
Test: Right-click and rename file.
Expected: Name updates locally and syncs to others.

[ ] Delete files/folders sync
Test: Delete a file.
Expected: File is removed for all users.

[ ] File tabs management
Test: Click multiple files in explorer.
Expected: Tabs open for each; user can switch seamlessly.

[ ] Active tab isolation
Test: User A switches to `main.py`, User B switches to `utils.py`.
Expected: Each user sees their own active file; no forced navigation.

[ ] Language switching per file
Test: Change file extension (e.g., `.py` to `.js`).
Expected: Editor syntax highlighting/intellisense updates to new language.

[ ] Presence indicators panel
Test: User joins room.
Expected: User appears in "Who's online" participants panel.

CODE EXECUTION SANDBOX

[ ] Run code successfully
Test: Write valid script and click "Run".
Expected: Output appears in execution terminal.

[ ] Support for Java execution
Test: Run Java code.
Expected: Code compiles and runs.

[ ] Support for C++ execution
Test: Run C++ code.
Expected: Code compiles and runs.

[ ] Support for Python execution
Test: Run Python code.
Expected: Code executes.

[ ] Support for JavaScript execution
Test: Run JS code using Node environment.
Expected: Code executes.

[ ] Support for TypeScript execution
Test: Run TS code.
Expected: Code transpiles and executes.

[ ] Support for Go execution
Test: Run Go code.
Expected: Code compiles and executes.

[ ] Execution hard timeout enforcement
Test: Run an infinite loop script.
Expected: Container force-killed after timeout (e.g. 5s); returns timeout error.

[ ] CPU limit enforcement
Test: Run script designed to max out CPU.
Expected: Container restricts CPU usage; host server unaffected.

[ ] Memory limit enforcement
Test: Run script that aggressively allocates memory.
Expected: Container hits memory cap and is killed; host safe.

[ ] Network isolation (No outbound calls)
Test: Run script attempting HTTP GET request.
Expected: Request fails due to Docker network isolation.

[ ] Container destruction guarantee
Test: Execute successful, failed, and timeout scripts.
Expected: Ephemeral containers completely removed after execution.

[ ] Execution rate limiting per user
Test: Spam "Run" button via API script.
Expected: Requests exceed limit; returns 429 Too Many Requests.

[ ] Stdin injection
Test: Run script requiring input; type into terminal.
Expected: Input routed to Docker process.

[ ] Stderr separation
Test: Run code that prints to stderr.
Expected: Errors display in distinct color (red) in output terminal.

[ ] Non-zero exit code reporting
Test: Run script that throws exception.
Expected: UI indicates process crashed with exit code != 0.

[ ] Concurrent execution isolation
Test: Two users run code simultaneously.
Expected: Two containers spin up; outputs route correctly to respective users.

AI ASSISTANT

[ ] AI Model Gateway Routing
Test: Switch provider config (e.g., Gemini to OpenAI) in backend.
Expected: Features work without frontend changes.

[ ] No AI API keys in frontend bundle
Test: Search compiled Next.js bundle for API keys.
Expected: No keys found.

[ ] Autocomplete (Inline, Debounced)
Test: Type continuously, then pause.
Expected: No API call during typing; suggestion appears only after pause.

[ ] AI Chat context awareness
Test: Ask AI Chat about a specific function in code.
Expected: Response accurately references the current file context.

[ ] Multi-file context for AI
Test: Ask question requiring context from two open files.
Expected: Context builder attaches both files to prompt.

[ ] AI streaming response
Test: Trigger AI Chat.
Expected: Response streams chunk-by-chunk in real-time.

[ ] AI Code block insertion
Test: Click "Insert" on AI generated code block in chat.
Expected: Code inserted at cursor position in editor.

[ ] Refactoring suggestions
Test: Select messy code, trigger "Refactor".
Expected: AI suggests cleaner version.

[ ] Bug detection
Test: Write faulty code, trigger "Find Bugs".
Expected: AI identifies issue and suggests fix.

[ ] Code explanation
Test: Highlight complex algorithm, trigger "Explain".
Expected: AI provides plain-language explanation.

[ ] Code review
Test: Trigger "Code Review" for file.
Expected: AI provides structured review feedback.

[ ] Test generation
Test: Select function, trigger "Generate Tests".
Expected: AI generates valid unit tests.

[ ] Documentation generation
Test: Select class, trigger "Generate Docs".
Expected: AI generates JSDoc / Docstring.

[ ] AI Pull Request / Commit generation
Test: Trigger PR/Commit description generation.
Expected: AI generates summary based on workspace diff.

[ ] AI Response Caching
Test: Ask exact same question twice.
Expected: Second response returned instantly from Redis cache.

[ ] AI Graceful Degradation
Test: Simulate provider outage (invalid key).
Expected: AI features fail with toast error; CRDT and editor remain functional.

[ ] AI Token usage tracking / Rate limiting
Test: Spam AI endpoint.
Expected: Returns 429 Too Many Requests after threshold.

[ ] AI RBAC enforcement (Code mutation)
Test: Viewer attempts AI Refactoring.
Expected: Request denied due to lack of Editor permissions.

COMMUNICATION

[ ] Real-time Chat STOMP connection
Test: Send chat message.
Expected: Message routes via STOMP/Spring Boot and broadcasts instantly.

[ ] Chat history loading
Test: Join existing room with messages.
Expected: Previous chat history fetched and displayed.

[ ] Chat @mentions
Test: Type `@username`.
Expected: Mention highlights and triggers notification for user.

[ ] Chat notifications / Unread indicator
Test: Receive message while chat panel closed.
Expected: Unread badge appears.

[ ] Chat auto-scroll
Test: Receive new message while at bottom of chat.
Expected: Scroll container auto-scrolls.

[ ] Chat emoji support
Test: Send message with emojis.
Expected: Emojis render correctly.

[ ] Chat timestamping
Test: Send message.
Expected: Server-authoritative timestamp displayed.

[ ] WebRTC Video Call Signaling
Test: Two users click "Join Video Call".
Expected: WebRTC signaling flows through STOMP; peer-to-peer connection established.

[ ] Camera Toggle
Test: Click camera icon.
Expected: Video stream stops/starts; peers see change.

[ ] Microphone Toggle
Test: Click mute icon.
Expected: Audio stream stops/starts; peers hear change.

[ ] Mute remote participant locally
Test: Click mute on another user's video feed.
Expected: Their audio stops playing locally.

[ ] Screen Sharing
Test: Click "Share Screen".
Expected: Screen streamed to peers successfully.

[ ] Participants panel
Test: Open participants sidebar.
Expected: Accurate list of connected users and roles.

FRONTEND UI/UX

[ ] Responsive Tailwind Layout
Test: Resize browser to mobile width.
Expected: UI adapts without horizontal scrolling.

[ ] Antigravity-Style Editor Workspace
Test: Open workspace.
Expected: Multi-pane layout with file tree, editor, terminal, and chat correctly proportioned.

[ ] Empty states
Test: Open empty room.
Expected: User-friendly empty state displayed.

[ ] Loading indicators
Test: Trigger execution or AI request.
Expected: Spinners/skeletons shown during network wait.

[ ] Form Input Validation (Frontend)
Test: Submit form with missing fields.
Expected: Client-side validation prevents submission and shows errors.

SECURITY

[ ] Input validation on backend
Test: Send API request with malformed data.
Expected: Spring `@Valid` rejects with 400 Bad Request.

[ ] XSS Sanitization in Chat and AI
Test: Send chat message `<script>alert('xss')</script>`.
Expected: Message sanitized; script does not execute.

[ ] CSRF Protection
Test: Attempt state-changing API request from third-party domain without CSRF token.
Expected: Request fails (SameSite cookie policies).

[ ] Content Security Policy (CSP)
Test: Check HTTP response headers.
Expected: CSP header restricts inline scripts and unapproved origins.

[ ] No Endpoint Trusts Client Role Unverified
Test: Send API request asserting "role: owner" for a room user does not own.
Expected: Backend evaluates true role from DB/JWT and rejects.

DEVOPS & DEPLOYMENT

[ ] Docker Compose Orchestration
Test: Run `docker-compose up`.
Expected: All services (Next.js, Spring Boot, Node.js, Postgres, Redis) start and communicate.

[ ] Services Containerized Individually
Test: Run `docker ps`.
Expected: Each component runs in isolated container.

[ ] GitHub Actions CI: PR Tests
Test: Open Pull Request.
Expected: CI automatically runs test suite; reports status.

[ ] GitHub Actions CD: Build on Merge
Test: Merge PR to `main`.
Expected: CI builds Docker images automatically.

[ ] Kubernetes Readiness
Test: Inspect services.
Expected: Services are stateless; rely on Redis; expose `/health` endpoints.

TESTING STRATEGY

[ ] Backend Unit Tests (JUnit/Mockito)
Test: Run backend tests.
Expected: Service logic and RBAC rules covered using mocks.

[ ] Backend Integration Tests (@SpringBootTest)
Test: Run backend tests.
Expected: Critical REST endpoints (Auth, Security) tested with real context.

[ ] Sync Service Unit Tests
Test: Run Node.js tests.
Expected: Yjs CRDT logic and Redis fan-out covered.

[ ] E2E Playwright: Login Flows
Test: Run Playwright tests.
Expected: Automated tests pass for Google, GitHub, and Email logins.

[ ] E2E Playwright: Room/Collab Flows
Test: Run Playwright tests.
Expected: Automated tests simulate concurrent editing and pass.

[ ] E2E Playwright: Execution & Chat Flows
Test: Run Playwright tests.
Expected: Automated tests simulate code execution and chat messaging.

PERFORMANCE

[ ] Room join under target threshold
Test: Join room with 100 files.
Expected: Room opens within defined NFR target.

[ ] CRDT sync latency
Test: User A types.
Expected: User B receives update within NFR target.

[ ] AI response latency
Test: Trigger AI chat.
Expected: Response begins streaming within NFR target.

[ ] Execution response latency
Test: Run simple Hello World.
Expected: Output returned within NFR target.

RELIABILITY

[ ] Redis restart recovery
Test: Restart Redis.
Expected: Services reconnect automatically.

[ ] Backend restart recovery
Test: Restart Spring Boot.
Expected: Users can reconnect.

[ ] Sync service restart recovery
Test: Restart Node sync service.
Expected: CRDT state preserved and reconnect works.

DATABASE

[ ] Cascade deletion rules

[ ] Room ownership integrity

[ ] File persistence integrity

[ ] Session cleanup job