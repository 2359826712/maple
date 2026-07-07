import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { classEquipmentBuilds, makeBossingEquips, classImages, type ClassTier, type EquipSlot } from '@/mocks/class-rankings';

type BuildTab = 'bossing' | 'mobbing';
type ClassType = 'warrior' | 'mage' | 'thief' | 'archer' | 'pirate';

const classTypeMap: Record<string, ClassType> = {
  // Warriors
  'hero': 'warrior',
  'paladin': 'warrior',
  'dark-knight': 'warrior',
  'demon-slayer': 'warrior',
  'blaster': 'warrior',
  'hayato': 'warrior',
  'adele': 'warrior',
  'dawn-warrior': 'warrior',
  'mihile': 'warrior',
  'aran': 'warrior',
  'kaiser': 'warrior',
  'zero': 'warrior',
  'demon-avenger': 'warrior',
  'erel-light': 'warrior',
  // Mages
  'bishop': 'mage',
  'luminous': 'mage',
  'ice-lightning': 'mage',
  'fire-poison': 'mage',
  'kanna': 'mage',
  'kinesis': 'mage',
  'evan': 'mage',
  'battle-mage': 'mage',
  'blaze-wizard': 'mage',
  'illium': 'mage',
  'lara': 'mage',
  'lynn': 'mage',
  'beast-tamer': 'mage',
  // Thieves
  'night-lord': 'thief',
  'night-walker': 'thief',
  'dual-blade': 'thief',
  'phantom': 'thief',
  'xenon': 'thief',
  'hoyoung': 'thief',
  'kain': 'thief',
  'shadower': 'thief',
  'cadena': 'thief',
  'khali': 'thief',
  // Archers
  'bowmaster': 'archer',
  'wind-archer': 'archer',
  'mercedes': 'archer',
  'marksman': 'archer',
  'pathfinder': 'archer',
  'wild-hunter': 'archer',
  // Pirates
  'buccaneer': 'pirate',
  'ark': 'pirate',
  'shade': 'pirate',
  'corsair': 'pirate',
  'cannon-master': 'pirate',
  'thunder-breaker': 'pirate',
  'angelic-buster': 'pirate',
  'mechanic': 'pirate',
  'mo-xuan': 'pirate',
};

function getEquipsForClass(cls: ClassTier): EquipSlot[] {
  const type = classTypeMap[cls.id] || 'warrior';
  return makeBossingEquips(
    cls.id,
    type === 'mage',
    type === 'pirate',
    type === 'thief',
    type === 'archer',
    type === 'warrior',
  );
}

function getDefaultInnerAbility(cls: ClassTier): { line1: string; line1Zh: string; line2: string; line2Zh: string; line3: string; line3Zh: string } {
  const type = classTypeMap[cls.id] || 'warrior';
  if (type === 'mage') {
    return { line1: 'Boss Damage +20%', line1Zh: 'Boss 伤害 +20%', line2: 'Magic ATT +21', line2Zh: '魔法攻击力 +21', line3: 'Buff Duration +38%', line3Zh: 'Buff 持续时间 +38%' };
  }
  if (type === 'thief') {
    return { line1: 'Boss Damage +20%', line1Zh: 'Boss 伤害 +20%', line2: 'Attack +21', line2Zh: '攻击力 +21', line3: 'Buff Duration +38%', line3Zh: 'Buff 持续时间 +38%' };
  }
  return { line1: 'Boss Damage +20%', line1Zh: 'Boss 伤害 +20%', line2: 'Attack +21', line2Zh: '攻击力 +21', line3: 'Crit Rate +20-30%', line3Zh: '暴击率 +20-30%' };
}

function getDefaultHyperStats(cls: ClassTier): { stat: string; statZh: string; points: number }[] {
  const type = classTypeMap[cls.id] || 'warrior';
  const statName = type === 'mage' ? 'INT' : type === 'thief' ? 'LUK' : type === 'archer' ? 'DEX' : 'STR';
  const statZh = type === 'mage' ? '智力' : type === 'thief' ? '运气' : type === 'archer' ? '敏捷' : '力量';
  return [
    { stat: 'Boss Damage', statZh: 'Boss 伤害', points: 15 },
    { stat: 'IED', statZh: '无视防御', points: 15 },
    { stat: 'Crit Rate', statZh: '暴击率', points: 10 },
    { stat: 'Crit Damage', statZh: '暴击伤害', points: 12 },
    { stat: 'Damage', statZh: '伤害', points: 15 },
    { stat: statName, statZh, points: 3 },
  ];
}

