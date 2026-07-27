import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeStaticContentLanguage, translateStaticTexts } from '@/services/staticTranslation';
import type { SeriesProduct } from './catalog';
import type { SeriesModule } from './scope';

type WorkspaceSection = { title: string; items: string[] };
type WorkspaceDefinition = {
  title: string;
  description: string;
  facts?: Array<[string, string]>;
  sections?: WorkspaceSection[];
  utility?: 'budget' | 'ranking';
};

type WorkspaceMap = Partial<Record<SeriesModule, WorkspaceDefinition>>;

const workspaces: Record<string, WorkspaceMap> = {
  'maplestory-m': {
    news: {
      title: 'Current MapleStory M briefing',
      description: 'The latest verified mobile update information, condensed for reading directly on MPStorys.',
      facts: [
        ['Patch cycle', 'July 8/9, 2026'],
        ['Known issues', 'Tutorial, Adventure Mission, Maple Guide, and Liberation Quest notices are tracked separately'],
        ['Gameplay focus', 'Main UI, Star Force Field, growth missions, and current event additions'],
      ],
    },
    upcoming: {
      title: 'Current update cycle',
      description: 'The official Global Forum is the source of record for MapleStory M updates and known issues.',
      facts: [
        ['Latest indexed patch', 'July 8/9, 2026 patch notes'],
        ['Known-issues review', 'July 9, 2026'],
        ['Source', 'MapleStory M Global Forum'],
      ],
      sections: [{
        title: 'Systems covered in the current cycle',
        items: ['Tutorial and Adventure Mission changes', 'Main UI improvements', 'Star Force Field improvements', 'New event additions'],
      }],
    },
    guides: {
      title: 'Official beginner guide index',
      description: 'Verified topics from the MapleStory M Game Guide boards.',
      sections: [
        { title: 'New Maplers', items: ['Settings and convenience features', 'Auto-battle and growth', 'Equipment and forging', 'Trade Station basics'] },
        { title: 'Maple Guide', items: ['Level-based hunting grounds', 'Recommended content', 'Guide filters', 'Completion rewards'] },
      ],
    },
    events: {
      title: 'Current official event reference',
      description: 'Event rules and periods remain attached to the patch note that introduced them.',
      facts: [
        ['Indexed event', 'Challenge! Summer Growth Special Training'],
        ['Announcement', 'July 8/9, 2026 patch notes'],
        ['Date policy', 'MPStorys does not infer dates missing from the source record'],
      ],
    },
    wiki: {
      title: 'MapleStory M system reference',
      description: 'The official guide index organizes the mobile game reference by system ownership.',
      facts: [
        ['Character', 'Jobs, skills, growth, and character systems'],
        ['Equipment', 'Items, forging, enhancement, and progression'],
        ['Content', 'Dungeons, bosses, guilds, and party systems'],
        ['Interface', 'Basic UI, convenience features, and Rank menu'],
      ],
    },
    shop: {
      title: 'MapleStory M purchase planner',
      description: 'Plan Mapletown Market, Royal Style, Golden Apple, package, and Webshop spending before purchasing.',
      sections: [{
        title: 'Before purchasing',
        items: ['Confirm the package region and sale period', 'Check whether items are character-bound or account-wide', 'Compare the planned total with the budget entered below'],
      }],
      utility: 'budget',
    },
  },
  'maplestory-n': {
    upcoming: {
      title: 'Official notice tracker',
      description: 'Current MapleStory N maintenance and issue notices from the public announcement API.',
      facts: [
        ['Latest indexed maintenance', 'July 15, 2026 temporary maintenance'],
        ['Known-issues record', 'Issues following the July 1 patch'],
        ['Maintenance detail policy', 'No schedule is inferred when the official body only exposes MSU Direct'],
      ],
    },
    guides: {
      title: 'Launch and web-service guide',
      description: 'Verified MapleStory N web and service areas documented by the official launch guide.',
      sections: [
        { title: 'Game information', items: ['News and Guide', 'Ranking', 'Probability information'] },
        { title: 'Economy services', items: ['Dynamic Pricing', 'Marketplace', 'MapleStory Universe support'] },
      ],
    },
    events: {
      title: 'V Tracker mission reference',
      description: 'The official V Tracker is a forty-mission growth checklist.',
      sections: [{
        title: 'Mission groups',
        items: ['Job advancement and growth', 'Dungeons and story', 'Hunting and fields', 'Exploration and special content'],
      }],
    },
    wiki: {
      title: 'MapleStory N documentation map',
      description: 'A concise map of the verified first-party documentation areas.',
      facts: [
        ['Announcements', 'Notices, update notes, and known issues'],
        ['Events', 'Current and archived event rules'],
        ['Game reference', 'Classes, jobs, systems, and launch guidance'],
        ['Support', 'MapleStory Universe account and service support'],
      ],
    },
    rankings: {
      title: 'MapleStory N ranking progress planner',
      description: 'Record a published current rank and a target rank to calculate the remaining climb.',
      utility: 'ranking',
    },
    shop: {
      title: 'MapleStory N marketplace budget',
      description: 'Plan marketplace spending with values from the current MapleStory Universe market.',
      sections: [{
        title: 'Marketplace checks',
        items: ['Confirm the asset and network before acting', 'Use current Dynamic Pricing and marketplace values', 'Keep fees and price movement outside the base budget when uncertain'],
      }],
      utility: 'budget',
    },
  },
  'maplestory-worlds': {
    upcoming: {
      title: 'Creator platform change log',
      description: 'Verified maintenance and hotfix records from the Creator Center.',
      facts: [
        ['July 2 hotfix', 'Font-rendering correction and client version update'],
        ['July 1 maintenance', 'Player Ban feature and platform fixes'],
        ['Source', 'MapleStory Worlds Creator Center News'],
      ],
    },
    guides: {
      title: 'Creator production guide',
      description: 'First-party topics for building, testing, and publishing MapleStory Worlds experiences.',
      sections: [
        { title: 'Build', items: ['World creation and LuaScript concepts', 'Networking behavior', 'Weapon and title creation'] },
        { title: 'Release', items: ['Profiler-based performance analysis', 'World localization', 'Publishing and monetization'] },
      ],
    },
    events: {
      title: 'Global Creator Challenge Discord event',
      description: 'Verified event details retained from the official Creator Center announcement.',
      facts: [
        ['Event window', 'July 2 through October 7, 2026 (UTC)'],
        ['Eligibility', 'United States and Canada, excluding Quebec'],
        ['Prize', 'Six one-month Claude Pro subscriptions'],
        ['Delivery', 'Direct message from an official MapleStory Worlds administrator'],
      ],
    },
    wiki: {
      title: 'Creator Center reference',
      description: 'Verified subject areas covered by the MapleStory Worlds creator documentation.',
      facts: [
        ['Editor', 'World creation and resource management'],
        ['Scripting', 'LuaScript concepts and networking'],
        ['Operations', 'Performance, localization, publishing, and monetization'],
        ['Policy', 'Avatar, creator, sanction, and Open Market notices'],
      ],
    },
    shop: {
      title: 'MapleStory Worlds shop budget',
      description: 'Plan avatar-product and in-world purchases without mixing them with another MapleStory title.',
      sections: [{
        title: 'Purchase checks',
        items: ['Confirm whether the item belongs to the Avatar Shop or a specific World', 'Review creator and platform purchase rules', 'Enter the current listed price rather than reusing an old value'],
      }],
      utility: 'budget',
    },
  },
  'maplestory-idle': {
    news: {
      title: 'Current Idle RPG briefing',
      description: 'A readable summary of the latest indexed patch and developer direction.',
      facts: [
        ['Latest indexed patch', 'June 11, 2026'],
        ['Progression', "Hero's Journey, artifacts, chapters, jobs, and companions"],
        ['Seasonal systems', 'Summer activities, Arena Boost, guild seasons, and Party Quest changes'],
      ],
    },
    upcoming: {
      title: 'Idle RPG update tracker',
      description: 'Current official patch notes and future-update direction from the Nexon forum.',
      facts: [
        ['Latest indexed patch', 'June 11, 2026 patch notes'],
        ['Roadmap reference', 'Future Update Plans developer note'],
        ['Source', 'MapleStory: Idle RPG Official Forum'],
      ],
    },
    guides: {
      title: 'Progression reference',
      description: 'Systems and unlock changes documented in the current official patch-note archive.',
      sections: [
        { title: 'Growth', items: ["Hero's Journey", 'Jobs and companions', 'Artifacts and chapter progression'] },
        { title: 'Combat', items: ['Party Quest difficulty', 'Balance changes', 'Arena and guild seasons'] },
      ],
    },
    events: {
      title: 'Current seasonal activity index',
      description: 'Official June patch-note activities are listed without inventing unconfirmed end dates.',
      facts: [
        ['Collection', 'Water Balloon Collection'],
        ['Event shop', 'Summer Shop'],
        ['Combat bonus', 'Arena Boost'],
        ['Guild content', 'Current guild seasons'],
      ],
    },
    wiki: {
      title: 'Idle RPG system index',
      description: 'Verified systems covered by the official patch-note archive.',
      facts: [
        ['Characters', 'Jobs and companions'],
        ['Progression', 'Artifacts, chapters, and Hero\'s Journey'],
        ['Group content', 'Party Quests and guild seasons'],
        ['Economy', 'Event shops and appearance-item additions'],
      ],
    },
    rankings: {
      title: 'Idle RPG ranking progress planner',
      description: 'Track the difference between a published current rank and the next target.',
      utility: 'ranking',
    },
    shop: {
      title: 'Idle RPG shop budget',
      description: 'Plan event-shop and appearance-item spending using the current in-game prices.',
      sections: [{
        title: 'Before spending',
        items: ['Confirm the current event or package period', 'Prioritize progression purchases before optional appearance items', 'Re-enter prices after a patch or shop rotation'],
      }],
      utility: 'budget',
    },
  },
};

