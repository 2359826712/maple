import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cachedJsonFetch, realtimeCacheDurations } from '@/services/realtimeCache';
import { isStaticHydration, scheduleAfterStaticHydration } from '@/ssg/hydration';

export type RealtimeStatus = 'idle' | 'syncing' | 'live' | 'cached' | 'unavailable';

interface RealtimeOptions<T extends { id: string }> {
  storageKey: string;
  baseItems: T[];
  intervalMs?: number;
  remoteUrl?: string;
  remoteLoader?: () => Promise<RemotePayload<T> | T[] | null>;
  isValidItem?: (value: unknown) => value is T;
  restoreStoredItemsOnHydration?: boolean;
}

type RealtimePrefetchOptions<T extends { id: string }> = Pick<
  RealtimeOptions<T>,
  'storageKey' | 'remoteLoader' | 'isValidItem' | 'intervalMs'
>;

const channelName = 'maplehub-realtime-content';
const defaultIntervalMs = realtimeCacheDurations.refresh;
const minimumIntervalMs = 60 * 1000;
const staticHydrationAutoSyncDelayMs = 1_500;
const syncMetadataSuffix = ':last-successful-sync';
const inFlightCollectionSyncs = new Map<string, Promise<RemotePayload<{ id: string }> | null>>();

type RemotePayload<T extends { id: string }> = {
  items: T[];
  replace: boolean;
};

const readStoredItems = <T,>(key: string, isValidItem?: (value: unknown) => value is T): T[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return isValidItem ? parsed.filter(isValidItem) : (parsed as T[]);
  } catch {
    return [];
  }
};

const writeStoredItems = <T,>(key: string, items: T[]) => {
  if (typeof window === 'undefined') return;

  try {
    if (items.length === 0) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Local storage can be full or disabled; live state still updates in memory.
  }
};

const readStoredSyncTime = (key: string) => {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(`${key}${syncMetadataSuffix}`) ?? '';
  } catch {
    return '';
  }
};

