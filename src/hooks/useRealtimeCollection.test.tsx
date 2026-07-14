// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useRealtimeCollection } from './useRealtimeCollection';

const remoteLoader = vi.fn().mockResolvedValue(null);

function Probe({ storageKey }: { storageKey: string }) {
  const { items } = useRealtimeCollection<{ id: string }>({
    storageKey,
    baseItems: [],
    intervalMs: 60_000,
    remoteLoader,
  });
  return <output>{items.map((item) => item.id).join(',')}</output>;
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

  it('does not fetch a collection again during its 12-hour freshness window', async () => {
    localStorage.setItem('news:gms:last-successful-sync', new Date().toISOString());
    render(<Probe storageKey="news:gms" />);

    await act(async () => Promise.resolve());

    expect(remoteLoader).not.toHaveBeenCalled();
  });
});
