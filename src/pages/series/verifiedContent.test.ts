import { describe, expect, it } from 'vitest';
import { seriesProducts } from './catalog';
import {
  getVerifiedSeriesResource,
  getVerifiedSeriesResources,
  getVerifiedSeriesResourceSlug,
  getSeriesModuleArtwork,
  verifiedSeriesContent,
} from './verifiedContent';
import { indexedContent } from '@/domain/contentIndex';
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

  it('assigns indexed resources to the matching module inside their own series', () => {
    const assignments = [
      ['maplestory-classic', 'tools', 'classic-niameowdb-damage-simulator'],
      ['maplestory-classic', 'wiki', 'classic-niameowdb-database-toolkit'],
      ['maplestory-m', 'community', 'm-subreddit'],
      ['maplestory-m', 'wiki', 'm-star-force-rate-table'],
      ['maplestory-n', 'tools', 'n-maplehub-star-force-calculator'],
      ['maplestory-n', 'rankings', 'n-official-character-rankings'],
      ['maplestory-worlds', 'guides', 'worlds-ai-coding-plugins'],
      ['maplestory-worlds', 'community', 'worlds-official-discord'],
      ['maplestory-idle', 'tools', 'idle-hero-token-calculator'],
      ['maplestory-idle', 'rankings', 'idle-msidle-rankings'],
    ] as const;

    assignments.forEach(([seriesId, module, resourceId]) => {
      expect(getVerifiedSeriesResources(seriesId, module)).toEqual(expect.arrayContaining([
        expect.objectContaining({ resourceId }),
      ]));
    });
  });

  it('keeps metadata-only official publications visible in the series archives', () => {
    const visibleContentIds = new Set(Object.values(verifiedSeriesContent)
      .flatMap((modules) => Object.values(modules).flatMap((items) => items || []))
      .map((resource) => resource.contentId)
      .filter(Boolean));
    indexedContent
      .filter((content) => content.status !== 'removed')
      .forEach((content) => expect(visibleContentIds.has(content.id), content.id).toBe(true));
  });

  it('keeps the core editorial modules populated and addressable on this site', () => {
    const coreModules = ['news', 'upcoming', 'guides', 'events', 'wiki'] as const;
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

  it('keeps the tools archive limited to resources that run as interactive tools on MPStorys', () => {
    const interactiveCategories = new Set([
      'builder',
      'calculator',
      'character-lookup',
      'guild-lookup',
      'optimizer',
      'planner',
      'simulator',
    ]);

    seriesProducts.forEach((product) => {
      getVerifiedSeriesResources(product.id, 'tools').forEach((resource) => {
        expect(resource.resourceRecord, resource.title).toBeTruthy();
        expect(interactiveCategories.has(resource.resourceRecord!.category), resource.title).toBe(true);
      });
    });
  });

  it('provides verified artwork for every MapleStory series', () => {
    seriesProducts.forEach((product) => {
      const resources = Object.values(verifiedSeriesContent[product.id])
        .flatMap((items) => items || []);
      expect(
        resources.some((resource) => Boolean(resource.imageUrl)),
        `${product.id} should have at least one source-backed image`,
      ).toBe(true);
    });
  });

  it('resolves artwork for every module in every series', () => {
    const modules = [
      'news',
      'upcoming',
      'guides',
      'events',
      'tools',
      'checklist',
      'wiki',
      'rankings',
      'shop',
      'community',
      'feedback',
    ] as const;

    seriesProducts.forEach((product) => {
      modules.forEach((module) => {
        expect(getSeriesModuleArtwork(product.id, module, product.image))
          .toMatch(/^(?:https:\/\/|\/)/);
      });
    });
  });

  it('leaves unsupported modules empty instead of inventing content', () => {
    ['maplestory-classic', 'maplestory-m', 'maplestory-worlds']
      .forEach((seriesId) => expect(verifiedSeriesContent[seriesId].rankings).toBeUndefined());
    expect(verifiedSeriesContent['maplestory-n'].rankings?.length).toBeGreaterThan(0);
    expect(verifiedSeriesContent['maplestory-idle'].rankings?.length).toBeGreaterThan(0);
    expect(verifiedSeriesContent['maplestory-classic'].shop).toBeUndefined();
  });
});
