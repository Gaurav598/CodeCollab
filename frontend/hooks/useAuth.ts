"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import * as authService from "@/services/authService";

/**
 * useAuth — convenience hook wrapping the auth store + service calls.
 */
export function useAuth() {
  const { user, isLoading, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const signIn = useCallback(async (identifier: string, password: string) => {
    const res = await authService.login(identifier, password);
    setAuth(res.user, res.accessToken);
    import("@/services/stompClient").then(({ stompService }) => stompService.connect());
    return res.user;
  }, [setAuth]);

  const signUp = useCallback(async (username: string, email: string, password: string) => {
    const res = await authService.register(username, email, password);
    setAuth(res.user, res.accessToken);
    import("@/services/stompClient").then(({ stompService }) => stompService.connect());
    return res.user;
  }, [setAuth]);

  const signOut = useCallback(async () => {
    await authService.logout().catch(() => {});
    clearAuth();
    import("@/services/stompClient").then(({ stompService }) => stompService.disconnect());
  }, [clearAuth]);

  /** Bootstrap: call on page load to restore session from httpOnly cookie */
  const bootstrap = useCallback(async () => {
    try {
      const res = await authService.me();
      setAuth(res.user, res.accessToken);
    } catch {
      clearAuth();
    }
  }, [setAuth, clearAuth]);

  return { user, isLoading, isAuthenticated, signIn, signUp, signOut, bootstrap };
}
