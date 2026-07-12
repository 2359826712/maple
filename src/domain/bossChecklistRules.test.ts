import { describe, expect, it } from 'vitest';
import { bosses } from '@/mocks/bosses';
import {
  getBossChecklistRules,
  getTrackedDifficulty,
  normalizeTrackedDifficulties,
  setTrackedDifficulty,
} from './bossChecklistRules';

describe('boss checklist rules', () => {
  it('provides one valid GMS rule for every registered difficulty', () => {
    for (const boss of bosses) {
      const rules = getBossChecklistRules(boss, 'gms');
      expect(rules.map((rule) => rule.difficulty)).toEqual(boss.difficulty);
      for (const rule of rules) {
        expect(rule.clearLimit).toBeGreaterThan(0);
        expect(['daily', 'weekly']).toContain(rule.period);
        expect(rule.exclusiveGroup.trim()).not.toBe('');
        expect(rule.version).toBe('gms');
      }
    }
  });

  it('models mixed-period bosses without a global daily/weekly assumption', () => {
    const zakum = bosses.find((boss) => boss.id === 'zakum')!;
    const magnus = bosses.find((boss) => boss.id === 'magnus')!;

    expect(getBossChecklistRules(zakum, 'gms')).toEqual(expect.arrayContaining([
      expect.objectContaining({ difficulty: 'Normal', period: 'daily', exclusiveGroup: 'zakum-daily' }),
      expect.objectContaining({ difficulty: 'Chaos', period: 'weekly', exclusiveGroup: 'zakum-chaos' }),
    ]));
    expect(getBossChecklistRules(magnus, 'gms')).toEqual(expect.arrayContaining([
      expect.objectContaining({ difficulty: 'Normal', period: 'daily' }),
      expect.objectContaining({ difficulty: 'Hard', period: 'weekly' }),
    ]));
  });

  it('replaces a boss difficulty without changing other bosses', () => {
    expect(setTrackedDifficulty(
      ['zakum:Easy', 'zakum:Normal', 'lotus:Hard'],
      'zakum',
      'Chaos',
    )).toEqual(['lotus:Hard', 'zakum:Chaos']);
  });

  it('normalizes legacy multi-difficulty selections to one hardest tracked difficulty', () => {
    const normalized = normalizeTrackedDifficulties(
      bosses,
      ['zakum:Easy', 'zakum:Chaos', 'lotus:Normal', 'lotus:Hard'],
    );
    expect(normalized).toContain('zakum:Chaos');
    expect(normalized).toContain('lotus:Hard');
    expect(normalized).not.toContain('zakum:Easy');
    expect(normalized).not.toContain('lotus:Normal');
  });

  it('resolves no tracked difficulty when a boss is excluded', () => {
    const zakum = bosses.find((boss) => boss.id === 'zakum')!;
    expect(getTrackedDifficulty(zakum, new Set(['lotus:Hard']))).toBeNull();
  });
});
