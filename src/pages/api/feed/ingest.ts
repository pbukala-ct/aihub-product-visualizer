import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ url }) => {
  const host = url.host;
  return new Response(
    JSON.stringify({
      error:
        "This endpoint has moved. Use POST /api/feed/ingest/{source} where {source} is a URL-safe slug identifying your AI Hub instance. " +
        `Example: https://${host}/api/feed/ingest/your-source-name`,
    }),
    { status: 410, headers: { "Content-Type": "application/json" } }
  );
};
