import type { GameVersion } from './regionModel';

export type LinkScenario = 'bossing' | 'training' | 'farming';

export interface LinkSkillDefinition {
  id: string;
  name: string;
  nameZh: string;
  sourceClasses: string[];
  effect: string;
  effectZh: string;
  regions: GameVersion[];
  maxRank?: number;
  groupMaxRank?: number;
  scores: Record<LinkScenario, number>;
}

export interface LinkPlannerState {
  ranks: Record<string, number>;
  loadouts: Record<LinkScenario, string[]>;
}

export interface LinkRosterCharacter {
  className: string;
  level: number;
  server: string;
}

export const MAX_LINK_SLOTS = 12;
export const linkScenarios: LinkScenario[] = ['bossing', 'training', 'farming'];
const allRegions: GameVersion[] = ['gms', 'kms', 'jms', 'tms', 'msea'];
const overseasRegions: GameVersion[] = ['gms', 'jms', 'tms', 'msea'];

const skill = (
  definition: Omit<LinkSkillDefinition, 'regions'> & { regions?: GameVersion[] },
): LinkSkillDefinition => ({ ...definition, regions: definition.regions ?? allRegions });

export const linkSkillCatalog: LinkSkillDefinition[] = [
  skill({
    id: 'explorer-mage', name: 'Explorer Mage', nameZh: '冒险家法师',
    sourceClasses: ['Bishop', 'Arch Mage (I/L)', 'Arch Mage (F/P)'],
    effect: 'Stacking damage and Ignore Enemy Defense against targets you keep attacking.',
    effectZh: '持续攻击同一目标时叠加伤害与无视防御。', groupMaxRank: 6,
    scores: { bossing: 100, training: 42, farming: 45 },
  }),
  skill({
    id: 'explorer-thief', name: 'Explorer Thief', nameZh: '冒险家飞侠',
    sourceClasses: ['Night Lord', 'Shadower', 'Dual Blade'],
    effect: 'Increases damage after applying a debuff.', effectZh: '对敌人施加异常状态后提高伤害。',
    groupMaxRank: 6, scores: { bossing: 91, training: 35, farming: 42 },
  }),
  skill({
    id: 'explorer-archer', name: 'Explorer Archer', nameZh: '冒险家弓箭手',
    sourceClasses: ['Bowmaster', 'Marksman', 'Pathfinder'],
    effect: 'Critical Rate and monster collection utility.', effectZh: '提高暴击率，并提供怪物收藏相关效果。',
    groupMaxRank: 6, scores: { bossing: 72, training: 72, farming: 76 },
  }),
  skill({
    id: 'explorer-pirate', name: 'Explorer Pirate', nameZh: '冒险家海盗',
    sourceClasses: ['Buccaneer', 'Corsair', 'Cannoneer'],
    effect: 'All Stats, HP/MP, and damage-reduction utility.', effectZh: '提高全属性、HP/MP，并提供减伤能力。',
    groupMaxRank: 6, scores: { bossing: 46, training: 55, farming: 58 },
  }),
  skill({
    id: 'explorer-warrior', name: 'Explorer Warrior', nameZh: '冒险家战士',
    sourceClasses: ['Hero', 'Paladin', 'Dark Knight'],
    effect: 'Emergency healing when HP becomes low.', effectZh: '生命值较低时自动提供紧急恢复。',
    groupMaxRank: 6, scores: { bossing: 58, training: 18, farming: 20 },
  }),
  skill({
    id: 'resistance', name: 'Resistance', nameZh: '反抗者',
    sourceClasses: ['Battle Mage', 'Wild Hunter', 'Mechanic', 'Blaster'],
    effect: 'Extends invincibility after reviving.', effectZh: '复活后延长无敌时间。',
    groupMaxRank: 8, scores: { bossing: 64, training: 8, farming: 8 },
  }),
  skill({
    id: 'cygnus-knights', name: 'Cygnus Knights', nameZh: '希纳斯骑士团',
    sourceClasses: ['Dawn Warrior', 'Blaze Wizard', 'Wind Archer', 'Night Walker', 'Thunder Breaker'],
    effect: 'Attack, Magic Attack, and resistance utility.', effectZh: '提高攻击力、魔力和抗性。',
    groupMaxRank: 10, scores: { bossing: 49, training: 54, farming: 55 },
  }),
  skill({
    id: 'demon-avenger', name: 'Demon Avenger', nameZh: '恶魔复仇者', sourceClasses: ['Demon Avenger'],
    effect: 'General damage.', effectZh: '提高总伤害。', scores: { bossing: 96, training: 87, farming: 88 },
  }),
  skill({
    id: 'demon-slayer', name: 'Demon Slayer', nameZh: '恶魔猎手', sourceClasses: ['Demon Slayer'],
    effect: 'Boss Damage.', effectZh: '提高 Boss 伤害。', scores: { bossing: 99, training: 4, farming: 4 },
  }),
  skill({
    id: 'luminous', name: 'Luminous', nameZh: '夜光法师', sourceClasses: ['Luminous'],
    effect: 'Ignore Enemy Defense.', effectZh: '提高无视防御。', scores: { bossing: 97, training: 35, farming: 36 },
  }),
  skill({
    id: 'phantom', name: 'Phantom', nameZh: '幻影', sourceClasses: ['Phantom'],
    effect: 'Critical Rate.', effectZh: '提高暴击率。', scores: { bossing: 87, training: 86, farming: 90 },
  }),
  skill({
    id: 'shade', name: 'Shade', nameZh: '隐月', sourceClasses: ['Shade'],
    effect: 'A chance to survive an otherwise fatal attack.', effectZh: '受到致命攻击时有概率存活。',
    maxRank: 2, scores: { bossing: 57, training: 6, farming: 6 },
  }),
  skill({
    id: 'kinesis', name: 'Kinesis', nameZh: '超能力者', sourceClasses: ['Kinesis'],
    effect: 'Critical Damage.', effectZh: '提高暴击伤害。', scores: { bossing: 98, training: 92, farming: 94 },
  }),
  skill({
    id: 'ark', name: 'Ark', nameZh: '亚克', sourceClasses: ['Ark'],
    effect: 'Damage that builds while you remain in combat.', effectZh: '保持战斗状态时逐步提高伤害。',
    scores: { bossing: 94, training: 84, farming: 86 },
  }),
  skill({
    id: 'illium', name: 'Illium', nameZh: '伊利恩', sourceClasses: ['Illium'],
    effect: 'Damage that builds while moving.', effectZh: '移动时逐步提高伤害。', scores: { bossing: 85, training: 88, farming: 90 },
  }),
  skill({
    id: 'cadena', name: 'Cadena', nameZh: '卡德娜', sourceClasses: ['Cadena'],
    effect: 'Damage against lower-level or debuffed enemies.', effectZh: '对等级较低或带有异常状态的敌人提高伤害。',
    scores: { bossing: 89, training: 80, farming: 82 },
  }),
  skill({
    id: 'hoyoung', name: 'Hoyoung', nameZh: '虎影', sourceClasses: ['Hoyoung'],
    effect: 'Ignore Enemy Defense and stronger first hits against full-HP enemies.',
    effectZh: '提高无视防御，并强化对满血敌人的首次攻击。', scores: { bossing: 78, training: 94, farming: 95 },
  }),
  skill({
    id: 'lara', name: 'Lara', nameZh: '菈菈', sourceClasses: ['Lara'],
    effect: 'Normal Monster Damage.', effectZh: '提高普通怪物伤害。', scores: { bossing: 3, training: 99, farming: 99 },
  }),
  skill({
    id: 'mercedes', name: 'Mercedes', nameZh: '双弩精灵', sourceClasses: ['Mercedes'],
    effect: 'Bonus EXP gained.', effectZh: '提高获得的经验值。', scores: { bossing: 2, training: 100, farming: 93 },
  }),
  skill({
    id: 'evan', name: 'Evan', nameZh: '龙神', sourceClasses: ['Evan'],
    effect: 'Longer Rune duration.', effectZh: '延长符文持续时间。', scores: { bossing: 1, training: 98, farming: 91 },
  }),
  skill({
    id: 'aran', name: 'Aran', nameZh: '战神', sourceClasses: ['Aran'],
    effect: 'More EXP from Combo Kill orbs.', effectZh: '提高连击经验球提供的经验值。',
    scores: { bossing: 1, training: 89, farming: 82 },
  }),
  skill({
    id: 'angelic-buster', name: 'Angelic Buster', nameZh: '爆莉萌天使', sourceClasses: ['Angelic Buster'],
    effect: 'Short active burst-damage buff.', effectZh: '短时间主动爆发伤害增益。', scores: { bossing: 90, training: 28, farming: 30 },
  }),
  skill({
    id: 'kain', name: 'Kain', nameZh: '凯殷', sourceClasses: ['Kain'],
    effect: 'Damage buff after meeting its combat trigger.', effectZh: '满足战斗触发条件后提高伤害。',
    scores: { bossing: 83, training: 77, farming: 79 },
  }),
  skill({
    id: 'adele', name: 'Adele', nameZh: '阿黛尔', sourceClasses: ['Adele'],
    effect: 'Boss Damage with party-member scaling.', effectZh: '提高 Boss 伤害，并根据队伍人数变化。',
    scores: { bossing: 81, training: 5, farming: 5 },
  }),
  skill({
    id: 'khali', name: 'Khali', nameZh: '卡莉', sourceClasses: ['Khali'],
    effect: 'Damage and periodic HP/MP recovery.', effectZh: '提高伤害，并周期性恢复 HP/MP。',
    scores: { bossing: 82, training: 79, farming: 81 },
  }),
  skill({
    id: 'xenon', name: 'Xenon', nameZh: '尖兵', sourceClasses: ['Xenon'],
    effect: 'All Stats.', effectZh: '提高全属性。', scores: { bossing: 61, training: 65, farming: 66 },
  }),
  skill({
    id: 'kaiser', name: 'Kaiser', nameZh: '凯撒', sourceClasses: ['Kaiser'],
    effect: 'Maximum HP.', effectZh: '提高最大 HP。', scores: { bossing: 36, training: 30, farming: 31 },
  }),
  skill({
    id: 'mihile', name: 'Mihile', nameZh: '米哈尔', sourceClasses: ['Mihile'],
    effect: 'Knockback resistance and stance utility.', effectZh: '提供抗击退与稳如泰山相关能力。',
    scores: { bossing: 54, training: 50, farming: 52 },
  }),
  skill({
    id: 'zero', name: 'Zero', nameZh: '神之子', sourceClasses: ['Zero'],
    effect: 'Ignore Enemy Defense and damage reduction.', effectZh: '提高无视防御并降低受到的伤害。',
    maxRank: 5, scores: { bossing: 84, training: 40, farming: 42 },
  }),
  skill({
    id: 'ren', name: 'Ren', nameZh: '莲', sourceClasses: ['Ren'],
    effect: 'Combat survivability and damage utility.', effectZh: '提供战斗生存与伤害辅助。',
    scores: { bossing: 75, training: 68, farming: 70 },
  }),
  skill({
    id: 'kanna', name: 'Kanna', nameZh: '阴阳师', sourceClasses: ['Kanna'],
    effect: 'General damage.', effectZh: '提高总伤害。', regions: overseasRegions,
    scores: { bossing: 95, training: 85, farming: 86 },
  }),
  skill({
    id: 'hayato', name: 'Hayato', nameZh: '剑豪', sourceClasses: ['Hayato'],
    effect: 'Attack, Magic Attack, and All Stats.', effectZh: '提高攻击力、魔力和全属性。', regions: overseasRegions,
    scores: { bossing: 56, training: 60, farming: 61 },
  }),
  skill({
    id: 'lynn', name: 'Lynn', nameZh: '琳', sourceClasses: ['Lynn'],
    effect: 'Boss Damage, Critical Rate, and Maximum HP.', effectZh: '提高 Boss 伤害、暴击率和最大 HP。',
    regions: ['gms', 'jms', 'tms'], scores: { bossing: 88, training: 71, farming: 73 },
  }),
  skill({
    id: 'mo-xuan', name: 'Mo Xuan', nameZh: '墨玄', sourceClasses: ['Mo Xuan'],
    effect: 'Stacking Boss Damage during sustained attacks.', effectZh: '持续攻击时叠加 Boss 伤害。',
    regions: ['gms', 'tms', 'msea'], scores: { bossing: 93, training: 12, farming: 12 },
  }),
];

