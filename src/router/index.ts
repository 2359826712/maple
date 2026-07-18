import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useLocation, useRoutes } from "react-router-dom";
import { createElement, type ReactNode, Suspense, useEffect } from "react";
import routes from "runtime-router-config";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

const normalizePathname = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

export function AppRoutes({
  initialPath,
  initialRouteElement,
}: {
  initialPath?: string;
  initialRouteElement?: ReactNode;
}) {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    navigateResolver(window.REACT_APP_NAVIGATE);
  }, [navigate]);
  const isInitialRoute = Boolean(
    initialRouteElement
      && initialPath
      && normalizePathname(location.pathname) === normalizePathname(initialPath),
  );
  if (isInitialRoute) return initialRouteElement;
  return createElement(
    Suspense,
    {
      fallback: createElement(
        'div',
        {
          className: 'flex min-h-screen items-center justify-center bg-background-50 text-sm text-foreground-600',
          role: 'status',
        },
        'Loading page…',
      ),
    },
    element,
  );
}
