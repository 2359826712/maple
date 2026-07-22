// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeLongFormGuide from './HomeLongFormGuide';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

vi.mock('@/hooks/VersionContext', () => ({
  useVersion: () => ({ version: 'gms' }),
}));

afterEach(cleanup);

describe('HomeLongFormGuide', () => {
  it('organizes the long-form copy into useful chapters and FAQs', () => {
    const { container } = render(<MemoryRouter><HomeLongFormGuide /></MemoryRouter>);

    expect(container.querySelectorAll('[data-testid="long-form-section"]')).toHaveLength(8);
    expect(container.querySelectorAll('[data-testid="long-form-faq"]')).toHaveLength(10);
    expect(screen.getByRole('navigation', { name: 'Complete MapleStory guide chapters' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Choose your MapleStory series' }).getAttribute('href'))
      .toBe('#choose-your-series');
  });

  it('keeps all chapter destinations and product links actionable', () => {
    const { container } = render(<MemoryRouter><HomeLongFormGuide /></MemoryRouter>);
    const chapterLinks = Array.from(container.querySelectorAll('nav[aria-label="Complete MapleStory guide chapters"] a'));

    expect(chapterLinks).toHaveLength(8);
    chapterLinks.forEach((link) => {
      const href = link.getAttribute('href');
      expect(href?.startsWith('#')).toBe(true);
      expect(document.querySelector(href || 'missing')).toBeTruthy();
    });

    expect(container.querySelector('a[href="/news/en/GMS"]')).toBeTruthy();
    expect(container.querySelector('a[href="/events/en/GMS"]')).toBeTruthy();
    expect(container.querySelector('a[href="/guides/en/GMS"]')).toBeTruthy();
    expect(container.querySelector('a[href="/mapler-house/en/GMS"]')).toBeTruthy();
  });
});
