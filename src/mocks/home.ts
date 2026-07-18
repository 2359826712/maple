export const newsTicker = [];

export const heroStats = [];

export const quickTools = [
  {
    key: 'char',
    titleKey: 'tools_char_title',
    descKey: 'tools_char_desc',
    icon: 'ri-search-eye-line',
    tint: 'primary' as const,
    href: '/mapler-house#char-lookup',
    tag: 'Live',
    dataLabelKey: 'tools_data_official_feed',
    versions: ['gms', 'kms', 'msea', 'jms', 'tms'],
  },
  {
    key: 'starforce',
    titleKey: 'tools_starforce_title',
    descKey: 'tools_starforce_desc',
    icon: 'ri-star-smile-line',
    tint: 'secondary' as const,
    href: '/mapler-house#enhance',
    tag: 'Simulator',
    dataLabelKey: 'tools_data_estimate',
    versions: ['gms', 'kms', 'msea', 'jms', 'tms'],
  },
  {
    key: 'cube',
    titleKey: 'tools_cube_title',
    descKey: 'tools_cube_desc',
    icon: 'ri-dice-line',
    tint: 'accent' as const,
    href: '/mapler-house#enhance',
    tag: 'Simulator',
    dataLabelKey: 'tools_data_estimate',
    versions: ['gms', 'kms', 'msea', 'jms', 'tms'],
  },
  {
    key: 'ranking',
    titleKey: 'tools_ranking_title',
    descKey: 'tools_ranking_desc',
    icon: 'ri-trophy-line',
    tint: 'primary' as const,
    href: '/rankings',
    tag: 'Live',
    dataLabelKey: 'tools_data_official_feed',
    versions: ['gms', 'kms', 'msea', 'jms'],
  },
  {
    key: 'mapler',
    titleKey: 'tools_mapler_title',
    descKey: 'tools_mapler_desc',
    icon: 'ri-home-heart-line',
    tint: 'accent' as const,
    href: '/mapler-house#dashboard',
    tag: 'Tools',
    dataLabelKey: 'tools_data_local_planner',
    versions: ['gms', 'kms', 'jms', 'tms'],
  },
];

export const dailyHubs = [
  {
    href: '/mapler-house#char-lookup',
    icon: 'ri-search-eye-line',
    titleKey: 'hub_char_lookup',
    descKey: 'hub_char_lookup_desc',
    tint: 'primary' as const,
    actionKey: 'hub_char_lookup_action',
  },
  {
    href: '/checklist',
    icon: 'ri-checkbox-circle-line',
    titleKey: 'hub_daily_tasks',
    descKey: 'hub_daily_tasks_desc',
    tint: 'accent' as const,
    actionKey: 'hub_daily_tasks_action',
  },
  {
    href: '/wiki/boss',
    icon: 'ri-skull-2-line',
    titleKey: 'hub_boss_guide',
    descKey: 'hub_boss_guide_desc',
    tint: 'secondary' as const,
    actionKey: 'hub_boss_guide_action',
  },
];

export const latestNews = [];

export const trendingGuides = [];

export const upcomingEvents = [];

