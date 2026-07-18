import { describe, expect, it } from 'vitest';
import { apiEndpoint } from './apiEndpoint';

describe('API endpoint resolution', () => {
  it('uses an absolute hosted endpoint during server rendering', () => {
    expect(apiEndpoint('/official-content/gms/news')).toMatch(
      /^https:\/\/[^/]+\/functions\/v1\/maplehub-api\/official-content\/gms\/news$/,
    );
  });
});
