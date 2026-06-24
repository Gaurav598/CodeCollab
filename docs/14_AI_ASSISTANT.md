# 14 — AI Assistant

## Full feature set
- **Autocomplete** — inline/dropdown code completion as the user types (debounced)
- **AI Chat** — conversational assistant scoped to the current room/file context, for asking questions about the code
- **Refactoring suggestions** — AI proposes restructured versions of selected code
- **Bug detection** — AI flags likely issues in the current file/selection
- **Code explanation** — AI explains what a selected block of code does, in plain language
- **Code review** — AI provides review-style feedback on a file or diff
- **Test generation** — AI generates unit tests for selected code
- **Documentation generation** — AI generates doc comments / README-style descriptions for code

## Model Gateway (not a bypass — a proper abstraction layer)
Rather than hardcoding a single provider's SDK call throughout the codebase (as the old project did, directly from the frontend, with Gemini), all AI features route through one internal **AI Model Gateway** service inside the backend. This gateway:
- Exposes one consistent internal interface (e.g. `generate(prompt, context, taskType)`) regardless of which underlying model handles the request.
- Supports multiple providers behind that interface: **Gemini, OpenAI, Claude, DeepSeek** — swappable per task type or per deployment config, without frontend changes.
- Is the *only* place that holds any provider API key — none of these keys ever reach the frontend bundle, for any provider.

This directly fixes the old project's High-severity flaw (Gemini key exposed client-side) while also making the system resilient to a single provider's outage/rate limits/pricing changes — if one provider is down or throttled, the gateway can route to another without the frontend knowing or caring.

## Operational requirements
- **Debouncing** on autocomplete requests specifically (the highest-frequency AI call) — don't fire on every keystroke.
- **Caching** (via Redis, see `13_REDIS_SCALING.md`) for repeated/near-identical requests within a short window, across all AI features where it's safe to do so (autocomplete benefits most; chat/review are more context-specific and cache less effectively, which is fine).
- **Per-user rate limiting** on all AI endpoints, same pattern as `12_CODE_EXECUTION_SANDBOX.md`.
- **Graceful degradation** — if the underlying model provider is down, rate-limited, or over quota, the relevant AI feature should fail quietly (no broken UI, no blocking the core editing/sync experience). The editor and CRDT sync must never depend on AI availability.

## Auth
All AI endpoints require a valid JWT and respect room RBAC (e.g. a Viewer might be allowed to use AI chat/explanation features read-only, but whether Viewers can trigger refactor/test-generation that would modify code is a room-permission decision — default to requiring Editor-or-above for any AI action that would write code back into the file, Owner/Editor/Viewer-agnostic read-only access for explanation/chat).

## Explicit non-goals
- No custom model fine-tuning or self-hosted model training pipeline — the gateway calls existing hosted provider APIs.
- No client-side provider key, fallback key, or key-rotation scheme stored anywhere in the frontend — single backend-held gateway is the only path to any model.
