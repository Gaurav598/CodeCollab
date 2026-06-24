import { IncomingMessage } from "http";

export interface TokenClaims {
  sub: string;
  iat: number;
  exp: number;
}

export function extractToken(req: IncomingMessage): string | null {
  const url = new URL(req.url || "", "http://localhost");
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// Minimal JWT parser (since we share the same Postgres DB, the backend is the source of truth, 
// but we just need the subject ID from the JWT payload to ask the backend about it)
export function parseJwt(token: string): TokenClaims | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}
