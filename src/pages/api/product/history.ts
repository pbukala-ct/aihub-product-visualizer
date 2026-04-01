export const prerender = false;

import type { APIRoute } from "astro";
import { getSourceBySlug, getProductHistory } from "@/lib/services/feed-runs";

export const GET: APIRoute = async ({ url }) => {
  const itemId = url.searchParams.get("item_id");
  const sourceSlug = url.searchParams.get("source");

  if (!itemId || !sourceSlug) {
    return new Response(JSON.stringify({ error: "Both item_id and source query parameters are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const source = await getSourceBySlug(sourceSlug);
  if (!source) {
    return new Response(JSON.stringify({ error: "Source not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const versions = await getProductHistory(itemId, source.id);

  return new Response(JSON.stringify({ versions }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
