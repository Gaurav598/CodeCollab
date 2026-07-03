"use client";

import { useEffect, useState } from "react";
import { Code2, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";

export function HomeNavbar() {
  const { isAuthenticated } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    // Check immediately on mount (user may have reloaded mid-scroll)
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "cc-navbar fixed inset-x-0 top-0 z-50",
        "transition-[background,border-color,backdrop-filter] duration-300 ease-in-out",
        scrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* ── Logo ─────────────────────────────────────────────── */}
        <a
          href="/"
          className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="CollabCode — home"
        >
          {/* Icon container */}
          <div
            className={[
              "relative flex h-8 w-8 items-center justify-center rounded-lg",
              "border border-primary/25 bg-primary/10",
              "transition-all duration-200",
              "group-hover:border-primary/55 group-hover:bg-primary/18",
            ].join(" ")}
          >
            <Code2 size={16} className="text-primary" strokeWidth={2.5} />
            {/* Hover glow */}
            <span
              className="pointer-events-none absolute inset-0 rounded-lg bg-primary/20 opacity-0 blur-sm transition-opacity duration-200 group-hover:opacity-100"
              aria-hidden="true"
            />
          </div>

          {/* Wordmark */}
          {/* Wordmark */}
          <span 
            className="text-[18px] font-bold tracking-tight text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(90deg, hsl(var(--foreground)) 0%, hsl(172 72% 55%) 100%)",
            }}
          >
            CollabCode
          </span>
        </a>

        {/* ── Right controls ───────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <a
              href="/dashboard"
              className="cc-btn-primary inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Dashboard
              <ArrowRight size={14} />
            </a>
          ) : (
            <>
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/20 px-5 py-[9px] text-sm font-semibold text-foreground backdrop-blur-sm transition-colors duration-150 hover:border-primary/40 hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Log in
              </motion.a>
              <a
                href="/register"
                className="cc-btn-primary inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Start Building
                <ArrowRight size={14} />
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
