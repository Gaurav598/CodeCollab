"use client";

import { useEffect, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { WorkspaceVisual } from "./FeatureWorkspace";

const STEPS = [
  {
    number: "01",
    title: "Create a Room",
    description: "Spin up a collaborative workspace in seconds. Name it, set the language, and you're ready.",
    icon: "🚀",
    color: "hsl(172 72% 45%)",
    detail: "team-sprint-v3 · Python · Private",
  },
  {
    number: "02",
    title: "Invite Your Team",
    description: "Share a room link. Teammates join instantly — no accounts required for guests.",
    icon: "👥",
    color: "hsl(221 83% 62%)",
    detail: "4 members joined · 2 active editors",
  },
  {
    number: "03",
    title: "Collaborate Live",
    description: "Code together with real-time CRDT sync, live cursors, presence, chat and video calls.",
    icon: "⚡",
    color: "hsl(38 92% 55%)",
    detail: "CRDT synced · Yjs · 12ms latency",
  },
  {
    number: "04",
    title: "Run Your Code",
    description: "Execute in isolated sandbox containers. Choose from 5 supported languages and test instantly.",
    icon: "▶",
    color: "hsl(152 76% 55%)",
    detail: "Isolated sandbox · 5 languages",
  },
  {
    number: "05",
    title: "Ship Together",
    description: "The whole team sees the same output. Debug, iterate, and ship confident code together.",
    icon: "🎯",
    color: "hsl(221 83% 62%)",
    detail: "Shared output · Instant iteration",
  },
] as const;

export function FeatureWorkflow() {
  const ref = useScrollReveal(0.06);
  const [activeStep, setActiveStep] = useState(0);

  // Auto-advance the active step every 2.5s
  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative z-10 pt-4 pb-20 sm:pt-6 sm:pb-28"
      aria-labelledby="workflow-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Header + Visual — 2-column layout ──────────────────────── */}
        <div className="mb-20 grid items-center gap-12 lg:grid-cols-2 lg:gap-8 cc-section-hidden" data-reveal-delay="1">
          {/* Left: Text */}
          <div className="max-w-xl">
            <div className="cc-eyebrow mb-5 w-fit">
              <span>🗺️</span> How It Works
            </div>
            <h2
              id="workflow-heading"
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2rem, 3.6vw, 3.2rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.028em",
              }}
            >
              From idea to{" "}
              <span className="text-primary">One workspace</span>
              <br />
              Everything together in one session.
            </h2>
            <p
              className="mt-4 leading-relaxed text-muted-foreground"
              style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)" }}
            >
              CollabCode turns a team's entire development workflow into a Shared code editor, live cursors, video calls, Screen Share and real-time chat — all synchronized in a single room. No switching tools. No context loss.
            </p>
          </div>

          {/* Right: Workspace visual */}
          <div className="relative">
            {/* Scale it down slightly if needed so it fits nicely on the right */}
            <div className="transform scale-[0.85] origin-center lg:origin-right w-[115%] -ml-[7.5%] lg:ml-0 lg:w-full">
              <WorkspaceVisual />
            </div>
          </div>
        </div>

        {/* ── Steps + Active visual ─────────────────────────────── */}
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_420px] xl:gap-20">

          {/* Left — clickable step list */}
          <div className="space-y-1 cc-section-hidden" data-reveal-delay="2">
            {STEPS.map((step, i) => {
              const isActive = activeStep === i;
              return (
                <button
                  key={step.number}
                  onClick={() => setActiveStep(i)}
                  className="group flex w-full items-start gap-5 rounded-2xl p-4 text-left transition-all duration-300"
                  style={{
                    background: isActive ? "hsl(var(--card) / 0.6)" : "transparent",
                    border: isActive
                      ? `1px solid ${step.color}30`
                      : "1px solid transparent",
                    boxShadow: isActive ? `0 0 32px ${step.color}0d` : "none",
                  }}
                  aria-current={isActive ? "step" : undefined}
                >
                  {/* Step number */}
                  <div
                    className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300"
                    style={{
                      background: isActive ? step.color : "hsl(var(--muted) / 0.4)",
                      color: isActive ? "#0d1117" : "hsl(var(--muted-foreground))",
                      boxShadow: isActive ? `0 0 20px ${step.color}40` : "none",
                    }}
                  >
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] font-bold tracking-widest"
                        style={{ color: isActive ? step.color : "hsl(var(--muted-foreground))" }}
                      >
                        {step.number}
                      </span>
                    </div>
                    <p
                      className="font-semibold transition-colors duration-200"
                      style={{
                        color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                        fontSize: "0.975rem",
                      }}
                    >
                      {step.title}
                    </p>
                    <p
                      className="mt-1 text-sm leading-relaxed text-muted-foreground transition-all duration-300"
                      style={{
                        maxHeight: isActive ? "4rem" : "0",
                        overflow: "hidden",
                        opacity: isActive ? 1 : 0,
                      }}
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* Active indicator line */}
                  {isActive && (
                    <div
                      className="ml-auto shrink-0 self-center h-6 w-0.5 rounded-full"
                      style={{ background: step.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right — active step visual card */}
          <div className="sticky top-24 cc-section-hidden" data-reveal-delay="3">
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                background: "#0d1117",
                border: `1px solid ${STEPS[activeStep].color}25`,
                boxShadow: `0 0 60px ${STEPS[activeStep].color}10, 0 20px 60px rgba(0,0,0,0.5)`,
                transition: "border-color 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-3 border-b px-5 py-3.5"
                style={{ borderColor: "rgba(255,255,255,0.05)", background: "#161b22" }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all duration-400"
                  style={{
                    background: `${STEPS[activeStep].color}18`,
                    boxShadow: `0 0 16px ${STEPS[activeStep].color}30`,
                  }}
                >
                  {STEPS[activeStep].icon}
                </div>
                <div>
                  <p
                    className="text-[11px] font-bold"
                    style={{ color: STEPS[activeStep].color }}
                  >
                    Step {STEPS[activeStep].number}
                  </p>
                  <p className="text-sm font-semibold text-white/80">{STEPS[activeStep].title}</p>
                </div>
                <div
                  className="cc-step-active ml-auto h-2 w-2 rounded-full"
                  style={{ background: STEPS[activeStep].color }}
                />
              </div>

              {/* Card body */}
              <div className="p-5">
                <p className="mb-4 text-sm leading-relaxed text-white/60">
                  {STEPS[activeStep].description}
                </p>

                {/* Detail badge */}
                <div
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium"
                  style={{
                    background: `${STEPS[activeStep].color}10`,
                    border: `1px solid ${STEPS[activeStep].color}20`,
                    color: STEPS[activeStep].color,
                  }}
                >
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: STEPS[activeStep].color }} />
                  {STEPS[activeStep].detail}
                </div>

                {/* Progress bar — auto-advances */}
                <div
                  className="mt-6 h-px overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${STEPS[activeStep].color}, ${STEPS[(activeStep + 1) % STEPS.length].color})`,
                      animation: "progress-fill 2.5s linear",
                      animationFillMode: "both",
                    }}
                    key={activeStep} // re-mounts on step change to restart animation
                  />
                </div>
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5 pb-5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className="transition-all duration-200"
                    style={{
                      height: "6px",
                      width: activeStep === i ? "20px" : "6px",
                      borderRadius: "999px",
                      background: activeStep === i ? STEPS[activeStep].color : "rgba(255,255,255,0.15)",
                    }}
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
