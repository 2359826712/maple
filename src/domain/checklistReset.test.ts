// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bosses } from '@/mocks/bosses';
import {
  applyPeriodReset,
  loadResetState,
  reconcilePeriodResets,
  saveResetState,
  type TaskState,
} from '@/domain/checklistReset';
import {
  getCurrentDailyPeriod,
  getCurrentWeeklyPeriod,
} from '@/domain/regionModel';

// Helper: build a sample TaskState with some daily and weekly bosses completed
function sampleTasks(): TaskState {
  return {
    zakum: { Easy: 1, Normal: 2, Chaos: 1 }, // daily boss
    horntail: { Easy: 1, Normal: 1 }, // daily boss
    lotus: { Normal: 1, Hard: 0 }, // weekly boss
    magnus: { Easy: 1, Normal: 1, Hard: 1 }, // mixed daily/weekly boss
  };
}

describe('DAILY-04 Period-based automatic reset', () => {
  const testCharId = 'test-char-reset-001';

  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('(a) resets daily tasks when crossing a daily boundary', () => {
    // GMS utcOffset=0, so server midnight = UTC midnight
    // "Before midnight" on July 10 → period "2026-07-10"
    const beforeMidnight = new Date('2026-07-10T23:59:00Z').getTime();
    saveResetState(testCharId, {
      lastDailyPeriod: getCurrentDailyPeriod('gms', beforeMidnight),
      lastWeeklyPeriod: getCurrentWeeklyPeriod('gms', beforeMidnight),
    });

    // "After midnight" on July 11 → period "2026-07-11"
    const afterMidnight = new Date('2026-07-11T00:01:00Z').getTime();
    const result = reconcilePeriodResets(testCharId, 'gms', afterMidnight);

    expect(result).not.toBeNull();
    expect(result!.resetDaily).toBe(true);
    // July 10 is Friday, July 11 is Saturday — same week, so no weekly reset
    expect(result!.resetWeekly).toBe(false);

    // Apply the reset and verify daily bosses are zeroed, weekly bosses preserved
    const tasks = sampleTasks();
    const nextTasks = applyPeriodReset(tasks, bosses, true, false);

    // Daily bosses should be zeroed
    expect(nextTasks.zakum).toEqual({ Easy: 0, Normal: 0, Chaos: 1 });
    expect(nextTasks.horntail).toEqual({ Easy: 0, Normal: 0 });
    expect(nextTasks.magnus).toEqual({ Easy: 0, Normal: 0, Hard: 1 });
    // Weekly bosses should be preserved
    expect(nextTasks.lotus).toEqual({ Normal: 1, Hard: 0 });
  });

  it('(b) resets weekly tasks when crossing a weekly boundary', () => {
    // GMS weeklyResetDay=4 (Thursday). July 9, 2026 is a Thursday.
    // "Before Thursday" = Wednesday July 8 at 23:59 UTC → most recent Thursday was July 2
    const beforeThursday = new Date('2026-07-08T23:59:00Z').getTime();
    const weeklyPeriodBefore = getCurrentWeeklyPeriod('gms', beforeThursday);

    // "After Thursday midnight" = Thursday July 9 at 00:01 UTC → most recent Thursday is July 9
    const afterThursday = new Date('2026-07-09T00:01:00Z').getTime();
    const weeklyPeriodAfter = getCurrentWeeklyPeriod('gms', afterThursday);

    // Verify we actually cross a weekly boundary
    expect(weeklyPeriodBefore).toBe('W-2026-07-02');
    expect(weeklyPeriodAfter).toBe('W-2026-07-09');
    expect(weeklyPeriodBefore).not.toBe(weeklyPeriodAfter);

    saveResetState(testCharId, {
      lastDailyPeriod: getCurrentDailyPeriod('gms', beforeThursday),
      lastWeeklyPeriod: weeklyPeriodBefore,
    });

    const result = reconcilePeriodResets(testCharId, 'gms', afterThursday);

    expect(result).not.toBeNull();
    expect(result!.resetDaily).toBe(true); // Also crosses daily boundary (July 8→9)
    expect(result!.resetWeekly).toBe(true);

    // Apply the reset: both daily and weekly bosses should be zeroed
    const tasks = sampleTasks();
    const nextTasks = applyPeriodReset(tasks, bosses, true, true);

    expect(nextTasks.zakum).toEqual({ Easy: 0, Normal: 0, Chaos: 0 });
    expect(nextTasks.lotus).toEqual({ Normal: 0, Hard: 0 });
  });

  it('(c) is idempotent — reconciling twice for the same period does not double-reset', () => {
    const nowMs = new Date('2026-07-11T12:00:00Z').getTime();

    // First reconciliation: no stored state, so reset fires
    const first = reconcilePeriodResets(testCharId, 'gms', nowMs);
    expect(first).not.toBeNull();

    // Persist the state from the first reconciliation
    saveResetState(testCharId, {
      lastDailyPeriod: first!.newDailyPeriod,
      lastWeeklyPeriod: first!.newWeeklyPeriod,
    });

    // Second reconciliation with the same time: should return null (no reset)
    const second = reconcilePeriodResets(testCharId, 'gms', nowMs);
    expect(second).toBeNull();
  });

  it('(d) DST transition — period identifiers remain consistent across DST boundaries', () => {
    // KMS utcOffset=9, timeZone=Asia/Seoul
    // Korea does not observe DST. Verify period identifiers are stable across
    // a date that would be a DST boundary in regions that observe it (e.g. March 8, 2026).
    const beforeDst = new Date('2026-03-08T14:59:00Z').getTime(); // 23:59 KMS
    const afterDst = new Date('2026-03-08T15:01:00Z').getTime(); // 00:01 KMS next day

    const periodBefore = getCurrentDailyPeriod('kms', beforeDst);
    const periodAfter = getCurrentDailyPeriod('kms', afterDst);

    // Before midnight KMS = March 8, after midnight KMS = March 9
    expect(periodBefore).toBe('2026-03-08');
    expect(periodAfter).toBe('2026-03-09');
    expect(periodBefore).not.toBe(periodAfter);

    // Verify no skipped or duplicated period: the next period after March 8 is exactly March 9
    const march9Midnight = new Date('2026-03-08T15:00:00Z').getTime(); // exactly midnight KMS
    const exactMidnightPeriod = getCurrentDailyPeriod('kms', march9Midnight);
    expect(exactMidnightPeriod).toBe('2026-03-09');
  });

  it('(e) timezone edge — player in UTC+8, server in UTC (GMS), reset fires at correct local time', () => {
    // GMS daily reset is at UTC midnight (00:00 UTC).
    // For a player in UTC+8, that's 08:00 local time.
    // Simulate: the player checks at 07:59 local (23:59 UTC prev day) → no reset.
    // Then checks at 08:01 local (00:01 UTC new day) → reset fires.

    // Player is in UTC+8 but server is GMS (UTC).
    // 2026-07-10 23:59 UTC = 2026-07-11 07:59 local
    const beforeResetUtc = new Date('2026-07-10T23:59:00Z').getTime();
    // 2026-07-11 00:01 UTC = 2026-07-11 08:01 local
    const afterResetUtc = new Date('2026-07-11T00:01:00Z').getTime();

    // Save state as if last processed during the previous period
    saveResetState(testCharId, {
      lastDailyPeriod: getCurrentDailyPeriod('gms', beforeResetUtc),
      lastWeeklyPeriod: getCurrentWeeklyPeriod('gms', beforeResetUtc),
    });

    // Before the UTC midnight: no reset should fire (same period)
    const noReset = reconcilePeriodResets(testCharId, 'gms', beforeResetUtc);
    expect(noReset).toBeNull();

    // After the UTC midnight: daily reset should fire
    const shouldReset = reconcilePeriodResets(testCharId, 'gms', afterResetUtc);
    expect(shouldReset).not.toBeNull();
    expect(shouldReset!.resetDaily).toBe(true);

    // The period should be the new UTC date
    expect(shouldReset!.newDailyPeriod).toBe('2026-07-11');
  });
});

