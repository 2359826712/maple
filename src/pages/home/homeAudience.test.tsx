// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useCharacters', () => ({ useCharacters: vi.fn() }));
vi.mock('@/pages/home/components/Navbar', () => ({ default: () => <div>Navbar</div> }));
vi.mock('@/pages/home/components/Hero', () => ({ default: () => <section>New player hero</section> }));
vi.mock('@/pages/home/components/CurrentVersionHighlights', () => ({ default: () => <section>Version highlights</section> }));
vi.mock('@/pages/home/components/DailyHubSection', () => ({ default: () => <section>New player shortcuts</section> }));
vi.mock('@/pages/home/components/TodayInMapleSection', () => ({ default: () => <section>Returning player dashboard</section> }));
vi.mock('@/pages/home/components/QuickTools', () => ({ default: () => <section>Quick tools</section> }));
vi.mock('@/pages/home/components/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('@/pages/home/components/NotificationDrawer', () => ({ default: () => null }));
vi.mock('@/pages/home/components/ThemeSwitcher', () => ({ default: () => null }));

import { useCharacters } from '@/hooks/useCharacters';
import { HomeContent } from './page';

const mockUseCharacters = vi.mocked(useCharacters);

const renderHome = () => render(<MemoryRouter><HomeContent /></MemoryRouter>);

describe('homepage audience states', () => {
  afterEach(() => cleanup());

  it('shows onboarding discovery to a new player', () => {
    mockUseCharacters.mockReturnValue({ activeCharacter: null } as never);

    renderHome();

    expect(screen.getByText('New player hero')).toBeTruthy();
    expect(screen.getByText('New player shortcuts')).toBeTruthy();
    expect(screen.queryByText('Returning player dashboard')).toBeNull();
    expect(screen.getByText('Version highlights')).toBeTruthy();
    expect(screen.getByText('Quick tools')).toBeTruthy();

    const hero = screen.getByText('New player hero');
    const highlights = screen.getByText('Version highlights');
    const shortcuts = screen.getByText('New player shortcuts');
    expect(hero.compareDocumentPosition(highlights) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(highlights.compareDocumentPosition(shortcuts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('promotes the personal dashboard for a returning player', () => {
    mockUseCharacters.mockReturnValue({
      activeCharacter: { id: 'local-1', name: 'Mapler', level: 260, className: '', world: '', server: '' },
    } as never);

    renderHome();

    expect(screen.getByText('Returning player dashboard')).toBeTruthy();
    expect(screen.queryByText('New player hero')).toBeNull();
    expect(screen.queryByText('New player shortcuts')).toBeNull();

    const dashboard = screen.getByText('Returning player dashboard');
    const highlights = screen.getByText('Version highlights');
    expect(dashboard.compareDocumentPosition(highlights) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('treats the legacy level-one placeholder as unconfigured', () => {
    mockUseCharacters.mockReturnValue({
      activeCharacter: { id: 'legacy-1', name: 'My Character', level: 1, className: '', world: '', server: '' },
    } as never);

    renderHome();

    expect(screen.getByText('New player hero')).toBeTruthy();
    expect(screen.getByText('New player shortcuts')).toBeTruthy();
    expect(screen.queryByText('Returning player dashboard')).toBeNull();
  });
});
