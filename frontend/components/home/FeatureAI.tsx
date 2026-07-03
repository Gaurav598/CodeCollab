"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useScrollReveal";

/* AI capabilities — every one exists in CollabCode's AI gateway */
const AI_CAPABILITIES = [
  {
    id: "autocomplete",
    label: "Autocomplete",
    icon: "⌨️",
    color: "hsl(172 72% 45%)",
    /* The ghost text shown in the editor after the cursor */
    ghostText: "useCollabStore(options?: CollabOptions): CollabState",
    /* Editor snippet that triggers this */
    editorCode: [
      { text: "const { doc, awareness } = ", color: "#d4d4d4" },
      { text: "useCollab", color: "#dcdcaa" },
    ],
    panel: null,
  },
  {
    id: "chat",
    label: "AI Chat",
    icon: "💬",
    color: "hsl(221 83% 62%)",
    ghostText: null,
    editorCode: [
      { text: "function processQueue(items) {", color: "#dcdcaa" },
    ],
    panel: {
      user: "Explain this function to me",
      ai: "This function iterates over the items array and processes each element using the configured handler. It returns a Promise that resolves when all items have been processed. Consider adding error handling for failed items.",
    },
  },
  {
    id: "refactor",
    label: "Refactor",
    icon: "🔄",
    color: "hsl(38 92% 55%)",
    ghostText: null,
    editorCode: [
      { text: "// Before: imperative loop", color: "#6a9955" },
    ],
    panel: {
      user: "Refactor to functional style",
      ai: "Here's the functional refactor using Array.map and Promise.all for concurrent execution, which is faster and more readable:",
    },
  },
  {
    id: "review",
    label: "Code Review",
    icon: "🔍",
    color: "hsl(152 76% 55%)",
    ghostText: null,
    editorCode: [
      { text: "async function fetchUser(id) {", color: "#dcdcaa" },
    ],
    panel: {
      user: "Review this function",
      ai: "⚠️ Missing error handling on the fetch call. If the network request fails, the promise will reject silently. Wrap in try/catch and handle 4xx/5xx status codes.",
    },
  },
  {
    id: "tests",
    label: "Test Generation",
    icon: "🧪",
    color: "hsl(280 72% 62%)",
    ghostText: null,
    editorCode: [
      { text: "function fibonacci(n: number): number {", color: "#dcdcaa" },
    ],
    panel: {
      user: "Generate unit tests",
      ai: 'Generated 6 tests:\n✓ fibonacci(0) === 0\n✓ fibonacci(1) === 1\n✓ fibonacci(10) === 55\n✓ handles negative input\n✓ handles large n\n✓ is memoized',
    },
  },
  {
    id: "docs",
    label: "Documentation",
    icon: "📄",
    color: "hsl(172 72% 45%)",
    ghostText: null,
    editorCode: [
      { text: "export function mergeStates(", color: "#dcdcaa" },
    ],
    panel: {
      user: "Generate JSDoc",
      ai: '/**\n * Merges two collaboration states.\n * @param local  - Local Yjs document state\n * @param remote - Remote peer state vector\n * @returns Merged state update as Uint8Array\n */',
    },
  },
] as const;

const PROVIDER_BADGES = [
  { label: "Gemini",   color: "hsl(221 83% 62%)" },
  { label: "GPT-4o",  color: "hsl(152 76% 55%)" },
  { label: "Claude",  color: "hsl(38 92% 55%)"  },
  { label: "DeepSeek",color: "hsl(280 72% 62%)" },
];

type Cap = typeof AI_CAPABILITIES[number];

function EditorPanel({ cap }: { cap: Cap }) {
  const [ghostVisible, setGhostVisible] = useState(false);

  useEffect(() => {
    setGhostVisible(false);
    const t = setTimeout(() => setGhostVisible(true), 600);
    return () => clearTimeout(t);
  }, [cap.id]);

  return (
    <div
      className="relative overflow-hidden rounded-t-xl"
      style={{
        background: "#0d1117",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        lineHeight: "20px",
      }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 border-b px-3 py-2"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "#161b22" }}
      >
        <span className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "#d4d4d4" }}>
          workspace.ts
        </span>
        {/* AI label */}
        <div
          className="ml-auto flex items-center gap-1.5 rounded px-2 py-0.5"
          style={{ background: `${cap.color}15`, color: cap.color, fontSize: "10px", fontWeight: 600 }}
        >
          <span className="cc-ai-glow h-1.5 w-1.5 rounded-full" style={{ background: cap.color }} />
          {cap.label}
        </div>
      </div>

      {/* Code */}
      <div className="p-4">
        {cap.editorCode.map((tok, i) => (
          <span key={i} style={{ color: tok.color }}>{tok.text}</span>
        ))}

        {/* Ghost text / autocomplete */}
        {cap.ghostText && (
          <span
            style={{
              color: "rgba(255,255,255,0.28)",
              opacity: ghostVisible ? 1 : 0,
              transition: "opacity 0.3s ease",
              display: "block",
              marginTop: "2px",
            }}
          >
            {cap.ghostText}
            <span
              className="cc-cursor-blink ml-0.5 inline-block w-px"
              style={{ height: "13px", background: cap.color, verticalAlign: "text-bottom" }}
            />
          </span>
        )}

        {!cap.ghostText && (
          <span
            className="cc-cursor-blink ml-0.5 inline-block w-px"
            style={{ height: "13px", background: cap.color, verticalAlign: "text-bottom" }}
          />
        )}
      </div>
    </div>
  );
}

