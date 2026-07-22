// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { VersionProvider } from '@/hooks/VersionContext';
import i18n from '@/i18n';
import Navbar from '@/pages/home/components/Navbar';
import { getSiteSearchResults } from '@/services/siteSearch';

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

const renderNavbar = () => render(
  <MemoryRouter initialEntries={['/']}>
    <button type="button">Before search</button>
    <VersionProvider>
      <Navbar onOpenNotifications={vi.fn()} unread={0} />
      <CurrentPath />
    </VersionProvider>
  </MemoryRouter>,
);

describe('universal search command palette', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  afterEach(() => cleanup());

  it('opens with Ctrl+K and navigates the active result with Enter', async () => {
    renderNavbar();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    const dialog = await screen.findByRole('dialog', { name: 'Search MPStorys' });
    expect(dialog).toBeTruthy();
    const input = await screen.findByRole('textbox', { name: 'Search MPStorys' });
    await waitFor(() => expect(document.activeElement).toBe(input));
    fireEvent.change(input, { target: { value: 'Lotus' } });
    expect(screen.getByRole('option', { name: /Lotus/ })).toBeTruthy();

    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(screen.getByLabelText('Current path').textContent).toBe('/wiki/boss/lotus'));
    expect(screen.queryByRole('dialog', { name: 'Search MPStorys' })).toBeNull();
  });

  it('closes with Escape and restores focus to the previous control', async () => {
    renderNavbar();
    const previous = screen.getByRole('button', { name: 'Before search' });
    previous.focus();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    const input = await screen.findByRole('textbox', { name: 'Search MPStorys' });
    await waitFor(() => expect(document.activeElement).toBe(input));
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Search MPStorys' })).toBeNull();
    expect(document.activeElement).toBe(previous);
  });

  it('supports arrow-key result navigation', async () => {
    renderNavbar();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    const input = screen.getByRole('textbox', { name: 'Search MPStorys' });
    await waitFor(() => expect(document.activeElement).toBe(input));
    fireEvent.change(input, { target: { value: 'Normal' } });

    const expected = getSiteSearchResults('Normal', 'en', 'gms').slice(0, 8);
    expect(expected.length).toBeGreaterThan(1);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(screen.getByLabelText('Current path').textContent).toBe(expected[1].href));
  });

  it('keeps player lookup visually and semantically separate', async () => {
    renderNavbar();
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    const characterLookup = await screen.findByRole('link', {
      name: 'Looking for a player? Open Character Lookup',
    });
    expect(characterLookup.getAttribute('href')).toBe('/mapler-house#char-lookup');
  });
});
