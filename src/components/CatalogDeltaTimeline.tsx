import type { AnnotatedDeltaRun } from "@/lib/services/feed-runs";

interface Props {
  deltaRuns: AnnotatedDeltaRun[];
  fullRunId: string;
}

export function CatalogDeltaTimeline({ deltaRuns, fullRunId }: Props) {
  if (deltaRuns.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Deltas since last full feed
        <span className="ml-2 text-xs font-normal text-gray-400">({deltaRuns.length})</span>
      </h2>
      <ol className="relative border-l border-gray-200 ml-2 space-y-4">
        {deltaRuns.map((delta) => {
          const { added, removed, changed } = delta.summary;
          const diffUrl = `/diff?base=${fullRunId}&head=${delta.id}`;
          const timestamp = new Date(delta.received_at).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          });

          return (
            <li key={delta.id} className="ml-5">
              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-indigo-300" />
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600">{timestamp} UTC</span>
                <span className="text-xs text-gray-400">{delta.product_count.toLocaleString()} products in delta</span>
                <span className="flex items-center gap-1.5">
                  {added > 0 && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      +{added} added
                    </span>
                  )}
                  {removed > 0 && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                      -{removed} removed
                    </span>
                  )}
                  {changed > 0 && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      {changed} changed
                    </span>
                  )}
                  {added === 0 && removed === 0 && changed === 0 && (
                    <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-500/20">
                      no changes
                    </span>
                  )}
                </span>
                <a
                  href={diffUrl}
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                >
                  View diff →
                </a>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
