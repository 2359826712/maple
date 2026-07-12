import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { useVersion } from '@/hooks/VersionContext';
import { getSiteSearchResults, type SearchSection } from '@/services/siteSearch';
import { telemetry } from '@/services/telemetry';
import UniversalSearchInput from '@/components/search/UniversalSearchInput';

const sectionStyles: Record<SearchSection, string> = {
  news: 'bg-primary-100 text-primary-700',
  guides: 'bg-accent-100 text-accent-700',
  events: 'bg-secondary-100 text-secondary-900',
  tools: 'bg-primary-100 text-primary-700',
  wiki: 'bg-accent-100 text-accent-700',
  maps: 'bg-secondary-100 text-secondary-900',
  bosses: 'bg-red-100 text-red-700',
};

export default function SearchPage() {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notifOpen, setNotifOpen] = useState(false);
  const query = searchParams.get('q') ?? '';
  const [draft, setDraft] = useState(query);

  const results = useMemo(
    () => getSiteSearchResults(query, i18n.language, versionInfo.id),
    [i18n.language, query, versionInfo.id],
  );

  const submitSearch = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      const searchStartedAt = performance.now();
      const submittedResults = getSiteSearchResults(trimmed, i18n.language, versionInfo.id);
      const searchDuration = performance.now() - searchStartedAt;
      const normalizedQuery = trimmed.toLowerCase();
      const canonicalResult = submittedResults.find((result) => result.title.trim().toLowerCase() === normalizedQuery);
      telemetry.trackSearch(trimmed.length, submittedResults.length, searchDuration, canonicalResult?.id);
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-20 md:pt-24">
        <section className="border-b border-background-200 bg-background-100/70">
          <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary-600 flex items-center gap-1.5">
              <i className="ri-search-line text-primary-500 text-sm"></i>
              {t('search_eyebrow')}
            </div>
            <h1 className="mt-3 font-heading text-3xl md:text-5xl font-semibold text-foreground-950">
              {t('search_page_title')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base text-foreground-600">
              {t('search_page_desc', { version: versionInfo.shortLabel })}
            </p>

            <div className="mt-6">
              <UniversalSearchInput
                value={draft}
                onChange={setDraft}
                onSubmit={submitSearch}
                placeholder={t('search_input_placeholder')}
                submitLabel={t('search_submit_btn')}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground-950">
                {query ? t('search_results_heading', { query }) : t('search_empty_heading')}
              </h2>
              <p className="mt-1 text-sm text-foreground-600">
                {query ? t('search_results_count', { count: results.length }) : t('search_hint_examples')}
              </p>
            </div>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setDraft('');
                  setSearchParams({});
                }}
                className="inline-flex items-center gap-1 rounded-full border border-background-300 px-3 py-1.5 text-sm text-foreground-700 hover:border-primary-300 hover:text-primary-700 cursor-pointer"
              >
                <i className="ri-close-line"></i>
                {t('search_clear_btn')}
              </button>
            )}
          </div>

          {query && results.length === 0 ? (
            <div className="rounded-xl border border-background-200 bg-background-100 py-16 text-center">
              <i className="ri-search-eye-line text-4xl text-foreground-300"></i>
              <p className="mt-3 font-semibold text-foreground-700">{t('search_no_results_title')}</p>
              <p className="mt-1 text-sm text-foreground-500">{t('search_no_results_hint')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {results.map((result) => (
                <Link
                  key={result.id}
                  to={result.href}
                  className="group rounded-xl border border-background-200 bg-background-50 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-background-100 text-primary-700 group-hover:bg-background-50">
                      <i className={`${result.icon} text-xl`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${sectionStyles[result.section]}`}>
                          {t(`search_section_${result.section}`)}
                        </span>
                        <i className="ri-arrow-right-up-line text-foreground-400 group-hover:text-primary-600"></i>
                      </div>
                      <h3 className="mt-2 font-heading text-lg font-semibold leading-snug text-foreground-950 group-hover:text-primary-700">
                        {result.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-foreground-600">{result.excerpt}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
