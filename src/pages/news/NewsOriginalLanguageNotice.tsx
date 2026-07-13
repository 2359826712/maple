import { useTranslation } from 'react-i18next';
import type { NewsContentLanguage } from '@/services/liveContent';
import { newsSourceLanguageTranslationKey } from './localizedNews';

type Props = {
  sourceLanguage: NewsContentLanguage;
  className?: string;
};

export default function NewsOriginalLanguageNotice({ sourceLanguage, className = '' }: Props) {
  const { t } = useTranslation();

  return (
    <p className={`inline-flex items-center gap-1 text-xs font-medium text-foreground-500 ${className}`.trim()}>
      <i className="ri-translate-2" aria-hidden="true" />
      {t('news_original_language', { language: t(newsSourceLanguageTranslationKey[sourceLanguage]) })}
    </p>
  );
}