const writeStoredSyncTime = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${key}${syncMetadataSuffix}`, value);
  } catch {
    // Freshness remains available in memory when storage is unavailable.
  }
};

const mergeById = <T extends { id: string }>(baseItems: T[], liveItems: T[]) => {
  const liveIds = new Set(liveItems.map((item) => item.id));
  return [...liveItems, ...baseItems.filter((item) => !liveIds.has(item.id))];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeRemotePayload = <T extends { id: string }>(
  data: unknown,
  isValidItem?: (value: unknown) => value is T,
): RemotePayload<T> | null => {
  const valid = (item: unknown): item is T => (
    isRecord(item) && typeof item.id === 'string' && (!isValidItem || isValidItem(item))
  );
  if (Array.isArray(data)) {
    return { items: data.filter(valid), replace: false };
  }

  if (!isRecord(data)) return null;

  const rawItems = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.upserts)
      ? data.upserts
      : [];
  const items = rawItems.filter(valid);

  return {
    items,
    replace: data.replace === true,
  };
};

const applyRemotePayload = <T extends { id: string }>(storedItems: T[], payload: RemotePayload<T>) => {
  if (payload.replace) return payload.items;
  if (payload.items.length === 0) return storedItems;
  return mergeById(storedItems, payload.items);
};

const sameCollection = <T,>(a: T[], b: T[]) => JSON.stringify(a) === JSON.stringify(b);

const fetchRemoteItems = async <T extends { id: string }>(
  storageKey: string,
  intervalMs: number,
  remoteUrl?: string,
  remoteLoader?: () => Promise<RemotePayload<T> | T[] | null>,
): Promise<RemotePayload<T> | null> => {
  if (typeof window === 'undefined') return null;

  const existingSync = inFlightCollectionSyncs.get(storageKey);
  if (existingSync) return existingSync as Promise<RemotePayload<T> | null>;

  const request = (async () => {
    if (remoteLoader) {
      try {
        return normalizeRemotePayload<T>(await remoteLoader());
      } catch {
        return null;
      }
    }

    if (!remoteUrl) return null;

    try {
      const url = new URL(remoteUrl, window.location.origin);
      const data = await cachedJsonFetch<unknown>(url.toString(), {
        cacheKey: `realtime-collection:${storageKey}:${url.toString()}`,
        freshMs: intervalMs,
        staleMs: realtimeCacheDurations.week,
      });
      return normalizeRemotePayload<T>(data);
    } catch {
      return null;
    }
  })();

  inFlightCollectionSyncs.set(storageKey, request as Promise<RemotePayload<{ id: string }> | null>);
  try {
    return await request;
  } finally {
    inFlightCollectionSyncs.delete(storageKey);
  }
};

export async function prefetchRealtimeCollection<T extends { id: string }>({
  storageKey,
  remoteLoader,
  isValidItem,
  intervalMs = defaultIntervalMs,
}: RealtimePrefetchOptions<T>) {
  if (typeof window === 'undefined' || !remoteLoader) return [] as T[];

  const refreshIntervalMs = Math.max(intervalMs, minimumIntervalMs);
  const storedItems = readStoredItems<T>(storageKey, isValidItem);
  const previousSyncMs = Date.parse(readStoredSyncTime(storageKey));
  if (storedItems.length > 0
    && Number.isFinite(previousSyncMs)
    && Date.now() - previousSyncMs < refreshIntervalMs) {
    return storedItems;
  }

  const payload = await fetchRemoteItems<T>(storageKey, refreshIntervalMs, undefined, remoteLoader);
  if (!payload || payload.items.length === 0) return storedItems;

  const nextItems = applyRemotePayload(storedItems, payload);
  writeStoredItems(storageKey, nextItems);
  writeStoredSyncTime(storageKey, new Date().toISOString());
  publishRealtimeUpdate(storageKey);
  return nextItems;
}

export function useRealtimeCollection<T extends { id: string }>({
  storageKey,
  baseItems,
  intervalMs = defaultIntervalMs,
  remoteUrl,
  remoteLoader,
  isValidItem,
  restoreStoredItemsOnHydration,
}: RealtimeOptions<T>) {
  const refreshIntervalMs = Math.max(intervalMs, minimumIntervalMs);
  const deferBrowserState = isStaticHydration();
  const initialStorageKeyRef = useRef(storageKey);
  const [liveItems, setLiveItems] = useState<T[]>(() => (
    deferBrowserState ? [] : readStoredItems<T>(storageKey, isValidItem)
  ));
  const [replaceBaseItems, setReplaceBaseItems] = useState(false);
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState(() => (
    deferBrowserState ? '' : readStoredSyncTime(storageKey)
  ));
  const liveItemsStorageKeyRef = useRef(storageKey);
  const syncingKeysRef = useRef(new Set<string>());
  const activeStorageKeyRef = useRef(storageKey);
  activeStorageKeyRef.current = storageKey;

  useEffect(() => {
    liveItemsStorageKeyRef.current = storageKey;
    return scheduleAfterStaticHydration(() => {
      const shouldRestoreStoredItems = restoreStoredItemsOnHydration
        ?? (baseItems.length === 0 || storageKey !== initialStorageKeyRef.current);
      setLiveItems(shouldRestoreStoredItems
        ? readStoredItems<T>(storageKey, isValidItem)
        : []);
      setReplaceBaseItems(false);
      setLastSyncedAt(readStoredSyncTime(storageKey));
      setStatus('idle');
    }, { autoDelayMs: staticHydrationAutoSyncDelayMs });
  }, [baseItems.length, isValidItem, restoreStoredItemsOnHydration, storageKey]);

  const syncCollection = useCallback(async (force = false) => {
    if (syncingKeysRef.current.has(storageKey)) return;

    const storedItems = readStoredItems<T>(storageKey, isValidItem);
    const previousSync = readStoredSyncTime(storageKey);
    const previousSyncMs = Date.parse(previousSync);
    // A timestamp without usable cached content is not a successful sync. This
    // can be left behind by an upstream response that temporarily returned an
    // empty collection, so retry automatically instead of waiting for the
    // configured refresh window.
    if (!force && storedItems.length > 0
      && Number.isFinite(previousSyncMs)
      && Date.now() - previousSyncMs < refreshIntervalMs) {
      setLastSyncedAt(previousSync);
      setStatus('live');
      return;
    }

    syncingKeysRef.current.add(storageKey);
    setStatus('syncing');
    try {
      const remotePayload = await fetchRemoteItems<T>(storageKey, refreshIntervalMs, remoteUrl, remoteLoader);
      // Never replace known-good content, or record a successful sync, from an
      // empty remote payload. Empty upstream responses are indistinguishable
      // from the regional source outages this cache is intended to absorb.
      const acceptedPayload = remotePayload && remotePayload.items.length > 0 ? remotePayload : null;
      const nextItems = acceptedPayload ? applyRemotePayload(storedItems, acceptedPayload) : storedItems;
      const changed = !sameCollection(storedItems, nextItems);

      if (acceptedPayload) {
        setReplaceBaseItems(acceptedPayload.replace);
      }

      if (changed) {
        writeStoredItems(storageKey, nextItems);
        publishRealtimeUpdate(storageKey);
      }

      if (activeStorageKeyRef.current !== storageKey) return;

      setLiveItems(nextItems);
      if (acceptedPayload) {
        const syncedAt = new Date().toISOString();
        setLastSyncedAt(syncedAt);
        writeStoredSyncTime(storageKey, syncedAt);
      }
      window.setTimeout(() => {
        if (activeStorageKeyRef.current === storageKey) {
          setStatus(acceptedPayload
            ? 'live'
            : storedItems.length > 0 && Boolean(previousSync)
              ? 'cached'
              : 'unavailable');
        }
      }, 200);
    } finally {
      syncingKeysRef.current.delete(storageKey);
    }
  }, [isValidItem, refreshIntervalMs, remoteLoader, remoteUrl, storageKey]);

  const syncNow = useCallback(() => syncCollection(true), [syncCollection]);

  useEffect(() => {
    const cancelInitialSync = scheduleAfterStaticHydration(
      () => { void syncCollection(); },
      { autoDelayMs: staticHydrationAutoSyncDelayMs },
    );
    const timer = window.setInterval(() => { void syncCollection(); }, refreshIntervalMs);
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(channelName) : null;

    const onMessage = (event: MessageEvent<{ storageKey?: string }>) => {
      if (!event.data?.storageKey || event.data.storageKey === storageKey) void syncCollection();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) void syncCollection();
    };

    const onFocus = () => {
      void syncCollection();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void syncCollection();
    };

    channel?.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelInitialSync();
      window.clearInterval(timer);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      channel?.removeEventListener('message', onMessage);
      channel?.close();
    };
  }, [refreshIntervalMs, storageKey, syncCollection]);

  const partitionIsCurrent = liveItemsStorageKeyRef.current === storageKey;
  const activeLiveItems = partitionIsCurrent ? liveItems : readStoredItems<T>(storageKey, isValidItem);
  const activeReplaceBaseItems = partitionIsCurrent ? replaceBaseItems : false;
  const items = useMemo(
    () => (activeReplaceBaseItems && activeLiveItems.length > 0
      ? activeLiveItems
      : mergeById(baseItems, activeLiveItems)),
    [activeLiveItems, activeReplaceBaseItems, baseItems],
  );

  return {
    items,
    liveCount: activeLiveItems.length || baseItems.length,
    lastSyncedAt: partitionIsCurrent ? lastSyncedAt : readStoredSyncTime(storageKey),
    status: partitionIsCurrent ? status : 'idle',
    syncNow,
  };
}

export function publishRealtimeUpdate(storageKey: string) {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
  const channel = new BroadcastChannel(channelName);
  channel.postMessage({ storageKey, at: new Date().toISOString() });
  channel.close();
}
