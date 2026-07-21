import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { localizeHref } from '@/i18n/languageRouting';
import { seriesProducts } from '@/pages/series/catalog';
import { getSeriesModuleHref } from '@/pages/series/scope';

const proofPoints = [
  {
    icon: 'ri-shield-check-line',
    titleKey: 'series_scope_sources_title',
    descriptionKey: 'series_scope_sources_desc',
  },
  {
    icon: 'ri-global-line',
    titleKey: 'series_scope_regions_title',
    descriptionKey: 'series_scope_regions_desc',
  },
  {
    icon: 'ri-translate-2',
    titleKey: 'series_scope_language_title',
    descriptionKey: 'series_scope_language_desc',
  },
] as const;

const contentPaths = [
  { href: '/news', icon: 'ri-newspaper-line', titleKey: 'nav_news', descriptionKey: 'news_page_desc' },
  { href: '/guides', icon: 'ri-compass-3-line', titleKey: 'nav_guides', descriptionKey: 'guides_desc' },
  { href: '/mapler-house', icon: 'ri-tools-line', titleKey: 'nav_tools', descriptionKey: 'tools_desc' },
  { href: '/events', icon: 'ri-calendar-event-line', titleKey: 'nav_events', descriptionKey: 'events_news_fallback_desc' },
] as const;

const trackLandingConversion = (action: string, destination: string) => {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', 'landing_cta_click', {
    action,
    destination,
  });
};

