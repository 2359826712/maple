import type { Region, ToolDataRecord } from '@/domain/contentSchemas';

export type CommunityToolCategory =
  | 'calculator'
  | 'database'
  | 'guide'
  | 'tracker'
  | 'simulator'
  | 'utility'
  | 'community';

export interface CommunityTool extends Omit<ToolDataRecord, 'category'> {
  category: CommunityToolCategory;
  description: string;
  descriptionZh: string;
  categoryZh: string;
  platforms: string[];
  isFree: boolean;
  isActive: boolean;
  icon: string;
  regions: Region[];
}

const verified = '2026-07-11T00:00:00.000Z';

/**
 * Curated links only. Every entry must pass `npm run check:tool-links` before
 * merge; speculative or unreachable tools belong in the correction log, not
 * in the player-facing registry.
 */
export const communityTools: CommunityTool[] = [
  {
    id: 'maplestory-io',
    name: 'MapleStory.IO',
    description: 'Browse MapleStory resources and use the public API for items, skills, maps, monsters, quests, and character rendering.',
    descriptionZh: '浏览冒险岛道具、技能、地图、怪物和任务资源，并使用公开 API 与角色渲染工具。',
    href: 'https://maplestory.io',
    category: 'database',
    categoryZh: '数据库',
    platforms: ['Web', 'API'],
    isFree: true,
    isActive: true,
    icon: 'ri-database-2-line',
    regions: ['all'],
    source: 'MapleStory.IO',
    sourceUrl: 'https://maplestory.io',
    lastVerified: verified,
  },
  {
    id: 'mapletodo',
    name: 'MapleTodo',
    description: 'Track daily, weekly, and monthly MapleStory tasks across characters, with optional account sync and event task templates.',
    descriptionZh: '跨角色追踪每日、每周和每月任务，并可选择账户同步和活动任务模板。',
    href: 'https://mapletodo.com',
    category: 'tracker',
    categoryZh: '追踪器',
    platforms: ['Web'],
    isFree: true,
    isActive: true,
    icon: 'ri-checkbox-circle-line',
    regions: ['gms'],
    source: 'MapleTodo',
    sourceUrl: 'https://mapletodo.com',
    lastVerified: verified,
  },
  {
    id: 'mapleranks',
    name: 'MapleRanks',
    description: 'Look up Global MapleStory characters and compare public ranking information.',
    descriptionZh: '查询国际服冒险岛角色并比较公开排名信息。',
    href: 'https://mapleranks.com',
    category: 'tracker',
    categoryZh: '追踪器',
    platforms: ['Web', 'Discord'],
    isFree: true,
    isActive: true,
    icon: 'ri-trophy-line',
    regions: ['gms'],
    source: 'MapleRanks',
    sourceUrl: 'https://mapleranks.com',
    lastVerified: verified,
  },
  {
    id: 'grandis-library',
    name: 'Grandis Library',
    description: 'Read class-focused guides covering skills, progression, systems, and bossing fundamentals.',
    descriptionZh: '阅读职业技能、成长路线、游戏系统和 Boss 基础攻略。',
    href: 'https://grandislibrary.com',
    category: 'guide',
    categoryZh: '攻略',
    platforms: ['Web'],
    isFree: true,
    isActive: true,
    icon: 'ri-book-read-line',
    regions: ['gms', 'kms'],
    source: 'Grandis Library',
    sourceUrl: 'https://grandislibrary.com',
    lastVerified: verified,
  },
  {
    id: 'maple-utilities',
    name: 'Maple Utilities',
    description: 'Calculate cubing odds, Star Force costs, scrolling outcomes, and flame scores with interactive simulators.',
    descriptionZh: '计算潜能、星之力、卷轴和火花结果，并使用交互式模拟器。',
    href: 'https://mapleutil.tools',
    category: 'calculator',
    categoryZh: '计算器',
    platforms: ['Web', 'Discord'],
    isFree: true,
    isActive: true,
    icon: 'ri-calculator-line',
    regions: ['gms'],
    source: 'Maple Utilities',
    sourceUrl: 'https://mapleutil.tools',
    lastVerified: verified,
  },
  {
    id: 'mastema',
    name: 'Mastema',
    description: 'Use character search, boss and liberation planners, equipment tools, and enhancement calculators in one GMS toolkit.',
    descriptionZh: '在同一个国际服工具箱中使用角色查询、Boss 与解放规划、装备工具和强化计算器。',
    href: 'https://mastema.app',
    category: 'utility',
    categoryZh: '工具',
    platforms: ['Web'],
    isFree: true,
    isActive: true,
    icon: 'ri-tools-line',
    regions: ['gms'],
    source: 'Mastema',
    sourceUrl: 'https://mastema.app',
    lastVerified: verified,
  },
  {
    id: 'mapletools',
    name: 'MapleTools',
    description: 'Open enhancement calculators and planners for Star Force, cubing, flames, traces, and familiar potentials.',
    descriptionZh: '使用星之力、潜能、火花、痕迹和怪怪潜能的强化计算器与规划器。',
    href: 'https://www.mapletools.app/tools?group=enhance',
    category: 'calculator',
    categoryZh: '计算器',
    platforms: ['Web'],
    isFree: true,
    isActive: true,
    icon: 'ri-gamepad-line',
    regions: ['gms'],
    source: 'MapleTools',
    sourceUrl: 'https://www.mapletools.app',
    lastVerified: verified,
  },
  {
    id: 'mapledoro',
    name: 'MapleDoro',
    description: 'Use enhancement and EXP calculators, HEXA planning, buff references, and current Global MapleStory notices.',
    descriptionZh: '使用强化与经验计算器、HEXA 规划、增益参考和国际服最新公告。',
    href: 'https://www.mapledoro.com',
    category: 'utility',
    categoryZh: '工具',
    platforms: ['Web'],
    isFree: true,
    isActive: true,
    icon: 'ri-magic-line',
    regions: ['gms'],
    source: 'MapleDoro',
    sourceUrl: 'https://www.mapledoro.com',
    lastVerified: verified,
  },
];
