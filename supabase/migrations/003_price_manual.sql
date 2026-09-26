-- Optional price override on quotes (company can set custom range)
alter table public.quotes
  add column if not exists price_is_manual boolean not null default false;
