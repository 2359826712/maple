// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePageMetadata } from './usePageMetadata';

function MetadataHarness() {
  usePageMetadata('Lotus Boss Guide', 'Mechanics and rewards for Lotus.');
  return null;
}

describe('usePageMetadata', () => {
  it('updates discoverability and social metadata for the current page', () => {
    render(<MetadataHarness />);

    expect(document.title).toBe('Lotus Boss Guide · MapleHub');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('http://localhost:3000/');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('Lotus Boss Guide · MapleHub');
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe('Mechanics and rewards for Lotus.');
  });
});
