import { IncomingMessage } from "http";
import { createRequire } from "module";
import { config } from "./config.js";

const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken") as {
  verify(token: string, secret: string, options: { algorithms: string[] }): Record<string, unknown>;
};

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

/** Verify the access-token signature and expiry before trusting its subject. */
export function verifyJwt(token: string): TokenClaims | null {
  try {
    const claims = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ["HS256", "HS384", "HS512"],
    });
    if (!claims.sub || typeof claims.sub !== "string") return null;
    if (typeof claims.exp !== "number") return null;
    if (claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims as unknown as TokenClaims;
  } catch {
    return null;
  }
}
