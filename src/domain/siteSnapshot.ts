import contentManifest from '../../generated/content-manifest.json';
import contentStatistics from '../../generated/content-statistics.json';
import resourceStatistics from '../../generated/statistics.json';
import { seriesProducts } from '@/pages/series/catalog';

const formatCount = (value: number) => new Intl.NumberFormat('en-US').format(value);
const appSeriesToDataSeries = {
  'maplestory-pc': 'maplestory',
  'maplestory-classic': 'classic',
  'maplestory-m': 'm',
  'maplestory-n': 'n',
  'maplestory-worlds': 'worlds',
  'maplestory-idle': 'idle',
} as const;

type AppSeriesId = keyof typeof appSeriesToDataSeries;
type SeriesCounts = Record<string, number>;

export const siteSnapshot = {
  content: contentStatistics.total_content,
  resources: resourceStatistics.total_resources,
  series: seriesProducts.length,
  sources: contentStatistics.total_sources,
  generatedAt: contentManifest.generated_at,
} as const;

export const formattedSiteSnapshot = {
  content: formatCount(siteSnapshot.content),
  resources: formatCount(siteSnapshot.resources),
  series: formatCount(siteSnapshot.series),
  sources: formatCount(siteSnapshot.sources),
} as const;

export const getSeriesSnapshot = (seriesId: string) => {
  const dataSeries = appSeriesToDataSeries[seriesId as AppSeriesId];
  if (!dataSeries) return { content: 0, resources: 0 };
  return {
    content: (contentStatistics.series as SeriesCounts)[dataSeries] || 0,
    resources: (resourceStatistics.series as SeriesCounts)[dataSeries] || 0,
  };
};
