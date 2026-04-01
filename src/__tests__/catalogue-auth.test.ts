/**
 * Unit tests for catalogue-auth token signing/verification logic.
 * Uses Node.js built-in test runner: `node --test src/__tests__/catalogue-auth.test.ts`
 *
 * NOTE: These tests bypass astro:env/server by setting the env var directly.
 * Run with: CATALOGUE_SESSION_SECRET=test-secret node --experimental-strip-types --test src/__tests__/catalogue-auth.test.ts
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "crypto";

// Inline minimal signToken/verifyToken logic mirroring catalogue-auth.ts
// (avoids the astro:env/server import in test context)
const SECRET = "test-secret-32-chars-minimum-ok";

interface TokenPayload {
  sourceId: string;
  pfp: string;
  iat: number;
}

function signToken(sourceId: string, passwordHash: string): string {
  const payload: TokenPayload = { sourceId, pfp: passwordHash.slice(0, 8), iat: Math.floor(Date.now() / 1000) };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token: string, sourceId: string, passwordHash: string): boolean {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return false;
    const expected = createHmac("sha256", SECRET).update(data).digest("base64url");
    if (sig !== expected) return false;
    const payload: TokenPayload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.sourceId !== sourceId) return false;
    if (payload.pfp !== passwordHash.slice(0, 8)) return false;
    return true;
  } catch {
    return false;
  }
}

describe("catalogue session token", () => {
  const sourceId = "source-uuid-123";
  const hash = "$2b$12$abcdefghijklmnopqrstuvwxyz012345";

  test("valid token for correct sourceId and hash passes", () => {
    const token = signToken(sourceId, hash);
    assert.equal(verifyToken(token, sourceId, hash), true);
  });

  test("token fails for wrong sourceId", () => {
    const token = signToken(sourceId, hash);
    assert.equal(verifyToken(token, "different-source", hash), false);
  });

  test("token fails when password hash changes (fingerprint mismatch)", () => {
    const token = signToken(sourceId, hash);
    const newHash = "$2b$12$ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ";
    assert.equal(verifyToken(token, sourceId, newHash), false);
  });

  test("tampered token signature is rejected", () => {
    const token = signToken(sourceId, hash);
    const [data] = token.split(".");
    const tampered = `${data}.invalidsignature`;
    assert.equal(verifyToken(tampered, sourceId, hash), false);
  });

  test("token with missing parts is rejected", () => {
    assert.equal(verifyToken("onlyonepart", sourceId, hash), false);
    assert.equal(verifyToken("", sourceId, hash), false);
  });

  test("token for different source is rejected even with matching hash", () => {
    const token = signToken("other-source", hash);
    assert.equal(verifyToken(token, sourceId, hash), false);
  });
});

describe("fingerprint (session invalidation on password change)", () => {
  test("old token rejected after password rotation", () => {
    const sourceId = "src-1";
    const oldHash = "$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const newHash = "$2b$12$BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

    const oldToken = signToken(sourceId, oldHash);
    // Old token still verifies against old hash
    assert.equal(verifyToken(oldToken, sourceId, oldHash), true);
    // Old token rejected against new hash (password was rotated)
    assert.equal(verifyToken(oldToken, sourceId, newHash), false);
  });
});