export function isLinkSkillAvailable(skillDefinition: LinkSkillDefinition, version: GameVersion) {
  return skillDefinition.regions.includes(version);
}

export function getLinkSkillMaxRank(skillDefinition: LinkSkillDefinition, version: GameVersion) {
  if (skillDefinition.groupMaxRank) return skillDefinition.groupMaxRank;
  if (skillDefinition.maxRank) return skillDefinition.maxRank;
  return version === 'gms' ? 3 : 2;
}

function normalizedServer(server: string) {
  return server.trim().toLowerCase().replace(/[^a-z]/g, '');
}

function serverMatches(server: string, version: GameVersion) {
  const aliases: Record<GameVersion, string[]> = {
    gms: ['gms', 'globalmaplestory'],
    kms: ['kms', 'koreanmaplestory'],
    jms: ['jms', 'japanmaplestory'],
    tms: ['tms', 'taiwanmaplestory', 'twms'],
    msea: ['msea', 'maplestorysea'],
  };
  return aliases[version].includes(normalizedServer(server));
}

function characterRank(level: number, skillDefinition: LinkSkillDefinition, version: GameVersion) {
  if (level < 70) return 0;
  if (skillDefinition.id === 'zero') {
    if (level >= 178) return 5;
    if (level >= 160) return 4;
    if (level >= 140) return 3;
    if (level >= 120) return 2;
    return 1;
  }
  if (level < 120) return 1;
  if (skillDefinition.groupMaxRank) return 2;
  if (version === 'gms' && level >= 210) return Math.min(3, getLinkSkillMaxRank(skillDefinition, version));
  return Math.min(2, getLinkSkillMaxRank(skillDefinition, version));
}

