import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLoginHref } from '@/hooks/useAuthSession';

export default function AuthRequiredNotice({ onDismiss }: { onDismiss?: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-foreground-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-primary-800">{t('auth_required_title')}</div>
          <p className="mt-0.5 text-xs text-foreground-600">{t('auth_required_desc')}</p>
        </div>
        <div className="flex items-center gap-2">
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="h-9 px-3 rounded-full bg-background-50 hover:bg-primary-100 border border-primary-200 text-xs font-semibold text-primary-800 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-close-line mr-1"></i>
              {t('community_cancel')}
            </button>
          )}
          <Link
            to={getLoginHref()}
            className="h-9 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold cursor-pointer whitespace-nowrap inline-flex items-center"
          >
            <i className="ri-login-circle-line mr-1"></i>
            {t('auth_required_cta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
