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
import { usesArticleContentStyles } from './routeStyles';
import { getSeriesProduct } from '@/pages/series/catalog';
import { isSeriesModule, seriesModuleByBaseHref, type SeriesModule } from '@/pages/series/scope';
import {
  getSeriesLandingKeywords,
  getSeriesLandingProfile,
} from '@/pages/series/landingContent';
import { getSeriesVersionShortLabel } from '@/pages/series/versionConfig';
import { getArticleSearchIntentProfile } from '@/pages/series/articleSearchIntent';
import {
  getHelpCenterKeywords,
  getHelpCenterProfile,
  getHelpTopic,
  getHelpTopicArticleProfile,
} from '@/pages/help/helpContent';

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
  if (route.startsWith('/help/')) return { entry: routes['/help'], route };
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
    initialSeriesResourceDetail,
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
  const includeArticleContentStyles = usesArticleContentStyles(route);
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
  const seriesLandingProfile = seriesProduct
    ? getSeriesLandingProfile(seriesProduct.id, server, language)
    : undefined;
  const articleIntent = initialSeriesResourceDetail?.resource
    ? getArticleSearchIntentProfile(
        {
          contentId: initialSeriesResourceDetail.contentRecord?.id,
          sourceUrl: initialSeriesResourceDetail.resource.sourceUrl,
        },
        language,
    )
    : undefined;
  const helpSegments = route.split('/').filter(Boolean);
  const isSeriesHelp = helpSegments[0] === 'help' && helpSegments[1] === 'series';
  const helpSeriesId = isSeriesHelp ? helpSegments[2] : undefined;
  const effectiveHelpSeriesId = helpSeriesId || (route === '/help' ? 'maplestory-pc' : undefined);
  const helpTopicId = isSeriesHelp ? helpSegments[3] : helpSegments[1];
  const helpProfile = route === '/help' || (isSeriesHelp && !helpTopicId)
    ? getHelpCenterProfile(language)
    : undefined;
  const helpSeriesProduct = getSeriesProduct(effectiveHelpSeriesId);
  const helpTopics = helpProfile
    ? helpProfile.topics.filter((topic) => !effectiveHelpSeriesId || topic.seriesId === effectiveHelpSeriesId)
    : [];
  const helpTopic = helpTopicId ? getHelpTopic(language, helpTopicId) : undefined;
  const helpArticleIntent = helpTopicId
    ? getHelpTopicArticleProfile(language, helpTopicId)
    : undefined;
  const seriesEditionLabel = seriesProduct
    ? getSeriesVersionShortLabel(seriesProduct.id, server)
    : undefined;
  const seriesPageTitle = seriesProduct
    ? [
        seriesLandingProfile?.seriesName || seriesProduct.name,
        seriesEditionLabel,
        seriesModuleLabel || (language === 'zh'
          ? '攻略与更新'
          : language === 'zh-Hant'
            ? '攻略與更新'
            : language === 'ja'
              ? '攻略・更新'
              : language === 'ko'
                ? '가이드·업데이트'
                : 'Guide & Updates'),
      ].filter(Boolean).join(' ')
    : undefined;
  const seriesPageDescription = seriesProduct
    ? plainText(
        seriesLandingProfile?.deck
        || `${seriesProduct.name} ${seriesEditionLabel || ''}${seriesModuleLabel ? ` ${seriesModuleLabel}` : ''}: ${translation[seriesProduct.descriptionKey] || ''}`,
      ).slice(0, 180)
    : undefined;
  const resolved = getMetadataEntry(route);
  const entry = resolved?.entry;
  const copy = entry?.copy[language] || entry?.copy.en || metadataCatalog.notFound[language];
  const dynamicTitle = initialUpcomingArticle?.title
    || initialGuide?.localizedCopy?.title
    || initialGuide?.title
    || initialWikiEntry?.title
    || routeHeadBoss?.title
    || (helpSeriesProduct ? `${helpSeriesProduct.name} ${copy.title}` : undefined)
    || helpArticleIntent?.title
    || helpTopic?.question
    || articleIntent?.title
    || (route.startsWith('/content/') ? requestTitle : undefined)
    || seriesPageTitle
    || (route === '/source' ? requestTitle : undefined);
  const dynamicDescription = initialUpcomingArticle?.excerpt
    || initialGuide?.localizedCopy?.excerpt
    || initialGuide?.excerpt
    || initialWikiEntry?.description
    || routeHeadBoss?.description
    || helpArticleIntent?.description
    || helpTopic?.answer[0]
    || articleIntent?.description
    || (route.startsWith('/content/') ? requestDescription : undefined)
    || requestDescription
    || seriesPageDescription
    || (initialOfficialArticle ? plainText(initialOfficialArticle.text || initialOfficialArticle.html).slice(0, 180) : undefined);
  const pageTitle = dynamicTitle || copy.title;
  const description = dynamicDescription || copy.description;
  const title = buildPageTitle(pageTitle);
  const canonicalRoute = route === '/help'
    ? '/help/series/maplestory-pc'
    : entry?.canonicalRoute || route;
  const canonicalPath = withRouteSuffixes(canonicalRoute, language, server);
  const canonicalSeriesSearch = seriesProduct && seriesId && seriesProduct.id !== 'maplestory-pc'
    ? `?series=${encodeURIComponent(seriesProduct.id)}`
    : '';
  const canonicalUrl = `${SITE_URL}${canonicalPath}${canonicalSeriesSearch}`;
  const keywords = helpProfile
    ? [
        effectiveHelpSeriesId
          ? helpTopics.flatMap((topic) => topic.keywords)
          : getHelpCenterKeywords(language),
        siteKeywords[language],
      ].join(', ')
    : helpTopic
      ? [
          ...(helpArticleIntent?.keywords || helpTopic.keywords),
          siteKeywords[language],
        ].join(', ')
    : seriesProduct
    ? [
        ...(articleIntent
          ? articleIntent.keywords
          : seriesLandingProfile
            ? getSeriesLandingKeywords(seriesLandingProfile)
            : [seriesProduct.name]),
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
          : initialSeriesResourceDetail?.resource
          ? {
              '@type': 'Article',
              '@id': `${canonicalUrl}#article`,
              headline: pageTitle,
              description,
              articleBody: schemaBody([
                initialSeriesResourceDetail.contentRecord?.summary
                  || initialSeriesResourceDetail.resource.description,
                articleIntent?.description,
                ...(articleIntent?.sections.flatMap((section) => [
                  section.title,
                  ...section.paragraphs,
                ]) || []),
                ...initialSeriesResourceDetail.contentSections.flatMap((section) => [
                  section.title,
                  ...section.items,
                ]),
              ].filter(Boolean).join(' ')),
              datePublished: initialSeriesResourceDetail.contentRecord?.published_at
                || initialSeriesResourceDetail.resource.publishedAt,
              image: initialSeriesResourceDetail.contentRecord?.images[0]?.url || undefined,
              author: {
                '@type': 'Organization',
                name: initialSeriesResourceDetail.contentRecord?.author
                  || initialSeriesResourceDetail.resource.sourceLabel,
              },
              url: canonicalUrl,
              sameAs: initialSeriesResourceDetail.resource.sourceUrl,
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
  const seriesFaqEntity = seriesLandingProfile && route === `/series/${seriesLandingProfile.seriesId}`
    ? {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: seriesLandingProfile.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    : null;
  const articleFaqEntity = articleIntent
    ? {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: articleIntent.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    : null;
  const helpFaqEntity = helpProfile
    ? {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: helpTopics.map((topic) => ({
          '@type': 'Question',
          name: topic.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: topic.answer.join(' '),
          },
        })),
      }
    : helpTopic
      ? {
          '@type': 'FAQPage',
          '@id': `${canonicalUrl}#faq`,
          mainEntity: (helpArticleIntent?.faq || [{
            question: helpTopic.question,
            answer: helpTopic.answer.join(' '),
          }]).map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }
    : null;
  const faqEntity = articleFaqEntity || seriesFaqEntity || helpFaqEntity;
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
            ...(faqEntity ? { hasPart: { '@id': faqEntity['@id'] } } : {}),
          },
          ...(itemList ? [itemList] : []),
          ...(articleEntity ? [articleEntity] : []),
          ...(faqEntity ? [faqEntity] : []),
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
      {includeArticleContentStyles && <link rel="stylesheet" href="/article-content.css" />}
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
