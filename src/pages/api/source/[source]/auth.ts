export const prerender = false;

import type { APIRoute } from "astro";
import { getSourceBySlug } from "@/lib/services/feed-runs";
import { verifyPassword, signToken, cookieName } from "@/lib/catalogue-auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const slug = params.source;
  if (!slug) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  // Rate limiting by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many attempts. Please wait 10 minutes before trying again." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const source = await getSourceBySlug(slug);
  if (!source || !source.is_protected || !source.access_password_hash) {
    // Don't reveal whether the source exists or is protected
    return new Response(JSON.stringify({ error: "Invalid password." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let password: string;
  try {
    const body = await request.json();
    password = body?.password;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!password || typeof password !== "string") {
    return new Response(JSON.stringify({ error: "Password is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const valid = await verifyPassword(password, source.access_password_hash);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Invalid password." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Correct password — clear rate limit and issue session cookie
  resetRateLimit(ip);
  const token = signToken(source.id, source.access_password_hash);
  cookies.set(cookieName(slug), token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    // No maxAge = browser-session lifetime
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
