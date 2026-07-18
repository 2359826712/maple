type BrowserStorageKind = 'local' | 'session';

const resolveStorage = (kind: BrowserStorageKind): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
};

const readStorageItem = (kind: BrowserStorageKind, key: string) => {
  try {
    return resolveStorage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const writeStorageItem = (kind: BrowserStorageKind, key: string, value: string) => {
  try {
    resolveStorage(kind)?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const removeStorageItem = (kind: BrowserStorageKind, key: string) => {
  try {
    resolveStorage(kind)?.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const readLocalStorage = (key: string) => readStorageItem('local', key);
export const writeLocalStorage = (key: string, value: string) => writeStorageItem('local', key, value);
export const removeLocalStorage = (key: string) => removeStorageItem('local', key);
export const readSessionStorage = (key: string) => readStorageItem('session', key);
export const writeSessionStorage = (key: string, value: string) => writeStorageItem('session', key, value);
export const removeSessionStorage = (key: string) => removeStorageItem('session', key);
