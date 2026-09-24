import { serviceConfig } from "./config";
import type { AuthResponse } from "@/types/auth";

/**
 * In-memory access token store (not localStorage — avoids XSS token theft).
 * See 04_AUTHENTICATION.md and 18_SECURITY.md.
 */
let _accessToken: string | null = null;
let _refreshTimer: ReturnType<typeof setTimeout> | null = null;
let _refreshInFlight: Promise<string> | null = null;
const tokenSubscribers = new Set<(token: string | null) => void>();

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (_refreshTimer) clearTimeout(_refreshTimer);
  _refreshTimer = null;
  tokenSubscribers.forEach(subscriber => subscriber(token));

  if (token) {
    const expiresAt = tokenExpiryMs(token);
    if (expiresAt) {
      const delay = Math.max(5_000, expiresAt - Date.now() - 60_000);
      _refreshTimer = setTimeout(() => {
        void refreshAccessToken().catch(() => setAccessToken(null));
      }, delay);
    }
  }
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function subscribeAccessToken(subscriber: (token: string | null) => void): () => void {
  tokenSubscribers.add(subscriber);
  return () => tokenSubscribers.delete(subscriber);
}

function tokenExpiryMs(token: string): number | null {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string> {
  if (_refreshInFlight) return _refreshInFlight;
  _refreshInFlight = fetch(`${serviceConfig.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  }).then(async response => {
    if (!response.ok) throw new Error('Session refresh failed');
    const body = await response.json() as { accessToken: string };
    setAccessToken(body.accessToken);
    return body.accessToken;
  }).finally(() => {
    _refreshInFlight = null;
  });
  return _refreshInFlight;
}

/** Base fetch wrapper that injects Authorization header when a token exists. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }
  let res = await fetch(`${serviceConfig.apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include", // sends httpOnly refreshToken cookie
  });
  const isAuthBootstrap = path === '/auth/login' || path === '/auth/register'
    || path === '/auth/refresh' || path === '/auth/me';
  if (res.status === 401 && allowRefresh && !isAuthBootstrap) {
    try {
      const token = await refreshAccessToken();
      headers.Authorization = `Bearer ${token}`;
      res = await fetch(`${serviceConfig.apiBaseUrl}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch {
      setAccessToken(null);
    }
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const code = body?.error?.code ?? "UNKNOWN_ERROR";
    const message = body?.error?.message ?? "An error occurred";
    throw Object.assign(new Error(message), { code, status: res.status });
  }
  if (res.status === 204) {
    return undefined as T;
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
  return { accessToken: await refreshAccessToken() };
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
