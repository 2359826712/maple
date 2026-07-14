import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './local/en/common';
import zh from './local/zh/common';
import ja from './local/ja/common';
import ko from './local/ko/common';
import zhHant from './local/zh-Hant/common';
import {
  getPathLanguage,
  normalizeLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from './languageRouting';

const resources: Record<SupportedLanguage, { translation: Record<string, string> }> = {
  en: { translation: en },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  'zh-Hant': { translation: zhHant },
};

const storedLanguage =
  typeof window !== 'undefined'
    ? window.localStorage.getItem('i18nextLng') || window.localStorage.getItem('maplehub-language') || undefined
    : undefined;

const pathLanguage = typeof window !== 'undefined' ? getPathLanguage(window.location.pathname) : null;

export const i18nReady = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: pathLanguage || normalizeLanguage(storedLanguage),
    fallbackLng: 'en',
    supportedLngs: [...supportedLanguages],
    resources,
    ns: ['translation'],
    defaultNS: 'translation',
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
