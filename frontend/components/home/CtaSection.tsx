"use client";

import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function CtaSection() {
  const ref = useScrollReveal(0.06);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative z-10 overflow-hidden flex flex-col justify-center min-h-[85vh] pt-8 pb-24"
      aria-labelledby="cta-heading"
    >
      {/* ── Immersive radial bloom ─────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: [
            "radial-gradient(ellipse 70% 55% at 50% 50%, hsl(172 72% 45% / 0.18) 0%, transparent 65%)",
            "radial-gradient(ellipse 90% 40% at 50% 100%, hsl(172 72% 45% / 0.08) 0%, transparent 60%)",
          ].join(", "),
        }}
      />

      {/* ── Horizontal rule above ─────────────────────────────────── */}
      <div className="cc-divider mx-auto mb-24 max-w-3xl" />

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">

        {/* Eyebrow */}
        <div
          className="cc-section-hidden cc-eyebrow mx-auto mb-8 w-fit"
          data-reveal-delay="1"
        >
          <span className="cc-live-dot h-2 w-2 rounded-full" style={{ background: "hsl(152 76% 62%)" }} />
          Available now · Free to start
        </div>

        {/* Large headline */}
        <h2
          id="cta-heading"
          className="cc-section-hidden font-bold tracking-tight text-foreground"
          data-reveal-delay="2"
          style={{
            fontSize: "clamp(2.8rem, 6vw, 6rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.038em",
          }}
        >
          Build something{" "}
          <br className="hidden sm:block" />
          <span
            style={{
              backgroundImage:
                "linear-gradient(135deg, hsl(172 72% 55%), hsl(221 83% 68%), hsl(190 80% 70%))",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "cta-shimmer 5s linear infinite",
            }}
          >
            great, together.
          </span>
        </h2>

        {/* Subheadline */}
        <p
          className="cc-section-hidden mx-auto mt-6 max-w-lg leading-relaxed text-muted-foreground"
          data-reveal-delay="3"
          style={{ fontSize: "clamp(1rem, 1.8vw, 1.2rem)" }}
        >
          Create a room in seconds. Share a link. Write code, review, debug, run it live — together.
        </p>

        {/* CTAs */}
        <div
          className="cc-section-hidden mt-10 flex flex-wrap items-center justify-center gap-4"
          data-reveal-delay="4"
        >
          {/* Primary */}
          <a
            id="cta-create-room"
            href="/register"
            className="cc-btn-primary cc-magnetic-glow group inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-base font-semibold text-primary-foreground transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{
              background:
                "linear-gradient(140deg, hsl(172 72% 50%) 0%, hsl(172 72% 38%) 100%)",
              boxShadow:
                "0 0 0 1px hsl(172 72% 45% / 0.4), 0 6px 32px hsl(172 72% 45% / 0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            Create a Room
            <ArrowRight
              size={17}
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            />
          </a>

          {/* Secondary */}
          <a
            id="cta-sign-in"
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card/30 px-8 py-4 text-base font-semibold backdrop-blur-sm transition-all duration-150 hover:border-primary/35 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Sign In
          </a>
        </div>

        {/* Social proof row */}
        <div
          className="cc-section-hidden mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground/55"
          data-reveal-delay="5"
        >
          {[
            "✓ Completely Free",
            "✓ Instant setup",
            "✓ 5 languages supported",
            "✓ Video and Chat",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Decorative edge gradients ──────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        aria-hidden="true"
        style={{
          height: "30%",
          background:
            "linear-gradient(to bottom, transparent, hsl(var(--background)) 100%)",
        }}
      />
    </section>
  );
}
