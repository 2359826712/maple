import Head from 'next/head';
import {
  getPathLanguage,
  getPathServer,
  stripRouteSuffixes,
  supportedLanguages,
  withRouteSuffixes,
  type SupportedLanguage,
} from '@/i18n/languageRouting';
import { buildPageTitle } from '@/hooks/usePageMetadata';
import { SITE_NAME, SITE_SOCIAL_IMAGE, SITE_URL } from '@/constants/site';
import metadataCatalog from '@/seo/routeMetadata.json';
import siteKeywords from '@/seo/siteKeywords.json';
import { getNewsCopy } from '@/pages/news/localizedNews';
import type { NextRoutePageProps } from './routeData';
import { getSeriesProduct } from '@/pages/series/catalog';
import { isSeriesModule, seriesModuleByBaseHref, type SeriesModule } from '@/pages/series/scope';

type MetadataCopy = { description: string; title: string };
type RouteEntry = {
  canonicalRoute?: string;
  copy: Record<SupportedLanguage, MetadataCopy>;
  follow?: boolean;
  index: boolean;
  schema?: { types: string[] };
};

const routes = metadataCatalog.routes as Record<string, RouteEntry>;

const getMetadataEntry = (route: string) => {
  if (routes[route]) return { entry: routes[route], route };
  if (route.startsWith('/guides/')) return { entry: routes['/guides'], route };
  if (route.startsWith('/upcoming/')) return { entry: routes['/upcoming'], route };
  if (route.startsWith('/wiki/boss/')) return { entry: routes['/wiki/boss'], route };
  if (route.startsWith('/wiki/article/')) return { entry: routes['/wiki'], route };
  if (route.startsWith('/series/')) return { entry: routes['/series'], route };
  if (route.startsWith('/content/')) return { entry: routes['/series'], route };
  return null;
};

const plainText = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const schemaBody = (value = '') => plainText(value).slice(0, 10_000);
const seriesModuleLabelKeys: Record<SeriesModule, string> = {
  news: 'nav_news',
  upcoming: 'nav_upcoming',
  guides: 'nav_guides',
  events: 'nav_events',
  tools: 'nav_tools',
  checklist: 'nav_checklist',
  wiki: 'nav_wiki',
  rankings: 'nav_rankings',
  shop: 'nav_shop',
  community: 'nav_community',
  feedback: 'nav_feedback',
};

