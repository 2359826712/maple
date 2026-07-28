import type { SeriesProduct } from './catalog';

type SeriesMapDefinition = {
  title: string;
  description: string;
  routes: Array<{
    label: string;
    detail: string;
  }>;
};

const mapDefinitions: Record<string, SeriesMapDefinition> = {
  'maplestory-classic': {
    title: 'Classic World map scope',
    description: 'Keep Classic World routing separate from modern MapleStory maps while the verified test scope is still limited.',
    routes: [
      { label: 'Test entry', detail: 'Check the current test page before planning access routes or character prep.' },
      { label: 'Classic regions', detail: 'Use Classic-only notes for early Victoria Island and legacy quest routing.' },
      { label: 'Coverage status', detail: 'Add map data only after Nexon publishes or confirms the playable test scope.' },
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

export default function SeriesMapsWorkspace({ product }: { product: SeriesProduct }) {
  const definition = mapDefinitions[product.id];
  if (!definition) return null;

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
