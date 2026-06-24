"use client";

import { create } from "zustand";
import type { AuthUser } from "@/types/auth";
import { setAccessToken } from "@/services/authService";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * In-memory auth store (Zustand).
 * Access token is stored via authService.setAccessToken — NOT in this store,
 * to prevent serialization to localStorage.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: (user, accessToken) => {
    setAccessToken(accessToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
