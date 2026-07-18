import type { NewsContentLanguage, NewsItem, NewsLocalizedEdition } from '@/services/liveContent';

type EditionFactory = (news: NewsItem, language: NewsContentLanguage) => NewsLocalizedEdition | undefined;

const dateParts = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
};

const localizedDate = (news: NewsItem, language: NewsContentLanguage) => {
  const titleDate = news.title.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,\s+(20\d{2}))?\b/i);
  const publishedYear = new Date(news.publishedAt).getUTCFullYear();
  const titleDateValue = titleDate
    ? `${titleDate[1]} ${titleDate[2]}, ${titleDate[3] || publishedYear} 00:00:00 GMT`
    : '';
  const parts = dateParts(titleDateValue || news.publishedAt);
  if (!parts) return news.date;
  if (language === 'zh') return `${parts.year}年${parts.month}月${parts.day}日`;
  if (language === 'zh-Hant') return `${parts.year}年${parts.month}月${parts.day}日`;
  if (language === 'ja') return `${parts.year}年${parts.month}月${parts.day}日`;
  if (language === 'ko') return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
  return news.date;
};

const knownIssuesEdition: EditionFactory = (news, language) => {
  if (!/known\s+issues/i.test(news.title)) return undefined;
  const version = news.title.match(/v\.?\s*(\d+(?:\.\d+)?)/i)?.[1];
  const updateName = news.excerpt
    .match(/(?:from|for)\s+the\s+v\.?\s*\d+(?:\.\d+)?\s*[-–:]\s*([^.!]+)/i)?.[1]
    ?.replace(/\s+update$/i, '')
    .trim();
  const versionLabel = version ? `v${version}` : '';
  const updateSuffix = updateName ? `「${updateName}」` : '';

  if (language === 'zh') return {
    title: `${versionLabel} 已知问题汇总`.trim(),
    summary: `这里整理了 ${versionLabel}${updateSuffix}版本中官方确认的已知问题与已修复问题，方便玩家快速查看当前处理进度。`.replace(/  +/g, ' '),
    categoryLabel: '问题追踪',
    actionLabel: '阅读中文整理',
    searchTerms: ['已知问题', '版本问题', '修复进度', versionLabel].filter(Boolean),
    editorialStatus: 'reviewed',
  };
  if (language === 'zh-Hant') return {
    title: `${versionLabel} 已知問題整理`.trim(),
    summary: `這裡整理了 ${versionLabel}${updateSuffix}版本中官方確認的已知問題與已修復項目，方便玩家快速掌握目前處理進度。`.replace(/  +/g, ' '),
    categoryLabel: '問題追蹤',
    actionLabel: '閱讀繁中整理',
    searchTerms: ['已知問題', '版本問題', '修復進度', versionLabel].filter(Boolean),
    editorialStatus: 'reviewed',
  };
  if (language === 'ja') return {
    title: `${versionLabel} 既知の不具合まとめ`.trim(),
    summary: `${versionLabel}${updateSuffix}で公式に確認された不具合と修正済み項目を、対応状況が分かりやすいようにまとめています。`,
    categoryLabel: '不具合情報',
    actionLabel: '日本語まとめを読む',
    searchTerms: ['既知の不具合', '修正状況', versionLabel].filter(Boolean),
    editorialStatus: 'reviewed',
  };
  if (language === 'ko') return {
    title: `${versionLabel} 알려진 문제 정리`.trim(),
    summary: `${versionLabel}${updateSuffix} 업데이트에서 공식 확인된 문제와 수정 완료 항목을 진행 상황 중심으로 정리했습니다.`,
    categoryLabel: '문제 현황',
    actionLabel: '한국어 정리 보기',
    searchTerms: ['알려진 문제', '수정 현황', versionLabel].filter(Boolean),
    editorialStatus: 'reviewed',
  };
  return undefined;
};

