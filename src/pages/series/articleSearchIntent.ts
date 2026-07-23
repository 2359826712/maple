import type { SupportedLanguage } from '@/i18n/languageRouting';

export type ArticleIntentSection = {
  title: string;
  paragraphs: readonly string[];
};

export type ArticleIntentFaq = {
  answer: string;
  question: string;
};

export type ArticleSearchIntentProfile = {
  description: string;
  eyebrow: string;
  faq: readonly ArticleIntentFaq[];
  keywords: readonly string[];
  sections: readonly ArticleIntentSection[];
  title: string;
};

export type ArticleSearchIntentTarget = {
  contentId?: string;
  sourceUrl?: string;
};

const FIRST_ADVERSARY_ID = 'maplestory-europe-gms-official-news-2026-01-14-34997';
const CLASSIC_TEST_ID = 'classic-world-closed-online-test-2-registration';
const REN_EVENT_ID = 'maplestory-europe-gms-official-news-2025-11-12-32586-tracks-of-the-wanderer';
export const IDLE_SUMMER_COUPON_URL = 'https://forum.nexon.com/maplestoryidle/board_view?board=6676&thread=3474590';

const normalizeUrl = (value = '') => {
  try {
    const url = new URL(value);
    url.hash = '';
    url.searchParams.sort();
    return url.toString();
  } catch {
    return value;
  }
};

type ProfileFactory = (language: SupportedLanguage) => ArticleSearchIntentProfile;

