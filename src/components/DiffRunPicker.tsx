import { useState } from "react";
import type { FeedRunSummary } from "@/types";

interface Props {
  runs: FeedRunSummary[];
  preselectedHead?: string;
  sourceSlug?: string;
}

function formatRun(run: FeedRunSummary): string {
  const date = new Date(run.received_at).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
  return `${date} UTC — ${run.type} — ${run.product_count} products`;
}

export function DiffRunPicker({ runs, preselectedHead, sourceSlug }: Props) {
  const [base, setBase] = useState(runs[1]?.id ?? "");
  const [head, setHead] = useState(preselectedHead ?? runs[0]?.id ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (base && head) {
      const params = new URLSearchParams({ base, head });
      if (sourceSlug) params.set("source", sourceSlug);
      window.location.href = `/diff?${params.toString()}`;
    }
  }

  if (runs.length < 2) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-700 font-medium">Not enough feed runs to compare</p>
        <p className="mt-1 text-sm text-gray-500">You need at least 2 feed runs. Ingest another feed first.</p>
        <a href="/history" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          ← Back to history
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-xl mx-auto">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Select runs to compare</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="base-run" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Base (older)
          </label>
          <select
            id="base-run"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {formatRun(run)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="head-run" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Head (newer)
          </label>
          <select
            id="head-run"
            value={head}
            onChange={(e) => setHead(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {formatRun(run)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!base || !head || base === head}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Compare runs
        </button>
      </form>
    </div>
  );
}
