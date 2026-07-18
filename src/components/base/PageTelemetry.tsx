import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { telemetry } from '@/services/telemetry';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function PageTelemetry() {
  const location = useLocation();
  const previousPath = useRef<string | null>(null);
  const sessionStartedAt = useRef(Date.now());

  useEffect(() => {
    const currentPath = location.pathname;
    telemetry.trackPageView(currentPath);
    const googlePageViewTimer = window.setTimeout(() => {
      window.gtag?.('event', 'page_view', {
        page_location: window.location.href,
        page_path: `${location.pathname}${location.search}${location.hash}`,
        page_title: document.title,
      });
    }, 0);
    if (previousPath.current && previousPath.current !== currentPath) {
      telemetry.trackNavigation(previousPath.current, currentPath);
    }
    previousPath.current = currentPath;
    return () => window.clearTimeout(googlePageViewTimer);
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    const reportDuration = () => {
      telemetry.trackSessionDuration(Date.now() - sessionStartedAt.current);
      void telemetry.flush();
    };
    window.addEventListener('pagehide', reportDuration, { once: true });
    return () => window.removeEventListener('pagehide', reportDuration);
  }, []);

  return null;
}
