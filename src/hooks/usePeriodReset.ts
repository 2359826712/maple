import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameVersion } from '@/domain/regionModel';
import type { BossInfo } from '@/mocks/bosses';
import type { TaskState } from '@/hooks/useCharacters';
import {
  applyPeriodReset,
  reconcilePeriodResets,
  saveResetState,
  type ResetPeriodState,
} from '@/domain/checklistReset';

const CHECK_INTERVAL_MS = 60_000;

interface UsePeriodResetOptions {
  charId: string | null;
  version: GameVersion;
  bosses: readonly BossInfo[];
  tasks: TaskState;
  setTasks: React.Dispatch<React.SetStateAction<TaskState>>;
}

/**
 * Period-based automatic reset hook.
 *
 * Checks whether the server-time daily or weekly period has changed since
 * the last processed period. If so, selectively zeroes the corresponding
 * task completions and persists the new period identifiers.
 *
 * Triggers on:
 *   - Component mount (page load)
 *   - Tab foregrounding (visibilitychange)
 *   - 60-second interval
 */
export function usePeriodReset({
  charId,
  version,
  bosses,
  tasks,
  setTasks,
}: UsePeriodResetOptions): { lastResetAt: number | null } {
  const [lastResetAt, setLastResetAt] = useState<number | null>(null);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const bossesRef = useRef(bosses);
  bossesRef.current = bosses;
  const versionRef = useRef(version);
  versionRef.current = version;

  const checkAndReset = useCallback(() => {
    if (!charId) return;

    const nowMs = Date.now();
    const result = reconcilePeriodResets(charId, versionRef.current, nowMs);
    if (!result) return;

    const nextTasks = applyPeriodReset(
      tasksRef.current,
      bossesRef.current,
      result.resetDaily,
      result.resetWeekly,
      versionRef.current,
    );

    setTasks(nextTasks);

    const newState: ResetPeriodState = {
      lastDailyPeriod: result.newDailyPeriod,
      lastWeeklyPeriod: result.newWeeklyPeriod,
    };
    saveResetState(charId, newState);
    setLastResetAt(nowMs);
  }, [charId, setTasks]);

  // On mount and charId/version change
  useEffect(() => {
    checkAndReset();
  }, [checkAndReset]);

  // Tab foregrounding
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') checkAndReset();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [checkAndReset]);

  // 60-second interval
  useEffect(() => {
    const interval = setInterval(checkAndReset, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkAndReset]);

  return { lastResetAt };
}
