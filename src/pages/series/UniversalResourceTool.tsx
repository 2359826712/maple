import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readLocalStorage, writeLocalStorage } from '@/services/browserStorage';
import type { VerifiedSeriesResource } from './verifiedContent';
import { getResourceToolKind } from './resourceToolRegistry';

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

function ToolShell({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  const { t } = useTranslation();
  return (
    <section className="mb-12 overflow-hidden rounded-2xl border border-primary-200 bg-background-50 shadow-sm">
      <div className="border-b border-primary-200 bg-gradient-to-r from-primary-100 to-secondary-100 px-5 py-5 md:px-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{t('resource_tool_onsite')}</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function NumberField({
  label,
  min = 0,
  onChange,
  step = 'any',
  value,
}: {
  label: string;
  min?: number;
  onChange: (value: string) => void;
  step?: number | 'any';
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground-700">{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
      />
    </label>
  );
}

function Metrics({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 border-t border-background-200 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-7">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-background-200 bg-background-100 p-4">
          <p className="text-xs font-semibold text-foreground-500">{label}</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-foreground-950">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ProbabilityWorkspace({ resource }: { resource: VerifiedSeriesResource }) {
  const { t, i18n } = useTranslation();
  const [chance, setChance] = useState('1');
  const [attempts, setAttempts] = useState('100');
  const [cost, setCost] = useState('0');
  const probability = clamp(Number(chance) / 100 || 0, 0, 1);
  const count = Math.max(0, Math.floor(Number(attempts) || 0));
  const unitCost = Math.max(0, Number(cost) || 0);
  const cumulative = probability > 0 ? 1 - ((1 - probability) ** count) : 0;
  const formatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }),
    [i18n.language],
  );
  const attemptsFor = (target: number) => probability <= 0
    ? null
    : probability >= 1
      ? 1
      : Math.ceil(Math.log(1 - target) / Math.log(1 - probability));

  return (
    <ToolShell
      title={t('universal_probability_title', { name: resource.title })}
      description={t('universal_probability_desc')}
    >
      <div className="grid gap-4 p-5 sm:grid-cols-3 md:p-7">
        <NumberField label={t('probability_single_chance')} value={chance} onChange={setChance} />
        <NumberField label={t('probability_attempts')} value={attempts} onChange={setAttempts} step={1} />
        <NumberField label={t('probability_cost_per_attempt')} value={cost} onChange={setCost} />
      </div>
      <Metrics rows={[
        [t('probability_at_least_one'), `${formatter.format(cumulative * 100)}%`],
        [t('probability_expected_count'), formatter.format(probability * count)],
        [t('probability_total_cost'), formatter.format(unitCost * count)],
        [t('probability_attempts_90'), attemptsFor(0.9) === null ? '—' : formatter.format(attemptsFor(0.9)!)],
      ]} />
      <p className="px-5 pb-6 text-xs leading-5 text-foreground-500 md:px-7">{t('probability_method_note')}</p>
    </ToolShell>
  );
}