function BudgetPlanner() {
  const { t, i18n } = useTranslation();
  const [budget, setBudget] = useState('1000');
  const [planned, setPlanned] = useState('0');
  const budgetValue = Math.max(0, Number(budget) || 0);
  const plannedValue = Math.max(0, Number(planned) || 0);
  const remaining = budgetValue - plannedValue;
  const formatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }),
    [i18n.language],
  );

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-primary-200 bg-background-50">
      <div className="border-b border-primary-200 bg-primary-50 px-5 py-4">
        <h3 className="font-heading text-lg font-semibold">{t('series_budget_title')}</h3>
        <p className="mt-1 text-xs leading-5 text-foreground-600">{t('series_budget_desc')}</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <label>
          <span className="text-xs font-semibold text-foreground-700">{t('series_budget_total')}</span>
          <input
            type="number"
            min="0"
            step="any"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-foreground-700">{t('series_budget_planned')}</span>
          <input
            type="number"
            min="0"
            step="any"
            value={planned}
            onChange={(event) => setPlanned(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
      </div>
      <div className={`border-t px-5 py-5 ${remaining < 0 ? 'border-accent-200 bg-accent-50' : 'border-background-200 bg-background-100'}`}>
        <p className="text-xs font-semibold text-foreground-600">
          {t(remaining < 0 ? 'series_budget_over' : 'series_budget_remaining')}
        </p>
        <p className={`mt-1 font-heading text-3xl font-semibold ${remaining < 0 ? 'text-accent-800' : 'text-primary-800'}`}>
          {formatter.format(Math.abs(remaining))}
        </p>
      </div>
    </section>
  );
}

