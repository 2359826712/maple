import { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mapLocations, monsterImages } from '@/mocks/mapler-house';

type MajorRegion = 'maple' | 'arcane' | 'grandis';
type SortKey = 'level' | 'exp' | 'meso' | 'spawn' | 'name';

type MapLocation = {
  name: string;
  mapId: number;
  minLevel: number;
  maxLevel: number;
  monsters: string[];
  burning: number;
  version: string;
  image: string;
  imageSource?: string;
};

type MapleStoryIoMap = {
  id: number;
  streetName: string;
  name: string;
};

type MapExpansionRule = {
  street: string;
  minLevel: number;
  maxLevel: number;
  limit: number;
  monsters: string[];
  version?: string;
};

type TableRow = MapLocation & {
  majorRegion: MajorRegion;
  zone: string;
  mapName: string;
  avgLevel: number;
  forceLabel: string;
  spawn: number;
  capPerGen: number;
  expHour: number;
  mesoHour: number;
  hoursLevel: number;
};

const MAP_API_REGION = 'GMS';
const MAP_API_VERSION = '253';
const MAP_IMAGE_SOURCE = 'MapleStory.io GMS v253 map render';
const MAPLEMAPS_TABLE_URL = 'https://maplemaps.net/map-table';
const MAPLEMAPS_WORLD_URL = 'https://maplemaps.net/world-map/?worldMap=WorldMap&parentWorld=';
const mapRender = (mapId: number) => `https://maplestory.io/api/${MAP_API_REGION}/${MAP_API_VERSION}/map/${mapId}/render?showPortals=true&showLife=true`;

const expandedMapRules: MapExpansionRule[] = [
  { street: 'Reverse City', minLevel: 205, maxLevel: 215, limit: 28, monsters: ['Reverse City Mob', 'Research Train Mob'] },
  { street: 'Chu Chu Island', minLevel: 210, maxLevel: 220, limit: 24, monsters: ['Chu Chu Mob', 'Hungry Muto Mob'] },
  { street: 'Yum Yum Island', minLevel: 215, maxLevel: 225, limit: 26, monsters: ['Yum Yum Mob', 'Illiard Mob'] },
  { street: 'Lachelein', minLevel: 220, maxLevel: 230, limit: 32, monsters: ['Dreamkeeper', 'Nightmare Mob'] },
  { street: 'Arcana', minLevel: 225, maxLevel: 240, limit: 36, monsters: ['Spirit of Arcana', 'Forest Spirit'] },
  { street: 'Morass', minLevel: 230, maxLevel: 245, limit: 34, monsters: ['Morass Mob', 'Swamp Spirit'] },
  { street: 'Esfera', minLevel: 235, maxLevel: 250, limit: 42, monsters: ['Esfera Mob', 'Light Seeker'] },
  { street: 'Moonbridge', minLevel: 245, maxLevel: 255, limit: 36, monsters: ['Moonbridge Mob', 'Void Creature'] },
  { street: 'Labyrinth of Suffering', minLevel: 250, maxLevel: 260, limit: 28, monsters: ['Labyrinth Mob', 'Suffering Guard'] },
  { street: 'Limina', minLevel: 255, maxLevel: 270, limit: 64, monsters: ['Ascendion', 'Foreberion'] },
  { street: 'Cernium', minLevel: 260, maxLevel: 275, limit: 32, monsters: ['Adept of Light', 'Scholar Ghost'] },
  { street: 'Burning Cernium', minLevel: 265, maxLevel: 280, limit: 28, monsters: ['Burning Cernium Mob', 'Holy Knight'] },
  { street: 'Hotel Arcus', minLevel: 270, maxLevel: 280, limit: 32, monsters: ['Desperate Thief', 'Steel Xenoroid'] },
  { street: 'Odium', minLevel: 275, maxLevel: 285, limit: 32, monsters: ['Blinded Soldier', 'Blinded Mage'] },
  { street: 'Shangri-La', minLevel: 280, maxLevel: 290, limit: 42, monsters: ['Spring Spirit', 'Autumn Spirit'] },
  { street: 'Arteria', minLevel: 280, maxLevel: 295, limit: 34, monsters: ['Arteria Mob', 'High Flora Guard'] },
  { street: 'Carcion', minLevel: 285, maxLevel: 300, limit: 46, monsters: ['Carcion Mob', 'Abyss Creature'] },
  { street: 'Commerci Republic', minLevel: 160, maxLevel: 210, limit: 40, monsters: ['Grosso Polpo', 'Aqua Patrol'], version: 'gms' },
  { street: 'Shaolin Temple', minLevel: 250, maxLevel: 275, limit: 24, monsters: ['扫地僧', '铜人'], version: 'cms' },
  { street: 'Orbis', minLevel: 50, maxLevel: 90, limit: 34, monsters: ['Cloud Mob', 'Sky Sentinel'], version: 'all' },
  { street: 'El Nath', minLevel: 70, maxLevel: 120, limit: 34, monsters: ['Snowfield Mob', 'Ice Sentinel'], version: 'all' },
  { street: 'Ludibrium', minLevel: 90, maxLevel: 130, limit: 40, monsters: ['Toy Mob', 'Clocktower Mob'], version: 'all' },
  { street: 'Leafre', minLevel: 100, maxLevel: 160, limit: 36, monsters: ['Dragon Forest Mob', 'Minar Mob'], version: 'all' },
  { street: 'Temple of Time', minLevel: 140, maxLevel: 200, limit: 36, monsters: ['Memory Guardian', 'Oblivion Guardian'], version: 'all' },
  { street: 'Kritias', minLevel: 170, maxLevel: 210, limit: 36, monsters: ['Kritias Soldier', 'Fallen Mage'], version: 'all' },
  { street: 'Zipangu', minLevel: 160, maxLevel: 280, limit: 40, monsters: ['侍大将', '忍者'], version: 'jms' },
];

