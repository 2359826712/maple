create table if not exists public.localization_translations (
  source_hash varchar(64) not null,
  source_language varchar(16) not null,
  target_language varchar(16) not null,
  content_format varchar(8) not null,
  source_text text not null,
  translated_text text not null,
  provider varchar(64) not null default 'automatic',
  review_status varchar(16) not null default 'automatic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  primary key (source_hash, source_language, target_language, content_format),
  constraint localization_source_language_check
    check (source_language in ('auto', 'en', 'zh', 'zh-Hant', 'ja', 'ko')),
  constraint localization_target_language_check
    check (target_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  constraint localization_content_format_check
    check (content_format in ('text', 'html')),
  constraint localization_review_status_check
    check (review_status in ('automatic', 'reviewed', 'rejected'))
);

create index if not exists localization_translations_last_used_idx
  on public.localization_translations (last_used_at);

create index if not exists localization_translations_locale_idx
  on public.localization_translations (target_language, source_language);

alter table public.localization_translations enable row level security;

revoke all on table public.localization_translations from anon, authenticated;

comment on table public.localization_translations is
  'Server-only SSR localization memory shared by every MPStorys page and game server.';

comment on column public.localization_translations.review_status is
  'Reviewed rows are preserved when automatic translation retries the same source text.';
