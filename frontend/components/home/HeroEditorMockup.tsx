"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// ── Editor constants ─────────────────────────────────────────────
const LINE_H = 22;      // px per line (matches font-size + line-height below)
const TOP_PAD = 12;     // py-3 top padding on code area

// ── Syntax token type ────────────────────────────────────────────
type Token = { text: string; color: string; typing?: true };

// ── Code to display (Python — fibonacci with CRDT awareness) ─────
// Each sub-array is one line; colors match VS Code Dark+ theme
const CODE: Token[][] = [
  [
    { text: "def ",        color: "#569cd6" },
    { text: "fibonacci",   color: "#dcdcaa" },
    { text: "(",           color: "#d4d4d4" },
    { text: "n",           color: "#9cdcfe" },
    { text: ": ",          color: "#d4d4d4" },
    { text: "int",         color: "#4ec9b0" },
    { text: ") -> ",       color: "#d4d4d4" },
    { text: "int",         color: "#4ec9b0" },
    { text: ":",           color: "#d4d4d4" },
  ],
  [
    { text: "    ",        color: "#d4d4d4" },
    { text: "if ",         color: "#c586c0" },
    { text: "n <= ",       color: "#d4d4d4" },
    { text: "1",           color: "#b5cea8" },
    { text: ":",           color: "#d4d4d4" },
  ],
  [
    { text: "        ",    color: "#d4d4d4" },
    { text: "return ",     color: "#c586c0" },
    { text: "n",           color: "#9cdcfe" },
  ],
  [
    { text: "    ",        color: "#d4d4d4" },
    { text: "a",           color: "#9cdcfe" },
    { text: ", ",          color: "#d4d4d4" },
    { text: "b",           color: "#9cdcfe" },
    { text: " = ",         color: "#d4d4d4" },
    { text: "0",           color: "#b5cea8" },
    { text: ", ",          color: "#d4d4d4" },
    { text: "1",           color: "#b5cea8" },
  ],
  [
    { text: "    ",        color: "#d4d4d4" },
    { text: "for ",        color: "#c586c0" },
    { text: "_ ",          color: "#d4d4d4" },
    { text: "in ",         color: "#c586c0" },
    { text: "range",       color: "#dcdcaa" },
    { text: "(",           color: "#d4d4d4" },
    { text: "2",           color: "#b5cea8" },
    { text: ", n + ",      color: "#d4d4d4" },
    { text: "1",           color: "#b5cea8" },
    { text: "):",          color: "#d4d4d4" },
  ],
  [
    { text: "        ",    color: "#d4d4d4" },
    { text: "a",           color: "#9cdcfe" },
    { text: ", ",          color: "#d4d4d4" },
    { text: "b",           color: "#9cdcfe" },
    { text: " = ",         color: "#d4d4d4" },
    { text: "b",           color: "#9cdcfe" },
    { text: ", ",          color: "#d4d4d4" },
    { text: "a",           color: "#9cdcfe" },
    { text: " + ",         color: "#d4d4d4" },
    { text: "b",           color: "#9cdcfe" },
  ],
  [
    { text: "    ",        color: "#d4d4d4" },
    { text: "return ",     color: "#c586c0" },
    { text: "b",           color: "#9cdcfe" },
  ],
  [{ text: "", color: "" }], // blank separator line
  [
    { text: "# ",          color: "#6a9955" },
    { text: "",            color: "#6a9955", typing: true }, // Alex types here
  ],
];

// ── Cursor animation sequence ────────────────────────────────────
// "You" moves between implementation lines; "Alex" stays at the typing line
const CURSOR_SEQ = [
  { you: 3, alex: 8 },
  { you: 4, alex: 8 },
  { you: 2, alex: 8 },
  { you: 5, alex: 8 },
  { you: 6, alex: 8 },
  { you: 3, alex: 8 },
];

// ── Presence avatars (simulates Yjs awareness) ───────────────────
const PRESENCE = [
  { initials: "YO", color: "hsl(172 72% 45%)",  label: "You"  },
  { initials: "AL", color: "hsl(221 83% 65%)",  label: "Alex" },
  { initials: "SR", color: "hsl(38  92% 55%)",  label: "Sara" },
];

