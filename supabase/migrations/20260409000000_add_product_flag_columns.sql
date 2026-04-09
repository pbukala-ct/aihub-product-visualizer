alter table products
  add column if not exists enable_checkout text,
  add column if not exists enable_search text;
