import { useEffect } from 'react';
import { recoverFromStaleAssets } from '@/services/runtimeRecovery';

export default function RuntimeRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      recoverFromStaleAssets(event.error || event.message);
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      recoverFromStaleAssets(event.reason);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
