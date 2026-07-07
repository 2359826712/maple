import type { latestNews } from '@/mocks/home';

type NewsItem = (typeof latestNews)[number];
type SupportedLanguage = 'en' | 'zh' | 'zh-Hant' | 'ja';

type NewsCopy = {
  title: string;
  excerpt: string;
};

type ArticleCopy = {
  lead: string;
  sections: string[];
  takeaway: string;
};

const normalizeLanguage = (language: string): SupportedLanguage => {
  if (language.startsWith('zh-Hant')) return 'zh-Hant';
  if (language.startsWith('zh')) return 'zh';
  if (language.startsWith('ja')) return 'ja';
  return 'en';
};

const newsCopies: Record<string, Partial<Record<SupportedLanguage, NewsCopy>>> = {
  n1: {
    zh: {
      title: '[6/30 更新] v.269 - Ride the Lightning 更新公告',
      excerpt: '官方 v.269 更新公告包含 Ride the Lightning、新职业 Erel Light、SHINE: The Power of Starlight 以及新 Boss Malefic Star。',
    },
    'zh-Hant': {
      title: '[6/30 更新] v.269 - Ride the Lightning 更新公告',
      excerpt: '官方 v.269 更新公告包含 Ride the Lightning、新職業 Erel Light、SHINE: The Power of Starlight 以及新 Boss Malefic Star。',
    },
    ja: {
      title: '[6/30更新] v.269 - Ride the Lightning パッチノート',
      excerpt: '公式v.269告知では、Ride the Lightning、新職業Erel Light、SHINE: The Power of Starlight、新ボスMalefic Starが紹介されています。',
    },
  },
  n2: {
    zh: {
      title: 'Challenger World 与 Burning 活动',
      excerpt: 'Nexon 公布 Challenger World 活动时间：2026 年 6 月 17 日维护后至 2026 年 9 月 8 日，并说明 Burning 活动参与方式。',
    },
    'zh-Hant': {
      title: 'Challenger World 與 Burning 活動',
      excerpt: 'Nexon 公布 Challenger World 活動時間：2026 年 6 月 17 日維護後至 2026 年 9 月 8 日，並說明 Burning 活動參與方式。',
    },
    ja: {
      title: 'Challenger WorldとBurningイベント',
      excerpt: 'NexonはChallenger Worldを2026年6月17日のメンテナンス後から2026年9月8日まで開催すると案内し、Burningイベントの参加方法も説明しています。',
    },
  },
  n3: {
    zh: {
      title: '6/20 临时维护补偿',
      excerpt: '官方说明，被错误扣除的星力强化费用将在 6 月 25 日维护期间返还给玩家。',
    },
    'zh-Hant': {
      title: '6/20 臨時維護補償',
      excerpt: '官方說明，被錯誤扣除的星力強化費用將在 6 月 25 日維護期間返還給玩家。',
    },
    ja: {
      title: '6/20臨時メンテナンス補償',
      excerpt: '公式告知では、誤って差し引かれたスターフォース強化費用を6月25日のメンテナンス中に復旧すると説明しています。',
    },
  },
  n4: {
    zh: {
      title: '6/26 饰品 Miracle Time 问题补偿公告',
      excerpt: '官方公告说明 6 月 26 日饰品 Miracle Time 问题的补偿规则，并注明达到 Legendary 后使用的方块不在补偿范围内。',
    },
    'zh-Hant': {
      title: '6/26 飾品 Miracle Time 問題補償公告',
      excerpt: '官方公告說明 6 月 26 日飾品 Miracle Time 問題的補償規則，並註明達到 Legendary 後使用的方塊不在補償範圍內。',
    },
    ja: {
      title: '6/26アクセサリーMiracle Time問題の補償告知',
      excerpt: '公式告知では、6月26日のアクセサリーMiracle Time問題に関する補償条件と、Legendary到達後に使用したキューブは対象外であることが説明されています。',
    },
  },
  n5: {
    zh: {
      title: '7 月 1 日商城更新',
      excerpt: '7 月 1 日官方商城更新包含永久版 Songless Bird Mount 和新的伤害皮肤。',
    },
    'zh-Hant': {
      title: '7 月 1 日商城更新',
      excerpt: '7 月 1 日官方商城更新包含永久版 Songless Bird Mount 和新的傷害皮膚。',
    },
    ja: {
      title: '7月1日キャッシュショップ更新',
      excerpt: '7月1日の公式キャッシュショップ更新では、永久版Songless Bird Mountと新しいダメージスキンが追加されています。',
    },
  },
};

