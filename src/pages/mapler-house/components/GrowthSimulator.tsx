import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { growthData } from '@/mocks/mapler-house';

type GrowthTab = 'leveling' | 'hexa';

const expCurve = (level: number) => Math.max(1, Math.round(80 * Math.pow(1.108, level - 200)));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function GrowthSimulator() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<GrowthTab>('leveling');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-background-200 bg-background-100 p-1">
        {[
          { key: 'leveling' as const, label: t('mh_growth_potions'), icon: 'ri-flask-line' },
          { key: 'hexa' as const, label: t('mh_growth_sixth_job'), icon: 'ri-star-smile-line' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`h-10 rounded-md text-sm font-semibold cursor-pointer ${
              activeTab === tab.key ? 'bg-background-50 text-primary-700 shadow-sm' : 'text-foreground-600 hover:text-foreground-950'
            }`}
          >
            <i className={`${tab.icon} mr-1.5`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'leveling' ? <LevelingPlanner /> : <HexaPlanner />}
    </div>
  );
}

function LevelingPlanner() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const vData = growthData[version] || growthData.gms;
  const [currentLevel, setCurrentLevel] = useState(260);
  const [currentExp, setCurrentExp] = useState(15);
  const [targetLevel, setTargetLevel] = useState(275);
  const [dailyExp, setDailyExp] = useState(28);
  const [couponBonus, setCouponBonus] = useState(0);
  const [inventory, setInventory] = useState<Record<string, number>>({
    typhoon: 0,
    magnificent: 2,
    extreme: 4,
    growth: 10,
  });

  const result = useMemo(() => {
    const start = clamp(currentLevel, 1, 299);
    const target = clamp(targetLevel, start + 1, 300);
    let requiredExp = expCurve(start) * (1 - clamp(currentExp, 0, 99.99) / 100);

    for (let level = start + 1; level < target; level++) requiredExp += expCurve(level);

    const potionLevels =
      inventory.typhoon * 1 +
      inventory.magnificent * 1 +
      inventory.extreme * 0.7 +
      inventory.growth * 0.45;
    const potionExp = Array.from({ length: Math.ceil(potionLevels) }, (_, index) => index).reduce((sum, index) => {
      const level = clamp(start + index, start, target - 1);
      return sum + expCurve(level) * (index < Math.floor(potionLevels) ? 1 : potionLevels % 1 || 1);
    }, 0);
    const adjustedDaily = Math.max(1, dailyExp * (1 + couponBonus / 100));
    const remainingExp = Math.max(0, requiredExp - potionExp);
    const days = Math.ceil(remainingExp / adjustedDaily);

    return {
      requiredExp,
      potionExp,
      remainingExp,
      days,
      target,
      potionLevels,
    };
  }, [couponBonus, currentExp, currentLevel, dailyExp, inventory, targetLevel]);

  const updateInventory = (key: string, value: number) => {
    setInventory((current) => ({ ...current, [key]: clamp(value, 0, 999) }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
      <section className="space-y-4">
        <div className="rounded-lg border border-background-200 bg-background-100 p-4">
          <h3 className="font-heading font-semibold text-foreground-950">{t('mh_growth_calc')}</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <NumberField label={t('mh_growth_current_level')} value={currentLevel} onChange={setCurrentLevel} min={1} max={299} />
            <NumberField label={t('mh_growth_target_level')} value={targetLevel} onChange={setTargetLevel} min={2} max={300} />
            <NumberField label="Current EXP %" value={currentExp} onChange={setCurrentExp} min={0} max={99} />
            <NumberField label="Daily EXP (billion)" value={dailyExp} onChange={setDailyExp} min={1} max={999999} />
            <NumberField label="Event / Coupon Bonus %" value={couponBonus} onChange={setCouponBonus} min={0} max={1000} />
          </div>
        </div>

        <div className="rounded-lg border border-background-200 bg-background-100 p-4">
          <h3 className="font-heading font-semibold text-foreground-950">{t('mh_growth_potions_needed')}</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'typhoon', label: t('mh_growth_typhoon_potion'), icon: 'ri-tornado-line' },
              { key: 'magnificent', label: t('mh_growth_magnificent'), icon: 'ri-star-smile-line' },
              { key: 'extreme', label: t('mh_growth_extreme'), icon: 'ri-flask-line' },
              { key: 'growth', label: t('mh_growth_basic'), icon: 'ri-medicine-bottle-line' },
            ].map((item) => (
              <label key={item.key} className="rounded-md border border-background-200 bg-background-50 p-3">
                <span className="flex items-center gap-2 text-xs font-semibold text-foreground-700">
                  <i className={`${item.icon} text-primary-600`}></i>
                  {item.label}
                </span>
                <input
                  type="number"
                  min={0}
                  value={inventory[item.key] ?? 0}
                  onChange={(event) => updateInventory(item.key, Number(event.target.value) || 0)}
                  className="mt-2 h-10 w-full rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {vData.potions.map((potion) => (
            <div key={potion.name} className="rounded-lg border border-background-200 bg-background-50 p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-primary-100 text-primary-700 flex items-center justify-center">
                  <i className={potion.icon}></i>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-foreground-950">{potion.name}</div>
                  <div className="text-[10px] text-foreground-500">+{potion.levels} · {potion.rarity}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="space-y-3">
        <ResultCard label="EXP Required" value={`${Math.round(result.requiredExp).toLocaleString()}b`} icon="ri-bar-chart-line" />
        <ResultCard label="Covered by Potions" value={`${Math.round(result.potionExp).toLocaleString()}b`} icon="ri-flask-line" />
        <ResultCard label="Remaining Days" value={`${result.days}`} icon="ri-calendar-check-line" highlight />
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 text-sm text-foreground-800">
          <div className="font-semibold text-primary-800">Player read</div>
          <p className="mt-1 text-xs leading-relaxed">
            Potion value is estimated as level-equivalent EXP. Use this for event routing, not exact official EXP tables.
          </p>
        </div>
      </aside>
    </div>
  );
}

function HexaPlanner() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const vData = growthData[version] || growthData.gms;
  const [dailyFragments, setDailyFragments] = useState(vData.sixthJob.dailySolErdaFragment);
  const [weeklyFragments, setWeeklyFragments] = useState(120);
  const [ownedFragments, setOwnedFragments] = useState(0);
  const [ownedErda, setOwnedErda] = useState(0);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const stages = vData.sixthJob.stages;
  const totals = useMemo(() => {
    const requiredFragments = stages.reduce((sum, stage) => sum + stage.solErdaFragment, 0);
    const requiredErda = stages.reduce((sum, stage) => sum + stage.solErda, 0);
    const doneFragments = stages.reduce((sum, stage) => sum + Math.min(stage.solErdaFragment, progress[stage.name] ?? 0), 0);
    const remainingFragments = Math.max(0, requiredFragments - doneFragments - ownedFragments);
    const remainingErda = Math.max(0, requiredErda - ownedErda);
    const weeklyIncome = dailyFragments * 7 + weeklyFragments;

    return {
      requiredFragments,
      requiredErda,
      doneFragments,
      remainingFragments,
      remainingErda,
      days: Math.ceil(remainingFragments / Math.max(1, weeklyIncome) * 7),
      weeklyIncome,
    };
  }, [dailyFragments, ownedErda, ownedFragments, progress, stages, weeklyFragments]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
      <aside className="rounded-lg border border-background-200 bg-background-100 p-4 h-fit">
        <h3 className="font-heading font-semibold text-foreground-950">{t('mh_growth_sixth_job')}</h3>
        <div className="mt-4 space-y-3">
          <NumberField label={t('mh_growth_daily_fragment')} value={dailyFragments} onChange={setDailyFragments} min={0} max={9999} />
          <NumberField label="Weekly boss / event fragments" value={weeklyFragments} onChange={setWeeklyFragments} min={0} max={99999} />
          <NumberField label="Owned fragments" value={ownedFragments} onChange={setOwnedFragments} min={0} max={999999} />
          <NumberField label="Owned Sol Erda" value={ownedErda} onChange={setOwnedErda} min={0} max={999999} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat label="Weekly income" value={totals.weeklyIncome.toLocaleString()} />
          <MiniStat label={t('mh_growth_days_needed')} value={`${totals.days}`} />
          <MiniStat label="Fragments left" value={totals.remainingFragments.toLocaleString()} />
          <MiniStat label="Sol Erda left" value={totals.remainingErda.toLocaleString()} />
        </div>
      </aside>

      <section className="space-y-3">
        {stages.map((stage, index) => {
          const current = clamp(progress[stage.name] ?? 0, 0, stage.solErdaFragment);
          const pct = stage.solErdaFragment > 0 ? Math.round((current / stage.solErdaFragment) * 100) : 100;

          return (
            <div key={stage.name} className="rounded-lg border border-background-200 bg-background-50 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <h4 className="font-heading font-semibold text-foreground-950">{stage.name}</h4>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-foreground-600">
                    <span>{stage.solErda.toLocaleString()} Sol Erda</span>
                    <span>{stage.solErdaFragment.toLocaleString()} Fragments</span>
                    <span>{stage.hours}h quest / grind</span>
                  </div>
                </div>
                <input
                  type="number"
                  value={current}
                  min={0}
                  max={stage.solErdaFragment}
                  onChange={(event) => setProgress((prev) => ({ ...prev, [stage.name]: Number(event.target.value) || 0 }))}
                  className="h-10 w-full md:w-32 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-background-200 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 text-right text-xs font-bold text-foreground-700">{pct}%</span>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground-700">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(clamp(Number(event.target.value) || 0, min, max))}
        className="mt-1 h-10 w-full rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
      />
    </label>
  );
}

function ResultCard({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-primary-200 bg-primary-50' : 'border-background-200 bg-background-100'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-foreground-600">{label}</span>
        <i className={`${icon} ${highlight ? 'text-primary-700' : 'text-foreground-500'}`}></i>
      </div>
      <div className="mt-2 font-heading text-2xl font-semibold text-foreground-950">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-background-200 bg-background-50 p-3">
      <div className="text-[11px] text-foreground-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-foreground-950">{value}</div>
    </div>
  );
}
