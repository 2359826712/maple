import { describe, expect, it } from 'vitest';
import {
  buildUiTranslationManifest,
  interpolationVariables,
  uiSourceHash,
} from './ui-translation-manifest.mjs';

describe('UI translation manifest', () => {
  it('sorts keys and records stable source hashes and interpolation variables', () => {
    const manifest = buildUiTranslationManifest({
      nav_wiki: 'Wiki',
      feedback_saved: 'Feedback received. Reference: {{id}}',
    });
    expect(manifest.entries.map((entry) => entry.key)).toEqual(['feedback_saved', 'nav_wiki']);
    expect(manifest.entries[0]).toMatchObject({
      source_hash: uiSourceHash('Feedback received. Reference: {{id}}'),
      context: {
        location: 'feedback',
        interpolation_variables: ['id'],
      },
    });
  });

  it('extracts unique i18next variables', () => {
    expect(interpolationVariables('{{count}} of {{total}} · {{count}}')).toEqual(['count', 'total']);
  });

  it('rejects keys that the production table cannot store', () => {
    expect(() => buildUiTranslationManifest({ 'Bad Key': 'Text' })).toThrow('invalid UI translation key');
  });
});
