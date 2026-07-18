import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { localizeHref } from '@/i18n/languageRouting';
import { useVersion } from '@/hooks/VersionContext';
import { normalizeStaticContentLanguage, translateStaticTexts } from '@/services/staticTranslation';
import { getSeriesProduct, type SeriesProduct } from './catalog';
import {
  getSeriesIdFromSearch,
  getSeriesModuleHref,
  getSeriesResourceHref,
  isSeriesModuleAvailable,
  isSharedSeriesModule,
  type SeriesModule,
} from './scope';
import { getVerifiedSeriesResources, getVerifiedSeriesResourceSlug } from './verifiedContent';
import { getSeriesVersionShortLabel } from './versionConfig';
import SeriesToolsWorkspace from './SeriesToolsWorkspace';
import ClassicModuleWorkspace from './ClassicModuleWorkspace';
import SeriesContentWorkspace from './SeriesContentWorkspace';

type Props = {
  module: SeriesModule;
  children: ReactNode;
};

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

function ScopedModulePage({ product, module }: { product: SeriesProduct; module: SeriesModule }) {
  const { t, i18n } = useTranslation();
  const { version } = useVersion();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const resources = getVerifiedSeriesResources(product.id, module);
  const [localizedResources, setLocalizedResources] = useState(resources);
  const moduleLabel = t(moduleLabels[module]);
  const localized = (href: string) => localizeHref(href, i18n.language, version);

  useEffect(() => {
    let active = true;
    setLocalizedResources(resources);
    const targetLanguage = normalizeStaticContentLanguage(i18n.language);
    if (targetLanguage === 'en' || resources.length === 0) return () => { active = false; };
    const sourceTexts = resources.flatMap((resource) => [resource.title, resource.description]);
    void translateStaticTexts(sourceTexts, targetLanguage, { sourceLanguage: 'en' })
      .then((translations) => {
        if (!active) return;
        setLocalizedResources(resources.map((resource, index) => ({
          ...resource,
          title: translations[index * 2] || resource.title,
          description: translations[index * 2 + 1] || resource.description,
        })));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [i18n.language, resources]);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotificationOpen(true)} unread={0} />
      <NotificationDrawer open={notificationOpen} onClose={() => setNotificationOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pb-16 pt-20 md:pt-24">
        <header className="border-b border-background-200 bg-background-50">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
            <div className="flex items-start gap-4">
              <img
                src={product.image}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg border border-background-300 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-primary-700">
                  <span>{product.name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{getSeriesVersionShortLabel(product.id, version)}</span>
                </div>
                <h1 className="mt-1 font-heading text-3xl font-semibold md:text-4xl">
                  {moduleLabel}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-600">
                  {t('series_verified_content_note')}
                </p>
              </div>
              <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xl text-primary-700 sm:flex">
                <i className={moduleIcons[module]} aria-hidden="true" />
              </span>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
          {module === 'tools' && <SeriesToolsWorkspace product={product} />}
          {module === 'checklist' && <SeriesToolsWorkspace product={product} />}
          {product.id === 'maplestory-classic' && <ClassicModuleWorkspace module={module} />}
          {product.id !== 'maplestory-classic' && <SeriesContentWorkspace product={product} module={module} />}
          {(module === 'tools' || module === 'checklist' || (
            product.id === 'maplestory-classic' && ['upcoming', 'guides', 'events', 'wiki', 'rankings'].includes(module)
          ) || (
            product.id !== 'maplestory-classic' && ['upcoming', 'guides', 'events', 'wiki', 'rankings'].includes(module)
          )
          ) && resources.length > 0 && (
            <h2 className="mb-4 mt-10 font-heading text-xl font-semibold">{t('series_verified_sources')}</h2>
          )}
          {resources.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {localizedResources.map((resource, index) => (
                <article
                  key={`${resource.sourceUrl}-${resource.title}`}
                  className="flex min-h-56 flex-col rounded-lg border border-background-300 bg-background-50 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-primary-700">
                      <i className="ri-verified-badge-line" aria-hidden="true" />
                      {resource.sourceLabel}
                    </span>
                    {resource.publishedAt && (
                      <time className="text-foreground-500" dateTime={resource.publishedAt}>{resource.publishedAt}</time>
                    )}
                  </div>
                  <h2 className="mt-4 font-heading text-xl font-semibold leading-snug">{resource.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-foreground-600">{resource.description}</p>
                  <Link
                    to={localized(getSeriesResourceHref(
                      product.id,
                      module,
                      getVerifiedSeriesResourceSlug(resources[index]),
                    ))}
                    className="mt-5 inline-flex h-9 w-fit items-center gap-1.5 rounded-md bg-primary-600 px-3 text-xs font-semibold text-background-50 hover:bg-primary-700"
                  >
                    {t('series_read_on_site')}
                    <i className="ri-arrow-right-line" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="border-l-2 border-background-300 py-2 pl-4">
              <p className="text-sm leading-6 text-foreground-600">
                {t('series_no_verified_content', { name: product.name, module: moduleLabel })}
              </p>
            </div>
          )}
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

  if (!product || product.id === 'maplestory-pc' || isSharedSeriesModule(module)) return children;
  if (unavailable) return <ScopedModulePage product={product} module="news" />;
  return <ScopedModulePage product={product} module={module} />;
}