const articleCopies: Record<string, Partial<Record<SupportedLanguage, ArticleCopy>>> = {
  n1: {
    zh: {
      lead: '这是 Nexon 官方 v.269 Ride the Lightning 更新公告的站内摘要。',
      sections: [
        '官方索引显示，该更新于 2026 年 6 月 17 日上线，并在 6 月 30 日更新公告内容。',
        '公告重点包括 New Job: Erel Light、SHINE: The Power of Starlight，以及 New Boss: Malefic Star。',
        '站内仅保留简明摘要，完整改动、活动时间和细节应以 Nexon 官方原文为准。',
      ],
      takeaway: '如果你要安排练级、活动或 Boss 进度，优先阅读官方 v.269 原文。',
    },
    'zh-Hant': {
      lead: '這是 Nexon 官方 v.269 Ride the Lightning 更新公告的站內摘要。',
      sections: [
        '官方索引顯示，該更新於 2026 年 6 月 17 日上線，並在 6 月 30 日更新公告內容。',
        '公告重點包括 New Job: Erel Light、SHINE: The Power of Starlight，以及 New Boss: Malefic Star。',
        '站內僅保留簡明摘要，完整改動、活動時間和細節應以 Nexon 官方原文為準。',
      ],
      takeaway: '如果你要安排練級、活動或 Boss 進度，優先閱讀官方 v.269 原文。',
    },
    ja: {
      lead: 'これはNexon公式v.269 Ride the Lightningパッチノートのサイト内要約です。',
      sections: [
        '公式インデックスでは、このアップデートは2026年6月17日に実装され、6月30日に告知が更新されています。',
        '主な内容はNew Job: Erel Light、SHINE: The Power of Starlight、New Boss: Malefic Starです。',
        'ここでは短い要約のみを掲載しています。詳細な変更点や期間はNexon公式本文を確認してください。',
      ],
      takeaway: '育成、イベント、ボス進行を計画する場合は公式v.269告知を優先して確認しましょう。',
    },
  },
  n2: {
    zh: {
      lead: '这是官方 Challenger World 与 Burning 活动公告的摘要。',
      sections: [
        'Challenger World 活动时间为 2026 年 6 月 17 日维护后至 2026 年 9 月 8 日 23:59 UTC。',
        '公告包含参与方式和 Burning 相关活动信息，适合准备新角色或回归角色的玩家查看。',
        '活动规则可能包含等级、世界和角色限制，具体细节应以官方原文为准。',
      ],
      takeaway: '准备练新号时，先确认活动世界、时间和参与条件。',
    },
    'zh-Hant': {
      lead: '這是官方 Challenger World 與 Burning 活動公告的摘要。',
      sections: [
        'Challenger World 活動時間為 2026 年 6 月 17 日維護後至 2026 年 9 月 8 日 23:59 UTC。',
        '公告包含參與方式和 Burning 相關活動資訊，適合準備新角色或回歸角色的玩家查看。',
        '活動規則可能包含等級、世界和角色限制，具體細節應以官方原文為準。',
      ],
      takeaway: '準備練新角色時，先確認活動世界、時間和參與條件。',
    },
    ja: {
      lead: 'これは公式Challenger WorldおよびBurningイベント告知の要約です。',
      sections: [
        'Challenger Worldは2026年6月17日のメンテナンス後から2026年9月8日23:59 UTCまで開催されます。',
        '告知には参加方法とBurning関連イベント情報が含まれ、新キャラ育成や復帰に役立ちます。',
        'レベル、ワールド、キャラクター制限がある場合があるため、詳細は公式本文を確認してください。',
      ],
      takeaway: '新キャラ育成前に、対象ワールド、期間、参加条件を確認しましょう。',
    },
  },
  n3: {
    zh: {
      lead: '这是 6/20 临时维护补偿公告的摘要。',
      sections: [
        '官方公告说明，部分玩家的星力强化费用被错误扣除。',
        '这些被错误扣除的费用会在 6 月 25 日维护期间恢复。',
        '如果你在相关时间段进行过星力强化，应查看官方公告确认补偿范围。',
      ],
      takeaway: '涉及星力费用异常的玩家，应关注 6 月 25 日维护后的恢复结果。',
    },
    'zh-Hant': {
      lead: '這是 6/20 臨時維護補償公告的摘要。',
      sections: [
        '官方公告說明，部分玩家的星力強化費用被錯誤扣除。',
        '這些被錯誤扣除的費用會在 6 月 25 日維護期間恢復。',
        '如果你在相關時間段進行過星力強化，應查看官方公告確認補償範圍。',
      ],
      takeaway: '涉及星力費用異常的玩家，應關注 6 月 25 日維護後的恢復結果。',
    },
    ja: {
      lead: 'これは6/20臨時メンテナンス補償告知の要約です。',
      sections: [
        '公式告知では、一部プレイヤーのスターフォース強化費用が誤って差し引かれたと説明されています。',
        '誤って差し引かれた費用は6月25日のメンテナンス中に復旧されます。',
        '該当期間にスターフォース強化を行った場合は、公式告知で補償範囲を確認してください。',
      ],
      takeaway: 'スターフォース費用の異常に該当する場合は、6月25日メンテナンス後の復旧状況を確認しましょう。',
    },
  },
  n4: {
    zh: {
      lead: '这是 6/26 饰品 Miracle Time 问题补偿公告的摘要。',
      sections: [
        '官方公告说明了饰品 Miracle Time 问题的补偿处理规则。',
        '其中明确提到，达到 Legendary 等级后继续使用的方块不属于补偿范围。',
        '如果你参与了该时段的饰品 Miracle Time，应根据官方原文核对补偿资格。',
      ],
      takeaway: '补偿资格重点取决于方块使用阶段，达到 Legendary 后的消耗不计入补偿。',
    },
    'zh-Hant': {
      lead: '這是 6/26 飾品 Miracle Time 問題補償公告的摘要。',
      sections: [
        '官方公告說明了飾品 Miracle Time 問題的補償處理規則。',
        '其中明確提到，達到 Legendary 等級後繼續使用的方塊不屬於補償範圍。',
        '如果你參與了該時段的飾品 Miracle Time，應根據官方原文核對補償資格。',
      ],
      takeaway: '補償資格重點取決於方塊使用階段，達到 Legendary 後的消耗不計入補償。',
    },
    ja: {
      lead: 'これは6/26アクセサリーMiracle Time問題に関する補償告知の要約です。',
      sections: [
        '公式告知では、アクセサリーMiracle Time問題の補償処理ルールが説明されています。',
        'Legendary等級に到達した後に使用したキューブは補償対象外であることが明記されています。',
        '該当時間帯に参加した場合は、公式本文で補償資格を確認してください。',
      ],
      takeaway: '補償対象はキューブを使った段階が重要で、Legendary到達後の消費は対象外です。',
    },
  },
  n5: {
    zh: {
      lead: '这是 7 月 1 日商城更新公告的摘要。',
      sections: [
        '官方商城公告列出了 7 月 1 日更新的商城物品。',
        '公告内容包括永久版 Songless Bird Mount 以及新的伤害皮肤。',
        '购买前应查看官方原文确认销售时间、物品限制和适用服务器。',
      ],
      takeaway: '想买新坐骑或伤害皮肤时，先核对官方商城公告的销售时间。',
    },
    'zh-Hant': {
      lead: '這是 7 月 1 日商城更新公告的摘要。',
      sections: [
        '官方商城公告列出了 7 月 1 日更新的商城物品。',
        '公告內容包括永久版 Songless Bird Mount 以及新的傷害皮膚。',
        '購買前應查看官方原文確認銷售時間、物品限制和適用伺服器。',
      ],
      takeaway: '想買新坐騎或傷害皮膚時，先核對官方商城公告的銷售時間。',
    },
    ja: {
      lead: 'これは7月1日キャッシュショップ更新告知の要約です。',
      sections: [
        '公式キャッシュショップ告知には、7月1日に更新された販売アイテムが掲載されています。',
        '内容には永久版Songless Bird Mountと新しいダメージスキンが含まれます。',
        '購入前に公式本文で販売期間、制限、対象サーバーを確認してください。',
      ],
      takeaway: '新しいマウントやダメージスキンを購入する前に、公式販売期間を確認しましょう。',
    },
  },
};

const categoryLabels: Record<string, Record<SupportedLanguage, string>> = {
  'Patch Notes': {
    en: 'Patch Notes',
    zh: '更新公告',
    'zh-Hant': '更新公告',
    ja: 'アップデート情報',
  },
  Event: {
    en: 'Event',
    zh: '活动',
    'zh-Hant': '活動',
    ja: 'イベント',
  },
  General: {
    en: 'General',
    zh: '综合公告',
    'zh-Hant': '綜合公告',
    ja: '一般告知',
  },
  'Cash Shop': {
    en: 'Cash Shop',
    zh: '商城',
    'zh-Hant': '商城',
    ja: '課金',
  },
};

export function getNewsCopy(news: NewsItem, language: string): NewsCopy {
  return newsCopies[news.id]?.[normalizeLanguage(language)] ?? {
    title: news.title,
    excerpt: news.excerpt,
  };
}

export function getNewsArticleCopy(id: string, language: string, fallback: ArticleCopy): ArticleCopy {
  return articleCopies[id]?.[normalizeLanguage(language)] ?? fallback;
}

export function getNewsCategoryLabel(category: string, language: string): string {
  return categoryLabels[category]?.[normalizeLanguage(language)] ?? category;
}
