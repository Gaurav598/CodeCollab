# 06 — CRDT Engine (Most Important Spec File)

## Why the current implementation fails

**Current behavior:** On every keystroke, the entire file's content is broadcast as a string to every other connected client, which then calls `editor.setValue()` to replace their local content wholesale.

**Resulting problems:**
- **Race conditions:** If User A and User B type at nearly the same moment, whichever update arrives at the server last simply overwrites the other — one user's keystrokes are silently lost, with no merge, no warning.
- **Cursor jumping:** Calling `setValue()` resets the receiving editor's cursor to position 0 (or wherever the code tries to crudely restore it), which breaks if the incoming text changed the document length.
- **Undo stack destruction:** `setValue()` wipes the editor's undo history for every remote update, so a user's own recent local undo history can be destroyed by someone else's edit arriving over the wire.

None of these are edge cases — they happen under completely normal two-person concurrent typing.

## The solution: Yjs CRDT

A CRDT (Conflict-free Replicated Data Type) is a data structure that can be updated independently and concurrently by multiple parties, and is guaranteed to converge to the same final state for everyone, with no central coordinator deciding "whose edit wins." Yjs is the specific JavaScript CRDT library used here.

### Core concepts to implement

**1. Delta updates, not full-document broadcasts**
Every edit produces a small binary delta describing exactly what changed (an insertion, a deletion, at a specific position in the CRDT's internal structure) — never the whole document string.

**2. Conflict resolution (automatic, not manual)**
Yjs's underlying algorithm deterministically merges concurrent operations from multiple users such that:
- No keystroke from any user is ever silently dropped.
- All clients converge to an identical final document state, even if updates arrive in different orders at different clients.
- This requires zero custom merge logic — it's the library's job, not something to hand-roll.

**3. Awareness Protocol**
Separate from document content, Yjs's Awareness API broadcasts ephemeral, non-persistent state: each user's cursor position, text selection range, and a chosen display color/name. This is what powers `09_LIVE_CURSORS.md` — it is not stored in the document itself and doesn't need conflict resolution the same way (last-write-wins is fine for "where is your cursor right now").

**4. Editor binding**
The Yjs document (`Y.Doc`) is bound to the Monaco Editor instance via a binding library (e.g. `y-monaco`), so local keystrokes automatically generate Yjs updates, and incoming Yjs updates automatically apply to the editor's model — without ever calling a destructive `setValue()`.

**5. Persistence**
The live `Y.Doc` is the source of truth while a room is active. Periodically (e.g. on an interval, or on last-user-leaves), its current state is serialized and saved to the `Files.content` column in PostgreSQL (see `03_DATABASE_DESIGN.md`) so the room can be restored if the sync service restarts or the room goes cold and is reopened later. The sync service writes snapshots through internal backend APIs using service-to-service JWT authentication; browser/user JWTs must not be accepted on internal persistence endpoints.

## Acceptance criteria
- Two clients typing on the exact same line, same character position, at the same time, both end up with all of both users' characters present (in some deterministic, consistent order) — never with one user's input vanishing.
- No `editor.setValue()` call exists anywhere in the new sync code path.
- Refreshing a browser tab restores the live document state instantly from the active `Y.Doc` (not a stale DB snapshot, if the room is currently active).
- Killing one sync-service instance in a multi-instance setup does not break sync for users who reconnect to a surviving instance (proves the Redis fan-out works).
