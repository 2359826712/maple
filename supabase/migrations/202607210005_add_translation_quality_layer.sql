alter table public.translation_jobs
  add column if not exists glossary_version varchar(32) not null default 'none';

alter table public.series_content_translations
  add column if not exists glossary_version varchar(32) not null default 'none',
  add column if not exists quality_checks jsonb not null default '{}'::jsonb;

alter table public.series_content_translations
  drop constraint if exists series_content_translations_review_status_check;

update public.series_content_translations
set review_status = 'approved'
where review_status = 'reviewed';

alter table public.series_content_translations
  add constraint series_content_translations_review_status_check
  check (review_status in ('automatic', 'needs_review', 'approved', 'stale', 'rejected'));

alter table public.series_content_translations
  add constraint series_content_translations_quality_checks_object
  check (jsonb_typeof(quality_checks) = 'object');

create index if not exists series_content_translations_review_idx
  on public.series_content_translations (review_status, locale, updated_at desc);

drop policy if exists "Public can read content translations"
  on public.series_content_translations;

create policy "Public can read content translations" on public.series_content_translations
  for select using (review_status in ('automatic', 'approved'));
