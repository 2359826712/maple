import { mapleSqlApi } from './mapleSqlApi';

export const ACCOUNT_DATA_CHANGED_EVENT = 'maplehub-account-data-changed';
export const ACCOUNT_CACHE_CHANGED_EVENT = 'maplehub-account-cache-changed';
export const ACCOUNT_CACHE_OWNER_KEY = 'maplehub-account-cache-owner';
export const ACCOUNT_LAST_SYNCED_AT_KEY = 'maplehub-account-last-synced-at';
export const ACCOUNT_SYNC_CHANGED_EVENT = 'maplehub-account-sync-changed';

const exactKeys = new Set([
  'maplehub-characters',
  'maplehub-characters:v2',
  'maplehub-checklist',
  'maplehub-news-state:v1',
  'maplehub-guide-reading-progress:v1',
  'maplehub-routine-tasks:v1',
  'maplehub-routine-tasks:v2',
  'maplehub-event-goals:v1',
  'maplehub-event-goals:v2',
]);

export const isAccountDataKey = (key: string) =>
  exactKeys.has(key) ||
  key.startsWith('maplehub-checklist-') ||
  key.startsWith('maplehub-link-planner:');

const listKeys = (storage: Storage) => {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && isAccountDataKey(key)) keys.push(key);
  }
  return keys;
};

export const collectAccountData = (storage?: Storage) => {
  const resolvedStorage = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!resolvedStorage) return {};
  return Object.fromEntries(listKeys(resolvedStorage).flatMap((key) => {
    const value = resolvedStorage.getItem(key);
    return value === null ? [] : [[key, value]];
  }));
};

const hasMeaningfulValue = (value: string) => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.length > 0;
    if (parsed && typeof parsed === 'object') return Object.keys(parsed).length > 0;
    return parsed !== null && parsed !== '';
  } catch {
    return value.trim().length > 0;
  }
};

export const clearAccountDataCache = (storage: Storage = window.localStorage) => {
  listKeys(storage).forEach((key) => storage.removeItem(key));
  storage.removeItem(ACCOUNT_CACHE_OWNER_KEY);
  storage.removeItem(ACCOUNT_LAST_SYNCED_AT_KEY);
  if (typeof window !== 'undefined' && storage === window.localStorage) {
    window.dispatchEvent(new CustomEvent(ACCOUNT_CACHE_CHANGED_EVENT));
  }
};

const recordSuccessfulSync = (updatedAt: string | undefined, storage: Storage) => {
  const syncedAt = updatedAt && Number.isFinite(Date.parse(updatedAt))
    ? updatedAt
    : new Date().toISOString();
  storage.setItem(ACCOUNT_LAST_SYNCED_AT_KEY, syncedAt);
  if (typeof window !== 'undefined' && storage === window.localStorage) {
    window.dispatchEvent(new CustomEvent(ACCOUNT_SYNC_CHANGED_EVENT, { detail: { syncedAt } }));
  }
  return syncedAt;
};

export const readLastAccountSync = (storage?: Storage) => {
  const resolvedStorage = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  return resolvedStorage?.getItem(ACCOUNT_LAST_SYNCED_AT_KEY) || null;
};

const hydrateAccountData = (data: Record<string, string>, userId: string, storage: Storage) => {
  clearAccountDataCache(storage);
  Object.entries(data).forEach(([key, value]) => {
    if (isAccountDataKey(key)) storage.setItem(key, value);
  });
  storage.setItem(ACCOUNT_CACHE_OWNER_KEY, userId);
  window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_CHANGED_EVENT));
  window.dispatchEvent(new CustomEvent(ACCOUNT_CACHE_CHANGED_EVENT));
};

export async function syncAccountDataAfterLogin(userId: string, storage: Storage = window.localStorage) {
  const local = collectAccountData(storage);
  const owner = storage.getItem(ACCOUNT_CACHE_OWNER_KEY);
  const remote = await mapleSqlApi.accountData.get();
  const shouldMigrateLegacy = owner !== userId && Object.values(local).some(hasMeaningfulValue);
  const merged = shouldMigrateLegacy ? { ...remote.data, ...local } : remote.data;
  const saved = shouldMigrateLegacy ? await mapleSqlApi.accountData.save(merged) : remote;
  hydrateAccountData(saved.data, userId, storage);
  recordSuccessfulSync(saved.updated_at, storage);
  return saved;
}

export async function saveCurrentAccountData(storage: Storage = window.localStorage) {
  const saved = await mapleSqlApi.accountData.save(collectAccountData(storage));
  recordSuccessfulSync(saved.updated_at, storage);
  return saved;
}
