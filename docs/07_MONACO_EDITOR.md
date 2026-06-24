# 07 — Monaco Editor

Monaco Editor (the same editor core that powers VS Code) replaces the old project's CodeMirror 5.

## Required features
- Syntax highlighting (per-language, dynamically switchable)
- Auto-completion (native Monaco intellisense, separate from the AI-powered autocomplete in `14_AI_ASSISTANT.md` — these are complementary, not the same thing)
- Theming (dark theme as default — see `17_FRONTEND_UI_UX.md`)
- Multi-language support (matching whatever languages the execution sandbox supports — see `12_CODE_EXECUTION_SANDBOX.md`)
- Code folding
- Minimap
- Standard editor keyboard shortcuts (find/replace, multi-cursor, go-to-line, etc. — these come largely for free with Monaco, just don't override/break them)

## Integration notes
- Bound to the Yjs document via `y-monaco` (or equivalent) per `06_CRDT_ENGINE.md` — never manually synced via `setValue()`.
- Live cursor decorations (other users' cursors/selections) are rendered as Monaco decorations driven by the Yjs Awareness state — see `09_LIVE_CURSORS.md`.
- AI inline suggestions (ghost text / dropdown) render as a Monaco inline completion provider, fed by the backend AI gateway (`14_AI_ASSISTANT.md`) — never by a direct frontend-to-AI-provider call.
