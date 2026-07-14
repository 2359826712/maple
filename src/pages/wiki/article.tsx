import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { fetchWikiEntryByTitleLocalFirst, fetchWikiEntryContent, type WikiEntry } from '@/services/liveContent';
import { prepareStaticHtmlForRender } from '@/services/sanitizeHtml';
import ShareButton from '@/components/feature/ShareButton';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import { useTranslatedWikiEntry } from './useTranslatedWikiEntry';

const articleTitleKeys: Record<string, string> = {
  Classes: 'wiki_art_classes',
  'Link Skill': 'wiki_art_link_skill',
  'Legion System': 'wiki_art_legion',
  'Arcane River': 'wiki_art_arcane_river',
  Grandis: 'wiki_art_grandis',
  Bosses: 'wiki_art_bosses',
  'Black Mage': 'wiki_art_black_mage',
  Lucid: 'wiki_art_lucid',
  Will: 'wiki_art_will',
  Lotus: 'wiki_art_lotus',
  Gloom: 'wiki_art_gloom',
  'Guardian Angel Slime': 'wiki_art_gas',
  Magnus: 'wiki_art_magnus',
  Damien: 'wiki_art_damien',
  'Star Force': 'wiki_art_star_force',
  Potential: 'wiki_art_potential',
  'Hexa Matrix': 'wiki_art_hexa_matrix',
  Equipment: 'wiki_art_equipment',
  Locations: 'wiki_art_locations',
};

