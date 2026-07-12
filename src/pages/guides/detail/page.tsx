import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import RealtimeStatus from '@/components/feature/RealtimeStatus';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { getGuideCardCopy } from '../localizedGuides';
import { fetchLiveGuideContent, fetchLiveGuides, liveStorageKeys, type GuideItem } from '@/services/liveContent';
import { sanitizeMirroredHtml } from '@/services/sanitizeHtml';
import GuideScrollTopButton from '../components/GuideScrollTopButton';
import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion } from '@/domain/regionModel';
import GuideFreshnessBar from '../components/GuideFreshnessBar';
import { writeGuideReadingProgress } from '@/services/guideReadingProgress';

const sectionId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';

const titleFromSlug = (value: string) =>
  value
    .replace(/^(?:(?:content|events)-)+/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const grandisClassGroupPaths = [
  'explorers',
  'cygnus-knights',
  'heroes',
  'resistance',
  'nova',
  'sengoku',
  'flora',
  'anima',
  'jianghu',
  'shine',
  'other',
];

const guideNavSections = [
  { key: 'content', label: 'Content', icon: 'ri-book-2-line' },
  { key: 'classes', label: 'Classes', icon: 'ri-sword-line' },
  { key: 'events', label: 'Events', icon: 'ri-calendar-event-line' },
];

const guideDetailCacheMs = 24 * 60 * 60 * 1000;
const guideDetailCacheVersion = 'v4';

const guideDetailCacheKey = (guide: GuideItem) =>
  `maplehub-guide-detail-cache:${guideDetailCacheVersion}:${guide.id}:${guide.sourceUrl || ''}`;

const readGuideDetailCache = (guide: GuideItem) => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(guideDetailCacheKey(guide));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; guide?: GuideItem };
    if (!parsed?.guide?.contentHtml || typeof parsed.savedAt !== 'number') return null;
    const contentHtml = sanitizeMirroredHtml(parsed.guide.contentHtml);
    if (!contentHtml) return null;
    return {
      guide: {
        ...parsed.guide,
        contentHtml,
        sourceSyncedAt: parsed.guide.sourceSyncedAt || new Date(parsed.savedAt).toISOString(),
      },
      fresh: Date.now() - parsed.savedAt < guideDetailCacheMs,
    };
  } catch {
    return null;
  }
};

const writeGuideDetailCache = (guide: GuideItem) => {
  if (typeof window === 'undefined' || !guide.contentHtml) return;

  const contentHtml = sanitizeMirroredHtml(guide.contentHtml);
  if (!contentHtml) return;
  try {
    window.localStorage.setItem(guideDetailCacheKey(guide), JSON.stringify({
      savedAt: Date.now(),
      guide: { ...guide, contentHtml },
    }));
  } catch {
    // Detail cache is best-effort; the page can still render from memory.
  }
};

const grandisSectionForPath = (path: string): GuideItem['guideSection'] | null => {
  const firstPart = path
    .replace(/^\/?contents?(?=\/|$)/i, 'content')
    .replace(/^\/?events?(?=\/|$)/i, 'events')
    .split('/')
    .filter(Boolean)[0] || '';
  if (firstPart === 'content') return 'Content';
  if (firstPart === 'events') return 'Events';
  if (grandisClassGroupPaths.includes(firstPart)) return 'Classes';
  return null;
};

const normalizedGrandisHostname = (hostname: string) => hostname.replace(/^www\./i, '').toLowerCase();

const normalizedGrandisPath = (pathname: string) =>
  (pathname
    .replace(/\/+$/, '')
    .replace(/^\/contents?(?=\/|$)/i, '/content')
    .replace(/^\/events?(?=\/|$)/i, '/events') || '');

const grandisGuideSlugForPath = (path: string) => {
  const parts = normalizedGrandisPath(path).split('/').filter(Boolean);
  const section = grandisSectionForPath(parts.join('/'));
  if (!section) return sectionId(path);
  if (section === 'Content' || section === 'Events') return sectionId(parts.slice(1).join('/'));
  return sectionId(parts.join('/'));
};

const grandisGuideIdForPath = (path: string) => {
  const section = grandisSectionForPath(path);
  return section ? `grandis-${section.toLowerCase()}-${grandisGuideSlugForPath(path)}` : null;
};