const completedMaintenanceEdition: EditionFactory = (news, language) => {
  const combinedCopy = `${news.title} ${news.excerpt}`;
  if (!/(?:completed].*maintenance|maintenance\s+has\s+been\s+completed)/i.test(combinedCopy)) return undefined;
  const hours = combinedCopy.match(/(?:for\s+)?(\d+)\s+hours?/i)?.[1];
  const date = localizedDate(news, language);

  if (language === 'zh') return {
    title: `${date}小型维护已完成${hours ? `：商城道具期限补偿${hours}小时` : ''}`,
    summary: `本次维护现已结束${hours ? `，账号内商城道具的有效期已统一延长${hours}小时` : ''}。玩家可以正常登录游戏。`,
    categoryLabel: '维护公告',
    actionLabel: '查看维护说明',
    searchTerms: ['维护完成', '商城道具', '期限补偿', date],
    editorialStatus: 'reviewed',
  };
  if (language === 'zh-Hant') return {
    title: `${date}小型維護已完成${hours ? `：商城道具期限補償${hours}小時` : ''}`,
    summary: `本次維護現已結束${hours ? `，帳號內商城道具的有效期限已統一延長${hours}小時` : ''}。玩家可正常登入遊戲。`,
    categoryLabel: '維護公告',
    actionLabel: '查看維護說明',
    searchTerms: ['維護完成', '商城道具', '期限補償', date],
    editorialStatus: 'reviewed',
  };
  if (language === 'ja') return {
    title: `${date}の臨時メンテナンス終了${hours ? `：ポイントアイテムを${hours}時間延長` : ''}`,
    summary: `メンテナンスは終了しました。${hours ? `所持しているポイントアイテムの有効期限は一律${hours}時間延長されています。` : ''}現在は通常どおりログインできます。`,
    categoryLabel: 'メンテナンス',
    actionLabel: '対応内容を見る',
    searchTerms: ['メンテナンス終了', '有効期限延長', date],
    editorialStatus: 'reviewed',
  };
  if (language === 'ko') return {
    title: `${date} 임시 점검 완료${hours ? `: 캐시 아이템 기간 ${hours}시간 연장` : ''}`,
    summary: `점검이 완료되었습니다.${hours ? ` 보유 중인 캐시 아이템의 사용 기간은 일괄 ${hours}시간 연장되었습니다.` : ''} 현재 정상적으로 접속할 수 있습니다.`,
    categoryLabel: '점검 안내',
    actionLabel: '점검 내용 보기',
    searchTerms: ['점검 완료', '캐시 아이템', '기간 연장', date],
    editorialStatus: 'reviewed',
  };
  return undefined;
};

type RegionalEditionCopy = Partial<Record<NewsContentLanguage, {
  title: string;
  summary: string;
  categoryLabel?: string;
  actionLabel?: string;
}>>;

const regionalEdition = (
  language: NewsContentLanguage,
  copies: RegionalEditionCopy,
  fallbackCategory: string,
): NewsLocalizedEdition | undefined => {
  const copy = copies[language];
  if (!copy) return undefined;
  return {
    title: copy.title,
    summary: copy.summary,
    categoryLabel: copy.categoryLabel || fallbackCategory,
    actionLabel: copy.actionLabel || ({
      zh: '阅读本地整理',
      'zh-Hant': '閱讀本地整理',
      ja: '地域向けまとめを読む',
      ko: '지역 맞춤 정리 보기',
      en: 'Read localized brief',
    } satisfies Record<NewsContentLanguage, string>)[language],
    searchTerms: [copy.title, fallbackCategory],
    editorialStatus: 'reviewed',
  };
};

