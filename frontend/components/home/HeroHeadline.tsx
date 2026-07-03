"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";

// Words that cycle in the headline
const CYCLE_WORDS = ["code", "debug", "review", "ship"] as const;

export function HeroHeadline() {
  const { isAuthenticated } = useAuthStore();
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % CYCLE_WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative z-10">

      {/* ── Eyebrow badge ─────────────────────────────────────── */}
      <div className="cc-hero-enter cc-hero-enter-d1 mb-7 inline-flex w-fit items-center gap-2.5 rounded-full border border-primary/20 bg-primary/[0.07] px-4 py-1.5">
        {/* Live pulse dot */}
        <span
          className="cc-live-dot h-2 w-2 shrink-0 rounded-full"
          style={{ background: "hsl(152 76% 62%)" }}
          aria-hidden="true"
        />
        <span className="text-xs font-medium tracking-wide text-primary/80">
          Real-time collaborative IDE
        </span>
      </div>

      {/* ── Main headline ────────────────────────────────────── */}
      {/* Screen-reader gets the static full sentence; visual shows the animation */}
      <h1
        className="cc-hero-enter cc-hero-enter-d2 font-bold text-foreground"
        style={{
          fontSize: "clamp(2.6rem, 4.4vw, 5rem)",
          lineHeight: 1.06,
          letterSpacing: "-0.032em",
        }}
      >
        {/* Line 1 */}
        <span className="block">Where developers</span>

        {/* Line 2 — cycling word (framer motion, wait for exit before enter) */}
        <span
          className="relative block flex"
          style={{ minHeight: '1.2em' }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={wordIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-primary inline-block"
            >
              {CYCLE_WORDS[wordIdx]}
            </motion.span>
          </AnimatePresence>

          {/* Screen-reader only: announces the current word live */}
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {CYCLE_WORDS[wordIdx]}
          </span>

          {/* Gradient underline — sits below text baseline */}
          <span
            aria-hidden="true"
            className="cc-glow-breathe pointer-events-none absolute left-0"
            style={{
              bottom: "-4px",
              width: "55%",
              height: "3px",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, hsl(172 72% 45%), hsl(221 83% 58%), transparent)",
            }}
          />
        </span>

        {/* Line 3 */}
        <span className="block">together.</span>
      </h1>

      {/* ── Subheadline ──────────────────────────────────────── */}
      <p
        className="cc-hero-enter cc-hero-enter-d3 mt-6 max-w-lg leading-[1.70] text-muted-foreground"
        style={{ fontSize: "clamp(0.975rem, 1.45vw, 1.1rem)" }}
      >
        A full-featured collaborative IDE. Real-time CRDT sync, an AI
        assistant across surfaces, Safe execution in 5 languages, and
        Video calls and Texting — all in a single shared workspace.
      </p>

      {/* ── CTAs ─────────────────────────────────────────────── */}
      <div className="cc-hero-enter cc-hero-enter-d4 mt-8 flex flex-wrap items-center gap-3">

        {/* Primary CTA */}
        <a
          id="hero-cta-create"
          href="/register"
          className="cc-btn-primary group inline-flex items-center gap-2 rounded-xl px-6 py-[11px] text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{
            background:
              "linear-gradient(140deg, hsl(172 72% 48%) 0%, hsl(172 72% 37%) 100%)",
            boxShadow:
              "0 0 0 1px hsl(172 72% 45% / 0.36), 0 4px 24px hsl(172 72% 45% / 0.24), inset 0 1px 0 rgba(255,255,255,0.10)",
            transition: "transform 0.14s ease, box-shadow 0.14s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 0 1px hsl(172 72% 45% / 0.5), 0 8px 32px hsl(172 72% 45% / 0.35), inset 0 1px 0 rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 0 1px hsl(172 72% 45% / 0.36), 0 4px 24px hsl(172 72% 45% / 0.24), inset 0 1px 0 rgba(255,255,255,0.10)";
          }}
        >
          Create a Room
          <ArrowRight
            size={15}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </a>

        {/* Secondary CTA */}
        <motion.a
          id="hero-cta-dashboard"
          href="/dashboard"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-muted/20 px-6 py-[11px] text-sm font-semibold backdrop-blur-sm transition-colors duration-150 hover:border-primary/40 hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {isAuthenticated ? "Open Dashboard" : "Open Dashboard"}
        </motion.a>
      </div>

      {/* ── Tech attribution ─────────────────────────────────── */}
      <div className="cc-hero-enter cc-hero-enter-d5 mt-9 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground/35 font-medium">
          Powered by
        </span>
        {[
          "Monaco Editor",
          "Yjs CRDT",
          "WebRTC",
        ].map((tech) => (
          <span
            key={tech}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground/55"
          >
            <span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/30" aria-hidden="true" />
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
