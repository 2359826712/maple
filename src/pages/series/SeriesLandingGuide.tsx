import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { localizeHref, normalizeLanguage } from '@/i18n/languageRouting';
import type { SeriesProduct } from './catalog';
import { getSeriesLandingProfile } from './landingContent';
import { getSeriesModuleHref } from './scope';

const benefitIcons = ['ri-global-line', 'ri-links-line', 'ri-line-chart-line'];

export default function SeriesLandingGuide({ product }: { product: SeriesProduct }) {
  const { i18n } = useTranslation();
  const { version } = useVersion();
  const profile = getSeriesLandingProfile(product.id, version, normalizeLanguage(i18n.language));
  if (!profile) return null;

  const localized = (href: string) => localizeHref(href, i18n.language, version);

  return (
    <div data-testid="series-landing-guide" className="bg-background-50">
      <section className="border-b border-background-200 bg-background-100">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                {profile.editionLabel} · {profile.region} · {profile.timeZone}
              </p>
              <h2 className="mt-3 max-w-4xl font-heading text-3xl font-semibold leading-tight text-foreground-950 md:text-5xl">
                {profile.title}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-foreground-650 md:text-lg">
                {profile.deck}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={localized(getSeriesModuleHref(product.id, 'news'))}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-semibold text-background-50 transition hover:bg-primary-700"
                >
                  {profile.ui.newsCta}
                  <i className="ri-arrow-right-line" aria-hidden="true" />
                </Link>
                <Link
                  to={localized(getSeriesModuleHref(product.id, 'guides'))}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-background-400 bg-background-50 px-4 text-sm font-semibold text-foreground-900 transition hover:border-primary-400 hover:text-primary-800"
                >
                  {profile.ui.guidesCta}
                </Link>
              </div>
            </div>

            <aside className="rounded-xl border border-background-300 bg-background-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-500">{profile.ui.quickNavigation}</p>
              <nav className="mt-4 grid grid-cols-2 gap-2" aria-label={`${profile.seriesName} guide sections`}>
                {profile.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="rounded-md border border-background-250 px-3 py-2 text-xs font-semibold text-foreground-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
                  >
                    {section.eyebrow}
                  </a>
                ))}
                <a
                  href="#series-faq"
                  className="rounded-md border border-background-250 px-3 py-2 text-xs font-semibold text-foreground-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
                >
                  {profile.ui.faqEyebrow}
                </a>
              </nav>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16" aria-labelledby="series-benefits-heading">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{profile.ui.benefitEyebrow}</p>
          <h2 id="series-benefits-heading" className="mt-2 font-heading text-2xl font-semibold text-foreground-950 md:text-3xl">
            {profile.ui.benefitTitle}
          </h2>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {profile.benefits.map((benefit, index) => (
            <article key={benefit.title} className="rounded-xl border border-background-300 bg-background-50 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <i className={`${benefitIcons[index]} text-xl`} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-foreground-950">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground-600">{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      {profile.sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          className={`scroll-mt-28 border-t border-background-200 ${index % 2 === 0 ? 'bg-background-100' : 'bg-background-50'}`}
        >
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{section.eyebrow}</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground-950 md:text-3xl">
                {section.title}
              </h2>
              <span className="mt-5 block h-1 w-16 rounded-full bg-primary-500" aria-hidden="true" />
            </div>
            <div>
              <div className="space-y-5 text-[0.95rem] leading-7 text-foreground-650">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              {section.bullets && (
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 rounded-lg border border-background-300 bg-background-50 p-4 text-sm leading-6 text-foreground-700">
                      <i className="ri-checkbox-circle-line mt-0.5 shrink-0 text-primary-600" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.id === 'trends' && (
                <div className="mt-8 overflow-hidden rounded-xl border border-background-300 bg-background-50">
                  <div className="border-b border-background-250 bg-foreground-950 px-5 py-4 text-background-50">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="mt-1 font-heading text-lg font-semibold">{profile.ui.demandMap}</h3>
                      </div>
                      <time dateTime={profile.snapshotDate} className="text-xs text-background-200">
                        {profile.ui.trendsChecked} {profile.snapshotDate}
                      </time>
                    </div>
                  </div>
                  <div className="divide-y divide-background-250">
                    {profile.searchIntents.map((intent) => (
                      <div key={intent.phrase} className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div>
                          <p className="font-semibold text-foreground-900">{intent.phrase}</p>
                          <p className="mt-1 text-xs text-foreground-500">
                            {intent.signal === 'Google Trends rising'
                              ? `Google Trends · ${profile.ui.risingIntent}`
                              : intent.signal === 'Localized search intent'
                                ? profile.ui.localizedIntent
                                : profile.ui.relatedIntent}
                          </p>
                        </div>
                        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                          intent.signal === 'Google Trends rising'
                            ? 'bg-primary-100 text-primary-800'
                            : intent.signal === 'Localized search intent'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-background-200 text-foreground-650'
                        }`}>
                          {intent.momentum || (
                            intent.signal === 'Google Trends rising'
                              ? profile.ui.risingIntent
                              : intent.signal === 'Localized search intent'
                                ? profile.ui.localizedIntent
                                : profile.ui.relatedIntent
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      ))}

      <section className="border-t border-background-200 bg-foreground-950 text-background-50">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-300">{profile.ui.processEyebrow}</p>
          <h2 className="mt-2 max-w-3xl font-heading text-2xl font-semibold md:text-3xl">
            {profile.ui.processTitle}
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {profile.workflow.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-background-50/15 bg-background-50/5 p-5">
                <span className="text-3xl font-semibold text-primary-300">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-4 font-heading text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-background-200">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="series-faq" className="scroll-mt-28 border-b border-background-200 bg-background-100">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-16">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{profile.ui.faqEyebrow}</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-foreground-950 md:text-3xl">
              {profile.ui.faqTitle}
            </h2>
          </div>
          <div className="mt-8 divide-y divide-background-300 overflow-hidden rounded-xl border border-background-300 bg-background-50">
            {profile.faq.map((item, index) => (
              <details key={item.question} open={index === 0} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground-900">
                  {item.question}
                  <i className="ri-add-line text-xl text-primary-600 transition-transform group-open:rotate-45" aria-hidden="true" />
                </summary>
                <p className="mt-3 max-w-3xl pr-8 text-sm leading-6 text-foreground-600">{item.answer}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs text-foreground-500">
            <span className="font-semibold text-foreground-700">{profile.ui.sources}</span>
            {profile.officialSources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:text-primary-800"
              >
                {source.label}
                <i className="ri-external-link-line" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{profile.ui.continueEyebrow}</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-foreground-950">
              {profile.ui.continueTitle}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={localized(getSeriesModuleHref(product.id, 'events'))}
              className="inline-flex h-10 items-center rounded-md border border-primary-300 bg-background-50 px-4 text-sm font-semibold text-primary-800 hover:bg-primary-100"
            >
              {profile.ui.eventsCta}
            </Link>
            <Link
              to={localized(getSeriesModuleHref(product.id, 'tools'))}
              className="inline-flex h-10 items-center rounded-md bg-foreground-950 px-4 text-sm font-semibold text-background-50 hover:bg-foreground-800"
            >
              {profile.ui.toolsCta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