function RankingPlanner() {
  const { t, i18n } = useTranslation();
  const [character, setCharacter] = useState('');
  const [currentRank, setCurrentRank] = useState('1000');
  const [targetRank, setTargetRank] = useState('500');
  const current = Math.max(1, Math.floor(Number(currentRank) || 1));
  const target = Math.max(1, Math.floor(Number(targetRank) || 1));
  const gap = Math.max(0, current - target);
  const formatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-primary-200 bg-background-50">
      <div className="border-b border-primary-200 bg-primary-50 px-5 py-4">
        <h3 className="font-heading text-lg font-semibold">{t('series_rank_title')}</h3>
        <p className="mt-1 text-xs leading-5 text-foreground-600">{t('series_rank_desc')}</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-3">
        <label>
          <span className="text-xs font-semibold text-foreground-700">{t('series_rank_character')}</span>
          <input
            type="text"
            value={character}
            onChange={(event) => setCharacter(event.target.value)}
            placeholder={t('rankings_ign_placeholder')}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-foreground-700">{t('series_rank_current')}</span>
          <input
            type="number"
            min="1"
            step="1"
            value={currentRank}
            onChange={(event) => setCurrentRank(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
        <label>
          <span className="text-xs font-semibold text-foreground-700">{t('series_rank_target')}</span>
          <input
            type="number"
            min="1"
            step="1"
            value={targetRank}
            onChange={(event) => setTargetRank(event.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </label>
      </div>
      <div className="border-t border-background-200 bg-background-100 px-5 py-5">
        <p className="text-xs font-semibold text-foreground-600">{t('series_rank_gap')}</p>
        <p className="mt-1 font-heading text-3xl font-semibold text-primary-800">{formatter.format(gap)}</p>
        <p className="mt-2 text-xs leading-5 text-foreground-500">
          {t('series_rank_note', { character: character.trim() || '—' })}
        </p>
      </div>
    </section>
  );
}

export default function SeriesContentWorkspace({ product, module }: { product: SeriesProduct; module: SeriesModule }) {
  const definition = workspaces[product.id]?.[module];
  const { i18n } = useTranslation();
  const [localizedText, setLocalizedText] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    setLocalizedText({});
    if (!definition) return () => { active = false; };
    const targetLanguage = normalizeStaticContentLanguage(i18n.language);
    if (targetLanguage === 'en') return () => { active = false; };
    const sourceTexts = [
      definition.title,
      definition.description,
      ...(definition.facts || []).flat(),
      ...(definition.sections || []).flatMap((section) => [section.title, ...section.items]),
    ];
    void translateStaticTexts(sourceTexts, targetLanguage, { sourceLanguage: 'en' })
      .then((translations) => {
        if (!active) return;
        setLocalizedText(Object.fromEntries(sourceTexts.map((text, index) => [text, translations[index] || text])));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [definition, i18n.language]);

  if (!definition) return null;
  const copy = (value: string) => localizedText[value] || value;
  const headingId = `series-${product.id}-${module}-workspace`;

  return (
    <section className="border-b border-background-300 pb-10" aria-labelledby={headingId}>
      <p className="text-xs font-semibold uppercase text-primary-700">{product.name}</p>
      <h2 id={headingId} className="mt-1 font-heading text-2xl font-semibold md:text-3xl">{copy(definition.title)}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-600">{copy(definition.description)}</p>

      {definition.facts && (
        <dl className="mt-6 divide-y divide-background-300 border-y border-background-300">
          {definition.facts.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3.5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6">
              <dt className="text-xs font-semibold uppercase text-foreground-500">{copy(label)}</dt>
              <dd className="text-sm leading-6 text-foreground-800">{copy(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {definition.sections && (
        <div className="mt-7 grid gap-8 md:grid-cols-2">
          {definition.sections.map((section) => (
            <section key={section.title}>
              <h3 className="font-heading text-lg font-semibold">{copy(section.title)}</h3>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-foreground-600">
                {section.items.map((item) => <li key={item} className="border-l-2 border-primary-300 pl-3">{copy(item)}</li>)}
              </ul>
            </section>
          ))}
        </div>
      )}

      {definition.utility === 'budget' && <BudgetPlanner />}
      {definition.utility === 'ranking' && <RankingPlanner />}
    </section>
  );
}