export default function HomeSeriesGateway() {
  const { t, i18n } = useTranslation();
  const { version } = useVersion();
  const featuredSeries = seriesProducts[0];
  const localized = (href: string) => localizeHref(href, i18n.language, version);

  return (
    <div className="overflow-hidden bg-background-50 pt-20">
      <section className="relative isolate border-b border-background-200">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_10%,oklch(var(--primary-100)),transparent_32%),radial-gradient(circle_at_85%_25%,oklch(var(--accent-100)),transparent_30%),linear-gradient(to_bottom,oklch(var(--background-50)),oklch(var(--background-100)))]" />
        <div className="absolute -left-28 top-24 -z-10 h-72 w-72 rounded-full border-[48px] border-primary-200/30" aria-hidden="true" />
        <div className="absolute -right-36 bottom-0 -z-10 h-80 w-80 rounded-full bg-secondary-200/30 blur-3xl" aria-hidden="true" />

        <div className="mx-auto grid max-w-[90rem] items-center gap-10 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.88fr)] lg:gap-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-background-50/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary-700 shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
              </span>
              {t('landing_eyebrow')}
            </div>

            <h1 className="mt-6 max-w-4xl font-heading text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-foreground-950 sm:text-6xl lg:text-7xl">
              {t('landing_title_line1')}
              <span className="sr-only"> — </span>
              <span className="mt-2 block bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 bg-clip-text text-transparent">
                {t('landing_title_line2')}
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground-700 sm:text-xl">
              {t('landing_subtitle')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#choose-your-series"
                data-conversion-id="hero-series-selector"
                onClick={() => trackLandingConversion('hero_series_selector', '#choose-your-series')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-foreground-950 px-6 text-sm font-bold text-background-50 shadow-lg shadow-foreground-950/15 transition hover:-translate-y-0.5 hover:bg-primary-600"
              >
                {t('landing_primary_cta')}
                <i className="ri-arrow-down-line" aria-hidden="true" />
              </a>
              <Link
                to={localized('/news')}
                data-conversion-id="hero-latest-updates"
                onClick={() => trackLandingConversion('hero_latest_updates', '/news')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-background-300 bg-background-50/90 px-6 text-sm font-bold text-foreground-900 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-primary-300 hover:text-primary-700"
              >
                <i className="ri-flashlight-line text-primary-600" aria-hidden="true" />
                {t('landing_secondary_cta')}
              </Link>
            </div>

            <dl className="mt-10 grid max-w-2xl grid-cols-3 divide-x divide-background-300 border-y border-background-300 py-4">
              <div className="pr-3 sm:pr-6">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-foreground-500">{t('landing_proof_series')}</dt>
                <dd className="mt-1 font-heading text-2xl font-semibold text-foreground-950">6</dd>
              </div>
              <div className="px-3 sm:px-6">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-foreground-500">{t('landing_proof_regions')}</dt>
                <dd className="mt-1 font-heading text-2xl font-semibold text-foreground-950">5</dd>
              </div>
              <div className="pl-3 sm:pl-6">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-foreground-500">{t('landing_proof_languages')}</dt>
                <dd className="mt-1 font-heading text-2xl font-semibold text-foreground-950">5</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
            <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2rem] bg-primary-200/50" aria-hidden="true" />
            <div className="relative min-h-[31rem] overflow-hidden rounded-[1.75rem] border border-background-50/40 bg-foreground-950 shadow-2xl shadow-foreground-950/25">
              <img
                src={featuredSeries.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/20 via-foreground-950/15 to-foreground-950" />

              <div className="relative flex items-start justify-between gap-4 p-5 sm:p-7">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-background-50/30 bg-foreground-950/55 px-3 py-1.5 text-xs font-bold text-background-50 backdrop-blur">
                  <i className="ri-verified-badge-fill text-secondary-300" aria-hidden="true" />
                  {t('series_verified_sources')}
                </span>
                <span className="rounded-full bg-accent-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-background-50">
                  {t(featuredSeries.statusKey)}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-300">
                  {t(featuredSeries.platformKey)} · GMS
                </p>
                <h2 className="mt-2 font-heading text-4xl font-semibold text-background-50 sm:text-5xl">
                  {featuredSeries.name}
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-background-50/80 sm:text-base">
                  {t(featuredSeries.descriptionKey)}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {(['news', 'guides', 'tools'] as const).map((module) => (
                    <Link
                      key={module}
                      to={localized(getSeriesModuleHref(featuredSeries.id, module))}
                      data-conversion-id={`featured-${module}`}
                      onClick={() => trackLandingConversion(`featured_${module}`, getSeriesModuleHref(featuredSeries.id, module))}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-background-50 px-4 text-sm font-bold text-foreground-950 transition hover:bg-primary-100"
                    >
                      {t(`series_content_${module}`)}
                      <i className="ri-arrow-right-up-line" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="choose-your-series" className="scroll-mt-24 bg-background-50 py-16 md:py-24">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">{t('landing_series_eyebrow')}</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground-950 md:text-5xl">
              {t('landing_series_title')}
            </h2>
            <p className="mt-4 text-base leading-7 text-foreground-700 md:text-lg">{t('landing_series_desc')}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {seriesProducts.map((product, index) => (
              <article
                key={product.id}
                className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-background-300 bg-background-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl"
              >
                <Link
                  to={localized(getSeriesModuleHref(product.id, 'news'))}
                  data-conversion-id={`series-image-${product.id}`}
                  onClick={() => trackLandingConversion('series_select', product.id)}
                  className="relative block aspect-[16/9] overflow-hidden bg-foreground-950"
                  aria-label={`${product.name} — ${t('series_enter_hub')}`}
                >
                  <img
                    src={product.image}
                    alt=""
                    className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/75 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-background-50/30 bg-foreground-950/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background-50 backdrop-blur">
                    {String(index + 1).padStart(2, '0')} · {t(product.platformKey)}
                  </span>
                </Link>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-2xl font-semibold leading-tight text-foreground-950">{product.name}</h3>
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500 ring-4 ring-accent-100" title={t(product.statusKey)} />
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-6 text-foreground-700">{t(product.descriptionKey)}</p>
                  <Link
                    to={localized(getSeriesModuleHref(product.id, 'news'))}
                    data-conversion-id={`series-cta-${product.id}`}
                    onClick={() => trackLandingConversion('series_select', product.id)}
                    className="mt-5 inline-flex min-h-11 items-center justify-between rounded-xl bg-background-100 px-4 text-sm font-bold text-foreground-900 transition group-hover:bg-foreground-950 group-hover:text-background-50"
                  >
                    {t('series_enter_hub')}
                    <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground-950 py-16 text-background-50 md:py-24">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary-300">{t('landing_trust_eyebrow')}</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold md:text-5xl">{t('landing_trust_title')}</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-background-50/70">{t('landing_trust_desc')}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {proofPoints.map((point) => (
                <article key={point.titleKey} className="rounded-2xl border border-background-50/15 bg-background-50/5 p-5 backdrop-blur sm:p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-xl text-background-50">
                    <i className={point.icon} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-heading text-xl font-semibold">{t(point.titleKey)}</h3>
                  <p className="mt-2 text-sm leading-6 text-background-50/65">{t(point.descriptionKey)}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background-100 py-16 md:py-24">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">{t('landing_paths_eyebrow')}</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold text-foreground-950 md:text-5xl">{t('landing_paths_title')}</h2>
              <p className="mt-4 text-base leading-7 text-foreground-700">{t('landing_paths_desc')}</p>
            </div>
            <Link
              to={localized('/search')}
              data-conversion-id="content-search"
              onClick={() => trackLandingConversion('content_search', '/search')}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary-700 hover:text-primary-800"
            >
              <i className="ri-search-2-line" aria-hidden="true" />
              {t('nav_search_button')}
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {contentPaths.map((path) => (
              <Link
                key={path.href}
                to={localized(path.href)}
                data-conversion-id={`content-path-${path.href.slice(1)}`}
                onClick={() => trackLandingConversion('content_path', path.href)}
                className="group rounded-2xl border border-background-300 bg-background-50 p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg sm:p-6"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-2xl text-primary-700 transition group-hover:bg-primary-500 group-hover:text-background-50">
                  <i className={path.icon} aria-hidden="true" />
                </span>
                <h3 className="mt-5 flex items-center justify-between gap-3 font-heading text-2xl font-semibold text-foreground-950">
                  {t(path.titleKey)}
                  <i className="ri-arrow-right-up-line text-base text-primary-600 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground-700">{t(path.descriptionKey)}</p>
              </Link>
            ))}
          </div>

          <div className="relative mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-10 text-background-50 shadow-xl md:px-12 md:py-12">
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[42px] border-background-50/10" aria-hidden="true" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary-200">{t('landing_final_eyebrow')}</p>
                <h2 className="mt-3 font-heading text-3xl font-semibold md:text-4xl">{t('landing_final_title')}</h2>
                <p className="mt-3 text-sm leading-6 text-background-50/85 md:text-base">{t('landing_final_desc')}</p>
              </div>
              <a
                href="#choose-your-series"
                data-conversion-id="final-series-selector"
                onClick={() => trackLandingConversion('final_series_selector', '#choose-your-series')}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-background-50 px-6 text-sm font-bold text-foreground-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-secondary-100"
              >
                {t('landing_final_cta')}
                <i className="ri-arrow-up-line" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
