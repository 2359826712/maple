export type MapleSeries = 'maplestory' | 'classic' | 'm' | 'worlds' | 'n' | 'idle';

export type ContentType =
  | 'news'
  | 'event'
  | 'guide'
  | 'patch-note'
  | 'maintenance'
  | 'cash-shop'
  | 'developer-note'
  | 'roadmap'
  | 'api-announcement'
  | 'creator-announcement';

export type StorageMode = 'metadata-only' | 'summary-and-metadata' | 'full-text-permitted';
export type ContentStatus = 'published' | 'updated' | 'expired' | 'removed' | 'redirected' | 'archived' | 'unknown';
export type CalendarStatus = 'upcoming' | 'active' | 'ending-soon' | 'ended' | 'unknown';
export type SourceAdapterName = 'rss' | 'atom' | 'sitemap' | 'html' | 'json-api' | 'nexon-cms' | 'nexon-community' | 'graphql' | 'github' | 'youtube' | 'browser';

export interface ContentSource {
  id: string;
  name: string;
  series: MapleSeries;
  regions: string[];
  languages: string[];
  source_type: 'official-site' | 'wiki' | 'community-site' | 'blog' | 'forum' | 'rss' | 'atom' | 'sitemap' | 'json-api' | 'graphql-api' | 'github' | 'youtube' | 'other';
  content_types: ContentType[];
  base_url: string;
  discovery_urls: string[];
  feed_url: string | null;
  api_url: string | null;
  sitemap_urls: string[];
  adapter: SourceAdapterName;
  parser: string;
  adapter_config: Record<string, unknown>;
  official: boolean;
  enabled: boolean;
  crawl_frequency: string;
  rate_limit: { requests: number; per_seconds: number };
  requires_javascript: boolean;
  requires_login: boolean;
  storage_mode: StorageMode;
  robots_policy: 'respect';
  last_checked: string | null;
  last_success: string | null;
  last_error: string | null;
  notes: string | null;
}

export interface ContentImage {
  url: string;
  alt: string | null;
}

export interface ContentAttachment {
  url: string;
  title: string | null;
  media_type: string | null;
}

export interface ContentRecord {
  id: string;
  source_id: string;
  canonical_url: string;
  source_url: string;
  external_id: string | null;
  title: string;
  original_title: string;
  series: MapleSeries;
  regions: string[];
  languages: string[];
  content_type: ContentType;
  subcategory: string | null;
  official: boolean;
  author: string | null;
  published_at: string | null;
  updated_at: string | null;
  discovered_at: string;
  last_checked: string;
  summary: string | null;
  body_text: string | null;
  body_markdown: string | null;
  storage_mode: StorageMode;
  tags: string[];
  images: ContentImage[];
  attachments: ContentAttachment[];
  related_content_ids: string[];
  related_urls: string[];
  content_hash: string;
  status: ContentStatus;
  translation_status: 'not-requested' | 'pending' | 'machine-translated' | 'human-reviewed' | 'not-applicable';
  metadata: Record<string, unknown>;
  notes: string | null;
}

export interface EventRecord extends ContentRecord {
  content_type: 'event';
  event_name: string;
  registration_start: string | null;
  registration_end: string | null;
  event_start: string | null;
  event_end: string | null;
  claim_start: string | null;
  claim_end: string | null;
  shop_start: string | null;
  shop_end: string | null;
  timezone: string | null;
  eligibility: string[];
  requirements: string[];
  rewards: string[];
  event_currency: string[];
  event_shop: string | null;
  participation_steps: string[];
  related_announcement_id: string | null;
  related_patch_ids: string[];
  calendar_status: CalendarStatus;
}

export interface GuideRecord extends ContentRecord {
  content_type: 'guide';
  guide_type: 'beginner' | 'class' | 'boss' | 'system' | 'progression' | 'event' | 'creator' | 'other';
  class_name: string | null;
  boss_name: string | null;
  system_name: string | null;
  level_range: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'unknown';
  game_version: string | null;
  applicable_regions: string[];
  prerequisites: string[];
  steps: string[];
  recommended_items: string[];
  recommended_stats: string[];
  outdated_warning: boolean;
}

export interface PatchNoteRecord extends ContentRecord {
  content_type: 'patch-note';
  game_version: string | null;
  patch_date: string | null;
  maintenance_start: string | null;
  maintenance_end: string | null;
  changes: string[];
  known_issues: string[];
  resolved_issues: string[];
}

export type IndexedContentRecord = ContentRecord | EventRecord | GuideRecord | PatchNoteRecord;

export interface DiscoveredItem {
  url: string;
  externalId?: string | null;
  title?: string | null;
  publishedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface FetchResult {
  requestUrl: string;
  finalUrl: string;
  status: number;
  contentType: string | null;
  etag: string | null;
  lastModified: string | null;
  fetchedAt: string;
  body: string;
}

export interface CrawlContext {
  now: string;
  dryRun: boolean;
  fetch(url: string, options?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<FetchResult>;
}

export interface SourceAdapter {
  discover(source: ContentSource, context: CrawlContext): Promise<DiscoveredItem[]>;
  fetch(item: DiscoveredItem, context: CrawlContext): Promise<FetchResult>;
  parse(result: FetchResult, context: CrawlContext): Promise<Array<Record<string, unknown>>>;
  normalize(content: Record<string, unknown>, source: ContentSource, context: CrawlContext): Promise<IndexedContentRecord[]>;
}
