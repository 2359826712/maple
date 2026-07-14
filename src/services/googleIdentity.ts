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

export const loadGoogleIdentity = () => {
  const existing = window.google?.accounts?.id;
  if (existing) return Promise.resolve(existing);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const finish = () => {
      const api = window.google?.accounts?.id;
      if (api) resolve(api);
      else reject(new Error('Google Identity Services did not initialize'));
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-maplehub-google-identity]');
    if (existingScript) {
      existingScript.addEventListener('load', finish, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Google Identity Services')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.maplehubGoogleIdentity = 'true';
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('Unable to load Google Identity Services')), { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
};
