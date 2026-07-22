import { describe, expect, it, vi } from 'vitest';
import translations from './translations.next';

describe('legacy realtime translation API', () => {
  it('is disabled and never invokes a provider', async () => {
    const response = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    await translations({ method: 'POST' } as never, response as never);

    expect(response.status).toHaveBeenCalledWith(410);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Realtime translation is disabled'),
    }));
  });
});
