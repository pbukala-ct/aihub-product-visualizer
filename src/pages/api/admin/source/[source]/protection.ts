export const prerender = false;

import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase-admin";
import { hashPassword } from "@/lib/catalogue-auth";

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const slug = params.source;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { is_protected?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { is_protected, password } = body;

  if (typeof is_protected !== "boolean") {
    return new Response(JSON.stringify({ error: "is_protected must be a boolean." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (is_protected && (typeof password !== "string" || password.trim() === "")) {
    return new Response(JSON.stringify({ error: "A non-empty password is required when enabling protection." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createAdminClient();
  const { data: source } = await supabase.from("sources").select("id").eq("slug", slug).single();
  if (!source) {
    return new Response(JSON.stringify({ error: "Source not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (is_protected && typeof password === "string") {
    const hash = await hashPassword(password);
    await supabase.from("sources").update({ is_protected: true, access_password_hash: hash }).eq("id", source.id);
  } else {
    await supabase.from("sources").update({ is_protected: false, access_password_hash: null }).eq("id", source.id);
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
};
