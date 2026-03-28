import { useState } from "react";
import { OPENAI_REQUIRED_ATTRIBUTES } from "@/lib/feed-config";
import type { Product } from "@/types";

interface Props {
  products: Product[];
}

export function AttributeSchemaView({ products }: Props) {
  const [open, setOpen] = useState(false);

  // Derive columns present in this feed run from raw attributes
  const sample = products[0];
  const presentColumns = new Set<string>(sample?.attributes ? Object.keys(sample.attributes) : []);

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
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
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

            <div className="px-6 py-4 space-y-4">
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  OpenAI Required Attributes
                </h3>
                <ul className="space-y-1">
                  {OPENAI_REQUIRED_ATTRIBUTES.map((attr) => {
                    const present = presentColumns.has(attr);
                    return (
                      <li key={attr} className="flex items-center gap-2 text-sm">
                        {present ? (
                          <svg className="h-4 w-4 shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <span className={present ? "text-gray-900" : "text-red-600 font-medium"}>{attr}</span>
                        {!present && (
                          <span className="ml-auto rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-500 font-medium">
                            Missing
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  All Columns Present ({presentColumns.size})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(presentColumns).map((col) => (
                    <span key={col} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
                      {col}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
