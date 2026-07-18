// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VersionProvider } from '@/hooks/VersionContext';
import i18n from '@/i18n';

// Mock useCharacters
vi.mock('@/hooks/useCharacters', () => ({
  useCharacters: vi.fn(),
}));

// Mock useRealtimeCollection
vi.mock('@/hooks/useRealtimeCollection', () => ({
  useRealtimeCollection: vi.fn(),
}));

// Mock liveContent
vi.mock('@/services/liveContent', () => ({
  fetchLiveNews: vi.fn(),
  fetchLiveEvents: vi.fn(),
  liveStorageKeys: { news: 'test-news', events: 'test-events' },
}));

// Mock Navbar/Footer to isolate dashboard
vi.mock('@/pages/home/components/Navbar', () => ({ default: () => null }));
vi.mock('@/pages/home/components/Footer', () => ({ default: () => null }));
vi.mock('@/pages/home/components/NotificationDrawer', () => ({ default: () => null }));

import { useCharacters } from '@/hooks/useCharacters';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import TodayInMapleSection from './components/TodayInMapleSection';

const mockUseCharacters = vi.mocked(useCharacters);
const mockUseRealtimeCollection = vi.mocked(useRealtimeCollection);

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <VersionProvider>
        <TodayInMapleSection />
      </VersionProvider>
    </MemoryRouter>,
  );