const gmsReviewedTitles: Record<string, Partial<Record<NewsContentLanguage, string>>> = {
  'Try the Kinesis Demo!': {
    zh: '体验Kinesis演示版！', 'zh-Hant': '體驗Kinesis示範版！', ja: 'Kinesisデモ版を体験！', ko: 'Kinesis 데모 버전 체험!',
  },
  'v.270 Public Test Server Coming Soon!': {
    zh: 'v.270公开测试服即将开放！', 'zh-Hant': 'v.270公開測試服即將開放！', ja: 'v.270公開テストサーバー近日オープン！', ko: 'v.270 공개 테스트 서버 오픈 예정!',
  },
  'Custom Portrait Events': {
    zh: '自定义肖像活动', 'zh-Hant': '自訂肖像活動', ja: 'カスタムポートレートイベント', ko: '커스텀 초상화 이벤트',
  },
  'Momentum Pass': {
    zh: 'Momentum通行证', 'zh-Hant': 'Momentum通行證', ja: 'Momentumパス', ko: 'Momentum 패스',
  },
  'Notice Regarding 6/26 Accessory Miracle Time Issue Compensation': {
    zh: '关于6月26日饰品奇迹时间问题补偿的公告', 'zh-Hant': '關於6月26日飾品奇蹟時間問題補償的公告', ja: '6月26日のアクセサリーミラクルタイム問題に関する補償案内', ko: '6월 26일 액세서리 미라클 타임 문제 보상 안내',
  },
  'Public Test Server Best Tester Reward Notice': {
    zh: '公开测试服最佳测试员奖励公告', 'zh-Hant': '公開測試服最佳測試員獎勵公告', ja: '公開テストサーバー ベストテスター報酬案内', ko: '공개 테스트 서버 베스트 테스터 보상 안내',
  },
  'Compensation for the 6/20 Unscheduled Maintenance': {
    zh: '6月20日临时维护补偿', 'zh-Hant': '6月20日臨時維護補償', ja: '6月20日の臨時メンテナンス補償', ko: '6월 20일 임시 점검 보상',
  },
  'Miracle Summer 2026': {
    zh: '2026奇迹夏日', 'zh-Hant': '2026奇蹟夏日', ja: 'ミラクルサマー2026', ko: '미라클 서머 2026',
  },
  'Now Available: Erel Light!': {
    zh: 'Erel Light现已推出！', 'zh-Hant': 'Erel Light現已推出！', ja: 'Erel Lightが登場！', ko: 'Erel Light 출시!',
  },
  'Challenger World and Burning Events!': {
    zh: '挑战者世界与燃烧活动！', 'zh-Hant': '挑戰者世界與燃燒活動！', ja: 'チャレンジャーワールド＆バーニングイベント！', ko: '챌린저 월드와 버닝 이벤트!',
  },
  'Operation: Dive': {
    zh: '行动：深潜', 'zh-Hant': '行動：深潛', ja: '作戦：ダイブ', ko: '작전: 다이브',
  },
  '[Updated 6/30] v.269 - Ride the Lightning Patch Notes': {
    zh: '【6月30日更新】v.269“驾驭闪电”版本说明', 'zh-Hant': '【6月30日更新】v.269「駕馭閃電」版本說明', ja: '【6月30日更新】v.269「Ride the Lightning」パッチノート', ko: '【6월 30일 업데이트】v.269 Ride the Lightning 패치 노트',
  },
  'Custom Portrait Notice': {
    zh: '自定义肖像公告', 'zh-Hant': '自訂肖像公告', ja: 'カスタムポートレートに関するお知らせ', ko: '커스텀 초상화 안내',
  },
  'Mac OS Beta Updates': {
    zh: 'macOS测试版更新', 'zh-Hant': 'macOS測試版更新', ja: 'macOSベータ版アップデート', ko: 'macOS 베타 업데이트',
  },
};

const gmsEdition: EditionFactory = (news, language) => {
  if (news.versions[0] !== 'gms' || language === 'en') return undefined;
  const cashShopUpdate = /^Cash Shop Update for\s+/i.test(news.title);
  const reviewedTitle = gmsReviewedTitles[news.title]?.[language];
  const title = cashShopUpdate
    ? ({
        zh: `${localizedDate(news, language)}现金商城更新`,
        'zh-Hant': `${localizedDate(news, language)}現金商城更新`,
        ja: `${localizedDate(news, language)}のポイントショップ更新`,
        ko: `${localizedDate(news, language)} 캐시샵 업데이트`,
      } as Partial<Record<NewsContentLanguage, string>>)[language]
    : reviewedTitle;
  if (!title) return undefined;

  const category = ({
    zh: news.category === 'Cash Shop' ? '商城更新' : news.category === 'Patch Notes' ? '版本更新' : news.category === 'Event' ? '活动公告' : '官方公告',
    'zh-Hant': news.category === 'Cash Shop' ? '商城更新' : news.category === 'Patch Notes' ? '版本更新' : news.category === 'Event' ? '活動公告' : '官方公告',
    ja: news.category === 'Cash Shop' ? 'ポイントショップ更新' : news.category === 'Patch Notes' ? 'アップデート情報' : news.category === 'Event' ? 'イベント情報' : '公式告知',
    ko: news.category === 'Cash Shop' ? '캐시샵 업데이트' : news.category === 'Patch Notes' ? '업데이트 안내' : news.category === 'Event' ? '이벤트 안내' : '공식 공지',
  } as Partial<Record<NewsContentLanguage, string>>)[language] || 'GMS';
  const summary = cashShopUpdate
    ? ({
        zh: '本周现金商城更新带来了新的风格箱、装扮与限时商品；具体上架时间、价格和内容以GMS官方公告为准。',
        'zh-Hant': '本週現金商城更新帶來新的風格箱、造型與限時商品；詳細上架時間、價格和內容以GMS官方公告為準。',
        ja: '今週のポイントショップ更新では、新しいスタイルボックス、アバター、期間限定商品が登場します。販売期間と価格はGMS公式告知をご確認ください。',
        ko: '이번 주 캐시샵 업데이트에는 새로운 스타일 박스와 코디, 기간 한정 상품이 포함됩니다. 판매 일정과 가격은 GMS 공식 공지를 확인해 주세요.',
      } as Partial<Record<NewsContentLanguage, string>>)[language]
    : ({
        zh: `这是GMS官方发布的“${title}”公告，本地整理保留了核心主题；具体日期、条件和数值以官方原文为准。`,
        'zh-Hant': `這是GMS官方發布的「${title}」公告，在地整理保留核心主題；詳細日期、條件和數值以官方原文為準。`,
        ja: `GMS公式の「${title}」に関する告知です。要点を地域向けに整理しています。日程、条件、数値は公式原文をご確認ください。`,
        ko: `GMS 공식 ‘${title}’ 공지의 핵심 내용을 지역 독자 기준으로 정리했습니다. 일정, 조건 및 수치는 공식 원문을 확인해 주세요.`,
      } as Partial<Record<NewsContentLanguage, string>>)[language];
  if (!summary) return undefined;
  return regionalEdition(language, { [language]: { title, summary, categoryLabel: category } }, category);
};

