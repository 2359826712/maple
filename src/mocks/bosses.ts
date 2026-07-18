export interface Drop {
  name: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  description: string;
}

export interface Phase {
  name: string;
  nameZh: string;
  mechanics: string[];
}

export interface BossInfo {
  id: string;
  name: string;
  nameZh: string;
  difficulty: string[];
  level: number;
  minLevel: number;
  recommendedBp: number;
  /** Entries per difficulty per reset period (NOT summed across difficulties). */
  dailyLimit: number;
  weeklyLimit: number;
  mesoReward: number;
  expReward: number;
  image: string;
  drops: Drop[];
  phases: Phase[];
  tips: string[];
  /** Where this data comes from (e.g. "GMS Interactive", "Official Patch Notes"). */
  dataSource: string;
  /** ISO date string of the last time a player verified these values. */
  lastVerified: string;
  /** Source page used during verification. */
  sourceUrl: string;
  /** Game versions for which this record is valid. */
  regions: Array<"gms" | "kms" | "msea" | "jms" | "tms" | "all">;
}

type BossDefinition = Omit<BossInfo, "sourceUrl" | "regions">;

const bossDefinitions: BossDefinition[] = [
  // ── Zakum ──────────────────────────────────────────────
  {
    id: "zakum",
    name: "Zakum",
    nameZh: "\u624e\u6606",
    difficulty: ["Easy", "Normal", "Chaos"],
    level: 120,
    minLevel: 50,
    recommendedBp: 200000,
    dailyLimit: 1,
    weeklyLimit: 0,
    mesoReward: 2500000,
    expReward: 2400000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-738933d77b.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Zakum Helmet",
        rarity: "Rare",
        description:
          "Iconic helmet with strong defensive stats and a boss damage bonus.",
      },
      {
        name: "Zakum Jewel",
        rarity: "Epic",
        description:
          "Rare crafting material used in high-level equipment recipes.",
      },
      {
        name: "Advanced Pendant of the Spirit",
        rarity: "Epic",
        description: "Upgradable pendant that grants bonus EXP and drop rate.",
      },
      {
        name: "Chaos Zakum Scroll",
        rarity: "Legendary",
        description: "Chaos scroll that randomly adds stats to equipment.",
      },
    ],
    phases: [
      {
        name: "Arms Phase",
        nameZh: "\u624b\u81c2\u9636\u6bb5",
        mechanics: [
          "Destroy all 8 arms before attacking the body to reduce Zakum's attack power.",
          "Dodge the ground slam shockwave by jumping or using invincibility frames.",
          "Avoid the thunderbolt rain that targets random platform areas.",
        ],
      },
      {
        name: "Body Phase",
        nameZh: "\u672c\u4f53\u9636\u6bb5",
        mechanics: [
          "Watch for the 1/1 HP attack that instantly kills without damage reduction.",
          "Manage the curse debuff that disables skills temporarily.",
          "Stay mobile to avoid the fire pillar eruptions from the ground.",
        ],
      },
    ],
    tips: [
      "Prioritize destroying the arms first to significantly lower Zakum's damage output.",
      "Bring Holy Stones and All-Cure potions to remove status ailments quickly.",
      "Use invincibility frames or Damage Reflect to survive the 1/1 HP attack in Chaos mode.",
    ],
  },

  // ── Horntail ───────────────────────────────────────────
  {
    id: "horntail",
    name: "Horntail",
    nameZh: "\u624e\u5c3e",
    difficulty: ["Easy", "Normal", "Chaos"],
    level: 170,
    minLevel: 80,
    recommendedBp: 400000,
    dailyLimit: 1,
    weeklyLimit: 0,
    mesoReward: 4000000,
    expReward: 4200000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-cd06ae150e.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Horntail Necklace",
        rarity: "Rare",
        description: "Accessory with all-stat bonuses and boss damage.",
      },
      {
        name: "Horntail Ring",
        rarity: "Epic",
        description: "Powerful ring with weapon attack and magic attack.",
      },
      {
        name: "Chaos Horntail Pendant",
        rarity: "Legendary",
        description: "High-tier pendant granting substantial stat boosts.",
      },
      {
        name: "Dragon Stone",
        rarity: "Rare",
        description: "Material used for crafting dragon equipment.",
      },
    ],
    phases: [
      {
        name: "Parts Phase",
        nameZh: "\u90e8\u4f4d\u9636\u6bb5",
        mechanics: [
          "Destroy all body parts (wings, tails, head) to weaken Horntail.",
          "Dodge the dragon fire breath sweeping across the platform.",
          "Avoid the tail sweep that knocks back characters to the edge.",
        ],
      },
      {
        name: "Main Body Phase",
        nameZh: "\u4e3b\u4f53\u9636\u6bb5",
        mechanics: [
          "Watch for the ice attack that freezes characters in place.",
          "Survive the HP/MP drain aura that saps resources over time.",
          "Avoid the dark lightning strike that targets the ground.",
        ],
      },
    ],
    tips: [
      "Destroy the parts in order: wings first to prevent flight, then tails, then heads.",
      "Equip freeze resistance gear or bring All-Cure potions for the ice mechanic.",
      "In Chaos mode, the main body uses a devastating fire breath that requires high HP to survive.",
    ],
  },

  // ── Pink Bean ──────────────────────────────────────────
  {
    id: "pink-bean",
    name: "Pink Bean",
    nameZh: "\u7c89\u8c46",
    difficulty: ["Normal", "Chaos"],
    level: 190,
    minLevel: 120,
    recommendedBp: 600000,
    dailyLimit: 1,
    weeklyLimit: 0,
    mesoReward: 6000000,
    expReward: 5400000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-dd1ac5359d.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Pink Bean Hat",
        rarity: "Epic",
        description: "Cosmetic hat with decent stat bonuses.",
      },
      {
        name: "Pink Bean Cushion",
        rarity: "Rare",
        description: "Chair item that provides HP/MP regeneration.",
      },
      {
        name: "Papulatus Mark",
        rarity: "Epic",
        description: "Crafting material for high-level accessories.",
      },
      {
        name: "Chaos Scroll of Goodness",
        rarity: "Legendary",
        description: "Scroll that adds random positive stats to equipment.",
      },
    ],
    phases: [
      {
        name: "Statue Phase",
        nameZh: "\u77f3\u50cf\u9636\u6bb5",
        mechanics: [
          "Destroy the five statues that buff Pink Bean before engaging the boss.",
          "Statues apply buffs like damage reduction, attack boost, and healing.",
          "Watch for laser beams fired from the statues across the arena.",
        ],
      },
      {
        name: "Pink Bean Phase",
        nameZh: "\u7c89\u8c46\u9636\u6bb5",
        mechanics: [
          "Dodge the rolling pink bean attack that bounces across the arena.",
          "Survive the charm debuff that reverses left/right controls.",
          "Avoid the sound wave attack that causes massive knockback.",
        ],
      },
    ],
    tips: [
      "Always destroy the statues first - they make Pink Bean nearly unkillable otherwise.",
      "Bring bind resistance gear or skills to counter the charm effect.",
      "In Chaos mode, statues respawn periodically, so re-prioritize them as needed.",
    ],
  },

  // ── Papulatus ──────────────────────────────────────────
  {
    id: "papulatus",
    name: "Papulatus",
    nameZh: "\u5e15\u5e03\u62c9\u56fe\u65af",
    difficulty: ["Normal", "Chaos"],
    level: 200,
    minLevel: 155,
    recommendedBp: 800000,
    dailyLimit: 2,
    weeklyLimit: 0,
    mesoReward: 7000000,
    expReward: 6000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-5fb3b6b6b8.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Papulatus Mark",
        rarity: "Epic",
        description: "Key material for crafting the Papulatus pendant.",
      },
      {
        name: "Cracked Dimensional Door",
        rarity: "Rare",
        description: "Material used for high-level crafting and upgrades.",
      },
      {
        name: "Time Fragment",
        rarity: "Epic",
        description: "Rare crafting component from the Temple of Time.",
      },
      {
        name: "Chaos Papulatus Pendant",
        rarity: "Legendary",
        description: "Top-tier pendant with all-stat and boss damage bonuses.",
      },
    ],
    phases: [
      {
        name: "Papulatus Phase",
        nameZh: "\u5e15\u5e03\u62c9\u56fe\u65af\u9636\u6bb5",
        mechanics: [
          "Dodge the time-reversal debuff that rewinds your position on the map.",
          "Avoid the dimensional crack attacks that spawn damaging zones.",
          "Watch for the clock hand slash that sweeps the arena floor.",
        ],
      },
      {
        name: "Amdusias / Andras Phase",
        nameZh:
          "\u5b89\u59c6\u675c\u897f\u4e9a\u65af / \u5b89\u5fb7\u62c9\u65af\u9636\u6bb5",
        mechanics: [
          "Defeat the two demon spawns that join the fight at half HP.",
          "Dodge Amdusias' fire pillar attacks across the arena.",
          "Avoid Andras' dark sword slashes and stun effects.",
        ],
      },
    ],
    tips: [
      "Bring time resistance gear or skills to mitigate the time-reversal mechanic.",
      "Focus burst damage on Papulatus quickly before the demon spawns appear.",
      "In Chaos mode, Papulatus has significantly higher HP and the demons are much more aggressive.",
    ],
  },

  // ── Magnus ─────────────────────────────────────────────
  {
    id: "magnus",
    name: "Magnus",
    nameZh: "\u9a6c\u683c\u52aa\u65af",
    difficulty: ["Easy", "Normal", "Hard"],
    level: 200,
    minLevel: 175,
    recommendedBp: 1000000,
    dailyLimit: 1,
    weeklyLimit: 0,
    mesoReward: 10000000,
    expReward: 8400000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-783b738112.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Tyrant Helmet",
        rarity: "Legendary",
        description: "Part of the Tyrant set with powerful boss damage stats.",
      },
      {
        name: "Tyrant Cape",
        rarity: "Legendary",
        description: "Part of the Tyrant set granting attack power and stats.",
      },
      {
        name: "Tyrant Pendant",
        rarity: "Legendary",
        description: "Part of the Tyrant set with all-stat bonuses.",
      },
      {
        name: "Tyrant Belt",
        rarity: "Legendary",
        description: "Part of the Tyrant set with HP and defense bonuses.",
      },
    ],
    phases: [
      {
        name: "Ground Phase",
        nameZh: "\u5730\u9762\u9636\u6bb5",
        mechanics: [
          "Dodge the green meteor rain that falls from above in targeted zones.",
          "Avoid the purple sword wave that travels horizontally across the arena.",
          "Watch for the gravitational pull that draws you toward Magnus.",
        ],
      },
      {
        name: "Air Phase",
        nameZh: "\u7a7a\u4e2d\u9636\u6bb5",
        mechanics: [
          "Magnus flies upward and rains down green meteors across the map.",
          "Use the green orbs to restore the green HP bar that depletes over time.",
          "The green HP bar fully depleting results in instant death.",
        ],
      },
    ],
    tips: [
      "Always monitor the green HP bar at the top of the screen - collect green orbs to replenish it.",
      "Stand near the edges of the platform to dodge the sword wave more easily.",
      "In Hard mode, Magnus teleports frequently and the meteor density is extreme - high mobility is key.",
    ],
  },

  // ── Hilla ──────────────────────────────────────────────
  {
    id: "hilla",
    name: "Hilla",
    nameZh: "\u5e0c\u62c9",
    difficulty: ["Normal", "Hard"],
    level: 190,
    minLevel: 170,
    recommendedBp: 700000,
    dailyLimit: 1,
    weeklyLimit: 0,
    mesoReward: 5000000,
    expReward: 4800000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-b46d79901a.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Hilla's Soul Ring",
        rarity: "Epic",
        description: "Ring that grants a temporary power boost skill.",
      },
      {
        name: "Necrobatic Staff",
        rarity: "Epic",
        description: "Staff with magic attack and intelligence bonuses.",
      },
      {
        name: "Dark Flame",
        rarity: "Rare",
        description: "Material used for enhancing dark magic equipment.",
      },
      {
        name: "Hilla's Feather",
        rarity: "Rare",
        description: "Decorative feather item with minor stat bonuses.",
      },
    ],
    phases: [
      {
        name: "Witch Phase",
        nameZh: "\u5973\u5deb\u9636\u6bb5",
        mechanics: [
          "Dodge the dark flame pillars that erupt from the ground in patterns.",
          "Avoid the curse arrows that apply a stacking damage-over-time debuff.",
          "Watch for the soul steal that drains your HP to heal Hilla.",
        ],
      },
      {
        name: "Possessed Phase",
        nameZh: "\u9644\u8eab\u9636\u6bb5",
        mechanics: [
          "Hilla becomes possessed, gaining new dark magic attacks.",
          "Dodge the expanding dark energy rings that pulse outward.",
          "Break the dark barrier shield before you can deal damage again.",
        ],
      },
    ],
    tips: [
      "Bring a way to cleanse the curse debuff or it will stack and drain your HP rapidly.",
      "Save burst skills for the Possessed Phase since the barrier absorbs most damage initially.",
      "In Hard mode, Hilla's soul steal heals a significant portion of her HP - coordinate burst damage to counter it.",
    ],
  },

  // ── Cygnus ─────────────────────────────────────────────
  {
    id: "cygnus",
    name: "Cygnus",
    nameZh: "\u897f\u683c\u52aa\u65af",
    difficulty: ["Easy", "Normal"],
    level: 200,
    minLevel: 190,
    recommendedBp: 1200000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 12000000,
    expReward: 10000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-42b8ea560e.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Cygnus Emblem",
        rarity: "Epic",
        description: "Emblem accessory with boss damage and attack stats.",
      },
      {
        name: "Empress's Blessing",
        rarity: "Legendary",
        description: "Rare item that provides a permanent stat boost.",
      },
      {
        name: "Royal Seal",
        rarity: "Epic",
        description: "Crafting material for Cygnus-tier equipment upgrades.",
      },
      {
        name: "Empress's Feather",
        rarity: "Rare",
        description: "Decorative item from the Cygnus Knights storyline.",
      },
    ],
    phases: [
      {
        name: "Empress Phase",
        nameZh: "\u5973\u7687\u9636\u6bb5",
        mechanics: [
          "Dodge the royal guard summons that attack from multiple directions.",
          "Avoid the light beam attacks that sweep across the arena.",
          "Survive the royal decree that applies a damage-over-time aura to the entire map.",
        ],
      },
      {
        name: "Shinsoo Phase",
        nameZh: "\u795e\u517d\u9636\u6bb5",
        mechanics: [
          "Shinsoo joins the fight, launching wind-based area attacks.",
          "Avoid the tornado projectiles that push you off platforms.",
          "Watch for the combined light-and-wind ultimate attack.",
        ],
      },
    ],
    tips: [
      "Focus Cygnus down first before Shinsoo joins the battle to reduce incoming damage.",
      "Equip wind resistance gear to mitigate Shinsoo's tornado attacks.",
      "In Normal mode, both Cygnus and Shinsoo share an HP pool and attack simultaneously from the start.",
    ],
  },

  // ── Lotus ──────────────────────────────────────────────
  {
    id: "lotus",
    name: "Lotus",
    nameZh: "\u65af\u56fe",
    difficulty: ["Normal", "Hard", "Extreme"],
    level: 250,
    minLevel: 200,
    recommendedBp: 2000000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 20000000,
    expReward: 15000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-12b9faa695.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Sweetwater Tattoo",
        rarity: "Legendary",
        description: "High-tier accessory with boss damage and critical rate.",
      },
      {
        name: "Sweetwater Earring",
        rarity: "Legendary",
        description: "Earring with all-stat bonuses and ignore defense.",
      },
      {
        name: "Lotus Coin",
        rarity: "Rare",
        description: "Currency used to purchase Sweetwater equipment.",
      },
      {
        name: "Reboot Power Crystal",
        rarity: "Epic",
        description: "Material for upgrading end-game equipment.",
      },
    ],
    phases: [
      {
        name: "Lotus Phase 1",
        nameZh: "\u65af\u56fe \u7b2c\u4e00\u9636\u6bb5",
        mechanics: [
          "Dodge the laser grid that sweeps the arena in horizontal and vertical patterns.",
          "Avoid the EMP blast that disables skills temporarily.",
          "Watch for the gravity orbs that pull you toward Lotus.",
        ],
      },
      {
        name: "Lotus Phase 2",
        nameZh: "\u65af\u56fe \u7b2c\u4e8c\u9636\u6bb5",
        mechanics: [
          "Lotus enters a mech suit, gaining new laser and missile attacks.",
          "The floor electrifies in sections - stand on safe platforms to avoid damage.",
          "Survive the ultimate laser beam that covers most of the arena.",
        ],
      },
    ],
    tips: [
      "Learn the laser grid patterns - they are consistent and can be memorized for easy dodging.",
      "In Phase 2, stay near the center for easier access to safe platforms during floor electrification.",
      "Extreme mode adds additional laser patterns and the ultimate laser becomes almost unavoidable without i-frames.",
    ],
  },

  // ── Damien ─────────────────────────────────────────────
  {
    id: "damien",
    name: "Damien",
    nameZh: "\u6234\u7c73\u5b89",
    difficulty: ["Normal", "Hard"],
    level: 250,
    minLevel: 220,
    recommendedBp: 2500000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 22000000,
    expReward: 16000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-24e2ef73f7.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Damien Weapon (Dragon Saber)",
        rarity: "Legendary",
        description: "Powerful weapon with boss damage and attack bonuses.",
      },
      {
        name: "Fafnir Weapon",
        rarity: "Legendary",
        description: "Top-tier weapon craftable from Damien materials.",
      },
      {
        name: "Dragon Crystal",
        rarity: "Epic",
        description: "Material used for upgrading Fafnir equipment.",
      },
      {
        name: "Damien's Horn",
        rarity: "Rare",
        description: "Trophy item with minor stat bonuses.",
      },
    ],
    phases: [
      {
        name: "Damien Phase",
        nameZh: "\u6234\u7c73\u5b89\u9636\u6bb5",
        mechanics: [
          "Dodge the dragon breath attacks that cover large portions of the arena.",
          "Avoid the sword slam shockwave that travels along the ground.",
          "Watch for the wing flap that creates wind gusts pushing you off platforms.",
        ],
      },
      {
        name: "Possessed Damien Phase",
        nameZh: "\u9b54\u5316\u6234\u7c73\u5b89\u9636\u6bb5",
        mechanics: [
          "Damien becomes possessed and gains dark dragon attacks.",
          "Dodge the dark fire rain that falls across the entire arena.",
          "Survive the ultimate dive-bomb attack that targets your last known position.",
        ],
      },
    ],
    tips: [
      "Use invincibility frames to dodge the dragon breath - it has a wide hitbox.",
      "In the possessed phase, keep moving constantly to avoid the dive-bomb targeting.",
      "Hard mode significantly increases Damien's HP and adds a berserk mode at low HP with faster attacks.",
    ],
  },

  // ── Lucid ──────────────────────────────────────────────
  {
    id: "lucid",
    name: "Lucid",
    nameZh: "\u8def\u897f\u5fb7",
    difficulty: ["Normal", "Hard"],
    level: 250,
    minLevel: 230,
    recommendedBp: 3000000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 25000000,
    expReward: 18000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-4e9cdee0aa.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Arcane Umbra Weapon",
        rarity: "Legendary",
        description: "End-game weapon from the Arcane Umbra set.",
      },
      {
        name: "Lucid's Dream Fragment",
        rarity: "Epic",
        description: "Material for crafting Arcane Umbra equipment.",
      },
      {
        name: "Dream Crystal",
        rarity: "Rare",
        description: "Currency used to purchase Arcane Umbra gear.",
      },
      {
        name: "Nightmare Shard",
        rarity: "Epic",
        description: "Rare material for upgrading high-tier accessories.",
      },
    ],
    phases: [
      {
        name: "Butterfly Phase",
        nameZh: "\u8774\u8776\u9636\u6bb5",
        mechanics: [
          "Dodge the butterfly swarm projectiles that spiral across the arena.",
          "Avoid the dream fog zones that apply confusion and damage-over-time.",
          "Watch for the teleporting clone attacks that strike from behind.",
        ],
      },
      {
        name: "Dragon Phase",
        nameZh: "\u9f99\u9636\u6bb5",
        mechanics: [
          "Lucid summons a dream dragon that breathes fire across the arena.",
          "Dodge the ground slam shockwaves from the dragon's landing.",
          "Survive the nightmare spiral that targets all players simultaneously.",
        ],
      },
    ],
    tips: [
      "Stay close to Lucid in the Butterfly Phase to avoid clone teleport attacks.",
      "Use the safe spots behind pillars to dodge the dragon breath in Phase 2.",
      "Hard mode introduces additional butterfly patterns and the dragon becomes permanently active.",
    ],
  },

  // ── Will ───────────────────────────────────────────────
  {
    id: "will",
    name: "Will",
    nameZh: "\u5a01\u5c14",
    difficulty: ["Normal", "Hard"],
    level: 250,
    minLevel: 235,
    recommendedBp: 3500000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 28000000,
    expReward: 20000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-3be9b71f09.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Arcane Umbra Armor",
        rarity: "Legendary",
        description: "End-game armor piece from the Arcane Umbra set.",
      },
      {
        name: "Will's Web Fragment",
        rarity: "Epic",
        description: "Material used in Arcane Umbra armor crafting.",
      },
      {
        name: "Spider Silk Thread",
        rarity: "Rare",
        description: "Crafting material for high-level equipment upgrades.",
      },
      {
        name: "Corrupted Essence",
        rarity: "Epic",
        description: "Rare drop used for starforce enhancement materials.",
      },
    ],
    phases: [
      {
        name: "Spider Phase",
        nameZh: "\u8718\u86db\u9636\u6bb5",
        mechanics: [
          "Dodge the web traps that root you in place and apply damage-over-time.",
          "Avoid the spider eggs that hatch into smaller spider mobs.",
          "Watch for the ceiling drop attack that covers the entire arena.",
        ],
      },
      {
        name: "Corrupted Phase",
        nameZh: "\u8150\u5316\u9636\u6bb5",
        mechanics: [
          "Will becomes corrupted, gaining dark area-of-effect attacks.",
          "Dodge the dark tendrils that reach across the arena from the walls.",
          "Survive the corruption explosion that triggers at set HP thresholds.",
        ],
      },
    ],
    tips: [
      "Destroy spider eggs immediately - they spawn mobs that clutter the arena and deal significant damage.",
      "Learn the web trap placement pattern to maintain mobility throughout the fight.",
      "Hard mode adds a poison fog that slowly fills the arena, forcing you to complete the fight quickly.",
    ],
  },

  // ── Gloom ──────────────────────────────────────────────
  {
    id: "gloom",
    name: "Gloom",
    nameZh: "\u5e7d\u7075",
    difficulty: ["Normal", "Hard"],
    level: 250,
    minLevel: 240,
    recommendedBp: 4000000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 30000000,
    expReward: 22000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-277e90d6a8.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Arcane Umbra Shoulder",
        rarity: "Legendary",
        description: "End-game shoulder piece from the Arcane Umbra set.",
      },
      {
        name: "Gloom's Dark Core",
        rarity: "Epic",
        description: "Material for crafting Arcane Umbra shoulder accessories.",
      },
      {
        name: "Shadow Fragment",
        rarity: "Rare",
        description: "Crafting material for shadow-based equipment.",
      },
      {
        name: "Abyssal Stone",
        rarity: "Epic",
        description: "Rare material used for enhancing Arcane Umbra gear.",
      },
    ],
    phases: [
      {
        name: "Shadow Phase",
        nameZh: "\u6697\u5f71\u9636\u6bb5",
        mechanics: [
          "Dodge the shadow hands that reach from the ground and grab you.",
          "Avoid the dark portal attacks that spawn damaging zones on the floor.",
          "Watch for the shadow clone that mirrors your attacks back at you.",
        ],
      },
      {
        name: "Abyss Phase",
        nameZh: "\u6df1\u6e0a\u9636\u6bb5",
        mechanics: [
          "Gloom opens an abyss that pulls all players toward the center.",
          "Dodge the dark energy beams that radiate from the center of the arena.",
          "Survive the ultimate darkness attack that requires breaking the light orbs to survive.",
        ],
      },
    ],
    tips: [
      "Destroy shadow clones immediately - they copy your strongest attacks.",
      "Collect light orbs during the Abyss Phase to survive the ultimate darkness attack.",
      "Hard mode adds persistent dark zones that reduce visibility and deal continuous damage.",
    ],
  },

  // ── Darknell ───────────────────────────────────────────
  {
    id: "darknell",
    name: "Darknell",
    nameZh: "\u6234\u514b\u5185\u5c14",
    difficulty: ["Normal", "Hard"],
    level: 250,
    minLevel: 245,
    recommendedBp: 4500000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 32000000,
    expReward: 24000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-902ff47f8e.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Arcane Umbra Hat",
        rarity: "Legendary",
        description: "End-game hat from the Arcane Umbra set.",
      },
      {
        name: "Darknell's Flame",
        rarity: "Epic",
        description: "Material for crafting the Arcane Umbra hat.",
      },
      {
        name: "Hellfire Shard",
        rarity: "Rare",
        description: "Crafting material for fire-based equipment.",
      },
      {
        name: "Demon's Heart",
        rarity: "Epic",
        description: "Rare material for upgrading high-tier equipment.",
      },
    ],
    phases: [
      {
        name: "Sword Phase",
        nameZh: "\u5251\u672f\u9636\u6bb5",
        mechanics: [
          "Dodge the multi-slash combo attacks that cover a wide arc in front of Darknell.",
          "Avoid the ground cleave that leaves a lingering fire zone.",
          "Watch for the sword throw that bounces off walls and returns to Darknell.",
        ],
      },
      {
        name: "Demon Phase",
        nameZh: "\u9b54\u738b\u9636\u6bb5",
        mechanics: [
          "Darknell transforms, gaining wings and aerial attacks.",
          "Dodge the dive-bomb attack that targets your position with a delay.",
          "Survive the demon fire rain that covers the entire arena with fire pillars.",
        ],
      },
    ],
    tips: [
      "Keep distance during the Sword Phase to easily dodge the multi-slash combos.",
      "During the Demon Phase, stay mobile and avoid standing in one spot for more than a second.",
      "Hard mode adds a berserk mechanic below 30% HP where Darknell's attack speed doubles.",
    ],
  },

  // ── Verus Hilla ────────────────────────────────────────
  {
    id: "verus-hilla",
    name: "Verus Hilla",
    nameZh: "\u771f\u5e0c\u62c9",
    difficulty: ["Normal", "Hard"],
    level: 270,
    minLevel: 250,
    recommendedBp: 5500000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 40000000,
    expReward: 30000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-116ff6b6d4.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Genesis Weapon",
        rarity: "Legendary",
        description:
          "End-game weapon from the Genesis set, superior to Arcane Umbra.",
      },
      {
        name: "Verus Hilla's Soul",
        rarity: "Legendary",
        description: "Key material for crafting Genesis equipment.",
      },
      {
        name: "Genesis Weapon Box",
        rarity: "Legendary",
        description: "Box containing a random Genesis weapon.",
      },
      {
        name: "Origin of Creation",
        rarity: "Epic",
        description: "Rare crafting material for Genesis-tier upgrades.",
      },
    ],
    phases: [
      {
        name: "Hilla Phase",
        nameZh: "\u5e0c\u62c9\u9636\u6bb5",
        mechanics: [
          "An enhanced version of Hilla with faster attacks and new dark magic patterns.",
          "Dodge the curse chains that bind you and deal continuous dark damage.",
          "Avoid the resurrected guardian statues that fire combined beam attacks.",
        ],
      },
      {
        name: "Verus Phase",
        nameZh: "\u771f\u5e0c\u62c9\u9636\u6bb5",
        mechanics: [
          "Hilla reveals her true form with devastating area-of-effect dark attacks.",
          "Dodge the dark nova explosions that expand from the center of the arena.",
          "Survive the soul drain mechanic that reduces your max HP over time.",
        ],
      },
    ],
    tips: [
      "Bring curse cleanse abilities - the curse chains deal massive damage if left unchecked.",
      "Focus burst damage during the Verus transition animation for a free damage window.",
      "Hard mode adds a timer to the soul drain - if your max HP drops too low, it is an instant kill.",
    ],
  },

  // ── Black Mage ─────────────────────────────────────────
  {
    id: "black-mage",
    name: "Black Mage",
    nameZh: "\u9ed1\u9b54\u6cd5\u5e08",
    difficulty: ["Normal"],
    level: 300,
    minLevel: 265,
    recommendedBp: 8000000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 60000000,
    expReward: 50000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-bc5628e4fe.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Absolute Lab Equipment",
        rarity: "Legendary",
        description: "Top-tier end-game equipment set from the Black Mage.",
      },
      {
        name: "Black Mage's Essence",
        rarity: "Legendary",
        description:
          "Ultra-rare material for the most powerful crafting recipes.",
      },
      {
        name: "Genesis Armor Piece",
        rarity: "Legendary",
        description: "End-game armor from the Genesis set.",
      },
      {
        name: "Command Force Stone",
        rarity: "Legendary",
        description: "Material for upgrading Absolute Lab equipment.",
      },
    ],
    phases: [
      {
        name: "Phase 1: Dark Dominion",
        nameZh: "\u7b2c\u4e00\u9636\u6bb5\uff1a\u6697\u9ed1\u7edf\u6cbb",
        mechanics: [
          "Dodge the dark star rain that covers the arena in targeted explosions.",
          "Avoid the dimensional tear that splits the arena into safe and dangerous zones.",
          "Survive the black hole that pulls all players and deals escalating damage.",
        ],
      },
      {
        name: "Phase 2: God of Destruction",
        nameZh: "\u7b2c\u4e8c\u9636\u6bb5\uff1a\u6bc1\u706d\u4e4b\u795e",
        mechanics: [
          "The Black Mage unleashes ultimate attacks that cover nearly the entire arena.",
          "Dodge the creation and destruction beams that alternate across the screen.",
          "Survive the final judgment attack at set HP thresholds that requires precise positioning.",
        ],
      },
    ],
    tips: [
      "This is the hardest boss in the game - ensure your character is fully optimized before attempting.",
      "Learn the exact timing for the black hole mechanic to use invincibility frames effectively.",
      "Coordinate with your party to manage resurrection uses - they are extremely limited in this fight.",
    ],
  },

  // ── Kalos ──────────────────────────────────────────────
  {
    id: "kalos",
    name: "Kalos",
    nameZh: "\u5361\u6d1b\u65af",
    difficulty: ["Normal", "Hard"],
    level: 275,
    minLevel: 260,
    recommendedBp: 6000000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 42000000,
    expReward: 32000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-71a0261882.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Genesis Armor Material",
        rarity: "Legendary",
        description: "Material used to craft Genesis armor pieces.",
      },
      {
        name: "Kalos's Scale",
        rarity: "Epic",
        description: "Rare crafting material from the dragon Kalos.",
      },
      {
        name: "Dragon Heart",
        rarity: "Legendary",
        description: "Core material for the highest-tier equipment upgrades.",
      },
      {
        name: "Eternal Flame",
        rarity: "Rare",
        description: "Material for enhancing fire-element equipment.",
      },
    ],
    phases: [
      {
        name: "Dragon Phase",
        nameZh: "\u9f99\u5f62\u9636\u6bb5",
        mechanics: [
          "Dodge the fire breath sweeps that cover wide arcs of the arena.",
          "Avoid the tail slam shockwave that damages and stuns in a large area.",
          "Watch for the wing buffet that creates a wind wall pushing players into hazards.",
        ],
      },
      {
        name: "Fury Phase",
        nameZh: "\u72c2\u66b4\u9636\u6bb5",
        mechanics: [
          "Kalos enters a fury state, doubling attack speed and adding new combo attacks.",
          "Dodge the meteor shower that rains fire across the entire arena.",
          "Survive the ultimate fire nova that pulses outward from Kalos in concentric rings.",
        ],
      },
    ],
    tips: [
      "Equip fire resistance gear to significantly reduce damage from Kalos's fire-based attacks.",
      "Save your burst cooldowns for the Fury Phase transition when Kalos is briefly vulnerable.",
      "Hard mode adds a floor lava mechanic that periodically deals heavy fire damage to grounded players.",
    ],
  },

  // ── Limbo ──────────────────────────────────────────────
  {
    id: "limbo",
    name: "Limbo",
    nameZh: "\u6797\u535a",
    difficulty: ["Normal", "Hard"],
    level: 275,
    minLevel: 265,
    recommendedBp: 6500000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 44000000,
    expReward: 34000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-eb109aa404.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Genesis Accessory",
        rarity: "Legendary",
        description: "End-game accessory from the Genesis set.",
      },
      {
        name: "Limbo's Void Shard",
        rarity: "Epic",
        description: "Rare material from the void dimension.",
      },
      {
        name: "Dimensional Fragment",
        rarity: "Legendary",
        description: "Key material for crafting Genesis accessories.",
      },
      {
        name: "Void Essence",
        rarity: "Epic",
        description: "Material for upgrading void-tier equipment.",
      },
    ],
    phases: [
      {
        name: "Void Phase",
        nameZh: "\u865a\u7a7a\u9636\u6bb5",
        mechanics: [
          "Dodge the void rifts that open on the ground and deal escalating damage.",
          "Avoid the null beams that erase buffs and apply a silence debuff.",
          "Watch for the dimensional shift that swaps the safe and dangerous zones.",
        ],
      },
      {
        name: "Oblivion Phase",
        nameZh: "\u9057\u5fd8\u9636\u6bb5",
        mechanics: [
          "Limbo enters an oblivion state that disables one random skill slot periodically.",
          "Dodge the void explosion pattern that expands from the center outward.",
          "Survive the total annihilation attack at 25% HP that requires hitting all weak points.",
        ],
      },
    ],
    tips: [
      "Build your rotation to function even when key skills are disabled in the Oblivion Phase.",
      "Memorize the dimensional shift timing to reposition to safe zones before the swap completes.",
      "Hard mode increases the number of disabled skill slots and adds persistent void zones.",
    ],
  },

  // ── Seren ──────────────────────────────────────────────
  {
    id: "seren",
    name: "Seren",
    nameZh: "\u585e\u4ec1",
    difficulty: ["Normal", "Hard"],
    level: 275,
    minLevel: 260,
    recommendedBp: 6000000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 42000000,
    expReward: 32000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-cd98846c98.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Genesis Belt",
        rarity: "Legendary",
        description: "End-game belt from the Genesis set.",
      },
      {
        name: "Seren's Radiance",
        rarity: "Epic",
        description: "Material for crafting the Genesis belt.",
      },
      {
        name: "Holy Light Shard",
        rarity: "Rare",
        description: "Crafting material for light-element equipment.",
      },
      {
        name: "Celestial Fragment",
        rarity: "Epic",
        description: "Rare material for high-tier equipment upgrades.",
      },
    ],
    phases: [
      {
        name: "Guardian Phase",
        nameZh: "\u5b88\u62a4\u9636\u6bb5",
        mechanics: [
          "Dodge the holy light beams that target your position with a warning circle.",
          "Avoid the shield bash that creates a shockwave and knocks back.",
          "Watch for the guardian barrier that reflects damage back to attackers.",
        ],
      },
      {
        name: "Judgment Phase",
        nameZh: "\u5ba1\u5224\u9636\u6bb5",
        mechanics: [
          "Seren summons holy pillars that fire laser beams across the arena.",
          "Dodge the holy nova that expands in a ring from Seren's position.",
          "Survive the divine judgment attack that deals damage based on your current HP.",
        ],
      },
    ],
    tips: [
      "Watch for the guardian barrier indicator - attacking during it will reflect your damage back.",
      "Keep your HP high before the divine judgment attack since it scales with your current HP.",
      "Hard mode adds rotating holy beam patterns that require constant movement throughout the fight.",
    ],
  },

  // ── Baldrix ────────────────────────────────────────────
  {
    id: "baldrix",
    name: "Baldrix",
    nameZh: "\u5df4\u5c14\u5fb7\u91cc\u514b\u65af",
    difficulty: ["Normal", "Hard"],
    level: 275,
    minLevel: 265,
    recommendedBp: 6500000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 44000000,
    expReward: 34000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-a98d8b206d.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Genesis Shoulder",
        rarity: "Legendary",
        description: "End-game shoulder accessory from the Genesis set.",
      },
      {
        name: "Baldrix's Horn",
        rarity: "Epic",
        description: "Rare crafting material from the demon Baldrix.",
      },
      {
        name: "Infernal Core",
        rarity: "Legendary",
        description: "Key material for crafting Genesis shoulder gear.",
      },
      {
        name: "Demon Blood",
        rarity: "Rare",
        description: "Material for enhancing demon-tier equipment.",
      },
    ],
    phases: [
      {
        name: "Warrior Phase",
        nameZh: "\u6218\u58eb\u9636\u6bb5",
        mechanics: [
          "Dodge the axe slam combos that create ground fissures dealing delayed damage.",
          "Avoid the charge attack that targets the furthest player and traverses the arena.",
          "Watch for the war cry that buffs Baldrix and debuffs all players' defense.",
        ],
      },
      {
        name: "Demon Phase",
        nameZh: "\u6076\u9b54\u9636\u6bb5",
        mechanics: [
          "Baldrix transforms and gains dark fire attacks covering the arena.",
          "Dodge the demon claw swipe that applies a stacking bleed debuff.",
          "Survive the infernal eruption that spawns fire geysers at random positions.",
        ],
      },
    ],
    tips: [
      "Stay close to Baldrix during the Warrior Phase to avoid the charge attack targeting.",
      "Cleanse the bleed debuff quickly - it stacks fast and deals massive damage at high stacks.",
      "Hard mode adds a berserk enrage at 20% HP with double attack speed and new combo patterns.",
    ],
  },

  // ── Slime ──────────────────────────────────────────────
  {
    id: "slime",
    name: "Slime",
    nameZh: "\u53f2\u83b1\u59c6",
    difficulty: ["Normal", "Hard"],
    level: 275,
    minLevel: 260,
    recommendedBp: 6000000,
    dailyLimit: 0,
    weeklyLimit: 1,
    mesoReward: 42000000,
    expReward: 32000000,
    image:
      "/static/images/vendor/static.wikia.nocookie.net/latest-36166e0c8e.webp",
    dataSource: "GMS Interactive",
    lastVerified: "2026-07-10",
    drops: [
      {
        name: "Genesis Shoes",
        rarity: "Legendary",
        description: "End-game shoes from the Genesis set.",
      },
      {
        name: "Slime's Core",
        rarity: "Epic",
        description: "Rare material from the giant slime boss.",
      },
      {
        name: "Viscous Fragment",
        rarity: "Legendary",
        description: "Key material for crafting Genesis shoes.",
      },
      {
        name: "Primal Slime Extract",
        rarity: "Rare",
        description: "Material for upgrading end-game potions and consumables.",
      },
    ],
    phases: [
      {
        name: "Giant Slime Phase",
        nameZh: "\u5de8\u578b\u53f2\u83b1\u59c6\u9636\u6bb5",
        mechanics: [
          "Dodge the slime slam that creates damaging puddles on the ground.",
          "Avoid the slime split that spawns smaller slimes which must be killed quickly.",
          "Watch for the acid rain that covers the entire arena periodically.",
        ],
      },
      {
        name: "Fused Slime Phase",
        nameZh: "\u878d\u5408\u53f2\u83b1\u59c6\u9636\u6bb5",
        mechanics: [
          "Small slimes fuse into a mega slime with devastating area attacks.",
          "Dodge the mega slime body slam that covers most of the arena.",
          "Survive the toxic cloud that the mega slime emits at set HP thresholds.",
        ],
      },
    ],
    tips: [
      "Kill the smaller slimes from the split mechanic immediately - they heal the boss if left alive.",
      "Avoid standing in slime puddles - they deal percentage-based damage that escalates quickly.",
      "Hard mode makes the fused slime permanently active with no downtime between phases.",
    ],
  },
];

const officialBossGuideUrl =
  "https://gi.maplestory.nexon.com/Guide/GameInformation/Boss/ProcessBossContent";

export const bosses: BossInfo[] = bossDefinitions.map((boss) => ({
  ...boss,
  // Detailed rewards, combat power thresholds, phases, and tips in the original
  // prototype were unsourced. Keep the boss/reset registry usable for planning,
  // but do not publish invented progression guidance as player-facing fact.
  recommendedBp: 0,
  mesoReward: 0,
  expReward: 0,
  drops: [],
  phases: [],
  tips: [],
  dataSource:
    "Planning only · detailed rewards and mechanics withheld pending verification",
  sourceUrl: officialBossGuideUrl,
  regions: ["gms"],
}));
