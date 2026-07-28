import { useMemo, useState } from 'react';
import type { SeriesProduct } from './catalog';

type ClassicMapRegion = {
  name: string;
  nameZh: string;
  count: number;
  focus: string;
  minLevel: number;
  maxLevel: number;
  tone: string;
  x: number;
  y: number;
};

type ClassicMonsterPreview = {
  name: string;
  nameZh: string;
  level: number;
  maps: number;
  hp: string;
  exp: string;
  attribute: string;
  note: string;
};

type ClassicMapRecord = {
  id: string;
  name: string;
  nameZh: string;
  region: string;
  level: string;
  type: 'town' | 'hunting' | 'dungeon' | 'party' | 'hidden';
  monsters: string[];
  note: string;
};

type SeriesMapDefinition = {
  title: string;
  description: string;
  routes: Array<{
    label: string;
    detail: string;
  }>;
};

const classicRegions: ClassicMapRegion[] = [
  { name: 'Maple Island', nameZh: '枫叶岛', count: 25, focus: 'beginner island progression and first monster encounters', minLevel: 1, maxLevel: 10, tone: 'bg-emerald-500', x: 18, y: 24 },
  { name: 'Lith Harbor', nameZh: '里斯港口', count: 18, focus: 'starter travel hub, port routes, and early Victoria access', minLevel: 1, maxLevel: 15, tone: 'bg-sky-500', x: 24, y: 65 },
  { name: 'Henesys', nameZh: '弓箭手村', count: 35, focus: 'low-level hunting routes, town services, and nearby mushroom/pig fields', minLevel: 5, maxLevel: 30, tone: 'bg-lime-500', x: 42, y: 57 },
  { name: 'Ellinia', nameZh: '魔法密林', count: 39, focus: 'tree dungeons, mage routes, and forest monster progression', minLevel: 8, maxLevel: 35, tone: 'bg-green-600', x: 62, y: 31 },
  { name: 'Perion', nameZh: '勇士之村', count: 36, focus: 'stump, boar, and rocky-road warrior training routes', minLevel: 10, maxLevel: 32, tone: 'bg-orange-600', x: 54, y: 73 },
  { name: 'Kerning City', nameZh: '神偷之城', count: 45, focus: 'subway maps, thief routes, and early Party Quest planning', minLevel: 12, maxLevel: 35, tone: 'bg-purple-600', x: 32, y: 78 },
  { name: 'Sleepywood', nameZh: '林中之城', count: 47, focus: 'Ant Tunnel, dungeon paths, and mid-level Victoria Island grind spots', minLevel: 20, maxLevel: 50, tone: 'bg-stone-700', x: 50, y: 49 },
  { name: 'Forgotten Land', nameZh: '被遗忘之地', count: 19, focus: 'side zones, hidden routes, and special map checks', minLevel: 25, maxLevel: 50, tone: 'bg-rose-600', x: 76, y: 63 },
];

const classicMonsterPreview: ClassicMonsterPreview[] = [
  { name: 'Snail', nameZh: '蜗牛', level: 1, maps: 37, hp: '45', exp: '2', attribute: 'Peace', note: 'starter monster for Maple Island and early Victoria routes' },
  { name: 'Blue Snail', nameZh: '蓝蜗牛', level: 2, maps: 41, hp: '51', exp: '4', attribute: 'Normal', note: 'very common early EXP target' },
  { name: 'Stump', nameZh: '树桩', level: 5, maps: 34, hp: '134', exp: '10', attribute: 'Fire weak', note: 'fire-weak target used in Perion-adjacent routes' },
  { name: 'Octopus', nameZh: '章鱼', level: 12, maps: 9, hp: '191', exp: '23', attribute: 'Lightning weak', note: 'Kerning-side monster with lightning weakness' },
  { name: 'Zombie Mushroom', nameZh: '僵尸蘑菇', level: 24, maps: 16, hp: '443', exp: '45', attribute: 'Holy weak · Undead', note: 'undead target for dungeon routing and Holy weakness checks' },
  { name: 'King Slime', nameZh: '史莱姆之王', level: 32, maps: 1, hp: '17,449', exp: '248', attribute: 'Boss', note: 'boss entry for Party Quest planning' },
];

