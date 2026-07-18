import { useTranslation } from 'react-i18next';
import type { NewsContentLanguage } from '@/services/liveContent';
import { newsSourceLanguageTranslationKey, type NewsLocalizationKind } from './localizedNews';

type Props = {
  sourceLanguage: NewsContentLanguage;
  localizationKind?: NewsLocalizationKind;
  server?: string;
  className?: string;
};

export default function NewsOriginalLanguageNotice({
  sourceLanguage,
  localizationKind = 'original-fallback',
  server,
  className = '',
}: Props) {
  const { t } = useTranslation();
  const language = t(newsSourceLanguageTranslationKey[sourceLanguage]);
  const notice = localizationKind === 'editorial'
    ? t('news_localized_edition', { server: server?.toUpperCase() || '', language })
    : localizationKind === 'translated'
      ? t('news_translated_edition', { server: server?.toUpperCase() || '', language })
      : t('news_original_language', { language });

  return (
    <p className={`inline-flex items-center gap-1 text-xs font-medium text-foreground-500 ${className}`.trim()}>
      <i className="ri-translate-2" aria-hidden="true" />
      {notice}
    </p>
  );
}
