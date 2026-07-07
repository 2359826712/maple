import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { classTiers, versionTiers, tierOrder, tierColors, classImages, type TierLevel, type ClassRole, type ClassTier } from '@/mocks/class-rankings';
import EquipmentBuildPanel from './EquipmentBuildPanel';

const roleOptions: { key: ClassRole | 'all'; icon: string; tKey: string }[] = [
  { key: 'all', icon: 'ri-global-line', tKey: 'tier_filter_all' },
  { key: 'bossing', icon: 'ri-sword-line', tKey: 'tier_filter_bossing' },
  { key: 'mobbing', icon: 'ri-fire-line', tKey: 'tier_filter_mobbing' },
  { key: 'support', icon: 'ri-shield-star-line', tKey: 'tier_filter_support' },
];

export default function TierOverview() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [role, setRole] = useState<ClassRole | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassTier | null>(null);
  const [compareList, setCompareList] = useState<ClassTier[]>([]);

  const filtered = useMemo(() => {
    const overrides = versionTiers[version] || {};
    let list = classTiers
      .filter((c) => c.versions.includes(version))
      .map((c) => {
        const o = overrides[c.id];
        if (!o) return c;
        return {
          ...c,
          bossing: o.bossing ?? c.bossing,
          mobbing: o.mobbing ?? c.mobbing,
          support: o.support ?? c.support,
          description: o.description ?? c.description,
          descriptionZh: o.descriptionZh ?? c.descriptionZh,
          strengths: o.strengths ?? c.strengths,
          strengthsZh: o.strengthsZh ?? c.strengthsZh,
        };
      });
    if (role !== 'all') {
      list = list.filter((c) => c[role] !== 'C');
      list.sort((a, b) => {
        const order: Record<TierLevel, number> = { S: 0, A: 1, B: 2, C: 3 };
        return order[a[role]] - order[b[role]];
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.nameZh.includes(q));
    }
    return list;
  }, [version, role, search]);

  const grouped = useMemo(() => {
    const map: Record<TierLevel, ClassTier[]> = { S: [], A: [], B: [], C: [] };
    filtered.forEach((c) => {
      const r = role === 'all' ? c.bossing : c[role];
      map[r] = [...map[r], c];
    });
    if (role === 'all') {
      map.S.sort((a, b) => {
        const order: Record<TierLevel, number> = { S: 0, A: 1, B: 2, C: 3 };
        return (order[a.mobbing] + order[a.support]) - (order[b.mobbing] + order[b.support]);
      });
    }
    return map;
  }, [filtered, role]);

  const handleCompareToggle = (cls: ClassTier) => {
    setCompareList((prev) => {
      const exists = prev.find((c) => c.id === cls.id);
      if (exists) return prev.filter((c) => c.id !== cls.id);
      if (prev.length >= 3) return prev;
      return [...prev, cls];
    });
  };

  const clearCompare = () => setCompareList([]);

  const isInCompare = (id: string) => compareList.some((c) => c.id === id);

  return (
    <section id="tier-list" className="py-14 md:py-20">
      <div className="w-full px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-primary-600 mb-2">
            {t('tier_title_eyebrow')}
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-semibold text-foreground-950">
            {t('tier_title')}
          </h2>
          <p className="mt-3 text-sm md:text-base text-foreground-600 max-w-2xl mx-auto">
            {t('tier_desc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
          <div className="flex items-center gap-1 bg-background-100 rounded-full p-1">
            {roleOptions.map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  role === r.key
                    ? 'bg-background-50 text-primary-700'
                    : 'text-foreground-600 hover:text-foreground-800'
                }`}
              >
                <i className={`${r.icon} text-sm`}></i>
                {t(r.tKey)}
              </button>
            ))}
          </div>
          <div className="relative flex-1 w-full sm:max-w-xs">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-500 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('tier_search_placeholder')}
              className="w-full h-10 pl-9 pr-4 rounded-full border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-500 outline-none focus:border-primary-400"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-foreground-500">
            <i className="ri-emotion-sad-line text-4xl mb-3 block"></i>
            <p className="text-sm">{t('tier_no_results')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tierOrder.map((tier) => {
              const classes = grouped[tier];
              if (classes.length === 0) return null;
              const tc = tierColors[tier];
              return (
                <div key={tier}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${tc.bg}`}>
                      {tier}
                    </span>
                    <div className="flex-1 h-px bg-background-200"></div>
                    <span className="text-xs text-foreground-500">{classes.length} classes</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {classes.map((c) => (
                      <ClassCard
                        key={c.id}
                        cls={c}
                        activeRole={role}
                        onClick={() => setSelectedClass(c)}
                        onCompare={() => handleCompareToggle(c)}
                        isCompared={isInCompare(c.id)}
                        compareDisabled={!isInCompare(c.id) && compareList.length >= 3}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Comparison panel */}
        <ComparisonPanel
          classes={compareList}
          activeRole={role}
          onClear={clearCompare}
          onRemove={handleCompareToggle}
          onViewBuild={setSelectedClass}
        />
      </div>

      {selectedClass && (
        <EquipmentBuildPanel
          cls={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </section>
  );
}

function ClassCard({ cls, activeRole, onClick, onCompare, isCompared, compareDisabled }: {
  cls: ClassTier;
  activeRole: ClassRole | 'all';
  onClick: () => void;
  onCompare: () => void;
  isCompared: boolean;
  compareDisabled: boolean;
}) {
  const { t } = useTranslation();
  const tierKey = activeRole === 'all' ? cls.bossing : cls[activeRole];
  const tc = tierColors[tierKey];
  const classImage = classImages[cls.id];

  const difficultyColor =
    cls.difficulty === 'Easy' ? 'text-accent-600 bg-accent-100' :
    cls.difficulty === 'Medium' ? 'text-secondary-600 bg-secondary-100' :
    cls.difficulty === 'Hard' ? 'text-primary-600 bg-primary-100' :
    'text-primary-700 bg-primary-100';

  const fundingColors: Record<string, string> = {
    Low: 'text-accent-600 bg-accent-100',
    Medium: 'text-secondary-600 bg-secondary-100',
    High: 'text-primary-600 bg-primary-100',
    Extreme: 'text-primary-700 bg-primary-100',
  };

  return (
    <div className="group relative bg-background-50 border border-background-200 rounded-xl p-4 hover:border-primary-300 transition-all">
      <button
        onClick={onClick}
        className="w-full text-left cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-primary-300 transition-all">
            {classImage ? (
              <img src={classImage} alt={cls.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <i className={`${cls.icon} text-foreground-700 text-xl group-hover:text-primary-600`}></i>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-semibold text-foreground-950 text-sm whitespace-nowrap">{cls.name}</span>
              <span className="text-[11px] text-foreground-500 whitespace-nowrap">{cls.nameZh}</span>
              {cls.gmsExclusive && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-700 whitespace-nowrap">
                  {t('tier_gms_exclusive')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tc.bg}`}>
                {tierKey}
              </span>
              {activeRole === 'all' && (
                <>
                  <span className={`text-[10px] font-semibold ${tierColors[cls.bossing].text}`}>Boss: {cls.bossing}</span>
                  <span className={`text-[10px] font-semibold ${tierColors[cls.mobbing].text}`}>Mob: {cls.mobbing}</span>
                  <span className={`text-[10px] font-semibold ${tierColors[cls.support].text}`}>Sup: {cls.support}</span>
                </>
              )}
            </div>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${tc.bg} ml-auto flex-shrink-0`}>
            {tc.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${difficultyColor}`}>
            {cls.difficulty}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${fundingColors[cls.funding]}`}>
            {cls.funding} Fund
          </span>
        </div>
      </button>

      {/* Compare toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onCompare(); }}
        disabled={compareDisabled}
        className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer ${
          isCompared
            ? 'bg-primary-500 text-background-50'
            : compareDisabled
            ? 'bg-background-100 text-foreground-300 cursor-not-allowed'
            : 'bg-background-100 text-foreground-400 hover:bg-primary-100 hover:text-primary-600'
        }`}
        title={isCompared ? 'Remove from comparison' : 'Add to comparison'}
      >
        <i className={isCompared ? 'ri-check-line' : 'ri-add-line'}></i>
      </button>
    </div>
  );
}

function ComparisonPanel({ classes, activeRole, onClear, onRemove, onViewBuild }: {
  classes: ClassTier[];
  activeRole: ClassRole | 'all';
  onClear: () => void;
  onRemove: (cls: ClassTier) => void;
  onViewBuild: (cls: ClassTier) => void;
}) {
  const { t } = useTranslation();

  if (classes.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-background-200">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground-950 flex items-center gap-2">
            <i className="ri-scales-3-line text-primary-500"></i>
            {t('tier_compare_title')}
          </h3>
          <p className="text-xs text-foreground-500 mt-1">{t('tier_compare_desc')}</p>
        </div>
        <button
          onClick={onClear}
          className="h-8 px-3 rounded-full bg-background-100 text-xs font-semibold text-foreground-600 hover:bg-primary-50 hover:text-primary-600 cursor-pointer whitespace-nowrap flex items-center gap-1"
        >
          <i className="ri-close-line"></i>
          {t('tier_compare_clear')}
        </button>
      </div>

      {/* Comparison table */}
      <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200 bg-background-100/50">
                <th className="text-left py-3 px-4 text-xs font-bold text-foreground-500 uppercase tracking-wider whitespace-nowrap">Attribute</th>
                {classes.map((c) => (
                  <th key={c.id} className="py-3 px-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center overflow-hidden">
                        {classImages[c.id] ? (
                          <img src={classImages[c.id]} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <i className={`${c.icon} text-primary-700 text-sm`}></i>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-foreground-900 whitespace-nowrap">{c.name}</span>
                      <button
                        onClick={() => onViewBuild(c)}
                        className="text-[10px] text-primary-600 hover:text-primary-700 cursor-pointer whitespace-nowrap font-semibold"
                      >
                        <i className="ri-settings-3-line mr-0.5"></i>View Build
                      </button>
                      <button
                        onClick={() => onRemove(c)}
                        className="text-[10px] text-foreground-500 hover:text-primary-500 cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-close-line mr-0.5"></i>Remove
                      </button>
                    </div>
                  </th>
                ))}
                {classes.length < 3 && (
                  <th className="py-3 px-4 text-center text-xs text-foreground-400 min-w-[120px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border-2 border-dashed border-background-300 flex items-center justify-center">
                        <i className="ri-add-line text-foreground-400"></i>
                      </div>
                      <span className="text-[10px]">{t('tier_compare_select')}</span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {/* Tier row */}
              <tr className="border-b border-background-100">
                <td className="py-3 px-4 text-xs font-semibold text-foreground-700 whitespace-nowrap">
                  {activeRole === 'all' ? 'Overall Tier' : `${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Tier`}
                </td>
                {classes.map((c) => {
                  const tierKey = activeRole === 'all' ? c.bossing : c[activeRole];
                  const tc = tierColors[tierKey];
                  return (
                    <td key={c.id} className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${tc.bg}`}>
                        {tierKey} — {tc.label}
                      </span>
                    </td>
                  );
                })}
                {classes.length < 3 && <td className="py-3 px-4 text-center text-foreground-300 text-xs">—</td>}
              </tr>

              {/* All role tiers */}
              {activeRole === 'all' && (
                <>
                  {(['bossing', 'mobbing', 'support'] as ClassRole[]).map((r) => (
                    <tr key={r} className="border-b border-background-100">
                      <td className="py-2.5 px-4 text-xs font-semibold text-foreground-600 whitespace-nowrap capitalize">
                        <i className={`${r === 'bossing' ? 'ri-sword-line' : r === 'mobbing' ? 'ri-fire-line' : 'ri-shield-star-line'} mr-1.5 text-foreground-500`}></i>
                        {r}
                      </td>
                      {classes.map((c) => {
                        const tKey = c[r];
                        const tc = tierColors[tKey];
                        return (
                          <td key={c.id} className="py-2.5 px-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${tc.bg}`}>{tKey}</span>
                          </td>
                        );
                      })}
                      {classes.length < 3 && <td className="py-2.5 px-4 text-center text-foreground-300 text-xs">—</td>}
                    </tr>
                  ))}
                </>
              )}

              {/* Difficulty */}
              <tr className="border-b border-background-100">
                <td className="py-2.5 px-4 text-xs font-semibold text-foreground-600 whitespace-nowrap">
                  <i className="ri-brain-line mr-1.5 text-foreground-500"></i>
                  Difficulty
                </td>
                {classes.map((c) => (
                  <td key={c.id} className="py-2.5 px-4 text-center">
                    <span className="text-xs font-semibold text-foreground-800">{c.difficulty}</span>
                  </td>
                ))}
                {classes.length < 3 && <td className="py-2.5 px-4 text-center text-foreground-300 text-xs">—</td>}
              </tr>

              {/* Funding */}
              <tr className="border-b border-background-100">
                <td className="py-2.5 px-4 text-xs font-semibold text-foreground-600 whitespace-nowrap">
                  <i className="ri-money-dollar-circle-line mr-1.5 text-foreground-500"></i>
                  Funding
                </td>
                {classes.map((c) => (
                  <td key={c.id} className="py-2.5 px-4 text-center">
                    <span className="text-xs font-semibold text-foreground-800">{c.funding}</span>
                  </td>
                ))}
                {classes.length < 3 && <td className="py-2.5 px-4 text-center text-foreground-300 text-xs">—</td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}