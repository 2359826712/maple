import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Router,
  createPath,
  type Location,
  type Navigator,
  type To,
} from 'react-router-dom';

type BrowserHistoryState = {
  idx?: number;
  key?: string;
  usr?: unknown;
  [key: string]: unknown;
};

const hrefFor = (to: To) => typeof to === 'string' ? to : createPath(to);

const encodedLocation = (to: To) => {
  const url = new URL(hrefFor(to), typeof window === 'undefined' ? 'https://mpstorys.com' : window.location.origin);
  return { pathname: url.pathname, search: url.search, hash: url.hash };
};

const serverNavigator: Navigator = {
  createHref: hrefFor,
  encodeLocation: encodedLocation,
  go: () => {},
  push: () => {},
  replace: () => {},
};

const browserLocation = (): Location => {
  const state = (window.history.state || {}) as BrowserHistoryState;
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    state: state.usr ?? null,
    key: state.key || 'default',
  };
};

const historyKey = () => Math.random().toString(36).slice(2, 10);

export default function HydrationSafeRouter({
  children,
  initialLocation,
}: {
  children: ReactNode;
  initialLocation: string;
}) {
  const [location, setLocation] = useState<Partial<Location> | string>(() =>
    typeof window === 'undefined' ? initialLocation : browserLocation(),
  );

  const navigator = useMemo<Navigator>(() => {
    if (typeof window === 'undefined') return serverNavigator;

    const updateLocation = (method: 'pushState' | 'replaceState', to: To, state?: unknown) => {
      const currentState = (window.history.state || {}) as BrowserHistoryState;
      const nextState: BrowserHistoryState = {
        ...currentState,
        usr: state ?? null,
        key: historyKey(),
        idx: method === 'pushState' ? (currentState.idx ?? 0) + 1 : currentState.idx ?? 0,
      };
      window.history[method](nextState, '', hrefFor(to));
      setLocation(browserLocation());
    };

    return {
      createHref: hrefFor,
      encodeLocation: encodedLocation,
      go: (delta) => window.history.go(delta),
      push: (to, state) => updateLocation('pushState', to, state),
      replace: (to, state) => updateLocation('replaceState', to, state),
    };
  }, []);

  useEffect(() => {
    const onPopState = () => setLocation(browserLocation());
    const currentState = (window.history.state || {}) as BrowserHistoryState;
    if (typeof currentState.idx !== 'number') {
      window.history.replaceState({ ...currentState, idx: 0 }, '', window.location.href);
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <Router
      location={location}
      navigator={navigator}
      static={typeof window === 'undefined'}
    >
      {children}
    </Router>
  );
}
