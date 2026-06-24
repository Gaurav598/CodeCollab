Before writing any code:

1. Read every document.
2. Validate architecture.
3. Generate implementation plan.
4. Generate task breakdown.
5. Identify conflicts.
6. Wait for approval.

Only then begin implementation.

# Full Build Prompt

Use this when you want to hand an AI coding agent (Claude Code, Cursor, etc.) the entire spec in one go.

---

**Prompt to paste:**

You are building "CollabCode" — a real-time, AI-powered developer collaboration platform. This is a ground-up rebuild of an existing project that had critical security flaws and a naive sync model. I'm giving you the complete documentation set below (or attached as files — read every file in the `docs/` folder before writing any code). Implement this fully, feature by feature, in the phase order given in `21_ROADMAP.md`. Do not skip any feature listed across these documents. Where a decision was left open in any file (search for "decision needed" or similar notes), use the stated default and proceed — don't block on it, just note in your output that a default was assumed.

Specifically, do not omit:
- Real CRDT-based conflict-free sync (Yjs) — not a naive full-document broadcast
- Backend-verified JWT auth on every protected route, for all four auth methods (Google, GitHub, email/password, username/password)
- RBAC (Owner/Editor/Viewer) enforced server-side
- Docker-sandboxed code execution with CPU/memory/timeout limits and no network access inside containers
- A multi-provider AI gateway (Gemini/OpenAI/Claude/DeepSeek) with the API key only ever held server-side — never in any frontend bundle
- All 8 AI features (autocomplete, chat, refactor, bug detection, explanation, review, test generation, doc generation)
- Multi-file workspace (file tree, tabs, CRUD)
- Real-time chat with history, mentions, emoji, notifications
- WebRTC video/voice call with screen sharing
- Redis-backed horizontal scaling for both the sync engine and session state
- The UI/UX direction described in `17_FRONTEND_UI_UX.md` — an Antigravity-structured editor workspace (focused main surface + dedicated AI panel) and an industry-grade landing/login screen, dark theme, Tailwind + shadcn/ui, no inline styles
- Full test coverage per `20_TESTING_STRATEGY.md`'s priority order
- Docker Compose setup + CI/CD per `19_DEVOPS_DEPLOYMENT.md`

Read `00_PROJECT_VISION.md` and `02_SYSTEM_ARCHITECTURE.md` first for context, then proceed phase by phase per `21_ROADMAP.md`. Confirm with me before making any architectural decision not already specified in these docs.

[Attach or paste the full contents of the `docs/` folder here]


Execution Rules

You are operating as a long-running implementation agent.

Never stop after planning.

Never stop after generating files.

After completing a task:

1. Run validation.
2. Run tests.
3. Fix failures.
4. Continue with next roadmap phase.

Only stop when:

- Every item in 27_ACCEPTANCE_CHECKLIST.md passes.
- Every roadmap phase is completed.
- No TODO/FIXME remains.
- All services build successfully.

At the end of every phase:

- Generate completion report.
- Update progress percentage.
- Continue automatically.

Do not ask for confirmation between phases unless:
- A documentation conflict exists.
- A required secret/key is missing.
- A required external service cannot be accessed.