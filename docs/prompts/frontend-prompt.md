# Frontend Prompt

Use this when working specifically on the Next.js frontend, separately from backend work.

---

**Prompt to paste:**

You are building the frontend for "CollabCode," a real-time collaborative code editor, using Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Monaco Editor. Read `02_SYSTEM_ARCHITECTURE.md`, `07_MONACO_EDITOR.md`, `09_LIVE_CURSORS.md`, `15_MULTI_FILE_WORKSPACE.md`, `17_FRONTEND_UI_UX.md`, and `16_API_SPECIFICATION.md` before writing any code.

Key requirements:
- Bind Monaco Editor to a Yjs document via `y-monaco` (or equivalent) — never use `editor.setValue()` for remote updates, since that destroys cursor position and undo history. See `06_CRDT_ENGINE.md` for why this matters.
- Render other users' cursors and selections as Monaco decorations, driven by Yjs Awareness state, color-coded per user, with labels.
- Build a file tree / tabs UI for multi-file projects per `15_MULTI_FILE_WORKSPACE.md`.
- The main editor workspace should follow the structural pattern described in `17_FRONTEND_UI_UX.md`: a focused primary surface (editor + file tree) with a clearly separated side panel for AI/agent activity (autocomplete, chat, review results) — referencing Google Antigravity's Manager/Editor View split, Linear/Cursor's clean dark-theme execution, and Vercel's typography discipline.
- The login/landing screen must look like a deliberate, polished product — strong hero, three distinct auth method buttons (Google, GitHub, email/username), dark theme by default, subtle purposeful motion only.
- No inline `<style>` blocks anywhere — use Tailwind + centralized design tokens.
- Implement a Cmd/Ctrl+K command palette for quick navigation.
- Never store any API key (AI provider, OAuth secrets) in any frontend code or environment variable exposed to the browser — all of that lives backend-only per `18_SECURITY.md`.
- Store the JWT access token in memory (not localStorage); rely on an httpOnly refresh cookie, per `04_AUTHENTICATION.md`.

Build against the API contracts in `16_API_SPECIFICATION.md`. Confirm with me before introducing any new dependency not already listed in `02_SYSTEM_ARCHITECTURE.md`.
