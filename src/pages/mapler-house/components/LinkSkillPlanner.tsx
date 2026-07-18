import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacters } from '@/hooks/useCharacters';
import { useVersion } from '@/hooks/VersionContext';
import CharacterFormDialog from '@/pages/checklist/CharacterFormDialog';
import { writeJsonWithRecovery } from '@/services/persistentStorage';
import {
  MAX_LINK_SLOTS,
  buildRecommendedLinkLoadout,
  createEmptyLinkPlannerState,
  deriveOwnedLinkRanks,
  getLinkSkillMaxRank,
  isLinkSkillAvailable,
  linkScenarios,
  linkSkillCatalog,
  sanitizeLinkPlannerState,
  type LinkPlannerState,
  type LinkScenario,
  type LinkSkillDefinition,
} from '@/domain/linkSkillPlanner';

type CollectionFilter = 'all' | 'owned' | 'missing';

function plannerStorageKey(version: string) {
  return `maplehub-link-planner:v2:${version}`;
}

function loadPlannerState(version: Parameters<typeof sanitizeLinkPlannerState>[1]) {
  if (typeof window === 'undefined') return createEmptyLinkPlannerState();
  try {
    const raw = localStorage.getItem(plannerStorageKey(version));
    return sanitizeLinkPlannerState(raw ? JSON.parse(raw) : null, version);
  } catch {
    return createEmptyLinkPlannerState();
  }
}

export default function LinkSkillPlanner() {
  const { version } = useVersion();
  return <VersionedLinkSkillPlanner key={version} />;
}

