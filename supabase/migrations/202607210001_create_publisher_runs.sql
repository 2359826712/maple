create table if not exists public.publisher_runs (
  id uuid primary key default gen_random_uuid(),
  manifest_hash varchar(64) not null,
  source_count integer not null,
  selected_count integer not null,
  selector jsonb not null default '{}'::jsonb,
  insert_count integer not null default 0,
  update_count integer not null default 0,
  skip_count integer not null default 0,
  error_count integer not null default 0,
  status varchar(16) not null default 'running',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_error text,
  check (manifest_hash ~ '^[a-f0-9]{64}$'),
  check (source_count >= 0 and selected_count >= 0),
  check (insert_count >= 0 and update_count >= 0 and skip_count >= 0 and error_count >= 0),
  check (status in ('running', 'completed', 'failed'))
);

create index if not exists publisher_runs_manifest_idx
  on public.publisher_runs (manifest_hash, started_at desc);

create index if not exists publisher_runs_status_idx
  on public.publisher_runs (status, started_at desc);

create table if not exists public.publisher_run_items (
  publisher_run_id uuid not null references public.publisher_runs(id) on delete cascade,
  content_id uuid not null references public.series_content(id) on delete restrict,
  action varchar(16) not null,
  source_revision text not null,
  created_at timestamptz not null default now(),
  primary key (publisher_run_id, content_id),
  check (action in ('insert', 'update', 'skip'))
);

create index if not exists publisher_run_items_content_idx
  on public.publisher_run_items (content_id, created_at desc);
