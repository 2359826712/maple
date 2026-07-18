import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameVersion } from '@/domain/regionModel';
import {
  availableRoutineTasks,
  defaultRoutineIds,
  isRoutineComplete,
  setRoutineComplete,
  type RoutineTaskDefinition,
  type RoutineTaskState,
} from '@/domain/routineTasks';

const STORAGE_KEY = 'maplehub-routine-tasks:v2';
const LEGACY_STORAGE_KEY = 'maplehub-routine-tasks:v1';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function readState(): RoutineTaskState {
  if (typeof window === 'undefined') return { selectedIds: defaultRoutineIds, completedPeriods: {}, history: [] };
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY)
      ?? window.localStorage.getItem(LEGACY_STORAGE_KEY)
      ?? 'null',
    ) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid');
    const record = parsed as Record<string, unknown>;
    const completed = record.completedPeriods;
    const completedPeriods = completed && typeof completed === 'object' && !Array.isArray(completed)
      ? Object.fromEntries(Object.entries(completed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
      : {};
    const history = Array.isArray(record.history)
      ? record.history.flatMap((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
        const item = entry as Record<string, unknown>;
        return typeof item.key === 'string'
          && typeof item.taskId === 'string'
          && typeof item.periodId === 'string'
          && typeof item.completedAt === 'string'
          && Number.isFinite(Date.parse(item.completedAt))
          ? [{ key: item.key, taskId: item.taskId, periodId: item.periodId, completedAt: item.completedAt }]
          : [];
      }).slice(-500)
      : [];
    return {
      selectedIds: isStringArray(record.selectedIds) ? [...new Set(record.selectedIds)] : defaultRoutineIds,
      completedPeriods,
      history,
    };
  } catch {
    return { selectedIds: defaultRoutineIds, completedPeriods: {}, history: [] };
  }
}

function writeState(state: RoutineTaskState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('maplehub-routines-changed'));
  } catch {
    // Keep the current in-memory state when storage is unavailable.
  }
}

export function useRoutineTasks(version: GameVersion, characterId: string | null, nowMs = Date.now(), world = '') {
  const [state, setState] = useState<RoutineTaskState>(readState);

  useEffect(() => {
    const refresh = () => setState(readState());
    window.addEventListener('storage', refresh);
    window.addEventListener('maplehub-routines-changed', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('maplehub-routines-changed', refresh);
    };
  }, []);

  const availableTasks = useMemo(() => availableRoutineTasks(version), [version]);
  const selectedSet = useMemo(() => new Set(state.selectedIds), [state.selectedIds]);
  const selectedTasks = useMemo(
    () => availableTasks.filter((task) => selectedSet.has(task.id)),
    [availableTasks, selectedSet],
  );

  const update = useCallback((updater: (current: RoutineTaskState) => RoutineTaskState) => {
    setState((current) => {
      const next = updater(current);
      writeState(next);
      return next;
    });
  }, []);

  const setSelected = useCallback((taskId: string, selected: boolean) => {
    update((current) => ({
      ...current,
      selectedIds: selected
        ? [...new Set([...current.selectedIds, taskId])]
        : current.selectedIds.filter((id) => id !== taskId),
    }));
  }, [update]);

  const setComplete = useCallback((task: RoutineTaskDefinition, completed: boolean) => {
    update((current) => setRoutineComplete(current, task, version, characterId, completed, nowMs, world));
  }, [characterId, nowMs, update, version, world]);

  const completeCount = selectedTasks.filter((task) => isRoutineComplete(state, task, version, characterId, nowMs, world)).length;

  return {
    state,
    availableTasks,
    selectedTasks,
    completeCount,
    isComplete: (task: RoutineTaskDefinition) => isRoutineComplete(state, task, version, characterId, nowMs, world),
    setComplete,
    setSelected,
  };
}
