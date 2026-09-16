create table if not exists fulcrum_oauth_states (
  state text primary key,
  user_id text not null,
  metadata jsonb not null,
  expires_at timestamptz not null
);

create index if not exists fulcrum_oauth_states_expires_at_idx
  on fulcrum_oauth_states (expires_at);
