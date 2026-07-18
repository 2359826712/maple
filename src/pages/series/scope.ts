export const seriesModuleByBaseHref = {
  '/news': 'news',
  '/upcoming': 'upcoming',
  '/guides': 'guides',
  '/events': 'events',
  '/mapler-house': 'tools',
  '/checklist': 'checklist',
  '/wiki': 'wiki',
  '/rankings': 'rankings',
  '/shop': 'shop',
  '/community': 'community',
  '/feedback': 'feedback',
} as const;

export type SeriesModule = (typeof seriesModuleByBaseHref)[keyof typeof seriesModuleByBaseHref];

export const sharedSeriesModules = ['shop', 'community', 'feedback'] as const satisfies readonly SeriesModule[];

export const isSharedSeriesModule = (module?: SeriesModule): module is (typeof sharedSeriesModules)[number] => (
  Boolean(module && sharedSeriesModules.includes(module as (typeof sharedSeriesModules)[number]))
);

const seriesWithRankings = new Set(['maplestory-pc']);

export const isSeriesModuleAvailable = (seriesId?: string, module?: SeriesModule) => (
  !module || module !== 'rankings' || !seriesId || seriesWithRankings.has(seriesId)
);

export const baseHrefBySeriesModule = Object.fromEntries(
  Object.entries(seriesModuleByBaseHref).map(([href, module]) => [module, href]),
) as Record<SeriesModule, string>;

export const SERIES_QUERY_PARAM = 'series';

export const isSeriesModule = (value?: string): value is SeriesModule => (
  Boolean(value && Object.values(seriesModuleByBaseHref).includes(value as SeriesModule))
);

export const getSeriesIdFromSearch = (search = '') => {
  const seriesId = new URLSearchParams(search).get(SERIES_QUERY_PARAM) || undefined;
  return seriesId;
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
      module: seriesModuleByBaseHref[pathname as keyof typeof seriesModuleByBaseHref],
    };
  }
  return {
    seriesId: segments[1] || getSeriesIdFromSearch(search),
    module: isSeriesModule(segments[2]) ? segments[2] : undefined,
  };
};

export const getSeriesModuleHref = (seriesId: string, module: SeriesModule) => (
  withSeriesScope(baseHrefBySeriesModule[module], seriesId)
);

export const getSeriesResourceHref = (seriesId: string, module: SeriesModule, slug: string) => (
  isSharedSeriesModule(module)
    ? withSeriesScope(baseHrefBySeriesModule[module], seriesId)
    : withSeriesScope(`/content/${module}/${encodeURIComponent(slug)}`, seriesId)
);

export const scopeModuleHref = (seriesId: string | undefined, baseHref: string) => {
  const pathname = baseHref.split(/[?#]/, 1)[0];
  const module = seriesModuleByBaseHref[pathname as keyof typeof seriesModuleByBaseHref];
  return module ? withSeriesScope(baseHref, seriesId) : baseHref;
};
