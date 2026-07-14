import { apiBaseUrl, apiEndpoint } from './apiEndpoint';

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

type CachedValueLoadOptions = Pick<CachedJsonFetchOptions, 'freshMs' | 'staleMs' | 'retryMs'>;

const realtimeCachePrefix = 'maplehub-realtime-cache:';
const realtimeFailurePrefix = 'maplehub-realtime-failure:';
const inFlightValueLoads = new Map<string, Promise<unknown>>();

export const realtimeCacheDurations = {
  refresh: 12 * 60 * 60 * 1000,
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

const base64Body = (value: globalThis.RequestInit['body']) => {
  if (value == null) return '';
  if (typeof value !== 'string') {
    throw new Error('Static content requests require a string request body');
  }
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return window.btoa(binary);
};

const staticContentTransport = (url: string, requestInit: globalThis.RequestInit) => {
  const parsed = new URL(url, window.location.origin);
  const apiRoot = new URL(apiBaseUrl, window.location.origin);
  const isApiRequest = parsed.origin === apiRoot.origin
    && (parsed.pathname === apiRoot.pathname || parsed.pathname.startsWith(`${apiRoot.pathname}/`));
  if (parsed.origin === window.location.origin || isApiRequest) return { url, requestInit };

  const method = (requestInit.method || 'GET').toUpperCase();
  if (method === 'GET') {
    return {
      url: apiEndpoint(`/static-content?url=${encodeURIComponent(parsed.toString())}`),
      requestInit: { signal: requestInit.signal } satisfies globalThis.RequestInit,
    };
  }

  const headers = new Headers(requestInit.headers);
  const forwardedHeaders = ['Accept', 'Content-Type', 'X-Requested-With'].reduce<Record<string, string>>((result, name) => {
    const value = headers.get(name);
    if (value) result[name] = value;
    return result;
  }, {});
  return {
    url: apiEndpoint('/static-content'),
    requestInit: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: parsed.toString(),
        method,
        headers: forwardedHeaders,
        body: base64Body(requestInit.body),
      }),
      signal: requestInit.signal,
    } satisfies globalThis.RequestInit,
  };
};

export async function cachedValueLoad<T>(
  cacheKey: string,
  loader: () => Promise<T>,
  options: CachedValueLoadOptions = {},
) {
  const {
    freshMs = realtimeCacheDurations.refresh,
    staleMs = realtimeCacheDurations.long,
    retryMs = 60 * 1000,
  } = options;
  const freshCache = readRealtimeCache<T>(cacheKey, freshMs);
  if (freshCache.hit) return freshCache.data as T;

  const staleCache = readRealtimeCache<T>(cacheKey, staleMs);
  if (readRecentFailure(cacheKey, retryMs)) {
    if (staleCache.hit) return staleCache.data as T;
    throw new Error('Remote content load is cooling down after a recent failure');
  }

  const existingLoad = inFlightValueLoads.get(cacheKey);
  if (existingLoad) return existingLoad as Promise<T>;

  const request = loader()
    .then((data) => {
      writeRealtimeCache(cacheKey, data);
      return data;
    })
    .catch((error: unknown) => {
      writeRecentFailure(cacheKey);
      if (staleCache.hit) return staleCache.data as T;
      throw error instanceof Error ? error : new Error('Remote content load failed');
    })
    .finally(() => {
      inFlightValueLoads.delete(cacheKey);
    });

  inFlightValueLoads.set(cacheKey, request);
  return request;
}

export async function cachedJsonFetch<T>(url: string, options: CachedJsonFetchOptions = {}) {
  const {
    cacheKey = url,
    freshMs = realtimeCacheDurations.refresh,
    staleMs = realtimeCacheDurations.long,
    retryMs = 60 * 1000,
    timeoutMs = 50_000,
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
  const transport = staticContentTransport(url, { ...fetchInit, signal: controller.signal });

  try {
    const response = await fetch(transport.url, { ...transport.requestInit, cache: 'no-store', signal: controller.signal });
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
    freshMs = realtimeCacheDurations.refresh,
    staleMs = realtimeCacheDurations.long,
    retryMs = 60 * 1000,
    timeoutMs = 50_000,
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
  const transport = staticContentTransport(url, { ...fetchInit, signal: controller.signal });

  try {
    const response = await fetch(transport.url, { ...transport.requestInit, cache: 'no-store', signal: controller.signal });
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
