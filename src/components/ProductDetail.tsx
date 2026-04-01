import { useState, useEffect } from "react";
import type { Product } from "@/types";
import { ProductHistory } from "./ProductHistory";
import { OPENAI_REQUIRED_ATTRIBUTES, isFieldPresent } from "@/lib/feed-config";

interface Props {
  product: Product | null;
  onClose: () => void;
  sourceSlug?: string;
}

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

// Task 3.4 — shared colour helper matching catalogue health thresholds
function qualityColor(pct: number): { text: string; bg: string } {
  if (pct >= 90) return { text: "text-green-700", bg: "bg-green-50" };
  if (pct >= 70) return { text: "text-amber-700", bg: "bg-amber-50" };
  return { text: "text-red-700", bg: "bg-red-50" };
}

export function ProductDetail({ product, onClose, sourceSlug }: Props) {
  // Task 3.1 — extended tab union type
  const [tab, setTab] = useState<"attributes" | "history" | "quality">("attributes");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Task 3.8 — reset covers all tab values including "quality"
  useEffect(() => {
    if (!product) setTab("attributes");
  }, [product]);

  if (!product) return null;

  const entries = product.attributes
    ? Object.entries(product.attributes)
    : Object.entries(product).filter(
        ([key, val]) => !["id", "feed_run_id", "created_at", "attributes"].includes(key) && val !== null && val !== ""
      );

  // Tasks 3.3, 3.4 — compute quality stats for this product
  const missingFields = OPENAI_REQUIRED_ATTRIBUTES.filter((a) => !isFieldPresent(product, a));
  const presentCount = OPENAI_REQUIRED_ATTRIBUTES.length - missingFields.length;
  const qualityPct = Math.round((presentCount / OPENAI_REQUIRED_ATTRIBUTES.length) * 100);
  const qColor = qualityColor(qualityPct);

  const tabClass = (t: typeof tab) =>
    `px-1 py-3 text-sm font-medium mr-6 border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
      tab === t
        ? "border-indigo-500 text-indigo-600"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Sticky title bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 pr-6 line-clamp-1">
            {product.title ?? "Product detail"}
          </h2>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Task 3.2 — three-tab bar */}
        <div className="sticky top-[61px] z-10 flex border-b border-gray-200 bg-white px-6">
          <button
            role="tab"
            aria-selected={tab === "attributes"}
            onClick={() => setTab("attributes")}
            className={tabClass("attributes")}
          >
            Attributes
          </button>
          <button
            role="tab"
            aria-selected={tab === "history"}
            onClick={() => setTab("history")}
            className={tabClass("history")}
          >
            History
          </button>
          <button
            role="tab"
            aria-selected={tab === "quality"}
            onClick={() => setTab("quality")}
            className={tabClass("quality")}
          >
            Quality
          </button>
        </div>

        {product.image_url && tab === "attributes" && (
          <div className="flex justify-center bg-gray-50 px-6 py-4 border-b border-gray-100">
            <img
              src={product.image_url}
              alt={product.title ?? "Product"}
              className="max-h-48 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        <div className="px-6 py-4">
          {tab === "attributes" && (
            <dl className="divide-y divide-gray-100">
              {entries.map(([key, val]) => {
                const displayVal = key === "description" ? stripHtml(val as string) : String(val);
                return (
                  <div key={key} className="grid grid-cols-3 gap-4 py-2">
                    <dt className="col-span-1 text-xs font-medium text-gray-500 uppercase tracking-wide self-start pt-0.5">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="col-span-2 text-sm text-gray-900 break-words">{displayVal}</dd>
                  </div>
                );
              })}
            </dl>
          )}

          {tab === "history" && sourceSlug && <ProductHistory itemId={product.item_id} sourceSlug={sourceSlug} />}
          {tab === "history" && !sourceSlug && (
            <p className="py-8 text-center text-sm text-gray-400">History is unavailable in this context.</p>
          )}

          {/* Tasks 3.5, 3.6, 3.7 — Quality tab content */}
          {tab === "quality" && (
            <div className="space-y-4">
              {/* Task 3.5 — summary score badge */}
              <div className={`rounded-xl px-5 py-4 ${qColor.bg} flex items-center justify-between`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-0.5">Required Fields</p>
                  <p className={`text-3xl font-bold ${qColor.text}`}>
                    {presentCount} / {OPENAI_REQUIRED_ATTRIBUTES.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{qualityPct}% of required fields present</p>
                </div>
                <div
                  className={`h-14 w-14 rounded-full border-4 flex items-center justify-center ${qColor.text} border-current`}
                >
                  <span className="text-sm font-bold">{qualityPct >= 90 ? "✓" : qualityPct >= 70 ? "!" : "✗"}</span>
                </div>
              </div>

              {/* Task 3.7 — all-clear state */}
              {missingFields.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl bg-green-50 px-5 py-4">
                  <svg className="h-5 w-5 shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-medium text-green-700">All required fields are present</p>
                </div>
              ) : (
                /* Task 3.6 — missing field list */
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Missing Fields</h3>
                  <ul className="space-y-1.5">
                    {missingFields.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 rounded-lg bg-red-50 px-3 py-2">
                        <svg className="h-4 w-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium text-red-700">{f.replace(/_/g, " ")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
