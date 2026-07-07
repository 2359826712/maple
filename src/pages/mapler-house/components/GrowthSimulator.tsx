import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { growthData } from '@/mocks/mapler-house';

export default function GrowthSimulator() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [activeTab, setActiveTab] = useState<'potions' | 'sixth'>('potions');

  return (
    <div className="space-y-5">
      <div className="flex bg-background-100 rounded-full p-1 gap-1">
        <button
          onClick={() => setActiveTab('potions')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'potions' ? 'bg-background-50 text-primary-700 shadow-sm' : 'text-foreground-600'
          }`}
        >
          <i className="ri-flask-line mr-1.5"></i>{t('mh_growth_potions')}
        </button>
        <button
          onClick={() => setActiveTab('sixth')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'sixth' ? 'bg-background-50 text-primary-700 shadow-sm' : 'text-foreground-600'
          }`}
        >
          <i className="ri-star-smile-line mr-1.5"></i>{t('mh_growth_sixth_job')}
        </button>
      </div>

      {activeTab === 'potions' ? <GrowthPotionCalc version={version} /> : <SixthJobTracker version={version} />}
    </div>
  );
}

function GrowthPotionCalc({ version }: { version: string }) {
  const { t } = useTranslation();
  const [currentLevel, setCurrentLevel] = useState(200);
  const [targetLevel, setTargetLevel] = useState(250);
  const [calculated, setCalculated] = useState(false);

  const vData = growthData[version] || growthData.gms;
  const potions = vData.potions;
  const levelsNeeded = Math.max(0, targetLevel - currentLevel);

  const calc = () => {
    if (currentLevel >= targetLevel || currentLevel < 200) return;
    setCalculated(true);
  };

  const estimatePotions = () => {
    let remaining = levelsNeeded;
    let typhoon = 0;
    let magnificent = 0;
    let extreme = 0;
    let growth = 0;

    if (remaining >= 200 && targetLevel >= 249) {
      typhoon = Math.min(Math.floor(remaining / 200), 10);
      remaining -= typhoon * 200;
    }
    magnificent = Math.floor(remaining / 7);
    remaining -= magnificent * 7;
    extreme = Math.floor(remaining / 5);
    remaining -= extreme * 5;
    growth = Math.ceil(remaining / 2.5);

    return { typhoon, magnificent, extreme, growth, total: typhoon + magnificent + extreme + growth };
  };

  const result = levelsNeeded > 0 ? estimatePotions() : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-foreground-700">{t('mh_growth_current_level')}</label>
          <input
            type="number"
            value={currentLevel}
            onChange={(e) => { setCurrentLevel(Number(e.target.value)); setCalculated(false); }}
            min={10}
            max={300}
            className="mt-1 w-full h-10 rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground-700">{t('mh_growth_target_level')}</label>
          <input
            type="number"
            value={targetLevel}
            onChange={(e) => { setTargetLevel(Number(e.target.value)); setCalculated(false); }}
            min={11}
            max={300}
            className="mt-1 w-full h-10 rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
          />
        </div>
      </div>
      <button
        onClick={calc}
        className="w-full h-11 rounded-lg bg-primary-500 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
      >
        <i className="ri-calculator-line mr-1.5"></i>{t('mh_growth_calc')}
      </button>

      {levelsNeeded > 0 && (
        <div className="bg-background-100 rounded-xl p-4 text-center">
          <span className="text-xl font-bold text-primary-600">{levelsNeeded}</span>
          <span className="text-sm text-foreground-600"> {t('mh_growth_need_levels', { count: levelsNeeded })}</span>
        </div>
      )}

      {calculated && result && (
        <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
          <div className="p-4 bg-secondary-100/60">
            <div className="text-xs font-semibold text-foreground-700 mb-3">{t('mh_growth_potions_needed')}</div>
            <div className="grid grid-cols-2 gap-3">
              {result.typhoon > 0 && (
                <div className="bg-background-50 rounded-lg p-3 text-center">
                  <i className="ri-tornado-line text-accent-600 text-xl"></i>
                  <div className="text-lg font-bold text-foreground-900">{result.typhoon}</div>
                  <div className="text-[11px] text-foreground-500">{t('mh_growth_typhoon_potion')}</div>
                </div>
              )}
              {result.magnificent > 0 && (
                <div className="bg-background-50 rounded-lg p-3 text-center">
                  <i className="ri-star-smile-line text-primary-600 text-xl"></i>
                  <div className="text-lg font-bold text-foreground-900">{result.magnificent}</div>
                  <div className="text-[11px] text-foreground-500">{t('mh_growth_magnificent')}</div>
                </div>
              )}
              {result.extreme > 0 && (
                <div className="bg-background-50 rounded-lg p-3 text-center">
                  <i className="ri-flask-line text-secondary-600 text-xl"></i>
                  <div className="text-lg font-bold text-foreground-900">{result.extreme}</div>
                  <div className="text-[11px] text-foreground-500">{t('mh_growth_extreme')}</div>
                </div>
              )}
              {result.growth > 0 && (
                <div className="bg-background-50 rounded-lg p-3 text-center">
                  <i className="ri-medicine-bottle-line text-accent-600 text-xl"></i>
                  <div className="text-lg font-bold text-foreground-900">{result.growth}</div>
                  <div className="text-[11px] text-foreground-500">{t('mh_growth_basic')}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {potions.map((p) => (
          <div key={p.name} className="bg-background-50 border border-background-200 rounded-lg p-3 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
              p.rarity === 'Legendary' ? 'bg-accent-100 text-accent-600' :
              p.rarity === 'Epic' ? 'bg-secondary-100 text-secondary-600' :
              'bg-background-100 text-foreground-600'
            }`}>
              <i className={p.icon}></i>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground-900 truncate">{p.name}</div>
              <div className="text-[10px] text-foreground-500">+{p.levels} lvl · {p.rarity}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SixthJobTracker({ version }: { version: string }) {
  const { t } = useTranslation();
  const vData = growthData[version] || growthData.gms;
  const stages = vData.sixthJob.stages;
  const dailyErda = vData.sixthJob.dailySolErda;
  const dailyFragment = vData.sixthJob.dailySolErdaFragment;
  const [progress, setProgress] = useState<Record<string, number>>({});

  const setProgressValue = (stageName: string, value: number) => {
    const stage = stages.find((s) => s.name === stageName);
    const max = (stage?.solErda || 0) + (stage?.solErdaFragment || 0);
    setProgress((prev) => ({ ...prev, [stageName]: Math.min(value, max) }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-background-100 rounded-xl">
        <div className="flex items-center gap-2">
          <i className="ri-sun-line text-accent-600"></i>
          <span className="text-xs font-semibold text-foreground-700">{t('mh_growth_daily_erda')}</span>
        </div>
        <span className="text-sm font-bold text-accent-600">{dailyErda.toLocaleString()}</span>
        <div className="w-px h-4 bg-background-300"></div>
        <div className="flex items-center gap-2">
          <i className="ri-moon-line text-secondary-600"></i>
          <span className="text-xs font-semibold text-foreground-700">{t('mh_growth_daily_fragment')}</span>
        </div>
        <span className="text-sm font-bold text-secondary-600">{dailyFragment}</span>
      </div>

      {stages.map((stage, idx) => {
        const current = progress[stage.name] || 0;
        const total = stage.solErda + stage.solErdaFragment;
        const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
        return (
          <div key={stage.name} className="bg-background-50 border border-background-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                <span className="text-sm font-semibold text-foreground-900">{stage.name}</span>
              </div>
              <span className="text-xs font-semibold text-foreground-500">{stage.hours}h</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 bg-background-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
              </div>
              <span className="text-xs font-bold text-foreground-700 whitespace-nowrap">{pct}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-foreground-500">
              <span>Sol Erda: {stage.solErda.toLocaleString()} · Fragment: {stage.solErdaFragment.toLocaleString()}</span>
              <input
                type="number"
                value={current || ''}
                onChange={(e) => setProgressValue(stage.name, Number(e.target.value) || 0)}
                placeholder={t('mh_growth_progress')}
                className="w-20 h-7 rounded-md border border-background-300 bg-background-50 px-2 text-xs outline-none focus:border-primary-500 text-right"
              />
            </div>
            {pct < 100 && (
              <div className="mt-2 text-[11px] text-foreground-500 flex items-center gap-1">
                <i className="ri-time-line"></i>
                {Math.max(0, Math.ceil((total - current) / (dailyErda + dailyFragment)))} {t('mh_growth_days_needed')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}