// HeroCanvas — Decorative background layer
// Pure CSS/SVG. No client-side JS required.
// Three aurora orbs + dot-matrix grid + vignette mask.

export function HeroCanvas() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      role="presentation"
    >
      {/* ── Dot matrix grid ─────────────────────────────────────── */}
      <svg
        className="cc-dot-grid absolute inset-0 h-full w-full opacity-0"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="hero-dots"
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1.1" fill="currentColor" opacity="0.08" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#hero-dots)"
          className="text-foreground"
        />
      </svg>

      {/* ── Aurora blob A — primary teal ─────────────────────────── */}
      <div
        className="cc-aurora-a absolute rounded-full"
        style={{
          top: "-12%",
          left: "-4%",
          width: "clamp(420px, 56vw, 750px)",
          height: "clamp(420px, 56vw, 750px)",
          background:
            "radial-gradient(ellipse at center, hsl(172 72% 45% / 0.32) 0%, transparent 68%)",
          filter: "blur(64px)",
        }}
      />

      {/* ── Aurora blob B — accent blue ──────────────────────────── */}
      <div
        className="cc-aurora-b absolute rounded-full"
        style={{
          top: "15%",
          right: "-4%",
          width: "clamp(350px, 50vw, 650px)",
          height: "clamp(350px, 50vw, 650px)",
          background:
            "radial-gradient(ellipse at center, hsl(221 83% 58% / 0.22) 0%, transparent 70%)",
          filter: "blur(72px)",
        }}
      />

      {/* ── Aurora blob C — soft violet tint ─────────────────────── */}
      <div
        className="cc-aurora-c absolute rounded-full"
        style={{
          bottom: "-6%",
          left: "28%",
          width: "clamp(260px, 36vw, 460px)",
          height: "clamp(260px, 36vw, 460px)",
          background:
            "radial-gradient(ellipse at center, hsl(265 72% 55% / 0.11) 0%, transparent 72%)",
          filter: "blur(90px)",
        }}
      />

      {/* ── Radial vignette — contains bloom to hero center ─────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 38%, transparent 18%, hsl(var(--background)) 76%)",
        }}
      />

      {/* ── Bottom fade — blends into next section ───────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "38%",
          background:
            "linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)",
        }}
      />
    </div>
  );
}
