import type { Product } from "@/types";

/** OpenAI-required product feed attributes */
export const OPENAI_REQUIRED_ATTRIBUTES = [
  "title",
  "description",
  "price",
  "availability",
  "image_url",
  "url",
  "brand",
  "gtin",
  "mpn",
] as const;

/** Returns true if a product has a non-empty value for the given attribute,
 *  checking the typed column first and then the raw attributes blob. */
export function isFieldPresent(product: Product, attr: string): boolean {
  const typedVal = product[attr as keyof Product];
  if (typedVal != null && typedVal !== "") return true;
  const blobVal = product.attributes?.[attr];
  return blobVal != null && blobVal !== "";
}
