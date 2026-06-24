# 09 — Live Cursors

Google-Docs-style presence: every connected user's cursor and selection is visible to everyone else in the room, color-coded per user.

## Requirements
- Each user is assigned a consistent color (derived from their user ID, or assigned on join and kept for the session).
- Cursor position and current text selection are broadcast via the **Yjs Awareness Protocol** (see `06_CRDT_ENGINE.md`) — this is ephemeral state, not persisted document content.
- Other users' cursors render as Monaco decorations with a small label (username) near the cursor.
- **Typing indicator:** a lightweight signal (e.g. "X is typing...") shown briefly when a remote user is actively sending updates, separate from the cursor decoration itself.
- Cursor/selection state is cleaned up immediately when a user disconnects (no "ghost cursors" lingering after someone leaves).

## Acceptance criteria
- With 3+ users in a room, each one's cursor is visually distinguishable (different color, labeled) to the others, updating in near real-time as they move/select/type.
- A user closing their tab causes their cursor to disappear for everyone else within a second or two (tied to the Yjs Awareness disconnect/timeout behavior).
