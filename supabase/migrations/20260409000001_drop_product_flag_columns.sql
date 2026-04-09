alter table products
  drop column if exists enable_checkout,
  drop column if exists enable_search;
