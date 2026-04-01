import { useState, useMemo } from "react";
import { OPENAI_REQUIRED_ATTRIBUTES, isFieldPresent } from "@/lib/feed-config";
import type { Product } from "@/types";

interface Props {
  products: Product[];
}

function healthColor(pct: number): { text: string; bg: string; bar: string } {
  if (pct >= 90) return { text: "text-green-600", bg: "bg-green-50", bar: "bg-green-500" };
  if (pct >= 70) return { text: "text-amber-600", bg: "bg-amber-50", bar: "bg-amber-400" };
  return { text: "text-red-600", bg: "bg-red-50", bar: "bg-red-500" };
}

export function AttributeSchemaView({ products }: Props) {
  const [open, setOpen] = useState(false);
  // Task 2.2 — Set of expanded row indices in the incomplete-products list
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const stats = useMemo(() => {
    const total = products.length;
    if (total === 0) return null;

    const attrStats = OPENAI_REQUIRED_ATTRIBUTES.map((attr) => {
      const count = products.filter((p) => isFieldPresent(p, attr)).length;
      const pct = Math.round((count / total) * 1000) / 10;
      return { attr, count, total, pct };
    });

    const healthScore = Math.round((attrStats.reduce((sum, s) => sum + s.pct, 0) / attrStats.length) * 10) / 10;

    // Task 2.1 — include missingFields string[] on each entry
    const incompleteProducts = products
      .map((p) => ({
        title: p.title ?? p.item_id ?? "Unknown product",
        missingFields: OPENAI_REQUIRED_ATTRIBUTES.filter((a) => !isFieldPresent(p, a)) as string[],
      }))
      .filter((p) => p.missingFields.length > 0)
      .sort((a, b) => b.missingFields.length - a.missingFields.length)
      .slice(0, 10)
      .map((p) => ({ ...p, missingCount: p.missingFields.length }));

    const allColumns = new Set<string>();
    for (const p of products) {
      if (p.attributes) {
        for (const k of Object.keys(p.attributes)) allColumns.add(k);
      }
    }

    return { attrStats, healthScore, incompleteProducts, allColumns };
  }, [products]);

  // Task 2.4 — toggle expand for a row index
  function toggleRow(i: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        Attribute schema
      </button>

      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Attribute Schema</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {!stats ? (
                <p className="py-8 text-center text-sm text-gray-400">No products to analyse.</p>
              ) : (
                <>
                  {/* Catalogue Health Score */}
                  <section>
                    {(() => {
                      const c = healthColor(stats.healthScore);
                      return (
                        <div className={`rounded-xl px-5 py-4 ${c.bg} flex items-center justify-between`}>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
                              Catalogue Health
                            </p>
                            <p className={`text-3xl font-bold ${c.text}`}>{stats.healthScore}%</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {stats.attrStats[0].total.toLocaleString()} products · {OPENAI_REQUIRED_ATTRIBUTES.length}{" "}
                              required fields
                            </p>
                          </div>
                          <div
                            className={`h-14 w-14 rounded-full border-4 flex items-center justify-center ${c.text} border-current`}
                          >
                            <span className="text-sm font-bold">
                              {stats.healthScore >= 90 ? "✓" : stats.healthScore >= 70 ? "!" : "✗"}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </section>

                  {/* Per-attribute completeness rows */}
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Required Field Completeness
                    </h3>
                    <ul className="space-y-2.5">
                      {stats.attrStats.map(({ attr, count, total, pct }) => {
                        const c = healthColor(pct);
                        const isZero = pct === 0;
                        return (
                          <li key={attr}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${isZero ? "text-red-600" : "text-gray-700"}`}>
                                {attr.replace(/_/g, " ")}
                                {isZero && (
                                  <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-500 font-medium">
                                    Missing
                                  </span>
                                )}
                              </span>
                              <span className={`text-xs font-medium tabular-nums ${c.text}`}>
                                {count.toLocaleString()} / {total.toLocaleString()} ({pct}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${c.bar}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                  {/* Tasks 2.1–2.5 — Expandable top incomplete products */}
                  {stats.incompleteProducts.length > 0 && (
                    <section>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Top Incomplete Products
                      </h3>
                      <ul className="space-y-1">
                        {stats.incompleteProducts.map(({ title, missingCount, missingFields }, i) => {
                          const isExpanded = expandedRows.has(i);
                          return (
                            <li key={i} className="rounded-lg bg-gray-50 overflow-hidden">
                              {/* Task 2.3, 2.4 — clickable row with rotating chevron */}
                              <button
                                onClick={() => toggleRow(i)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                              >
                                <svg
                                  className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="flex-1 text-sm text-gray-700 truncate">{title}</span>
                                <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                                  {missingCount} field{missingCount !== 1 ? "s" : ""} missing
                                </span>
                              </button>
                              {/* Task 2.5 — missing field pills */}
                              {isExpanded && (
                                <div className="px-3 pb-2.5 pt-1 flex flex-wrap gap-1.5 border-t border-gray-100">
                                  {missingFields.map((f) => (
                                    <span
                                      key={f}
                                      className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 border border-red-100"
                                    >
                                      {f.replace(/_/g, " ")}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}

                  {/* All Columns Present, collapsed by default */}
                  <details className="group">
                    <summary className="cursor-pointer select-none list-none flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700 transition-colors py-1">
                      <svg
                        className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      All Columns Present ({stats.allColumns.size})
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Array.from(stats.allColumns).map((col) => (
                        <span key={col} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
                          {col}
                        </span>
                      ))}
                    </div>
                  </details>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
