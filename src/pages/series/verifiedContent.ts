import type { SeriesModule } from './scope';
import { indexedContent, indexedContentSources } from '@/domain/contentIndex';
import type { ContentType } from '@/domain/contentIndexTypes';
import { hasArticleSearchIntentProfile, IDLE_SUMMER_COUPON_URL } from './articleSearchIntent';
import {
  getIndexedResourceModule,
  getIndexedResourceSeriesId,
  indexedResources,
  type ResourceIndexRecord,
} from '@/domain/resourceIndex';

export type VerifiedSeriesResource = {
  contentId?: string;
  resourceId?: string;
  resourceRecord?: ResourceIndexRecord;
  title: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  publishedAt?: string;
  category?: string;
  status?: string;
  lastChecked?: string;
};

type SeriesContent = Partial<Record<SeriesModule, VerifiedSeriesResource[]>>;
const emptyResources: VerifiedSeriesResource[] = [];

const officialIndex = (title: string, description: string, sourceLabel: string, sourceUrl: string): VerifiedSeriesResource => ({
  title,
  description,
  sourceLabel,
  sourceUrl,
});

const editorialSeriesContent: Record<string, SeriesContent> = {
  'maplestory-pc': {
    news: [officialIndex('MapleStory Official News', 'The Global MapleStory source for announcements, patch notes, known issues, events, and Cash Shop updates.', 'Nexon MapleStory', 'https://www.nexon.com/maplestory/news')],
    upcoming: [officialIndex('Official update and maintenance notices', 'Upcoming maintenance and update information is published through the Global MapleStory news center.', 'Nexon MapleStory', 'https://www.nexon.com/maplestory/news')],
    guides: [officialIndex('MapleStory Game Guide', 'Official game information covering MapleStory classes, systems, worlds, and ways to play.', 'Nexon MapleStory', 'https://www.nexon.com/maplestory/game')],
    events: [officialIndex('MapleStory Events', 'Current event announcements and participation details from the Global MapleStory team.', 'Nexon MapleStory', 'https://www.nexon.com/maplestory/news')],
    tools: [officialIndex('Official player rankings', 'Search the Global MapleStory ranking tables maintained by Nexon.', 'Nexon MapleStory', 'https://www.nexon.com/maplestory/rankings')],
    checklist: [officialIndex('Current notices and event requirements', 'Use the official news center to verify event dates, eligibility, and maintenance windows before planning tasks.', 'Nexon MapleStory', 'https://www.nexon.com/maplestory/news')],
    wiki: [officialIndex('Official MapleStory game reference', 'Nexon-maintained reference material for the main PC game.', 'Nexon MapleStory', 'https://www.nexon.com/maplestory/game')],
    rankings: [officialIndex('Global MapleStory Rankings', 'Official character and game ranking pages for Global MapleStory.', 'Nexon MapleStory', 'https://www.nexon.com/maplestory/rankings')],
    shop: [officialIndex('Official Cash Shop notices', 'Cash Shop rotations, sales, and package details are published in the official news center.', 'Nexon MapleStory', 'https://www.nexon.com/maplestory/news')],
    community: [officialIndex('Official MapleStory Discord', 'The official Global MapleStory Discord community.', 'Nexon MapleStory', 'https://discord.gg/maplestory')],
  },
  'maplestory-classic': {
    news: [officialIndex('MapleStory Classic World Closed Online Test #2', 'Nexon registration and product information for the second Global MapleStory Classic World closed online test.', 'Nexon Classic World', 'https://www.nexon.com/mscw/classic-world-closed-online-test-2')],
    upcoming: [officialIndex('Closed Online Test #2', 'The official test page is the verified source for access and schedule updates.', 'Nexon Classic World', 'https://www.nexon.com/mscw/classic-world-closed-online-test-2')],
    guides: [officialIndex('Classic World test information', 'Official participation and client information currently available for Global MapleStory Classic World.', 'Nexon Classic World', 'https://www.nexon.com/mscw/classic-world-closed-online-test-2')],
    events: [officialIndex('Classic World Closed Online Test', 'Nexon information for the original Global MapleStory Classic World closed online test.', 'Nexon Classic World', 'https://www.nexon.com/mscw/classic-world-closed-online-test')],
    tools: [officialIndex('Classic World test readiness tracker', 'An MPStorys reference for tracking registration, access, client, and schedule requirements published for Closed Online Test #2.', 'Nexon Classic World', 'https://www.nexon.com/mscw/classic-world-closed-online-test-2')],
    checklist: [officialIndex('Classic World test registration', 'Verify test registration and access requirements directly on the Nexon campaign page.', 'Nexon Classic World', 'https://www.nexon.com/mscw/classic-world-closed-online-test-2')],
    wiki: [officialIndex('Classic World verified reference', 'A source-backed reference for the currently announced Global MapleStory Classic World test, including its product scope and participation information.', 'Nexon Classic World', 'https://www.nexon.com/mscw/classic-world-closed-online-test-2')],
    community: [officialIndex('Classic World official test page', 'Nexon has not published a separate verified Classic World community hub; use the official test page for announcements.', 'Nexon Classic World', 'https://www.nexon.com/mscw/classic-world-closed-online-test-2')],
  },
  'maplestory-m': {
    news: [
      { title: '07.08/09 Patch Notes', description: 'Official patch notes covering Tutorial and Adventure Mission changes, main UI improvements, Star Force Field improvements, and event additions.', sourceLabel: 'MapleStory M Global Forum', sourceUrl: 'https://forum.nexon.com/MapleStoryMGlobal/board_view?allBoard=1&board=2690&thread=3496419', publishedAt: '2026-07-08' },
      { title: '2026.07.08/09 Update Known Issue Notice', description: 'The official known-issues list for the July 8/9 update.', sourceLabel: 'MapleStory M Global Forum', sourceUrl: 'https://forum.nexon.com/MapleStoryMGlobal/board_view?board=7513&thread=3496977', publishedAt: '2026-07-09' },
    ],
    upcoming: [officialIndex('MapleStory M Global Forum', 'The official forum publishes update previews, maintenance notices, patch notes, and event schedules.', 'Nexon MapleStory M', 'https://forum.nexon.com/MapleStoryMGlobal/main/')],
    guides: [
      { title: 'Guide for New Maplers', description: 'Official beginner guidance for settings, auto-battle, growth, equipment, the Trade Station, and convenience features.', sourceLabel: 'MapleStory M Game Guide', sourceUrl: 'https://forum.nexon.com/MapleStoryMGlobal/board_view?allBoard=1&board=2694&thread=2715388', publishedAt: '2025-01-15' },
      { title: 'Maple Guide', description: 'Official instructions for level-based hunting grounds, recommended content, filters, and rewards.', sourceLabel: 'MapleStory M Game Guide', sourceUrl: 'https://forum.nexon.com/MapleStoryMGlobal/board_view?board=2696&thread=2008054', publishedAt: '2023-02-06' },
    ],
    events: [{ title: 'Challenge! Summer Growth Special Training', description: 'The July 8/9 patch notes contain the official event period, participation steps, missions, and rewards.', sourceLabel: 'MapleStory M Patch Notes', sourceUrl: 'https://forum.nexon.com/MapleStoryMGlobal/board_view?allBoard=1&board=2690&thread=3496419', publishedAt: '2026-07-08' }],
    tools: [officialIndex('MapleStory M Game Guide', 'Official reference boards for characters, systems, items, forging, content, guilds, and bosses.', 'MapleStory M Global Forum', 'https://forum.nexon.com/MapleStoryMGlobal/main/')],
    checklist: [{ title: 'July update known-issues checklist', description: 'Check the official known-issues notice before completing tutorial, Adventure Mission, Maple Guide, or Liberation Quest tasks.', sourceLabel: 'MapleStory M Global Forum', sourceUrl: 'https://forum.nexon.com/MapleStoryMGlobal/board_view?board=7513&thread=3496977', publishedAt: '2026-07-09' }],
    wiki: [officialIndex('MapleStory M Game Guide Index', 'The official forum organizes reference pages by character, system, item, forge, content, guild, and boss.', 'MapleStory M Global Forum', 'https://forum.nexon.com/MapleStoryMGlobal/main/')],
    shop: [officialIndex('Mapletown Market notices', 'Official package, Royal Style, Golden Apple, and Webshop notices are published in the MapleStory M Global Forum.', 'MapleStory M Global Forum', 'https://forum.nexon.com/MapleStoryMGlobal/main/')],
    community: [officialIndex('MapleStory M Global Forum', 'The official community hub includes announcements, patch notes, guides, FAQ, Discord, YouTube, and support links.', 'Nexon MapleStory M', 'https://forum.nexon.com/MapleStoryMGlobal/main/')],
  },
  'maplestory-n': {
    news: [officialIndex('MapleStory N Updates', 'The official documentation index for MapleStory N patch notes and notices.', 'MapleStory N Documentation', 'https://docs.maplestoryn.io/announcement/updates')],
    upcoming: [officialIndex('MapleStory N Notices', 'Official notices and release information for MapleStory N.', 'MapleStory N Documentation', 'https://docs.maplestoryn.io/announcement/updates/notice')],
    guides: [officialIndex('MapleStory N Official Launch and Web Guide', 'The launch guide documents the official News, Guide, Ranking, Dynamic Pricing, Probability Info, and Marketplace sections.', 'MapleStory N Documentation', 'https://docs.maplestoryn.io/welcome-to-maplestory-n/maplestory-n-official-launch')],
    events: [officialIndex('MapleStory N Events', 'The official current and archived event directory.', 'MapleStory N Documentation', 'https://docs.maplestoryn.io/announcement/events')],
    tools: [officialIndex('MapleStory N Game Status tools', 'The official launch guide confirms Ranking, Dynamic Pricing, and Probability Info tools on MapleStory N Web.', 'MapleStory N Documentation', 'https://docs.maplestoryn.io/welcome-to-maplestory-n/maplestory-n-official-launch')],
    checklist: [officialIndex('V Tracker mission reference', 'An official 40-mission growth checklist covering job advancement, growth, dungeons, story, hunting, fields, exploration, and special content.', 'MapleStory N Documentation', 'https://docs.maplestoryn.io/announcement/events/v-tracker')],
    wiki: [officialIndex('MapleStory N Documentation', 'Official announcements, update notes, event rules, and service documentation.', 'MapleStory N Documentation', 'https://docs.maplestoryn.io/')],
    shop: [officialIndex('MSU Marketplace', 'The official launch guide confirms that the Marketplace button opens NFT and FT market services in the MapleStory Universe ecosystem.', 'MapleStory N Documentation', 'https://docs.maplestoryn.io/welcome-to-maplestory-n/maplestory-n-official-launch')],
    community: [officialIndex('MapleStory N Support and notices', 'The official launch guide directs account and game inquiries to MapleStory Universe Support.', 'MapleStory N Documentation', 'https://docs.maplestoryn.io/welcome-to-maplestory-n/maplestory-n-official-launch')],
  },
  'maplestory-worlds': {
    news: [
      { title: 'Hotfix Maintenance - 2026 July 2', description: 'Official MapleStory Worlds Creator Center maintenance notice.', sourceLabel: 'MapleStory Worlds Creator Center', sourceUrl: 'https://maplestoryworlds-creators.nexon.com/en', publishedAt: '2026-07-02' },
      { title: 'Global Creator Challenge Discord Linking Event', description: 'Official Creator Center campaign notice for the Global Creator Challenge.', sourceLabel: 'MapleStory Worlds Creator Center', sourceUrl: 'https://maplestoryworlds-creators.nexon.com/en', publishedAt: '2026-07-02' },
    ],
    upcoming: [officialIndex('MapleStory Worlds Creator News', 'Official maintenance, campaign, policy, and platform notices for creators.', 'MapleStory Worlds Creator Center', 'https://maplestoryworlds-creators.nexon.com/en/community/5479/5485')],
    guides: [officialIndex('MapleStory Worlds Creators Guide', 'Official creator guides include performance analysis, weapon creation, title creation, and world localization.', 'MapleStory Worlds Creator Center', 'https://maplestoryworlds-creators.nexon.com/en')],
    events: [officialIndex('Global Creator Challenge', 'Official Global Creator Challenge announcements and FAQ are published in the Creator Center news directory.', 'MapleStory Worlds Creator Center', 'https://maplestoryworlds-creators.nexon.com/en/community/5479/5485')],
    tools: [officialIndex('World Performance Analysis', 'The official Creator Guide describes using the Profiler to analyze and improve world performance.', 'MapleStory Worlds Creator Center', 'https://maplestoryworlds-creators.nexon.com/en')],
    checklist: [officialIndex('Creator News and policy updates', 'Check current maintenance, policy, sanctions, and campaign notices before publishing or updating a world.', 'MapleStory Worlds Creator Center', 'https://maplestoryworlds-creators.nexon.com/en/community/5479/5485')],
    wiki: [officialIndex('MapleStory Worlds Creators Guide', 'Nexon-maintained reference material for building, optimizing, and localizing worlds.', 'MapleStory Worlds Creator Center', 'https://maplestoryworlds-creators.nexon.com/en')],
    shop: [officialIndex('MapleStory Worlds Avatar Shop', 'Avatar products and world shops are available through the official MapleStory Worlds platform.', 'MapleStory Worlds', 'https://maplestoryworlds.nexon.com/en')],
    community: [officialIndex('MapleStory Worlds Community', 'Official platform pages for worlds, creators, profiles, comments, and community activity.', 'MapleStory Worlds', 'https://maplestoryworlds.nexon.com/en')],
  },
  'maplestory-idle': {
    news: [
      {
        title: 'MapleStory: Idle RPG Summertime Surprise Coupon Gift',
        description: 'Official coupon notice for COOLSUMMER, published June 11, 2026 and expired July 1, 2026. Includes the official iOS/Android redemption routes and account-mailbox cautions.',
        sourceLabel: 'MapleStory: Idle RPG Official Forum',
        sourceUrl: IDLE_SUMMER_COUPON_URL,
        publishedAt: '2026-06-11',
        status: 'expired',
      },
      { title: 'June 11 Patch Notes', description: 'Official patch notes introducing Hero\'s Journey, summer events, new guild seasons, and control improvements.', sourceLabel: 'MapleStory: Idle RPG Forum', sourceUrl: 'https://forum.nexon.com/maplestoryidle/board_view?board=6675&thread=3474001', publishedAt: '2026-06-11' },
      { title: 'May 21 Patch Notes', description: 'Official patch notes covering Party Quest Chaos difficulty, combat changes, artifacts, balance changes, and events.', sourceLabel: 'MapleStory: Idle RPG Forum', sourceUrl: 'https://forum.nexon.com/maplestoryidle/board_view?thread=3449161', publishedAt: '2026-05-21' },
    ],
    upcoming: [{ title: 'Future Update Plans', description: 'An official developer note outlining planned improvements and the Half Anniversary direction.', sourceLabel: 'MapleStory: Idle RPG Forum', sourceUrl: 'https://forum.nexon.com/maplestoryidle/board_view?board=6653&thread=3424530', publishedAt: '2026-04-15' }],
    guides: [officialIndex('MapleStory: Idle RPG Official Forum', 'Official patch notes and system explanations are the verified reference for progression and feature changes.', 'Nexon MapleStory: Idle RPG', 'https://forum.nexon.com/maplestoryidle/main')],
    events: [{ title: 'Summer events and Hero\'s Journey', description: 'The June 11 patch notes contain official periods and rules for Water Balloon Collection, Summer Shop, Arena Boost, and guild seasons.', sourceLabel: 'MapleStory: Idle RPG Forum', sourceUrl: 'https://forum.nexon.com/maplestoryidle/board_view?board=6675&thread=3474001', publishedAt: '2026-06-11' }],
    tools: [officialIndex('Official system and balance reference', 'Patch notes document current systems, unlock conditions, balance values, and reward rules.', 'MapleStory: Idle RPG Forum', 'https://forum.nexon.com/maplestoryidle/main')],
    checklist: [{ title: 'Hero\'s Journey and summer schedule', description: 'Use the official June patch note to verify unlock conditions, event periods, shops, and seasonal guild dates.', sourceLabel: 'MapleStory: Idle RPG Forum', sourceUrl: 'https://forum.nexon.com/maplestoryidle/board_view?board=6675&thread=3474001', publishedAt: '2026-06-11' }],
    wiki: [officialIndex('MapleStory: Idle RPG patch-note archive', 'The official forum is the source of record for jobs, companions, artifacts, Party Quests, chapters, and system changes.', 'MapleStory: Idle RPG Forum', 'https://forum.nexon.com/maplestoryidle/main')],
    shop: [{ title: 'April 30 Shop additions', description: 'The official April 30 patch note records new Earring-slot costumes and Buccaneer/Corsair appearance items.', sourceLabel: 'MapleStory: Idle RPG Forum', sourceUrl: 'https://forum.nexon.com/maplestoryidle/board_view?thread=3435578', publishedAt: '2026-04-30' }],
    community: [officialIndex('MapleStory: Idle RPG Official Forum', 'Official announcements, patch notes, developer notes, and community notices.', 'Nexon MapleStory: Idle RPG', 'https://forum.nexon.com/maplestoryidle/main')],
  },
};

