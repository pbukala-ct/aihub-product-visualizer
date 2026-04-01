import { createHmac } from "crypto";
import bcrypt from "bcryptjs";
import { CATALOGUE_SESSION_SECRET } from "astro:env/server";

const COOKIE_PREFIX = "cat_auth_";
const BCRYPT_COST = 12;

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// Session tokens
// Format: base64url(payload).hmac-sha256(payload)
// Payload: { sourceId, pfp (first 8 chars of hash), iat }
// ---------------------------------------------------------------------------

interface TokenPayload {
  sourceId: string;
  pfp: string;
  iat: number;
}

export function signToken(sourceId: string, passwordHash: string): string {
  const payload: TokenPayload = {
    sourceId,
    pfp: passwordHash.slice(0, 8),
    iat: Math.floor(Date.now() / 1000),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", CATALOGUE_SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string, sourceId: string, passwordHash: string): boolean {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return false;

    const expected = createHmac("sha256", CATALOGUE_SESSION_SECRET).update(data).digest("base64url");
    if (sig !== expected) return false;

    const payload: TokenPayload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.sourceId !== sourceId) return false;
    if (payload.pfp !== passwordHash.slice(0, 8)) return false;

    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Cookie name
// ---------------------------------------------------------------------------

export function cookieName(sourceSlug: string): string {
  return `${COOKIE_PREFIX}${sourceSlug}`;
}
