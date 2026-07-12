// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VersionProvider } from '@/hooks/VersionContext';
import i18n from '@/i18n';

vi.mock('@/hooks/useRealtimeCollection', () => ({
  useRealtimeCollection: () => ({
    items: [],
    liveCount: 0,
    lastSyncedAt: null,
    status: 'idle',
    syncNow: vi.fn(),
  }),
}));

import Hero from './components/Hero';
import QuickTools from './components/QuickTools';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <VersionProvider>{children}</VersionProvider>
  </MemoryRouter>
);

describe('homepage consolidation', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  afterEach(() => cleanup());

  it('keeps one content-search input in the new-player hero', () => {
    render(<Hero />, { wrapper: Wrapper });

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByPlaceholderText('Search a class, boss, item or player IGN...')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Enter character name...')).toBeNull();
  });

  it('does not repeat Character Lookup in Quick Tools', () => {
    render(<QuickTools />, { wrapper: Wrapper });

    expect(screen.queryByText('Character Lookup')).toBeNull();
    expect(screen.getByText('Star Force Sim')).toBeTruthy();
    expect(document.querySelectorAll('#tools h3')).toHaveLength(4);
  });
});
