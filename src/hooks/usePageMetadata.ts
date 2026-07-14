import { useEffect } from 'react';
import { SITE_NAME, SITE_SOCIAL_IMAGE, SITE_URL } from '@/constants/site';
import {
  getPathLanguage,
  languagePathSegments,
  stripLanguageSuffix,
  supportedLanguages,
  withLanguageSuffix,
} from '@/i18n/languageRouting';
import siteKeywords from '@/seo/siteKeywords.json';

type PageMetadataOptions = {
  authorName?: string;
  authorType?: 'Organization' | 'Person';
  canonicalPath?: string;
  dateModified?: string;
  datePublished?: string;
  image?: string;
  imageAlt?: string;
  includeAlternates?: boolean;
  noFollow?: boolean;
  noIndex?: boolean;
  type?: 'article' | 'website';
};

const languageMetadata = {
  en: { hreflang: 'en', htmlLang: 'en', locale: 'en_US' },
  zh: { hreflang: 'zh-CN', htmlLang: 'zh-CN', locale: 'zh_CN' },
  ja: { hreflang: 'ja', htmlLang: 'ja', locale: 'ja_JP' },
  ko: { hreflang: 'ko', htmlLang: 'ko', locale: 'ko_KR' },
  'zh-Hant': { hreflang: 'zh-Hant', htmlLang: 'zh-Hant', locale: 'zh_TW' },
} as const;

const MAX_TITLE_LENGTH = 60;

export const buildPageTitle = (title: string) => {
  const suffix = ` · ${SITE_NAME}`;
  const hasSiteName = title.includes(SITE_NAME);
  const fullTitle = hasSiteName ? title : `${title}${suffix}`;
  if (fullTitle.length <= MAX_TITLE_LENGTH) return fullTitle;

  if (hasSiteName) {
    return `${fullTitle.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
  }

  const availableTitleLength = MAX_TITLE_LENGTH - suffix.length;
  return `${title.slice(0, availableTitleLength - 1).trimEnd()}…${suffix}`;
};

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
    authorName,
    authorType = 'Person',
    canonicalPath,
    dateModified,
    datePublished,
    image = SITE_SOCIAL_IMAGE,
    imageAlt = `${SITE_NAME} — MapleStory Tools, Guides & Simulators`,
    includeAlternates,
    noFollow = false,
    noIndex = false,
    type = 'website',
  }: PageMetadataOptions = {},
) {
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  useEffect(() => {
    const fullTitle = buildPageTitle(title);
    const canonicalUrl = new URL(canonicalPath || currentPathname, `${SITE_URL}/`).href;
    const imageUrl = new URL(image, `${SITE_URL}/`).href;
    const robots = `${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}, max-image-preview:large`;
    const currentLanguage = getPathLanguage(currentPathname) || 'en';
    const shouldIncludeAlternates = includeAlternates ?? !noIndex;
    document.title = fullTitle;

    upsertMeta('meta[name="description"]', { name: 'description' }, description);
    upsertMeta('meta[name="keywords"]', { name: 'keywords' }, siteKeywords[currentLanguage]);
    upsertMeta('meta[name="robots"]', { name: 'robots' }, robots);
    upsertMeta('meta[name="googlebot"]', { name: 'googlebot' }, robots);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, type);
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME);
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, languageMetadata[currentLanguage].locale);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, fullTitle);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, imageUrl);
    upsertMeta('meta[property="og:image:secure_url"]', { property: 'og:image:secure_url' }, imageUrl);
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, imageAlt);
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, fullTitle);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, imageUrl);
    upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, imageAlt);

    let imageSource = document.head.querySelector<HTMLLinkElement>('link[rel="image_src"]');
    if (!imageSource) {
      imageSource = document.createElement('link');
      imageSource.rel = 'image_src';
      document.head.appendChild(imageSource);
    }
    imageSource.href = imageUrl;

    document.head.querySelectorAll('[data-seo-generated="article"]').forEach((element) => element.remove());
    if (type === 'article' && !noIndex) {
      if (datePublished) {
        upsertMeta(
          'meta[property="article:published_time"]',
          { property: 'article:published_time', 'data-seo-generated': 'article' },
          datePublished,
        );
      }
      if (dateModified) {
        upsertMeta(
          'meta[property="article:modified_time"]',
          { property: 'article:modified_time', 'data-seo-generated': 'article' },
          dateModified,
        );
      }
      const articleSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        '@id': `${canonicalUrl}#article`,
        headline: title,
        description,
        url: canonicalUrl,
        mainEntityOfPage: canonicalUrl,
        inLanguage: languageMetadata[currentLanguage].htmlLang,
        image: imageUrl,
        publisher: {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/mpstorys-icon-128.jpg`,
            width: 128,
            height: 128,
          },
        },
      };
      if (authorName) articleSchema.author = { '@type': authorType, name: authorName };
      if (datePublished) articleSchema.datePublished = datePublished;
      if (dateModified) articleSchema.dateModified = dateModified;

      const schema = document.createElement('script');
      schema.type = 'application/ld+json';
      schema.dataset.seoGenerated = 'article';
      schema.textContent = JSON.stringify(articleSchema).replaceAll('<', '\\u003c');
      document.head.appendChild(schema);
    }

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
  }, [authorName, authorType, canonicalPath, currentPathname, dateModified, datePublished, description, image, imageAlt, includeAlternates, noFollow, noIndex, title, type]);
}
