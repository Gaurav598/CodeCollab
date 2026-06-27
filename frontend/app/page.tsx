"use client";

import { ArrowRight, Bot, Code2, GitBranch, Lock, Play, Radio, Sparkles, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const features = [
  { title: "Live CRDT Editing", body: "Yjs-backed collaboration with cursors, selections, presence, and Redis fan-out.", icon: <Users size={18} /> },
  { title: "AI Gateway", body: "Autocomplete, chat, refactor, review, tests, docs, and explanations through backend-only providers.", icon: <Bot size={18} /> },
  { title: "Secure Execution", body: "Run Java, C++, Python, JavaScript, TypeScript, and Go in isolated sandbox containers.", icon: <Play size={18} /> },
  { title: "Built For Teams", body: "Rooms, projects, file trees, chat, notifications, and video collaboration in one workspace.", icon: <Radio size={18} /> },
];

const aiFeatures = ["Autocomplete", "AI Chat", "Refactor", "Bug Detection", "Explain", "Review", "Test Generation", "Documentation"];

import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="fixed left-0 right-0 top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-semibold">
            <Code2 size={19} className="text-primary" />
            CollabCode
          </a>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <a href="/dashboard" className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                Dashboard <ArrowRight size={15} />
              </a>
            ) : (
              <>
                <a href="/login" className="hidden rounded border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex">
                  Log in
                </a>
                <a href="/register" className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                  Start <ArrowRight size={15} />
                </a>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <section className="relative min-h-[92svh] overflow-hidden border-b border-border pt-14">
        <img
          src="/images/collabcode-hero.png"
          alt=""
          aria-hidden="true"
          className="hero-image-mask absolute inset-y-0 right-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/18" />
        <div className="relative mx-auto flex min-h-[calc(92svh-3.5rem)] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles size={14} className="text-primary" />
              AI-powered pair programming for real teams
            </div>
            <h1 className="text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              CollabCode
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              A production-grade collaborative IDE with real-time editing, secure code execution, voice and video, and a backend AI platform built for autocomplete, refactors, reviews, tests, and docs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/register" className="inline-flex items-center gap-2 rounded bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                Create workspace <ArrowRight size={16} />
              </a>
              <a href="/dashboard" className="inline-flex items-center gap-2 rounded border border-border bg-background/70 px-5 py-3 text-sm font-semibold transition hover:border-primary">
                Open dashboard
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-3 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <article key={feature.title} className="rounded border border-border bg-muted/20 p-5">
            <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded border border-border text-primary">
              {feature.icon}
            </div>
            <h2 className="text-base font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="border-y border-border bg-muted/15">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold">Architecture overview</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              The frontend never calls AI providers directly. Requests flow through Spring Boot, provider adapters, rate limits, prompt sanitization, timeouts, and fallback handling before reaching Gemini, OpenAI, Claude, or DeepSeek.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Next.js Workspace", "Spring Boot API", "Provider Adapter Layer", "Sandbox + Sync Services"].map((item, index) => (
              <div key={item} className="rounded border border-border bg-background p-4">
                <div className="mb-3 flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div className="font-medium">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">AI features showcase</h2>
            <p className="mt-3 text-sm text-muted-foreground">Eight production surfaces, one backend gateway.</p>
          </div>
          <Lock size={20} className="text-primary" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {aiFeatures.map((feature) => (
            <div key={feature} className="rounded border border-border bg-muted/20 px-4 py-3 text-sm font-medium">
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Build together without leaving the editor.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Rooms, code, chat, execution, AI, and calls share one focused workspace.</p>
          </div>
          <a href="/register" className="inline-flex w-fit items-center gap-2 rounded bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
            Get started <GitBranch size={16} />
          </a>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        CollabCode · Real-time collaboration, AI assistance, and secure execution.
      </footer>
    </main>
  );
}
