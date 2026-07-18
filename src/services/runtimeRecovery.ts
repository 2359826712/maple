const RECOVERY_KEY = 'mpstorys-runtime-recovery:v1';
const RECOVERY_WINDOW_MS = 30_000;

const recoverableAssetPatterns = [
  /ChunkLoadError/i,
  /Loading (?:CSS )?chunk [^ ]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /CSS_CHUNK_LOAD_FAILED/i,
  /dynamically imported module/i,
];

const errorMessage = (error: unknown) => {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return typeof error === 'string' ? error : '';
};

export const isRecoverableAssetError = (error: unknown) => (
  recoverableAssetPatterns.some((pattern) => pattern.test(errorMessage(error)))
);

export const recoverFromStaleAssets = (error: unknown) => {
  if (typeof window === 'undefined' || !isRecoverableAssetError(error)) return false;

  try {
    const previous = Number(window.sessionStorage.getItem(RECOVERY_KEY) || 0);
    if (Number.isFinite(previous) && Date.now() - previous < RECOVERY_WINDOW_MS) return false;
    window.sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
  } catch {
    // A blocked session store should not prevent the one-shot page recovery.
  }

  window.location.reload();
  return true;
};
