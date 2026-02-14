import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthUser } from "@odyssey/shared";

/**
 * Auth token claims embedded in signed bearer tokens.
 */
export interface AuthTokenClaims {
  sub: string;
  email: string;
  displayName: string;
  role: AuthUser["role"];
  iat: number;
  exp: number;
}

/**
 * Issues a signed HMAC JWT-like bearer token.
 */
export function issueAccessToken(
  user: AuthUser,
  secret: string,
  ttlSeconds: number
): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: AuthTokenClaims = {
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies a token and returns claims when valid.
 */
export function verifyAccessToken(
  token: string,
  secret: string
): AuthTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts as [string, string, string];
  const expectedSignature = sign(`${header}.${body}`, secret);
  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as AuthTokenClaims;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf-8");
}
