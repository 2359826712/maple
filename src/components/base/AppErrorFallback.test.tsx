// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppErrorFallback from './AppErrorFallback';
import ErrorBoundary from './ErrorBoundary';
import RouteErrorBoundary from './RouteErrorBoundary';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

afterEach(() => cleanup());

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

function RouteSensitiveContent() {
  const location = useLocation();
  if (location.pathname === '/broken') throw new Error('route render failed');
  return <h1>Healthy route</h1>;
}

function ChangeRoute() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate('/healthy')}>Open healthy route</button>;
}

describe('AppErrorFallback', () => {
  it('offers retry and a recoverable route back home', () => {
    const onReset = vi.fn();

    render(
      <MemoryRouter initialEntries={['/guides/broken']}>
        <CurrentPath />
        <AppErrorFallback onReset={onReset} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'MPStorys hit an unexpected error' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onReset).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(screen.getByLabelText('Current path').textContent).toBe('/');
    expect(onReset).toHaveBeenCalledTimes(2);
  });

  it('renders as the fallback for an uncaught subtree error', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Thrower = () => {
      throw new Error('route render failed');
    };

    render(
      <MemoryRouter>
        <ErrorBoundary fallback={(_error, reset) => <AppErrorFallback onReset={reset} />}>
          <Thrower />
        </ErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'MPStorys hit an unexpected error' })).toBeTruthy();
    consoleError.mockRestore();
  });

  it('isolates failures to the current route and recovers after navigation', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <ChangeRoute />
        <RouteErrorBoundary>
          <RouteSensitiveContent />
        </RouteErrorBoundary>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'MPStorys hit an unexpected error' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open healthy route' }));
    expect(screen.getByRole('heading', { name: 'Healthy route' })).toBeTruthy();
    consoleError.mockRestore();
  });
});
