import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { isGameVersion } from '@/domain/regionModel';
import { fetchOfficialArticleDocument, type OfficialArticleDocument } from '@/services/liveContent';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import { getNewsSourceLanguageForVersion, normalizeNewsLanguage } from '@/pages/news/localizedNews';
import NewsOriginalLanguageNotice from '@/pages/news/NewsOriginalLanguageNotice';
import { useTranslatedOfficialDocument } from './useTranslatedOfficialDocument';

export default function OfficialSourcePage() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const [notifOpen, setNotifOpen] = useState(false);
  const [article, setArticle] = useState<OfficialArticleDocument | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const title = params.get('title')?.trim() || t('source_mirror_label');
  const sourceUrl = params.get('url') || '';
  const rawServer = params.get('server');
  const server = isGameVersion(rawServer) ? rawServer : 'gms';
  const sourceLanguage = getNewsSourceLanguageForVersion(server);
  const articleUsesOriginalLanguage = normalizeNewsLanguage(i18n.language) !== sourceLanguage;
  const translatedDocument = useTranslatedOfficialDocument(article, sourceLanguage, i18n.language);
  const displayedArticle = translatedDocument.article;

  usePageMetadata(title, t('source_mirror_label'));

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setArticle(null);
    if (!sourceUrl) {
      setStatus('unavailable');
      return () => { active = false; };
    }

    void fetchOfficialArticleDocument(sourceUrl, server)
      .then((result) => {
        if (!active) return;
        setArticle(result);
        setStatus(result.html || result.text ? 'ready' : 'unavailable');
      })
      .catch(() => {
        if (active) setStatus('unavailable');
      });
    return () => { active = false; };
  }, [server, sourceUrl]);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
      <main id="main-content" tabIndex={-1} className="px-4 pb-16 pt-24 md:px-8 md:pt-28">
        <article className="mx-auto max-w-4xl">
          <Link to="/news" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800">
            <i className="ri-arrow-left-line" aria-hidden="true" />
            {t('source_back_news')}
          </Link>
          <div className="mt-6 rounded-2xl border border-background-200 bg-background-50 p-5 shadow-sm md:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-700">
              <i className="ri-file-copy-2-line" aria-hidden="true" />
              {t('source_mirror_label')} · {server.toUpperCase()}
            </div>
            <h1 className="mt-3 font-heading text-2xl font-semibold text-foreground-950 md:text-4xl">{title}</h1>
            {articleUsesOriginalLanguage && translatedDocument.status === 'unavailable' && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                <NewsOriginalLanguageNotice sourceLanguage={sourceLanguage} className="text-amber-900" />
              </div>
            )}
            {translatedDocument.status === 'translating' && (
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-primary-700" role="status">
                <i className="ri-loader-4-line animate-spin" aria-hidden="true" />
                {t('source_translating')}
              </div>
            )}
            {translatedDocument.status === 'needs-action' && (
              <button
                type="button"
                onClick={translatedDocument.retry}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-full bg-primary-500 px-4 text-sm font-semibold text-background-50 hover:bg-primary-600"
              >
                <i className="ri-translate-2" aria-hidden="true" />
                {t('source_translate')}
              </button>
            )}

            {status === 'loading' && (
              <div className="py-16 text-center text-sm text-foreground-600" role="status">
                <i className="ri-loader-4-line mr-2 animate-spin" aria-hidden="true" />{t('source_loading')}
              </div>
            )}
            {status === 'unavailable' && (
              <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" role="alert">
                {t('source_unavailable')}
              </div>
            )}
            {status === 'ready' && displayedArticle?.html && (
              <div
                className="mt-8 space-y-4 text-sm leading-7 text-foreground-800 [&_a]:text-primary-700 [&_a]:underline [&_h1]:mt-8 [&_h1]:text-2xl [&_h2]:mt-8 [&_h2]:text-xl [&_h3]:mt-6 [&_h3]:text-lg [&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_li]:ml-5 [&_li]:list-disc [&_p]:my-4 [&_table]:w-full [&_table]:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: displayedArticle.html }}
              />
            )}
            {status === 'ready' && displayedArticle && !displayedArticle.html && (
              <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-foreground-800">{displayedArticle.text}</div>
            )}

            {sourceUrl && (
              <div className="mt-10 border-t border-background-200 pt-4 text-xs text-foreground-500">
                {t('source_official_link')}: <span className="break-all">{sourceUrl}</span>
              </div>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