describe('DAILY-04 applyPeriodReset', () => {
  it('selectively resets only matching boss types', () => {
    const tasks: TaskState = {
      zakum: { Easy: 3, Normal: 2, Chaos: 1 }, // mixed daily/weekly rules
      'pink-bean': { Normal: 1, Chaos: 1 }, // daily (dailyLimit > 0)
      lotus: { Normal: 1, Hard: 1 }, // weekly (weeklyLimit > 0)
      'black-mage': { Normal: 1 }, // weekly (weeklyLimit > 0)
    };

    // Reset only dailies
    const dailyOnly = applyPeriodReset(tasks, bosses, true, false);
    expect(dailyOnly.zakum).toEqual({ Easy: 0, Normal: 0, Chaos: 1 });
    expect(dailyOnly['pink-bean']).toEqual({ Normal: 0, Chaos: 0 });
    expect(dailyOnly.lotus).toEqual({ Normal: 1, Hard: 1 }); // preserved
    expect(dailyOnly['black-mage']).toEqual({ Normal: 1 }); // preserved

    // Reset only weeklies
    const weeklyOnly = applyPeriodReset(tasks, bosses, false, true);
    expect(weeklyOnly.zakum).toEqual({ Easy: 3, Normal: 2, Chaos: 0 });
    expect(weeklyOnly.lotus).toEqual({ Normal: 0, Hard: 0 });
    expect(weeklyOnly['black-mage']).toEqual({ Normal: 0 });

    // Reset nothing
    const noReset = applyPeriodReset(tasks, bosses, false, false);
    expect(noReset).toEqual(tasks);
  });

  it('preserves bosses not in the registry (unknown bosses)', () => {
    const tasks: TaskState = {
      zakum: { Easy: 1 },
      unknown_boss: { Normal: 5 }, // not in bosses registry
    };

    const nextTasks = applyPeriodReset(tasks, bosses, true, true);
    expect(nextTasks.zakum).toEqual({ Easy: 0 }); // known daily boss, reset
    expect(nextTasks.unknown_boss).toEqual({ Normal: 5 }); // unknown, preserved
  });
});

describe('DAILY-04 persistence', () => {
  const charId = 'persist-test-char';

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('stores and loads reset state with the correct key pattern', () => {
    saveResetState(charId, {
      lastDailyPeriod: '2026-07-11',
      lastWeeklyPeriod: 'W-2026-07-09',
    });

    const loaded = loadResetState(charId);
    expect(loaded).toEqual({
      lastDailyPeriod: '2026-07-11',
      lastWeeklyPeriod: 'W-2026-07-09',
    });

    // Verify key matches the maplehub-checklist- prefix (cleaned by deleteAllPlayerData)
    const key = `maplehub-checklist-reset-${charId}:v1`;
    expect(localStorage.getItem(key)).toBeTruthy();
  });

  it('returns null for missing or invalid reset state', () => {
    expect(loadResetState('nonexistent')).toBeNull();

    localStorage.setItem(`maplehub-checklist-reset-${charId}:v1`, 'not-json');
    expect(loadResetState(charId)).toBeNull();

    localStorage.setItem(`maplehub-checklist-reset-${charId}:v1`, JSON.stringify({ foo: 'bar' }));
    expect(loadResetState(charId)).toBeNull();
  });
});
