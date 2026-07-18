import i18n, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  getPathLanguage,
  normalizeLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from './languageRouting';
import { readLocalStorage } from '@/services/browserStorage';

type TranslationModule = { default: Record<string, string> };

const languageLoaders: Record<SupportedLanguage, () => Promise<TranslationModule>> = {
  en: () => import('./local/en/common'),
  zh: () => import('./local/zh/common'),
  ja: () => import('./local/ja/common'),
  ko: () => import('./local/ko/common'),
  'zh-Hant': () => import('./local/zh-Hant/common'),
};

const storedLanguage =
  typeof window !== 'undefined'
    ? readLocalStorage('i18nextLng') || readLocalStorage('maplehub-language') || undefined
    : undefined;

const pathLanguage = typeof window !== 'undefined' ? getPathLanguage(window.location.pathname) : null;
const initialLanguage = pathLanguage || normalizeLanguage(storedLanguage);
const loadedResources: Partial<Record<SupportedLanguage, Record<string, string>>> = {};
let initializing = false;

export async function ensureLanguageResources(language: SupportedLanguage, target: I18nInstance = i18n) {
  if (!loadedResources[language]) {
    const module = await languageLoaders[language]();
    loadedResources[language] = module.default;
  }

  if (target.isInitialized && !target.hasResourceBundle(language, 'translation')) {
    target.addResourceBundle(language, 'translation', loadedResources[language]!, true, true);
  }
}

export async function loadLanguageResources(language: SupportedLanguage) {
  await ensureLanguageResources(language);
  return loadedResources[language]!;
}

const rawChangeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = async (language?: string, callback?: Parameters<typeof i18n.changeLanguage>[1]) => {
  if (language) {
    await ensureLanguageResources(normalizeLanguage(language));
  }
  if (!i18n.isInitialized && !initializing) await i18nReady;
  return rawChangeLanguage(language, callback);
};

export const i18nReady = (async () => {
  await ensureLanguageResources('en');
  if (initialLanguage !== 'en') await ensureLanguageResources(initialLanguage);
  const resources = Object.fromEntries(
    Object.entries(loadedResources).map(([language, translation]) => [language, { translation }]),
  );

  initializing = true;
  const initialized = await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      lng: initialLanguage,
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
  initializing = false;
  return initialized;
})();

export default i18n;
