import type { SupportedLanguage } from '@/i18n/languageRouting';
import type { GameVersion } from '@/hooks/VersionContext';

export type HelpCategory = 'codes' | 'access' | 'events' | 'progression' | 'sources';

export type HelpTopic = {
  answer: readonly string[];
  category: HelpCategory;
  cta: string;
  href: string;
  id: string;
  keywords: readonly string[];
  question: string;
  series: string;
  server?: GameVersion;
  steps: readonly string[];
};

export type HelpCenterProfile = {
  categories: Record<HelpCategory, string>;
  description: string;
  eyebrow: string;
  faqTitle: string;
  noResults: string;
  searchLabel: string;
  searchPlaceholder: string;
  sourceNote: string;
  title: string;
  topics: readonly HelpTopic[];
  trendLabel: string;
};

type TopicDefinition = Pick<HelpTopic, 'category' | 'href' | 'id' | 'series' | 'server'>;
type TopicCopy = Pick<HelpTopic, 'answer' | 'cta' | 'keywords' | 'question' | 'steps'>;

const definitions: readonly TopicDefinition[] = [
  {
    id: 'idle-coupon',
    category: 'codes',
    series: 'MapleStory: Idle RPG',
    server: 'gms',
    href: '/content/news/maplestory-idle-rpg-summertime-surprise-coupon-gift?series=maplestory-idle',
  },
  {
    id: 'idle-pc',
    category: 'access',
    series: 'MapleStory: Idle RPG',
    server: 'gms',
    href: '/news?series=maplestory-idle',
  },
  {
    id: 'classic-official',
    category: 'access',
    series: 'MapleStory Classic World',
    server: 'gms',
    href: '/content/news/classic-world-closed-online-test-2-registration?series=maplestory-classic',
  },
  {
    id: 'challenger-world',
    category: 'events',
    series: 'MapleStory',
    server: 'gms',
    href: '/content/events/maplestory-europe-gms-official-news-2025-06-11-27482-challenger-world?series=maplestory-pc',
  },
  {
    id: 'ride-or-die',
    category: 'events',
    series: 'MapleStory',
    server: 'gms',
    href: '/content/events/maplestory-europe-gms-official-news-2025-07-16-28139-update-july-22-ride-or-die-returns?series=maplestory-pc',
  },
  {
    id: 'first-adversary',
    category: 'events',
    series: 'MapleStory',
    server: 'gms',
    href: '/content/events/maplestory-europe-gms-official-news-2026-01-14-34997?series=maplestory-pc',
  },
  {
    id: 'class-choice',
    category: 'progression',
    series: 'MapleStory',
    href: '/wiki/article/Classes',
  },
  {
    id: 'ren-guide',
    category: 'progression',
    series: 'MapleStory',
    server: 'gms',
    href: '/content/events/maplestory-europe-gms-official-news-2025-11-12-32586-tracks-of-the-wanderer?series=maplestory-pc',
  },
  {
    id: 'character-search',
    category: 'progression',
    series: 'MapleStory',
    href: '/rankings',
  },
  {
    id: 'leveling-map',
    category: 'progression',
    series: 'MapleStory',
    href: '/guides/level',
  },
  {
    id: 'client-trouble',
    category: 'access',
    series: 'MapleStory',
    href: '/news?series=maplestory-pc',
  },
  {
    id: 'community-safety',
    category: 'sources',
    series: 'MapleStory family',
    href: '/source',
  },
] as const;

