// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VersionProvider } from '@/hooks/VersionContext';
import { eligibleTasksForLevel } from '@/domain/checklistEligibility';
import { bosses } from '@/mocks/bosses';
import i18n from '@/i18n';

vi.mock('@/pages/home/components/Navbar', () => ({ default: () => null }));
vi.mock('@/pages/home/components/Footer', () => ({ default: () => null }));
vi.mock('@/pages/home/components/NotificationDrawer', () => ({ default: () => null }));

import ChecklistPage from './page';

const renderChecklist = () => render(
  <MemoryRouter>
    <VersionProvider>
      <ChecklistPage />
    </VersionProvider>
  </MemoryRouter>,
);

describe('DAILY-01 first-run setup', () => {
  afterEach(() => cleanup());
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  it('shows exactly three required setup fields and persists one active character', async () => {
    const firstRender = renderChecklist();

    const requiredFields = firstRender.container.querySelectorAll('input[required], select[required]');
    expect(requiredFields).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Set up your daily checklist' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Game version'), { target: { value: 'gms' } });
    fireEvent.change(screen.getByLabelText('Character name'), { target: { value: 'DailyHero' } });
    fireEvent.change(screen.getByLabelText('Character level'), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create my checklist' }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('maplehub-characters:v2') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        name: 'DailyHero',
        level: 250,
        server: 'GMS',
        world: '',
        className: '',
        isDefault: true,
      });
    });
    expect(screen.queryByRole('heading', { name: 'Set up your daily checklist' })).toBeNull();
    expect(screen.getAllByText('Zakum').length).toBeGreaterThan(0);
    expect(screen.queryByText('Kalos')).toBeNull();

    firstRender.unmount();
    renderChecklist();
    expect(screen.queryByRole('heading', { name: 'Set up your daily checklist' })).toBeNull();
    expect(screen.getByText('DailyHero')).toBeTruthy();
  });

  it('computes eligible tasks from the character level boundary', () => {
    const eligibleAt250 = eligibleTasksForLevel(bosses, 250);
    expect(eligibleAt250.some((boss) => boss.id === 'zakum')).toBe(true);
    expect(eligibleAt250.some((boss) => boss.id === 'kalos')).toBe(false);
    expect(eligibleTasksForLevel(bosses, 260).some((boss) => boss.id === 'kalos')).toBe(true);
  });

  it('reveals all tasks in edit mode and persists a difficulty selection across reload', async () => {
    localStorage.setItem('maplehub-characters:v2', JSON.stringify([{
      id: 'local-1',
      name: 'Selector',
      className: '',
      level: 250,
      server: 'GMS',
      world: '',
      isDefault: true,
    }]));
    const firstRender = renderChecklist();

    expect(screen.queryByText('Kalos')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Edit checklist' }));
    expect(screen.queryByText('Kalos')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show ineligible' }));
    expect(screen.getAllByText('Kalos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Available at Lv.260').length).toBeGreaterThan(0);

    const zakumDifficultyGroup = screen.getByRole('group', { name: 'Choose a difficulty for Zakum' });
    fireEvent.click(within(zakumDifficultyGroup).getByRole('button', { name: /Easy/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Done editing' }));

    await waitFor(() => {
      const config = JSON.parse(localStorage.getItem('maplehub-checklist-config-local-1:v1') || 'null');
      expect(config?.selectedTaskIds).toContain('zakum:Easy');
      expect(config?.selectedTaskIds).not.toContain('zakum:Chaos');
      expect(config?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
    expect(document.querySelector('[data-boss-id="zakum"]')?.textContent).toContain('Easy');

    firstRender.unmount();
    renderChecklist();
    expect(document.querySelector('[data-boss-id="zakum"]')?.textContent).toContain('Easy');
    expect(screen.queryByText('Kalos')).toBeNull();
  });

  it.each([375, 1440])('keeps the complete setup form available at %dpx', (width) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    window.dispatchEvent(new Event('resize'));
    const { container } = renderChecklist();
    const region = screen.getByRole('region', { name: 'Set up your daily checklist' });
    expect(region).toBeTruthy();
    expect(container.querySelectorAll('input[required], select[required]')).toHaveLength(3);
    expect(region.querySelector('form')?.className).toContain('space-y-4');
  });

  it('applies a weekly-boss preset after the core selection model is available', async () => {
    localStorage.setItem('maplehub-characters:v2', JSON.stringify([{
      id: 'local-preset',
      name: 'PresetTester',
      className: '',
      level: 250,
      server: 'GMS',
      world: '',
      isDefault: true,
    }]));
    renderChecklist();

    fireEvent.click(screen.getByRole('button', { name: 'Edit checklist' }));
    fireEvent.click(screen.getByRole('button', { name: 'Weekly bosses' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done editing' }));

    await waitFor(() => {
      const config = JSON.parse(localStorage.getItem('maplehub-checklist-config-local-preset:v1') || 'null');
      expect(config?.selectedTaskIds).toContain('lotus:Extreme');
      expect(config?.selectedTaskIds).toContain('zakum:Chaos');
      expect(config?.selectedTaskIds.some((id: string) => id.startsWith('horntail:'))).toBe(false);
    });
  });
});

describe('DAILY-03 Today / This Week grouping', () => {
  afterEach(() => cleanup());
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
    localStorage.setItem('maplehub-characters:v2', JSON.stringify([{
      id: 'local-1',
      name: 'GroupTester',
      className: '',
      level: 250,
      server: 'GMS',
      world: '',
      isDefault: true,
    }]));
  });

  it('shows Today and This Week group headers with progress summaries', () => {
    renderChecklist();

    // Both group headers should be visible (duplicated across desktop table + mobile cards in jsdom)
    expect(screen.getAllByText('Today').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('This Week').length).toBeGreaterThanOrEqual(1);

    // Progress summaries should contain slash-separated counts (at least 2: daily + weekly, possibly ×2 layouts)
    const progressTexts = screen.getAllByText(/\d+\/\d+ complete/);
    expect(progressTexts.length).toBeGreaterThanOrEqual(2);
    const labeledTimers = screen.getAllByText(/Daily reset in \d{2}:\d{2}:\d{2}/);
    expect(labeledTimers[0].getAttribute('title')).toMatch(/\(.+\)$/);
  });

  it('shows daily bosses under Today and weekly bosses under This Week', () => {
    const { container } = renderChecklist();
    const todayHeader = screen.getByText('Today').closest('.rounded-lg')!;
    const weeklyHeader = screen.getByText('This Week').closest('.rounded-lg')!;
    const horntail = container.querySelector('[data-boss-id="horntail"]')!;
    const lotus = container.querySelector('[data-boss-id="lotus"]')!;

    expect(todayHeader.compareDocumentPosition(horntail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(horntail.compareDocumentPosition(weeklyHeader) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(weeklyHeader.compareDocumentPosition(lotus) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('group headers disappear when filtering to daily or weekly only', () => {
    renderChecklist();

    // Default filter is 'all' — groups visible (at least one instance in either layout)
    expect(screen.getAllByText('Today').length).toBeGreaterThanOrEqual(1);

    // Switch to Daily filter — no group headers in either layout
    fireEvent.click(screen.getByRole('button', { name: 'Daily' }));
    expect(screen.queryAllByText('Today')).toHaveLength(0);
    expect(screen.queryAllByText('This Week')).toHaveLength(0);

    // Switch to Weekly filter — no group headers in either layout
    fireEvent.click(screen.getByRole('button', { name: 'Weekly' }));
    expect(screen.queryAllByText('Today')).toHaveLength(0);
  });
});

describe('DAILY-06 mobile checklist experience', () => {
  afterEach(() => cleanup());
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
    localStorage.setItem('maplehub-characters:v2', JSON.stringify([{
      id: 'local-1',
      name: 'MobileTester',
      className: '',
      level: 250,
      server: 'GMS',
      world: '',
      isDefault: true,
    }]));
    // Simulate mobile viewport (< 640px = sm breakpoint)
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    window.dispatchEvent(new Event('resize'));
  });

  it('renders mobile card layout with stacked boss cards', () => {
    const { container } = renderChecklist();

    // A single responsive list serves both desktop and mobile.
    const mobileView = container.querySelector('[class*="space-y-2"]');
    expect(mobileView).toBeTruthy();

    // Mobile cards should be rendered for each eligible boss
    const cards = mobileView!.querySelectorAll('[class*="rounded-lg"][class*="border"]');
    // Should have cards for bosses (at least some daily + weekly)
    expect(cards.length).toBeGreaterThan(0);

    // Each card should contain a boss name and difficulty
    expect(mobileView!.textContent).toContain('Zakum');
    expect(mobileView!.textContent).toContain('Chaos');
  });

  it('has touch targets ≥ 44×44px for progress buttons and include toggles', () => {
    const { container } = renderChecklist();

    // Mobile view progress buttons use h-11 w-11 (44×44px)
    const mobileView = container.querySelector('[class*="space-y-2"]');
    expect(mobileView).toBeTruthy();

    const mobileButtons = mobileView!.querySelectorAll('button');
    const touchTargetButtons = Array.from(mobileButtons).filter((btn) => {
      const classes = btn.className;
      return classes.includes('h-11') && classes.includes('w-11');
    });

    // Should have at least some 44×44px buttons (progress toggles)
    expect(touchTargetButtons.length).toBeGreaterThan(0);

    // Enter edit mode to check include/exclude toggles
    fireEvent.click(screen.getByRole('button', { name: 'Edit checklist' }));

    const editMobileView = container.querySelector('[class*="space-y-2"]');
    const editButtons = editMobileView!.querySelectorAll('button[aria-label^="Stop tracking"], button[aria-label^="Track"]');
    expect(editButtons.length).toBeGreaterThan(0);

    // Each include/exclude toggle should also be 44×44px
    editButtons.forEach((btn) => {
      expect(btn.className).toContain('h-11');
      expect(btn.className).toContain('w-11');
    });
  });

  it('shows group summaries in mobile view', () => {
    const { container } = renderChecklist();

    // Mobile group headers should have progress summaries
    const mobileView = container.querySelector('[class*="space-y-2"]');
    expect(mobileView).toBeTruthy();

    // Group headers in mobile have bg-primary-50
    const groupHeaders = mobileView!.querySelectorAll('[class*="border-primary-100"][class*="bg-primary-50"]');
    expect(groupHeaders.length).toBeGreaterThanOrEqual(2); // Today + This Week

    // Each header should contain progress text (X/Y complete)
    groupHeaders.forEach((header) => {
      expect(header.textContent).toMatch(/\d+\/\d+ complete/);
    });
  });

  it('renders accessible labels on mobile progress and include buttons', () => {
    renderChecklist();

    const markProgressButtons = screen.getAllByLabelText(/progress: \d+ of \d+/);
    expect(markProgressButtons.length).toBeGreaterThan(0);

    // Enter edit mode to check include/exclude aria labels
    fireEvent.click(screen.getByRole('button', { name: 'Edit checklist' }));

    const includeButtons = screen.getAllByLabelText(/Track .*|Stop tracking .*/);
    expect(includeButtons.length).toBeGreaterThan(0);
  });

  it('renders one normal-use row per tracked boss', () => {
    const { container } = renderChecklist();
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-boss-id]'));
    const ids = rows.map((row) => row.dataset.bossId);

    expect(rows.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelectorAll('[data-boss-id="zakum"]')).toHaveLength(1);
  });

  it('offers a reversible completion action', () => {
    renderChecklist();
    const progress = screen.getByRole('button', { name: 'Horntail Chaos progress: 0 of 1' });

    fireEvent.click(progress);
    expect(screen.getByText('Horntail progress updated.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Horntail Chaos progress: 1 of 1' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('button', { name: 'Horntail Chaos progress: 0 of 1' })).toBeTruthy();
  });

  it('persists the compact density preference without shrinking action targets', () => {
    const { container } = renderChecklist();
    fireEvent.click(screen.getByRole('button', { name: 'Compact view' }));

    expect(localStorage.getItem('maplehub-checklist-density')).toBe('compact');
    expect(container.querySelector('.space-y-1\\.5')).toBeTruthy();
    const progress = screen.getByRole('button', { name: /Horntail Chaos progress/ });
    expect(progress.className).toContain('h-11');
    expect(progress.className).toContain('min-w-11');
  });
});

describe('DAILY-07 post-setup empty states', () => {
  afterEach(() => cleanup());
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
    window.dispatchEvent(new Event('resize'));
  });

  const storeCharacter = (level: number) => {
    localStorage.setItem('maplehub-characters:v2', JSON.stringify([{
      id: 'local-empty',
      name: 'EmptyTester',
      className: '',
      level,
      server: 'GMS',
      world: '',
      isDefault: true,
    }]));
  };

  it('explains when the character has no level-eligible bosses and avoids 0/0 progress', () => {
    storeCharacter(1);
    renderChecklist();

    expect(screen.getByRole('heading', { name: 'No bosses are available at Lv.1 yet' })).toBeTruthy();
    expect(screen.queryByText('0/0')).toBeNull();
    expect(screen.queryByText('No tasks')).toBeNull();
    const emptyRegion = screen.getByRole('region', { name: 'No bosses are available at Lv.1 yet' });
    expect(within(emptyRegion).getByRole('link', { name: 'Level Guide' }).getAttribute('href')).toBe('/guides/level');
    expect(within(emptyRegion).getByRole('link', { name: 'Boss Guides' }).getAttribute('href')).toBe('/wiki/boss');
  });

  it('guides a character with no selected tasks directly into checklist editing', () => {
    storeCharacter(250);
    localStorage.setItem('maplehub-checklist-config-local-empty:v1', JSON.stringify({
      selectedTaskIds: [],
      updatedAt: '2026-07-12T00:00:00.000Z',
    }));
    renderChecklist();

    expect(screen.getByRole('heading', { name: 'Your checklist is empty' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Choose tasks' }));
    expect(screen.getByRole('button', { name: 'Done editing' })).toBeTruthy();
    expect(screen.getAllByText('Zakum').length).toBeGreaterThan(0);
  });

  it('offers a clear-search recovery without replacing the configured checklist', () => {
    storeCharacter(250);
    renderChecklist();

    fireEvent.change(screen.getByPlaceholderText('Search boss...'), { target: { value: 'DefinitelyMissingBoss' } });
    expect(screen.getByRole('heading', { name: 'No bosses match “DefinitelyMissingBoss”' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByRole('heading', { name: 'No bosses match “DefinitelyMissingBoss”' })).toBeNull();
    expect(screen.getAllByText('Zakum').length).toBeGreaterThan(0);
  });
});
