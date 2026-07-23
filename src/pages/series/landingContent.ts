import { getVersionDefinition, type GameVersion } from '@/domain/regionModel';
import { getSeriesProduct } from './catalog';
import { getSeriesVersions, getSeriesVersionShortLabel } from './versionConfig';

export type LandingSearchIntent = {
  phrase: string;
  signal: 'Google Trends rising' | 'Related search intent';
  momentum?: string;
};

export type LandingSection = {
  id: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LandingFaq = {
  answer: string;
  question: string;
};

export type SeriesLandingProfile = {
  benefits: Array<{ body: string; title: string }>;
  deck: string;
  editionLabel: string;
  faq: LandingFaq[];
  officialSources: Array<{ label: string; url: string }>;
  region: string;
  searchIntents: LandingSearchIntent[];
  sections: LandingSection[];
  seriesId: string;
  seriesName: string;
  snapshotDate: string;
  timeZone: string;
  title: string;
  version: GameVersion;
  workflow: Array<{ body: string; title: string }>;
};

type SeriesDefinition = {
  audience: string;
  coreSystems: string;
  decisions: string;
  officialSourceLabel: string;
  officialSourceUrl: string;
  positioning: string;
  relatedSearches: string[];
  risingSearches: Array<{ phrase: string; momentum?: string }>;
  sourceStrategy: string;
  updateFocus: string;
};

const TRENDS_SNAPSHOT_DATE = '2026-07-23';
export const MAPLESTORY_TRENDS_URL = 'https://trends.google.com/trends/explore?q=MapleStory&date=today%2012-m';

const seriesDefinitions: Record<string, SeriesDefinition> = {
  'maplestory-pc': {
    audience: 'PC players comparing regional live services, returning Maplers rebuilding a main character, and active players checking new systems before spending time or resources',
    coreSystems: 'classes, worlds, character growth, equipment, bosses, events, patch notes, maintenance, Cash Shop changes, rankings, and regional release timing',
    decisions: 'which class or character to develop, which event tasks matter, what changed in the current patch, which rewards expire, and whether a guide applies to the selected regional service',
    officialSourceLabel: 'Nexon MapleStory',
    officialSourceUrl: 'https://www.nexon.com/maplestory/news',
    positioning: 'the original live-service PC MMORPG and the broadest part of the MapleStory family',
    sourceStrategy: 'Official announcements are treated as the source of record, while guides and tools are used to explain mechanics or support planning. Regional terminology, dates, balance values, and availability are never assumed to be interchangeable.',
    updateFocus: 'major update names, new progression systems, class changes, bosses, limited events, known issues, maintenance windows, and reward deadlines',
    risingSearches: [
      { phrase: 'mystic frontier maplestory' },
      { phrase: 'maplestory first adversary' },
      { phrase: 'maplestory sol hecate' },
      { phrase: 'maplestory malefic star' },
      { phrase: 'maplestory astra secondary', momentum: '+3,350%' },
      { phrase: 'plasma heart maplestory', momentum: '+4,900% in an earlier captured snapshot' },
    ],
    relatedSearches: ['MapleStory patch notes', 'MapleStory class guide', 'MapleStory events', 'MapleStory boss guide'],
  },
  'maplestory-classic': {
    audience: 'players following the officially announced Global MapleStory Classic World tests, returning players comparing the classic ruleset with modern MapleStory, and applicants checking access requirements',
    coreSystems: 'test registration, eligibility, client access, test schedules, classic progression, world rules, official announcements, and changes between test phases',
    decisions: 'whether registration is open, which official test is being discussed, what access steps are required, when a test begins or ends, and which details are confirmed instead of community speculation',
    officialSourceLabel: 'Nexon Classic World',
    officialSourceUrl: 'https://www.nexon.com/maplestory/news/general/42364/sign-up-for-global-maple-story-classic-world-closed-online-test-2',
    positioning: 'the official Classic World testing track for players interested in an earlier-style MapleStory experience',
    sourceStrategy: 'Test pages and Nexon announcements are the only authority for registration, eligibility, dates, regions, downloads, and access. Unofficial private servers and similarly named projects are excluded from this guide.',
    updateFocus: 'closed beta and online test announcements, sign-up windows, participant selection, supported regions, client instructions, test changes, and official follow-up notices',
    risingSearches: [
      { phrase: 'maplestory closed beta' },
      { phrase: 'maplestory classic beta' },
      { phrase: 'maplestory beta sign up', momentum: '+3,700%' },
      { phrase: 'maplestory classic world', momentum: '+700% in an earlier captured snapshot' },
    ],
    relatedSearches: ['MapleStory Classic World test', 'MapleStory Classic registration', 'MapleStory Classic official'],
  },
  'maplestory-m': {
    audience: 'mobile players managing daily progression, returning players catching up on system changes, and regional players comparing the Global, Korean, Japanese, Taiwanese, and Southeast Asian services',
    coreSystems: 'mobile classes, auto-battle, growth missions, equipment, Star Force fields, bosses, guilds, events, shops, patch notes, maintenance, and account-specific progression',
    decisions: 'which character to build, how to spend limited daily resources, what an update changed, which event rewards fit the account, and whether instructions match the selected mobile service',
    officialSourceLabel: 'MapleStory M Official Forum',
    officialSourceUrl: 'https://forum.nexon.com/MapleStoryMGlobal/main/',
    positioning: 'the mobile MMORPG branch with its own progression rhythm, events, interfaces, and regional update schedules',
    sourceStrategy: 'Official forum notices and in-game guides are prioritized for mechanics, schedules, known issues, and package details. Advice is labeled by service because PC MapleStory values and another mobile region may not apply.',
    updateFocus: 'mobile patch notes, class and skill adjustments, growth events, Star Force improvements, boss content, guild seasons, maintenance, known issues, and shop rotations',
    risingSearches: [],
    relatedSearches: ['MapleStory M guide', 'MapleStory M patch notes', 'MapleStory M classes', 'MapleStory M events', 'MapleStory M beginner guide'],
  },
  'maplestory-n': {
    audience: 'players researching the official MapleStory Universe title, new users learning its web services, and active players checking update notes, events, rankings, probability information, or marketplace documentation',
    coreSystems: 'character progression, update notes, events, V Tracker missions, rankings, probability information, dynamic pricing, marketplace access, account support, and official documentation',
    decisions: 'where to find the current rule, which web tool is official, what an event requires, whether an update affects progression, and how game and web services connect',
    officialSourceLabel: 'MapleStory N Documentation',
    officialSourceUrl: 'https://docs.maplestoryn.io/',
    positioning: 'the MapleStory Universe PC title supported by official game, web, documentation, ranking, and marketplace services',
    sourceStrategy: 'The official documentation and MapleStory Universe properties are used for rules, updates, event requirements, web features, and support. Economic or marketplace claims are not inferred beyond the published documentation.',
    updateFocus: 'official launch guidance, patch notes, notices, event missions, V Tracker objectives, ranking services, probability information, dynamic pricing, and marketplace changes',
    risingSearches: [],
    relatedSearches: ['MapleStory N guide', 'MapleStory N updates', 'MapleStory N events', 'MapleStory N documentation', 'MapleStory N ranking'],
  },
  'maplestory-worlds': {
    audience: 'players discovering official worlds, creators building and localizing experiences, and teams monitoring platform maintenance, policies, creator campaigns, and performance guidance',
    coreSystems: 'world discovery, creator tools, scripting, assets, localization, performance analysis, publishing, platform maintenance, policies, creator events, and community activity',
    decisions: 'which official world or creator resource to open, how to improve a project, what a maintenance notice affects, which policy applies, and whether an event targets players or creators',
    officialSourceLabel: 'MapleStory Worlds',
    officialSourceUrl: 'https://maplestoryworlds.nexon.com/en',
    positioning: 'the official Nexon platform where players explore user-created worlds and creators build experiences with MapleStory-inspired assets and systems',
    sourceStrategy: 'Platform pages and the Creator Center are kept separate but connected. Product discovery information comes from MapleStory Worlds, while development, policy, maintenance, and optimization details come from creator documentation.',
    updateFocus: 'platform maintenance, creator tool changes, publishing policies, localization guidance, performance analysis, Global Creator Challenge announcements, and world discovery',
    risingSearches: [],
    relatedSearches: ['MapleStory Worlds guide', 'MapleStory Worlds creator', 'MapleStory Worlds PC', 'MapleStory Worlds localization', 'MapleStory Worlds Creator Center'],
  },
  'maplestory-idle': {
    audience: 'idle RPG players planning account growth, new players looking for official redemption instructions, and returning players comparing jobs, chapters, companions, artifacts, events, and reset schedules',
    coreSystems: 'idle progression, jobs, equipment, companions, artifacts, chapters, Party Quests, guild seasons, events, attendance rewards, coupons, reset times, patch notes, and developer plans',
    decisions: 'which growth system to prioritize, when a server resets, whether a coupon is still valid, how to redeem it safely, which class guidance is current, and what changed in the latest patch',
    officialSourceLabel: 'MapleStory: Idle RPG Official Forum',
    officialSourceUrl: 'https://forum.nexon.com/maplestoryidle/main',
    positioning: 'the official mobile idle RPG branch with server-based resets, automated progression, active events, and its own class and content roadmap',
    sourceStrategy: 'Official notices are used for coupon availability, redemption steps, server times, job updates, balance changes, and event dates. Expired codes are never presented as active, and third-party code lists are treated as leads rather than proof.',
    updateFocus: 'new jobs, chapter extensions, progression improvements, attendance, Burning Field, Party Quest changes, guild seasons, developer plans, coupon notices, and server reset information',
    risingSearches: [
      { phrase: 'maplestory idle coupon' },
      { phrase: 'maplestory idle code', momentum: '+3,600% in an earlier captured snapshot' },
      { phrase: 'maplestory idle rpg coupon code', momentum: '+3,300% in an earlier captured snapshot' },
      { phrase: 'maplestory idle rpg tier list', momentum: '+2,800% in an earlier captured snapshot' },
      { phrase: 'maplestory idle rpg release date', momentum: '+2,800% in an earlier captured snapshot' },
      { phrase: 'maplestory idle best class', momentum: '+1,550% in an earlier captured snapshot' },
    ],
    relatedSearches: ['MapleStory Idle patch notes', 'MapleStory Idle server reset', 'MapleStory Idle beginner guide'],
  },
};

const editionGuidance: Record<GameVersion, {
  audienceNote: string;
  comparisonNote: string;
  sourceNote: string;
}> = {
  gms: {
    audienceNote: 'This edition view is organized for the Global service and uses Global terminology wherever an official product page supplies it.',
    comparisonNote: 'GMS dates, maintenance windows, reward lists, and balance values should be checked against the Global notice even when a similarly named KMS feature appeared earlier.',
    sourceNote: 'Start with the product’s Global official page, then use regional announcements and known-issue posts to resolve timing or eligibility.',
  },
  kms: {
    audienceNote: 'This edition view is organized for the Korean service, where announcements and feature names may appear before other regional releases.',
    comparisonNote: 'KMS information can explain the origin of a system, but it is not a release promise for GMS, JMS, TMS, or MSEA. Translation and localization can also change names.',
    sourceNote: 'Use Korean official notices as the authority for KMS dates and mechanics; use another region’s official notice only when comparing rollout history.',
  },
  jms: {
    audienceNote: 'This edition view is organized for the Japanese service and keeps Japanese announcements, campaigns, and schedules distinct from Global or Korean coverage.',
    comparisonNote: 'JMS collaborations, rewards, shop items, and maintenance times can be region-specific, so a matching feature name does not guarantee matching content.',
    sourceNote: 'Verify Japanese service details through the official JMS notice categories before following a translated guide or cross-region summary.',
  },
  tms: {
    audienceNote: 'This edition view is organized for the Taiwan service and emphasizes Traditional Chinese terminology, local event timing, and Beanfun notices.',
    comparisonNote: 'TMS event rules, probability disclosures, bundles, and progression values may differ from other services even when artwork or update themes look similar.',
    sourceNote: 'Use the official Taiwan product and campaign pages for schedules, eligibility, item names, and service-specific conditions.',
  },
  msea: {
    audienceNote: 'This edition view is organized for the Southeast Asian service and separates MapleStorySEA announcements from Global MapleStory coverage.',
    comparisonNote: 'MSEA patches, maintenance windows, events, and reward tables may use their own sequence and terminology; GMS dates are not a substitute.',
    sourceNote: 'Use MapleStorySEA news and event pages as the authority for this edition, then compare other regions only for context.',
  },
};

const buildSections = (
  seriesName: string,
  definition: SeriesDefinition,
  version: GameVersion,
  editionLabel: string,
  region: string,
  timeZone: string,
): LandingSection[] => {
  const edition = editionGuidance[version];
  return [
    {
      id: 'orientation',
      eyebrow: 'Start with the right edition',
      title: `${seriesName} ${editionLabel} overview`,
      paragraphs: [
        `${seriesName} is ${definition.positioning}. This page is a practical entry point for ${definition.audience}. Instead of mixing every MapleStory product into one stream, it keeps the ${editionLabel} context visible from the headline through the source links. That matters because the same phrase can refer to a different game, service, test, platform, or update. The aim is to help a visitor identify the correct product first, understand what can be verified, and then move to the most useful news, guide, event, or tool page without repeating the search elsewhere.`,
        `${edition.audienceNote} The selected region is ${region}, and the reference time zone is ${timeZone}. Those labels are not decorative metadata: they determine how maintenance notices, daily resets, event deadlines, and official URLs should be interpreted. A search result that simply says “MapleStory update” can be technically accurate yet useless for the wrong edition. MPStorys therefore treats product, server, language, publication date, and canonical source as separate checks before presenting a conclusion.`,
      ],
      bullets: [
        `Coverage focus: ${definition.coreSystems}.`,
        `Typical decisions: ${definition.decisions}.`,
        `Primary audience: ${definition.audience}.`,
      ],
    },
    {
      id: 'coverage',
      eyebrow: 'Useful coverage, not keyword filler',
      title: `What this ${editionLabel} hub helps you decide`,
      paragraphs: [
        `The useful question is rarely just “what is ${seriesName}?” A player usually needs to decide what to do next. This hub is structured around ${definition.decisions}. Each content card should answer a concrete intent, name the edition it applies to, and link to the exact source or detailed page. That structure supports search discovery because the important phrases appear in explanatory context, but it also protects readability: a term is used when it resolves a player problem, not repeated simply to raise a density score.`,
      ],
    },
    {
      id: 'updates',
      eyebrow: 'Follow changes safely',
      title: `${seriesName} news, updates, events, and patch notes`,
      paragraphs: [
        `A dependable update workflow begins with the source of record. For this product, the monitoring focus includes ${definition.updateFocus}. A concise summary can make a long notice easier to scan, but the summary should retain the canonical URL, publication time, applicable edition, and any stated window. If a notice is revised, the newer revision must be distinguishable from the earlier copy. This is especially important when a maintenance extension, corrected reward, known issue, or eligibility clarification changes what a player should do.`,
        `${definition.sourceStrategy} ${edition.sourceNote} The safest reading order is title, date, edition, status, requirements, reward or system details, then exceptions. Screenshots, social posts, and community comments can help discover a topic, but they do not replace an official notice. When an announcement is ambiguous, the responsible answer is to show the uncertainty and keep the source close rather than turn a plausible interpretation into a fact.`,
      ],
      bullets: [
        'Check the publication date and last-updated state before using any schedule.',
        `Convert times from ${timeZone} only after confirming the notice belongs to ${editionLabel}.`,
        'Treat an expired event or coupon as historical information, not a current recommendation.',
        'Recheck known-issue and maintenance pages after the original announcement.',
      ],
    },
    {
      id: 'regional',
      eyebrow: 'Regional context',
      title: `How ${editionLabel} differs from other MapleStory services`,
      paragraphs: [
        `${edition.comparisonNote} Cross-region research is still valuable when it is labeled correctly. It can show the history of a feature, reveal vocabulary that players may search, and help readers prepare questions before an official local announcement. It cannot establish a local release date, reward table, class balance, monetization detail, or participation rule. This page uses the edition label beside the product name so that search engines and readers receive the same scope signal.`,
      ],
    },
    {
      id: 'trends',
      eyebrow: 'Search demand with editorial control',
      title: `MapleStory search trends and rising questions`,
      paragraphs: [
        `Google Trends is useful for detecting what players have begun asking, but a rising query is not automatically a trustworthy topic. The MapleStory snapshot checked on ${TRENDS_SNAPSHOT_DATE} highlighted product updates, Classic testing, and Idle RPG questions. MPStorys maps a phrase only to the series it can support with reliable sources. The private-server query “chronostory” and the unrelated comparison term “gpts” are deliberately excluded. This prevents trend chasing from weakening the lawful, official-series focus of the site.`,
        `The phrases shown below are editorial prompts, not a block of text to repeat. A phrase such as “maplestory idle coupon” calls for an answer about official availability, expiration, and redemption safety. “maplestory classic beta” calls for the official test page, registration state, eligibility, and schedule. Update names such as “mystic frontier maplestory” call for a dated announcement, requirements, and a clear server label. Each resulting page should satisfy that intent once, use close variants naturally, and link to evidence.`,
      ],
    },
    {
      id: 'verification',
      eyebrow: 'A repeatable trust process',
      title: `How MPStorys verifies ${seriesName} information`,
      paragraphs: [
        `Verification starts with the exact page, not a domain homepage or a search snippet. The editor confirms that the URL names the correct product and function, records the canonical source, and checks whether the page is an announcement, guide, event, patch note, maintenance notice, tool, or general entry point. Duplicates are resolved by URL and purpose. A useful calculator receives its own record; a dated announcement becomes content rather than a generic resource. This keeps navigation precise and preserves independently addressable information.`,
      ],
    },
  ];
};

const buildFaq = (
  seriesName: string,
  definition: SeriesDefinition,
  editionLabel: string,
  region: string,
  timeZone: string,
): LandingFaq[] => [
  {
    question: `Is this ${seriesName} page specific to ${editionLabel}?`,
    answer: `Yes. The page is generated for ${editionLabel} and labels its regional context as ${region}. Some explanatory material is useful across services, but dates, rewards, balance values, access, and official links must be verified for this edition before you act.`,
  },
  {
    question: `Where should I check the latest ${seriesName} update?`,
    answer: `Open the News or Upcoming Updates section, check the publication date, and follow the canonical official link. The main monitoring areas are ${definition.updateFocus}. A community summary can help with orientation, but the official notice remains the source of record.`,
  },
  {
    question: `What time zone does this ${editionLabel} guide use?`,
    answer: `The edition reference is ${timeZone}. An individual announcement can state a different display convention, so always use the time zone printed in that notice. Convert the time only after confirming that the announcement applies to ${editionLabel}.`,
  },
  {
    question: 'How are Google Trends keywords used on this page?',
    answer: `They are used to identify real questions that deserve a sourced answer. The snapshot was checked on ${TRENDS_SNAPSHOT_DATE}. Phrases are assigned to the relevant official series, explained in natural language, and rejected when they point to unrelated or prohibited material. Trends do not prove that a claim is true.`,
  },
  {
    question: `Can I use a guide written for another ${seriesName} region?`,
    answer: `Use it for background only until the local service confirms the same mechanic. Interface names, release order, event rules, numerical values, shops, and schedules can differ. The edition badge and source URL are the quickest checks before following detailed instructions.`,
  },
  {
    question: 'Why does MPStorys link out instead of copying every official page?',
    answer: 'Exact links let readers verify the current source and respect publisher terms. MPStorys stores structured metadata and concise summaries by default, preserves historical records, and publishes full source text only when permission is explicit. This also reduces the risk of an outdated copy outranking a corrected official notice.',
  },
];

const buildWorkflow = (
  seriesName: string,
  editionLabel: string,
): SeriesLandingProfile['workflow'] => [
  {
    title: 'Choose the product and edition',
    body: `Confirm that the page says ${seriesName} and ${editionLabel}. Similar MapleStory names can lead to a different game, platform, test, or regional service.`,
  },
  {
    title: 'Match the page to your task',
    body: 'Use News for announcements, Guides for mechanics, Events for dated participation rules, and Tools for calculations or lookups. One page should answer one primary intent.',
  },
  {
    title: 'Check date, status, and source',
    body: 'Read the publication date, event window, edition label, and canonical URL. Recheck maintenance or known-issue notices when timing can change.',
  },
  {
    title: 'Act, save, and revisit',
    body: 'Follow the exact official instructions, save the useful page, and return after revisions. Do not rely on a screenshot or a copied code after its validity window.',
  },
];

export const getSeriesLandingProfile = (
  seriesId: string | undefined,
  version: GameVersion,
): SeriesLandingProfile | undefined => {
  if (!seriesId) return undefined;
  const definition = seriesDefinitions[seriesId];
  const product = getSeriesProduct(seriesId);
  if (!definition || !product) return undefined;
  if (!getSeriesVersions(seriesId).some((item) => item.id === version)) return undefined;

  const editionLabel = getSeriesVersionShortLabel(seriesId, version);
  const versionDefinition = getVersionDefinition(version);
  const searchIntents: LandingSearchIntent[] = [
    ...definition.risingSearches.map((item) => ({
      ...item,
      signal: 'Google Trends rising' as const,
    })),
    ...definition.relatedSearches.map((phrase) => ({
      phrase,
      signal: 'Related search intent' as const,
    })),
  ];

  return {
    benefits: [
      {
        title: 'Edition-aware answers',
        body: `Every decision is framed for ${editionLabel}, ${versionDefinition.region}, with ${versionDefinition.timeZone} shown before schedules and resets are interpreted.`,
      },
      {
        title: 'Exact source routes',
        body: `News, guides, events, and tools lead to independently useful records and their canonical sources instead of sending every question to a generic homepage.`,
      },
      {
        title: 'Trend-led, source-backed',
        body: 'Rising search demand helps prioritize explanations, while official evidence and editorial exclusions determine what can actually be published.',
      },
    ],
    deck: `A server-specific ${product.name} landing guide for ${versionDefinition.region}: official sources, update checks, useful tools, regional cautions, and rising player questions in one SSR page.`,
    editionLabel,
    faq: buildFaq(
      product.name,
      definition,
      editionLabel,
      versionDefinition.region,
      versionDefinition.timeZone,
    ),
    officialSources: [
      { label: definition.officialSourceLabel, url: definition.officialSourceUrl },
      { label: 'Google Trends: MapleStory', url: MAPLESTORY_TRENDS_URL },
    ],
    region: versionDefinition.region,
    searchIntents,
    sections: buildSections(
      product.name,
      definition,
      version,
      editionLabel,
      versionDefinition.region,
      versionDefinition.timeZone,
    ),
    seriesId,
    seriesName: product.name,
    snapshotDate: TRENDS_SNAPSHOT_DATE,
    timeZone: versionDefinition.timeZone,
    title: `${product.name} ${editionLabel} guide, news, events, and tools`,
    version,
    workflow: buildWorkflow(product.name, editionLabel),
  };
};

export const getSeriesLandingPlainText = (profile: SeriesLandingProfile) => [
  profile.title,
  profile.deck,
  ...profile.benefits.flatMap((benefit) => [benefit.title, benefit.body]),
  ...profile.sections.flatMap((section) => [
    section.eyebrow,
    section.title,
    ...section.paragraphs,
    ...(section.bullets || []),
  ]),
  ...profile.workflow.flatMap((step) => [step.title, step.body]),
  ...profile.searchIntents.flatMap((intent) => [intent.phrase, intent.signal, intent.momentum || '']),
  ...profile.faq.flatMap((item) => [item.question, item.answer]),
].join(' ');

export const getSeriesLandingKeywords = (profile: SeriesLandingProfile) => [
  profile.seriesName,
  `${profile.seriesName} ${profile.editionLabel}`,
  `${profile.seriesName} guide`,
  `${profile.seriesName} news`,
  `${profile.seriesName} events`,
  `${profile.seriesName} tools`,
  ...profile.searchIntents.map((intent) => intent.phrase),
];
