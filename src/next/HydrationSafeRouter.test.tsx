// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Link, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import HydrationSafeRouter from './HydrationSafeRouter';

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="location">{location.pathname}</output>;
}

describe('HydrationSafeRouter', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.history.replaceState({}, '', '/start');
  });

  it('supports client navigation without replacing the router component', () => {
    render(
      <HydrationSafeRouter initialLocation="/start">
        <LocationProbe />
        <Link to="/next">Next</Link>
      </HydrationSafeRouter>,
    );

    expect(screen.getByLabelText('location').textContent).toBe('/start');
    fireEvent.click(screen.getByRole('link', { name: 'Next' }));
    expect(screen.getByLabelText('location').textContent).toBe('/next');
    expect(window.location.pathname).toBe('/next');
  });

  it('tracks browser history changes', () => {
    render(
      <HydrationSafeRouter initialLocation="/start">
        <LocationProbe />
      </HydrationSafeRouter>,
    );

    act(() => {
      window.history.pushState({ usr: null, key: 'history', idx: 1 }, '', '/history');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByLabelText('location').textContent).toBe('/history');
  });
});