const excludedMapName = /(cutscene|quest|hidden|entrance|exit|practice|tutorial|event|cash|shop|storage|station|somewhere|safe zone|preview|test|theater|saloon|town)$/i;

const buildExpandedMaps = (apiMaps: MapleStoryIoMap[], featuredMaps: MapLocation[]) => {
  const usedMapIds = new Set(featuredMaps.map((map) => map.mapId));
  const expandedMaps: MapLocation[] = [];

  expandedMapRules.forEach((rule) => {
    const matches = apiMaps
      .filter((map) => map.streetName === rule.street)
      .filter((map) => map.id < 900000000 && !usedMapIds.has(map.id) && !excludedMapName.test(map.name))
      .slice(0, rule.limit);

    matches.forEach((map, index) => {
      usedMapIds.add(map.id);
      expandedMaps.push({
        name: `${map.streetName} — ${map.name}`,
        mapId: map.id,
        minLevel: rule.minLevel,
        maxLevel: rule.maxLevel,
        monsters: rule.monsters,
        burning: index % 5 === 0 ? 10 : index % 3 === 0 ? 8 : 6,
        version: rule.version || 'all',
        imageSource: MAP_IMAGE_SOURCE,
        image: mapRender(map.id),
      });
    });
  });

  return expandedMaps;
};

const regionOptions: Array<{ key: MajorRegion; label: string; hint: string }> = [
  { key: 'maple', label: 'Maple World Region', hint: 'Pre-260 and overseas areas' },
  { key: 'arcane', label: 'Arcane River Region', hint: 'Lv. 200-259 training maps' },
  { key: 'grandis', label: 'Grandis Region', hint: 'Lv. 260+ Sacred Force maps' },
];

