import i18n, { type BackendModule, type ReadCallback } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const supportedLanguages = ['en', 'zh', 'ja', 'ko', 'zh-Hant'] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

const localeLoaders: Record<SupportedLanguage, () => Promise<{ default: Record<string, string> }>> = {
  en: () => import('./local/en/common'),
  zh: () => import('./local/zh/common'),
  ja: () => import('./local/ja/common'),
  ko: () => import('./local/ko/common'),
  'zh-Hant': () => import('./local/zh-Hant/common'),
};

const normalizeLanguage = (language: string): SupportedLanguage => {
  if (language.toLowerCase().startsWith('zh-hant')) return 'zh-Hant';
  if (language.toLowerCase().startsWith('zh')) return 'zh';
  if (language.toLowerCase().startsWith('ja')) return 'ja';
  if (language.toLowerCase().startsWith('ko')) return 'ko';
  return 'en';
};

const bundledLocaleBackend: BackendModule = {
  type: 'backend',
  init: () => undefined,
  read(language: string, _namespace: string, callback: ReadCallback) {
    const locale = normalizeLanguage(language);
    void localeLoaders[locale]()
      .then((module) => callback(null, module.default))
      .catch((error: unknown) => callback(error instanceof Error ? error : new Error('Locale load failed'), false));
  },
};

const storedLanguage =
  typeof window !== 'undefined'
    ? window.localStorage.getItem('i18nextLng') || window.localStorage.getItem('maplehub-language') || undefined
    : undefined;

export const i18nReady = i18n
  .use(bundledLocaleBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: storedLanguage || 'en',
    fallbackLng: 'en',
    supportedLngs: [...supportedLanguages],
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
