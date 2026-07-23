import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import InternalRedirect from '@/components/feature/InternalRedirect';
import { localizeHref, normalizeLanguage } from '@/i18n/languageRouting';
import { useVersion } from '@/hooks/VersionContext';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import { normalizeStaticContentLanguage, translateStaticTexts } from '@/services/staticTranslation';
import { getSeriesProduct } from './catalog';
import type { IndexedContentRecord } from '@/domain/contentIndex';
import type { ContentSection } from './indexedContentDetail';
import {
  getSeriesIdFromSearch,
  getSeriesModuleHref,
  getSeriesResourceHref,
  isSeriesModule,
  isSharedSeriesModule,
  type SeriesModule,
} from './scope';
import type { VerifiedSeriesResource } from './verifiedContent';
import { getSeriesVersionShortLabel } from './versionConfig';
import { getArticleSearchIntentProfile } from './articleSearchIntent';

const moduleLabels: Record<SeriesModule, string> = {
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

const relatedModules: SeriesModule[] = ['news', 'upcoming', 'guides', 'events', 'tools', 'wiki'];
const emptyContentSections: ContentSection[] = [];

export type SeriesResourceDetailData = {
  contentModule?: string;
  contentRecord?: IndexedContentRecord;
  contentSections: ContentSection[];
  hasStructuredContent: boolean;
  resource?: VerifiedSeriesResource;
  resourceSlug?: string;
};

export default function SeriesResourceDetailPage({
  initialContentModule,
  initialDetail,
  initialSlug,
}: {
  initialContentModule?: string;
  initialDetail?: SeriesResourceDetailData;
  initialSlug?: string;
} = {}) {
  const params = useParams();
  const contentModule = params.contentModule || initialContentModule;
  const slug = params.slug || initialSlug;
  const { search } = useLocation();
  const { t, i18n } = useTranslation();
  const { version } = useVersion();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const seriesId = getSeriesIdFromSearch(search);
  const product = getSeriesProduct(seriesId);
  const module = isSeriesModule(contentModule) ? contentModule : undefined;
  const [detail, setDetail] = useState<SeriesResourceDetailData | undefined>(initialDetail);
  const [resolving, setResolving] = useState(!initialDetail && Boolean(product && module && slug));
  const resource = detail?.resource;
  const contentRecord = detail?.contentRecord;
  const contentSections = detail?.contentSections || emptyContentSections;
  const hasStructuredContent = detail?.hasStructuredContent || false;
  const [localizedText, setLocalizedText] = useState<Record<string, string>>({});
  const localized = (href: string) => localizeHref(href, i18n.language, version);

  useEffect(() => {
    const decodedSlug = slug ? decodeURIComponent(slug) : '';
    if (!product || !module || !decodedSlug) {
      setDetail(undefined);
      setResolving(false);
      return undefined;
    }
    if (
      initialDetail
      && initialDetail.contentModule === module
      && initialDetail.resourceSlug === decodedSlug
    ) {
      setDetail(initialDetail);
      setResolving(false);
      return undefined;
    }

    let active = true;
    setResolving(true);
    void Promise.all([
      import('./verifiedContent'),
      import('./indexedContentDetail'),
    ]).then(([verifiedContent, indexedContent]) => {
      if (!active) return;
      const nextResource = verifiedContent.getVerifiedSeriesResource(product.id, module, decodedSlug);
      const nextRecord = indexedContent.findIndexedContent(
        nextResource?.contentId,
        nextResource?.resourceId,
        nextResource?.sourceUrl,
      );
      const structuredSections = indexedContent.getIndexedContentSections(nextRecord);
      const resourceSections = indexedContent.getIndexedResourceSections(nextResource?.resourceRecord);
      setDetail({
        contentModule: module,
        contentRecord: nextRecord,
        contentSections: structuredSections.length > 0
          ? structuredSections
          : resourceSections.length > 0
            ? resourceSections
            : indexedContent.getSourceOverviewSections(nextResource),
        hasStructuredContent: structuredSections.length > 0,
        resource: nextResource,
        resourceSlug: decodedSlug,
      });
    }).finally(() => {
      if (active) setResolving(false);
    });
    return () => { active = false; };
  }, [initialDetail, module, product, slug]);

  useEffect(() => {
    let active = true;
    setLocalizedText({});
    if (!resource) return () => { active = false; };
    const targetLanguage = normalizeStaticContentLanguage(i18n.language);
    if (targetLanguage === 'en') return () => { active = false; };
    const sourceTexts = [...new Set([
      contentRecord?.title || resource.title,
      contentRecord?.summary || resource.description,
      ...contentSections.flatMap((section) => [section.title, ...section.items]),
    ])];
    void translateStaticTexts(sourceTexts, targetLanguage, { sourceLanguage: 'en' })
      .then((translations) => {
        if (!active) return;
        setLocalizedText(Object.fromEntries(sourceTexts.map((text, index) => [text, translations[index] || text])));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [contentRecord, contentSections, i18n.language, resource]);

  const translateContent = (value: string) => localizedText[value] || value;
  const copy = {
    title: translateContent(contentRecord?.title || resource?.title || ''),
    description: translateContent(contentRecord?.summary || resource?.description || ''),
  };
  const articleIntent = getArticleSearchIntentProfile(
    { contentId: contentRecord?.id, sourceUrl: resource?.sourceUrl },
    normalizeLanguage(i18n.language),
  );
  const publishedAt = contentRecord?.published_at || resource?.publishedAt;

  usePageMetadata(
    articleIntent?.title || copy.title || t('series_content_not_found'),
    articleIntent?.description || copy.description || t('series_verified_content_note'),
    {
      canonicalPath: product && module && resource
        ? localized(getSeriesResourceHref(product.id, module, detail?.resourceSlug || decodeURIComponent(slug || '')))
        : undefined,
      datePublished: publishedAt,
      includeAlternates: false,
      noIndex: !resource,
      type: resource ? 'article' : 'website',
    },
  );

  if (module && isSharedSeriesModule(module)) {
    return (
      <InternalRedirect
        to={localized(getSeriesModuleHref(seriesId || 'maplestory-pc', module))}
        label={t('series_back_to_module', { module: t(moduleLabels[module]) })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotificationOpen(true)} unread={0} />
      <NotificationDrawer open={notificationOpen} onClose={() => setNotificationOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pb-16 pt-20 md:pt-24">
        {resolving ? (
          <section className="mx-auto max-w-4xl px-4 py-16 text-center md:px-8" role="status">
            <span className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-background-300 border-t-primary-600" aria-hidden="true" />
            <p className="mt-4 text-sm text-foreground-600">{t('wiki_article_loading')}</p>
          </section>
        ) : !product || !module || !resource ? (
          <section className="mx-auto max-w-4xl px-4 py-16 text-center md:px-8">
            <i className="ri-file-warning-line text-4xl text-primary-700" aria-hidden="true" />
            <h1 className="mt-5 font-heading text-3xl font-semibold">{t('series_content_not_found')}</h1>
            <Link to={localized('/')} className="mt-6 inline-flex text-sm font-semibold text-primary-700 hover:text-primary-800">
              {t('not_found_back_home')}
            </Link>
          </section>
        ) : (
          <article>
            <header className="border-b border-background-200 bg-background-100">
              <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
                <Link
                  to={localized(getSeriesModuleHref(product.id, module))}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800"
                >
                  <i className="ri-arrow-left-line" aria-hidden="true" />
                  {t('series_back_to_module', { module: t(moduleLabels[module]) })}
                </Link>
                <div className="mt-7 flex items-center gap-3 text-xs font-semibold uppercase text-foreground-600">
                  <img src={product.image} alt="" className="h-9 w-9 rounded-md object-cover" />
                  <span>{product.name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{getSeriesVersionShortLabel(product.id, version)}</span>
                </div>
                <h1 className="mt-4 max-w-3xl font-heading text-3xl font-semibold leading-tight md:text-5xl">
                  {copy.title}
                </h1>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-foreground-500">
                  <span className="inline-flex items-center gap-1 font-semibold text-primary-700">
                    <i className="ri-verified-badge-line" aria-hidden="true" />
                    {t('series_verified_by_source', { source: resource.sourceLabel })}
                  </span>
                  {publishedAt && <time dateTime={publishedAt}>{publishedAt.slice(0, 10)}</time>}
                  {contentRecord?.updated_at && contentRecord.updated_at !== publishedAt && (
                    <time dateTime={contentRecord.updated_at}>{t('series_content_updated')} {contentRecord.updated_at.slice(0, 10)}</time>
                  )}
                </div>
              </div>
            </header>

            <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
              <section aria-labelledby="resource-summary-heading">
                <h2 id="resource-summary-heading" className="font-heading text-2xl font-semibold">
                  {t('series_content_summary')}
                </h2>
                <p className="mt-4 text-base leading-8 text-foreground-700">{copy.description}</p>
              </section>

              {articleIntent && (
                <section
                  className="mt-12 overflow-hidden rounded-xl border border-background-300 bg-background-50 shadow-sm"
                  aria-labelledby="article-search-intent-heading"
                  data-testid="article-search-intent"
                >
                  <div className="border-b border-background-250 bg-foreground-950 px-5 py-7 text-background-50 md:px-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-300">
                      {articleIntent.eyebrow}
                    </p>
                    <h2 id="article-search-intent-heading" className="mt-2 max-w-3xl font-heading text-2xl font-semibold leading-tight md:text-3xl">
                      {articleIntent.title}
                    </h2>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-background-200">
                      {articleIntent.description}
                    </p>
                  </div>
                  <div className="divide-y divide-background-250 px-5 md:px-8">
                    {articleIntent.sections.map((section) => (
                      <section key={section.title} className="py-7">
                        <h3 className="font-heading text-xl font-semibold text-foreground-950">{section.title}</h3>
                        <div className="mt-4 space-y-4 text-sm leading-7 text-foreground-700">
                          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                        </div>
                      </section>
                    ))}
                  </div>
                  <div className="border-t border-background-250 bg-background-100 px-5 py-7 md:px-8">
                    <div className="divide-y divide-background-300 border-y border-background-300">
                      {articleIntent.faq.map((item) => (
                        <details key={item.question} className="group py-4">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground-900">
                            <span>{item.question}</span>
                            <i className="ri-add-line text-lg text-primary-700 transition-transform group-open:rotate-45" aria-hidden="true" />
                          </summary>
                          <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-650">{item.answer}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {contentSections.length > 0 && (
                <section className="mt-12 border-t border-background-300 pt-8" aria-labelledby="resource-details-heading">
                  <div className="flex items-center gap-3">
                    <i className="ri-article-line text-2xl text-primary-700" aria-hidden="true" />
                    <h2 id="resource-details-heading" className="font-heading text-2xl font-semibold">
                      {t(hasStructuredContent ? 'series_content_details' : 'series_resource_details')}
                    </h2>
                  </div>
                  <div className="mt-7 divide-y divide-background-300 border-y border-background-300">
                    {contentSections.map((section) => (
                      <section key={`${section.title}-${section.items[0]}`} className="py-7">
                        <h3 className="font-heading text-xl font-semibold">{translateContent(section.title)}</h3>
                        <ul className="mt-4 space-y-3 text-sm leading-7 text-foreground-700">
                          {section.items.map((item) => (
                            <li key={item} className="flex gap-3">
                              <i className="ri-checkbox-circle-line mt-1 text-base text-primary-700" aria-hidden="true" />
                              <span>{translateContent(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-12 border-t border-background-300 pt-8" aria-labelledby="resource-scope-heading">
                <h2 id="resource-scope-heading" className="font-heading text-2xl font-semibold">
                  {t('series_content_scope')}
                </h2>
                <p className="mt-4 text-sm leading-7 text-foreground-600">
                  {t('series_content_scope_body', {
                    name: product.name,
                    module: t(moduleLabels[module]),
                  })}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {relatedModules.filter((item) => item !== module).map((item) => (
                    <Link
                      key={item}
                      to={localized(getSeriesModuleHref(product.id, item))}
                      className="inline-flex h-9 items-center rounded-md border border-background-300 px-3 text-xs font-semibold text-foreground-700 hover:border-primary-400 hover:text-primary-700"
                    >
                      {t(moduleLabels[item])}
                    </Link>
                  ))}
                </div>
              </section>

              <section className="mt-12 border-l-2 border-primary-500 pl-5" aria-labelledby="resource-source-heading">
                <h2 id="resource-source-heading" className="font-heading text-xl font-semibold">
                  {t('series_source_and_verification')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-foreground-600">{t('series_source_explanation')}</p>
                <a
                  href={resource.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800"
                >
                  {resource.sourceLabel}
                  <i className="ri-external-link-line" aria-hidden="true" />
                </a>
                {contentRecord && contentRecord.related_urls.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                    {contentRecord.related_urls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800"
                      >
                        {new URL(url).hostname.replace(/^www\./, '')}
                        <i className="ri-external-link-line" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
