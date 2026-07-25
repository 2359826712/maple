import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { VerifiedSeriesResource } from './verifiedContent';

type CostRow = {
  target: number;
  probability: number;
  attempts: number;
  totalCost: number;
};

const probabilityPlannerIds = new Set([
  'idle-wiki-companion-summon-calculator',
  'idle-wiki-elite-summon-calculator',
  'idle-wiki-weapon-summon-calculator',
  'n-maplehub-cube-cost-calculator',
  'n-maplehub-raffle-reward-calculator',
  'n-maplehub-star-force-calculator',
]);

const costPlannerIds = new Set([
  'm-community-powder-cost-calculator',
]);

type GuideGroup = 'tool' | 'reference' | 'community' | 'developer' | 'ranking' | 'content';

const getGuideGroup = (category?: string): GuideGroup => {
  if (['calculator', 'simulator', 'planner', 'builder', 'optimizer', 'character-lookup', 'guild-lookup'].includes(category || '')) return 'tool';
  if (['wiki', 'database', 'guide', 'downloads'].includes(category || '')) return 'reference';
  if (['community', 'discord', 'reddit', 'youtube', 'media'].includes(category || '')) return 'community';
  if (['api', 'sdk', 'library', 'developer-tool', 'github'].includes(category || '')) return 'developer';
  if (category === 'rankings') return 'ranking';
  return 'content';
};

const combination = (n: number, k: number) => {
  if (k > n) return 0;
  let result = 1;
  for (let index = 1; index <= k; index += 1) {
    result *= (n - (k - index)) / index;
  }
  return result;
};

const probabilityAtLeast = (attempts: number, target: number, probability: number) => {
  let total = 0;
  for (let successes = target; successes <= attempts; successes += 1) {
    total += combination(attempts, successes)
      * (probability ** successes)
      * ((1 - probability) ** (attempts - successes));
  }
  return total;
};

