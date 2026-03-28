create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  feed_run_id uuid not null references feed_runs(id) on delete cascade,
  -- Core identification
  item_id text,
  group_id text,
  -- Basic attributes
  title text,
  description text,
  url text,
  mobile_link text,
  -- Imagery
  image_url text,
  additional_image_url text,
  -- Pricing
  price text,
  sale_price text,
  sale_price_effective_date text,
  unit_pricing_measure text,
  unit_pricing_base_measure text,
  -- Availability
  availability text,
  availability_date text,
  expiration_date text,
  -- Identifiers
  brand text,
  gtin text,
  mpn text,
  identifier_exists text,
  condition text,
  -- Classification
  google_product_category text,
  product_type text,
  adult text,
  age_group text,
  -- Variants
  color text,
  gender text,
  material text,
  pattern text,
  size text,
  size_type text,
  size_system text,
  -- Energy
  energy_efficiency_class text,
  min_energy_efficiency_class text,
  max_energy_efficiency_class text,
  -- Bundles
  multipack text,
  is_bundle text,
  -- Custom labels
  custom_label_0 text,
  custom_label_1 text,
  custom_label_2 text,
  custom_label_3 text,
  custom_label_4 text,
  -- Ads
  ads_redirect text,
  -- Loyalty
  loyalty_points text,
  installment text,
  created_at timestamptz not null default now()
);

alter table products enable row level security;

-- Allow SELECT for anonymous and authenticated users; no client-side writes
create policy "products_select_all" on products
  for select to anon, authenticated using (true);

create index products_feed_run_id_idx on products(feed_run_id);
