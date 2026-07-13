import { describe, expect, it } from 'vitest';
import {
  defaultRoutineIds,
  isRoutineComplete,
  recentRoutineHistory,
  routineCompletionKey,
  routineTasks,
  setRoutineComplete,
  type RoutineTaskState,
} from './routineTasks';

const emptyState = (): RoutineTaskState => ({ selectedIds: defaultRoutineIds, completedPeriods: {} });

describe('routine task tracking', () => {
  it('shares account tasks across characters', () => {
    const task = routineTasks.find((candidate) => candidate.scope === 'account')!;
    const now = Date.parse('2026-07-13T01:00:00Z');
    const completed = setRoutineComplete(emptyState(), task, 'gms', 'character-a', true, now);

    expect(routineCompletionKey(task, 'character-a')).toBe('account:account:event-attendance');
    expect(isRoutineComplete(completed, task, 'gms', 'character-b', now)).toBe(true);
  });

  it('keeps character tasks separate', () => {
    const task = routineTasks.find((candidate) => candidate.scope === 'character')!;
    const now = Date.parse('2026-07-13T01:00:00Z');
    const completed = setRoutineComplete(emptyState(), task, 'gms', 'character-a', true, now);

    expect(isRoutineComplete(completed, task, 'gms', 'character-a', now)).toBe(true);
    expect(isRoutineComplete(completed, task, 'gms', 'character-b', now)).toBe(false);
  });

  it('shares world tasks only with characters in the same world', () => {
    const task = routineTasks.find((candidate) => candidate.scope === 'world')!;
    const now = Date.parse('2026-07-13T01:00:00Z');
    const completed = setRoutineComplete(emptyState(), task, 'gms', 'character-a', true, now, 'Bera');

    expect(routineCompletionKey(task, 'character-a', 'Bera')).toBe('world:bera:world-weekly-planning');
    expect(isRoutineComplete(completed, task, 'gms', 'character-b', now, 'BERA')).toBe(true);
    expect(isRoutineComplete(completed, task, 'gms', 'character-c', now, 'Scania')).toBe(false);
  });

  it('automatically treats a prior daily period as incomplete', () => {
    const task = routineTasks.find((candidate) => candidate.period === 'daily')!;
    const firstDay = Date.parse('2026-07-13T01:00:00Z');
    const nextDay = Date.parse('2026-07-14T01:00:00Z');
    const completed = setRoutineComplete(emptyState(), task, 'gms', 'character-a', true, firstDay);

    expect(isRoutineComplete(completed, task, 'gms', 'character-a', firstDay)).toBe(true);
    expect(isRoutineComplete(completed, task, 'gms', 'character-a', nextDay)).toBe(false);
  });

  it('can remove a completion without changing task selection', () => {
    const task = routineTasks[0];
    const now = Date.parse('2026-07-13T01:00:00Z');
    const completed = setRoutineComplete(emptyState(), task, 'gms', 'character-a', true, now);
    const cleared = setRoutineComplete(completed, task, 'gms', 'character-a', false, now);

    expect(isRoutineComplete(cleared, task, 'gms', 'character-a', now)).toBe(false);
    expect(cleared.selectedIds).toEqual(defaultRoutineIds);
  });

  it('keeps a bounded seven-day completion history without streak semantics', () => {
    const task = routineTasks[0];
    const now = Date.parse('2026-07-13T01:00:00Z');
    const recent = setRoutineComplete(emptyState(), task, 'gms', 'character-a', true, now);
    const withOld = {
      ...recent,
      history: [
        ...(recent.history ?? []),
        { key: 'old', taskId: task.id, periodId: 'old', completedAt: '2026-06-01T00:00:00.000Z' },
      ],
    };

    expect(recentRoutineHistory(withOld, now)).toHaveLength(1);
    expect(recentRoutineHistory(withOld, now)[0].taskId).toBe(task.id);
  });
});
