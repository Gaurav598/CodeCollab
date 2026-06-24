"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * OAuth success landing page.
 * Backend redirected here after setting the httpOnly refreshToken cookie.
 * We call /auth/me to restore session, then redirect to the app.
 * Per 04_AUTHENTICATION.md OAuth callback handoff.
 */
export default function AuthSuccessPage() {
  const { bootstrap } = useAuth();
  const router = useRouter();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    bootstrap().then(() => {
      router.replace("/");
    });
  }, [bootstrap, router]);

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-logo">
          <span className="auth-logo-text">CollabCode</span>
        </div>
        <p style={{ marginTop: "1.5rem", color: "var(--muted-foreground)" }}>
          Signing you in…
        </p>
        <div className="auth-spinner" aria-label="Loading" />
      </div>
    </main>
  );
}
