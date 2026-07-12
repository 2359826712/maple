type RealtimeCacheEntry<T> = {
  savedAt: number;
  data: T;
};

type RealtimeCacheHit<T> = {
  hit: boolean;
  data: T | null;
  savedAt: number | null;
};

type CachedJsonFetchOptions = {
  cacheKey?: string;
  freshMs?: number;
  staleMs?: number;
  retryMs?: number;
  timeoutMs?: number;
  requestInit?: globalThis.RequestInit;
};

type CachedTextFetchOptions = CachedJsonFetchOptions & {
  transform?: (value: string) => string;
};

const realtimeCachePrefix = 'maplehub-realtime-cache:';
const realtimeFailurePrefix = 'maplehub-realtime-failure:';

export const realtimeCacheDurations = {
  short: 5 * 60 * 1000,
  medium: 30 * 60 * 1000,
  long: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
} as const;

const hashKey = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }

  return `${realtimeCachePrefix}${Math.abs(hash).toString(36)}`;
};

const failureKey = (value: string) => `${realtimeFailurePrefix}${hashKey(value).replace(realtimeCachePrefix, '')}`;

const readRealtimeCache = <T,>(key: string, maxAgeMs: number): RealtimeCacheHit<T> => {
  if (typeof window === 'undefined') return { hit: false, data: null, savedAt: null };

  try {
    const raw = window.localStorage.getItem(hashKey(key));
    if (!raw) return { hit: false, data: null, savedAt: null };

    const entry = JSON.parse(raw) as RealtimeCacheEntry<T>;
    if (!entry || typeof entry.savedAt !== 'number') return { hit: false, data: null, savedAt: null };
    if (Date.now() - entry.savedAt > maxAgeMs) return { hit: false, data: null, savedAt: entry.savedAt };

    return { hit: true, data: entry.data, savedAt: entry.savedAt };
  } catch {
    return { hit: false, data: null, savedAt: null };
  }
};

export const getRealtimeCacheSavedAt = (key: string) =>
  readRealtimeCache<unknown>(key, Number.POSITIVE_INFINITY).savedAt;

const writeRealtimeCache = <T,>(key: string, data: T) => {
  if (typeof window === 'undefined') return;

  try {
    const entry: RealtimeCacheEntry<T> = { savedAt: Date.now(), data };
    window.localStorage.setItem(hashKey(key), JSON.stringify(entry));
    window.localStorage.removeItem(failureKey(key));
  } catch {
    // Cache writes are best-effort; callers can still use the live response.
  }
};

const readRecentFailure = (key: string, maxAgeMs: number) => {
  if (typeof window === 'undefined') return false;

  try {
    const savedAt = Number(window.localStorage.getItem(failureKey(key)));
    return Number.isFinite(savedAt) && Date.now() - savedAt <= maxAgeMs;
  } catch {
    return false;
  }
};

const writeRecentFailure = (key: string) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(failureKey(key), String(Date.now()));
  } catch {
    // Failure throttling is best-effort.
  }
};

export async function cachedJsonFetch<T>(url: string, options: CachedJsonFetchOptions = {}) {
  const {
    cacheKey = url,
    freshMs = realtimeCacheDurations.short,
    staleMs = realtimeCacheDurations.long,
    retryMs = 60 * 1000,
    timeoutMs = 5000,
    requestInit = {},
  } = options;

  const freshCache = readRealtimeCache<T>(cacheKey, freshMs);
  if (freshCache.hit) return freshCache.data as T;

  const staleCache = readRealtimeCache<T>(cacheKey, staleMs);
  if (readRecentFailure(cacheKey, retryMs)) {
    if (staleCache.hit) return staleCache.data as T;
    throw new Error('Realtime request is cooling down after a recent failure');
  }

  const controller = new AbortController();
  const externalSignal = requestInit.signal;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal?.aborted) {
    controller.abort(externalSignal.reason);
  } else {
    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
  }

  const { signal: _signal, ...fetchInit } = requestInit;

  try {
    const response = await fetch(url, { ...fetchInit, cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`Realtime request failed with ${response.status}`);

    const data = (await response.json()) as T;
    writeRealtimeCache(cacheKey, data);
    return data;
  } catch (error) {
    if (externalSignal?.aborted) throw error;
    writeRecentFailure(cacheKey);
    if (staleCache.hit) return staleCache.data as T;
    throw error instanceof Error ? error : new Error('Realtime request failed');
  } finally {
    window.clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

export async function cachedTextFetch(url: string, options: CachedTextFetchOptions = {}) {
  const {
    cacheKey = url,
    freshMs = realtimeCacheDurations.short,
    staleMs = realtimeCacheDurations.long,
    retryMs = 60 * 1000,
    timeoutMs = 5000,
    requestInit = {},
    transform = (value) => value,
  } = options;

  const freshCache = readRealtimeCache<string>(cacheKey, freshMs);
  if (freshCache.hit) return transform(freshCache.data as string);

  const staleCache = readRealtimeCache<string>(cacheKey, staleMs);
  if (readRecentFailure(cacheKey, retryMs)) {
    if (staleCache.hit) return transform(staleCache.data as string);
    throw new Error('Realtime request is cooling down after a recent failure');
  }

  const controller = new AbortController();
  const externalSignal = requestInit.signal;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal?.aborted) {
    controller.abort(externalSignal.reason);
  } else {
    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
  }

  const { signal: _signal, ...fetchInit } = requestInit;

  try {
    const response = await fetch(url, { ...fetchInit, cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`Realtime request failed with ${response.status}`);

    const data = transform(await response.text());
    writeRealtimeCache(cacheKey, data);
    return data;
  } catch (error) {
    if (externalSignal?.aborted) throw error;
    writeRecentFailure(cacheKey);
    if (staleCache.hit) return transform(staleCache.data as string);
    throw error instanceof Error ? error : new Error('Realtime request failed');
  } finally {
    window.clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}