export function deriveOwnedLinkRanks(characters: readonly LinkRosterCharacter[], version: GameVersion) {
  const regionalCharacters = characters.filter((character) => serverMatches(character.server, version));
  return Object.fromEntries(
    linkSkillCatalog
      .filter((skillDefinition) => isLinkSkillAvailable(skillDefinition, version))
      .flatMap((skillDefinition) => {
        const contributions = skillDefinition.sourceClasses.flatMap((className) => {
          const highest = regionalCharacters
            .filter((character) => character.className === className)
            .reduce((level, character) => Math.max(level, character.level), 0);
          return highest > 0 ? [characterRank(highest, skillDefinition, version)] : [];
        });
        if (contributions.length === 0) return [];
        const detectedRank = skillDefinition.groupMaxRank
          ? contributions.reduce((sum, rank) => sum + rank, 0)
          : Math.max(...contributions);
        return [[skillDefinition.id, Math.min(detectedRank, getLinkSkillMaxRank(skillDefinition, version))]];
      }),
  );
}

export function buildRecommendedLinkLoadout(
  ranks: Record<string, number>,
  scenario: LinkScenario,
  version: GameVersion,
) {
  return linkSkillCatalog
    .filter((skillDefinition) => isLinkSkillAvailable(skillDefinition, version) && (ranks[skillDefinition.id] ?? 0) > 0)
    .sort((left, right) => {
      const leftRankRatio = (ranks[left.id] ?? 0) / getLinkSkillMaxRank(left, version);
      const rightRankRatio = (ranks[right.id] ?? 0) / getLinkSkillMaxRank(right, version);
      const leftScore = left.scores[scenario] * (0.75 + leftRankRatio * 0.25);
      const rightScore = right.scores[scenario] * (0.75 + rightRankRatio * 0.25);
      return rightScore - leftScore || left.name.localeCompare(right.name);
    })
    .slice(0, MAX_LINK_SLOTS)
    .map((skillDefinition) => skillDefinition.id);
}

