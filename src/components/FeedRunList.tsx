import { FeedRunBadge } from "./FeedRunBadge";
import type { FeedRunSummary } from "@/types";

interface Props {
  runs: FeedRunSummary[];
  sourceSlug?: string;
}

export function FeedRunList({ runs, sourceSlug }: Props) {
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-gray-700">No feed runs yet</p>
        <p className="mt-2 text-sm text-gray-500">
          Send a CSV payload to{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
            POST /api/feed/ingest/{sourceSlug ?? "your-source-name"}
          </code>
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {runs.map((run) => {
        const slug = sourceSlug ?? run.sources?.slug;
        const compareHref = slug ? `/diff?source=${slug}&head=${run.id}` : `/diff?head=${run.id}`;

        return (
          <li key={run.id}>
            <div className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <a href={`/feed/${run.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                <FeedRunBadge type={run.type} />
                <span className="text-sm text-gray-700 truncate">
                  {new Date(run.received_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </span>
                <span className="shrink-0 text-sm text-gray-500">{run.product_count.toLocaleString()} products</span>
                {!sourceSlug && run.sources && (
                  <span className="shrink-0 flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    {run.sources.is_protected && (
                      <svg
                        className="h-3 w-3 text-gray-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-label="Protected catalogue"
                        role="img"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    )}
                    {run.sources.display_name}
                  </span>
                )}
              </a>
              <a
                href={compareHref}
                className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
              >
                Compare
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
