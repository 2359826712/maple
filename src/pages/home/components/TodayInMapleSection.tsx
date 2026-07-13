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
import { useRoutineTasks } from '@/hooks/useRoutineTasks';
import { useEventGoals } from '@/hooks/useEventGoals';
import {
  getNextBestActionHref,
  selectNextBestAction,
  type NextBestActionCandidate,
} from '@/domain/nextBestAction';

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
  const {
    activeCharacter,
    activeCharId,
    characters = [],
    setActiveCharId,
    tasks,
    checklistConfig,
  } = useCharacters();
  const [now, setNow] = useState(Date.now());
  const routines = useRoutineTasks(
    version,
    activeCharacter?.id ?? null,
    now,
    activeCharacter?.world || activeCharacter?.server || '',
  );
  const eventGoals = useEventGoals();

  // Tick every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime data
  const { items: newsItems, lastSyncedAt: newsSyncedAt, status: newsStatus } = useRealtimeCollection<NewsItem>({
    storageKey: `${liveStorageKeys.news}:${version}`,
    baseItems: [],
    remoteLoader: fetchLiveNews,
  });
  const { items: eventItems, lastSyncedAt: eventsSyncedAt, status: eventsStatus } = useRealtimeCollection<EventItem>({
    storageKey: `${liveStorageKeys.events}:${version}`,
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
  const weeklyCountdown = millisecondsUntilReset('weekly', version, now);
  const dailyRoutines = routines.selectedTasks.filter((task) => task.period === 'daily');
  const weeklyRoutines = routines.selectedTasks.filter((task) => task.period === 'weekly');
  const totalDailyTasks = (checklistProgress?.totalDaily ?? 0) + dailyRoutines.length;
  const doneDailyTasks = (checklistProgress?.doneDaily ?? 0) + dailyRoutines.filter(routines.isComplete).length;
  const totalWeeklyTasks = (checklistProgress?.totalWeekly ?? 0) + weeklyRoutines.length;
  const doneWeeklyTasks = (checklistProgress?.doneWeekly ?? 0) + weeklyRoutines.filter(routines.isComplete).length;
  const nextActionCandidates: NextBestActionCandidate[] = [
    ...routines.selectedTasks.map((task, index) => ({
      id: `routine:${task.id}`,
      titleKey: task.titleKey,
      period: task.period,
      scope: task.scope,
      remaining: routines.isComplete(task) ? 0 : 1,
      priority: index,
    })),
    {
      id: 'bosses:daily',
      titleKey: 'dashboard_next_daily_bosses',
      period: 'daily' as const,
      scope: 'character' as const,
      remaining: Math.max(0, (checklistProgress?.totalDaily ?? 0) - (checklistProgress?.doneDaily ?? 0)),
      priority: 100,
    },
    {
      id: 'bosses:weekly',
      titleKey: 'dashboard_next_weekly_bosses',
      period: 'weekly' as const,
      scope: 'character' as const,
      remaining: Math.max(0, (checklistProgress?.totalWeekly ?? 0) - (checklistProgress?.doneWeekly ?? 0)),
      priority: 100,
    },
    ...eventGoals.flatMap((goal): NextBestActionCandidate[] => {
      const dueInMs = Date.parse(goal.windowEnd) - now;
      if (!Number.isFinite(dueInMs) || dueInMs <= 0 || goal.rewardClaimed) return [];
      if (goal.requirementComplete) {
        return [{
          id: `event-claim:${goal.id}`,
          titleKey: 'dashboard_next_event_claim',
          period: 'daily',
          scope: 'account',
          remaining: 1,
          priority: -20,
          dueInMs,
        }];
      }
      if (goal.target <= 0 || goal.current >= goal.target) return [];
      return [{
        id: `event-pace:${goal.id}`,
        titleKey: 'dashboard_next_event_pace',
        period: 'daily',
        scope: 'account',
        remaining: goal.target - goal.current,
        priority: -10,
        dueInMs,
      }];
    }),
  ];
  const nextAction = selectNextBestAction({
    candidates: nextActionCandidates,
    dailyResetInMs: dailyCountdown,
    weeklyResetInMs: weeklyCountdown,
  });
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
            {characters.length > 1 && (
              <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-foreground-700">
                <span>{t('dashboard_roster_switch')}</span>
                <select
                  value={activeCharId ?? ''}
                  onChange={(event) => setActiveCharId(event.target.value)}
                  className="h-9 rounded-full border border-background-300 bg-white px-3 text-sm font-medium text-foreground-900"
                >
                  {characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name} · Lv. {character.level}
                    </option>
                  ))}
                </select>
                <span className="font-normal text-foreground-500">
                  {t('dashboard_roster_count', { count: characters.length })}
                </span>
              </label>
            )}
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
          <div className="flex flex-wrap gap-2">
            <Link
              to="/checklist#quick-actions"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-background-300 bg-background-50 px-4 text-sm font-semibold text-foreground-700 hover:border-primary-300 hover:bg-primary-50"
            >
              <i className="ri-download-cloud-2-line" />
              {t('dashboard_backup_data')}
            </Link>
            <Link
              to="/mapler-house"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-primary-200 bg-background-50 px-4 text-sm font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-50"
            >
              <i className="ri-user-settings-line" />
              {t('dashboard_character_tools')}
            </Link>
          </div>
        </div>

        {nextAction && (
          <Link
            to={getNextBestActionHref(nextAction)}
            className="group mx-auto mb-4 flex max-w-5xl flex-col gap-4 rounded-xl border border-primary-200 bg-white p-4 shadow-sm transition hover:border-primary-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            aria-label={t('dashboard_next_open', { task: t(nextAction.titleKey) })}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <i className="ri-focus-3-line text-lg" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">
                  {t('dashboard_next_eyebrow')}
                </p>
                <h2 className="mt-0.5 font-heading text-base font-semibold text-foreground-950 md:text-lg">
                  {t(nextAction.titleKey)}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-600">
                  <span className="inline-flex items-center gap-1">
                    <i className="ri-timer-line text-primary-600" aria-hidden="true" />
                    {t(
                      nextAction.period === 'daily'
                        ? 'dashboard_next_daily_reason'
                        : 'dashboard_next_weekly_reason',
                      { time: formatCountdown(nextAction.resetInMs) },
                    )}
                  </span>
                  <span className="rounded-full bg-background-100 px-2 py-0.5 font-semibold text-foreground-700">
                    {t(
                      nextAction.scope === 'account'
                        ? 'routine_scope_account'
                        : nextAction.scope === 'world'
                          ? 'routine_scope_world'
                          : 'routine_scope_character',
                    )}
                  </span>
                </div>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700">
              {t('dashboard_next_cta')}
              <i className="ri-arrow-right-line transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        )}

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
            {totalDailyTasks > 0 ? (
              <>
                <div className="mb-2">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-foreground-600">
                      {t('dashboard_tasks_progress', {
                        done: doneDailyTasks,
                        total: totalDailyTasks,
                      })}
                    </span>
                    <span className="text-xs font-semibold text-primary-700">
                      {t('dashboard_tasks_remaining', {
                        count: Math.max(0, totalDailyTasks - doneDailyTasks),
                      })}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-background-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{
                        width: `${
                          totalDailyTasks > 0
                            ? Math.round((doneDailyTasks / totalDailyTasks) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                {totalWeeklyTasks > 0 && (
                  <p className="text-xs text-foreground-500">
                    {t('dashboard_tasks_progress', {
                      done: doneWeeklyTasks,
                      total: totalWeeklyTasks,
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
