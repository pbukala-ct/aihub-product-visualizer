import { useState, useMemo } from "react";
import { ProductCard } from "./ProductCard";
import { ProductDetail } from "./ProductDetail";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  sourceSlug?: string;
}

function isFlagEnabled(value: string | null): boolean {
  if (!value) return false;
  const v = value.toLowerCase().trim();
  return v !== "false" && v !== "0" && v !== "no" && v !== "";
}

export function ProductGrid({ products, sourceSlug }: Props) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCheckout, setFilterCheckout] = useState(false);
  const [filterSearch, setFilterSearch] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      if (q) {
        const titleMatch = p.title?.toLowerCase().includes(q) ?? false;
        const idMatch = p.item_id?.toLowerCase().includes(q) ?? false;
        if (!titleMatch && !idMatch) return false;
      }
      if (filterCheckout && !isFlagEnabled(p.attributes?.enable_checkout ?? null)) return false;
      if (filterSearch && !isFlagEnabled(p.attributes?.enable_search ?? null)) return false;
      return true;
    });
  }, [products, searchQuery, filterCheckout, filterSearch]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <input
          type="search"
          placeholder="Search by title or ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 sm:max-w-xs"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none">
          <input
            type="checkbox"
            checked={filterCheckout}
            onChange={(e) => setFilterCheckout(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Checkout enabled
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none">
          <input
            type="checkbox"
            checked={filterSearch}
            onChange={(e) => setFilterSearch(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Search enabled
        </label>
        <p className="ml-auto text-sm text-gray-500 whitespace-nowrap">
          {filtered.length === products.length
            ? `${products.length.toLocaleString()} products`
            : `${filtered.length.toLocaleString()} of ${products.length.toLocaleString()} products`}
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onClick={() => setSelected(product)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-500">No products match your filters.</p>
        </div>
      )}

      <ProductDetail product={selected} onClose={() => setSelected(null)} sourceSlug={sourceSlug} />
    </>
  );
}
