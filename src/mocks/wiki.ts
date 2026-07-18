export interface WikiEntry {
  id: string;
  category: WikiCategory;
  title: string;
  titleZh: string;
  icon: string;
  tags: string[];
  tagsZh: string[];
  versions: string[];
  description: string;
  descriptionZh: string;
  content: string;
  contentZh: string;
  htmlContent?: string;
  htmlContentZh?: string;
  /** Language of the article body currently attached to this entry. */
  contentLanguage?: 'en' | 'zh' | 'zh-Hant' | 'ja' | 'ko';
  sourceKey?: 'mswiki';
  sourcePageTitle?: string;
  sources?: Array<{
    label: string;
    href: string;
  }>;
  /** ISO date string of when this entry was last synced from its upstream source. */
  lastSynced?: string;
}

export type WikiCategory =
  | 'classes'
  | 'locations'
  | 'monsters'
  | 'bosses'
  | 'npcs'
  | 'quests'
  | 'items'
  | 'updates'
  | 'content'
  | 'other';

export interface WikiCategoryInfo {
  key: WikiCategory;
  name: string;
  nameZh: string;
  icon: string;
  count: number;
  tint: string;
}

export const wikiCategoryInfos: WikiCategoryInfo[] = [
  { key: 'classes', name: 'Classes', nameZh: '职业', icon: 'ri-sword-line', count: 46, tint: 'primary' },
  { key: 'locations', name: 'Locations', nameZh: '地点', icon: 'ri-map-pin-line', count: 574, tint: 'primary' },
  { key: 'monsters', name: 'Monsters', nameZh: '怪物', icon: 'ri-skull-2-line', count: 1200, tint: 'secondary' },
  { key: 'bosses', name: 'Bosses', nameZh: 'Boss', icon: 'ri-ghost-2-line', count: 38, tint: 'accent' },
  { key: 'npcs', name: 'NPCs', nameZh: 'NPC', icon: 'ri-chat-quote-line', count: 900, tint: 'accent' },
  { key: 'quests', name: 'Quests', nameZh: '任务', icon: 'ri-scroll-line', count: 790, tint: 'primary' },
  { key: 'items', name: 'Items', nameZh: '物品', icon: 'ri-shield-star-line', count: 812, tint: 'secondary' },
  { key: 'updates', name: 'Updates', nameZh: '更新', icon: 'ri-refresh-line', count: 80, tint: 'accent' },
  { key: 'content', name: 'Content', nameZh: '内容', icon: 'ri-book-2-line', count: 92, tint: 'primary' },
  { key: 'other', name: 'Other', nameZh: '其他', icon: 'ri-more-line', count: 120, tint: 'secondary' },
];

export const wikiEntries: WikiEntry[] = [];
