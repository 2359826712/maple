import { describe, expect, it } from 'vitest';
import { applyRoutineCredit, calculateEventGoal, type EventGoalProgress } from './eventGoalProjection';

describe('event currency goal projections', () => {
  it('calculates projected currency and required daily pace', () => {
    const now = Date.parse('2026-07-13T00:00:00Z');
    const end = '2026-07-18T00:00:00Z';
    const result = calculateEventGoal({ current: 100, target: 1_000, dailyGain: 200 }, end, now);

    expect(result.daysRemaining).toBe(5);
    expect(result.projected).toBe(1_100);
    expect(result.requiredPerDay).toBe(180);
    expect(result.recoveryDays).toBe(0);
    expect(result.onTrack).toBe(true);
  });

  it('never produces negative values after an event ends', () => {
    const result = calculateEventGoal(
      { current: -10, target: 500, dailyGain: -20 },
      '2026-07-12T00:00:00Z',
      Date.parse('2026-07-13T00:00:00Z'),
    );

    expect(result.daysRemaining).toBe(0);
    expect(result.projected).toBe(0);
    expect(result.requiredPerDay).toBe(500);
    expect(result.onTrack).toBe(false);
  });

  it('reports how many planned days can be missed while the goal stays recoverable', () => {
    const result = calculateEventGoal(
      { current: 600, target: 1_000, dailyGain: 200 },
      '2026-07-18T00:00:00Z',
      Date.parse('2026-07-13T00:00:00Z'),
    );

    expect(result.recoveryDays).toBe(3);
  });

  it('credits a linked routine only once per period', () => {
    const progress: EventGoalProgress = {
      current: 100,
      target: 1_000,
      dailyGain: 100,
      routineGain: 50,
      creditedPeriods: [],
      requirementComplete: false,
      rewardClaimed: false,
    };
    const first = applyRoutineCredit(progress, 'gms:daily:2026-07-13', true);
    const duplicate = applyRoutineCredit(first.progress, 'gms:daily:2026-07-13', true);

    expect(first.credited).toBe(true);
    expect(first.progress.current).toBe(150);
    expect(duplicate.credited).toBe(false);
    expect(duplicate.progress.current).toBe(150);
  });
});
