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
      title: 'Latest indexed Idle RPG briefing',
      description: 'A readable summary of the newest patch and developer direction currently verified in the MPStorys archive.',
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
      title: 'June seasonal activity archive',
      description: 'The official June activities and their confirmed closing dates are retained for reference after the main event and shop windows ended.',
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

const workspaceExpansions: Record<string, WorkspaceMap> = {
  'maplestory-m': {
    news: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Interface and quest changes',
          items: [
            'Character, combat power, location, party, and map information were reorganized in the main interface.',
            "Quest access was divided into To Do, Event, and Miyo's Boost Mission tabs.",
            'Content and Auto-Battle progress can replace quest information while those activities are running.',
          ],
        },
        {
          title: 'Hunting and progression',
          items: [
            "Party-member kills can award Sol Erda drops using the player's own Item Drop Rate.",
            'Star Force Field and party-hunting behavior received changes in the July update.',
            'Tutorial and Adventure Mission presentation and guidance were revised.',
          ],
        },
        {
          title: 'Events and limited sales',
          items: [
            'The PC MapleStory account-link event is scheduled through August 26, 2026.',
            'The Crystal Treasure Box event changes the secondary-weapon rate during its announced window.',
            'Time-limited ticket, crystal, enhancement, and custom packages are listed in the official patch notice.',
          ],
        },
      ],
    },
    upcoming: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Patch-note review',
          items: [
            'Read interface and quest changes before relying on an older menu path.',
            'Recheck party hunting and Star Force Field behavior after the update.',
            'Keep the patch note attached to event and package dates instead of copying dates without context.',
          ],
        },
        {
          title: 'Known-issue review',
          items: [
            'Tutorial and Adventure Mission issues are tracked in the dedicated known-issues notice.',
            'Maple Guide and Liberation Quest issues can be corrected separately from the main patch note.',
            'A later correction can change the practical result even when the original feature description remains unchanged.',
          ],
        },
      ],
    },
    guides: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Interface and skill setup',
          items: [
            'The Quick Menu can hold up to eight frequently used menu items.',
            'Skill Layout Type A supports five skills and Type B supports eight.',
            'Up to three skill presets can be saved, with a five-second switching cooldown.',
          ],
        },
        {
          title: 'Trade Station and inventory',
          items: [
            'The Trade Station supports item search, filters, purchases, and sale listings.',
            'A first Trade Permit is obtained through Maple Adventure before market use.',
            'Storage, sell filters, and extraction filters reduce unnecessary inventory handling.',
          ],
        },
      ],
    },
    events: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Summer Growth reference',
          items: [
            'Challenge! Summer Growth Special Training is attached to the July 8/9 patch notice.',
            'Use the official event block for its participation period, mission rules, and rewards.',
            'Do not carry an event deadline into another region or patch cycle without a matching official notice.',
          ],
        },
        {
          title: 'Account-link campaign',
          items: [
            'The PC MapleStory and MapleStory M account-link event begins after the July 9 update.',
            'The indexed patch schedules the campaign through August 26, 2026.',
            'Account eligibility and reward-claim steps should be checked before linking.',
          ],
        },
        {
          title: 'Claim checklist',
          items: [
            'Confirm the event period and server time before starting.',
            'Separate participation requirements from reward-claim requirements.',
            'Reopen the known-issues notice before completing affected tutorial or mission tasks.',
          ],
        },
      ],
    },
    wiki: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Character growth loop',
          items: [
            'Daily quests, hunting, and Star Force Fields form the documented early progression loop.',
            'Auto-Battle can continue while the app is closed and uses configurable potion thresholds.',
            'Hyper Stats become available from level 141.',
          ],
        },
        {
          title: 'Skills and automation',
          items: [
            'Skill layouts, presets, pet buffs, and Fever configuration control repeated combat behavior.',
            'Maple Guide filters and party matching reduce repeated navigation.',
            'Quest auto-progress and bundled matching are convenience systems, not substitutes for checking unlock conditions.',
          ],
        },
        {
          title: 'Equipment and economy',
          items: [
            'Equipment growth includes forging, enhancement, rank, and Star Force systems.',
            'The Trade Station requires market access and supports filtered searches and listings.',
            'Official tables and calculators should use the current mobile-game rates rather than PC MapleStory values.',
          ],
        },
      ],
    },
    shop: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Price record',
          items: [
            'Enter the currently displayed price and quantity for every planned purchase.',
            'Keep paid currency, bonus currency, and cash-equivalent values in separate notes.',
            'Recalculate after a package, Royal Style, Golden Apple, or Webshop rotation.',
          ],
        },
        {
          title: 'Ownership checks',
          items: [
            'Verify whether each item is character-bound, account-wide, or tradable.',
            'Check the sale period and regional availability before committing a budget.',
            'Treat randomized products as a spending cap decision rather than a guaranteed item cost.',
          ],
        },
      ],
    },
  },
  'maplestory-n': {
    upcoming: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Maintenance notices',
          items: [
            'Separate game maintenance from MapleStory Universe Marketplace maintenance.',
            'Use completion notices to confirm service restoration rather than assuming the scheduled end is final.',
            'Keep the official notice date attached to any temporary-maintenance reference.',
          ],
        },
        {
          title: 'Issue and direction records',
          items: [
            'Known-issues notices document problems after a patch.',
            'Patch notes describe shipped changes, while developer notes explain direction and countermeasures.',
            'Do not turn an MSU Direct-only notice body into a guessed maintenance schedule.',
          ],
        },
      ],
    },
    guides: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Getting started',
          items: [
            'The official download guide covers account, wallet, launcher, installation, and recommended PC specifications.',
            'The beginner guide organizes character progression, items, equipment, content, and gameplay topics.',
            'Account and service questions are directed to MapleStory Universe Support.',
          ],
        },
        {
          title: 'Classes and progression',
          items: [
            'The official class reference covers Warrior, Magician, Bowman, Thief, and Pirate branches.',
            'Adventure guides include portals, party quests, theme dungeons, Star Force fields, and boss content.',
            'Community guides cover chat, messages, blacklists, parties, friends, and guilds.',
          ],
        },
      ],
    },
    events: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Growth milestones',
          items: [
            'The V Tracker includes job-advancement and character-growth missions.',
            'Dungeon and story milestones are tracked separately from hunting progress.',
            'Use each official mission entry for its completion requirement and reward.',
          ],
        },
        {
          title: 'Fields and exploration',
          items: [
            'Hunting and field objectives form one part of the forty-mission tracker.',
            'Exploration and special-content tasks cover progress outside the core leveling route.',
            'Archived event records remain historical references and should not be treated as active.',
          ],
        },
      ],
    },
    wiki: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Classes and game systems',
          items: [
            'The official reference separates the five Adventurer branches and their job paths.',
            'Beginner documentation covers progression, equipment, community, and adventure content.',
            'Probability information is exposed as a dedicated official web area.',
          ],
        },
        {
          title: 'Web and economy services',
          items: [
            'Rankings, Dynamic Pricing, and the Marketplace are distinct MapleStory N services.',
            'Marketplace access connects to the broader MapleStory Universe ecosystem.',
            'Current market values and fees should be verified at the time of use.',
          ],
        },
        {
          title: 'Support and announcements',
          items: [
            'Official notices include maintenance, service changes, and known issues.',
            'Update notes and developer notes serve different purposes and remain separate records.',
            'Account, wallet, launcher, and service inquiries belong to MapleStory Universe Support.',
          ],
        },
      ],
    },
    rankings: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Published ranking fields',
          items: [
            'The official daily ranking includes level, EXP, fame, job, and guild information.',
            'The published table covers characters at level 10 and above.',
            'Record the date of the observed rank so a later comparison has context.',
          ],
        },
        {
          title: 'Planner interpretation',
          items: [
            'A smaller rank number represents a higher position.',
            'The calculated gap is a position difference, not an EXP requirement.',
            'Ties, refresh timing, and other players can change the visible position.',
          ],
        },
      ],
    },
    shop: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Market context',
          items: [
            'Dynamic Pricing, probability information, and Marketplace listings are separate official references.',
            'Confirm the exact asset, quantity, network, and current listing before entering a value.',
            'Do not reuse a price captured before a market or service update.',
          ],
        },
        {
          title: 'Budget boundary',
          items: [
            'Reserve room for fees and price movement when they are not included in the displayed amount.',
            'Keep wallet value and in-game progression value as separate decisions.',
            'The planner calculates a spending boundary; it does not recommend a transaction.',
          ],
        },
      ],
    },
  },
  'maplestory-worlds': {
    upcoming: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Release-impact review',
          items: [
            'Check client-version, editor, and font-rendering changes before publishing an update.',
            'A hotfix can follow scheduled maintenance and should be read as a separate record.',
            'Re-test affected user interfaces and scripts against the current client.',
          ],
        },
        {
          title: 'Operations and policy',
          items: [
            'Platform notices cover player bans, service incidents, creator policy, and sanctions.',
            'Publishing and monetization rules can change independently of editor features.',
            'Use the Creator Center timestamp and status label to distinguish active incidents from resolved history.',
          ],
        },
      ],
    },
    guides: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Editor and LuaScript',
          items: [
            'The curriculum introduces scenes, models, hierarchy, workspace, entities, components, and resources.',
            'LuaScript coverage includes tables, variables, functions, script types, and component behavior.',
            'Client and server execution must be separated before multiplayer state can remain consistent.',
          ],
        },
        {
          title: 'API reference reading',
          items: [
            'The reference is divided into Components, Events, Services, Logics, Misc, Enums, Lua, and LogMessages.',
            'Execution-space, synchronization, read-only, preview, and deprecation badges change how an entry should be used.',
            'Examples and signatures identify return types, parameters, optional values, and variable arguments.',
          ],
        },
      ],
    },
    events: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Entry steps',
          items: [
            'Join the Global Creator Challenge Discord and link a Nexon Account.',
            'Entry is complete when the linked account receives the CREATOR role.',
            'The account must remain linked through prize distribution.',
          ],
        },
        {
          title: 'Eligibility and award',
          items: [
            'Participation is limited to the United States and Canada, excluding Quebec.',
            'Six raffle winners receive a one-month Claude Pro subscription.',
            'One gift can be awarded per eligible Discord account linked to a Nexon Account.',
          ],
        },
      ],
    },
    wiki: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Maker fundamentals',
          items: [
            'World projects use scenes, entities, components, models, scripts, and resources.',
            'Basic documentation covers the editor, LuaScript, data, and client-server networking.',
            'Official sample projects demonstrate complete playable flows.',
          ],
        },
        {
          title: 'API and debugging',
          items: [
            'Components, Events, Services, and Logics expose the primary runtime capabilities.',
            'Execution and synchronization badges define where an API is valid.',
            'Informational, warning, and error log markers distinguish runtime outcomes.',
          ],
        },
        {
          title: 'Release and governance',
          items: [
            'Performance analysis, localization, publishing, and monetization are documented creator operations.',
            'IP-use rules define which supplied assets may be used and under what scope.',
            'Policy, sanction, and Open Market notices remain part of the operational reference.',
          ],
        },
      ],
    },
    shop: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Product scope',
          items: [
            'Separate platform Avatar Shop products from items sold inside an individual World.',
            'Record the World or creator attached to an in-world item.',
            'Check whether an item is cosmetic, functional, consumable, or time-limited.',
          ],
        },
        {
          title: 'Purchase record',
          items: [
            'Enter current listed prices and quantities rather than an old screenshot value.',
            'Keep platform and creator refund or purchase rules with the plan.',
            'Recalculate when a World update changes an item or its use.',
          ],
        },
      ],
    },
  },
  'maplestory-idle': {
    news: {
      title: '',
      description: '',
      sections: [
        {
          title: "Hero's Journey and growth",
          items: [
            "Hero's Journey unlocks after the Chapter 20 Boss, with Journey Tokens beginning in Chapter 21 Auto Hunt.",
            'Five Journey Chest Keys recharge each week up to a maximum of five.',
            'Journey Trail uses Journey Tokens and Mesos for boss footprints, Inventory Effects, and Special Options.',
          ],
        },
        {
          title: 'Guild and chapter progression',
          items: [
            'Guild Raid Horntail supports up to eight qualified members from one guild.',
            'Chapters 39-41, additional Growth Dungeon stages, and Hero Power Stage 8 were added.',
            'The Horntail Expedition medal carries a Final Damage +3% Inventory Effect.',
          ],
        },
        {
          title: 'Summer systems',
          items: [
            'The June patch includes Water Balloon Collection, Summer Shop, attendance, and treasure activities.',
            'Arena Boost and new Guild War and Guild Training Ground seasons use separate schedules.',
            'The main summer events end July 22, with the Summer Shop purchase period ending July 24.',
          ],
        },
      ],
    },
    upcoming: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Classes and companions',
          items: [
            'Night Walker and Wind Archer are announced as new playable classes.',
            'Matching companions and a higher featured summon rate are included in the preview.',
            'The Legendary Companion maximum level is planned to increase to 16.',
          ],
        },
        {
          title: 'Progression and bosses',
          items: [
            'Chapters 42-44 add Ereve, Rien, and Riena Strait.',
            'Higher chapters receive progressively improved EXP, with a larger gain from Chapter 38 onward.',
            'Burning Field Boosters and Chaos Horntail are part of the announced update direction.',
          ],
        },
        {
          title: 'Schedules and events',
          items: [
            'Monthly Attendance is planned to begin August 1 and reset on the first day of each month.',
            'Three Colosseum rounds are listed from July 28 through August 15, 2026.',
            'The preview lists cube, pendant, attendance, new-character, Journey Token, Party Quest, and Boss Raid events.',
          ],
        },
      ],
    },
    guides: {
      title: '',
      description: '',
      sections: [
        {
          title: "Hero's Journey loop",
          items: [
            'Clear the Chapter 20 Boss before expecting the system to unlock.',
            'Use Chapter 21 or later Auto Hunt for Journey Token drops.',
            'Plan weekly keys, the daily free Blessing reset, token costs, and Meso costs together.',
          ],
        },
        {
          title: 'Guild and boss preparation',
          items: [
            'Normal Horntail completion is required before joining the guild raid.',
            'A guild party can include up to eight members.',
            'Damage rewards, guild ranking, and the expedition medal are separate outcomes.',
          ],
        },
        {
          title: 'Progression checks',
          items: [
            'Match chapter unlocks with Growth Dungeon, Hero Power, artifact, job, and companion progress.',
            'Recheck balance changes before relying on an older stat priority.',
            'Keep seasonal event deadlines separate from permanent-system unlocks.',
          ],
        },
      ],
    },
    events: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Half Anniversary missions',
          items: [
            'Daily missions reset at midnight server time.',
            'Achievement missions cover Quick Hunt, Arena, summons, coins, Boss Raids, and Potential rerolls.',
            'Cumulative milestones include a Half Anniversary Festival medal with Main Stat +30.',
          ],
        },
        {
          title: 'Festival and Summer shops',
          items: [
            'Festival Coins can be exchanged for summons, enhancement materials, cubes, Hero Tokens, and Spell Traces.',
            'Some products use weekly, character, or date-specific purchase limits.',
            'The June Summer Shop remains open beyond the main event window, through July 24.',
          ],
        },
        {
          title: 'Schedule control',
          items: [
            'Attendance, collection, shop, Arena Boost, and guild seasons can end on different dates.',
            'Check the unlock chapter before planning an event task.',
            'Claim time-limited rewards before the applicable server-time cutoff.',
          ],
        },
      ],
    },
    wiki: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Character systems',
          items: [
            'Jobs, companions, skills, artifacts, Hero Power, and equipment contribute to growth.',
            'New class and companion availability is recorded through official previews and patch notes.',
            'Summon and equipment tools should use the current game data revision.',
          ],
        },
        {
          title: 'Chapter progression',
          items: [
            "Hero's Journey connects chapter progress, Auto Hunt, Journey Tokens, keys, and permanent effects.",
            'Chapter releases can add maps, EXP adjustments, Growth Dungeon stages, and boss requirements.',
            'The maintained FAQ covers resets, regions, jobs, access, devices, currencies, and gameplay systems.',
          ],
        },
        {
          title: 'Group and seasonal content',
          items: [
            'Party Quests, Guild Raid, Guild War, Training Ground, Arena, and Colosseum use different schedules.',
            'Event shops and attendance systems can remain open for different periods.',
            'Permanent progression and seasonal bonuses should be tracked separately.',
          ],
        },
      ],
    },
    rankings: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Ranking scope',
          items: [
            'The maintained tracker exposes character, guild, server, and class ranking views.',
            'Searchable profiles and progression history provide context beyond one position.',
            'Record which table and date produced the current rank.',
          ],
        },
        {
          title: 'Planner interpretation',
          items: [
            'The position gap does not estimate combat power, level, or time required.',
            'A target can move while other characters continue progressing.',
            'Use profile history to compare changes across multiple observations.',
          ],
        },
      ],
    },
    shop: {
      title: '',
      description: '',
      sections: [
        {
          title: 'Priority plan',
          items: [
            'Separate progression materials, summons, event currency, and appearance items.',
            'Apply weekly and per-character purchase limits before calculating the total.',
            'Reserve event currency for the highest-priority limited items first.',
          ],
        },
        {
          title: 'Rotation checks',
          items: [
            'Re-enter prices after a patch, event reset, or shop rotation.',
            'Keep a separate line for paid packages and in-game event shops.',
            'Do not treat a previewed product as available until the live shop confirms it.',
          ],
        },
      ],
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
  const expansion = workspaceExpansions[product.id]?.[module];
  const sections = useMemo(
    () => [...(definition?.sections || []), ...(expansion?.sections || [])],
    [definition, expansion],
  );
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
      ...sections.flatMap((section) => [section.title, ...section.items]),
    ];
    void translateStaticTexts(sourceTexts, targetLanguage, { sourceLanguage: 'en' })
      .then((translations) => {
        if (!active) return;
        setLocalizedText(Object.fromEntries(sourceTexts.map((text, index) => [text, translations[index] || text])));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [definition, i18n.language, sections]);

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

      {sections.length > 0 && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <section key={section.title} className="rounded-xl border border-background-300 bg-background-100 p-5">
              <h3 className="font-heading text-lg font-semibold">{copy(section.title)}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground-600">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <i className="ri-checkbox-circle-line mt-0.5 shrink-0 text-primary-600" aria-hidden="true" />
                    <span>{copy(item)}</span>
                  </li>
                ))}
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