const en: Record<string, TopicCopy> = {
  'idle-coupon': {
    question: 'How do I redeem a MapleStory Idle coupon code, and is it still active?',
    answer: [
      'A coupon search needs a dated official notice, not a copied code list. The linked MPStorys record preserves Nexon’s Summertime Surprise notice, redemption routes, and its expiration so an old code is not presented as current.',
      'Check the account and character before redemption, use only the official entry path named in the notice, and confirm the reward in the correct mailbox. A new code should have its own official publication date and deadline.',
    ],
    steps: ['Open the dated coupon record.', 'Confirm platform, account, and expiration.', 'Redeem through the official route and verify the mailbox.'],
    keywords: ['maplestory idle coupon redeem', 'maplestory idle coupon code', 'maplestory idle codes'],
    cta: 'Check the verified coupon record',
  },
  'idle-pc': {
    question: 'Can I play MapleStory Idle RPG on PC?',
    answer: [
      'Searches for a PC version often lead to third-party installers. MPStorys does not treat an emulator page, APK mirror, or advertisement as proof of official PC support.',
      'Use the official Idle RPG forum to confirm supported platforms and any official PC availability. If the current notice does not name a PC route, do not infer one from another MapleStory game.',
    ],
    steps: ['Check the official platform notice.', 'Match the publisher and download domain.', 'Avoid unofficial clients and account-login prompts.'],
    keywords: ['maplestory idle pc', 'maplestory idle rpg pc', 'maplestory idle rpg download'],
    cta: 'Open Idle RPG official news',
  },
  'classic-official': {
    question: 'Is MapleStory Classic World official, and how does beta access work?',
    answer: [
      'The linked page covers Nexon’s Global MapleStory Classic World test. It separates the official test, application window, eligibility, supported access, and wipe information from private servers using similar “classic” wording.',
      'Always re-check the canonical notice because registration and test dates can change. A community client or nostalgia server is not a substitute for an invitation from the official account channel.',
    ],
    steps: ['Verify the Nexon Classic World notice.', 'Check the current application and test dates.', 'Use only the access instructions sent through the official account.'],
    keywords: ['classic maplestory', 'maplestory classic beta', 'maplestory classic world'],
    cta: 'Read the Classic World test guide',
  },
  'challenger-world': {
    question: 'What is MapleStory Challenger World, and which notice applies?',
    answer: [
      'Challenger World is tied to specific Global MapleStory event notices. Dates, character rules, Burning benefits, transfer conditions, and rewards must be read from the matching season rather than combined across years.',
      'Start with the linked source-backed event, then compare its publication date with the current GMS news feed. This prevents an older World Leap rule from being mistaken for the active event.',
    ],
    steps: ['Identify the event season and server.', 'Read eligibility and transfer rules.', 'Confirm every deadline in the current notice.'],
    keywords: ['maplestory challenger world', 'challenger world maplestory', 'challenger world leap'],
    cta: 'Open the Challenger World record',
  },
  'ride-or-die': {
    question: 'Where can I verify MapleStory Ride or Die rules and updates?',
    answer: [
      'Ride or Die has separate announcement, event, patch-note, and requirement-change records. A search result should therefore lead to the dated source that answers the exact reward, boss, Legion Block, or schedule question.',
      'The linked return-event record is a starting point. Use its canonical Nexon source and follow later notices when a requirement or period was changed.',
    ],
    steps: ['Open the dated event record.', 'Follow the canonical Nexon source.', 'Check for later update or requirement notices.'],
    keywords: ['ride or die', 'maplestory ride or die', 'ride or die legion block'],
    cta: 'Review Ride or Die sources',
  },
  'first-adversary': {
    question: 'What does the MapleStory First Adversary article actually confirm?',
    answer: [
      'The official GMS article confirms the release context and its associated event record. It does not by itself prove every boss mechanic, combat target, reward value, or later Cash Shop package detail.',
      'Use the publication date and GMS label to keep it separate from other regions. Mechanics should be added only when a version-matched official guide or patch note is connected.',
    ],
    steps: ['Confirm the GMS publication context.', 'Separate release, event, and Cash Shop records.', 'Verify mechanics against a version-matched source.'],
    keywords: ['first adversary maplestory', 'maplestory first adversary', 'GMS first adversary'],
    cta: 'Read the source-backed article',
  },
  'class-choice': {
    question: 'Which MapleStory class should I choose?',
    answer: [
      'A useful class answer starts with region, current patch, play style, mobility, party role, funding, and the content you want to clear. A global “best class” claim becomes stale after balance changes.',
      'Use the class index to learn official names and mechanics, then compare current regional patch notes. Treat tier lists as dated opinions rather than permanent rankings.',
    ],
    steps: ['Choose the correct game and region.', 'Compare mechanics with your preferred content.', 'Check the latest regional balance notes.'],
    keywords: ['maplestory class', 'maplestory best class', 'maplestory class guide'],
    cta: 'Browse MapleStory classes',
  },
  'ren-guide': {
    question: 'Where is the reliable MapleStory Ren guide?',
    answer: [
      'Ren searches can refer to a class, launch event, regional release, or community discussion. The linked GMS record is an official launch-event article and does not invent skill priorities or damage values.',
      'Use it to identify the correct release context. A complete class guide still needs current skill documentation and version-matched balance information.',
    ],
    steps: ['Identify whether the question is class or event related.', 'Keep the region and patch visible.', 'Use verified skill data before recommending a build.'],
    keywords: ['maplestory ren guide', 'maplestory ren discord', 'maplestory ren class'],
    cta: 'Open the verified Ren article',
  },
  'character-search': {
    question: 'How do I search a MapleStory character or nickname?',
    answer: [
      'Character lookup depends on the selected regional service because names, worlds, rankings, and public data are not shared across every MapleStory edition.',
      'Choose the correct server first, then search the ranking or character tool. If nothing appears, verify spelling, world, character visibility, and whether that region exposes the requested data.',
    ],
    steps: ['Select the correct regional service.', 'Enter the exact nickname and world.', 'Confirm the result belongs to the intended character.'],
    keywords: ['maplestory character search', 'maplestory nickname search', '메이플 스토리 닉네임 검색'],
    cta: 'Open character rankings',
  },
  'leveling-map': {
    question: 'Which MapleStory map should I use for leveling?',
    answer: [
      'A leveling map depends on level, region, class reach, mobility, Star Force or Arcane requirements, quest progress, Burning state, and current patch availability.',
      'Use the level guide as a route planner rather than a promise of one universal best map. Confirm entry requirements and compare nearby alternatives when the recommended map is crowded or unavailable.',
    ],
    steps: ['Set your level and regional service.', 'Check entry and quest requirements.', 'Compare clear speed and nearby alternatives.'],
    keywords: ['maplestory exp', 'maplestory map', 'maplestory leveling guide'],
    cta: 'Open the leveling guide',
  },
  'client-trouble': {
    question: 'What should I check when MapleStory will not open?',
    answer: [
      'Start by checking current maintenance, known issues, and the official launcher status for the selected region. An outage or scheduled maintenance should be ruled out before changing the local installation.',
      'If the service is online, record the exact error, launcher, region, and time; use official repair and support instructions. Do not download replacement executables from an unrelated search result.',
    ],
    steps: ['Check maintenance and known issues.', 'Record the exact error and regional launcher.', 'Use official repair or support instructions.'],
    keywords: ['maplestory not launching', 'maplestory client error', 'maplestory maintenance'],
    cta: 'Check current MapleStory news',
  },
  'community-safety': {
    question: 'Which MapleStory Discord, Reddit, Wiki, or community source is trustworthy?',
    answer: [
      'A popular query is not proof that a server, invite, download, or guide is official. Check the publisher, domain, invite source, regional scope, publication date, and whether the page links back to an official property.',
      'MPStorys labels official sources and community references separately. Never enter account credentials into a community link, and avoid private servers, cheats, account sales, and suspicious downloads.',
    ],
    steps: ['Check whether the source is official or community-run.', 'Verify domain, date, and regional scope.', 'Keep account credentials on official services only.'],
    keywords: ['maplestory discord', 'reddit maplestory', 'inven maplestory'],
    cta: 'Review source labels',
  },
};

