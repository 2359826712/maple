import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Mode = 'bossing' | 'training' | 'farming';

const linkSkills: Record<Mode, Array<{ className: string; effect: string }>> = {
  bossing: [
    { className: 'Demon Avenger', effect: 'Damage' },
    { className: 'Demon Slayer', effect: 'Boss Damage' },
    { className: 'Luminous', effect: 'Ignore Enemy Defense' },
    { className: 'Kanna', effect: 'Damage' },
    { className: 'Ark', effect: 'Stacking Damage' },
    { className: 'Hoyoung', effect: 'First-hit Damage + IED' },
    { className: 'Cadena', effect: 'Debuffed enemy damage' },
    { className: 'Angelic Buster', effect: 'Burst active' },
  ],
  training: [
    { className: 'Mercedes', effect: 'EXP gained' },
    { className: 'Evan', effect: 'Rune duration' },
    { className: 'Aran', effect: 'Combo orb EXP' },
    { className: 'Hoyoung', effect: 'First-hit damage' },
    { className: 'Lara', effect: 'Normal monster damage' },
    { className: 'Kinesis', effect: 'Critical damage' },
  ],
  farming: [
    { className: 'Phantom', effect: 'Critical rate' },
    { className: 'Beast Tamer', effect: 'Boss / Crit / HP utility' },
    { className: 'Explorer Thief', effect: 'Debuff damage' },
    { className: 'Explorer Mage', effect: 'Stacking debuff + IED' },
    { className: 'Resistance', effect: 'Revive invulnerability' },
    { className: 'Zero', effect: 'IED' },
  ],
};

const modes: Array<{ key: Mode; label: string; icon: string }> = [
  { key: 'bossing', label: 'Bossing', icon: 'ri-sword-line' },
  { key: 'training', label: 'Training', icon: 'ri-run-line' },
  { key: 'farming', label: 'Farming', icon: 'ri-seedling-line' },
];

export default function LinkSkillPlanner() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('bossing');
  const [owned, setOwned] = useState<Record<string, boolean>>({});
  const selectedLinks = linkSkills[mode];
  const ownedCount = useMemo(
    () => selectedLinks.filter((skill) => owned[skill.className]).length,
    [owned, selectedLinks],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-background-200 bg-background-100 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-heading text-xl font-semibold text-foreground-950">
            {t('mh_link_title')}
          </h3>
          <p className="mt-1 text-sm text-foreground-600">
            {t('mh_link_desc')}
          </p>
        </div>
        <div className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
          {ownedCount}/{selectedLinks.length}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {modes.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMode(item.key)}
            className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
              mode === item.key
                ? 'bg-primary-500 text-background-50'
                : 'border border-background-200 bg-background-50 text-foreground-800 hover:bg-primary-50'
            }`}
          >
            <i className={item.icon}></i>
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {selectedLinks.map((skill, index) => {
          const checked = Boolean(owned[skill.className]);

          return (
            <button
              key={skill.className}
              type="button"
              onClick={() => setOwned((current) => ({ ...current, [skill.className]: !checked }))}
              className={`rounded-lg border p-4 text-left transition-colors ${
                checked
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-background-200 bg-background-50 hover:border-primary-300 hover:bg-primary-50/40'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded bg-background-200 px-2 py-0.5 text-xs font-semibold text-foreground-700">
                  #{index + 1}
                </span>
                <i className={checked ? 'ri-checkbox-circle-fill text-primary-600' : 'ri-checkbox-blank-circle-line text-foreground-400'}></i>
              </div>
              <div className="font-heading text-lg font-semibold text-foreground-950">
                {skill.className}
              </div>
              <div className="mt-2 text-sm text-foreground-600">
                {skill.effect}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