const grandisGuideFromId = (guideId?: string): GuideItem | null => {
  const match = guideId?.match(/^grandis-(content|events|classes)-(.+)$/);
  if (!match) return null;

  const [, sectionKey, slug] = match;
  const pathSlug = sectionKey === 'content'
    ? slug.replace(/^(?:content-)+/, '')
    : sectionKey === 'events' ? slug.replace(/^(?:events-)+/, '') : slug;
  const classGroupPath = grandisClassGroupPaths.find((group) => pathSlug.startsWith(`${group}-`));
  const sourcePath = sectionKey === 'classes' && classGroupPath
    ? `${classGroupPath}/${pathSlug.slice(classGroupPath.length + 1)}`
    : sectionKey === 'classes' ? pathSlug : `${sectionKey}/${pathSlug}`;
  const title = titleFromSlug(slug);
  const guideSection = sectionKey === 'events' ? 'Events' : sectionKey === 'classes' ? 'Classes' : 'Content';

  return {
    id: guideId,
    title,
    class: guideSection,
    guideSection,
    difficulty: 'Intermediate',
    length: 'Live',
    upvotes: 0,
    author: 'Grandis Library',
    versions: ['gms'],
    image: 'https://grandislibrary.com/headers/verdel.png',
    excerpt: `${title} from Grandis Library.`,
    sourceLabel: 'Grandis Library',
    sourceUrl: `https://grandislibrary.com/${sourcePath}`,
  };
};

const localGrandisGuidePath = (href: string, sourceUrl: string) => {
  if (href.startsWith('/guides/')) return href;
  if (href.startsWith('#')) return href;

  try {
    const url = new URL(href, sourceUrl);
    if (normalizedGrandisHostname(url.hostname) !== 'grandislibrary.com') return null;

    const source = new URL(sourceUrl);
    const path = normalizedGrandisPath(url.pathname);
    const sourcePath = normalizedGrandisPath(source.pathname);
    if (path === sourcePath && url.hash) return url.hash;

    if (!path || path === '/content') return '/guides?section=content';
    if (path === '/classes') return '/guides?section=classes';
    if (path === '/events') return '/guides?section=events';

    const guideId = grandisGuideIdForPath(path);
    if (!guideId) return null;

    return `/guides/${guideId}${url.hash}`;
  } catch {
    return null;
  }
};