const firstAdversaryProfile: ProfileFactory = (language) => {
  if (language === 'zh') {
    return {
      eyebrow: 'GMS 官方事件说明',
      title: 'MapleStory First Adversary：这篇官方文章确认了什么',
      description: '“maplestory first adversary”指向 Global MapleStory 在 2026 年 1 月发布的官方内容。这里把发布日期、活动窗口和信息边界放在同一篇文章内，避免把 Boss 上线公告、活动奖励与后续商城礼包混成一个搜索结果。',
      keywords: ['maplestory first adversary', 'MapleStory First Adversary', '冒险岛 First Adversary', 'GMS First Adversary'],
      sections: [
        {
          title: '先确认搜索对象',
          paragraphs: [
            'First Adversary 是这篇 Nexon GMS 官方公告使用的英文名称。MPStorys 保留英文专名，是因为简体中文玩家搜索 GMS 内容时也常直接使用英文更新名；页面同时写明“冒险岛”和 GMS，帮助搜索引擎区分它与其他游戏或非官方项目。',
            '本站记录的原始标题为 “Now Available: The First Adversary!”；页面中的 Undying Purpose Event 是该官方公告下的活动记录。两者属于同一条 Nexon 来源，但回答的意图不同：一个是内容上线查询，另一个是活动时间与参与信息。',
          ],
        },
        {
          title: '日期与服务器范围',
          paragraphs: [
            '官方文章发布于 2026 年 1 月 14 日，本站结构化事件窗口记录为 1 月 15 日开始、2 月 3 日结束。日期按原始 GMS 记录展示，不应直接套用到 KMS、JMS、TMS 或 MSEA。',
            '活动已经结束，因此这篇文章用于历史核验、版本追踪和查找官方来源，而不是把旧奖励包装成当前可领取内容。遇到重新开放或规则调整时，应以新的 Nexon 公告为准。',
          ],
        },
        {
          title: '为什么不在系列落地页重复这个词',
          paragraphs: [
            '“maplestory first adversary”只出现在与 First Adversary 直接相关的文章正文和元数据中。系列首页只负责选择产品、服务器和内容入口，不再罗列一组没有答案的趋势词。',
            '这种结构让关键词周围同时出现官方标题、发布日期、适用服务器、事件状态和来源链接。Google 获取到的是能够回答问题的文章，而不是为了密度而拼接的词表。',
          ],
        },
        {
          title: '阅读与核验建议',
          paragraphs: [
            '先检查页面顶部的 GMS 标记和发布日期，再打开文末 Nexon 原文。若要查 Boss 机制、进入条件或奖励数值，应继续寻找同版本的官方 Boss 指南或补丁说明，不能仅凭活动图片推断。',
            '商城中出现的 First Adversary Package 是另一类 Cash Shop 内容。它可以与本公告互相链接，但礼包上架时间、价格和物品清单必须由各自商城公告证明。',
          ],
        },
      ],
      faq: [
        { question: 'MapleStory First Adversary 是 GMS 内容吗？', answer: '是。本页绑定 Global MapleStory 的 Nexon 官方公告，并保留 GMS 的发布日期和事件窗口。' },
        { question: '现在还能参加 Undying Purpose Event 吗？', answer: '本站记录的活动结束时间是 2026 年 2 月 3 日，因此该记录目前属于历史内容。' },
        { question: '这里会提供未经核实的 Boss 数值吗？', answer: '不会。文章只使用已绑定来源的事实；机制、战力和奖励需要单独的可信版本来源。' },
      ],
    };
  }
  if (language === 'zh-Hant') {
    return {
      eyebrow: 'GMS 官方活動脈絡',
      title: 'MapleStory First Adversary：官方文章與活動時間整理',
      description: '「maplestory first adversary」對應 Global MapleStory 的官方公告。本頁集中說明英文專名、發布日期、活動狀態與資料邊界，不把 Boss 上線、活動與商城禮包混為同一件事。',
      keywords: ['maplestory first adversary', 'MapleStory First Adversary', '新楓之谷 First Adversary', 'GMS First Adversary'],
      sections: [
        { title: '確認查詢對象', paragraphs: ['Nexon 原始標題是 “Now Available: The First Adversary!”。繁中玩家查找 GMS 內容時常沿用英文更新名，因此本頁保留 First Adversary，並搭配 Global MapleStory 與新楓之谷語境。', 'Undying Purpose Event 是同一篇官方來源下的活動記錄；它與 Boss 上線資訊相關，但不是後續 Cash Shop 禮包公告。'] },
        { title: '發布與活動狀態', paragraphs: ['官方文章發布於 2026 年 1 月 14 日，MPStorys 記錄的活動期間為 1 月 15 日至 2 月 3 日。這些日期屬於 GMS，不能直接套用到其他區域版本。', '活動現已結束。本頁保留作為歷史查證與官方來源入口，不會將過期內容標示為仍可領取。'] },
        { title: '關鍵詞放在文章而非落地頁', paragraphs: ['「maplestory first adversary」只配置到直接相關的文章。系列落地頁不再展示趨勢詞清單，避免同一組詞出現在每個伺服器頁面。', '文章把查詢詞放在標題脈絡、日期、區域與來源旁，讓搜尋結果對應一個能解答問題的網址。'] },
        { title: '如何繼續核驗', paragraphs: ['先確認 GMS 標籤與日期，再開啟文末 Nexon 原文。Boss 機制、需求與獎勵數值需要相同版本的官方指南或更新說明。', 'First Adversary Package 屬於商城內容；其價格、期間與品項應由各自 Cash Shop 公告證明。'] },
      ],
      faq: [
        { question: 'First Adversary 是 GMS 內容嗎？', answer: '是，本頁連結 Global MapleStory 的 Nexon 官方公告。' },
        { question: '活動現在仍然有效嗎？', answer: '否，本站記錄的結束時間是 2026 年 2 月 3 日。' },
        { question: '會補上未經證實的攻略數值嗎？', answer: '不會；沒有可靠版本來源的戰力、機制與獎勵不會被當成事實。' },
      ],
    };
  }
  if (language === 'ja') {
    return {
      eyebrow: 'GMS公式記事の整理',
      title: 'MapleStory First Adversary：公式発表とイベント期間',
      description: '「maplestory first adversary」はGlobal MapleStoryの公式記事に対応する検索です。英語の固有名、公開日、イベント状態、Cash Shop記事との違いをこの関連記事で整理します。',
      keywords: ['maplestory first adversary', 'MapleStory First Adversary', 'GMS First Adversary', 'メイプルストーリー First Adversary'],
      sections: [
        { title: '検索対象を特定する', paragraphs: ['Nexonの記事タイトルは “Now Available: The First Adversary!” です。GMS固有の名称なので、英語名を残しながらGlobal MapleStoryの記事であることを明示しています。', 'Undying Purpose Eventは同じ公式記事から整理したイベント記録です。後日掲載されたFirst Adversary PackageのCash Shop情報とは別に扱います。'] },
        { title: '日付と地域', paragraphs: ['記事は2026年1月14日に公開され、MPStorysのイベント記録は1月15日から2月3日までです。GMSの日付であり、JMSやKMSの実施を示すものではありません。', '現在は終了済みの履歴記事です。再開催や仕様変更は新しい公式告知で確認してください。'] },
        { title: 'トレンド語を記事へ割り当てる理由', paragraphs: ['「maplestory first adversary」は関連するこの記事だけに配置し、シリーズやサーバーのランディングページでは一覧表示しません。', '検索語の近くに公式タイトル、日付、地域、状態、出典を置くことで、単なるキーワード密度ではなく回答ページとして評価できる構造にしています。'] },
        { title: '確認手順', paragraphs: ['GMS表示と公開日を確認してから、末尾のNexon原文を開いてください。ボスの数値や攻略は同じバージョンの公式ガイドが必要です。', 'Cash Shopパッケージの価格や販売期間は、個別のCash Shop告知を参照してください。'] },
      ],
      faq: [
        { question: 'First AdversaryはGMSの記事ですか？', answer: 'はい。Global MapleStoryのNexon公式記事に紐づいています。' },
        { question: 'イベントは開催中ですか？', answer: 'いいえ。記録上の終了日は2026年2月3日です。' },
        { question: '未確認の攻略数値も掲載しますか？', answer: 'いいえ。信頼できる同一バージョンの出典がない数値は掲載しません。' },
      ],
    };
  }
  if (language === 'ko') {
    return {
      eyebrow: 'GMS 공식 기사 맥락',
      title: 'MapleStory First Adversary 공식 발표와 이벤트 기간',
      description: '“maplestory first adversary” 검색은 Global MapleStory 공식 기사와 연결됩니다. 영어 고유명, 게시일, 이벤트 상태, 캐시샵 패키지와의 차이를 관련 기사 안에서 설명합니다.',
      keywords: ['maplestory first adversary', 'MapleStory First Adversary', 'GMS First Adversary', '메이플스토리 First Adversary'],
      sections: [
        { title: '검색 대상 확인', paragraphs: ['Nexon 원문 제목은 “Now Available: The First Adversary!”입니다. GMS 고유 명칭을 유지하고 Global MapleStory 기사임을 함께 표시합니다.', 'Undying Purpose Event는 같은 공식 출처에서 분리한 이벤트 기록입니다. 이후의 First Adversary Package 캐시샵 공지와는 다른 정보입니다.'] },
        { title: '날짜와 서비스 범위', paragraphs: ['공식 글은 2026년 1월 14일 게시되었고 MPStorys 이벤트 기록은 1월 15일부터 2월 3일까지입니다. GMS 일정이며 KMS 일정으로 해석하면 안 됩니다.', '현재는 종료된 기록입니다. 재진행 여부는 새로운 공식 공지에서 다시 확인해야 합니다.'] },
        { title: '상승 검색어를 기사에 배치하는 이유', paragraphs: ['“maplestory first adversary”는 직접 관련된 이 기사에만 배치하며 시리즈·서버 랜딩 페이지에는 검색어 목록을 노출하지 않습니다.', '공식 제목, 날짜, 지역, 상태, 출처와 함께 검색어를 설명해 단순 반복이 아닌 실제 답변 페이지를 만듭니다.'] },
        { title: '검증 순서', paragraphs: ['GMS 표시와 날짜를 확인한 뒤 하단의 Nexon 원문을 여세요. 보스 수치와 공략은 같은 버전의 공식 가이드가 필요합니다.', '캐시샵 패키지 가격과 판매 기간은 해당 Cash Shop 공지에서 별도로 확인해야 합니다.'] },
      ],
      faq: [
        { question: 'First Adversary는 GMS 콘텐츠인가요?', answer: '네. Global MapleStory Nexon 공식 기사에 연결된 기록입니다.' },
        { question: '이벤트가 아직 진행 중인가요?', answer: '아니요. 기록상 종료일은 2026년 2월 3일입니다.' },
        { question: '확인되지 않은 보스 수치도 제공하나요?', answer: '아니요. 같은 버전의 신뢰할 출처가 없는 수치는 게시하지 않습니다.' },
      ],
    };
  }
  return {
    eyebrow: 'Official GMS article context',
    title: 'MapleStory First Adversary: what the official article confirms',
    description: 'The rising query “maplestory first adversary” belongs on this source-backed Global MapleStory article, not on every server landing page. This guide identifies the official name, publication date, event state, and the boundary between the boss release article and later Cash Shop packages.',
    keywords: ['maplestory first adversary', 'MapleStory First Adversary', 'GMS First Adversary', 'First Adversary event'],
    sections: [
      { title: 'Identify the exact MapleStory result', paragraphs: ['Nexon published the source article as “Now Available: The First Adversary!” for Global MapleStory. MPStorys keeps the English proper name because that is the phrase GMS players use, while the GMS label prevents it from being confused with another region or an unrelated product.', 'Undying Purpose Event is the structured event record associated with the same official source. It answers timing and event-history questions; it should not be confused with later First Adversary Package Cash Shop notices.'] },
      { title: 'Publication date and event state', paragraphs: ['The official article was published January 14, 2026. The structured event window in this record begins January 15 and ends February 3, 2026. Those dates apply to the Global service and do not establish a KMS, JMS, TMS, or MSEA schedule.', 'The event is now historical. This page remains useful for version research and for reaching the canonical Nexon source, but it must not present old participation or reward information as currently available.'] },
      { title: 'Why the query is attached to this article', paragraphs: ['The phrase “maplestory first adversary” appears only where the page can answer it. Series and server landing pages no longer carry a list of rising queries that lack article-level explanations.', 'Putting the phrase beside the official title, date, region, status, and source creates a focused answer for search engines and readers. It improves topical relevance without repeating a keyword solely to inflate density.'] },
      { title: 'How to verify the next detail', paragraphs: ['Check the GMS scope and publication date, then open the Nexon source linked below. Boss mechanics, entry requirements, combat targets, and reward values require a trustworthy guide or patch note for the same game version.', 'A First Adversary Package is a separate Cash Shop topic. Its sale period, price, and contents must be supported by the corresponding shop notice rather than inferred from this event article.'] },
    ],
    faq: [
      { question: 'Is MapleStory First Adversary a GMS topic?', answer: 'Yes. This page is tied to the official Global MapleStory Nexon article and retains its GMS publication context.' },
      { question: 'Is Undying Purpose Event still active?', answer: 'No. The event record ends on February 3, 2026, so it is presented as historical coverage.' },
      { question: 'Does this page invent missing boss statistics?', answer: 'No. Unverified mechanics, power targets, and rewards remain excluded until a trustworthy versioned source is available.' },
    ],
  };
};

