import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { cubeTypes, cubeTierRates, starForceRates, flameTiers } from '@/mocks/mapler-house';
import { getToolProvenance } from '@/domain/toolProvenance';
import { readLocalStorage, writeLocalStorage } from '@/services/browserStorage';

type TabType = 'cube' | 'starforce' | 'flame';
const CUBE_TIERS = ['Rare', 'Epic', 'Unique', 'Legendary'];

export const STAR_FORCE_PROGRESS_STORAGE_KEY = 'maplehub-star-force-simulator:v1';

type StarForceProgress = {
  currentStar: number;
  attempts: number;
  logs: string[];
  destroyed: boolean;
};

const EMPTY_STAR_FORCE_PROGRESS: StarForceProgress = {
  currentStar: 0,
  attempts: 0,
  logs: [],
  destroyed: false,
};

const getStarForceProgressStorageKey = (version: string) => `${STAR_FORCE_PROGRESS_STORAGE_KEY}:${version}`;

const getStarForceRates = (star: number) => {
  const breakpoint = Object.keys(starForceRates)
    .map(Number)
    .sort((left, right) => right - left)
    .find((candidate) => candidate <= star) ?? 0;
  return starForceRates[breakpoint];
};

const readStarForceProgress = (version: string): StarForceProgress => {
  const stored = readLocalStorage(getStarForceProgressStorageKey(version));
  if (!stored) return { ...EMPTY_STAR_FORCE_PROGRESS };

  try {
    const parsed = JSON.parse(stored) as Partial<StarForceProgress>;
    const validStar = Number.isInteger(parsed.currentStar) && Number(parsed.currentStar) >= 0 && Number(parsed.currentStar) <= 25;
    const validAttempts = Number.isSafeInteger(parsed.attempts) && Number(parsed.attempts) >= 0;
    const validLogs = Array.isArray(parsed.logs) && parsed.logs.every((log) => typeof log === 'string');
    if (!validStar || !validAttempts || !validLogs || typeof parsed.destroyed !== 'boolean') {
      return { ...EMPTY_STAR_FORCE_PROGRESS };
    }

    return {
      currentStar: Number(parsed.currentStar),
      attempts: Number(parsed.attempts),
      logs: parsed.logs!.slice(-30),
      destroyed: parsed.destroyed,
    };
  } catch {
    return { ...EMPTY_STAR_FORCE_PROGRESS };
  }
};

