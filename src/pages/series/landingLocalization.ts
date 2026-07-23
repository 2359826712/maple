import type { SupportedLanguage } from '@/i18n/languageRouting';
import type {
  LandingFaq,
  LandingSearchIntent,
  LandingSection,
  SeriesLandingProfile,
  SeriesLandingUiCopy,
} from './landingContent';

type LocalizedLanguage = Exclude<SupportedLanguage, 'en'>;

type LocalSeriesContext = {
  aliases: string[];
  focus: string;
  localName: string;
  marketNote: string;
  trendQueries: string[];
};

const localSeries: Record<LocalizedLanguage, Record<string, LocalSeriesContext>> = {
  zh: {
    'maplestory-pc': {
      localName: '冒险岛',
      aliases: ['MapleStory', 'maplestory', 'Maple Story', '冒险岛国际服', 'GMS冒险岛', 'KMS冒险岛'],
      focus: '职业成长、版本更新、活动期限、Boss、装备系统、维护公告与不同地区服的内容差异',
      marketNote: '简体中文用户常把国际服、韩服、日服和怀旧版本放在同一次搜索中，因此页面必须先标出服务器，再解释内容。',
      trendQueries: ['冒险岛经典', '冒险岛怀旧服', '冒险岛更新', '冒险岛职业推荐'],
    },
    'maplestory-classic': {
      localName: 'MapleStory Classic World',
      aliases: ['冒险岛经典世界', '冒险岛经典版', 'MapleStory Classic', 'MapleStory Classic beta'],
      focus: '官方封闭测试、报名资格、测试时间、客户端入口以及已确认的经典规则',
      marketNote: '“怀旧服”在中文搜索中也可能指向私服，因此只有能够对应 Nexon 官方测试页面的内容才会收录。',
      trendQueries: ['冒险岛经典', '冒险岛经典世界', 'MapleStory Classic报名', 'MapleStory Classic测试'],
    },
    'maplestory-m': {
      localName: 'MapleStory M',
      aliases: ['冒险岛M', 'Maple M', 'MSM MapleStory M', 'MapleStory M Global'],
      focus: '移动端职业、自动战斗、星力地图、成长任务、活动、商店、补丁和不同移动地区服的版本节奏',
      marketNote: '这里讨论的是对应地区的 MapleStory M 服务，不把中国大陆其他授权产品的名称和数据混入同一页面。',
      trendQueries: ['冒险岛M', 'MapleStory M更新', 'MapleStory M职业', 'MapleStory M活动'],
    },
    'maplestory-n': {
      localName: 'MapleStory N',
      aliases: ['冒险岛N', 'MSN MapleStory', 'MapleStory N攻略', 'MapleStory Universe'],
      focus: '官方文档、版本公告、活动任务、排行、概率信息、动态定价和市场服务',
      marketNote: '中文页面保留官方英文产品名，并用中文解释网页服务与游戏系统，避免把 N 当成普通版本号。',
      trendQueries: ['MapleStory N攻略', 'MapleStory N更新', 'MapleStory N活动', 'MapleStory N文档'],
    },
    'maplestory-worlds': {
      localName: 'MapleStory Worlds',
      aliases: ['冒险岛世界', '冒险岛创作平台', 'MSW MapleStory Worlds', 'MapleStory Worlds Creator'],
      focus: '世界发现、创作者工具、脚本、素材、本地化、性能分析、发布政策和平台维护',
      marketNote: '中文检索既有玩家寻找世界，也有开发者寻找 Creator Center；页面会把游玩入口和制作资料分开。',
      trendQueries: ['MapleStory Worlds攻略', 'MapleStory Worlds创作者', '冒险岛世界', 'MSW制作'],
    },
    'maplestory-idle': {
      localName: 'MapleStory: Idle RPG',
      aliases: ['冒险岛放置RPG', '冒险岛Idle', 'MapleStory Idle', 'MapleStory Idle RPG'],
      focus: '放置成长、职业、伙伴、潜能、章节、活动、兑换码、退款说明和服务器重置时间',
      marketNote: '简体中文页面保留全球版正式名称；“兑换码”和“退款”等高频意图必须链接到官方状态或说明，不能复制过期答案。',
      trendQueries: ['MapleStory Idle兑换码', 'MapleStory Idle职业排行', 'MapleStory Idle退款', '冒险岛放置'],
    },
  },
  'zh-Hant': {
    'maplestory-pc': {
      localName: '新楓之谷',
      aliases: ['MapleStory', '楓之谷', '新楓之谷', 'TMS楓之谷', 'GMS楓之谷'],
      focus: '職業養成、版本更新、活動期限、Boss、裝備系統、維護公告與各地區服務差異',
      marketNote: '繁體中文搜尋會同時出現台服用語、國際服用語與韓服先行情報，頁面會保留來源地區而不是把名稱強行統一。',
      trendQueries: ['新楓之谷經典版', '新楓之谷潛水員戴夫', '新楓之谷深淵遠征隊', '楓之谷經典版'],
    },
    'maplestory-classic': {
      localName: 'MapleStory Classic World',
      aliases: ['楓之谷經典版', '新楓之谷經典版', 'MapleStory Classic', 'Classic World測試'],
      focus: '官方封閉測試、報名資格、測試時程、客戶端入口與已確認的經典規則',
      marketNote: '「經典版」可能被非官方服務使用，因此本頁只把 Nexon 公告可驗證的測試資訊視為事實。',
      trendQueries: ['新楓之谷經典版', '楓之谷經典版', 'MapleStory Classic測試', 'Classic World報名'],
    },
    'maplestory-m': {
      localName: '楓之谷M',
      aliases: ['MapleStory M', '楓之谷 M', 'Maple M', 'MSM MapleStory M', '楓之谷M更新日誌'],
      focus: '行動版職業、自動戰鬥、星力戰場、成長任務、活動、商城、更新日誌與不同地區版本',
      marketNote: '台灣玩家常以「楓之谷M」搜尋，但 Global、韓版、日版、台版與東南亞版的日期和數值不能互換。',
      trendQueries: ['楓之谷M更新日誌', '楓之谷M凱殷技能', '楓之谷M職業', '楓之谷M活動'],
    },
    'maplestory-n': {
      localName: 'MapleStory N',
      aliases: ['楓之谷N', 'MapleStory Universe', 'MapleStory N攻略', 'MapleStory N文件'],
      focus: '官方文件、版本公告、活動任務、排行、機率資訊、動態定價與市場服務',
      marketNote: '保留官方英文名稱，並以繁體中文解釋服務關係，避免把區塊鏈、市場或價格資訊延伸成未經證實的承諾。',
      trendQueries: ['MapleStory N攻略', 'MapleStory N更新', 'MapleStory N活動', 'MapleStory N排行'],
    },
    'maplestory-worlds': {
      localName: 'MapleStory Worlds',
      aliases: ['楓之谷世界', '楓之谷創作平台', 'MSW MapleStory Worlds', 'MapleStory Worlds Creator'],
      focus: '世界探索、創作者工具、腳本、素材、多語系在地化、效能分析、發布政策與平台維護',
      marketNote: '玩家找世界與創作者找技術文件是兩種不同意圖，繁中頁會分別提供遊玩入口與 Creator Center 資料。',
      trendQueries: ['MapleStory Worlds攻略', '楓之谷世界', 'MSW創作者', 'MapleStory Worlds在地化'],
    },
    'maplestory-idle': {
      localName: 'MapleStory: Idle RPG',
      aliases: ['楓之谷放置冒險記', '楓之谷放置冒險', '放置楓之谷', 'MapleStory Idle'],
      focus: '放置養成、職業、夥伴、潛能、章節、活動、序號、退款說明與伺服器重置時間',
      marketNote: 'Google Trends 顯示繁中玩家實際使用「楓之谷放置冒險記」與「序號」等詞，因此頁面採用這些搜尋語境，但有效性仍以官方公告為準。',
      trendQueries: ['楓之谷放置冒險記', '楓之谷放置冒險記序號', '楓之谷放置冒險記職業', '楓之谷放置'],
    },
  },
  ja: {
    'maplestory-pc': {
      localName: 'メイプルストーリー',
      aliases: ['MapleStory', 'メイプル', 'JMS メイプルストーリー', 'GMS メイプルストーリー'],
      focus: '職業育成、アップデート、イベント期限、ボス、装備、メンテナンス、地域サービスごとの差分',
      marketNote: '日本語では固有のコラボ名や職業名で検索されることが多いため、JMS の公式表記と海外版の名称を同義語として乱暴に統合しません。',
      trendQueries: ['メイプルストーリー オフイベ', 'メイプルストーリー 運命の少女', 'メイプルストーリー レン', 'メイプルストーリー ハヤト'],
    },
    'maplestory-classic': {
      localName: 'MapleStory Classic World',
      aliases: ['メイプルストーリー クラシック ワールド', 'メイプル クラシック', 'MapleStory Classic beta'],
      focus: '公式クローズドテスト、応募条件、開催期間、クライアント導線、確認済みのクラシック仕様',
      marketNote: '日本向けサービスが確認できない情報は JMS の予定として書かず、Global の公式テスト情報として明示します。',
      trendQueries: ['メイプルストーリー クラシック ワールド', 'MapleStory Classicテスト', 'MapleStory Classic応募'],
    },
    'maplestory-m': {
      localName: 'メイプルストーリーM',
      aliases: ['MapleStory M', 'メイプルM', 'メイプルストーリー M', 'MSM MapleStory M'],
      focus: 'モバイル職業、オートバトル、スターフォース、育成、イベント、ショップ、更新情報と地域版の違い',
      marketNote: '日本公式では「メイプルストーリーM」が使われます。PC版との連携や日本独自のお知らせは JMS の公式情報を優先します。',
      trendQueries: ['メイプルストーリーM 職業', 'メイプルM', 'メイプルストーリーM イベント', 'メイプルストーリーM 攻略'],
    },
    'maplestory-n': {
      localName: 'メイプルストーリーN',
      aliases: ['MapleStory N', 'メイプルストーリー N', 'MapleStory Universe'],
      focus: '公式ドキュメント、更新、イベント、ランキング、確率情報、ダイナミックプライシング、マーケット',
      marketNote: '日本語で説明しても製品名とサービス名は公式表記を維持し、未発表の日本展開や価格を推測しません。',
      trendQueries: ['メイプルストーリーN 攻略', 'MapleStory N アップデート', 'MapleStory N イベント'],
    },
    'maplestory-worlds': {
      localName: 'MapleStory Worlds',
      aliases: ['メイプルストーリーワールド', 'メイプル ワールド', 'MSW MapleStory Worlds', 'MapleStory Worlds Creator'],
      focus: 'ワールド発見、クリエイターツール、スクリプト、素材、ローカライズ、性能分析、公開ポリシー',
      marketNote: 'プレイヤー向けのワールド検索と開発者向け Creator Center を分離し、技術語は公式ドキュメントの表記を優先します。',
      trendQueries: ['MapleStory Worlds 攻略', 'メイプルストーリーワールド', 'MSW 制作', 'MapleStory Worlds Creator'],
    },
    'maplestory-idle': {
      localName: 'MapleStory: Idle RPG',
      aliases: ['メイプルストーリー Idle', 'メイプル 放置', 'MapleStory Idle RPG'],
      focus: '放置育成、職業、仲間、潜在能力、チャプター、イベント、クーポン、返金、サーバーリセット',
      marketNote: '確認できる日本公式名称がない場合は英語の正式名を主表示にし、説明的な日本語を正式タイトルとして扱いません。',
      trendQueries: ['MapleStory Idle RPG coupon', 'MapleStory Idle RPG class', 'メイプル 放置'],
    },
  },
  ko: {
    'maplestory-pc': {
      localName: '메이플스토리',
      aliases: ['MapleStory', '메이플', 'KMS 메이플스토리', '글로벌 메이플스토리'],
      focus: '직업 성장, 업데이트, 이벤트 기간, 보스, 장비, 점검 공지와 지역 서비스별 차이',
      marketNote: '한국 검색어는 선행 업데이트명과 직업명을 빠르게 반영하므로 KMS 정보와 글로벌 출시 여부를 분리해 설명합니다.',
      trendQueries: ['메이플스토리 레테', '메이플스토리 오버드라이브', '메이플스토리 원펀맨', '메이플스토리 업데이트'],
    },
    'maplestory-classic': {
      localName: 'MapleStory Classic World',
      aliases: ['메이플스토리 클래식 월드', '메이플 클래식', 'MapleStory Classic beta'],
      focus: '공식 비공개 테스트, 신청 조건, 테스트 일정, 클라이언트 안내와 확인된 클래식 규칙',
      marketNote: '클래식이나 옛날 메이플이라는 표현이 사설 서버를 가리킬 수 있으므로 Nexon 공식 테스트와 연결되는 정보만 제공합니다.',
      trendQueries: ['메이플스토리 클래식 월드', 'MapleStory Classic 테스트', '메이플 클래식 신청'],
    },
    'maplestory-m': {
      localName: '메이플스토리M',
      aliases: ['MapleStory M', '메이플M', '메이플스토리 M', 'MSM MapleStory M'],
      focus: '모바일 직업, 자동 전투, 스타포스, 성장 미션, 이벤트, 상점, 패치와 지역 서비스 차이',
      marketNote: '한국 메이플스토리M과 글로벌 서비스는 업데이트 순서와 이벤트가 다를 수 있어 KMS 또는 GLB 표기를 제목부터 유지합니다.',
      trendQueries: ['메이플스토리M 사전예약', '메이플스토리M 이벤트', '메이플스토리M 직업추천', '메이플M 업데이트'],
    },
    'maplestory-n': {
      localName: '메이플스토리 N',
      aliases: ['MapleStory N', '메이플스토리N', 'MapleStory Universe', '메이플 유니버스'],
      focus: '공식 문서, 업데이트, 이벤트, 랭킹, 확률 정보, 다이내믹 프라이싱과 마켓플레이스',
      marketNote: '게임과 웹 서비스를 구분하고 공식 문서가 밝힌 범위 밖의 경제적 가치나 가격 전망을 만들지 않습니다.',
      trendQueries: ['메이플스토리 N 공략', '메이플스토리 N 업데이트', '메이플스토리 N 이벤트'],
    },
    'maplestory-worlds': {
      localName: '메이플스토리 월드',
      aliases: ['MapleStory Worlds', '메월드', 'MSW MapleStory Worlds', '메이플스토리 월드 크리에이터'],
      focus: '월드 탐색, 크리에이터 도구, 스크립트, 리소스, 로컬라이징, 성능 분석, 출시 정책',
      marketNote: '한국 커뮤니티에서 널리 쓰는 “메월드”를 검색 별칭으로 포함하되 플레이 정보와 Creator Center 개발 문서를 구분합니다.',
      trendQueries: ['메이플스토리 월드', '메월드', '메이플스토리 월드 제작', '메이플스토리 월드 로컬라이징'],
    },
    'maplestory-idle': {
      localName: '메이플 키우기',
      aliases: ['MapleStory: Idle RPG', '메이플키우기', '메이플 방치형', 'MapleStory Idle'],
      focus: '방치 성장, 직업, 동료, 잠재능력, 챕터, 이벤트, 쿠폰, 환불 안내와 서버 초기화',
      marketNote: '한국 공식 서비스명은 “메이플 키우기”입니다. 영어 제목을 직역하지 않고 한국 공지와 이용자가 실제로 쓰는 용어를 기준으로 구성합니다.',
      trendQueries: ['메이플 키우기 환불', '메이플 키우기 동료', '메이플 키우기 어빌리티', '메이플 키우기 잠재'],
    },
  },
};