const indexedSeriesContent = indexedResources.reduce<Record<string, SeriesContent>>((seriesContent, resource) => {
  const seriesId = getIndexedResourceSeriesId(resource);
  const module = getIndexedResourceModule(resource);
  const modules = seriesContent[seriesId] || {};
  const moduleResources = modules[module] || [];
  moduleResources.push({
    resourceId: resource.id,
    resourceRecord: resource,
    title: resource.name,
    description: resource.description,
    sourceLabel: resource.website,
    sourceUrl: resource.url,
    category: resource.category,
    status: resource.status,
    lastChecked: resource.last_checked,
  });
  modules[module] = moduleResources;
  seriesContent[seriesId] = modules;
  return seriesContent;
}, {});

const contentTypeModules: Record<ContentType, SeriesModule> = {
  news: 'news',
  event: 'events',
  guide: 'guides',
  'patch-note': 'upcoming',
  maintenance: 'upcoming',
  'cash-shop': 'shop',
  'developer-note': 'news',
  roadmap: 'upcoming',
  'api-announcement': 'tools',
  'creator-announcement': 'news',
};

const contentSeriesIds: Record<(typeof indexedContent)[number]['series'], string> = {
  maplestory: 'maplestory-pc',
  classic: 'maplestory-classic',
  m: 'maplestory-m',
  worlds: 'maplestory-worlds',
  n: 'maplestory-n',
  idle: 'maplestory-idle',
};