function VersionedLinkSkillPlanner() {
  const { t, i18n } = useTranslation();
  const { version, versionInfo } = useVersion();
  const { characters, addCharacter } = useCharacters();
  const [scenario, setScenario] = useState<LinkScenario>('bossing');
  const [planner, setPlanner] = useState<LinkPlannerState>(() => loadPlannerState(version));
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');
  const [query, setQuery] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(() => Object.values(planner.ranks).every((rank) => rank === 0));
  const useChineseCopy = (i18n.resolvedLanguage ?? i18n.language).toLowerCase().startsWith('zh');

  useEffect(() => {
    const result = writeJsonWithRecovery(localStorage, plannerStorageKey(version), planner);
    setSaveError(!result.ok);
  }, [planner, version]);

  const availableSkills = useMemo(
    () => linkSkillCatalog.filter((skill) => isLinkSkillAvailable(skill, version)),
    [version],
  );
  const serverCharacters = useMemo(
    () => characters.filter((character) => character.server.trim().toLowerCase() === version),
    [characters, version],
  );
  const equippedIds = planner.loadouts[scenario];
  const equippedSet = useMemo(() => new Set(equippedIds), [equippedIds]);
  const ownedCount = availableSkills.filter((skill) => (planner.ranks[skill.id] ?? 0) > 0).length;

  const suggestedSkills = useMemo(
    () => [...availableSkills]
      .sort((left, right) => right.scores[scenario] - left.scores[scenario] || left.name.localeCompare(right.name))
      .slice(0, MAX_LINK_SLOTS),
    [availableSkills, scenario],
  );

  const visibleCollection = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return availableSkills.filter((skill) => {
      const rank = planner.ranks[skill.id] ?? 0;
      if (collectionFilter === 'owned' && rank === 0) return false;
      if (collectionFilter === 'missing' && rank > 0) return false;
      if (!normalizedQuery) return true;
      return [skill.name, skill.nameZh, skill.effect, skill.effectZh, ...skill.sourceClasses]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [availableSkills, collectionFilter, planner.ranks, query]);

  const updateRank = (skill: LinkSkillDefinition, rank: number) => {
    const nextRank = Math.min(getLinkSkillMaxRank(skill, version), Math.max(0, rank));
    setPlanner((current) => ({
      ranks: { ...current.ranks, [skill.id]: nextRank },
      loadouts: nextRank > 0
        ? current.loadouts
        : Object.fromEntries(linkScenarios.map((item) => [
          item,
          current.loadouts[item].filter((id) => id !== skill.id),
        ])) as LinkPlannerState['loadouts'],
    }));
    setStatus(null);
  };

  const toggleEquipped = (skill: LinkSkillDefinition) => {
    const rank = planner.ranks[skill.id] ?? 0;
    if (rank === 0) {
      setStatus(t('mh_link_status_missing'));
      return;
    }
    setPlanner((current) => {
      const currentLoadout = current.loadouts[scenario];
      const isEquipped = currentLoadout.includes(skill.id);
      if (!isEquipped && currentLoadout.length >= MAX_LINK_SLOTS) {
        setStatus(t('mh_link_status_full', { count: MAX_LINK_SLOTS }));
        return current;
      }
      setStatus(null);
      return {
        ...current,
        loadouts: {
          ...current.loadouts,
          [scenario]: isEquipped
            ? currentLoadout.filter((id) => id !== skill.id)
            : [...currentLoadout, skill.id],
        },
      };
    });
  };

  const autoBuild = () => {
    const nextLoadout = buildRecommendedLinkLoadout(planner.ranks, scenario, version);
    setPlanner((current) => ({
      ...current,
      loadouts: { ...current.loadouts, [scenario]: nextLoadout },
    }));
    setStatus(nextLoadout.length > 0 ? t('mh_link_status_built') : t('mh_link_status_no_owned'));
  };

  const clearLoadout = () => {
    setPlanner((current) => ({
      ...current,
      loadouts: { ...current.loadouts, [scenario]: [] },
    }));
    setStatus(null);
  };

  const applyRoster = (roster: typeof characters) => {
    const detectedRanks = deriveOwnedLinkRanks(roster, version);
    setPlanner((current) => ({
      ranks: detectedRanks,
      loadouts: Object.fromEntries(linkScenarios.map((item) => [
        item,
        current.loadouts[item].filter((id) => (detectedRanks[id] ?? 0) > 0),
      ])) as LinkPlannerState['loadouts'],
    }));
    setStatus(Object.keys(detectedRanks).length > 0
      ? t('mh_link_status_synced', { count: Object.keys(detectedRanks).length })
      : t('mh_link_status_roster_empty', { version: versionInfo.shortLabel }));
  };

  const syncRoster = () => applyRoster(characters);

  const handleAddCharacter = (input: Parameters<typeof addCharacter>[0]) => {
    const character = addCharacter(input);
    applyRoster([...characters, character]);
  };

  const openManualSetup = () => {
    setGuideOpen(false);
    requestAnimationFrame(() => document.getElementById('link-skill-collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const getName = (skill: LinkSkillDefinition) => useChineseCopy ? skill.nameZh : skill.name;
  const getEffect = (skill: LinkSkillDefinition) => useChineseCopy ? skill.effectZh : skill.effect;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-background-200 bg-background-100 p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-xl font-semibold text-foreground-950">{t('mh_link_title')}</h3>
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                {versionInfo.shortLabel}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-foreground-600">{t('mh_link_desc_real')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setGuideOpen((open) => !open)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-background-300 bg-background-50 px-3 text-xs font-semibold text-foreground-700 hover:bg-primary-50" aria-expanded={guideOpen}>
              <i className="ri-question-line" aria-hidden="true"></i>
              {guideOpen ? t('mh_link_help_close') : t('mh_link_help_open')}
            </button>
            <div className={`flex items-center gap-1.5 text-xs ${saveError ? 'text-red-700' : 'text-green-800'}`} role="status">
              <i className={saveError ? 'ri-error-warning-line' : 'ri-save-3-line'} aria-hidden="true"></i>
              {saveError ? t('mh_link_save_failed') : t('mh_link_saved_locally')}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t('mh_link_scenario_label')}>
          {linkScenarios.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setScenario(item); setStatus(null); }}
              aria-pressed={scenario === item}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                scenario === item
                  ? 'bg-primary-600 text-white'
                  : 'border border-background-300 bg-background-50 text-foreground-800 hover:bg-primary-50'
              }`}
            >
              <i className={item === 'bossing' ? 'ri-sword-line' : item === 'training' ? 'ri-run-line' : 'ri-seedling-line'} aria-hidden="true"></i>
              {t(`mh_link_scenario_${item}`)}
            </button>
          ))}
        </div>
      </section>

      {guideOpen && (
        <section className="rounded-xl border border-primary-200 bg-primary-50/60 p-4 md:p-5" aria-labelledby="link-planner-getting-started">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">{t('mh_link_getting_started_label')}</div>
              <h4 id="link-planner-getting-started" className="mt-1 font-heading text-xl font-semibold text-foreground-950">{t('mh_link_getting_started_title')}</h4>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-foreground-700">{t('mh_link_getting_started_desc')}</p>
            </div>
            <button type="button" onClick={() => setGuideOpen(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground-500 hover:bg-background-50" aria-label={t('mh_link_help_close')}>
              <i className="ri-close-line" aria-hidden="true"></i>
            </button>
          </div>

          <ol className="mt-5 grid gap-3 lg:grid-cols-3">
            <li className="rounded-lg border border-primary-100 bg-background-50 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">1</span>
                <h5 className="font-semibold text-foreground-950">{t('mh_link_step_server_title')}</h5>
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground-600">{t('mh_link_step_server_desc', { version: versionInfo.shortLabel })}</p>
              <div className="mt-3 inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-800">{versionInfo.shortLabel}</div>
            </li>
            <li className="rounded-lg border border-primary-100 bg-background-50 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">2</span>
                <h5 className="font-semibold text-foreground-950">{t('mh_link_step_roster_title')}</h5>
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground-600">{t('mh_link_step_roster_desc')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setCharacterDialogOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary-600 px-3 text-xs font-semibold text-white hover:bg-primary-700">
                  <i className="ri-user-add-line" aria-hidden="true"></i>{t('mh_link_add_character')}
                </button>
                <button type="button" onClick={syncRoster} disabled={serverCharacters.length === 0} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-background-300 bg-background-50 px-3 text-xs font-semibold text-foreground-700 hover:bg-background-100 disabled:cursor-not-allowed disabled:opacity-50">
                  <i className="ri-refresh-line" aria-hidden="true"></i>{t('mh_link_sync_count', { count: serverCharacters.length })}
                </button>
                <button type="button" onClick={openManualSetup} className="h-9 rounded-full px-2 text-xs font-semibold text-primary-700 hover:bg-primary-50">{t('mh_link_set_manually')}</button>
              </div>
            </li>
            <li className="rounded-lg border border-primary-100 bg-background-50 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">3</span>
                <h5 className="font-semibold text-foreground-950">{t('mh_link_step_build_title')}</h5>
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground-600">{t('mh_link_step_build_desc')}</p>
              <button type="button" onClick={autoBuild} disabled={ownedCount === 0} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground-950 px-3 text-xs font-semibold text-background-50 hover:bg-foreground-800 disabled:cursor-not-allowed disabled:bg-background-300 disabled:text-foreground-500">
                <i className="ri-magic-line" aria-hidden="true"></i>{t('mh_link_auto_build')}
              </button>
            </li>
          </ol>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">{t('mh_link_owned')}</div>
          <div className="mt-1 font-heading text-2xl font-semibold text-foreground-950">{ownedCount}/{availableSkills.length}</div>
        </div>
        <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-secondary-800">{t('mh_link_equipped')}</div>
          <div className="mt-1 font-heading text-2xl font-semibold text-foreground-950">{equippedIds.length}/{MAX_LINK_SLOTS}</div>
        </div>
        <div className="rounded-lg border border-accent-200 bg-accent-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent-800">{t('mh_link_roster_matches')}</div>
          <div className="mt-1 font-heading text-2xl font-semibold text-foreground-950">{serverCharacters.length}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={autoBuild} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700">
          <i className="ri-magic-line" aria-hidden="true"></i>{t('mh_link_auto_build')}
        </button>
        <button type="button" onClick={syncRoster} className="inline-flex h-10 items-center gap-2 rounded-full border border-background-300 bg-background-50 px-4 text-sm font-semibold text-foreground-800 hover:bg-background-100">
          <i className="ri-user-shared-line" aria-hidden="true"></i>{t('mh_link_sync_roster')}
        </button>
        <button type="button" onClick={() => setCharacterDialogOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-background-300 bg-background-50 px-4 text-sm font-semibold text-foreground-800 hover:bg-background-100">
          <i className="ri-user-add-line" aria-hidden="true"></i>{t('mh_link_add_character')}
        </button>
        <button type="button" onClick={clearLoadout} disabled={equippedIds.length === 0} className="inline-flex h-10 items-center gap-2 rounded-full border border-background-300 bg-background-50 px-4 text-sm font-semibold text-foreground-700 hover:bg-background-100 disabled:cursor-not-allowed disabled:opacity-50">
          <i className="ri-delete-bin-line" aria-hidden="true"></i>{t('mh_link_clear')}
        </button>
        {status && <span className="text-sm text-foreground-600" role="status">{status}</span>}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-background-200 bg-background-50 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h4 className="font-heading text-lg font-semibold text-foreground-950">{t('mh_link_loadout_title')}</h4>
              <p className="mt-1 text-xs leading-5 text-foreground-600">{t('mh_link_loadout_desc', { count: MAX_LINK_SLOTS })}</p>
            </div>
            <span className="rounded-full bg-foreground-950 px-2.5 py-1 text-xs font-bold text-background-50">{equippedIds.length}/{MAX_LINK_SLOTS}</span>
          </div>

          {equippedIds.length === 0 ? (
            <div className="rounded-lg border border-dashed border-background-300 bg-background-100 px-4 py-10 text-center text-sm text-foreground-600">
              <i className="ri-links-line mb-2 block text-3xl text-background-400" aria-hidden="true"></i>
              {t('mh_link_loadout_empty')}
            </div>
          ) : (
            <ol className="space-y-2">
              {equippedIds.map((id, index) => {
                const skill = availableSkills.find((item) => item.id === id);
                if (!skill) return null;
                return (
                  <li key={id} className="flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50/60 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground-950">{getName(skill)}</span>
                        <span className="rounded bg-background-50 px-1.5 py-0.5 text-xs text-foreground-600">
                          {t('mh_link_level', { level: planner.ranks[id] ?? 0 })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-foreground-600">{getEffect(skill)}</p>
                    </div>
                    <button type="button" onClick={() => toggleEquipped(skill)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground-500 hover:bg-background-50 hover:text-red-700" aria-label={t('mh_link_remove', { name: getName(skill) })}>
                      <i className="ri-close-line" aria-hidden="true"></i>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="rounded-xl border border-background-200 bg-background-50 p-4">
          <div className="mb-4">
            <h4 className="font-heading text-lg font-semibold text-foreground-950">{t('mh_link_recommended_title')}</h4>
            <p className="mt-1 text-xs leading-5 text-foreground-600">{t('mh_link_recommended_desc')}</p>
          </div>
          <ol className="space-y-2">
            {suggestedSkills.map((skill, index) => {
              const rank = planner.ranks[skill.id] ?? 0;
              const equipped = equippedSet.has(skill.id);
              return (
                <li key={skill.id} className="flex items-center gap-3 rounded-lg border border-background-200 bg-background-100 p-3">
                  <span className="w-6 shrink-0 text-center text-xs font-bold text-foreground-500">#{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground-950">{getName(skill)}</div>
                    <div className="mt-0.5 truncate text-xs text-foreground-600">{getEffect(skill)}</div>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${rank > 0 ? 'bg-green-50 text-green-800' : 'bg-background-200 text-foreground-600'}`}>
                    {rank > 0 ? t('mh_link_level', { level: rank }) : t('mh_link_missing')}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleEquipped(skill)}
                    disabled={rank === 0}
                    className={`h-8 rounded-full px-3 text-xs font-semibold ${
                      equipped
                        ? 'border border-primary-300 bg-primary-50 text-primary-700'
                        : 'bg-foreground-950 text-background-50 hover:bg-foreground-800 disabled:cursor-not-allowed disabled:bg-background-300 disabled:text-foreground-500'
                    }`}
                  >
                    {equipped ? t('mh_link_remove_short') : t('mh_link_equip')}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section id="link-skill-collection" className="scroll-mt-24 rounded-xl border border-background-200 bg-background-50 p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h4 className="font-heading text-lg font-semibold text-foreground-950">{t('mh_link_collection_title')}</h4>
            <p className="mt-1 text-sm text-foreground-600">{t('mh_link_collection_desc')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex rounded-lg border border-background-300 bg-background-100 p-1" role="group" aria-label={t('mh_link_collection_filter')}>
              {(['all', 'owned', 'missing'] as CollectionFilter[]).map((filter) => (
                <button key={filter} type="button" onClick={() => setCollectionFilter(filter)} aria-pressed={collectionFilter === filter} className={`h-8 rounded-md px-3 text-xs font-semibold ${collectionFilter === filter ? 'bg-background-50 text-primary-700 shadow-sm' : 'text-foreground-600'}`}>
                  {t(`mh_link_filter_${filter}`)}
                </button>
              ))}
            </div>
            <label className="flex h-10 items-center rounded-lg border border-background-300 bg-background-50 px-3 focus-within:border-primary-500">
              <i className="ri-search-line mr-2 text-foreground-500" aria-hidden="true"></i>
              <span className="sr-only">{t('mh_link_search_label')}</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('mh_link_search_placeholder')} className="min-w-0 bg-transparent text-sm outline-none" />
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {visibleCollection.map((skill) => {
            const rank = planner.ranks[skill.id] ?? 0;
            const maxRank = getLinkSkillMaxRank(skill, version);
            const equipped = equippedSet.has(skill.id);
            return (
              <article key={skill.id} className={`rounded-lg border p-4 ${equipped ? 'border-primary-300 bg-primary-50/50' : 'border-background-200 bg-background-50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h5 className="font-heading text-base font-semibold text-foreground-950">{getName(skill)}</h5>
                    <p className="mt-1 text-xs leading-5 text-foreground-600">{getEffect(skill)}</p>
                    <p className="mt-2 text-[11px] text-foreground-500">{t('mh_link_sources')}: {skill.sourceClasses.join(', ')}</p>
                  </div>
                  {equipped && <span className="shrink-0 rounded bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-800">{t('mh_link_equipped_badge')}</span>}
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-2">
                  <label className="text-xs font-semibold text-foreground-700">
                    {t('mh_link_owned_level')}
                    <select value={rank} onChange={(event) => updateRank(skill, Number(event.target.value))} className="mt-1 block h-9 rounded-md border border-background-300 bg-background-50 px-2 text-sm font-medium outline-none focus:border-primary-500" aria-label={t('mh_link_rank_for', { name: getName(skill) })}>
                      {Array.from({ length: maxRank + 1 }, (_, value) => (
                        <option key={value} value={value}>{value === 0 ? t('mh_link_not_owned') : `${value} / ${maxRank}`}</option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={() => toggleEquipped(skill)} disabled={rank === 0 && !equipped} className={`ml-auto h-9 rounded-full px-3 text-xs font-semibold ${equipped ? 'border border-primary-300 bg-background-50 text-primary-700' : 'bg-primary-600 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-background-300 disabled:text-foreground-500'}`}>
                    {equipped ? t('mh_link_remove_short') : t('mh_link_equip')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
        <i className="ri-information-line mr-1" aria-hidden="true"></i>
        {t('mh_link_advice_note')}
      </div>

      <CharacterFormDialog
        open={characterDialogOpen}
        editing={null}
        defaultServer={versionInfo.shortLabel}
        onClose={() => setCharacterDialogOpen(false)}
        onSave={handleAddCharacter}
      />
    </div>
  );
}
