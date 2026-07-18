// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { prefetchRealtimeCollection, useRealtimeCollection } from './useRealtimeCollection';

const remoteLoader = vi.fn().mockResolvedValue(null);
const isValidTitledItem = (value: unknown): value is { id: string; title: string } => (
  typeof value === 'object'
  && value !== null
  && typeof (value as { id?: unknown }).id === 'string'
  && typeof (value as { title?: unknown }).title === 'string'
);

function Probe({ storageKey }: { storageKey: string }) {
  const { items } = useRealtimeCollection<{ id: string }>({
    storageKey,
    baseItems: [],
    intervalMs: 60_000,
    remoteLoader,
  });
  return <output>{items.map((item) => item.id).join(',')}</output>;
}

function ValidatedProbe({ storageKey }: { storageKey: string }) {
  const { items } = useRealtimeCollection<{ id: string; title: string }>({
    storageKey,
    baseItems: [],
    intervalMs: 60_000,
    remoteLoader,
    isValidItem: isValidTitledItem,
  });
  return <output>{items.map((item) => item.title).join(',')}</output>;
}

function StatusProbe({ storageKey }: { storageKey: string }) {
  const { status } = useRealtimeCollection<{ id: string }>({
    storageKey,
    baseItems: [],
    intervalMs: 60_000,
    remoteLoader,
  });
  return <output>{status}</output>;
}

function ManualRefreshProbe({ storageKey }: { storageKey: string }) {
  const { items, syncNow } = useRealtimeCollection<{ id: string }>({
    storageKey,
    baseItems: [],
    intervalMs: 60_000,
    remoteLoader,
  });
  return (
    <>
      <output>{items.map((item) => item.id).join(',')}</output>
      <button type="button" onClick={syncNow}>Refresh</button>
    </>
  );
}

function ServerSnapshotProbe({ storageKey }: { storageKey: string }) {
  const { items, liveCount } = useRealtimeCollection<{ id: string }>({
    storageKey,
    baseItems: [{ id: 'server-item' }],
    intervalMs: 60_000,
    remoteLoader,
  });
  return <output>{`${items.map((item) => item.id).join(',')}|${liveCount}`}</output>;
}

describe('useRealtimeCollection storage partitions', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('news:gms', JSON.stringify([{ id: 'gms-item' }]));
    localStorage.setItem('news:jms', JSON.stringify([{ id: 'jms-item' }]));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('replaces visible items immediately when the server storage key changes', () => {
    const view = render(<Probe storageKey="news:gms" />);
    expect(screen.getByText('gms-item')).toBeTruthy();

    view.rerender(<Probe storageKey="news:jms" />);
    expect(screen.getByText('jms-item')).toBeTruthy();
    expect(screen.queryByText('gms-item')).toBeNull();
  });

  it('does not fetch a collection again during its configured freshness window', async () => {
    localStorage.setItem('news:gms:last-successful-sync', new Date().toISOString());
    render(<Probe storageKey="news:gms" />);

    await act(async () => Promise.resolve());

    expect(remoteLoader).not.toHaveBeenCalled();
  });

  it('lets a manual refresh bypass the configured freshness window', async () => {
    localStorage.setItem('news:gms:last-successful-sync', new Date().toISOString());
    remoteLoader.mockResolvedValueOnce({ items: [{ id: 'new-item' }], replace: true });
    render(<ManualRefreshProbe storageKey="news:gms" />);

    await act(async () => Promise.resolve());
    expect(remoteLoader).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(screen.getByText('new-item')).toBeTruthy());
    expect(remoteLoader).toHaveBeenCalledTimes(1);
  });

  it('stores prefetched collections so the destination page does not request them again', async () => {
    const preload = vi.fn().mockResolvedValue({ items: [{ id: 'prefetched-item' }], replace: true });
    const items = await prefetchRealtimeCollection({ storageKey: 'news:prefetched', remoteLoader: preload });

    expect(items).toEqual([{ id: 'prefetched-item' }]);
    expect(JSON.parse(localStorage.getItem('news:prefetched') || '[]')).toEqual([{ id: 'prefetched-item' }]);
    expect(localStorage.getItem('news:prefetched:last-successful-sync')).toBeTruthy();

    render(<Probe storageKey="news:prefetched" />);
    await act(async () => Promise.resolve());
    expect(screen.getByText('prefetched-item')).toBeTruthy();
    expect(remoteLoader).not.toHaveBeenCalled();
  });

  it('retries automatically when a fresh sync timestamp has no cached content', async () => {
    localStorage.removeItem('news:gms');
    localStorage.setItem('news:gms:last-successful-sync', new Date().toISOString());
    render(<Probe storageKey="news:gms" />);

    await act(async () => Promise.resolve());

    expect(remoteLoader).toHaveBeenCalledTimes(1);
  });

  it('keeps showing a verified cached snapshot when the source is temporarily unavailable', async () => {
    vi.useFakeTimers();
    localStorage.setItem('news:gms:last-successful-sync', new Date(Date.now() - 13 * 60 * 60 * 1_000).toISOString());

    try {
      render(<StatusProbe storageKey="news:gms" />);
      await act(async () => { await vi.advanceTimersByTimeAsync(201); });

      expect(screen.getByText('cached')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('starts the live sync automatically after the static hydration inspection window', async () => {
    vi.useFakeTimers();
    const staticRoot = document.createElement('div');
    staticRoot.id = 'root';
    staticRoot.setAttribute('data-ssg-route', '/news/en/GMS');
    document.body.appendChild(staticRoot);

    try {
      render(<Probe storageKey="news:gms" />);
      expect(remoteLoader).not.toHaveBeenCalled();

      await act(async () => { await vi.advanceTimersByTimeAsync(1_501); });

      expect(remoteLoader).toHaveBeenCalledTimes(1);
    } finally {
      staticRoot.remove();
      vi.useRealTimers();
    }
  });

  it('keeps a server snapshot stable instead of flashing cached items', async () => {
    vi.useFakeTimers();
    const staticRoot = document.createElement('div');
    staticRoot.id = 'root';
    staticRoot.setAttribute('data-ssg-route', '/news/en/GMS');
    document.body.appendChild(staticRoot);
    localStorage.setItem('news:gms:last-successful-sync', new Date().toISOString());

    try {
      render(<ServerSnapshotProbe storageKey="news:gms" />);
      expect(screen.getByText('server-item|1')).toBeTruthy();

      await act(async () => { await vi.advanceTimersByTimeAsync(1_501); });

      expect(screen.getByText('server-item|1')).toBeTruthy();
      expect(screen.queryByText(/gms-item/)).toBeNull();
      expect(remoteLoader).not.toHaveBeenCalled();
    } finally {
      staticRoot.remove();
      vi.useRealTimers();
    }
  });

  it('drops malformed cached records before a page renders them', () => {
    localStorage.setItem('news:gms', JSON.stringify([
      { id: 'stale-without-title' },
      { id: 'valid', title: 'Safe cached item' },
    ]));

    render(<ValidatedProbe storageKey="news:gms" />);

    expect(screen.getByText('Safe cached item')).toBeTruthy();
    expect(screen.queryByText('stale-without-title')).toBeNull();
  });
});
