import { useTranslation } from 'react-i18next';
import { Suspense, type ReactNode } from 'react';

export default function RouteLoadingFallback() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-50 px-4 text-foreground-900">
      <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl border border-background-300 bg-background-100 px-5 py-4 shadow-sm">
        <i className="ri-loader-4-line animate-spin text-xl text-primary-600" aria-hidden="true"></i>
        <span className="font-semibold">{t('route_loading')}</span>
      </div>
    </main>
  );
}

export function RouteLoader({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>;
}
