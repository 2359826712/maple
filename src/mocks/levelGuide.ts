export interface ContentItem {
  type: 'boss' | 'quest' | 'dungeon' | 'party-quest' | 'system' | 'event';
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  rewards: string[];
}

export interface GrindingMap {
  name: string;
  nameZh: string;
  monster: string;
  monsterZh: string;
  levelRange: string;
}

export interface LevelRange {
  minLevel: number;
  maxLevel: number;
  title: string;
  titleZh: string;
  summary: string;
  summaryZh: string;
  recommended: ContentItem[];
  optional: ContentItem[];
  grindingMaps: GrindingMap[];
}

export const levelRanges: LevelRange[] = [
  {
    minLevel: 1,
    maxLevel: 29,
    title: "Level 1-29: Beginner",
    titleZh: "1-29级：新手阶段",
    summary:
      "Complete the tutorial, learn basic skills, and get familiar with MapleStory mechanics. Focus on beginner quests on Maple Island and in Henesys.",
    summaryZh:
      "完成新手教程，学习基础技能，熟悉冒险岛的基本玩法。专注于彩虹岛和射手村的新手任务。",
    recommended: [
      {
        type: 'quest',
        name: 'Maple Island Tutorial Quests',
        nameZh: '彩虹岛新手任务',
        description:
          'Complete all tutorial quests on Maple Island to learn basic controls and earn starter gear.',
        descriptionZh:
          '完成彩虹岛的所有新手引导任务，学习基本操作并获得新手装备。',
        rewards: ['Starter equipment', 'Maple Island medals', 'EXP'],
      },
      {
        type: 'system',
        name: 'First Job Advancement',
        nameZh: '第一次转职',
        description:
          'Reach level 10 and visit your job instructor in Henesys, Ellinia, Perion, or Kerning City for your first job advancement.',
        descriptionZh:
          '达到10级后前往射手村、魔法密林、勇士部落或废弃都市找职业教官完成第一次转职。',
        rewards: ['First job skills', 'SP points', 'Starter weapon'],
      },
      {
        type: 'quest',
        name: 'Henesys Area Quests',
        nameZh: '射手村地区任务',
        description:
          'Complete beginner-friendly quests around Henesys and the nearby hunting grounds for quick early levels.',
        descriptionZh:
          '完成射手村及周边猎场的新手友好任务，快速提升前期等级。',
        rewards: ['EXP', 'Meso', 'Basic equipment'],
      },
      {
        type: 'system',
        name: 'Monster Book Collection',
        nameZh: '怪物图鉴收集',
        description:
          'Start collecting monster cards to build your Monster Book for small but useful stat bonuses early on.',
        descriptionZh:
          '开始收集怪物卡片来充实怪物图鉴，获取早期的小额属性加成。',
        rewards: ['Monster Book bonuses', 'Card collection progress'],
      },
    ],
    optional: [
      {
        type: 'party-quest',
        name: 'Moon Bunny Rice Cake PQ (Level 10-15)',
        nameZh: '月妙米糕组队任务（10-15级）',
        description:
          'A simple party quest that teaches PQ mechanics. Team up with others to stomp rice cakes.',
        descriptionZh:
          '一个简单的组队任务，教会你组队副本机制。与其他玩家一起踩米糕。',
        rewards: ['EXP', 'Rice Cake hat', 'Scrolls'],
      },
      {
        type: 'event',
        name: 'Beginner Events',
        nameZh: '新手活动',
        description:
          'Participate in any ongoing beginner-friendly events for bonus EXP and cosmetic items.',
        descriptionZh:
          '参与正在进行的新手友好活动，获取额外经验和装饰道具。',
        rewards: ['Event EXP', 'Cosmetics', 'Coupons'],
      },
    ],
    grindingMaps: [
      {
        name: 'Rainbow Street',
        nameZh: '彩虹街',
        monster: 'Snail / Green Snail',
        monsterZh: '蜗牛 / 绿蜗牛',
        levelRange: '1-10',
      },
      {
        name: 'Henesys Hunting Ground I',
        nameZh: '射手村狩猎场I',
        monster: 'Pig / Ribbon Pig',
        monsterZh: '猪 / 飘带猪',
        levelRange: '10-20',
      },
      {
        name: 'Dungeon: The Forest of Evil',
        nameZh: '邪恶森林',
        monster: 'Stump / Axe Stump',
        monsterZh: '树桩 / 斧树桩',
        levelRange: '20-29',
      },
    ],
  },

  {
    minLevel: 30,
    maxLevel: 59,
    title: "Level 30-59: Explorer",
    titleZh: "30-59级：探索者阶段",
    summary:
      "Advance to your 2nd job, start party quests, and explore Sleepywood and the Ant Tunnel. Begin building your core gear set.",
    summaryZh:
      "完成第二次转职，开始组队任务，探索蚂蚁洞穴和沉睡森林。开始打造你的核心装备。",
    recommended: [
      {
        type: 'system',
        name: 'Second Job Advancement',
        nameZh: '第二次转职',
        description:
          'Reach level 30 and complete the 2nd job advancement quest to unlock powerful new skills.',
        descriptionZh:
          '达到30级并完成第二次转职任务，解锁强力的新技能。',
        rewards: ['Second job skills', 'SP points', 'Increased stats'],
      },
      {
        type: 'party-quest',
        name: 'Kerning City Party Quest (Level 21-30)',
        nameZh: '废弃都市组队任务（21-30级）',
        description:
          'The classic PQ in Kerning City sewers. Solve the stage puzzles with your party for great rewards.',
        descriptionZh:
          '废弃都市下水道的经典组队副本。和队友一起解开各阶段谜题获取丰厚奖励。',
        rewards: ['EXP', 'Scrolls', 'Potions', 'Goblin figure'],
      },
      {
        type: 'dungeon',
        name: 'The Deep Forest / Sleepywood',
        nameZh: '沉睡森林',
        description:
          'Explore the Sleepywood area for decent EXP and the Dungeon: Valley of the Ant Tunnel.',
        descriptionZh:
          '探索沉睡森林区域，获取不错的经验和蚂蚁洞穴副本。',
        rewards: ['EXP', 'Monster drops', 'Mineral ores'],
      },
      {
        type: 'quest',
        name: 'Perion / Ellinia Area Quests',
        nameZh: '勇士部落/魔法密林地区任务',
        description:
          'Complete regional quests in Perion and Ellinia for bonus EXP and story progression.',
        descriptionZh:
          '完成勇士部落和魔法密林的地区任务，获取额外经验和剧情进展。',
        rewards: ['EXP', 'Meso', 'Equipment'],
      },
    ],
    optional: [
      {
        type: 'party-quest',
        name: 'Ellinia Party Quest (Level 30-50)',
        nameZh: '魔法密林组队任务（30-50级）',
        description:
          'Navigate the witch\'s tower in this party quest for scrolls and EXP.',
        descriptionZh:
          '在这个组队副本中攀登魔女之塔，获取卷轴和经验。',
        rewards: ['EXP', 'Scrolls', 'Buffs'],
      },
      {
        type: 'system',
        name: 'Trade and Merchant System',
        nameZh: '交易与商人系统',
        description:
          'Start using the Free Market and merchants to buy better equipment and sell unwanted drops.',
        descriptionZh:
          '开始使用自由市场和商人系统购买更好的装备并出售多余掉落物。',
        rewards: ['Better gear access', 'Meso income'],
      },
      {
        type: 'event',
        name: 'Seasonal Events',
        nameZh: '季节性活动',
        description:
          'Join seasonal events for bonus EXP coupons and limited-time cosmetics.',
        descriptionZh:
          '参加季节性活动获取经验券和限时装饰品。',
        rewards: ['EXP coupons', 'Cosmetics', 'Event items'],
      },
    ],
    grindingMaps: [
      {
        name: 'Perion Excavation Site',
        nameZh: '勇士部落挖掘场',
        monster: 'Subway Worker / Wild Cargo',
        monsterZh: '地铁工人 / 野猪',
        levelRange: '30-40',
      },
      {
        name: 'Sleepywood: The Forest of Evil',
        nameZh: '沉睡森林：邪恶森林',
        monster: 'Evil Eye / Curse Eye',
        monsterZh: '恶灵之眼 / 诅咒之眼',
        levelRange: '40-50',
      },
      {
        name: 'Dungeon: The Ant Tunnel',
        nameZh: '蚂蚁洞穴',
        monster: 'Zombie Mushroom / Stone Golem',
        monsterZh: '僵尸蘑菇 / 石魔像',
        levelRange: '45-59',
      },
    ],
  },

  {
    minLevel: 60,
    maxLevel: 89,
    title: "Level 60-89: Adventurer",
    titleZh: "60-89级：冒险家阶段",
    summary:
      "Reach 3rd job and explore El Nath and the snowfields. Tackle the Orbis Party Quest and Lion King's Castle for great loot.",
    summaryZh:
      "完成第三次转职，探索冰峰雪域。挑战天空之城组队副本和狮子王之城获取丰厚奖励。",
    recommended: [
      {
        type: 'system',
        name: 'Third Job Advancement',
        nameZh: '第三次转职',
        description:
          'Reach level 70 and complete the 3rd job advancement quest chain to unlock advanced skills.',
        descriptionZh:
          '达到70级并完成第三次转职任务链，解锁高级技能。',
        rewards: ['Third job skills', 'SP points', 'Stat bonuses'],
      },
      {
        type: 'party-quest',
        name: 'Orbis Party Quest (Level 51-70)',
        nameZh: '天空之城组队任务（51-70级）',
        description:
          'A challenging PQ in Orbis Tower. Solve puzzles and defeat Papa Pixie at the end.',
        descriptionZh:
          '天空之塔中的挑战组队副本。解开谜题并在最后击败爸爸精灵。',
        rewards: ['EXP', 'Orbis scrolls', 'Equipment', 'Altaire Earrings'],
      },
      {
        type: 'dungeon',
        name: "Lion King's Castle",
        nameZh: '狮子王之城',
        description:
          'Explore Lion King\'s Castle for strong monsters and boss fights. Defeat Von Leon for great drops.',
        descriptionZh:
          '探索狮子王之城挑战强力怪物和Boss。击败班·雷昂获取丰厚掉落。',
        rewards: ['EXP', 'Von Leon equipment', 'Boss drops'],
      },
      {
        type: 'quest',
        name: 'El Nath Area Quests',
        nameZh: '冰峰雪域地区任务',
        description:
          'Complete quests in El Nath and the surrounding icy mountains for EXP and unique rewards.',
        descriptionZh:
          '完成冰峰雪域及周边雪山的任务获取经验和独特奖励。',
        rewards: ['EXP', 'Meso', 'Cold weather gear'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Mushmom / King Clang',
        nameZh: '蘑菇王 / 蟹王',
        description:
          'Beginner-friendly mini-bosses that drop useful early-mid game items.',
        descriptionZh:
          '新手友好的迷你Boss，掉落有用的前中期装备。',
        rewards: ['Mini-boss drops', 'Achievement progress'],
      },
      {
        type: 'system',
        name: 'Equip Potential System',
        nameZh: '装备潜能系统',
        description:
          'Start rolling potentials on your equipment using Cubes for significant stat gains.',
        descriptionZh:
          '开始使用魔方为装备洗潜能，获得显著的属性提升。',
        rewards: ['Potential bonuses', 'Stronger gear'],
      },
      {
        type: 'event',
        name: 'Burning Events',
        nameZh: '燃烧活动',
        description:
          'If available, take advantage of Burning World or hyper-burning events to fast-track leveling.',
        descriptionZh:
          '如果有燃烧世界或超级燃烧活动，利用它们快速升级。',
        rewards: ['Bonus EXP', 'Event rewards'],
      },
    ],
    grindingMaps: [
      {
        name: 'El Nath: Icy Cold Field',
        nameZh: '冰峰雪域：冰寒之地',
        monster: 'White Fang / Pepe',
        monsterZh: '白狼 / 贝贝',
        levelRange: '60-70',
      },
      {
        name: 'Lion King\'s Castle: Deep Castle',
        nameZh: '狮子王之城：深层城堡',
        monster: 'Roid / Master Death Teddy',
        monsterZh: '洛伊德 / 死亡泰迪王',
        levelRange: '70-80',
      },
      {
        name: 'Zakum Entrance Area',
        nameZh: '扎昆入口区域',
        monster: 'Hector / Yeti',
        monsterZh: '白熊 / 雪怪',
        levelRange: '80-89',
      },
    ],
  },

  {
    minLevel: 90,
    maxLevel: 119,
    title: "Level 90-119: Veteran",
    titleZh: "90-119级：资深阶段",
    summary:
      "Prepare for 4th job advancement. Grind at Temple of Time and Ludibrium. Start bossing Zakum for endgame accessories.",
    summaryZh:
      "为第四次转职做准备。在时间神殿和玩具城练级。开始挑战扎昆获取后期配饰。",
    recommended: [
      {
        type: 'system',
        name: 'Fourth Job Advancement (Level 120)',
        nameZh: '第四次转职（120级）',
        description:
          'Push toward level 120 for 4th job. Start gathering 4th job quest items now.',
        descriptionZh:
          '向120级进发准备第四次转职。现在开始收集四转任务物品。',
        rewards: ['Fourth job skills', 'Massive stat boost', 'New skill lines'],
      },
      {
        type: 'party-quest',
        name: 'Ludibrium Party Quest (Level 71-85)',
        nameZh: '玩具城组队任务（71-85级）',
        description:
          'Navigate through Ludibrium\'s clock tower in this party quest with puzzle and combat stages.',
        descriptionZh:
          '在这个组队副本中穿越玩具城的钟楼，包含谜题和战斗阶段。',
        rewards: ['EXP', 'Scrolls', 'Cape of Warmness'],
      },
      {
        type: 'boss',
        name: 'Zakum (First Clear)',
        nameZh: '扎昆（首次通关）',
        description:
          'Challenge Zakum for the first time to earn the Zakum Helmet — a staple accessory for many classes.',
        descriptionZh:
          '首次挑战扎昆获取扎昆头盔——许多职业的标配配饰。',
        rewards: ['Zakum Helmet', 'Zakum accessories', 'EXP'],
      },
      {
        type: 'dungeon',
        name: 'Temple of Time',
        nameZh: '时间神殿',
        description:
          'Grind at the Temple of Time for solid EXP. Watch out for the tough monsters in the deeper areas.',
        descriptionZh:
          '在时间神殿练级获取稳定经验。注意深处区域的强力怪物。',
        rewards: ['EXP', 'Time-related drops', 'Quest items'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Horntail (Easy/Normal)',
        nameZh: '暗黑龙王（简单/普通）',
        description:
          'Attempt Easy or Normal Horntail for the coveted Horntail Pendant and great EXP.',
        descriptionZh:
          '尝试简单或普通难度的暗黑龙王，获取梦寐以求的暗黑龙王的吊坠和大量经验。',
        rewards: ['Horntail Pendant', 'EXP', 'Dragon drops'],
      },
      {
        type: 'system',
        name: 'Star Force Enhancement',
        nameZh: '星之力强化',
        description:
          'Begin enhancing your gear with Star Force to push your stats higher for later content.',
        descriptionZh:
          '开始使用星之力强化装备，为后期内容提升属性。',
        rewards: ['Enhanced stats', 'Star Force bonuses'],
      },
      {
        type: 'event',
        name: 'Level-Up Events',
        nameZh: '升级活动',
        description:
          'Participate in level-up milestone events for bonus rewards at specific level thresholds.',
        descriptionZh:
          '参加升级里程碑活动，在特定等级获取额外奖励。',
        rewards: ['Milestone rewards', 'EXP coupons', 'Equipment boxes'],
      },
    ],
    grindingMaps: [
      {
        name: 'Ludibrium: Clocktower Bottom Floor',
        nameZh: '玩具城：钟楼底层',
        monster: 'Master Chronos / Rombot',
        monsterZh: '时间大师 / 罗曼机器人',
        levelRange: '90-100',
      },
      {
        name: 'Leafre: The Forest of Masters',
        nameZh: '神木村：大师之林',
        monster: 'Master Death Teddy / Jr. Newtie',
        monsterZh: '死亡泰迪王 / 小纽提',
        levelRange: '100-110',
      },
      {
        name: 'Temple of Time: Path of Time',
        nameZh: '时间神殿：时间之路',
        monster: 'Memory Monk / Memory Guardian',
        monsterZh: '记忆僧侣 / 记忆守护者',
        levelRange: '110-119',
      },
    ],
  },

  {
    minLevel: 120,
    maxLevel: 139,
    title: "Level 120-139: Master",
    titleZh: "120-139级：大师阶段",
    summary:
      "Unlock 4th job and Hyper Skills. Boss Zakum and Horntail regularly. Grind in Leafre and deeper areas for fast progression.",
    summaryZh:
      "解锁第四次转职和超级技能。定期刷扎昆和暗黑龙王。在神木村及更深处练级快速提升。",
    recommended: [
      {
        type: 'system',
        name: 'Fourth Job Advancement',
        nameZh: '第四次转职',
        description:
          'Complete the 4th job quest to unlock your most powerful skill set and Hyper Skills.',
        descriptionZh:
          '完成第四次转职任务解锁最强技能和超级技能。',
        rewards: ['Fourth job skills', 'Hyper Skills unlocked', 'Mastery Books'],
      },
      {
        type: 'boss',
        name: 'Zakum (Daily)',
        nameZh: '扎昆（日常）',
        description:
          'Run Zakum daily for the helmet, accessories, and mesos. A core part of daily bossing rotation.',
        descriptionZh:
          '每天刷扎昆获取头盔、配饰和金币。日常Boss循环的核心部分。',
        rewards: ['Zakum Helmet', 'Accessories', 'Meso', 'EXP'],
      },
      {
        type: 'boss',
        name: 'Horntail (Daily)',
        nameZh: '暗黑龙王（日常）',
        description:
          'Run Horntail daily for the pendant and EXP. Essential for early bossing progression.',
        descriptionZh:
          '每天刷暗黑龙王获取吊坠和经验。早期Boss进阶的必做内容。',
        rewards: ['Horntail Pendant', 'EXP', 'Dragon equipment'],
      },
      {
        type: 'dungeon',
        name: 'Leafre / Dragon Forest',
        nameZh: '神木村 / 龙之森',
        description:
          'Grind in the Leafre area for strong EXP. Explore the Dragon Forest and Minar Forest for high-density spawns.',
        descriptionZh:
          '在神木村区域练级获取大量经验。探索龙之森和密纳尔森林的高密度刷怪区。',
        rewards: ['EXP', 'Monster drops', 'Herb oils'],
      },
      {
        type: 'system',
        name: 'Hyper Skill Passive Optimization',
        nameZh: '超级技能被动优化',
        description:
          'Allocate Hyper Skill passives wisely. Prioritize stat% and boss damage for maximum DPS gains.',
        descriptionZh:
          '合理分配超级技能被动点。优先选择属性%和Boss伤害以最大化输出。',
        rewards: ['Passive stat boosts', 'Increased DPS'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Magnus (Easy)',
        nameZh: '麦格纳斯（简单）',
        description:
          'Try Easy Magnus for decent accessories and EXP once you have decent gear.',
        descriptionZh:
          '装备合格后尝试简单麦格纳斯获取不错的配饰和经验。',
        rewards: ['Magnus accessories', 'EXP', 'Royal equipment'],
      },
      {
        type: 'quest',
        name: 'Temple of Time Story Quests',
        nameZh: '时间神殿故事任务',
        description:
          'Complete the Temple of Time questline for story lore and useful rewards.',
        descriptionZh:
          '完成时间神殿任务线获取剧情故事和有用奖励。',
        rewards: ['EXP', 'Equipment', 'Story progression'],
      },
      {
        type: 'system',
        name: 'Link Skill Setup',
        nameZh: '链接技能配置',
        description:
          'Set up Link Skills from your Legion characters to boost your main character\'s power.',
        descriptionZh:
          '配置军团角色的链接技能来增强主号战力。',
        rewards: ['Link Skill bonuses', 'Cross-character synergy'],
      },
    ],
    grindingMaps: [
      {
        name: 'Leafre: Minar Forest',
        nameZh: '神木村：密纳尔森林',
        monster: 'Kentaurus / Jr. Newtie',
        monsterZh: '半人马 / 小纽提',
        levelRange: '120-130',
      },
      {
        name: 'Horntail Cave Entrance',
        nameZh: '暗黑龙巢穴入口',
        monster: 'Newtie / Nest Golem',
        monsterZh: '纽提 / 巢穴石魔像',
        levelRange: '130-135',
      },
      {
        name: 'Temple of Time: Present Time',
        nameZh: '时间神殿：现在时间',
        monster: 'Memory Monk Trainee',
        monsterZh: '记忆僧侣修炼生',
        levelRange: '135-139',
      },
    ],
  },

  {
    minLevel: 140,
    maxLevel: 159,
    title: "Level 140-159: Hero",
    titleZh: "140-159级：英雄阶段",
    summary:
      "Explore Future Henesys and Kritias. Boss Magnus and Hilla for endgame gear. Begin preparing for the Arcane River.",
    summaryZh:
      "探索未来的射手村和克里提亚斯。挑战麦格纳斯和希拉获取后期装备。开始为奥术之河做准备。",
    recommended: [
      {
        type: 'boss',
        name: 'Magnus (Normal/Hard)',
        nameZh: '麦格纳斯（普通/困难）',
        description:
          'Challenge Magnus on higher difficulties for Royal equipment pieces and solid EXP.',
        descriptionZh:
          '挑战更高难度的麦格纳斯获取皇家装备和稳定经验。',
        rewards: ['Royal equipment', 'EXP', 'Crystals'],
      },
      {
        type: 'dungeon',
        name: 'Future Henesys',
        nameZh: '未来射手村',
        description:
          'Grind in Future Henesys for high EXP and story progression. Great mob density for efficient farming.',
        descriptionZh:
          '在未来射手村练级获取高额经验和剧情进展。怪物密度高，适合高效刷怪。',
        rewards: ['EXP', 'Story progression', 'Future-themed drops'],
      },
      {
        type: 'dungeon',
        name: 'Kritias',
        nameZh: '克里提亚斯',
        description:
          'Explore the ancient city of Kritias. Fight strong enemies and complete area quests for good rewards.',
        descriptionZh:
          '探索克里提亚斯古城。挑战强力敌人并完成地区任务获取丰厚奖励。',
        rewards: ['EXP', 'Kritias equipment', 'Ancient scrolls'],
      },
      {
        type: 'boss',
        name: 'Hilla (Normal)',
        nameZh: '希拉（普通）',
        description:
          'Fight Hilla in the Tower of Oz for her unique drops and solid progression EXP.',
        descriptionZh:
          '在奥兹塔中挑战希拉获取独特掉落和稳定的进阶经验。',
        rewards: ['Hilla drops', 'EXP', 'Tower of Oz rewards'],
      },
    ],
    optional: [
      {
        type: 'dungeon',
        name: 'Twilight Perion',
        nameZh: '暮光勇士部落',
        description:
          'Explore Twilight Perion for additional EXP and quest rewards in this alternate-reality zone.',
        descriptionZh:
          '探索暮光勇士部落获取额外经验和任务奖励。',
        rewards: ['EXP', 'Twilight-themed items', 'Quest rewards'],
      },
      {
        type: 'system',
        name: 'Legion System Setup',
        nameZh: '军团系统配置',
        description:
          'Build your Maple Legion grid for passive stat bonuses. Place characters strategically on the board.',
        descriptionZh:
          '构建冒险岛军团棋盘获取被动属性加成。策略性地放置角色。',
        rewards: ['Legion bonuses', 'Passive stats', 'Legion coins'],
      },
      {
        type: 'event',
        name: 'Boss Rush Events',
        nameZh: 'Boss Rush活动',
        description:
          'Participate in Boss Rush events if available for bonus rewards and progression.',
        descriptionZh:
          '如果有Boss Rush活动，参加获取额外奖励和进度。',
        rewards: ['Event rewards', 'Boss drops', 'EXP'],
      },
    ],
    grindingMaps: [
      {
        name: 'Future Henesys: Hunting Ground',
        nameZh: '未来射手村：猎场',
        monster: 'Evil Mind Eye B',
        monsterZh: '邪恶心灵之眼B',
        levelRange: '140-148',
      },
      {
        name: 'Kritias: Ancient Ruins',
        nameZh: '克里提亚斯：古代遗迹',
        monster: 'Kritias Golem',
        monsterZh: '克里提亚斯石魔像',
        levelRange: '148-155',
      },
      {
        name: 'Twilight Perion: Ruins',
        nameZh: '暮光勇士部落：废墟',
        monster: 'Twilight Warrior',
        monsterZh: '暮光战士',
        levelRange: '155-159',
      },
    ],
  },

  {
    minLevel: 160,
    maxLevel: 179,
    title: "Level 160-179: Arcane River",
    titleZh: "160-179级：奥术之河",
    summary:
      "Enter the Arcane River — Vanishing Journey and Chu Chu Island. Build Arcane Symbols for massive stat boosts and unlock Arcane Force.",
    summaryZh:
      "进入奥术之河——消逝的旅途和啾啾岛。收集奥术符文获取巨额属性加成并解锁奥术之力。",
    recommended: [
      {
        type: 'system',
        name: 'Arcane Symbol System',
        nameZh: '奥术符文系统',
        description:
          'Collect and level up Arcane Symbols from daily quests and symbols. They provide massive stat increases essential for progression.',
        descriptionZh:
          '通过日常任务和符文收集并升级奥术符文。它们提供大量属性加成，是进阶的必备要素。',
        rewards: ['Arcane Force', 'Massive stat boosts', 'Arcane Symbol slots'],
      },
      {
        type: 'dungeon',
        name: 'Vanishing Journey',
        nameZh: '消逝的旅途',
        description:
          'The first Arcane River zone. Complete daily quests, grind mobs, and collect Arcane Symbols.',
        descriptionZh:
          '奥术之河的第一个区域。完成日常任务、刷怪并收集奥术符文。',
        rewards: ['Arcane Symbols', 'EXP', 'Vanishing Journey drops'],
      },
      {
        type: 'dungeon',
        name: 'Chu Chu Island',
        nameZh: '啾啾岛',
        description:
          'A colorful island zone with strong monsters. Complete daily quests and the Muto cooking minigame for symbols.',
        descriptionZh:
          '一个色彩缤纷的岛屿区域，有强力怪物。完成日常任务和穆托料理小游戏获取符文。',
        rewards: ['Chu Chu Symbols', 'EXP', 'Cooking minigame rewards'],
      },
      {
        type: 'quest',
        name: 'Vanishing Journey Daily Quests',
        nameZh: '消逝的旅途日常任务',
        description:
          'Run daily quests every day for consistent Arcane Symbol income. Essential for long-term progression.',
        descriptionZh:
          '每天完成日常任务获取稳定的奥术符文收入。长期进阶的必备内容。',
        rewards: ['Arcane Symbols', 'EXP', 'Sacred Power'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Lotus (Normal)',
        nameZh: '斯乌（普通）',
        description:
          'Attempt Lotus for powerful Lotus Badge accessories and progression EXP.',
        descriptionZh:
          '挑战斯乌获取强力的斯乌徽章配饰和进阶经验。',
        rewards: ['Lotus Badge', 'EXP', 'Lotus drops'],
      },
      {
        type: 'system',
        name: 'Arcane Force Milestones',
        nameZh: '奥术之力里程碑',
        description:
          'Track your Arcane Force milestones. Higher Arcane Force reduces damage penalty in Arcane River zones.',
        descriptionZh:
          '追踪你的奥术之力里程碑。更高的奥术之力减少奥术之河区域的伤害惩罚。',
        rewards: ['Reduced damage penalty', 'Higher kill efficiency'],
      },
      {
        type: 'event',
        name: 'Arcane River Events',
        nameZh: '奥术之河活动',
        description:
          'Watch for Arcane River themed events that provide bonus symbols or EXP.',
        descriptionZh:
          '关注奥术之河主题活动，获取额外符文或经验。',
        rewards: ['Bonus symbols', 'EXP', 'Event items'],
      },
    ],
    grindingMaps: [
      {
        name: 'Vanishing Journey: Cave of Rest',
        nameZh: '消逝的旅途：休憩洞穴',
        monster: 'Slurpy Forest Slime',
        monsterZh: '啾啾森林史莱姆',
        levelRange: '160-168',
      },
      {
        name: 'Chu Chu Island: Muto Forest',
        nameZh: '啾啾岛：穆托森林',
        monster: 'Angry Muto',
        monsterZh: '愤怒的穆托',
        levelRange: '168-175',
      },
      {
        name: 'Chu Chu Island: Slippery Slope',
        nameZh: '啾啾岛：滑坡',
        monster: 'Mighty Muto',
        monsterZh: '强力穆托',
        levelRange: '175-179',
      },
    ],
  },

  {
    minLevel: 180,
    maxLevel: 199,
    title: "Level 180-199: Arcane Depths",
    titleZh: "180-199级：奥术深处",
    summary:
      "Push through Lachelein, Arcana, and Morass. These zones have tough monsters but excellent EXP and Arcane Symbol rewards.",
    summaryZh:
      "推进拉克莱因、阿尔卡纳和莫拉斯。这些区域怪物强力但经验和奥术符文奖励丰厚。",
    recommended: [
      {
        type: 'dungeon',
        name: 'Lachelein',
        nameZh: '拉克莱因',
        description:
          'A mysterious clockwork city with challenging monsters. Complete dailies and grind for symbols and EXP.',
        descriptionZh:
          '一座神秘的钟表城，有挑战性的怪物。完成日常任务刷符文和经验。',
        rewards: ['Lachelein Symbols', 'EXP', 'Clockwork drops'],
      },
      {
        type: 'dungeon',
        name: 'Arcana',
        nameZh: '阿尔卡纳',
        description:
          'A lush forest zone with powerful spirits. One of the best EXP zones in the Arcane River.',
        descriptionZh:
          '一个繁茂的森林区域，有强力的精灵。奥术之河中最好的经验区之一。',
        rewards: ['Arcana Symbols', 'High EXP', 'Spirit drops'],
      },
      {
        type: 'dungeon',
        name: 'Morass',
        nameZh: '莫拉斯',
        description:
          'A dark swamp zone with high-level enemies. Complete dailies and grind the swamp for excellent progression.',
        descriptionZh:
          '一个黑暗沼泽区域，有高等级敌人。完成日常任务并在沼泽中练级获取优秀进度。',
        rewards: ['Morass Symbols', 'EXP', 'Swamp drops'],
      },
      {
        type: 'quest',
        name: 'Arcane River Daily Rotation',
        nameZh: '奥术之河日常循环',
        description:
          'Run all Arcane River daily quests in rotation. Symbol income is critical for damage scaling.',
        descriptionZh:
          '循环完成所有奥术之河日常任务。符文收入对伤害成长至关重要。',
        rewards: ['Symbols from all zones', 'Sacred Power', 'EXP'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Damien (Normal)',
        nameZh: '戴米安（普通）',
        description:
          'Challenge Damien for his equipment drops and progression EXP.',
        descriptionZh:
          '挑战戴米安获取装备掉落和进阶经验。',
        rewards: ['Damien equipment', 'EXP', 'Dragon essence'],
      },
      {
        type: 'boss',
        name: 'Lotus (Hard)',
        nameZh: '斯乌（困难）',
        description:
          'Hard Lotus drops superior accessories. Attempt once your gear and Arcane Force are sufficient.',
        descriptionZh:
          '困难斯乌掉落优质配饰。装备和奥术之力足够后尝试。',
        rewards: ['Superior Lotus accessories', 'EXP'],
      },
      {
        type: 'system',
        name: 'Arcane Force Optimization',
        nameZh: '奥术之力优化',
        description:
          'Focus on maxing Arcane Symbols to reduce damage penalty and increase farming efficiency in later zones.',
        descriptionZh:
          '专注于满级奥术符文以减少伤害惩罚并提高后续区域的刷怪效率。',
        rewards: ['Maxed symbols', 'Optimized farming'],
      },
    ],
    grindingMaps: [
      {
        name: 'Lachelein: Clockwork Tower',
        nameZh: '拉克莱因：钟表塔',
        monster: 'Lachelein Soldier',
        monsterZh: '拉克莱因士兵',
        levelRange: '180-187',
      },
      {
        name: 'Arcana: Spirit Valley',
        nameZh: '阿尔卡纳：精灵谷',
        monster: 'Spirit of Arcana',
        monsterZh: '阿尔卡纳精灵',
        levelRange: '187-193',
      },
      {
        name: 'Morass: Dark Swamp',
        nameZh: '莫拉斯：黑暗沼泽',
        monster: 'Shadow Merchant',
        monsterZh: '暗影商人',
        levelRange: '193-199',
      },
    ],
  },

  {
    minLevel: 200,
    maxLevel: 219,
    title: "Level 200-219: Ascension",
    titleZh: "200-219级：飞升阶段",
    summary:
      "Enter Esfera and Tenebris. Unlock 5th job and V Matrix skills. Begin the endgame grind with Sacred Power and Authentic Symbols.",
    summaryZh:
      "进入埃斯佩拉和特涅布里斯。解锁第五转和V矩阵技能。开始后期练级，收集神圣力量和真实符文。",
    recommended: [
      {
        type: 'system',
        name: 'Fifth Job Advancement',
        nameZh: '第五次转职',
        description:
          'Unlock 5th job and the V Matrix system. Allocate nodes wisely for your class\'s optimal skill setup.',
        descriptionZh:
          '解锁第五转和V矩阵系统。为职业最优技能配置合理分配节点。',
        rewards: ['5th job skills', 'V Matrix', 'Node crafting system'],
      },
      {
        type: 'dungeon',
        name: 'Esfera',
        nameZh: '埃斯佩拉',
        description:
          'The ethereal realm of Esfera. Fight celestial beings and complete story quests for Authentic Symbols.',
        descriptionZh:
          '空灵的埃斯佩拉领域。与天界生物战斗并完成故事任务获取真实符文。',
        rewards: ['Authentic Symbols', 'EXP', 'Esfera story rewards'],
      },
      {
        type: 'dungeon',
        name: 'Tenebris',
        nameZh: '特涅布里斯',
        description:
          'The darkest region of Maple World. High-level zone with excellent EXP rates and challenging content.',
        descriptionZh:
          '冒险岛世界最黑暗的区域。高等级区域，经验率极高且内容充满挑战。',
        rewards: ['Authentic Symbols', 'High EXP', 'Dark-themed drops'],
      },
      {
        type: 'system',
        name: 'V Matrix Node Optimization',
        nameZh: 'V矩阵节点优化',
        description:
          'Craft and enhance V Matrix nodes. Prioritize your main attack skill nodes and essential 5th job skills.',
        descriptionZh:
          '制作和强化V矩阵节点。优先升级主要攻击技能节点和关键五转技能。',
        rewards: ['Enhanced skills', 'V Matrix levels', 'Node crafting materials'],
      },
      {
        type: 'boss',
        name: 'Lucid (Normal)',
        nameZh: '露西妲（普通）',
        description:
          'Challenge Lucid for her exclusive equipment and accessories. A key endgame boss for progression.',
        descriptionZh:
          '挑战露西妲获取专属装备和配饰。后期进阶的关键Boss。',
        rewards: ['Lucid equipment', 'Dream fragments', 'EXP'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Will (Easy/Normal)',
        nameZh: '威尔（简单/普通）',
        description:
          'Attempt Will for his unique drops. Learn the mechanics early for harder difficulties later.',
        descriptionZh:
          '挑战威尔获取独特掉落。提前学习机制为后续更高难度做准备。',
        rewards: ['Will equipment', 'EXP', 'Spider drops'],
      },
      {
        type: 'quest',
        name: 'Esfera Story Questline',
        nameZh: '埃斯佩拉故事任务线',
        description:
          'Complete the full Esfera story for lore, Authentic Symbols, and unique rewards.',
        descriptionZh:
          '完成完整的埃斯佩拉故事线获取剧情、真实符文和独特奖励。',
        rewards: ['Authentic Symbols', 'Story rewards', 'Esfera medals'],
      },
      {
        type: 'system',
        name: 'Sacred Power Accumulation',
        nameZh: '神圣力量积累',
        description:
          'Accumulate Sacred Power through dailies and grinding. It provides incremental but significant stat boosts.',
        descriptionZh:
          '通过日常和练级积累神圣力量。它提供渐进但显著的属性提升。',
        rewards: ['Sacred Power stats', 'Incremental bonuses'],
      },
    ],
    grindingMaps: [
      {
        name: 'Esfera: Mirror-touched World',
        nameZh: '埃斯佩拉：镜之世界',
        monster: 'Mirror World Guardian',
        monsterZh: '镜之世界守护者',
        levelRange: '200-208',
      },
      {
        name: 'Tenebris: Radiant Temple',
        nameZh: '特涅布里斯：光辉神殿',
        monster: 'Celestial Knight',
        monsterZh: '天界骑士',
        levelRange: '208-215',
      },
      {
        name: 'Tenebris: Shadow Corridor',
        nameZh: '特涅布里斯：暗影走廊',
        monster: 'Shadow Knight',
        monsterZh: '暗影骑士',
        levelRange: '215-219',
      },
    ],
  },

  {
    minLevel: 220,
    maxLevel: 229,
    title: "Level 220-229: Beyond the Horizon",
    titleZh: "220-229级：超越地平线",
    summary:
      "Explore Sellas and Moonbridge. Continue building Authentic Symbols and push your V Matrix toward max levels.",
    summaryZh:
      "探索塞拉斯和月桥。继续积累真实符文并将V矩阵推向满级。",
    recommended: [
      {
        type: 'dungeon',
        name: 'Sellas',
        nameZh: '塞拉斯',
        description:
          'An underwater zone with deep-sea creatures. Excellent EXP rates and Authentic Symbol dailies.',
        descriptionZh:
          '一个水下区域，有深海生物。优秀的经验率和真实符文日常。',
        rewards: ['Authentic Symbols', 'High EXP', 'Sea creature drops'],
      },
      {
        type: 'dungeon',
        name: 'Moonbridge',
        nameZh: '月桥',
        description:
          'A celestial bridge zone with cosmic enemies. High EXP density and valuable daily quests.',
        descriptionZh:
          '一个天界桥梁区域，有宇宙敌人。高经验密度和有价值日常任务。',
        rewards: ['Authentic Symbols', 'Cosmic EXP', 'Star fragments'],
      },
      {
        type: 'boss',
        name: 'Lucid (Hard)',
        nameZh: '露西妲（困难）',
        description:
          'Challenge Hard Lucid for superior drops. Requires strong V Matrix and gear optimization.',
        descriptionZh:
          '挑战困难露西妲获取优质掉落。需要强力V矩阵和装备优化。',
        rewards: ['Superior Lucid drops', 'High EXP', 'Dream essence'],
      },
      {
        type: 'system',
        name: 'Authentic Symbol Leveling',
        nameZh: '真实符文升级',
        description:
          'Continue leveling Authentic Symbols for massive stat gains. Each level provides significant power increases.',
        descriptionZh:
          '继续升级真实符文获取大量属性收益。每一级都提供显著的力量提升。',
        rewards: ['Higher Authentic Force', 'Massive stats', 'Zone access'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Will (Hard)',
        nameZh: '威尔（困难）',
        description:
          'Hard Will drops top-tier accessories. Master the spider mechanics for a clean clear.',
        descriptionZh:
          '困难威尔掉落顶级配饰。掌握蜘蛛机制以顺利通关。',
        rewards: ['Top-tier Will accessories', 'EXP'],
      },
      {
        type: 'event',
        name: 'Meso & EXP Events',
        nameZh: '金币与经验活动',
        description:
          'Leverage any active EXP or meso events to accelerate your grind through these levels.',
        descriptionZh:
          '利用任何活跃的经验或金币活动加速这些等级的练级进度。',
        rewards: ['Bonus EXP', 'Bonus Meso', 'Event coupons'],
      },
      {
        type: 'system',
        name: 'Inner Ability Optimization',
        nameZh: '内在能力优化',
        description:
          'Re-roll and optimize Inner Ability lines for your class. Key lines include boss damage and attack speed.',
        descriptionZh:
          '为职业重新洗练和优化内在能力。关键属性包括Boss伤害和攻击速度。',
        rewards: ['Optimized inner ability', 'Increased DPS'],
      },
    ],
    grindingMaps: [
      {
        name: 'Sellas: Sunken Temple',
        nameZh: '塞拉斯：沉没神殿',
        monster: 'Deep Sea Serpent',
        monsterZh: '深海蛇龙',
        levelRange: '220-224',
      },
      {
        name: 'Moonbridge: Star Road',
        nameZh: '月桥：星光大道',
        monster: 'Starlight Knight',
        monsterZh: '星光骑士',
        levelRange: '224-227',
      },
      {
        name: 'Moonbridge: Lunar Shrine',
        nameZh: '月桥：月之神殿',
        monster: 'Lunar Golem',
        monsterZh: '月之石魔像',
        levelRange: '227-229',
      },
    ],
  },

  {
    minLevel: 230,
    maxLevel: 239,
    title: "Level 230-239: The Abyss",
    titleZh: "230-239级：深渊阶段",
    summary:
      "Navigate the Labyrinth of Suffering and Limina. These brutal zones require high Authentic Force and optimized V Matrix builds.",
    summaryZh:
      "穿越苦难迷宫和利米纳。这些残酷区域需要高真实之力和优化后的V矩阵构建。",
    recommended: [
      {
        type: 'dungeon',
        name: 'Labyrinth of Suffering',
        nameZh: '苦难迷宫',
        description:
          'A brutal underground maze with some of the toughest mobs in the game. Excellent EXP if you can survive.',
        descriptionZh:
          '一个残酷的地下迷宫，有游戏中最难对付的小怪。如果生存能力足够，经验极其丰厚。',
        rewards: ['Authentic Symbols', 'Massive EXP', 'Labyrinth drops'],
      },
      {
        type: 'dungeon',
        name: 'Limina',
        nameZh: '利米纳',
        description:
          'A crystalline dimension with high-level entities. One of the best EXP zones at this level range.',
        descriptionZh:
          '一个水晶维度，有高等级实体。这个等级段最好的经验区之一。',
        rewards: ['Authentic Symbols', 'Top-tier EXP', 'Crystal drops'],
      },
      {
        type: 'boss',
        name: 'Verus Hilla (Normal)',
        nameZh: '真希拉（普通）',
        description:
          'Fight the true form of Hilla for powerful drops and progression EXP.',
        descriptionZh:
          '挑战希拉的真身获取强力掉落和进阶经验。',
        rewards: ['Verus Hilla drops', 'EXP', 'Dark essence'],
      },
      {
        type: 'quest',
        name: 'Labyrinth of Suffering Dailies',
        nameZh: '苦难迷宫日常任务',
        description:
          'Complete daily quests in the Labyrinth for consistent symbol income and story progression.',
        descriptionZh:
          '完成迷宫日常任务获取稳定符文收入和剧情进展。',
        rewards: ['Authentic Symbols', 'EXP', 'Story items'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Darknell (Normal)',
        nameZh: '戴安洛（普通）',
        description:
          'Challenge Darknell for his exclusive equipment and good EXP rewards.',
        descriptionZh:
          '挑战戴安洛获取专属装备和不错的经验奖励。',
        rewards: ['Darknell equipment', 'EXP', 'Dark power drops'],
      },
      {
        type: 'system',
        name: 'V Matrix Max Leveling',
        nameZh: 'V矩阵满级',
        description:
          'Push remaining V Matrix nodes toward max level. Every node level counts in endgame DPS calculations.',
        descriptionZh:
          '将剩余V矩阵节点推向满级。每个节点等级都影响后期DPS计算。',
        rewards: ['Maxed V Matrix', 'Peak skill damage'],
      },
      {
        type: 'event',
        name: 'Boss Event Weeks',
        nameZh: 'Boss活动周',
        description:
          'Take advantage of boss event weeks for extra drops and clear count resets.',
        descriptionZh:
          '利用Boss活动周获取额外掉落和通关次数重置。',
        rewards: ['Bonus boss drops', 'Extra clears', 'Event items'],
      },
    ],
    grindingMaps: [
      {
        name: 'Labyrinth of Suffering: Core',
        nameZh: '苦难迷宫：核心',
        monster: 'Labyrinth Golem',
        monsterZh: '迷宫石魔像',
        levelRange: '230-234',
      },
      {
        name: 'Limina: Crystal Cavern',
        nameZh: '利米纳：水晶洞窟',
        monster: 'Limina Guardian',
        monsterZh: '利米纳守护者',
        levelRange: '234-237',
      },
      {
        name: 'Limina: Dimensional Rift',
        nameZh: '利米纳：次元裂缝',
        monster: 'Rift Entity',
        monsterZh: '裂缝实体',
        levelRange: '237-239',
      },
    ],
  },

  {
    minLevel: 240,
    maxLevel: 249,
    title: "Level 240-249: Sacred Frontier",
    titleZh: "240-249级：神圣前线",
    summary:
      "Enter Cernium, Arcus, and Odium. These endgame zones feature the toughest regular monsters and rewarding daily content.",
    summaryZh:
      "进入塞尔尼乌姆、阿尔库斯和奥迪乌姆。这些后期区域有最难对付的普通怪物和丰厚的日常内容。",
    recommended: [
      {
        type: 'dungeon',
        name: 'Cernium',
        nameZh: '塞尔尼乌姆',
        description:
          'A holy fortress zone with powerful divine enemies. Great EXP and Sacred Power progression.',
        descriptionZh:
          '一个神圣堡垒区域，有强力天界敌人。优秀的经验和神圣力量进度。',
        rewards: ['Sacred Power', 'High EXP', 'Divine drops'],
      },
      {
        type: 'dungeon',
        name: 'Arcus',
        nameZh: '阿尔库斯',
        description:
          'A floating island zone with cosmic-level threats. Dense mob spawns and excellent EXP rates.',
        descriptionZh:
          '一个浮空岛屿区域，有宇宙级威胁。密集刷怪和优秀经验率。',
        rewards: ['Sacred Power', 'Top-tier EXP', 'Arcus drops'],
      },
      {
        type: 'dungeon',
        name: 'Odium',
        nameZh: '奥迪乌姆',
        description:
          'A zone of pure hatred with extreme difficulty. Among the highest EXP zones available.',
        descriptionZh:
          '一个纯粹仇恨的区域，难度极高。可用的最高经验区之一。',
        rewards: ['Sacred Power', 'Extreme EXP', 'Odium drops'],
      },
      {
        type: 'boss',
        name: 'Verus Hilla (Hard)',
        nameZh: '真希拉（困难）',
        description:
          'Challenge Hard Verus Hilla for superior accessories and progression.',
        descriptionZh:
          '挑战困难真希拉获取优质配饰和进阶。',
        rewards: ['Superior Hilla accessories', 'EXP'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Seren (Normal)',
        nameZh: '赛琳（普通）',
        description:
          'Attempt Seren for her exclusive equipment. Requires precise mechanics execution.',
        descriptionZh:
          '尝试挑战赛琳获取专属装备。需要精确的机制执行。',
        rewards: ['Seren equipment', 'EXP', 'Dragon essence'],
      },
      {
        type: 'system',
        name: 'Sacred Power Milestones',
        nameZh: '神圣力量里程碑',
        description:
          'Track Sacred Power milestones. Higher Sacred Power is essential for efficient farming in Odium and beyond.',
        descriptionZh:
          '追踪神圣力量里程碑。更高的神圣力量对奥迪乌姆及之后的高效刷怪至关重要。',
        rewards: ['Sacred Power tiers', 'Stat bonuses'],
      },
      {
        type: 'event',
        name: 'Sacred Power Events',
        nameZh: '神圣力量活动',
        description:
          'Participate in events that accelerate Sacred Power accumulation.',
        descriptionZh:
          '参加加速神圣力量积累的活动。',
        rewards: ['Bonus Sacred Power', 'Event rewards'],
      },
    ],
    grindingMaps: [
      {
        name: 'Cernium: Holy Grounds',
        nameZh: '塞尔尼乌姆：圣域',
        monster: 'Cernium Soldier',
        monsterZh: '塞尔尼乌姆士兵',
        levelRange: '240-243',
      },
      {
        name: 'Arcus: Sky Citadel',
        nameZh: '阿尔库斯：天空城塞',
        monster: 'Arcus Knight',
        monsterZh: '阿尔库斯骑士',
        levelRange: '243-247',
      },
      {
        name: 'Odium: Hatred Core',
        nameZh: '奥迪乌姆：仇恨核心',
        monster: 'Odium Beast',
        monsterZh: '奥迪乌姆兽',
        levelRange: '247-249',
      },
    ],
  },

  {
    minLevel: 250,
    maxLevel: 259,
    title: "Level 250-259: Endgame Frontier",
    titleZh: "250-259级：后期前线",
    summary:
      "Push through Doed, Shangri-La, and Artesia. Focus on bossing progression and Sacred Power optimization for the 6th job threshold.",
    summaryZh:
      "推进杜埃德、香格里拉和阿尔特西亚。专注于Boss进阶和神圣力量优化以达到第六转门槛。",
    recommended: [
      {
        type: 'dungeon',
        name: 'Doed',
        nameZh: '杜埃德',
        description:
          'A frozen wasteland with ancient horrors. Excellent Sacred Power and EXP progression.',
        descriptionZh:
          '一个冰冻荒原，有远古恐怖。优秀的 Sacred Power 和经验进度。',
        rewards: ['Sacred Power', 'EXP', 'Doed drops'],
      },
      {
        type: 'dungeon',
        name: 'Shangri-La',
        nameZh: '香格里拉',
        description:
          'A mythical paradise hidden in the mountains. High mob density and rewarding dailies.',
        descriptionZh:
          '一个隐藏在群山中的神话乐园。高密度刷怪和丰厚的日常奖励。',
        rewards: ['Sacred Power', 'High EXP', 'Paradise drops'],
      },
      {
        type: 'dungeon',
        name: 'Artesia',
        nameZh: '阿尔特西亚',
        description:
          'A grand magical realm with powerful arcane guardians. One of the final pre-6th job zones.',
        descriptionZh:
          '一个宏大的魔法领域，有强力的奥术守卫。第六转前的最终区域之一。',
        rewards: ['Sacred Power', 'Top EXP', 'Artesian drops'],
      },
      {
        type: 'boss',
        name: 'Seren (Hard)',
        nameZh: '赛琳（困难）',
        description:
          'Challenge Hard Seren for her best-in-slot accessories. One of the toughest endgame bosses.',
        descriptionZh:
          '挑战困难赛琳获取毕业配饰。最难后期Boss之一。',
        rewards: ['Best-in-slot Seren gear', 'High EXP'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Kalos (Normal)',
        nameZh: '卡洛斯（普通）',
        description:
          'Attempt Kalos for his unique drops and progression. Requires strong Sacred Power.',
        descriptionZh:
          '挑战卡洛斯获取独特掉落和进阶。需要强力神圣力量。',
        rewards: ['Kalos equipment', 'EXP', 'Ancient drops'],
      },
      {
        type: 'system',
        name: 'Gear Optimization',
        nameZh: '装备优化',
        description:
          'Fine-tune your gear with optimal potentials, Star Force, and scrolls for maximum DPS.',
        descriptionZh:
          '通过最优潜能、星之力和卷轴微调装备以最大化DPS。',
        rewards: ['Optimized gear', 'Peak DPS'],
      },
      {
        type: 'event',
        name: 'Endgame Events',
        nameZh: '后期活动',
        description:
          'Participate in endgame-focused events for premium materials and EXP boosts.',
        descriptionZh:
          '参加面向后期玩家的活动获取高级材料和经验加成。',
        rewards: ['Premium materials', 'EXP boosts', 'Rare items'],
      },
    ],
    grindingMaps: [
      {
        name: 'Doed: Frozen Depths',
        nameZh: '杜埃德：冰冻深渊',
        monster: 'Doed Horror',
        monsterZh: '杜埃德恐怖',
        levelRange: '250-253',
      },
      {
        name: 'Shangri-La: Hidden Valley',
        nameZh: '香格里拉：隐秘山谷',
        monster: 'Shangri-La Spirit',
        monsterZh: '香格里拉精灵',
        levelRange: '253-257',
      },
      {
        name: 'Artesia: Arcane Sanctum',
        nameZh: '阿尔特西亚：奥术圣殿',
        monster: 'Artesian Guardian',
        monsterZh: '阿尔特西亚守卫',
        levelRange: '257-259',
      },
    ],
  },

  {
    minLevel: 260,
    maxLevel: 269,
    title: "Level 260-269: Transcendence",
    titleZh: "260-269级：超越阶段",
    summary:
      "Unlock 6th job and the Hexa Matrix. Explore Sol Erda and Sol Janus. Begin the endgame Hexa Force optimization grind.",
    summaryZh:
      "解锁第六转和赫克萨矩阵。探索太阳埃尔德和太阳雅努斯。开始后期赫克萨之力优化练级。",
    recommended: [
      {
        type: 'system',
        name: 'Sixth Job Advancement',
        nameZh: '第六次转职',
        description:
          'Unlock the 6th job and Hexa Matrix system. This is the pinnacle of MapleStory progression with Hexa Skills.',
        descriptionZh:
          '解锁第六转和赫克萨矩阵系统。这是冒险岛进阶的巅峰，拥有赫克萨技能。',
        rewards: ['6th job skills', 'Hexa Matrix', 'Hexa Force system'],
      },
      {
        type: 'dungeon',
        name: 'Sol Erda',
        nameZh: '太阳埃尔德',
        description:
          'A solar dimension of pure energy. The first 6th job zone with extreme difficulty and top EXP rates.',
        descriptionZh:
          '一个纯能量的太阳维度。第一个六转区域，难度极高且经验率顶级。',
        rewards: ['Hexa materials', 'Top EXP', 'Solar drops'],
      },
      {
        type: 'dungeon',
        name: 'Sol Janus',
        nameZh: '太阳雅努斯',
        description:
          'A dual-faced cosmic zone. The highest level zone currently available with the best EXP in the game.',
        descriptionZh:
          '一个双面宇宙区域。当前可用的最高等级区域，拥有游戏中最好的经验。',
        rewards: ['Hexa materials', 'Highest EXP', 'Cosmic drops'],
      },
      {
        type: 'system',
        name: 'Hexa Matrix Building',
        nameZh: '赫克萨矩阵构建',
        description:
          'Begin building and enhancing your Hexa Matrix nodes for massive power increases.',
        descriptionZh:
          '开始构建和强化赫克萨矩阵节点以获取巨大力量提升。',
        rewards: ['Hexa Skills', 'Hexa Force', 'Massive stats'],
      },
      {
        type: 'quest',
        name: '6th Job Questline',
        nameZh: '第六转任务线',
        description:
          'Complete the 6th job questline for Hexa materials and story progression.',
        descriptionZh:
          '完成第六转任务线获取赫克萨材料和剧情进展。',
        rewards: ['Hexa materials', 'Story rewards', 'Hexa EXP'],
      },
    ],
    optional: [
      {
        type: 'boss',
        name: 'Kalos (Hard)',
        nameZh: '卡洛斯（困难）',
        description:
          'Challenge Hard Kalos for premium Hexa materials and progression.',
        descriptionZh:
          '挑战困难卡洛斯获取高级赫克萨材料和进阶。',
        rewards: ['Premium Hexa materials', 'Kalos drops', 'EXP'],
      },
      {
        type: 'system',
        name: 'Hexa Force Optimization',
        nameZh: '赫克萨之力优化',
        description:
          'Prioritize key Hexa nodes for your class. Focus on your main attacking skill first for maximum DPS gains.',
        descriptionZh:
          '为职业优先选择关键赫克萨节点。首先专注主要攻击技能以最大化DPS。',
        rewards: ['Optimized Hexa build', 'Peak DPS', 'Hexa Force milestones'],
      },
      {
        type: 'event',
        name: 'Hexa Boost Events',
        nameZh: '赫克萨加成活动',
        description:
          'Leverage Hexa boost events for accelerated Hexa Matrix progression.',
        descriptionZh:
          '利用赫克萨加成活动加速赫克萨矩阵进度。',
        rewards: ['Bonus Hexa materials', 'Hexa EXP', 'Boost items'],
      },
    ],
    grindingMaps: [
      {
        name: 'Sol Erda: Solar Core',
        nameZh: '太阳埃尔德：太阳核心',
        monster: 'Solar Beast',
        monsterZh: '太阳兽',
        levelRange: '260-264',
      },
      {
        name: 'Sol Janus: Cosmic Gate',
        nameZh: '太阳雅努斯：宇宙之门',
        monster: 'Janus Entity',
        monsterZh: '雅努斯实体',
        levelRange: '264-267',
      },
      {
        name: 'Sol Janus: Dimensional Edge',
        nameZh: '太阳雅努斯：次元边缘',
        monster: 'Dimensional Guardian',
        monsterZh: '次元守护者',
        levelRange: '267-269',
      },
    ],
  },

  {
    minLevel: 270,
    maxLevel: 300,
    title: "Level 270+: Endgame",
    titleZh: "270+级：终局阶段",
    summary:
      "Full endgame content. Focus on weekly bossing, Hexa Matrix optimization, and pushing your character to its absolute limits.",
    summaryZh:
      "完整后期内容。专注于每周Boss、赫克萨矩阵优化以及将角色推向极限。",
    recommended: [
      {
        type: 'boss',
        name: 'Weekly Boss Rotation',
        nameZh: '每周Boss循环',
        description:
          'Run all weekly bosses: Lotus, Damien, Lucid, Will, Verus Hilla, Seren, Kalos, and more for top-tier rewards.',
        descriptionZh:
          '刷所有每周Boss：斯乌、戴米安、露西妲、威尔、真希拉、赛琳、卡洛斯等获取顶级奖励。',
        rewards: ['Boss equipment', 'Hexa materials', 'Meso', 'EXP'],
      },
      {
        type: 'system',
        name: 'Hexa Matrix Optimization',
        nameZh: '赫克萨矩阵优化',
        description:
          'Max out all Hexa Matrix nodes and optimize the Sol Erda / Sol Janus skill enhancements for peak performance.',
        descriptionZh:
          '满级所有赫克萨矩阵节点并优化太阳埃尔德/太阳雅努斯技能强化以达到巅峰表现。',
        rewards: ['Maxed Hexa Matrix', 'Peak character power', 'Sol skills'],
      },
      {
        type: 'boss',
        name: 'Black Mage (Hard/Extreme)',
        nameZh: '黑魔法师（困难/极限）',
        description:
          'The ultimate MapleStory boss. Challenge Black Mage on the hardest difficulties for the best rewards in the game.',
        descriptionZh:
          '冒险岛终极Boss。在最高难度下挑战黑魔法师获取游戏中最好的奖励。',
        rewards: ['Black Mage drops', 'Legendary equipment', 'Title rewards'],
      },
      {
        type: 'system',
        name: 'Character Perfection',
        nameZh: '角色完美化',
        description:
          'Fine-tune every aspect: potentials, scrolls, Star Force, symbols, Legion, Link Skills, and Inner Ability.',
        descriptionZh:
          '微调每一个方面：潜能、卷轴、星之力、符文、军团、链接技能和内在能力。',
        rewards: ['Maximum DPS', 'Complete optimization', 'Leaderboard ranking'],
      },
    ],
    optional: [
      {
        type: 'system',
        name: 'Legion Completion',
        nameZh: '军团完成度',
        description:
          'Max out the Maple Legion board and collect all Legion characters for the ultimate passive bonuses.',
        descriptionZh:
          '满级冒险岛军团棋盘并收集所有军团角色获取终极被动加成。',
        rewards: ['Max Legion bonuses', 'All passive stats', 'Legion rewards'],
      },
      {
        type: 'boss',
        name: 'Black Mage (Mythic)',
        nameZh: '黑魔法师（神话）',
        description:
          'The ultimate challenge in MapleStory. Only the most powerful players can attempt this difficulty.',
        descriptionZh:
          '冒险岛终极挑战。只有最强力的玩家才能尝试这个难度。',
        rewards: ['Mythic-tier rewards', 'Exclusive titles', 'Legendary recognition'],
      },
      {
        type: 'event',
        name: 'Anniversary & Milestone Events',
        nameZh: '周年庆与里程碑活动',
        description:
          'Participate in major anniversary events for exclusive cosmetics, titles, and rare materials.',
        descriptionZh:
          '参加大型周年庆活动获取专属装饰、称号和稀有材料。',
        rewards: ['Exclusive cosmetics', 'Rare titles', 'Premium materials'],
      },
    ],
    grindingMaps: [
      {
        name: 'Sol Janus: Final Frontier',
        nameZh: '太阳雅努斯：最终前线',
        monster: 'Cosmic Overlord',
        monsterZh: '宇宙霸主',
        levelRange: '270-280',
      },
      {
        name: 'Arcane River: All Zones (Revisit)',
        nameZh: '奥术之河：全区域（重访）',
        monster: 'Various high-level mobs',
        monsterZh: '各种高等级怪物',
        levelRange: '280-290',
      },
      {
        name: 'Boss Rush Areas',
        nameZh: 'Boss Rush区域',
        monster: 'Boss minions',
        monsterZh: 'Boss仆从',
        levelRange: '290+',
      },
    ],
  },
];