const kmsEdition: EditionFactory = (news, language) => {
  if (news.versions[0] !== 'kms' || news.sourceLanguage !== 'en') return undefined;
  if (/KMST\s+ver\.\s*1\.2\.203/i.test(news.title)) return regionalEdition(language, {
    zh: {
      title: 'KMST 1.2.203：第三枚HEXA技能核心上线测试',
      summary: '韩服测试服加入了第三枚HEXA技能核心。当前玩家主要关注技能强度偏弱的问题，后续测试补丁仍可能继续调整。',
      categoryLabel: '测试服更新',
    },
    'zh-Hant': {
      title: 'KMST 1.2.203：第三枚 HEXA 技能核心開放測試',
      summary: '韓服測試服加入第三枚 HEXA 技能核心。目前玩家主要關注技能強度偏弱，後續測試更新仍可能繼續調整。',
      categoryLabel: '測試服更新',
    },
    ja: {
      title: 'KMST 1.2.203：3つ目のHEXAスキルコアをテスト実装',
      summary: '韓国テストサーバーに3つ目のHEXAスキルコアが追加されました。現時点では火力不足への意見が多く、次回テスト更新で調整される可能性があります。',
      categoryLabel: 'テストサーバー更新',
    },
    ko: {
      title: 'KMST 1.2.203: 세 번째 HEXA 스킬 코어 테스트 적용',
      summary: '테스트 월드에 세 번째 HEXA 스킬 코어가 추가되었습니다. 현재는 낮은 성능에 대한 의견이 많으며 다음 테스트 패치에서 추가 조정될 가능성이 있습니다.',
      categoryLabel: '테스트 월드 업데이트',
    },
  }, '测试服更新');

  if (/KMS\s+ver\.\s*1\.2\.416/i.test(news.title)) return regionalEdition(language, {
    zh: {
      title: 'KMS 1.2.416：Overdrive第一阶段，契约支配者蕾忒登场',
      summary: '韩服正式服开启Overdrive第一阶段，新职业“契约支配者蕾忒”上线，同时带来便利性优化、系统更新与挑战者世界第4季。',
      categoryLabel: '韩服更新',
    },
    'zh-Hant': {
      title: 'KMS 1.2.416：Overdrive 第一階段，契約支配者蕾忒登場',
      summary: '韓服正式服開放 Overdrive 第一階段，新職業「契約支配者蕾忒」登場，並包含便利性改善、系統更新與挑戰者世界第4季。',
      categoryLabel: '韓服更新',
    },
    ja: {
      title: 'KMS 1.2.416：Overdrive第1弾、契約の支配者レテ実装',
      summary: '韓国正式サーバーでOverdrive第1弾が開始。新職業「契約の支配者レテ」に加え、利便性改善、システム更新、チャレンジャーズワールドシーズン4が追加されました。',
      categoryLabel: '韓国版アップデート',
    },
    ko: {
      title: 'KMS 1.2.416: 오버드라이브 1차, 계약의 지배자 레테 등장',
      summary: '정식 월드에 오버드라이브 1차 업데이트가 적용되었습니다. 신규 직업 계약의 지배자 레테와 편의성 개선, 시스템 개편, 챌린저스 월드 시즌 4가 포함됩니다.',
      categoryLabel: '한국 서버 업데이트',
    },
  }, '版本更新');

  if (!/\b(?:KMS|KMST)\s+ver\./i.test(news.title)) return undefined;
  const version = news.title.match(/\b(KMST?)\s+ver\.\s*([\d.]+)/i);
  const label = version ? `${version[1].toUpperCase()} ${version[2]}` : 'KMS';
  return regionalEdition(language, {
    zh: {
      title: `${label}版本重点整理`,
      summary: `本篇按韩服玩家视角整理${label}的主要改动、活动与后续影响；具体数值和开放时间以来源文章及韩服公告为准。`,
      categoryLabel: '韩服更新',
    },
    'zh-Hant': {
      title: `${label}版本重點整理`,
      summary: `本篇依韓服玩家需求整理${label}的主要改動、活動與後續影響；詳細數值和開放時間以來源文章及韓服公告為準。`,
      categoryLabel: '韓服更新',
    },
    ja: {
      title: `${label}アップデート要点まとめ`,
      summary: `${label}の主な変更、イベント、今後への影響を韓国版プレイヤー向けに整理しています。数値と実施期間は出典および韓国公式告知をご確認ください。`,
      categoryLabel: '韓国版アップデート',
    },
    ko: {
      title: `${label} 업데이트 핵심 정리`,
      summary: `${label}의 주요 변경점과 이벤트, 이후 영향까지 한국 서버 기준으로 정리했습니다. 세부 수치와 일정은 출처 및 공식 공지를 확인해 주세요.`,
      categoryLabel: '한국 서버 업데이트',
    },
  }, '版本更新');
};