const localizedRegions: Record<LocalizedLanguage, Record<string, string>> = {
  zh: { 'NA / EU': '北美／欧洲', Korea: '韩国', Japan: '日本', Taiwan: '中国台湾', 'Southeast Asia': '东南亚' },
  'zh-Hant': { 'NA / EU': '北美／歐洲', Korea: '韓國', Japan: '日本', Taiwan: '臺灣', 'Southeast Asia': '東南亞' },
  ja: { 'NA / EU': '北米／欧州', Korea: '韓国', Japan: '日本', Taiwan: '台湾', 'Southeast Asia': '東南アジア' },
  ko: { 'NA / EU': '북미／유럽', Korea: '한국', Japan: '일본', Taiwan: '대만', 'Southeast Asia': '동남아시아' },
};

const localizedTrendIntents = (
  context: LocalSeriesContext,
  language: LocalizedLanguage,
): LandingSearchIntent[] => context.trendQueries.map((phrase) => ({
  locale: language,
  phrase,
  signal: 'Localized search intent',
}));

const zhCopy = (
  base: SeriesLandingProfile,
  context: LocalSeriesContext,
  region: string,
): Pick<SeriesLandingProfile, 'benefits' | 'deck' | 'faq' | 'sections' | 'title' | 'ui' | 'workflow'> => {
  const name = context.localName;
  const edition = base.editionLabel;
  const aliases = context.aliases.join('、');
  const sections: LandingSection[] = [
    {
      id: 'orientation', eyebrow: '先确认系列与服务器', title: `${name} ${edition} 版本说明`,
      paragraphs: [
        `${name}页面面向${context.focus}。${context.marketNote} 当前页面的地区是${region}，参考时区为${base.timeZone}。同一条“冒险岛更新”可能对应完全不同的产品和服务器，因此在阅读奖励、数值、开放时间或下载方式前，应先确认产品名、服务器、发布日期和官方来源。`,
        `常见检索写法包括${aliases}。这些名称会用于帮助用户找到正确页面，但不会机械地全部塞进每一段文字。大小写与 MapleStory、maplestory、MAPLESTORY 的比较热度一致，因此它们只作为同一实体的规范化别名处理，不建立重复页面。`,
      ],
      bullets: [`当前版本：${edition}`, `地区：${region}`, `参考时区：${base.timeZone}`, `内容重点：${context.focus}`],
    },
    {
      id: 'coverage', eyebrow: '解决实际问题', title: `${name}攻略、新闻、活动与工具如何分工`,
      paragraphs: [
        `落地页不是关键词清单。新闻回答“官方刚刚公布了什么”，活动页确认资格、时间和奖励，攻略解释机制和操作顺序，工具负责计算或查询。中文用户经常把“攻略、职业推荐、兑换码、更新、活动、维护”放在同一次搜索中，本页会根据意图引导到独立的具体页面，而不是让所有问题都回到一个泛化首页。`,
      ],
    },
    {
      id: 'updates', eyebrow: '安全跟进版本变化', title: `${name} ${edition} 更新与公告检查`,
      paragraphs: [
        `涉及${context.focus}时，先查看官方发布日期和最后修订时间，再确认公告属于${edition}。跨服资料可以帮助理解系统背景，但不能证明本服会采用相同日期、名称、数值或奖励。维护延期、已知问题、奖励修正和兑换码过期都可能改变结论，因此摘要必须保留官方链接。`,
      ],
      bullets: ['核对服务器和发布日期', '活动时间按公告时区换算', '过期兑换码只保留为历史记录', '维护与已知问题需要二次确认'],
    },
    {
      id: 'regional', eyebrow: '按中文市场习惯本地化', title: `${edition}术语不是其他服务器的直译`,
      paragraphs: [
        `本地化会考虑中文用户真实使用的产品名、简称、搜索顺序和问题表达，同时保留官方英文、韩文或日文名称以便核对来源。它不会把 KMS 先行内容直接写成 GMS 即将上线，也不会把 TMS 的商品、概率或活动规则套用到其他地区。没有官方中文名的产品继续使用正式英文名，并用中文解释其功能。`,
      ],
    },
    {
      id: 'trends', eyebrow: '趋势研究与别名体系', title: `${name}多语言关键词与上升查询`,
      paragraphs: [
        `Google Trends 研究不只比较 MapleStory 本身，还会比较大小写、分词、服务器简称、中文名称、韩文名称和日文名称。大小写不会产生独立需求；GMS、KMS、JMS、TMS 等裸简称则容易命中其他行业，因此元数据使用“GMS MapleStory”或“GMS冒险岛”这类带产品限定的组合。趋势词只用于发现需要回答的问题，不能作为事实来源。`,
      ],
    },
    {
      id: 'verification', eyebrow: '可复核的编辑流程', title: `${name}内容如何验证`,
      paragraphs: [
        `每条内容先验证精确网址和用途，再记录规范来源、产品、服务器、语言、发布日期和状态。无法确认的字段保持未知；受登录、验证码或反爬限制的页面不会绕过限制。默认只发布摘要和元数据，保留官方链接。私服、外挂、账号交易、可疑下载和无来源的兑换码不会因为搜索量高而被收录。`,
      ],
    },
  ];
  const faq: LandingFaq[] = [
    { question: `这是${name} ${edition}专用页面吗？`, answer: `是。页面以${edition}和${region}为范围。跨服资料只提供背景，日期、奖励、数值和资格必须回到本服官方公告确认。` },
    { question: `为什么同时出现${name}和MapleStory？`, answer: '它们用于覆盖本地常用名与官方国际名称。系统会把大小写和空格差异归一化，不会为同一搜索意图制造重复页面。' },
    { question: '服务器简称可以单独作为关键词吗？', answer: '不建议。GMS、KMS、JMS、TMS 等简称具有歧义，页面和元数据会优先使用带 MapleStory 或本地产品名的限定组合。' },
    { question: 'Google Trends 上升词会自动发布吗？', answer: '不会。趋势只决定核验优先级；只有能对应官方系列、具体用户问题和可靠来源的词才会进入页面。' },
    { question: '其他地区攻略能直接使用吗？', answer: '只能作为背景。界面名称、开放顺序、数值、活动和商店都可能不同，操作前必须核对服务器标签与来源。' },
    { question: '本地化和翻译有什么区别？', answer: '翻译关注句子对应，本地化还会调整产品名、检索词、时间表达、服务器语境、官方入口和用户真正要完成的任务。' },
  ];
  const ui: SeriesLandingUiCopy = {
    benefitEyebrow: '为什么这个入口有用', benefitTitle: '一个产品、一个服务器、一条可靠路径',
    continueEyebrow: `${edition}内容中心`, continueTitle: `继续浏览有来源的${name}内容`,
    demandMap: `${name}搜索主题`, eventsCta: '查看活动', faqEyebrow: '常见问题',
    faqTitle: `${name} ${edition}常见问题`, guidesCta: '查看已验证攻略', localizedIntent: '本地搜索',
    newsCta: `打开${name}新闻`,
    processEyebrow: '四步查找流程', processTitle: `在不丢失服务器语境的情况下找到正确的${name}答案`,
    quickNavigation: '快速导航', relatedIntent: '相关意图', risingIntent: '上升',
    sources: '来源：', toolsCta: '打开工具', trendsChecked: '趋势核验日期',
  };
  return {
    title: `${name} ${edition}攻略、新闻、活动与工具`,
    deck: `面向${region}的${name}服务器专页，结合官方来源、版本核验、本地搜索习惯与多语言别名，并保持完整SSR输出。`,
    benefits: [
      { title: '服务器语境明确', body: `所有时间、活动和系统说明先标记${edition}、${region}与${base.timeZone}。` },
      { title: '本地搜索语言', body: '使用中文玩家真实检索的名称和问题表达，同时保留官方名称与来源。' },
      { title: '趋势驱动但不追词', body: '趋势用于发现问题；可靠来源决定页面能否发布以及应该怎样回答。' },
    ],
    sections,
    workflow: [
      { title: '确认产品与服务器', body: `检查页面是否为${name} ${edition}，不要只看缩写或截图。` },
      { title: '选择任务入口', body: '新闻、攻略、活动和工具回答不同问题，先匹配主要搜索意图。' },
      { title: '核对日期与来源', body: '确认发布时间、状态、时区和规范官方链接。' },
      { title: '执行后再次检查', body: '维护、已知问题、活动和兑换码可能变化，重要操作前重新确认。' },
    ],
    faq,
    ui,
  };
};

