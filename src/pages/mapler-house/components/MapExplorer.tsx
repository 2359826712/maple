import { Fragment, useEffect, useMemo, useState, type MouseEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cachedJsonFetch, realtimeCacheDurations } from '@/services/realtimeCache';
import { WORLD_MAP_HIT_MASKS, type OverlayHitMask } from './worldMapHitMasks';
import { mapLocations } from '@/mocks/mapler-house';

type MajorRegion = 'maple' | 'arcane' | 'grandis';
type SortKey = 'level' | 'exp' | 'meso' | 'spawn' | 'name';
type NavigatorNode = 'root' | 'table' | MajorRegion;

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
  sourceRegion?: MajorRegion;
  avgMobExp?: number;
  capacity?: number;
  capacityPerGen?: number;
  numMobs?: number;
  forceLabel?: string;
};

type MapleStoryIoMap = {
  id: number;
  streetName: string;
  name: string;
};

type MapleStoryIoMobPlacement = {
  id: number;
};

type MapleStoryIoMob = {
  id: number;
  name: string;
  meta?: {
    level?: number;
    exp?: number;
    maxHP?: number;
  };
};

type MonsterVisual = {
  key: string;
  name: string;
  icon: string;
  mobId?: number;
  level?: number;
  exp?: number;
  hp?: number;
};

type TableRow = MapLocation & {
  majorRegion: MajorRegion;
  zone: string;
  mapName: string;
  avgLevel: number;
  spawn: number;
  capPerGen: number;
  expHour: number;
  mesoHour: number;
  hoursLevel: number;
};

type MapLabel = { label: string; x: number; y: number; tone?: 'light' | 'dark' };
type MapPin = { zone: string; x: number; y: number; count: number };
type RootHotspot = { region: MajorRegion; label: string; x: number; y: number; width: number; height: number; note: string };

const MAP_API_REGION = 'GMS';
const MAP_API_VERSION = '253';
const MAPLESTORY_IO_API_BASE = '/maplestory-io-api';
const MAPLEMAPS_ASSET_BASE = 'https://d3uzjcc4cyf4cj.cloudfront.net';
const MAP_IMAGE_SOURCE = 'Maplemaps map render';

const MAPLEMAPS_HOME_REGION_IMAGES = {
  maple: 'https://d3uzjcc4cyf4cj.cloudfront.net/other/maple_world_select.webp',
  grandis: 'https://d3uzjcc4cyf4cj.cloudfront.net/other/grandis_select.webp',
  arcane: 'https://d3uzjcc4cyf4cj.cloudfront.net/other/arcane_river_select.webp',
} as const;

const MAPLEMAPS_HOME_TABLE_IMAGE = 'https://d3uzjcc4cyf4cj.cloudfront.net/other/spreadsheet_light.PNG';

type MaplemapsOverlay = {
  id: string;
  img: string;
  leftPx: number;
  topPx: number;
  widthPx: number;
  heightPx: number;
};

type MaplemapsWorldMapDef = {
  worldMap: string;
  parentWorld: string;
  base: { src: string; width: number; height: number };
  overlays: MaplemapsOverlay[];
};

type MaplemapsWorldMapLink = { linksTo: string; x: number; y: number };
type MaplemapsWorldMapDot = {
  description: string | null;
  type: number;
  x: number;
  y: number;
  mapNumbers: number[];
  noTooltip?: boolean;
};
type MaplemapsWorldMapRemote = {
  worldMapName: string;
  parentWorld: string;
  links: MaplemapsWorldMapLink[];
  maps: MaplemapsWorldMapDot[];
};

type MaplemapsMapMeta = {
  map_id: number;
  name: string;
  streetName: string;
  parentWorld?: string;
  worldMapName?: string;
  avgLevel?: number;
  mobIds?: number[];
  capacityPerGen?: number;
  capacity?: number;
  numMobs?: number;
  sourceRegion?: MajorRegion;
};

type MaplemapsMobMeta = {
  mob_id: number;
  name: string;
  level?: number;
  maxHP?: number;
  exp?: number;
};

async function fetchMaplemapsRegionData(region: 'maple_world' | 'grandis' | 'arcane_river') {
  return cachedJsonFetch<{
    worldMapsData: Record<string, MaplemapsWorldMapRemote>;
    mapsData: Record<string, MaplemapsMapMeta>;
    mobsData: Record<string, MaplemapsMobMeta>;
  }>('https://v66rewn65j.execute-api.us-west-2.amazonaws.com/prod/fetch-mongodb', {
    cacheKey: `maplemaps-region:${region}`,
    freshMs: realtimeCacheDurations.long,
    staleMs: realtimeCacheDurations.week,
    requestInit: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reqType: 'regionData', region }),
    },
  });
}

