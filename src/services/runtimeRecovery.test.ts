import { describe, expect, it } from 'vitest';
import { isRecoverableAssetError } from './runtimeRecovery';

describe('runtime asset recovery', () => {
  it('recognizes stale deployment chunk failures', () => {
    expect(isRecoverableAssetError(new Error('ChunkLoadError: Loading chunk 42 failed'))).toBe(true);
    expect(isRecoverableAssetError(new Error('Failed to fetch dynamically imported module: /assets/page.js'))).toBe(true);
    expect(isRecoverableAssetError(new Error('CSS_CHUNK_LOAD_FAILED'))).toBe(true);
  });

  it('does not reload for ordinary application errors', () => {
    expect(isRecoverableAssetError(new Error('Cannot read properties of undefined'))).toBe(false);
  });
});
