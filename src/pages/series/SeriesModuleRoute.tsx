import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { localizeHref } from '@/i18n/languageRouting';
import { useVersion } from '@/hooks/VersionContext';
import { normalizeStaticContentLanguage } from '@/services/staticTranslation';
import {
  fetchPublishedSeriesTranslations,
  type PublishedSeriesTranslation,
} from '@/services/publishedSeriesContent';
import { useServerRouteData } from '@/next/ServerRouteDataContext';
import { getSeriesProduct, type SeriesProduct } from './catalog';
import {
  getSeriesIdFromSearch,
  getSeriesModuleHref,
  getSeriesResourceHref,
  isSeriesModuleAvailable,
  isSharedSeriesModule,
  type SeriesModule,
} from './scope';
import {
  getSeriesModuleArtwork,
  getVerifiedSeriesResources,
  getVerifiedSeriesResourceSlug,
} from './verifiedContent';
import { getSeriesVersionShortLabel } from './versionConfig';
import SeriesToolsWorkspace from './SeriesToolsWorkspace';
import ClassicModuleWorkspace from './ClassicModuleWorkspace';
import SeriesContentWorkspace from './SeriesContentWorkspace';
import CommunitySelector from '@/pages/community/CommunitySelector';
import { hasResourceDetailExperience } from './resourceToolRegistry';
import { useSeriesToolMenu } from './useSeriesToolMenu';
import type { VerifiedSeriesResource } from './verifiedContent';

type Props = {
  module: SeriesModule;
  children: ReactNode;
};

