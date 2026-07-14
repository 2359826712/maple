export const supportedLanguages = ['en', 'zh', 'ja', 'ko', 'zh-Hant'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

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

export const normalizeLanguage = (language?: string | null): SupportedLanguage => {
  const normalized = (language || '').toLowerCase();
  if (normalized.startsWith('zh-hant') || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) return 'zh-Hant';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('ko')) return 'ko';
  return 'en';
};

export const getPathLanguage = (pathname: string): SupportedLanguage | null => {
  const lastSegment = pathname.split('/').filter(Boolean).at(-1)?.toLowerCase();
  return lastSegment ? pathSegmentLanguages[lastSegment] || null : null;
};

export const stripLanguageSuffix = (pathname: string) => {
  if (!getPathLanguage(pathname)) return pathname || '/';
  const segments = pathname.split('/').filter(Boolean);
  segments.pop();
  return segments.length ? `/${segments.join('/')}` : '/';
};

export const withLanguageSuffix = (pathname: string, language: string) => {
  const basePath = stripLanguageSuffix(pathname).replace(/\/+$/, '') || '/';
  const suffix = languagePathSegments[normalizeLanguage(language)];
  return basePath === '/' ? `/${suffix}` : `${basePath}/${suffix}`;
};

export const localizeHref = (href: string, language: string) => {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const pathAndSearch = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const searchIndex = pathAndSearch.indexOf('?');
  const search = searchIndex >= 0 ? pathAndSearch.slice(searchIndex) : '';
  const pathname = searchIndex >= 0 ? pathAndSearch.slice(0, searchIndex) : pathAndSearch;
  return `${withLanguageSuffix(pathname || '/', language)}${search}${hash}`;
};
