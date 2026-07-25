-- Automatically discover verified, published series_content revisions that
-- still need title + summary localization. The publisher remains write-only
-- for series_content: the localization Worker invokes this independent,
-- idempotent enqueue function before claiming translation jobs.

create table if not exists public.localization_automation_settings (
  singleton boolean primary key default true,
  series_auto_enqueue_enabled boolean not null default false,
  policy_version varchar(32) not null default '1',
  updated_at timestamptz not null default now(),
  check (singleton),
  check (policy_version ~ '^[1-9][0-9]*$')
);

insert into public.localization_automation_settings (
  singleton, series_auto_enqueue_enabled, policy_version
) values (
  true, false, '1'
)
on conflict (singleton) do nothing;

alter table public.localization_automation_settings enable row level security;
revoke all on table public.localization_automation_settings from anon, authenticated;

create or replace function public.enqueue_series_translation_jobs(
  requested_limit integer default 100
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  automation_enabled boolean;
  selected_policy_version varchar(32);
  inserted_count integer := 0;
begin
  if requested_limit < 1 or requested_limit > 500 then
    raise exception 'enqueue limit must be between 1 and 500';
  end if;

  select
    settings.series_auto_enqueue_enabled,
    settings.policy_version
  into
    automation_enabled,
    selected_policy_version
  from public.localization_automation_settings as settings
  where settings.singleton;

  if not coalesce(automation_enabled, false) then
    return 0;
  end if;

  with target_locales(locale) as (
    values ('zh'), ('zh-Hant'), ('ja'), ('ko')
  ),
  verified_sources as (
    select distinct on (content.id)
      content.id as content_id,
      content.source_revision,
      content.source_language,
      run.release_id,
      coalesce(run.completed_at, run.started_at) as verified_at
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
      and exists (
        select 1
        from target_locales as target
        where not exists (
          select 1
          from public.translation_jobs as existing_job
          where existing_job.content_id = content.id
            and existing_job.target_language = target.locale
            and existing_job.source_revision = content.source_revision
            and existing_job.policy_version = selected_policy_version
        )
          and not exists (
            select 1
            from public.series_content_translations as existing_translation
            where existing_translation.content_id = content.id
              and existing_translation.locale = target.locale
              and existing_translation.source_revision = content.source_revision
          )
      )
    order by
      content.id,
      coalesce(run.completed_at, run.started_at) desc,
      run.id desc
  ),
  selected_sources as (
    select *
    from verified_sources
    order by verified_at, content_id
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
      policy_version
    )
    select
      source.release_id,
      source.content_id,
      'series_content',
      array['title', 'summary']::text[],
      source.source_revision,
      source.source_language,
      target.locale,
      selected_policy_version
    from selected_sources as source
    cross join target_locales as target
    where target.locale <> source.source_language
      and not exists (
        select 1
        from public.series_content_translations as existing_translation
        where existing_translation.content_id = source.content_id
          and existing_translation.locale = target.locale
          and existing_translation.source_revision = source.source_revision
      )
    on conflict (
      content_id, target_language, source_revision, policy_version
    ) do nothing
    returning id
  )
  select count(*)::integer
  into inserted_count
  from inserted;

  return inserted_count;
end;
$$;

revoke all on function public.enqueue_series_translation_jobs(integer)
  from public, anon, authenticated;
grant execute on function public.enqueue_series_translation_jobs(integer)
  to service_role;

comment on table public.localization_automation_settings is
  'Server-only localization automation flags. Series auto-enqueue is disabled until explicitly enabled after production verification.';

comment on function public.enqueue_series_translation_jobs(integer) is
  'Idempotently enqueues title + summary jobs for current English published revisions that belong to a completed publisher run.';
