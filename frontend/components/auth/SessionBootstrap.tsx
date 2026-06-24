"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Mounts once at layout level.
 * Calls /auth/me to restore session from the httpOnly refresh cookie.
 * Per 04_AUTHENTICATION.md token flow step 3.
 */
export function SessionBootstrap() {
  const { bootstrap } = useAuth();
  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
