import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";
import { getSourceBySlug, getSourceByFeedRunId } from "@/lib/services/feed-runs";
import { verifyToken, cookieName } from "@/lib/catalogue-auth";
import type { Source } from "@/types";

const PROTECTED_ROUTES = ["/dashboard"];

async function resolveSourceForRequest(pathname: string, searchParams: URLSearchParams): Promise<Source | null> {
  // /source/<slug>
  if (pathname.startsWith("/source/")) {
    const slug = pathname.split("/")[2];
    if (slug) return getSourceBySlug(slug);
  }

  // /history?source=<slug> or /diff?source=<slug>
  if (pathname === "/history" || pathname === "/diff") {
    const slug = searchParams.get("source");
    if (slug) return getSourceBySlug(slug);
  }

  // /feed/<id>
  if (pathname.startsWith("/feed/")) {
    const runId = pathname.split("/")[2];
    if (runId) return getSourceByFeedRunId(runId);
  }

  return null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createClient(context.request.headers, context.cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  context.locals.user = user ?? null;

  const { pathname, searchParams } = context.url;

  // Supabase-session protected routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!context.locals.user) {
      return context.redirect("/auth/signin");
    }
  }

  // Catalogue access gate — skip API routes and auth routes
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/auth/")) {
    try {
      const source = await resolveSourceForRequest(pathname, searchParams);

      if (source?.is_protected && source.access_password_hash) {
        const token = context.cookies.get(cookieName(source.slug))?.value;
        const valid = token ? verifyToken(token, source.id, source.access_password_hash) : false;

        if (!valid) {
          const redirect = encodeURIComponent(context.url.pathname + context.url.search);
          return context.redirect(`/auth/catalogue/${source.slug}?redirect=${redirect}`);
        }
      }
    } catch {
      // Fail closed: if we can't check protection, block access
      return new Response("Access check failed. Please try again.", { status: 503 });
    }
  }

  return next();
});
