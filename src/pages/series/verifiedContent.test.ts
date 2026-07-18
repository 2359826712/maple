import { describe, expect, it } from 'vitest';
import { seriesProducts } from './catalog';
import {
  getVerifiedSeriesResource,
  getVerifiedSeriesResourceSlug,
  verifiedSeriesContent,
} from './verifiedContent';
import { indexedResources } from '@/domain/resourceIndex';

describe('verified series content', () => {
  it('uses traceable HTTPS sources for every published resource', () => {
    const resources = Object.values(verifiedSeriesContent)
      .flatMap((modules) => Object.values(modules).flatMap((items) => items || []));

    expect(resources.length).toBeGreaterThan(40);
    resources.forEach((resource) => {
      expect(resource.title.trim()).not.toBe('');
      expect(resource.description.trim()).not.toBe('');
      expect(resource.sourceLabel.trim()).not.toBe('');
      expect(resource.sourceUrl.startsWith('https://')).toBe(true);
    });
  });

  it('covers every supported series with verified source data', () => {
    seriesProducts.forEach((product) => {
      expect(Object.values(verifiedSeriesContent[product.id] || {}).some((items) => (items?.length || 0) > 0)).toBe(true);
    });
  });

  it('merges generated resource-index records into the on-site series modules', () => {
    indexedResources.forEach((indexedResource) => {
      const resources = Object.values(verifiedSeriesContent)
        .flatMap((modules) => Object.values(modules).flatMap((items) => items || []));
      expect(resources).toEqual(expect.arrayContaining([
        expect.objectContaining({
          resourceId: indexedResource.id,
          sourceUrl: indexedResource.url,
        }),
      ]));
    });
  });

  it('keeps the core editorial modules populated and addressable on this site', () => {
    const coreModules = ['news', 'upcoming', 'guides', 'events', 'tools', 'wiki'] as const;
    seriesProducts.forEach((product) => {
      coreModules.forEach((module) => {
        const resources = verifiedSeriesContent[product.id]?.[module] || [];
        expect(resources.length, `${product.id}:${module}`).toBeGreaterThan(0);
        resources.forEach((resource) => {
          const slug = getVerifiedSeriesResourceSlug(resource);
          expect(slug).not.toBe('');
          expect(getVerifiedSeriesResource(product.id, module, slug)).toEqual(resource);
        });
      });
    });
  });

  it('leaves unsupported modules empty instead of inventing content', () => {
    expect(verifiedSeriesContent['maplestory-classic'].rankings).toBeUndefined();
    expect(verifiedSeriesContent['maplestory-classic'].shop).toBeUndefined();
    expect(verifiedSeriesContent['maplestory-idle'].rankings).toBeUndefined();
  });
});
