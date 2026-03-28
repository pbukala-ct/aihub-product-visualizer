import { useState } from "react";
import { ProductCard } from "./ProductCard";
import { ProductDetail } from "./ProductDetail";
import type { Product } from "@/types";

interface Props {
  products: Product[];
}

export function ProductGrid({ products }: Props) {
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onClick={() => setSelected(product)} />
        ))}
      </div>
      <ProductDetail product={selected} onClose={() => setSelected(null)} />
    </>
  );
}
