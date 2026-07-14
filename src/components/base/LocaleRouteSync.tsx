import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import i18n from '@/i18n';
import {
  getPathLanguage,
  getPathServer,
  normalizeLanguage,
  normalizeServer,
  withRouteSuffixes,
} from '@/i18n/languageRouting';

export default function LocaleRouteSync() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const pathLanguage = getPathLanguage(location.pathname);
    const pathServer = getPathServer(location.pathname);
    const currentLanguage = pathLanguage || normalizeLanguage(i18n.resolvedLanguage || i18n.language);
    const currentServer = pathServer || normalizeServer(window.localStorage.getItem('maplehub-game-version'));

    if (!pathLanguage || !pathServer) {
      navigate(
        {
          pathname: withRouteSuffixes(location.pathname, currentLanguage, currentServer),
          search: location.search,
          hash: location.hash,
        },
        { replace: true },
      );
      return;
    }

    window.localStorage.setItem('i18nextLng', pathLanguage);
    window.localStorage.setItem('maplehub-language', pathLanguage);
    window.localStorage.setItem('maplehub-game-version', pathServer);
    document.documentElement.lang = pathLanguage;
    document.documentElement.dataset.server = pathServer;

    if (normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== pathLanguage) {
      void i18n.changeLanguage(pathLanguage);
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
}
