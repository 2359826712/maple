import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type HexaCore = {
  id: string;
  name: string;
  nameKey: string;
  type: string;
  priority: number;
  current: number;
  target: number;
};

const baseCores: HexaCore[] = [
  { id: 'origin', name: 'Origin Skill', nameKey: 'mh_hexa_origin', type: 'Skill Core', priority: 1, current: 1, target: 10 },
  { id: 'mastery-a', name: 'Main Mastery', nameKey: 'mh_hexa_main', type: 'Mastery', priority: 2, current: 0, target: 20 },
  { id: 'boost-a', name: 'Burst Boost', nameKey: 'mh_hexa_burst', type: 'Boost', priority: 3, current: 0, target: 15 },
  { id: 'mastery-b', name: 'Secondary Mastery', nameKey: 'mh_hexa_sub', type: 'Mastery', priority: 4, current: 0, target: 10 },
  { id: 'common', name: 'Common Core', nameKey: 'mh_hexa_common', type: 'Common', priority: 5, current: 0, target: 8 },
  { id: 'boost-b', name: 'Utility Boost', nameKey: 'mh_hexa_utility', type: 'Boost', priority: 6, current: 0, target: 8 },
];

function estimateSolErda(levels: number) {
  return Math.max(0, Math.ceil(levels * 0.65));
}

function estimateFragments(levels: number) {
  return Math.max(0, levels * 18);
}

export default function HexaMatrixPlanner() {
  const { t } = useTranslation();
  const [cores, setCores] = useState(baseCores);

  const totals = useMemo(() => {
    const missingLevels = cores.reduce((sum, core) => sum + Math.max(0, core.target - core.current), 0);
    return {
      missingLevels,
      solErda: estimateSolErda(missingLevels),
      fragments: estimateFragments(missingLevels),
    };
  }, [cores]);

  const updateCore = (id: string, field: 'current' | 'target', value: number) => {
    setCores((current) =>
      current.map((core) =>
        core.id === id
          ? { ...core, [field]: Math.min(30, Math.max(0, value || 0)) }
          : core,
      ),
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">Missing Levels</div>
          <div className="mt-2 font-heading text-3xl font-semibold text-foreground-950">{totals.missingLevels}</div>
        </div>
        <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-secondary-800">Sol Erda</div>
          <div className="mt-2 font-heading text-3xl font-semibold text-foreground-950">~{totals.solErda}</div>
        </div>
        <div className="rounded-lg border border-accent-200 bg-accent-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent-800">Fragments</div>
          <div className="mt-2 font-heading text-3xl font-semibold text-foreground-950">~{totals.fragments}</div>
        </div>
      </div>

      <div className="rounded-lg border border-background-200 bg-background-100 p-4 text-sm leading-relaxed text-foreground-700">
        {t('mh_hexa_manual_note')}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {cores
          .slice()
          .sort((a, b) => a.priority - b.priority)
          .map((core) => {
            const missing = Math.max(0, core.target - core.current);
            const progress = core.target > 0 ? Math.min(100, (core.current / core.target) * 100) : 0;

            return (
              <article key={core.id} className="rounded-lg border border-background-200 bg-background-50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-foreground-950 px-2 py-0.5 text-xs font-bold text-background-50">
                        #{core.priority}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">{core.type}</span>
                    </div>
                    <h3 className="mt-2 font-heading text-lg font-semibold text-foreground-950">
                      {t(core.nameKey)}
                    </h3>
                  </div>
                  <div className="text-right text-xs text-foreground-600">
                    <div>~{estimateSolErda(missing)} Sol</div>
                    <div>~{estimateFragments(missing)} Frags</div>
                  </div>
                </div>
                <div className="mb-3 h-2 overflow-hidden rounded-full bg-background-200">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${progress}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-foreground-600">
                    {t('mh_hexa_current')}
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={core.current}
                      onChange={(event) => updateCore(core.id, 'current', Number(event.target.value))}
                      className="mt-1 h-10 w-full rounded-md border border-background-300 bg-background-100 px-3 text-sm text-foreground-950 outline-none focus:border-primary-400"
                    />
                  </label>
                  <label className="text-xs font-semibold text-foreground-600">
                    {t('mh_hexa_target')}
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={core.target}
                      onChange={(event) => updateCore(core.id, 'target', Number(event.target.value))}
                      className="mt-1 h-10 w-full rounded-md border border-background-300 bg-background-100 px-3 text-sm text-foreground-950 outline-none focus:border-primary-400"
                    />
                  </label>
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
}
