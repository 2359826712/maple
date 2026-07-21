import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getPathLanguage,
  getPathServer,
  normalizeLanguage,
  normalizeServer,
  withRouteSuffixes,
} from '@/i18n/languageRouting';
import { readLocalStorage, writeLocalStorage } from '@/services/browserStorage';

export default function LocaleRouteSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    const pathLanguage = getPathLanguage(location.pathname);
    const pathServer = getPathServer(location.pathname);
    const currentLanguage = pathLanguage || normalizeLanguage(i18n.resolvedLanguage || i18n.language);
    const currentServer = pathServer || normalizeServer(readLocalStorage('maplehub-game-version'));

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

    writeLocalStorage('i18nextLng', pathLanguage);
    writeLocalStorage('maplehub-language', pathLanguage);
    writeLocalStorage('maplehub-game-version', pathServer);
    document.documentElement.lang = pathLanguage;
    document.documentElement.dataset.server = pathServer;

    if (normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== pathLanguage) {
      void i18n.changeLanguage(pathLanguage);
    }
  }, [i18n, location.hash, location.pathname, location.search, navigate]);

  return null;
}
