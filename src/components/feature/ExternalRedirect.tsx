import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ExternalRedirectProps {
  to: string;
  message?: string;
  targetLabel?: string;
  delaySeconds?: number;
}

export default function ExternalRedirect({
  to,
  message = '',
  targetLabel = '',
  delaySeconds = 1,
}: ExternalRedirectProps) {
  const { t } = useTranslation();
  const resolvedMessage = message || t('redirect_entering_external');
  const resolvedTarget = targetLabel || t('redirect_target_page');
  const [remainingSeconds, setRemainingSeconds] = useState(delaySeconds);

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      window.location.replace(to);
    }, delaySeconds * 1000);

    const countdownTimer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearInterval(countdownTimer);
    };
  }, [delaySeconds, to]);

  return (
    <main className="min-h-screen bg-background-50 text-foreground-900 flex items-center justify-center px-4">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <i className="ri-loader-4-line text-2xl animate-spin"></i>
        </div>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground-950">
          {resolvedMessage}
        </h1>
        <p className="mt-3 text-sm text-foreground-600">
          {t('redirect_countdown', { target: resolvedTarget, seconds: remainingSeconds })}
        </p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-background-100">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-700"
            style={{ width: `${((delaySeconds - remainingSeconds + 1) / delaySeconds) * 100}%` }}
          />
        </div>
      </section>
    </main>
  );
}