const moduleLabels: Record<SeriesModule, string> = {
  news: 'nav_updates',
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

const moduleIcons: Record<SeriesModule, string> = {
  news: 'ri-newspaper-line',
  upcoming: 'ri-calendar-schedule-line',
  guides: 'ri-book-open-line',
  events: 'ri-calendar-event-line',
  tools: 'ri-tools-line',
  checklist: 'ri-checkbox-circle-line',
  wiki: 'ri-book-2-line',
  rankings: 'ri-bar-chart-box-line',
  shop: 'ri-shopping-bag-3-line',
  community: 'ri-group-line',
  feedback: 'ri-feedback-line',
};

const applySeriesTranslations = (
  resources: VerifiedSeriesResource[],
  translations: Record<string, PublishedSeriesTranslation>,
) => resources.map((resource) => {
  const translation = resource.contentId ? translations[resource.contentId] : undefined;
  return translation
    ? {
        ...resource,
        title: translation.title || resource.title,
        description: translation.summary || resource.description,
      }
    : resource;
});

export function ScopedModulePage({ product, module }: { product: SeriesProduct; module: SeriesModule }) {
  const { t, i18n } = useTranslation();
  const { version } = useVersion();
  const { initialSeriesTranslations } = useServerRouteData();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const resources = getVerifiedSeriesResources(product.id, module);
  const readableResources = useMemo(
    () => resources.filter((resource) => (
      Boolean(resource.contentId) || hasResourceDetailExperience(resource)
    )),
    [resources],
  );
  const [visibleCount, setVisibleCount] = useState(18);
  const [resourceQuery, setResourceQuery] = useState('');
  const seriesToolMenu = useSeriesToolMenu(product.id, undefined, module === 'tools');
  const filteredResources = useMemo(() => {
    const query = resourceQuery.trim().toLocaleLowerCase(i18n.language);
    if (!query) return readableResources;
    return readableResources.filter((resource) => (
      [
        resource.title,
        resource.description,
        resource.sourceLabel,
        resource.category,
        resource.publishedAt,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase(i18n.language).includes(query))
    ));
  }, [i18n.language, readableResources, resourceQuery]);
  const visibleResources = useMemo(
    () => filteredResources.slice(0, visibleCount),
    [filteredResources, visibleCount],
  );
  const [localizedResources, setLocalizedResources] = useState(() => (
    applySeriesTranslations(visibleResources, initialSeriesTranslations)
  ));
  const moduleLabel = t(moduleLabels[module]);
  const moduleArtwork = getSeriesModuleArtwork(product.id, module, product.image);
  const localized = (href: string) => localizeHref(href, i18n.language, version);
  const contentArchiveModules: SeriesModule[] = ['news', 'upcoming', 'guides', 'events', 'shop'];
  const useDynamicContentArchive = (
    contentArchiveModules.includes(module)
    && readableResources.some((resource) => Boolean(resource.contentId))
  );
  const archiveTitle = module === 'news'
    ? `Latest ${product.name} updates`
    : `${product.name} ${moduleLabel}`;
  const workspace = (
    <>
      {module === 'tools' && <SeriesToolsWorkspace product={product} />}
      {module === 'checklist' && <SeriesToolsWorkspace product={product} />}
      {product.id === 'maplestory-classic' && !useDynamicContentArchive && (
        <ClassicModuleWorkspace module={module} />
      )}
      {product.id !== 'maplestory-classic' && !useDynamicContentArchive && (
        <SeriesContentWorkspace product={product} module={module} />
      )}
    </>
  );
  const communitySelector = module === 'community' && resources.length > 0 ? (
    <CommunitySelector
      seriesId={product.id}
      destinations={resources}
      fallbackImage={moduleArtwork}
      localizeHref={localized}
    />
  ) : null;
  const workspaceFirst = true;
  const moduleDestinations = ([
    ['news', 'nav_updates', 'ri-newspaper-line'],
    ['events', 'nav_events', 'ri-calendar-event-line'],
    ['guides', 'nav_guides', 'ri-book-open-line'],
    ['wiki', 'nav_wiki', 'ri-book-2-line'],
    ['tools', 'nav_tools', 'ri-tools-line'],
    ['upcoming', 'nav_upcoming', 'ri-calendar-schedule-line'],
  ] as const).filter(([destination]) => isSeriesModuleAvailable(product.id, destination));

  useEffect(() => {
    setVisibleCount(18);
    setResourceQuery('');
  }, [module, product.id]);

  useEffect(() => {
    setVisibleCount(18);
  }, [resourceQuery]);

  useEffect(() => {
    let active = true;
    setLocalizedResources(applySeriesTranslations(visibleResources, initialSeriesTranslations));
    const targetLanguage = normalizeStaticContentLanguage(i18n.language);
    if (visibleResources.length === 0) return () => { active = false; };
    const contentIds = visibleResources.flatMap((resource) => resource.contentId ? [resource.contentId] : []);
    void fetchPublishedSeriesTranslations(contentIds, targetLanguage)
      .then((translations) => {
        if (!active) return;
        setLocalizedResources(applySeriesTranslations(visibleResources, {
          ...initialSeriesTranslations,
          ...translations,
        }));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [i18n.language, initialSeriesTranslations, visibleResources]);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar
        onOpenNotifications={() => setNotificationOpen(true)}
        unread={0}
        toolMenu={seriesToolMenu}
      />
      <NotificationDrawer open={notificationOpen} onClose={() => setNotificationOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pb-16 pt-20 md:pt-24">
        <header className="relative overflow-hidden border-b border-background-200 bg-foreground-950 text-background-50">
          <img
            src={moduleArtwork}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground-950 via-foreground-950/85 to-foreground-950/45" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
            <div className="flex items-start gap-4">
              <img
                src={product.image}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl border border-background-50/25 object-cover shadow-lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary-200">
                  <span>{product.name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{getSeriesVersionShortLabel(product.id, version)}</span>
                </div>
                <h1 className="mt-2 max-w-4xl font-heading text-4xl font-semibold md:text-6xl">
                  {product.name} {moduleLabel}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-background-100 md:text-base">
                  {t('series_scoped_module_desc', {
                    name: product.name,
                    module: moduleLabel,
                    summary: t(product.descriptionKey),
                  })}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-3 overflow-hidden rounded-xl border border-background-50/20 bg-foreground-950/55 shadow-2xl backdrop-blur-md lg:grid-cols-1">
              {[
                [readableResources.length.toLocaleString('en-US'), `${moduleLabel} records`],
                [resources.length.toLocaleString('en-US'), 'Verified sources'],
                [new Set(readableResources.map((resource) => resource.category).filter(Boolean)).size.toLocaleString('en-US'), 'Content types'],
              ].map(([value, label]) => (
                <div key={label} className="border-r border-background-50/15 px-4 py-4 last:border-r-0 lg:border-b lg:border-r-0 lg:last:border-b-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-background-200">{label}</dt>
                  <dd className="mt-1 font-heading text-2xl font-semibold text-primary-200">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <section className="border-b border-background-200 bg-background-100">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Series knowledge center</p>
                <h2 className="mt-2 max-w-3xl font-heading text-2xl font-semibold md:text-4xl">
                  Everything currently organized for {product.name} {moduleLabel}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-600">
                  Browse the verified {product.name} {moduleLabel.toLocaleLowerCase(i18n.language)} archive, compare
                  official notices by date, and open each complete record directly on MPStorys.
                </p>
              </div>
              <div className="rounded-xl border border-background-300 bg-background-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-500">Current coverage</p>
                <p className="mt-2 text-sm leading-6 text-foreground-700">
                  This page contains <strong>{readableResources.length}</strong> readable
                  {readableResources.length === 1 ? ' record' : ' records'} drawn only from the{' '}
                  <strong>{moduleLabel}</strong> module. Content from Guides, Wiki, Tools, or Events is not mixed into
                  this archive.
                </p>
              </div>
            </div>
            <nav className="mt-7 flex gap-2 overflow-x-auto pb-1" aria-label={`${product.name} sections`}>
              {moduleDestinations.map(([destination, labelKey, icon]) => (
                <Link
                  key={destination}
                  to={localized(getSeriesModuleHref(product.id, destination))}
                  aria-current={destination === module ? 'page' : undefined}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold ${
                    destination === module
                      ? 'border-foreground-950 bg-foreground-950 text-background-50'
                      : 'border-background-300 bg-background-50 text-foreground-700 hover:border-primary-400 hover:text-primary-700'
                  }`}
                >
                  <i className={icon} aria-hidden="true" />
                  {t(labelKey)}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
          {communitySelector}
          {workspaceFirst && !useDynamicContentArchive && workspace}
          {readableResources.length > 0 && (
            <div className={workspaceFirst && !useDynamicContentArchive ? 'mb-5 mt-10' : 'mb-5'}>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                    {product.name} · {moduleLabel}
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold">
                    {useDynamicContentArchive ? archiveTitle : t('series_verified_sources')}
                  </h2>
                  {useDynamicContentArchive && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-600">
                      Automatically ordered from verified records that belong to this series and this module.
                    </p>
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground-500">
                  {t('series_archive_showing', {
                    visible: Math.min(visibleCount, filteredResources.length),
                    total: filteredResources.length,
                  })}
                </p>
              </div>
              {readableResources.length > 6 && (
                <label className="relative mt-5 block max-w-xl">
                  <span className="sr-only">{t('series_archive_search')}</span>
                  <i
                    className="ri-search-line pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-500"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={resourceQuery}
                    onChange={(event) => setResourceQuery(event.target.value)}
                    placeholder={t('series_archive_search_placeholder', { module: moduleLabel })}
                    className="h-11 w-full rounded-lg border border-background-300 bg-background-50 pl-10 pr-4 text-sm text-foreground-900 outline-none transition placeholder:text-foreground-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  />
                </label>
              )}
            </div>
          )}
          {readableResources.length > 0 ? (
            <>
              {filteredResources.length > 0 ? (
                <div className={`grid gap-5 ${
                  filteredResources.length === 1
                    ? 'max-w-4xl'
                    : 'md:grid-cols-2 xl:grid-cols-3'
                }`}>
                {localizedResources.map((resource) => (
                  <article
                    key={`${resource.sourceUrl}-${resource.title}`}
                    className="group flex min-h-56 flex-col overflow-hidden rounded-xl border border-background-300 bg-background-50 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/7] overflow-hidden bg-background-200">
                      <img
                        src={resource.imageUrl || moduleArtwork}
                        alt={resource.imageAlt || `${resource.title} · ${product.name}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-foreground-950/55 to-transparent" aria-hidden="true" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-primary-700">
                          <i className="ri-verified-badge-line" aria-hidden="true" />
                          {resource.sourceLabel}
                        </span>
                        {resource.publishedAt && (
                          <time className="text-foreground-500" dateTime={resource.publishedAt}>{resource.publishedAt.slice(0, 10)}</time>
                        )}
                      </div>
                      <h3 className="mt-4 font-heading text-xl font-semibold leading-snug">{resource.title}</h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-foreground-600">{resource.description}</p>
                      <Link
                        to={localized(getSeriesResourceHref(
                          product.id,
                          module,
                          getVerifiedSeriesResourceSlug(resource),
                        ))}
                        className="mt-5 inline-flex h-9 w-fit items-center gap-1.5 rounded-md bg-primary-600 px-3 text-xs font-semibold text-background-50 hover:bg-primary-700"
                      >
                        {t(
                          hasResourceDetailExperience(resource)
                            ? 'series_use_on_site'
                            : resource.contentId
                              ? 'series_read_on_site'
                              : 'series_view_details_on_site',
                        )}
                        <i className="ri-arrow-right-line" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-background-300 bg-background-100 px-5 py-10 text-center">
                  <i className="ri-search-eye-line text-2xl text-foreground-400" aria-hidden="true" />
                  <p className="mt-2 text-sm text-foreground-600">{t('series_archive_no_results')}</p>
                </div>
              )}
              {visibleCount < filteredResources.length && (
                <div className="mt-7 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => Math.min(count + 18, filteredResources.length))}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-background-300 bg-background-50 px-4 text-sm font-semibold text-foreground-700 hover:border-primary-400 hover:text-primary-700"
                  >
                    {t('series_archive_show_more', { count: Math.min(18, filteredResources.length - visibleCount) })}
                    <i className="ri-arrow-down-line" aria-hidden="true" />
                  </button>
                </div>
              )}
            </>
          ) : !workspaceFirst ? (
            <div className="border-l-2 border-background-300 py-2 pl-4">
              <p className="text-sm leading-6 text-foreground-600">
                {t('series_no_verified_content', { name: product.name, module: moduleLabel })}
              </p>
            </div>
          ) : null}
          {!workspaceFirst && <div className={readableResources.length > 0 ? 'mt-12' : ''}>{workspace}</div>}

        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function SeriesModuleRoute({ module, children }: Props) {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { version } = useVersion();
  const product = getSeriesProduct(getSeriesIdFromSearch(search));
  const unavailable = Boolean(product && product.id !== 'maplestory-pc' && !isSeriesModuleAvailable(product.id, module));

  useEffect(() => {
    if (!product || !unavailable) return;
    navigate(localizeHref(getSeriesModuleHref(product.id, 'news'), i18n.language, version), { replace: true });
  }, [i18n.language, navigate, product, unavailable, version]);

  const hasScopedResources = Boolean(product && getVerifiedSeriesResources(product.id, module).length > 0);
  if (
    !product
    || product.id === 'maplestory-pc'
    || (isSharedSeriesModule(module) && module !== 'shop' && !hasScopedResources)
  ) return children;
  if (unavailable) return <ScopedModulePage product={product} module="news" />;
  return <ScopedModulePage product={product} module={module} />;
}
