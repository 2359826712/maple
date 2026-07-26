-- mpstorys-localization: native-localization-v1 rollout.
-- Existing published translations remain readable until a passing native row
-- atomically replaces them. Every replaced row is archived server-side.

alter table public.ui_translations
  add column if not exists prompt_version varchar(64) not null default 'legacy-translation';

update public.ui_translations
set prompt_version = coalesce(
  nullif(quality_checks ->> 'pipeline_version', ''),
  'legacy-translation'
)
where prompt_version = 'legacy-translation';

alter table public.series_content_translations
  add column if not exists prompt_version varchar(64) not null default 'legacy-translation';

update public.series_content_translations
set prompt_version = coalesce(
  nullif(quality_checks ->> 'pipeline_version', ''),
  'legacy-translation'
)
where prompt_version = 'legacy-translation';

alter table public.series_wiki_translations
  add column if not exists model varchar(128) not null default '',
  add column if not exists glossary_version varchar(64) not null default '',
  add column if not exists quality_checks jsonb not null default '{}'::jsonb,
  add column if not exists prompt_version varchar(64) not null default 'legacy-translation';

alter table public.series_wiki_translations
  drop constraint if exists series_wiki_translations_review_status_check;
alter table public.series_wiki_translations
  add constraint series_wiki_translations_review_status_check
  check (review_status in ('automatic', 'approved', 'reviewed', 'stale', 'rejected'));

drop policy if exists "Public can read wiki translations"
  on public.series_wiki_translations;
create policy "Public can read wiki translations"
on public.series_wiki_translations
for select
using (review_status in ('automatic', 'approved', 'reviewed'));

create schema if not exists localization_audit;
revoke all on schema localization_audit from public, anon, authenticated;

create table if not exists localization_audit.ui_translations_history
  (like public.ui_translations including defaults);
alter table localization_audit.ui_translations_history
  add column if not exists history_id uuid default gen_random_uuid(),
  add column if not exists archived_at timestamptz not null default now(),
  add column if not exists replacement_reason text not null default 'atomic replacement';

create table if not exists localization_audit.series_content_translations_history
  (like public.series_content_translations including defaults);
alter table localization_audit.series_content_translations_history
  add column if not exists history_id uuid default gen_random_uuid(),
  add column if not exists archived_at timestamptz not null default now(),
  add column if not exists replacement_reason text not null default 'atomic replacement';

create table if not exists localization_audit.series_wiki_translations_history
  (like public.series_wiki_translations including defaults);
alter table localization_audit.series_wiki_translations_history
  add column if not exists history_id uuid default gen_random_uuid(),
  add column if not exists archived_at timestamptz not null default now(),
  add column if not exists replacement_reason text not null default 'atomic replacement';

revoke all on localization_audit.ui_translations_history from public, anon, authenticated;
revoke all on localization_audit.series_content_translations_history from public, anon, authenticated;
revoke all on localization_audit.series_wiki_translations_history from public, anon, authenticated;

create or replace function public.archive_ui_translation_before_replace()
returns trigger
language plpgsql
security definer
set search_path = public, localization_audit
as $$
begin
  if old.source_hash is distinct from new.source_hash
    or old.translated_text is distinct from new.translated_text
    or old.prompt_version is distinct from new.prompt_version
    or old.review_status is distinct from new.review_status then
    insert into localization_audit.ui_translations_history
    select old.*, gen_random_uuid(), now(), 'atomic replacement';
  end if;
  return new;
end;
$$;

drop trigger if exists archive_ui_translation_before_replace
  on public.ui_translations;
create trigger archive_ui_translation_before_replace
before update on public.ui_translations
for each row execute function public.archive_ui_translation_before_replace();

create or replace function public.archive_series_translation_before_replace()
returns trigger
language plpgsql
security definer
set search_path = public, localization_audit
as $$
begin
  if old.source_revision is distinct from new.source_revision
    or old.title is distinct from new.title
    or old.summary is distinct from new.summary
    or old.prompt_version is distinct from new.prompt_version
    or old.review_status is distinct from new.review_status then
    insert into localization_audit.series_content_translations_history
    select old.*, gen_random_uuid(), now(), 'atomic replacement';
  end if;
  return new;
end;
$$;

drop trigger if exists archive_series_translation_before_replace
  on public.series_content_translations;
create trigger archive_series_translation_before_replace
before update on public.series_content_translations
for each row execute function public.archive_series_translation_before_replace();

create or replace function public.archive_wiki_translation_before_replace()
returns trigger
language plpgsql
security definer
set search_path = public, localization_audit
as $$
begin
  if old.source_revision is distinct from new.source_revision
    or old.title is distinct from new.title
    or old.summary is distinct from new.summary
    or old.body_html is distinct from new.body_html
    or old.prompt_version is distinct from new.prompt_version
    or old.review_status is distinct from new.review_status then
    insert into localization_audit.series_wiki_translations_history
    select old.*, gen_random_uuid(), now(), 'atomic replacement';
  end if;
  return new;
