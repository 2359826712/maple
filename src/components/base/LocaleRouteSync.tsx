import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import i18n from '@/i18n';
import { getPathLanguage, normalizeLanguage, withLanguageSuffix } from '@/i18n/languageRouting';

export default function LocaleRouteSync() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const pathLanguage = getPathLanguage(location.pathname);

    if (!pathLanguage) {
      const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
      navigate(
        {
          pathname: withLanguageSuffix(location.pathname, currentLanguage),
          search: location.search,
          hash: location.hash,
        },
        { replace: true },
      );
      return;
    }

    window.localStorage.setItem('i18nextLng', pathLanguage);
    window.localStorage.setItem('maplehub-language', pathLanguage);
    document.documentElement.lang = pathLanguage;

    if (normalizeLanguage(i18n.resolvedLanguage || i18n.language) !== pathLanguage) {
      void i18n.changeLanguage(pathLanguage);
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
}
