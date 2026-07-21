create table if not exists public.content_releases (
  id varchar(160) primary key,
  manifest_uri text not null,
  manifest_hash varchar(64) not null unique,
  source varchar(64) not null,
  file_count integer not null,
  generated_at timestamptz,
  status varchar(16) not null default 'prepared',
  registered_at timestamptz not null default now(),
  published_at timestamptz,
  check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check (manifest_hash ~ '^[a-f0-9]{64}$'),
  check (source ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check (file_count >= 0),
  check (status in ('prepared', 'published', 'retired'))
);

alter table public.publisher_runs
  add column if not exists release_id varchar(160) references public.content_releases(id) on update cascade on delete restrict;

create index if not exists publisher_runs_release_idx
  on public.publisher_runs (release_id, started_at desc);

alter table public.content_releases enable row level security;
revoke all on table public.content_releases from anon, authenticated;