const zh: Record<string, TopicCopy> = {
  'idle-coupon': {
    question: '冒险岛放置版兑换码怎么用，当前还能兑换吗？',
    answer: ['兑换码必须对应带日期的 Nexon 官方公告，不能只看转载的代码列表。本站保留公告、兑换入口和截止时间，避免把过期码写成当前有效。', '兑换前确认账号、角色和平台，按官方入口操作，再检查正确的游戏邮箱。新兑换码必须有新的官方公告和独立有效期。'],
    steps: ['打开带日期的兑换码记录。', '确认平台、账号和截止时间。', '通过官方入口兑换并检查邮箱。'],
    keywords: ['MapleStory Idle兑换码', '冒险岛放置兑换码', 'maplestory idle coupon redeem'],
    cta: '查看已核验兑换码记录',
  },
  'idle-pc': {
    question: 'MapleStory Idle RPG 有电脑版吗？',
    answer: ['“电脑版”搜索常混入模拟器、APK 镜像和非官方安装包，这些页面不能证明官方 PC 支持。', '应从 Idle RPG 官方论坛核对支持平台与下载入口；官方公告没有列出 PC 入口时，不要根据其他冒险岛产品推断。'],
    steps: ['查看官方平台公告。', '核对发行商与下载域名。', '避开非官方客户端和账号登录页。'],
    keywords: ['maplestory idle pc', 'maplestory idle rpg pc', '冒险岛放置电脑版'],
    cta: '查看 Idle RPG 官方资讯',
  },
  'classic-official': {
    question: '冒险岛经典版是官方的吗，测试资格怎么获得？',
    answer: ['这里的 Classic World 指 Nexon Global MapleStory 官方测试，不是“怀旧服”搜索结果里的私人服务器。相关页面会区分报名、资格、平台、测试日期和删档说明。', '报名状态可能变化，必须回到官方公告核对。第三方客户端和所谓提前资格不能代替 Nexon 官方账号通知。'],
    steps: ['确认 Nexon Classic World 公告。', '核对报名与测试时间。', '仅使用官方账号收到的进入说明。'],
    keywords: ['冒险岛经典', '冒险岛怀旧服', 'maplestory classic beta'],
    cta: '阅读 Classic World 测试说明',
  },
  'challenger-world': {
    question: '冒险岛 Challenger World 的规则看哪一篇？',
    answer: ['Challenger World 每一季的日期、角色限制、燃烧增益、转服条件和奖励可能不同，不能把不同年份规则合并使用。', '先打开对应赛季的官方记录，再对照当前 GMS 资讯，避免把旧的 World Leap 规则当成现在仍有效。'],
    steps: ['确认活动年份与服务器。', '阅读资格和转服条件。', '逐项核对当前截止日期。'],
    keywords: ['maplestory challenger world', '冒险岛挑战者世界', 'challenger world leap'],
    cta: '查看 Challenger World 记录',
  },
  'ride-or-die': {
    question: '冒险岛 Ride or Die 活动规则和改动在哪里看？',
    answer: ['Ride or Die 有活动公告、版本说明和需求变更等不同记录。奖励、Boss、Legion Block 或时间问题应进入对应日期的来源。', '从活动记录进入 Nexon 原文，并继续查看后来发布的更新或条件变更，不能只依赖旧攻略。'],
    steps: ['打开带日期的活动记录。', '进入对应 Nexon 原文。', '检查后续更新与需求变更。'],
    keywords: ['maplestory ride or die', 'ride or die', '冒险岛 Ride or Die'],
    cta: '查看 Ride or Die 来源',
  },
  'first-adversary': {
    question: 'MapleStory First Adversary 官方文章确认了哪些内容？',
    answer: ['GMS 原文能够证明上线背景和关联活动，但不能单独证明所有 Boss 机制、战力门槛、奖励数值或后续商城礼包。', '页面保留发布日期与 GMS 范围；具体机制必须连接同版本官方指南或版本说明后才能补充。'],
    steps: ['确认 GMS 发布背景。', '区分上线、活动和商城记录。', '用同版本来源核验机制。'],
    keywords: ['maplestory first adversary', '冒险岛 First Adversary', 'first adversary maplestory'],
    cta: '阅读有来源的专题文章',
  },
  'class-choice': {
    question: '冒险岛职业怎么选，哪个职业适合自己？',
    answer: ['职业选择要结合服务器、当前版本、操作方式、机动性、组队定位、投入和目标内容，不能把一张排行榜当成永久答案。', '先通过职业索引了解技能和定位，再查看所在地区最近的平衡调整；“最强职业”必须标明版本日期。'],
    steps: ['选择正确游戏与服务器。', '按玩法和目标内容比较职业。', '核对最近地区平衡公告。'],
    keywords: ['冒险岛职业推荐', 'maplestory class', '冒险岛职业排行'],
    cta: '浏览职业资料',
  },
  'ren-guide': {
    question: 'MapleStory Ren 攻略和上线活动怎么区分？',
    answer: ['Ren 搜索可能是在找职业机制、上线活动、地区版本或社区。链接页面是 GMS 官方上线活动记录，不会在缺少资料时编造技能加点和伤害结论。', '先确认问题属于职业还是活动，再使用同地区、同版本的技能与平衡来源完善攻略。'],
    steps: ['区分职业问题和活动问题。', '保留服务器与版本信息。', '使用已核验技能数据。'],
    keywords: ['maplestory ren guide', '冒险岛 Ren', 'maplestory ren class'],
    cta: '打开 Ren 官方记录',
  },
  'character-search': {
    question: '怎么查询冒险岛角色、昵称和排名？',
    answer: ['角色名称、世界、排行和公开数据不会在所有地区互通，查询前必须选择正确服务器。', '没有结果时应检查拼写、世界、角色公开状态以及该地区是否提供对应数据，而不是直接认定角色不存在。'],
    steps: ['选择正确地区服务器。', '输入完整昵称与世界。', '确认结果对应目标角色。'],
    keywords: ['冒险岛角色查询', '冒险岛昵称查询', 'maplestory character search'],
    cta: '打开角色排行榜',
  },
  'leveling-map': {
    question: '冒险岛升级去哪里，练级地图怎么选？',
    answer: ['练级地图会受到等级、职业攻击范围、机动性、星之力或神秘力量、前置任务、燃烧状态和版本开放范围影响。', '等级攻略应该作为路线规划，不是唯一最优答案；进入前核对要求，拥挤或效率不合适时比较附近替代地图。'],
    steps: ['设置等级与服务器。', '确认地图与任务门槛。', '比较清怪效率和替代地图。'],
    keywords: ['冒险岛升级攻略', '冒险岛练级地图', 'maplestory exp'],
    cta: '打开等级攻略',
  },
  'client-trouble': {
    question: '冒险岛打不开、启动失败时先检查什么？',
    answer: ['先查看所选地区的维护公告、已知问题和官方启动器状态，排除停机后再改动本地安装。', '服务正常时记录完整错误码、启动器、地区和发生时间，并使用官方修复或客服说明，不要下载搜索结果里的替换程序。'],
    steps: ['检查维护与已知问题。', '记录完整错误和地区启动器。', '使用官方修复与客服入口。'],
    keywords: ['冒险岛打不开', '冒险岛启动失败', 'maplestory client error'],
    cta: '查看当前维护资讯',
  },
  'community-safety': {
    question: '冒险岛 Discord、NGA、Reddit 或 Wiki 哪些可信？',
    answer: ['热门搜索不能证明邀请、下载或攻略属于官方。应核对发布者、域名、邀请来源、地区范围和日期，并查看是否能回到官方页面。', '本站会区分官方来源与社区参考。不要在社区链接输入游戏账号，也不收录私服、作弊、账号交易或可疑下载。'],
    steps: ['确认官方或社区属性。', '核对域名、日期与地区。', '账号凭据只留在官方服务。'],
    keywords: ['nga冒险岛', '冒险岛 discord', '冒险岛 wiki'],
    cta: '查看来源标记说明',
  },
};

