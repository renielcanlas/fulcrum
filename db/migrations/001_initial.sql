create table if not exists fulcrum_schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists fulcrum_audit_events (
  event_id uuid primary key,
  interaction_id text,
  event_type text not null,
  actor_id text,
  actor_type text,
  entity_id text,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists fulcrum_audit_events_occurred_at_idx
  on fulcrum_audit_events (occurred_at desc);

create table if not exists fulcrum_ai_execution_records (
  run_id text primary key,
  correlation_id text,
  task text not null,
  provider text not null,
  status text not null,
  occurred_at timestamptz not null,
  record jsonb not null
);

create index if not exists fulcrum_ai_execution_records_occurred_at_idx
  on fulcrum_ai_execution_records (occurred_at desc);

create table if not exists fulcrum_sessions (
  session_id text primary key,
  user_id text not null,
  user_profile jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists fulcrum_sessions_expires_at_idx
  on fulcrum_sessions (expires_at);

create table if not exists fulcrum_jira_connections (
  user_id text primary key,
  connection jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists fulcrum_oauth_states (
  state text primary key,
  user_id text not null,
  metadata jsonb not null,
  expires_at timestamptz not null
);

create index if not exists fulcrum_oauth_states_expires_at_idx
  on fulcrum_oauth_states (expires_at);
