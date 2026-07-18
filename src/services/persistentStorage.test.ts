import { describe, expect, it } from 'vitest';
import {
  applyStorageTransaction,
  compactReconstructableStorage,
  deleteAllPlayerData,
  isPlayerDataStorageKey,
  isReconstructableStorageKey,
  migrateStorageKey,
  writeJsonWithRecovery,
} from './persistentStorage';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  failNextWriteWithQuota = false;
  failKey: string | null = null;

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    if (key === this.failKey) throw new Error(`Write failed for ${key}`);
    if (this.failNextWriteWithQuota) {
      this.failNextWriteWithQuota = false;
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    }
    this.values.set(key, value);
  }
}

describe('persistent storage recovery', () => {
  it('classifies only reconstructable cache keys as compactable', () => {
    expect(isReconstructableStorageKey('maplehub-realtime-cache:abc')).toBe(true);
    expect(isReconstructableStorageKey('maplehub-online-events')).toBe(true);
    expect(isReconstructableStorageKey('maplehub-characters:v2')).toBe(false);
    expect(isReconstructableStorageKey('maplehub-checklist-local-1:v2')).toBe(false);
  });

  it('compacts cache data without deleting player data', () => {
    const storage = new MemoryStorage();
    storage.setItem('maplehub-realtime-cache:old', '{}');
    storage.setItem('maplehub-online-news', '[]');
    storage.setItem('maplehub-characters:v2', '[{"id":"one"}]');

    expect(compactReconstructableStorage(storage).sort()).toEqual([
      'maplehub-online-news',
      'maplehub-realtime-cache:old',
    ]);
    expect(storage.getItem('maplehub-characters:v2')).not.toBeNull();
  });

  it('retries a quota-failed write after compacting caches', () => {
    const storage = new MemoryStorage();
    storage.setItem('maplehub-online-events', '[{"id":"cached"}]');
    storage.setItem('maplehub-characters:v2', '[{"id":"player"}]');
    storage.failNextWriteWithQuota = true;

    const result = writeJsonWithRecovery(storage, 'maplehub-checklist-player:v2', { zakum: { Normal: 1 } });

    expect(result.ok).toBe(true);
    expect(storage.getItem('maplehub-online-events')).toBeNull();
    expect(storage.getItem('maplehub-characters:v2')).not.toBeNull();
    expect(storage.getItem('maplehub-checklist-player:v2')).toContain('zakum');
  });
});

describe('player data deletion', () => {
  it('classifies player data without including caches or the signed-in session', () => {
    expect(isPlayerDataStorageKey('maplehub-characters:v2')).toBe(true);
    expect(isPlayerDataStorageKey('maplehub-checklist-local-1:v2:v1-backup')).toBe(true);
    expect(isPlayerDataStorageKey('maplehub-link-planner:v2:gms')).toBe(true);
    expect(isPlayerDataStorageKey('maplehub-game-version')).toBe(true);
    expect(isPlayerDataStorageKey('maplehub-online-news')).toBe(false);
    expect(isPlayerDataStorageKey('maplehub-auth-session')).toBe(false);
  });

  it('deletes all player-owned local data while preserving session and caches', () => {
    const storage = new MemoryStorage();
    storage.setItem('maplehub-characters:v2', '[]');
    storage.setItem('maplehub-checklist-local-1:v2', '{}');
    storage.setItem('maplehub-news-state:v1', '{}');
    storage.setItem('maplehub-link-planner:v2:gms', '{"ranks":{}}');
    storage.setItem('maplehub-theme', 'dark');
    storage.setItem('maplehub-auth-session', 'signed-in');
    storage.setItem('maplehub-online-news', 'cache');

    expect(deleteAllPlayerData(storage).sort()).toEqual([
      'maplehub-characters:v2',
      'maplehub-checklist-local-1:v2',
      'maplehub-link-planner:v2:gms',
      'maplehub-news-state:v1',
      'maplehub-theme',
    ]);
    expect(storage.getItem('maplehub-auth-session')).toBe('signed-in');
    expect(storage.getItem('maplehub-online-news')).toBe('cache');
  });
});

