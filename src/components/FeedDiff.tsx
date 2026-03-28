import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FeedDiffResult, DiffStatus, ProductDiffRow } from "@/types";

interface Props {
  diff: FeedDiffResult;
}

const statusConfig: Record<DiffStatus, { label: string; badge: string; row: string }> = {
  added: {
    label: "Added",
    badge: "bg-green-100 text-green-800",
    row: "bg-green-50/50",
  },
  removed: {
    label: "Removed",
    badge: "bg-red-100 text-red-800",
    row: "bg-red-50/50",
  },
  changed: {
    label: "Changed",
    badge: "bg-amber-100 text-amber-800",
    row: "bg-amber-50/50",
  },
  unchanged: {
    label: "Unchanged",
    badge: "bg-gray-100 text-gray-500",
    row: "",
  },
};

function SummaryBar({ summary }: { summary: FeedDiffResult["summary"] }) {
  const items: { status: DiffStatus; icon: string }[] = [
    { status: "added", icon: "+" },
    { status: "removed", icon: "−" },
    { status: "changed", icon: "~" },
    { status: "unchanged", icon: "=" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map(({ status, icon }) => (
        <div
          key={status}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-4 py-2",
            status === "added" && "border-green-200 bg-green-50",
            status === "removed" && "border-red-200 bg-red-50",
            status === "changed" && "border-amber-200 bg-amber-50",
            status === "unchanged" && "border-gray-200 bg-gray-50"
          )}
        >
          <span
            className={cn(
              "text-sm font-bold",
              status === "added" && "text-green-700",
              status === "removed" && "text-red-700",
              status === "changed" && "text-amber-700",
              status === "unchanged" && "text-gray-500"
            )}
          >
            {icon} {summary[status]}
          </span>
          <span className="text-xs text-gray-500">{statusConfig[status].label}</span>
        </div>
      ))}
    </div>
  );
}

function ChangedFieldsRow({ row }: { row: ProductDiffRow }) {
  const [expanded, setExpanded] = useState(false);

  if (row.changedFields.length === 0) return null;

  const preview = row.changedFields.slice(0, 2);
  const hasMore = row.changedFields.length > 2;

  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-1">
        {(expanded ? row.changedFields : preview).map(({ field, oldValue, newValue }) => (
          <span
            key={field}
            className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-100 px-1.5 py-0.5 text-xs"
          >
            <span className="font-medium text-gray-600">{field}:</span>
            <span className="text-red-600 line-through truncate max-w-[80px]">{oldValue || "—"}</span>
            <span className="text-gray-400">→</span>
            <span className="text-green-700 truncate max-w-[80px]">{newValue || "—"}</span>
          </span>
        ))}
        {hasMore && !expanded && (
          <button onClick={() => setExpanded(true)} className="text-xs text-amber-700 hover:underline">
            +{row.changedFields.length - 2} more
          </button>
        )}
      </div>
    </div>
  );
}

export function FeedDiff({ diff }: Props) {
  const [filter, setFilter] = useState<DiffStatus | "all">("all");

  const filtered = filter === "all" ? diff.rows : diff.rows.filter((r) => r.status === filter);
  const hasChanges = diff.summary.added + diff.summary.removed + diff.summary.changed > 0;

  return (
    <div className="space-y-4">
      <SummaryBar summary={diff.summary} />

      {!hasChanges && <p className="text-sm text-gray-500 py-2">No differences found — these runs are identical.</p>}

      {hasChanges && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {(["all", "added", "removed", "changed", "unchanged"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  filter === f
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {f === "all" ? `All (${diff.rows.length})` : `${statusConfig[f].label} (${diff.summary[f]})`}
              </button>
            ))}
          </div>

          {/* Diff table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Item ID
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Title
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Changes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => {
                  const cfg = statusConfig[row.status];
                  return (
                    <tr key={row.item_id} className={cn("transition-colors", cfg.row)}>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.badge)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">{row.item_id}</td>
                      <td className="px-4 py-2.5 text-gray-900 max-w-xs truncate">{row.title ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <ChangedFieldsRow row={row} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