export default function RouteHead({ page }: { page: NextRoutePageProps }) {
  const {
    pathname,
    initialEvents = [],
    initialGuide,
    initialNews = [],
    initialOfficialArticle,
    initialUpcomingArticle,
    initialUpcomingFeed,
    initialWikiEntry,
    requestDescription,
    requestTitle,
    requestPath,
    routeHeadBoss,
    translation,
  } = page;
  const language = getPathLanguage(pathname) || 'en';
  const server = getPathServer(pathname) || 'gms';
  const route = stripRouteSuffixes(pathname);
  const requestUrl = new URL(requestPath || pathname, SITE_URL);
  const seriesId = requestUrl.searchParams.get('series') || undefined;
  const seriesProduct = route.startsWith('/series/')
    ? getSeriesProduct(route.slice('/series/'.length).split('/')[0])
    : getSeriesProduct(seriesId);
  const contentMatch = route.match(/^\/content\/([^/]+)\/([^/]+)$/);
  const contentModule = isSeriesModule(contentMatch?.[1]) ? contentMatch[1] : undefined;
  const scopedRouteModule = seriesModuleByBaseHref[route as keyof typeof seriesModuleByBaseHref]
    || (route === '/tools' ? 'tools' : undefined);
  const seriesModule = scopedRouteModule || contentModule;
  const seriesModuleLabel = seriesModule ? translation[seriesModuleLabelKeys[seriesModule]] : undefined;
  const seriesPageTitle = seriesProduct
    ? [seriesProduct.name, seriesModuleLabel].filter(Boolean).join(' ')
    : undefined;
  const seriesPageDescription = seriesProduct
    ? plainText(`${seriesProduct.name}${seriesModuleLabel ? ` ${seriesModuleLabel}` : ''}: ${translation[seriesProduct.descriptionKey] || ''}`).slice(0, 180)
    : undefined;
  const resolved = getMetadataEntry(route);
  const entry = resolved?.entry;
  const copy = entry?.copy[language] || entry?.copy.en || metadataCatalog.notFound[language];
  const dynamicTitle = initialUpcomingArticle?.title
    || initialGuide?.localizedCopy?.title
    || initialGuide?.title
    || initialWikiEntry?.title
    || (routeHeadBoss ? `${routeHeadBoss.name} MapleStory Boss Guide` : undefined)
    || seriesPageTitle
    || (route === '/source' || route.startsWith('/content/') ? requestTitle : undefined);
  const dynamicDescription = initialUpcomingArticle?.excerpt
    || initialGuide?.localizedCopy?.excerpt
    || initialGuide?.excerpt
    || initialWikiEntry?.description
    || (routeHeadBoss ? `MapleStory ${routeHeadBoss.name} boss requirements, difficulties, mechanics, rewards, and strategy.` : undefined)
    || requestDescription
    || seriesPageDescription
    || (initialOfficialArticle ? plainText(initialOfficialArticle.text || initialOfficialArticle.html).slice(0, 180) : undefined);
  const pageTitle = dynamicTitle || copy.title;
  const description = dynamicDescription || copy.description;
  const title = buildPageTitle(pageTitle);
  const canonicalRoute = entry?.canonicalRoute || route;
  const canonicalPath = withRouteSuffixes(canonicalRoute, language, server);
  const canonicalSeriesSearch = seriesProduct && seriesId && seriesProduct.id !== 'maplestory-pc'
    ? `?series=${encodeURIComponent(seriesProduct.id)}`
    : '';
  const canonicalUrl = `${SITE_URL}${canonicalPath}${canonicalSeriesSearch}`;
  const keywords = seriesProduct
    ? [
        seriesProduct.name,
        seriesModuleLabel ? `${seriesProduct.name} ${seriesModuleLabel}` : undefined,
        siteKeywords[language],
      ].filter(Boolean).join(', ')
    : siteKeywords[language];
  const imageUrl = `${SITE_URL}${SITE_SOCIAL_IMAGE}`;
  const index = Boolean(entry?.index);
  const follow = entry?.follow !== false;
  const robots = `${index ? 'index' : 'noindex'}, ${follow ? 'follow' : 'nofollow'}, max-image-preview:large`;
  const languageConfig = metadataCatalog.languages[language];
  const newsItemList = (route === '/news' || (route === '/events' && initialEvents.length === 0)) && initialNews.length > 0
    ? {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#news-list`,
        name: copy.title,
        itemListElement: initialNews.map((item, index) => {
          const localized = getNewsCopy(item, language);
          return {
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'NewsArticle',
              headline: localized.title,
              description: localized.excerpt,
              datePublished: item.publishedAt,
              image: item.image,
              url: item.sourceUrl,
              author: { '@type': 'Organization', name: item.author },
            },
          };
        }),
      }
    : null;
  const eventItemList = route === '/events' && initialEvents.length > 0
    ? {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#event-list`,
        name: pageTitle,
        itemListElement: initialEvents.map((item, itemIndex) => ({
          '@type': 'ListItem',
          position: itemIndex + 1,
          item: {
            '@type': 'Event',
            name: item.name,
            startDate: item.windowStart,
            endDate: item.windowEnd,
            image: item.image,
            url: item.sourceUrl,
            description: item.rewards.join(', '),
          },
        })),
      }
    : null;
  const upcomingItemList = route === '/upcoming' && initialUpcomingFeed?.items.length
    ? {
        '@type': 'ItemList',
        '@id': `${canonicalUrl}#update-list`,
        name: pageTitle,
        itemListElement: initialUpcomingFeed.items.map((item, itemIndex) => ({
          '@type': 'ListItem',
          position: itemIndex + 1,
          item: {
            '@type': 'BlogPosting',
            headline: item.title,
            description: item.excerpt,
            datePublished: item.publishedAt,
            image: item.image || undefined,
            url: `${SITE_URL}${withRouteSuffixes(`/upcoming/${item.id}`, language, server)}`,
            author: { '@type': 'Person', name: item.author },
          },
        })),
      }
    : null;
  const articleEntity = initialUpcomingArticle
    ? {
        '@type': 'BlogPosting',
        '@id': `${canonicalUrl}#article`,
        headline: initialUpcomingArticle.title,
        description: initialUpcomingArticle.excerpt,
        articleBody: schemaBody(initialUpcomingArticle.contentHtml),
        datePublished: initialUpcomingArticle.publishedAt,
        image: initialUpcomingArticle.image || undefined,
        author: { '@type': 'Person', name: initialUpcomingArticle.author },
        url: canonicalUrl,
      }
    : initialGuide
      ? {
          '@type': 'Article',
          '@id': `${canonicalUrl}#article`,
          headline: dynamicTitle,
          description,
          articleBody: schemaBody(initialGuide.contentText || initialGuide.contentHtml),
          dateModified: initialGuide.sourceSyncedAt,
          image: initialGuide.image || undefined,
          author: { '@type': 'Organization', name: initialGuide.author },
          url: canonicalUrl,
        }
      : initialWikiEntry
        ? {
            '@type': 'Article',
            '@id': `${canonicalUrl}#article`,
            headline: initialWikiEntry.title,
            description,
            articleBody: schemaBody(initialWikiEntry.content || initialWikiEntry.htmlContent),
            dateModified: initialWikiEntry.lastSynced,
            author: { '@type': 'Organization', name: 'MapleStory Wiki contributors' },
            url: canonicalUrl,
          }
        : routeHeadBoss
          ? {
              '@type': 'Article',
              '@id': `${canonicalUrl}#article`,
              headline: pageTitle,
              description,
              articleBody: routeHeadBoss.articleBody,
              image: routeHeadBoss.image || undefined,
              url: canonicalUrl,
            }
          : initialOfficialArticle
          ? {
              '@type': 'Article',
              '@id': `${canonicalUrl}#article`,
              headline: pageTitle,
              description,
              articleBody: schemaBody(initialOfficialArticle.text || initialOfficialArticle.html),
              url: canonicalUrl,
              sameAs: initialOfficialArticle.sourceUrl,
            }
          : null;
  const itemList = newsItemList || eventItemList || upcomingItemList;
  const websiteEntity = route === '/'
    ? {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        inLanguage: languageConfig.htmlLang,
        keywords,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}${withRouteSuffixes('/search', language, server)}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }
    : null;
  const schema = entry
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#organization`,
            name: SITE_NAME,
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/mpstorys-icon-128.jpg`,
          },
          ...(websiteEntity ? [websiteEntity] : []),
          {
            '@type': articleEntity ? 'WebPage' : itemList ? 'CollectionPage' : 'WebPage',
            '@id': `${canonicalUrl}#webpage`,
            name: pageTitle,
            description,
            keywords,
            url: canonicalUrl,
            inLanguage: languageConfig.htmlLang,
            ...(articleEntity ? { mainEntity: { '@id': articleEntity['@id'] } } : {}),
            ...(!articleEntity && itemList ? { mainEntity: { '@id': itemList['@id'] } } : {}),
          },
          ...(itemList ? [itemList] : []),
          ...(articleEntity ? [articleEntity] : []),
        ],
      }).replaceAll('<', '\\u003c')
    : '';

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta property="og:type" content={articleEntity ? 'article' : 'website'} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={languageConfig.ogLocale} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <link rel="canonical" href={canonicalUrl} />
      {index && supportedLanguages.map((alternateLanguage) => (
        <link
          key={alternateLanguage}
          rel="alternate"
          hrefLang={metadataCatalog.languages[alternateLanguage].hreflang}
          href={`${SITE_URL}${withRouteSuffixes(canonicalRoute, alternateLanguage, server)}${canonicalSeriesSearch}`}
        />
      ))}
      {index && (
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${withRouteSuffixes(canonicalRoute, 'en', server)}${canonicalSeriesSearch}`} />
      )}
      {schema && <script type="application/ld+json" data-seo-schema="route" dangerouslySetInnerHTML={{ __html: schema }} />}
    </Head>
  );
}
