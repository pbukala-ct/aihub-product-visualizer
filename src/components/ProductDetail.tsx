import { useState, useEffect } from "react";
import type { Product } from "@/types";
import { ProductHistory } from "./ProductHistory";

interface Props {
  product: Product | null;
  onClose: () => void;
  sourceSlug?: string;
}

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

export function ProductDetail({ product, onClose, sourceSlug }: Props) {
  const [tab, setTab] = useState<"attributes" | "history">("attributes");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Reset tab to attributes when modal closes (product becomes null)
  useEffect(() => {
    if (!product) setTab("attributes");
  }, [product]);

  if (!product) return null;

  // Use raw attributes if available, otherwise fall back to typed fields
  const entries = product.attributes
    ? Object.entries(product.attributes)
    : Object.entries(product).filter(
        ([key, val]) => !["id", "feed_run_id", "created_at", "attributes"].includes(key) && val !== null && val !== ""
      );

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

        {/* Tab bar */}
        <div className="sticky top-[61px] z-10 flex border-b border-gray-200 bg-white px-6">
          <button
            role="tab"
            aria-selected={tab === "attributes"}
            onClick={() => setTab("attributes")}
            className={`px-1 py-3 text-sm font-medium mr-6 border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              tab === "attributes"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Attributes
          </button>
          <button
            role="tab"
            aria-selected={tab === "history"}
            onClick={() => setTab("history")}
            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              tab === "history"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            History
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
        </div>
      </div>
    </div>
  );
}
