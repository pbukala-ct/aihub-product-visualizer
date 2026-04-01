import { useState } from "react";
import type { AnnotatedDeltaRun } from "@/lib/services/feed-runs";

interface Props {
  deltaRuns: AnnotatedDeltaRun[];
  fullRunId: string;
}

// Task 1.2
const COLLAPSE_THRESHOLD = 3;

export function CatalogDeltaTimeline({ deltaRuns, fullRunId }: Props) {
  // Task 1.1, 4.2 — early return still works before any hooks would differ
  // (hooks are unconditional, return is after)
  const [expanded, setExpanded] = useState(false);

  if (deltaRuns.length === 0) return null;

  // Task 1.2
  const showToggle = deltaRuns.length > COLLAPSE_THRESHOLD;

  // Task 1.3 — newest-first, sliced when collapsed
  const reversedRuns = [...deltaRuns].reverse();
  const visibleRuns = expanded || !showToggle ? reversedRuns : reversedRuns.slice(0, COLLAPSE_THRESHOLD);

  // Tasks 2.1
  const totalAdded = deltaRuns.reduce((s, d) => s + d.summary.added, 0);
  const totalChanged = deltaRuns.reduce((s, d) => s + d.summary.changed, 0);

  return (
    <section className="mt-6 mb-6">
      {/* Section header — task 4.1: reads from deltaRuns.length, not display slice */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Deltas since last full feed
          <span className="ml-2 text-xs font-normal text-gray-400">({deltaRuns.length})</span>
        </h2>

        {/* Tasks 2.2, 2.3 — aggregate summary badges */}
        <span className="flex items-center gap-1.5">
          {totalAdded > 0 && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              +{totalAdded.toLocaleString()} added total
            </span>
          )}
          {totalChanged > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
              {totalChanged.toLocaleString()} changed total
            </span>
          )}
          {totalAdded === 0 && totalChanged === 0 && (
            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-500/20">
              no net changes
            </span>
          )}
        </span>
      </div>

      {/* Timeline list */}
      <ol className="relative border-l border-gray-200 ml-2 space-y-4">
        {visibleRuns.map((delta) => {
          const { added, changed } = delta.summary;
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
                  {changed > 0 && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      {changed} changed
                    </span>
                  )}
                  {added === 0 && changed === 0 && (
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

      {/* Tasks 3.1–3.4 — expand/collapse toggle */}
      {showToggle && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 ml-7 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "Show less" : `Show all ${deltaRuns.length} deltas`}
        </button>
      )}
    </section>
  );
}