// ── Typing text ──────────────────────────────────────────────────
const TYPING_TEXT = "fibonacci(10) = 55";

// ── Cursor bar component ─────────────────────────────────────────
function CursorBar({
  line,
  color,
  label,
  labelSide = "right",
  blinkDelay = "0s",
}: {
  line: number;
  color: string;
  label: string;
  labelSide?: "left" | "right";
  blinkDelay?: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0"
      style={{
        top: `${TOP_PAD + line * LINE_H}px`,
        height: `${LINE_H}px`,
        background: `${color.replace(")", " / 0.10)")}`,
        transition: "top 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)",
        willChange: "top",
      }}
    >
      {/* Vertical cursor line */}
      <div
        className="cc-cursor-blink absolute top-0 bottom-0 w-[1.5px]"
        style={{
          left: labelSide === "right" ? "2.4rem" : "2.4rem",
          background: color,
          animationDelay: blinkDelay,
        }}
      />
      {/* Name label */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 rounded px-1.5 py-px text-[9px] font-bold leading-none ${
          labelSide === "right" ? "right-2" : "left-2"
        }`}
        style={{
          background: color,
          color: "#0d1117",
          opacity: 0.95,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export function HeroEditorMockup() {
  const [cursorStep, setCursorStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const cancelRef = useRef(false);

  const { you: youLine, alex: alexLine } =
    CURSOR_SEQ[cursorStep % CURSOR_SEQ.length];

  // Cursor movement sequence
  useEffect(() => {
    const id = setInterval(
      () => setCursorStep((s) => s + 1),
      2600
    );
    return () => clearInterval(id);
  }, []);

  // Typing simulation (type → pause → erase → pause → repeat)
  useEffect(() => {
    cancelRef.current = false;
    let timeout: ReturnType<typeof setTimeout>;

    function typeChar(idx: number) {
      if (cancelRef.current) return;
      setTypedText(TYPING_TEXT.slice(0, idx));
      if (idx < TYPING_TEXT.length) {
        timeout = setTimeout(() => typeChar(idx + 1), 68);
      } else {
        timeout = setTimeout(() => erase(TYPING_TEXT.length), 2600);
      }
    }

    function erase(idx: number) {
      if (cancelRef.current) return;
      setTypedText(TYPING_TEXT.slice(0, idx));
      if (idx > 0) {
        timeout = setTimeout(() => erase(idx - 1), 38);
      } else {
        timeout = setTimeout(() => typeChar(0), 700);
      }
    }

    // Start after a short delay so user sees the static code first
    timeout = setTimeout(() => typeChar(0), 1400);
    return () => {
      cancelRef.current = true;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <motion.div 
      className="relative select-none" 
      style={{ marginBottom: '24px' }} 
      aria-hidden="true"
      whileHover={{ scale: 1.02, rotateY: -2, rotateX: 2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* ── Ambient glow behind the card ──────────────────────── */}
      <div
        className="pointer-events-none absolute -inset-10 rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 45% 45%, hsl(172 72% 45% / 0.18) 0%, hsl(221 83% 58% / 0.06) 50%, transparent 75%)",
          filter: "blur(18px)",
        }}
      />

      {/* ── Editor window ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[18px]"
        style={{
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.065)",
          boxShadow: [
            "0 0 0 1px rgba(45,212,191,0.11)",
            "0 8px 18px rgba(0,0,0,0.62)",
            "0 28px 72px rgba(0,0,0,0.52)",
            "0 0 120px hsl(172 72% 45% / 0.05)",
          ].join(", "),
          width: "clamp(300px, 48vw, 540px)",
        }}
      >
        {/* ── Title bar ─────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 border-b px-4 py-[10px]"
          style={{
            borderColor: "rgba(255,255,255,0.05)",
            background: "#161b22",
          }}
        >
          {/* Traffic lights */}
          <div className="flex shrink-0 items-center gap-[5px]">
            <span className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
            <span className="h-3 w-3 rounded-full" style={{ background: "hsl(172 72% 45%)" }} />
          </div>

          {/* File tab */}
          <div
            className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px]"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#8b949e",
              fontWeight: 500,
              fontFamily: "monospace",
            }}
          >
            <span role="img" aria-hidden="true">🐍</span>
            solution.py
          </div>

          {/* Presence avatars — Yjs awareness simulation */}
          <div className="ml-auto flex items-center">
            {PRESENCE.map((p, i) => (
              <div
                key={p.initials}
                title={p.label}
                className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{
                  background: p.color,
                  marginLeft: i === 0 ? 0 : "-6px",
                  boxShadow: "0 0 0 1.5px #161b22",
                  zIndex: PRESENCE.length - i,
                  position: "relative",
                }}
              >
                {p.initials}
              </div>
            ))}
            <span
              className="ml-2 text-[10px]"
              style={{ color: "#484f58", fontVariantNumeric: "tabular-nums" }}
            >
              3 live
            </span>
          </div>
        </div>

        {/* ── Code area ─────────────────────────────────────── */}
        <div
          className="relative py-3"
          style={{
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: "12.5px",
            lineHeight: `${LINE_H}px`,
            color: "#d4d4d4",
          }}
        >
          {/* Cursor A — You */}
          <CursorBar
            line={youLine}
            color="hsl(172 72% 45%)"
            label="You"
            labelSide="right"
            blinkDelay="0s"
          />

          {/* Cursor B — Alex */}
          <CursorBar
            line={alexLine}
            color="hsl(221 83% 65%)"
            label="Alex"
            labelSide="right"
            blinkDelay="0.55s"
          />

          {/* Code lines */}
          {CODE.map((tokens, li) => (
            <div key={li} className="flex">
              {/* Line number gutter */}
              <div
                className="shrink-0 select-none pr-3 text-right"
                style={{
                  width: "2.4rem",
                  paddingLeft: "0.5rem",
                  color: "rgba(255,255,255,0.18)",
                  fontSize: "11px",
                  userSelect: "none",
                }}
              >
                {li + 1}
              </div>

              {/* Tokens */}
              <div className="min-w-0 flex-1 pr-3">
                {tokens.map((tok, ti) =>
                  tok.typing ? (
                    <span key={ti} style={{ color: tok.color }}>
                      {typedText}
                      {/* Blinking insertion caret */}
                      <span
                        className="cc-cursor-blink"
                        style={{
                          display: "inline-block",
                          width: "1.5px",
                          height: "13px",
                          background: "hsl(221 83% 65%)",
                          marginLeft: "1px",
                          verticalAlign: "text-bottom",
                          animationDelay: "0.55s",
                        }}
                      />
                    </span>
                  ) : (
                    <span key={ti} style={{ color: tok.color }}>
                      {tok.text}
                    </span>
                  )
                )}
              </div>
            </div>
          ))}

          <div style={{ height: "10px" }} />
        </div>

        {/* ── Status bar ────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-[5px] text-[10px] font-semibold tracking-wide"
          style={{ background: "hsl(172 65% 36%)", color: "hsl(172 72% 95%)" }}
        >
          <span>⚡ CRDT · Synced</span>
          <span style={{ opacity: 0.62 }}>Python 3 · UTF-8</span>
        </div>
      </div>

      {/* ── Floating presence pill ────────────────────────── */}
      {/* Positioned below the editor, slightly offset, soft float */}
      <div
        className="cc-float-pill absolute left-4 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium"
        style={{
          bottom: "-22px",
          background: "rgba(13,17,23,0.94)",
          borderColor: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          color: "rgba(255,255,255,0.65)",
          animationDelay: "2s",
          whiteSpace: "nowrap",
        }}
      >
        {/* Three avatar dots */}
        {PRESENCE.map((p) => (
          <span
            key={p.initials}
            className="h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
        ))}
        3 developers editing live
      </div>
    </motion.div>
  );
}