const MAPLEMAPS_WORLDMAPS: Record<string, MaplemapsWorldMapDef> = {
  WorldMap: {
    worldMap: 'WorldMap',
    parentWorld: '',
    base: { src: 'https://d3uzjcc4cyf4cj.cloudfront.net/world_maps/WorldMap.webp?v=2', width: 640, height: 470 },
    overlays: [
      { id: 'WorldMap000', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap000.webp?v=1', leftPx: 118, topPx: 65, widthPx: 53, heightPx: 41 },
      { id: 'WorldMap010', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap010.webp?v=1', leftPx: 21, topPx: 109, widthPx: 130, heightPx: 117 },
      { id: 'WorldMap100', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap100.webp?v=1', leftPx: 19, topPx: 219, widthPx: 69, heightPx: 95 },
      { id: 'WorldMap110', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap110.webp?v=1', leftPx: 442, topPx: 4, widthPx: 193, heightPx: 152 },
      { id: 'WorldMap170', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap170a.webp?v=1', leftPx: 234, topPx: 395, widthPx: 105, heightPx: 77 },
      { id: 'WorldMap160', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap160.webp?v=1', leftPx: 26, topPx: 51, widthPx: 101, heightPx: 67 },
      { id: 'WorldMap020', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap020.webp?v=1', leftPx: 230, topPx: 120, widthPx: 269, heightPx: 217 },
      { id: 'WorldMap030', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap030.webp?v=1', leftPx: 195, topPx: 229, widthPx: 144, heightPx: 113 },
      { id: 'WorldMap040', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap040.webp?v=1', leftPx: 146, topPx: 161, widthPx: 95, heightPx: 74 },
      { id: 'WorldMap050', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap050.webp?v=1', leftPx: 74, topPx: 218, widthPx: 214, heightPx: 245 },
      { id: 'WorldMap060', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap060.webp?v=1', leftPx: 458, topPx: 203, widthPx: 165, heightPx: 224 },
      { id: 'WorldMap070', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap070.webp?v=1', leftPx: 274, topPx: 314, widthPx: 219, heightPx: 156 },
      { id: 'WorldMap080', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap080.webp?v=1', leftPx: 7, topPx: 318, widthPx: 128, heightPx: 127 },
      { id: 'WorldMap090', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap090.webp?v=1', leftPx: 143, topPx: 83, widthPx: 98, heightPx: 89 },
    ],
  },
  WorldMap160: {
    worldMap: 'WorldMap160',
    parentWorld: 'WorldMap',
    base: { src: 'https://d3uzjcc4cyf4cj.cloudfront.net/world_maps/WorldMap160.webp?v=2', width: 640, height: 470 },
    overlays: [
      { id: 'WorldMap161', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap161.webp?v=1', leftPx: 146, topPx: 78, widthPx: 418, heightPx: 258 },
      { id: 'WorldMap169', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap169.webp?v=1', leftPx: 26, topPx: 83, widthPx: 146, heightPx: 142 },
      { id: 'WorldMap162', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap162.webp?v=1', leftPx: 465, topPx: 71, widthPx: 150, heightPx: 162 },
      { id: 'WorldMap163', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap163.webp?v=1', leftPx: 51, topPx: 223, widthPx: 196, heightPx: 175 },
    ],
  },
  WGWorldMap: {
    worldMap: 'WGWorldMap',
    parentWorld: 'GWorldMap',
    base: { src: 'https://d3uzjcc4cyf4cj.cloudfront.net/world_maps/WGWorldMap.webp?v=2', width: 640, height: 470 },
    overlays: [
      { id: 'WorldMap230', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap230a.webp?v=1', leftPx: 82, topPx: 146, widthPx: 146, heightPx: 128 },
      { id: 'WorldMap250', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap250.webp?v=1', leftPx: 209, topPx: 127, widthPx: 162, heightPx: 115 },
      { id: 'WorldMap270', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap270a.webp?v=1', leftPx: 283, topPx: 30, widthPx: 107, heightPx: 119 },
      { id: 'WorldMap300', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap300.webp?v=1', leftPx: 59, topPx: 51, widthPx: 150, heightPx: 84 },
      { id: 'WorldMap310', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap310.webp?v=1', leftPx: 66, topPx: 318, widthPx: 194, heightPx: 125 },
      { id: 'WorldMap320', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap320.webp?v=1', leftPx: 252, topPx: 237, widthPx: 133, heightPx: 119 },
      { id: 'WorldMap350', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap350.webp?v=1', leftPx: 348, topPx: 193, widthPx: 112, heightPx: 95 },
    ],
  },
  WorldMap082: {
    worldMap: 'WorldMap082',
    parentWorld: '',
    base: { src: 'https://d3uzjcc4cyf4cj.cloudfront.net/world_maps/WorldMap082.webp?v=2', width: 640, height: 470 },
    overlays: [
      { id: 'WorldMap0821', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap0821.webp?v=1', leftPx: 6, topPx: 6, widthPx: 177, heightPx: 183 },
      { id: 'WorldMap0822', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap0822.webp?v=1', leftPx: 34, topPx: 255, widthPx: 217, heightPx: 133 },
      { id: 'WorldMap0823', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap0823.webp?v=1', leftPx: 100, topPx: 123, widthPx: 218, heightPx: 166 },
      { id: 'WorldMap0824', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap0824.webp?v=1', leftPx: 255, topPx: 72, widthPx: 209, heightPx: 161 },
      { id: 'WorldMap0825', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap0825.webp?v=1', leftPx: 238, topPx: 224, widthPx: 181, heightPx: 182 },
      { id: 'WorldMap0826', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap0826.webp?v=1', leftPx: 388, topPx: 169, widthPx: 234, heightPx: 140 },
      { id: 'WorldMap0827', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap0827.webp?v=1', leftPx: 406, topPx: 21, widthPx: 206, heightPx: 175 },
      { id: 'WorldMap0828', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap0828.webp?v=1', leftPx: 170, topPx: 15, widthPx: 156, heightPx: 97 },
      { id: 'WorldMap0829', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap0829.webp?v=1', leftPx: 25, topPx: 356, widthPx: 132, heightPx: 93 },
      { id: 'WorldMap082a', img: 'https://d3uzjcc4cyf4cj.cloudfront.net/linkImages/WorldMap082a.webp?v=1', leftPx: 387, topPx: 281, widthPx: 152, heightPx: 113 },
    ],
  },
};

type WorldMapStackItem = { worldMap: string; parentWorld: string };
const mapRender = (mapId: number) => `${MAPLEMAPS_ASSET_BASE}/maps/lg/${mapId}.webp?v=2`;
const mapleStoryIoEndpoint = (path: string) => `${MAPLESTORY_IO_API_BASE}/${MAP_API_REGION}/${MAP_API_VERSION}${path}`;
const mobIcon = (mobId: number) => mapleStoryIoEndpoint(`/mob/${mobId}/icon`);
const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

const WORLD_MAP_LABELS: Record<string, string> = {
  WorldMap000: 'Maple Island',
  WorldMap010: 'Victoria Island',
  WorldMap020: 'Ludus Lake',
  WorldMap021: 'El Nath Dungeon',
  WorldMap022: "Lion King's Castle",
  WorldMap030: 'Nihal Desert',
  WorldMap040: 'El Nath Mts.',
  WorldMap050: 'Minar Forest',
  WorldMap060: 'Mu Lung Garden',
  WorldMap070: 'Temple of Time',
  WorldMap080: 'Edelstein',
  WorldMap090: 'Orbis',
  WorldMap100: 'Aquarium',
  WorldMap110: 'Grandis',
  WorldMap160: 'Masteria',
  WorldMap170: 'Commerci',
  WorldMap161: 'Phantom Forest',
  WorldMap162: 'New Leaf City',
  WorldMap163: 'Crimsonwood',
  WorldMap169: 'Haunted House',
  WorldMap230: 'Cernium',
  WorldMap250: 'Hotel Arcus',
  WorldMap270: 'Odium',
  WorldMap300: 'Shangri-La',
  WorldMap310: 'Arteria',
  WorldMap320: 'Carcion',
  WorldMap350: 'Tallahart',
  WorldMap0821: 'Vanishing Journey',
  WorldMap0822: 'Chu Chu Island',
  WorldMap0823: 'Lachelein',
  WorldMap0824: 'Arcana',
  WorldMap0825: 'Morass',
  WorldMap0826: 'Esfera',
  WorldMap0827: 'Tenebris',
  WorldMap08271: 'Moonbridge',
  WorldMap08272: 'Labyrinth of Suffering',
  WorldMap08273: 'Limina',
  WorldMap0828: 'Reverse City',
  WorldMap0829: 'Yum Yum Island',
  WorldMap082a: 'Sellas',
};

const getWorldMapLabel = (worldMapId: string) => WORLD_MAP_LABELS[worldMapId] || worldMapId;

const MAP_DOT_WORLD_LINKS: Record<string, Record<number, string>> = {
  WorldMap020: {
    211040300: 'WorldMap021',
  },
  WorldMap021: {
    211060010: 'WorldMap022',
  },
  WorldMap0827: {
    450009100: 'WorldMap08271',
    450011120: 'WorldMap08272',
    450012000: 'WorldMap08273',
  },
};

const HIDDEN_WORLD_MAP_LINK_DOTS: Record<string, string[]> = {
  WorldMap020: ['WorldMap021'],
  WorldMap0827: ['WorldMap08271', 'WorldMap08272', 'WorldMap08273'],
};

const collectWorldMapNumbers = (worldMap?: MaplemapsWorldMapRemote) => {
  const mapNumbers = new Set<number>();
  worldMap?.maps?.forEach((dot) => {
    dot.mapNumbers?.forEach((mapId) => mapNumbers.add(mapId));
  });
  return mapNumbers;
};

const hitMaskByteCache = new Map<string, Uint8Array>();

const getHitMaskBytes = (mask: OverlayHitMask) => {
  let bytes = hitMaskByteCache.get(mask.bits);
  if (!bytes) {
    const binary = atob(mask.bits);
    bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    hitMaskByteCache.set(mask.bits, bytes);
  }
  return bytes;
};

const isOverlayMaskHit = (overlay: MaplemapsOverlay, base: MaplemapsWorldMapDef['base'], mapX: number, mapY: number) => {
  if (mapX < overlay.leftPx || mapX > overlay.leftPx + overlay.widthPx || mapY < overlay.topPx || mapY > overlay.topPx + overlay.heightPx) {
    return false;
  }

  const mask = WORLD_MAP_HIT_MASKS[overlay.id];
  if (!mask) return true;

  const localX = (mapX - overlay.leftPx) / overlay.widthPx;
  const localY = (mapY - overlay.topPx) / overlay.heightPx;
  const col = clamp(Math.floor(localX * mask.width), 0, mask.width - 1);
  const row = clamp(Math.floor(localY * mask.height), 0, mask.height - 1);
  const bitIndex = row * mask.width + col;
  const byte = getHitMaskBytes(mask)[Math.floor(bitIndex / 8)];
  return Boolean(byte & (1 << (7 - (bitIndex % 8))));
};

const getEventMapPoint = <T extends HTMLElement>(event: PointerEvent<T> | MouseEvent<T>, base: MaplemapsWorldMapDef['base']) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const xPct = (event.clientX - rect.left) / rect.width;
  const yPct = (event.clientY - rect.top) / rect.height;
  if (xPct < 0 || xPct > 1 || yPct < 0 || yPct > 1) return null;
  return {
    xPct,
    yPct,
    mapX: xPct * base.width,
    mapY: yPct * base.height,
  };
};

const findOverlayAtPoint = (overlays: MaplemapsOverlay[], base: MaplemapsWorldMapDef['base'], mapX: number, mapY: number) => {
  for (let index = overlays.length - 1; index >= 0; index -= 1) {
    const overlay = overlays[index];
    if (isOverlayMaskHit(overlay, base, mapX, mapY)) return overlay;
  }
  return null;
};

const ACKNOWLEDGEMENTS = [
  { label: 'WzComparerR2', detail: 'Map renders, skills data, icons', href: 'https://github.com/Kagamia/WzComparerR2' },
  { label: 'MapleNecrocer', detail: 'Map renders', href: 'https://github.com/Elem8100/MapleNecrocer' },
  { label: 'MapleStory.io', detail: 'Raw data, live map and mob assets', href: 'https://maplestory.io/' },
  { label: 'StrategyWiki', detail: 'Exp and meso formulas', href: 'https://strategywiki.org/wiki/MapleStory' },
];

const ROOT_WORLD_IMAGE = 'https://d3uzjcc4cyf4cj.cloudfront.net/world_maps/WorldMap.webp?v=2';
const ROOT_WORLD_HOTSPOTS: RootHotspot[] = [
  { region: 'maple', label: 'Maple World', x: 26, y: 53, width: 28, height: 32, note: 'Victoria, Orbis, Ludibrium, Zipangu' },
  { region: 'arcane', label: 'Arcane River', x: 72, y: 77, width: 20, height: 18, note: 'VJ, Chu Chu, Arcana, Limina' },
  { region: 'grandis', label: 'Grandis', x: 77, y: 38, width: 22, height: 24, note: 'Cernium, Odium, Shangri-La, Carcion' },
];

const expandedMapRules = [
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
  { street: 'Shaolin Temple', minLevel: 250, maxLevel: 275, limit: 24, monsters: ['Sweeping Monk', 'Bronze Man'], version: 'cms' },
  { street: 'Orbis', minLevel: 50, maxLevel: 90, limit: 34, monsters: ['Cloud Mob', 'Sky Sentinel'], version: 'all' },
  { street: 'El Nath', minLevel: 70, maxLevel: 120, limit: 34, monsters: ['Snowfield Mob', 'Ice Sentinel'], version: 'all' },
  { street: 'Ludibrium', minLevel: 90, maxLevel: 130, limit: 40, monsters: ['Toy Mob', 'Clocktower Mob'], version: 'all' },
  { street: 'Leafre', minLevel: 100, maxLevel: 160, limit: 36, monsters: ['Dragon Forest Mob', 'Minar Mob'], version: 'all' },
  { street: 'Temple of Time', minLevel: 140, maxLevel: 200, limit: 36, monsters: ['Memory Guardian', 'Oblivion Guardian'], version: 'all' },
  { street: 'Kritias', minLevel: 170, maxLevel: 210, limit: 36, monsters: ['Kritias Soldier', 'Fallen Mage'], version: 'all' },
  { street: 'Zipangu', minLevel: 160, maxLevel: 280, limit: 40, monsters: ['Samurai General', 'Ninja'], version: 'jms' },
];

const excludedMapName = /(cutscene|quest|hidden|entrance|exit|practice|tutorial|event|cash|shop|storage|station|somewhere|safe zone|preview|test|theater|saloon|town)$/i;

const buildExpandedMaps = (apiMaps: MapleStoryIoMap[]) =>
  apiMaps
    .filter((map) => map.id < 900000000 && map.streetName && map.name && !excludedMapName.test(map.name))
    .slice(0, 1500)
    .map((map) => ({
      name: `${map.streetName} — ${map.name}`,
      mapId: map.id,
      minLevel: 1,
      maxLevel: 1,
      monsters: [],
      burning: 0,
      version: MAP_API_REGION,
      imageSource: 'MapleStory.io map list; map render via Maplemaps',
      image: mapRender(map.id),
    } satisfies MapLocation));

const regionOptions: Array<{ key: MajorRegion; label: string; hint: string }> = [
  { key: 'maple', label: 'Maple World Region', hint: 'Pre-260 and overseas areas' },
  { key: 'arcane', label: 'Arcane River Region', hint: 'Lv. 200-259 training maps' },
  { key: 'grandis', label: 'Grandis Region', hint: 'Lv. 260+ Sacred Force maps' },
];

const worldMapLabels: Record<MajorRegion, MapLabel[]> = {
  maple: [
    { label: 'Maple Island', x: 22, y: 20 },
    { label: 'Victoria Island', x: 15, y: 40, tone: 'light' },
    { label: 'Orbis', x: 48, y: 30 },
    { label: 'El Nath Mts.', x: 59, y: 39 },
    { label: 'Ludus Lake', x: 43, y: 68 },
    { label: 'Ossyria', x: 65, y: 60, tone: 'light' },
    { label: 'Mu Lung Garden', x: 84, y: 63 },
    { label: 'Nihal Desert', x: 64, y: 80 },
    { label: 'Minar Forest', x: 31, y: 82 },
    { label: 'Temple of Time', x: 13, y: 88 },
    { label: 'Commerci', x: 9, y: 26 },
    { label: 'Zipangu', x: 8, y: 16 },
  ],
  arcane: [
    { label: 'Vanishing Journey', x: 18, y: 34 },
    { label: 'Chu Chu Island', x: 35, y: 52 },
    { label: 'Lachelein', x: 50, y: 34 },
    { label: 'Arcana', x: 63, y: 55 },
    { label: 'Morass', x: 75, y: 37 },
    { label: 'Esfera', x: 82, y: 60 },
    { label: 'Moonbridge', x: 38, y: 77 },
    { label: 'Labyrinth', x: 56, y: 76 },
    { label: 'Limina', x: 72, y: 78, tone: 'light' },
  ],
  grandis: [
    { label: 'Cernium', x: 18, y: 33 },
    { label: 'Burning Cernium', x: 29, y: 42 },
    { label: 'Hotel Arcus', x: 44, y: 58 },
    { label: 'Odium', x: 58, y: 41 },
    { label: 'Shangri-La', x: 70, y: 54 },
    { label: 'Arteria', x: 82, y: 34 },
    { label: 'Carcion', x: 82, y: 70 },
    { label: 'Tallahart', x: 50, y: 78 },
    { label: 'Solerian', x: 36, y: 28 },
  ],
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

const getZonePosition = (zone: string, region: MajorRegion, index: number): { x: number; y: number } => {
  const normalized = zone.toLowerCase();
  const known: Record<string, { x: number; y: number }> = {
    commerci: { x: 9, y: 24 },
    'sky city': { x: 46, y: 26 },
    'shaolin temple': { x: 90, y: 52 },
    zipangu: { x: 12, y: 17 },
    limina: { x: 72, y: 78 },
    cernium: { x: 18, y: 33 },
    'hotel arcus': { x: 44, y: 58 },
    odium: { x: 58, y: 41 },
    'shangri-la': { x: 70, y: 54 },
    arteria: { x: 82, y: 34 },
    solerian: { x: 36, y: 28 },
    carsion: { x: 82, y: 70 },
    carcion: { x: 82, y: 70 },
    '카르시온': { x: 82, y: 70 },
    'reverse city': { x: 22, y: 42 },
    'yum yum island': { x: 39, y: 57 },
    moonbridge: { x: 38, y: 77 },
    'labyrinth of suffering': { x: 56, y: 76 },
  };

  const match = Object.entries(known).find(([key]) => normalized.includes(key.toLowerCase()) || zone.includes(key));
  if (match) return match[1];

  const label = worldMapLabels[region][index % worldMapLabels[region].length];
  return { x: label.x, y: label.y };
};

const formatRate = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '-';
  if (value >= 1000) return `${(value / 1000).toFixed(1)}T`;
  return `${Math.round(value)}B`;
};

const formatCompactStat = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} K`;
  return value.toLocaleString();
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const getLevelExpMultiplier = (characterLevel: number, mobLevel: number) => clamp(1.2 - Math.abs(characterLevel - mobLevel) * 0.02, 0.7, 1.2);
const getLevelMesoMultiplier = (characterLevel: number, mobLevel: number) => clamp(1 - Math.abs(characterLevel - mobLevel) * 0.04, 0, 1);
const hasRotationHelper = (row: TableRow) => row.majorRegion === 'arcane' || row.majorRegion === 'grandis';

const fallbackMonsterVisuals = (monsters: string[]): MonsterVisual[] =>
  monsters.map((monster) => ({
    key: monster,
    name: monster,
    icon: '',
  }));

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

const maplemapsMetaToRow = (mapId: number, meta?: MaplemapsMapMeta): TableRow => {
  const avgLevel = Math.max(1, Math.round(meta?.avgLevel || 1));
  const streetName = meta?.streetName?.trim() || 'Maple World';
  const mapName = meta?.name?.trim() || `Map ${mapId}`;
  const mobNames = meta?.mobIds?.length ? meta.mobIds.slice(0, 8).map((mobId) => `Mob ${mobId}`) : [];

  return toRow({
    name: `${streetName} — ${mapName}`,
    mapId,
    minLevel: Math.max(1, avgLevel - 5),
    maxLevel: Math.min(300, Math.max(avgLevel + 5, avgLevel)),
    monsters: mobNames,
    burning: 0,
    version: 'all',
    image: mapRender(mapId),
    imageSource: `${MAP_IMAGE_SOURCE}; map metadata from Maplemaps`,
  });
};

export default function MapExplorer() {
  const { t } = useTranslation();
  const [selectedRegion, setSelectedRegion] = useState<MajorRegion>('maple');
  const [navigatorNode, setNavigatorNode] = useState<NavigatorNode>('root');
  const [worldMapStack, setWorldMapStack] = useState<WorldMapStackItem[]>([{ worldMap: 'WorldMap', parentWorld: '' }]);
  const [maplemapsWorldMapsData, setMaplemapsWorldMapsData] = useState<Record<string, MaplemapsWorldMapRemote>>({});
  const [maplemapsMapsData, setMaplemapsMapsData] = useState<Record<string, MaplemapsMapMeta>>({});
  const [loadedMaplemapsRegions, setLoadedMaplemapsRegions] = useState<Record<string, boolean>>({});
  const [selectedZone, setSelectedZone] = useState('all');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState(275);
  const [additionalExpPct, setAdditionalExpPct] = useState(0);
  const [mesoObtainedPct, setMesoObtainedPct] = useState(0);
  const [showFrenzy, setShowFrenzy] = useState(false);
  const [personalRates, setPersonalRates] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('level');
  const [selectedMapName, setSelectedMapName] = useState<string | null>(null);
  const [selectedMapIdOverride, setSelectedMapIdOverride] = useState<number | null>(null);
  const [expandedMaps, setExpandedMaps] = useState<MapLocation[]>([]);
  const [isLoadingExpandedMaps, setIsLoadingExpandedMaps] = useState(true);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [liveMonsterCache, setLiveMonsterCache] = useState<Record<number, MonsterVisual[]>>({});
  const [isLoadingMonsterData, setIsLoadingMonsterData] = useState(false);
  const [monsterDataError, setMonsterDataError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadExpandedMaps = async () => {
      setIsLoadingExpandedMaps(true);
      setMapLoadError(null);

      try {
        const apiMaps = await cachedJsonFetch<MapleStoryIoMap[]>(mapleStoryIoEndpoint('/map'), {
          cacheKey: `maplestoryio-proxy-v2-map-list:${MAP_API_REGION}:${MAP_API_VERSION}`,
          freshMs: realtimeCacheDurations.long,
          staleMs: realtimeCacheDurations.week,
        });
        if (!isActive) return;

        setExpandedMaps(buildExpandedMaps(apiMaps));
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

  const selectedMap = useMemo(() => {
    const explicitMap = filteredRows.find((row) => row.name === selectedMapName);
    if (explicitMap) return explicitMap;
    if (selectedMapIdOverride) {
      const existingMap = rows.find((row) => row.mapId === selectedMapIdOverride);
      if (existingMap) return existingMap;
      return maplemapsMetaToRow(selectedMapIdOverride, maplemapsMapsData[String(selectedMapIdOverride)]);
    }
    return navigatorNode === 'table' ? filteredRows[0] : null;
  }, [filteredRows, maplemapsMapsData, navigatorNode, rows, selectedMapIdOverride, selectedMapName]);

  const currentWorldMap = navigatorNode !== 'table' && navigatorNode !== 'root' ? worldMapStack[worldMapStack.length - 1]?.worldMap : null;
  const currentWorldMapMapIds = useMemo(
    () =>
      currentWorldMap
        ? Object.values(maplemapsMapsData)
            .filter((entry) => entry.worldMapName === currentWorldMap)
            .map((entry) => entry.map_id)
            .filter((mapId) => Number.isFinite(mapId) && mapId > 0)
        : [],
    [currentWorldMap, maplemapsMapsData],
  );

  useEffect(() => {
    if (navigatorNode === 'table') return;
    if (navigatorNode === 'root') return;
    if (!currentWorldMapMapIds.length) return;
    if (!selectedMapName) return;
    if (selectedMapIdOverride) return;

    const selectedId = selectedMap?.mapId;
    if (selectedId && currentWorldMapMapIds.includes(selectedId)) return;

    setSelectedMapName(null);
    setSelectedMapIdOverride(null);
  }, [currentWorldMapMapIds, navigatorNode, selectedMap, selectedMapIdOverride, selectedMapName]);

  useEffect(() => {
    let isActive = true;

    if (!selectedMap?.mapId) {
      setMonsterDataError(null);
      setIsLoadingMonsterData(false);
      return;
    }

    if (liveMonsterCache[selectedMap.mapId]?.length) {
      setMonsterDataError(null);
      setIsLoadingMonsterData(false);
      return;
    }

    const loadLiveMonsters = async () => {
      setIsLoadingMonsterData(true);
      setMonsterDataError(null);

      try {
        const mapJson = await cachedJsonFetch<{ mobs?: MapleStoryIoMobPlacement[] }>(
          mapleStoryIoEndpoint(`/map/${selectedMap.mapId}`),
          {
            cacheKey: `maplestoryio-proxy-v2-map:${MAP_API_REGION}:${MAP_API_VERSION}:${selectedMap.mapId}`,
            freshMs: realtimeCacheDurations.long,
            staleMs: realtimeCacheDurations.week,
          },
        );
        const uniqueMobIds = Array.from(
          new Set((mapJson.mobs || []).map((mob) => Number(mob.id)).filter((mobId) => Number.isFinite(mobId) && mobId > 0)),
        ).slice(0, 12);

        if (!uniqueMobIds.length) {
          if (!isActive) return;
          setLiveMonsterCache((current) => ({ ...current, [selectedMap.mapId]: [] }));
          return;
        }

        const mobEntries = await Promise.all(
          uniqueMobIds.map(async (mobId) => {
            const mob = await cachedJsonFetch<MapleStoryIoMob>(mapleStoryIoEndpoint(`/mob/${mobId}`), {
              cacheKey: `maplestoryio-proxy-v2-mob:${MAP_API_REGION}:${MAP_API_VERSION}:${mobId}`,
              freshMs: realtimeCacheDurations.long,
              staleMs: realtimeCacheDurations.week,
            });
            return {
              key: `${mobId}`,
              mobId,
              name: mob.name || `Mob ${mobId}`,
              icon: mobIcon(mobId),
              level: mob.meta?.level,
              exp: mob.meta?.exp,
              hp: mob.meta?.maxHP,
            } satisfies MonsterVisual;
          }),
        );

        if (!isActive) return;
        setLiveMonsterCache((current) => ({ ...current, [selectedMap.mapId]: mobEntries }));
      } catch (error) {
        if (!isActive) return;
        setMonsterDataError(error instanceof Error ? error.message : 'Could not load live monster data');
      } finally {
        if (isActive) setIsLoadingMonsterData(false);
      }
    };

    loadLiveMonsters();

    return () => {
      isActive = false;
    };
  }, [liveMonsterCache, selectedMap]);

  const selectedMapMonsters = useMemo<MonsterVisual[]>(
    () => (selectedMap ? liveMonsterCache[selectedMap.mapId] || fallbackMonsterVisuals(selectedMap.monsters) : []),
    [liveMonsterCache, selectedMap],
  );

  const selectRelativeMap = (direction: -1 | 1) => {
    if (filteredRows.length === 0) return;
    const currentIndex = filteredRows.findIndex((row) => row.name === selectedMapName);
    const baseIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (baseIndex + direction + filteredRows.length) % filteredRows.length;
    setSelectedMapIdOverride(null);
    setSelectedMapName(filteredRows[nextIndex].name);
  };

  const selectMapById = (mapId: number) => {
    const row = rows.find((candidate) => candidate.mapId === mapId);
    if (row) {
      setSelectedMapIdOverride(null);
      setSelectedMapName(row.name);
      return;
    }

    const meta = maplemapsMapsData[String(mapId)];
    const fallbackRow = maplemapsMetaToRow(mapId, meta);
    setSelectedMapIdOverride(mapId);
    setSelectedMapName(fallbackRow.name);
  };

  const mapPins = useMemo<MapPin[]>(
    () =>
      zones
        .filter((zone) => zone !== 'all')
        .map((zone, index) => {
          const position = getZonePosition(zone, selectedRegion, index);
          return {
            zone,
            x: position.x,
            y: position.y,
            count: regionRows.filter((row) => row.zone === zone).length,
          };
        }),
    [regionRows, selectedRegion, zones],
  );

  const currentRegion = regionOptions.find((region) => region.key === selectedRegion) || regionOptions[0];

  useEffect(() => {
    const regionKey = navigatorNode === 'maple' ? 'maple_world' : navigatorNode === 'arcane' ? 'arcane_river' : navigatorNode === 'grandis' ? 'grandis' : null;
    if (!regionKey) return;
    if (loadedMaplemapsRegions[regionKey]) return;

    let active = true;
    (async () => {
      try {
        const payload = await fetchMaplemapsRegionData(regionKey);
        if (!active) return;
        setMaplemapsWorldMapsData((current) => ({ ...current, ...payload.worldMapsData }));
        setMaplemapsMapsData((current) => ({ ...current, ...payload.mapsData }));
        setLoadedMaplemapsRegions((current) => ({ ...current, [regionKey]: true }));
      } catch (error) {
        console.warn('[MapExplorer] Failed to load maplemaps world-map data', error);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadedMaplemapsRegions, navigatorNode]);

  const enterRegion = (region: MajorRegion) => {
    setSelectedRegion(region);
    setSelectedZone('all');
    setSelectedMapName(null);
    setSelectedMapIdOverride(null);
    if (region === 'maple') setWorldMapStack([{ worldMap: 'WorldMap', parentWorld: '' }]);
    if (region === 'arcane') setWorldMapStack([{ worldMap: 'WorldMap082', parentWorld: '' }]);
    if (region === 'grandis') setWorldMapStack([{ worldMap: 'WGWorldMap', parentWorld: 'GWorldMap' }]);
    setNavigatorNode(region);
  };

  const backToRoot = () => {
    setSelectedMapName(null);
    setSelectedMapIdOverride(null);
    setNavigatorNode('root');
  };

  const isWorldMapDetail = navigatorNode !== 'table' && navigatorNode !== 'root' && Boolean(selectedMapName && selectedMap);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-background-200 bg-background-50">
        <div className="border-b border-background-200 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-background-100 dark:to-accent-950 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1 rounded-full bg-background-50 px-2.5 py-1 text-[11px] font-bold text-primary-700">
                <i className="ri-map-pin-line"></i>
                Quick actions
              </div>
              <h3 className="mt-2 font-heading text-lg font-semibold text-foreground-950">
                World Map and Table View
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground-700">
                {t('mh_map_instruction_world')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setNavigatorNode('table')}
                className={`h-11 px-5 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${
                  navigatorNode === 'table'
                    ? 'bg-red-600 text-background-50 hover:bg-red-700'
                    : 'border border-background-200 bg-background-50 text-foreground-800 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <i className="ri-table-2"></i>
                Table View
              </button>
              <button
                type="button"
                onClick={backToRoot}
                className={`h-11 px-4 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${
                  navigatorNode !== 'table'
                    ? 'bg-red-600 text-background-50 hover:bg-red-700'
                    : 'border border-background-200 bg-background-50 text-foreground-800 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <i className="ri-global-line"></i>
                World Map
              </button>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${isWorldMapDetail ? '' : 'xl:grid-cols-[minmax(0,1.3fr)_360px]'}`}>
          <div className={`min-w-0 border-b border-background-200 ${isWorldMapDetail ? '' : 'xl:border-b-0 xl:border-r'}`}>
            {navigatorNode === 'table' ? (
              <>
                <div className="border-b border-background-200 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground-500">Table View</div>
                      <div className="mt-1 text-sm font-semibold text-foreground-950">Map Table / {currentRegion.label}</div>
                      <p className="mt-1 text-xs text-foreground-500">
                        {t('mh_map_instruction_table')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => enterRegion(selectedRegion)}
                        className="h-9 px-3 rounded-md border border-background-200 bg-background-100 text-xs font-semibold text-foreground-700 hover:bg-primary-50 cursor-pointer inline-flex items-center gap-1"
                      >
                        <i className="ri-global-line"></i>
                        World Map
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {regionOptions.map((region) => (
                      <button
                        key={region.key}
                        type="button"
                        onClick={() => enterRegion(region.key)}
                        className={`h-8 px-3 rounded-md text-xs font-semibold cursor-pointer ${
                          selectedRegion === region.key
                            ? 'bg-primary-600 text-background-50'
                            : 'bg-background-50 border border-background-200 text-foreground-700 hover:bg-primary-50'
                        }`}
                      >
                        {region.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_140px_160px] gap-2">
                    <div className="relative">
                      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400"></i>
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Filter by name, zone, or mob level"
                        className="h-10 w-full rounded-md border border-background-300 bg-background-50 pl-9 pr-3 text-sm outline-none focus:border-primary-500"
                      />
                    </div>
                    <label className="flex items-center gap-2 rounded-md border border-background-300 bg-background-50 px-3">
                      <span className="text-xs font-semibold text-foreground-500">Level</span>
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
                      <option value="level">Sort: Level</option>
                      <option value="exp">Sort: Exp/hr</option>
                      <option value="meso">Sort: Meso/hr</option>
                      <option value="spawn">Sort: Spawn</option>
                      <option value="name">Sort: Map Name</option>
                    </select>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-foreground-700">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={showFrenzy} onChange={(event) => setShowFrenzy(event.target.checked)} className="accent-primary-600" />
                      Show frenzy rates
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={personalRates} onChange={(event) => setPersonalRates(event.target.checked)} className="accent-primary-600" />
                      Personal rates based on character level
                    </label>
                    <span className="ml-auto text-foreground-500">
                      {filteredRows.length === 1 ? t('mh_map_count_one', { count: filteredRows.length }) : t('mh_map_count_other', { count: filteredRows.length })}
                    </span>
                  </div>
                </div>

                <div className="p-3 md:p-4">
                  <MapTable
                    rows={filteredRows}
                    selectedName={selectedMapName || undefined}
                    selectedMonsters={selectedMapMonsters}
                    onSelect={(name) => {
                      setSelectedMapIdOverride(null);
                      setSelectedMapName((current) => (current === name ? null : name));
                    }}
                    onNavigate={(direction) => selectRelativeMap(direction)}
                    onCollapse={() => {
                      setSelectedMapName(null);
                      setSelectedMapIdOverride(null);
                    }}
                  />
                </div>
              </>
            ) : navigatorNode === 'root' ? (
              <WorldMapNavigatorRoot rows={rows} onEnterRegion={enterRegion} />
            ) : isWorldMapDetail && selectedMap ? (
              <div className="p-3 md:p-4">
                <MapPreview
                  row={selectedMap}
                  monsters={selectedMapMonsters}
                  isLoadingMonsterData={isLoadingMonsterData}
                  monsterDataError={monsterDataError}
                  showFrenzy={showFrenzy}
                  personalRates={personalRates}
                  onChangeShowFrenzy={setShowFrenzy}
                  onChangePersonalRates={setPersonalRates}
                  characterLevel={level}
                  additionalExpPct={additionalExpPct}
                  mesoObtainedPct={mesoObtainedPct}
                  onChangeCharacterLevel={setLevel}
                  onChangeAdditionalExpPct={setAdditionalExpPct}
                  onChangeMesoObtainedPct={setMesoObtainedPct}
                  onBackToWorldMap={() => {
                    setSelectedMapName(null);
                    setSelectedMapIdOverride(null);
                  }}
                  onPrevious={() => selectRelativeMap(-1)}
                  onNext={() => selectRelativeMap(1)}
                />
              </div>
            ) : (
              <div className="p-3 md:p-4">
                <MaplemapsWorldMapPanel
                  stack={worldMapStack}
                  worldMapsData={maplemapsWorldMapsData}
                  onNavigate={(next) => {
                    setSelectedMapName(null);
                    setSelectedMapIdOverride(null);
                    setWorldMapStack((current) => [...current, next]);
                  }}
                  onBack={() => {
                    setSelectedMapName(null);
                    setSelectedMapIdOverride(null);
                    setWorldMapStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
                  }}
                  onSelectMapId={(mapId) => selectMapById(mapId)}
                />
              </div>
            )}
          </div>

          {!isWorldMapDetail && (
            <aside className="bg-background-100 p-3 md:p-4 xl:sticky xl:top-24 xl:h-fit">
              {selectedMap ? (
                <MapPreview
                  row={selectedMap}
                  monsters={selectedMapMonsters}
                  isLoadingMonsterData={isLoadingMonsterData}
                  monsterDataError={monsterDataError}
                  showFrenzy={showFrenzy}
                  personalRates={personalRates}
                  onChangeShowFrenzy={setShowFrenzy}
                  onChangePersonalRates={setPersonalRates}
                  characterLevel={level}
                  additionalExpPct={additionalExpPct}
                  mesoObtainedPct={mesoObtainedPct}
                  onChangeCharacterLevel={setLevel}
                  onChangeAdditionalExpPct={setAdditionalExpPct}
                  onChangeMesoObtainedPct={setMesoObtainedPct}
                  onBackToWorldMap={backToRoot}
                  onPrevious={() => selectRelativeMap(-1)}
                  onNext={() => selectRelativeMap(1)}
                />
              ) : (
                <div className="rounded-md border border-dashed border-background-300 p-6 text-center text-sm text-foreground-500">
                  {t('mh_map_instruction_general')}
                </div>
              )}
            </aside>
          )}
        </div>

        <div className="border-t border-background-200 bg-background-100 px-4 py-3 text-xs leading-relaxed text-foreground-500 space-y-2">
          <p>
            Fan-made, non-commercial player tool. Map renders and live monster assets are provided through MapleStory.io using MapleStory game assets.
            MapleStory and related assets belong to Nexon.
          </p>
          <div>
            <span className="font-semibold text-foreground-700">Acknowledgements:</span>{' '}
            {ACKNOWLEDGEMENTS.map((item, index) => (
              <Fragment key={item.label}>
                {index > 0 ? <span className="text-foreground-400"> · </span> : null}
                <a
                  href={item.href}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="text-primary-700 underline underline-offset-2 hover:text-primary-800"
                >
                  {item.label}
                </a>
                <span>{` — ${item.detail}`}</span>
              </Fragment>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MapTable({
  rows,
  selectedName,
  selectedMonsters,
  onSelect,
  onNavigate,
  onCollapse,
}: {
  rows: TableRow[];
  selectedName?: string;
  selectedMonsters: MonsterVisual[];
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
            <th className="px-3 py-2 text-left">Image</th>
            <th className="px-3 py-2 text-left">Map Name</th>
            <th className="px-3 py-2 text-left">Region</th>
            <th className="px-3 py-2 text-left">Mob Lvl</th>
            <th className="px-3 py-2 text-left">Force</th>
            <th className="px-3 py-2 text-left">Spawn</th>
            <th className="px-3 py-2 text-left">Cap/gen</th>
            <th className="px-3 py-2 text-left">Exp/hr</th>
            <th className="px-3 py-2 text-left">Meso/hr</th>
            <th className="px-3 py-2 text-left">Hours/lvl</th>
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
                      title={isSelected ? 'Collapse map image' : 'View map image'}
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
                    monsters={selectedMonsters}
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
  monsters,
  colSpan,
  onPrevious,
  onNext,
  onCollapse,
}: {
  row: TableRow;
  monsters: MonsterVisual[];
  colSpan: number;
  onPrevious: () => void;
  onNext: () => void;
  onCollapse: () => void;
}) {
  const mobsPerHour = row.spawn * 360;
  const instancedMobsPerHour = Math.round(mobsPerHour * 1.03);
  const displayMonsters = monsters.length ? monsters : fallbackMonsterVisuals(row.monsters);
  const visibleMonsterCount = displayMonsters.length ? Math.min(monsterMarkerPositions.length, Math.max(12, row.spawn)) : 0;

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
              <div className="mt-8 inline-flex max-w-[130px] items-center gap-2 text-sm font-semibold text-foreground-950">
                <span className="truncate">{row.mapName}</span>
              </div>
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
              const monster = displayMonsters[index % displayMonsters.length];
              const position = monsterMarkerPositions[index % monsterMarkerPositions.length];

              return (
                <div
                  key={`${monster.key}-${index}`}
                  className="absolute z-10 h-9 w-9 -translate-x-1/2 -translate-y-full drop-shadow-[0_3px_3px_rgba(0,0,0,.55)]"
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  title={monster.name}
                >
                  {monster.icon ? (
                    <img src={monster.icon} alt={monster.name} className="h-full w-full object-contain" loading="lazy" />
                  ) : (
                    <div className="h-full w-full rounded-full bg-foreground-900 text-background-50 grid place-items-center text-xs font-bold">
                      {monster.name.slice(0, 1)}
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

function WorldMapPanel({
  region,
  pins,
  selectedZone,
  onSelectZone,
}: {
  region: MajorRegion;
  pins: MapPin[];
  selectedZone: string;
  onSelectZone: (zone: string) => void;
}) {
  const title = regionOptions.find((item) => item.key === region)?.label || 'World Map';
  const labels = worldMapLabels[region];
  const regionTone = {
    maple: {
      sea: 'from-[#8dc8dc] via-[#9bc8d6] to-[#b7c2df]',
      frame: '#4b3627',
      title: 'Maple World',
    },
    arcane: {
      sea: 'from-[#6763af] via-[#7fb8d8] to-[#9dd6c8]',
      frame: '#3e315c',
      title: 'Arcane River',
    },
    grandis: {
      sea: 'from-[#d7b578] via-[#a9c8b6] to-[#93b8d6]',
      frame: '#51422d',
      title: 'Grandis',
    },
  }[region];

  return (
    <div className="rounded-md border border-background-200 bg-background-100 p-3 md:p-4">
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-foreground-950">World Map</div>
          <p className="text-xs text-foreground-500">Click a marker on the left map to switch the zone and browse exact maps below.</p>
        </div>
        <button
          type="button"
          onClick={() => onSelectZone('all')}
          className={`h-8 px-3 rounded-md text-xs font-semibold cursor-pointer ${
            selectedZone === 'all' ? 'bg-primary-600 text-background-50' : 'bg-background-50 border border-background-200 text-foreground-700 hover:bg-primary-50'
          }`}
        >
          Show All Maps
        </button>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className={`relative aspect-[16/10] overflow-hidden rounded-md border border-background-300 bg-gradient-to-br ${regionTone.sea} shadow-inner`}>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 56" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <pattern id={`grid-${region}`} width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth=".18" />
              </pattern>
              <filter id={`soft-shadow-${region}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="rgba(44,30,17,.32)" />
              </filter>
              <radialGradient id={`green-land-${region}`} cx="45%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#cfe8a0" />
                <stop offset="55%" stopColor="#8fb678" />
                <stop offset="100%" stopColor="#547c57" />
              </radialGradient>
              <radialGradient id={`snow-land-${region}`} cx="50%" cy="40%" r="70%">
                <stop offset="0%" stopColor="#f5f2f0" />
                <stop offset="58%" stopColor="#d6d6df" />
                <stop offset="100%" stopColor="#9da6b6" />
              </radialGradient>
              <radialGradient id={`desert-land-${region}`} cx="50%" cy="45%" r="70%">
                <stop offset="0%" stopColor="#ead39b" />
                <stop offset="60%" stopColor="#c69a61" />
                <stop offset="100%" stopColor="#9b7145" />
              </radialGradient>
              <radialGradient id={`magic-land-${region}`} cx="50%" cy="45%" r="70%">
                <stop offset="0%" stopColor="#d6c4f0" />
                <stop offset="58%" stopColor="#9a8ed1" />
                <stop offset="100%" stopColor="#5c5b99" />
              </radialGradient>
            </defs>
            <rect width="100" height="56" fill="transparent" />
            <rect width="100" height="56" fill={`url(#grid-${region})`} />
            <path d="M3 5 H97 L95 52 H5 Z" fill="none" stroke={regionTone.frame} strokeWidth="1.25" />
            <path d="M4.3 6.2 H95.7 L93.9 50.7 H6.1 Z" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth=".3" />

            <g opacity=".55">
              <path d="M3 12 C10 6 16 9 20 5 C26 0 33 5 38 3" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M68 6 C76 1 86 7 94 4" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M75 50 C83 45 90 52 96 47" fill="none" stroke="rgba(255,255,255,.38)" strokeWidth="1.2" strokeLinecap="round" />
            </g>

            {region === 'maple' && (
              <>
                <path d="M8 21 C12 14 18 13 23 18 C29 24 30 34 25 40 C18 47 8 42 5 34 C2 28 4 24 8 21Z" fill={`url(#green-land-${region})`} stroke="#526f53" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M30 38 C36 30 47 26 57 30 C65 35 65 44 56 49 C46 55 32 52 28 45 C26 42 27 40 30 38Z" fill={`url(#green-land-${region})`} stroke="#526f53" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M57 16 C66 9 81 9 91 19 C85 27 67 28 56 23 C52 21 53 18 57 16Z" fill="#b8ce8b" stroke="#7e8756" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M56 31 C67 25 84 27 92 36 C84 46 66 48 55 40 C51 36 52 33 56 31Z" fill={`url(#desert-land-${region})`} stroke="#91754e" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M36 13 C43 8 52 11 55 18 C50 24 39 24 34 18 C32 16 33 14 36 13Z" fill={`url(#snow-land-${region})`} stroke="#a5a3a5" strokeWidth=".7" filter={`url(#soft-shadow-${region})`} />
                <path d="M35 41 C42 36 50 37 55 43 C50 49 40 48 34 44Z" fill="#d5e77f" stroke="#849b48" strokeWidth=".7" filter={`url(#soft-shadow-${region})`} />
                <path d="M9 24 l2 -2 l1.5 4 l1.5 -5 l2 6 l1.5 -4 l2.5 5" fill="none" stroke="#355e35" strokeWidth=".75" />
                <path d="M31 45 C38 41 48 41 55 45" fill="none" stroke="#4f8a43" strokeWidth=".9" />
                <path d="M61 20 l2 -4 l2 5 l2 -4 l2 5" fill="none" stroke="#6e7948" strokeWidth=".8" />
                <path d="M63 36 C68 34 76 34 82 37" fill="none" stroke="#b67b42" strokeWidth=".9" />
              </>
            )}
            {region === 'arcane' && (
              <>
                <path d="M8 29 C15 16 31 16 38 28 C31 40 17 42 8 35Z" fill="#9ed18b" stroke="#4f7d45" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M33 17 C46 7 63 15 65 29 C54 36 39 33 33 24Z" fill={`url(#magic-land-${region})`} stroke="#6750a0" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M58 31 C69 22 88 27 93 39 C83 50 67 49 58 40Z" fill="#8ad1d3" stroke="#477d84" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M32 40 C46 34 61 36 74 44 C65 53 44 54 32 47Z" fill="#6570b8" stroke="#383e78" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M41 21 C45 18 52 18 58 21" fill="none" stroke="rgba(255,255,255,.58)" strokeWidth=".8" />
                <path d="M62 38 C69 35 80 37 88 40" fill="none" stroke="#4f9ca5" strokeWidth=".8" />
              </>
            )}
            {region === 'grandis' && (
              <>
                <path d="M8 16 C24 7 41 12 46 27 C34 36 17 33 7 25Z" fill={`url(#desert-land-${region})`} stroke="#8b7442" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M38 31 C48 18 66 19 73 31 C65 45 48 46 38 38Z" fill="#a8bbdc" stroke="#556b8e" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M66 15 C78 8 93 15 95 29 C85 36 72 34 64 25Z" fill="#97c981" stroke="#4f7d45" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M61 38 C74 33 91 39 94 49 C82 55 68 53 60 46Z" fill="#e0d0a1" stroke="#8b7442" strokeWidth=".75" filter={`url(#soft-shadow-${region})`} />
                <path d="M22 34 C32 29 43 34 44 44 C35 50 23 47 20 41Z" fill="#e6d46f" stroke="#9b8736" strokeWidth=".7" filter={`url(#soft-shadow-${region})`} />
                <path d="M15 22 C23 18 33 20 41 26" fill="none" stroke="#a6783d" strokeWidth=".9" />
                <path d="M67 24 C75 21 84 24 91 28" fill="none" stroke="#5a8b51" strokeWidth=".85" />
                <path d="M66 45 C74 41 84 44 91 48" fill="none" stroke="#b28d57" strokeWidth=".85" />
              </>
            )}
          </svg>

          <div className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-md border border-[#8b5f30] bg-[#e7c57a] px-5 py-2 text-center shadow-md">
            <div className="font-heading text-lg font-semibold text-[#5a3518]">{regionTone.title || title.replace(' Region', '')}</div>
          </div>

          {labels.map((label) => (
            <div
              key={label.label}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-sm border px-2 py-0.5 text-[10px] font-bold shadow-sm ${
                label.tone === 'light'
                  ? 'border-background-50/40 bg-foreground-800/80 text-background-50'
                  : 'border-[#8b5f30]/70 bg-[#f8dfaa]/95 text-[#5a3518]'
              }`}
              style={{ left: `${label.x}%`, top: `${label.y}%` }}
            >
              {label.label}
            </div>
          ))}

          {pins.map((pin) => (
            <button
              key={pin.zone}
              type="button"
              onClick={() => onSelectZone(pin.zone)}
              className={`absolute z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background-50 shadow-md cursor-pointer ${
                selectedZone === pin.zone ? 'bg-secondary-500 ring-4 ring-secondary-300/50' : 'bg-primary-500 hover:bg-primary-600'
              }`}
              style={{ left: `${Math.min(96, pin.x + 2)}%`, top: `${Math.max(7, pin.y - 1.8)}%` }}
              title={`${pin.zone} (${pin.count})`}
              aria-label={`${pin.zone} map marker`}
            >
              <span className="sr-only">{pin.zone}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorldMapNavigatorRoot({
  rows,
  onEnterRegion,
}: {
  rows: TableRow[];
  onEnterRegion: (region: MajorRegion) => void;
}) {
  const counts = regionOptions.reduce<Record<MajorRegion, number>>(
    (acc, region) => {
      acc[region.key] = rows.filter((row) => row.majorRegion === region.key).length;
      return acc;
    },
    { maple: 0, arcane: 0, grandis: 0 },
  );

  return (
    <div className="p-4">
      <section className="rounded-md border border-background-200 bg-background-100 p-4">
        <h1 className="text-lg font-semibold text-foreground-950">Select a Region:</h1>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onEnterRegion('maple')}
            className="group rounded-md border border-background-200 bg-background-50 overflow-hidden hover:border-primary-300 cursor-pointer"
            aria-label="Link to Maple World Region"
          >
            <img src={MAPLEMAPS_HOME_REGION_IMAGES.maple} alt="Maple World Region" className="w-full h-40 object-cover" loading="lazy" />
            <div className="p-2 text-xs font-semibold text-foreground-800 flex items-center justify-between">
              <span>Maple World</span>
              <span className="text-foreground-500">{counts.maple}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onEnterRegion('grandis')}
            className="group rounded-md border border-background-200 bg-background-50 overflow-hidden hover:border-primary-300 cursor-pointer"
            aria-label="Link to Grandis Region"
          >
            <img src={MAPLEMAPS_HOME_REGION_IMAGES.grandis} alt="Grandis Region" className="w-full h-40 object-cover" loading="lazy" />
            <div className="p-2 text-xs font-semibold text-foreground-800 flex items-center justify-between">
              <span>Grandis</span>
              <span className="text-foreground-500">{counts.grandis}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onEnterRegion('arcane')}
            className="group rounded-md border border-background-200 bg-background-50 overflow-hidden hover:border-primary-300 cursor-pointer"
            aria-label="Link to Arcane River Region"
          >
            <img src={MAPLEMAPS_HOME_REGION_IMAGES.arcane} alt="Arcane River Region" className="w-full h-40 object-cover" loading="lazy" />
            <div className="p-2 text-xs font-semibold text-foreground-800 flex items-center justify-between">
              <span>Arcane River</span>
              <span className="text-foreground-500">{counts.arcane}</span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}

function MaplemapsWorldMapPanel({
  stack,
  worldMapsData,
  onNavigate,
  onBack,
  onSelectMapId,
}: {
  stack: WorldMapStackItem[];
  worldMapsData: Record<string, MaplemapsWorldMapRemote>;
  onNavigate: (next: WorldMapStackItem) => void;
  onBack: () => void;
  onSelectMapId: (mapId: number) => void;
}) {
  const current = stack[stack.length - 1];
  const remote = worldMapsData[current.worldMap];
  const def = MAPLEMAPS_WORLDMAPS[current.worldMap];
  const base = def?.base || {
    src: `https://d3uzjcc4cyf4cj.cloudfront.net/world_maps/${current.worldMap}.webp?v=2`,
    width: 640,
    height: 470,
  };
  const overlays = def?.overlays || [];
  const linkDots = useMemo(() => remote?.links || [], [remote?.links]);
  const mapDots = useMemo(() => remote?.maps || [], [remote?.maps]);
  const dotWorldMapLinks = useMemo(() => {
    const result = new Map<number, string>();
    if (overlays.length > 0) return result;

    const explicitLinks = MAP_DOT_WORLD_LINKS[current.worldMap] || {};
    const childMapNumbers = new Map<string, Set<number>>();
    linkDots.forEach((link) => {
      childMapNumbers.set(link.linksTo, collectWorldMapNumbers(worldMapsData[link.linksTo]));
    });

    mapDots.forEach((dot, index) => {
      const mapId = dot.mapNumbers?.[0];
      if (mapId && explicitLinks[mapId]) {
        result.set(index, explicitLinks[mapId]);
        return;
      }

      if (!dot.mapNumbers?.length) return;
      const matchingLinks = linkDots.filter((link) => {
        const childNumbers = childMapNumbers.get(link.linksTo);
        return dot.mapNumbers.some((candidateMapId) => childNumbers?.has(candidateMapId));
      });
      if (!matchingLinks.length) return;

      const firstMapMatch = matchingLinks.find((link) => worldMapsData[link.linksTo]?.maps?.some((childDot) => childDot.mapNumbers?.[0] === mapId));
      result.set(index, (firstMapMatch || matchingLinks[0]).linksTo);
    });

    return result;
  }, [current.worldMap, linkDots, mapDots, overlays.length, worldMapsData]);
  const hiddenLinkDots = useMemo(() => {
    const hidden = new Set(HIDDEN_WORLD_MAP_LINK_DOTS[current.worldMap] || []);
    dotWorldMapLinks.forEach((worldMapId) => hidden.add(worldMapId));
    return hidden;
  }, [current.worldMap, dotWorldMapLinks]);
  const [hoveredOverlayId, setHoveredOverlayId] = useState<string | null>(null);
  const [hoveredOverlayPoint, setHoveredOverlayPoint] = useState<{ x: number; y: number } | null>(null);
  const hoveredOverlay = hoveredOverlayId ? overlays.find((overlay) => overlay.id === hoveredOverlayId) : null;

  const handleOverlayPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!overlays.length) return;
    const point = getEventMapPoint(event, base);
    if (!point) {
      setHoveredOverlayId(null);
      setHoveredOverlayPoint(null);
      return;
    }

    const overlay = findOverlayAtPoint(overlays, base, point.mapX, point.mapY);
    setHoveredOverlayId(overlay?.id || null);
    setHoveredOverlayPoint(overlay ? { x: point.xPct * 100, y: point.yPct * 100 } : null);
  };

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!overlays.length) return;
    const point = getEventMapPoint(event, base);
    if (!point) return;
    const overlay = findOverlayAtPoint(overlays, base, point.mapX, point.mapY);
    if (overlay) onNavigate({ worldMap: overlay.id, parentWorld: current.worldMap });
  };

  return (
    <div className="rounded-md border border-background-200 bg-background-100 p-3 md:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-foreground-950">World Map</div>
          <p className="text-xs text-foreground-500">{current.parentWorld ? `${current.parentWorld} / ` : ''}{current.worldMap}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          disabled={stack.length <= 1}
          className="h-8 px-3 rounded-md border border-background-200 bg-background-50 text-xs font-semibold text-foreground-700 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1"
        >
          <i className="ri-arrow-left-line"></i>
          Back
        </button>
      </div>

      <div
        className={`relative overflow-hidden rounded-md border border-background-300 bg-[#d9eefb] shadow-inner ${hoveredOverlay ? 'cursor-pointer' : ''}`}
        style={{ aspectRatio: `${base.width} / ${base.height}` }}
        onPointerMove={handleOverlayPointerMove}
        onPointerLeave={() => {
          setHoveredOverlayId(null);
          setHoveredOverlayPoint(null);
        }}
        onClick={handleOverlayClick}
      >
        <img src={base.src} alt={`World map image: ${current.worldMap}`} className="absolute inset-0 h-full w-full object-contain" loading="lazy" />

        {overlays.map((overlay) => {
          return (
            <img
              key={`${overlay.id}-preview`}
              src={overlay.img}
              alt=""
              className={`pointer-events-none absolute z-10 object-contain transition-opacity duration-150 ${
                hoveredOverlayId === overlay.id ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                left: toPercent(overlay.leftPx, base.width),
                top: toPercent(overlay.topPx, base.height),
                width: toPercent(overlay.widthPx, base.width),
                height: toPercent(overlay.heightPx, base.height),
              }}
              loading="lazy"
            />
          );
        })}

        {hoveredOverlay && hoveredOverlayPoint && (
          <div
            className="pointer-events-none absolute z-30 max-w-[9rem] -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded bg-foreground-950/85 px-2 py-1 text-[10px] font-semibold leading-tight text-background-50 shadow-sm"
            style={{ left: `${hoveredOverlayPoint.x}%`, top: `${hoveredOverlayPoint.y}%` }}
          >
            {getWorldMapLabel(hoveredOverlay.id)}
          </div>
        )}

        {overlays.length > 0 && (
          <div className="sr-only">
            {overlays.map((overlay) => (
              <button key={overlay.id} type="button" onClick={() => onNavigate({ worldMap: overlay.id, parentWorld: current.worldMap })}>
                Enter {getWorldMapLabel(overlay.id)}
              </button>
            ))}
          </div>
        )}

        {overlays.length === 0 && linkDots.map((link) => {
          if (hiddenLinkDots.has(link.linksTo)) return null;

          const left = ((base.width / 2 + link.x) / base.width) * 100;
          const top = ((base.height / 2 + link.y) / base.height) * 100;
          const label = getWorldMapLabel(link.linksTo);

          return (
            <div key={`${current.worldMap}-link-${link.linksTo}`} className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
              <img
                src="https://d3uzjcc4cyf4cj.cloudfront.net/dots/3.png"
                alt=""
                title={label}
                className="pointer-events-none h-5 w-5 drop-shadow-[0_2px_2px_rgba(0,0,0,.35)]"
                loading="lazy"
              />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onNavigate({ worldMap: link.linksTo, parentWorld: current.worldMap });
                }}
                className="pointer-events-auto group absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-md border border-transparent bg-transparent transition-colors hover:border-primary-300/80 hover:bg-primary-100/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
                aria-label={`Enter ${label}`}
                title={label}
              >
                <span className="pointer-events-none absolute left-1/2 bottom-full z-30 mb-1 max-w-[9rem] -translate-x-1/2 rounded bg-foreground-950/85 px-2 py-1 text-[10px] font-semibold leading-tight text-background-50 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {label}
                </span>
              </button>
            </div>
          );
        })}

        {mapDots.map((dot, index) => {
          const left = ((base.width / 2 + dot.x) / base.width) * 100;
          const top = ((base.height / 2 + dot.y) / base.height) * 100;
          const mapId = dot.mapNumbers?.[0];
          const linkedWorldMap = dotWorldMapLinks.get(index);
          const label = dot.description || (linkedWorldMap ? getWorldMapLabel(linkedWorldMap) : String(mapId));
          const canOpenDot = Boolean(mapId && (linkedWorldMap || overlays.length === 0));
          const dotImg = `https://d3uzjcc4cyf4cj.cloudfront.net/dots/${dot.type}.png`;

          if (!mapId) return null;

          return (
            <div key={`${current.worldMap}-dot-${index}`} className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
              <img
                src={dotImg}
                alt=""
                className="pointer-events-none h-5 w-5 drop-shadow-[0_2px_2px_rgba(0,0,0,.35)]"
                loading="lazy"
              />
              {canOpenDot && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (linkedWorldMap) {
                      onNavigate({ worldMap: linkedWorldMap, parentWorld: current.worldMap });
                      return;
                    }
                    onSelectMapId(mapId);
                  }}
                  className="pointer-events-auto group absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-transparent bg-transparent transition-colors hover:border-primary-300/80 hover:bg-primary-100/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
                  aria-label={linkedWorldMap ? `Enter ${label}` : `Open map ${mapId}`}
                  title={label}
                >
                  {linkedWorldMap && (
                    <span className="pointer-events-none absolute left-1/2 bottom-full z-30 mb-1 max-w-[9rem] -translate-x-1/2 rounded bg-foreground-950/85 px-2 py-1 text-[10px] font-semibold leading-tight text-background-50 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      {label}
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapBrowserList({
  rows,
  selectedName,
  onSelect,
}: {
  rows: TableRow[];
  selectedName?: string;
  onSelect: (name: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-background-300 bg-background-100 p-10 text-center text-sm text-foreground-500">
        No maps match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-foreground-950">Map Browser</div>
          <p className="text-xs text-foreground-500">Select a map card to update the detail panel on the right.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((row) => {
          const isSelected = selectedName === row.name;
          return (
            <button
              key={row.name}
              type="button"
              onClick={() => onSelect(row.name)}
              className={`overflow-hidden rounded-md border text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-[0_0_0_1px_rgba(59,130,246,.14)]'
                  : 'border-background-200 bg-background-50 hover:border-primary-300'
              }`}
            >
              <div className="relative h-36 bg-foreground-950">
                <img src={row.image} alt={row.name} className="h-full w-full object-cover object-center opacity-90" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                <div className="absolute left-3 top-3 rounded-full bg-background-50/95 px-2 py-1 text-[10px] font-bold text-foreground-800">
                  {row.forceLabel}
                </div>
                <div className="absolute left-3 right-3 bottom-3">
                  <div className="font-semibold text-background-50">{row.mapName}</div>
                  <div className="text-xs text-background-100/90">{row.zone}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 p-3 text-[11px] text-foreground-600">
                <div>
                  <div className="uppercase text-foreground-400">Mob</div>
                  <div className="mt-1 font-semibold text-foreground-900">{row.avgLevel}</div>
                </div>
                <div>
                  <div className="uppercase text-foreground-400">Spawn</div>
                  <div className="mt-1 font-semibold text-foreground-900">{row.spawn}</div>
                </div>
                <div>
                  <div className="uppercase text-foreground-400">Exp/hr</div>
                  <div className="mt-1 font-semibold text-primary-700">{formatRate(row.expHour)}</div>
                </div>
                <div>
                  <div className="uppercase text-foreground-400">Meso/hr</div>
                  <div className="mt-1 font-semibold text-foreground-900">{formatRate(row.mesoHour)}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MapPreview({
  row,
  monsters,
  isLoadingMonsterData,
  monsterDataError,
  showFrenzy,
  personalRates,
  onChangeShowFrenzy,
  onChangePersonalRates,
  characterLevel,
  additionalExpPct,
  mesoObtainedPct,
  onChangeCharacterLevel,
  onChangeAdditionalExpPct,
  onChangeMesoObtainedPct,
  onBackToWorldMap,
  onPrevious,
  onNext,
}: {
  row: TableRow;
  monsters: MonsterVisual[];
  isLoadingMonsterData: boolean;
  monsterDataError: string | null;
  showFrenzy: boolean;
  personalRates: boolean;
  onChangeShowFrenzy: (value: boolean) => void;
  onChangePersonalRates: (value: boolean) => void;
  characterLevel: number;
  additionalExpPct: number;
  mesoObtainedPct: number;
  onChangeCharacterLevel: (value: number) => void;
  onChangeAdditionalExpPct: (value: number) => void;
  onChangeMesoObtainedPct: (value: number) => void;
  onBackToWorldMap: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const mobLevels = monsters.map((monster) => monster.level).filter((value): value is number => typeof value === 'number');
  const mobExps = monsters.map((monster) => monster.exp).filter((value): value is number => typeof value === 'number');
  const mobHps = monsters.map((monster) => monster.hp).filter((value): value is number => typeof value === 'number');
  const shouldShowMonstersSection = monsters.length > 0 || row.monsters.length > 0;
  const averageMobLevel = mobLevels.length ? Math.round(mobLevels.reduce((sum, value) => sum + value, 0) / mobLevels.length) : row.avgLevel;
  const averageMobExp = mobExps.length ? Math.round(mobExps.reduce((sum, value) => sum + value, 0) / mobExps.length) : Math.round(row.expHour / Math.max(row.spawn * 480, 1));
  const averageMobHp = mobHps.length ? Math.round(mobHps.reduce((sum, value) => sum + value, 0) / mobHps.length) : 0;

  const baseCapacity = row.capPerGen;
  const spawnPoints = row.spawn;
  const baseMobsPerHour = 480 * baseCapacity;
  const instancedMobsPerHour = 480 * Math.min(baseCapacity + 1, spawnPoints);
  const frenzyMobsPerHour = 1666 * Math.min(Math.round(baseCapacity * 1.7), spawnPoints, 49);
  const baseExpPerHour = averageMobExp * baseMobsPerHour;
  const activeMobsPerHour = showFrenzy ? frenzyMobsPerHour : baseMobsPerHour;
  const activeExpPerHour = averageMobExp * activeMobsPerHour;
  const activeMesoPerHour = Math.round(7.5 * activeMobsPerHour * averageMobLevel);
  const levelExpMulti = getLevelExpMultiplier(characterLevel, averageMobLevel);
  const levelMesoMulti = getLevelMesoMultiplier(characterLevel, averageMobLevel);
  const extraExpMulti = 1 + additionalExpPct / 100;
  const extraMesoMulti = 1 + mesoObtainedPct / 100;
  const personalMobsPerHour = personalRates ? activeMobsPerHour : baseMobsPerHour;
  const personalExpPerHour = Math.round(personalMobsPerHour * averageMobExp * levelExpMulti * extraExpMulti);
  const personalMesoPerHour = Math.round(7.5 * personalMobsPerHour * averageMobLevel * levelMesoMulti * extraMesoMulti);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-background-200 bg-background-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToWorldMap}
            className="h-8 px-3 rounded-md border border-background-200 bg-background-100 text-xs font-semibold text-foreground-700 hover:bg-primary-50 cursor-pointer inline-flex items-center gap-1"
          >
            <i className="ri-arrow-left-line"></i>
            Back to World Map
          </button>
          {hasRotationHelper(row) && (
            <button
              type="button"
              onClick={() => {
                // TODO: 站内 Rotation Helper（对齐 maplemaps 功能）
                onChangePersonalRates(true);
              }}
              className="h-8 px-3 rounded-md border border-background-200 bg-background-100 text-xs font-semibold text-foreground-700 hover:bg-primary-50 cursor-pointer inline-flex items-center gap-1"
              aria-label="Rotation Helper (coming soon)"
            >
              Rotation Helper
              <i className="ri-tools-line"></i>
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevious}
              className="h-8 w-8 rounded-md border border-background-200 bg-background-100 text-foreground-700 hover:bg-primary-50 cursor-pointer"
              aria-label="Previous map"
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            <button
              type="button"
              onClick={onNext}
              className="h-8 w-8 rounded-md border border-background-200 bg-background-100 text-foreground-700 hover:bg-primary-50 cursor-pointer"
              aria-label="Next map"
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-foreground-500">{row.zone}</div>
        <h3 className="mt-1 font-heading text-lg font-semibold text-foreground-950">{row.mapName}</h3>
      </div>

      <img src={row.image} alt={row.name} className="w-full rounded-md border border-background-200 object-cover object-center" loading="lazy" />

      {'imageSource' in row && (
        <div className="rounded-md border border-background-200 bg-background-50 px-2 py-1 text-[10px] font-semibold text-foreground-500">
          {row.imageSource}
        </div>
      )}

      {shouldShowMonstersSection && (
        <section className="rounded-md border border-background-200 bg-background-50 p-3">
          <div className="text-sm font-semibold text-foreground-950">Monsters</div>
          {isLoadingMonsterData && (
            <div className="mt-2 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-700">
              Loading live monster sprites...
            </div>
          )}
          {monsterDataError && (
            <div className="mt-2 rounded-md border border-secondary-200 bg-secondary-50 px-2 py-1 text-[10px] font-semibold text-secondary-800">
              Live monster data unavailable, showing local fallback names.
            </div>
          )}
          <div className="mt-3 space-y-2">
            {monsters.map((monster) => (
                <div key={monster.key} className="rounded-md border border-background-200 bg-background-100 p-3">
                  <div className="flex items-center gap-3">
                    {monster.icon ? (
                      <img src={monster.icon} alt={monster.name} className="h-10 w-10 object-contain shrink-0" loading="lazy" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground-900">{monster.name}</div>
                      <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-foreground-600">
                        <span>Level: {monster.level?.toLocaleString() || row.avgLevel}</span>
                        <span>Exp: {monster.exp ? formatCompactStat(monster.exp) : '—'}</span>
                        <span>HP: {monster.hp ? formatCompactStat(monster.hp) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="rounded-md border border-background-200 bg-background-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-foreground-950">Base Rates</div>
          <label className="inline-flex items-center gap-1.5 text-xs text-foreground-600 cursor-pointer">
            <input type="checkbox" checked={showFrenzy} onChange={(event) => onChangeShowFrenzy(event.target.checked)} className="accent-primary-600" />
            Show frenzy rates
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Exp/hr" value={formatRate(activeExpPerHour / 1_000_000)} />
          <Stat label="Meso/hr" value={formatCompactStat(activeMesoPerHour)} />
          <Stat label="Mobs/hr" value={activeMobsPerHour.toLocaleString()} />
          <Stat label="Capacity/gen" value={baseCapacity.toLocaleString()} />
          <Stat label="Instanced" value={instancedMobsPerHour.toLocaleString()} />
          <Stat label="Spawn Points" value={spawnPoints.toLocaleString()} />
          <Stat label={row.majorRegion === 'grandis' ? 'Sacred Force' : row.majorRegion === 'arcane' ? 'Arcane Force' : 'Force'} value={row.forceLabel} />
          <Stat label="Base Exp/hr" value={formatRate(baseExpPerHour / 1_000_000)} />
        </div>
      </section>

      <section className="rounded-md border border-background-200 bg-background-50 p-3">
        <div className="text-sm font-semibold text-foreground-950">Personal Rates</div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="rounded-md border border-background-200 bg-background-100 px-3 py-2">
            <span className="text-[10px] uppercase text-foreground-500">Character Level</span>
            <input
              type="number"
              value={characterLevel}
              min={1}
              max={300}
              onChange={(event) => onChangeCharacterLevel(Number(event.target.value) || 1)}
              className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
            />
          </label>
          <label className="rounded-md border border-background-200 bg-background-100 px-3 py-2">
            <span className="text-[10px] uppercase text-foreground-500">Additional Exp %</span>
            <input
              type="number"
              value={additionalExpPct}
              min={0}
              max={500}
              onChange={(event) => onChangeAdditionalExpPct(Number(event.target.value) || 0)}
              className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
            />
          </label>
          <label className="rounded-md border border-background-200 bg-background-100 px-3 py-2">
            <span className="text-[10px] uppercase text-foreground-500">Meso Obtained %</span>
            <input
              type="number"
              value={mesoObtainedPct}
              min={0}
              max={500}
              onChange={(event) => onChangeMesoObtainedPct(Number(event.target.value) || 0)}
              className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
            />
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Custom Mobs/hr" value={personalMobsPerHour.toLocaleString()} />
          <Stat label="Exp/hr" value={formatRate(personalExpPerHour / 1_000_000)} />
          <Stat label="Meso/hr" value={formatCompactStat(personalMesoPerHour)} />
          <Stat label="Level Exp Multi" value={levelExpMulti.toFixed(2)} />
          <Stat label="Level Meso Multi" value={levelMesoMulti.toFixed(2)} />
          <Stat label="Additional Exp" value={`${additionalExpPct}%`} />
          <Stat label="Meso Obtained" value={`${mesoObtainedPct}%`} />
          <Stat label="Average Mob Level" value={averageMobLevel.toLocaleString()} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-background-200 bg-background-100 p-2">
      <div className="text-[10px] uppercase text-foreground-500">{label}</div>
      <div className="mt-1 font-semibold text-foreground-950">{value}</div>
    </div>
  );
}
