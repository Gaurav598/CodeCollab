import { serviceConfig } from "./config";
import type { AuthResponse } from "@/types/auth";

/**
 * In-memory access token store (not localStorage — avoids XSS token theft).
 * See 04_AUTHENTICATION.md and 18_SECURITY.md.
 */
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

/** Base fetch wrapper that injects Authorization header when a token exists. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }
  const res = await fetch(`${serviceConfig.apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include", // sends httpOnly refreshToken cookie
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const code = body?.error?.code ?? "UNKNOWN_ERROR";
    const message = body?.error?.message ?? "An error occurred";
    throw Object.assign(new Error(message), { code, status: res.status });
  }
  return res.json() as Promise<T>;
}

// ── Auth API calls ──────────────────────────────────────────────

export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function login(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  return apiFetch<{ accessToken: string }>("/auth/refresh", { method: "POST" });
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

export async function me(): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/me");
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/password-reset-request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/password-reset", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}