const jmsReviewedTitles: Record<string, Partial<Record<NewsContentLanguage, string>>> = {
  '「#メイプルCCC CREW応援ミッション投稿キャンペーン」開催のお知らせ': {
    en: '#Maple CCC CREW Support Mission post campaign announced',
    zh: '“#Maple CCC CREW应援任务”投稿活动公告',
    'zh-Hant': '「#Maple CCC CREW應援任務」投稿活動公告',
    ko: '#메이플 CCC CREW 응원 미션 게시물 캠페인 안내',
  },
  'スペシャルサンデーメイプル': {
    en: 'Special Sunday Maple', zh: '特别周日冒险岛', 'zh-Hant': '特別週日楓之谷', ko: '스페셜 선데이 메이플',
  },
  '【完了】7月8日(水)ショップ、チャンネル別臨時メンテナンスのお知らせ（7/8 13:10更新）': {
    en: '[Completed] Temporary shop and channel maintenance on July 8',
    zh: '【已完成】7月8日商城及部分频道临时维护',
    'zh-Hant': '【已完成】7月8日商城及部分頻道臨時維護',
    ko: '【완료】7월 8일 상점 및 채널별 임시 점검',
  },
  'プラチナムアップル': {
    en: 'Platinum Apple', zh: '白金苹果活动', 'zh-Hant': '白金蘋果活動', ko: '플래티넘 애플 이벤트',
  },
  '「#メイプルCCC 応援コメント投稿キャンペーン」開催のお知らせ': {
    en: '#Maple CCC Support Comment post campaign announced',
    zh: '“#Maple CCC应援评论”投稿活动公告',
    'zh-Hant': '「#Maple CCC應援留言」投稿活動公告',
    ko: '#메이플 CCC 응원 댓글 게시물 캠페인 안내',
  },
  '【完了】7月6日(月)ログイン、チャンネル別臨時メンテナンスのお知らせ（7/6 19:30更新）': {
    en: '[Completed] Temporary login and channel maintenance on July 6',
    zh: '【已完成】7月6日登录及部分频道临时维护',
    'zh-Hant': '【已完成】7月6日登入及部分頻道臨時維護',
    ko: '【완료】7월 6일 로그인 및 채널별 임시 점검',
  },
};