const classicTestProfile: ProfileFactory = (language) => {
  const localized = {
    zh: {
      eyebrow: '官方测试报名说明',
      title: 'MapleStory Classic beta：第二次封闭测试报名与日期',
      description: '“maplestory classic beta”“maplestory closed beta”和“maplestory beta sign up”都应落到这篇官方测试文章，而不是散布在服务器落地页。本文按 Nexon 公告整理报名截止、测试窗口、重新申请规则与测试新增内容。',
      keywords: ['maplestory classic beta', 'maplestory closed beta', 'maplestory beta sign up', 'MapleStory Classic World'],
      sections: [
        { title: '报名与测试时间', paragraphs: ['Global MapleStory Classic World 第二次 Closed Online Test 的申请截止日是 2026 年 7 月 29 日，测试计划于 8 月 4 日至 12 日进行。日期来自 Nexon 官方公告，发生变化时应以原文更新为准。', '参加过第一次测试的玩家也必须重新提交申请。获选玩家会通过 Nexon 账号登记的电子邮件收到进入说明，因此社区转发或旧客户端不能代替官方资格通知。'] },
        { title: '第二次测试增加什么', paragraphs: ['官方结构化记录确认新增三转、Orbis 与 El Nath，并加入 macOS 支持、手柄与可自定义布局，以及更多语言选项。', '这些内容属于测试版本，平衡、商城和系统仍可能变化。测试结束后角色与进度会被清除，所以本页不会把测试进度描述成正式服永久资产。'] },
        { title: 'Classic beta 搜索意图', paragraphs: ['搜索 MapleStory Classic beta 的玩家通常要确认这是官方 Classic World、报名是否开放、自己是否需要再次申请、测试何时开始以及支持哪些平台。本页把这些答案集中在一个可索引文章中。', '“classic beta”在这里指 Nexon 官方测试，不指私人服务器或名字相近的怀旧项目。MPStorys 不会借趋势词为非官方服务导流。'] },
        { title: '申请前检查', paragraphs: ['确认当前日期是否仍在 7 月 29 日截止前，检查 Nexon 账号邮箱，并从文末官方页面进入。不要从搜索广告或第三方下载站获取测试客户端。', '测试公告只证明本次测试范围，不等于正式上线日期、长期商业规则或其他地区版本计划。'] },
      ],
      faq: [
        { question: '第一次测试玩家需要重新报名吗？', answer: '需要。官方公告要求所有人重新申请，包括参加过第一次测试的玩家。' },
        { question: 'MapleStory Classic beta 会保留角色吗？', answer: '不会；官方记录说明测试结束后角色和进度会被清除。' },
        { question: '这是私人怀旧服吗？', answer: '不是。本页只指向 Nexon 的 Global MapleStory Classic World 官方测试。' },
      ],
    },
    'zh-Hant': {
      eyebrow: '官方封閉測試資訊',
      title: 'MapleStory Classic beta：第二次測試報名與時程',
      description: '「maplestory classic beta」「maplestory closed beta」與「maplestory beta sign up」集中到這篇 Nexon 測試文章，說明申請截止、測試日期、重新報名與新增內容。',
      keywords: ['maplestory classic beta', 'maplestory closed beta', 'maplestory beta sign up', 'MapleStory Classic World'],
      sections: [
        { title: '報名與測試日期', paragraphs: ['第二次 Global MapleStory Classic World Closed Online Test 申請於 2026 年 7 月 29 日截止，測試預定 8 月 4 日至 12 日。', '第一次測試的玩家也必須重新申請；獲選通知會寄到 Nexon 帳號登記的電子郵件。'] },
        { title: '測試 #2 的新增內容', paragraphs: ['官方記錄列出三轉、Orbis、El Nath、macOS、控制器自訂配置與更多語言選項。', '測試版平衡、商城與系統並非最終版本，測試結束後角色與進度會清除。'] },
        { title: 'Classic beta 查詢要回答什麼', paragraphs: ['玩家搜尋 MapleStory Classic beta 時，需要的是官方性、報名狀態、日期、平台與資格，而不是在每個伺服器落地頁看到同一組詞。', '本頁只涵蓋 Nexon 官方 Classic World，不收錄私人伺服器或名稱相近的非官方專案。'] },
        { title: '申請前檢查', paragraphs: ['確認截止日、Nexon 帳號信箱與文末官方網址，不要從第三方下載站取得測試程式。', '本次測試公告不等於正式上市日期，也不能推論其他區域版本。'] },
      ],
      faq: [
        { question: '舊測試玩家要重新申請嗎？', answer: '要，所有玩家都必須提交新申請。' },
        { question: '測試進度會保留嗎？', answer: '不會，角色與進度會在測試後清除。' },
        { question: '這是官方 Classic World 嗎？', answer: '是，本頁綁定 Nexon 官方公告與測試頁。' },
      ],
    },
    ja: {
      eyebrow: '公式クローズドテスト情報',
      title: 'MapleStory Classic beta：テスト#2の応募と日程',
      description: '「maplestory classic beta」「maplestory closed beta」「maplestory beta sign up」をNexon公式テスト記事に集約し、締切、開催期間、再応募、追加内容を説明します。',
      keywords: ['maplestory classic beta', 'maplestory closed beta', 'maplestory beta sign up', 'MapleStory Classic World'],
      sections: [
        { title: '応募締切と開催期間', paragraphs: ['Global MapleStory Classic World Closed Online Test #2の応募締切は2026年7月29日、テスト予定は8月4日から12日です。', '第1回参加者も再応募が必要です。選出された場合はNexonアカウントのメールに案内が届きます。'] },
        { title: 'テスト#2の追加要素', paragraphs: ['3次職、Orbis、El Nath、macOS、カスタマイズ可能なコントローラー、追加言語が公式記録に含まれます。', 'テスト版のバランスやCash Shopは最終仕様ではなく、終了後にキャラクターと進行状況は削除されます。'] },
        { title: 'Classic betaの検索意図', paragraphs: ['応募状況、公式性、日程、対応環境をこの記事で回答し、サーバー別ランディングページには上昇語を並べません。', 'Nexon公式Classic Worldだけを対象にし、プライベートサーバーや類似名称のサービスは含めません。'] },
        { title: '応募前の確認', paragraphs: ['締切、Nexonアカウントのメール、下部の公式URLを確認してください。第三者のダウンロードサイトは利用しないでください。', 'このテストは正式サービス開始日や他地域での展開を保証するものではありません。'] },
      ],
      faq: [
        { question: '第1回参加者も再応募が必要ですか？', answer: 'はい。全員が新しい応募を提出する必要があります。' },
        { question: 'テスト進行は残りますか？', answer: 'いいえ。キャラクターと進行状況は削除されます。' },
        { question: 'Nexon公式のClassic Worldですか？', answer: 'はい。公式ニュースとテストページに紐づく記事です。' },
      ],
    },
    ko: {
      eyebrow: '공식 비공개 테스트 안내',
      title: 'MapleStory Classic beta 테스트 #2 신청과 일정',
      description: '“maplestory classic beta”, “maplestory closed beta”, “maplestory beta sign up” 검색을 Nexon 공식 테스트 기사에 연결해 마감일, 테스트 기간, 재신청, 추가 내용을 설명합니다.',
      keywords: ['maplestory classic beta', 'maplestory closed beta', 'maplestory beta sign up', 'MapleStory Classic World'],
      sections: [
        { title: '신청 마감과 테스트 일정', paragraphs: ['Global MapleStory Classic World Closed Online Test #2 신청은 2026년 7월 29일 마감이며 테스트는 8월 4일부터 12일까지 예정되어 있습니다.', '첫 테스트 참여자도 다시 신청해야 하며 선정 안내는 Nexon 계정 이메일로 발송됩니다.'] },
        { title: '테스트 #2 추가 내용', paragraphs: ['3차 전직, Orbis, El Nath, macOS, 사용자 지정 컨트롤러, 추가 언어 옵션이 공식 기록에 포함됩니다.', '테스트 빌드의 밸런스와 Cash Shop은 최종 버전이 아니며 종료 후 캐릭터와 진행 정보가 삭제됩니다.'] },
        { title: 'Classic beta 검색 의도', paragraphs: ['공식 여부, 신청 상태, 일정, 지원 환경을 이 기사에서 답하고 서버 랜딩 페이지에는 상승 검색어 목록을 반복하지 않습니다.', 'Nexon 공식 Classic World만 다루며 사설 서버와 유사 명칭의 비공식 프로젝트는 제외합니다.'] },
        { title: '신청 전 확인', paragraphs: ['마감일, Nexon 계정 이메일, 하단 공식 주소를 확인하고 제3자 다운로드 사이트를 이용하지 마세요.', '이번 테스트 공지는 정식 출시일이나 다른 지역 서비스 일정을 보장하지 않습니다.'] },
      ],
      faq: [
        { question: '첫 테스트 참가자도 다시 신청해야 하나요?', answer: '네. 모든 참가자가 새 신청서를 제출해야 합니다.' },
        { question: '테스트 진행 정보가 유지되나요?', answer: '아니요. 종료 후 캐릭터와 진행 정보가 삭제됩니다.' },
        { question: 'Nexon 공식 Classic World인가요?', answer: '네. 공식 뉴스와 테스트 페이지에 연결된 기사입니다.' },
      ],
    },
  } as const;
  if (language !== 'en') return localized[language];
  return {
    eyebrow: 'Official test application guide',
    title: 'MapleStory Classic beta: Closed Online Test #2 dates and signup',
    description: 'The queries “maplestory classic beta,” “maplestory closed beta,” and “maplestory beta sign up” belong on this official Nexon test article. It answers the application deadline, test window, reapplication rule, supported platforms, and the limits of a test build.',
    keywords: ['maplestory classic beta', 'maplestory closed beta', 'maplestory beta sign up', 'MapleStory Classic World'],
    sections: [
      { title: 'Application deadline and test window', paragraphs: ['Applications for Global MapleStory Classic World Closed Online Test #2 close July 29, 2026. Nexon schedules the test for August 4 through August 12. The canonical page linked below remains the source of record if timing changes.', 'Every interested player must submit a new application, including people who joined the first test. Selected applicants receive access instructions through the email registered to their Nexon account.'] },
      { title: 'What changes in test #2', paragraphs: ['The official record adds 3rd Job Advancement, Orbis and El Nath, macOS support, customizable controller layouts, and more language options.', 'Balance, Cash Shop features, and other systems are not final. Characters and progress are wiped after the test, so test progress must not be presented as a permanent live-service asset.'] },
      { title: 'The intent behind MapleStory Classic beta searches', paragraphs: ['A player using these searches usually needs to know whether this is the official Classic World, whether signup is open, whether previous testers must apply again, when access starts, and which platforms are included. This article keeps those answers together.', 'Classic beta here means Nexon’s official Global MapleStory Classic World test. It does not refer to a private server or a similarly named nostalgia project.'] },
      { title: 'Checks before applying', paragraphs: ['Confirm that the current date is before the July 29 deadline, monitor the Nexon-account email, and enter through the official page below. Do not obtain a test client from an advertisement or third-party download site.', 'The test announcement does not establish a final launch date, permanent commercial rules, or a release plan for another region.'] },
    ],
    faq: [
      { question: 'Must first-test players apply again?', answer: 'Yes. Nexon says everyone must submit a new application, including previous testers.' },
      { question: 'Does MapleStory Classic beta keep characters?', answer: 'No. The official record says characters and progress will be wiped after the test.' },
      { question: 'Is this a private classic server?', answer: 'No. This article covers Nexon’s official Global MapleStory Classic World test only.' },
    ],
  };
};