const classicMapRecords: ClassicMapRecord[] = [
  { id: 'maple-island-training', name: 'Maple Island starter fields', nameZh: '枫叶岛新手区域', region: 'Maple Island', level: 'Lv.1–10', type: 'hunting', monsters: ['Snail', 'Blue Snail', 'Red Snail'], note: 'Use this route before leaving beginner island.' },
  { id: 'lith-harbor', name: 'Lith Harbor routes', nameZh: '里斯港口路线', region: 'Lith Harbor', level: 'Lv.1–15', type: 'town', monsters: ['Snail', 'Pig'], note: 'Travel hub for Victoria Island entry and early quests.' },
  { id: 'henesys-hunting-ground', name: 'Henesys Hunting Ground I', nameZh: '弓箭手村狩猎场 I', region: 'Henesys', level: 'Lv.5–20', type: 'hunting', monsters: ['Snail', 'Blue Snail', 'Orange Mushroom'], note: 'Classic early training route with dense low-level monsters.' },
  { id: 'pig-beach', name: 'Pig Beach route', nameZh: '猪的海岸路线', region: 'Henesys', level: 'Lv.10–25', type: 'hidden', monsters: ['Pig', 'Ribbon Pig'], note: 'Hidden-street style route for pig and ribbon-pig farming.' },
  { id: 'ellinia-tree-dungeon', name: 'Ellinia Tree Dungeon', nameZh: '魔法密林树洞', region: 'Ellinia', level: 'Lv.8–30', type: 'dungeon', monsters: ['Slime', 'Stump', 'Green Mushroom'], note: 'Forest dungeon route for mage-side progression.' },
  { id: 'perion-rocky-road', name: 'Perion Rocky Road', nameZh: '勇士之村岩石路', region: 'Perion', level: 'Lv.10–32', type: 'hunting', monsters: ['Stump', 'Dark Stump', 'Axe Stump'], note: 'Stump-heavy warrior route with fire-weak targets.' },
  { id: 'kerning-subway', name: 'Kerning City Subway', nameZh: '神偷之城地铁', region: 'Kerning City', level: 'Lv.12–30', type: 'dungeon', monsters: ['Octopus', 'Bubbling'], note: 'Compact route for thief-side monster checks.' },
  { id: 'kerning-pq', name: 'Kerning Party Quest', nameZh: '神偷之城组队任务', region: 'Kerning City', level: 'Lv.21–30', type: 'party', monsters: ['Ligators', 'King Slime'], note: 'Party Quest context for King Slime and early cooperative routing.' },
  { id: 'sleepywood-ant-tunnel', name: 'Ant Tunnel', nameZh: '蚂蚁洞', region: 'Sleepywood', level: 'Lv.20–50', type: 'dungeon', monsters: ['Horny Mushroom', 'Zombie Mushroom', 'Evil Eye'], note: 'Main dungeon route for mid-level Victoria progression.' },
  { id: 'forgotten-land', name: 'Forgotten Land side zones', nameZh: '被遗忘之地支线区域', region: 'Forgotten Land', level: 'Lv.25–50', type: 'hidden', monsters: ['Fire Boar', 'Wild Boar'], note: 'Use as a side-zone checklist while source coverage expands.' },
];

const classicMapTypes: Array<{ id: 'all' | ClassicMapRecord['type']; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'town', label: 'Towns' },
  { id: 'hunting', label: 'Hunting' },
  { id: 'dungeon', label: 'Dungeon' },
  { id: 'party', label: 'Party Quest' },
  { id: 'hidden', label: 'Hidden' },
];

