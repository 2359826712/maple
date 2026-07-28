import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { localizeHref } from '@/i18n/languageRouting';
import { useVersion } from '@/hooks/VersionContext';
import { getSeriesProduct, seriesProducts, type SeriesCategory } from './catalog';
import {
  getSeriesModuleFromPathSegment,
  getSeriesModuleHref,
  isSeriesModuleAvailable,
  type SeriesModule,
} from './scope';
import { getSeriesSnapshot } from '@/domain/siteSnapshot';
import { ScopedModulePage } from './SeriesModuleRoute';
import MaplerHousePage from '@/pages/mapler-house/page';
import MapsPage from '@/pages/maps/page';
import ChecklistPage from '@/pages/checklist/page';

type SeriesFilter = 'all' | SeriesCategory;

const filters: Array<{ value: SeriesFilter; labelKey: string; icon: string }> = [
  { value: 'all', labelKey: 'series_filter_all', icon: 'ri-layout-grid-line' },
  { value: 'pc', labelKey: 'series_filter_pc', icon: 'ri-computer-line' },
  { value: 'mobile', labelKey: 'series_filter_mobile', icon: 'ri-smartphone-line' },
  { value: 'platform', labelKey: 'series_filter_platform', icon: 'ri-shapes-line' },
];

const hubModules: Array<{
  module: SeriesModule;
  labelKey: string;
  description: string;
  icon: string;
}> = [
  {
    module: 'news',
    labelKey: 'nav_updates',
    description: 'Official news, patch notes, maintenance notices, developer notes, and service announcements.',
    icon: 'ri-newspaper-line',
  },
  {
    module: 'events',
    labelKey: 'nav_events',
    description: 'Current and archived event records with source links, dates, requirements, and reward context.',
    icon: 'ri-calendar-event-line',
  },
  {
    module: 'guides',
    labelKey: 'nav_guides',
    description: 'Verified guides and reference material for progression, systems, classes, and creator workflows.',
    icon: 'ri-book-open-line',
  },
  {
    module: 'wiki',
    labelKey: 'nav_wiki',
    description: 'A readable knowledge archive assembled from structured first-party and verified reference records.',
    icon: 'ri-book-2-line',
  },
  {
    module: 'tools',
    labelKey: 'nav_tools',
    description: 'Use calculators, planners, trackers, checklists, and other on-site utilities built for this series.',
    icon: 'ri-tools-line',
  },
  {
    module: 'checklist',
    labelKey: 'nav_checklist',
    description: 'Open the planning checklist that belongs to this series instead of the main MapleStory boss tracker.',
    icon: 'ri-checkbox-circle-line',
  },
  {
    module: 'maps',
    labelKey: 'nav_maps',
    description: 'Browse map, route, and world references scoped to the selected MapleStory series.',
    icon: 'ri-map-2-line',
  },
  {
    module: 'upcoming',
    labelKey: 'nav_upcoming',
    description: 'Review announced changes, roadmaps, patch previews, and maintenance information before release.',
    icon: 'ri-calendar-schedule-line',
  },
];