const zhHantCopy = (
  base: SeriesLandingProfile,
  context: LocalSeriesContext,
  region: string,
): Pick<SeriesLandingProfile, 'benefits' | 'deck' | 'faq' | 'sections' | 'title' | 'ui' | 'workflow'> => {
  const name = context.localName;
  const edition = base.editionLabel;
  const aliases = context.aliases.join('、');
  const sections: LandingSection[] = [
    { id: 'orientation', eyebrow: '先確認系列與伺服器', title: `${name} ${edition} 版本說明`, paragraphs: [
      `${name}頁面涵蓋${context.focus}。${context.marketNote} 此頁地區為${region}，參考時區是${base.timeZone}。閱讀活動期限、獎勵、數值或下載方式以前，先確認產品、伺服器、發布日期與官方來源。`,
      `常見搜尋名稱包括${aliases}。MapleStory 的大小寫與空格變體在 Trends 中呈現相同熱度，因此只作為同一實體的別名，不建立重複頁面。`,
    ], bullets: [`版本：${edition}`, `地區：${region}`, `時區：${base.timeZone}`, `重點：${context.focus}`] },
    { id: 'coverage', eyebrow: '對應真正的玩家任務', title: `${name}新聞、攻略、活動與工具`, paragraphs: [
      '新聞回答官方公布了什麼，活動頁確認資格與時間，攻略解釋機制和操作順序，工具提供計算或查詢。繁中玩家常把更新日誌、職業、序號、活動與維護放在同一次搜尋中，本頁會導向可獨立使用的具體內容，而不是把所有問題塞進一個泛用首頁。',
    ] },
    { id: 'updates', eyebrow: '安全追蹤更新', title: `${name} ${edition} 公告核對方式`, paragraphs: [
      `處理${context.focus}時，先檢查官方發布與修訂時間，再確認公告是否屬於${edition}。其他地區資料可提供背景，但不能證明本服採用相同日期、名稱、數值或獎勵。維護延長、已知問題與序號失效都需要保留官方連結。`,
    ], bullets: ['核對伺服器與發布日期', '依公告時區換算活動時間', '失效序號只保留歷史狀態', '維護與已知問題要再次確認'] },
    { id: 'regional', eyebrow: '依市場語境在地化', title: `${edition}用語不是跨服直譯`, paragraphs: [
      '在地化會使用玩家真正搜尋的產品名、簡稱、時間說法和任務描述，也保留官方英文、韓文或日文名稱供查證。KMS 先行內容不會被改寫成 GMS 上線承諾，TMS 的活動、機率、商品和更新日誌也不會套用至其他服務。',
    ] },
    { id: 'trends', eyebrow: '多語系趨勢與別名', title: `${name}上升查詢與本地詞`, paragraphs: [
      '研究範圍包含 MapleStory 大小寫、分詞、GMS／KMS／JMS／TMS／MSEA、繁簡中文、韓文與日文名稱。裸縮寫容易命中其他主題，因此 SEO 使用「TMS MapleStory」或「TMS新楓之谷」等限定詞。Trends 只用來發現問題，不會取代官方證據。',
    ] },
    { id: 'verification', eyebrow: '可重複驗證的流程', title: `${name}內容如何收錄`, paragraphs: [
      '每筆內容先確認精確網址、用途、產品、伺服器、語言、日期與狀態。無法確認的欄位維持未知，不繞過登入、驗證碼或反爬限制。預設發布摘要與中繼資料並保留官方連結；私服、外掛、帳號交易、可疑下載與無來源序號不會因搜尋量而收錄。',
    ] },
  ];
  const faq: LandingFaq[] = [
    { question: `這是${name} ${edition}專用頁嗎？`, answer: `是。此頁以${edition}與${region}為範圍；跨服資料只提供背景，日期、數值、獎勵和資格須由本服公告確認。` },
    { question: '為什麼同時出現英文與繁中名稱？', answer: '為了連接官方名稱與玩家實際搜尋方式。大小寫、空格和同義寫法會歸一化，不製造內容重複頁。' },
    { question: 'GMS、KMS、TMS 等縮寫可以單獨使用嗎？', answer: '不建議。縮寫有跨領域歧義，頁面會加上 MapleStory 或本地產品名來限定意圖。' },
    { question: 'Trends 上升詞會直接變成文章嗎？', answer: '不會。它只提高查證優先級；必須能對應官方系列、具體任務和可靠來源才會發布。' },
    { question: '其他地區攻略能直接照做嗎？', answer: '只能當背景。名稱、數值、更新順序、活動和商城可能不同，操作前請核對版本標籤。' },
    { question: '在地化和翻譯的差別是什麼？', answer: '在地化還會調整產品名、搜尋詞、時區表達、官方入口、玩家任務與各地區服務差異。' },
  ];
  const ui: SeriesLandingUiCopy = {
    benefitEyebrow: '這個入口的價值', benefitTitle: '一個產品、一個版本、一條可靠路徑',
    continueEyebrow: `${edition}內容中心`, continueTitle: `繼續瀏覽有來源的${name}內容`,
    demandMap: `${name}搜尋主題`, eventsCta: '查看活動', faqEyebrow: '常見問題',
    faqTitle: `${name} ${edition}常見問題`, guidesCta: '查看已驗證攻略', localizedIntent: '本地搜尋',
    newsCta: `開啟${name}新聞`,
    processEyebrow: '四步查找流程', processTitle: `保留伺服器語境，找到正確的${name}答案`,
    quickNavigation: '快速導覽', relatedIntent: '相關意圖', risingIntent: '上升',
    sources: '來源：', toolsCta: '開啟工具', trendsChecked: '趨勢核驗日期',
  };
  return {
    title: `${name} ${edition}攻略、新聞、活動與工具`,
    deck: `面向${region}的${name}伺服器頁，整合官方來源、版本核驗、繁中搜尋習慣與多語別名，並完整使用SSR。`,
    benefits: [
      { title: '版本語境清楚', body: `所有時程與系統先標記${edition}、${region}和${base.timeZone}。` },
      { title: '真正的在地用語', body: '使用玩家實際搜尋的繁中名稱，同時保留正式名稱供查證。' },
      { title: '趨勢有編輯門檻', body: '趨勢決定先回答什麼；官方證據決定能不能發布。' },
    ],
    sections,
    workflow: [
      { title: '確認產品與版本', body: `確認頁面是${name} ${edition}，不要只看縮寫。` },
      { title: '選擇正確入口', body: '新聞、攻略、活動與工具各自處理不同意圖。' },
      { title: '核對日期和來源', body: '檢查發布時間、狀態、時區與官方網址。' },
      { title: '執行前再確認', body: '維護、已知問題、活動與序號狀態都可能改變。' },
    ],
    faq,
    ui,
  };
};

