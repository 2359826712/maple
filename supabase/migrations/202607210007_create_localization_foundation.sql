create table if not exists public.localization_memory (
  id uuid primary key default gen_random_uuid(),
  asset_id varchar(160),
  source_hash char(64) not null,
  source_text text not null,
  source_language varchar(16) not null,
  target_language varchar(16) not null,
  localized_text text not null,
  memory_type varchar(16) not null,
  provider varchar(64) not null default 'localization-assets',
  source_reference text,
  review_status varchar(16) not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint localization_memory_identity_unique unique (
    source_hash, source_language, target_language, memory_type
  ),
  check (source_hash ~ '^[a-f0-9]{64}$'),
  check (source_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (target_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (source_language <> target_language),
  check (memory_type in ('official', 'manual', 'glossary', 'machine')),
  check (review_status in ('pending', 'approved', 'rejected'))
);

create index if not exists localization_memory_lookup_idx
  on public.localization_memory (
    source_hash, source_language, target_language, review_status, memory_type
  );

alter table public.translation_jobs
  add column if not exists resolution_type varchar(16) not null default 'unresolved',
  add column if not exists resolution_metadata jsonb not null default '{}'::jsonb;

alter table public.translation_jobs
  drop constraint if exists translation_jobs_resolution_type_check;

alter table public.translation_jobs
  add constraint translation_jobs_resolution_type_check
  check (resolution_type in ('unresolved', 'exact', 'glossary', 'memory', 'template', 'mixed', 'provider'));

alter table public.translation_jobs
  add constraint translation_jobs_resolution_metadata_object
  check (jsonb_typeof(resolution_metadata) = 'object');

create table if not exists public.localization_resolutions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.translation_jobs(id) on update cascade on delete cascade,
  content_id uuid not null references public.series_content(id) on update cascade on delete cascade,
  target_language varchar(16) not null,
  source_revision text not null,
  policy_version varchar(32) not null,
  asset_version varchar(32) not null,
  localized_fields jsonb not null,
  resolution_type varchar(16) not null,
  resolution_metadata jsonb not null default '{}'::jsonb,
  quality_checks jsonb not null default '{}'::jsonb,
  status varchar(16) not null,
  review_status varchar(16) not null default 'unreviewed',
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint localization_resolutions_identity_unique unique (
    job_id, source_revision, policy_version, asset_version
  ),
  check (target_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (source_revision ~ '^sha256:[a-f0-9]{64}$'),
  check (policy_version ~ '^[1-9][0-9]*$'),
  check (asset_version ~ '^[1-9][0-9]*$'),
  check (jsonb_typeof(localized_fields) = 'object'),
  check (jsonb_typeof(resolution_metadata) = 'object'),
  check (jsonb_typeof(quality_checks) = 'object'),
  check (resolution_type in ('exact', 'glossary', 'memory', 'template', 'mixed', 'provider', 'unresolved')),
  check (status in ('resolved', 'partial', 'unresolved')),
  check (review_status in ('unreviewed', 'approved', 'rejected')),
  check ((review_status = 'unreviewed') or reviewed_at is not null)
);

create index if not exists localization_resolutions_review_idx
  on public.localization_resolutions (review_status, status, target_language, created_at);

alter table public.localization_memory enable row level security;
alter table public.localization_resolutions enable row level security;
revoke all on table public.localization_memory from anon, authenticated;
revoke all on table public.localization_resolutions from anon, authenticated;

comment on table public.localization_resolutions is
  'Private localization candidates. Promotion to series_content_translations requires a separate reviewed action.';
