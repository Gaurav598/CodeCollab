"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { HeroHeadline } from "./HeroHeadline";
import { HeroEditorMockup } from "./HeroEditorMockup";

export function HeroSection() {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const enabledRef = useRef(false); // blocks parallax during entrance animation
  const [scrolled, setScrolled] = useState(false);

  // Enable parallax only AFTER the entrance animation completes
  // cc-mockup-enter: delay 0.28s + duration 0.9s = ~1.2s total
  useEffect(() => {
    const t = setTimeout(() => {
      enabledRef.current = true;
    }, 1300);
    return () => clearTimeout(t);
  }, []);

  // Scroll indicator visibility
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mouse parallax — RAF-throttled, only translates/rotates, no layout props
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabledRef.current) return;
      if (rafRef.current !== null) return; // already queued

      // Capture values before RAF fires (synthetic events may be cleaned up)
      const { clientX, clientY } = e;
      const rect = e.currentTarget.getBoundingClientRect();

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!parallaxRef.current) return;

        const x = (clientX - rect.left) / rect.width  - 0.5; // -0.5 → 0.5
        const y = (clientY - rect.top)  / rect.height - 0.5;

        // Moderate perspective values — premium feel without VR discomfort
        parallaxRef.current.style.transform = [
          "perspective(1100px)",
          `rotateY(${x *  5}deg)`,
          `rotateX(${-y * 2.5}deg)`,
          `translate3d(${x * 14}px, ${y * 7}px, 0)`,
        ].join(" ");
      });
    },
    []
  );

  // Return to neutral on leave — smooth spring-like easing
  const handleMouseLeave = useCallback(() => {
    if (!parallaxRef.current) return;
    parallaxRef.current.style.transition =
      "transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)";
    parallaxRef.current.style.transform =
      "perspective(1100px) rotateY(0deg) rotateX(0deg) translate3d(0,0,0)";
    // Remove transition after it completes so RAF can take over again
    const t = setTimeout(() => {
      if (parallaxRef.current) parallaxRef.current.style.transition = "";
    }, 860);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative flex min-h-svh items-center overflow-hidden pt-16"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="CollabCode — real-time collaborative IDE"
    >


      {/* ── Main content grid ──────────────────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-0">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">

          {/* Left — headline + CTAs */}
          <HeroHeadline />

          {/* Right — editor mockup (desktop only; parallax wrapper) */}
          <div className="hidden lg:flex lg:items-center lg:justify-end lg:py-12">
            {/*
              Outer div: receives JS parallax transform
              Inner HeroEditorMockup: has cc-mockup-enter entrance animation
              They stack cleanly — parent perspective, child motion
            */}
            <div
              ref={parallaxRef}
              style={{
                willChange: "transform",
                // Slight initial tilt to hint at 3D before mouse interaction
                transform:
                  "perspective(1100px) rotateY(-2deg) rotateX(0.5deg)",
              }}
            >
              <HeroEditorMockup />
            </div>
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ───────────────────────────────────── */}
      <div
        className="pointer-events-none absolute bottom-8 left-0 right-0 flex justify-center"
        aria-hidden="true"
        style={{
          opacity: scrolled ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      >
        <div className="cc-scroll-bounce flex flex-col items-center gap-0.5">
          <ChevronDown
            size={18}
            className="text-muted-foreground/40"
            strokeWidth={1.5}
          />
        </div>
      </div>
    </section>
  );
}
