import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getPathLanguage,
  getPathServer,
  normalizeLanguage,
  normalizeServer,
  stripRouteSuffixes,
  withRouteSuffixes,
} from '@/i18n/languageRouting';
import { readLocalStorage, writeLocalStorage } from '@/services/browserStorage';
import {
  getSeriesModuleFromPathSegment,
  getSeriesModuleHref,
  seriesModuleByBaseHref,
} from '@/pages/series/scope';

export default function LocaleRouteSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    const pathLanguage = getPathLanguage(location.pathname);
    const pathServer = getPathServer(location.pathname);
    const currentLanguage = pathLanguage || normalizeLanguage(i18n.resolvedLanguage || i18n.language);
    const currentServer = pathServer || normalizeServer(readLocalStorage('maplehub-game-version'));
    const routePath = stripRouteSuffixes(location.pathname);
    let canonicalRoutePath = routePath === '/news'
      ? '/updates'
      : routePath === '/mapler-house'
        ? '/tools'
        : routePath;
    const canonicalSearchParams = new URLSearchParams(location.search);
    const seriesId = canonicalSearchParams.get('series') || undefined;
    const scopedModule = seriesModuleByBaseHref[canonicalRoutePath as keyof typeof seriesModuleByBaseHref];
    if (seriesId && scopedModule) {
      canonicalRoutePath = getSeriesModuleHref(seriesId, scopedModule);
      canonicalSearchParams.delete('series');
    }
    const cleanSeriesMatch = canonicalRoutePath.match(/^\/series\/([^/]+)\/([^/]+)$/);
    if (cleanSeriesMatch?.[2] === 'news' && getSeriesModuleFromPathSegment(cleanSeriesMatch[2])) {
      canonicalRoutePath = getSeriesModuleHref(cleanSeriesMatch[1], 'news');
    }
    const canonicalSearch = canonicalSearchParams.toString();

    if (
      !pathLanguage
      || !pathServer
      || routePath !== canonicalRoutePath
      || location.search !== (canonicalSearch ? `?${canonicalSearch}` : '')
    ) {
      navigate(
        {
          pathname: withRouteSuffixes(canonicalRoutePath, currentLanguage, currentServer),
          search: canonicalSearch,
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
