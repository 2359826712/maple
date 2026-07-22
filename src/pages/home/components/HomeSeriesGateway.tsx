import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { localizeHref } from '@/i18n/languageRouting';
import { seriesProducts } from '@/pages/series/catalog';
import { getSeriesModuleHref } from '@/pages/series/scope';
import HomeLongFormGuide from './HomeLongFormGuide';

const heroPaths = [
  { href: '/news', module: 'news', tabKey: 'nav_news', icon: 'ri-newspaper-line', titleKey: 'landing_point_04_title', descriptionKey: 'landing_point_04_desc', score: '24/7' },
  { href: '/guides', module: 'guides', tabKey: 'nav_guides', icon: 'ri-compass-3-line', titleKey: 'landing_point_06_title', descriptionKey: 'landing_point_06_desc', score: '01' },
  { href: '/events', module: 'events', tabKey: 'nav_events', icon: 'ri-calendar-event-line', titleKey: 'landing_point_05_title', descriptionKey: 'landing_point_05_desc', score: 'LIVE' },
  { href: '/mapler-house', module: 'tools', tabKey: 'nav_tools', icon: 'ri-tools-line', titleKey: 'landing_point_07_title', descriptionKey: 'landing_point_07_desc', score: '10+' },
] as const;

const conversionPoints = [
  { href: '/news', icon: 'ri-layout-grid-line', titleKey: 'landing_point_01_title', descriptionKey: 'landing_point_01_desc' },
  { href: '/news', icon: 'ri-global-line', titleKey: 'landing_point_02_title', descriptionKey: 'landing_point_02_desc' },
  { href: '/news', icon: 'ri-shield-check-line', titleKey: 'landing_point_03_title', descriptionKey: 'landing_point_03_desc' },
  { href: '/news', icon: 'ri-flashlight-line', titleKey: 'landing_point_04_title', descriptionKey: 'landing_point_04_desc' },
  { href: '/events', icon: 'ri-calendar-event-line', titleKey: 'landing_point_05_title', descriptionKey: 'landing_point_05_desc' },
  { href: '/guides', icon: 'ri-compass-3-line', titleKey: 'landing_point_06_title', descriptionKey: 'landing_point_06_desc' },
  { href: '/mapler-house', icon: 'ri-tools-line', titleKey: 'landing_point_07_title', descriptionKey: 'landing_point_07_desc' },
  { href: '/wiki', icon: 'ri-book-open-line', titleKey: 'landing_point_08_title', descriptionKey: 'landing_point_08_desc' },
  { href: '/rankings', icon: 'ri-bar-chart-box-line', titleKey: 'landing_point_09_title', descriptionKey: 'landing_point_09_desc' },
  { href: '/search', icon: 'ri-translate-2', titleKey: 'landing_point_10_title', descriptionKey: 'landing_point_10_desc' },
] as const;

const indexSnapshot = [
  { value: '1,540+', labelKey: 'landing_snapshot_content' },
  { value: '31', labelKey: 'landing_snapshot_resources' },
  { value: '6', labelKey: 'landing_snapshot_series' },
] as const;

const comparisonColumns = [
  { key: 'mpstorys', labelKey: 'landing_compare_mpstorys' },
  { key: 'official', labelKey: 'landing_compare_official' },
  { key: 'wiki', labelKey: 'landing_compare_wiki' },
  { key: 'tools', labelKey: 'landing_compare_tools' },
] as const;