const renProfile: ProfileFactory = (language) => {
  const nativeName = language === 'zh'
    ? '冒险岛 Ren'
    : language === 'zh-Hant'
      ? '新楓之谷 Ren'
      : language === 'ja'
        ? 'メイプルストーリー Ren'
        : language === 'ko'
          ? '메이플스토리 Ren'
          : 'MapleStory Ren';
  const localized = language === 'zh'
    ? {
        eyebrow: 'GMS Ren 官方活动索引',
        title: 'MapleStory Ren guide：先分清职业资料与上线活动',
        description: '搜索“maplestory ren guide”的玩家通常同时看到职业攻略、上线公告和活动奖励。本页对应 Nexon 的 “Ren, the Red-Eyed Wanderer” 官方活动文章，只说明 GMS 上线活动与核验路径，不把它伪装成完整技能加点指南。',
        sectionTitles: ['这篇文章能回答什么', '活动记录与版本范围', '职业攻略需要另一组证据', '关于社区与 Discord 搜索'],
        paragraphs: [
          ['Nexon 原始文章在 2025 年 11 月 12 日发布，标题为 “Now Available: Ren, the Red-Eyed Wanderer!”。本记录聚焦 Tracks of the Wanderer 活动，并保留同一官方来源。', '因此它适合回答 Ren 何时在 GMS 上线、相关活动来自哪里以及活动是否仍有效；它不是技能倍率、加点或装备路线的完整 Ren guide。'],
          ['本站记录的 Tracks of the Wanderer 从 2025 年 11 月 12 日开始，并于 2026 年 2 月 3 日结束。页面按 GMS 历史内容展示，不能用来推断 KMS 或其他地区当前活动。', '当 Nexon 修改职业技能或重开活动时，应查找新的补丁说明和活动公告，而不是仅依赖这篇上线文章。'],
          ['真正的职业攻略应绑定同版本职业说明、技能改动与系统来源。MPStorys 会把活动文章、补丁说明和以后可核验的职业指南分开，让每个 URL 回答一个主要问题。', '在没有可靠数值来源时，本页不会为了匹配“maplestory ren guide”而编写加点顺序、伤害比较或最佳装备。'],
          ['“maplestory ren discord”可能表示玩家想找社区讨论，但本活动文章没有证明存在独立的 Ren 官方 Discord。本站不会把该词当成已验证链接。', '需要社区支持时应使用 Global MapleStory 官方社区入口，并在点击前检查域名、邀请来源和服务器身份。'],
        ],
        faq: [
          { question: '这是一篇完整的 Ren 职业攻略吗？', answer: '不是。本页是 GMS 官方上线活动索引；技能与养成需要单独的版本化指南。' },
          { question: 'Tracks of the Wanderer 还在进行吗？', answer: '没有，本站记录的结束时间是 2026 年 2 月 3 日。' },
          { question: '页面会提供未经证实的 Ren Discord 吗？', answer: '不会。本记录没有证明存在独立的官方 Ren Discord。' },
        ],
      }
    : language === 'zh-Hant'
      ? {
          eyebrow: 'GMS Ren 官方活動索引',
          title: 'MapleStory Ren guide：區分職業攻略與上線活動',
          description: '「maplestory ren guide」常混合職業攻略、上線公告與活動獎勵。本頁對應 Nexon 的 Ren 官方活動文章，僅說明 GMS 活動與查證路徑。',
          sectionTitles: ['本文能回答的問題', '活動期間與版本', '職業攻略需要不同證據', '社群與 Discord 查詢'],
          paragraphs: [
            ['Nexon 於 2025 年 11 月 12 日發布 “Now Available: Ren, the Red-Eyed Wanderer!”。本記錄整理同一來源下的 Tracks of the Wanderer 活動。', '它能回答 Ren 的 GMS 上線與活動來源，但不是完整技能配點或裝備指南。'],
            ['活動記錄從 2025 年 11 月 12 日開始，於 2026 年 2 月 3 日結束，現在屬於歷史內容。', 'GMS 活動不能直接推論 KMS、JMS 或 TMS 的時間與規則。'],
            ['完整 Ren guide 應連結同版本職業介紹、技能變更與系統來源。', '沒有可靠數值時，本頁不會編造配點、傷害排行或最佳裝備。'],
            ['本來源沒有證明存在獨立的官方 Ren Discord，因此不會發布未核驗邀請。', '社群入口應從 Global MapleStory 官方頁面進入並檢查網域。'],
          ],
          faq: [
            { question: '這是完整的 Ren 職業攻略嗎？', answer: '不是，這是 GMS 上線活動文章。' },
            { question: '活動仍在進行嗎？', answer: '否，記錄結束於 2026 年 2 月 3 日。' },
            { question: '會提供 Ren Discord 嗎？', answer: '沒有官方證據時不會提供獨立邀請。' },
          ],
        }
      : language === 'ja'
        ? {
            eyebrow: 'GMS Ren公式イベント索引',
            title: 'MapleStory Ren guide：クラス解説と実装イベントの違い',
            description: '「maplestory ren guide」で混在しやすいクラス攻略と実装イベントを分離します。本ページはNexonのRen公式イベント記事で、GMSの公開履歴と確認方法を扱います。',
            sectionTitles: ['この記事で分かること', 'イベント期間と地域', 'クラス攻略に必要な出典', 'Discord検索について'],
            paragraphs: [
              ['Nexonは2025年11月12日に “Now Available: Ren, the Red-Eyed Wanderer!” を公開しました。本記録は同じ出典のTracks of the Wandererイベントです。', 'GMSでの実装とイベント出典を確認できますが、スキル振りや装備の完全ガイドではありません。'],
              ['イベント記録は2025年11月12日から2026年2月3日までで、現在は履歴情報です。', 'GMSの日程からKMSやJMSの開催を推測することはできません。'],
              ['完全なRen guideには同じバージョンのクラス説明、スキル変更、システム資料が必要です。', '信頼できる数値がない場合、ビルドや最強装備を作りません。'],
              ['この出典はRen専用の公式Discordを証明していません。未確認の招待リンクは掲載しません。', 'コミュニティはGlobal MapleStory公式ページから確認してください。'],
            ],
            faq: [
              { question: '完全なRenクラスガイドですか？', answer: 'いいえ。GMSの実装イベント記事です。' },
              { question: 'イベントは開催中ですか？', answer: 'いいえ。2026年2月3日に終了しています。' },
              { question: 'Ren Discordを掲載しますか？', answer: '公式性を確認できない独立招待は掲載しません。' },
            ],
          }
        : language === 'ko'
          ? {
              eyebrow: 'GMS Ren 공식 이벤트 색인',
              title: 'MapleStory Ren guide: 직업 공략과 출시 이벤트 구분',
              description: '“maplestory ren guide” 검색에서 섞이기 쉬운 직업 공략과 출시 이벤트를 나눕니다. 이 페이지는 Nexon Ren 공식 이벤트 기사로 GMS 출시 기록과 검증 경로를 다룹니다.',
              sectionTitles: ['이 기사에서 확인할 수 있는 내용', '이벤트 기간과 지역', '직업 공략에 필요한 출처', 'Discord 검색 주의'],
              paragraphs: [
                ['Nexon은 2025년 11월 12일 “Now Available: Ren, the Red-Eyed Wanderer!”를 게시했습니다. 이 기록은 같은 출처의 Tracks of the Wanderer 이벤트입니다.', 'GMS 출시와 이벤트 출처를 확인할 수 있지만 스킬 트리와 장비를 다루는 완전한 공략은 아닙니다.'],
                ['이벤트 기록은 2025년 11월 12일부터 2026년 2월 3일까지이며 현재는 종료된 이력입니다.', 'GMS 일정을 KMS나 다른 지역 일정으로 해석하면 안 됩니다.'],
                ['완전한 Ren guide에는 같은 버전의 직업 소개, 스킬 변경, 시스템 자료가 필요합니다.', '신뢰할 수 있는 수치가 없으면 스킬 빌드와 최종 장비를 만들어내지 않습니다.'],
                ['이 출처는 Ren 전용 공식 Discord를 증명하지 않습니다. 확인되지 않은 초대 링크는 게시하지 않습니다.', '커뮤니티는 Global MapleStory 공식 페이지에서 확인하세요.'],
              ],
              faq: [
                { question: '완전한 Ren 직업 공략인가요?', answer: '아니요. GMS 출시 이벤트 기사입니다.' },
                { question: '이벤트가 진행 중인가요?', answer: '아니요. 2026년 2월 3일 종료되었습니다.' },
                { question: 'Ren Discord 링크를 제공하나요?', answer: '공식 확인이 없는 독립 초대 링크는 제공하지 않습니다.' },
              ],
            }
          : {
              eyebrow: 'Official GMS Ren event index',
              title: 'MapleStory Ren guide: separate the class guide from the launch event',
              description: 'Searches for “maplestory ren guide” often mix class builds, launch announcements, and event rewards. This page is tied to Nexon’s “Ren, the Red-Eyed Wanderer” article and explains the GMS event record without pretending to be a complete skill-build guide.',
              sectionTitles: ['What this article can answer', 'Event record and version scope', 'A class guide needs different evidence', 'Community and Discord searches'],
              paragraphs: [
                ['Nexon published “Now Available: Ren, the Red-Eyed Wanderer!” on November 12, 2025. This record focuses on Tracks of the Wanderer while retaining the same canonical official source.', 'It can answer when Ren and the associated event appeared in GMS, where the announcement came from, and whether the event remains active. It is not a complete Ren skill, gear, or leveling guide.'],
                ['Tracks of the Wanderer begins November 12, 2025 and ends February 3, 2026 in the structured record. It is now historical GMS coverage and does not establish a current KMS, JMS, or TMS event.', 'A later skill adjustment or event rerun needs a newer patch note or announcement. The launch article should not be treated as permanently current class guidance.'],
                ['A trustworthy MapleStory Ren guide should cite version-matched class documentation, skill changes, and progression systems. MPStorys keeps launch events, patch notes, and future verified class guides as separate URLs.', 'Without reliable numerical evidence, this article does not invent skill priorities, damage comparisons, or best-in-slot equipment merely to match a search phrase.'],
                ['The query “maplestory ren discord” may express a wish for community help, but this event source does not prove that a separate official Ren Discord exists. MPStorys does not convert that query into an unverified invite.', 'Use the official Global MapleStory community entry point and verify the domain, invite source, and server identity before joining.'],
              ],
              faq: [
                { question: 'Is this a complete MapleStory Ren class guide?', answer: 'No. It is a source-backed GMS launch-event article; class mechanics require a separate versioned guide.' },
                { question: 'Is Tracks of the Wanderer still active?', answer: 'No. The structured event record ends February 3, 2026.' },
                { question: 'Does this page publish an unverified Ren Discord?', answer: 'No. The source does not establish a separate official Ren Discord.' },
              ],
            };
  return {
    eyebrow: localized.eyebrow,
    title: localized.title,
    description: localized.description,
    keywords: ['maplestory ren guide', `${nativeName} guide`, 'Ren the Red-Eyed Wanderer', 'GMS Ren'],
    sections: localized.sectionTitles.map((title, index) => ({ title, paragraphs: localized.paragraphs[index] })),
    faq: localized.faq,
  };
};

