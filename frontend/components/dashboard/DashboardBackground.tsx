"use client";

import { motion } from "framer-motion";

export function DashboardBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Aurora Ambient Glows */}
      <div className="absolute top-0 left-1/4 h-[600px] w-[800px] rounded-full bg-teal-500/5 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[600px] rounded-full bg-cyan-500/5 blur-[120px] mix-blend-screen" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[1000px] rounded-full bg-primary/5 blur-[150px] mix-blend-screen" />

      {/* Floating Particles/Stars (Subtle) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />

      {/* Ambient Paths */}
      <svg
        className="absolute w-full h-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="path-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(20, 184, 166, 0)" />
            <stop offset="50%" stopColor="rgba(20, 184, 166, 0.4)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
          </linearGradient>
          <linearGradient id="path-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.4)" />
            <stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
          </linearGradient>
        </defs>

        <motion.path
          d="M -100 200 C 400 300, 600 100, 1200 400"
          fill="none"
          stroke="url(#path-gradient-1)"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 15, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />

        <motion.path
          d="M -100 600 C 300 500, 800 700, 1400 300"
          fill="none"
          stroke="url(#path-gradient-2)"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 2 }}
        />

        <motion.path
          d="M 200 -100 C 300 400, 100 800, 600 1200"
          fill="none"
          stroke="url(#path-gradient-1)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 5 }}
        />
      </svg>
    </div>
  );
}
