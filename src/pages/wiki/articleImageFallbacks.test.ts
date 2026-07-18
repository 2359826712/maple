import { describe, expect, it } from 'vitest';
import { getWikiArticleImageFallbacks } from './articleImageFallbacks';

describe('getWikiArticleImageFallbacks', () => {
  it('provides local topic images when a localized article has none', () => {
    expect(getWikiArticleImageFallbacks('Star_Force', 0)).toEqual([
      expect.objectContaining({ src: '/static/images/wiki/star-force.png' }),
    ]);
    expect(getWikiArticleImageFallbacks('Guardian Angel Slime', 0)).toEqual([
      expect.objectContaining({ src: expect.stringContaining('latest-36166e0c8e.webp') }),
    ]);
  });

  it('provides a complete local map set for an empty Locations article', () => {
    const images = getWikiArticleImageFallbacks('Locations', 0);
    expect(images).toHaveLength(3);
    expect(images.every((image) => image.src.startsWith('/static/images/'))).toBe(true);
    expect(getWikiArticleImageFallbacks('Maple World', 0)).toEqual(images);
  });

  it('keeps the upstream article untouched when it already has enough images', () => {
    expect(getWikiArticleImageFallbacks('Potential', 1)).toEqual([]);
    expect(getWikiArticleImageFallbacks('Bosses', 3)).toEqual([]);
    expect(getWikiArticleImageFallbacks('Unknown article', 0)).toEqual([]);
  });
});
