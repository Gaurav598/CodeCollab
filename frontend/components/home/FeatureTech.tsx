"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

/* Technologies that actually power CollabCode */
const TECH_NODES = [
  /* Core — inner ring */
  { id: "monaco",   label: "Monaco Editor",  icon: "⌨️", color: "hsl(172 72% 45%)", ring: "inner", angle: 0   },
  { id: "yjs",      label: "Yjs CRDT",       icon: "🔗", color: "hsl(221 83% 62%)", ring: "inner", angle: 90  },
  { id: "webrtc",   label: "WebRTC",         icon: "📹", color: "hsl(38 92% 55%)",  ring: "inner", angle: 180 },
  { id: "spring",   label: "Spring Boot",    icon: "🍃", color: "hsl(142 72% 50%)", ring: "inner", angle: 270 },
  /* Outer ring */
  { id: "nextjs",   label: "Next.js",        icon: "▲",  color: "hsl(0 0% 80%)",   ring: "outer", angle: 45  },
  { id: "redis",    label: "Redis",          icon: "⚡", color: "hsl(0 75% 60%)",   ring: "outer", angle: 135 },
  { id: "mongodb",  label: "MongoDB",        icon: "🌿", color: "hsl(142 60% 50%)", ring: "outer", angle: 225 },
  { id: "stomp",    label: "WebSocket",      icon: "🌐", color: "hsl(270 72% 62%)", ring: "outer", angle: 315 },
] as const;

/* Connection pairs between nodes */
const CONNECTIONS = [
  ["monaco", "yjs"],
  ["yjs", "spring"],
  ["spring", "redis"],
  ["spring", "mongodb"],
  ["webrtc", "spring"],
  ["nextjs", "spring"],
  ["nextjs", "monaco"],
  ["stomp", "spring"],
  ["stomp", "yjs"],
] as const;

/* Compute x/y from angle + radius */
function polar(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
}

/* SVG canvas dimensions */
const CX = 240; // center x
const CY = 240; // center y
const INNER_R = 90;
const OUTER_R = 170;

/* Map id → position */
const positions: Record<string, { x: number; y: number }> = {};
TECH_NODES.forEach((n) => {
  const r = n.ring === "inner" ? INNER_R : OUTER_R;
  const p = polar(n.angle, r);
  positions[n.id] = { x: CX + p.x, y: CY + p.y };
});

