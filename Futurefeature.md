# CodeCollab - Future Features & Upgrades

This document outlines the planned upgrades for CodeCollab. These features will improve the user experience, optimize API costs, and ensure a highly resilient AI and code execution infrastructure.

---

## 1. Implement Resizable Sidebar (Room Settings)
**Goal:** Allow users to dynamically adjust the width of the workspace sidebar to accommodate different screen sizes and preferences.

**Implementation Details:**
- **Avoid Manual Logic:** Instead of writing custom CSS/JS event listeners for mouse drag (which can be janky and break layouts), we will use the `react-resizable-panels` npm package.
- **Why this package:** This is a highly robust, buttery-smooth library used by Vercel and Shadcn UI. It natively handles drag-to-resize, minimum/maximum width constraints, and snap-to-collapse functionality without layout shifting.
- **Impact:** It will give the editor a much more premium, IDE-like feel (similar to VS Code).

---

## 2. Rate Limiting & AI Suggestion UX Improvements
**Goal:** Prevent abuse of the Code Execution engine and AI Suggestion API, while improving the user experience so they understand *why* a suggestion might take time.

**Implementation Details:**
- **Code Execution Rate Limits:** Enforce strict token-bucket or sliding-window rate limits (e.g., max 5 executions per minute per user) to prevent server overload or malicious infinite loops.
- **AI Suggestion Debouncing & UX:** 
  - Currently, users might think their internet is slow or the browser is caching if AI suggestions take too long. We need to add visual feedback (like a subtle loading spinner or "AI is thinking..." ghost text in Monaco).
  - Add debouncing so it doesn't trigger an API call on every single keystroke (e.g., wait for the user to pause typing for 800ms before fetching a suggestion).
  - **Remove Default Output:** The system currently returns a default boilerplate return result when it shouldn't. This needs to be stripped out so the AI only returns genuine, context-aware code completion.

---

## 3. Highly Resilient AI API Fallback System (API Key & Model Rotation)
**Goal:** Ensure the AI features *never* go down due to rate limits by implementing a smart fallback system for both API keys and AI models.

**Implementation Details:**
- **Intra-Model API Key Fallback:** Support comma-separated API keys in the `.env` file for a single provider (e.g., `GEMINI_API_KEYS=key1,key2,key3`). If `key1` hits a `429 Too Many Requests` error, the backend will catch it and automatically retry the same request with `key2`.
- **Cross-Model Fallback:** If *all* API keys for the primary model are exhausted, the system will automatically cascade to the next available AI provider in the fallback chain.
  - *Proposed Chain:* **Gemini ➜ Grok ➜ Claude ➜ DeepSeek**.
- **Optimize Gemini Model for Suggestions:** For real-time autocomplete, sending massive contexts to heavy models (like Gemini 1.5 Pro or 3.0) is too expensive and slow. We will configure the suggestion engine to use an older/cheaper and much faster token model (e.g., `gemini-1.5-flash` or the upcoming `gemini-2.0-flash`) which is specifically designed for high-frequency, low-latency tasks like code autocomplete.