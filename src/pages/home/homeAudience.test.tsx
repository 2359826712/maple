// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/pages/home/components/Navbar', () => ({ default: () => <div>Navbar</div> }));
vi.mock('@/pages/home/components/HomeSeriesGateway', () => ({ default: () => <section>Series gateway</section> }));
vi.mock('@/pages/home/components/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('@/pages/home/components/NotificationDrawer', () => ({ default: () => null }));
vi.mock('@/pages/home/components/ThemeSwitcher', () => ({ default: () => null }));

import { HomeContent } from './page';

const renderHome = () => render(<MemoryRouter><HomeContent /></MemoryRouter>);

describe('homepage series gateway', () => {
  afterEach(() => cleanup());

  it('keeps the homepage focused on choosing a MapleStory series', () => {
    renderHome();

    expect(screen.getByText('Series gateway')).toBeTruthy();
    expect(screen.getByText('Navbar')).toBeTruthy();
    expect(screen.getByText('Footer')).toBeTruthy();
  });
});