export default function WikiArticlePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { '*': legacyTitleParam, articlePath } = useParams<{ '*': string; articlePath: string }>();
  const [notifOpen, setNotifOpen] = useState(false);
  const [entry, setEntry] = useState<WikiEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgLoadFailed, setImgLoadFailed] = useState(false);

  const titleParam = articlePath || legacyTitleParam;
  const title = titleParam ? decodeURIComponent(titleParam).replace(/_/g, ' ') : '';

  // Detect File: namespace pages
  const isFilePage = title.startsWith('File:');
  const preferredTitle = entry && articleTitleKeys[entry.title] ? t(articleTitleKeys[entry.title]) : undefined;
  const translatedEntry = useTranslatedWikiEntry(entry, isFilePage ? 'en' : i18n.language, preferredTitle);
  const displayTitle = translatedEntry.title || title;
  const htmlContent = translatedEntry.htmlContent;
  const textContent = translatedEntry.textContent;
  const renderedHtmlContent = useMemo(
    () => htmlContent ? prepareStaticHtmlForRender(htmlContent) : '',
    [htmlContent],
  );

  // Primary: construct CDN URL directly from the File: title
  // All wiki images are hosted at media.maplestorywiki.net/yetidb/{filename}
  const constructedCdnUrl = useMemo(() => {
    if (!isFilePage) return null;
    const filename = title.slice(5).trim(); // remove "File:" prefix
    if (!filename) return null;
    return `https://media.maplestorywiki.net/yetidb/${encodeURIComponent(filename.replace(/ /g, '_'))}`;
  }, [isFilePage, title]);

  // Fallback: extract image URL from parsed HTML content
  const htmlExtractedUrl = useMemo(() => {
    if (!isFilePage || !htmlContent) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const fullImg = doc.querySelector('.fullImageLink img, .mw-file-description img');
    if (fullImg) {
      const src = fullImg.getAttribute('src');
      if (src) return src.startsWith('//') ? `https:${src}` : src;
    }
    const imgs = doc.querySelectorAll('img[src]');
    let best: { src: string; area: number } | null = null;
    imgs.forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (!src) return;
      const w = parseInt(img.getAttribute('width') || '0', 10);
      const h = parseInt(img.getAttribute('height') || '0', 10);
      const area = w * h;
      if (area > (best?.area ?? 0)) {
        best = { src: src.startsWith('//') ? `https:${src}` : src, area };
      }
    });
    if (best) return best.src;
    const cdnMatch = htmlContent.match(/(?:https?:)?\/\/(?:media\.maplestorywiki\.net|upload\.wikimedia\.org|static\.wikia\.nocookie\.net)\/[^"'\s<>]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^"'\s<>]*)?/i);
    return cdnMatch?.[0]?.startsWith('//') ? `https:${cdnMatch[0]}` : cdnMatch?.[0] ?? null;
  }, [htmlContent, isFilePage]);

  // Effective image URL: CDN construction is primary (deterministic from filename), HTML extraction is fallback
  const effectiveFileImageUrl = useMemo(() => {
    if (constructedCdnUrl && !imgLoadFailed) return constructedCdnUrl;
    if (htmlExtractedUrl) return htmlExtractedUrl;
    return null;
  }, [htmlExtractedUrl, constructedCdnUrl, imgLoadFailed]);

  const fileFullUrl = useMemo(() => {
    if (!isFilePage || !entry?.htmlContent) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.htmlContent, 'text/html');
    const link = doc.querySelector('.fullImageLink > a[href], .mw-file-description > a[href]');
    if (link) {
      const href = link.getAttribute('href') || '';
      return href.startsWith('//') ? `https:${href}` : href;
    }
    return null;
  }, [isFilePage, entry?.htmlContent]);

  // Detect raw wikitext in htmlContent (mirror may store unrendered markup)
  const looksLikeWikitext = (html: string | undefined) => {
    if (!html) return false;
    // Always catch redirect pages regardless of length
    if (/#REDIRECT\s+\[\[/i.test(html)) return true;
    if (html.length < 50) return false;
    // Count wiki-specific patterns: templates, wiki links, section headers
    const wikiPatterns = [
      ...(html.match(/\{\{[^}]+\}\}/g) ?? []),
      ...(html.match(/\[\[[^\]]+\]\]/g) ?? []),
      ...(html.match(/^={2,}[^=]+=+\s*$/gm) ?? []),
    ];
    if (wikiPatterns.length >= 3) return true;
    // Fallback: if only HTML tags with no wiki syntax, it's fine
    const hasWikiSyntax = /\{\{[A-Z]/.test(html) || /\[\[[A-Z]/.test(html);
    const hasRealHtml = /<[a-z][\s\S]*>/i.test(html);
    return hasWikiSyntax && !hasRealHtml;
  };

  useEffect(() => {
    if (!title) {
      setError(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    void fetchWikiEntryByTitleLocalFirst(title)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setEntry(result);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [title]);

  // Handle wiki redirect pages (#REDIRECT [[Target]] and rendered HTML redirects)
  useEffect(() => {
    if (!entry) return;
    const contentToCheck = entry.htmlContent || entry.content || '';

    // Pattern 1: Raw wikitext redirect
    const rawRedirect = contentToCheck.match(/#REDIRECT\s+\[\[([^\]]+)\]\]/i)
      || contentToCheck.match(/^redirect\s*\[\[([^\]]+)\]\]/im);

    // Pattern 2: Rendered HTML redirect (MediaWiki renders redirects with redirect notice)
    let htmlRedirect: string | null = null;
    if (!rawRedirect && entry.htmlContent) {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(entry.htmlContent, 'text/html');

      // Only match page-level redirect notices, NOT inline links with mw-redirect class
      // .redirectMsg = MediaWiki's rendered redirect page (e.g. "Hexa Matrix" -> "HEXA Matrix")
      // .redirectnotice / .mw-redirect-notice = redirect notice banners
      const redirectEl = doc.querySelector('.redirectMsg, .redirectnotice, .mw-redirect-notice, #redirectsub');
      if (redirectEl) {
        const link = redirectEl.querySelector('a[href]') || redirectEl.closest('a[href]');
        if (link) {
          htmlRedirect = link.textContent?.trim() || null;
        }
      }

      // Fallback: check if body text starts with "Redirect to:" or just "Redirect" followed by a link
      if (!htmlRedirect) {
        const bodyText = (doc.body?.textContent?.trim() || '').substring(0, 200);
        if (/^redirect(?:\s+to)?:?\s/i.test(bodyText)) {
          const firstLink = doc.querySelector('a[href]');
          htmlRedirect = firstLink?.textContent?.trim() || null;
        }
      }

      // Fallback: very short page with just a link (likely a redirect page)
      if (!htmlRedirect) {
        const bodyText = doc.body?.textContent?.trim() || '';
        if (bodyText.length > 0 && bodyText.length < 200 && doc.querySelectorAll('a[href]').length <= 2) {
          const redirectMatch = bodyText.match(/redirect(?:\s+to)?:?\s*(.+)/i);
          if (redirectMatch) {
            const link = doc.querySelector('a[href]');
            htmlRedirect = link?.textContent?.trim() || redirectMatch[1].trim();
          }
        }
      }
    }

    const target = rawRedirect?.[1]?.trim().replace(/\s+/g, ' ') || htmlRedirect;
    if (!target) return;

    // Avoid infinite redirect loop (exact match - MediaWiki is case-sensitive)
    if (target === title) return;

    navigate(`/wiki/article/${encodeURIComponent(target)}`, { replace: true });
  }, [entry, title, navigate]);

  // Hydrate HTML content if needed (missing or raw wikitext from mirror)
  useEffect(() => {
    if (!entry || !entry.sourceKey) return;
    if (entry.htmlContent && !looksLikeWikitext(entry.htmlContent)) return;

    let cancelled = false;
    setHydrating(true);
    void fetchWikiEntryContent(entry)
      .then((hydrated) => {
        if (!cancelled) setEntry(hydrated);
      })
      .catch(() => {
        // keep original entry
      })
      .finally(() => {
        if (!cancelled) setHydrating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entry]);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  // Reset img error state when title changes
  useEffect(() => { setImgLoadFailed(false); }, [title]);

  const handleArticleClick = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    let url: URL;
    try {
      url = new URL(href, window.location.origin);
    } catch {
      return;
    }

    const isLocalWikiLink = url.origin === window.location.origin &&
      (url.pathname === '/wiki' || url.pathname.startsWith('/wiki/'));
    const isSourceWikiLink = url.hostname === 'maplestorywiki.net';
    if (!isLocalWikiLink && !isSourceWikiLink) return;

    const titleFromWikiPath = url.pathname.match(/^\/(?:wiki\/article\/|wiki\/|w\/)(.+)$/)?.[1] ?? null;
    const titleFromQuery = url.searchParams.get('title');
    const rawTitle = titleFromWikiPath || titleFromQuery;
    if (!rawTitle) return;

    event.preventDefault();
    const decoded = decodeURIComponent(rawTitle).replace(/_/g, ' ');
    navigate(`/wiki/article/${encodeURIComponent(decoded)}`);
  };

  usePageMetadata(
    displayTitle || 'MapleStory Wiki',
    (textContent || `MapleStory wiki information about ${displayTitle}.`).slice(0, 180),
    { type: 'article' },
  );

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <div className="mx-auto flex w-full max-w-[1500px]">
          {/* Sidebar */}
          <aside className="hidden w-56 shrink-0 px-5 py-6 text-[13px] text-foreground-950 lg:block">
            <div className="mb-7 border-b border-background-300 pb-4">
              <Link to="/wiki" className="font-serif text-xl font-normal text-primary-600 hover:underline">
                MapleStory Wiki
              </Link>
              <div className="mt-1 text-xs text-foreground-600">A knowledge base about everything MapleStory</div>
            </div>

            <nav className="space-y-4">
              <Link to="/wiki" className="block py-1 text-primary-600 hover:underline">
                {t('wiki_article_back_home')}
              </Link>

              <div>
                <div className="mb-2 border-b border-background-100 pb-1 text-xs font-semibold text-foreground-600">
                  {t('wiki_article_tools')}
                </div>
                <div className="space-y-1 text-primary-600">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="block w-full py-0.5 text-left hover:underline"
                  >
                    {t('wiki_article_print')}
                  </button>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <section className="min-w-0 flex-1 border-l border-background-300 bg-white px-4 py-5 md:px-8 md:py-7">
            {/* Tabs */}
            <div className="mb-3 flex flex-col gap-3 border-b border-background-300 pb-0 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-5 text-sm">
                <button type="button" className="border-b-2 border-foreground-950 px-1 pb-2 font-semibold text-foreground-950">
                  {t('wiki_article_read')}
                </button>
              </div>

              <div className="mb-2 flex min-w-0 items-center gap-2">
                <div className="flex h-9 min-w-0 flex-1 items-center border border-background-300 bg-white md:w-80">
                  <i className="ri-search-line px-2 text-foreground-600"></i>
                  <input
                    placeholder={t('wiki_search_placeholder')}
                    className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const q = (e.target as HTMLInputElement).value.trim();
                        if (q) navigate(`/wiki?q=${encodeURIComponent(q)}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Article */}
            {loading ? (
              <div className="flex items-center gap-3 py-20 text-foreground-600">
                <i className="ri-loader-4-line animate-spin text-2xl"></i>
                <span className="text-sm">
                  {t('wiki_article_loading')}
                </span>
              </div>
            ) : isFilePage ? (
              /* File: pages always show the file viewer, even without mirror/API data */
              <article>
                <h1 className="font-serif text-3xl font-normal leading-tight text-foreground-950 md:text-[2.1rem]">
                  {title}
                </h1>
                <div className="mt-1 text-sm text-foreground-600">
                  From the MapleStory Wiki, mirrored inside MPStorys
                </div>

                <div className="mt-5 mb-6">
                  <div className="border border-background-300 bg-background-50">
                    {effectiveFileImageUrl ? (
                      <div className="flex flex-col items-center p-5">
                        <button
                          type="button"
                          onClick={() => setLightboxOpen(true)}
                          className="group relative cursor-zoom-in"
                        >
                          <img
                            src={effectiveFileImageUrl}
                            alt={title}
                            className="max-h-[520px] max-w-full object-contain"
                            loading="eager"
                            decoding="async"
                            onError={() => setImgLoadFailed(true)}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="rounded bg-black/60 px-3 py-1.5 text-sm text-white">
                              {t('wiki_file_view_full')}
                            </span>
                          </div>
                        </button>
                        <div className="mt-4 flex items-center gap-4 text-sm">
                          {fileFullUrl && (
                            <a
                              href={fileFullUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-primary-600 hover:underline"
                            >
                              <i className="ri-external-link-line text-xs"></i>
                              {t('wiki_file_view_full')}
                            </a>
                          )}
                          <a
                            href={`https://maplestorywiki.net/w/${encodeURIComponent(title.replace(/\s+/g, '_'))}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary-600 hover:underline"
                          >
                            <i className="ri-external-link-line text-xs"></i>
                            {t('wiki_file_open_external')}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="px-5 py-10 text-center text-sm text-foreground-600">
                        <i className="ri-image-line mb-2 block text-3xl text-background-300"></i>
                        <p>{t('wiki_file_no_preview')}</p>
                        <a
                          href={`https://maplestorywiki.net/w/${encodeURIComponent(title.replace(/\s+/g, '_'))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-primary-600 hover:underline"
                        >
                          {t('wiki_file_open_external')}
                        </a>
                      </div>
                    )}
                  </div>
                  {entry && htmlContent && !looksLikeWikitext(htmlContent) ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-foreground-600 hover:text-foreground-950">
                        {t('wiki_file_description')}
                      </summary>
                      <div
                        className="wiki-article-content wiki-vector-article static-article-content mt-3 border-t border-background-100 pt-4"
                        onClick={handleArticleClick}
                        dangerouslySetInnerHTML={{ __html: renderedHtmlContent }}
                      />
                    </details>
                  ) : entry && textContent ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-foreground-600 hover:text-foreground-950">
                        {t('wiki_file_description')}
                      </summary>
                      <p className="mt-3 whitespace-pre-line border-t border-background-100 pt-4 text-sm text-foreground-700">
                        {textContent}
                      </p>
                    </details>
                  ) : null}
                </div>
              </article>
            ) : error || !entry ? (
              <div className="border border-background-300 bg-background-50 px-6 py-16 text-center">
                <i className="ri-file-warning-line mb-3 block text-4xl text-background-300"></i>
                <p className="text-lg font-serif text-foreground-950">
                  {t('wiki_article_not_found')}
                </p>
                <p className="mt-2 text-sm text-foreground-600">
                  {t('wiki_article_not_found_desc', { title })}
                </p>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <a
                    href={`https://maplestorywiki.net/w/${encodeURIComponent(title.replace(/\s+/g, '_'))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-sm text-primary-600 hover:underline"
                  >
                    {t('wiki_article_open_external')}
                  </a>
                  <Link to="/wiki" className="inline-block text-sm text-primary-600 hover:underline">
                    {t('wiki_article_back_wiki')}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <article>
                  <h1 className="font-serif text-3xl font-normal leading-tight text-foreground-950 md:text-[2.1rem]">
                    {displayTitle}
                  </h1>
                  <div className="mt-1 text-sm text-foreground-600">
                    {t('wiki_article_from_source', 'From the MapleStory Wiki, mirrored inside MPStorys')}
                    {entry.lastSynced && (
                      <span className="ml-2 text-foreground-400">
                        · {t('wiki_article_synced', 'Synced')} {entry.lastSynced.slice(0, 10)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <ShareButton title={displayTitle} text={(textContent || '').slice(0, 140)} />
                  </div>
                  <div
                    className="wiki-article-content wiki-vector-article wiki-mainpage-article static-article-content mt-5"
                    onClick={handleArticleClick}
                  >
                    {htmlContent && !looksLikeWikitext(htmlContent) ? (
                      <div dangerouslySetInnerHTML={{ __html: renderedHtmlContent }} />
                    ) : hydrating ? (
                      <div className="flex items-center gap-3 py-20 text-foreground-600">
                        <i className="ri-loader-4-line animate-spin text-2xl"></i>
                        <span className="text-sm">{t('wiki_article_loading')}</span>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 flex items-start gap-3 rounded border border-foreground-400 bg-amber-50 px-4 py-3 text-sm text-foreground-600">
                          <i className="ri-error-warning-line mt-0.5 text-amber-700"></i>
                          <div>
                            <span className="text-foreground-950">
                              {t('wiki_article_parse_warning', 'This article could not be fully rendered. Showing plain text from the mirror.')}
                            </span>
                            <a
                              href={`https://maplestorywiki.net/w/${encodeURIComponent(title.replace(/\s+/g, '_'))}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 text-primary-600 hover:underline"
                            >
                              {t('wiki_article_view_original', 'View on MapleStory Wiki')}
                              <i className="ri-external-link-line ml-1 text-xs"></i>
                            </a>
                          </div>
                        </div>
                        <p className="whitespace-pre-line">{textContent}</p>
                      </>
                    )}
                  </div>
                </article>

                {/* Sources footer */}
                {entry.sources && entry.sources.length > 0 && (
                  <div className="mt-8 border-t border-background-100 pt-4 text-xs text-foreground-600">
                    <span className="font-semibold">{t('wiki_article_source_label')}</span>
                    {entry.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.href}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 text-primary-600 hover:underline"
                      >
                        {src.label}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />

      {/* Lightbox overlay for File: page image preview */}
      {lightboxOpen && effectiveFileImageUrl && (
        <div
          className="fixed inset-0 z-[9999] flex cursor-zoom-out items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('wiki_file_preview')}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 text-white/70 hover:text-white"
            aria-label="Close"
          >
            <i className="ri-close-line text-3xl"></i>
          </button>
          <img
            src={effectiveFileImageUrl}
            alt={title}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            decoding="async"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