const comparisonRows = [
  { labelKey: 'landing_compare_row_role', valueKeys: ['landing_compare_role_mpstorys', 'landing_compare_role_official', 'landing_compare_role_wiki', 'landing_compare_role_tools'] },
  { labelKey: 'landing_compare_row_series', valueKeys: ['landing_compare_series_mpstorys', 'landing_compare_series_official', 'landing_compare_series_wiki', 'landing_compare_series_tools'] },
  { labelKey: 'landing_compare_row_updates', valueKeys: ['landing_compare_updates_mpstorys', 'landing_compare_updates_official', 'landing_compare_updates_wiki', 'landing_compare_updates_tools'] },
  { labelKey: 'landing_compare_row_knowledge', valueKeys: ['landing_compare_knowledge_mpstorys', 'landing_compare_knowledge_official', 'landing_compare_knowledge_wiki', 'landing_compare_knowledge_tools'] },
  { labelKey: 'landing_compare_row_utilities', valueKeys: ['landing_compare_utilities_mpstorys', 'landing_compare_utilities_official', 'landing_compare_utilities_wiki', 'landing_compare_utilities_tools'] },
  { labelKey: 'landing_compare_row_context', valueKeys: ['landing_compare_context_mpstorys', 'landing_compare_context_official', 'landing_compare_context_wiki', 'landing_compare_context_tools'] },
] as const;

const playerVoices = [
  { quoteKey: 'landing_voice_01_quote', contextKey: 'landing_voice_01_context', icon: 'ri-layout-grid-line' },
  { quoteKey: 'landing_voice_02_quote', contextKey: 'landing_voice_02_context', icon: 'ri-global-line' },
  { quoteKey: 'landing_voice_03_quote', contextKey: 'landing_voice_03_context', icon: 'ri-tools-line' },
] as const;

const seriesCardLinks = [
  { module: 'guides', labelKey: 'nav_guides', icon: 'ri-book-open-line' },
  { module: 'events', labelKey: 'nav_events', icon: 'ri-calendar-event-line' },
  { module: 'tools', labelKey: 'nav_tools', icon: 'ri-tools-line' },
] as const;

const seriesCoverageKeys: Record<string, string> = {
  'maplestory-pc': 'landing_series_detail_pc',
  'maplestory-classic': 'landing_series_detail_classic',
  'maplestory-m': 'landing_series_detail_m',
  'maplestory-n': 'landing_series_detail_n',
  'maplestory-worlds': 'landing_series_detail_worlds',
  'maplestory-idle': 'landing_series_detail_idle',
};

const trackLandingConversion = (action: string, destination: string) => {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', 'landing_cta_click', { action, destination });
};

