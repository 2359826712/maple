import type { TaskState } from '@/hooks/useCharacters';
export type { TaskState } from '@/hooks/useCharacters';
import type { BossInfo } from '@/mocks/bosses';
import type { GameVersion } from '@/domain/regionModel';
import { getCurrentDailyPeriod, getCurrentWeeklyPeriod } from '@/domain/regionModel';
import { getBossChecklistRules } from '@/domain/bossChecklistRules';

export interface ResetPeriodState {
  lastDailyPeriod: string;
  lastWeeklyPeriod: string;
}

export interface ResetResult {
  resetDaily: boolean;
  resetWeekly: boolean;
  newDailyPeriod: string;
  newWeeklyPeriod: string;
}

const RESET_STORAGE_PREFIX = 'maplehub-checklist-reset-';
const RESET_STORAGE_SUFFIX = ':v1';

function storageKey(charId: string): string {
  return `${RESET_STORAGE_PREFIX}${charId}${RESET_STORAGE_SUFFIX}`;
}

/**
 * Load persisted reset period state for a character.
 * Returns null if no state exists or the data is invalid.
 */
export function loadResetState(charId: string): ResetPeriodState | null {
  try {
    const raw = localStorage.getItem(storageKey(charId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.lastDailyPeriod === 'string' &&
      typeof parsed.lastWeeklyPeriod === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist reset period state for a character.
 */
export function saveResetState(charId: string, state: ResetPeriodState): void {
  localStorage.setItem(storageKey(charId), JSON.stringify(state));
}

/**
 * Determine which reset types need to fire by comparing the current
 * server-time period identifiers against the last processed ones.
 * Returns null if no reset is needed.
 */
export function reconcilePeriodResets(
  charId: string,
  version: GameVersion,
  nowMs = Date.now(),
): ResetResult | null {
  const currentDaily = getCurrentDailyPeriod(version, nowMs);
  const currentWeekly = getCurrentWeeklyPeriod(version, nowMs);
  const stored = loadResetState(charId);

  if (stored && stored.lastDailyPeriod === currentDaily && stored.lastWeeklyPeriod === currentWeekly) {
    return null; // No reset needed — same period
  }

  const resetDaily = !stored || stored.lastDailyPeriod !== currentDaily;
  const resetWeekly = !stored || stored.lastWeeklyPeriod !== currentWeekly;

  return {
    resetDaily,
    resetWeekly,
    newDailyPeriod: currentDaily,
    newWeeklyPeriod: currentWeekly,
  };
}

/**
 * Apply selective task reset based on boss reset types.
 * Zeroes out completion counts for daily bosses, weekly bosses, or both.
 * Returns a new TaskState object (does not mutate the input).
 */
export function applyPeriodReset(
  tasks: TaskState,
  bosses: readonly BossInfo[],
  resetDaily: boolean,
  resetWeekly: boolean,
  version: GameVersion = 'gms',
): TaskState {
  if (!resetDaily && !resetWeekly) return tasks;
  const rulesByBoss = new Map(
    bosses.map((boss) => [
      boss.id,
      new Map(getBossChecklistRules(boss, version).map((rule) => [rule.difficulty, rule])),
    ]),
  );

  const next: TaskState = {};
  for (const [bossId, difficulties] of Object.entries(tasks)) {
    const rules = rulesByBoss.get(bossId);
    const resetDifficulties: Record<string, number> = {};
    for (const [difficulty, count] of Object.entries(difficulties)) {
      const rule = rules?.get(difficulty);
      const shouldReset = rule
        ? (rule.period === 'daily' && resetDaily) || (rule.period === 'weekly' && resetWeekly)
        : false;
      resetDifficulties[difficulty] = shouldReset ? 0 : count;
    }
    next[bossId] = resetDifficulties;
  }
  return next;
}

/**
 * Delete reset state for a character (used during character deletion or data wipe).
 */
export function clearResetState(charId: string): void {
  localStorage.removeItem(storageKey(charId));
}
