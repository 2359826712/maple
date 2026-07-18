import generatedResources from '../../generated/resources.json';
import type { SeriesModule } from '@/pages/series/scope';

export type ResourceIndexRecord = {
  id: string;
  name: string;
  website: string;
  page: string;
  url: string;
  series: 'maplestory' | 'classic' | 'm' | 'worlds' | 'n' | 'idle';
  regions: string[];
  languages: string[];
  category: string;
  subcategory: string | null;
  description: string;
  official: boolean;
  opensource: boolean;
  github_url: string | null;
  api_url: string | null;
  mobile_support: 'native' | 'responsive' | 'partial' | 'unsupported' | 'unknown';
  login_required: boolean | null;
  status: 'active' | 'maintenance' | 'inactive' | 'archived' | 'deprecated' | 'unknown';
  last_checked: string;
  tags: string[];
  source_urls: string[];
  notes: string | null;
};

const appSeriesIds: Record<ResourceIndexRecord['series'], string> = {
  maplestory: 'maplestory-pc',
  classic: 'maplestory-classic',
  m: 'maplestory-m',
  worlds: 'maplestory-worlds',
  n: 'maplestory-n',
  idle: 'maplestory-idle',
};

const categoryModules: Record<string, SeriesModule> = {
  official: 'news',
  news: 'news',
  events: 'events',
  'patch-notes': 'upcoming',
  guide: 'guides',
  wiki: 'wiki',
  database: 'wiki',
  rankings: 'rankings',
  community: 'community',
  discord: 'community',
  reddit: 'community',
  youtube: 'community',
  media: 'community',
  calculator: 'tools',
  simulator: 'tools',
  planner: 'tools',
  builder: 'tools',
  optimizer: 'tools',
  'character-lookup': 'tools',
  'guild-lookup': 'tools',
  api: 'tools',
  sdk: 'tools',
  library: 'tools',
  'developer-tool': 'tools',
  github: 'tools',
  downloads: 'tools',
  other: 'tools',
};

export const indexedResources = generatedResources as ResourceIndexRecord[];

export const getIndexedResourceSeriesId = (resource: ResourceIndexRecord) => appSeriesIds[resource.series];

export const getIndexedResourceModule = (resource: ResourceIndexRecord): SeriesModule => (
  categoryModules[resource.category] || 'tools'
);