describe('storage migration', () => {
  it('creates a backup and verifies a valid legacy migration', () => {
    const storage = new MemoryStorage();
    storage.setItem('maplehub-characters', '[{"id":"one"}]');

    const migrated = migrateStorageKey(
      storage,
      'maplehub-characters',
      'maplehub-characters:v2',
      (value) => Array.isArray(value),
    );

    expect(migrated.status).toBe('migrated');
    expect(storage.getItem('maplehub-characters:v2')).toBe('[{"id":"one"}]');
    expect(storage.getItem('maplehub-characters:v2:v1-backup')).toBe('[{"id":"one"}]');
    expect(storage.getItem('maplehub-characters')).toBe('[{"id":"one"}]');
  });

  it('preserves corrupt legacy data and does not create a new key', () => {
    const storage = new MemoryStorage();
    storage.setItem('maplehub-characters', '{not-json');

    const migrated = migrateStorageKey(
      storage,
      'maplehub-characters',
      'maplehub-characters:v2',
      () => true,
    );

    expect(migrated.status).toBe('failed');
    expect(storage.getItem('maplehub-characters')).toBe('{not-json');
    expect(storage.getItem('maplehub-characters:v2')).toBeNull();
  });

  it('is idempotent and never replaces an existing newer payload', () => {
    const storage = new MemoryStorage();
    storage.setItem('maplehub-characters', '[{"id":"legacy"}]');
    storage.setItem('maplehub-characters:v2', '[{"id":"current"}]');

    expect(migrateStorageKey(storage, 'maplehub-characters', 'maplehub-characters:v2', Array.isArray))
      .toEqual({ status: 'not-needed' });
    expect(storage.getItem('maplehub-characters:v2')).toContain('current');
    expect(storage.getItem('maplehub-characters')).toContain('legacy');
  });

  it('keeps the legacy payload and verified backup when the new-key write fails', () => {
    const storage = new MemoryStorage();
    storage.setItem('maplehub-characters', '[{"id":"legacy"}]');
    storage.failKey = 'maplehub-characters:v2';

    const result = migrateStorageKey(storage, 'maplehub-characters', 'maplehub-characters:v2', Array.isArray);

    expect(result.status).toBe('failed');
    expect(storage.getItem('maplehub-characters')).toContain('legacy');
    expect(storage.getItem('maplehub-characters:v2:v1-backup')).toContain('legacy');
    expect(storage.getItem('maplehub-characters:v2')).toBeNull();
  });
});

describe('storage replacement transaction', () => {
  it('applies writes and deletions as one replacement set', () => {
    const storage = new MemoryStorage();
    storage.setItem('characters', 'old');
    storage.setItem('stale-checklist', 'old-task');

    const result = applyStorageTransaction(storage, [
      { key: 'characters', value: 'new' },
      { key: 'new-checklist', value: 'new-task' },
      { key: 'stale-checklist', value: null },
    ]);

    expect(result.ok).toBe(true);
    expect(storage.getItem('characters')).toBe('new');
    expect(storage.getItem('new-checklist')).toBe('new-task');
    expect(storage.getItem('stale-checklist')).toBeNull();
  });

  it('restores every prior value when any mutation fails', () => {
    const storage = new MemoryStorage();
    storage.setItem('characters', 'old-characters');
    storage.setItem('checklist', 'old-checklist');
    storage.failKey = 'preferences';

    const result = applyStorageTransaction(storage, [
      { key: 'characters', value: 'new-characters' },
      { key: 'checklist', value: null },
      { key: 'preferences', value: 'new-preferences' },
    ]);

    expect(result.ok).toBe(false);
    expect(storage.getItem('characters')).toBe('old-characters');
    expect(storage.getItem('checklist')).toBe('old-checklist');
    expect(storage.getItem('preferences')).toBeNull();
  });

  it('rejects duplicate mutation keys before changing storage', () => {
    const storage = new MemoryStorage();
    storage.setItem('characters', 'old');

    expect(applyStorageTransaction(storage, [
      { key: 'characters', value: 'new' },
      { key: 'characters', value: null },
    ]).ok).toBe(false);
    expect(storage.getItem('characters')).toBe('old');
  });
});