const regionShowcase: Record<MajorRegion, {
  title: string;
  hint: string;
  badge: string;
  fallback: string;
  preferredZones: string[];
}> = {
  maple: {
    title: 'Maple World',
    hint: '经典地区与前中期练级路线',
    badge: 'Lv. 1-259',
    fallback: 'from-[#93d0e6] via-[#7db4e2] to-[#f5d284]',
    preferredZones: ['Ludibrium', 'Leafre', 'Temple of Time', 'Orbis', 'El Nath'],
  },
  arcane: {
    title: 'Arcane River',
    hint: '五转后主线地图与 200+ 刷图区间',
    badge: 'Lv. 200-259',
    fallback: 'from-[#7c72df] via-[#5ab4db] to-[#75d9c4]',
    preferredZones: ['Arcana', 'Lachelein', 'Moonbridge', 'Esfera', 'Chu Chu Island'],
  },
  grandis: {
    title: 'Grandis',
    hint: '260+ 圣地路线与后期练级区域',
    badge: 'Lv. 260-300',
    fallback: 'from-[#9fd8e9] via-[#8fb28f] to-[#f0c56c]',
    preferredZones: ['Shangri-La', 'Cernium', 'Odium', 'Arteria', 'Carcion'],
  },
};

const getZone = (name: string) => name.split('—')[0]?.trim() || name.split('-')[0]?.trim() || 'Other';
const getMapName = (name: string) => name.split('—')[1]?.trim() || name;

const getMajorRegion = (map: MapLocation): MajorRegion => {
  const zone = getZone(map.name).toLowerCase();
  if (['cernium', 'burning cernium', 'hotel arcus', 'odium', 'shangri-la', 'arteria', 'tallahart', 'solerian', 'carsion', 'carcion', '카르시온'].some((name) => zone.includes(name))) {
    return 'grandis';
  }
  if (['limina', 'arcane river', 'vanishing', 'reverse city', 'chu chu', 'yum yum', 'lachelein', 'arcana', 'morass', 'esfera', 'moonbridge', 'labyrinth'].some((name) => zone.includes(name))) return 'arcane';
  return 'maple';
};