export default function SeriesPage({
  initialSeriesId,
  initialSeriesModule,
}: {
  initialSeriesId?: string;
  initialSeriesModule?: string;
} = {}) {
  const { t, i18n } = useTranslation();
  const { version } = useVersion();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SeriesFilter>('all');
  const params = useParams();
  const seriesId = params.seriesId || initialSeriesId;
  const seriesModule = params.seriesModule || initialSeriesModule;
  const selectedProduct = getSeriesProduct(seriesId);
  const products = useMemo(
    () => activeFilter === 'all'
      ? seriesProducts
      : seriesProducts.filter((product) => product.category === activeFilter),
    [activeFilter],
  );

  if (selectedProduct) {
    const module = getSeriesModuleFromPathSegment(seriesModule);
    if (module) {
      const availableModule = isSeriesModuleAvailable(selectedProduct.id, module) ? module : 'news';
      if (selectedProduct.id === 'maplestory-pc' && availableModule === 'tools') {
        return <MaplerHousePage />;
      }
      if (selectedProduct.id === 'maplestory-pc' && availableModule === 'checklist') {
        return <ChecklistPage />;
      }
      if (selectedProduct.id === 'maplestory-pc' && availableModule === 'maps') {
        return <MapsPage />;
      }
      return <ScopedModulePage product={selectedProduct} module={availableModule} />;
    }

    const snapshot = getSeriesSnapshot(selectedProduct.id);
    const availableModules = hubModules.filter(({ module: candidate }) => (
      isSeriesModuleAvailable(selectedProduct.id, candidate)
    ));
    return (
      <div className="min-h-screen bg-background-50 text-foreground-950">
        <Navbar onOpenNotifications={() => setNotificationOpen(true)} unread={0} />
        <NotificationDrawer open={notificationOpen} onClose={() => setNotificationOpen(false)} />

        <main id="main-content" tabIndex={-1} className="pt-20 md:pt-24">
          <header className="relative overflow-hidden bg-foreground-950 text-background-50">
            <img
              src={selectedProduct.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-45"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground-950 via-foreground-950/90 to-foreground-950/45" aria-hidden="true" />
            <div className="relative mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-200">
                MPStorys Series Hub
              </p>
              <h1 className="mt-3 max-w-4xl font-heading text-4xl font-semibold md:text-6xl">
                {selectedProduct.name} news, guides, events, wiki, and tools
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-background-100 md:text-lg">
                {t(selectedProduct.descriptionKey)} Use this hub to browse verified updates, learn the systems that
                matter, and open practical tools without losing the source trail.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={localizeHref(getSeriesModuleHref(selectedProduct.id, 'news'), i18n.language, version)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary-500 px-5 text-sm font-semibold text-foreground-950 hover:bg-primary-400"
                >
                  Browse latest updates
                  <i className="ri-arrow-right-line" aria-hidden="true" />
                </Link>
                <Link
                  to={localizeHref(getSeriesModuleHref(selectedProduct.id, 'tools'), i18n.language, version)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-background-50/30 bg-background-50/10 px-5 text-sm font-semibold text-background-50 hover:bg-background-50/20"
                >
                  Use {selectedProduct.name} tools
                </Link>
              </div>
            </div>
          </header>

          <section className="border-b border-background-200 bg-background-100">
            <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 md:grid-cols-4 md:px-8">
              {[
                ['Structured content', snapshot.content.toLocaleString('en-US')],
                ['Verified resources', snapshot.resources.toLocaleString('en-US')],
                ['Product status', t(selectedProduct.statusKey)],
                ['Platform', t(selectedProduct.platformKey)],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-background-200 px-3 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-500">{label}</dt>
                  <dd className="mt-1 font-heading text-xl font-semibold text-foreground-950">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16" aria-labelledby="series-hub-modules">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Explore the archive</p>
              <h2 id="series-hub-modules" className="mt-2 font-heading text-3xl font-semibold md:text-4xl">
                Choose what you need for {selectedProduct.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground-600 md:text-base">
                Each section is a server-rendered destination with its own focused copy, verified records, internal
                navigation, and direct access to the underlying source.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {availableModules.map((item) => (
                <article key={item.module} className="flex min-h-64 flex-col rounded-xl border border-background-300 bg-background-50 p-6 shadow-sm">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100 text-xl text-primary-700">
                    <i className={item.icon} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-heading text-xl font-semibold">{selectedProduct.name} {t(item.labelKey)}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-foreground-600">{item.description}</p>
                  <Link
                    to={localizeHref(getSeriesModuleHref(selectedProduct.id, item.module), i18n.language, version)}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800"
                  >
                    Open {t(item.labelKey)}
                    <i className="ri-arrow-right-line" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="border-y border-background-200 bg-background-100">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
              {[
                ['Source-backed', 'Every indexed record retains a canonical source link and verification metadata.'],
                ['Useful on arrival', 'Tools and checklists run on MPStorys; indexed calculators open as native detail experiences.'],
                ['Translation-safe', 'Published translations are preferred, while missing fields fall back to the original content.'],
              ].map(([title, description]) => (
                <div key={title}>
                  <h2 className="font-heading text-xl font-semibold">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-foreground-600">{description}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotificationOpen(true)} unread={0} />
      <NotificationDrawer open={notificationOpen} onClose={() => setNotificationOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-20">
        <>
        <section className="relative min-h-[20rem] overflow-hidden bg-foreground-950 md:min-h-[23rem]">
          <img
            src="/launch-assets/og-style-new/mpstorys-ai-maple-town-banner.webp"
            alt="Maple World town"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground-950/60" />
          <div className="relative mx-auto flex min-h-[20rem] max-w-6xl flex-col justify-center px-4 py-14 text-background-50 md:min-h-[23rem] md:px-8">
            <p className="text-xs font-semibold uppercase text-primary-300">{t('series_eyebrow')}</p>
            <h1 className="mt-3 max-w-3xl font-heading text-4xl font-semibold md:text-6xl">MapleStory Series</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-background-100 md:text-lg">
              {t('series_desc')}
            </p>
          </div>
        </section>

        <section className="border-b border-background-200 bg-background-100">
          <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
            <div className="flex gap-1 overflow-x-auto" role="group" aria-label={t('series_filter_label')}>
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  aria-pressed={activeFilter === filter.value}
                  className={`flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors ${
                    activeFilter === filter.value
                      ? 'bg-foreground-950 text-background-50'
                      : 'text-foreground-700 hover:bg-background-200'
                  }`}
                >
                  <i className={filter.icon} aria-hidden="true" />
                  {t(filter.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
          <div className="mb-7">
            <h2 className="font-heading text-2xl font-semibold text-foreground-950 md:text-3xl">{t('series_catalog_title')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-600">{t('series_catalog_desc')}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-lg border border-background-300 bg-background-50">
                <div className="relative aspect-[16/9] overflow-hidden bg-background-200">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute left-3 top-3 rounded-md bg-foreground-950/90 px-2 py-1 text-xs font-semibold text-background-50">
                    {t(product.statusKey)}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-xl font-semibold text-foreground-950">{product.name}</h3>
                    <span className="shrink-0 text-xs font-semibold text-primary-700">{t(product.platformKey)}</span>
                  </div>
                  <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-foreground-600">{t(product.descriptionKey)}</p>
                  <div className="mt-5">
                    <Link
                      to={localizeHref(`/series/${product.id}`, i18n.language, version)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary-600 px-3 text-xs font-semibold text-background-50 hover:bg-primary-700"
                    >
                      {t('series_enter_hub')}
                      <i className="ri-arrow-right-line" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-background-200 bg-background-100">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
            {[
              ['ri-global-line', 'series_scope_regions_title', 'series_scope_regions_desc'],
              ['ri-rss-line', 'series_scope_sources_title', 'series_scope_sources_desc'],
              ['ri-translate-2', 'series_scope_language_title', 'series_scope_language_desc'],
            ].map(([icon, titleKey, descriptionKey]) => (
              <div key={titleKey}>
                <i className={`${icon} text-2xl text-primary-600`} aria-hidden="true" />
                <h2 className="mt-3 font-heading text-lg font-semibold text-foreground-950">{t(titleKey)}</h2>
                <p className="mt-2 text-sm leading-6 text-foreground-600">{t(descriptionKey)}</p>
              </div>
            ))}
          </div>
        </section>
        </>
      </main>

      <Footer />
    </div>
  );
}
