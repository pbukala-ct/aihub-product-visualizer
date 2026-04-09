import Papa from "papaparse";
import type { Product, FeedRunType, Source } from "@/types";
import { createAdminClient } from "@/lib/supabase-admin";

const MAX_ROWS = 500;
const MAX_FEED_RUNS = 50;
const MAX_SOURCES = 20;
/** Rows fewer than this threshold are treated as a delta feed */
const DELTA_ROW_THRESHOLD = 10;

export type ParsedProduct = Omit<Product, "id" | "feed_run_id" | "created_at">;

export function parseCsv(raw: string): ParsedProduct[] {
  if (!raw.trim()) {
    throw new Error("CSV body is empty");
  }

  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  const rows = result.data;

  if (rows.length > MAX_ROWS) {
    throw new RangeError(`CSV exceeds maximum row limit of ${MAX_ROWS} (got ${rows.length})`);
  }

  return rows.map((row) => ({
    item_id: row["id"] ?? row["item_id"] ?? null,
    group_id: row["item_group_id"] ?? row["group_id"] ?? null,
    title: row["title"] ?? null,
    description: row["description"] ?? null,
    url: row["link"] ?? row["url"] ?? null,
    mobile_link: row["mobile_link"] ?? null,
    image_url: row["image_link"] ?? row["image_url"] ?? null,
    additional_image_url:
      row["additional_image_link"] ?? row["additional_image_url"] ?? row["additional_image_urls"] ?? null,
    price: row["price"] ?? null,
    sale_price: row["sale_price"] ?? null,
    sale_price_effective_date: row["sale_price_effective_date"] ?? null,
    unit_pricing_measure: row["unit_pricing_measure"] ?? null,
    unit_pricing_base_measure: row["unit_pricing_base_measure"] ?? null,
    availability: row["availability"] ?? null,
    availability_date: row["availability_date"] ?? null,
    expiration_date: row["expiration_date"] ?? null,
    brand: row["brand"] ?? null,
    gtin: row["gtin"] ?? null,
    mpn: row["mpn"] ?? null,
    identifier_exists: row["identifier_exists"] ?? null,
    condition: row["condition"] ?? null,
    google_product_category: row["google_product_category"] ?? row["product_category"] ?? null,
    product_type: row["product_type"] ?? null,
    adult: row["adult"] ?? null,
    age_group: row["age_group"] ?? null,
    color: row["color"] ?? null,
    gender: row["gender"] ?? null,
    material: row["material"] ?? null,
    pattern: row["pattern"] ?? null,
    size: row["size"] ?? null,
    size_type: row["size_type"] ?? null,
    size_system: row["size_system"] ?? null,
    energy_efficiency_class: row["energy_efficiency_class"] ?? null,
    min_energy_efficiency_class: row["min_energy_efficiency_class"] ?? null,
    max_energy_efficiency_class: row["max_energy_efficiency_class"] ?? null,
    multipack: row["multipack"] ?? null,
    is_bundle: row["is_bundle"] ?? null,
    custom_label_0: row["custom_label_0"] ?? null,
    custom_label_1: row["custom_label_1"] ?? null,
    custom_label_2: row["custom_label_2"] ?? null,
    custom_label_3: row["custom_label_3"] ?? null,
    custom_label_4: row["custom_label_4"] ?? null,
    ads_redirect: row["ads_redirect"] ?? null,
    loyalty_points: row["loyalty_points"] ?? null,
    installment: row["installment"] ?? null,
    // Store all raw CSV fields for full attribute display
    attributes: Object.fromEntries(Object.entries(row).filter(([, v]) => v !== "")),
  }));
}

export function detectFeedType(requestHeaders: Headers, rowCount: number): FeedRunType {
  const headerValue = requestHeaders.get("x-feed-type")?.toLowerCase();
  if (headerValue === "full" || headerValue === "delta") {
    return headerValue;
  }
  // Heuristic: very few rows → delta, otherwise assume full
  if (rowCount < DELTA_ROW_THRESHOLD) {
    return "delta";
  }
  return "full";
}

export async function resolveSource(slug: string): Promise<Source | null> {
  const supabase = createAdminClient();

  // Look up existing source
  const { data: existing } = await supabase.from("sources").select("*").eq("slug", slug).single();
  if (existing) return existing as Source;

  // Check source limit before creating
  const { count } = await supabase.from("sources").select("*", { count: "exact", head: true });
  if ((count ?? 0) >= MAX_SOURCES) return null;

  // Auto-register new source
  const { data: created } = await supabase.from("sources").insert({ slug, display_name: slug }).select("*").single();

  return (created as Source) ?? null;
}

export async function enforceFeedRunCap(sourceId: string): Promise<void> {
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("feed_runs")
    .select("*", { count: "exact", head: true })
    .eq("source_id", sourceId);

  if ((count ?? 0) >= MAX_FEED_RUNS) {
    const { data: oldest } = await supabase
      .from("feed_runs")
      .select("id")
      .eq("source_id", sourceId)
      .order("received_at", { ascending: true })
      .limit(1)
      .single();

    if (oldest) {
      await supabase.from("feed_runs").delete().eq("id", oldest.id);
    }
  }
}
