create table if not exists public.translation_jobs (
  id uuid primary key default gen_random_uuid(),
  release_id varchar(160) not null references public.content_releases(id) on update cascade on delete restrict,
  content_id uuid not null references public.series_content(id) on update cascade on delete cascade,
  entity_type varchar(32) not null default 'series_content',
  field_names text[] not null,
  source_revision text not null,
  source_language varchar(16) not null,
  target_language varchar(16) not null,
  policy_version varchar(32) not null,
  status varchar(16) not null default 'pending',
  priority smallint not null default 0,
  attempts integer not null default 0,
  locked_at timestamptz,
  worker_id varchar(160),
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint translation_jobs_identity_unique unique (
    content_id, target_language, source_revision, policy_version
  ),
  check (entity_type = 'series_content'),
  check (cardinality(field_names) > 0),
  check (field_names <@ array['title', 'summary']::text[]),
  check (source_revision ~ '^sha256:[a-f0-9]{64}$'),
  check (source_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (target_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (target_language <> source_language),
  check (policy_version ~ '^[1-9][0-9]*$'),
  check (status in ('pending', 'processing', 'completed', 'retry', 'failed')),
  check (attempts >= 0),
  check (completed_at is null or status = 'completed')
);

create index if not exists translation_jobs_claim_idx
  on public.translation_jobs (priority desc, next_attempt_at, created_at)
  where status in ('pending', 'retry');

create index if not exists translation_jobs_release_progress_idx
  on public.translation_jobs (release_id, target_language, status);

create or replace function public.claim_translation_jobs(
  requested_worker_id text,
  requested_limit integer default 10
)
returns setof public.translation_jobs
language plpgsql
as $$
begin
  if requested_worker_id is null or btrim(requested_worker_id) = '' then
    raise exception 'worker_id is required';
  end if;
  if requested_limit < 1 or requested_limit > 100 then
    raise exception 'claim limit must be between 1 and 100';
  end if;

  return query
  with candidates as (
    select job.id
    from public.translation_jobs as job
    where job.status in ('pending', 'retry')
      and job.next_attempt_at <= now()
    order by job.priority desc, job.next_attempt_at, job.created_at
    for update skip locked
    limit requested_limit
  )
  update public.translation_jobs as job
  set status = 'processing',
      attempts = job.attempts + 1,
      locked_at = now(),
      worker_id = requested_worker_id,
      updated_at = now(),
      last_error = null
  from candidates
  where job.id = candidates.id
  returning job.*;
end;
$$;

alter table public.translation_jobs enable row level security;
revoke all on table public.translation_jobs from anon, authenticated;
revoke all on function public.claim_translation_jobs(text, integer) from public, anon, authenticated;
