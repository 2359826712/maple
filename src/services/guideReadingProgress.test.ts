// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import {
  GUIDE_READING_PROGRESS_KEY,
  clearGuideReadingProgress,
  readGuideReadingProgress,
  writeGuideReadingProgress,
} from './guideReadingProgress';

const progress = {
  guideId: 'grandis-content-progression-guide',
  title: 'Progression Guide',
  section: 'Content' as const,
  path: '/guides/grandis-content-progression-guide',
  hash: '#equipment',
  updatedAt: '2026-07-12T08:00:00.000Z',
};

describe('guide reading progress', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips bounded local progress', () => {
    expect(writeGuideReadingProgress(progress)).toBe(true);
    expect(readGuideReadingProgress()).toEqual(progress);
  });

  it('rejects and removes malformed or non-guide destinations', () => {
    localStorage.setItem(GUIDE_READING_PROGRESS_KEY, JSON.stringify({ ...progress, path: 'https://example.com' }));
    expect(readGuideReadingProgress()).toBeNull();
    expect(localStorage.getItem(GUIDE_READING_PROGRESS_KEY)).toBeNull();
  });

  it('clears the resume record without touching other data', () => {
    writeGuideReadingProgress(progress);
    localStorage.setItem('other', 'keep');
    clearGuideReadingProgress();
    expect(readGuideReadingProgress()).toBeNull();
    expect(localStorage.getItem('other')).toBe('keep');
  });
});

