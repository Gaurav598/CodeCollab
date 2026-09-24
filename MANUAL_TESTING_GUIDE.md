# Manual Testing Guide

This guide is the final verification plan for the production-collaboration upgrade. It deliberately separates observable behavior from claims: complete the relevant scenarios before treating a deployment as verified.

## Test environment

### Prerequisites

- Docker Desktop/Engine with Compose, or Java 21 plus Node.js 20+.
- A reachable MongoDB database.
- Two different user accounts and two isolated browser profiles (for example normal and incognito).
- Camera/microphone/display permission for media scenarios.
- Optional configured AI provider and remote execution-engine credentials.
- For NAT testing, two devices on different networks and a TURN service.

Copy `.env.example` to `.env`, supply unique `JWT_SECRET` (at least 32 random bytes), a different high-entropy `SERVICE_JWT_SECRET`, and `MONGODB_URI`. For local HTTP keep `REFRESH_COOKIE_SECURE=false`; use `true` only with HTTPS. Then run:

```bash
docker compose up --build
docker compose logs -f backend sync-service
```

Open `http://localhost:3000`. Keep browser developer tools open on Network (Fetch/XHR and WS) and Console. Useful MongoDB file fields are `yjs_state`, `collaboration_version`, `collaboration_updated_at` and `content`. Never paste real tokens into a report.

For local processes instead of Compose:

```bash
docker compose up -d redis
cd backend && ./gradlew bootRun
cd sync-service && npm install && npm run dev
cd frontend && npm install && npm run dev
```

The commands are separate terminals. The sync service defaults to port 1234.

## 1. Login and room creation

**Setup:** Browser A, backend/sync/Redis/MongoDB healthy.

**Actions:** Register or log in. Refresh the page to exercise cookie bootstrap. Create a named room and enter it. Open devtools storage and confirm no access token is in local/session storage.

**Expected:** Login returns an access token to memory and sets an HttpOnly refresh cookie. Refresh restores the user. The new room opens with the creator as owner and an empty/file workspace state.

**Defect symptoms:** Refresh logs out immediately; refresh cookie is readable by JavaScript; room creation returns 401/403; STOMP continuously reconnects.

**Debug:** Backend auth logs, browser `/auth/login`, `/auth/me`, `/auth/refresh`, `frontend/services/authService.ts`, `backend/.../AuthService.java`, `CookieCsrfFilter.java`.

## 2. Two-user collaborative editing

**Setup:** Browser A owns a room and file. Browser B is a different logged-in user.

**Actions:** B joins by room code. A approves B as editor. Both open the same file. Type a distinctive line in A and then another in B.

**Expected:** Approval arrives without polling, both cursors/presence appear, and each edit appears once in the other browser. Both show Live sync after synchronization.

**Defect symptoms:** B remains pending; duplicate text; an empty document replaces content; sync socket 403 for an approved editor.

**Debug:** Browser Yjs socket frames/status, backend membership/STOMP logs, sync `[SYNC-WS]`/persistence logs, `useYjsDoc.ts`, `sync-service/src/index.ts`.

## 3. Concurrent edits to the same file

**Setup:** Both users are editors with the same non-empty file open.

**Actions:** Disconnect neither user. Place cursors in different lines and type simultaneously for 10–20 seconds, including deletions near but not on the same characters. Stop and compare full text.

**Expected:** Both browsers converge to byte-for-byte identical text without duplicated blocks. After at most the configured max flush wait, MongoDB version advances and `content` matches the visible text.

**Defect symptoms:** Persistent divergence; an edit vanishes after idle; version moves backward; one full document overwrites the other.

**Debug:** `collaboration_version` history, sync 409/merge logs, `persistence.ts`, `InternalService.saveCollaborationSnapshot`.

## 4. Viewer read-only access

**Setup:** A owner, B approved as viewer.

**Actions:** B opens the file and observes A typing. Attempt editor input/commands in B. In devtools, a deliberate custom Yjs update attempt should be done only in a disposable room if you have a protocol test client.

**Expected:** B receives current/live content and awareness but UI editing is disabled. A malicious document-update frame causes B's sync socket to close with 4403; normal viewer synchronization does not disconnect.

**Defect symptoms:** Viewer edits propagate; viewer cannot initially receive state; ordinary viewer open immediately closes 4403.

**Debug:** `CollabEditor.tsx` read-only options, `classifyReadOnlyMessage` in sync `index.ts`, membership role returned by `/internal/validate-collaboration`.

## 5. Cross-room file access rejection

