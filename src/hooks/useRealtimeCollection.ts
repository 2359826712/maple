import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cachedJsonFetch, realtimeCacheDurations } from '@/services/realtimeCache';

export type RealtimeStatus = 'idle' | 'syncing' | 'live' | 'unavailable';

interface RealtimeOptions<T extends { id: string }> {
  storageKey: string;
  baseItems: T[];
  intervalMs?: number;
  remoteUrl?: string;
  remoteLoader?: () => Promise<RemotePayload<T> | T[] | null>;
}

const channelName = 'maplehub-realtime-content';
const defaultIntervalMs = 60000;
const syncMetadataSuffix = ':last-successful-sync';

type RemotePayload<T extends { id: string }> = {
  items: T[];
  replace: boolean;
};

const readStoredItems = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
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

const normalizeRemotePayload = <T extends { id: string }>(data: unknown): RemotePayload<T> | null => {
  if (Array.isArray(data)) {
    return { items: data.filter((item): item is T => isRecord(item) && typeof item.id === 'string'), replace: false };
  }

  if (!isRecord(data)) return null;

  const rawItems = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.upserts)
      ? data.upserts
      : [];
  const items = rawItems.filter((item): item is T => isRecord(item) && typeof item.id === 'string');

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
      staleMs: realtimeCacheDurations.long,
    });
    return normalizeRemotePayload<T>(data);
  } catch {
    return null;
  }
};

export function useRealtimeCollection<T extends { id: string }>({
  storageKey,
  baseItems,
  intervalMs = defaultIntervalMs,
  remoteUrl,
  remoteLoader,
}: RealtimeOptions<T>) {
  const [liveItems, setLiveItems] = useState<T[]>(() => readStoredItems<T>(storageKey));
  const [replaceBaseItems, setReplaceBaseItems] = useState(false);
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState(() => readStoredSyncTime(storageKey));
  const liveItemsStorageKeyRef = useRef(storageKey);
  const syncingKeysRef = useRef(new Set<string>());
  const activeStorageKeyRef = useRef(storageKey);
  activeStorageKeyRef.current = storageKey;

  useEffect(() => {
    liveItemsStorageKeyRef.current = storageKey;
    setLiveItems(readStoredItems<T>(storageKey));
    setReplaceBaseItems(false);
    setLastSyncedAt(readStoredSyncTime(storageKey));
    setStatus('idle');
  }, [storageKey]);

  const syncNow = useCallback(async () => {
    if (syncingKeysRef.current.has(storageKey)) return;

    syncingKeysRef.current.add(storageKey);
    setStatus('syncing');
    try {
      const storedItems = readStoredItems<T>(storageKey);
      const remotePayload = await fetchRemoteItems<T>(storageKey, intervalMs, remoteUrl, remoteLoader);
      const nextItems = remotePayload ? applyRemotePayload(storedItems, remotePayload) : storedItems;
      const changed = !sameCollection(storedItems, nextItems);

      if (remotePayload) {
        setReplaceBaseItems(remotePayload.replace);
      }

      if (changed) {
        writeStoredItems(storageKey, nextItems);
        publishRealtimeUpdate(storageKey);
      }

      if (activeStorageKeyRef.current !== storageKey) return;

      setLiveItems(nextItems);
      if (remotePayload) {
        const syncedAt = new Date().toISOString();
        setLastSyncedAt(syncedAt);
        writeStoredSyncTime(storageKey, syncedAt);
      }
      window.setTimeout(() => {
        if (activeStorageKeyRef.current === storageKey) {
          setStatus(remotePayload ? 'live' : 'unavailable');
        }
      }, 200);
    } finally {
      syncingKeysRef.current.delete(storageKey);
    }
  }, [intervalMs, remoteLoader, remoteUrl, storageKey]);

  useEffect(() => {
    void syncNow();
    const timer = window.setInterval(syncNow, intervalMs);
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(channelName) : null;

    const onMessage = (event: MessageEvent<{ storageKey?: string }>) => {
      if (!event.data?.storageKey || event.data.storageKey === storageKey) void syncNow();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) void syncNow();
    };

    const onFocus = () => {
      void syncNow();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void syncNow();
    };

    channel?.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      channel?.removeEventListener('message', onMessage);
      channel?.close();
    };
  }, [intervalMs, storageKey, syncNow]);

  const partitionIsCurrent = liveItemsStorageKeyRef.current === storageKey;
  const activeLiveItems = partitionIsCurrent ? liveItems : readStoredItems<T>(storageKey);
  const activeReplaceBaseItems = partitionIsCurrent ? replaceBaseItems : false;
  const items = useMemo(
    () => (activeReplaceBaseItems && activeLiveItems.length > 0
      ? activeLiveItems
      : mergeById(baseItems, activeLiveItems)),
    [activeLiveItems, activeReplaceBaseItems, baseItems],
  );

  return {
    items,
    liveCount: activeLiveItems.length,
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
