// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { seriesProducts } from './catalog';
import SeriesToolsWorkspace from './SeriesToolsWorkspace';

const checklistSeries = seriesProducts.filter((product) => product.id !== 'maplestory-pc');

describe('SeriesToolsWorkspace', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  afterEach(cleanup);

  it('provides an interactive on-site workspace for every non-PC series', () => {
    checklistSeries.forEach((product) => {
      const view = render(<SeriesToolsWorkspace product={product} />);
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
      view.unmount();
    });
  });

  it('persists progress instead of acting as a static description or outbound link', () => {
    const worlds = checklistSeries.find((product) => product.id === 'maplestory-worlds');
    expect(worlds).toBeTruthy();

    const firstRender = render(<SeriesToolsWorkspace product={worlds!} />);
    const firstTask = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    fireEvent.click(firstTask);
    expect(firstTask.checked).toBe(true);
    firstRender.unmount();

    render(<SeriesToolsWorkspace product={worlds!} />);
    expect((screen.getAllByRole('checkbox')[0] as HTMLInputElement).checked).toBe(true);
  });
});
