import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { useVersion } from '@/hooks/VersionContext';
import { localizeHref, normalizeLanguage } from '@/i18n/languageRouting';
import {
  getHelpCenterProfile,
  type HelpCategory,
  type HelpTopic,
} from './helpContent';

const categoryOrder: readonly HelpCategory[] = ['codes', 'access', 'events', 'progression', 'sources'];

const searchableText = (topic: HelpTopic) => [
  topic.question,
  topic.series,
  ...topic.answer,
  ...topic.steps,
  ...topic.keywords,
].join(' ').toLocaleLowerCase();

export default function HelpCenterPage() {
  const { i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const language = normalizeLanguage(i18n.language);
  const profile = getHelpCenterProfile(language);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredTopics = useMemo(
    () => normalizedQuery
      ? profile.topics.filter((topic) => searchableText(topic).includes(normalizedQuery))
      : profile.topics,
    [normalizedQuery, profile.topics],
  );
  const groupedTopics = categoryOrder
    .map((category) => ({
      category,
      topics: filteredTopics.filter((topic) => topic.category === category),
    }))
    .filter((group) => group.topics.length > 0);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotificationsOpen(true)} unread={0} />
      <NotificationDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <section className="border-b border-background-200 bg-gradient-to-br from-background-100 via-background-50 to-primary-50 px-4 py-10 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-700">{profile.eyebrow}</p>
              <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight text-foreground-950 md:text-5xl">
                {profile.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-foreground-700 md:text-base">
                {profile.description}
              </p>
            </div>

            <form
              role="search"
              className="mt-7 flex max-w-3xl items-center gap-3 rounded-2xl border border-background-300 bg-background-50 px-4 shadow-sm focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100"
              onSubmit={(event) => event.preventDefault()}
            >
              <i className="ri-search-line text-xl text-primary-600" aria-hidden="true"></i>
              <label htmlFor="help-search" className="sr-only">{profile.searchLabel}</label>
              <input
                id="help-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={profile.searchPlaceholder}
                className="h-14 min-w-0 flex-1 bg-transparent text-sm text-foreground-950 outline-none placeholder:text-foreground-500 md:text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-foreground-600 hover:bg-background-100 hover:text-foreground-950"
                  aria-label={language === 'zh'
                    ? '清除搜索'
                    : language === 'zh-Hant'
                      ? '清除搜尋'
                      : language === 'ja'
                        ? '検索をクリア'
                        : language === 'ko'
                          ? '검색 지우기'
                          : 'Clear search'}
                >
                  <i className="ri-close-line" aria-hidden="true"></i>
                </button>
              )}
            </form>

            <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50/80 p-4 text-sm leading-6 text-foreground-700">
              <div className="flex gap-3">
                <i className="ri-shield-check-line mt-0.5 text-lg text-primary-700" aria-hidden="true"></i>
                <p>{profile.sourceNote}</p>
              </div>
            </div>
          </div>
        </section>

        <nav
          aria-label={profile.faqTitle}
          className="sticky top-16 z-20 border-b border-background-200 bg-background-50/95 px-4 py-3 shadow-sm backdrop-blur md:top-20 md:px-8"
        >
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto pb-1">
            {categoryOrder.map((category) => (
              <a
                key={category}
                href={`#help-${category}`}
                className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-background-300 bg-background-50 px-4 text-sm font-semibold text-foreground-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                {profile.categories[category]}
              </a>
            ))}
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
          {groupedTopics.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-background-300 bg-background-100 px-6 py-16 text-center">
              <i className="ri-search-eye-line text-5xl text-primary-500" aria-hidden="true"></i>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-foreground-700">{profile.noResults}</p>
            </section>
          ) : (
            groupedTopics.map(({ category, topics }) => (
              <section
                key={category}
                id={`help-${category}`}
                className="scroll-mt-36 border-b border-background-200 py-9 first:pt-0 last:border-b-0"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                    <i
                      className={
                        category === 'codes'
                          ? 'ri-gift-line'
                          : category === 'access'
                            ? 'ri-computer-line'
                            : category === 'events'
                              ? 'ri-calendar-event-line'
                              : category === 'progression'
                                ? 'ri-route-line'
                                : 'ri-shield-keyhole-line'
                      }
                      aria-hidden="true"
                    ></i>
                  </span>
                  <h2 className="font-heading text-2xl font-semibold text-foreground-950 md:text-3xl">
                    {profile.categories[category]}
                  </h2>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {topics.map((topic) => (
                    <article
                      key={topic.id}
                      id={`answer-${topic.id}`}
                      className="scroll-mt-40 rounded-2xl border border-background-200 bg-background-50 p-5 shadow-sm transition-shadow hover:shadow-md md:p-6"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-primary-100 px-3 py-1 text-primary-700">{topic.series}</span>
                        {topic.server && (
                          <span className="rounded-full bg-background-200 px-3 py-1 text-foreground-700">
                            {topic.server.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 font-heading text-xl font-semibold leading-7 text-foreground-950">
                        {topic.question}
                      </h3>
                      <div className="mt-4 space-y-3 text-sm leading-7 text-foreground-700">
                        {topic.answer.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                      </div>

                      <ol className="mt-5 space-y-2">
                        {topic.steps.map((step, index) => (
                          <li key={step} className="flex gap-3 text-sm leading-6 text-foreground-800">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-xs font-bold text-secondary-800">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>

                      <div className="mt-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-500">
                          {profile.trendLabel}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {topic.keywords.map((keyword) => (
                            <span key={keyword} className="rounded-md bg-background-100 px-2.5 py-1 text-xs text-foreground-700">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link
                        to={localizeHref(`/help/${topic.id}`, language, topic.server || versionInfo.id)}
                        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                      >
                        {profile.readAnswer}
                        <i className="ri-arrow-right-line" aria-hidden="true"></i>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
