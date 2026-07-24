import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { useVersion } from '@/hooks/VersionContext';
import { localizeHref, normalizeLanguage } from '@/i18n/languageRouting';
import {
  getHelpCenterProfile,
  getHelpTopic,
  getHelpTopicArticleProfile,
} from './helpContent';

export default function HelpTopicPage({
  initialSeriesId = '',
  initialTopicId = '',
}: {
  initialSeriesId?: string;
  initialTopicId?: string;
} = {}) {
  const params = useParams<{ seriesId?: string; topicId: string }>();
  const topicId = params.topicId || initialTopicId;
  const { i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const language = normalizeLanguage(i18n.language);
  const profile = getHelpCenterProfile(language);
  const topic = getHelpTopic(language, topicId);
  const articleProfile = getHelpTopicArticleProfile(language, topicId);
  const seriesId = topic?.seriesId || params.seriesId || initialSeriesId || 'maplestory-pc';
  const helpHref = localizeHref(`/help/series/${seriesId}`, language, versionInfo.id);

  if (!topic) {
    return (
      <div className="min-h-screen bg-background-50 text-foreground-900">
        <Navbar onOpenNotifications={() => setNotificationsOpen(true)} unread={0} />
        <NotificationDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        <main id="main-content" className="mx-auto max-w-4xl px-4 pb-20 pt-28 text-center md:px-8 md:pt-36">
          <h1 className="font-heading text-3xl font-semibold text-foreground-950">{profile.noResults}</h1>
          <Link
            to={helpHref}
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <i className="ri-arrow-left-line" aria-hidden="true"></i>
            {profile.backToHelp}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const title = articleProfile?.title || topic.question;
  const description = articleProfile?.description || topic.answer[0];
  const sections = articleProfile?.sections || [{
    title: profile.answerTitle,
    paragraphs: topic.answer,
  }];
  const relatedTopics = profile.topics
    .filter((candidate) => candidate.id !== topic.id && candidate.seriesId === topic.seriesId)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotificationsOpen(true)} unread={0} />
      <NotificationDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <header className="border-b border-background-200 bg-gradient-to-br from-background-100 via-background-50 to-primary-50 px-4 py-10 md:px-8 md:py-16">
          <div className="mx-auto max-w-4xl">
            <Link
              to={helpHref}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              <i className="ri-arrow-left-line" aria-hidden="true"></i>
              {profile.backToHelp}
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-primary-100 px-3 py-1 text-primary-700">{topic.series}</span>
              {topic.server && (
                <span className="rounded-full bg-background-200 px-3 py-1 text-foreground-700">
                  {topic.server.toUpperCase()}
                </span>
              )}
              <span className="rounded-full border border-background-300 bg-background-50 px-3 py-1 text-foreground-700">
                {profile.categories[topic.category]}
              </span>
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary-700">
              {articleProfile?.eyebrow || profile.eyebrow}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight text-foreground-950 md:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-foreground-700">{description}</p>
          </div>
        </header>

        <article className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-heading text-2xl font-semibold text-foreground-950 md:text-3xl">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-8 text-foreground-700">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>
            ))}

            <section className="rounded-3xl border border-background-200 bg-background-100 p-6 md:p-8">
              <h2 className="font-heading text-2xl font-semibold text-foreground-950">{profile.stepsTitle}</h2>
              <ol className="mt-5 space-y-4">
                {topic.steps.map((step, index) => (
                  <li key={step} className="flex gap-4 text-sm leading-7 text-foreground-800 md:text-base">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-sm font-bold text-secondary-800">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            {articleProfile?.faq.length ? (
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground-950">{profile.faqTitle}</h2>
                <div className="mt-5 space-y-3">
                  {articleProfile.faq.map((item) => (
                    <details key={item.question} className="group rounded-2xl border border-background-200 bg-background-50 p-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground-950">
                        {item.question}
                        <i className="ri-add-line text-xl text-primary-600 transition-transform group-open:rotate-45" aria-hidden="true"></i>
                      </summary>
                      <p className="mt-4 text-sm leading-7 text-foreground-700">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border border-primary-200 bg-primary-50 p-6 md:p-8">
              <div className="flex gap-4">
                <i className="ri-shield-check-line mt-1 text-2xl text-primary-700" aria-hidden="true"></i>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-foreground-950">{profile.sourceTitle}</h2>
                  <p className="mt-2 text-sm leading-7 text-foreground-700">{profile.sourceNote}</p>
                  <Link
                    to={localizeHref(topic.href, language, topic.server || versionInfo.id)}
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    {topic.cta}
                    <i className="ri-arrow-right-line" aria-hidden="true"></i>
                  </Link>
                </div>
              </div>
            </section>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground-500">{profile.trendLabel}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(articleProfile?.keywords || topic.keywords).map((keyword) => (
                  <span key={keyword} className="rounded-md bg-background-100 px-3 py-1.5 text-xs text-foreground-700">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>

            {relatedTopics.length > 0 && (
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground-950">{profile.relatedTitle}</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {relatedTopics.map((related) => (
                    <Link
                      key={related.id}
                      to={localizeHref(`/help/series/${related.seriesId}/${related.id}`, language, related.server || versionInfo.id)}
                      className="rounded-2xl border border-background-200 bg-background-50 p-5 font-semibold leading-7 text-foreground-900 transition hover:border-primary-300 hover:text-primary-700 hover:shadow-sm"
                    >
                      {related.question}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
