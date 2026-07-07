import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion, VERSIONS } from '@/hooks/VersionContext';
import Navbar from '@/pages/home/components/Navbar';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { guideDetail, comments, relatedGuides } from '@/mocks/guide-detail';
import { trendingGuides } from '@/mocks/home';
import { communityLinks } from '@/constants/communityLinks';
import RealtimeStatus from '@/components/feature/RealtimeStatus';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import TableOfContents from './components/TableOfContents';
import AuthorBio from './components/AuthorBio';
import CommentSection from './components/CommentSection';
import RelatedGuides from './components/RelatedGuides';
import { getGuideCardCopy, getGuideDetailCopy } from '../localizedGuides';

const calloutIcons: Record<string, string> = {
  warning: 'ri-error-warning-line',
  tip: 'ri-lightbulb-flash-line',
  info: 'ri-information-2-line',
};

const calloutStyles: Record<string, string> = {
  warning: 'bg-primary-50 border-primary-200 text-foreground-900',
  tip: 'bg-accent-50 border-accent-200 text-foreground-900',
  info: 'bg-background-100 border-background-300 text-foreground-900',
};

const calloutIconColors: Record<string, string> = {
  warning: 'text-primary-600',
  tip: 'text-accent-600',
  info: 'text-foreground-700',
};

interface ContentBlock {
  type: string;
  text?: string;
  variant?: string;
  items?: string[];
  style?: string;
  headers?: string[];
  rows?: string[][];
}

type GuideItem = (typeof trendingGuides)[number];

const createGuideDetailFromCard = (guide: GuideItem) => ({
  ...guideDetail,
  id: guide.id,
  title: guide.title,
  slug: guide.id,
  version: guide.versions[0] ?? 'gms',
  author: {
    ...guideDetail.author,
    name: guide.author,
    bio: `${guide.author} maintains this guide from the live MapleHub guide feed.`,
  },
  classLabel: guide.class,
  difficulty: guide.difficulty,
  readTime: guide.length,
  published: 'Live feed',
  updated: 'Live update',
  upvotes: guide.upvotes,
  tags: [guide.class, guide.difficulty, ...guide.versions.map((version) => version.toUpperCase())],
  cover: guide.image,
  summary: `${guide.title} is maintained from the live guide feed. The page updates automatically when the remote guide source changes.`,
  toc: [
    { id: 'overview', title: 'Live overview' },
    { id: 'version-notes', title: 'Version notes' },
    { id: 'next-steps', title: 'Next steps' },
  ],
  sections: [
    {
      id: 'overview',
      title: 'Live overview',
      content: [
        {
          type: 'paragraph',
          text: `This guide is synced from the realtime guide collection and is currently tagged for ${guide.class}.`,
        },
        {
          type: 'list',
          style: 'unordered',
          items: [
            `Difficulty: ${guide.difficulty}`,
            `Estimated read time: ${guide.length}`,
            `Maintainer: ${guide.author}`,
          ],
        },
      ],
    },
    {
      id: 'version-notes',
      title: 'Version notes',
      content: [
        {
          type: 'paragraph',
          text: `Available versions: ${guide.versions.map((version) => version.toUpperCase()).join(', ')}.`,
        },
      ],
    },
    {
      id: 'next-steps',
      title: 'Next steps',
      content: [
        {
          type: 'callout',
          variant: 'info',
          text: 'When a full guide body is published to the live feed, this page will refresh automatically.',
        },
      ],
    },
  ],
});

