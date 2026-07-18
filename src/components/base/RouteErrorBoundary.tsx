import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AppErrorFallback from './AppErrorFallback';
import ErrorBoundary from './ErrorBoundary';

export default function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();
  const routeKey = `${location.pathname}${location.search}`;

  return (
    <ErrorBoundary
      key={routeKey}
      fallback={(_error, reset) => <AppErrorFallback onReset={reset} />}
    >
      {children}
    </ErrorBoundary>
  );
}
