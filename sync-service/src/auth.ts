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

// Minimal JWT parser (the sync service has no direct DB access; it reads the userId
// from the JWT payload to call the backend membership API for authorization)
export function parseJwt(token: string): TokenClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    if (!base64Url) return null;
    const jsonPayload = Buffer.from(base64Url, "base64url").toString("utf8");
    const claims = JSON.parse(jsonPayload);
    if (!claims.sub || typeof claims.sub !== "string") return null;
    if (typeof claims.exp !== "number") return null;
    if (claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch (e) {
    return null;
  }
}