export default function EquipmentEnhanceSim() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();
  const [activeTab, setActiveTab] = useState<TabType>('cube');
  const provenance = getToolProvenance({ evidence: 'estimate' });
  const assumptionKey = {
    cube: 'mh_enhance_assumptions_cube',
    starforce: 'mh_enhance_assumptions_starforce',
    flame: 'mh_enhance_assumptions_flame',
  }[activeTab];

  return (
    <div className="space-y-5">
      <section
        aria-labelledby="enhancement-data-title"
        className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="enhancement-data-title" className="text-sm font-bold">
              {t('mh_enhance_provenance_title')}
            </h3>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-amber-900">
              {t('mh_enhance_provenance_desc')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label={t('mh_enhance_data_status')}>
            <span className="rounded-full border border-amber-300 bg-background-50 px-2.5 py-1 text-[11px] font-semibold">
              {t(provenance.evidenceLabelKey)}
            </span>
            <span className="rounded-full border border-amber-300 bg-background-50 px-2.5 py-1 text-[11px] font-semibold">
              {t(provenance.freshnessLabelKey)}
            </span>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
          <div>
            <dt className="font-semibold text-amber-800">{t('mh_enhance_region_version')}</dt>
            <dd className="mt-0.5 font-bold">{versionInfo.shortLabel}</dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-800">{t('mh_enhance_source')}</dt>
            <dd className="mt-0.5 font-bold">{t('mh_enhance_source_reference')}</dd>
          </div>
          <div>
            <dt className="font-semibold text-amber-800">{t('mh_enhance_last_checked')}</dt>
            <dd className="mt-0.5 font-bold">{t('mh_enhance_last_checked_unavailable')}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-lg border border-amber-200 bg-background-50/80 p-3">
          <div className="text-xs font-bold">{t('mh_enhance_assumptions_title')}</div>
          <p className="mt-1 text-xs leading-relaxed text-amber-900">{t(assumptionKey)}</p>
        </div>
      </section>

      <div className="flex bg-background-100 rounded-full p-1 gap-1">
        {([
          { key: 'cube' as TabType, label: t('mh_enhance_cube'), icon: 'ri-dice-line' },
          { key: 'starforce' as TabType, label: t('mh_enhance_starforce'), icon: 'ri-star-line' },
          { key: 'flame' as TabType, label: t('mh_enhance_flame'), icon: 'ri-fire-line' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.key ? 'bg-background-50 text-primary-700 shadow-sm' : 'text-foreground-600'
            }`}
          >
            <i className={`${tab.icon} mr-1.5`}></i>{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'cube' && <CubeSimulator />}
      {activeTab === 'starforce' && <StarForceSimulator />}
      {activeTab === 'flame' && <FlameSimulator />}
    </div>
  );
}

function CubeSimulator() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [currentTier, setCurrentTier] = useState('Epic');
  const [resultTier, setResultTier] = useState('Epic');
  const [attempts, setAttempts] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [rolling, setRolling] = useState(false);

  const vCubes = cubeTypes[version] || cubeTypes.gms;
  const [selectedCube, setSelectedCube] = useState(vCubes[0].name);
  const cubeConfig = vCubes.find((c) => c.name === selectedCube) || vCubes[0];

  const getCubeRateKey = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('red')) return 'red';
    if (n.includes('black')) return 'black';
    if (n.includes('bonus')) return 'bonus';
    if (n.includes('violet')) return 'violet';
    return 'red';
  };

  const rollOnce = useCallback(() => {
    setAttempts((a) => a + 1);
    const currentIdx = CUBE_TIERS.indexOf(resultTier);
    if (currentIdx >= CUBE_TIERS.length - 1) {
      setLogs((prev) => [...prev.slice(-19), t('mh_enhance_already_legendary')]);
      return;
    }
    const rate = cubeTierRates.find((r) => r.from === resultTier);
    if (!rate) return;
    const rateKey = getCubeRateKey(selectedCube) as 'red' | 'black' | 'bonus' | 'violet';
    const tierUpRate = rate[rateKey] || 7;
    const roll = Math.random() * 100;
    if (roll < tierUpRate) {
      const nextTier = CUBE_TIERS[currentIdx + 1];
      setLogs((prev) => [...prev.slice(-19), `Attempt ${attempts + 1}: ${resultTier} → ${nextTier}!`]);
      setResultTier(nextTier);
    } else {
      setLogs((prev) => [...prev.slice(-19), `Attempt ${attempts + 1}: ${resultTier} maintained`]);
    }
  }, [resultTier, attempts, selectedCube, t]);

  const rollMany = async (count: number) => {
    setRolling(true);
    for (let i = 0; i < count; i++) {
      await new Promise((r) => setTimeout(r, 10));
      rollOnce();
    }
    setRolling(false);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Legendary': return 'bg-accent-100 text-accent-700 border-accent-300';
      case 'Unique': return 'bg-primary-100 text-primary-700 border-primary-300';
      case 'Epic': return 'bg-secondary-100 text-secondary-700 border-secondary-300';
      default: return 'bg-background-100 text-foreground-600 border-background-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-foreground-700">{t('mh_enhance_current_tier')}</label>
          <select
            value={currentTier}
            onChange={(e) => { setCurrentTier(e.target.value); setResultTier(e.target.value); setAttempts(0); setLogs([]); }}
            className="mt-1 w-full h-10 rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 cursor-pointer"
          >
            {CUBE_TIERS.map((tier) => (<option key={tier} value={tier}>{tier}</option>))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground-700">{t('mh_enhance_cube_type')}</label>
          <select
            value={selectedCube}
            onChange={(e) => setSelectedCube(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 cursor-pointer"
          >
            {vCubes.map((c) => (<option key={c.name} value={c.name}>{c.name} — {c.cost}</option>))}
          </select>
        </div>
      </div>

      <div className="bg-background-100 rounded-xl p-5 text-center">
        <div className="text-xs text-foreground-600 mb-1">{t('mh_enhance_sim_result')}</div>
        <div className={`inline-block px-5 py-2 rounded-full border text-lg font-bold ${getTierColor(resultTier)}`}>
          {resultTier}
        </div>
        <div className="mt-3 flex items-center justify-center gap-6 text-sm">
          <div>
            <span className="text-foreground-500">{t('mh_enhance_attempts')}: </span>
            <span className="font-bold text-foreground-900">{attempts}</span>
          </div>
          <div>
            <span className="text-foreground-500">{t('mh_enhance_cost')}: </span>
            <span className="font-bold text-foreground-900">{cubeConfig.cost.split(' ')[0]} × {attempts} = {(parseFloat(cubeConfig.cost) * attempts).toFixed(1)}M</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={rollOnce} disabled={rolling} className="flex-1 h-10 rounded-lg bg-primary-500 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
          <i className="ri-dice-line mr-1.5"></i>{t('mh_enhance_roll')}
        </button>
        <button onClick={() => rollMany(10)} disabled={rolling} className="flex-1 h-10 rounded-lg bg-secondary-500 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:bg-secondary-600 transition-colors cursor-pointer whitespace-nowrap">
          <i className="ri-speed-up-line mr-1.5"></i>{t('mh_enhance_roll_10')}
        </button>
        <button onClick={() => rollMany(100)} disabled={rolling} className="flex-1 h-10 rounded-lg bg-accent-500 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap">
          <i className="ri-flashlight-line mr-1.5"></i>{t('mh_enhance_roll_100')}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="bg-background-50 border border-background-200 rounded-xl p-3 max-h-48 overflow-y-auto">
          <div className="text-[11px] font-semibold text-foreground-500 mb-2 uppercase tracking-wider">{t('mh_enhance_sim_log')}</div>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={`text-xs py-1 px-2 rounded ${log.includes('→') ? 'bg-accent-50 text-accent-700' : 'bg-background-100 text-foreground-600'}`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StarForceSimulator() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [progress, setProgress] = useState<StarForceProgress>(() => readStarForceProgress(version));
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [rolling, setRolling] = useState(false);
  const { currentStar, attempts, logs, destroyed } = progress;

  useEffect(() => {
    const saved = writeLocalStorage(getStarForceProgressStorageKey(version), JSON.stringify(progress));
    setStorageAvailable(saved);
  }, [progress, version]);

  const getVersionCost = (rates: typeof starForceRates[number]) => {
    if (version === 'kms' && rates.cost_kms) return rates.cost_kms;
    if (version === 'tms' && rates.cost_tms) return rates.cost_tms;
    if (version === 'jms' && rates.cost_jms) return rates.cost_jms;
    return rates.cost;
  };

  const rollOnce = useCallback(() => {
    setProgress((previous) => {
      if (previous.destroyed || previous.currentStar >= 25) return previous;

      const rates = getStarForceRates(previous.currentStar);
      const roll = Math.random() * 100;
      if (roll < rates.success) {
        const nextStar = previous.currentStar + 1;
        return {
          ...previous,
          currentStar: nextStar,
          attempts: previous.attempts + 1,
          logs: [...previous.logs.slice(-29), `Star ${previous.currentStar}→${nextStar}: ${t('mh_enhance_success_log')}`],
        };
      }
      if (roll < rates.success + rates.destroy) {
        return {
          ...previous,
          attempts: previous.attempts + 1,
          destroyed: true,
          logs: [...previous.logs.slice(-29), `Star ${previous.currentStar}→${previous.currentStar}: ${t('mh_enhance_destroy_log')}`],
        };
      }

      const nextStar = previous.currentStar > 15 ? previous.currentStar - 1 : previous.currentStar;
      return {
        ...previous,
        currentStar: nextStar,
        attempts: previous.attempts + 1,
        logs: [...previous.logs.slice(-29), `Star ${previous.currentStar}→${nextStar}: ${t('mh_enhance_fail_log')}`],
      };
    });
  }, [t]);

  const rollMany = async (count: number) => {
    setRolling(true);
    for (let i = 0; i < count; i++) {
      await new Promise((r) => setTimeout(r, 15));
      rollOnce();
    }
    setRolling(false);
  };

  const reset = () => {
    setProgress({ ...EMPTY_STAR_FORCE_PROGRESS });
  };

  const rates = getStarForceRates(currentStar);

  return (
    <div className="space-y-4">
      <div
        role="status"
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
          storageAvailable
            ? 'border-accent-200 bg-accent-50 text-accent-800'
            : 'border-amber-300 bg-amber-50 text-amber-900'
        }`}
      >
        <i className={storageAvailable ? 'ri-save-3-line' : 'ri-alert-line'} aria-hidden="true" />
        {t(storageAvailable ? 'mh_enhance_progress_saved_local' : 'mh_enhance_progress_save_unavailable')}
      </div>

      <div className="bg-background-100 rounded-xl p-5 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className={`text-4xl font-bold ${destroyed ? 'text-red-500' : currentStar >= 22 ? 'text-accent-600' : currentStar >= 15 ? 'text-primary-600' : 'text-foreground-900'}`}>
            {currentStar}★
          </div>
          {destroyed && (
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">{t('mh_enhance_destroy')}</span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-center gap-6 text-sm">
          <span className="text-foreground-500">{t('mh_enhance_attempts')}: <strong className="text-foreground-900">{attempts}</strong></span>
          <span className="text-foreground-500">Rate: <strong className="text-accent-600">{rates.success}%</strong></span>
          <span className="text-foreground-500">Cost: <strong className="text-foreground-900">{getVersionCost(rates)}</strong></span>
        </div>
      </div>

      {!destroyed && currentStar < 25 && (
        <>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-background-50 border border-background-200 rounded-lg p-2 text-center">
              <div className="font-bold text-accent-600">{rates.success}%</div>
              <div className="text-foreground-500">{t('mh_enhance_success')}</div>
            </div>
            <div className="bg-background-50 border border-background-200 rounded-lg p-2 text-center">
              <div className="font-bold text-secondary-600">{rates.fail}%</div>
              <div className="text-foreground-500">{t('mh_enhance_fail')}</div>
            </div>
            <div className="bg-background-50 border border-background-200 rounded-lg p-2 text-center">
              <div className="font-bold text-red-500">{rates.destroy}%</div>
              <div className="text-foreground-500">{t('mh_enhance_destroy')}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={rollOnce} disabled={rolling} className="flex-1 h-10 rounded-lg bg-primary-500 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-star-line mr-1.5"></i>{t('mh_enhance_tap_1')}
            </button>
            <button onClick={() => rollMany(10)} disabled={rolling} className="flex-1 h-10 rounded-lg bg-secondary-500 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:bg-secondary-600 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-speed-up-line mr-1.5"></i>{t('mh_enhance_tap_10')}
            </button>
          </div>
        </>
      )}

      <button onClick={reset} className="w-full h-9 rounded-lg border border-background-300 text-sm text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
        <i className="ri-refresh-line mr-1.5"></i>{t('mh_enhance_reset')}
      </button>

      {logs.length > 0 && (
        <div className="bg-background-50 border border-background-200 rounded-xl p-3 max-h-48 overflow-y-auto">
          <div className="text-[11px] font-semibold text-foreground-500 mb-2 uppercase tracking-wider">{t('mh_enhance_tap_log')}</div>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={`text-xs py-1 px-2 rounded ${
                log.includes('SUCCESS') ? 'bg-accent-50 text-accent-700' :
                log.includes('DESTROYED') ? 'bg-red-50 text-red-600' :
                'bg-background-100 text-foreground-600'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlameSimulator() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [result, setResult] = useState<{ tier: string; stats: string[] } | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const vFlames = flameTiers[version] || flameTiers.gms;
  const [selectedFlame, setSelectedFlame] = useState(vFlames[0].name);
  const flameConfig = vFlames.find((f) => f.name === selectedFlame) || vFlames[0];

  const rollFlame = () => {
    const roll = Math.random() * 100;
    const rangeParts = flameConfig.bonusRange.split(' ')[1].split('-');
    let tier: string;
    if (roll < flameConfig.baseChance) tier = `Tier ${rangeParts[1]}`;
    else if (roll < flameConfig.baseChance * 2) tier = `Tier ${Number(rangeParts[0]) + 1}`;
    else tier = `Tier ${rangeParts[0]}`;

    const statPool = ['+80 STR', '+80 DEX', '+80 INT', '+80 LUK', '+6% All Stat', '+40 ATK', '+40 M.ATK', '+10% Boss', '+8% Crit Dmg', '+12% IED'];
    const stats = statPool.sort(() => Math.random() - 0.5).slice(0, 4);

    setResult({ tier, stats });
    setHistory((prev) => [...prev.slice(-19), `${selectedFlame} → ${tier} | ${stats.slice(0, 2).join(', ')}`]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-foreground-700">{t('mh_enhance_flame_type')}</label>
        <select
          value={selectedFlame}
          onChange={(e) => setSelectedFlame(e.target.value)}
          className="mt-1 w-full h-10 rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 cursor-pointer"
        >
          {vFlames.map((f) => (<option key={f.name} value={f.name}>{f.name} — {f.cost}</option>))}
        </select>
      </div>

      <div className="bg-background-100 rounded-xl p-5 text-center">
        <div className="text-xs text-foreground-500 mb-2">{selectedFlame} · {flameConfig.bonusRange}</div>
        <div className="text-sm text-foreground-600 mb-1">Tier-up chance</div>
        <div className="text-2xl font-bold text-accent-600">{flameConfig.baseChance}%</div>
      </div>

      <button onClick={rollFlame} className="w-full h-11 rounded-lg bg-primary-500 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
        <i className="ri-fire-line mr-1.5"></i>{t('mh_enhance_roll_flame')}
      </button>

      {result && (
        <div className="bg-background-50 border border-background-200 rounded-xl p-4">
          <div className="text-xs text-foreground-500 mb-2">Result: <span className="font-bold text-accent-600">{result.tier}</span></div>
          <div className="grid grid-cols-2 gap-1.5">
            {result.stats.map((s, i) => (
              <div key={i} className="bg-background-100 rounded-md px-3 py-2 text-sm font-medium text-foreground-900">{s}</div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-background-50 border border-background-200 rounded-xl p-3 max-h-40 overflow-y-auto">
          <div className="text-[11px] font-semibold text-foreground-500 mb-2 uppercase tracking-wider">{t('mh_enhance_flame_history')}</div>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="text-xs py-1 px-2 rounded bg-background-100 text-foreground-600">{h}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
