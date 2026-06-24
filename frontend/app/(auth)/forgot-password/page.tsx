"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await requestPasswordReset(email);
      setStatus("success");
      setMessage(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setStatus("error");
      setMessage(msg);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-text">CollabCode</span>
        </div>

        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">Enter your email to receive a reset link</p>

        {status === "success" ? (
          <div className="auth-success" style={{
            background: "hsl(142 72% 29% / .12)",
            border: "1px solid hsl(142 72% 29% / .3)",
            borderRadius: "7px",
            padding: ".6rem .75rem",
            fontSize: ".85rem",
            color: "hsl(142 72% 45%)",
            marginBottom: "1rem"
          }}>
            {message}
          </div>
        ) : (
          <form id="forgot-password-form" onSubmit={handleSubmit} noValidate>
            {status === "error" && (
              <div id="forgot-error" className="auth-error" role="alert">
                {message}
              </div>
            )}

            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="john@example.com"
              />
            </div>

            <button
              id="btn-forgot-submit"
              type="submit"
              className="btn-primary"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending link…" : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="auth-footer-link">
          Remember your password?{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
