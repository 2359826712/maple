import { describe, expect, it } from 'vitest';
import {
  getNextBestActionHref,
  selectNextBestAction,
  type NextBestActionCandidate,
} from './nextBestAction';

const daily: NextBestActionCandidate = {
  id: 'routine:daily-quests',
  titleKey: 'routine_daily_quests',
  period: 'daily',
  scope: 'character',
  remaining: 1,
  priority: 10,
};

const weekly: NextBestActionCandidate = {
  id: 'routine:event-shop',
  titleKey: 'routine_event_shop',
  period: 'weekly',
  scope: 'account',
  remaining: 1,
  priority: 0,
};

describe('selectNextBestAction', () => {
  it('chooses the action with the nearest reset', () => {
    expect(selectNextBestAction({
      candidates: [weekly, daily],
      dailyResetInMs: 2_000,
      weeklyResetInMs: 80_000,
    })?.id).toBe(daily.id);

    expect(selectNextBestAction({
      candidates: [daily, weekly],
      dailyResetInMs: 80_000,
      weeklyResetInMs: 2_000,
    })?.id).toBe(weekly.id);
  });

  it('uses explicit priority and id for deterministic reset ties', () => {
    const preferred = { ...daily, id: 'routine:event-attendance', scope: 'account' as const, priority: 1 };
    const result = selectNextBestAction({
      candidates: [daily, preferred],
      dailyResetInMs: 4_000,
      weeklyResetInMs: 50_000,
    });

    expect(result?.id).toBe(preferred.id);
    expect(result?.scope).toBe('account');
  });

  it('ignores completed candidates and returns null when nothing is actionable', () => {
    expect(selectNextBestAction({
      candidates: [{ ...daily, remaining: 0 }, { ...weekly, remaining: Number.NaN }],
      dailyResetInMs: 2_000,
      weeklyResetInMs: 3_000,
    })).toBeNull();
  });

  it('deep links routines and boss work to the exact checklist state', () => {
    expect(getNextBestActionHref(daily)).toBe('/checklist#routine-daily-quests');
    expect(getNextBestActionHref({ ...weekly, id: 'bosses:weekly' }))
      .toBe('/checklist?period=weekly#boss-checklist');
    expect(getNextBestActionHref({ ...daily, id: 'future-action' })).toBe('/checklist');
    expect(getNextBestActionHref({ ...daily, id: 'event-pace:gms:event-one' }))
      .toBe('/events?goal=gms%3Aevent-one#event-goal');
  });

  it('uses a nearer event deadline without changing deterministic tie breaks', () => {
    const event = { ...weekly, id: 'event-pace:gms:event-one', dueInMs: 500 };
    expect(selectNextBestAction({
      candidates: [daily, event],
      dailyResetInMs: 1_000,
      weeklyResetInMs: 2_000,
    })?.id).toBe(event.id);
  });
});
