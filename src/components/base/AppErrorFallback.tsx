import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AppErrorFallbackProps {
  onReset: () => void;
}

export default function AppErrorFallback({ onReset }: AppErrorFallbackProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBackHome = () => {
    navigate('/', { replace: true });
    onReset();
  };

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <header className="border-b border-background-200 bg-background-50 px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={handleBackHome}
          className="inline-flex min-h-11 items-center gap-3 rounded-lg px-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          aria-label={t('error_boundary_brand_home', 'MapleHub home')}
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 text-xl text-background-50"
          >
            <i className="ri-leaf-fill" />
          </span>
          <span>
            <span className="block font-heading text-lg font-bold text-foreground-950">MapleHub</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-primary-600">
              GMS Community
            </span>
          </span>
        </button>
      </header>

      <main
        className="mx-auto flex min-h-[calc(100vh-73px)] max-w-2xl flex-col items-center justify-center px-5 py-12 text-center"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <i className="ri-error-warning-line text-3xl" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-heading text-2xl font-bold text-foreground-950 sm:text-3xl">
          {t('error_boundary_title', 'MapleHub hit an unexpected error')}
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-foreground-600 sm:text-base">
          {t(
            'error_boundary_desc',
            'Your saved progress is still available. Try this page again, or return home and continue from there.',
          )}
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onReset}
            className="min-h-11 rounded-full bg-primary-500 px-6 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
          >
            {t('error_boundary_retry', 'Try Again')}
          </button>
          <button
            type="button"
            onClick={handleBackHome}
            className="min-h-11 rounded-full border border-background-300 bg-background-50 px-6 text-sm font-semibold text-foreground-800 transition-colors hover:bg-background-100"
          >
            {t('not_found_back_home', 'Back to Home')}
          </button>
        </div>
      </main>
    </div>
  );
}