function CombatWorkspace({ resource }: { resource: VerifiedSeriesResource }) {
  const { t, i18n } = useTranslation();
  const subcategory = resource.resourceRecord?.subcategory;
  const hitMode = subcategory === 'combat-accuracy' || subcategory === 'combat-avoidability';
  const [primary, setPrimary] = useState(hitMode ? '120' : '1000');
  const [secondary, setSecondary] = useState(hitMode ? '80' : '250');
  const [attack, setAttack] = useState(hitMode ? '0' : '100');
  const [bonus, setBonus] = useState('0');
  const formatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }),
    [i18n.language],
  );
  const primaryValue = Math.max(0, Number(primary) || 0);
  const secondaryValue = Math.max(0, Number(secondary) || 0);
  const attackValue = Math.max(0, Number(attack) || 0);
  const bonusValue = Number(bonus) || 0;
  const hitChance = clamp(100 + ((primaryValue - secondaryValue) * 0.25) - (Math.max(0, bonusValue) * 2), 5, 100);
  const estimatedDamage = ((primaryValue * 4 + secondaryValue) / 100)
    * attackValue
    * (1 + Math.max(0, bonusValue) / 100);

  return (
    <ToolShell
      title={t(hitMode ? 'universal_hit_title' : 'universal_damage_title', { name: resource.title })}
      description={t(hitMode ? 'universal_hit_desc' : 'universal_damage_desc')}
    >
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-7">
        <NumberField
          label={t(hitMode ? 'universal_accuracy' : 'universal_main_stat')}
          value={primary}
          onChange={setPrimary}
        />
        <NumberField
          label={t(hitMode ? 'universal_avoidability' : 'universal_secondary_stat')}
          value={secondary}
          onChange={setSecondary}
        />
        <NumberField
          label={t(hitMode ? 'universal_level_disadvantage' : 'universal_attack')}
          value={hitMode ? bonus : attack}
          onChange={hitMode ? setBonus : setAttack}
        />
        {!hitMode && (
          <NumberField label={t('universal_damage_bonus')} value={bonus} onChange={setBonus} />
        )}
      </div>
      <Metrics rows={hitMode
        ? [
            [t('universal_hit_chance'), `${formatter.format(hitChance)}%`],
            [t('universal_miss_chance'), `${formatter.format(100 - hitChance)}%`],
          ]
        : [
            [t('universal_damage_index'), formatter.format(estimatedDamage)],
            [t('universal_base_stat_index'), formatter.format(primaryValue * 4 + secondaryValue)],
          ]} />
      <p className="px-5 pb-6 text-xs leading-5 text-foreground-500 md:px-7">
        {t(hitMode ? 'universal_hit_note' : 'universal_damage_note')}
      </p>
    </ToolShell>
  );
}

function ComparisonWorkspace({ resource }: { resource: VerifiedSeriesResource }) {
  const { t, i18n } = useTranslation();
  const [currentStat, setCurrentStat] = useState('100');
  const [currentAttack, setCurrentAttack] = useState('10');
  const [candidateStat, setCandidateStat] = useState('100');
  const [candidateAttack, setCandidateAttack] = useState('10');
  const [attackWeight, setAttackWeight] = useState('4');
  const formatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2, signDisplay: 'exceptZero' }),
    [i18n.language],
  );
  const weight = Math.max(0, Number(attackWeight) || 0);
  const currentScore = Math.max(0, Number(currentStat) || 0) + (Math.max(0, Number(currentAttack) || 0) * weight);
  const candidateScore = Math.max(0, Number(candidateStat) || 0) + (Math.max(0, Number(candidateAttack) || 0) * weight);

  return (
    <ToolShell title={t('universal_compare_title', { name: resource.title })} description={t('universal_compare_desc')}>
      <div className="grid gap-6 p-5 lg:grid-cols-2 md:p-7">
        <fieldset className="grid gap-4 rounded-xl border border-background-200 p-4 sm:grid-cols-2">
          <legend className="px-2 text-sm font-semibold">{t('universal_current_item')}</legend>
          <NumberField label={t('universal_weighted_stat')} value={currentStat} onChange={setCurrentStat} />
          <NumberField label={t('universal_attack')} value={currentAttack} onChange={setCurrentAttack} />
        </fieldset>
        <fieldset className="grid gap-4 rounded-xl border border-background-200 p-4 sm:grid-cols-2">
          <legend className="px-2 text-sm font-semibold">{t('universal_candidate_item')}</legend>
          <NumberField label={t('universal_weighted_stat')} value={candidateStat} onChange={setCandidateStat} />
          <NumberField label={t('universal_attack')} value={candidateAttack} onChange={setCandidateAttack} />
        </fieldset>
        <div className="lg:col-span-2">
          <NumberField label={t('universal_attack_weight')} value={attackWeight} onChange={setAttackWeight} />
        </div>
      </div>
      <Metrics rows={[
        [t('universal_current_score'), formatter.format(currentScore)],
        [t('universal_candidate_score'), formatter.format(candidateScore)],
        [t('universal_score_change'), formatter.format(candidateScore - currentScore)],
        [t('universal_change_percent'), currentScore ? `${formatter.format(((candidateScore / currentScore) - 1) * 100)}%` : '—'],
      ]} />
      <p className="px-5 pb-6 text-xs leading-5 text-foreground-500 md:px-7">{t('universal_compare_note')}</p>
    </ToolShell>
  );
}