const zhHant: Record<string, TopicCopy> = {
  'idle-coupon': {
    question: '楓之谷放置冒險記序號怎麼兌換，現在還有效嗎？',
    answer: ['序號必須對應有日期的 Nexon 官方公告，不能只看轉貼清單。本站保留公告、兌換入口與到期時間，避免把過期序號寫成仍可使用。', '兌換前確認帳號、角色與平台，依官方入口操作，再檢查正確信箱。新序號必須有新的官方公告與獨立期限。'],
    steps: ['開啟有日期的序號記錄。', '確認平台、帳號與期限。', '透過官方入口兌換並檢查信箱。'],
    keywords: ['楓之谷放置冒險記序號', 'MapleStory Idle coupon', 'maplestory idle coupon redeem'],
    cta: '查看已核驗序號記錄',
  },
  'idle-pc': {
    question: '楓之谷放置冒險記有 PC 版嗎？',
    answer: ['PC 搜尋常混入模擬器、APK 鏡像與非官方安裝包，這些頁面不能證明官方支援。', '應從官方論壇核對支援平台與正式下載入口；官方公告沒有列出 PC 路徑時，不要根據其他楓之谷產品推測。'],
    steps: ['查看官方平台公告。', '核對發行商與下載網域。', '避開非官方客戶端與登入頁。'],
    keywords: ['楓之谷放置冒險記 pc', 'maplestory idle pc', '楓之谷放置 pc'],
    cta: '查看放置冒險記官方資訊',
  },
  'classic-official': {
    question: '楓之谷經典版是官方的嗎，測試資格怎麼取得？',
    answer: ['這裡的 Classic World 是 Nexon Global MapleStory 官方測試，不是搜尋結果中的私人懷舊服。頁面分開說明申請、資格、平台、測試日期與資料重置。', '申請狀態可能變動，必須回到官方公告核對；第三方客戶端不能取代官方帳號通知。'],
    steps: ['確認 Nexon Classic World 公告。', '核對申請及測試日期。', '只使用官方帳號提供的進入說明。'],
    keywords: ['楓之谷經典版', '新楓之谷經典版', 'maplestory classic beta'],
    cta: '閱讀 Classic World 測試說明',
  },
  'challenger-world': {
    question: '新楓之谷 Challenger World 規則要看哪一篇？',
    answer: ['每季 Challenger World 的日期、角色限制、燃燒增益、轉移條件與獎勵可能不同，不能混用不同年度規則。', '先開啟對應季度的來源記錄，再比對當前 GMS 資訊，避免把舊 World Leap 規則當成現況。'],
    steps: ['確認活動季度與伺服器。', '閱讀資格與轉移條件。', '核對目前截止時間。'],
    keywords: ['maplestory challenger world', '楓之谷 Challenger World', 'challenger world leap'],
    cta: '查看 Challenger World 記錄',
  },
  'ride-or-die': {
    question: 'MapleStory Ride or Die 活動規則與更新在哪裡？',
    answer: ['Ride or Die 有公告、活動、版本說明與需求變更等不同記錄，獎勵、Boss、Legion Block 或時程問題應進入對應日期來源。', '從活動記錄前往 Nexon 原文，並檢查後續更新，不能只依賴舊攻略。'],
    steps: ['開啟帶日期的活動記錄。', '前往對應 Nexon 原文。', '檢查後續需求變更。'],
    keywords: ['maplestory ride or die', 'ride or die', '楓之谷 Ride or Die'],
    cta: '查看 Ride or Die 來源',
  },
  'first-adversary': {
    question: 'MapleStory First Adversary 官方文章證明了什麼？',
    answer: ['GMS 原文可以證明上線背景與相關活動，但不能單獨證明全部 Boss 機制、戰力門檻、獎勵數值或後續商城禮包。', '頁面保留日期與 GMS 範圍；具體機制必須連接同版本官方指南或更新說明。'],
    steps: ['確認 GMS 發布背景。', '分開上線、活動與商城記錄。', '以同版本來源核驗機制。'],
    keywords: ['maplestory first adversary', '新楓之谷 First Adversary', 'first adversary maplestory'],
    cta: '閱讀有來源的專題',
  },
  'class-choice': {
    question: '新楓之谷職業怎麼選，哪個職業適合自己？',
    answer: ['職業選擇要結合伺服器、版本、操作方式、機動性、隊伍定位、投入與目標內容，不能把單一排行當成永久答案。', '先閱讀職業索引，再核對所在地區最近平衡調整；最強職業說法必須附版本日期。'],
    steps: ['選擇正確遊戲與伺服器。', '按玩法與目標比較職業。', '核對最近平衡公告。'],
    keywords: ['新楓之谷職業', '楓之谷職業推薦', 'maplestory class'],
    cta: '瀏覽職業資料',
  },
  'ren-guide': {
    question: 'MapleStory Ren 攻略與上線活動怎麼分？',
    answer: ['Ren 搜尋可能指職業機制、上線活動或地區版本。連結頁是 GMS 官方活動記錄，不會在缺少資料時編造技能或傷害結論。', '先確認問題屬於職業或活動，再使用同地區、同版本技能與平衡來源。'],
    steps: ['區分職業與活動問題。', '保留伺服器及版本。', '使用已核驗技能資料。'],
    keywords: ['maplestory ren guide', '楓之谷 Ren', 'maplestory ren class'],
    cta: '開啟 Ren 官方記錄',
  },
  'character-search': {
    question: '怎麼查新楓之谷角色、暱稱與排名？',
    answer: ['角色名稱、世界、排行與公開資料不會在所有地區互通，查詢前必須選對伺服器。', '沒有結果時先檢查拼字、世界與公開狀態，再確認該地區是否提供這項資料。'],
    steps: ['選擇正確地區伺服器。', '輸入完整暱稱與世界。', '確認結果屬於目標角色。'],
    keywords: ['新楓之谷角色查詢', '楓之谷暱稱查詢', 'maplestory character search'],
    cta: '開啟角色排行榜',
  },
  'leveling-map': {
    question: '新楓之谷練等地圖怎麼選？',
    answer: ['練等地圖會受等級、職業範圍、機動性、星力或祕法需求、前置任務、燃燒與版本開放範圍影響。', '把等級攻略當成路線規劃而非唯一答案；進場前確認條件，並比較附近替代地圖。'],
    steps: ['設定等級與伺服器。', '確認地圖及任務門檻。', '比較清怪效率與替代地圖。'],
    keywords: ['新楓之谷練等', '楓之谷練功地圖', 'maplestory exp'],
    cta: '開啟等級攻略',
  },
  'client-trouble': {
    question: '新楓之谷開不起來、驗證失敗時先檢查什麼？',
    answer: ['先查看該地區維護公告、已知問題與官方啟動器狀態，排除停機後再修改本機安裝。', '服務正常時記錄完整錯誤碼、啟動器、地區與時間，使用官方修復或客服說明，不下載搜尋結果中的替代程式。'],
    steps: ['檢查維護及已知問題。', '記錄完整錯誤與啟動器。', '使用官方修復及客服入口。'],
    keywords: ['新楓之谷開不起來', '驗證失敗 error sga0004', '楓之谷啟動失敗'],
    cta: '查看目前維護資訊',
  },
  'community-safety': {
    question: '楓之谷 Discord、巴哈、Wiki 或社群來源可信嗎？',
    answer: ['熱門搜尋不能證明邀請、下載或攻略屬於官方。請核對發布者、網域、邀請來源、地區與日期。', '本站分開標示官方來源和社群參考；不要在社群連結輸入遊戲帳密，也不收錄私服、作弊、帳號交易或可疑下載。'],
    steps: ['確認官方或社群屬性。', '核對網域、日期與地區。', '帳號憑證只留在官方服務。'],
    keywords: ['楓之谷 discord', '新楓之谷巴哈', '楓之谷 wiki'],
    cta: '查看來源標記',
  },
};

