export const guideDetail = {
  id: 'g1',
  title: '6th Job unlock roadmap: from level 260 to full HEXA nodes',
  slug: '6th-job-hexa-roadmap-gms',
  version: 'gms',
  author: {
    name: 'HexaSensei',
    avatar: 'https://readdy.ai/api/search-image?query=Chibi%20fantasy%20wizard%20boy%20wearing%20round%20glasses%20and%20orange%20robe%20on%20cream%20background%2C%20soft%20painterly%20cartoon%20style%20portrait%2C%20warm%20highlights%2C%20simple%20centered%20portrait%2C%20whimsical%20mood%2C%20clean%20composition%20with%20plenty%20of%20negative%20space&width=160&height=160&seq=maple-author-hexasensei&orientation=squarish',
    bio: 'GMS end-game main since 2018. Cleared Kalos hard on Reboot Kronos. Specialises in 6th job and Legion optimisation guides.',
    joined: 'April 2020',
    posts: 247,
    followers: '18.3k',
  },
  classLabel: 'All Classes',
  difficulty: 'Advanced',
  readTime: '18 min',
  published: 'Jul 5, 2026',
  updated: 'Jul 6, 2026',
  upvotes: 1284,
  tags: ['HEXA', '6th Job', 'Sol Erda', 'Progression', 'End Game'],
  cover:
    'https://readdy.ai/api/search-image?query=Magical%20fantasy%20MMO%20wide%20banner%20with%20glowing%20golden%20orange%20magical%20crystals%20floating%20over%20cream%20clouds%2C%20soft%20warm%20lighting%2C%20cinematic%20painterly%20illustration%20style%2C%20ethereal%20mood%2C%20high%20detail%2C%20wide%20composition%20with%20plenty%20of%20negative%20space%20at%20the%20top%20for%20text%20overlay&width=1400&height=700&seq=maple-guide-cover-hexa&orientation=landscape',
  summary:
    'From level 260 to your first fully unlocked HEXA node — this roadmap covers Sol Erda daily loops, Erda Spectrum priority, Origin skill timing, and the fastest path to six full HEXA nodes for your class. Tested on GMS Kronos (Reboot) and Bera (Interactive) with v.253 Ignition rates.',
  toc: [
    { id: 'prerequisites', title: 'Before you start: level & quest requirements' },
    { id: 'sol-erda', title: 'Sol Erda daily loop — 3 minutes per character' },
    { id: 'erda-spectrum', title: 'Erda Spectrum priority order' },
    { id: 'origin-skill', title: 'Unlocking and timing your Origin skill' },
    { id: 'node-order', title: 'Optimal HEXA node unlock order (class-agnostic)' },
    { id: 'cost-breakdown', title: 'Full cost breakdown: time vs. mesos' },
    { id: 'gms-differences', title: 'GMS-specific notes: Reboot vs Interactive' },
    { id: 'faq', title: 'Common mistakes & FAQ' },
  ],
  sections: [
    {
      id: 'prerequisites',
      title: 'Before you start: level & quest requirements',
      content: [
        {
          type: 'paragraph',
          text: 'First things first — you need to hit level 260. No shortcuts here. Once you do, the lightbulb quest "[6th Job] Converging to the Origin" will automatically appear on the left side of your screen. Do not skip the cutscenes on your first character — they explain the lore behind the Erda system and you will need that context when choosing Origin skill timing later.',
        },
        {
          type: 'list',
          style: 'ordered',
          items: [
            'Reach level 260 on any class (Burning or regular).',
            'Complete "[6th Job] Converging to the Origin" — ~15 minutes of questing in the Erda Convergence map.',
            'Gain access to the Sol Erda daily system and your first HEXA node slot.',
            'Accept the Sol Erda daily from the Erda Administrator NPC in the Convergence lobby.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'If you used a Tera Burn to hit 260, you still need to complete the full Convergence questline individually on that character. Burning shortcuts only skip the leveling, not the quests.',
        },
        {
          type: 'paragraph',
          text: 'Once the questline is done, you will have one HEXA node slot unlocked and approximately 80–100 Sol Erda fragments from the quest rewards. Do not spend these immediately — read the section on node unlock order first.',
        },
      ],
    },
    {
      id: 'sol-erda',
      title: 'Sol Erda daily loop — 3 minutes per character',
      content: [
        {
          type: 'paragraph',
          text: 'The Sol Erda daily is your primary source of fragments for unlocking and upgrading HEXA nodes. The loop is mercifully short — on average 3 minutes per character once you know the maps — but doing it consistently across characters is where most players fall behind.',
        },
        {
          type: 'list',
          style: 'unordered',
          items: [
            'Talk to the Erda Administrator NPC in the Convergence lobby.',
            'Choose one of three daily missions (kill 500 mobs in your level range, defeat a daily boss, or complete an Erda Convergence minigame).',
            'Receive 12 Sol Erda fragments and 1 Sol Erda energy.',
            'Repeat daily — fragments cap at 200, energy at 20.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Pick the mob-killing mission 100% of the time. The boss mission forces you to queue for a boss that may already be on cooldown, and the minigame can glitch during server lag. Mob kills in any Arcane River map count, so you can pair this with your Arcane dailies.',
        },
        {
          type: 'paragraph',
          text: 'On GMS, the Sol Erda daily resets at midnight UTC (5 PM PDT / 8 PM EDT). Plan your loop around this — if you complete dailies at 7:30 PM EDT, you will get another set at 8 PM EDT if you are still online.',
        },
      ],
    },
    {
      id: 'erda-spectrum',
      title: 'Erda Spectrum priority order',
      content: [
        {
          type: 'paragraph',
          text: 'Erda Spectrum is the weekly content inside the Convergence map that awards large amounts of Sol Erda fragments and energy. You can enter up to 3 times per week per character, and clear rewards scale with your Convergence level.',
        },
        {
          type: 'table',
          headers: ['Spectrum stage', 'Min. Level', 'Fragments', 'Energy', 'Recommendation'],
          rows: [
            ["Erda's Whisper", '260', '40', '3', 'Do first — shortest clear time'],
            ["Erda's Call", '265', '60', '5', 'Do second — moderate difficulty'],
            ["Erda's Echo", '270', '80', '7', 'Skip if under 50k stat — 15+ min clear'],
            ["Erda's Resonance", '275', '120', '10', 'Party recommended below 60k stat'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: "GMS Reboot players: Erda's Resonance HP scales with player count, but raw damage in Reboot is higher due to the passive. Soloing Erda's Resonance is viable from ~55k stat in Reboot, vs ~65k in Interactive.",
        },
      ],
    },
    {
      id: 'origin-skill',
      title: 'Unlocking and timing your Origin skill',
      content: [
        {
          type: 'paragraph',
          text: 'Your Origin skill is the first HEXA node you should unlock — no exceptions, no class-specific debates. It doubles your burst damage window and is the single largest power spike you will get between level 260 and 280.',
        },
        {
          type: 'list',
          style: 'ordered',
          items: [
            'Spend 100 Sol Erda fragments to unlock your first HEXA node slot.',
            'Choose the Origin skill node (the one with the star-shaped icon).',
            'Equip it — no further fragments needed to activate.',
            'Bind your Origin skill to a comfortable key. On most classes it has a 6-minute cooldown and shares a cooldown group with your Maple Goddess blessing.',
          ],
        },
        {
          type: 'paragraph',
          text: 'In boss fights, always use Origin skill at the start of your burst rotation — before your 5th job bind skills, not after. The Origin skill animation grants i-frames for its full duration (3–4 seconds, class-dependent), so it also serves as an emergency dodge during one-shot mechanics.',
        },
      ],
    },
    {
      id: 'node-order',
      title: 'Optimal HEXA node unlock order (class-agnostic)',
      content: [
        {
          type: 'paragraph',
          text: 'After the Origin skill, the remaining five HEXA nodes should be unlocked in a specific order to maximise your damage output at each stage. This order is optimised for solo progression and party bossing alike.',
        },
        {
          type: 'list',
          style: 'ordered',
          items: [
            '<strong>Origin skill</strong> (100 fragments) — mandatory first unlock.',
            '<strong>Mastery core I</strong> (150 fragments) — boosts all 1st–4th job attacks by 20% final damage at rank 1.',
            '<strong>Enhancement core — main bossing skill</strong> (200 fragments) — pick the skill you use most in bossing; for most classes this is your 4th job or Hyper skill.',
            '<strong>Mastery core II</strong> (250 fragments) — further boosts base attack range and adds passive IED.',
            '<strong>Enhancement core — secondary mobbing skill</strong> (300 fragments) — for grinding efficiency, pick your best AoE skill.',
            '<strong>Enhancement core — utility skill</strong> (400 fragments) — usually a bind extension or i-frame skill.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Total cost for all six nodes: approximately 1,400 Sol Erda fragments and 80 Sol Erda energy. At 12 fragments per day plus Spectrum weekly bonuses, this takes roughly 45–60 days per character with consistent dailies.',
        },
      ],
    },
    {
      id: 'cost-breakdown',
      title: 'Full cost breakdown: time vs. mesos',
      content: [
        {
          type: 'paragraph',
          text: 'For players who value time over mesos, there is an alternative: Sol Erda fragment pouches from the Auction House. On GMS Interactive worlds, fragment pouches currently average 12M mesos each and yield 10–15 fragments. On Reboot, fragment acquisition is purely time-gated with no meso shortcut.',
        },
        {
          type: 'table',
          headers: ['Method', 'Fragments per day', 'Mesos cost', 'Days to full HEXA (est.)'],
          rows: [
            ['Dailies only', '12', '0', '117 days'],
            ['Dailies + 3x Spectrum / week', '~20 (avg)', '0', '70 days'],
            ['Dailies + AH pouches (Interactive)', '~40', '~60M/day', '35 days'],
            ['Dailies + frenzy service (Interactive)', '~30', '~15M/day (service)', '47 days'],
          ],
        },
      ],
    },
    {
      id: 'gms-differences',
      title: 'GMS-specific notes: Reboot vs Interactive',
      content: [
        {
          type: 'paragraph',
          text: 'The HEXA system is largely identical across KMS and GMS, but there are a few important differences that affect your progression speed:',
        },
        {
          type: 'list',
          style: 'unordered',
          items: [
            '<strong>Reboot passive final damage buff</strong> applies to all HEXA-enhanced skills, so your Origin skill will hit approximately 25% harder in Reboot than in Interactive at equivalent gear.',
            '<strong>Familiar system (GMS exclusive)</strong> — Familiars with "Increase item drop rate" lines do NOT affect Sol Erda fragment drop rates from mobs. This is a common misconception.',
            '<strong>Kishin (Kanna) and Wild Totem</strong> — spawn enhancement increases kill rate for the daily mob mission, effectively reducing the 500-kill requirement to ~3 minutes instead of 5.',
            '<strong>GMS attack speed cap (0)</strong> — faster attack speed means faster mobbing for the daily, which compounds over months of dailies.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'KMS patch notes occasionally mention HEXA node cost reductions. These take 4–6 months to reach GMS. Do not plan your spending around future KMS changes — budget for current GMS costs.',
        },
      ],
    },
    {
      id: 'faq',
      title: 'Common mistakes & FAQ',
      content: [
        {
          type: 'paragraph',
          text: 'After helping over 200 players through 6th job on the MapleHub Discord, here are the most common mistakes I see — avoid them and you will save weeks of progress.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Mistake #1: Spending Sol Erda fragments on enhancement core upgrades before unlocking all six nodes. Each upgrade rank costs 50 fragments for only a ~3% damage increase, whereas unlocking a new Mastery core gives 20% final damage. Always unlock new nodes before upgrading existing ones.',
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'FAQ: Can I transfer HEXA nodes between characters? No. HEXA nodes are character-bound and cannot be transferred via storage, Auction House, or cash shop. Each character must complete the Convergence questline and grind their own fragments.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: "Pro tip: Sol Erda energy has a cap of 20. If you are nearing the cap and don't have enough fragments to unlock your next node, spend energy on enhancement core upgrades for your Origin skill. Energy above the cap is wasted — never let it sit at 20.",
        },
      ],
    },
  ],
};

export const comments = [
  {
    id: 'cm1',
    user: 'StarCrunch',
    avatar: 'https://readdy.ai/api/search-image?query=Chibi%20fantasy%20warrior%20boy%20with%20spiky%20yellow%20hair%20on%20cream%20background%2C%20soft%20painterly%20cartoon%20portrait%20style%2C%20warm%20highlights%2C%20simple%20centered%20subject%2C%20whimsical%20mood%2C%20clean%20composition&width=120&height=120&seq=maple-avatar-starcrunch&orientation=squarish',
    badge: 'Verified Creator',
    date: 'Jul 6, 2026',
    content: 'This is the cleanest HEXA roadmap I have ever read. The Reboot vs Interactive cost table alone saved me from wasting 200M on AH pouches when I should have just been doing dailies. One thing to add: on Kronos, the Erda Convergence minigame is bugged during 2x events — it occasionally doesn\'t register clears. Stick to mob kills on Sundays.',
    upvotes: 94,
    replies: [
      {
        id: 'rp1',
        user: 'HexaSensei',
        avatar: 'https://readdy.ai/api/search-image?query=Chibi%20fantasy%20wizard%20boy%20wearing%20round%20glasses%20and%20orange%20robe%20on%20cream%20background%2C%20soft%20painterly%20cartoon%20style%20portrait%2C%20warm%20highlights%2C%20simple%20centered%20portrait%2C%20whimsical%20mood%2C%20clean%20composition&width=120&height=120&seq=maple-avatar-hexasensei&orientation=squarish',
        badge: 'Author',
        date: 'Jul 6, 2026',
        content: 'Good catch, StarCrunch! I have updated the daily loop section to explicitly mention the 2x event bug on Kronos. Thank you.',
        upvotes: 32,
      },
      {
        id: 'rp2',
        user: 'MapleMule',
        avatar: 'https://readdy.ai/api/search-image?query=Cute%20chibi%20fantasy%20female%20archer%20with%20green%20bandana%20on%20cream%20background%2C%20soft%20painterly%20cartoon%20portrait%2C%20warm%20highlights%2C%20simple%20centered%20subject%2C%20whimsical%20mood%2C%20clean%20composition&width=120&height=120&seq=maple-avatar-maplemule&orientation=squarish',
        badge: '',
        date: 'Jul 6, 2026',
        content: 'Can confirm the Kronos bug. Happened to me three times last month before I switched to mob kills only.',
        upvotes: 14,
      },
    ],
  },
  {
    id: 'cm2',
    user: 'RebootRuby',
    avatar: 'https://readdy.ai/api/search-image?query=Chibi%20fantasy%20female%20mage%20with%20long%20pink%20hair%20on%20cream%20background%2C%20soft%20painterly%20cartoon%20portrait%2C%20warm%20highlights%2C%20simple%20centered%20subject%2C%20whimsical%20mood%2C%20clean%20composition&width=120&height=120&seq=maple-avatar-rebootruby&orientation=squarish',
    badge: '',
    date: 'Jul 6, 2026',
    content: 'As someone who just hit 260 on Hyperion, the node unlock order section is gold. I was about to dump fragments into enhancement cores before reading this. You literally saved me a month of daily grinding. One question though: does the Origin skill i-frame work against Kalos\'s laser phase?',
    upvotes: 67,
    replies: [],
  },
  {
    id: 'cm3',
    user: 'FoxWhisker',
    avatar: 'https://readdy.ai/api/search-image?query=Chibi%20fantasy%20female%20avatar%20with%20fox%20ears%20and%20white%20hair%20in%20kimono%20on%20cream%20background%2C%20soft%20painterly%20cartoon%20portrait%2C%20warm%20highlights%2C%20simple%20centered%2C%20whimsical%20mood&width=120&height=120&seq=maple-avatar-foxwhisker&orientation=squarish',
    badge: '',
    date: 'Jul 5, 2026',
    content: 'The GMS-specific section is super helpful. One thing I would add: Kanna\'s Origin skill has a longer animation lock (4.2 seconds) compared to most classes (3.0–3.5 seconds), so the i-frame window is actually longer! Great for learning boss mechanics on a new character. Also, Kishin spawn boost cuts the daily mob mission down to about 2.5 minutes — I have timed it.',
    upvotes: 51,
    replies: [
      {
        id: 'rp3',
        user: 'HexaSensei',
        avatar: 'https://readdy.ai/api/search-image?query=Chibi%20fantasy%20wizard%20boy%20wearing%20round%20glasses%20and%20orange%20robe%20on%20cream%20background%2C%20soft%20painterly%20cartoon%20style%20portrait%2C%20warm%20highlights%2C%20simple%20centered%20portrait%2C%20whimsical%20mood%2C%20clean%20composition&width=120&height=120&seq=maple-avatar-hexasensei&orientation=squarish',
        badge: 'Author',
        date: 'Jul 5, 2026',
        content: 'Thanks FoxWhisker! That Kanna Origin timing is a great detail. I have added a note about class-specific animation locks in the GMS section. The Kishin timing data is also super useful — mind if I credit you in the guide?',
        upvotes: 22,
      },
    ],
  },
  {
    id: 'cm4',
    user: 'KalosCleaner',
    avatar: 'https://readdy.ai/api/search-image?query=Chibi%20fantasy%20dark%20knight%20with%20helmet%20on%20cream%20background%2C%20soft%20painterly%20cartoon%20portrait%2C%20warm%20highlights%2C%20simple%20centered%20subject%2C%20whimsical%20mood%2C%20clean%20composition&width=120&height=120&seq=maple-avatar-kaloscleaner&orientation=squarish',
    badge: '',
    date: 'Jul 5, 2026',
    content: 'I finished all six HEXA nodes on my Hero last week (Bera) and this roadmap is spot on. The cost breakdown table exactly matches what I spent — about 1,380 fragments total with AH pouch supplementation. The only thing I would add for Interactive players: during Marvel Machine events, fragment pouch prices spike because people are meso-rich. Buy pouches a week BEFORE Marvel opens if you can.',
    upvotes: 38,
    replies: [],
  },
];

export const relatedGuides = [
  {
    id: 'g2',
    title: 'Reboot mesos progression — 4B to 40B in three weeks (GMS)',
    classLabel: 'Reboot Only',
    difficulty: 'Intermediate',
    readTime: '12 min',
    author: 'RebootRuby',
    upvotes: 964,
    versions: ['gms'],
    image:
      'https://readdy.ai/api/search-image?query=Piles%20of%20golden%20fantasy%20coins%20stacked%20on%20cream%20wooden%20surface%2C%20warm%20lighting%2C%20soft%20painterly%20cartoon%20illustration%20style%2C%20clean%20simple%20background%2C%20whimsical%20treasure%20scene%20for%20MMO%20guide%20thumbnail%20with%20wide%20cinematic%20framing&width=600&height=400&seq=maple-guide-reboot&orientation=landscape',
  },
  {
    id: 'g4',
    title: 'Familiar system 101 — badge crafting tree for damage stackers',
    classLabel: 'GMS Exclusive',
    difficulty: 'Intermediate',
    readTime: '14 min',
    author: 'BadgeCraft',
    upvotes: 703,
    versions: ['gms'],
    image:
      'https://readdy.ai/api/search-image?query=Cute%20fantasy%20monster%20cards%20fanned%20out%20on%20cream%20table%2C%20teal%20and%20orange%20highlights%2C%20warm%20soft%20lighting%2C%20painterly%20cartoon%20illustration%2C%20whimsical%20trading%20card%20scene%20for%20MMO%20guide%2C%20wide%20cinematic%20composition%20with%20negative%20space&width=600&height=400&seq=maple-guide-familiar&orientation=landscape',
  },
  {
    id: 'g5',
    title: 'Lomien to Kalos — legion power thresholds you actually need',
    classLabel: 'End Game',
    difficulty: 'Advanced',
    readTime: '22 min',
    author: 'KalosCleaner',
    upvotes: 668,
    versions: ['gms', 'kms', 'msea'],
    image:
      'https://readdy.ai/api/search-image?query=Cosmic%20fantasy%20boss%20silhouette%20surrounded%20by%20soft%20orange%20energy%20on%20cream%20background%2C%20whimsical%20painterly%20cartoon%20style%20MMO%20illustration%2C%20wide%20cinematic%20composition%2C%20simple%20elegant%20layout%20with%20negative%20space&width=600&height=400&seq=maple-guide-kalos&orientation=landscape',
  },
  {
    id: 'g3',
    title: 'Kanna funding order — bossing setup optimized for GMS interactive',
    classLabel: 'Kanna',
    difficulty: 'Beginner',
    readTime: '9 min',
    author: 'FoxWhisker',
    upvotes: 812,
    versions: ['gms'],
    image:
      'https://readdy.ai/api/search-image?query=Chibi%20fox%20mage%20girl%20in%20kimono%20casting%20warm%20orange%20magic%20on%20cream%20background%2C%20soft%20painterly%20cartoon%20style%2C%20whimsical%20anime%20illustration%20for%20MMO%20class%20guide%2C%20wide%20cinematic%20layout%2C%20simple%20elegant%20composition%20with%20negative%20space&width=600&height=400&seq=maple-guide-kanna&orientation=landscape',
  },
];