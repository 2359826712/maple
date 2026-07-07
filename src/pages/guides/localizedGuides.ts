type SupportedGuideLocale = 'zh' | 'zh-Hant' | 'ja';

type GuideCardCopy = {
  title: string;
  classLabel: string;
  difficulty: string;
  length: string;
};

type GuideDetailCopy = {
  title: string;
  classLabel: string;
  difficulty: string;
  readTime: string;
  summary: string;
  toc: Array<{ id: string; title: string }>;
  sections: Array<{
    id: string;
    title: string;
    content: Array<{
      type: string;
      text?: string;
      variant?: string;
      items?: string[];
      style?: string;
      headers?: string[];
      rows?: string[][];
    }>;
  }>;
};

export const guideLocale = (language: string): SupportedGuideLocale | 'en' => {
  if (language.startsWith('zh-Hant')) return 'zh-Hant';
  if (language.startsWith('zh')) return 'zh';
  if (language.startsWith('ja')) return 'ja';
  return 'en';
};

const zhGuideCards: Record<string, GuideCardCopy> = {
  g1: { title: '六转解锁路线：从 260 级到完整 HEXA 节点', classLabel: '全职业', difficulty: '进阶', length: '18 分钟' },
  g2: { title: 'Reboot 金币成长路线：三周从 40 亿到 400 亿', classLabel: 'Reboot 专用', difficulty: '中级', length: '12 分钟' },
  g3: { title: '阴阳师养成顺序：GMS 普通服 Boss 配装优化', classLabel: '阴阳师', difficulty: '入门', length: '9 分钟' },
  g4: { title: '使魔系统入门：伤害玩家的徽章合成路线', classLabel: 'GMS 专属', difficulty: '中级', length: '14 分钟' },
  g5: { title: '从斯乌/戴米安到 Kalos：真正需要的联盟战力门槛', classLabel: '后期', difficulty: '进阶', length: '22 分钟' },
  g6: { title: 'Sol Erda 每日循环：每个角色 3 分钟完成', classLabel: '全职业', difficulty: '入门', length: '7 分钟' },
  g7: { title: 'KMS 魔方升阶策略：Miracle Time 最优投入', classLabel: '全职业', difficulty: '中级', length: '10 分钟' },
  g8: { title: 'MSEA 阿黛尔改版攻略：新技能循环与 Boss 配装', classLabel: '阿黛尔', difficulty: '中级', length: '15 分钟' },
};

const zhHantGuideCards: Record<string, GuideCardCopy> = {
  g1: { title: '六轉解鎖路線：從 260 級到完整 HEXA 節點', classLabel: '全職業', difficulty: '進階', length: '18 分鐘' },
  g2: { title: 'Reboot 楓幣成長路線：三週從 40 億到 400 億', classLabel: 'Reboot 專用', difficulty: '中級', length: '12 分鐘' },
  g3: { title: '陰陽師養成順序：GMS 普通服 Boss 配裝最佳化', classLabel: '陰陽師', difficulty: '入門', length: '9 分鐘' },
  g4: { title: '使魔系統入門：傷害玩家的徽章合成路線', classLabel: 'GMS 專屬', difficulty: '中級', length: '14 分鐘' },
  g5: { title: '從史烏/戴米安到 Kalos：真正需要的聯盟戰力門檻', classLabel: '後期', difficulty: '進階', length: '22 分鐘' },
  g6: { title: 'Sol Erda 每日循環：每個角色 3 分鐘完成', classLabel: '全職業', difficulty: '入門', length: '7 分鐘' },
  g7: { title: 'KMS 魔方升階策略：Miracle Time 最佳投入', classLabel: '全職業', difficulty: '中級', length: '10 分鐘' },
  g8: { title: 'MSEA 阿黛爾改版攻略：新技能循環與 Boss 配裝', classLabel: '阿黛爾', difficulty: '中級', length: '15 分鐘' },
};

const jaGuideCards: Record<string, GuideCardCopy> = {
  g1: { title: '6次転職解放ロードマップ：260からHEXAノード完成まで', classLabel: '全職業', difficulty: '上級', length: '18分' },
  g2: { title: 'Rebootメル進行：3週間で4Bから40Bへ', classLabel: 'Reboot専用', difficulty: '中級', length: '12分' },
  g3: { title: 'カンナ育成順：GMS通常ワールド向けボス装備', classLabel: 'カンナ', difficulty: '初級', length: '9分' },
  g4: { title: 'ファミリア入門：火力向けバッジ構築ルート', classLabel: 'GMS専用', difficulty: '中級', length: '14分' },
  g5: { title: 'スウ/デミアンからKalosへ：本当に必要なユニオン戦力', classLabel: '終盤', difficulty: '上級', length: '22分' },
  g6: { title: 'Sol Erdaデイリー：1キャラ3分のループ', classLabel: '全職業', difficulty: '初級', length: '7分' },
  g7: { title: 'KMSキューブ昇級戦略：Miracle Timeの最適支出', classLabel: '全職業', difficulty: '中級', length: '10分' },
  g8: { title: 'MSEAアデル改変ガイド：新ローテーションとボス構成', classLabel: 'アデル', difficulty: '中級', length: '15分' },
};

