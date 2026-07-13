import type { RoutinePeriod, RoutineScope } from './routineTasks';

export interface NextBestActionCandidate {
  id: string;
  titleKey: string;
  period: RoutinePeriod;
  scope: RoutineScope;
  remaining: number;
  priority: number;
  dueInMs?: number;
}

export interface NextBestAction extends NextBestActionCandidate {
  resetInMs: number;
}

export function getNextBestActionHref(action: Pick<NextBestActionCandidate, 'id' | 'period'>): string {
  if (action.id.startsWith('routine:')) {
    return `/checklist#routine-${encodeURIComponent(action.id.slice('routine:'.length))}`;
  }

  if (action.id.startsWith('bosses:')) {
    return `/checklist?period=${action.period}#boss-checklist`;
  }

  if (action.id.startsWith('event-pace:') || action.id.startsWith('event-claim:')) {
    const id = action.id.slice(action.id.indexOf(':') + 1);
    return `/events?goal=${encodeURIComponent(id)}#event-goal`;
  }

  return '/checklist';
}

interface NextBestActionInput {
  candidates: readonly NextBestActionCandidate[];
  dailyResetInMs: number;
  weeklyResetInMs: number;
}

const safeReset = (value: number) => (
  Number.isFinite(value) ? Math.max(0, value) : Number.MAX_SAFE_INTEGER
);

/**
 * Picks one explainable action using only reset urgency and explicit priority.
 * Keeping the ranking pure prevents UI order or translated copy from changing
 * the recommendation.
 */
export function selectNextBestAction({
  candidates,
  dailyResetInMs,
  weeklyResetInMs,
}: NextBestActionInput): NextBestAction | null {
  const resetByPeriod = {
    daily: safeReset(dailyResetInMs),
    weekly: safeReset(weeklyResetInMs),
  };

  return candidates
    .filter((candidate) => Number.isFinite(candidate.remaining) && candidate.remaining > 0)
    .map((candidate) => ({
      ...candidate,
      resetInMs: Number.isFinite(candidate.dueInMs)
        ? Math.max(0, candidate.dueInMs as number)
        : resetByPeriod[candidate.period],
    }))
    .sort((a, b) => (
      a.resetInMs - b.resetInMs
      || a.priority - b.priority
      || a.id.localeCompare(b.id)
    ))[0] ?? null;
}
