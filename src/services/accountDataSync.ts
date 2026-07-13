import { mapleSqlApi } from './mapleSqlApi';

export const ACCOUNT_DATA_CHANGED_EVENT = 'maplehub-account-data-changed';
export const ACCOUNT_CACHE_OWNER_KEY = 'maplehub-account-cache-owner';

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
  exactKeys.has(key) || key.startsWith('maplehub-checklist-');

const listKeys = (storage: Storage) => {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && isAccountDataKey(key)) keys.push(key);
  }
  return keys;
};

export const collectAccountData = (storage: Storage = window.localStorage) =>
  Object.fromEntries(listKeys(storage).flatMap((key) => {
    const value = storage.getItem(key);
    return value === null ? [] : [[key, value]];
  }));

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
};

const hydrateAccountData = (data: Record<string, string>, userId: string, storage: Storage) => {
  clearAccountDataCache(storage);
  Object.entries(data).forEach(([key, value]) => {
    if (isAccountDataKey(key)) storage.setItem(key, value);
  });
  storage.setItem(ACCOUNT_CACHE_OWNER_KEY, userId);
  window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_CHANGED_EVENT));
};

export async function syncAccountDataAfterLogin(userId: string, storage: Storage = window.localStorage) {
  const local = collectAccountData(storage);
  const owner = storage.getItem(ACCOUNT_CACHE_OWNER_KEY);
  const remote = await mapleSqlApi.accountData.get();
  const shouldMigrateLegacy = owner !== userId && Object.values(local).some(hasMeaningfulValue);
  const merged = shouldMigrateLegacy ? { ...remote.data, ...local } : remote.data;
  const saved = shouldMigrateLegacy ? await mapleSqlApi.accountData.save(merged) : remote;
  hydrateAccountData(saved.data, userId, storage);
  return saved;
}

export async function saveCurrentAccountData(storage: Storage = window.localStorage) {
  return mapleSqlApi.accountData.save(collectAccountData(storage));
}

