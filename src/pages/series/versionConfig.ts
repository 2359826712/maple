import { VERSIONS, type GameVersion } from '@/hooks/VersionContext';

const versionsBySeries: Record<string, GameVersion[]> = {
  'maplestory-pc': ['gms', 'kms', 'jms', 'tms', 'msea'],
  'maplestory-classic': ['gms'],
  'maplestory-m': ['gms', 'kms', 'jms', 'tms', 'msea'],
  'maplestory-n': ['gms'],
  'maplestory-worlds': ['gms', 'kms'],
  'maplestory-idle': ['gms'],
};

const regionalShortLabels: Record<GameVersion, string> = {
  gms: 'GLB',
  kms: 'KR',
  jms: 'JP',
  tms: 'TW',
  msea: 'SEA',
};

export const getSeriesVersions = (seriesId?: string) => {
  const allowed = seriesId ? versionsBySeries[seriesId] : undefined;
  return allowed ? VERSIONS.filter((version) => allowed.includes(version.id)) : VERSIONS;
};

export const getSeriesVersionShortLabel = (seriesId: string | undefined, version: GameVersion) => (
  seriesId && seriesId !== 'maplestory-pc' ? regionalShortLabels[version] : VERSIONS.find((item) => item.id === version)?.shortLabel || version.toUpperCase()
);
