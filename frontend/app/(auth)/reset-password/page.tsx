"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/services/authService";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing reset token.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setStatus("loading");
    setMessage(null);
    try {
      const res = await resetPassword(token, newPassword);
      setStatus("success");
      setMessage(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      setStatus("error");
      setMessage(msg);
    }
  }

  if (status === "success") {
    return (
      <>
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
        <Link href="/login" className="btn-primary" style={{ display: "block", textAlign: "center" }}>
          Return to Sign In
        </Link>
      </>
    );
  }

  return (
    <form id="reset-password-form" onSubmit={handleSubmit} noValidate>
      {status === "error" && (
        <div id="reset-error" className="auth-error" role="alert">
          {message}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="newPassword">New Password</label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          placeholder="••••••••"
          disabled={!token}
        />
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          placeholder="••••••••"
          disabled={!token}
        />
      </div>

      <button
        id="btn-reset-submit"
        type="submit"
        className="btn-primary"
        disabled={status === "loading" || !token}
      >
        {status === "loading" ? "Resetting…" : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-text">CollabCode</span>
        </div>

        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your new secure password</p>

        <Suspense fallback={<div style={{ textAlign: "center", margin: "2rem 0", color: "#888" }}>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="auth-footer-link" style={{ marginTop: "1.5rem" }}>
          <Link href="/login">Back to Sign In</Link>
        </p>
      </div>
    </main>
  );
}
