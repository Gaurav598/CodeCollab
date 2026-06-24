/**
 * Types shared across auth service and store.
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
  provider: "local" | "google" | "github";
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
