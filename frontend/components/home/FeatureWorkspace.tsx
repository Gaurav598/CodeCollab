"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ── Presence avatar ──────────────────────────────────────────────── */
function Avatar({
  name,
  color,
  status = "active",
  size = "md",
}: {
  name: string;
  initials: string;
  color: string;
  status?: "active" | "speaking" | "idle";
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <div className="relative flex flex-col items-center gap-1">
      <div
        className={`${dim} flex items-center justify-center rounded-full font-bold text-white`}
        style={{
          background: color,
          boxShadow: status === "speaking"
            ? `0 0 0 2px #0d1117, 0 0 0 4px ${color}`
            : "0 0 0 2px rgba(255,255,255,0.08)",
        }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
      {status === "active" && (
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
      )}
      {status === "speaking" && (
        <div className="cc-live-dot h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
      )}
    </div>
  );
}

/* ── Simulated workspace layer ────────────────────────────────────── */
export function WorkspaceVisual() {
  return (
    <div className="relative w-full" style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Outer glow */}
      <div
        className="pointer-events-none absolute -inset-12 rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse 65% 65% at 50% 45%, hsl(172 72% 45% / 0.12) 0%, hsl(221 83% 58% / 0.07) 50%, transparent 75%)",
          filter: "blur(24px)",
        }}
      />

      {/* Main workspace frame */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(45,212,191,0.07)",
        }}
      >
        {/* ── Top bar ───────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ background: "#161b22", borderColor: "rgba(255,255,255,0.05)" }}
        >
          {/* Room name */}
          <div className="flex items-center gap-2">
            <div className="cc-live-dot h-2 w-2 rounded-full" style={{ background: "#22c55e" }} />
            <span className="text-[11px] font-semibold text-white/70">team-sprint-v3</span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: "hsl(172 72% 45% / 0.15)", color: "hsl(172 72% 60%)" }}>LIVE</span>
          </div>

          {/* Presence avatars */}
          <div className="flex items-center gap-1.5">
            {[
              { name: "YO", color: "hsl(172 72% 42%)", status: "active" as const },
              { name: "AL", color: "hsl(221 83% 62%)", status: "speaking" as const },
              { name: "SR", color: "hsl(38 92% 52%)",  status: "active" as const },
              { name: "MK", color: "hsl(280 72% 58%)", status: "idle" as const },
            ].map((p) => (
              <div
                key={p.name}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{
                  background: p.color,
                  boxShadow: p.status === "speaking"
                    ? `0 0 0 1.5px #161b22, 0 0 0 3px ${p.color}`
                    : "0 0 0 1.5px #161b22",
                }}
                title={p.name}
              >
                {p.name}
              </div>
            ))}
            <span className="ml-1 text-[10px] text-white/30">4 live</span>
          </div>
        </div>

        {/* ── Main area: left sidebar + editor + right panel ── */}
        <div className="grid" style={{ gridTemplateColumns: "140px 1fr 180px", height: 340 }}>

          {/* Left sidebar — file tree */}
          <div
            className="flex flex-col gap-1 overflow-hidden border-r p-3"
            style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}
          >
            <div className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/25">Explorer</div>
            {[
              { name: "src/", type: "dir", depth: 0 },
              { name: "components/", type: "dir", depth: 1 },
              { name: "Editor.tsx", type: "file", active: true, depth: 2 },
              { name: "Chat.tsx", type: "file", depth: 2 },
              { name: "hooks/", type: "dir", depth: 1 },
              { name: "useCollab.ts", type: "file", depth: 2 },
              { name: "README.md", type: "file", depth: 0 },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-1 rounded px-1.5 py-0.5"
                style={{
                  marginLeft: item.depth * 10,
                  background: item.active ? "hsl(172 72% 45% / 0.12)" : "transparent",
                  color: item.active ? "hsl(172 72% 65%)" : "rgba(255,255,255,0.35)",
                  fontSize: "10px",
                  fontFamily: "monospace",
                }}
              >
                {item.type === "dir" ? "📁" : "📄"} {item.name}
              </div>
            ))}
          </div>

          {/* Center — code editor */}
          <div className="relative overflow-hidden">
            {/* Multi-cursor highlights */}
            {/* Cursor 1 — You, on line 8 */}
            <div
              className="pointer-events-none absolute inset-x-0"
              style={{
                top: "calc(2.5rem + 8 * 19px)",
                height: "19px",
                background: "hsl(172 72% 45% / 0.10)",
              }}
            />
            {/* Cursor 2 — Alex, on line 12 */}
            <div
              className="pointer-events-none absolute inset-x-0"
              style={{
                top: "calc(2.5rem + 12 * 19px)",
                height: "19px",
                background: "hsl(221 83% 65% / 0.10)",
              }}
            />

            <div
              className="p-3 pt-2"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10.5px",
                lineHeight: "19px",
                color: "#d4d4d4",
              }}
            >
              {/* Thin tab bar */}
              <div className="mb-2 flex gap-1 border-b pb-1.5" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {["Editor.tsx", "Chat.tsx"].map((tab, i) => (
                  <div
                    key={tab}
                    className="rounded px-2 py-0.5 text-[9px] font-medium"
                    style={{
                      background: i === 0 ? "rgba(255,255,255,0.06)" : "transparent",
                      color: i === 0 ? "#d4d4d4" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {tab}
                  </div>
                ))}
              </div>

              {/* Code lines */}
              {[
                { n: 1,  txt: 'import { useEffect, useState } from "react";',        c: "#d4d4d4" },
                { n: 2,  txt: 'import { useCollabStore } from "@/store/collab";',     c: "#d4d4d4" },
                { n: 3,  txt: "",                                                      c: "" },
                { n: 4,  txt: "export function Editor() {",                            c: "#dcdcaa" },
                { n: 5,  txt: "  const { doc, awareness } = useCollabStore();",        c: "#d4d4d4" },
                { n: 6,  txt: "  const [content, setContent] = useState(\"\");",       c: "#d4d4d4" },
                { n: 7,  txt: "",                                                       c: "" },
                { n: 8,  txt: "  useEffect(() => {",                                   c: "#c586c0", cursor: { color: "hsl(172 72% 45%)", label: "You" } },
                { n: 9,  txt: "    const handler = doc.getText(\"content\");",          c: "#d4d4d4" },
                { n: 10, txt: "    handler.observe(e => {",                             c: "#d4d4d4" },
                { n: 11, txt: "      setContent(handler.toString());",                  c: "#9cdcfe" },
                { n: 12, txt: "    });",                                                c: "#d4d4d4", cursor: { color: "hsl(221 83% 65%)", label: "Alex" } },
                { n: 13, txt: "  }, [doc]);",                                           c: "#d4d4d4" },
                { n: 14, txt: "",                                                        c: "" },
                { n: 15, txt: "  return <MonacoEditor value={content} />;",             c: "#d4d4d4" },
                { n: 16, txt: "}",                                                      c: "#d4d4d4" },
              ].map((line) => (
                <div key={line.n} className="relative flex">
                  <span className="w-6 shrink-0 select-none text-right text-[9px] text-white/15 pr-2">{line.n}</span>
                  <span style={{ color: line.c }}>{line.txt}</span>
                  {line.cursor && (
                    <span
                      className="cc-cursor-blink absolute top-0 bottom-0 w-px"
                      style={{
                        left: `calc(1.5rem + ${line.txt.length * 6.2}px)`,
                        background: line.cursor.color,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — chat + video */}
          <div
            className="flex flex-col border-l overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)" }}
          >
            {/* Video thumbnails */}
            <div className="p-2 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Video</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { name: "AL", color: "hsl(221 83% 62%)", speaking: true },
                  { name: "SR", color: "hsl(38 92% 52%)", speaking: false },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="aspect-video rounded flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: p.speaking ? `1px solid ${p.color}` : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: p.color }}
                    >
                      {p.name}
                    </div>
                    {p.speaking && (
                      <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                        {[3, 5, 4, 6, 3].map((h, i) => (
                          <div
                            key={i}
                            className="w-px rounded-full"
                            style={{
                              height: `${h}px`,
                              background: p.color,
                              opacity: 0.8,
                              animation: `cursor-blink ${0.3 + i * 0.1}s step-end infinite`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex flex-col gap-1.5 overflow-hidden p-2 flex-1">
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-0.5">Chat</div>
              {[
                { name: "AL", color: "hsl(221 83% 62%)", msg: "The observer hook looks good 👍" },
                { name: "SR", color: "hsl(38 92% 52%)",  msg: "Should we add error handling?" },
                { name: "YO", color: "hsl(172 72% 42%)", msg: "Yes, I'll add try/catch now" },
              ].map((m, i) => (
                <div key={i} className="flex gap-1.5">
                  <div
                    className="mt-0.5 h-4 w-4 shrink-0 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                    style={{ background: m.color }}
                  >
                    {m.name}
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold" style={{ color: m.color }}>{m.name}</p>
                    <p className="text-[9px] leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>{m.msg}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI suggestion badge */}
            <div
              className="m-2 rounded px-2 py-1.5"
              style={{
                background: "hsl(172 72% 45% / 0.08)",
                border: "1px solid hsl(172 72% 45% / 0.18)",
              }}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[8px]">✦</span>
                <span className="text-[9px] font-semibold" style={{ color: "hsl(172 72% 65%)" }}>AI Review</span>
              </div>
              <p className="text-[9px] leading-snug text-white/40">Consider wrapping in useMemo to avoid re-renders.</p>
            </div>
          </div>
        </div>

        {/* ── Status bar ──────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-[5px] text-[9px] font-semibold"
          style={{ background: "hsl(172 65% 34%)", color: "hsl(172 72% 95%)" }}
        >
          <span className="flex items-center gap-2">
            <span>⚡ CRDT · Synced</span>
            <span style={{ opacity: 0.55 }}>·</span>
            <span style={{ opacity: 0.7 }}>Yjs v13 · 4 peers</span>
          </span>
          <span style={{ opacity: 0.6 }}>TypeScript · UTF-8</span>
        </div>
      </div>
    </div>
  );
}

