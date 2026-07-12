import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCharacters } from '@/hooks/useCharacters';
import { useVersion } from '@/hooks/VersionContext';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import {
  fetchLiveNews,
  fetchLiveEvents,
  liveStorageKeys,
  type NewsItem,
  type EventItem,
} from '@/services/liveContent';
import { bosses } from '@/mocks/bosses';
import { eligibleTasksForLevel } from '@/domain/checklistEligibility';
import {
  isAvailableInVersion,
  millisecondsUntilReset,
  daysUntilEventBoundary,
} from '@/domain/regionModel';
import {
  checklistTaskId,
  getBossChecklistRules,
  getTrackedDifficulty,
} from '@/domain/bossChecklistRules';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TodayInMapleSection() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const { activeCharacter, tasks, checklistConfig } = useCharacters();
  const [now, setNow] = useState(Date.now());

  // Tick every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime data
  const { items: newsItems, lastSyncedAt: newsSyncedAt, status: newsStatus } = useRealtimeCollection<NewsItem>({
    storageKey: liveStorageKeys.news,
    baseItems: [],
    remoteLoader: fetchLiveNews,
  });
  const { items: eventItems, lastSyncedAt: eventsSyncedAt, status: eventsStatus } = useRealtimeCollection<EventItem>({
    storageKey: liveStorageKeys.events,
    baseItems: [],
    remoteLoader: fetchLiveEvents,
  });

  // Checklist progress computation
  const checklistProgress = useMemo(() => {
    if (!activeCharacter) return null;

    const versionBosses = bosses.filter((b) => isAvailableInVersion(b.regions, version));
    const eligible = eligibleTasksForLevel(versionBosses, activeCharacter.level);
    const defaultIds = eligible.flatMap((boss) => {
      const rule = getBossChecklistRules(boss, version).at(-1);
      return rule ? [checklistTaskId(boss.id, rule.difficulty)] : [];
    });
    const selectedIds = new Set(checklistConfig?.selectedTaskIds ?? defaultIds);

    let totalDaily = 0;
    let doneDaily = 0;
    let totalWeekly = 0;
    let doneWeekly = 0;
    for (const boss of eligible) {
      const difficulty = getTrackedDifficulty(boss, selectedIds);
      const rule = getBossChecklistRules(boss, version).find((candidate) => candidate.difficulty === difficulty);
      if (!rule) continue;
      const done = Math.min(tasks[boss.id]?.[rule.difficulty] ?? 0, rule.clearLimit);
      if (rule.period === 'daily') {
        totalDaily += rule.clearLimit;
        doneDaily += done;
      } else {
        totalWeekly += rule.clearLimit;
        doneWeekly += done;
      }
    }

    return { totalDaily, doneDaily, totalWeekly, doneWeekly };
  }, [activeCharacter, tasks, checklistConfig, version]);

  // Urgent events: ending within 14 days, sorted by urgency
  const urgentEvents = useMemo(() => {
    return eventItems
      .filter((e) => isAvailableInVersion(e.regions, version))
      .filter((e) => {
        const daysLeft = daysUntilEventBoundary(e.windowStart, e.windowEnd, now);
        return daysLeft <= 14 && daysLeft >= 0;
      })
      .sort(
        (a, b) =>
          daysUntilEventBoundary(a.windowStart, a.windowEnd, now) -
          daysUntilEventBoundary(b.windowStart, b.windowEnd, now),
      )
      .slice(0, 2);
  }, [eventItems, version, now]);

  // Latest news (most recent first)
  const latestNews = useMemo(() => {
    return newsItems
      .filter((n) => isAvailableInVersion(n.versions, version))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 1);
  }, [newsItems, version]);

  const dailyCountdown = millisecondsUntilReset('daily', version, now);
  const characterDetails = [
    t('dashboard_character_level', { level: activeCharacter?.level ?? 0 }),
    activeCharacter?.className,
    activeCharacter?.world || activeCharacter?.server,
  ].filter(Boolean).join(' · ');
  const latestSync = [newsSyncedAt, eventsSyncedAt]
    .map((value) => value ? new Date(value).getTime() : Number.NaN)
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
  const updatedLabel = latestSync
    ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(latestSync))
    : null;

  // Don't render if no character configured
  if (!activeCharacter) return null;

  return (
    <section className="border-b border-background-200 bg-gradient-to-br from-primary-50 via-background-50 to-accent-50 dark:from-background-100 dark:via-background-50 dark:to-accent-950 pb-8 pt-24 md:pb-12 md:pt-28" aria-label={t('dashboard_title')}>
      <div className="w-full px-4 md:px-8">
        <div className="mx-auto mb-6 flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
              <i className="ri-dashboard-3-line" />
              {t('dashboard_title')}
            </div>
            <h1 className="mt-3 font-heading text-2xl font-semibold text-foreground-950 md:text-4xl">
              {t('dashboard_welcome', { name: activeCharacter.name })}
            </h1>
            <p className="mt-2 text-sm font-medium text-foreground-700">{characterDetails}</p>
            <p className="mt-1 max-w-2xl text-sm text-foreground-600 md:text-base">
              {t('dashboard_welcome_desc')}
            </p>
            {updatedLabel && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-foreground-500">
                <i className="ri-refresh-line" />
                {t('dashboard_updated', { time: updatedLabel })}
              </p>
            )}
          </div>
          <Link
            to="/mapler-house"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-primary-200 bg-background-50 px-4 text-sm font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-50"
          >
            <i className="ri-user-settings-line" />
            {t('dashboard_character_tools')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {/* Card 1: Daily Tasks */}
          <Link
            to="/checklist"
            className="group rounded-xl border border-background-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary-300"
            aria-label={t('dashboard_tasks_cta')}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-lg" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground-950">
                {t('dashboard_tasks_title')}
              </h3>
            </div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-background-100 px-2.5 py-1 text-[11px] font-medium text-foreground-600">
              <i className="ri-timer-line text-primary-600" />
              {t('dashboard_tasks_countdown', { time: formatCountdown(dailyCountdown) })}
            </div>
            {checklistProgress && checklistProgress.totalDaily > 0 ? (
              <>
                <div className="mb-2">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-foreground-600">
                      {t('dashboard_tasks_progress', {
                        done: checklistProgress.doneDaily,
                        total: checklistProgress.totalDaily,
                      })}
                    </span>
                    <span className="text-xs font-semibold text-primary-700">
                      {t('dashboard_tasks_remaining', {
                        count: Math.max(0, checklistProgress.totalDaily - checklistProgress.doneDaily),
                      })}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-background-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{
                        width: `${
                          checklistProgress.totalDaily > 0
                            ? Math.round(
                                (checklistProgress.doneDaily / checklistProgress.totalDaily) * 100,
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                {checklistProgress.totalWeekly > 0 && (
                  <p className="text-xs text-foreground-500">
                    {t('dashboard_tasks_progress', {
                      done: checklistProgress.doneWeekly,
                      total: checklistProgress.totalWeekly,
                    })}{' '}
                    · {t('checklist_type_weekly')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-foreground-500">{t('dashboard_tasks_empty')}</p>
            )}
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary-600 group-hover:text-primary-700">
              {t('dashboard_tasks_cta')}
              <i className="ri-arrow-right-s-line" />
            </span>
          </Link>

          {/* Card 2: Urgent Events */}
          <Link
            to="/events"
            className="group rounded-xl border border-background-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-accent-300"
            aria-label={t('dashboard_events_cta')}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center">
                <i className="ri-calendar-event-line text-lg" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground-950">
                {t('dashboard_events_title')}
              </h3>
            </div>
            {urgentEvents.length > 0 ? (
              <ul className="space-y-2">
                {urgentEvents.map((event) => {
                  const daysLeft = daysUntilEventBoundary(
                    event.windowStart,
                    event.windowEnd,
                    now,
                  );
                  return (
                    <li key={event.id} className="text-xs">
                      <p className="font-medium text-foreground-900 truncate">{event.name}</p>
                      <p className="text-foreground-500">
                        {daysLeft === 0
                          ? t('dashboard_events_ending_today')
                          : daysLeft === 1
                            ? t('dashboard_events_countdown', { days: daysLeft })
                            : t('dashboard_events_countdown_plural', { days: daysLeft })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-foreground-500">
                {eventsStatus === 'unavailable' && !eventsSyncedAt ? t('content_live_not_verified') : t('dashboard_events_empty')}
              </p>
            )}
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent-600 group-hover:text-accent-700">
              {t('dashboard_events_cta')}
              <i className="ri-arrow-right-s-line" />
            </span>
          </Link>

          {/* Card 3: Latest News */}
          <Link
            to="/news"
            className="group rounded-xl border border-background-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-secondary-300"
            aria-label={t('dashboard_news_all')}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary-100 text-secondary-800 flex items-center justify-center">
                <i className="ri-newspaper-line text-lg" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground-950">
                {t('dashboard_news_title')}
              </h3>
            </div>
            {latestNews.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-foreground-900 line-clamp-2 mb-1">
                  {latestNews[0].title}
                </p>
                <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-background-100 text-foreground-600">
                  {latestNews[0].category}
                </span>
              </div>
            ) : (
              <p className="text-xs text-foreground-500">
                {newsStatus === 'unavailable' && !newsSyncedAt ? t('content_live_not_verified') : t('dashboard_news_empty')}
              </p>
            )}
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary-700 group-hover:text-secondary-800">
              {t('dashboard_news_all')}
              <i className="ri-arrow-right-s-line" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
