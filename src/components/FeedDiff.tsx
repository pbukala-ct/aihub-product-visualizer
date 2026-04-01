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

function SummaryBar({ summary, isDeltaDiff }: { summary: FeedDiffResult["summary"]; isDeltaDiff: boolean }) {
  const items: { status: DiffStatus; icon: string }[] = [
    { status: "added", icon: "+" },
    ...(isDeltaDiff ? [] : [{ status: "removed" as DiffStatus, icon: "−" }]),
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
      {isDeltaDiff && (
        <div className="flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2">
          <span className="text-xs text-indigo-600">Delta feed — products absent from delta are unchanged</span>
        </div>
      )}
    </div>
  );
}

function ProductRow({ row, colSpan }: { row: ProductDiffRow; colSpan: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[row.status];
  const isChangeable = row.status === "changed" && row.changedFields.length > 0;

  return (
    <>
      <tr
        className={cn("transition-colors", cfg.row, isChangeable && "cursor-pointer hover:brightness-95")}
        onClick={isChangeable ? () => setExpanded((v) => !v) : undefined}
      >
        <td className="px-4 py-2.5 whitespace-nowrap">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.badge)}>{cfg.label}</span>
        </td>
        <td className="px-4 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">{row.item_id}</td>
        <td className="px-4 py-2.5 text-gray-900 max-w-xs truncate">{row.title ?? "—"}</td>
        <td className="px-4 py-2.5 whitespace-nowrap">
          {isChangeable && (
            <button
              className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              aria-label={expanded ? "Collapse changes" : "Expand changes"}
            >
              <span>
                {row.changedFields.length} field{row.changedFields.length !== 1 ? "s" : ""}
              </span>
              <svg
                className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </td>
      </tr>
      {isChangeable && expanded && (
        <tr className={cn(cfg.row)}>
          <td colSpan={colSpan} className="px-6 pb-3 pt-0">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-amber-200">
                  <th className="py-1.5 pr-4 text-left font-semibold text-gray-500 uppercase tracking-wide w-40">
                    Field
                  </th>
                  <th className="py-1.5 pr-4 text-left font-semibold text-red-500 uppercase tracking-wide">Before</th>
                  <th className="py-1.5 text-left font-semibold text-green-600 uppercase tracking-wide">After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {row.changedFields.map(({ field, oldValue, newValue }) => (
                  <tr key={field}>
                    <td className="py-1.5 pr-4 font-medium text-gray-600 align-top whitespace-nowrap">{field}</td>
                    <td className="py-1.5 pr-4 font-mono text-red-600 align-top break-all">
                      {oldValue || <span className="italic text-gray-400">empty</span>}
                    </td>
                    <td className="py-1.5 font-mono text-green-700 align-top break-all">
                      {newValue || <span className="italic text-gray-400">empty</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

export function FeedDiff({ diff }: Props) {
  const isDeltaDiff = diff.head.type === "delta";
  const [filter, setFilter] = useState<DiffStatus | "all">("all");

  const filterOptions: (DiffStatus | "all")[] = isDeltaDiff
    ? ["all", "added", "changed", "unchanged"]
    : ["all", "added", "removed", "changed", "unchanged"];

  const filtered = filter === "all" ? diff.rows : diff.rows.filter((r) => r.status === filter);
  const hasChanges = diff.summary.added + diff.summary.removed + diff.summary.changed > 0;

  return (
    <div className="space-y-4">
      <SummaryBar summary={diff.summary} isDeltaDiff={isDeltaDiff} />

      {!hasChanges && <p className="text-sm text-gray-500 py-2">No differences found — these runs are identical.</p>}

      {hasChanges && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-gray-200">
            {filterOptions.map((f) => (
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
                {filtered.map((row) => (
                  <ProductRow key={row.item_id} row={row} colSpan={4} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
