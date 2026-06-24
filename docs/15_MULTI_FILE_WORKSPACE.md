# 15 — Multi-File Workspace

VS Code-style project workspace — this is now in scope for the initial build (not backlog), per project decision.

## Requirements
- **File explorer / tree** — hierarchical view of folders and files within a project
- **File operations:** create, rename, delete, move (within the tree)
- **Tabs** — multiple open files, switchable, with unsaved-state indication if applicable
- **Per-file language detection/selection** — drives both Monaco syntax highlighting and which execution runtime is used when running that specific file

## Data model tie-in
Maps directly to the `Projects` and `Files` tables in `03_DATABASE_DESIGN.md` — one `Room` can contain one or more `Projects`, each `Project` contains multiple `Files`, each identified by a `path` (e.g. `src/index.js`) unique within that project.

## CRDT tie-in
Each open file has its own `Y.Doc` (per `06_CRDT_ENGINE.md`) — switching tabs in the UI means binding the Monaco instance to a different `Y.Doc`, not destroying/recreating editor state. Files not currently open by anyone can remain unloaded in the sync service until someone opens them, to avoid holding every file in every project in memory at once for large projects.

## Acceptance criteria
- A user can create a new file, see it appear in the tree, open it in a new tab, edit it, and have those edits sync in real time to other room members who also open that file.
- Renaming or deleting a file is reflected immediately in all connected clients' file trees and closes/updates any open tabs referencing that file.
- Switching between tabs does not lose unsaved CRDT state in the file being switched away from.
