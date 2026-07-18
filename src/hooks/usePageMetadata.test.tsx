// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePageMetadata } from './usePageMetadata';

function MetadataHarness() {
  usePageMetadata('Lotus Boss Guide', 'Mechanics and rewards for Lotus.');
  return null;
}

function PrivateMetadataHarness() {
  usePageMetadata('Account', 'Private account page.', { noFollow: true, noIndex: true });
  return null;
}

function ArticleMetadataHarness() {
  usePageMetadata('Lotus Boss Guide', 'Mechanics and rewards for Lotus.', {
    authorName: 'MPStorys Editorial Team',
    dateModified: '2026-07-14T06:00:00.000Z',
    datePublished: '2026-07-13T06:00:00.000Z',
    image: '/og.png',
    type: 'article',
  });
  return null;
}

describe('usePageMetadata', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    window.history.replaceState({}, '', '/');
  });

  it('updates discoverability and social metadata for the current page', () => {
    window.history.replaceState({}, '', '/guides/zh/KMS');
    render(<MetadataHarness />);

    expect(document.title).toBe('Lotus Boss Guide · MPStorys');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://mpstorys.com/guides/zh/KMS');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('Lotus Boss Guide · MPStorys');
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe('Mechanics and rewards for Lotus.');
    expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('zh_CN');
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://mpstorys.com/og.png');
    expect(document.querySelector('meta[property="og:image:secure_url"]')?.getAttribute('content')).toBe('https://mpstorys.com/og.png');
    expect(document.querySelector('meta[name="keywords"]')?.getAttribute('content')).toContain('冒险岛工具');
    expect(document.querySelector('link[rel="image_src"]')?.getAttribute('href')).toBe('https://mpstorys.com/og.png');
    expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index, follow, max-image-preview:large');
    expect(document.querySelector('link[hreflang="en"]')?.getAttribute('href')).toBe('https://mpstorys.com/guides/en/KMS');
    expect(document.querySelector('link[hreflang="zh-Hant"]')?.getAttribute('href')).toBe('https://mpstorys.com/guides/zh-hant/KMS');
    expect(document.querySelector('link[hreflang="x-default"]')?.getAttribute('href')).toBe('https://mpstorys.com/guides/en/KMS');
  });

  it('marks private pages as noindex and nofollow', () => {
    window.history.replaceState({}, '', '/account/ja/JMS');
    render(<PrivateMetadataHarness />);

    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow, max-image-preview:large');
    expect(document.querySelector('meta[name="googlebot"]')?.getAttribute('content')).toBe('noindex, nofollow, max-image-preview:large');
    expect(document.querySelector('link[rel="alternate"]')).toBeNull();
  });

  it('adds article metadata and JSON-LD for editorial detail pages', () => {
    window.history.replaceState({}, '', '/wiki/boss/Lotus/en/GMS');
    render(<ArticleMetadataHarness />);

    expect(document.querySelector('meta[property="article:published_time"]')?.getAttribute('content'))
      .toBe('2026-07-13T06:00:00.000Z');
    expect(document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content'))
      .toBe('2026-07-14T06:00:00.000Z');
    const schema = JSON.parse(document.querySelector<HTMLScriptElement>('script[data-seo-generated="article"]')?.textContent || '{}');
    expect(schema).toEqual(expect.objectContaining({
      '@type': 'Article',
      author: { '@type': 'Person', name: 'MPStorys Editorial Team' },
      datePublished: '2026-07-13T06:00:00.000Z',
      headline: 'Lotus Boss Guide',
      inLanguage: 'en',
      url: 'https://mpstorys.com/wiki/boss/Lotus/en/GMS',
    }));
  });
});
