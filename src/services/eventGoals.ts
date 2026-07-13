import type { EventGoalProgress } from '@/domain/eventGoalProjection';
import { writeJsonWithRecovery } from './persistentStorage';

export const EVENT_GOALS_STORAGE_KEY = 'maplehub-event-goals:v2';
const LEGACY_EVENT_GOALS_STORAGE_KEY = 'maplehub-event-goals:v1';
export const EVENT_GOALS_CHANGED_EVENT = 'maplehub-event-goals-changed';

export interface StoredEventGoal extends EventGoalProgress {
  id: string;
  name: string;
  windowEnd: string;
}

const nonNegative = (value: unknown) => Math.max(0, Number(value) || 0);

function normalizeGoal(id: string, value: unknown): StoredEventGoal | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    id,
    name: typeof record.name === 'string' ? record.name.slice(0, 300) : '',
    windowEnd: typeof record.windowEnd === 'string' ? record.windowEnd : '',
    current: nonNegative(record.current),
    target: nonNegative(record.target),
    dailyGain: nonNegative(record.dailyGain),
    routineGain: nonNegative(record.routineGain),
    creditedPeriods: Array.isArray(record.creditedPeriods)
      ? [...new Set(record.creditedPeriods.filter((entry): entry is string => typeof entry === 'string'))].slice(-120)
      : [],
    requirementComplete: record.requirementComplete === true,
    rewardClaimed: record.rewardClaimed === true,
  };
}

export function readEventGoals(storage: Storage = window.localStorage): Record<string, StoredEventGoal> {
  const read = (key: string) => {
    try {
      const parsed = JSON.parse(storage.getItem(key) || '{}') as Record<string, unknown>;
      return Object.fromEntries(Object.entries(parsed).flatMap(([id, value]) => {
        const goal = normalizeGoal(id, value);
        return goal ? [[id, goal]] : [];
      }));
    } catch {
      return {};
    }
  };

  const current = read(EVENT_GOALS_STORAGE_KEY);
  if (Object.keys(current).length > 0 || storage.getItem(EVENT_GOALS_STORAGE_KEY) !== null) return current;
  return read(LEGACY_EVENT_GOALS_STORAGE_KEY);
}

export function writeEventGoal(goal: StoredEventGoal, storage: Storage = window.localStorage) {
  const next = { ...readEventGoals(storage), [goal.id]: goal };
  const result = writeJsonWithRecovery(storage, EVENT_GOALS_STORAGE_KEY, next);
  if (result.ok && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT_GOALS_CHANGED_EVENT));
  return result;
}