export function FeatureTech() {
  const ref = useScrollReveal(0.06);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative z-10 py-28 sm:py-36"
      aria-labelledby="tech-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 xl:gap-20">

          {/* Left — SVG network ──────────────────────────────────── */}
          <div
            className="flex items-center justify-center cc-section-hidden cc-reveal-left"
            data-reveal-delay="2"
          >
            <div className="relative cc-float-a" style={{ width: 480, height: 480 }}>
              {/* Subtle outer glow */}
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 70% at 50% 50%, hsl(172 72% 45% / 0.08) 0%, transparent 70%)",
                }}
              />

              <svg
                viewBox="0 0 480 480"
                width={480}
                height={480}
                aria-hidden="true"
                role="img"
              >
                <defs>
                  {/* Gradient for connection lines */}
                  <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(172 72% 45%)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="hsl(221 83% 62%)" stopOpacity="0.15" />
                  </linearGradient>

                  {/* Radial gradient for center core */}
                  <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="hsl(172 72% 45%)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="hsl(172 72% 45%)" stopOpacity="0" />
                  </radialGradient>

                  {/* Drop shadow filter */}
                  <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Center core glow */}
                <circle cx={CX} cy={CY} r={36} fill="url(#core-grad)" />
                <circle cx={CX} cy={CY} r={22} fill="hsl(172 72% 45% / 0.10)" stroke="hsl(172 72% 45% / 0.25)" strokeWidth="1" />
                <text x={CX} y={CY + 5} textAnchor="middle" fontSize="14" fill="hsl(172 72% 65%)">CC</text>

                {/* Connection lines */}
                {CONNECTIONS.map(([a, b]) => {
                  const pa = positions[a];
                  const pb = positions[b];
                  if (!pa || !pb) return null;
                  return (
                    <line
                      key={`${a}-${b}`}
                      x1={pa.x}
                      y1={pa.y}
                      x2={pb.x}
                      y2={pb.y}
                      stroke="url(#line-grad)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Orbit ring guides */}
                <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 6" />
                <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" strokeDasharray="3 8" />

                {/* Tech nodes */}
                {TECH_NODES.map((node) => {
                  const pos = positions[node.id];
                  const nodeR = node.ring === "inner" ? 22 : 18;
                  return (
                    <g key={node.id} filter="url(#node-glow)">
                      {/* Node background */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={nodeR}
                        fill={`${node.color.replace(")", " / 0.12)").replace("hsl(", "hsl(")}`}
                        stroke={node.color.replace(")", " / 0.35)").replace("hsl(", "hsl(")}
                        strokeWidth="1"
                      />
                      {/* Icon */}
                      <text
                        x={pos.x}
                        y={pos.y + 5}
                        textAnchor="middle"
                        fontSize={node.ring === "inner" ? "14" : "12"}
                      >
                        {node.icon}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating labels — positioned absolutely around the SVG */}
              {TECH_NODES.map((node) => {
                const pos = positions[node.id];
                // Convert SVG coords to percentage positions
                const left = (pos.x / 480) * 100;
                const top = (pos.y / 480) * 100;
                // Offset label away from center
                const offsetX = pos.x > CX ? 28 : -28;
                const offsetY = pos.y > CY ? 28 : -20;

                return (
                  <div
                    key={`label-${node.id}`}
                    className="pointer-events-none absolute whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold"
                    style={{
                      left: `calc(${left}% + ${offsetX}px)`,
                      top: `calc(${top}% + ${offsetY}px)`,
                      background: node.color.replace(")", " / 0.10)").replace("hsl(", "hsl("),
                      color: node.color,
                      border: `1px solid ${node.color.replace(")", " / 0.20)").replace("hsl(", "hsl(")}`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {node.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — text ─────────────────────────────────────────── */}
          <div className="cc-section-hidden cc-reveal-right" data-reveal-delay="2">
            <div className="cc-eyebrow mb-5 w-fit">
              <span>⚙️</span> The Stack
            </div>
            <h2
              id="tech-heading"
              className="font-bold text-foreground"
              style={{
                fontSize: "clamp(2rem, 3.6vw, 3.2rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.028em",
              }}
            >
              Built on a{" "}
              <span className="text-primary">battle-tested</span>
              <br />
              foundation.
            </h2>
            <p
              className="mt-4 leading-relaxed text-muted-foreground"
              style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)" }}
            >
              Every technology in CollabCode was chosen for production reliability at scale. No experimental libraries. No fragile glue code.
            </p>

            {/* Tech list */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { icon: "⌨️", name: "Monaco Editor",  desc: "VS Code's editor engine" },
                { icon: "🔗", name: "Yjs CRDT",       desc: "Conflict-free real-time sync" },
                { icon: "📹", name: "WebRTC",         desc: "Peer-to-peer video & audio" },
                { icon: "🍃", name: "Spring Boot",    desc: "Production-grade Java API" },
                { icon: "⚡", name: "Redis",          desc: "Sub-millisecond fan-out" },
                { icon: "🌿", name: "MongoDB",        desc: "Flexible document storage" },
                { icon: "▲",  name: "Next.js",        desc: "App Router, server components" },
                { icon: "🌐", name: "STOMP/WS",       desc: "Real-time message transport" },
              ].map((t) => (
                <div
                  key={t.name}
                  className="cc-glow-border flex items-center gap-3 rounded-xl border border-border/35 bg-card/25 p-3 backdrop-blur-sm"
                >
                  <span className="text-xl shrink-0">{t.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
