import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { safeDecodeURIComponent } from '@/utils/safeDecodeURIComponent';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(safeDecodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [hash, pathname]);

  return null;
}