export const guideCardCopy: Record<SupportedGuideLocale, Record<string, GuideCardCopy>> = {
  zh: zhGuideCards,
  'zh-Hant': zhHantGuideCards,
  ja: jaGuideCards,
};

export const getGuideCardCopy = <T extends { id: string; title: string; class: string; difficulty: string; length: string }>(
  guide: T,
  language: string,
) => {
  const locale = guideLocale(language);
  if (locale === 'en') {
    return {
      title: guide.title,
      classLabel: guide.class,
      difficulty: guide.difficulty,
      length: guide.length,
    };
  }
  return guideCardCopy[locale][guide.id] ?? {
    title: guide.title,
    classLabel: guide.class,
    difficulty: guide.difficulty,
    length: guide.length,
  };
};

const zhDetail: GuideDetailCopy = {
  title: zhGuideCards.g1.title,
  classLabel: '全职业',
  difficulty: '进阶',
  readTime: '18 分钟',
  summary:
    '从 260 级到第一套完整 HEXA 节点，这篇路线会带你安排 Sol Erda 每日循环、Erda Spectrum 优先级、Origin 技能时机，以及最适合 GMS v.253 的六节点解锁顺序。',
  toc: [
    { id: 'prerequisites', title: '开始前：等级与任务要求' },
    { id: 'sol-erda', title: 'Sol Erda 每日循环：每个角色 3 分钟' },
    { id: 'erda-spectrum', title: 'Erda Spectrum 优先级' },
    { id: 'origin-skill', title: 'Origin 技能解锁与爆发时机' },
    { id: 'node-order', title: '通用 HEXA 节点解锁顺序' },
    { id: 'cost-breakdown', title: '完整成本拆解：时间与金币' },
    { id: 'gms-differences', title: 'GMS 差异：Reboot 与普通服' },
    { id: 'faq', title: '常见错误与 FAQ' },
  ],
  sections: [
    {
      id: 'prerequisites',
      title: '开始前：等级与任务要求',
      content: [
        { type: 'paragraph', text: '第一步很简单：角色必须达到 260 级。之后左侧灯泡会出现「[六转] 汇聚至起源」任务。第一个角色建议不要跳过剧情，因为它会解释 Erda 系统，也会影响你理解后面的 Origin 技能释放时机。' },
        { type: 'list', style: 'ordered', items: ['任意职业达到 260 级。', '完成「[六转] 汇聚至起源」任务，约 15 分钟。', '解锁 Sol Erda 每日系统和第一个 HEXA 节点槽。', '在汇聚大厅的 Erda 管理员处接取 Sol Erda 每日。'] },
        { type: 'callout', variant: 'warning', text: '即使用燃烧角色冲到 260，也必须在该角色上完整做完汇聚任务线。燃烧只跳过练级，不跳过任务。' },
      ],
    },
    {
      id: 'sol-erda',
      title: 'Sol Erda 每日循环：每个角色 3 分钟',
      content: [
        { type: 'paragraph', text: 'Sol Erda 每日是解锁和强化 HEXA 节点最稳定的碎片来源。熟悉地图后，每个角色平均 3 分钟左右，但真正拉开差距的是能否每天坚持做。' },
        { type: 'list', style: 'unordered', items: ['与汇聚大厅的 Erda 管理员对话。', '优先选择击杀 500 只等级范围内怪物的任务。', '领取 12 个 Sol Erda 碎片和 1 点 Sol Erda 能量。', '每天重复，碎片和能量都有上限。'] },
        { type: 'callout', variant: 'tip', text: '建议固定选打怪任务。Boss 任务可能撞冷却，小游戏在服务器延迟时也更容易出问题。' },
      ],
    },
    {
      id: 'erda-spectrum',
      title: 'Erda Spectrum 优先级',
      content: [
        { type: 'paragraph', text: 'Erda Spectrum 是汇聚地图里的周常内容，每周每角色最多进入 3 次，奖励大量碎片和能量。' },
        { type: 'table', headers: ['阶段', '最低等级', '碎片', '能量', '建议'], rows: [['Erda 的低语', '260', '40', '3', '优先做，耗时最短'], ['Erda 的召唤', '265', '60', '5', '第二优先'], ['Erda 的回声', '270', '80', '7', '属性不足时可跳过'], ['Erda 的共鸣', '275', '120', '10', '低战力建议组队']] },
      ],
    },
    {
      id: 'origin-skill',
      title: 'Origin 技能解锁与爆发时机',
      content: [
        { type: 'paragraph', text: 'Origin 技能应该是第一个解锁的 HEXA 节点。它会显著提升爆发窗口，是 260 到 280 之间最明显的一次战力跃升。' },
        { type: 'list', style: 'ordered', items: ['花费 100 个 Sol Erda 碎片解锁第一个节点。', '选择带星形图标的 Origin 技能节点。', '装备后即可使用。', '把 Origin 绑定到顺手按键，并和主要爆发技能一起规划。'] },
      ],
    },
    {
      id: 'node-order',
      title: '通用 HEXA 节点解锁顺序',
      content: [
        { type: 'paragraph', text: 'Origin 之后，建议按收益曲线逐步解锁剩余节点，先拿新节点的质变，再考虑升级已有节点。' },
        { type: 'list', style: 'ordered', items: ['<strong>Origin 技能</strong>：必须优先。', '<strong>精通核心 I</strong>：提升基础输出。', '<strong>主要 Boss 技能强化核心</strong>：选择 Boss 中最常用技能。', '<strong>精通核心 II</strong>：继续提高基础伤害。', '<strong>主刷图技能强化核心</strong>：提高练级效率。', '<strong>功能技能强化核心</strong>：通常是绑定、无敌或辅助技能。'] },
      ],
    },
    {
      id: 'cost-breakdown',
      title: '完整成本拆解：时间与金币',
      content: [
        { type: 'paragraph', text: '普通服可以用拍卖行碎片袋节省时间；Reboot 没有金币捷径，主要受每日和周常限制。' },
        { type: 'table', headers: ['方式', '每日碎片', '金币成本', '完成时间估算'], rows: [['只做每日', '12', '0', '约 117 天'], ['每日 + 每周 3 次 Spectrum', '约 20', '0', '约 70 天'], ['普通服购买碎片袋', '约 40', '约 6000 万/天', '约 35 天']] },
      ],
    },
    {
      id: 'gms-differences',
      title: 'GMS 差异：Reboot 与普通服',
      content: [
        { type: 'paragraph', text: 'HEXA 系统整体和 KMS 接近，但 GMS 的 Reboot 被动、使魔系统、攻速上限和部分职业生态会改变实际效率。' },
        { type: 'callout', variant: 'warning', text: '不要根据未来 KMS 降本预期提前规划当前 GMS 消耗。通常这些改动需要数月才会进入 GMS。' },
      ],
    },
    {
      id: 'faq',
      title: '常见错误与 FAQ',
      content: [
        { type: 'paragraph', text: '最常见的错误，是还没解锁所有节点就把碎片投入强化等级。多数情况下，新节点的收益远高于早期升级。' },
        { type: 'callout', variant: 'info', text: 'FAQ：HEXA 节点不能在角色之间转移。每个角色都需要单独完成任务并获取自己的碎片。' },
      ],
    },
  ],
};

