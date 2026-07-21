alter table public.series_content_translations
  add column if not exists model varchar(64) not null default 'unspecified';

create index if not exists series_content_translations_revision_idx
  on public.series_content_translations (content_id, locale, source_revision);
