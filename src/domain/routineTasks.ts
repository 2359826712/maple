import type { GameVersion } from './regionModel';
import { getCurrentDailyPeriod, getCurrentWeeklyPeriod, isAvailableInVersion } from './regionModel';

export type RoutinePeriod = 'daily' | 'weekly';
export type RoutineScope = 'account' | 'world' | 'character';

export interface RoutineTaskDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  period: RoutinePeriod;
  scope: RoutineScope;
  icon: string;
  defaultEnabled: boolean;
  regions: Array<GameVersion | 'all'>;
}

export interface RoutineTaskState {
  selectedIds: string[];
  completedPeriods: Record<string, string>;
  history?: RoutineHistoryEntry[];
}

export interface RoutineHistoryEntry {
  key: string;
  taskId: string;
  periodId: string;
  completedAt: string;
}

export const routineTasks: readonly RoutineTaskDefinition[] = [
  {
    id: 'daily-quests',
    titleKey: 'routine_daily_quests',
    descriptionKey: 'routine_daily_quests_desc',
    period: 'daily',
    scope: 'character',
    icon: 'ri-map-pin-time-line',
    defaultEnabled: true,
    regions: ['all'],
  },
  {
    id: 'monster-park',
    titleKey: 'routine_monster_park',
    descriptionKey: 'routine_monster_park_desc',
    period: 'daily',
    scope: 'character',
    icon: 'ri-sword-line',
    defaultEnabled: true,
    regions: ['all'],
  },
  {
    id: 'event-attendance',
    titleKey: 'routine_event_attendance',
    descriptionKey: 'routine_event_attendance_desc',
    period: 'daily',
    scope: 'account',
    icon: 'ri-calendar-check-line',
    defaultEnabled: true,
    regions: ['all'],
  },
  {
    id: 'event-shop-review',
    titleKey: 'routine_event_shop',
    descriptionKey: 'routine_event_shop_desc',
    period: 'weekly',
    scope: 'account',
    icon: 'ri-shopping-bag-3-line',
    defaultEnabled: true,
    regions: ['all'],
  },
  {
    id: 'weekly-progression',
    titleKey: 'routine_weekly_progression',
    descriptionKey: 'routine_weekly_progression_desc',
    period: 'weekly',
    scope: 'character',
    icon: 'ri-trophy-line',
    defaultEnabled: true,
    regions: ['all'],
  },
  {
    id: 'world-weekly-planning',
    titleKey: 'routine_world_weekly',
    descriptionKey: 'routine_world_weekly_desc',
    period: 'weekly',
    scope: 'world',
    icon: 'ri-earth-line',
    defaultEnabled: true,
    regions: ['all'],
  },
  {
    id: 'guild-check-in',
    titleKey: 'routine_guild_checkin',
    descriptionKey: 'routine_guild_checkin_desc',
    period: 'daily',
    scope: 'character',
    icon: 'ri-team-line',
    defaultEnabled: false,
    regions: ['all'],
  },
] as const;

export const defaultRoutineIds = routineTasks.filter((task) => task.defaultEnabled).map((task) => task.id);

export function availableRoutineTasks(version: GameVersion) {
  return routineTasks.filter((task) => isAvailableInVersion(task.regions, version));
}

export function routinePeriodId(task: RoutineTaskDefinition, version: GameVersion, nowMs = Date.now()) {
  return task.period === 'daily'
    ? getCurrentDailyPeriod(version, nowMs)
    : getCurrentWeeklyPeriod(version, nowMs);
}

export function routineCompletionKey(
  task: RoutineTaskDefinition,
  characterId: string | null,
  world = '',
) {
  const owner = task.scope === 'account'
    ? 'account'
    : task.scope === 'world'
      ? world.trim().toLocaleLowerCase() || 'unassigned'
      : characterId || 'unassigned';
  return `${task.scope}:${owner}:${task.id}`;
}

export function isRoutineComplete(
  state: RoutineTaskState,
  task: RoutineTaskDefinition,
  version: GameVersion,
  characterId: string | null,
  nowMs = Date.now(),
  world = '',
) {
  return state.completedPeriods[routineCompletionKey(task, characterId, world)] === routinePeriodId(task, version, nowMs);
}

export function setRoutineComplete(
  state: RoutineTaskState,
  task: RoutineTaskDefinition,
  version: GameVersion,
  characterId: string | null,
  completed: boolean,
  nowMs = Date.now(),
  world = '',
): RoutineTaskState {
  const key = routineCompletionKey(task, characterId, world);
  const periodId = routinePeriodId(task, version, nowMs);
  const completedPeriods = { ...state.completedPeriods };
  let history = [...(state.history ?? [])];
  if (completed) {
    completedPeriods[key] = periodId;
    if (!history.some((entry) => entry.key === key && entry.periodId === periodId)) {
      history.push({ key, taskId: task.id, periodId, completedAt: new Date(nowMs).toISOString() });
    }
  }
  else delete completedPeriods[key];
  if (!completed) history = history.filter((entry) => !(entry.key === key && entry.periodId === periodId));
  return { ...state, completedPeriods, history: history.slice(-500) };
}

export function recentRoutineHistory(state: RoutineTaskState, nowMs = Date.now(), days = 7) {
  const cutoff = nowMs - Math.max(1, days) * 86_400_000;
  return (state.history ?? [])
    .filter((entry) => {
      const completedAt = Date.parse(entry.completedAt);
      return Number.isFinite(completedAt) && completedAt >= cutoff && completedAt <= nowMs;
    })
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
}