const mapDefinitions: Record<string, SeriesMapDefinition> = {
  'maplestory-classic': {
    title: 'MapleStory Classic map atlas',
    description: 'A Classic-only map workspace modeled after MeowDB: world-map entry points, region counts, monster previews, and direct database links stay separate from modern PC MapleStory maps.',
    routes: [
      { label: 'World Map', detail: 'Maple Island and Victoria Island are the main clickable world-map surfaces for Classic World route planning.' },
      { label: 'Map Database', detail: '304 Classic maps are organized by town, hunting region, dungeon, hidden street, Party Quest, and event context.' },
      { label: 'Monster Database', detail: '88 monsters include level, HP/EXP efficiency, attributes, and spawn-map counts for training decisions.' },
    ],
  },
  'maplestory-m': {
    title: 'MapleStory M map workspace',
    description: 'Mobile hunting-ground and content routing stays separate from the PC training-map guide.',
    routes: [
      { label: 'Maple Guide', detail: 'Track level-based hunting grounds, recommended content, filters, and rewards.' },
      { label: 'Star Force Fields', detail: 'Keep Star Force Field planning tied to MapleStory M patch changes.' },
      { label: 'Event routes', detail: 'Review event areas and growth stages from current mobile patch notes.' },
    ],
  },
  'maplestory-n': {
    title: 'MapleStory N route workspace',
    description: 'Service routes, event missions, and marketplace links are kept in the MapleStory N context.',
    routes: [
      { label: 'Launch guide', detail: 'Open the official route map for Guide, Ranking, Marketplace, and probability pages.' },
      { label: 'V Tracker', detail: 'Use the event checklist as the source for growth, dungeon, story, and field routing.' },
      { label: 'Service notices', detail: 'Check maintenance and known issues before following route-sensitive tasks.' },
    ],
  },
  'maplestory-worlds': {
    title: 'MapleStory Worlds map workspace',
    description: 'World discovery, creator workflows, and published experiences stay out of the PC map guide.',
    routes: [
      { label: 'World discovery', detail: 'Use the platform entry points for playable worlds and creator profiles.' },
      { label: 'Creator maps', detail: 'Track performance, multiplayer, and localization checks before publishing a world.' },
      { label: 'Policy routes', detail: 'Review resource and avatar policies when a map or world changes scope.' },
    ],
  },
  'maplestory-idle': {
    title: 'Idle RPG chapter workspace',
    description: 'Idle chapters, fields, Party Quests, and seasonal areas are separated from mainline MapleStory maps.',
    routes: [
      { label: 'Hero journey', detail: 'Plan chapter progress and seasonal milestones from current patch notes.' },
      { label: 'Party Quest routes', detail: 'Check new difficulty, artifact, and companion updates before spending attempts.' },
      { label: 'Seasonal fields', detail: 'Keep shop, arena, and guild-season timing alongside field progression.' },
    ],
  },
};