function MaterialWorkspace({ resource }: { resource: VerifiedSeriesResource }) {
  const { t, i18n } = useTranslation();
  const [required, setRequired] = useState('1000');
  const [owned, setOwned] = useState('0');
  const [unitCost, setUnitCost] = useState('0.1');
  const requiredValue = Math.max(0, Number(required) || 0);
  const ownedValue = Math.max(0, Number(owned) || 0);
  const remaining = Math.max(0, requiredValue - ownedValue);
  const formatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }),
    [i18n.language],
  );
  return (
    <ToolShell title={t('material_cost_title', { name: resource.title })} description={t('material_cost_desc')}>
      <div className="grid gap-4 p-5 sm:grid-cols-3 md:p-7">
        <NumberField label={t('material_required')} value={required} onChange={setRequired} />
        <NumberField label={t('material_owned')} value={owned} onChange={setOwned} />
        <NumberField label={t('material_unit_cost')} value={unitCost} onChange={setUnitCost} />
      </div>
      <Metrics rows={[
        [t('material_remaining'), formatter.format(remaining)],
        [t('material_total_cost'), formatter.format(remaining * Math.max(0, Number(unitCost) || 0))],
        [t('material_completion'), `${formatter.format(requiredValue ? clamp((ownedValue / requiredValue) * 100, 0, 100) : 100)}%`],
      ]} />
    </ToolShell>
  );
}

function ProgressWorkspace({ resource }: { resource: VerifiedSeriesResource }) {
  const { t, i18n } = useTranslation();
  const [current, setCurrent] = useState('0');
  const [target, setTarget] = useState('100000');
  const [gain, setGain] = useState('1000');
  const [rate, setRate] = useState('60');
  const currentValue = Math.max(0, Number(current) || 0);
  const targetValue = Math.max(0, Number(target) || 0);
  const remaining = Math.max(0, targetValue - currentValue);
  const gainValue = Math.max(0, Number(gain) || 0);
  const actions = gainValue ? Math.ceil(remaining / gainValue) : null;
  const formatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }),
    [i18n.language],
  );
  const hourlyRate = Math.max(0, Number(rate) || 0);
  return (
    <ToolShell title={t('universal_progress_title', { name: resource.title })} description={t('universal_progress_desc')}>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-7">
        <NumberField label={t('universal_current_value')} value={current} onChange={setCurrent} />
        <NumberField label={t('universal_target_value')} value={target} onChange={setTarget} />
        <NumberField label={t('universal_gain_per_action')} value={gain} onChange={setGain} />
        <NumberField label={t('universal_actions_per_hour')} value={rate} onChange={setRate} />
      </div>
      <Metrics rows={[
        [t('universal_remaining'), formatter.format(remaining)],
        [t('universal_actions_needed'), actions === null ? '—' : formatter.format(actions)],
        [t('universal_hours_needed'), actions === null || !hourlyRate ? '—' : formatter.format(actions / hourlyRate)],
        [t('material_completion'), `${formatter.format(targetValue ? clamp((currentValue / targetValue) * 100, 0, 100) : 100)}%`],
      ]} />
    </ToolShell>
  );
}

