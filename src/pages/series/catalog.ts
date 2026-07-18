export type SeriesCategory = 'pc' | 'mobile' | 'platform';

export type SeriesProduct = {
  id: string;
  name: string;
  category: SeriesCategory;
  descriptionKey: string;
  image: string;
  platformKey: string;
  statusKey: string;
  primaryUrl: string;
  secondaryHref: string;
  secondaryLabelKey: string;
  secondaryExternal?: boolean;
  focusKey: string;
};

export const seriesProducts: SeriesProduct[] = [
  {
    id: 'maplestory-pc',
    name: 'MapleStory',
    category: 'pc',
    descriptionKey: 'series_product_pc_desc',
    image: '/launch-assets/og-style-new/mpstorys-ai-maple-town-banner.webp',
    platformKey: 'series_platform_pc',
    statusKey: 'series_status_live',
    primaryUrl: 'https://www.nexon.com/main/en/MapleStory/details',
    secondaryHref: '/news',
    secondaryLabelKey: 'series_latest_news',
    focusKey: 'series_focus_pc',
  },
  {
    id: 'maplestory-classic',
    name: 'MapleStory Classic World',
    category: 'pc',
    descriptionKey: 'series_product_classic_desc',
    image: '/static/images/vendor/d3uzjcc4cyf4cj.cloudfront.net/maple_world_select-8888b64182.webp',
    platformKey: 'series_platform_pc',
    statusKey: 'series_status_testing',
    primaryUrl: 'https://www.nexon.com/maplestory/news/general/42364/sign-up-for-global-maple-story-classic-world-closed-online-test-2',
    secondaryHref: '/news?q=Classic',
    secondaryLabelKey: 'series_related_news',
    focusKey: 'series_focus_classic',
  },
  {
    id: 'maplestory-m',
    name: 'MapleStory M',
    category: 'mobile',
    descriptionKey: 'series_product_m_desc',
    image: '/static/images/readdy/class-sia-001.jpg',
    platformKey: 'series_platform_mobile',
    statusKey: 'series_status_live',
    primaryUrl: 'https://forum.nexon.com/MapleStoryMGlobal/main/',
    secondaryHref: 'https://forum.nexon.com/MapleStoryMGlobal/board_list?board=2694',
    secondaryLabelKey: 'series_official_news',
    secondaryExternal: true,
    focusKey: 'series_focus_m',
  },
  {
    id: 'maplestory-n',
    name: 'MapleStory N',
    category: 'pc',
    descriptionKey: 'series_product_n_desc',
    image: '/static/images/series/maplestory-n.webp',
    platformKey: 'series_platform_pc',
    statusKey: 'series_status_live',
    primaryUrl: 'https://msu.io/maplestoryn',
    secondaryHref: 'https://docs.maplestoryn.io/',
    secondaryLabelKey: 'series_guides',
    secondaryExternal: true,
    focusKey: 'series_focus_n',
  },
  {
    id: 'maplestory-worlds',
    name: 'MapleStory Worlds',
    category: 'platform',
    descriptionKey: 'series_product_worlds_desc',
    image: '/static/images/series/maplestory-worlds.jpg',
    platformKey: 'series_platform_creator',
    statusKey: 'series_status_live',
    primaryUrl: 'https://maplestoryworlds.nexon.com/en/about',
    secondaryHref: 'https://maplestoryworlds-creators.nexon.com/',
    secondaryLabelKey: 'series_creator_center',
    secondaryExternal: true,
    focusKey: 'series_focus_worlds',
  },
  {
    id: 'maplestory-idle',
    name: 'MapleStory: Idle RPG',
    category: 'mobile',
    descriptionKey: 'series_product_idle_desc',
    image: '/launch-assets/og-style-new/mpstorys-og-style-forest-friend.webp',
    platformKey: 'series_platform_mobile',
    statusKey: 'series_status_live',
    primaryUrl: 'https://maplestoryidle.nexon.com/en',
    secondaryHref: 'https://forum.nexon.com/maplestoryidle/main',
    secondaryLabelKey: 'series_official_community',
    secondaryExternal: true,
    focusKey: 'series_focus_idle',
  },
];

export const getSeriesProduct = (id?: string) => seriesProducts.find((product) => product.id === id);
