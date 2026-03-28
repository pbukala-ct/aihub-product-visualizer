export type FeedRunType = "full" | "delta" | "unknown";

export interface Source {
  id: string;
  slug: string;
  display_name: string;
  created_at: string;
}

export interface SourceSummary extends Source {
  latest_run: FeedRunSummary | null;
  latest_full_run: FeedRunSummary | null;
  delta_run_count: number;
}

export interface FeedRunSummary {
  id: string;
  received_at: string;
  type: FeedRunType;
  product_count: number;
  source_id: string | null;
  sources?: { slug: string; display_name: string } | null;
  created_at: string;
}

export interface Product {
  id: string;
  feed_run_id: string;
  item_id: string | null;
  group_id: string | null;
  title: string | null;
  description: string | null;
  url: string | null;
  mobile_link: string | null;
  image_url: string | null;
  additional_image_url: string | null;
  price: string | null;
  sale_price: string | null;
  sale_price_effective_date: string | null;
  unit_pricing_measure: string | null;
  unit_pricing_base_measure: string | null;
  availability: string | null;
  availability_date: string | null;
  expiration_date: string | null;
  brand: string | null;
  gtin: string | null;
  mpn: string | null;
  identifier_exists: string | null;
  condition: string | null;
  google_product_category: string | null;
  product_type: string | null;
  adult: string | null;
  age_group: string | null;
  color: string | null;
  gender: string | null;
  material: string | null;
  pattern: string | null;
  size: string | null;
  size_type: string | null;
  size_system: string | null;
  energy_efficiency_class: string | null;
  min_energy_efficiency_class: string | null;
  max_energy_efficiency_class: string | null;
  multipack: string | null;
  is_bundle: string | null;
  custom_label_0: string | null;
  custom_label_1: string | null;
  custom_label_2: string | null;
  custom_label_3: string | null;
  custom_label_4: string | null;
  ads_redirect: string | null;
  loyalty_points: string | null;
  installment: string | null;
  attributes: Record<string, string> | null;
  created_at: string;
}

export interface FeedRun extends FeedRunSummary {
  raw_payload: string | null;
  products: Product[];
}

export type DiffStatus = "added" | "removed" | "changed" | "unchanged";

export interface ChangedField {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface ProductDiffRow {
  item_id: string;
  title: string | null;
  status: DiffStatus;
  changedFields: ChangedField[];
}

export interface FeedDiffResult {
  base: FeedRunSummary;
  head: FeedRunSummary;
  summary: Record<DiffStatus, number>;
  rows: ProductDiffRow[];
}