function ClassicMapsWorkspace({ product }: { product: SeriesProduct }) {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [mapType, setMapType] = useState<(typeof classicMapTypes)[number]['id']>('all');
  const [query, setQuery] = useState('');
  const selectedRegionInfo = selectedRegion === 'all'
    ? null
    : classicRegions.find((region) => region.name === selectedRegion) ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredMaps = useMemo(() => classicMapRecords.filter((record) => {
    if (selectedRegion !== 'all' && record.region !== selectedRegion) return false;
    if (mapType !== 'all' && record.type !== mapType) return false;
    if (!normalizedQuery) return true;
    return [
      record.name,
      record.nameZh,
      record.region,
      record.level,
      record.type,
      record.note,
      ...record.monsters,
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  }), [mapType, normalizedQuery, selectedRegion]);
  const filteredMonsters = useMemo(() => classicMonsterPreview.filter((monster) => {
    if (!normalizedQuery) return true;
    return [
      monster.name,
      monster.nameZh,
      monster.attribute,
      monster.note,
      String(monster.level),
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  }), [normalizedQuery]);

  return (
    <section aria-labelledby="series-map-heading" className="border-b border-background-300 pb-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase text-primary-700">{product.name}</p>
          <h2 id="series-map-heading" className="mt-1 font-heading text-2xl font-semibold md:text-3xl">
            MapleStory Classic map atlas
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-600">
            Classic World now has an in-site map explorer: click a region, search by map or monster, filter map
            types, and review monster spawn context without leaving MPStorys.
          </p>
        </div>

        <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Source snapshot</p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white px-2 py-3">
              <dt className="text-[11px] text-foreground-500">Maps</dt>
              <dd className="font-heading text-xl font-semibold text-foreground-950">304</dd>
            </div>
            <div className="rounded-lg bg-white px-2 py-3">
              <dt className="text-[11px] text-foreground-500">Monsters</dt>
              <dd className="font-heading text-xl font-semibold text-foreground-950">88</dd>
            </div>
            <div className="rounded-lg bg-white px-2 py-3">
              <dt className="text-[11px] text-foreground-500">Islands</dt>
              <dd className="font-heading text-xl font-semibold text-foreground-950">2</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {mapDefinitions['maplestory-classic'].routes.map((route) => (
          <article key={route.label} className="rounded-lg border border-background-300 bg-background-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-lg text-primary-700">
              <i className="ri-route-line" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold text-foreground-950">{route.label}</h3>
            <p className="mt-2 text-sm leading-6 text-foreground-600">{route.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-background-300 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Internal map explorer</p>
            <h3 className="font-heading text-xl font-semibold text-foreground-950">World Map and Table View</h3>
            <p className="mt-1 text-sm text-foreground-600">
              Click a Classic region or use the filters. Results update here instead of jumping to another site.
            </p>
          </div>
          <div className="flex min-h-11 items-center rounded-full border border-background-300 bg-background-50 px-3 lg:w-80">
            <i className="ri-search-line mr-2 text-foreground-500" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search maps or monsters..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="ml-2 text-xs font-semibold text-primary-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="relative min-h-[360px] overflow-hidden rounded-xl border border-background-300 bg-[radial-gradient(circle_at_25%_20%,#d9f99d_0,#d9f99d_12%,transparent_13%),radial-gradient(circle_at_55%_55%,#bbf7d0_0,#bbf7d0_21%,transparent_22%),linear-gradient(135deg,#ecfeff,#fef3c7_48%,#fed7aa)] p-4">
            <div className="absolute inset-4 rounded-[2rem] border border-white/60" aria-hidden="true" />
            <div className="absolute left-[14%] top-[18%] rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-foreground-700 shadow-sm">Maple Island</div>
            <div className="absolute bottom-[14%] left-[30%] rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-foreground-700 shadow-sm">Victoria Island</div>
            <svg className="absolute inset-0 h-full w-full opacity-45" aria-hidden="true">
              <path d="M110 230 C210 150 290 180 380 120" stroke="#92400e" strokeWidth="4" strokeDasharray="8 8" fill="none" />
              <path d="M260 270 C370 230 430 250 520 190" stroke="#92400e" strokeWidth="4" strokeDasharray="8 8" fill="none" />
              <path d="M220 285 C245 205 300 180 370 210" stroke="#92400e" strokeWidth="4" strokeDasharray="8 8" fill="none" />
            </svg>
            {classicRegions.map((region) => {
              const isSelected = selectedRegion === region.name;
              return (
                <button
                  key={region.name}
                  type="button"
                  onClick={() => setSelectedRegion(region.name)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-3 py-2 text-left text-xs shadow-lg transition hover:scale-105 ${
                    isSelected
                      ? 'border-foreground-950 bg-foreground-950 text-white'
                      : 'border-white bg-white/95 text-foreground-900 hover:border-primary-500'
                  }`}
                  style={{ left: `${region.x}%`, top: `${region.y}%` }}
                >
                  <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${region.tone}`} aria-hidden="true" />
                  <span className="font-semibold">{region.nameZh}</span>
                  <span className="block text-[10px] opacity-75">{region.count} maps · Lv.{region.minLevel}-{region.maxLevel}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedRegion('all')}
              className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold ${
                selectedRegion === 'all'
                  ? 'bg-foreground-950 text-white'
                  : 'bg-white/90 text-foreground-700 hover:bg-primary-50'
              }`}
            >
              All regions
            </button>
          </div>

          <aside className="rounded-xl border border-background-300 bg-background-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Selected region</p>
            <h4 className="mt-1 font-heading text-2xl font-semibold text-foreground-950">
              {selectedRegionInfo ? selectedRegionInfo.nameZh : 'All Classic regions'}
            </h4>
            <p className="mt-1 text-sm uppercase tracking-wide text-foreground-500">
              {selectedRegionInfo ? selectedRegionInfo.name : 'Maple Island + Victoria Island'}
            </p>
            <p className="mt-3 text-sm leading-6 text-foreground-600">
              {selectedRegionInfo
                ? selectedRegionInfo.focus
                : 'Browse all Classic map groups together, then narrow by search, monster, or map type.'}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white p-3">
                <dt className="text-xs text-foreground-500">Maps in scope</dt>
                <dd className="font-heading text-2xl font-semibold text-foreground-950">
                  {selectedRegionInfo ? selectedRegionInfo.count : 304}
                </dd>
              </div>
              <div className="rounded-lg bg-white p-3">
                <dt className="text-xs text-foreground-500">Level span</dt>
                <dd className="font-heading text-lg font-semibold text-foreground-950">
                  {selectedRegionInfo ? `Lv.${selectedRegionInfo.minLevel}-${selectedRegionInfo.maxLevel}` : 'Lv.1-50'}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {classicMapTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setMapType(type.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    mapType === type.id
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : 'border-background-300 bg-white text-foreground-700 hover:border-primary-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section aria-labelledby="classic-map-results-heading" className="rounded-xl border border-background-300 bg-background-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Table View</p>
                <h3 id="classic-map-results-heading" className="font-heading text-xl font-semibold text-foreground-950">
                  Matching maps
                </h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground-700">
                {filteredMaps.length} shown
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {filteredMaps.map((record) => (
                <article key={record.id} className="rounded-lg border border-background-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-heading text-lg font-semibold text-foreground-950">{record.nameZh}</h4>
                      <p className="text-xs uppercase tracking-wide text-foreground-500">{record.name}</p>
                    </div>
                    <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                      {record.level}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-foreground-700 sm:grid-cols-[7rem_1fr]">
                    <span className="font-semibold text-foreground-500">Region</span>
                    <span>{record.region}</span>
                    <span className="font-semibold text-foreground-500">Monsters</span>
                    <span>{record.monsters.join(', ')}</span>
                    <span className="font-semibold text-foreground-500">Note</span>
                    <span>{record.note}</span>
                  </div>
                </article>
              ))}
              {filteredMaps.length === 0 && (
                <p className="rounded-lg bg-white p-6 text-center text-sm text-foreground-500">
                  No Classic maps match these filters.
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby="classic-monster-heading" className="rounded-xl border border-background-300 bg-background-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Monster database</p>
                <h3 id="classic-monster-heading" className="font-heading text-xl font-semibold text-foreground-950">
                  Monster and spawn info
                </h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground-700">
                {filteredMonsters.length} shown
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-background-200 bg-white">
              <div className="grid grid-cols-[1.2fr_0.45fr_0.55fr_0.8fr] bg-background-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground-500">
                <span>Monster</span>
                <span>Lv.</span>
                <span>Maps</span>
                <span>Attribute</span>
              </div>
              {filteredMonsters.map((monster) => (
                <div key={`${monster.name}-${monster.level}`} className="grid grid-cols-[1.2fr_0.45fr_0.55fr_0.8fr] border-t border-background-200 px-3 py-3 text-sm">
                  <span className="font-medium text-foreground-950">
                    {monster.nameZh}
                    <span className="ml-1 text-xs text-foreground-500">{monster.name}</span>
                  </span>
                  <span className="text-foreground-700">{monster.level}</span>
                  <span className="text-foreground-700">{monster.maps}</span>
                  <span className="text-foreground-600">{monster.attribute}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-foreground-500">
              Monster stats are summarized from MeowDB’s Classic monster table; MPStorys keeps this lightweight
              panel in-page for route planning.
            </p>
          </section>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 rounded-xl border border-background-300 bg-background-50 p-4 text-sm">
          <span className="font-semibold text-foreground-700">Source references:</span>
          <a href="https://meowdb.com/msclassic/zh-cn/world-map" target="_blank" rel="noreferrer" className="text-primary-700 hover:underline">World Map</a>
          <a href="https://meowdb.com/msclassic/zh-cn/maps" target="_blank" rel="noreferrer" className="text-primary-700 hover:underline">Maps database</a>
          <a href="https://meowdb.com/msclassic/zh-cn/monsters" target="_blank" rel="noreferrer" className="text-primary-700 hover:underline">Monster database</a>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section aria-labelledby="classic-region-heading" className="rounded-xl border border-background-300 bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Map database</p>
              <h3 id="classic-region-heading" className="font-heading text-xl font-semibold text-foreground-950">
                Classic regions / 地图分区
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRegion('all')}
              className="text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              Show all in explorer ↑
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {classicRegions.map((region) => (
              <article key={region.name} className="rounded-lg border border-background-200 bg-background-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-heading text-base font-semibold text-foreground-950">{region.nameZh}</h4>
                    <p className="text-xs uppercase tracking-wide text-foreground-500">{region.name}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-primary-700">
                    {region.count} maps
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground-600">{region.focus}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-xl border border-background-300 bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">World map</p>
              <h3 className="font-heading text-xl font-semibold text-foreground-950">Maple Island + Victoria Island</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRegion('Maple Island')}
              className="text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              Focus Maple Island ↑
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-foreground-600">
            Use the in-page world map above for region selection. Source links remain available for verification,
            but browsing maps and monsters now happens directly inside MPStorys.
          </p>
          <div className="mt-4 rounded-lg bg-background-50 p-4">
            <p className="text-sm font-semibold text-foreground-950">Supported map types</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {['Towns / 城镇', 'Hunting maps / 狩猎区', 'Dungeon areas / 地下城', 'Hidden streets / 隐藏街道'].map((tag) => (
                <span key={tag} className="rounded-full border border-background-300 bg-white px-3 py-1 text-foreground-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section aria-labelledby="classic-monster-summary-heading" className="mt-6 rounded-xl border border-background-300 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Monster database</p>
            <h3 id="classic-monster-summary-heading" className="font-heading text-xl font-semibold text-foreground-950">
              Spawn and monster preview / 怪物与刷怪信息
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setQuery('King Slime')}
            className="text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            Filter King Slime ↑
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-background-200">
          <div className="grid grid-cols-[1.2fr_0.5fr_0.6fr_1.6fr] bg-background-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-foreground-500">
            <span>Monster</span>
            <span>Lv.</span>
            <span>Maps</span>
            <span>Use</span>
          </div>
          {classicMonsterPreview.map((monster) => (
            <div key={`${monster.name}-${monster.level}`} className="grid grid-cols-[1.2fr_0.5fr_0.6fr_1.6fr] border-t border-background-200 px-3 py-3 text-sm">
              <span className="font-medium text-foreground-950">
                {monster.nameZh}
                <span className="ml-1 text-xs text-foreground-500">{monster.name}</span>
              </span>
              <span className="text-foreground-700">{monster.level}</span>
              <span className="text-foreground-700">{monster.maps} maps</span>
              <span className="text-foreground-600">{monster.note}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

export default function SeriesMapsWorkspace({ product }: { product: SeriesProduct }) {
  const definition = mapDefinitions[product.id];
  if (!definition) return null;
  if (product.id === 'maplestory-classic') {
    return <ClassicMapsWorkspace product={product} />;
  }

  return (
    <section aria-labelledby="series-map-heading" className="border-b border-background-300 pb-10">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase text-primary-700">{product.name}</p>
        <h2 id="series-map-heading" className="mt-1 font-heading text-2xl font-semibold md:text-3xl">
          {definition.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground-600">{definition.description}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {definition.routes.map((route) => (
          <article key={route.label} className="rounded-lg border border-background-300 bg-background-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-lg text-primary-700">
              <i className="ri-route-line" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold text-foreground-950">{route.label}</h3>
            <p className="mt-2 text-sm leading-6 text-foreground-600">{route.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
