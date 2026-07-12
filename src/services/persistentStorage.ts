export type StorageWriteResult =
  | { ok: true; compactedKeys: string[] }
  | { ok: false; compactedKeys: string[]; error: unknown; quotaExceeded: boolean };

export type StorageMigrationResult =
  | { status: 'not-needed' | 'migrated'; backupKey?: string }
  | { status: 'failed'; error: unknown; backupKey?: string };

export type StorageMutation = { key: string; value: string | null };

export type StorageTransactionResult =
  | { ok: true; compactedKeys: string[] }
  | { ok: false; error: unknown; rollbackError?: unknown; compactedKeys: string[] };

const reconstructablePrefixes = [
  'maplehub-realtime-cache:',
  'maplehub-realtime-failure:',
  'maplehub-online-',
  'maplehub-search-index:',
] as const;

const playerDataExactKeys = new Set([
  'maplehub-characters',
  'maplehub-characters:v2',
  'maplehub-news-state:v1',
  'maplehub-game-version',
  'maplehub-language',
  'i18nextLng',
  'maplehub-theme',
  'maplehub-color-mode',
  'maplehub-tool-favorites',
  'maplehub-guide-reading-progress:v1',
]);

export const isQuotaExceededError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

export const isReconstructableStorageKey = (key: string) =>
  reconstructablePrefixes.some((prefix) => key.startsWith(prefix));

export const isPlayerDataStorageKey = (key: string) =>
  playerDataExactKeys.has(key) ||
  key.startsWith('maplehub-characters:v2:') ||
  key === 'maplehub-checklist' ||
  key.startsWith('maplehub-checklist-');

const listStorageKeys = (storage: Storage) => {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key) keys.push(key);
  }
  return keys;
};

export const compactReconstructableStorage = (storage: Storage) => {
  const removed: string[] = [];
  for (const key of listStorageKeys(storage).filter(isReconstructableStorageKey)) {
    storage.removeItem(key);
    removed.push(key);
  }
  return removed;
};

export const deleteAllPlayerData = (storage: Storage) => {
  const removed = listStorageKeys(storage).filter(isPlayerDataStorageKey);
  removed.forEach((key) => storage.removeItem(key));
  return removed;
};

export function writeStorageValueWithRecovery(
  storage: Storage,
  key: string,
  value: string,
): StorageWriteResult {
  try {
    storage.setItem(key, value);
    return { ok: true, compactedKeys: [] };
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      return { ok: false, compactedKeys: [], error, quotaExceeded: false };
    }

    const compactedKeys = compactReconstructableStorage(storage);
    try {
      storage.setItem(key, value);
      return { ok: true, compactedKeys };
    } catch (retryError) {
      return {
        ok: false,
        compactedKeys,
        error: retryError,
        quotaExceeded: isQuotaExceededError(retryError),
      };
    }
  }
}

export function writeJsonWithRecovery(storage: Storage, key: string, value: unknown) {
  try {
    return writeStorageValueWithRecovery(storage, key, JSON.stringify(value));
  } catch (error) {
    return { ok: false, compactedKeys: [], error, quotaExceeded: false } as const;
  }
}

export function readJson<T>(storage: Storage, key: string): T | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

/** Applies a replacement import atomically from the caller's perspective. */
export function applyStorageTransaction(
  storage: Storage,
  mutations: readonly StorageMutation[],
): StorageTransactionResult {
  const uniqueKeys = new Set(mutations.map(({ key }) => key));
  if (uniqueKeys.size !== mutations.length) {
    return { ok: false, error: new Error('Storage transaction contains duplicate keys.'), compactedKeys: [] };
  }

  const snapshot = new Map([...uniqueKeys].map((key) => [key, storage.getItem(key)]));
  const compactedKeys = new Set<string>();

  try {
    for (const { key, value } of mutations) {
      if (value === null) {
        storage.removeItem(key);
        continue;
      }
      const result = writeStorageValueWithRecovery(storage, key, value);
      result.compactedKeys.forEach((cacheKey) => compactedKeys.add(cacheKey));
      if ('error' in result) throw result.error;
    }
    return { ok: true, compactedKeys: [...compactedKeys] };
  } catch (error) {
    try {
      for (const [key, previousValue] of snapshot) {
        if (previousValue === null) storage.removeItem(key);
        else storage.setItem(key, previousValue);
      }
      return { ok: false, error, compactedKeys: [...compactedKeys] };
    } catch (rollbackError) {
      return { ok: false, error, rollbackError, compactedKeys: [...compactedKeys] };
    }
  }
}

export function migrateStorageKey(
  storage: Storage,
  legacyKey: string,
  nextKey: string,
  validate: (value: unknown) => boolean,
): StorageMigrationResult {
  if (storage.getItem(nextKey) !== null) return { status: 'not-needed' };
  const legacyRaw = storage.getItem(legacyKey);
  if (legacyRaw === null) return { status: 'not-needed' };

  const backupKey = `${nextKey}:v1-backup`;
  try {
    const parsed = JSON.parse(legacyRaw) as unknown;
    if (!validate(parsed)) throw new Error(`Legacy payload for ${legacyKey} failed validation.`);

    const backupResult = writeStorageValueWithRecovery(storage, backupKey, legacyRaw);
    if ('error' in backupResult) throw backupResult.error;

    const writeResult = writeStorageValueWithRecovery(storage, nextKey, legacyRaw);
    if ('error' in writeResult) throw writeResult.error;
    if (storage.getItem(nextKey) !== legacyRaw) throw new Error(`Migration verification failed for ${nextKey}.`);

    return { status: 'migrated', backupKey };
  } catch (error) {
    return { status: 'failed', error, backupKey };
  }
}