export function createEmptyLinkPlannerState(): LinkPlannerState {
  return { ranks: {}, loadouts: { bossing: [], training: [], farming: [] } };
}

export function sanitizeLinkPlannerState(value: unknown, version: GameVersion): LinkPlannerState {
  const empty = createEmptyLinkPlannerState();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return empty;
  const input = value as Partial<LinkPlannerState>;
  const available = new Map(
    linkSkillCatalog
      .filter((skillDefinition) => isLinkSkillAvailable(skillDefinition, version))
      .map((skillDefinition) => [skillDefinition.id, skillDefinition]),
  );
  const ranks = Object.fromEntries(
    Object.entries(input.ranks ?? {}).flatMap(([id, rank]) => {
      const definition = available.get(id);
      if (!definition || !Number.isFinite(rank)) return [];
      return [[id, Math.min(getLinkSkillMaxRank(definition, version), Math.max(0, Math.floor(rank)))]];
    }),
  );
  const loadouts = Object.fromEntries(linkScenarios.map((scenario) => {
    const raw = Array.isArray(input.loadouts?.[scenario]) ? input.loadouts[scenario] : [];
    const valid = [...new Set(raw.filter((id): id is string => typeof id === 'string' && available.has(id) && (ranks[id] ?? 0) > 0))];
    return [scenario, valid.slice(0, MAX_LINK_SLOTS)];
  })) as LinkPlannerState['loadouts'];
  return { ranks, loadouts };
}
