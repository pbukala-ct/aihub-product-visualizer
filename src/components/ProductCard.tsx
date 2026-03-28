import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  product: Product;
  onClick?: () => void;
}

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

function formatPrice(price: string | null): string {
  if (!price) return "";
  // Handle "12.99 GBP" or "12.99 USD" format
  const match = price.match(/^([\d.,]+)\s*([A-Z]{3})$/);
  if (match) {
    const amount = parseFloat(match[1]);
    const currency = match[2];
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return price;
    }
  }
  return price;
}

function availabilityColor(availability: string | null): string {
  if (!availability) return "bg-gray-100 text-gray-600";
  const v = availability.toLowerCase();
  if (v === "in stock" || v === "in_stock") return "bg-green-100 text-green-800";
  if (v === "out of stock" || v === "out_of_stock") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
}

export function ProductCard({ product, onClick }: Props) {
  const description = stripHtml(product.description);
  const price = formatPrice(product.price);

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm",
        "hover:shadow-md hover:border-gray-300 transition-all duration-200 text-left w-full"
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.image_url ?? ""}
          alt={product.title ?? "Product image"}
          className="h-full w-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='sans-serif'%3ENo image%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-sm font-medium text-gray-900 leading-snug">
          {product.title ?? "Untitled product"}
        </p>
        {description && <p className="line-clamp-2 text-xs text-gray-500">{description}</p>}
        <div className="mt-auto flex items-center justify-between pt-1">
          {price && <span className="text-sm font-semibold text-gray-900">{price}</span>}
          {product.availability && (
            <span
              className={cn("rounded-full px-2 py-0.5 text-xs font-medium", availabilityColor(product.availability))}
            >
              {product.availability}
            </span>
          )}
        </div>
        {product.item_id && <p className="text-xs text-gray-400 truncate">ID: {product.item_id}</p>}
      </div>
    </button>
  );
}