const formatRate = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}T`;
  return `${Math.round(value)}B`;
};

const monsterMarkerPositions = [
  { x: 10, y: 73 }, { x: 16, y: 36 }, { x: 23, y: 35 }, { x: 30, y: 48 },
  { x: 20, y: 67 }, { x: 28, y: 67 }, { x: 41, y: 76 }, { x: 49, y: 74 },
  { x: 58, y: 58 }, { x: 65, y: 57 }, { x: 72, y: 58 }, { x: 78, y: 56 },
  { x: 86, y: 57 }, { x: 93, y: 57 }, { x: 61, y: 36 }, { x: 68, y: 35 },
  { x: 76, y: 36 }, { x: 83, y: 44 }, { x: 91, y: 43 }, { x: 66, y: 75 },
  { x: 74, y: 75 }, { x: 82, y: 76 }, { x: 89, y: 76 }, { x: 35, y: 76 },
];

const platformBands = [
  { left: 4, top: 79, width: 92 },
  { left: 6, top: 59, width: 30 },
  { left: 52, top: 51, width: 43 },
  { left: 7, top: 35, width: 27 },
  { left: 62, top: 29, width: 31 },
  { left: 58, top: 71, width: 35 },
];

const toRow = (map: MapLocation): TableRow => {
  const avgLevel = Math.round((map.minLevel + map.maxLevel) / 2);
  const majorRegion = getMajorRegion(map);
  const spawn = Math.max(24, Math.round((map.maxLevel - map.minLevel) * 1.2 + map.monsters.length * 6 + map.burning + 18));
  const capPerGen = Math.max(20, spawn - Math.round(map.monsters.length * 1.5));
  const expHour = Math.round((avgLevel * spawn * (1 + map.burning / 100)) / 2.6);
  const mesoHour = Math.round((avgLevel * spawn * 0.18) / 10);
  const forceLabel = majorRegion === 'grandis' ? `Sac ${Math.max(30, (avgLevel - 250) * 10)}` : majorRegion === 'arcane' ? `Arc ${Math.max(60, (avgLevel - 190) * 4)}` : '-';

  return {
    ...map,
    majorRegion,
    zone: getZone(map.name),
    mapName: getMapName(map.name),
    avgLevel,
    forceLabel,
    spawn,
    capPerGen,
    expHour,
    mesoHour,
    hoursLevel: Math.max(0.2, Number((300 / Math.max(1, expHour)).toFixed(1))),
  };
};

const getPreferredRegionRow = (rows: TableRow[], region: MajorRegion) => {
  const preferredZones = regionShowcase[region].preferredZones;
  for (const zone of preferredZones) {
    const match = rows.find((row) => row.majorRegion === region && row.zone.includes(zone));
    if (match) return match;
  }
  return rows.find((row) => row.majorRegion === region);
};

export default function MapExplorer() {
  const { t } = useTranslation();
  const [selectedRegion, setSelectedRegion] = useState<MajorRegion>('grandis');
  const [selectedZone, setSelectedZone] = useState('all');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState(280);
  const [showFrenzy, setShowFrenzy] = useState(false);
  const [personalRates, setPersonalRates] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('level');
  const [selectedMapName, setSelectedMapName] = useState<string | null>(null);
  const [expandedMaps, setExpandedMaps] = useState<MapLocation[]>([]);
  const [isLoadingExpandedMaps, setIsLoadingExpandedMaps] = useState(true);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadExpandedMaps = async () => {
      setIsLoadingExpandedMaps(true);
      setMapLoadError(null);

      try {
        const response = await fetch(`https://maplestory.io/api/${MAP_API_REGION}/${MAP_API_VERSION}/map`);
        if (!response.ok) throw new Error(`MapleStory.io returned ${response.status}`);

        const apiMaps = await response.json() as MapleStoryIoMap[];
        if (!isActive) return;

        setExpandedMaps(buildExpandedMaps(apiMaps, mapLocations as MapLocation[]));
      } catch (error) {
        if (!isActive) return;
        setExpandedMaps([]);
        setMapLoadError(error instanceof Error ? error.message : 'Could not load live map list');
      } finally {
        if (isActive) setIsLoadingExpandedMaps(false);
      }
    };

    loadExpandedMaps();

    return () => {
      isActive = false;
    };
  }, []);

  const allMaps = useMemo(() => [...(mapLocations as MapLocation[]), ...expandedMaps], [expandedMaps]);
  const rows = useMemo(() => allMaps.map(toRow), [allMaps]);
  const regionRows = useMemo(() => rows.filter((row) => row.majorRegion === selectedRegion), [rows, selectedRegion]);
  const zones = useMemo(() => ['all', ...Array.from(new Set(regionRows.map((row) => row.zone)))], [regionRows]);
  const preferredZoneByRegion = useMemo<Record<MajorRegion, string>>(() => ({
    maple: getPreferredRegionRow(rows, 'maple')?.zone || 'all',
    arcane: getPreferredRegionRow(rows, 'arcane')?.zone || 'all',
    grandis: getPreferredRegionRow(rows, 'grandis')?.zone || 'all',
  }), [rows]);
  const regionShowcaseRows = useMemo<Record<MajorRegion, TableRow | undefined>>(() => ({
    maple: getPreferredRegionRow(rows, 'maple'),
    arcane: getPreferredRegionRow(rows, 'arcane'),
    grandis: getPreferredRegionRow(rows, 'grandis'),
  }), [rows]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return regionRows
      .filter((row) => selectedZone === 'all' || row.zone === selectedZone)
      .filter((row) => {
        if (!normalized) return true;
        return [row.name, row.zone, row.mapName, row.forceLabel, ...row.monsters]
          .some((value) => value.toLowerCase().includes(normalized));
      })
      .map((row) => {
        const frenzyMultiplier = showFrenzy ? 1.35 : 1;
        const personalMultiplier = personalRates ? Math.max(0.75, 1 - Math.abs(row.avgLevel - level) * 0.015) : 1;
        return {
          ...row,
          spawn: Math.round(row.spawn * frenzyMultiplier),
          expHour: Math.round(row.expHour * frenzyMultiplier * personalMultiplier),
          mesoHour: Math.round(row.mesoHour * frenzyMultiplier),
          hoursLevel: Math.max(0.2, Number((300 / Math.max(1, row.expHour * frenzyMultiplier * personalMultiplier)).toFixed(1))),
        };
      })
      .sort((a, b) => {
        if (sortKey === 'exp') return b.expHour - a.expHour;
        if (sortKey === 'meso') return b.mesoHour - a.mesoHour;
        if (sortKey === 'spawn') return b.spawn - a.spawn;
        if (sortKey === 'name') return a.mapName.localeCompare(b.mapName);
        return a.avgLevel - b.avgLevel || b.expHour - a.expHour;
      });
  }, [level, personalRates, query, regionRows, selectedZone, showFrenzy, sortKey]);

  const selectedMap = useMemo(
    () => filteredRows.find((row) => row.name === selectedMapName) || filteredRows[0],
    [filteredRows, selectedMapName],
  );

  useEffect(() => {
    if (selectedZone !== 'all') return;
    const preferredZone = preferredZoneByRegion[selectedRegion];
    if (preferredZone && preferredZone !== 'all') {
      setSelectedZone(preferredZone);
    }
  }, [preferredZoneByRegion, selectedRegion, selectedZone]);

  const selectRelativeMap = (direction: -1 | 1) => {
    if (filteredRows.length === 0) return;
    const currentIndex = filteredRows.findIndex((row) => row.name === selectedMapName);
    const baseIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (baseIndex + direction + filteredRows.length) % filteredRows.length;
    setSelectedMapName(filteredRows[nextIndex].name);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-background-200 bg-[#f5f3ee] shadow-sm">
        <div className="grid grid-cols-1 gap-6 p-4 md:p-5 xl:grid-cols-[minmax(360px,42%)_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div>
              <div className="text-[13px] font-bold text-foreground-950">Select a Region:</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-3">
                {(Object.keys(regionShowcase) as MajorRegion[]).map((regionKey) => {
                  const config = regionShowcase[regionKey];
                  const showcaseRow = regionShowcaseRows[regionKey];
                  const isSelected = selectedRegion === regionKey;

                  return (
                    <button
                      key={regionKey}
                      type="button"
                      onClick={() => {
                        setSelectedRegion(regionKey);
                        setSelectedZone(preferredZoneByRegion[regionKey] || 'all');
                        setSelectedMapName(null);
                      }}
                      className={`group relative aspect-[0.62] overflow-hidden rounded-xl border text-left shadow-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary-500 ring-2 ring-primary-300/70'
                          : 'border-background-300 hover:-translate-y-0.5 hover:border-primary-300'
                      }`}
                    >
                      {showcaseRow ? (
                        <img
                          src={showcaseRow.image}
                          alt={config.title}
                          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${config.fallback}`} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/70" />
                      <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {config.badge}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                        <div className="text-lg font-semibold drop-shadow-sm">{config.title}</div>
                        <div className="mt-1 text-[11px] leading-4 text-white/90">{config.hint}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-background-200 bg-background-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-foreground-500">
                    {regionShowcase[selectedRegion].title}
                  </div>
                  <div className="mt-1 text-sm text-foreground-700">
                    {regionShowcase[selectedRegion].hint}
                  </div>
                </div>
                <a
                  href={MAPLEMAPS_WORLD_URL}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-background-200 bg-background-50 px-3 text-xs font-semibold text-foreground-700 hover:text-primary-700"
                >
                  世界地图
                  <i className="ri-external-link-line"></i>
                </a>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="区域" value={String(zones.length - 1)} />
                <MiniStat label="结果" value={String(filteredRows.length)} />
                <MiniStat label="推荐" value={selectedMap ? selectedMap.mapName : '-'} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedZone('all');
                    setSelectedMapName(null);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    selectedZone === 'all'
                      ? 'bg-primary-600 text-background-50'
                      : 'border border-background-200 bg-background-50 text-foreground-700 hover:bg-primary-50'
                  }`}
                >
                  全部地图
                </button>
                {zones.filter((zone) => zone !== 'all').slice(0, 8).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => {
                      setSelectedZone(zone);
                      setSelectedMapName(null);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      selectedZone === zone
                        ? 'bg-secondary-600 text-background-50'
                        : 'border border-background-200 bg-background-50 text-foreground-700 hover:bg-background-100'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-foreground-500">
                <span className="rounded-full border border-background-200 bg-background-100 px-2 py-0.5">
                  数据库 {allMaps.length} 张地图
                </span>
                {isLoadingExpandedMaps && (
                  <span className="rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-primary-700">
                    正在加载扩展地图...
                  </span>
                )}
                {mapLoadError && (
                  <span className="rounded-full border border-secondary-200 bg-secondary-50 px-2 py-0.5 text-secondary-800">
                    在线地图列表加载失败，当前显示内置数据
                  </span>
                )}
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="rounded-xl border border-background-200 bg-background-50 shadow-sm">
              <div className="border-b border-background-200 px-4 py-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-[13px] font-bold text-foreground-950">Table View</div>
                    <div className="mt-1 text-xs text-foreground-500">
                      选择左侧地区后，在这里筛选地图、怪物和等级区间。
                    </div>
                  </div>
                  <a
                    href={MAPLEMAPS_TABLE_URL}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1 self-start rounded-md border border-background-200 bg-background-100 px-3 text-xs font-semibold text-foreground-700 hover:text-primary-700"
                  >
                    maplemaps.net
                    <i className="ri-external-link-line"></i>
                  </a>
                </div>
              </div>

              <div className="border-b border-background-200 px-4 py-3">
                <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-700">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={showFrenzy} onChange={(event) => setShowFrenzy(event.target.checked)} className="accent-primary-600" />
                    显示 Frenzy 速率
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={personalRates} onChange={(event) => setPersonalRates(event.target.checked)} className="accent-primary-600" />
                    按角色等级修正收益
                  </label>
                  <span className="ml-auto text-foreground-500">
                    {filteredRows.length === 1 ? t('mh_map_count_one', { count: filteredRows.length }) : t('mh_map_count_other', { count: filteredRows.length })}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1.6fr)_170px_110px_170px_88px]">
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400"></i>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="搜索地图名称、区域或怪物..."
                      className="h-10 w-full rounded-md border border-background-300 bg-background-50 pl-9 pr-3 text-sm outline-none focus:border-primary-500"
                    />
                  </div>
                  <select
                    value={selectedZone}
                    onChange={(event) => {
                      setSelectedZone(event.target.value);
                      setSelectedMapName(null);
                    }}
                    className="h-10 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
                  >
                    {zones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone === 'all' ? '全部区域' : zone}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3">
                    <span className="text-xs font-semibold text-foreground-500">等级</span>
                    <input
                      type="number"
                      value={level}
                      min={1}
                      max={300}
                      onChange={(event) => setLevel(Number(event.target.value) || 1)}
                      className="h-9 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                    />
                  </label>
                  <select
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value as SortKey)}
                    className="h-10 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
                  >
                    <option value="level">按等级</option>
                    <option value="exp">按经验/小时</option>
                    <option value="meso">按金币/小时</option>
                    <option value="spawn">按刷新量</option>
                    <option value="name">按地图名</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setSelectedZone('all');
                      setLevel(280);
                      setShowFrenzy(false);
                      setPersonalRates(true);
                      setSortKey('level');
                      setSelectedMapName(null);
                    }}
                    className="h-10 rounded-md border border-background-300 bg-background-50 px-3 text-sm font-semibold text-foreground-700 hover:bg-background-100 cursor-pointer"
                  >
                    重置
                  </button>
                </div>
              </div>

              <div className="px-4 pb-4">
                <MapTable
                  rows={filteredRows}
                  selectedName={selectedMapName || undefined}
                  onSelect={(name) => setSelectedMapName((current) => (current === name ? null : name))}
                  onNavigate={selectRelativeMap}
                  onCollapse={() => setSelectedMapName(null)}
                />
              </div>
            </div>
          </main>
        </div>

        <div className="border-t border-background-200 bg-background-100 px-4 py-3 text-xs leading-relaxed text-foreground-500">
          Fan-made, non-commercial player tool. Map renders are provided through MapleStory.io using MapleStory game assets.
          MapleStory and related assets belong to Nexon.
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-background-200 bg-background-100 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-foreground-500">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-foreground-950">{value}</div>
    </div>
  );
}

function MapTable({
  rows,
  selectedName,
  onSelect,
  onNavigate,
  onCollapse,
}: {
  rows: TableRow[];
  selectedName?: string;
  onSelect: (name: string) => void;
  onNavigate: (direction: -1 | 1) => void;
  onCollapse: () => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-background-300 bg-background-100 p-10 text-center text-sm text-foreground-500">
        No maps match the current table filters.
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-background-200 bg-background-50">
      <table className="w-full min-w-[980px] text-sm">
        <thead className="bg-background-100 text-xs text-foreground-600">
          <tr>
            <th className="px-3 py-2 text-left">预览</th>
            <th className="px-3 py-2 text-left">地图名</th>
            <th className="px-3 py-2 text-left">区域</th>
            <th className="px-3 py-2 text-left">怪物等级</th>
            <th className="px-3 py-2 text-left">需求</th>
            <th className="px-3 py-2 text-left">刷新量</th>
            <th className="px-3 py-2 text-left">每轮容量</th>
            <th className="px-3 py-2 text-left">经验/小时</th>
            <th className="px-3 py-2 text-left">金币/小时</th>
            <th className="px-3 py-2 text-left">升级耗时</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-background-200">
          {rows.map((row) => {
            const isSelected = selectedName === row.name;

            return (
              <Fragment key={row.name}>
                <tr
                  className={isSelected ? 'bg-primary-50' : 'hover:bg-background-100'}
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onSelect(row.name)}
                      className={`h-8 w-8 rounded-md border cursor-pointer inline-flex items-center justify-center ${
                        isSelected
                          ? 'border-primary-500 bg-primary-600 text-background-50'
                          : 'border-background-300 bg-background-50 text-primary-700 hover:bg-primary-50'
                      }`}
                      title={isSelected ? '收起地图预览' : '查看地图预览'}
                    >
                      <i className={isSelected ? 'ri-arrow-up-s-line' : 'ri-image-line'}></i>
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => onSelect(row.name)} className="text-left font-semibold text-foreground-950 hover:text-primary-700 cursor-pointer">
                      {row.mapName}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-foreground-700">{row.zone}</td>
                  <td className="px-3 py-2 text-foreground-700">{row.avgLevel}</td>
                  <td className="px-3 py-2 text-foreground-700">{row.forceLabel}</td>
                  <td className="px-3 py-2 font-semibold text-foreground-900">{row.spawn}</td>
                  <td className="px-3 py-2 text-foreground-700">{row.capPerGen}</td>
                  <td className="px-3 py-2 font-semibold text-primary-700">{formatRate(row.expHour)}</td>
                  <td className="px-3 py-2 text-foreground-700">{formatRate(row.mesoHour)}</td>
                  <td className="px-3 py-2 text-foreground-700">{row.hoursLevel}</td>
                </tr>
                {isSelected && (
                  <ExpandedMapRow
                    row={row}
                    colSpan={10}
                    onPrevious={() => onNavigate(-1)}
                    onNext={() => onNavigate(1)}
                    onCollapse={onCollapse}
                  />
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExpandedMapRow({
  row,
  colSpan,
  onPrevious,
  onNext,
  onCollapse,
}: {
  row: TableRow;
  colSpan: number;
  onPrevious: () => void;
  onNext: () => void;
  onCollapse: () => void;
}) {
  const mobsPerHour = row.spawn * 360;
  const instancedMobsPerHour = Math.round(mobsPerHour * 1.03);
  const visibleMonsterCount = Math.min(monsterMarkerPositions.length, Math.max(12, row.spawn));

  return (
    <tr className="bg-background-50">
      <td colSpan={colSpan} className="p-0">
        <div className="relative overflow-hidden border-y border-primary-400 bg-white">
          <div className="relative min-h-[390px] overflow-hidden bg-foreground-950">
            <img
              src={row.image}
              alt={`${row.name} map preview`}
              className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35"></div>

            {platformBands.map((platform) => (
              <div
                key={`${platform.left}-${platform.top}`}
                className="absolute h-4 rounded-full bg-[#2c302a]/75 shadow-[0_-5px_0_#4e7641,0_-8px_0_#82a85d]"
                style={{
                  left: `${platform.left}%`,
                  top: `${platform.top}%`,
                  width: `${platform.width}%`,
                }}
              />
            ))}

            <div className="absolute left-0 top-0 z-20 w-[210px] rounded-br-md border-b border-r border-foreground-400/40 bg-background-100/95 p-3 text-foreground-950 shadow-lg backdrop-blur-sm">
              <button
                type="button"
                onClick={onCollapse}
                className="absolute left-1/2 top-1 h-6 w-8 -translate-x-1/2 rounded-md text-lg leading-none text-foreground-800 hover:bg-background-200 cursor-pointer"
                aria-label="Collapse map image"
              >
                <i className="ri-arrow-up-s-line"></i>
              </button>
              <a
                href={MAPLEMAPS_TABLE_URL}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="mt-8 inline-flex max-w-[130px] items-center gap-2 text-sm font-semibold underline underline-offset-2 hover:text-primary-700"
              >
                <span className="truncate">{row.mapName}</span>
                <i className="ri-external-link-line shrink-0 text-lg"></i>
              </a>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>Avg Level:</dt>
                  <dd className="font-semibold tabular-nums">{row.avgLevel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Mobs/hr:</dt>
                  <dd className="font-semibold tabular-nums">{mobsPerHour.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Instanced:</dt>
                  <dd className="font-semibold tabular-nums">{instancedMobsPerHour.toLocaleString()}</dd>
                </div>
              </dl>
              <div className="mt-2 rounded border border-background-300 bg-background-50 px-2 py-1 text-[10px] font-semibold text-foreground-500">
                Game render via MapleStory.io
              </div>
            </div>

            {Array.from({ length: visibleMonsterCount }).map((_, index) => {
              const monster = row.monsters[index % row.monsters.length];
              const position = monsterMarkerPositions[index % monsterMarkerPositions.length];

              return (
                <div
                  key={`${monster}-${index}`}
                  className="absolute z-10 h-9 w-9 -translate-x-1/2 -translate-y-full drop-shadow-[0_3px_3px_rgba(0,0,0,.55)]"
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  title={monster}
                >
                  {monsterImages[monster] ? (
                    <img src={monsterImages[monster]} alt={monster} className="h-full w-full rounded-full object-cover object-top" loading="lazy" />
                  ) : (
                    <div className="h-full w-full rounded-full bg-foreground-900 text-background-50 grid place-items-center text-xs font-bold">
                      {monster.slice(0, 1)}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="absolute left-[8%] top-[61%] h-14 w-10 rounded-full border-4 border-[#f4e6ad] bg-foreground-950/70 shadow-[0_0_18px_rgba(255,235,160,.95)]"></div>
            <div className="absolute right-[7%] top-[38%] h-14 w-10 rounded-full border-4 border-[#f4e6ad] bg-foreground-950/70 shadow-[0_0_18px_rgba(255,235,160,.95)]"></div>
            <div className="absolute bottom-4 left-[4%] h-11 w-8 rounded-full bg-sky-200/60 blur-sm"></div>
            <div className="absolute bottom-4 right-[12%] h-11 w-8 rounded-full bg-sky-200/60 blur-sm"></div>

            <button
              type="button"
              onClick={onPrevious}
              className="absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border border-background-200 bg-background-50/95 text-xl text-foreground-800 shadow-md hover:bg-background-100 cursor-pointer"
              aria-label="Previous map"
            >
              <i className="ri-arrow-left-line"></i>
            </button>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border border-background-200 bg-background-50/95 text-xl text-foreground-800 shadow-md hover:bg-background-100 cursor-pointer"
              aria-label="Next map"
            >
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>

          <div className="relative h-16 bg-background-50">
            <button
              type="button"
              onClick={onCollapse}
              className="absolute left-1/2 top-full h-8 w-16 -translate-x-1/2 -translate-y-full rounded-t-md border border-background-300 bg-background-50 text-xl text-foreground-700 shadow-sm hover:bg-background-100 cursor-pointer"
              aria-label="Collapse map image"
            >
              <i className="ri-arrow-up-s-line"></i>
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