export const videoCards = [
  {
    id: 'v1',
    title: 'GO WEST! Official Trailer - MapleStory',
    channel: 'MapleStory',
    duration: 'Official trailer',
    views: 'YouTube',
    sourceLabel: 'Official YouTube',
    youtubeId: 'lRq6L98CgMU',
    sourceUrl: 'https://www.youtube.com/watch?v=lRq6L98CgMU',
    versions: ['gms'],
    thumb: '/static/images/vendor/i.ytimg.com/lRq6L98CgMU-mqdefault.jpg',
  },
  {
    id: 'v2',
    title: 'New Age - 6th Job Skills Trailer | MapleStory',
    channel: 'MapleStory',
    duration: 'Official trailer',
    views: 'YouTube',
    sourceLabel: 'Official YouTube',
    youtubeId: 'vfKP8EaAkvE',
    sourceUrl: 'https://www.youtube.com/watch?v=vfKP8EaAkvE',
    versions: ['gms', 'kms'],
    thumb: '/static/images/vendor/i.ytimg.com/vfKP8EaAkvE-mqdefault.jpg',
  },
  {
    id: 'v3',
    title: '6th Job Ascent Skills | Coming December 17 | MapleStory',
    channel: 'MapleStory',
    duration: 'Official trailer',
    views: 'YouTube',
    sourceLabel: 'Official YouTube',
    youtubeId: 'Y5MXB60M_KQ',
    sourceUrl: 'https://www.youtube.com/watch?v=Y5MXB60M_KQ',
    versions: ['gms'],
    thumb: '/static/images/vendor/i.ytimg.com/Y5MXB60M_KQ-mqdefault.jpg',
  },
  {
    id: 'v4',
    title: 'Lynn The Reborn Forest Child | MapleStory',
    channel: 'MapleStory',
    duration: 'Official trailer',
    views: 'YouTube',
    sourceLabel: 'Official YouTube',
    youtubeId: 'jrNaGRDfg6k',
    sourceUrl: 'https://www.youtube.com/watch?v=jrNaGRDfg6k',
    versions: ['gms'],
    thumb: '/static/images/vendor/i.ytimg.com/jrNaGRDfg6k-mqdefault.jpg',
  },
  {
    id: 'v5',
    title: 'MapleStory | Epic Dungeon: High Mountain',
    channel: 'MapleStory',
    duration: 'Official trailer',
    views: 'YouTube',
    sourceLabel: 'Official YouTube',
    youtubeId: 'CvcQKSz1kOY',
    sourceUrl: 'https://www.youtube.com/watch?v=CvcQKSz1kOY',
    versions: ['gms', 'kms'],
    thumb: '/static/images/vendor/i.ytimg.com/CvcQKSz1kOY-mqdefault.jpg',
  },
];

export const rankingBoard = [
  {
    rank: 1,
    name: 'AuroraKain',
    class: 'Kain',
    world: 'Bera',
    level: 292,
    legion: 12480,
    trend: 'up' as const,
    delta: 2,
  },
  {
    rank: 2,
    name: 'LumiHaste',
    class: 'Hoyoung',
    world: 'Scania',
    level: 291,
    legion: 12190,
    trend: 'up' as const,
    delta: 1,
  },
  {
    rank: 3,
    name: 'ForestGaze',
    class: 'Wind Archer',
    world: 'Kronos',
    level: 289,
    legion: 11840,
    trend: 'down' as const,
    delta: 2,
  },
  {
    rank: 4,
    name: 'RiverKanna',
    class: 'Kanna',
    world: 'Hyperion',
    level: 287,
    legion: 11510,
    trend: 'flat' as const,
    delta: 0,
  },
  {
    rank: 5,
    name: 'CedarBlade',
    class: 'Hayato',
    world: 'Bera',
    level: 286,
    legion: 11360,
    trend: 'up' as const,
    delta: 4,
  },
  {
    rank: 6,
    name: 'GlacialMoon',
    class: 'Ice/Lightning',
    world: 'Scania',
    level: 285,
    legion: 11190,
    trend: 'up' as const,
    delta: 1,
  },
  {
    rank: 7,
    name: 'EmberNova',
    class: 'Adele',
    world: 'Kronos',
    level: 284,
    legion: 11080,
    trend: 'down' as const,
    delta: 1,
  },
];

export const communityHighlights = [
  {
    id: 'c1',
    user: 'PeachyMule',
    avatar:
      '/static/images/readdy/maple-avatar-peachy.jpg',
    title: 'Finally hit 30★ on Arcane fair umbrella — 118 stars total',
    tag: 'Screenshot',
    reactions: 402,
    replies: 89,
  },
  {
    id: 'c2',
    user: 'CoffeeArchmage',
    avatar:
      '/static/images/readdy/maple-avatar-coffee.jpg',
    title: 'Kalos hard practice pug — recruiting Hayato & Kanna mules',
    tag: 'Party Recruit',
    reactions: 217,
    replies: 46,
  },
  {
    id: 'c3',
    user: 'MapleTeaHouse',
    avatar:
      '/static/images/readdy/maple-avatar-tea.jpg',
    title: 'Mapler House gallery — the cozy library build (blueprint inside)',
    tag: 'Build',
    reactions: 512,
    replies: 132,
  },
];

