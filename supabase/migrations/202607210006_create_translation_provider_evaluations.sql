create table if not exists public.translation_provider_evaluations (
  id uuid primary key default gen_random_uuid(),
  release_id varchar(160) not null references public.content_releases(id) on update cascade on delete restrict,
  content_id uuid not null references public.series_content(id) on update cascade on delete cascade,
  field_names text[] not null,
  source_revision text not null,
  source_language varchar(16) not null,
  target_language varchar(16) not null,
  policy_version varchar(32) not null,
  routing_version varchar(32) not null,
  glossary_version varchar(32) not null,
  provider varchar(32) not null,
  model varchar(160) not null,
  translated_fields jsonb not null default '{}'::jsonb,
  quality_checks jsonb not null default '{}'::jsonb,
  status varchar(16) not null default 'pending',
  quality_status varchar(16),
  review_status varchar(16) not null default 'unreviewed',
  reviewer_score smallint,
  reviewer_notes text,
  last_error text,
  evaluated_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint translation_provider_evaluations_identity_unique unique (
    content_id, target_language, source_revision, routing_version, provider, model
  ),
  check (cardinality(field_names) > 0),
  check (field_names <@ array['title', 'summary']::text[]),
  check (source_revision ~ '^sha256:[a-f0-9]{64}$'),
  check (source_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (target_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (target_language <> source_language),
  check (policy_version ~ '^[1-9][0-9]*$'),
  check (routing_version ~ '^[1-9][0-9]*$'),
  check (glossary_version ~ '^[1-9][0-9]*$'),
  check (jsonb_typeof(translated_fields) = 'object'),
  check (jsonb_typeof(quality_checks) = 'object'),
  check (status in ('pending', 'completed', 'unavailable', 'failed')),
  check (quality_status is null or quality_status in ('automatic', 'needs_review')),
  check (review_status in ('unreviewed', 'approved', 'rejected')),
  check (reviewer_score is null or reviewer_score between 1 and 5),
  check ((review_status = 'unreviewed') or reviewed_at is not null)
);

create index if not exists translation_provider_evaluations_compare_idx
  on public.translation_provider_evaluations (
    content_id, target_language, source_revision, routing_version, provider
  );

create index if not exists translation_provider_evaluations_review_idx
  on public.translation_provider_evaluations (review_status, status, provider, created_at);

alter table public.translation_provider_evaluations enable row level security;
revoke all on table public.translation_provider_evaluations from anon, authenticated;

comment on table public.translation_provider_evaluations is
  'Provider comparison candidates only. This table is never an authoritative display source.';
