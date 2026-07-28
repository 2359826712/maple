export const seriesModuleByBaseHref = {
  '/news': 'news',
  '/updates': 'news',
  '/upcoming': 'upcoming',
  '/guides': 'guides',
  '/events': 'events',
  '/mapler-house': 'tools',
  '/tools': 'tools',
  '/checklist': 'checklist',
  '/maps': 'maps',
  '/wiki': 'wiki',
  '/rankings': 'rankings',
  '/shop': 'shop',
  '/community': 'community',
  '/feedback': 'feedback',
} as const;

export type SeriesModule = (typeof seriesModuleByBaseHref)[keyof typeof seriesModuleByBaseHref];

const seriesModulePathSegments: Record<SeriesModule, string> = {
  news: 'updates',
  upcoming: 'upcoming',
  guides: 'guides',
  events: 'events',
  tools: 'tools',
  checklist: 'checklist',
  maps: 'maps',
  wiki: 'wiki',
  rankings: 'rankings',
  shop: 'shop',
  community: 'community',
  feedback: 'feedback',
};

export const sharedSeriesModules = ['shop', 'community', 'feedback'] as const satisfies readonly SeriesModule[];

export const isSharedSeriesModule = (module?: SeriesModule): module is (typeof sharedSeriesModules)[number] => (
  Boolean(module && sharedSeriesModules.includes(module as (typeof sharedSeriesModules)[number]))
);

const seriesWithRankings = new Set(['maplestory-pc', 'maplestory-n', 'maplestory-idle']);
const seriesWithShop = new Set(['maplestory-pc', 'maplestory-m', 'maplestory-worlds', 'maplestory-n', 'maplestory-idle']);

export const isSeriesModuleAvailable = (seriesId?: string, module?: SeriesModule) => (
  !module
  || !seriesId
  || (module !== 'rankings' && module !== 'shop')
  || (module === 'rankings' ? seriesWithRankings.has(seriesId) : seriesWithShop.has(seriesId))
);

export const baseHrefBySeriesModule = Object.fromEntries(
  Object.entries(seriesModuleByBaseHref).map(([href, module]) => [module, href]),
) as Record<SeriesModule, string>;

export const SERIES_QUERY_PARAM = 'series';

export const isSeriesModule = (value?: string): value is SeriesModule => (
  Boolean(value && Object.values(seriesModuleByBaseHref).includes(value as SeriesModule))
);

export const getSeriesModuleFromPathSegment = (value?: string): SeriesModule | undefined => {
  if (!value) return undefined;
  if (value === 'updates' || value === 'news') return 'news';
  return isSeriesModule(value) ? value : undefined;
};

export const getSeriesModulePathSegment = (module: SeriesModule) => seriesModulePathSegments[module];

export const getSeriesIdFromSearch = (search = '') => {
  const seriesId = new URLSearchParams(search).get(SERIES_QUERY_PARAM) || undefined;
  return seriesId;
};

const getSeriesModuleFromPathname = (pathname: string): SeriesModule | undefined => {
  const contentMatch = pathname.match(/^\/content\/([^/]+)(?:\/|$)/);
  if (contentMatch && isSeriesModule(contentMatch[1])) return contentMatch[1];

  const matchingEntry = Object.entries(seriesModuleByBaseHref).find(([baseHref]) => (
    pathname === baseHref || pathname.startsWith(`${baseHref}/`)
  ));
  return matchingEntry?.[1];
};

export const withSeriesScope = (href: string, seriesId?: string) => {
  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const pathAndSearch = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const searchIndex = pathAndSearch.indexOf('?');
  const pathname = searchIndex >= 0 ? pathAndSearch.slice(0, searchIndex) : pathAndSearch;
  const params = new URLSearchParams(searchIndex >= 0 ? pathAndSearch.slice(searchIndex + 1) : '');

  if (seriesId) params.set(SERIES_QUERY_PARAM, seriesId);
  else params.delete(SERIES_QUERY_PARAM);

  const search = params.toString();
  return `${pathname}${search ? `?${search}` : ''}${hash}`;
};

export const getSeriesRouteState = (pathname: string, search = '') => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'series') {
    return {
      seriesId: getSeriesIdFromSearch(search),
      module: getSeriesModuleFromPathname(pathname),
    };
  }
  return {
    seriesId: segments[1] || getSeriesIdFromSearch(search),
    module: getSeriesModuleFromPathSegment(segments[2]),
  };
};

export const getSeriesModuleHref = (seriesId: string, module: SeriesModule) => (
  `/series/${encodeURIComponent(seriesId)}/${getSeriesModulePathSegment(module)}`
);

export const getSeriesResourceHref = (seriesId: string, module: SeriesModule, slug: string) => (
  `/series/${encodeURIComponent(seriesId)}/${module}/${encodeURIComponent(slug)}`
);

export const scopeModuleHref = (seriesId: string | undefined, baseHref: string) => {
  const pathname = baseHref.split(/[?#]/, 1)[0];
  const module = seriesModuleByBaseHref[pathname as keyof typeof seriesModuleByBaseHref];
  if (!module || !seriesId) return baseHref;
  const source = new URL(baseHref, 'https://mpstorys.com');
  source.searchParams.delete(SERIES_QUERY_PARAM);
  return `${getSeriesModuleHref(seriesId, module)}${source.search}${source.hash}`;
};
