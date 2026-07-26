import type { SupportedLanguage } from '@/i18n/languageRouting';

type UiTranslationResponse = {
  translations?: Record<string, string>;
};

export const fetchPublishedUiTranslationBundle = async (language: SupportedLanguage) => {
  if (language === 'en' || typeof window === 'undefined') return {};

  try {
    const response = await fetch(
      `/api/ui-translations?locale=${encodeURIComponent(language)}`,
      { headers: { accept: 'application/json' } },
    );
    if (!response.ok) return {};

    const payload = (await response.json()) as UiTranslationResponse;
    return payload.translations ?? {};
  } catch {
    return {};
  }
};