function ChatPanel({ cap }: { cap: Cap }) {
  const [typed, setTyped] = useState(0);
  const panel = "panel" in cap && cap.panel ? cap.panel : null;

  useEffect(() => {
    if (!panel?.ai) return;
    setTyped(0);
    const target = panel.ai.length;
    let i = 0;
    const step = () => {
      i += 3;
      setTyped(Math.min(i, target));
      if (i < target) requestAnimationFrame(step);
    };
    const t = setTimeout(() => requestAnimationFrame(step), 400);
    return () => clearTimeout(t);
  }, [cap.id]);

  if (!panel) return null;

  return (
    <div
      className="flex flex-col gap-3 border-t p-4"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      {/* User message */}
      <div className="flex items-start justify-end gap-2">
        <div
          className="max-w-xs rounded-2xl rounded-tr-sm px-3 py-2 text-xs"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
        >
          {panel.user}
        </div>
        <div
          className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ background: "hsl(172 72% 42%)" }}
        >
          YO
        </div>
      </div>

      {/* AI response */}
      <div className="flex items-start gap-2">
        <div
          className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-sm"
          style={{ background: `${cap.color}18`, border: `1px solid ${cap.color}30` }}
        >
          ✦
        </div>
        <div
          className="max-w-xs rounded-2xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed whitespace-pre-line"
          style={{
            background: `${cap.color}10`,
            border: `1px solid ${cap.color}20`,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {panel.ai.slice(0, typed)}
          <span
            className="cc-cursor-blink inline-block w-px ml-0.5"
            style={{ height: "11px", background: cap.color, verticalAlign: "text-bottom", opacity: typed < panel.ai.length ? 1 : 0 }}
          />
        </div>
      </div>
    </div>
  );
}

export function FeatureAI() {
  const { ref, inView } = useInView(0.06);
  const [activeCap, setActiveCap] = useState(0);
  const cap = AI_CAPABILITIES[activeCap];

  // Auto-cycle through capabilities
  useEffect(() => {
    const id = setInterval(() => setActiveCap((s) => (s + 1) % AI_CAPABILITIES.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative z-10 py-28 sm:py-36"
      aria-labelledby="ai-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Header — right-aligned to break pattern ───────────── */}
        <div
          className="mb-16 ml-auto max-w-xl text-right"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s",
          }}
        >
          <div className="cc-eyebrow mb-5 ml-auto w-fit">
            <span>✦</span> AI Gateway
          </div>
          <h2
            id="ai-heading"
            className="font-bold text-foreground"
            style={{
              fontSize: "clamp(2rem, 3.6vw, 3.2rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.028em",
            }}
          >
            AI woven into
            <br />
            <span className="text-primary">every keystroke.</span>
          </h2>
          <p
            className="mt-4 leading-relaxed text-muted-foreground"
            style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)" }}
          >
            Eight AI surfaces, one backend gateway — proxying Gemini, GPT-4o, Claude, and DeepSeek securely. No API keys on the client.
          </p>
        </div>

        {/* ── Main: capability tabs + editor visual ─────────────── */}
        <div className="grid items-stretch gap-8 lg:grid-cols-[280px_1fr] xl:gap-12">

          {/* Left — capability tabs */}
          <div
            className="flex flex-col gap-1"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(-20px)",
              transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s",
            }}
          >
            {AI_CAPABILITIES.map((c, i) => {
              const isActive = activeCap === i;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCap(i)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-250"
                  style={{
                    background: isActive ? `${c.color}10` : "transparent",
                    border: isActive ? `1px solid ${c.color}25` : "1px solid transparent",
                  }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition-all duration-250"
                    style={{
                      background: isActive ? `${c.color}18` : "hsl(var(--muted) / 0.3)",
                    }}
                  >
                    {c.icon}
                  </span>
                  <span
                    className="text-sm font-semibold transition-colors duration-200"
                    style={{ color: isActive ? c.color : "hsl(var(--muted-foreground))" }}
                  >
                    {c.label}
                  </span>
                </button>
              );
            })}

            {/* Provider badges */}
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                Backend Providers
              </p>
              <div className="flex flex-wrap gap-2">
                {PROVIDER_BADGES.map((p) => (
                  <div
                    key={p.label}
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                    style={{
                      background: `${p.color}10`,
                      border: `1px solid ${p.color}20`,
                      color: p.color,
                    }}
                  >
                    {p.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — editor + chat composite */}
          <div
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(20px)",
              transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s",
            }}
          >
            <div
              className="overflow-hidden rounded-2xl transition-all duration-400"
              style={{
                background: "#0d1117",
                border: `1px solid ${cap.color}20`,
                boxShadow: `0 0 0 1px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.5), 0 0 80px ${cap.color}08`,
              }}
            >
              {/* Title bar */}
              <div
                className="flex items-center gap-2 border-b px-4 py-2"
                style={{ background: "#161b22", borderColor: "rgba(255,255,255,0.04)" }}
              >
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: "hsl(172 72% 45%)" }} />
                </div>
                <div
                  className="ml-auto flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: `${cap.color}12`, color: cap.color }}
                >
                  <span className="cc-ai-glow h-1.5 w-1.5 rounded-full" style={{ background: cap.color }} />
                  AI Gateway · Secure
                </div>
              </div>

              {/* Editor snippet */}
              <EditorPanel cap={cap} />

              {/* Chat / response panel */}
              <ChatPanel cap={cap} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
