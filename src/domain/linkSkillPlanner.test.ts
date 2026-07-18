import { describe, expect, it } from 'vitest';
import {
  MAX_LINK_SLOTS,
  buildRecommendedLinkLoadout,
  deriveOwnedLinkRanks,
  getLinkSkillMaxRank,
  isLinkSkillAvailable,
  linkSkillCatalog,
  sanitizeLinkPlannerState,
} from './linkSkillPlanner';

describe('Link Skill planner model', () => {
  it('scopes overseas-only classes to servers that have them', () => {
    const kanna = linkSkillCatalog.find((skill) => skill.id === 'kanna');
    const lynn = linkSkillCatalog.find((skill) => skill.id === 'lynn');
    expect(kanna && isLinkSkillAvailable(kanna, 'gms')).toBe(true);
    expect(kanna && isLinkSkillAvailable(kanna, 'kms')).toBe(false);
    expect(lynn && isLinkSkillAvailable(lynn, 'jms')).toBe(true);
    expect(lynn && isLinkSkillAvailable(lynn, 'msea')).toBe(false);
  });

  it('derives ranks from the saved server roster and stacks unique class groups', () => {
    const roster = [
      { className: 'Bishop', level: 210, server: 'GMS' },
      { className: 'Arch Mage (I/L)', level: 120, server: 'GMS' },
      { className: 'Arch Mage (F/P)', level: 120, server: 'GMS' },
      { className: 'Demon Avenger', level: 210, server: 'GMS' },
      { className: 'Demon Avenger', level: 220, server: 'GMS' },
      { className: 'Kanna', level: 210, server: 'JMS' },
    ];

    const gmsRanks = deriveOwnedLinkRanks(roster, 'gms');
    expect(gmsRanks['explorer-mage']).toBe(6);
    expect(gmsRanks['demon-avenger']).toBe(3);
    expect(gmsRanks.kanna).toBeUndefined();

    const jmsRanks = deriveOwnedLinkRanks(roster, 'jms');
    expect(jmsRanks.kanna).toBe(2);
  });

  it('uses regional maximum ranks', () => {
    const demonAvenger = linkSkillCatalog.find((skill) => skill.id === 'demon-avenger');
    const explorerMage = linkSkillCatalog.find((skill) => skill.id === 'explorer-mage');
    expect(demonAvenger && getLinkSkillMaxRank(demonAvenger, 'gms')).toBe(3);
    expect(demonAvenger && getLinkSkillMaxRank(demonAvenger, 'kms')).toBe(2);
    expect(explorerMage && getLinkSkillMaxRank(explorerMage, 'gms')).toBe(6);
  });

  it('builds a 12-slot activity loadout from owned skills only', () => {
    const ranks = Object.fromEntries(linkSkillCatalog.map((skill) => [skill.id, 2]));
    const training = buildRecommendedLinkLoadout(ranks, 'training', 'gms');
    expect(training).toHaveLength(MAX_LINK_SLOTS);
    expect(training.slice(0, 3)).toEqual(['mercedes', 'lara', 'evan']);
    expect(training).not.toContain('demon-slayer');

    const bossing = buildRecommendedLinkLoadout({ 'demon-slayer': 3, mercedes: 3 }, 'bossing', 'gms');
    expect(bossing).toEqual(['demon-slayer', 'mercedes']);
  });

  it('sanitizes corrupt ranks and removes unowned or invalid loadout entries', () => {
    const state = sanitizeLinkPlannerState({
      ranks: { 'demon-slayer': 99, mercedes: 0, invalid: 2 },
      loadouts: {
        bossing: ['demon-slayer', 'demon-slayer', 'mercedes', 'invalid'],
        training: 'bad',
        farming: [],
      },
    }, 'gms');

    expect(state.ranks).toEqual({ 'demon-slayer': 3, mercedes: 0 });
    expect(state.loadouts.bossing).toEqual(['demon-slayer']);
    expect(state.loadouts.training).toEqual([]);
  });
});
