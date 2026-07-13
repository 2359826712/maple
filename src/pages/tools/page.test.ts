import { describe, expect, it } from 'vitest';
import { communityToolRegions, communityTools } from '@/mocks/communityTools';
import { filterCommunityTools, toolSupportsServer } from '@/domain/communityToolCatalog';

describe('regional community tool directory', () => {
  it('has useful resources and a recommended starting point for every supported server', () => {
    for (const server of communityToolRegions) {
      const matching = communityTools.filter((tool) => toolSupportsServer(tool, server.code));
      expect(matching.length, server.label).toBeGreaterThan(0);
      expect(
        matching.some((tool) => tool.recommendedFor.includes(server.code)),
        `${server.label} recommendation`,
      ).toBe(true);
    }
  });

  it('includes the regional resources from the practical bookmark set', () => {
    const expectedIds = [
      'boss-crystal-calculator',
      'whackybeanz',
      'mathbro-calculators',
      'maplestory-wiki',
      'mapletools',
      'mastema',
      'maplehub-gms',
      'wse-optimizer',
      'gms-upgrade-tracker',
      'official-gms-rankings',
      'official-gms-news',
      'maple-scouter',
      'maple-scouter-boss-data',
      'maple-scouter-party',
      'maple-scouter-hexa',
      'maple-scouter-links',
      'official-kms',
      'msea-maple-gg',
      'official-msea',
      'official-tms',
      'bahamut-tms',
      'official-jms',
      'jms-game-guide',
      'jms-notices',
      'jms-community-wiki',
      'official-cms',
      'cms-baidu-tieba',
      'cms-bilibili-guides',
      'maplehub-n',
      'official-maplestory-m',
      'maplestory-m-reddit',
    ];
    const actualIds = new Set(communityTools.map((tool) => tool.id));
    expectedIds.forEach((id) => expect(actualIds, id).toContain(id));
  });

  it('filters by server and searchable purpose, including localized copy', () => {
    const kmsHexa = filterCommunityTools(communityTools, 'kms', 'all', 'HEXA');
    expect(kmsHexa.map((tool) => tool.id)).toContain('maple-scouter-hexa');
    expect(kmsHexa.every((tool) => toolSupportsServer(tool, 'kms'))).toBe(true);

    const chineseSearch = filterCommunityTools(communityTools, 'cms', 'all', '装备表');
    expect(chineseSearch.map((tool) => tool.id)).toEqual(['cms-baidu-tieba']);
  });

  it('places a server recommendation ahead of the remaining results', () => {
    const results = filterCommunityTools(communityTools, 'msn', 'all', '');
    expect(results[0].id).toBe('maplehub-n');
  });
});
