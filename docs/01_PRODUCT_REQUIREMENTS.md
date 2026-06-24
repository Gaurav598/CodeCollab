# 01 — Product Requirements

This is the complete feature list. Nothing here is optional unless explicitly marked **(backlog)**. Anything marked **(decision needed)** has a default applied but should be confirmed — see `21_ROADMAP.md` and the inline notes.

## Authentication
- Google OAuth
- GitHub OAuth
- Email + Password
- Username + Password
- JWT access tokens
- Refresh tokens
- Session management (server-tracked sessions, revocable)

## Collaboration
- Room creation
- Room joining (via code/link)
- Presence (who's online in a room)
- Live, conflict-free collaborative editing (CRDT-based)
- Live cursors with per-user color + label
- Typing indicators

## Communication
- Real-time chat (with emoji, message history, @mentions, notifications)
- Video call
- Voice call
- Screen sharing
- Mute / camera toggle / participants panel

## AI Assistant
- AI autocomplete (inline, debounced)
- AI chat (ask questions about the code in the room)
- AI refactoring suggestions
- AI bug detection
- AI code explanation
- AI code review
- AI test generation
- AI documentation generation
- **Multi-model gateway** — not hardcoded to one provider; supports Gemini, OpenAI, Claude, DeepSeek behind a single internal interface so the backend can route or swap models without frontend changes

## Workspace
- Multiple files per project
- File tree / explorer (VS Code style: folders, files, tabs, rename, delete, create)
- Tabs for open files
- Language switching per file

## Execution
- Run code on demand
- Docker-based sandboxing (replaces the old direct-to-third-party-compiler approach)
- Resource limits enforced: CPU, memory, execution timeout

## Rooms & Permissions
- Private rooms
- Public rooms
- Role-based access within a room: **Owner, Editor, Viewer**

## Non-functional requirements (carried over as hard requirements, not nice-to-haves)
- No endpoint trusts a client-supplied identity without verifying a JWT server-side
- No third-party API key ever ships in a frontend bundle
- Every resource-consuming endpoint (execution, AI calls) is rate-limited per user
- Horizontal scalability via Redis-backed pub/sub for both sync state and session/socket state