const zhHantDetail: GuideDetailCopy = {
  ...zhDetail,
  title: zhHantGuideCards.g1.title,
  classLabel: '全職業',
  difficulty: '進階',
  readTime: '18 分鐘',
  summary: '從 260 級到第一套完整 HEXA 節點，這篇路線會帶你安排 Sol Erda 每日循環、Erda Spectrum 優先級、Origin 技能時機，以及最適合 GMS v.253 的六節點解鎖順序。',
};

const jaDetail: GuideDetailCopy = {
  title: jaGuideCards.g1.title,
  classLabel: '全職業',
  difficulty: '上級',
  readTime: '18分',
  summary:
    '260レベルから最初のHEXAノード完成まで、Sol Erdaデイリー、Erda Spectrumの優先度、Originスキルの使いどころ、GMS v.253向けの解放順をまとめたロードマップです。',
  toc: [
    { id: 'prerequisites', title: '開始前：レベルとクエスト条件' },
    { id: 'sol-erda', title: 'Sol Erdaデイリー：1キャラ3分' },
    { id: 'erda-spectrum', title: 'Erda Spectrumの優先度' },
    { id: 'origin-skill', title: 'Originスキルの解放とタイミング' },
    { id: 'node-order', title: 'HEXAノードの汎用解放順' },
    { id: 'cost-breakdown', title: 'コスト比較：時間とメル' },
    { id: 'gms-differences', title: 'GMS固有の注意点' },
    { id: 'faq', title: 'よくある失敗とFAQ' },
  ],
  sections: zhDetail.sections.map((section) => ({
    ...section,
    title: section.id === 'prerequisites' ? '開始前：レベルとクエスト条件' : section.title,
    content: section.content.map((block) => ({
      ...block,
      text: block.type === 'paragraph' ? 'この項目はGMS v.253基準で、毎日の進行を安定させるための要点をまとめています。まず新しいノード解放を優先し、強化は後回しにするのが基本です。' : block.text,
    })),
  })),
};

export const guideDetailCopy: Record<SupportedGuideLocale, GuideDetailCopy> = {
  zh: zhDetail,
  'zh-Hant': zhHantDetail,
  ja: jaDetail,
};

export const getGuideDetailCopy = <T extends GuideDetailCopy>(guide: T, language: string): T | GuideDetailCopy => {
  const locale = guideLocale(language);
  return locale === 'en' ? guide : guideDetailCopy[locale] ?? guide;
};
