// Home page — thin shell
// All behaviour and visuals live in components/home/*
// Intentionally a server component. Client components manage their own boundaries.

import "./home.css";
import { PageAtmosphere }   from "@/components/home/PageAtmosphere";
import { HomeNavbar }       from "@/components/home/HomeNavbar";
import { HeroSection }      from "@/components/home/HeroSection";
import { FeatureWorkflow }  from "@/components/home/FeatureWorkflow";
import { FeatureExecution } from "@/components/home/FeatureExecution";
import { CtaSection }       from "@/components/home/CtaSection";
import { HomeFooter }       from "@/components/home/HomeFooter";

export const metadata = {
  title: "CollabCode — Real-time Collaborative IDE",
  description:
    "A full-featured collaborative IDE with real-time CRDT sync, an AI assistant across 8 surfaces, sandboxed code execution in 6 languages, and WebRTC video calls — all in a single shared workspace.",
};

export default function HomePage() {
  return (
    <div className="cc-home relative bg-background text-foreground">
      {/*
        PageAtmosphere is position: fixed and sits behind everything (z-index: 0).
        All sections are z-index: 10 (relatively positioned) and appear above it.
        This creates a single, continuous ambient lighting system across the full page.
      */}
      <PageAtmosphere />

      <main className="relative">
        <HomeNavbar />

        {/* 1 · Hero */}
        <HeroSection />

        {/* 2 · Developer Workflow — story-driven split journey */}
        <FeatureWorkflow />

        {/* 5 · Code Execution — full animated pipeline */}
        <FeatureExecution />

        {/* 7 · CTA — immersive second hero */}
        <CtaSection />

        {/* 8 · Footer */}
        <HomeFooter />
      </main>
    </div>
  );
}
