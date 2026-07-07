import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import messages from './local/index';

const storedLanguage =
  typeof window !== 'undefined'
    ? window.localStorage.getItem('i18nextLng') || window.localStorage.getItem('maplehub-language') || undefined
    : undefined;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ...(storedLanguage ? { lng: storedLanguage } : {}),
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh', 'ja', 'zh-Hant'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    debug: false,
    resources: messages,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
