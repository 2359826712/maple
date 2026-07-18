import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ShareButtonProps = {
  title: string;
  text?: string;
  url?: string;
  compact?: boolean;
  className?: string;
};

const absoluteShareUrl = (url?: string) => {
  if (typeof window === 'undefined') return url || '';
  const shareUrl = new URL(url || `${window.location.pathname}${window.location.search}${window.location.hash}`, window.location.origin);
  shareUrl.searchParams.set('utm_source', 'maplehub');
  shareUrl.searchParams.set('utm_medium', 'share');
  return shareUrl.toString();
};

export default function ShareButton({ title, text, url, compact = false, className = '' }: ShareButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const share = async () => {
    const shareUrl = absoluteShareUrl(url);
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      window.prompt(t('share_copy_prompt'), shareUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={`${compact
        ? 'flex h-10 w-10 items-center justify-center rounded-full bg-background-100 text-foreground-800 transition hover:bg-secondary-100 hover:text-secondary-800'
        : 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 text-sm font-semibold text-primary-800 transition hover:border-primary-300 hover:bg-primary-100'
      } ${className}`}
      aria-label={copied ? t('share_copied') : t('share_action')}
      title={copied ? t('share_copied') : t('share_action')}
    >
      <i className={copied ? 'ri-check-line' : 'ri-share-forward-line'} aria-hidden="true" />
      {!compact && <span>{copied ? t('share_copied') : t('share_action')}</span>}
    </button>
  );
}