function RewardWorkspace({ resource }: { resource: VerifiedSeriesResource }) {
  const { t, i18n } = useTranslation();
  const [reward, setReward] = useState('1000');
  const [players, setPlayers] = useState('4');
  const [fee, setFee] = useState('0');
  const rewardValue = Math.max(0, Number(reward) || 0);
  const playerCount = Math.max(1, Math.floor(Number(players) || 1));
  const feeRate = clamp(Number(fee) || 0, 0, 100);
  const net = rewardValue * (1 - feeRate / 100);
  const formatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }),
    [i18n.language],
  );
  return (
    <ToolShell title={t('universal_reward_title', { name: resource.title })} description={t('universal_reward_desc')}>
      <div className="grid gap-4 p-5 sm:grid-cols-3 md:p-7">
        <NumberField label={t('universal_reward_pool')} value={reward} onChange={setReward} />
        <NumberField label={t('universal_party_size')} value={players} onChange={setPlayers} step={1} min={1} />
        <NumberField label={t('universal_fee_percent')} value={fee} onChange={setFee} />
      </div>
      <Metrics rows={[
        [t('universal_net_reward'), formatter.format(net)],
        [t('universal_reward_per_player'), formatter.format(net / playerCount)],
        [t('universal_total_fee'), formatter.format(rewardValue - net)],
      ]} />
    </ToolShell>
  );
}

type TrackerItem = { id: string; label: string; done: boolean };

function TrackerWorkspace({ resource }: { resource: VerifiedSeriesResource }) {
  const { t } = useTranslation();
  const storageKey = `mpstorys-tool-plan:${resource.resourceId}`;
  const [items, setItems] = useState<TrackerItem[]>([]);
  const [draft, setDraft] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = readLocalStorage(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {
        // Ignore an invalid local plan and start with an empty list.
      }
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (loaded) writeLocalStorage(storageKey, JSON.stringify(items));
  }, [items, loaded, storageKey]);

  const addItem = () => {
    const label = draft.trim();
    if (!label) return;
    setItems((current) => [...current, { id: `${Date.now()}-${current.length}`, label, done: false }]);
    setDraft('');
  };
  const completed = items.filter((item) => item.done).length;

  return (
    <ToolShell title={t('universal_tracker_title', { name: resource.title })} description={t('universal_tracker_desc')}>
      <div className="p-5 md:p-7">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addItem();
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('universal_tracker_placeholder')}
            className="h-11 min-w-0 flex-1 rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
          <button type="submit" className="h-11 rounded-lg bg-primary-600 px-5 text-sm font-semibold text-background-50 hover:bg-primary-700">
            {t('universal_tracker_add')}
          </button>
        </form>
        <div className="mt-5 flex items-center justify-between text-xs font-semibold text-foreground-500">
          <span>{t('universal_tracker_progress', { completed, total: items.length })}</span>
          {items.length > 0 && (
            <button type="button" onClick={() => setItems([])} className="text-primary-700 hover:text-primary-800">
              {t('universal_tracker_clear')}
            </button>
          )}
        </div>
        <ul className="mt-3 divide-y divide-background-200 rounded-xl border border-background-200">
          {items.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-foreground-500">{t('universal_tracker_empty')}</li>
          ) : items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => setItems((current) => current.map((candidate) => (
                  candidate.id === item.id ? { ...candidate, done: !candidate.done } : candidate
                )))}
                className="h-4 w-4 accent-primary-600"
              />
              <span className={`min-w-0 flex-1 text-sm ${item.done ? 'text-foreground-400 line-through' : 'text-foreground-800'}`}>
                {item.label}
              </span>
              <button
                type="button"
                aria-label={t('universal_tracker_remove')}
                onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))}
                className="text-foreground-400 hover:text-primary-700"
              >
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-foreground-500">{t('universal_tracker_local_note')}</p>
      </div>
    </ToolShell>
  );
}

export default function UniversalResourceTool({
  resource,
}: {
  resource: VerifiedSeriesResource;
}) {
  const kind = getResourceToolKind(resource);
  if (kind === 'probability') return <ProbabilityWorkspace resource={resource} />;
  if (kind === 'combat') return <CombatWorkspace resource={resource} />;
  if (kind === 'comparison') return <ComparisonWorkspace resource={resource} />;
  if (kind === 'material') return <MaterialWorkspace resource={resource} />;
  if (kind === 'reward') return <RewardWorkspace resource={resource} />;
  if (kind === 'tracker') return <TrackerWorkspace resource={resource} />;
  if (kind === 'progress') return <ProgressWorkspace resource={resource} />;
  return null;
}