const sourceNames = new Map(indexedContentSources.map((source) => [source.id, source.name]));
const hasReadableIndexedDetail = (content: (typeof indexedContent)[number]) => {
  if (hasArticleSearchIntentProfile({ contentId: content.id, sourceUrl: content.canonical_url })) return true;
  if (content.metadata.editorial_reviewed === true) return true;
  const sections = Array.isArray(content.metadata.sections) ? content.metadata.sections : [];
  return sections.some((section) => {
    if (!section || typeof section !== 'object') return false;
    const title = 'title' in section ? String(section.title || '').trim().toLowerCase() : '';
    return title.length > 0 && title !== 'official publication record';
  });
};
const indexedArticleContent = indexedContent.reduce<Record<string, SeriesContent>>((seriesContent, content) => {
  if (content.status === 'removed' || !hasReadableIndexedDetail(content)) return seriesContent;
  const seriesId = contentSeriesIds[content.series];
  const module = contentTypeModules[content.content_type];
  const modules = seriesContent[seriesId] || {};
  const moduleResources = modules[module] || [];
  moduleResources.push({
    contentId: content.id,
    title: content.title,
    description: content.summary || `Verified ${content.content_type.replaceAll('-', ' ')} from ${sourceNames.get(content.source_id) || 'an official source'}.`,
    sourceLabel: sourceNames.get(content.source_id) || 'Official source',
    sourceUrl: content.canonical_url,
    publishedAt: content.published_at || undefined,
    category: content.content_type,
    status: content.status,
    lastChecked: content.last_checked,
  });
  modules[module] = moduleResources;
  seriesContent[seriesId] = modules;
  return seriesContent;
}, {});

