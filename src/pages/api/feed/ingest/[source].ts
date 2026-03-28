import type { APIRoute } from "astro";
import { parseCsv, detectFeedType, enforceFeedRunCap, resolveSource } from "@/lib/services/feed-ingest";
import { createAdminClient } from "@/lib/supabase-admin";

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
  const slug = params.source ?? "";

  // Check content-type
  const contentType = request.headers.get("content-type") ?? "";
  const baseType = contentType.split(";")[0].trim();
  if (baseType !== "text/csv" && baseType !== "application/octet-stream") {
    return new Response(JSON.stringify({ error: "Unsupported media type" }), {
      status: 415,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Resolve (or auto-register) source
  const source = await resolveSource(slug);
  if (!source) {
    return new Response(JSON.stringify({ error: `Source limit reached. Maximum ${20} sources allowed.` }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse CSV
  const raw = await request.text();
  let products;
  try {
    products = parseCsv(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse error";
    return new Response(JSON.stringify({ error: message }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (products.length === 0) {
    return new Response(JSON.stringify({ error: "CSV contains no data rows" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const feedType = detectFeedType(request.headers, products.length);

  await enforceFeedRunCap(source.id);

  const supabase = createAdminClient();

  const { data: feedRun, error: runError } = await supabase
    .from("feed_runs")
    .insert({
      type: feedType,
      product_count: products.length,
      raw_payload: raw,
      source_id: source.id,
    })
    .select("id")
    .single();

  if (runError || !feedRun) {
    return new Response(JSON.stringify({ error: "Failed to create feed run" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const productRows = products.map((p) => ({ ...p, feed_run_id: feedRun.id }));
  const { error: productsError } = await supabase.from("products").insert(productRows);

  if (productsError) {
    await supabase.from("feed_runs").delete().eq("id", feedRun.id);
    return new Response(JSON.stringify({ error: "Failed to insert products" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ feed_run_id: feedRun.id, product_count: products.length, source: slug }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