const ja: Record<string, TopicCopy> = {
  'idle-coupon': {
    question: 'MapleStory Idleのクーポンコードはどこで入力し、まだ使えますか？',
    answer: ['クーポンは日付付きのNexon公式告知で確認します。転載コード一覧だけでは有効性を判断できないため、MPStorysは告知、入力経路、期限を同じ記録にまとめます。', 'アカウント、キャラクター、プラットフォームを確認し、公式経路だけを利用してください。新しいコードには新しい告知と期限が必要です。'],
    steps: ['日付付きクーポン記録を開く。', '対応環境と期限を確認する。', '公式経路で入力しメールボックスを確認する。'],
    keywords: ['MapleStory Idle coupon', 'メイプル 放置 クーポン', 'maplestory idle coupon redeem'],
    cta: '確認済みクーポン記録を見る',
  },
  'idle-pc': {
    question: 'MapleStory Idle RPGはPCで遊べますか？',
    answer: ['PC版検索には非公式エミュレーター、APKミラー、広告が混ざります。それらは公式PC対応の証拠ではありません。', '公式フォーラムで対応プラットフォームと配布経路を確認し、他のMapleStory作品から対応状況を推測しないでください。'],
    steps: ['公式プラットフォーム告知を確認する。', '配信元とドメインを照合する。', '非公式クライアントを避ける。'],
    keywords: ['maplestory idle pc', 'maplestory idle rpg pc', 'メイプル 放置 pc'],
    cta: 'Idle RPG公式情報を見る',
  },
  'classic-official': {
    question: 'MapleStory Classic Worldは公式ですか？テスト参加方法は？',
    answer: ['ここで扱うClassic WorldはNexonのGlobal MapleStory公式テストです。似た名称のプライベートサーバーとは分け、応募、対象地域、日程、データ消去を公式告知で確認します。', '参加状態は変わるため、必ず最新の告知へ戻って確認してください。非公式クライアントは招待の代わりになりません。'],
    steps: ['Nexon公式告知を確認する。', '応募締切とテスト期間を確認する。', '公式アカウントの案内だけを使う。'],
    keywords: ['メイプルストーリー クラシック ワールド', 'MapleStory Classicテスト', 'maplestory classic beta'],
    cta: 'Classic Worldテスト案内を読む',
  },
  'challenger-world': {
    question: 'MapleStory Challenger Worldのルールはどこで確認できますか？',
    answer: ['開催年ごとに期間、キャラクター条件、Burning、移動条件、報酬が変わる可能性があります。別シーズンの情報を混ぜないでください。', '対象シーズンのGMS記録を開き、現在の公式ニュースと日付を照合します。'],
    steps: ['シーズンとサーバーを特定する。', '参加・移動条件を読む。', '現在の締切を確認する。'],
    keywords: ['maplestory challenger world', 'チャレンジャーワールド', 'challenger world leap'],
    cta: 'Challenger World記録を見る',
  },
  'ride-or-die': {
    question: 'MapleStory Ride or Dieのルールと変更点はどこですか？',
    answer: ['Ride or Dieにはイベント告知、パッチノート、条件変更など複数の記録があります。報酬、Boss、Legion Block、期間の質問は対応する日付の出典で確認します。', 'イベント記録からNexon原文を開き、後日更新がないか確認してください。'],
    steps: ['日付付きイベント記録を開く。', 'Nexon原文へ進む。', '後日の変更告知を確認する。'],
    keywords: ['maplestory ride or die', 'ride or die', 'メイプルストーリー Ride or Die'],
    cta: 'Ride or Dieの出典を見る',
  },
  'first-adversary': {
    question: 'MapleStory First Adversaryの公式記事で何が確認できますか？',
    answer: ['GMS記事は実装背景と関連イベントを確認できますが、すべてのBoss仕様、必要戦力、報酬数値、後日のCash Shop商品まで証明するものではありません。', '日付とGMS範囲を残し、仕様は同じバージョンの公式ガイドまたはパッチノートで確認します。'],
    steps: ['GMS公開情報を確認する。', '実装・イベント・商品を分ける。', '同バージョンの出典で仕様を確認する。'],
    keywords: ['maplestory first adversary', 'メイプルストーリー First Adversary', 'first adversary maplestory'],
    cta: '出典付き記事を読む',
  },
  'class-choice': {
    question: 'メイプルストーリーの職業はどう選べばよいですか？',
    answer: ['地域、パッチ、操作感、機動力、パーティ役割、予算、目標コンテンツによって適性は変わります。単一の最強ランキングを恒久的な答えにしません。', '職業一覧で名称と役割を確認し、JMSまたは対象地域の最新バランス告知を照合してください。'],
    steps: ['ゲームと地域を選ぶ。', '遊び方と目標で職業を比較する。', '最新の地域別調整を確認する。'],
    keywords: ['メイプルストーリー 職業', 'メイプルストーリー 職業 おすすめ', 'maplestory class'],
    cta: '職業一覧を見る',
  },
  'ren-guide': {
    question: 'メイプルストーリー レンの攻略はどの地域向けですか？',
    answer: ['レン検索は職業仕様、実装イベント、地域リリースを指す場合があります。リンク先はGMSイベント記録であり、JMSの職業仕様を自動的に証明しません。', '固有名を保ちつつ対象地域とパッチを確認し、スキル情報は同じサービスの公式資料で補います。'],
    steps: ['職業かイベントかを分ける。', '地域とパッチを確認する。', '同地域のスキル資料を使う。'],
    keywords: ['メイプルストーリー レン', 'maplestory ren guide', 'レン 職業'],
    cta: 'GMSのRen記録を見る',
  },
  'character-search': {
    question: 'メイプルストーリーのキャラクター名やランキングを検索するには？',
    answer: ['キャラクター名、ワールド、ランキング公開範囲は地域サービスごとに異なります。最初に正しいサーバーを選択してください。', '見つからない場合は表記、ワールド、公開状態、地域のデータ提供範囲を確認します。'],
    steps: ['対象地域を選択する。', '正確な名前とワールドを入力する。', '本人の結果か確認する。'],
    keywords: ['メイプルストーリー キャラ検索', 'メイプルストーリー ランキング', 'maplestory character search'],
    cta: 'キャラクターランキングを開く',
  },
  'leveling-map': {
    question: 'メイプルストーリーのレベル上げマップはどう選びますか？',
    answer: ['レベル、職業の攻撃範囲、移動、Star ForceやArcane条件、前提クエスト、Burning、地域パッチによって候補は変わります。', 'レベルガイドを経路として使い、入場条件と代替マップを比較してください。'],
    steps: ['レベルと地域を設定する。', '入場・クエスト条件を確認する。', '効率と代替マップを比較する。'],
    keywords: ['メイプルストーリー レベル上げ', 'メイプルストーリー 狩場', 'maplestory exp'],
    cta: 'レベルガイドを開く',
  },
  'client-trouble': {
    question: 'メイプルストーリーが起動しない場合、最初に何を確認しますか？',
    answer: ['対象地域のメンテナンス、既知の問題、公式ランチャー状態を先に確認し、停止中でないことを確かめてからローカル環境を変更します。', 'サービス稼働中ならエラー全文、ランチャー、地域、時刻を記録し、公式修復またはサポート手順を使います。'],
    steps: ['メンテナンスと既知の問題を確認する。', 'エラーと地域を記録する。', '公式修復・サポートを利用する。'],
    keywords: ['メイプルストーリー 起動しない', 'メイプルストーリー エラー', 'maplestory maintenance'],
    cta: '最新ニュースを確認する',
  },
  'community-safety': {
    question: 'メイプルストーリーのDiscord、Wiki、コミュニティは安全ですか？',
    answer: ['人気検索は公式性の証明ではありません。運営者、ドメイン、招待元、対象地域、更新日、公式ページへの参照を確認します。', 'アカウント情報は公式サービスだけに入力し、プライベートサーバー、チート、アカウント売買、不審なダウンロードを避けてください。'],
    steps: ['公式かコミュニティか確認する。', 'ドメイン・日付・地域を確認する。', '認証情報を公式以外へ送らない。'],
    keywords: ['メイプルストーリー discord', 'メイプルストーリー wiki', 'maplestory community'],
    cta: '出典ラベルを見る',
  },
};

