create table if not exists fulcrum_configurations (
  config_key text primary key,
  config jsonb not null,
  version integer not null default 1,
  updated_by text,
  updated_at timestamptz not null default now()
);

create index if not exists fulcrum_configurations_updated_at_idx
  on fulcrum_configurations (updated_at desc);
