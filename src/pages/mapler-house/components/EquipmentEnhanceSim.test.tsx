// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VersionProvider } from '@/hooks/VersionContext';
import i18n from '@/i18n';
import EquipmentEnhanceSim, { STAR_FORCE_PROGRESS_STORAGE_KEY } from './EquipmentEnhanceSim';

describe('EquipmentEnhanceSim provenance', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows evidence, freshness, region, source, and assumptions before simulation', () => {
    render(
      <VersionProvider>
        <EquipmentEnhanceSim />
      </VersionProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Know what this simulator assumes' })).toBeTruthy();
    expect(screen.getByText('Planning estimate')).toBeTruthy();
    expect(screen.getByText('Independent check unavailable')).toBeTruthy();
    expect(screen.getByText('Built-in reference tables')).toBeTruthy();
    expect(screen.getByText(/Tier-up only/)).toBeTruthy();
  });

  it('updates the visible assumptions when the player changes tools', () => {
    render(
      <VersionProvider>
        <EquipmentEnhanceSim />
      </VersionProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Star Force' }));

    expect(screen.getByText(/item level, server type, safeguard/i)).toBeTruthy();
  });

  it('saves Star Force progress locally and restores it after remounting', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const firstView = render(
      <VersionProvider>
        <EquipmentEnhanceSim />
      </VersionProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Star Force' }));
    expect(screen.getByText('Progress saves automatically on this device.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '1 Tap' }));

    expect(screen.getByText('1★')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(`${STAR_FORCE_PROGRESS_STORAGE_KEY}:gms`) || '{}'))
      .toMatchObject({ currentStar: 1, attempts: 1, destroyed: false });

    firstView.unmount();
    render(
      <VersionProvider>
        <EquipmentEnhanceSim />
      </VersionProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Star Force' }));

    expect(screen.getByText('1★')).toBeTruthy();
    expect(screen.getByText((_, element) => element?.tagName === 'SPAN' && element.textContent === 'Attempts: 1')).toBeTruthy();
    expect(screen.getByText(/Star 0→1: SUCCESS/)).toBeTruthy();
  });

  it('ignores invalid saved Star Force progress', () => {
    localStorage.setItem(`${STAR_FORCE_PROGRESS_STORAGE_KEY}:gms`, JSON.stringify({
      currentStar: 99,
      attempts: -1,
      logs: 'invalid',
      destroyed: 'no',
    }));

    render(
      <VersionProvider>
        <EquipmentEnhanceSim />
      </VersionProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Star Force' }));

    expect(screen.getByText('0★')).toBeTruthy();
    expect(screen.getByText((_, element) => element?.tagName === 'SPAN' && element.textContent === 'Attempts: 0')).toBeTruthy();
  });
});
