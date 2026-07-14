import { useEffect } from 'react';
import { SITE_NAME, SITE_SOCIAL_IMAGE, SITE_URL } from '@/constants/site';
import {
  getPathLanguage,
  languagePathSegments,
  stripLanguageSuffix,
  supportedLanguages,
  withLanguageSuffix,
} from '@/i18n/languageRouting';

type PageMetadataOptions = {
  canonicalPath?: string;
  image?: string;
  imageAlt?: string;
  includeAlternates?: boolean;
  noFollow?: boolean;
  noIndex?: boolean;
  type?: 'article' | 'website';
};

const languageMetadata = {
  en: { hreflang: 'en', locale: 'en_US' },
  zh: { hreflang: 'zh-CN', locale: 'zh_CN' },
  ja: { hreflang: 'ja', locale: 'ja_JP' },
  ko: { hreflang: 'ko', locale: 'ko_KR' },
  'zh-Hant': { hreflang: 'zh-Hant', locale: 'zh_TW' },
} as const;

const upsertMeta = (selector: string, attributes: Record<string, string>, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
    document.head.appendChild(element);
  }
  element.content = content;
};

export function usePageMetadata(
  title: string,
  description: string,
  {
    canonicalPath,
    image = SITE_SOCIAL_IMAGE,
    imageAlt = `${SITE_NAME} — MapleStory Guides, Tools & Community`,
    includeAlternates,
    noFollow = false,
    noIndex = false,
    type = 'website',
  }: PageMetadataOptions = {},
) {
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
    const canonicalUrl = new URL(canonicalPath || currentPathname, `${SITE_URL}/`).href;
    const imageUrl = new URL(image, `${SITE_URL}/`).href;
    const robots = `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}, max-image-preview:large`;
    const currentLanguage = getPathLanguage(currentPathname) || 'en';
    const shouldIncludeAlternates = includeAlternates ?? !noIndex;
    document.title = fullTitle;

    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertMeta('meta[name="robots"]', { name: 'robots' }, robots);
    upsertMeta('meta[name="googlebot"]', { name: 'googlebot' }, robots);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type);
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME);
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, languageMetadata[currentLanguage].locale);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, fullTitle);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, imageUrl);
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, imageAlt);
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, fullTitle);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, imageUrl);
    upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, imageAlt);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    document.head.querySelectorAll('link[rel="alternate"][data-language-route]').forEach((element) => element.remove());
    document.head.querySelectorAll('meta[property="og:locale:alternate"][data-seo-generated]').forEach((element) => element.remove());

    if (shouldIncludeAlternates) {
      const routePathname = stripLanguageSuffix(canonicalPath || currentPathname);
      supportedLanguages.forEach((language) => {
        const segment = languagePathSegments[language];
        const alternate = document.createElement('link');
        alternate.rel = 'alternate';
        alternate.dataset.languageRoute = segment;
        alternate.hreflang = languageMetadata[language].hreflang;
        alternate.href = new URL(withLanguageSuffix(routePathname, language), `${SITE_URL}/`).href;
        document.head.appendChild(alternate);

        if (language !== currentLanguage) {
          const localeAlternate = document.createElement('meta');
          localeAlternate.setAttribute('property', 'og:locale:alternate');
          localeAlternate.dataset.seoGenerated = 'true';
          localeAlternate.content = languageMetadata[language].locale;
          document.head.appendChild(localeAlternate);
        }
      });

      const defaultAlternate = document.createElement('link');
      defaultAlternate.rel = 'alternate';
      defaultAlternate.dataset.languageRoute = 'x-default';
      defaultAlternate.hreflang = 'x-default';
      defaultAlternate.href = new URL(withLanguageSuffix(routePathname, 'en'), `${SITE_URL}/`).href;
      document.head.appendChild(defaultAlternate);
    }
  }, [canonicalPath, currentPathname, description, image, imageAlt, includeAlternates, noFollow, noIndex, title, type]);
}
