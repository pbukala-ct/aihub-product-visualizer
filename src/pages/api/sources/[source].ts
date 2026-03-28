import type { APIRoute } from "astro";
import { createAdminClient } from "@/lib/supabase-admin";

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  const slug = params.source ?? "";
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing source slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createAdminClient();

  const { data: source } = await supabase.from("sources").select("id").eq("slug", slug).single();
  if (!source) {
    return new Response(JSON.stringify({ error: "Source not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Delete feed_runs first (products cascade via FK)
  await supabase.from("feed_runs").delete().eq("source_id", source.id);

  const { error } = await supabase.from("sources").delete().eq("id", source.id);
  if (error) {
    return new Response(JSON.stringify({ error: "Failed to delete source" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