export default function GuideDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { version } = useVersion();
  const [notifOpen, setNotifOpen] = useState(false);
  const [hydratedGuide, setHydratedGuide] = useState<GuideItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(() => new Set());
  const openAccordionsRef = useRef<Set<string>>(new Set());
  const articleContentRef = useRef<HTMLDivElement | null>(null);
  const {
    items: realtimeGuides,
    liveCount,
    lastSyncedAt,
    status: realtimeStatus,
    syncNow,
  } = useRealtimeCollection<GuideItem>({
    storageKey: liveStorageKeys.guides,
    baseItems: [],
    remoteLoader: fetchLiveGuides,
  });

  const guideCard = useMemo(
    () => {
      if (!id) return null;
      const candidate = realtimeGuides.find((item) => item.id === id) || grandisGuideFromId(id);
      return candidate && isAvailableInVersion(candidate.versions, version) ? candidate : null;
    },
    [id, realtimeGuides, version],
  );
  const guide = hydratedGuide?.id === guideCard?.id ? hydratedGuide : guideCard;
  const activeGuideSection = guideNavSections.find((section) => section.label === (guide?.guideSection || 'Content')) || guideNavSections[0];
  const backToGuideSectionLabel = t('guide_back_to_section', { section: activeGuideSection.label });
  const relatedGuides = useMemo(
    () => realtimeGuides
      .filter((item) => item.id !== id && isAvailableInVersion(item.versions, version))
      .slice(0, 4),
    [id, realtimeGuides, version],
  );
  const isInitialGuidesSync = realtimeStatus === 'syncing' && realtimeGuides.length === 0;
  const copy = guide ? getGuideCardCopy(guide, i18n.language) : null;
  const sourceUrl = guide?.sourceUrl || 'https://grandislibrary.com/';

  const scrollToGuideHash = useCallback((hash: string, behavior: 'auto' | 'smooth' = 'smooth') => {
    if (!hash || typeof window === 'undefined') return;
    const rawId = hash.replace(/^#/, '');
    if (!rawId) return;

    const scroll = (scrollBehavior: 'auto' | 'smooth') => {
      const target = document.getElementById(rawId);
      if (!target) return;

      const top = target.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(0, top), behavior: scrollBehavior });
    };

    window.requestAnimationFrame(() => scroll(behavior));
    [250, 750, 1500, 2500].forEach((delay) => {
      window.setTimeout(() => scroll('auto'), delay);
    });
  }, []);

  const articleHeadings = useMemo(() => {
    if (!guide?.contentHtml || typeof window === 'undefined') return [];
    const doc = new DOMParser().parseFromString(guide.contentHtml, 'text/html');
    return Array.from(doc.querySelectorAll('h2, h3'))
      .map((heading) => ({
        id: heading.id || sectionId(heading.textContent || ''),
        title: heading.textContent?.trim() || '',
      }))
      .filter((heading) => heading.id && heading.title)
      .slice(0, 16);
  }, [guide?.contentHtml]);

  useEffect(() => {
    if (!guideCard?.sourceUrl) {
      setHydratedGuide(null);
      setDetailError('');
      return;
    }
    if (hydratedGuide?.id === guideCard.id && hydratedGuide.contentHtml) return;

    const cachedGuide = readGuideDetailCache(guideCard);
    if (cachedGuide) {
      setHydratedGuide(cachedGuide.guide);
      if (cachedGuide.fresh) {
        setDetailLoading(false);
        setDetailError('');
        return;
      }
    }

    let cancelled = false;
    setDetailLoading(!cachedGuide);
    setDetailError('');
    void fetchLiveGuideContent(guideCard)
      .then((nextGuide) => {
        if (!cancelled) {
          setHydratedGuide(nextGuide);
          writeGuideDetailCache(nextGuide);
        }
      })
      .catch(() => {
        if (!cancelled) {
          if (!cachedGuide) setHydratedGuide(null);
          setDetailError(t('guide_load_error'));
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [guideCard, hydratedGuide?.contentHtml, hydratedGuide?.id, i18n.language, t]);

  useEffect(() => {
    if (!guide?.contentHtml || !location.hash) return;
    scrollToGuideHash(location.hash, 'auto');
  }, [guide?.contentHtml, location.hash, scrollToGuideHash]);

  useEffect(() => {
    openAccordionsRef.current = new Set();
    setOpenAccordions(new Set());
  }, [guideCard?.id]);

  useEffect(() => {
    if (!guide?.id || !copy?.title) return undefined;
    let frame = 0;
    let lastHash = '';

    const persistProgress = () => {
      frame = 0;
      const headings = articleContentRef.current
        ? Array.from(articleContentRef.current.querySelectorAll<HTMLElement>('h2[id], h3[id]'))
        : [];
      const activeHeading = headings
        .filter((heading) => heading.getBoundingClientRect().top <= 140)
        .at(-1);
      const routeHash = window.location.hash;
      const routeHeading = routeHash ? headings.find((heading) => heading.id === routeHash.slice(1)) : null;
      const hash = routeHeading ? routeHash : activeHeading?.id ? `#${activeHeading.id}` : '';
      if (hash === lastHash && lastHash) return;
      lastHash = hash;
      writeGuideReadingProgress({
        guideId: guide.id,
        title: copy.title,
        section: guide.guideSection || 'Content',
        path: `/guides/${guide.id}`,
        hash: hash || undefined,
        updatedAt: new Date().toISOString(),
      });
    };

    const schedulePersist = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(persistProgress);
    };

    schedulePersist();
    window.addEventListener('scroll', schedulePersist, { passive: true });
    window.addEventListener('hashchange', schedulePersist);
    window.addEventListener('pagehide', persistProgress);
    return () => {
      window.removeEventListener('scroll', schedulePersist);
      window.removeEventListener('hashchange', schedulePersist);
      window.removeEventListener('pagehide', persistProgress);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [copy?.title, guide?.contentHtml, guide?.guideSection, guide?.id]);

  const applyAccordionState = useCallback(() => {
    const root = articleContentRef.current;
    if (!root) return;

    root.querySelectorAll<HTMLElement>('.MuiAccordion-root').forEach((accordion, index) => {
      const key = String(index);
      accordion.dataset.mapleAccordionKey = key;
      const isOpen = openAccordionsRef.current.has(key);
      const summary = accordion.querySelector<HTMLElement>('.MuiAccordionSummary-root');
      const collapse = accordion.querySelector<HTMLElement>('.MuiCollapse-root');
      accordion.classList.toggle('maplehub-accordion-open', isOpen);
      summary?.setAttribute('aria-expanded', String(isOpen));
      if (collapse) {
        collapse.classList.toggle('MuiCollapse-hidden', !isOpen);
        collapse.classList.toggle('MuiCollapse-entered', isOpen);
        if (isOpen) collapse.removeAttribute('hidden');
        else collapse.setAttribute('hidden', '');
        collapse.style.display = isOpen ? 'block' : 'none';
        collapse.style.minHeight = isOpen ? '' : '0px';
        collapse.style.height = isOpen ? 'auto' : '0px';
        collapse.style.overflow = isOpen ? 'visible' : 'hidden';
      }
    });
  }, []);

  useEffect(() => {
    openAccordionsRef.current = new Set(openAccordions);
    applyAccordionState();
  }, [applyAccordionState, guide?.contentHtml, openAccordions]);

  useEffect(() => {
    const root = articleContentRef.current;
    if (!root) return;

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(applyAccordionState);
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
    });
    applyAccordionState();

    return () => observer.disconnect();
  }, [applyAccordionState, guide?.contentHtml]);

  const handleArticleClick = (event: MouseEvent<HTMLDivElement>) => {
    const accordionSummary = (event.target as HTMLElement).closest<HTMLElement>('.MuiAccordionSummary-root');
    if (accordionSummary) {
      const accordion = accordionSummary.closest<HTMLElement>('.MuiAccordion-root');
      if (accordion && articleContentRef.current) {
        event.preventDefault();
        event.stopPropagation();
        const accordions = Array.from(articleContentRef.current.querySelectorAll<HTMLElement>('.MuiAccordion-root'));
        const key = accordion.dataset.mapleAccordionKey || String(Math.max(0, accordions.indexOf(accordion)));
        setOpenAccordions((current) => {
          const next = new Set(current);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          openAccordionsRef.current = next;
          return next;
        });
        window.requestAnimationFrame(applyAccordionState);
      }
      return;
    }

    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!anchor || !guide?.sourceUrl) return;

    const localPath = localGrandisGuidePath(anchor.getAttribute('href') || anchor.href, guide.sourceUrl);
    if (!localPath) return;

    event.preventDefault();
    if (localPath.startsWith('#')) {
      navigate(`${location.pathname}${location.search}${localPath}`);
      scrollToGuideHash(localPath);
      return;
    }

    navigate(localPath);
    const hash = localPath.includes('#') ? `#${localPath.split('#').slice(1).join('#')}` : '';
    if (hash && localPath.startsWith(`${location.pathname}#`)) {
      scrollToGuideHash(hash);
    }
  };

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar
        onOpenNotifications={() => setNotifOpen(true)}
        unread={0}
        guideMenu={{
          value: activeGuideSection.key,
          options: guideNavSections.map((section) => ({
            value: section.key,
            label: section.label,
            icon: section.icon,
          })),
          onSelect: (value) => navigate(`/guides?section=${value}`),
        }}
      />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <section className="relative mb-14 h-80 overflow-hidden">
          <img
            src={guide?.image || 'https://grandislibrary.com/headers/verdel.png'}
            alt={copy?.title || 'Grandis Library'}
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-foreground-950/35"></div>
        </section>

        <section className="mx-auto max-w-5xl px-4 md:px-8">
          {!guide ? (
            <div className="mx-auto max-w-2xl py-20 text-center text-foreground-500">
              <RealtimeStatus
                status={realtimeStatus}
                lastSyncedAt={lastSyncedAt}
                liveCount={liveCount}
                onRefresh={syncNow}
              />
              <i className={`${isInitialGuidesSync ? 'ri-loader-4-line animate-spin' : 'ri-book-open-line'} mt-10 mb-4 block text-5xl`}></i>
              <p className="text-lg font-semibold text-foreground-950">
                {isInitialGuidesSync ? t('guides_loading') : t('guides_no_items', { version: 'Grandis Library' })}
              </p>
              <p className="mt-1 text-sm">{isInitialGuidesSync ? t('guides_loading_tip') : t('guides_no_items_tip')}</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <Link
                  to={`/guides?section=${activeGuideSection.key}`}
                  className="inline-flex items-center gap-2 border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-bold text-primary-800 shadow-[0_0.12rem_0.25rem_rgba(255,90,31,0.16)] transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-100"
                >
                  <i className="ri-arrow-left-line text-base"></i>
                  {backToGuideSectionLabel}
                </Link>
                <h1 className="mt-5 font-heading text-5xl font-semibold text-foreground-950 md:text-6xl">{copy?.title}</h1>
                <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-foreground-600">{guide.excerpt}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-foreground-500">
                  <span>{copy?.classLabel}</span>
                  <span>•</span>
                  <span>{t('guides_read_time_estimate', { time: copy?.length })}</span>
                  <span>•</span>
                  <span>Grandis Library</span>
                </div>
                <div className="mx-auto mt-5 max-w-3xl text-left">
                  <GuideFreshnessBar sourceSyncedAt={guide.sourceSyncedAt} versions={guide.versions} />
                </div>
              </div>

              <div className="mx-auto mt-10 max-w-3xl rounded-none border border-background-200 bg-background-50 p-4 shadow-[0_0.1rem_0.1rem_rgba(0,0,0,0.08),0_0.2rem_0.2rem_rgba(0,0,0,0.06)]">
                <RealtimeStatus
                  status={realtimeStatus}
                  lastSyncedAt={lastSyncedAt}
                  liveCount={liveCount}
                  onRefresh={syncNow}
                />
              </div>

              {articleHeadings.length > 0 && (
                <div className="mx-auto mt-10 max-w-3xl rounded-none border border-background-200 bg-background-50 p-5 shadow-[0_0.1rem_0.1rem_rgba(0,0,0,0.08),0_0.2rem_0.2rem_rgba(0,0,0,0.06)]">
                  <h2 className="mb-4 text-center font-heading text-3xl font-semibold">Quick Jumps</h2>
                  <ul className="grid gap-2 text-sm text-primary-700 md:grid-cols-3">
                    {articleHeadings.map((section) => (
                      <li key={section.id}>
                        <a href={`#${section.id}`} className="underline-offset-2 hover:underline">
                          {section.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <article className="grandis-article-content mx-auto mt-12 max-w-4xl">
                {detailLoading && guide.contentHtml && (
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
                    <i className="ri-loader-4-line animate-spin"></i>
                    {t('guide_loading_full')}
                  </div>
                )}
                {guide.contentHtml ? (
                  <div
                    ref={articleContentRef}
                    onClick={handleArticleClick}
                    dangerouslySetInnerHTML={{ __html: sanitizeMirroredHtml(guide.contentHtml) }}
                  />
                ) : (
                  <div className="mx-auto flex min-h-72 max-w-2xl flex-col items-center justify-center py-16 text-center text-foreground-600">
                    <i className={`${detailLoading ? 'ri-loader-4-line animate-spin' : 'ri-book-open-line'} mb-4 text-4xl text-primary-600`}></i>
                    <h2 className="font-heading text-2xl font-semibold text-foreground-950">
                      {t('guide_loading_status')}
                    </h2>
                    <p className="mt-3 text-sm leading-6">
                      {detailError || t('guide_loading_tip_text')}
                    </p>
                  </div>
                )}
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-none bg-primary-500 px-4 py-2 text-sm font-semibold text-background-50 hover:bg-primary-600"
                >
                  Open on Grandis Library
                  <i className="ri-external-link-line"></i>
                </a>
              </article>

              {relatedGuides.length > 0 && (
                <section className="mt-16 pb-10">
                  <h2 className="mb-8 text-center font-heading text-4xl font-semibold text-foreground-950">Popular Content</h2>
                  <div className="grid gap-4 md:grid-cols-4">
                    {relatedGuides.map((item) => {
                      const relatedCopy = getGuideCardCopy(item, i18n.language);
                      return (
                        <Link
                          key={item.id}
                          to={`/guides/${item.id}`}
                          className="block rounded-none border border-background-200 bg-background-50 shadow-[0_0.1rem_0.1rem_rgba(0,0,0,0.08),0_0.2rem_0.2rem_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                        >
                          <img src={item.image} alt={relatedCopy.title} className="h-28 w-full object-cover" />
                          <div className="p-3">
                            <div className="text-sm font-semibold text-foreground-950">{relatedCopy.title}</div>
                            <div className="mt-1 text-xs text-foreground-500">{relatedCopy.classLabel}</div>
                            <div className="mt-2 inline-flex rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold text-accent-800">GMS</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      </main>
      <GuideScrollTopButton />
    </div>
  );
}
