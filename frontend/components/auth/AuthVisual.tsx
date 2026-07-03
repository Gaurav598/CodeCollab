"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const CODE_SNIPPETS = [
  {
    lang: "TypeScript",
    color: "hsl(221 83% 62%)",
    code: `const syncWorkspace = async (id: string) => {
  const doc = new Y.Doc();
  const provider = new WebRTCProvider(id, doc);
  return provider.awareness;
};`,
    top: "15%",
    left: "10%",
    delay: 0,
  },
  {
    lang: "Rust",
    color: "hsl(28 92% 58%)",
    code: `fn analyze_ast(tree: &SyntaxTree) -> Result<(), Error> {
    for node in tree.nodes.iter() {
        validate_mutability(node)?;
    }
    Ok(())
}`,
    top: "60%",
    left: "55%",
    delay: 1.5,
  },
  {
    lang: "Python",
    color: "hsl(50 95% 55%)",
    code: `@dataclass
class CodeModel:
    temperature: float = 0.7
    max_tokens: int = 4096
    
    def generate(self, prompt: str):
        pass`,
    top: "35%",
    left: "30%",
    delay: 3,
  }
];

const CURSORS = [
  { name: "Alex", color: "hsl(221 83% 62%)", top: "25%", left: "20%", delay: 0.5 },
  { name: "Sara", color: "hsl(38 92% 52%)", top: "45%", left: "65%", delay: 2 },
  { name: "AI", color: "hsl(172 72% 45%)", top: "75%", left: "30%", delay: 3.5 },
];

export function AuthVisual() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      {/* ── Ambient Aurora Background ─────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(20, 20, 20, 0) 0%, #0a0a0a 100%)",
        }}
      />
      
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(172 72% 45% / 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute -bottom-1/4 -right-1/4 h-[900px] w-[900px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(221 83% 58% / 0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* ── Floating Code Snippets ──────────────────────────────── */}
      <div className="absolute inset-0 z-10 perspective-[1000px]">
        {CODE_SNIPPETS.map((snippet, i) => (
          <motion.div
            key={i}
            className="absolute rounded-xl border p-4 shadow-2xl backdrop-blur-md"
            style={{
              top: snippet.top,
              left: snippet.left,
              background: "rgba(20, 20, 25, 0.4)",
              borderColor: "rgba(255, 255, 255, 0.05)",
              color: "#d4d4d4",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              lineHeight: "1.6",
              transformStyle: "preserve-3d",
            }}
            initial={{ opacity: 0, y: 30, rotateX: 10, rotateY: -10 }}
            animate={{ 
              opacity: 1, 
              y: [0, -15, 0],
              rotateX: [10, 5, 10],
              rotateY: [-10, -5, -10]
            }}
            transition={{ 
              opacity: { duration: 1, delay: snippet.delay },
              y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: snippet.delay },
              rotateX: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: snippet.delay },
              rotateY: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: snippet.delay },
            }}
          >
            {/* Window Controls */}
            <div className="mb-3 flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500/50" />
              <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
              <div className="h-2 w-2 rounded-full bg-green-500/50" />
              <span className="ml-2 text-[9px] font-bold tracking-wider" style={{ color: snippet.color }}>
                {snippet.lang}
              </span>
            </div>
            
            <pre className="m-0 bg-transparent p-0">
              <code>{snippet.code}</code>
            </pre>
          </motion.div>
        ))}
      </div>

      {/* ── Live Cursors ────────────────────────────────────────── */}
      {CURSORS.map((cursor, i) => (
        <motion.div
          key={i}
          className="absolute z-20 flex items-start gap-1"
          style={{ top: cursor.top, left: cursor.left }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: [0, 60, -30, 0],
            y: [0, -40, 30, 0],
          }}
          transition={{
            opacity: { duration: 0.5, delay: cursor.delay },
            scale: { duration: 0.5, delay: cursor.delay },
            x: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: cursor.delay },
            y: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: cursor.delay },
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={cursor.color}
            stroke="white"
            strokeWidth="1.5"
            className="drop-shadow-md"
            style={{ transform: "rotate(-15deg)" }}
          >
            <path d="M4 2v20l7-7 4 10 3-1-4-10h6L4 2z" />
          </svg>
          <div
            className="rounded px-2 py-0.5 text-[9px] font-bold text-white shadow-lg"
            style={{ background: cursor.color }}
          >
            {cursor.name}
          </div>
        </motion.div>
      ))}
      
      {/* ── Vignette Overlay ────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_150px_rgba(10,10,10,0.8)] z-30" />
    </div>
  );
}