export const verifiedSeriesContent: Record<string, SeriesContent> = Object.fromEntries(
  [...new Set([
    ...Object.keys(editorialSeriesContent),
    ...Object.keys(indexedSeriesContent),
    ...Object.keys(indexedArticleContent),
  ])].map((seriesId) => {
    const editorialModules = editorialSeriesContent[seriesId] || {};
    const indexedModules = indexedSeriesContent[seriesId] || {};
    const articleModules = indexedArticleContent[seriesId] || {};
    const modules = Object.fromEntries(
      [...new Set([
        ...Object.keys(editorialModules),
        ...Object.keys(indexedModules),
        ...Object.keys(articleModules),
      ])].map((module) => {
        const typedModule = module as SeriesModule;
        const indexed = [...(articleModules[typedModule] || []), ...(indexedModules[typedModule] || [])];
        const indexedUrls = new Set(indexed.map((resource) => resource.sourceUrl));
        const indexedTitles = new Set(indexed.map((resource) => resource.title.trim().toLocaleLowerCase('en')));
        const editorial = (editorialModules[typedModule] || []).filter((resource) => (
          !indexedUrls.has(resource.sourceUrl)
          && !indexedTitles.has(resource.title.trim().toLocaleLowerCase('en'))
        ));
        return [typedModule, [...indexed, ...editorial]];
      }),
    ) as SeriesContent;
    return [seriesId, modules];
  }),
);

export const getVerifiedSeriesResources = (seriesId: string, module: SeriesModule) => (
  verifiedSeriesContent[seriesId]?.[module] || emptyResources
);

export const getVerifiedSeriesResourceSlug = (resource: VerifiedSeriesResource) => {
  const titleSlug = resource.title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, resource.resourceId || resource.contentId ? 56 : 96);
  const recordId = resource.contentId || resource.resourceId;
  return recordId ? `${titleSlug}-${recordId}`.slice(0, 120) : titleSlug;
};

export const getVerifiedSeriesResource = (
  seriesId: string,
  module: SeriesModule,
  slug: string,
) => getVerifiedSeriesResources(seriesId, module).find(
  (resource) => getVerifiedSeriesResourceSlug(resource) === slug,
);
