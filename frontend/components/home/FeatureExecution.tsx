"use client";

import { useEffect, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const LANGUAGES = [
  { name: "Python",     emoji: "🐍", color: "hsl(50 95% 55%)",   ext: ".py" },
  { name: "C",          emoji: "⚙️", color: "hsl(215 70% 55%)", ext: ".c" },
  { name: "Java",       emoji: "☕", color: "hsl(28 92% 58%)",  ext: ".java" },
  { name: "C++",        emoji: "⚡", color: "hsl(266 70% 65%)", ext: ".cpp" },
  { name: "JavaScript", emoji: "💛", color: "hsl(48 95% 52%)",  ext: ".js" },
] as const;

const PIPELINE_STAGES = [
  { id: "select",  label: "Select Language", icon: "🔧" },
  { id: "compile", label: "Compile",         icon: "⚙️" },
  { id: "execute", label: "Execute",         icon: "▶" },
  { id: "output",  label: "Live Output",     icon: "📤" },
  { id: "success", label: "Success",         icon: "✓" },
] as const;

/* Fake output per language */
const OUTPUTS: Record<typeof LANGUAGES[number]["name"], string[]> = {
  Python: [
    ">>> Running solution.py in sandbox...",
    ">>> Sandbox initialized [Python 3.11]",
    "",
    "fibonacci(10) = 55",
    "fibonacci(20) = 6765",
    "fibonacci(30) = 832040",
    "",
    "✓ Completed in 42ms · Exit 0",
  ],
  C: [
    ">>> Compiling main.c...",
    ">>> gcc -O2 main.c -o app",
    ">>> Running executable...",
    "",
    "Memory successfully allocated: 1024 bytes",
    "Processing sequence...",
    "",
    "✓ Completed in 45ms · Exit 0",
  ],
  Java: [
    ">>> Compiling Solution.java...",
    ">>> javac -cp . Solution.java",
    ">>> Running in JVM sandbox...",
    "",
    "Hello from CollabCode ☕",
    "Result: [1, 1, 2, 3, 5, 8, 13]",
    "",
    "✓ Completed in 210ms · Exit 0",
  ],
  "C++": [
    ">>> Compiling solution.cpp...",
    ">>> g++ -std=c++20 -O2 solution.cpp",
    ">>> Linking...",
    "",
    "Vector sum: 10000",
    "Sorted in 0.003ms (std::sort)",
    "",
    "✓ Compiled + run in 88ms · Exit 0",
  ],
  JavaScript: [
    ">>> Running index.js in Node 20...",
    ">>> Sandbox environment ready",
    "",
    "Promise.all resolved: [55, 6765]",
    "Async operations: 3 completed",
    "",
    "✓ Completed in 31ms · Exit 0",
  ],
};

export function FeatureExecution() {
  const ref = useScrollReveal(0.06);
  const [langIdx, setLangIdx] = useState(0);
  const [stage, setStage] = useState(0);       // 0–4 pipeline stage
  const [visibleLines, setVisibleLines] = useState(0);

  const lang = LANGUAGES[langIdx];
  const outputLines = OUTPUTS[lang.name];

  // Full pipeline cycle: select → compile → execute → output → success → reset
  useEffect(() => {
    setStage(0);
    setVisibleLines(0);

    const timings = [600, 1000, 800, 1200, 800]; // ms per stage
    let accumulated = 0;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    timings.forEach((delay, i) => {
      accumulated += delay;
      const t = setTimeout(() => setStage(i + 1), accumulated);
      timeouts.push(t);
    });

    // Animate output lines during "output" stage (stage 3)
    const outputStart = timings.slice(0, 3).reduce((a, b) => a + b, 0);
    outputLines.forEach((_, li) => {
      const t = setTimeout(
        () => setVisibleLines(li + 1),
        outputStart + 100 + li * 110
      );
      timeouts.push(t);
    });

    // Advance to next language after full cycle
    const total = accumulated + 1400;
    const langT = setTimeout(() => {
      setLangIdx((i) => (i + 1) % LANGUAGES.length);
    }, total);
    timeouts.push(langT);

    return () => timeouts.forEach(clearTimeout);
  }, [langIdx]);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative z-10 pt-12 pb-4 sm:pt-16 sm:pb-8"
      aria-labelledby="execution-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Full-width header ─────────────────────────────────── */}
        <div className="mx-auto mb-16 max-w-2xl text-center cc-section-hidden" data-reveal-delay="1">
          <div className="cc-eyebrow mb-5 mx-auto w-fit">
            <span>▶</span> Code Execution
          </div>
          <h2
            id="execution-heading"
            className="font-bold text-foreground"
            style={{
              fontSize: "clamp(2rem, 3.6vw, 3.2rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.028em",
            }}
          >
            Write it. Run it.
            <br />
            <span className="text-primary">See it instantly.</span>
          </h2>
          <p
            className="mt-4 leading-relaxed text-muted-foreground"
            style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)" }}
          >
            Isolated Execution containers for 5 languages. Your code runs securely — no setup, no configuration.
          </p>
        </div>

        {/* ── Language selector ─────────────────────────────────── */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2 cc-section-hidden" data-reveal-delay="2">
          {LANGUAGES.map((l, i) => (
            <button
              key={l.name}
              onClick={() => setLangIdx(i)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
              style={{
                background: langIdx === i ? `${l.color}15` : "hsl(var(--muted) / 0.3)",
                border: langIdx === i ? `1px solid ${l.color}35` : "1px solid transparent",
                color: langIdx === i ? l.color : "hsl(var(--muted-foreground))",
                boxShadow: langIdx === i ? `0 0 20px ${l.color}15` : "none",
              }}
            >
              <span>{l.emoji}</span>
              {l.name}
            </button>
          ))}
        </div>

        {/* ── Pipeline stages ───────────────────────────────────── */}
        <div className="mb-10 flex items-center justify-center gap-0 cc-section-hidden" data-reveal-delay="2">
          {PIPELINE_STAGES.map((s, i) => {
            const isCompleted = stage > i;
            const isActive = stage === i;
            return (
              <div key={s.id} className="flex items-center">
                {/* Stage node */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-400"
                    style={{
                      background: isCompleted
                        ? lang.color
                        : isActive
                        ? `${lang.color}20`
                        : "hsl(var(--muted) / 0.3)",
                      border: isActive ? `2px solid ${lang.color}` : "2px solid transparent",
                      color: isCompleted ? "#0d1117" : isActive ? lang.color : "hsl(var(--muted-foreground))",
                      boxShadow: isActive ? `0 0 20px ${lang.color}40` : "none",
                    }}
                  >
                    {isCompleted ? "✓" : s.icon}
                  </div>
                  <span
                    className="text-[10px] font-semibold text-center whitespace-nowrap"
                    style={{
                      color: isCompleted || isActive
                        ? isCompleted ? lang.color : "hsl(var(--foreground))"
                        : "hsl(var(--muted-foreground))",
                      opacity: isCompleted || isActive ? 1 : 0.45,
                    }}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Connector line */}
                {i < PIPELINE_STAGES.length - 1 && (
                  <div
                    className="mx-1 h-px transition-all duration-400"
                    style={{
                      width: "clamp(20px, 6vw, 64px)",
                      background: stage > i + 1 || (stage > i)
                        ? `linear-gradient(90deg, ${lang.color}, ${lang.color}50)`
                        : "rgba(255,255,255,0.08)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Terminal output ───────────────────────────────────── */}
        <div className="mx-auto max-w-3xl cc-section-hidden" data-reveal-delay="3">
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "#0d1117",
              border: `1px solid ${lang.color}20`,
              boxShadow: `0 0 0 1px rgba(0,0,0,0.6), 0 24px 64px rgba(0,0,0,0.6), 0 0 80px ${lang.color}08`,
            }}
          >
            {/* Terminal title bar */}
            <div
              className="flex items-center gap-3 border-b px-4 py-2.5"
              style={{ background: "#161b22", borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "hsl(172 72% 45%)" }} />
              </div>
              <span className="text-[11px] font-semibold text-white/40">
                CollabCode — {lang.emoji} {lang.name}
              </span>
              <div
                className="ml-auto flex items-center gap-1.5 rounded px-2 py-0.5 text-[9px] font-bold"
                style={{
                  background: stage >= 4 ? "hsl(152 76% 42% / 0.2)" : `${lang.color}12`,
                  color: stage >= 4 ? "hsl(152 76% 62%)" : lang.color,
                  border: `1px solid ${stage >= 4 ? "hsl(152 76% 42% / 0.3)" : lang.color + "25"}`,
                }}
              >
                {stage < 3 ? "● Initializing" : stage < 5 ? "● Running" : "● Complete"}
              </div>
            </div>

            {/* Terminal body */}
            <div
              className="p-5 min-h-[160px]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                lineHeight: "22px",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              {/* Static prompt line */}
              <div className="mb-1 flex items-center gap-2">
                <span style={{ color: lang.color }}>$</span>
                <span className="text-white/80">
                  collabcode run {lang.ext.slice(1)} solution{lang.ext}
                </span>
              </div>

              {/* Animated output lines */}
              {outputLines.slice(0, visibleLines).map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: line.startsWith("✓")
                      ? "hsl(152 76% 60%)"
                      : line.startsWith(">>>")
                      ? "rgba(255,255,255,0.35)"
                      : line === ""
                      ? "transparent"
                      : "rgba(255,255,255,0.75)",
                    animation: "terminal-line-in 0.15s ease both",
                  }}
                >
                  {line || "\u00A0"}
                </div>
              ))}

              {/* Initializing state — shown before pipeline begins */}
              {stage === 0 && visibleLines === 0 && (
                <div className="mt-1 flex items-center gap-2 text-white/30">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: lang.color, animation: "live-dot 1s ease-in-out infinite" }}
                  />
                  Initializing sandbox environment…
                </div>
              )}

              {/* Blinking cursor while running */}
              {stage >= 2 && stage < 5 && visibleLines < outputLines.length && (
                <div className="flex items-center gap-1 mt-1">
                  <span style={{ color: lang.color }}>$</span>
                  <span
                    className="cc-cursor-blink inline-block w-2 h-4 rounded-sm"
                    style={{ background: lang.color }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