describe('DAILY-05 Today in Maple dashboard', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
    mockUseRealtimeCollection.mockReturnValue({
      items: [],
      liveCount: 0,
      lastSyncedAt: null,
      status: 'idle',
      syncNow: vi.fn(),
    });
  });
  afterEach(() => cleanup());

  it('does not render when no character is configured', () => {
    mockUseCharacters.mockReturnValue({
      activeCharacter: null,
      activeCharId: null,
      characters: [],
      tasks: {},
      checklistConfig: null,
      setTasks: vi.fn(),
      addCharacter: vi.fn(),
      updateCharacter: vi.fn(),
      deleteCharacter: vi.fn(),
      toggleBoss: vi.fn(),
      resetTasks: vi.fn(),
      replaceTaskSelection: vi.fn(),
      exportData: vi.fn(),
      importData: vi.fn(),
      deleteLocalData: vi.fn(),
      isLoggedIn: false,
      saveError: null,
      lastSaved: null,
      setActiveCharId: vi.fn(),
    } as never);

    const { container } = renderDashboard();
    expect(container.innerHTML).toBe('');
  });

  it('renders three cards with correct navigation targets when character is configured', () => {
    mockUseCharacters.mockReturnValue({
      activeCharacter: {
        id: 'local-1',
        name: 'TestHero',
        className: '',
        level: 250,
        server: 'GMS',
        world: '',
        isDefault: true,
      },
      activeCharId: 'local-1',
      characters: [],
      tasks: {},
      checklistConfig: null,
    } as never);

    renderDashboard();

    // Section heading
    expect(screen.getByText('Today in Maple')).toBeTruthy();
    expect(screen.getByText('Welcome back, TestHero')).toBeTruthy();
    expect(screen.getByText('Lv. 250 · GMS')).toBeTruthy();
    expect(screen.getByText(/Resets in \d{2}:\d{2}:\d{2}/)).toBeTruthy();

    // Three card titles
    expect(screen.getByText('Daily Tasks')).toBeTruthy();
    expect(screen.getByText('Urgent Events')).toBeTruthy();
    expect(screen.getByText('Latest News')).toBeTruthy();

    // Navigation links
    const checklistLink = screen.getByLabelText('Open Checklist');
    expect(checklistLink.getAttribute('href')).toBe('/checklist');

    const eventsLink = screen.getByLabelText('View all events');
    expect(eventsLink.getAttribute('href')).toBe('/events');

    const newsLink = screen.getByLabelText('All news');
    expect(newsLink.getAttribute('href')).toBe('/news');
  });

  it('shows checklist progress with progress bar', () => {
    mockUseCharacters.mockReturnValue({
      activeCharacter: {
        id: 'local-1',
        name: 'ProgressHero',
        className: '',
        level: 250,
        server: 'GMS',
        world: '',
        isDefault: true,
      },
      activeCharId: 'local-1',
      characters: [],
      tasks: { zakum: { Easy: 1, Normal: 0, Chaos: 0 } },
      checklistConfig: null,
    } as never);

    renderDashboard();

    // Should show progress text (done/total)
    const progressTexts = screen.getAllByText(/\d+\/\d+ complete/);
    expect(progressTexts.length).toBeGreaterThan(0);
    expect(screen.getByText(/\d+ left/)).toBeTruthy();

    // Should have a progress bar (div with bg-primary-500)
    const progressBar = document.querySelector('.bg-primary-500');
    expect(progressBar).toBeTruthy();
  });

  it('shows default non-boss routines when no boss tasks are selected', () => {
    mockUseCharacters.mockReturnValue({
      activeCharacter: {
        id: 'local-1',
        name: 'EmptyPlan',
        className: 'Hero',
        level: 250,
        server: 'GMS',
        world: 'Bera',
        isDefault: true,
      },
      activeCharId: 'local-1',
      characters: [],
      tasks: {},
      checklistConfig: { selectedTaskIds: [], updatedAt: new Date().toISOString() },
    } as never);

    renderDashboard();

    expect(screen.getByText('0/3 complete')).toBeTruthy();
    expect(screen.queryByText('0/0 complete')).toBeNull();
  });

  it('shows one explainable reset-aware action with character scope', () => {
    mockUseCharacters.mockReturnValue({
      activeCharacter: {
        id: 'local-1',
        name: 'ActionHero',
        className: '',
        level: 250,
        server: 'GMS',
        world: 'Bera',
        isDefault: true,
      },
      activeCharId: 'local-1',
      characters: [],
      tasks: {},
      checklistConfig: { selectedTaskIds: [], updatedAt: new Date().toISOString() },
    } as never);

    renderDashboard();

    expect(screen.getByText('Next best action')).toBeTruthy();
    expect(screen.getByText('Daily quests and symbols')).toBeTruthy();
    expect(screen.getByText(/First because the daily reset is in \d{2}:\d{2}:\d{2}/)).toBeTruthy();
    expect(screen.getByText('Character')).toBeTruthy();
    expect(screen.getByLabelText('Open Daily quests and symbols').getAttribute('href'))
      .toBe('/checklist#routine-daily-quests');
  });

  it('shows account scope when the selected action is account-wide', () => {
    localStorage.setItem('maplehub-routine-tasks:v1', JSON.stringify({
      selectedIds: ['event-attendance'],
      completedPeriods: {},
    }));
    mockUseCharacters.mockReturnValue({
      activeCharacter: {
        id: 'local-1',
        name: 'AccountHero',
        className: 'Hero',
        level: 250,
        server: 'GMS',
        world: 'Bera',
        isDefault: true,
      },
      activeCharId: 'local-1',
      characters: [],
      tasks: {},
      checklistConfig: { selectedTaskIds: [], updatedAt: new Date().toISOString() },
    } as never);

    renderDashboard();

    expect(screen.getByText('Event attendance and claims')).toBeTruthy();
    expect(screen.getByText('Account')).toBeTruthy();
  });

  it('switches roster characters and exposes the validated backup destination', () => {
    const setActiveCharId = vi.fn();
    const characters = [
      { id: 'local-1', name: 'MainHero', className: 'Hero', level: 280, server: 'GMS', world: 'Bera', isDefault: true },
      { id: 'local-2', name: 'BossMule', className: 'Paladin', level: 260, server: 'GMS', world: 'Bera', isDefault: false },
    ];
    mockUseCharacters.mockReturnValue({
      activeCharacter: characters[0],
      activeCharId: 'local-1',
      characters,
      setActiveCharId,
      tasks: {},
      checklistConfig: { selectedTaskIds: [], updatedAt: new Date().toISOString() },
    } as never);

    renderDashboard();

    expect(screen.getByText('2 in roster')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'local-2' } });
    expect(setActiveCharId).toHaveBeenCalledWith('local-2');
    expect(screen.getByText('Back up data').closest('a')?.getAttribute('href')).toBe('/checklist#quick-actions');
  });

  it('hides the recommendation when no configured task is actionable', () => {
    localStorage.setItem('maplehub-routine-tasks:v1', JSON.stringify({
      selectedIds: [],
      completedPeriods: {},
    }));
    mockUseCharacters.mockReturnValue({
      activeCharacter: {
        id: 'local-1',
        name: 'DoneHero',
        className: 'Hero',
        level: 250,
        server: 'GMS',
        world: 'Bera',
        isDefault: true,
      },
      activeCharId: 'local-1',
      characters: [],
      tasks: {},
      checklistConfig: { selectedTaskIds: [], updatedAt: new Date().toISOString() },
    } as never);

    renderDashboard();

    expect(screen.queryByText('Next best action')).toBeNull();
  });

  it('shows urgent events sorted by urgency when available', () => {
    const futureEnd = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const farEnd = new Date(Date.now() + 10 * 86_400_000).toISOString();
    const pastStart = new Date(Date.now() - 5 * 86_400_000).toISOString();

    mockUseCharacters.mockReturnValue({
      activeCharacter: {
        id: 'local-1',
        name: 'EventHero',
        className: '',
        level: 250,
        server: 'GMS',
        world: '',
        isDefault: true,
      },
      activeCharId: 'local-1',
      characters: [],
      tasks: {},
      checklistConfig: null,
    } as never);

    // Override the default mock for this test
    mockUseRealtimeCollection.mockImplementation(({ storageKey }: { storageKey: string }) => {
      if (storageKey.startsWith('test-events')) {
        return {
          items: [
            {
              id: 'evt-far',
              name: 'Far Event',
              windowStart: pastStart,
              windowEnd: farEnd,
              rewards: ['Meso'],
              rarity: 'Seasonal',
              icon: 'ri-star',
              regions: ['all'],
              image: '',
              sourceUrl: '',
              sourceLabel: '',
              lastVerified: new Date().toISOString(),
            },
            {
              id: 'evt-urgent',
              name: 'Urgent Event',
              windowStart: pastStart,
              windowEnd: futureEnd,
              rewards: ['Arcane Symbols'],
              rarity: 'Legendary',
              icon: 'ri-fire',
              regions: ['all'],
              image: '',
              sourceUrl: '',
              sourceLabel: '',
              lastVerified: new Date().toISOString(),
            },
          ],
          liveCount: 2,
          lastSyncedAt: new Date().toISOString(),
          status: 'live',
          syncNow: vi.fn(),
        };
      }
      return {
        items: [],
        liveCount: 0,
        lastSyncedAt: null,
        status: 'idle',
        syncNow: vi.fn(),
      };
    });

    renderDashboard();

    // Both events should appear, urgent first (3 days < 10 days)
    const eventNames = screen.getAllByText(/Event$/);
    expect(eventNames.length).toBe(2);
    // Urgent event (3 days) should appear before far event (10 days)
    expect(eventNames[0].textContent).toBe('Urgent Event');
    expect(eventNames[1].textContent).toBe('Far Event');
  });

  it('shows latest news headline and category badge', () => {
    mockUseCharacters.mockReturnValue({
      activeCharacter: {
        id: 'local-1',
        name: 'NewsHero',
        className: '',
        level: 250,
        server: 'GMS',
        world: '',
        isDefault: true,
      },
      activeCharId: 'local-1',
      characters: [],
      tasks: {},
      checklistConfig: null,
    } as never);

    mockUseRealtimeCollection.mockImplementation(({ storageKey }: { storageKey: string }) => {
      if (storageKey.startsWith('test-news')) {
        return {
          items: [
            {
              id: 'news-1',
              title: 'MapleStory v250 Patch Notes',
              excerpt: 'Big changes incoming',
              author: 'Nexon',
              date: 'Jul 10, 2026',
              publishedAt: '2026-07-10T12:00:00Z',
              reads: 'Live',
              sourceUrl: 'https://example.com',
              tag: 'primary',
              category: 'Patch Notes',
              versions: ['gms'],
              image: '',
            },
          ],
          liveCount: 1,
          lastSyncedAt: new Date().toISOString(),
          status: 'live',
          syncNow: vi.fn(),
        };
      }
      return {
        items: [],
        liveCount: 0,
        lastSyncedAt: null,
        status: 'idle',
        syncNow: vi.fn(),
      };
    });

    renderDashboard();

    expect(screen.getByText('MapleStory v250 Patch Notes')).toBeTruthy();
    expect(screen.getByText('Patch Notes')).toBeTruthy();
  });
});