const jmsEdition: EditionFactory = (news, language) => {
  if (news.versions[0] !== 'jms' || language === 'ja') return undefined;
  const title = news.translations?.[language]?.title.trim() || jmsReviewedTitles[news.title]?.[language];
  if (!title) return undefined;
  const summaries: Record<NewsContentLanguage, string> = {
    en: `A Japan MapleStory notice covering “${title}”. The localized brief keeps the event or maintenance context clear; dates and eligibility follow the Japanese official notice.`,
    zh: `这是日本《冒险岛》“${title}”公告的本地整理版，重点保留活动或维护背景；日期、参与条件与补偿以日本官网为准。`,
    'zh-Hant': `這是日本《楓之谷》「${title}」公告的在地整理版，重點保留活動或維護背景；日期、參加條件與補償以日本官網為準。`,
    ja: '',
    ko: `일본 메이플스토리의 ‘${title}’ 공지를 지역 독자 기준으로 정리했습니다. 일정, 참여 조건 및 보상은 일본 공식 공지를 기준으로 합니다.`,
  };
  return regionalEdition(language, {
    [language]: { title, summary: summaries[language] },
  }, news.category === 'Event'
    ? ({ en: 'Japan event', zh: '日服活动', 'zh-Hant': '日服活動', ja: 'イベント', ko: '일본 서버 이벤트' } as const)[language]
    : news.category === 'Patch Notes'
      ? ({ en: 'Japan maintenance', zh: '日服维护', 'zh-Hant': '日服維護', ja: 'メンテナンス', ko: '일본 서버 점검' } as const)[language]
      : ({ en: 'Japan notice', zh: '日服公告', 'zh-Hant': '日服公告', ja: 'お知らせ', ko: '일본 서버 공지' } as const)[language]);
};

const tmsSimplifiedTitles: Record<string, string> = {
  '【黃金蘋果】燃燒之戒': '【黄金苹果】燃烧之戒登场',
  '【魔法畫框】強力卷軸 限時販售！': '【魔法画框】强力卷轴限时销售',
  '【閃亮彗星】赤月的妖怪＆愛心俏魔女': '【闪亮彗星】赤月妖怪与爱心俏魔女',
  '【皇家美容院】里耶＆蒂娜髮型、銀河系夜臉型': '【皇家美容院】里耶与蒂娜发型、银河夜脸型',
  '【水球活動】時髦汪洋套組、闇夜靜謐/闇夜深淵交換券、職業組合包': '【水球活动】时髦汪洋套装、暗夜静谧／暗夜深渊交换券与职业礼包',
  '新楓之谷《0715(三) CROWN例行維護關機公告》': '台服7月15日CROWN例行维护停机公告',
};

const tmsEdition: EditionFactory = (news, language) => {
  if (news.versions[0] !== 'tms' || language !== 'zh') return undefined;
  const title = tmsSimplifiedTitles[news.title];
  if (!title) return undefined;
  const isMaintenance = /維護/.test(news.title);
  return regionalEdition(language, {
    zh: {
      title,
      summary: isMaintenance
        ? '这是台服例行维护的简体中文整理版，开关机时间、受影响服务及临时调整请以台服官方公告为准。'
        : '这是面向简体中文玩家整理的台服活动／商城资讯，重点保留商品主题与活动类型；销售时间和获得方式以台服官方公告为准。',
      categoryLabel: isMaintenance ? '维护公告' : '台服活动',
    },
  }, isMaintenance ? '维护公告' : '台服活动');
};

const mseaChineseTitles: Record<string, string> = {
  '[Weapon] TRIPLE Miracle Time': '【武器】三倍奇迹时间',
  "[v252] - July's Sunday Maple Benefits": '【v252】7月周日冒险岛福利',
  'Brilliant Star iGacha (Updated: 10th July)': '璀璨之星iGacha（7月10日更新）',
  'Special Sunday Maple - Guardian Star Force Time (v251)': '特别周日冒险岛：守护星之力时段（v251）',
  '21st Anniversary Birthday Special': '21周年生日特别活动',
  '[ALL] CROWN LUCKY SEVEN MIRACLE TIME': '【全装备】CROWN幸运7奇迹时间',
};

const mseaEdition: EditionFactory = (news, language) => {
  if (news.versions[0] !== 'msea' || language !== 'zh') return undefined;
  const title = mseaChineseTitles[news.title];
  if (!title) return undefined;
  return regionalEdition(language, {
    zh: {
      title,
      summary: `这是东南亚服“${title}”活动的中文整理版，适用装备、开放时段、参与条件与奖励范围以MapleStorySEA官方公告为准。`,
      categoryLabel: '东南亚服活动',
    },
  }, '东南亚服活动');
};

const editionFactories: EditionFactory[] = [
  knownIssuesEdition,
  completedMaintenanceEdition,
  gmsEdition,
  kmsEdition,
  jmsEdition,
  tmsEdition,
  mseaEdition,
];

export const getCuratedNewsEdition = (news: NewsItem, language: NewsContentLanguage) => {
  if (language === 'en') return undefined;
  for (const factory of editionFactories) {
    const edition = factory(news, language);
    if (edition) return edition;
  }
  return undefined;
};
