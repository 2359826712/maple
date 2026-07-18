import { useEffect, useState } from 'react';
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
};

type WorkspaceMap = Partial<Record<SeriesModule, WorkspaceDefinition>>;

const workspaces: Record<string, WorkspaceMap> = {
  'maplestory-m': {
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
  },
  'maplestory-idle': {
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
  },
};

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
    </section>
  );
}
