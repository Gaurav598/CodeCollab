# Collaboration Persistence

## Authority and data format

MongoDB is the durable authority for collaborative file content. Redis distributes live updates between sync instances and temporarily retains a recovery snapshot; Redis Pub/Sub alone is not durability.

Each `FileEntry` contains:

- `yjs_state`: Base64-encoded result of `Y.encodeStateAsUpdate(doc)`.
- `collaboration_version`: monotonically increasing compare-and-swap version.
- `collaboration_updated_at`: last committed snapshot time.
- `content`: the Monaco Y.Text plain-text projection committed atomically with the Yjs snapshot.

The full Yjs update preserves CRDT client identifiers and causal history. The text projection is not reconstructed into independent edits and is never used as an autosave writer. It is only a legacy bootstrap when no Yjs snapshot exists and a read projection for other backend features.

## Open and initialize

1. The client requests `/sync` with `roomId`, `fileId` and a short-lived access JWT.
2. The sync service verifies the JWT and calls the internal collaboration authorization endpoint for the exact tuple.
3. It registers the immutable file/room context before obtaining the shared Y.Doc.
4. `bindState` loads the MongoDB snapshot. Connection setup explicitly waits for this asynchronous load; clients cannot race an empty document.
5. Any Redis or process-local recovery snapshot is CRDT-applied after the committed snapshot.
6. Redis document and awareness fan-out is attached, then normal `y-websocket` synchronization begins.

For pre-upgrade files where `yjs_state` is empty, the existing `content` string is inserted once into `Y.Text("monaco")` and immediately scheduled for a CRDT snapshot.

## Write and flush

Every non-load Yjs update increments an in-memory revision and marks the document dirty. A trailing debounce reduces write amplification, while `DOCUMENT_FLUSH_MAX_WAIT_MS` prevents continuous typing from postponing persistence indefinitely.

Before each MongoDB write, the service encodes the complete Yjs state and stores it in the Redis recovery key `yjs:recovery:file:<fileId>` with a seven-day expiry. If Redis is unavailable, it also keeps the snapshot in process memory. A successful MongoDB commit clears both recovery copies.

Only one flush per document runs at a time. The encoded revision is captured before I/O. If another update arrives during the request, the successful write only marks revisions through that captured point as committed and schedules another flush.

## Compare-and-swap and concurrent sync instances

The internal PUT includes `expectedVersion`. MongoDB atomically matches `_id`, `room_id` and `collaboration_version`, writes the snapshot/text and increments the version.

On HTTP 409:

1. The sync service loads the winning snapshot.
2. It applies that Yjs update to its current document.
3. It adopts the winning version.
4. It re-encodes the merged CRDT state and retries, up to four attempts.

Because Yjs updates are commutative and idempotent, this preserves both writers rather than allowing a stale full snapshot to replace newer state. Redis Pub/Sub normally converges instances before a flush; compare-and-swap is the durable last line of defense.

## Failure recovery

- **Transient MongoDB/backend failure:** the dirty document stays resident, the latest state remains in Redis recovery storage when Redis is available, and persistence retries with exponential delay capped at 30 seconds.
- **Transient Redis failure:** connected clients on the same sync process continue working and MongoDB flushing continues. Cross-instance realtime fan-out is degraded until Redis reconnects. The in-process recovery map protects failed Mongo writes only until process exit.
- **MongoDB unavailable during reopen:** the service may open a Redis/in-process recovery snapshot. Its temporary version `-1` intentionally conflicts on the first later write; the service then loads MongoDB, merges and retries.
- **Graceful shutdown:** all active dirty documents are flushed before WebSockets and Redis clients close. Clients receive restart code 1012 and reconnect.
- **Abrupt process death:** edits committed to MongoDB survive. Edits only in Redis recovery survive if Redis survives. Updates still only in process/client memory rely on client reconnection; an outage of clients, sync process, Redis and MongoDB at the same time can lose the unflushed interval.

A failed final MongoDB write is never treated as a successful commit. The service retains recoverable state where possible and logs the failure.

## Disconnect and eviction

`y-websocket` invokes `writeState` when the shared document is released. Timers are cancelled, a final serialized flush runs, listeners and Redis bindings are removed, and only then is the binding evicted. A new opener waits for any still-pending final flush for the same document.

Document contexts remain lightweight mappings so a rapid reconnect cannot rebind a document to a different room/file tuple. Process restart clears them naturally.

## Viewer enforcement

Viewers may send awareness and Yjs sync-step-1 state-vector requests. Their automatic sync-step-2 response is ignored because it may contain document state. Any explicit Yjs document update closes the socket with code 4403. Role changes are picked up by periodic authorization rechecks without reloading the editor.

## Deletion and revocation

- File deletion removes the MongoDB record and broadcasts a workspace refresh. Open clients close deleted tabs. On the next authorization recheck, sync connections fail file validation and close.
- Room deletion removes files and memberships. The same recheck invalidates active sync access.
- Member removal is sent to that user on a private STOMP queue for immediate UI cleanup. The sync service independently revokes the Yjs socket on its configured recheck interval.
- A snapshot write receiving 403 or 404 is considered permanently invalid. Dirty/recovery state is discarded so deleted content cannot be resurrected.

The maximum authorization lag is `AUTHORIZATION_RECHECK_MS` (30 seconds by default). Reducing it tightens revocation at the cost of more backend reads.

## Limits and operations

- Yjs snapshot decoded size: 16 MiB.
- Plain-text projection: 5 MiB characters.
- Redis recovery retention: seven days.
- Default debounce: 1 second.
- Default maximum flush wait: 5 seconds.
- Backend/internal request timeout: 5 seconds.

Monitor sync-service logs for `[Persistence] Flush failed`, `Final MongoDB flush deferred`, conflict loops and recovery-open warnings. Monitor backend errors for `STALE_DOCUMENT_VERSION`, `FILE_ROOM_MISMATCH`, 403 and 404 responses.

The browser's “Live sync” state means the active Yjs provider is connected and synchronized with the sync service. It does not claim a MongoDB acknowledgement because the current protocol has no per-client durable-commit receipt.

## Known limitations

- Full snapshots bound write amplification; an append-only update log plus compaction may be preferable for very large/high-churn documents.
- Redis AOF `everysec` improves local recovery but is not equivalent to MongoDB durability.
- Simultaneous failure of MongoDB, Redis, the sync process and all connected clients can lose the unflushed window.
- Recovery keys expire after seven days if MongoDB cannot be repaired.
- Deletion/revocation is periodic at the sync socket and therefore not instantaneous at the protocol layer.
