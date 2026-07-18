// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { GUIDE_READING_PROGRESS_KEY } from '@/services/guideReadingProgress';
import GuidesPage from './page';

const mocks = vi.hoisted(() => ({
  version: 'gms',
  fetchSection: vi.fn(),
  translateStaticText: vi.fn(),
}));

vi.mock('@/hooks/VersionContext', () => ({
  useVersion: () => ({
    version: mocks.version,
    versionInfo: { id: mocks.version, shortLabel: mocks.version.toUpperCase() },
  }),
}));

vi.mock('@/services/liveContent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/liveContent')>();
  return { ...actual, fetchGrandisGuideSectionPage: mocks.fetchSection };
});

vi.mock('@/services/staticTranslation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/staticTranslation')>();
  return { ...actual, translateStaticText: mocks.translateStaticText };
});

vi.mock('@/pages/home/components/Navbar', () => ({ default: () => <nav>Navigation</nav> }));
vi.mock('@/pages/home/components/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('@/pages/home/components/NotificationDrawer', () => ({ default: () => null }));
vi.mock('./components/GuideScrollTopButton', () => ({ default: () => null }));

const renderPage = () => render(
  <I18nextProvider i18n={i18n}>
    <MemoryRouter initialEntries={['/guides']}>
      <GuidesPage />
    </MemoryRouter>
  </I18nextProvider>,
);

describe('guide freshness and applicability', () => {
  beforeEach(async () => {
    cleanup();
    localStorage.clear();
    mocks.version = 'gms';
    mocks.fetchSection.mockReset();
    mocks.translateStaticText.mockReset();
    mocks.translateStaticText.mockImplementation(async (value: string) => value);
    mocks.fetchSection.mockResolvedValue({
      section: 'content',
      html: '<div data-testid="source-guide">Progression Guide</div>',
      text: 'Progression Guide',
      sourceUrl: 'https://grandislibrary.com/content',
      sourceSyncedAt: '2026-07-12T08:00:00.000Z',
    });
    await i18n.changeLanguage('en');
  });

  afterEach(() => cleanup());

  it('labels GMS applicability and truthful source freshness', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Player Guides' })).toBeTruthy();
    expect(screen.getByText('Applies to GMS')).toBeTruthy();
    expect(screen.getByText(/Source synced/)).toBeTruthy();
    expect(screen.getByText('Patch not independently verified')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Progression Guide')).toBeTruthy());
  });

  it('filters a GMS-only source for another selected region and offers an honest override', async () => {
    mocks.version = 'kms';
    renderPage();
    expect(await screen.findByRole('heading', { name: 'No source applies to KMS' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show GMS source' }));
    await waitFor(() => expect(screen.getByText('Progression Guide')).toBeTruthy());
  });

  it('offers a local continue-reading destination', async () => {
    localStorage.setItem(GUIDE_READING_PROGRESS_KEY, JSON.stringify({
      guideId: 'grandis-content-progression-guide',
      title: 'Progression Guide',
      section: 'Content',
      path: '/guides/grandis-content-progression-guide',
      hash: '#equipment',
      updatedAt: '2026-07-12T08:00:00.000Z',
    }));
    renderPage();
    const resume = await screen.findByRole('link', { name: 'Resume guide' });
    expect(resume.getAttribute('href')).toBe('/guides/grandis-content-progression-guide#equipment');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByRole('link', { name: 'Resume guide' })).toBeNull();
    expect(localStorage.getItem(GUIDE_READING_PROGRESS_KEY)).toBeNull();
  });

  it('keeps the cached source page visible when localization fails', async () => {
    await i18n.changeLanguage('zh');
    mocks.translateStaticText.mockRejectedValue(new Error('translation unavailable'));
    renderPage();

    await waitFor(() => expect(screen.getByText('Progression Guide')).toBeTruthy());
    expect(screen.queryByText(i18n.t('guide_section_error'))).toBeNull();
  });
});
