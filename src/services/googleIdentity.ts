import { normalizeLanguage, type SupportedLanguage } from '@/i18n/languageRouting';

const defaultGoogleClientId = '146017234212-3rlmu2u16hmdru86a6pjjog6sr0cr9a5.apps.googleusercontent.com';

export const googleClientId = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID || defaultGoogleClientId
).trim();

export type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

export type GoogleAccountsId = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: {
    type: 'standard';
    theme: 'outline';
    size: 'large';
    text: 'continue_with';
    shape: 'rectangular';
    logo_alignment: 'left';
    width: number;
    locale: string;
  }) => void;
};

const googleButtonLocales: Record<SupportedLanguage, string> = {
  en: 'en',
  zh: 'zh_CN',
  'zh-Hant': 'zh_TW',
  ja: 'ja',
  ko: 'ko',
};

export const getGoogleButtonLocale = (language?: string | null) =>
  googleButtonLocales[normalizeLanguage(language)];

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

let scriptPromise: Promise<GoogleAccountsId> | null = null;
let loadingLocale: string | null = null;
let loadedLocale: string | null = null;
let loadGeneration = 0;

export const getGoogleIdentityScriptUrl = (locale: string) =>
  `https://accounts.google.com/gsi/client?hl=${encodeURIComponent(locale)}`;

export const loadGoogleIdentity = (locale = 'en') => {
  const existing = window.google?.accounts?.id;
  if (existing && loadedLocale === locale) return Promise.resolve(existing);
  if (scriptPromise && loadingLocale === locale) return scriptPromise;

  const generation = ++loadGeneration;
  loadingLocale = locale;
  document.querySelectorAll('script[data-maplehub-google-identity]').forEach((script) => script.remove());

  scriptPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const finish = () => {
      if (generation !== loadGeneration) {
        reject(new Error('A newer Google Identity locale was requested'));
        return;
      }
      const api = window.google?.accounts?.id;
      if (api) {
        loadedLocale = locale;
        resolve(api);
      }
      else reject(new Error('Google Identity Services did not initialize'));
    };

    const script = document.createElement('script');
    script.src = getGoogleIdentityScriptUrl(locale);
    script.async = true;
    script.defer = true;
    script.dataset.maplehubGoogleIdentity = 'true';
    script.dataset.locale = locale;
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('Unable to load Google Identity Services')), { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    if (generation === loadGeneration) {
      scriptPromise = null;
      loadingLocale = null;
    }
    throw error;
  });

  return scriptPromise;
};
