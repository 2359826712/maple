-- One shared database, with every content row explicitly scoped to a MapleStory series.
-- Keeping series in rows preserves unified accounts, search, favorites, moderation, and cache invalidation.

create table if not exists public.content_series (
  id varchar(64) primary key,
  display_name text not null,
  default_language varchar(16) not null default 'en',
  status varchar(16) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (default_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (status in ('active', 'testing', 'archived'))
);

insert into public.content_series (id, display_name, status) values
  ('maplestory-pc', 'MapleStory', 'active'),
  ('maplestory-classic', 'MapleStory Classic World', 'testing'),
  ('maplestory-m', 'MapleStory M', 'active'),
  ('maplestory-n', 'MapleStory N', 'active'),
  ('maplestory-worlds', 'MapleStory Worlds', 'active'),
  ('maplestory-idle', 'MapleStory: Idle RPG', 'active')
on conflict (id) do update set
  display_name = excluded.display_name,
  status = excluded.status,
  updated_at = now();

create table if not exists public.series_editions (
  id varchar(96) primary key,
  series_id varchar(64) not null references public.content_series(id) on update cascade on delete restrict,
  code varchar(32) not null,
  display_name text not null,
  region_code varchar(16),
  locale varchar(16) not null default 'en',
  status varchar(16) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (series_id, code),
  unique (series_id, id),
  check (locale in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (status in ('active', 'testing', 'archived'))
);

insert into public.series_editions (id, series_id, code, display_name, region_code, locale, status) values
  ('maplestory-pc:gms', 'maplestory-pc', 'gms', 'Global MapleStory', 'GLOBAL', 'en', 'active'),
  ('maplestory-pc:kms', 'maplestory-pc', 'kms', 'Korean MapleStory', 'KR', 'ko', 'active'),
  ('maplestory-pc:jms', 'maplestory-pc', 'jms', 'Japan MapleStory', 'JP', 'ja', 'active'),
  ('maplestory-pc:tms', 'maplestory-pc', 'tms', 'Taiwan MapleStory', 'TW', 'zh-Hant', 'active'),
  ('maplestory-pc:msea', 'maplestory-pc', 'msea', 'MapleSEA', 'SEA', 'en', 'active'),
  ('maplestory-classic:global-test', 'maplestory-classic', 'global-test', 'Global Closed Online Test', 'GLOBAL', 'en', 'testing'),
  ('maplestory-m:global', 'maplestory-m', 'global', 'MapleStory M Global', 'GLOBAL', 'en', 'active'),
  ('maplestory-n:global', 'maplestory-n', 'global', 'MapleStory N', 'GLOBAL', 'en', 'active'),
  ('maplestory-worlds:global', 'maplestory-worlds', 'global', 'MapleStory Worlds Global', 'GLOBAL', 'en', 'active'),
  ('maplestory-idle:global', 'maplestory-idle', 'global', 'MapleStory: Idle RPG Global', 'GLOBAL', 'en', 'active')
on conflict (id) do update set
  display_name = excluded.display_name,
  region_code = excluded.region_code,
  locale = excluded.locale,
  status = excluded.status,
  updated_at = now();

create table if not exists public.series_content (
  id uuid primary key default gen_random_uuid(),
  series_id varchar(64) not null references public.content_series(id) on update cascade on delete restrict,
  edition_id varchar(96),
  module varchar(24) not null,
  slug varchar(160) not null,
  source_language varchar(16) not null default 'en',
  title text not null,
  summary text not null default '',
  body_html text not null default '',
  source_label text not null,
  source_url text not null,
  source_revision text,
  published_at timestamptz,
  source_updated_at timestamptz,
  verified_at timestamptz not null default now(),
  status varchar(16) not null default 'published',
  content_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (series_id, edition_id) references public.series_editions(series_id, id) on update cascade on delete restrict,
  unique (series_id, module, slug),
  check (module in ('news', 'upcoming', 'guides', 'events', 'tools', 'checklist', 'wiki', 'rankings', 'shop', 'community')),
  check (source_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (status in ('draft', 'published', 'archived')),
  check (source_url ~ '^https://')
);

create index if not exists series_content_feed_idx
  on public.series_content (series_id, module, status, published_at desc nulls last, verified_at desc);
create index if not exists series_content_source_idx
  on public.series_content (source_url);
create index if not exists series_content_search_idx
  on public.series_content using gin (to_tsvector('simple', title || ' ' || summary));

create table if not exists public.series_content_translations (
  content_id uuid not null references public.series_content(id) on delete cascade,
  locale varchar(16) not null,
  title text not null,
  summary text not null default '',
  body_html text not null default '',
  source_revision text,
  provider varchar(64) not null default 'automatic',
  review_status varchar(16) not null default 'automatic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (content_id, locale),
  check (locale in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (review_status in ('automatic', 'reviewed', 'stale', 'rejected'))
);

create index if not exists series_content_translations_locale_idx
  on public.series_content_translations (locale, review_status);

create or replace function public.mark_series_content_translations_stale()
returns trigger
language plpgsql
as $$
begin
  if old.source_revision is distinct from new.source_revision
    or old.title is distinct from new.title
    or old.summary is distinct from new.summary
    or old.body_html is distinct from new.body_html then
    update public.series_content_translations
      set review_status = case when review_status = 'rejected' then review_status else 'stale' end,
          updated_at = now()
      where content_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists series_content_translation_staleness on public.series_content;
create trigger series_content_translation_staleness
after update on public.series_content
for each row execute function public.mark_series_content_translations_stale();

create table if not exists public.series_wiki_pages (
  id uuid primary key default gen_random_uuid(),
  series_id varchar(64) not null references public.content_series(id) on update cascade on delete restrict,
  edition_id varchar(96),
  slug varchar(200) not null,
  canonical_title text not null,
  source_language varchar(16) not null default 'en',
  source_label text not null,
  source_url text not null,
  source_revision text,
  summary text not null default '',
  body_html text not null default '',
  infobox jsonb not null default '{}'::jsonb,
  categories text[] not null default '{}',
  verified_at timestamptz not null default now(),
  status varchar(16) not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (series_id, edition_id) references public.series_editions(series_id, id) on update cascade on delete restrict,
  unique (series_id, slug),
  check (source_language in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (status in ('draft', 'published', 'archived')),
  check (source_url ~ '^https://')
);

create index if not exists series_wiki_search_idx
  on public.series_wiki_pages using gin (to_tsvector('simple', canonical_title || ' ' || summary));

create table if not exists public.series_wiki_translations (
  wiki_page_id uuid not null references public.series_wiki_pages(id) on delete cascade,
  locale varchar(16) not null,
  title text not null,
  summary text not null default '',
  body_html text not null default '',
  source_revision text,
  provider varchar(64) not null default 'automatic',
  review_status varchar(16) not null default 'automatic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (wiki_page_id, locale),
  check (locale in ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
  check (review_status in ('automatic', 'reviewed', 'stale', 'rejected'))
);

create or replace function public.mark_series_wiki_translations_stale()
returns trigger
language plpgsql
as $$
begin
  if old.source_revision is distinct from new.source_revision
    or old.canonical_title is distinct from new.canonical_title
    or old.summary is distinct from new.summary
    or old.body_html is distinct from new.body_html then
    update public.series_wiki_translations
      set review_status = case when review_status = 'rejected' then review_status else 'stale' end,
          updated_at = now()
      where wiki_page_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists series_wiki_translation_staleness on public.series_wiki_pages;
create trigger series_wiki_translation_staleness
after update on public.series_wiki_pages
for each row execute function public.mark_series_wiki_translations_stale();

create table if not exists public.series_tools (
  id uuid primary key default gen_random_uuid(),
  series_id varchar(64) not null references public.content_series(id) on update cascade on delete restrict,
  edition_id varchar(96),
  slug varchar(160) not null,
  title text not null,
  route_path text not null,
  definition jsonb not null default '{}'::jsonb,
  source_urls text[] not null default '{}',
  source_revision text,
  verified_at timestamptz not null default now(),
  status varchar(16) not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (series_id, edition_id) references public.series_editions(series_id, id) on update cascade on delete restrict,
  unique (series_id, slug),
  check (route_path ~ '^/'),
  check (status in ('draft', 'published', 'archived'))
);

alter table public.content_series enable row level security;
alter table public.series_editions enable row level security;
alter table public.series_content enable row level security;
alter table public.series_content_translations enable row level security;
alter table public.series_wiki_pages enable row level security;
alter table public.series_wiki_translations enable row level security;
alter table public.series_tools enable row level security;

create policy "Public can read active series" on public.content_series
  for select using (status in ('active', 'testing'));
create policy "Public can read active series editions" on public.series_editions
  for select using (status in ('active', 'testing'));
create policy "Public can read published series content" on public.series_content
  for select using (status = 'published');
create policy "Public can read content translations" on public.series_content_translations
  for select using (review_status in ('automatic', 'reviewed'));
create policy "Public can read published wiki pages" on public.series_wiki_pages
  for select using (status = 'published');
create policy "Public can read wiki translations" on public.series_wiki_translations
  for select using (review_status in ('automatic', 'reviewed'));
create policy "Public can read published tools" on public.series_tools
  for select using (status = 'published');

revoke insert, update, delete on public.content_series from anon, authenticated;
revoke insert, update, delete on public.series_editions from anon, authenticated;
revoke insert, update, delete on public.series_content from anon, authenticated;
revoke insert, update, delete on public.series_content_translations from anon, authenticated;
revoke insert, update, delete on public.series_wiki_pages from anon, authenticated;
revoke insert, update, delete on public.series_wiki_translations from anon, authenticated;
revoke insert, update, delete on public.series_tools from anon, authenticated;