const idleCouponProfile: ProfileFactory = (language) => {
  const copies = {
    en: {
      eyebrow: 'Official coupon status',
      title: 'MapleStory Idle coupon code: Summertime Surprise status and redemption',
      description: 'The searches “maplestory idle coupon,” “maplestory idle code,” and “maplestory idle rpg coupon code” belong on a dated coupon article. Nexon’s Summertime Surprise notice published COOLSUMMER with a July 1, 2026 expiration, so this page clearly marks it as expired instead of presenting an old code as active.',
      sectionTitles: ['Coupon and expiration', 'Official redemption methods', 'Safety checks before entering a code', 'Why this query belongs on an article'],
      paragraphs: [
        ['Nexon published the Summertime Surprise Coupon Gift on June 11, 2026. The code was COOLSUMMER and the official expiration was July 1, 2026 at 14:59 UTC, with regional times also listed in the source.', 'Because the deadline has passed, COOLSUMMER is historical and should not be described as a working MapleStory Idle code. A new coupon requires a new dated official notice.'],
        ['The official notice lists the in-game path Menu → Settings → Other → Enter Coupon for Android. It also links a coupon page for both iOS and Android and explains how to copy the account UID.', 'The reward is delivered to the account mailbox after successful redemption. The source warns that a coupon can be used only once per account and that mailbox items have their own storage period.'],
        ['Confirm the character and UID before redeeming. Nexon says it cannot restore or transfer rewards after a successfully used coupon, so an old social post or copied list is not enough evidence.', 'Use the official forum article linked below. Avoid pages that omit an expiration date, request an account password, or re-label an expired code as active.'],
        ['A server landing page cannot answer whether a code is valid today. This article can, because the exact search phrase appears next to the publication date, expiration, platform instructions, and canonical source.', 'MPStorys keeps expired coupon articles indexed as history but labels their status plainly. That supports search discovery without misleading players who arrive after the redemption window.'],
      ],
      faq: [
        { question: 'Is COOLSUMMER still a working MapleStory Idle coupon?', answer: 'No. The official expiration was July 1, 2026 at 14:59 UTC.' },
        { question: 'Can iOS players redeem MapleStory Idle codes?', answer: 'The official notice points both iOS and Android players to the coupon page; the in-game entry path is Android-only.' },
        { question: 'Where do coupon rewards arrive?', answer: 'The official notice says successful rewards are delivered to the account mailbox.' },
      ],
    },
    zh: {
      eyebrow: '官方兑换码状态',
      title: 'MapleStory Idle coupon code：COOLSUMMER 是否仍有效',
      description: '“maplestory idle coupon”“maplestory idle code”和“maplestory idle rpg coupon code”应进入带日期的兑换码文章。Nexon 的夏日惊喜公告显示 COOLSUMMER 已于 2026 年 7 月 1 日过期，因此本页不会把旧码伪装成当前有效。',
      sectionTitles: ['兑换码与截止时间', '官方兑换方式', '输入前的安全检查', '为什么趋势词放在这篇文章'],
      paragraphs: [
        ['Nexon 于 2026 年 6 月 11 日发布 Summertime Surprise Coupon Gift。兑换码是 COOLSUMMER，官方截止时间是 7 月 1 日 14:59 UTC，并在原文列出其他地区时间。', '截止日期已经过去，所以 COOLSUMMER 只作为历史记录展示。任何新兑换码都必须对应新的官方公告和独立有效期。'],
        ['Android 可以从游戏内“菜单 → 设置 → 其他 → 输入兑换码”进入；官方也提供 iOS 与 Android 都可使用的兑换页面，并说明如何复制账号 UID。', '成功兑换后奖励进入账号邮箱。每个账号只能使用一次，邮箱物品还受领取期限限制。'],
        ['兑换前核对角色和 UID。官方说明成功使用后无法协助恢复或转移到其他角色，因此不能只凭社交截图或复制列表操作。', '只使用文末官方论坛来源。要求账号密码、隐藏截止时间或把过期码标成有效的网站不应信任。'],
        ['服务器落地页无法回答某个 code 今天是否有效；这篇文章把关键词与发布日期、过期时间、平台步骤和 Nexon 原文放在一起。', '本站保留过期兑换码方便历史搜索，但会明确标注状态，避免为了流量误导玩家。'],
      ],
      faq: [
        { question: 'COOLSUMMER 现在还能兑换吗？', answer: '不能。官方截止时间是 2026 年 7 月 1 日 14:59 UTC。' },
        { question: 'iOS 可以使用 MapleStory Idle 兑换码吗？', answer: '可以使用官方兑换页面；游戏内输入入口仅适用于 Android。' },
        { question: '奖励发到哪里？', answer: '成功兑换后会发送到账号邮箱。' },
      ],
    },
    'zh-Hant': {
      eyebrow: '官方序號狀態',
      title: '楓之谷放置冒險記序號：COOLSUMMER 是否仍有效',
      description: '「MapleStory Idle coupon」「MapleStory Idle code」與「楓之谷放置冒險記序號」集中到有日期的官方序號文章。COOLSUMMER 已於 2026 年 7 月 1 日到期。',
      sectionTitles: ['序號與到期時間', '官方兌換方式', '輸入前安全檢查', '為何搜尋詞放在本文'],
      paragraphs: [
        ['Nexon 於 2026 年 6 月 11 日發布夏日驚喜序號，代碼為 COOLSUMMER，到期時間是 7 月 1 日 14:59 UTC。', '期限已過，本文將其標示為歷史序號；新序號必須有新的官方公告與有效期。'],
        ['Android 可由遊戲內選單、設定、其他、輸入序號進入；iOS 與 Android 都能使用官方兌換頁面。', '兌換成功後獎勵寄到帳號信箱，每個帳號只能使用一次。'],
        ['兌換前核對角色與 UID，成功使用後官方無法協助移轉獎勵。', '只開啟文末官方論壇，不要使用要求密碼或隱藏到期日的網站。'],
        ['落地頁不能判斷序號今天是否有效；本文把搜尋詞放在發布日、到期日、平台步驟與官方來源旁。', '過期序號保留供歷史查找，但不會標成仍可使用。'],
      ],
      faq: [
        { question: 'COOLSUMMER 還能用嗎？', answer: '不能，已於 2026 年 7 月 1 日 14:59 UTC 到期。' },
        { question: 'iOS 能兌換嗎？', answer: '可以使用官方兌換頁；遊戲內入口僅限 Android。' },
        { question: '獎勵送到哪裡？', answer: '成功兌換後送到帳號信箱。' },
      ],
    },
    ja: {
      eyebrow: '公式クーポン状態',
      title: 'MapleStory Idle coupon code：COOLSUMMERの有効期限',
      description: '「maplestory idle coupon」「maplestory idle code」は日付付きの公式クーポン記事で回答します。COOLSUMMERは2026年7月1日に期限切れとなっています。',
      sectionTitles: ['コードと期限', '公式入力方法', '入力前の安全確認', '検索語をこの記事に置く理由'],
      paragraphs: [
        ['Nexonは2026年6月11日にSummertime Surprise Coupon Giftを公開しました。コードはCOOLSUMMER、期限は7月1日14:59 UTCです。', '期限は終了しているため、現在使えるコードとして表示しません。新しいコードには新しい公式告知が必要です。'],
        ['Androidはゲーム内Menu、Settings、Other、Enter Couponから入力できます。iOSとAndroid向けの公式クーポンページも案内されています。', '成功すると報酬はアカウントMailboxへ届き、1アカウント1回までです。'],
        ['入力前にキャラクターとUIDを確認してください。使用後の移動や復旧はできないと公式記事に記載されています。', 'パスワードを要求したり期限を隠したりするサイトは利用しないでください。'],
        ['サーバーのランディングページでは有効性を回答できません。この記事は公開日、期限、手順、公式出典を一緒に表示します。', '期限切れ記事は履歴として残しますが、現在有効とは表示しません。'],
      ],
      faq: [
        { question: 'COOLSUMMERはまだ使えますか？', answer: 'いいえ。2026年7月1日14:59 UTCに期限切れです。' },
        { question: 'iOSでも使えますか？', answer: '公式クーポンページはiOSとAndroidに対応します。' },
        { question: '報酬はどこに届きますか？', answer: 'アカウントMailboxへ届きます。' },
      ],
    },
    ko: {
      eyebrow: '공식 쿠폰 상태',
      title: 'MapleStory Idle coupon code: COOLSUMMER 사용 가능 여부',
      description: '“maplestory idle coupon”, “maplestory idle code” 검색은 날짜가 있는 공식 쿠폰 기사에서 답합니다. COOLSUMMER는 2026년 7월 1일 만료되었습니다.',
      sectionTitles: ['쿠폰과 만료 시간', '공식 입력 방법', '입력 전 보안 확인', '검색어를 이 기사에 배치하는 이유'],
      paragraphs: [
        ['Nexon은 2026년 6월 11일 Summertime Surprise Coupon Gift를 게시했습니다. 코드는 COOLSUMMER이며 만료 시각은 7월 1일 14:59 UTC입니다.', '기한이 지났으므로 현재 사용 가능한 코드로 표시하지 않습니다. 새 코드는 새 공식 공지로 확인해야 합니다.'],
        ['Android는 게임 내 Menu, Settings, Other, Enter Coupon 경로를 사용할 수 있습니다. iOS와 Android 모두 공식 쿠폰 페이지를 이용할 수 있습니다.', '성공한 보상은 계정 Mailbox로 지급되며 계정당 한 번만 사용할 수 있습니다.'],
        ['사용 전 캐릭터와 UID를 확인하세요. 사용 후 보상 복구나 다른 캐릭터 이전은 지원되지 않습니다.', '비밀번호를 요구하거나 만료일을 숨기는 사이트는 이용하지 마세요.'],
        ['서버 랜딩 페이지는 오늘 코드가 유효한지 답할 수 없습니다. 이 기사는 게시일, 만료일, 플랫폼 절차, 공식 출처를 함께 제공합니다.', '만료된 쿠폰은 이력으로 남기되 현재 사용 가능하다고 표시하지 않습니다.'],
      ],
      faq: [
        { question: 'COOLSUMMER를 아직 사용할 수 있나요?', answer: '아니요. 2026년 7월 1일 14:59 UTC에 만료되었습니다.' },
        { question: 'iOS에서도 사용할 수 있나요?', answer: '공식 쿠폰 페이지는 iOS와 Android를 지원합니다.' },
        { question: '보상은 어디로 지급되나요?', answer: '계정 Mailbox로 지급됩니다.' },
      ],
    },
  } as const;
  const copy = copies[language];
  return {
    eyebrow: copy.eyebrow,
    title: copy.title,
    description: copy.description,
    keywords: language === 'zh-Hant'
      ? ['楓之谷放置冒險記序號', 'MapleStory Idle coupon', 'MapleStory Idle code', 'COOLSUMMER']
      : ['maplestory idle coupon', 'maplestory idle code', 'maplestory idle rpg coupon code', 'COOLSUMMER'],
    sections: copy.sectionTitles.map((title, index) => ({ title, paragraphs: copy.paragraphs[index] })),
    faq: copy.faq,
  };
};

const profileByContentId: Record<string, ProfileFactory> = {
  [FIRST_ADVERSARY_ID]: firstAdversaryProfile,
  [CLASSIC_TEST_ID]: classicTestProfile,
  [REN_EVENT_ID]: renProfile,
};

export const getArticleSearchIntentProfile = (
  target: ArticleSearchIntentTarget,
  language: SupportedLanguage,
) => {
  const factory = target.contentId ? profileByContentId[target.contentId] : undefined;
  if (factory) return factory(language);
  if (normalizeUrl(target.sourceUrl) === normalizeUrl(IDLE_SUMMER_COUPON_URL)) return idleCouponProfile(language);
  return undefined;
};

export const hasArticleSearchIntentProfile = (target: ArticleSearchIntentTarget) => (
  Boolean(target.contentId && profileByContentId[target.contentId])
  || normalizeUrl(target.sourceUrl) === normalizeUrl(IDLE_SUMMER_COUPON_URL)
);
