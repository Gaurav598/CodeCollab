"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { serviceConfig } from "@/services/config";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp(username, email, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : "Registration failed";
      
      // Map generic or technical errors to friendly messages
      if (
        msg.toLowerCase().includes("registration failed") || 
        msg.toLowerCase().includes("already exists") || 
        msg.toLowerCase().includes("conflict")
      ) {
        msg = "We couldn't create your account. This email or username might already be in use.";
      }
      
      setError(msg);
      setLoading(false);
    }
  }

  const oauthBase = serviceConfig.apiBaseUrl;

  return (
    <main className="min-h-screen w-full bg-background flex">
      {/* Left Panel: Auth Visual (Hidden on mobile/tablet) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <AuthVisual />
        {/* Subtle gradient overlay to blend edge */}
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-40" />
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-50">
        {/* Mobile Background Glow */}
        <div className="absolute inset-0 lg:hidden pointer-events-none fixed">
          <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative z-10 py-10 lg:py-0"
        >
          {/* Glassmorphic Card */}
          <div className="rounded-3xl border border-border/40 bg-card/30 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
            <div className="mb-6 text-center">
              <Link href="/" className="inline-block transition-transform hover:scale-105">
                <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-emerald-400">
                  CollabCode
                </span>
              </Link>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Start collaborating in real time
              </p>
            </div>

            {/* OAuth Buttons */}
            <div className="flex flex-col gap-2.5">
              <OAuthButton href={`${oauthBase}/auth/google`} icon={<GoogleIcon />}>
                Sign up with Google
              </OAuthButton>
              <OAuthButton href={`${oauthBase}/auth/github`} icon={<GitHubIcon />}>
                Sign up with GitHub
              </OAuthButton>
            </div>

            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-border/40" />
              <span className="mx-4 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                Or create an account
              </span>
              <div className="flex-grow border-t border-border/40" />
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <AuthInput
                id="username"
                label="Username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                placeholder="Choose a username"
                error={error?.toLowerCase().includes("username") ? error : null}
              />

              <AuthInput
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                error={error?.toLowerCase().includes("email") ? error : null}
              />

              <PasswordInput
                id="password"
                label="Password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Create a strong password"
                showStrength={true} // Enable strength meter for registration
                error={error && !error.toLowerCase().includes("username") && !error.toLowerCase().includes("email") ? error : null}
              />

              <div className="mt-2">
                <AuthButton type="submit" loading={loading} success={success}>
                  Create Account
                </AuthButton>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary transition-colors hover:text-primary/80">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.216.69.825.572C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}
