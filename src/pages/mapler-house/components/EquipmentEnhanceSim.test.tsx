// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VersionProvider } from '@/hooks/VersionContext';
import i18n from '@/i18n';
import EquipmentEnhanceSim from './EquipmentEnhanceSim';

describe('EquipmentEnhanceSim provenance', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  afterEach(cleanup);

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
});