**Setup:** A is a member of room 1 and room 2; B is only in room 1. Record a file ID from each room.

**Actions:** As B, request room-2 file REST data and try a sync URL combining room-1 ID with room-2 file ID. Also submit an AI request for room 1 containing the room-2 context file ID.

**Expected:** REST/AI return 403 or 404 as appropriate. The Yjs upgrade is rejected with 403 and does not load either document.

**Defect symptoms:** Any foreign content appears; WebSocket upgrades; AI response includes the foreign file.

**Debug:** Backend `FILE_ROOM_MISMATCH`, `RoomAccessService`, `InternalService.validateCollaboration`, `AiContextService`.

## 6. Persistence after all collaborators disconnect

**Setup:** Two editors on one file; note current MongoDB collaboration version.

**Actions:** Make a unique edit, wait at least `DOCUMENT_FLUSH_MAX_WAIT_MS` plus network margin, close both room tabs, then reopen the file from a fresh browser page.

**Expected:** The exact final text returns; version increased; the sync service performs a final flush/cleanup without recreating an empty document.

**Defect symptoms:** Last seconds of edits vanish after all users leave; duplicated initial text; final-flush error without recovery state.

**Debug:** Sync `[Persistence]` logs, MongoDB file snapshot fields, `yjsPersistence.writeState`.

## 7. Recovery after sync-service restart

**Setup:** Persist a recognizable file and confirm MongoDB version.

**Actions:** Stop/restart only `sync-service`, leaving MongoDB/Redis/backend running. Wait for browser reconnection or reload the page.

**Expected:** Existing content reloads from MongoDB, Live sync returns and subsequent edits persist. The graceful stop logs a flush before socket closure when applicable.

**Defect symptoms:** Blank file, duplicate seed content, endless Connecting, lower/replaced version.

**Debug:** `docker compose logs sync-service`, startup config, internal snapshot GET, `waitForDocumentReady`.

## 8. Redis disconnect and reconnect recovery

**Setup:** One or two editors and log streams visible. Prefer a disposable room.

**Actions:** Stop Redis, continue a small edit on one sync instance, wait for MongoDB flush, restart Redis, then reconnect/reload both clients. If testing multiple sync instances, repeat and observe the documented temporary cross-instance degradation.

**Expected:** Same-process collaboration and MongoDB persistence continue. Redis errors are explicit, clients eventually reconverge after reconnect/reload, and no stale snapshot overwrites the MongoDB winner.

**Defect symptoms:** Sync process crashes; successful Redis publish is mistaken for durable save; old Redis data overwrites newer Mongo data.

**Debug:** ioredis/recovery logs, Mongo version, `docSync.ts`, `persistence.ts`. Note that multi-instance live fan-out is expected to degrade while Redis is down.

## 9. Room member removal

**Setup:** A owner, B active editor with room and file open.

**Actions:** A removes B. In B, observe navigation/media cleanup. Keep the old sync socket open in devtools or a test client for longer than `AUTHORIZATION_RECHECK_MS`.

**Expected:** B receives a private membership removal event and returns to dashboard. B stops receiving room topics. The Yjs socket closes with 4403 by the next recheck and reconnect is denied.

**Defect symptoms:** B keeps editing/receiving chat after the interval; media remains active; foreign room topic messages arrive.

**Debug:** `/user/queue/membership`, outbound checks in `WebSocketConfig`, sync authorization recheck, `RoomService.broadcastMembershipUpdated`.

## 10. Audio calling

**Setup:** Two approved editors, distinct devices/profiles, headphones to prevent feedback.

**Actions:** Join the same room; enable microphones in each browser; speak alternately; mute/unmute several times.

**Expected:** Permission prompts are understandable, each remote audio track is audible, mute state propagates, and repeated toggles do not create multiple active microphone tracks.

**Defect symptoms:** Viewer can signal; stale/duplicate audio; microphone indicator remains after mute/exit; hardcoded-track misrouting.

**Debug:** `chrome://webrtc-internals` or equivalent, STOMP signal queue, `peerMediaSenders.audio`, `toggleAudio`.

## 11. Video calling

**Setup:** Same as audio with cameras available.

**Actions:** Enable video in both browsers; toggle camera several times; temporarily deny permission in one profile; re-enable permission and retry.

**Expected:** Camera video reaches the correct tile, audio remains unaffected by camera toggles, and denial produces a clear error without breaking the peer connection.

**Defect symptoms:** Screen track appears as camera; camera remains lit after disabling; denial causes an unhandled rejection or duplicate peer.