function getDefaultLinkSkills(cls: ClassTier): { name: string; nameZh: string; effect: string; effectZh: string }[] {
  return [
    { name: 'Demon Avenger', nameZh: '恶魔复仇者', effect: 'Damage +10-15%', effectZh: '伤害 +10-15%' },
    { name: 'Luminous', nameZh: '夜光法师', effect: 'IED +15-20%', effectZh: '无视防御 +15-20%' },
    { name: 'Ark', nameZh: '亚克', effect: 'Damage during combat +11-16%', effectZh: '战斗中伤害 +11-16%' },
    { name: 'Kinesis', nameZh: '超能力者', effect: 'Crit Damage +4%', effectZh: '暴击伤害 +4%' },
    { name: 'Phantom', nameZh: '幻影', effect: 'Crit Rate +10-20%', effectZh: '暴击率 +10-20%' },
  ];
}

const tierBadge: Record<string, string> = {
  BiS: 'bg-primary-100 text-primary-800',
  Bridge: 'bg-secondary-100 text-secondary-800',
  Budget: 'bg-background-100 text-foreground-600',
};

export default function EquipmentBuildPanel({ cls, onClose }: { cls: ClassTier; onClose: () => void }) {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [tab, setTab] = useState<BuildTab>('bossing');

  const buildData = classEquipmentBuilds[cls.id]?.[version];
  const equips = useMemo(() => {
    if (buildData) {
      return tab === 'bossing' ? buildData.bossingEquips : buildData.mobbingEquips;
    }
    return getEquipsForClass(cls);
  }, [buildData, tab, cls]);

  const innerAbility = buildData?.innerAbility ?? getDefaultInnerAbility(cls);
  const hyperStats = buildData?.hyperStats ?? getDefaultHyperStats(cls);
  const linkSkills = buildData?.linkSkills ?? getDefaultLinkSkills(cls);
  const rebootNotes = buildData?.rebootNotes ?? 'Equip priorities follow standard BiS progression. Focus on WSE potentials first, then star force accessories to 22★.';
  const rebootNotesZh = buildData?.rebootNotesZh ?? '装备优先级按标准 BiS 路线走。先搞 WSE 潜能，再把饰品冲到 22★。';
  const interactiveNotes = buildData?.interactiveNotes ?? 'Bonus Potential cubes significantly boost damage ceiling. Prioritize WSE 3L during DMT events.';
  const interactiveNotesZh = buildData?.interactiveNotesZh ?? '附加潜能提升上限明显。DMT 期间优先 WSE 3L。';

  return (
    <BuildPanelShell cls={cls} onClose={onClose}>
      <div className="flex items-center gap-1 bg-background-100 rounded-full p-1 mb-5">
        <button
          onClick={() => setTab('bossing')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors ${
            tab === 'bossing' ? 'bg-background-50 text-primary-700' : 'text-foreground-600 hover:text-foreground-800'
          }`}
        >
          <i className="ri-sword-line mr-1.5"></i>
          {t('build_bossing_tab')}
        </button>
        <button
          onClick={() => setTab('mobbing')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors ${
            tab === 'mobbing' ? 'bg-background-50 text-primary-700' : 'text-foreground-600 hover:text-foreground-800'
          }`}
        >
          <i className="ri-fire-line mr-1.5"></i>
          {t('build_mobbing_tab')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-background-200">
              <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-foreground-500 whitespace-nowrap">
                {t('build_slot')}
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-foreground-500">
                {t('build_item')}
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-foreground-500 hidden md:table-cell">
                {t('build_set')}
              </th>
              <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-foreground-500 hidden lg:table-cell">
                {t('build_notes')}
              </th>
              <th className="text-right py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-foreground-500 whitespace-nowrap">
                Tier
              </th>
            </tr>
          </thead>
          <tbody>
            {equips.map((e, i) => (
              <tr key={i} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-foreground-800 whitespace-nowrap">
                  {e.slot} <span className="text-foreground-500 font-normal text-xs">{e.slotZh}</span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="text-foreground-900 font-medium">{e.itemName}</div>
                  <div className="text-foreground-500 text-xs">{e.itemNameZh}</div>
                </td>
                <td className="py-2.5 px-3 text-foreground-600 text-xs hidden md:table-cell">
                  {e.setEffect}<br /><span className="text-foreground-500">{e.setEffectZh}</span>
                </td>
                <td className="py-2.5 px-3 text-foreground-600 text-xs max-w-[220px] hidden lg:table-cell">
                  {e.notes}<br /><span className="text-foreground-500">{e.notesZh}</span>
                </td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tierBadge[e.tier]}`}>
                    {t(`build_${e.tier.toLowerCase()}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8 pt-6 border-t border-background-200">
        <div>
          <h4 className="font-heading font-semibold text-foreground-950 text-sm mb-2">
            <i className="ri-flashlight-line mr-1.5 text-primary-500"></i>
            {t('build_inner_ability')}
          </h4>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-1.5 text-xs">
              <span className="text-primary-500 font-bold mt-0.5">1.</span>
              <span className="text-foreground-800">{innerAbility.line1}</span>
              <span className="text-foreground-500">{innerAbility.line1Zh}</span>
            </li>
            <li className="flex items-start gap-1.5 text-xs">
              <span className="text-foreground-500 font-bold mt-0.5">2.</span>
              <span className="text-foreground-800">{innerAbility.line2}</span>
              <span className="text-foreground-500">{innerAbility.line2Zh}</span>
            </li>
            <li className="flex items-start gap-1.5 text-xs">
              <span className="text-foreground-500 font-bold mt-0.5">3.</span>
              <span className="text-foreground-800">{innerAbility.line3}</span>
              <span className="text-foreground-500">{innerAbility.line3Zh}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-foreground-950 text-sm mb-2">
            <i className="ri-bar-chart-2-line mr-1.5 text-accent-500"></i>
            {t('build_hyper_stats')}
          </h4>
          <ul className="space-y-1">
            {hyperStats.map((hs, i) => (
              <li key={i} className="flex justify-between text-xs">
                <span className="text-foreground-800">{hs.stat} <span className="text-foreground-500">{hs.statZh}</span></span>
                <span className="font-semibold text-primary-600">+{hs.points}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-heading font-semibold text-foreground-950 text-sm mb-2">
            <i className="ri-links-line mr-1.5 text-secondary-500"></i>
            {t('build_link_skills')}
          </h4>
          <ul className="space-y-1.5">
            {linkSkills.map((ls, i) => (
              <li key={i} className="text-xs">
                <span className="font-semibold text-foreground-800">{ls.name}</span>
                <span className="text-foreground-500 ml-1">{ls.nameZh}</span>
                <br />
                <span className="text-foreground-600">{ls.effect}</span>
                <span className="text-foreground-500 ml-1">{ls.effectZh}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-background-200">
        <div className="bg-primary-50/50 rounded-xl p-4 border border-primary-100">
          <div className="text-xs font-bold text-primary-700 mb-1">{t('build_reboot_notes')}</div>
          <p className="text-xs text-primary-900">{rebootNotes}</p>
          <p className="text-xs text-primary-700 mt-1">{rebootNotesZh}</p>
        </div>
        <div className="bg-secondary-50/50 rounded-xl p-4 border border-secondary-100">
          <div className="text-xs font-bold text-secondary-700 mb-1">{t('build_interactive_notes')}</div>
          <p className="text-xs text-secondary-900">{interactiveNotes}</p>
          <p className="text-xs text-secondary-700 mt-1">{interactiveNotesZh}</p>
        </div>
      </div>
    </BuildPanelShell>
  );
}

function BuildPanelShell({ cls, onClose, children }: { cls: ClassTier; onClose: () => void; children: React.ReactNode }) {
  const { t } = useTranslation();
  const classImage = classImages[cls.id];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground-950/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[620px] lg:w-[700px] bg-background-50 overflow-y-auto border-l border-background-200">
        <div className="sticky top-0 z-10 bg-background-50/95 backdrop-blur border-b border-background-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-background-100 hover:bg-primary-50 flex items-center justify-center cursor-pointer text-foreground-700 hover:text-primary-600"
            >
              <i className="ri-arrow-left-line"></i>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center overflow-hidden">
                  {classImage ? (
                    <img src={classImage} alt={cls.name} className="w-full h-full object-cover" />
                  ) : (
                    <i className={`${cls.icon} text-primary-700 text-base`}></i>
                  )}
                </div>
                <span className="font-heading font-semibold text-foreground-950">{cls.name}</span>
                <span className="text-xs text-foreground-500">{cls.nameZh}</span>
              </div>
              <div className="text-[10px] text-foreground-500 mt-0.5">{t('build_title')}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background-100 hover:bg-background-200 flex items-center justify-center cursor-pointer text-foreground-500"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </>
  );
}