function ClassicScrollCostCalculator() {
  const { t, i18n } = useTranslation();
  const [replacementCost, setReplacementCost] = useState('10');
  const [slots, setSlots] = useState('7');
  const [scrollCost, setScrollCost] = useState('1');
  const [submitted, setSubmitted] = useState({ replacementCost: 10, slots: 7, scrollCost: 1 });

  const rows = useMemo<CostRow[]>(() => {
    const attemptCost = submitted.replacementCost + (submitted.slots * submitted.scrollCost);
    return Array.from({ length: submitted.slots }, (_, index) => {
      const target = index + 1;
      const probability = probabilityAtLeast(submitted.slots, target, 0.6);
      const attempts = 1 / probability;
      return {
        target,
        probability,
        attempts,
        totalCost: attempts * attemptCost,
      };
    });
  }, [submitted]);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }),
    [i18n.language],
  );
  const calculate = () => {
    const nextReplacementCost = Number(replacementCost);
    const nextSlots = Math.min(15, Math.max(1, Math.floor(Number(slots))));
    const nextScrollCost = Number(scrollCost);
    if (
      !Number.isFinite(nextReplacementCost)
      || nextReplacementCost < 0
      || !Number.isFinite(nextSlots)
      || !Number.isFinite(nextScrollCost)
      || nextScrollCost < 0
    ) return;
    setSlots(String(nextSlots));
    setSubmitted({
      replacementCost: nextReplacementCost,
      slots: nextSlots,
      scrollCost: nextScrollCost,
    });
  };

  return (
    <section className="mb-12 overflow-hidden rounded-2xl border border-primary-200 bg-background-50 shadow-sm" aria-labelledby="scroll-calculator-heading">
      <div className="border-b border-primary-200 bg-gradient-to-r from-primary-100 to-secondary-100 px-5 py-5 md:px-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{t('resource_tool_onsite')}</p>
        <h2 id="scroll-calculator-heading" className="mt-1 font-heading text-2xl font-semibold">
          {t('scroll_cost_calculator_title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground-600">{t('scroll_cost_calculator_desc')}</p>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-3 md:p-7">
        <label className="block">
          <span className="text-xs font-semibold text-foreground-700">{t('scroll_cost_replacement')}</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={replacementCost}
            onChange={(event) => setReplacementCost(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-foreground-700">{t('scroll_cost_slots')}</span>
          <input
            type="number"
            min="1"
            max="15"
            step="1"
            value={slots}
            onChange={(event) => setSlots(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-foreground-700">{t('scroll_cost_scroll_price')}</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={scrollCost}
            onChange={(event) => setScrollCost(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
        <button
          type="button"
          onClick={calculate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-semibold text-background-50 hover:bg-primary-700 sm:col-span-3 sm:w-fit"
        >
          <i className="ri-calculator-line" aria-hidden="true" />
          {t('scroll_cost_calculate')}
        </button>
      </div>

      <div className="border-t border-background-200 px-5 py-6 md:px-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-heading text-xl font-semibold">{t('scroll_cost_results')}</h3>
            <p className="mt-1 text-xs text-foreground-500">
              {t('scroll_cost_attempt_price', {
                amount: numberFormatter.format(submitted.replacementCost + (submitted.slots * submitted.scrollCost)),
              })}
            </p>
          </div>
          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
            {t('scroll_cost_success_rate')}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-background-300">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead className="bg-foreground-950 text-background-50">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('scroll_cost_target')}</th>
                <th className="px-4 py-3 font-semibold">{t('scroll_cost_probability')}</th>
                <th className="px-4 py-3 font-semibold">{t('scroll_cost_average_attempts')}</th>
                <th className="px-4 py-3 font-semibold">{t('scroll_cost_average_total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-200">
              {rows.map((row) => (
                <tr key={row.target} className="odd:bg-background-50 even:bg-background-100">
                  <td className="px-4 py-3 font-semibold text-foreground-950">{row.target}</td>
                  <td className="px-4 py-3 text-foreground-700">{numberFormatter.format(row.probability * 100)}%</td>
                  <td className="px-4 py-3 text-foreground-700">{numberFormatter.format(row.attempts)}</td>
                  <td className="px-4 py-3 font-semibold text-primary-800">
                    {numberFormatter.format(Math.round(row.totalCost))} {t('scroll_cost_million')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-xl border border-background-200 bg-background-100 p-4">
          <h3 className="text-sm font-semibold text-foreground-950">{t('scroll_cost_method_title')}</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-5 text-foreground-600">
            <li>{t('scroll_cost_method_attempt')}</li>
            <li>{t('scroll_cost_method_probability')}</li>
            <li>{t('scroll_cost_method_average')}</li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function ProbabilityPlanner({ resource }: { resource: VerifiedSeriesResource }) {
  const { t, i18n } = useTranslation();
  const [chance, setChance] = useState('1');
  const [attempts, setAttempts] = useState('100');
  const [cost, setCost] = useState('0');
  const probability = Math.min(1, Math.max(0, Number(chance) / 100 || 0));
  const attemptCount = Math.max(0, Math.floor(Number(attempts) || 0));
  const unitCost = Math.max(0, Number(cost) || 0);
  const atLeastOne = probability > 0 ? 1 - ((1 - probability) ** attemptCount) : 0;
  const expected = probability * attemptCount;
  const attemptsFor = (target: number) => (
    probability <= 0
      ? null
      : probability >= 1
        ? 1
        : Math.ceil(Math.log(1 - target) / Math.log(1 - probability))
  );
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }),
    [i18n.language],
  );
  return (
    <section className="mb-12 overflow-hidden rounded-2xl border border-primary-200 bg-background-50 shadow-sm" aria-labelledby="probability-planner-heading">
      <div className="border-b border-primary-200 bg-gradient-to-r from-primary-100 to-secondary-100 px-5 py-5 md:px-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{t('resource_tool_onsite')}</p>
        <h2 id="probability-planner-heading" className="mt-1 font-heading text-2xl font-semibold">
          {t('probability_planner_title', { name: resource.title })}
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground-600">{t('probability_planner_desc')}</p>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-3 md:p-7">
        <label className="block">
          <span className="text-xs font-semibold text-foreground-700">{t('probability_single_chance')}</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={chance}
            onChange={(event) => setChance(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-foreground-700">{t('probability_attempts')}</span>
          <input
            type="number"
            min="0"
            step="1"
            value={attempts}
            onChange={(event) => setAttempts(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-foreground-700">{t('probability_cost_per_attempt')}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
      </div>

      <div className="grid gap-3 border-t border-background-200 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-7">
        {[
          [t('probability_at_least_one'), `${numberFormatter.format(atLeastOne * 100)}%`],
          [t('probability_expected_count'), numberFormatter.format(expected)],
          [t('probability_total_cost'), numberFormatter.format(attemptCount * unitCost)],
          [t('probability_attempts_90'), attemptsFor(0.9) === null ? '—' : numberFormatter.format(attemptsFor(0.9)!)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-background-200 bg-background-100 p-4">
            <p className="text-xs font-semibold text-foreground-500">{label}</p>
            <p className="mt-2 font-heading text-2xl font-semibold text-foreground-950">{value}</p>
          </div>
        ))}
        <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-background-200 bg-background-50 p-4 text-xs leading-6 text-foreground-600">
          {t('probability_targets', {
            fifty: attemptsFor(0.5) ?? '—',
            ninety: attemptsFor(0.9) ?? '—',
            ninetyFive: attemptsFor(0.95) ?? '—',
          })}
        </div>
        <p className="sm:col-span-2 lg:col-span-4 text-xs leading-5 text-foreground-500">
          {t('probability_method_note')}
        </p>
      </div>
    </section>
  );
}

function MaterialCostPlanner({ resource }: { resource: VerifiedSeriesResource }) {
  const { t, i18n } = useTranslation();
  const [required, setRequired] = useState('1000');
  const [owned, setOwned] = useState('0');
  const [unitCost, setUnitCost] = useState('0.1');
  const requiredAmount = Math.max(0, Number(required) || 0);
  const ownedAmount = Math.max(0, Number(owned) || 0);
  const remaining = Math.max(0, requiredAmount - ownedAmount);
  const totalCost = remaining * Math.max(0, Number(unitCost) || 0);
  const completion = requiredAmount > 0 ? Math.min(100, (ownedAmount / requiredAmount) * 100) : 100;
  const fields: Array<[string, string, (value: string) => void]> = [
    [t('material_required'), required, setRequired],
    [t('material_owned'), owned, setOwned],
    [t('material_unit_cost'), unitCost, setUnitCost],
  ];
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }),
    [i18n.language],
  );

  return (
    <section className="mb-12 overflow-hidden rounded-2xl border border-primary-200 bg-background-50 shadow-sm" aria-labelledby="material-cost-heading">
      <div className="border-b border-primary-200 bg-gradient-to-r from-primary-100 to-secondary-100 px-5 py-5 md:px-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{t('resource_tool_onsite')}</p>
        <h2 id="material-cost-heading" className="mt-1 font-heading text-2xl font-semibold">
          {t('material_cost_title', { name: resource.title })}
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground-600">{t('material_cost_desc')}</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-3 md:p-7">
        {fields.map(([label, value, setter]) => (
          <label key={String(label)} className="block">
            <span className="text-xs font-semibold text-foreground-700">{label}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={String(value)}
              onChange={(event) => setter(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />
          </label>
        ))}
      </div>
      <div className="grid gap-3 border-t border-background-200 p-5 sm:grid-cols-3 md:p-7">
        {[
          [t('material_remaining'), numberFormatter.format(remaining)],
          [t('material_total_cost'), numberFormatter.format(totalCost)],
          [t('material_completion'), `${numberFormatter.format(completion)}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-background-200 bg-background-100 p-4">
            <p className="text-xs font-semibold text-foreground-500">{label}</p>
            <p className="mt-2 font-heading text-2xl font-semibold text-foreground-950">{value}</p>
          </div>
        ))}
        <p className="sm:col-span-3 text-xs leading-5 text-foreground-500">{t('material_cost_note')}</p>
      </div>
    </section>
  );
}

function ResourcePracticalGuide({ resource }: { resource: VerifiedSeriesResource }) {
  const { t } = useTranslation();
  const record = resource.resourceRecord;
  if (!record) return null;
  const group = getGuideGroup(record.category);
  const steps = [1, 2, 3].map((index) => t(`resource_guide_${group}_step_${index}`));

  return (
    <section className="mb-12 overflow-hidden rounded-2xl border border-background-300 bg-background-50 shadow-sm" aria-labelledby="resource-practical-guide-heading">
      <div className="border-b border-background-200 bg-background-100 px-5 py-5 md:px-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{t('resource_guide_eyebrow')}</p>
        <h2 id="resource-practical-guide-heading" className="mt-1 font-heading text-2xl font-semibold">
          {t('resource_guide_title')}
        </h2>
      </div>
      <div className="grid gap-6 p-5 md:grid-cols-2 md:p-7">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <i className="ri-compass-3-line text-primary-700" aria-hidden="true" />
            {t('resource_guide_scope')}
          </h3>
          <p className="mt-3 text-sm leading-7 text-foreground-700">{resource.description}</p>
          {record.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {record.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">
                  {tag.replaceAll('-', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <i className="ri-route-line text-primary-700" aria-hidden="true" />
            {t('resource_guide_steps')}
          </h3>
          <ol className="mt-3 space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-foreground-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-800">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-background-200 bg-background-100 p-4">
          <h3 className="text-sm font-semibold text-foreground-950">{t('resource_guide_access')}</h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-5 text-foreground-600">
            <li>{t('resource_guide_regions', { regions: record.regions.join(', ') })}</li>
            <li>{t('resource_guide_languages', { languages: record.languages.join(', ') })}</li>
            <li>{t(record.login_required ? 'resource_guide_login_required' : 'resource_guide_login_open')}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-background-200 bg-background-100 p-4">
          <h3 className="text-sm font-semibold text-foreground-950">{t('resource_guide_verification')}</h3>
          <p className="mt-2 text-xs leading-5 text-foreground-600">
            {t('resource_guide_verified', {
              source: record.website,
              date: record.last_checked,
              status: record.status,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}

export const hasResourceDetailExperience = (resource?: VerifiedSeriesResource) => Boolean(
  resource?.resourceId
  && (
    resource.resourceId === 'classicworld-scroll-cost-simulator'
    || probabilityPlannerIds.has(resource.resourceId)
    || costPlannerIds.has(resource.resourceId)
  )
);

export default function ResourceDetailExperience({ resource }: { resource: VerifiedSeriesResource }) {
  if (resource.resourceId === 'classicworld-scroll-cost-simulator') {
    return <ClassicScrollCostCalculator />;
  }
  if (resource.resourceId && probabilityPlannerIds.has(resource.resourceId)) {
    return <ProbabilityPlanner resource={resource} />;
  }
  if (resource.resourceId && costPlannerIds.has(resource.resourceId)) {
    return <MaterialCostPlanner resource={resource} />;
  }
  return <ResourcePracticalGuide resource={resource} />;
}
