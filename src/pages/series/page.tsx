import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import InternalRedirect from '@/components/feature/InternalRedirect';
import { localizeHref } from '@/i18n/languageRouting';
import { useVersion } from '@/hooks/VersionContext';
import { getSeriesProduct, seriesProducts, type SeriesCategory } from './catalog';
import { getSeriesModuleHref, isSeriesModule } from './scope';

type SeriesFilter = 'all' | SeriesCategory;

const filters: Array<{ value: SeriesFilter; labelKey: string; icon: string }> = [
  { value: 'all', labelKey: 'series_filter_all', icon: 'ri-layout-grid-line' },
  { value: 'pc', labelKey: 'series_filter_pc', icon: 'ri-computer-line' },
  { value: 'mobile', labelKey: 'series_filter_mobile', icon: 'ri-smartphone-line' },
  { value: 'platform', labelKey: 'series_filter_platform', icon: 'ri-shapes-line' },
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
    const module = isSeriesModule(seriesModule) ? seriesModule : 'news';
    return (
      <InternalRedirect
        to={localizeHref(getSeriesModuleHref(selectedProduct.id, module), i18n.language, version)}
        label={selectedProduct.name}
      />
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
