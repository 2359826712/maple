import type { GameVersion } from '@/domain/regionModel';

export const supportedLanguages = ['en', 'zh', 'ja', 'ko', 'zh-Hant'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];
export const supportedServers = ['gms', 'kms', 'jms', 'tms', 'msea'] as const satisfies readonly GameVersion[];

export const languagePathSegments: Record<SupportedLanguage, string> = {
  en: 'en',
  zh: 'zh',
  ja: 'ja',
  ko: 'ko',
  'zh-Hant': 'zh-hant',
};

const pathSegmentLanguages = Object.fromEntries(
  Object.entries(languagePathSegments).map(([language, segment]) => [segment, language]),
) as Record<string, SupportedLanguage>;

export const serverPathSegments: Record<GameVersion, string> = {
  gms: 'GMS',
  kms: 'KMS',
  jms: 'JMS',
  tms: 'TMS',
  msea: 'MSEA',
};

const pathSegmentServers = Object.fromEntries(
  supportedServers.map((server) => [serverPathSegments[server].toLowerCase(), server]),
) as Record<string, GameVersion>;

export const normalizeLanguage = (language?: string | null): SupportedLanguage => {
  const normalized = (language || '').toLowerCase();
  if (normalized.startsWith('zh-hant') || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) return 'zh-Hant';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('ko')) return 'ko';
  return 'en';
};

export const getPathLanguage = (pathname: string): SupportedLanguage | null => {
  const segments = pathname.split('/').filter(Boolean);
  const serverOffset = getPathServer(pathname) ? 2 : 1;
  const languageSegment = segments.at(-serverOffset)?.toLowerCase();
  return languageSegment ? pathSegmentLanguages[languageSegment] || null : null;
};

export const getPathServer = (pathname: string): GameVersion | null => {
  const lastSegment = pathname.split('/').filter(Boolean).at(-1)?.toLowerCase();
  return lastSegment ? pathSegmentServers[lastSegment] || null : null;
};

export const normalizeServer = (server?: string | null): GameVersion => {
  const normalized = server?.toLowerCase() as GameVersion;
  return supportedServers.includes(normalized) ? normalized : 'gms';
};

export const stripRouteSuffixes = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  if (getPathServer(pathname)) segments.pop();
  const possibleLanguage = segments.at(-1)?.toLowerCase();
  if (possibleLanguage && pathSegmentLanguages[possibleLanguage]) segments.pop();
  return segments.length ? `/${segments.join('/')}` : '/';
};

export const stripLanguageSuffix = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const server = getPathServer(pathname);
  if (server) segments.pop();
  if (getPathLanguage(pathname)) segments.pop();
  if (server) segments.push(serverPathSegments[server]);
  return segments.length ? `/${segments.join('/')}` : '/';
};

export const withLanguageSuffix = (pathname: string, language: string) => {
  const server = getPathServer(pathname);
  const basePath = stripRouteSuffixes(pathname).replace(/\/+$/, '') || '/';
  const suffix = languagePathSegments[normalizeLanguage(language)];
  const localizedPath = basePath === '/' ? `/${suffix}` : `${basePath}/${suffix}`;
  return server ? `${localizedPath}/${serverPathSegments[server]}` : localizedPath;
};

export const withServerSuffix = (pathname: string, server: string) => {
  const language = getPathLanguage(pathname);
  const basePath = stripRouteSuffixes(pathname).replace(/\/+$/, '') || '/';
  const serverSuffix = serverPathSegments[normalizeServer(server)];
  const localizedPath = language
    ? `${basePath === '/' ? '' : basePath}/${languagePathSegments[language]}`
    : basePath;
  return `${localizedPath}/${serverSuffix}`.replace(/^\/\//, '/');
};

export const withRouteSuffixes = (pathname: string, language: string, server: string) =>
  withServerSuffix(withLanguageSuffix(pathname, language), server);

export const localizeHref = (href: string, language: string, server?: string) => {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const pathAndSearch = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const searchIndex = pathAndSearch.indexOf('?');
  const search = searchIndex >= 0 ? pathAndSearch.slice(searchIndex) : '';
  const pathname = searchIndex >= 0 ? pathAndSearch.slice(0, searchIndex) : pathAndSearch;
  const localizedPath = server
    ? withRouteSuffixes(pathname || '/', language, server)
    : withLanguageSuffix(pathname || '/', language);
  return `${localizedPath}${search}${hash}`;
};
