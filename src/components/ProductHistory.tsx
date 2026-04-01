import { useState, useEffect } from "react";
import { FeedRunBadge } from "./FeedRunBadge";
import type { ProductVersion } from "@/types";

interface Props {
  itemId: string | null;
  sourceSlug: string;
}

function HistorySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-5 w-12 rounded-full bg-gray-200" />
            <div className="h-4 w-40 rounded bg-gray-200" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-3/4 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function VersionCard({ version }: { version: ProductVersion }) {
  const { feedRun, attributes, changedFields, isFirstVersion } = version;
  const changedKeys = new Set(changedFields.map((f) => f.field));
  const unchangedEntries = Object.entries(attributes).filter(([k]) => !changedKeys.has(k));

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <FeedRunBadge type={feedRun.type} />
        <span className="text-sm text-gray-700 font-medium">
          {new Date(feedRun.received_at).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          })}{" "}
          UTC
        </span>
        {isFirstVersion && (
          <span className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
            Initial version
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-1">
        {isFirstVersion ? (
          /* Initial version: show all fields as starting values */
          <dl className="divide-y divide-gray-50">
            {Object.entries(attributes).map(([key, val]) => (
              <div key={key} className="grid grid-cols-3 gap-3 py-1.5">
                <dt className="col-span-1 text-xs font-medium text-gray-400 uppercase tracking-wide self-start pt-0.5">
                  {key.replace(/_/g, " ")}
                </dt>
                <dd className="col-span-2 text-sm text-gray-700 break-words">{String(val)}</dd>
              </div>
            ))}
          </dl>
        ) : changedFields.length === 0 ? (
          /* No changes */
          <p className="py-2 text-sm text-gray-400 italic">No attribute changes in this feed</p>
        ) : (
          /* Changed fields diff */
          <div className="space-y-1">
            {changedFields.map(({ field, oldValue, newValue }) => (
              <div key={field} className="rounded-lg overflow-hidden border border-gray-100">
                <div className="px-3 py-1 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {field.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  <div className="px-3 py-2 bg-red-50">
                    <p className="text-xs font-medium text-red-400 mb-0.5">Before</p>
                    <p className="text-sm text-red-700 break-words line-through decoration-red-300">
                      {oldValue || <span className="italic text-red-300">empty</span>}
                    </p>
                  </div>
                  <div className="px-3 py-2 bg-green-50">
                    <p className="text-xs font-medium text-green-500 mb-0.5">After</p>
                    <p className="text-sm text-green-800 break-words font-medium">
                      {newValue || <span className="italic text-green-400 font-normal">empty</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unchanged fields — collapsible, closed by default */}
        {!isFirstVersion && unchangedEntries.length > 0 && (
          <details className="mt-2 group">
            <summary className="cursor-pointer select-none list-none flex items-center gap-1.5 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              <svg
                className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {unchangedEntries.length} unchanged field{unchangedEntries.length !== 1 ? "s" : ""}
            </summary>
            <dl className="mt-1 divide-y divide-gray-50 border-t border-gray-100 pt-1">
              {unchangedEntries.map(([key, val]) => (
                <div key={key} className="grid grid-cols-3 gap-3 py-1.5">
                  <dt className="col-span-1 text-xs font-medium text-gray-300 uppercase tracking-wide self-start pt-0.5">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="col-span-2 text-sm text-gray-400 break-words">{String(val)}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>
    </div>
  );
}

export function ProductHistory({ itemId, sourceSlug }: Props) {
  const [versions, setVersions] = useState<ProductVersion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;
    // Already fetched — don't re-fetch (cache in state)
    if (versions !== null) return;

    setLoading(true);
    setError(null);

    fetch(`/api/product/history?item_id=${encodeURIComponent(itemId)}&source=${encodeURIComponent(sourceSlug)}`)
      .then((res) => res.json())
      .then((data) => {
        setVersions(data.versions ?? []);
      })
      .catch(() => {
        setError("Failed to load product history.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [itemId, sourceSlug, versions]);

  if (!itemId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <svg
          className="h-8 w-8 text-gray-300 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <p className="text-sm font-medium text-gray-500">History unavailable</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          Cross-feed history tracking requires a stable product ID (<code>item_id</code>). This product does not have
          one.
        </p>
      </div>
    );
  }

  if (loading) return <HistorySkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={() => {
            setVersions(null);
            setError(null);
          }}
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (versions !== null && versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-400">No feed history found for this product.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(versions ?? []).map((version, i) => (
        <VersionCard key={`${version.feedRun.id}-${i}`} version={version} />
      ))}
    </div>
  );
}
