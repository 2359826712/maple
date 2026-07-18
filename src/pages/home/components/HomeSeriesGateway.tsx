import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { localizeHref } from '@/i18n/languageRouting';
import { seriesProducts } from '@/pages/series/catalog';
import { getSeriesModuleHref } from '@/pages/series/scope';

export default function HomeSeriesGateway() {
  const { t, i18n } = useTranslation();
  const { version } = useVersion();

  return (
    <section className="min-h-[calc(100vh-5rem)] border-b border-background-200 bg-background-50 pt-20">
      <div className="mx-auto max-w-[96rem] px-4 py-8 md:px-8 md:py-10">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase text-primary-600">{t('series_eyebrow')}</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground-950 md:text-4xl">
            {t('home_series_title')}
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-foreground-600">{t('home_series_desc')}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {seriesProducts.map((product) => (
            <Link
              key={product.id}
              to={localizeHref(getSeriesModuleHref(product.id, 'news'), i18n.language, version)}
              className="group relative aspect-[16/9] min-h-48 overflow-hidden rounded-lg border border-foreground-950/10 bg-foreground-950 shadow-sm transition-shadow hover:shadow-lg"
            >
              <img
                src={product.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground-950 via-foreground-950/25 to-transparent" />
              <span className="absolute left-4 top-4 rounded-md bg-background-50/95 px-2 py-1 text-[11px] font-semibold uppercase text-foreground-900 shadow-sm">
                {t(product.platformKey)} · {t(product.statusKey)}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-5 text-background-50 md:p-6">
                <h2 className="font-heading text-2xl font-semibold leading-tight md:text-3xl">{product.name}</h2>
                <span className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-background-50 px-3 text-sm font-semibold text-foreground-950 transition-colors group-hover:bg-primary-100">
                  {t('series_enter_hub')}
                  <i className="ri-arrow-right-line transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
