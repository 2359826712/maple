import { describe, expect, it } from 'vitest';
import { safeDecodeURIComponent } from './safeDecodeURIComponent';

describe('safeDecodeURIComponent', () => {
  it('decodes valid route components', () => {
    expect(safeDecodeURIComponent('Maple%20World')).toBe('Maple World');
  });

  it('preserves malformed crawler input instead of throwing', () => {
    expect(safeDecodeURIComponent('broken%2')).toBe('broken%2');
    expect(safeDecodeURIComponent('%')).toBe('%');
  });
});
