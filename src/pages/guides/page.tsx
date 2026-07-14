import { type MouseEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { fetchGrandisGuideSectionPage, type GrandisGuideSection } from '@/services/liveContent';
import { prepareStaticHtmlForRender } from '@/services/sanitizeHtml';
import GuideScrollTopButton from './components/GuideScrollTopButton';
import GuideFreshnessBar from './components/GuideFreshnessBar';
import { useVersion } from '@/hooks/VersionContext';
import {
  clearGuideReadingProgress,
  readGuideReadingProgress,
  type GuideReadingProgress,
} from '@/services/guideReadingProgress';
import { translateStaticText } from '@/services/staticTranslation';

type GuideSectionKey = GrandisGuideSection;

const guideNavSections: Array<{
  key: GuideSectionKey;
  label: string;
  icon: string;
}> = [
  { key: 'content', label: 'Content', icon: 'ri-book-2-line' },
  { key: 'classes', label: 'Classes', icon: 'ri-sword-line' },
  { key: 'events', label: 'Events', icon: 'ri-calendar-event-line' },
];

export default function GuidesPage() {
  const { t, i18n } = useTranslation();
  const { version, versionInfo } = useVersion();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notifOpen, setNotifOpen] = useState(false);
  const [sourceSectionHtml, setSourceSectionHtml] = useState('');
  const [sectionHtml, setSectionHtml] = useState('');
  const [sectionError, setSectionError] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [sourceSyncedAt, setSourceSyncedAt] = useState<string>();
  const [applicableOnly, setApplicableOnly] = useState(true);
  const [continueReading, setContinueReading] = useState<GuideReadingProgress | null>(readGuideReadingProgress);
  const deferredContentLanguage = useDeferredValue(i18n.language);
  const activeSection = guideNavSections.find((section) => section.key === searchParams.get('section')) || guideNavSections[0];

  const setGuideSection = (section: GuideSectionKey) => {
    setSearchParams({ section });
  };

  useEffect(() => {
    let cancelled = false;
    setSectionLoading(true);
    setSectionError(false);
    setSourceSectionHtml('');
    setSectionHtml('');

    void fetchGrandisGuideSectionPage(activeSection.key)
      .then((page) => {
        if (cancelled) return;
        setSourceSectionHtml(page.html);
        setSectionHtml(page.html);
        setSourceSyncedAt(page.sourceSyncedAt);
        setSectionLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setSectionHtml('');
          setSourceSectionHtml('');
          setSourceSyncedAt(undefined);
          setSectionError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setSectionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSection.key]);

  useEffect(() => {
    if (!sourceSectionHtml) return;
    let cancelled = false;
    void translateStaticText(sourceSectionHtml, deferredContentLanguage, {
      sourceLanguage: 'en',
      format: 'html',
    }).then((localizedHtml) => {
      if (!cancelled) setSectionHtml(localizedHtml);
    }).catch(() => {
      if (!cancelled) setSectionHtml(sourceSectionHtml);
    });
    return () => { cancelled = true; };
  }, [deferredContentLanguage, sourceSectionHtml]);

  useEffect(() => {
    const refreshProgress = () => setContinueReading(readGuideReadingProgress());
    window.addEventListener('focus', refreshProgress);
    window.addEventListener('storage', refreshProgress);
    return () => {
      window.removeEventListener('focus', refreshProgress);
      window.removeEventListener('storage', refreshProgress);
    };
  }, []);

  const sourceAppliesToCurrentVersion = version === 'gms';
  const showSourceContent = Boolean(sectionHtml) && (!applicableOnly || sourceAppliesToCurrentVersion);
  const renderedSectionHtml = useMemo(
    () => sectionHtml ? prepareStaticHtmlForRender(sectionHtml) : '',
    [sectionHtml],
  );

  const handleGrandisPageClick = useCallback((event: MouseEvent<HTMLElement>) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    if (href.startsWith('/guides')) {
      event.preventDefault();
      navigate(href);
      return;
    }

    if (href.startsWith('#')) {
      event.preventDefault();
      const target = document.getElementById(href.replace(/^#/, ''));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar
        onOpenNotifications={() => setNotifOpen(true)}
        unread={0}
        guideMenu={{
          value: activeSection.key,
          options: guideNavSections.map((section) => ({
            value: section.key,
            label: section.label,
            icon: section.icon,
          })),
          onSelect: (value) => setGuideSection(value as GuideSectionKey),
        }}
      />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <section className="border-b border-background-200 bg-background-100 px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">{t('guides_eyebrow')}</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground-950 md:text-5xl">{t('guides_player_guides_title')}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-600">{t('guides_player_guides_desc')}</p>

            <div className="mt-5">
              <GuideFreshnessBar sourceSyncedAt={sourceSyncedAt} versions={['gms']} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-background-300 bg-background-50 p-1" role="group" aria-label={t('guides_applicability_filter')}>
                <button
                  type="button"
                  aria-pressed={applicableOnly}
                  onClick={() => setApplicableOnly(true)}
                  className={`min-h-10 rounded-md px-4 text-sm font-semibold ${applicableOnly ? 'bg-primary-600 text-white' : 'text-foreground-700 hover:bg-background-100'}`}
                >
                  {t('guides_for_current_version', { version: versionInfo.shortLabel })}
                </button>
                <button
                  type="button"
                  aria-pressed={!applicableOnly}
                  onClick={() => setApplicableOnly(false)}
                  className={`min-h-10 rounded-md px-4 text-sm font-semibold ${!applicableOnly ? 'bg-primary-600 text-white' : 'text-foreground-700 hover:bg-background-100'}`}
                >
                  {t('guides_all_sources')}
                </button>
              </div>
              <span className="text-xs text-foreground-600">{t('guides_filter_truth_note')}</span>
            </div>

            {continueReading && (
              <div className="mt-5 flex flex-col gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary-700">{t('guides_continue_reading')}</p>
                  <p className="mt-1 truncate font-heading text-lg font-semibold text-foreground-950">{continueReading.title}</p>
                  <p className="text-xs text-foreground-600">{t('guides_continue_section', { section: continueReading.section })}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearGuideReadingProgress();
                      setContinueReading(null);
                    }}
                    className="min-h-10 rounded-full border border-background-300 px-4 text-sm font-semibold text-foreground-700 hover:bg-background-100"
                  >
                    {t('guides_continue_clear')}
                  </button>
                  <Link
                    to={`${continueReading.path}${continueReading.hash || ''}`}
                    className="inline-flex min-h-10 items-center rounded-full bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    {t('guides_continue_action')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {showSourceContent ? (
          <article
            className="grandis-page-content static-article-content"
            onClick={handleGrandisPageClick}
            dangerouslySetInnerHTML={{ __html: renderedSectionHtml }}
          />
        ) : sectionHtml && applicableOnly && !sourceAppliesToCurrentVersion ? (
          <section className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
            <i className="ri-filter-off-line mb-4 text-5xl text-primary-500" aria-hidden="true"></i>
            <h2 className="font-heading text-2xl font-semibold text-foreground-950">{t('guides_no_applicable_title', { version: versionInfo.shortLabel })}</h2>
            <p className="mt-3 text-sm leading-6 text-foreground-600">{t('guides_no_applicable_desc')}</p>
            <button type="button" onClick={() => setApplicableOnly(false)} className="mt-5 min-h-11 rounded-full bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700">
              {t('guides_show_gms_source')}
            </button>
          </section>
        ) : (
          <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
            <i className={`${sectionLoading ? 'ri-loader-4-line animate-spin' : 'ri-book-open-line'} mb-4 text-5xl text-primary-500`}></i>
            <h2 className="font-heading text-3xl font-semibold text-foreground-950">
              {sectionLoading
                ? t('guide_section_loading')
                : activeSection.label}
            </h2>
            <p className="mt-4 text-sm leading-6 text-foreground-600">
              {sectionError ? t('guide_section_error') : t('guide_section_loading_tip')}
            </p>
          </section>
        )}
      </main>

      <GuideScrollTopButton />
      <Footer />
    </div>
  );
}
