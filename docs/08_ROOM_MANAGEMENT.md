# 08 — Room Management

## Capabilities
- Create room (becomes Owner automatically — see `04_AUTHENTICATION.md` for role definitions)
- Invite users (via shareable room code/link)
- Join room (via code/link; if private, requires the room to already have invited/added the user — public rooms can be joined by anyone with the link)
- Leave room
- Room visibility: **Private** or **Public**
- Room permission management (Owner can change member roles, remove members)

## Lifecycle notes
- A room maps to one `Y.Doc` per file (or one combined doc structure if supporting `15_MULTI_FILE_WORKSPACE.md`'s multi-file model — the sync engine needs a clear mapping of room+file → Yjs document instance).
- When the last user leaves a room, the sync service should flush current document state to PostgreSQL (`Files.content`) before potentially freeing the in-memory `Y.Doc`, so reopening the room later restores correctly.
- Room codes should be non-guessable (not sequential integers) to prevent enumeration of private rooms.

## See also
- `03_DATABASE_DESIGN.md` for the `Rooms` and `Room Members` schema
- `04_AUTHENTICATION.md` for role enforcement
