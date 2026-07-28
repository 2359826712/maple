import type { SeriesProduct } from './catalog';

type ClassicMapRegion = {
  name: string;
  nameZh: string;
  count: number;
  focus: string;
};

type ClassicMonsterPreview = {
  name: string;
  nameZh: string;
  level: number;
  maps: string;
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
  { name: 'Henesys', nameZh: '弓箭手村', count: 35, focus: 'low-level hunting routes, town services, and nearby mushroom/pig fields' },
  { name: 'Ellinia', nameZh: '魔法密林', count: 39, focus: 'tree dungeons, mage routes, and forest monster progression' },
  { name: 'Perion', nameZh: '勇士之村', count: 36, focus: 'stump, boar, and rocky-road warrior training routes' },
  { name: 'Kerning City', nameZh: '神偷之城', count: 45, focus: 'subway maps, thief routes, and early Party Quest planning' },
  { name: 'Sleepywood', nameZh: '林中之城', count: 47, focus: 'Ant Tunnel, dungeon paths, and mid-level Victoria Island grind spots' },
  { name: 'Lith Harbor', nameZh: '里斯港口', count: 18, focus: 'starter travel hub, port routes, and early Victoria access' },
  { name: 'Maple Island', nameZh: '枫叶岛', count: 25, focus: 'beginner island progression and first monster encounters' },
  { name: 'Forgotten Land', nameZh: '被遗忘之地', count: 19, focus: 'side zones, hidden routes, and special map checks' },
];

const classicMonsterPreview: ClassicMonsterPreview[] = [
  { name: 'Snail', nameZh: '蜗牛', level: 1, maps: '37 maps', note: 'starter monster for Maple Island and early Victoria routes' },
  { name: 'Blue Snail', nameZh: '蓝蜗牛', level: 2, maps: '41 maps', note: 'very common early EXP target' },
  { name: 'Stump', nameZh: '树桩', level: 5, maps: '34 maps', note: 'fire-weak target used in Perion-adjacent routes' },
  { name: 'Octopus', nameZh: '章鱼', level: 12, maps: '9 maps', note: 'Kerning-side monster with lightning weakness' },
  { name: 'Zombie Mushroom', nameZh: '僵尸蘑菇', level: 24, maps: '16 maps', note: 'undead target for dungeon routing and Holy weakness checks' },
  { name: 'King Slime', nameZh: '史莱姆之王', level: 32, maps: '1 map', note: 'boss entry for Party Quest planning' },
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
  return (
    <section aria-labelledby="series-map-heading" className="border-b border-background-300 pb-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase text-primary-700">{product.name}</p>
          <h2 id="series-map-heading" className="mt-1 font-heading text-2xl font-semibold md:text-3xl">
            MapleStory Classic map atlas
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-600">
            Classic World now gets its own MeowDB-backed overview: world-map entry points, map region counts,
            monster spawn context, and source links are kept separate from modern MapleStory PC map guidance.
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section aria-labelledby="classic-region-heading" className="rounded-xl border border-background-300 bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Map database</p>
              <h3 id="classic-region-heading" className="font-heading text-xl font-semibold text-foreground-950">
                Classic regions / 地图分区
              </h3>
            </div>
            <a
              href="https://meowdb.com/msclassic/zh-cn/maps"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              Open MeowDB maps →
            </a>
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
            <a
              href="https://meowdb.com/msclassic/zh-cn/world-map"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              Open world map →
            </a>
          </div>
          <p className="mt-3 text-sm leading-6 text-foreground-600">
            Use the external world map for precise marker placement. MPStorys summarizes each region here so Classic
            players can jump from series navigation into the correct MeowDB atlas page.
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

      <section aria-labelledby="classic-monster-heading" className="mt-6 rounded-xl border border-background-300 bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Monster database</p>
            <h3 id="classic-monster-heading" className="font-heading text-xl font-semibold text-foreground-950">
              Spawn and monster preview / 怪物与刷怪信息
            </h3>
          </div>
          <a
            href="https://meowdb.com/msclassic/zh-cn/monsters"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            Open MeowDB monsters →
          </a>
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
              <span className="text-foreground-700">{monster.maps}</span>
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
