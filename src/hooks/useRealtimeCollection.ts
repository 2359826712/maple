import { useCallback, useEffect, useMemo, useState } from 'react';

type RealtimeStatus = 'idle' | 'syncing' | 'live';

interface RealtimeOptions<T extends { id: string }> {
  storageKey: string;
  baseItems: T[];
  intervalMs?: number;
  remoteUrl?: string;
}

const channelName = 'maplehub-realtime-content';
const defaultIntervalMs = 10000;

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

const fetchRemoteItems = async <T extends { id: string }>(remoteUrl?: string): Promise<RemotePayload<T> | null> => {
  if (typeof window === 'undefined' || !remoteUrl) return null;

  try {
    const url = new URL(remoteUrl, window.location.origin);
    url.searchParams.set('_', Date.now().toString());
    const response = await window.fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;

    const data = await response.json();
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
}: RealtimeOptions<T>) {
  const [liveItems, setLiveItems] = useState<T[]>(() => readStoredItems<T>(storageKey));
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date().toISOString());

  const syncNow = useCallback(async () => {
    setStatus('syncing');
    const storedItems = readStoredItems<T>(storageKey);
    const remotePayload = await fetchRemoteItems<T>(remoteUrl);
    const nextItems = remotePayload ? applyRemotePayload(storedItems, remotePayload) : storedItems;
    const changed = !sameCollection(storedItems, nextItems);

    if (changed) {
      writeStoredItems(storageKey, nextItems);
      publishRealtimeUpdate(storageKey);
    }

    setLiveItems(nextItems);
    setLastSyncedAt(new Date().toISOString());
    window.setTimeout(() => setStatus('live'), 200);
  }, [remoteUrl, storageKey]);

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

  const items = useMemo(() => mergeById(baseItems, liveItems), [baseItems, liveItems]);

  return {
    items,
    liveCount: liveItems.length,
    lastSyncedAt,
    status,
    syncNow,
  };
}

export function publishRealtimeUpdate(storageKey: string) {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
  const channel = new BroadcastChannel(channelName);
  channel.postMessage({ storageKey, at: new Date().toISOString() });
  channel.close();
}