export default function GuideDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { versionInfo } = useVersion();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const {
    items: realtimeGuides,
    liveCount,
    lastSyncedAt,
    status: realtimeStatus,
    syncNow,
  } = useRealtimeCollection<GuideItem>({
    storageKey: 'maplehub-live-guides',
    baseItems: trendingGuides,
    remoteUrl: '/realtime/guides.json',
  });

  const liveGuideCard = useMemo(
    () => realtimeGuides.find((guide) => guide.id === id) ?? realtimeGuides.find((guide) => guide.id === guideDetail.id),
    [id, realtimeGuides],
  );

  const baseGuide = useMemo(() => {
    if (!liveGuideCard) return guideDetail;

    if (liveGuideCard.id !== guideDetail.id) return createGuideDetailFromCard(liveGuideCard);

    return {
      ...guideDetail,
      title: liveGuideCard.title,
      version: liveGuideCard.versions[0] ?? guideDetail.version,
      author: {
        ...guideDetail.author,
        name: liveGuideCard.author,
      },
      classLabel: liveGuideCard.class,
      difficulty: liveGuideCard.difficulty,
      readTime: liveGuideCard.length,
      upvotes: liveGuideCard.upvotes,
      tags: [liveGuideCard.class, liveGuideCard.difficulty, ...liveGuideCard.versions.map((version) => version.toUpperCase())],
      cover: liveGuideCard.image,
    };
  }, [liveGuideCard]);

  const guideCopy = baseGuide.id === guideDetail.id ? getGuideDetailCopy(baseGuide, i18n.language) : baseGuide;
  const guide = {
    ...baseGuide,
    ...guideCopy,
    author: baseGuide.author,
    cover: baseGuide.cover,
    slug: baseGuide.slug,
    version: baseGuide.version,
    published: baseGuide.published,
    updated: baseGuide.updated,
    upvotes: baseGuide.upvotes,
    tags: baseGuide.tags,
  };
  const guideVersion = VERSIONS.find((v) => v.id === guide.version);

  const filteredRelated = useMemo(() => {
    const liveRelated = realtimeGuides
      .filter((related) => related.id !== guide.id && related.versions.includes(versionInfo.id))
      .slice(0, 4)
      .map((related) => {
        const copy = getGuideCardCopy(related, i18n.language);

        return {
          id: related.id,
          title: copy.title,
          classLabel: copy.classLabel,
          difficulty: copy.difficulty,
          readTime: copy.length,
          author: related.author,
          upvotes: related.upvotes,
          versions: related.versions,
          image: related.image,
        };
      });

    return liveRelated.length > 0 ? liveRelated : relatedGuides.filter((g) => g.versions.includes(versionInfo.id));
  }, [guide.id, i18n.language, realtimeGuides, versionInfo.id]);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(height > 0 ? (winScroll / height) * 100 : 0);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const renderContent = (blocks: ContentBlock[]) => {
    return blocks.map((block, bi) => {
      switch (block.type) {
        case 'paragraph':
          return (
            <p key={bi} className="text-sm md:text-base text-foreground-800 leading-relaxed mb-5">
              {block.text}
            </p>
          );

        case 'list':
          if (block.style === 'ordered') {
            return (
              <ol key={bi} className="list-decimal pl-5 mb-5 space-y-2">
                {block.items?.map((item, ii) => (
                  <li key={ii} className="text-sm md:text-base text-foreground-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ol>
            );
          }
          return (
            <ul key={bi} className="list-disc pl-5 mb-5 space-y-2">
              {block.items?.map((item, ii) => (
                <li key={ii} className="text-sm md:text-base text-foreground-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          );

        case 'callout': {
          const v = block.variant || 'info';
          return (
            <div key={bi} className={`mb-5 p-4 rounded-lg border ${calloutStyles[v]} flex items-start gap-3`}>
              <i className={`${calloutIcons[v]} ${calloutIconColors[v]} text-lg mt-0.5`}></i>
              <p className="text-sm md:text-base leading-relaxed flex-1">{block.text}</p>
            </div>
          );
        }

        case 'table':
          return (
            <div key={bi} className="mb-5 overflow-x-auto rounded-lg border border-background-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background-100">
                    {block.headers?.map((h, hi) => (
                      <th key={hi} className="px-4 py-2.5 text-left text-xs font-semibold text-foreground-800 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows?.map((row, ri) => (
                    <tr key={ri} className="border-t border-background-200/70">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-2.5 text-foreground-800">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        default:
          return null;
      }
    });
  };

  return (
    <div className="min-h-screen bg-background-50">
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 z-50 h-1 bg-primary-500" style={{ width: `${scrollProgress}%` }}></div>

      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={3} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main className="w-full px-4 md:px-8 py-8 pt-20 md:pt-24">
        {/* Breadcrumb */}
        <nav className="text-xs text-foreground-600 mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-primary-700 cursor-pointer">{t('guide_breadcrumb_home')}</Link>
          <i className="ri-arrow-right-s-line"></i>
          <Link to="/#guides" className="hover:text-primary-700 cursor-pointer">{t('guide_breadcrumb_guides')}</Link>
          <i className="ri-arrow-right-s-line"></i>
          <span className="text-foreground-900 font-semibold">{guide.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left sidebar — Table of Contents */}
          <aside className="hidden lg:block lg:col-span-3">
            <TableOfContents items={guide.toc} />
          </aside>

          {/* Main content */}
          <div className="lg:col-span-6">
            {/* Cover */}
            <div className="rounded-xl overflow-hidden mb-6">
              <img src={guide.cover} alt={guide.title} className="w-full h-60 md:h-80 object-cover object-top" />
            </div>

            {/* Title & meta */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 text-[11px] font-semibold">{guide.classLabel}</span>
              <span className="px-2.5 py-1 rounded-full bg-accent-100 text-accent-800 text-[11px] font-semibold">{guide.difficulty}</span>
              <span className="text-[11px] text-foreground-600 flex items-center gap-1">
                <i className="ri-time-line"></i> {guide.readTime}
              </span>
              {guideVersion && (
                <span className="px-2.5 py-1 rounded-full bg-foreground-900/10 text-foreground-800 text-[11px] font-semibold border border-background-200">
                  <i className="ri-global-line mr-1"></i>
                  {guideVersion.shortLabel}
                </span>
              )}
            </div>

            {/* Article actions */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setBookmarked((v) => !v)}
                className={`h-9 px-3 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  bookmarked ? 'bg-primary-500 text-background-50' : 'bg-background-100 text-foreground-800 border border-background-200 hover:border-primary-300'
                }`}
              >
                <i className={bookmarked ? 'ri-bookmark-fill' : 'ri-bookmark-line'}></i>
                {bookmarked ? t('guide_saved') : t('guide_save')}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShareOpen((v) => !v)}
                  className="h-9 px-3 rounded-full bg-background-100 border border-background-200 text-foreground-800 text-xs font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1 hover:border-accent-300"
                >
                  <i className="ri-share-forward-line"></i> {t('guide_share')}
                </button>
                {shareOpen && (
                  <div className="absolute left-0 top-10 w-64 bg-background-50 border border-background-200 rounded-xl p-3 z-50 shadow-lg">
                    <div className="text-xs font-semibold text-foreground-950 mb-2">{t('guide_share_title')}</div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { icon: 'ri-twitter-x-line', label: 'X' },
                        { icon: 'ri-facebook-fill', label: 'FB' },
                        { icon: 'ri-discord-line', label: 'Disc' },
                        { icon: 'ri-link', label: 'Copy' },
                      ].map((s) => (
                        <button
                          key={s.label}
                          onClick={() => setShareOpen(false)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background-100 hover:bg-primary-50 hover:text-primary-700 cursor-pointer"
                        >
                          <i className={s.icon}></i>
                          <span className="text-[10px] font-semibold">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link
                to="/"
                className="h-9 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 text-xs font-semibold cursor-pointer whitespace-nowrap hidden sm:flex items-center gap-1"
              >
                <i className="ri-arrow-left-line"></i> {t('guide_breadcrumb_home')}
              </Link>
            </div>

            <h1 className="font-heading text-2xl md:text-4xl font-semibold text-foreground-950 leading-tight">
              {guide.title}
            </h1>
            <p className="mt-3 text-sm md:text-base text-foreground-700 leading-relaxed">
              {guide.summary}
            </p>

            <div className="mt-5">
              <RealtimeStatus
                status={realtimeStatus}
                lastSyncedAt={lastSyncedAt}
                liveCount={liveCount}
                onRefresh={syncNow}
              />
            </div>

            {/* Mobile TOC */}
            <details className="lg:hidden mt-4 rounded-xl border border-background-200 bg-background-100 overflow-hidden">
              <summary className="px-4 py-3 text-sm font-semibold text-foreground-950 cursor-pointer flex items-center gap-2">
                <i className="ri-list-unordered text-primary-600"></i>
                {t('guide_toc')}
                <i className="ri-arrow-down-s-line ml-auto"></i>
              </summary>
              <ul className="px-4 pb-3 space-y-1">
                {guide.toc.map((tocItem, i) => (
                  <li key={tocItem.id}>
                    <a href={`#${tocItem.id}`} className="block py-1.5 text-sm text-foreground-700 hover:text-primary-700 cursor-pointer">
                      {i + 1}. {tocItem.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>

            {/* Body */}
            <div className="mt-8">
              {guide.sections.map((section) => (
                <article key={section.id} id={section.id} className="mb-10 scroll-mt-24">
                  <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground-950 mb-4">
                    {section.title}
                  </h2>
                  {renderContent(section.content)}
                </article>
              ))}
            </div>

            {/* Like & share bar */}
            <div className="flex items-center justify-between py-6 border-t border-b border-background-200 my-8">
              <button
                onClick={() => setLiked((v) => !v)}
                className={`flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm cursor-pointer whitespace-nowrap ${
                  liked ? 'bg-primary-500 text-background-50' : 'bg-background-100 text-foreground-800 hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                <i className={liked ? 'ri-thumb-up-fill' : 'ri-thumb-up-line'}></i>
                {liked ? (guide.upvotes + 1).toLocaleString() : guide.upvotes.toLocaleString()}
                {liked ? ` — ${t('guide_liked')}` : ` — ${t('guide_like_prompt')}`}
              </button>
              <div className="flex items-center gap-2">
                <button className="h-9 w-9 rounded-full bg-background-100 hover:bg-accent-100 hover:text-accent-700 text-foreground-700 flex items-center justify-center cursor-pointer" aria-label="share-x">
                  <i className="ri-twitter-x-line"></i>
                </button>
                <button className="h-9 w-9 rounded-full bg-background-100 hover:bg-primary-100 hover:text-primary-700 text-foreground-700 flex items-center justify-center cursor-pointer" aria-label="share-discord">
                  <i className="ri-discord-line"></i>
                </button>
                <button className="h-9 w-9 rounded-full bg-background-100 hover:bg-secondary-100 hover:text-secondary-800 text-foreground-700 flex items-center justify-center cursor-pointer" aria-label="share-link">
                  <i className="ri-link"></i>
                </button>
              </div>
            </div>

            {/* Author bio */}
            <AuthorBio
              author={guide.author}
              published={guide.published}
              updated={guide.updated}
              upvotes={guide.upvotes}
              tags={guide.tags}
            />

            {/* Comment section */}
            <div className="mt-6">
              <CommentSection comments={comments} />
            </div>
          </div>

          {/* Right sidebar — Related guides */}
          <aside className="hidden lg:block lg:col-span-3">
            <RelatedGuides guides={filteredRelated} />
            <div className="mt-5 p-4 rounded-xl border border-background-200 bg-background-100 text-center">
              <i className="ri-question-answer-line text-2xl text-accent-600"></i>
              <p className="mt-2 text-xs text-foreground-700">{t('guide_discord_prompt')}</p>
              <a href={communityLinks.discord} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 h-9 px-4 rounded-full bg-accent-500 hover:bg-accent-600 text-background-50 dark:text-foreground-950 text-xs font-semibold cursor-pointer whitespace-nowrap">
                <i className="ri-discord-fill"></i> {t('guide_open_discord')}
              </a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