export const toolShowcase = [
  {
    name: 'Mapler House Planner',
    detail: 'Drag-and-drop your dream home. Share blueprints with a single link.',
    icon: 'ri-home-4-line',
    versions: ['gms', 'kms', 'msea', 'jms', 'tms'],
  },
  {
    name: 'Boss Crystal Tracker',
    detail: 'Crystal tracker with mesos value per world and daily reset.',
    icon: 'ri-shield-flash-line',
    versions: ['gms', 'msea'],
  },
  {
    name: 'Legion Optimizer',
    detail: 'Best board layout by attacker, buff, or damage-taken profile.',
    icon: 'ri-layout-grid-line',
    versions: ['gms', 'kms', 'msea', 'jms', 'tms'],
  },
  {
    name: 'Nodestone Simulator',
    detail: 'Skill node crafting probability, per-class recommended trios.',
    icon: 'ri-stack-line',
    versions: ['gms', 'kms', 'msea', 'jms', 'tms'],
  },
  {
    name: 'Hyper Stat Calculator',
    detail: 'Point-by-point stat comparison for Interactive and Heroic worlds.',
    icon: 'ri-bar-chart-2-line',
    versions: ['gms', 'kms', 'msea', 'jms'],
  },
  {
    name: 'Familiar Damage Sim',
    detail: 'GMS-exclusive Familiar setup checker with badge combo preview.',
    icon: 'ri-flashlight-line',
    versions: ['gms'],
  },
];

export const notifications = [
  {
    id: 'nt1',
    icon: 'ri-notification-2-line' as const,
    text: 'Kalos party you followed just filled up — check the recruit tab',
    when: '2m ago',
    color: 'primary' as const,
  },
  {
    id: 'nt2',
    icon: 'ri-star-line' as const,
    text: 'BadgeCraft dropped a new Familiar guide you might like',
    when: '18m ago',
    color: 'accent' as const,
  },
  {
    id: 'nt3',
    icon: 'ri-gift-line' as const,
    text: 'Marvel Machine window opens in 13 days — set a reminder',
    when: '1h ago',
    color: 'secondary' as const,
  },
  {
    id: 'nt4',
    icon: 'ri-message-3-line' as const,
    text: 'CoffeeArchmage replied to your Kalos progression thread',
    when: '3h ago',
    color: 'primary' as const,
  },
];

export const wikiCategories = [
  { name: 'Classes', count: 46, icon: 'ri-sword-line' },
  { name: 'Locations', count: 574, icon: 'ri-map-pin-line' },
  { name: 'Monsters', count: 1200, icon: 'ri-skull-2-line' },
  { name: 'Bosses', count: 38, icon: 'ri-ghost-2-line' },
  { name: 'NPCs', count: 900, icon: 'ri-chat-quote-line' },
  { name: 'Quests', count: 790, icon: 'ri-scroll-line' },
  { name: 'Items', count: 812, icon: 'ri-shield-star-line' },
  { name: 'Updates', count: 80, icon: 'ri-refresh-line' },
  { name: 'Content', count: 92, icon: 'ri-book-2-line' },
  { name: 'Other', count: 120, icon: 'ri-more-line' },
];

export const recommendations = [
  {
    kind: 'Guide',
    title: 'Because you play Kanna — 6th job node priority',
    icon: 'ri-book-2-line',
    tint: 'primary' as const,
  },
  {
    kind: 'Event',
    title: 'Sunny Sunday hours in your timezone (PDT)',
    icon: 'ri-calendar-check-line',
    tint: 'accent' as const,
  },
  {
    kind: 'Wiki',
    title: 'Familiar badge combos meta rebalanced this week',
    icon: 'ri-database-2-line',
    tint: 'secondary' as const,
  },
  {
    kind: 'Video',
    title: 'Watch: Heroic vs Interactive 2026 comparison',
    icon: 'ri-play-circle-line',
    tint: 'primary' as const,
  },
];

export const themePresets = [
  { key: 'cream', nameKey: 'theme_cream', color: 'oklch(0.99 0.008 85)', ring: 'oklch(0.67 0.2 38)' },
  { key: 'mint', nameKey: 'theme_mint', color: 'oklch(0.97 0.02 165)', ring: 'oklch(0.63 0.14 164)' },
  { key: 'sunset', nameKey: 'theme_sunset', color: 'oklch(0.96 0.04 55)', ring: 'oklch(0.58 0.2 36)' },
  { key: 'sand', nameKey: 'theme_sand', color: 'oklch(0.97 0.04 90)', ring: 'oklch(0.74 0.17 78)' },
];
