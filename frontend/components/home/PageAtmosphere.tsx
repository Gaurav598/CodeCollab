/**
 * PageAtmosphere — Fixed, full-page background lighting system.
 * This sits behind every section via position: fixed, z-index: 0.
 * The aurora orbs drift slowly, creating a continuous atmosphere
 * that flows through the entire homepage scroll journey.
 *
 * Server component — no client JS required.
 */
export function PageAtmosphere() {
  return (
    <div
      className="cc-page-atmosphere"
      aria-hidden="true"
      role="presentation"
    >
      {/* ── Dot grid — very subtle, full-page ─────────────────── */}
      <svg
        className="cc-dot-grid absolute inset-0 h-full w-full opacity-0"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="page-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="currentColor" opacity="0.055" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#page-dots)" className="text-foreground" />
      </svg>

      {/* ── Top-left teal — primary brand color ───────────────── */}
      <div
        className="cc-aurora-a absolute rounded-full"
        style={{
          top: "-10%",
          left: "-6%",
          width: "clamp(500px, 58vw, 800px)",
          height: "clamp(500px, 58vw, 800px)",
          background: "radial-gradient(ellipse at center, hsl(172 72% 45% / 0.28) 0%, transparent 68%)",
          filter: "blur(70px)",
        }}
      />

      {/* ── Top-right blue ────────────────────────────────────── */}
      <div
        className="cc-aurora-b absolute rounded-full"
        style={{
          top: "8%",
          right: "-8%",
          width: "clamp(400px, 50vw, 680px)",
          height: "clamp(400px, 50vw, 680px)",
          background: "radial-gradient(ellipse at center, hsl(221 83% 58% / 0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* ── Mid-page violet — appears during scroll ───────────── */}
      <div
        className="cc-aurora-c absolute rounded-full"
        style={{
          top: "42%",
          left: "12%",
          width: "clamp(360px, 42vw, 560px)",
          height: "clamp(360px, 42vw, 560px)",
          background: "radial-gradient(ellipse at center, hsl(265 72% 55% / 0.10) 0%, transparent 72%)",
          filter: "blur(90px)",
        }}
      />

      {/* ── Bottom teal — anchors the CTA section ─────────────── */}
      <div
        className="cc-aurora-d absolute rounded-full"
        style={{
          bottom: "-8%",
          right: "5%",
          width: "clamp(380px, 46vw, 620px)",
          height: "clamp(380px, 46vw, 620px)",
          background: "radial-gradient(ellipse at center, hsl(172 72% 45% / 0.22) 0%, transparent 70%)",
          filter: "blur(72px)",
        }}
      />
    </div>
  );
}
