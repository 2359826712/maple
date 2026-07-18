import { useCallback, useEffect, useState } from 'react';

export const PINNED_TOOLS_STORAGE_KEY = 'maplehub-home-tool-pins:v1';

const readPinnedTools = (): string[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PINNED_TOOLS_STORAGE_KEY) || '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((value): value is string => typeof value === 'string'))];
  } catch {
    return [];
  }
};

export function usePinnedTools() {
  const [pinnedKeys, setPinnedKeys] = useState<string[]>(readPinnedTools);

  useEffect(() => {
    const refresh = () => setPinnedKeys(readPinnedTools());
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const togglePinned = useCallback((key: string) => {
    setPinnedKeys((current) => {
      const next = current.includes(key)
        ? current.filter((value) => value !== key)
        : [...current, key];
      try {
        window.localStorage.setItem(PINNED_TOOLS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The in-memory order remains useful when storage is unavailable.
      }
      return next;
    });
  }, []);

  return { pinnedKeys, togglePinned };
}