const ko: Record<string, TopicCopy> = {
  'idle-coupon': {
    question: '메이플 키우기 쿠폰 코드는 어디서 입력하고 아직 사용할 수 있나요?',
    answer: ['쿠폰은 날짜가 있는 Nexon 공식 공지로 확인해야 합니다. 복사된 코드 목록만으로 유효성을 판단하지 않으며, MPStorys는 공지·입력 경로·만료 시각을 함께 보여 줍니다.', '계정, 캐릭터, 플랫폼을 확인하고 공식 경로만 사용하세요. 새 코드는 새 공식 공지와 별도 기한이 있어야 합니다.'],
    steps: ['날짜가 있는 쿠폰 기록을 연다.', '플랫폼과 만료 시각을 확인한다.', '공식 경로로 입력하고 우편함을 확인한다.'],
    keywords: ['메이플 키우기 쿠폰', '메이플 키우기 쿠폰 코드', 'maplestory idle coupon redeem'],
    cta: '검증된 쿠폰 기록 보기',
  },
  'idle-pc': {
    question: '메이플 키우기를 PC에서 플레이할 수 있나요?',
    answer: ['PC 검색 결과에는 비공식 에뮬레이터, APK 미러, 광고가 섞일 수 있으며 공식 PC 지원의 증거가 아닙니다.', '공식 포럼에서 지원 플랫폼과 배포 경로를 확인하고 다른 MapleStory 게임의 지원 여부를 그대로 적용하지 마세요.'],
    steps: ['공식 플랫폼 공지를 확인한다.', '배급사와 다운로드 도메인을 확인한다.', '비공식 클라이언트를 피한다.'],
    keywords: ['메이플 키우기 pc', 'maplestory idle pc', 'maplestory idle rpg pc'],
    cta: 'Idle RPG 공식 소식 보기',
  },
  'classic-official': {
    question: 'MapleStory Classic World는 공식이며 테스트는 어떻게 참여하나요?',
    answer: ['이 페이지의 Classic World는 Nexon Global MapleStory 공식 테스트입니다. 비슷한 이름의 사설 서버와 구분하고 신청, 자격, 일정, 데이터 초기화를 공식 공지로 확인합니다.', '상태와 일정은 바뀔 수 있으므로 최신 공지를 다시 확인하세요. 비공식 클라이언트는 공식 초대를 대신할 수 없습니다.'],
    steps: ['Nexon Classic World 공지를 확인한다.', '신청 마감과 테스트 기간을 확인한다.', '공식 계정 안내만 사용한다.'],
    keywords: ['메이플스토리 클래식 월드', 'MapleStory Classic 테스트', 'maplestory classic beta'],
    cta: 'Classic World 테스트 안내 읽기',
  },
  'challenger-world': {
    question: 'MapleStory Challenger World 규칙은 어디서 확인하나요?',
    answer: ['시즌마다 기간, 캐릭터 조건, Burning 혜택, 이전 조건, 보상이 달라질 수 있습니다. 다른 연도의 규칙을 섞지 마세요.', '해당 시즌의 GMS 기록을 열고 현재 공식 뉴스 날짜와 비교합니다.'],
    steps: ['시즌과 서버를 확인한다.', '참여 및 이전 조건을 읽는다.', '현재 마감일을 확인한다.'],
    keywords: ['maplestory challenger world', '챌린저 월드 메이플', 'challenger world leap'],
    cta: 'Challenger World 기록 보기',
  },
  'ride-or-die': {
    question: 'MapleStory Ride or Die 규칙과 변경 사항은 어디에 있나요?',
    answer: ['Ride or Die에는 이벤트 공지, 패치 노트, 조건 변경 기록이 따로 있습니다. 보상, Boss, Legion Block, 일정 질문은 해당 날짜 출처에서 확인합니다.', '이벤트 기록에서 Nexon 원문을 열고 이후 변경 공지도 확인하세요.'],
    steps: ['날짜가 있는 이벤트 기록을 연다.', 'Nexon 원문으로 이동한다.', '이후 조건 변경을 확인한다.'],
    keywords: ['maplestory ride or die', 'ride or die', '메이플 Ride or Die'],
    cta: 'Ride or Die 출처 보기',
  },
  'first-adversary': {
    question: 'MapleStory First Adversary 공식 기사가 확인하는 내용은 무엇인가요?',
    answer: ['GMS 기사는 출시 배경과 관련 이벤트를 확인하지만 모든 Boss 패턴, 전투력 기준, 보상 수치, 이후 Cash Shop 상품까지 증명하지 않습니다.', '게시일과 GMS 범위를 유지하고 세부 메커니즘은 같은 버전의 공식 가이드나 패치 노트로 확인합니다.'],
    steps: ['GMS 게시 배경을 확인한다.', '출시·이벤트·상품 기록을 분리한다.', '같은 버전 출처로 메커니즘을 검증한다.'],
    keywords: ['maplestory first adversary', '메이플 First Adversary', 'first adversary maplestory'],
    cta: '출처가 있는 기사 읽기',
  },
  'class-choice': {
    question: '메이플스토리 직업은 어떻게 선택해야 하나요?',
    answer: ['지역, 패치, 조작감, 기동성, 파티 역할, 투자 규모, 목표 콘텐츠에 따라 적합한 직업이 달라집니다. 하나의 최강 순위를 영구적인 답으로 사용하지 않습니다.', '직업 목록으로 명칭과 역할을 확인한 뒤 KMS 또는 선택한 지역의 최신 밸런스 공지를 비교하세요.'],
    steps: ['게임과 지역을 선택한다.', '플레이 방식과 목표로 직업을 비교한다.', '최신 지역 밸런스 공지를 확인한다.'],
    keywords: ['메이플스토리 직업', '메이플스토리 직업추천', 'maplestory class'],
    cta: '직업 자료 보기',
  },
  'ren-guide': {
    question: '메이플스토리 렌 공략은 어느 지역과 버전을 기준으로 하나요?',
    answer: ['렌 검색은 직업 정보, 출시 이벤트, 지역 업데이트를 뜻할 수 있습니다. 링크는 GMS 공식 이벤트 기록이며 KMS의 모든 직업 수치를 자동으로 증명하지 않습니다.', '질문이 직업인지 이벤트인지 구분하고 같은 지역과 패치의 스킬·밸런스 자료를 사용합니다.'],
    steps: ['직업과 이벤트 질문을 구분한다.', '지역과 패치를 확인한다.', '같은 지역의 스킬 자료를 사용한다.'],
    keywords: ['메이플스토리 렌', 'maplestory ren guide', '렌 직업 공략'],
    cta: 'GMS Ren 기록 보기',
  },
  'character-search': {
    question: '메이플스토리 캐릭터와 닉네임을 어떻게 검색하나요?',
    answer: ['캐릭터 이름, 월드, 랭킹 공개 범위는 지역 서비스마다 다릅니다. 먼저 정확한 서버를 선택하세요.', '결과가 없으면 철자, 월드, 공개 상태와 해당 지역의 데이터 제공 범위를 확인합니다.'],
    steps: ['정확한 지역 서버를 선택한다.', '닉네임과 월드를 입력한다.', '원하는 캐릭터인지 확인한다.'],
    keywords: ['메이플 스토리 닉네임 검색', '메이플 캐릭터 검색', '메이플스토리 랭킹'],
    cta: '캐릭터 랭킹 열기',
  },
  'leveling-map': {
    question: '메이플스토리 레벨업 사냥터는 어떻게 선택하나요?',
    answer: ['레벨, 직업 범위, 기동성, Star Force·Arcane 조건, 선행 퀘스트, Burning, 지역 패치에 따라 후보가 달라집니다.', '레벨 가이드를 경로로 사용하고 입장 조건과 대체 사냥터를 비교하세요.'],
    steps: ['레벨과 지역을 설정한다.', '입장 및 퀘스트 조건을 확인한다.', '효율과 대체 사냥터를 비교한다.'],
    keywords: ['메이플스토리 사냥터', '메이플 레벨업', 'maplestory exp'],
    cta: '레벨 가이드 열기',
  },
  'client-trouble': {
    question: '메이플스토리가 실행되지 않을 때 무엇을 먼저 확인하나요?',
    answer: ['선택 지역의 점검, 알려진 문제, 공식 런처 상태를 먼저 확인한 뒤 로컬 설치를 변경합니다.', '서비스가 정상이라면 오류 전문, 런처, 지역, 시각을 기록하고 공식 복구 또는 고객지원 절차를 사용하세요.'],
    steps: ['점검과 알려진 문제를 확인한다.', '오류와 지역 런처를 기록한다.', '공식 복구 및 지원 절차를 사용한다.'],
    keywords: ['메이플스토리 실행 안됨', '메이플 오류', 'maplestory maintenance'],
    cta: '현재 공식 소식 확인',
  },
  'community-safety': {
    question: '메이플스토리 Discord, 인벤, Wiki 커뮤니티는 신뢰할 수 있나요?',
    answer: ['인기 검색어는 공식성을 증명하지 않습니다. 운영자, 도메인, 초대 출처, 지역, 게시일과 공식 페이지 연결을 확인하세요.', '계정 정보는 공식 서비스에만 입력하고 사설 서버, 치트, 계정 거래, 의심스러운 다운로드를 피하세요.'],
    steps: ['공식 또는 커뮤니티 출처인지 확인한다.', '도메인·날짜·지역을 확인한다.', '계정 정보를 공식 외부에 입력하지 않는다.'],
    keywords: ['인벤 메이플', '메이플스토리 디스코드', '메이플스토리 wiki'],
    cta: '출처 라벨 보기',
  },
};

