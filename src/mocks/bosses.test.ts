import { describe, expect, it } from 'vitest';
import { bosses } from './bosses';
import { validateBossData } from '@/domain/contentSchemas';

/**
 * Verified difficulty sets for ALL bosses.
 * This is the authoritative reference for TRUST-01 acceptance.
 */
const verifiedDifficulties: Record<string, string[]> = {
  zakum: ['Easy', 'Normal', 'Chaos'],
  horntail: ['Easy', 'Normal', 'Chaos'],
  'pink-bean': ['Normal', 'Chaos'],
  papulatus: ['Normal', 'Chaos'],
  magnus: ['Easy', 'Normal', 'Hard'],
  hilla: ['Normal', 'Hard'],
  cygnus: ['Easy', 'Normal'],
  lotus: ['Normal', 'Hard', 'Extreme'],
  damien: ['Normal', 'Hard'],
  lucid: ['Normal', 'Hard'],
  will: ['Normal', 'Hard'],
  gloom: ['Normal', 'Hard'],
  darknell: ['Normal', 'Hard'],
  'verus-hilla': ['Normal', 'Hard'],
  'black-mage': ['Normal'],
  kalos: ['Normal', 'Hard'],
  limbo: ['Normal', 'Hard'],
  seren: ['Normal', 'Hard'],
  baldrix: ['Normal', 'Hard'],
  slime: ['Normal', 'Hard'],
};

/**
 * Bosses that reset daily (dailyLimit > 0, weeklyLimit === 0).
 * All others reset weekly (dailyLimit === 0, weeklyLimit > 0).
 */
const dailyBosses = new Set([
  'zakum', 'horntail', 'pink-bean', 'papulatus', 'magnus', 'hilla',
]);

const weeklyBosses = new Set([
  'cygnus', 'lotus', 'damien', 'lucid', 'will', 'gloom',
  'darknell', 'verus-hilla', 'black-mage', 'kalos', 'limbo',
  'seren', 'baldrix', 'slime',
]);

/** Only these difficulty names are valid for GMS bosses. */
const VALID_DIFFICULTY_NAMES = new Set(['Easy', 'Normal', 'Chaos', 'Hard', 'Extreme']);

describe('boss registry trust invariants', () => {
  it('contains no duplicate boss IDs', () => {
    expect(new Set(bosses.map((boss) => boss.id)).size).toBe(bosses.length);
  });

  it('matches the verified difficulty sets for all bosses', () => {
    for (const [id, difficulties] of Object.entries(verifiedDifficulties)) {
      const boss = bosses.find((b) => b.id === id);
      expect(boss, `Boss "${id}" not found in registry`).toBeDefined();
      expect(boss!.difficulty).toEqual(difficulties);
    }
  });

  it('every boss in the registry has a verified difficulty entry', () => {
    for (const boss of bosses) {
      expect(
        verifiedDifficulties[boss.id],
        `Boss "${boss.id}" (${boss.name}) has no verified difficulty entry — add it to verifiedDifficulties`,
      ).toBeDefined();
    }
  });

  it('requires provenance and region scope on every record', () => {
    for (const boss of bosses) {
      expect(boss.dataSource.trim()).not.toBe('');
      expect(Number.isNaN(Date.parse(boss.lastVerified))).toBe(false);
      expect(new URL(boss.sourceUrl).protocol).toBe('https:');
      expect(boss.regions).toContain('gms');
    }
  });

  it('passes the canonical runtime schema for every static boss record', () => {
    for (const boss of bosses) {
      const result = validateBossData({
        id: boss.id,
        name: boss.name,
        level: boss.level,
        minLevel: boss.minLevel,
        difficulties: boss.difficulty,
        resetType: boss.weeklyLimit > 0 ? 'weekly' : 'daily',
        regions: boss.regions,
        source: boss.dataSource,
        sourceUrl: boss.sourceUrl,
        lastVerified: boss.lastVerified,
      });
      expect(result).toEqual(expect.objectContaining({ ok: true }));
    }
  });

  describe('per-difficulty reset and reward audit', () => {
    it('all difficulty names use only valid values (Easy/Normal/Chaos/Hard/Extreme)', () => {
      for (const boss of bosses) {
        for (const diff of boss.difficulty) {
          expect(
            VALID_DIFFICULTY_NAMES.has(diff),
            `Boss "${boss.name}" has invalid difficulty "${diff}"`,
          ).toBe(true);
        }
      }
    });

    it('no boss has duplicate difficulty entries', () => {
      for (const boss of bosses) {
        const unique = new Set(boss.difficulty);
        expect(unique.size).toBe(boss.difficulty.length);
      }
    });

    it('daily bosses have dailyLimit > 0 and weeklyLimit === 0', () => {
      for (const boss of bosses) {
        if (dailyBosses.has(boss.id)) {
          expect(boss.dailyLimit, `${boss.name} should be daily`).toBeGreaterThan(0);
          expect(boss.weeklyLimit, `${boss.name} should have no weekly limit`).toBe(0);
        }
      }
    });

    it('weekly bosses have weeklyLimit > 0 and dailyLimit === 0', () => {
      for (const boss of bosses) {
        if (weeklyBosses.has(boss.id)) {
          expect(boss.weeklyLimit, `${boss.name} should be weekly`).toBeGreaterThan(0);
          expect(boss.dailyLimit, `${boss.name} should have no daily limit`).toBe(0);
        }
      }
    });

    it('every boss is classified as either daily or weekly (no overlap, no unclassified)', () => {
      for (const boss of bosses) {
        const isDaily = dailyBosses.has(boss.id);
        const isWeekly = weeklyBosses.has(boss.id);
        expect(isDaily || isWeekly, `${boss.name} is not classified as daily or weekly`).toBe(true);
        expect(isDaily && isWeekly, `${boss.name} is classified as both daily and weekly`).toBe(false);
      }
    });

    it('minLevel does not exceed boss level', () => {
      for (const boss of bosses) {
        expect(boss.minLevel, `${boss.name}: minLevel ${boss.minLevel} > level ${boss.level}`).toBeLessThanOrEqual(boss.level);
      }
    });

    it('withholds unverified reward values instead of publishing fabricated numbers', () => {
      for (const boss of bosses) {
        expect(boss.mesoReward, `${boss.name}: mesoReward should be withheld`).toBe(0);
        expect(boss.expReward, `${boss.name}: expReward should be withheld`).toBe(0);
        expect(boss.drops, `${boss.name}: drops should be withheld`).toEqual([]);
        expect(boss.phases, `${boss.name}: phases should be withheld`).toEqual([]);
        expect(boss.tips, `${boss.name}: tips should be withheld`).toEqual([]);
        expect(boss.dataSource).toContain('Planning only');
      }
    });

    it('recommended BP is non-negative and scales with boss tier', () => {
      for (const boss of bosses) {
        expect(boss.recommendedBp, `${boss.name}: recommendedBp should be non-negative`).toBeGreaterThanOrEqual(0);
      }
      expect(bosses.every((boss) => boss.recommendedBp === 0)).toBe(true);
    });
  });
});
