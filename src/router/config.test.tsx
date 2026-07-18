import { describe, expect, it, vi } from 'vitest';
import { lazyWithPreload } from './config';

describe('route preloading', () => {
  it('reuses one module request when prefetch events fire repeatedly', async () => {
    const routeModule = { default: () => null };
    const loader = vi.fn(async () => routeModule);
    const Component = lazyWithPreload(loader);

    const first = Component.preload();
    const second = Component.preload();

    expect(first).toBe(second);
    await expect(first).resolves.toBe(routeModule);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('allows a failed route module request to be retried', async () => {
    const routeModule = { default: () => null };
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('Loading chunk 42 failed'))
      .mockResolvedValueOnce(routeModule);
    const Component = lazyWithPreload(loader);

    await expect(Component.preload()).rejects.toThrow('Loading chunk 42 failed');
    await expect(Component.preload()).resolves.toBe(routeModule);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
