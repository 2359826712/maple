import type { GameVersion } from '@/domain/regionModel';
import type { BossInfo } from '@/mocks/bosses';

export type ChecklistPeriod = 'daily' | 'weekly';

export interface BossDifficultyChecklistRule {
  bossId: string;
  difficulty: string;
  period: ChecklistPeriod;
  clearLimit: number;
  /** Difficulties in the same group share one clear choice for that reset period. */
  exclusiveGroup: string;
  version: GameVersion;
}

type DifficultyRuleOverride = Omit<BossDifficultyChecklistRule, 'bossId' | 'version'>;

/**
 * Version-scoped exceptions to the legacy one-period-per-boss dataset.
 * Keeping these outside the component prevents UI assumptions from becoming
 * game rules and allows each regional dataset to evolve independently.
 */
const versionRuleOverrides: Partial<
  Record<GameVersion, Record<string, readonly DifficultyRuleOverride[]>>
> = {
  gms: {
    zakum: [
      { difficulty: 'Easy', period: 'daily', clearLimit: 1, exclusiveGroup: 'zakum-daily' },
      { difficulty: 'Normal', period: 'daily', clearLimit: 1, exclusiveGroup: 'zakum-daily' },
      { difficulty: 'Chaos', period: 'weekly', clearLimit: 1, exclusiveGroup: 'zakum-chaos' },
    ],
    papulatus: [
      { difficulty: 'Normal', period: 'daily', clearLimit: 1, exclusiveGroup: 'papulatus-daily' },
      { difficulty: 'Chaos', period: 'weekly', clearLimit: 1, exclusiveGroup: 'papulatus-chaos' },
    ],
    magnus: [
      { difficulty: 'Easy', period: 'daily', clearLimit: 1, exclusiveGroup: 'magnus-daily' },
      { difficulty: 'Normal', period: 'daily', clearLimit: 1, exclusiveGroup: 'magnus-daily' },
      { difficulty: 'Hard', period: 'weekly', clearLimit: 1, exclusiveGroup: 'magnus-hard' },
    ],
  },
};

function legacyRules(boss: BossInfo, version: GameVersion): BossDifficultyChecklistRule[] {
  const period: ChecklistPeriod = boss.weeklyLimit > 0 ? 'weekly' : 'daily';
  const clearLimit = period === 'weekly' ? boss.weeklyLimit : boss.dailyLimit;
  return boss.difficulty.map((difficulty) => ({
    bossId: boss.id,
    difficulty,
    period,
    clearLimit,
    exclusiveGroup: `${boss.id}-${period}`,
    version,
  }));
}

export function getBossChecklistRules(
  boss: BossInfo,
  version: GameVersion,
): BossDifficultyChecklistRule[] {
  const override = versionRuleOverrides[version]?.[boss.id];
  if (!override) return legacyRules(boss, version);

  const rulesByDifficulty = new Map(override.map((rule) => [rule.difficulty, rule]));
  return boss.difficulty.map((difficulty) => {
    const rule = rulesByDifficulty.get(difficulty);
    if (!rule) {
      throw new Error(`Missing ${version} checklist rule for ${boss.id}:${difficulty}.`);
    }
    return { ...rule, bossId: boss.id, version };
  });
}

export const checklistTaskId = (bossId: string, difficulty: string) =>
  `${bossId}:${difficulty}`;

export function setTrackedDifficulty(
  selectedTaskIds: readonly string[],
  bossId: string,
  difficulty: string | null,
): string[] {
  const prefix = `${bossId}:`;
  const next = selectedTaskIds.filter((taskId) => !taskId.startsWith(prefix));
  if (difficulty) next.push(checklistTaskId(bossId, difficulty));
  return [...new Set(next)].sort();
}

export function getTrackedDifficulty(
  boss: BossInfo,
  selectedTaskIds: ReadonlySet<string>,
): string | null {
  for (let index = boss.difficulty.length - 1; index >= 0; index -= 1) {
    const difficulty = boss.difficulty[index];
    if (selectedTaskIds.has(checklistTaskId(boss.id, difficulty))) return difficulty;
  }
  return null;
}

/**
 * Migrates legacy multi-difficulty selections to the normal-use invariant of
 * one tracked difficulty per boss. The hardest previously selected difficulty
 * wins, preserving the most progression-relevant choice.
 */
export function normalizeTrackedDifficulties(
  bossList: readonly BossInfo[],
  selectedTaskIds: readonly string[],
): string[] {
  const selected = new Set(selectedTaskIds);
  return bossList.flatMap((boss) => {
    const tracked = getTrackedDifficulty(boss, selected);
    return tracked ? [checklistTaskId(boss.id, tracked)] : [];
  }).sort();
}
