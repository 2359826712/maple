import { isAvailableInVersion } from './regionModel';
import type {
  CommunityTool,
  CommunityToolCategory,
  CommunityToolRegion,
} from '@/mocks/communityTools';

export type CommunityToolServerFilter = CommunityToolRegion | 'all';

export function toolSupportsServer(tool: CommunityTool, server: CommunityToolServerFilter): boolean {
  return server === 'all' || isAvailableInVersion(tool.regions, server);
}

export function filterCommunityTools(
  tools: readonly CommunityTool[],
  server: CommunityToolServerFilter,
  category: CommunityToolCategory | 'all',
  query: string,
): CommunityTool[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return tools
    .filter((tool) => category === 'all' || tool.category === category)
    .filter((tool) => toolSupportsServer(tool, server))
    .filter((tool) => {
      if (!normalizedQuery) return true;
      return [
        tool.name,
        tool.description,
        tool.descriptionZh,
        tool.bestFor,
        tool.bestForZh,
        tool.source,
        ...tool.platforms,
        ...tool.regions,
      ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    })
    .sort((left, right) => {
      if (server !== 'all') {
        const recommendationOrder = Number(right.recommendedFor.includes(server))
          - Number(left.recommendedFor.includes(server));
        if (recommendationOrder !== 0) return recommendationOrder;
      }
      const officialOrder = Number(right.isOfficial) - Number(left.isOfficial);
      return officialOrder || left.name.localeCompare(right.name);
    });
}
