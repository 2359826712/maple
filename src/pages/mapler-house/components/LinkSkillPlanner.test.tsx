// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import LinkSkillPlanner from './LinkSkillPlanner';

const { addCharacter, versionState } = vi.hoisted(() => ({
  addCharacter: vi.fn((input) => ({
    ...input,
    id: 'new-character',
    isDefault: false,
  })),
  versionState: { value: 'gms' },
}));

vi.mock('@/hooks/VersionContext', () => ({
  useVersion: () => ({
    version: versionState.value,
    versionInfo: { id: versionState.value, shortLabel: versionState.value.toUpperCase() },
  }),
}));

vi.mock('@/hooks/useCharacters', () => ({
  useCharacters: () => ({
    characters: [
      { id: 'mercedes', name: 'Merc', className: 'Mercedes', level: 210, server: 'GMS', world: 'Scania', isDefault: true },
      { id: 'evan', name: 'Dragon', className: 'Evan', level: 210, server: 'GMS', world: 'Scania', isDefault: false },
    ],
    addCharacter,
  }),
}));

describe('LinkSkillPlanner', () => {
  beforeEach(async () => {
    localStorage.clear();
    addCharacter.mockClear();
    versionState.value = 'gms';
    await i18n.changeLanguage('en');
  });

  afterEach(() => cleanup());

  it('syncs owned ranks, builds a loadout, and saves it per server', async () => {
    render(<LinkSkillPlanner />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Hide setup guide' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Sync character roster' }));
    expect(screen.getByText('Detected 2 Link Skills from your roster.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Training' }));
    fireEvent.click(screen.getByRole('button', { name: 'Auto-build from owned' }));

    const loadout = screen.getByRole('heading', { name: 'Current loadout' }).closest('section');
    expect(loadout).toBeTruthy();
    expect(within(loadout as HTMLElement).getByText('Mercedes')).toBeTruthy();
    expect(within(loadout as HTMLElement).getByText('Evan')).toBeTruthy();

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('maplehub-link-planner:v2:gms') ?? '{}') as {
        ranks?: Record<string, number>;
        loadouts?: { training?: string[] };
      };
      expect(saved.ranks).toMatchObject({ mercedes: 3, evan: 3 });
      expect(saved.loadouts?.training).toEqual(['mercedes', 'evan']);
    });
  });

  it('shows first-time instructions and opens a server-aware character form', () => {
    render(<LinkSkillPlanner />);

    const guideHeading = screen.getByRole('heading', { name: 'Build your first loadout in three steps' });
    const guide = guideHeading.closest('section');
    expect(guide).toBeTruthy();
    expect(within(guide as HTMLElement).getByText('Confirm your server')).toBeTruthy();
    expect(within(guide as HTMLElement).getByText('Record your Link characters')).toBeTruthy();
    expect(within(guide as HTMLElement).getByText('Choose an activity and build')).toBeTruthy();

    fireEvent.click(within(guide as HTMLElement).getByRole('button', { name: 'Add character' }));

    const dialog = screen.getByRole('dialog', { name: 'Add Character' });
    const selects = within(dialog).getAllByRole('combobox');
    expect((selects[1] as HTMLSelectElement).value).toBe('GMS');
  });

  it('loads a separate planner when the selected server changes', () => {
    localStorage.setItem('maplehub-link-planner:v2:gms', JSON.stringify({
      ranks: { mercedes: 3 },
      loadouts: { bossing: ['mercedes'], training: [], farming: [] },
    }));
    const view = render(<LinkSkillPlanner />);
    expect(screen.queryByRole('heading', { name: 'Build your first loadout in three steps' })).toBeNull();

    versionState.value = 'msea';
    view.rerender(<LinkSkillPlanner />);

    expect(screen.getByRole('heading', { name: 'Build your first loadout in three steps' })).toBeTruthy();
    expect(screen.getAllByText('MSEA').length).toBeGreaterThan(0);
  });
});