const jaCopy = (
  base: SeriesLandingProfile,
  context: LocalSeriesContext,
  region: string,
): Pick<SeriesLandingProfile, 'benefits' | 'deck' | 'faq' | 'sections' | 'title' | 'ui' | 'workflow'> => {
  const name = context.localName;
  const edition = base.editionLabel;
  const sections: LandingSection[] = [
    { id: 'orientation', eyebrow: '製品と地域を先に確認', title: `${name} ${edition} ガイドの対象`, paragraphs: [
      `${name}について、${context.focus}を整理します。${context.marketNote} 対象地域は${region}、基準タイムゾーンは${base.timeZone}です。報酬、数値、開催期間、ダウンロード手順を使う前に、製品・地域・公開日・公式ソースを確認してください。`,
      `検索別名は${context.aliases.join('、')}です。MapleStory の大文字・小文字・空白違いは Trends 上で同じ需要を示したため、同一エンティティとして正規化し、重複ページは作りません。`,
    ], bullets: [`対象：${edition}`, `地域：${region}`, `基準時刻：${base.timeZone}`, `主な内容：${context.focus}`] },
    { id: 'coverage', eyebrow: '検索意図ごとに案内', title: `${name}のニュース・攻略・イベント・ツール`, paragraphs: [
      'ニュースは発表内容、イベントは参加条件と期間、攻略は仕組みと手順、ツールは計算や検索を担当します。職業、おすすめ、アップデート、クーポン、メンテナンスといった異なる目的を一つの長文に詰め込まず、独立して役立つページへ案内します。',
    ] },
    { id: 'updates', eyebrow: '更新を安全に追う', title: `${name} ${edition} 公式情報の確認`, paragraphs: [
      `${context.focus}を調べるときは、公開日と更新日、対象地域を確認します。他地域の情報は仕組みを理解する参考にはなりますが、${edition}の実装日、名称、数値、報酬を保証しません。メンテナンス延長、既知の問題、訂正、期限切れは公式リンクで再確認します。`,
    ], bullets: ['地域と公開日を確認', '告知に記載された時刻を使用', '期限切れ情報は履歴として表示', '既知の問題は更新後に再確認'] },
    { id: 'regional', eyebrow: '日本語市場向けローカライズ', title: '翻訳ではなくサービス文脈を合わせる', paragraphs: [
      '日本語化では公式の製品名、職業名、コラボ名、検索語順、時刻表現を優先します。KMS の先行情報を JMS の実装予定として書いたり、GMS の報酬表を日本サービスに流用したりしません。日本公式名が確認できない製品は英語の正式名を維持します。',
    ] },
    { id: 'trends', eyebrow: '多言語トレンドと略称', title: `${name}の検索バリエーション`, paragraphs: [
      '調査対象は英字の大小、Maple Story の分かち書き、GMS・KMS・JMS・TMS・MSEA、日本語、韓国語、中国語の名称です。裸の略称は他分野と混ざるため、「JMS メイプルストーリー」のように製品名を付けます。上昇クエリは記事候補であり、事実の証明ではありません。',
    ] },
    { id: 'verification', eyebrow: '確認可能な編集方針', title: `${name}情報の採用基準`, paragraphs: [
      '正確なURLと用途を確認し、製品、地域、言語、日付、状態、canonical sourceを記録します。不明な項目は推測せず、ログインやCAPTCHAを回避しません。通常は要約とメタデータを掲載し、公式リンクを保持します。非公式サーバー、不正ツール、アカウント売買、怪しいダウンロードは除外します。',
    ] },
  ];
  const faq: LandingFaq[] = [
    { question: `このページは${name} ${edition}専用ですか？`, answer: `はい。対象は${edition}と${region}です。他地域の情報は背景として扱い、日付・数値・報酬は対象地域の公式告知で確認します。` },
    { question: '英語名と日本語名を両方使う理由は？', answer: '公式名と実際の検索語を接続するためです。大文字小文字や空白の違いは正規化し、重複ページを作りません。' },
    { question: 'JMSやKMSだけで検索対策できますか？', answer: '略称だけでは別の意味が混ざります。MapleStory またはローカル製品名を付けて意図を限定します。' },
    { question: 'Google Trendsの上昇語は自動で掲載されますか？', answer: 'いいえ。公式シリーズに対応し、具体的な疑問を解決でき、信頼できる出典がある場合だけ採用します。' },
    { question: '海外版の攻略をそのまま使えますか？', answer: '参考にはできますが、名称、数値、実装順、イベント、ショップが異なる可能性があります。' },
    { question: 'ローカライズは翻訳とどう違いますか？', answer: '製品名、検索表現、時刻、公式導線、プレイヤーの目的、地域サービスの差まで調整します。' },
  ];
  const ui: SeriesLandingUiCopy = {
    benefitEyebrow: 'このハブの価値', benefitTitle: '一つの製品、一つの地域、信頼できる導線',
    continueEyebrow: `${edition}コンテンツハブ`, continueTitle: `出典付きの${name}ページを続けて見る`,
    demandMap: `${name}検索トピック`, eventsCta: 'イベントを見る', faqEyebrow: 'よくある質問',
    faqTitle: `${name} ${edition} FAQ`, guidesCta: '確認済み攻略を見る', localizedIntent: 'ローカル検索',
    newsCta: `${name}ニュースを開く`,
    processEyebrow: '4ステップ', processTitle: `地域情報を保ったまま${name}の答えを探す`,
    quickNavigation: 'クイックナビ', relatedIntent: '関連意図', risingIntent: '上昇',
    sources: '出典：', toolsCta: 'ツールを開く', trendsChecked: 'トレンド確認日',
  };
  return {
    title: `${name} ${edition} 攻略・ニュース・イベント・ツール`,
    deck: `${region}向けの${name}ページです。公式ソース、地域差、日本語の検索習慣、多言語別名を整理し、SSRで全文を配信します。`,
    benefits: [
      { title: '地域を明確化', body: `${edition}、${region}、${base.timeZone}を先に示します。` },
      { title: '検索に自然な日本語', body: '実際に使われる名称を採用し、公式表記を確認できる形で残します。' },
      { title: 'トレンドに編集基準', body: '需要は優先順位に使い、掲載可否は公式証拠で判断します。' },
    ],
    sections,
    workflow: [
      { title: '製品と地域を確認', body: `${name} ${edition}のページか確認します。` },
      { title: '目的別ページを選択', body: 'ニュース、攻略、イベント、ツールを目的で使い分けます。' },
      { title: '日付と出典を確認', body: '公開日、状態、時刻、公式URLを確認します。' },
      { title: '実行前に再確認', body: 'メンテナンス、イベント、クーポンは変更される場合があります。' },
    ],
    faq,
    ui,
  };
};