const profileCopy: Record<SupportedLanguage, Omit<HelpCenterProfile, 'topics'>> = {
  en: {
    eyebrow: 'MapleStory problem solver',
    title: 'Find the right answer before you follow a search result',
    description: 'A localized question hub for MapleStory classes, events, codes, launch problems, character searches, and official editions. Each answer keeps its game, region, date, and source visible.',
    searchLabel: 'Search MapleStory questions',
    searchPlaceholder: 'Try “Idle coupon”, “character search”, or “will not open”',
    noResults: 'No matching answer yet. Try a game name, event, class, code, or error.',
    sourceNote: 'Google Trends identifies questions; it does not prove game facts. MPStorys answers only with an official or clearly labeled community source.',
    trendLabel: 'Common player searches',
    faqTitle: 'Problem-solving guides',
    categories: { codes: 'Codes & rewards', access: 'Access & client', events: 'Events & worlds', progression: 'Classes & progression', sources: 'Sources & safety' },
  },
  zh: {
    eyebrow: '冒险岛问题导航',
    title: '先找到正确问题，再进入对应来源',
    description: '按中文玩家的实际搜索习惯整理职业、活动、兑换码、启动问题、角色查询和官方版本。每个答案都保留游戏、地区、日期与来源。',
    searchLabel: '搜索冒险岛问题',
    searchPlaceholder: '例如“放置兑换码”“角色查询”或“打不开”',
    noResults: '暂时没有对应答案，请尝试游戏名、活动、职业、兑换码或错误信息。',
    sourceNote: 'Google Trends 只能发现玩家正在问什么，不能证明游戏事实；本站只使用官方来源或明确标记的社区参考回答。',
    trendLabel: '玩家常用搜索词',
    faqTitle: '问题解决指南',
    categories: { codes: '兑换码与奖励', access: '登录、平台与客户端', events: '活动与世界', progression: '职业与成长', sources: '来源与安全' },
  },
  'zh-Hant': {
    eyebrow: '楓之谷問題導航',
    title: '先確認真正的問題，再進入正確來源',
    description: '依繁中玩家的搜尋語境整理職業、活動、序號、啟動問題、角色查詢與官方版本；每個答案保留遊戲、地區、日期及來源。',
    searchLabel: '搜尋楓之谷問題',
    searchPlaceholder: '例如「放置冒險記序號」「角色查詢」或「開不起來」',
    noResults: '目前沒有相符答案，請改用遊戲名、活動、職業、序號或錯誤訊息。',
    sourceNote: 'Google Trends 只能發現玩家正在詢問什麼，不能證明遊戲事實；本站只用官方來源或清楚標示的社群參考回答。',
    trendLabel: '玩家常用搜尋詞',
    faqTitle: '問題解決指南',
    categories: { codes: '序號與獎勵', access: '登入、平台與客戶端', events: '活動與世界', progression: '職業與成長', sources: '來源與安全' },
  },
  ja: {
    eyebrow: 'メイプルストーリー問題ナビ',
    title: '検索結果を開く前に、質問と対象地域を確認',
    description: '職業、イベント、クーポン、起動問題、キャラクター検索、公式エディションを日本語の検索意図に合わせて整理します。',
    searchLabel: 'メイプルストーリーの質問を検索',
    searchPlaceholder: '「職業」「Idle coupon」「起動しない」など',
    noResults: '一致する回答がありません。ゲーム名、イベント、職業、コード、エラーで検索してください。',
    sourceNote: 'Google Trendsは質問の発見に使い、事実の根拠にはしません。公式または明確に表示したコミュニティ出典で回答します。',
    trendLabel: 'よく使われる検索語',
    faqTitle: '問題解決ガイド',
    categories: { codes: 'コード・報酬', access: 'アクセス・起動', events: 'イベント・ワールド', progression: '職業・育成', sources: '出典・安全' },
  },
  ko: {
    eyebrow: '메이플스토리 문제 해결',
    title: '검색 결과를 열기 전에 질문과 지역부터 확인하세요',
    description: '직업, 이벤트, 쿠폰, 실행 문제, 캐릭터 검색, 공식 에디션을 한국어 검색 의도와 지역 맥락에 맞춰 정리합니다.',
    searchLabel: '메이플스토리 질문 검색',
    searchPlaceholder: '“쿠폰”, “닉네임 검색”, “실행 안됨” 등',
    noResults: '일치하는 답변이 없습니다. 게임명, 이벤트, 직업, 코드 또는 오류로 검색하세요.',
    sourceNote: 'Google Trends는 질문을 찾는 신호일 뿐 사실의 근거가 아닙니다. 공식 또는 명확히 표시한 커뮤니티 출처로만 답합니다.',
    trendLabel: '자주 검색하는 표현',
    faqTitle: '문제 해결 가이드',
    categories: { codes: '쿠폰·보상', access: '접속·클라이언트', events: '이벤트·월드', progression: '직업·성장', sources: '출처·안전' },
  },
};

const localizedTopics: Record<SupportedLanguage, Record<string, TopicCopy>> = {
  en,
  zh,
  'zh-Hant': zhHant,
  ja,
  ko,
};

export const getHelpCenterProfile = (language: SupportedLanguage): HelpCenterProfile => ({
  ...profileCopy[language],
  topics: definitions.map((definition) => ({
    ...definition,
    ...localizedTopics[language][definition.id],
  })),
});

export const getHelpCenterKeywords = (language: SupportedLanguage) => (
  getHelpCenterProfile(language).topics.flatMap((topic) => topic.keywords)
);