export default function HomeSeriesGateway() {
  const { t, i18n } = useTranslation();
  const { version } = useVersion();
  const [activePathIndex, setActivePathIndex] = useState(0);
  const featuredSeries = seriesProducts[0];
  const activePath = heroPaths[activePathIndex];
  const localized = (href: string) => localizeHref(href, i18n.language, version);

  return (
    <div className="overflow-hidden bg-[#f5f0e7] pt-20 text-[#171411]">
      <section className="relative isolate overflow-hidden bg-[#0f0e0d] text-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff8a00] via-[#ffb000] to-[#ff4f7b]" aria-hidden="true" />
        <div className="absolute -left-40 top-12 h-[32rem] w-[32rem] rounded-full bg-[#ff9d00]/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-36 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[#ff4f7b]/10 blur-3xl" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:56px_56px]" aria-hidden="true" />

        <div className="border-b border-white/10 bg-[#161412]/90">
          <div className="mx-auto flex min-h-11 max-w-[90rem] items-center justify-center gap-3 px-4 text-center text-xs font-semibold text-white/70 md:px-8">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#ffb000] shadow-[0_0_14px_rgba(255,176,0,.9)]" aria-hidden="true" />
            {t('landing_eyebrow')}
            <a href="#choose-your-series" className="inline-flex items-center gap-1 text-[#ffc23a] hover:text-white">
              {t('landing_primary_cta')}
              <i className="ri-arrow-right-line" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mx-auto grid min-h-[47rem] max-w-[90rem] items-center gap-14 px-4 py-16 md:px-8 lg:grid-cols-[minmax(0,.92fr)_minmax(32rem,1.08fr)] lg:py-20">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ffb000]/35 bg-[#ffb000]/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ffc23a]">
              <i className="ri-leaf-fill" aria-hidden="true" />
              {t('landing_eyebrow')}
            </div>

            <h1 className="mt-7 max-w-4xl font-heading text-[3.4rem] font-semibold leading-[0.94] tracking-[-0.045em] text-[#fffaf2] sm:text-6xl lg:text-[4.7rem]">
              {t('landing_title_line1')}
              <span className="sr-only"> — </span>
              <span className="mt-2 block text-[#ffb000]">{t('landing_title_line2')}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
              {t('landing_subtitle')}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#choose-your-series"
                data-conversion-id="hero-series-selector"
                onClick={() => trackLandingConversion('hero_series_selector', '#choose-your-series')}
                className="inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl bg-[#ffb000] px-7 text-sm font-extrabold text-[#17110a] shadow-[0_14px_38px_rgba(255,176,0,.22)] transition hover:-translate-y-0.5 hover:bg-[#ffc43d]"
              >
                {t('landing_primary_cta')}
                <i className="ri-arrow-right-line" aria-hidden="true" />
              </a>
              <Link
                to={localized('/news')}
                data-conversion-id="hero-latest-updates"
                onClick={() => trackLandingConversion('hero_latest_updates', '/news')}
                className="inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-[#ffb000]/60 hover:bg-white/[0.08]"
              >
                <i className="ri-play-circle-line text-[#ffb000]" aria-hidden="true" />
                {t('landing_secondary_cta')}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-white/45">
              <span className="inline-flex items-center gap-1.5"><i className="ri-check-line text-[#ffb000]" aria-hidden="true" />6 {t('landing_proof_series')}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5"><i className="ri-check-line text-[#ffb000]" aria-hidden="true" />5 {t('landing_proof_regions')}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5"><i className="ri-check-line text-[#ffb000]" aria-hidden="true" />5 {t('landing_proof_languages')}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[42rem]">
            <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-gradient-to-br from-[#ffb000]/20 via-transparent to-[#ff4f7b]/15 blur-2xl" aria-hidden="true" />
            <div className="overflow-hidden rounded-[1.6rem] border border-white/15 bg-[#171513] shadow-[0_30px_90px_rgba(0,0,0,.55)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffb000]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6ecf8d]" />
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">MPStorys / Live hub</span>
              </div>

              <div className="grid grid-cols-4 border-b border-white/10 p-2" role="tablist" aria-label={t('landing_paths_title')}>
                {heroPaths.map((path, index) => (
                  <button
                    key={path.module}
                    type="button"
                    role="tab"
                    aria-selected={activePathIndex === index}
                    onClick={() => setActivePathIndex(index)}
                    className={`min-h-11 rounded-lg px-2 text-xs font-bold transition ${activePathIndex === index ? 'bg-[#ffb000] text-[#17110a]' : 'text-white/50 hover:bg-white/[0.05] hover:text-white'}`}
                  >
                    {t(path.tabKey)}
                  </button>
                ))}
              </div>

              <div className="grid min-h-[30rem] gap-0 md:grid-cols-[1.07fr_.93fr]">
                <div className="relative min-h-72 overflow-hidden border-b border-white/10 md:border-b-0 md:border-r">
                  <img
                    src={featuredSeries.image}
                    alt={featuredSeries.name}
                    width={960}
                    height={478}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-[#171513]" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffb000] text-xl text-[#17110a] shadow-lg">
                      <i className={activePath.icon} aria-hidden="true" />
                    </div>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffc23a]">{featuredSeries.name} · GMS</p>
                    <h2 className="mt-2 font-heading text-3xl font-semibold leading-tight text-white">{t(activePath.titleKey)}</h2>
                    <p className="mt-3 text-sm leading-6 text-white/60">{t(activePath.descriptionKey)}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-between p-5 sm:p-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{t('series_verified_sources')}</span>
                      <span className="text-xs font-bold text-[#6ecf8d]">● {t(featuredSeries.statusKey)}</span>
                    </div>
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                      <span className="font-heading text-5xl font-semibold text-[#ffb000]">{activePath.score}</span>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-[#ff8a00] to-[#ffce5c]" />
                      </div>
                      <p className="mt-3 text-xs leading-5 text-white/45">{t('landing_trust_desc')}</p>
                    </div>
                  </div>
                  <Link
                    to={localized(activePath.href)}
                    data-conversion-id={`hero-preview-${activePath.module}`}
                    onClick={() => trackLandingConversion(`hero_preview_${activePath.module}`, activePath.href)}
                    className="mt-5 inline-flex min-h-12 items-center justify-between rounded-xl bg-white px-4 text-sm font-extrabold text-[#17110a] transition hover:bg-[#ffb000]"
                  >
                    {t(activePath.titleKey)}
                    <i className="ri-arrow-right-up-line" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-render-deferred border-b border-[#d9d0c2] bg-[#fffaf2] py-14 md:py-20">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a66500]">{t('landing_trust_eyebrow')}</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.03em] text-[#171411] md:text-5xl">{t('landing_trust_title')}</h2>
            <p className="mt-4 text-base leading-7 text-[#6e665d]">{t('landing_trust_desc')}</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {conversionPoints.slice(0, 4).map((point) => (
              <article key={point.titleKey} className="rounded-2xl border border-[#e1d9ce] bg-white p-5 shadow-[0_8px_30px_rgba(44,35,25,.05)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1c7] text-lg text-[#a66500]"><i className={point.icon} aria-hidden="true" /></span>
                <h3 className="mt-4 font-heading text-xl font-semibold">{t(point.titleKey)}</h3>
                <p className="mt-2 text-sm leading-6 text-[#746b61]">{t(point.descriptionKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-render-deferred border-b border-white/10 bg-[#0f0e0d] py-16 text-white md:py-24">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#ffb000]">{t('landing_snapshot_eyebrow')}</p>
            <h2 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.035em] text-[#fffaf2] md:text-5xl">{t('landing_snapshot_title')}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">{t('landing_snapshot_desc')}</p>
          </div>
          <dl className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-0">
            {indexSnapshot.map((stat, index) => (
              <div
                key={stat.labelKey}
                data-testid="snapshot-stat"
                className={`text-center ${index > 0 ? 'sm:border-l sm:border-white/20' : ''}`}
              >
                <dt className="font-heading text-5xl font-semibold tracking-[-0.04em] text-[#ffb000] md:text-6xl">{stat.value}</dt>
                <dd className="mt-3 text-sm font-medium text-white/75 md:text-base">{t(stat.labelKey)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="comparison" className="landing-render-deferred scroll-mt-24 border-b border-[#d9d0c2] bg-[#fffaf2] py-16 md:py-24">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a66500]">{t('landing_compare_eyebrow')}</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.035em] text-[#171411] md:text-5xl">{t('landing_compare_title')}</h2>
            </div>
            <div className="lg:pb-1">
              <p className="max-w-3xl text-base leading-7 text-[#6e665d]">{t('landing_compare_desc')}</p>
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#8a8177]"><i className="ri-scales-3-line text-[#a66500]" aria-hidden="true" />{t('landing_compare_note')}</p>
            </div>
          </div>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-[#d9d0c2] bg-white shadow-[0_16px_45px_rgba(44,35,25,.08)]">
            <table className="w-full min-w-[58rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#d9d0c2] bg-[#f1ebe2]">
                  <th scope="col" className="w-[18%] px-5 py-5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#746b61]">{t('landing_compare_dimension')}</th>
                  {comparisonColumns.map((column, index) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`w-[20.5%] px-5 py-5 font-heading text-lg font-semibold ${index === 0 ? 'bg-[#171411] text-[#ffb000]' : 'text-[#171411]'}`}
                    >
                      <span className="flex items-center gap-2">
                        {index === 0 && <i className="ri-leaf-fill text-sm" aria-hidden="true" />}
                        {t(column.labelKey)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.labelKey} data-testid="comparison-row" className="border-b border-[#e7e0d7] last:border-b-0">
                    <th scope="row" className="px-5 py-5 text-sm font-extrabold text-[#3f3933]">{t(row.labelKey)}</th>
                    {row.valueKeys.map((valueKey, index) => (
                      <td key={valueKey} className={`px-5 py-5 text-sm leading-6 ${index === 0 ? 'bg-[#fff4d2] font-bold text-[#5f4100]' : 'text-[#746b61]'}`}>
                        {index === 0 && <i className="ri-check-line mr-2 text-[#a66500]" aria-hidden="true" />}
                        {t(valueKey)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="player-voices" className="landing-render-deferred scroll-mt-24 border-b border-[#d9d0c2] bg-[#f5f0e7] py-16 md:py-24">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a66500]">{t('landing_voice_eyebrow')}</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.035em] text-[#171411] md:text-5xl">{t('landing_voice_title')}</h2>
            <p className="mt-4 text-base leading-7 text-[#6e665d]">{t('landing_voice_desc')}</p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {playerVoices.map((voice) => (
              <figure key={voice.quoteKey} data-testid="player-voice" className="flex min-h-64 flex-col rounded-2xl border border-[#d9d0c2] bg-[#fffaf2] p-6 shadow-[0_12px_35px_rgba(44,35,25,.07)] md:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#171411] text-xl text-[#ffb000]"><i className={voice.icon} aria-hidden="true" /></span>
                  <i className="ri-double-quotes-r font-heading text-4xl text-[#d7a13a]" aria-hidden="true" />
                </div>
                <blockquote className="mt-6 flex-1 font-heading text-xl font-semibold leading-8 text-[#2e2924]">{t(voice.quoteKey)}</blockquote>
                <figcaption className="mt-6 border-t border-[#e1d9ce] pt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[#8a8177]">{t(voice.contextKey)}</figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#d9d0c2] bg-white px-5 py-4 sm:flex-row">
            <p className="inline-flex items-start gap-2 text-xs leading-5 text-[#746b61]"><i className="ri-shield-check-line mt-0.5 text-[#a66500]" aria-hidden="true" />{t('landing_voice_note')}</p>
            <Link
              to={localized('/feedback')}
              data-conversion-id="player-voice-feedback"
              onClick={() => trackLandingConversion('player_voice_feedback', '/feedback')}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#171411] px-5 text-sm font-extrabold text-white transition hover:bg-[#a66500]"
            >
              {t('landing_voice_cta')}
              <i className="ri-arrow-right-line" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section id="choose-your-series" className="landing-render-deferred scroll-mt-24 bg-[#f5f0e7] py-16 md:py-24">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a66500]">{t('landing_series_eyebrow')}</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.035em] text-[#171411] md:text-6xl">{t('landing_series_title')}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#6e665d] md:text-lg">{t('landing_series_desc')}</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d9d0c2] bg-[#fffaf2] px-4 py-2 text-xs font-bold text-[#4f4840]">
              <span className="h-2 w-2 rounded-full bg-[#46a96b]" aria-hidden="true" />
              6 {t('landing_proof_series')}
            </div>
          </div>

          <div className="mt-11 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {seriesProducts.map((product, index) => (
              <article key={product.id} className="group overflow-hidden rounded-2xl border border-[#d9d0c2] bg-[#fffaf2] shadow-[0_8px_30px_rgba(44,35,25,.06)] transition duration-300 hover:-translate-y-1 hover:border-[#d89a21] hover:shadow-[0_18px_45px_rgba(44,35,25,.12)]">
                <Link
                  to={localized(getSeriesModuleHref(product.id, 'news'))}
                  data-conversion-id={`series-image-${product.id}`}
                  onClick={() => trackLandingConversion('series_select', product.id)}
                  className="relative block aspect-[16/9] overflow-hidden bg-[#171411]"
                  aria-label={`${product.name} — ${t('series_enter_hub')}`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    width={960}
                    height={540}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171411]/80 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white backdrop-blur">{String(index + 1).padStart(2, '0')} · {t(product.platformKey)}</span>
                  <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#ffb000] text-lg text-[#17110a] transition group-hover:rotate-[-8deg] group-hover:scale-110"><i className="ri-arrow-right-up-line" aria-hidden="true" /></span>
                </Link>
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-heading text-2xl font-semibold leading-tight">{product.name}</h3>
                    <span className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-[#3c8756]">● {t(product.statusKey)}</span>
                  </div>
                  <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-[#746b61]">{t(product.descriptionKey)}</p>
                  <nav
                    aria-label={t('series_card_nav_label', { name: product.name })}
                    className="mt-5 grid grid-cols-3 gap-2"
                  >
                    <Link
                      to={localized(getSeriesModuleHref(product.id, 'news'))}
                      data-conversion-id={`series-news-${product.id}`}
                      data-series-search-link="news"
                      onClick={() => trackLandingConversion('series_news', product.id)}
                      className="col-span-3 inline-flex min-h-11 items-center justify-between rounded-xl bg-[#171411] px-4 text-xs font-extrabold text-white transition hover:bg-[#a66500]"
                    >
                      {t('series_card_news_updates', { name: product.name })}
                      <i className="ri-arrow-right-line text-[#ffb000]" aria-hidden="true" />
                    </Link>
                    {seriesCardLinks.map((link) => (
                      <Link
                        key={link.module}
                        to={localized(getSeriesModuleHref(product.id, link.module))}
                        data-conversion-id={`series-${link.module}-${product.id}`}
                        data-series-search-link={link.module}
                        onClick={() => trackLandingConversion(`series_${link.module}`, product.id)}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#d9d0c2] bg-white px-2 text-[11px] font-extrabold text-[#4f4840] transition hover:border-[#171411] hover:text-[#171411]"
                      >
                        <i className={link.icon} aria-hidden="true" />
                        {t(link.labelKey)}
                      </Link>
                    ))}
                  </nav>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="series-coverage" className="landing-render-deferred border-y border-[#d9d0c2] bg-[#fffaf2] py-16 md:py-24">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a66500]">{t('landing_series_detail_eyebrow')}</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.035em] text-[#171411] md:text-5xl">{t('landing_series_detail_title')}</h2>
            </div>
            <p className="max-w-3xl text-base leading-7 text-[#6e665d]">{t('landing_series_detail_desc')}</p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#d9d0c2] bg-[#d9d0c2] lg:grid-cols-2">
            {seriesProducts.map((product, index) => (
              <article key={product.id} data-testid="series-coverage-card" className="flex flex-col bg-white p-6 md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs font-extrabold tracking-[0.2em] text-[#a66500]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="rounded-full bg-[#f5f0e7] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#6e665d]">{t(product.platformKey)}</span>
                </div>
                <h3 className="mt-5 font-heading text-2xl font-semibold text-[#171411]">{product.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-[#6e665d]">{t(seriesCoverageKeys[product.id])}</p>
                <Link
                  to={localized(getSeriesModuleHref(product.id, 'guides'))}
                  data-conversion-id={`series-coverage-${product.id}`}
                  onClick={() => trackLandingConversion('series_coverage', product.id)}
                  className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-[#d9d0c2] px-4 text-xs font-extrabold text-[#4f4840] transition hover:border-[#171411] hover:bg-[#171411] hover:text-white"
                >
                  {t('landing_series_detail_action', { name: product.name })}
                  <i className="ri-arrow-right-line" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-mpstorys" className="landing-render-deferred bg-[#fffaf2] py-16 md:py-24">
        <div className="mx-auto max-w-[90rem] px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <span className="inline-flex h-16 min-w-16 items-center justify-center rounded-2xl bg-[#171411] px-4 font-heading text-3xl font-semibold text-[#ffb000] shadow-xl">10</span>
              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-[#a66500]">{t('landing_ten_eyebrow')}</p>
              <h2 className="mt-3 max-w-xl font-heading text-4xl font-semibold tracking-[-0.035em] md:text-5xl">{t('landing_ten_title')}</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#6e665d] md:text-lg">{t('landing_ten_desc')}</p>
              <a
                href="#choose-your-series"
                data-conversion-id="ten-points-series-selector"
                onClick={() => trackLandingConversion('ten_points_series_selector', '#choose-your-series')}
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffb000] px-6 text-sm font-extrabold text-[#17110a] transition hover:-translate-y-0.5 hover:bg-[#ffc43d]"
              >
                {t('landing_primary_cta')}
                <i className="ri-arrow-up-line" aria-hidden="true" />
              </a>
            </div>

            <ol className="grid gap-px overflow-hidden rounded-2xl border border-[#d9d0c2] bg-[#d9d0c2] sm:grid-cols-2">
              {conversionPoints.map((point, index) => (
                <li key={point.titleKey} data-testid="conversion-point" className="bg-[#fffaf2]">
                  <Link
                    to={localized(point.href)}
                    data-conversion-id={`landing-point-${String(index + 1).padStart(2, '0')}`}
                    onClick={() => trackLandingConversion(`landing_point_${String(index + 1).padStart(2, '0')}`, point.href)}
                    className="group flex min-h-52 flex-col p-5 transition hover:bg-[#fff3cd] sm:p-6"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-xs font-extrabold tracking-[0.2em] text-[#a66500]">{String(index + 1).padStart(2, '0')}</span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#171411] text-lg text-[#ffb000] transition group-hover:-rotate-6 group-hover:scale-105"><i className={point.icon} aria-hidden="true" /></span>
                    </div>
                    <h3 className="mt-5 flex items-start justify-between gap-3 font-heading text-xl font-semibold">
                      {t(point.titleKey)}
                      <i className="ri-arrow-right-up-line mt-1 text-sm text-[#a49a8e] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#a66500]" aria-hidden="true" />
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#746b61]">{t(point.descriptionKey)}</p>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <HomeLongFormGuide />

      <section className="landing-render-deferred bg-[#0f0e0d] px-4 py-16 text-white md:px-8 md:py-24">
        <div className="relative mx-auto max-w-[90rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#171513] px-6 py-12 shadow-2xl md:px-12 md:py-16">
          <div className="absolute -right-12 -top-28 h-80 w-80 rounded-full border-[52px] border-[#ffb000]/10" aria-hidden="true" />
          <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#ff4f7b]/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#ffc23a]">{t('landing_final_eyebrow')}</p>
              <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.035em] text-[#fffaf2] md:text-6xl">{t('landing_final_title')}</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/60 md:text-lg">{t('landing_final_desc')}</p>
              <dl className="mt-9 flex flex-wrap gap-8">
                <div><dt className="font-heading text-3xl font-semibold text-[#ffb000]">6</dt><dd className="mt-1 text-xs font-bold uppercase tracking-wider text-white/40">{t('landing_proof_series')}</dd></div>
                <div><dt className="font-heading text-3xl font-semibold text-[#ffb000]">5</dt><dd className="mt-1 text-xs font-bold uppercase tracking-wider text-white/40">{t('landing_proof_regions')}</dd></div>
                <div><dt className="font-heading text-3xl font-semibold text-[#ffb000]">10</dt><dd className="mt-1 text-xs font-bold uppercase tracking-wider text-white/40">{t('landing_paths_title')}</dd></div>
              </dl>
            </div>
            <a
              href="#choose-your-series"
              data-conversion-id="final-series-selector"
              onClick={() => trackLandingConversion('final_series_selector', '#choose-your-series')}
              className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ffb000] px-8 text-sm font-extrabold text-[#17110a] shadow-[0_14px_38px_rgba(255,176,0,.2)] transition hover:-translate-y-0.5 hover:bg-[#ffc43d]"
            >
              {t('landing_final_cta')}
              <i className="ri-arrow-up-line" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
