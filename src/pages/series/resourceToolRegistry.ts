import type { VerifiedSeriesResource } from './verifiedContent';

export type ToolKind = 'combat' | 'comparison' | 'material' | 'probability' | 'progress' | 'reward' | 'tracker';

export const probabilityPlannerIds = new Set([
  'idle-wiki-companion-summon-calculator',
  'idle-wiki-elite-summon-calculator',
  'idle-wiki-weapon-summon-calculator',
  'n-maplehub-cube-cost-calculator',
  'n-maplehub-raffle-reward-calculator',
  'n-maplehub-star-force-calculator',
]);

export const costPlannerIds = new Set([
  'm-community-powder-cost-calculator',
]);

const probabilityTools = new Set([
  'cube-cost',
  'equipment-scroll',
  'star-force',
  'summoning-chance',
]);
const combatTools = new Set([
  'combat-accuracy',
  'combat-avoidability',
  'combat-damage',
  'equipment-damage',
]);
const comparisonTools = new Set([
  'equipment-comparison',
  'equipment-enhancement',
  'equipment-roll-quality',
  'flame-score',
  'hyper-stat',
  'stat-equivalence',
  'stat-value',
  'stat-weights',
]);
const materialTools = new Set(['equipment-leveling', 'hero-power']);
const progressTools = new Set(['experience']);
const rewardTools = new Set(['party-rewards']);
const trackerTools = new Set([
  'arcane-symbol',
  'character-build',
  'equipment-progression',
  'map-route',
  'quest-tracker',
  'training-tracker',
  'v-matrix',
]);

const interactiveCategories = new Set([
  'builder',
  'calculator',
  'character-lookup',
  'guild-lookup',
  'optimizer',
  'planner',
  'simulator',
]);

export const getResourceToolKind = (resource?: VerifiedSeriesResource): ToolKind | null => {
  const record = resource?.resourceRecord;
  if (!record || !interactiveCategories.has(record.category)) return null;
  const subcategory = record.subcategory || '';
  if (probabilityTools.has(subcategory)) return 'probability';
  if (combatTools.has(subcategory)) return 'combat';
  if (comparisonTools.has(subcategory)) return 'comparison';
  if (materialTools.has(subcategory)) return 'material';
  if (progressTools.has(subcategory)) return 'progress';
  if (rewardTools.has(subcategory)) return 'reward';
  if (trackerTools.has(subcategory)) return 'tracker';
  return 'progress';
};

export const hasResourceDetailExperience = (resource?: VerifiedSeriesResource) => Boolean(
  resource
  && (
    resource.resourceId === 'classicworld-scroll-cost-simulator'
    || probabilityPlannerIds.has(resource.resourceId)
    || costPlannerIds.has(resource.resourceId)
    || getResourceToolKind(resource)
  )
);
