// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
}));

vi.mock('./mapleSqlApi', () => ({
  mapleSqlApi: { accountData: api },
}));

import {
  ACCOUNT_CACHE_OWNER_KEY,
  ACCOUNT_LAST_SYNCED_AT_KEY,
  collectAccountData,
  saveCurrentAccountData,
  syncAccountDataAfterLogin,
} from './accountDataSync';

describe('account data migration', () => {
  beforeEach(() => {
    localStorage.clear();
    api.get.mockReset();
    api.save.mockReset();
  });

  it('uploads meaningful legacy data before replacing it with the account cache', async () => {
    localStorage.setItem('maplehub-characters:v2', '[{"id":"local-1"}]');
    api.get.mockResolvedValue({ data: { 'maplehub-event-goals:v2': '{"event":1}' }, revision: 2 });
    api.save.mockImplementation(async (data: Record<string, string>) => ({ data, revision: 3 }));

    await syncAccountDataAfterLogin('user-1');

    expect(api.save).toHaveBeenCalledWith({
      'maplehub-event-goals:v2': '{"event":1}',
      'maplehub-characters:v2': '[{"id":"local-1"}]',
    });
    expect(localStorage.getItem(ACCOUNT_CACHE_OWNER_KEY)).toBe('user-1');
    expect(collectAccountData()).toEqual({
      'maplehub-event-goals:v2': '{"event":1}',
      'maplehub-characters:v2': '[{"id":"local-1"}]',
    });
  });

  it('does not overwrite database data with an empty local initialization', async () => {
    localStorage.setItem('maplehub-characters:v2', '[]');
    api.get.mockResolvedValue({ data: { 'maplehub-characters:v2': '[{"id":"remote-1"}]' }, revision: 4 });

    await syncAccountDataAfterLogin('user-2');

    expect(api.save).not.toHaveBeenCalled();
    expect(localStorage.getItem('maplehub-characters:v2')).toContain('remote-1');
    expect(localStorage.getItem(ACCOUNT_CACHE_OWNER_KEY)).toBe('user-2');
  });

  it('includes Link Skill planner state in account synchronization', () => {
    localStorage.setItem('maplehub-link-planner:v2:gms', '{"ranks":{"mercedes":3}}');
    expect(collectAccountData()).toEqual({
      'maplehub-link-planner:v2:gms': '{"ranks":{"mercedes":3}}',
    });
  });

  it('records the server timestamp after a successful account save', async () => {
    localStorage.setItem('maplehub-characters:v2', '[{"id":"local-1"}]');
    api.save.mockResolvedValue({
      data: { 'maplehub-characters:v2': '[{"id":"local-1"}]' },
      revision: 7,
      updated_at: '2026-07-13T07:30:00.000Z',
    });

    await saveCurrentAccountData();

    expect(localStorage.getItem(ACCOUNT_LAST_SYNCED_AT_KEY)).toBe('2026-07-13T07:30:00.000Z');
  });
});
