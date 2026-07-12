import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { telemetry } from '@/services/telemetry';

export default function PageTelemetry() {
  const location = useLocation();
  const previousPath = useRef<string | null>(null);
  const sessionStartedAt = useRef(Date.now());

  useEffect(() => {
    const currentPath = location.pathname;
    telemetry.trackPageView(currentPath);
    if (previousPath.current && previousPath.current !== currentPath) {
      telemetry.trackNavigation(previousPath.current, currentPath);
    }
    previousPath.current = currentPath;
  }, [location.pathname]);

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