**Debug:** browser media permissions/WebRTC internals, `peerMediaSenders.camera`, `WebRTCManager.tsx`.

## 12. Screen sharing

**Setup:** Two editor peers with a connected call.

**Actions:** A starts screen share, chooses a surface, then stops using the browser-native stop control. Start again and stop using the app control. Verify camera state before/after. Repeat with B.

**Expected:** Remote UI identifies the screen stream by negotiated MID. Stop fires once, releases the display capture and leaves microphone/camera state unchanged. A later share works on the same peer connection.

**Defect symptoms:** Camera is replaced/stopped; sharing indicator remains; browser continues capturing; second share has no remote video.

**Debug:** `peerMediaSenders.screen`, `remoteMediaMids`, `remoteScreenShareIntents`, screen track `onended`.

## 13. Peer disconnection and reconnection

**Setup:** Two editors with audio/video connected.

**Actions:** Briefly disable B's network, restore it, then force a STOMP reconnect (backend restart or network interruption). Repeat room leave/join twice.

**Expected:** Stale peers/ICE queues are cleaned, presence is reannounced, one peer connection per user is rebuilt, and ICE restarts use the new generation without discarded candidates.

**Defect symptoms:** Duplicate remote tiles/audio; candidates applied before remote description; connection never recovers; stale user remains after leave.

**Debug:** WebRTC internals connection/ICE states, `WebRTCConnectionHandler.tsx`, STOMP reconnect logs and `/app/video.presence` events.

## 14. Chat and participant presence

**Setup:** Two users in a room; optionally open a second tab for A.

**Actions:** Send/delete chat according to allowed UI actions. Open then close A's second tab. Finally close A's last room tab.

**Expected:** Messages deliver once only to authorized room members. Closing one A tab does not show A as left; closing the last does. Reconnect rejoins the room without duplicate subscriptions.

**Defect symptoms:** Cross-room messages; duplicate messages after reconnect; false LEFT when one of several tabs closes.

**Debug:** backend `PresenceService`, `StompController`, `stompClient.ts` active subscriptions/joined rooms.

## 15. AI assistance

**Setup:** At least one authorized AI provider key; editor role; supported-language file.

**Actions:** Type and pause for autocomplete, then type again quickly to supersede it. Exercise a backend AI endpoint with same-room context. Temporarily make providers unavailable or use invalid credentials.

**Expected:** Superseded autocomplete fetches abort; context remains bounded to the room; configured fallback providers are tried only after classified failure; total failure returns 503 and no fabricated suggestion.

**Defect symptoms:** Old completion inserts after new typing; cross-room context accepted; synthetic boilerplate presented as AI; unbounded retries.

**Debug:** browser AI request status, backend `AiGatewayService`, `AiContextService`, provider logs (without keys), rate-limit keys.

## 16. Remote code execution

**Setup:** Configured remote sandbox engine. Never point `EXECUTION_ENGINE_URL` at an endpoint that runs code unsandboxed.

**Actions:** Run valid code, compile/runtime-error code, a program exceeding timeout and repeated requests exceeding quota. Try as viewer and with a foreign file ID.

**Expected:** Normal stdout/stderr is returned; timeout is explicit; quota returns 429; viewer/cross-room requests are forbidden; backend host starts no user-code process.

**Defect symptoms:** Request hangs beyond configured timeout; user bypasses file room/role; execution occurs on the application host; unbounded output destabilizes UI.

**Debug:** `ExecutionService`, `ExecutionRateLimiter`, `ExecutionEngineClient`, remote engine audit/sandbox logs. Isolation itself must be verified at the external engine.

## 17. File deletion and workspace cleanup

**Setup:** Both users have the same file open; keep another file available.

**Actions:** A deletes the active file. Observe B, then attempt reconnection to the deleted file ID. Delete the room as owner in a disposable test.

**Expected:** Both file trees refresh, deleted tabs close, sync authorization fails for the deleted file, failed final persistence does not resurrect it, and room deletion removes files/memberships and invalidates active access.

**Defect symptoms:** Deleted tab remains writable; file reappears after flush/restart; old socket continues past recheck; deleted room still accepts STOMP/Yjs access.

**Debug:** workspace `file.changed`, Sidebar refresh, backend delete methods, sync 403/404 permanent-persistence handling.

## Completion record

Record browser/OS versions, deployment commit, environment topology and pass/fail for every applicable scenario. Capture sanitized logs for failures. Real-device WebRTC results must be recorded explicitly; unit or type checks are not substitutes.
