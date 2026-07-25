create table if not exists public.ui_translations (
  translation_key varchar(192) not null,
  locale varchar(16) not null,
  namespace varchar(64) not null default 'common',
  source_language varchar(16) not null default 'en',
  source_text text not null,
  source_hash text not null,
  translated_text text not null,
  provider varchar(64) not null default 'local_model',
  model varchar(128) not null default '',
  glossary_version varchar(64) not null default '',
  quality_checks jsonb not null default '{}'::jsonb,
  review_status varchar(16) not null default 'pending',
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (translation_key, locale),
  check (translation_key ~ '^[a-z0-9][a-z0-9_.-]{0,191}$'),
  check (locale in ('zh', 'zh-Hant', 'ja', 'ko')),
  check (source_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (locale <> source_language),
  check (btrim(source_text) <> ''),
  check (btrim(source_hash) <> ''),
  check (btrim(translated_text) <> ''),
  check (jsonb_typeof(quality_checks) = 'object'),
  check (jsonb_typeof(context) = 'object'),
  check (review_status in ('pending', 'automatic', 'approved', 'stale', 'rejected')),
  check (
    review_status <> 'automatic'
    or quality_checks->>'status' = 'passed'
  )
);

create index if not exists ui_translations_locale_status_idx
  on public.ui_translations (locale, review_status, updated_at desc);

create index if not exists ui_translations_source_hash_idx
  on public.ui_translations (source_hash);

create or replace function public.touch_ui_translation_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_ui_translation_updated_at
  on public.ui_translations;

create trigger touch_ui_translation_updated_at
before update on public.ui_translations
for each row
execute function public.touch_ui_translation_updated_at();

alter table public.ui_translations enable row level security;

drop policy if exists "Public can read published UI translations"
  on public.ui_translations;

create policy "Public can read published UI translations"
on public.ui_translations
for select
using (review_status in ('automatic', 'approved'));

revoke insert, update, delete on public.ui_translations from anon, authenticated;
grant select on public.ui_translations to anon, authenticated;

comment on table public.ui_translations is
  'Current localized website interface strings keyed by stable i18n keys; separate from content translations.';

comment on column public.ui_translations.translation_key is
  'Stable interface key such as mh_section_char_lookup or nav_tools.';

comment on column public.ui_translations.source_hash is
  'Hash of the current source-language text used to detect stale translations.';

comment on column public.ui_translations.context is
  'Optional UI placement, interpolation variables, and translator guidance.';