end;
$$;

drop trigger if exists archive_wiki_translation_before_replace
  on public.series_wiki_translations;
create trigger archive_wiki_translation_before_replace
before update on public.series_wiki_translations
for each row execute function public.archive_wiki_translation_before_replace();

alter table public.translation_jobs
  drop constraint if exists translation_jobs_policy_version_check;
alter table public.translation_jobs
  add constraint translation_jobs_policy_version_check
  check (policy_version ~ '^[a-z0-9][a-z0-9._-]{0,31}$');

do $$
declare
  field_constraint text;
begin
  for field_constraint in
    select constraint_name
    from information_schema.check_constraints
    where constraint_schema = 'public'
      and constraint_name in (
        select constraint_name
        from information_schema.constraint_column_usage
        where table_schema = 'public'
          and table_name = 'translation_jobs'
          and column_name = 'field_names'
      )
  loop
    execute format(
      'alter table public.translation_jobs drop constraint %I',
      field_constraint
    );
  end loop;
end;
$$;

alter table public.translation_jobs
  add constraint translation_jobs_field_names_native_check
  check (
    cardinality(field_names) > 0
    and field_names <@ array['title', 'summary', 'body_html']::text[]
  );

create or replace function public.enqueue_native_series_localization_jobs(
  requested_limit integer default 100
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_policy_version constant varchar(32) := 'native-localization-v1';
  inserted_count integer := 0;
begin
  if requested_limit < 1 or requested_limit > 500 then
    raise exception 'enqueue limit must be between 1 and 500';
  end if;

  with target_locales(locale) as (
    values ('zh'), ('zh-Hant'), ('ja'), ('ko')
  ),
  verified_sources as (
    select distinct on (content.id)
      content.id as content_id,
      content.source_revision,
      content.source_language,
      content.module,
      content.summary,
      content.body_html,
      content.published_at,
      run.release_id,
      coalesce(run.completed_at, run.started_at) as verified_at,
      case
        when coalesce(run.completed_at, run.started_at) >= now() - interval '24 hours'
          then 1000
        when content.module in ('events', 'upcoming')
          and content.published_at >= now() - interval '30 days'
          then 700
        when content.module in ('news', 'shop')
          and content.published_at >= now() - interval '30 days'
          then 600
        else 300
      end::smallint as localization_priority
    from public.series_content as content
    join public.publisher_run_items as run_item
      on run_item.content_id = content.id
     and run_item.source_revision = content.source_revision
    join public.publisher_runs as run
      on run.id = run_item.publisher_run_id
     and run.status = 'completed'
     and run.release_id is not null
    where content.status = 'published'
      and content.source_language = 'en'
      and content.source_revision ~ '^sha256:[a-f0-9]{64}$'
    order by
      content.id,
      coalesce(run.completed_at, run.started_at) desc,
      run.id desc
  ),
  selected_sources as (
    select source.*
    from verified_sources as source
    where exists (
      select 1
      from target_locales as target
      where not exists (
        select 1
        from public.translation_jobs as job
        where job.content_id = source.content_id
          and job.target_language = target.locale
          and job.source_revision = source.source_revision
          and job.policy_version = selected_policy_version
      )
        and not exists (
          select 1
          from public.series_content_translations as translation
          where translation.content_id = source.content_id
            and translation.locale = target.locale
            and translation.source_revision = source.source_revision
            and translation.prompt_version = selected_policy_version
            and translation.review_status in ('automatic', 'approved')
        )
    )
    order by
      source.localization_priority desc,
      source.verified_at desc,
      source.content_id
    limit requested_limit
  ),
  inserted as (
    insert into public.translation_jobs (
      release_id,
      content_id,
      entity_type,
      field_names,
      source_revision,
      source_language,
      target_language,
      policy_version,
      priority
    )
    select
      source.release_id,
      source.content_id,
      'series_content',
      array_remove(array[
        'title',
        case when btrim(coalesce(source.summary, '')) <> '' then 'summary' end,
        case when btrim(coalesce(source.body_html, '')) <> '' then 'body_html' end
      ]::text[], null),
      source.source_revision,
      source.source_language,
      target.locale,
      selected_policy_version,
      source.localization_priority
    from selected_sources as source
    cross join target_locales as target
    where target.locale <> source.source_language
      and not exists (
        select 1
        from public.series_content_translations as translation
        where translation.content_id = source.content_id
          and translation.locale = target.locale
          and translation.source_revision = source.source_revision
          and translation.prompt_version = selected_policy_version
          and translation.review_status in ('automatic', 'approved')
      )
    on conflict (
      content_id, target_language, source_revision, policy_version
    ) do nothing
    returning id
  )
  select count(*)::integer into inserted_count from inserted;

  return inserted_count;
end;
$$;

revoke all on function public.enqueue_series_translation_jobs(integer)
  from public, anon, authenticated;
revoke all on function public.enqueue_native_series_localization_jobs(integer)
  from public, anon, authenticated;
grant execute on function public.enqueue_native_series_localization_jobs(integer)
  to service_role;

comment on function public.enqueue_native_series_localization_jobs(integer) is
  'Explicit cutover-only enqueue for native-localization-v1; it is not called by the legacy EXE Worker scheduler.';

create table if not exists public.wiki_localization_jobs (
  id uuid primary key default gen_random_uuid(),
  wiki_page_id uuid not null
    references public.series_wiki_pages(id) on update cascade on delete cascade,
  field_names text[] not null,
  source_revision text not null,
  source_language varchar(16) not null,
  target_language varchar(16) not null,
  policy_version varchar(32) not null default 'native-localization-v1',
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
  unique (
    wiki_page_id, target_language, source_revision, policy_version
  ),
  check (
    cardinality(field_names) > 0
    and field_names <@ array['title', 'summary', 'body_html']::text[]
  ),
  check (btrim(source_revision) <> ''),
  check (source_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (target_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (target_language <> source_language),
  check (policy_version ~ '^[a-z0-9][a-z0-9._-]{0,31}$'),
  check (status in ('pending', 'processing', 'completed', 'retry', 'failed')),
  check (attempts >= 0),
  check (completed_at is null or status = 'completed')
);

create index if not exists wiki_localization_jobs_claim_idx
  on public.wiki_localization_jobs (priority desc, next_attempt_at, created_at)
  where status in ('pending', 'retry');

create or replace function public.claim_wiki_localization_jobs(
  requested_worker_id text,
  requested_limit integer default 10
)
returns setof public.wiki_localization_jobs
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
    from public.wiki_localization_jobs as job
    where job.status in ('pending', 'retry')
      and job.next_attempt_at <= now()
    order by job.priority desc, job.next_attempt_at, job.created_at
    for update skip locked
    limit requested_limit
  )
  update public.wiki_localization_jobs as job
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

create or replace function public.enqueue_wiki_localization_jobs(
  requested_limit integer default 100
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  if requested_limit < 1 or requested_limit > 500 then
    raise exception 'enqueue limit must be between 1 and 500';
  end if;

  with target_locales(locale) as (
    values ('zh'), ('zh-Hant'), ('ja'), ('ko')
  ),
  selected_pages as (
    select page.*
    from public.series_wiki_pages as page
    where page.status = 'published'
      and page.source_language = 'en'
      and nullif(btrim(page.source_revision), '') is not null
      and exists (
        select 1
        from target_locales as target
        where not exists (
          select 1
          from public.wiki_localization_jobs as job
          where job.wiki_page_id = page.id
            and job.target_language = target.locale
            and job.source_revision = page.source_revision
            and job.policy_version = 'native-localization-v1'
        )
          and not exists (
            select 1
            from public.series_wiki_translations as translation
            where translation.wiki_page_id = page.id
              and translation.locale = target.locale
              and translation.source_revision = page.source_revision
              and translation.prompt_version = 'native-localization-v1'
              and translation.review_status in ('automatic', 'approved', 'reviewed')
          )
      )
    order by page.updated_at desc, page.id
    limit requested_limit
  ),
  inserted as (
    insert into public.wiki_localization_jobs (
      wiki_page_id, field_names, source_revision, source_language,
      target_language, policy_version, priority
    )
    select
      page.id,
      array_remove(array[
        'title',
        case when btrim(page.summary) <> '' then 'summary' end,
        case when btrim(page.body_html) <> '' then 'body_html' end
      ]::text[], null),
      page.source_revision,
      page.source_language,
      target.locale,
      'native-localization-v1',
      500
    from selected_pages as page
    cross join target_locales as target
    where target.locale <> page.source_language
    on conflict (
      wiki_page_id, target_language, source_revision, policy_version
    ) do nothing
    returning id
  )
  select count(*)::integer into inserted_count from inserted;

  return inserted_count;
end;
$$;

alter table public.wiki_localization_jobs enable row level security;
revoke all on public.wiki_localization_jobs from anon, authenticated;
revoke all on function public.claim_wiki_localization_jobs(text, integer)
  from public, anon, authenticated;
revoke all on function public.enqueue_wiki_localization_jobs(integer)
  from public, anon, authenticated;
grant execute on function public.claim_wiki_localization_jobs(text, integer)
  to service_role;
grant execute on function public.enqueue_wiki_localization_jobs(integer)
  to service_role;

comment on table public.wiki_localization_jobs is
  'Native-language Wiki localization queue, intentionally isolated from the legacy EXE content queue.';
