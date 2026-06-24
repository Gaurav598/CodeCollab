# 17 — Frontend UI / UX

This is the highest-priority file for visual design decisions. Gaurav's explicit ask: the main editor/execution workspace should feel like **Google Antigravity**, and the login/landing screen should feel like a polished, industry-grade product — not a student project.

## Design references
- **Linear** — clean, fast, confident UI; restrained color use; excellent use of whitespace and motion
- **Cursor** — developer-tool dark theme done well, command-palette-driven interactions
- **Vercel** — landing page and dashboard polish, strong typography hierarchy
- **Google Antigravity** — see detailed notes below
- **GitHub** — familiar patterns for repo/file-tree style navigation that developers already know intuitively

## What "Antigravity-style" actually means (verified, not guessed)
Researched directly rather than assumed, since this reference needed to be accurate:

Antigravity is Google's agent-first development platform. Its most distinctive structural idea is what Google calls the **Manager Surface** (also referred to as **Mission Control** in third-party coverage) — a dedicated interface that flips the traditional IDE paradigm: instead of AI being an assistant embedded in your editor sidebar, the agent is the primary actor, with the editor and browser as surfaces it controls.

Concretely, the platform has two distinct interaction modes worth borrowing patterns from: an Editor View — a standard IDE interface for writing and reviewing code, with an AI agent available in a side panel for contextual tasks — and a Manager View, a mission-control dashboard for supervising and organizing larger or asynchronous tasks.

**What this translates to for CollabCode's editor/execution screen:**
- A primary, focused workspace (the Monaco editor + file tree) as the main surface — not cluttered with chrome.
- A dedicated, clearly-separated side panel for AI/agent activity (autocomplete suggestions, chat, review results) rather than AI features feeling bolted onto random toolbar buttons.
- A sense of "the workspace is the product" — minimal decoration, confident use of space, the code itself is the visual center of gravity.
- Execution results (run output, stdout/stderr) presented as a clear, structured panel — similar conceptually to how Antigravity surfaces agent results as discrete units rather than a raw scrolling log.

**Honest caveat:** publicly available material on Antigravity describes its interaction model and structure in detail, but doesn't provide a pixel-level design spec (exact colors, spacing values, font). If an exact visual match matters, the most reliable next step is to look at actual screenshots/the live product directly (antigravity.google) and extract specific values from there — this document captures the *structural/interaction* pattern reliably, not exact hex codes.

## Login / landing screen
This is the first impression and should read as a deliberate product, not a default template.
- Strong, concise hero section stating what CollabCode does in one glance.
- Three clearly distinct, polished auth options (Google, GitHub, email/username) — not default unstyled browser inputs.
- Dark theme by default, consistent with the rest of the product.
- Subtle, purposeful motion (not flashy) — e.g. a gentle entrance animation, not scroll-jacking effects.

## Design system requirements
- **Tailwind CSS + shadcn/ui** as the implementation layer (per `02_SYSTEM_ARCHITECTURE.md`).
- No inline `<style>` blocks scattered across components — this was an explicit code-quality flaw in the old project. Centralize design tokens (colors, spacing, type scale).
- Dark mode by default across the entire app (landing, auth, editor, dashboard).
- **Command palette** — a Cmd/Ctrl+K style quick-action menu (consistent with the Linear/Cursor reference points above) for fast navigation between rooms/files/actions.

## Explicit non-goals
- No marketing site sprawl (pricing pages, blog, etc.) unless requested separately later.
- No animation-library overkill — performance-first, motion should support clarity, not distract from it.

## Acceptance criteria
- Zero inline `<style>` tags in any component.
- Login screen does not resemble a default/unstyled framework starter.
- The editor workspace has a clearly separated AI/agent panel distinct from the core editing surface, matching the Antigravity-style structural pattern described above.
