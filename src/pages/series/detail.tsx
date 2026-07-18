import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { localizeHref } from '@/i18n/languageRouting';
import { seriesProducts, type SeriesProduct } from './catalog';
import { getSeriesModuleHref, isSeriesModule, type SeriesModule } from './scope';
import { getSeriesVersionShortLabel } from './versionConfig';
import { getVerifiedSeriesResources } from './verifiedContent';

type Props = {
  product: SeriesProduct;
  seriesModule?: string;
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

const overviewModules = ['news', 'guides', 'tools'] as const;
export default function SeriesDetailContent({ product, seriesModule }: Props) {
  const { t, i18n } = useTranslation();
  const { version } = useVersion();
  const localized = (href: string) => localizeHref(href, i18n.language, version);
  const activeModule = isSeriesModule(seriesModule) ? seriesModule : undefined;
  const moduleLabel = activeModule ? t(moduleLabels[activeModule]) : undefined;
  const displayedModules = activeModule ? [activeModule] : overviewModules;

  return (
    <>
      <section className="relative min-h-[22rem] overflow-hidden bg-foreground-950">
        <img src={product.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground-950 via-foreground-950/80 to-foreground-950/30" />
        <div className="relative mx-auto flex min-h-[22rem] max-w-6xl flex-col justify-center px-4 py-12 text-background-50 md:px-8">
          <Link to={localized('/')} className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-200 hover:text-background-50">
            <i className="ri-arrow-left-line" aria-hidden="true" />
            {t('series_back_all')}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-primary-200">
            <span>{t(product.platformKey)}</span>
            <span aria-hidden="true">·</span>
            <span>{t(product.statusKey)}</span>
            <span aria-hidden="true">·</span>
            <span>{getSeriesVersionShortLabel(product.id, version)}</span>
            {moduleLabel && <>
              <span aria-hidden="true">·</span>
              <span>{moduleLabel}</span>
            </>}
          </div>
          <h1 className="mt-3 max-w-4xl font-heading text-4xl font-semibold md:text-6xl">{product.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-background-100 md:text-lg">{t(product.descriptionKey)}</p>
        </div>
      </section>

      {displayedModules.map((module, index) => {
        const resources = getVerifiedSeriesResources(product.id, module);
        return <section key={module} id={module} className={`scroll-mt-36 border-b border-background-200 ${index % 2 === 0 ? 'bg-background-50' : 'bg-background-100'}`}>
          <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
            <div className="flex max-w-3xl items-start gap-3">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <i className={`${moduleIcons[module]} text-xl`} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase text-primary-600">{product.name}</p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground-950 md:text-3xl">{t(moduleLabels[module])}</h2>
                <p className="mt-2 text-sm leading-6 text-foreground-600">{t('series_verified_content_note')}</p>
              </div>
            </div>

            {resources.length > 0 ? (
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {resources.map((resource) => (
                  <article key={`${module}-${resource.title}`} className="flex min-h-56 flex-col rounded-lg border border-background-300 bg-background-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-primary-700">
                        <i className="ri-verified-badge-line" aria-hidden="true" />
                        {resource.sourceLabel}
                      </span>
                      {resource.publishedAt && <time dateTime={resource.publishedAt}>{resource.publishedAt}</time>}
                    </div>
                    <h3 className="mt-4 font-heading text-lg font-semibold leading-snug text-foreground-950">{resource.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-foreground-600">{resource.description}</p>
                    <a href={resource.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800">
                      {t('series_check_source')}
                      <i className="ri-external-link-line" aria-hidden="true" />
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-7 border-l-2 border-background-300 py-2 pl-4 text-sm leading-6 text-foreground-600">
                {t('series_no_verified_content', { name: product.name, module: t(moduleLabels[module]) })}
              </div>
            )}
          </div>
        </section>;
      })}

      <section className="bg-background-100">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
          <h2 className="font-heading text-xl font-semibold text-foreground-950">{t('series_switch_title')}</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {seriesProducts.map((item) => (
              <Link key={item.id} to={localized(activeModule ? getSeriesModuleHref(item.id, activeModule) : `/series/${item.id}`)} className={`rounded-lg border p-3 text-sm font-semibold transition ${item.id === product.id ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-background-300 bg-background-50 text-foreground-800 hover:border-primary-300'}`}>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