const koCopy = (
  base: SeriesLandingProfile,
  context: LocalSeriesContext,
  region: string,
): Pick<SeriesLandingProfile, 'benefits' | 'deck' | 'faq' | 'sections' | 'title' | 'ui' | 'workflow'> => {
  const name = context.localName;
  const edition = base.editionLabel;
  const sections: LandingSection[] = [
    { id: 'orientation', eyebrow: '게임과 지역부터 확인', title: `${name} ${edition} 안내 범위`, paragraphs: [
      `${name}의 ${context.focus} 정보를 정리합니다. ${context.marketNote} 이 페이지의 지역은 ${region}, 기준 시간대는 ${base.timeZone}입니다. 보상, 수치, 일정, 다운로드 방법을 적용하기 전에 제품명, 서비스 지역, 게시일과 공식 출처를 확인해야 합니다.`,
      `검색 별칭은 ${context.aliases.join(', ')}입니다. MapleStory의 대소문자와 띄어쓰기 변형은 Trends에서 같은 수요로 나타났으므로 하나의 엔티티로 정규화하고 중복 페이지를 만들지 않습니다.`,
    ], bullets: [`서비스: ${edition}`, `지역: ${region}`, `기준 시간대: ${base.timeZone}`, `핵심 범위: ${context.focus}`] },
    { id: 'coverage', eyebrow: '검색 목적에 맞는 페이지', title: `${name} 뉴스·가이드·이벤트·도구`, paragraphs: [
      '뉴스는 공식 발표, 이벤트는 참여 조건과 기간, 가이드는 시스템과 순서, 도구는 계산과 조회를 담당합니다. 직업 추천, 업데이트, 쿠폰, 이벤트, 점검처럼 서로 다른 질문을 한 페이지에 반복하지 않고 각각 독립적으로 유용한 상세 페이지로 연결합니다.',
    ] },
    { id: 'updates', eyebrow: '업데이트를 안전하게 확인', title: `${name} ${edition} 공지 확인법`, paragraphs: [
      `${context.focus}을 확인할 때는 게시일과 수정일, 대상 서비스를 먼저 봅니다. 다른 지역 자료는 배경이 될 수 있지만 ${edition}의 출시일, 명칭, 수치, 보상을 보장하지 않습니다. 점검 연장, 알려진 문제, 보상 수정, 쿠폰 만료는 공식 링크에서 다시 확인합니다.`,
    ], bullets: ['서비스와 게시일 확인', '공지에 적힌 시간대 사용', '만료 정보는 기록으로만 유지', '점검과 오류 공지는 재확인'] },
    { id: 'regional', eyebrow: '한국 검색 환경에 맞춘 로컬라이징', title: '문장 번역이 아닌 서비스 문맥', paragraphs: [
      '공식 한국 제품명, 직업명, 업데이트명, 이용자가 실제로 쓰는 줄임말과 질문 순서를 반영합니다. KMS 선행 정보를 GMS 출시 확정처럼 쓰지 않고, 글로벌 보상표를 한국 서비스에 적용하지 않습니다. 공식 한국 명칭이 없는 제품은 영어 정식명을 유지하고 한국어로 기능을 설명합니다.',
    ] },
    { id: 'trends', eyebrow: '다국어 트렌드와 별칭', title: `${name} 검색어 변형`, paragraphs: [
      '영문 대소문자, Maple Story 띄어쓰기, GMS·KMS·JMS·TMS·MSEA, 한국어·일본어·중국어 제품명을 함께 조사합니다. KMS 같은 단독 약어는 다른 분야 결과가 섞이므로 “KMS 메이플스토리”처럼 제품명을 붙입니다. 상승 검색어는 조사 우선순위이지 사실의 근거가 아닙니다.',
    ] },
    { id: 'verification', eyebrow: '검증 가능한 편집 기준', title: `${name} 정보 수집 방식`, paragraphs: [
      '정확한 URL과 기능을 확인하고 제품, 서비스, 언어, 게시일, 상태, 원문 링크를 기록합니다. 모르는 값은 추측하지 않고 로그인이나 CAPTCHA를 우회하지 않습니다. 기본적으로 요약과 메타데이터를 제공하며 공식 링크를 유지합니다. 사설 서버, 불법 도구, 계정 거래, 의심스러운 다운로드는 검색량과 관계없이 제외합니다.',
    ] },
  ];
  const faq: LandingFaq[] = [
    { question: `이 페이지는 ${name} ${edition} 전용인가요?`, answer: `네. ${edition}과 ${region}을 기준으로 합니다. 다른 지역 정보는 배경으로만 쓰며 일정, 수치, 보상은 해당 서비스 공지에서 확인합니다.` },
    { question: '영문명과 한국어 이름을 함께 쓰는 이유는 무엇인가요?', answer: '공식 국제 명칭과 실제 검색어를 연결하기 위해서입니다. 대소문자와 띄어쓰기 차이는 정규화해 중복 페이지를 만들지 않습니다.' },
    { question: 'KMS나 GMS 약어만 SEO 키워드로 써도 되나요?', answer: '약어는 다른 의미가 섞일 수 있습니다. MapleStory 또는 한국어 제품명을 함께 사용해 검색 의도를 명확히 합니다.' },
    { question: 'Google Trends 상승어를 자동으로 게시하나요?', answer: '아닙니다. 공식 시리즈와 연결되고 구체적인 질문을 해결하며 신뢰할 출처가 있을 때만 반영합니다.' },
    { question: '다른 지역 가이드를 그대로 사용할 수 있나요?', answer: '배경 참고는 가능하지만 명칭, 수치, 업데이트 순서, 이벤트와 상점이 다를 수 있습니다.' },
    { question: '로컬라이징과 번역은 어떻게 다른가요?', answer: '제품명, 검색 표현, 시간대, 공식 링크, 이용자의 실제 과업과 서비스 차이까지 맞춥니다.' },
  ];
  const ui: SeriesLandingUiCopy = {
    benefitEyebrow: '이 허브가 유용한 이유', benefitTitle: '하나의 제품, 하나의 서비스, 신뢰할 수 있는 경로',
    continueEyebrow: `${edition} 콘텐츠 허브`, continueTitle: `출처가 있는 ${name} 페이지 더 보기`,
    demandMap: `${name} 검색 주제`, eventsCta: '이벤트 보기', faqEyebrow: '자주 묻는 질문',
    faqTitle: `${name} ${edition} FAQ`, guidesCta: '검증된 가이드 보기', localizedIntent: '지역 검색',
    newsCta: `${name} 뉴스 열기`,
    processEyebrow: '4단계 확인 절차', processTitle: `지역 문맥을 유지하며 ${name} 답변 찾기`,
    quickNavigation: '빠른 이동', relatedIntent: '관련 의도', risingIntent: '상승',
    sources: '출처:', toolsCta: '도구 열기', trendsChecked: '트렌드 확인일',
  };
  return {
    title: `${name} ${edition} 가이드·뉴스·이벤트·도구`,
    deck: `${region}용 ${name} 페이지입니다. 공식 출처, 서비스 차이, 한국 검색 습관과 다국어 별칭을 정리하고 SSR로 전체 내용을 제공합니다.`,
    benefits: [
      { title: '서비스 문맥 표시', body: `${edition}, ${region}, ${base.timeZone}을 먼저 표시합니다.` },
      { title: '실제 한국 검색어', body: '이용자가 쓰는 이름을 반영하면서 공식 명칭과 출처를 유지합니다.' },
      { title: '트렌드와 검증 분리', body: '수요는 우선순위에 쓰고 게시 여부는 공식 증거로 판단합니다.' },
    ],
    sections,
    workflow: [
      { title: '제품과 서비스 확인', body: `${name} ${edition} 페이지인지 확인합니다.` },
      { title: '목적에 맞는 메뉴 선택', body: '뉴스, 가이드, 이벤트, 도구를 질문에 따라 선택합니다.' },
      { title: '날짜와 출처 확인', body: '게시일, 상태, 시간대, 공식 URL을 확인합니다.' },
      { title: '실행 전 재확인', body: '점검, 이벤트, 쿠폰과 오류 상태는 바뀔 수 있습니다.' },
    ],
    faq,
    ui,
  };
};

export const localizeSeriesLandingProfile = (
  profile: SeriesLandingProfile,
  language: SupportedLanguage,
): SeriesLandingProfile => {
  if (language === 'en') return profile;
  const context = localSeries[language][profile.seriesId];
  if (!context) return profile;
  const region = localizedRegions[language][profile.region] || profile.region;
  const copy = language === 'zh'
    ? zhCopy(profile, context, region)
    : language === 'zh-Hant'
      ? zhHantCopy(profile, context, region)
      : language === 'ja'
        ? jaCopy(profile, context, region)
        : koCopy(profile, context, region);
  const globalRising = profile.searchIntents
    .filter((intent) => intent.signal === 'Google Trends rising')
    .slice(0, 3);

  return {
    ...profile,
    ...copy,
    aliases: [...new Set([context.localName, ...context.aliases, ...profile.aliases])],
    region,
    searchIntents: [
      ...localizedTrendIntents(context, language),
      ...globalRising,
    ],
    seriesName: context.localName,
  };
};
