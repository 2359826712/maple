export const GUIDE_READING_PROGRESS_KEY = 'maplehub-guide-reading-progress:v1';

export interface GuideReadingProgress {
  guideId: string;
  title: string;
  section: 'Content' | 'Classes' | 'Events';
  path: string;
  hash?: string;
  updatedAt: string;
}

const isGuideReadingProgress = (value: unknown): value is GuideReadingProgress => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const progress = value as Partial<GuideReadingProgress>;
  return typeof progress.guideId === 'string'
    && progress.guideId.length > 0
    && progress.guideId.length <= 240
    && typeof progress.title === 'string'
    && progress.title.length > 0
    && progress.title.length <= 240
    && (progress.section === 'Content' || progress.section === 'Classes' || progress.section === 'Events')
    && typeof progress.path === 'string'
    && progress.path.startsWith('/guides/')
    && progress.path.length <= 500
    && (progress.hash === undefined || (typeof progress.hash === 'string' && progress.hash.length <= 240))
    && typeof progress.updatedAt === 'string'
    && Number.isFinite(Date.parse(progress.updatedAt));
};

export const readGuideReadingProgress = (): GuideReadingProgress | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GUIDE_READING_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isGuideReadingProgress(parsed)) {
      window.localStorage.removeItem(GUIDE_READING_PROGRESS_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const writeGuideReadingProgress = (progress: GuideReadingProgress) => {
  if (typeof window === 'undefined' || !isGuideReadingProgress(progress)) return false;
  try {
    window.localStorage.setItem(GUIDE_READING_PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
};

export const clearGuideReadingProgress = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(GUIDE_READING_PROGRESS_KEY);
  } catch {
    // Clearing reading history is best-effort when storage is unavailable.
  }
};

