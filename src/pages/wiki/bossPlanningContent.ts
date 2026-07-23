import type { SupportedLanguage } from '@/i18n/languageRouting';
import type { BossInfo } from '@/mocks/bosses';

export type BossPlanningSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BossPlanningContent = {
  eyebrow: string;
  title: string;
  introduction: string;
  noticeTitle: string;
  noticeBody: string;
  officialAction: string;
  sections: BossPlanningSection[];
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
};

const difficultyLabel = (boss: BossInfo) => boss.difficulty.join(', ');
const cadence = (boss: BossInfo) => (
  boss.weeklyLimit > 0
    ? `${boss.weeklyLimit} clear${boss.weeklyLimit === 1 ? '' : 's'} per weekly reset period`
    : `${boss.dailyLimit} clear${boss.dailyLimit === 1 ? '' : 's'} per daily reset period`
);

const englishContent = (boss: BossInfo): BossPlanningContent => ({
  eyebrow: 'GMS boss planning',
  title: `How to prepare for ${boss.name} without relying on unverified numbers`,
  introduction: `This ${boss.name} page is an internal MPStorys planning guide for Global MapleStory. It keeps the confirmed entry snapshot, server scope, difficulty names, and reset cadence visible while more detailed combat information is reviewed. It does not present an estimated damage requirement as an official threshold, and it does not copy a strategy from another regional service as if it were current GMS guidance.`,
  noticeTitle: 'Detailed combat facts are still being verified',
  noticeBody: `MPStorys currently publishes the ${boss.name} entry and reset snapshot only. Rewards, battle-power targets, phase mechanics, and strategy instructions remain withheld until they can be tied to a trustworthy GMS source and a dated game version.`,
  officialAction: 'Open the official GMS boss guide',
  sections: [
    {
      title: `${boss.name} GMS planning snapshot`,
      paragraphs: [
        `The registry currently identifies ${boss.name} as a MapleStory boss with a minimum entry level of Lv.${boss.minLevel}. The listed boss level is ${boss.level}, and the available difficulty labels are ${difficultyLabel(boss)}. The recorded cadence is ${cadence(boss)}. These values are presented as navigation and scheduling information, not as a promise that a character at the minimum level is ready to clear every difficulty.`,
        `Before entering, compare the selected difficulty with the current in-game Boss UI. A patch can change entry quests, party limits, clear counts, reward rules, or practice-mode behavior. The GMS client and a dated Nexon notice take priority over screenshots, cached guides, or information written for KMS, JMS, TMS, or MapleStory M.`,
      ],
      bullets: [
        `Server scope: Global MapleStory (GMS)`,
        `Minimum entry level shown: Lv.${boss.minLevel}`,
        `Boss level shown: ${boss.level}`,
        `Difficulty labels: ${difficultyLabel(boss)}`,
        `Recorded clear cadence: ${cadence(boss)}`,
      ],
    },
    {
      title: `What to confirm before a ${boss.name} attempt`,
      paragraphs: [
        `Start with access. Confirm that the character meets the level requirement, has completed any prerequisite quest line shown by the game, and can enter the intended difficulty on the selected world. If the Boss UI offers a practice mode, use it to check movement, survivability, and party coordination before consuming a real clear opportunity.`,
        `Then confirm timing. Daily and weekly bosses follow different reset schedules, and maintenance can affect the practical window for an attempt. Check the current server time, the remaining clear count, and whether a clear is recorded per character, per world, or per account. MPStorys does not infer those rules when the official GMS source does not state them clearly.`,
      ],
      bullets: [
        'Open the in-game Boss UI and select the exact difficulty.',
        'Read prerequisite quests and entry messages on the character you will use.',
        'Check party size, practice-mode availability, and remaining entries.',
        'Confirm the next GMS reset and any scheduled maintenance.',
        'Recheck recent patch notes or known issues before relying on an older guide.',
      ],
    },
    {
      title: `Choosing a ${boss.name} difficulty responsibly`,
      paragraphs: [
        `The presence of ${difficultyLabel(boss)} options does not mean that level alone determines readiness. Different difficulties can change health, damage, time limits, failure conditions, phase behavior, and reward eligibility. A useful readiness decision considers survival consistency, mechanic execution, burst timing, party support, and the time remaining before enrage or timeout.`,
        `Treat community battle-power figures as observations, not guarantees. Class kit, combat uptime, origin and HEXA progression, equipment, familiars, links, legion, buffs, latency, and party composition can all change the result. Until a reliable GMS source is attached, this page intentionally avoids publishing a single recommended BP number that could mislead players.`,
      ],
    },
    {
      title: `${boss.name} reset and progression workflow`,
      paragraphs: [
        `Use the recorded ${cadence(boss)} as a planning reminder, then verify it in game. Put the attempt on a checklist only after confirming that the character still has an entry or clear available. For a new difficulty, schedule practice early in the reset period so there is time to adjust equipment, learn visual cues, or reorganize the party.`,
        `After a successful clear, verify the reward room and quest state before leaving. If a reward is affected by world type, difficulty, event period, or a limited claim window, record that condition with the source date. This prevents an event reward or temporary bonus from being mistaken for a permanent ${boss.name} drop.`,
      ],
    },
    {
      title: 'How MPStorys verifies boss information',
      paragraphs: [
        `MPStorys separates confirmed planning facts from unverified combat advice. A source must identify the relevant GMS boss, difficulty, date, and game version before its mechanics or rewards are published as factual guidance. Official patch notes, official event notices, the live Boss UI, and dated Nexon support notices are stronger evidence than an undated image or a copied table.`,
        `When a source changes, the page should preserve its previous verification date and update only the affected facts. Regional differences stay labelled. A KMS mechanic can be useful research context, but it is not silently promoted to GMS truth. This policy keeps ${boss.name} search coverage useful without filling the page with guesses.`,
      ],
    },
  ],
  faqTitle: `${boss.name} planning FAQ`,
  faq: [
    {
      question: `Is this a complete ${boss.name} strategy guide?`,
      answer: `Not yet. This page currently provides GMS entry, difficulty, and reset planning. Detailed phases, damage targets, rewards, and tactics are withheld until they are supported by a trustworthy dated source.`,
    },
    {
      question: `What level is required to enter ${boss.name}?`,
      answer: `The current registry shows a minimum entry level of Lv.${boss.minLevel}. Check the live GMS Boss UI for prerequisite quests, world restrictions, and difficulty-specific requirements before entering.`,
    },
    {
      question: `Which ${boss.name} difficulties are listed?`,
      answer: `The page currently lists ${difficultyLabel(boss)}. Availability and entry rules should be confirmed in the current GMS client because patches can change the supported modes.`,
    },
    {
      question: `How often can ${boss.name} be cleared?`,
      answer: `The planning registry currently records ${cadence(boss)}. Verify the remaining count and reset time in game before treating that cadence as the final rule for your character or world.`,
    },
    {
      question: `Why is there no recommended battle power?`,
      answer: 'A single unsourced BP threshold can be misleading across classes, gear states, parties, and patches. MPStorys will only publish a target when its source, assumptions, server, and verification date can be shown.',
    },
    {
      question: `Where should I check the newest ${boss.name} changes?`,
      answer: 'Use the linked official GMS boss guide, recent Nexon patch notes, and known-issue notices. The newest dated official source should override an older community screenshot or cached guide.',
    },
  ],
});

const localizedContent = (
  boss: BossInfo,
  language: Exclude<SupportedLanguage, 'en'>,
): BossPlanningContent => {
  const difficulties = difficultyLabel(boss);
  const weekly = boss.weeklyLimit > 0;
  const resetCount = weekly ? boss.weeklyLimit : boss.dailyLimit;

  if (language === 'zh') {
    const reset = weekly ? `每个周重置周期可完成 ${resetCount} 次` : `每个日重置周期可完成 ${resetCount} 次`;
    return {
      eyebrow: 'GMS Boss 规划',
      title: `${boss.name}：在不依赖未经验证数值的情况下准备挑战`,
      introduction: `这是 MPStorys 为 Global MapleStory 整理的 ${boss.name} 站内规划页。页面保留服务器范围、最低进入等级、难度名称和重置节奏，并把尚未核实的战力、掉落、机制和打法明确隔离。这样既能回答玩家准备挑战时的实际问题，也不会把其他地区或旧版本的数据包装成当前 GMS 结论。`,
      noticeTitle: '详细战斗资料仍在核验',
      noticeBody: `当前只发布 ${boss.name} 的进入与重置信息。奖励、推荐战力、阶段机制和攻略需要绑定可信的 GMS 来源与版本日期后才会显示。`,
      officialAction: '打开 GMS 官方 Boss 指南',
      sections: [
        {
          title: `${boss.name} GMS 规划摘要`,
          paragraphs: [
            `当前记录显示 ${boss.name} 的最低进入等级为 Lv.${boss.minLevel}，Boss 等级为 ${boss.level}，页面列出的难度包括 ${difficulties}，清除节奏记录为${reset}。最低进入等级只代表可以开始检查该内容，并不表示角色已经具备通关所有难度的能力。`,
            `进入前应在游戏内 Boss 界面重新确认所选难度。补丁可能调整前置任务、队伍人数、练习模式、清除次数或奖励条件。GMS 客户端和带日期的 Nexon 公告优先于截图、缓存攻略以及 KMS、JMS、TMS 或 MapleStory M 的资料。`,
          ],
          bullets: [`服务器：Global MapleStory（GMS）`, `最低进入等级：Lv.${boss.minLevel}`, `Boss 等级：${boss.level}`, `难度：${difficulties}`, `记录的清除节奏：${reset}`],
        },
        {
          title: `挑战 ${boss.name} 前要确认什么`,
          paragraphs: [
            `先确认进入资格：角色等级、前置任务、世界限制、所选难度和队伍条件都应以当前游戏提示为准。如果存在练习模式，应先检查移动、生存、爆发时机和队伍配合，再使用真实的清除机会。`,
            `随后确认时间与次数。每日和每周 Boss 的重置规则不同，维护也可能缩短实际挑战窗口。请核对服务器时间、剩余次数，以及限制究竟按角色、世界还是账号计算。官方没有明确说明的部分，本站不会自行推断。`,
          ],
          bullets: ['在游戏内选择准确难度。', '查看角色当前的前置任务与进入提示。', '确认队伍人数、练习模式和剩余次数。', '核对 GMS 下次重置与维护时间。', '参考最近的补丁说明和已知问题。'],
        },
        {
          title: `${boss.name} 难度与角色准备`,
          paragraphs: [
            `页面列出 ${difficulties} 并不意味着等级是唯一门槛。不同难度可能改变生命值、伤害、时间限制、失败条件、阶段行为和奖励资格。判断准备度时应同时考虑生存稳定性、机制执行、爆发安排、队伍辅助和限时。`,
            `社区战力只能作为样本，不能视为保证。职业机制、HEXA 进度、装备、联盟、Link、熟悉度、延迟和队伍配置都会改变结果。在来源能够说明服务器、版本和假设前，本站不会发布看似精确却可能误导玩家的单一推荐战力。`,
          ],
        },
        {
          title: `${boss.name} 重置与进度安排`,
          paragraphs: [
            `可先用“${reset}”作为提醒，但最终以游戏内剩余次数为准。第一次挑战新难度时，最好在重置周期前段安排练习，为调整装备、识别提示和重新组织队伍留出时间。`,
            `通关后应在离开奖励区域前确认掉落、任务状态和领取条件。如果奖励受世界类型、难度、活动周期或领取期限影响，应连同来源日期记录，避免把临时活动奖励误认为 ${boss.name} 的永久掉落。`,
          ],
        },
        {
          title: 'MPStorys 如何核验 Boss 内容',
          paragraphs: [
            `本站把已确认的规划事实与未经验证的战斗建议分开。只有来源能够明确对应 GMS、Boss、难度、日期和游戏版本时，机制或奖励才会作为事实发布。官方补丁、活动公告、游戏内 Boss 界面和 Nexon 已知问题页的证据等级高于无日期截图。`,
            `资料更新时会保留核验日期，并只修改受到影响的字段。其他地区的机制可以作为研究线索，但不会直接写成 GMS 结论。这能增加 ${boss.name} 页面的有效内容，同时避免为了关键词密度填充猜测。`,
          ],
        },
      ],
      faqTitle: `${boss.name} 常见问题`,
      faq: [
        { question: `这是完整的 ${boss.name} 攻略吗？`, answer: '目前是 GMS 进入、难度与重置规划页。阶段机制、战力、奖励和打法将在取得可信且带日期的来源后补充。' },
        { question: `${boss.name} 的进入等级是多少？`, answer: `当前记录显示最低进入等级为 Lv.${boss.minLevel}。前置任务、世界限制和具体难度要求仍应在 GMS 客户端确认。` },
        { question: `${boss.name} 有哪些难度？`, answer: `当前列出 ${difficulties}。版本更新后请以游戏内 Boss 界面为准。` },
        { question: `${boss.name} 多久可以完成一次？`, answer: `当前规划记录为${reset}。挑战前请检查角色或世界的剩余次数和实际重置时间。` },
        { question: '为什么没有推荐战力？', answer: '未经说明职业、队伍、版本和验证日期的单一战力数字容易误导，因此本站暂不显示。' },
        { question: `在哪里查看最新的 ${boss.name} 变化？`, answer: '优先查看页面链接的 GMS 官方 Boss 指南、最新 Nexon 补丁说明和已知问题公告。' },
      ],
    };
  }

  if (language === 'zh-Hant') {
    const reset = weekly ? `每個週重置週期可完成 ${resetCount} 次` : `每個日重置週期可完成 ${resetCount} 次`;
    return {
      eyebrow: 'GMS Boss 規劃',
      title: `${boss.name}：不依賴未驗證數值的挑戰準備`,
      introduction: `這是 MPStorys 為 Global MapleStory 整理的 ${boss.name} 站內規劃頁。頁面保留伺服器範圍、最低進入等級、難度與重置節奏，並把尚未核實的戰力、掉落、機制和打法清楚隔離，避免把其他地區或舊版本內容當成目前 GMS 結論。`,
      noticeTitle: '詳細戰鬥資料仍在核驗',
      noticeBody: `目前只發布 ${boss.name} 的進入與重置資訊。獎勵、建議戰力、階段機制和攻略必須連結可信的 GMS 來源與版本日期後才會顯示。`,
      officialAction: '開啟 GMS 官方 Boss 指南',
      sections: [
        {
          title: `${boss.name} GMS 規劃摘要`,
          paragraphs: [
            `目前記錄的最低進入等級是 Lv.${boss.minLevel}，Boss 等級為 ${boss.level}，難度包含 ${difficulties}，清除節奏為${reset}。最低等級只代表可以檢查內容，不表示角色已能完成所有難度。`,
            `進入前請在遊戲內 Boss 介面重新確認難度、前置任務、隊伍限制、練習模式與剩餘次數。GMS 客戶端和有日期的 Nexon 公告優先於截圖、快取攻略或其他地區資料。`,
          ],
          bullets: [`伺服器：Global MapleStory（GMS）`, `最低進入等級：Lv.${boss.minLevel}`, `Boss 等級：${boss.level}`, `難度：${difficulties}`, `記錄的清除節奏：${reset}`],
        },
        {
          title: `挑戰 ${boss.name} 前的檢查`,
          paragraphs: [
            `先確認角色等級、前置任務、世界限制、隊伍條件和所選難度。若有練習模式，先測試移動、生存、爆發時機和隊伍配合，再使用正式清除機會。`,
            `每日與每週 Boss 的重置不同，維護也可能影響實際時段。請核對伺服器時間、剩餘次數，以及限制按角色、世界或帳號計算。官方沒有明確說明的部分不應自行推測。`,
          ],
          bullets: ['選擇正確難度。', '查看角色前置任務與進入提示。', '確認隊伍人數、練習模式和剩餘次數。', '核對 GMS 重置與維護時間。', '查看近期補丁與已知問題。'],
        },
        {
          title: `${boss.name} 難度與準備度`,
          paragraphs: [
            `不同難度可能改變生命值、傷害、時間限制、失敗條件、階段行為和獎勵資格。準備度應同時考慮生存穩定性、機制執行、爆發安排、隊伍支援和限時。`,
            `社群戰力只能作為觀察樣本。職業、HEXA、裝備、聯盟、Link、延遲與隊伍配置都會改變結果，因此本站不會在來源不足時刊登單一建議戰力。`,
          ],
        },
        {
          title: `${boss.name} 重置與進度安排`,
          paragraphs: [
            `可把「${reset}」當作提醒，但仍要以遊戲內剩餘次數為準。新難度最好在週期前段練習，保留調整裝備、熟悉提示與重組隊伍的時間。`,
            `通關後離開前應確認掉落、任務和領取條件。若獎勵受世界、難度、活動或期限影響，應連同來源日期記錄，避免把限時獎勵誤認為永久掉落。`,
          ],
        },
        {
          title: 'MPStorys 的核驗原則',
          paragraphs: [
            `只有來源能明確對應 GMS、Boss、難度、日期和版本時，機制與獎勵才會作為事實刊登。官方補丁、活動公告、遊戲內介面與 Nexon 已知問題頁優先於無日期截圖。`,
            `其他地區內容可作為研究線索，但不會直接改寫成 GMS 結論。這讓 ${boss.name} 頁面增加真正有用的內容，而不是為了密度加入猜測。`,
          ],
        },
      ],
      faqTitle: `${boss.name} 常見問題`,
      faq: [
        { question: `這是完整的 ${boss.name} 攻略嗎？`, answer: '目前是 GMS 進入、難度與重置規劃頁。詳細機制、戰力、獎勵和打法會在來源完成核驗後補充。' },
        { question: `${boss.name} 的進入等級？`, answer: `目前顯示最低 Lv.${boss.minLevel}，前置任務與難度限制仍以 GMS 客戶端為準。` },
        { question: `${boss.name} 有哪些難度？`, answer: `目前列出 ${difficulties}，請在更新後重新確認遊戲介面。` },
        { question: `${boss.name} 多久能完成一次？`, answer: `目前記錄為${reset}，實際剩餘次數與重置時間請在遊戲內確認。` },
        { question: '為什麼沒有建議戰力？', answer: '沒有職業、隊伍、版本和日期背景的單一數字容易誤導，因此暫不刊登。' },
        { question: `如何追蹤 ${boss.name} 更新？`, answer: '查看 GMS 官方 Boss 指南、Nexon 補丁說明與已知問題公告。' },
      ],
    };
  }

  if (language === 'ja') {
    const reset = weekly ? `週次リセットごとに${resetCount}回` : `日次リセットごとに${resetCount}回`;
    return {
      eyebrow: 'GMSボス準備ガイド',
      title: `${boss.name}：未検証の数値に頼らない挑戦準備`,
      introduction: `このページはGlobal MapleStory向けの${boss.name}準備ガイドです。入場レベル、難易度、リセット周期など確認できる範囲を掲載し、出典を確認できない戦闘力、報酬、ギミック、攻略手順は分離しています。KMSやJMSの古い情報を現在のGMS仕様として扱うことはありません。`,
      noticeTitle: '詳細な戦闘情報は確認中です',
      noticeBody: `${boss.name}の入場とリセット情報のみ公開しています。報酬、推奨戦闘力、フェーズ、攻略はGMSの信頼できる日付付き情報と照合後に追加します。`,
      officialAction: 'GMS公式ボスガイドを開く',
      sections: [
        {
          title: `${boss.name} GMS準備スナップショット`,
          paragraphs: [
            `現在の記録では最低入場レベルはLv.${boss.minLevel}、ボスレベルは${boss.level}、難易度は${difficulties}、クリア周期は${reset}です。最低レベルは全難易度の討伐可能ラインを意味しません。`,
            `挑戦前にゲーム内ボスUIで難易度、前提クエスト、パーティー制限、練習モード、残り回数を再確認してください。日付付きのGMS公式情報が、画像や他地域の攻略より優先されます。`,
          ],
          bullets: ['対象：Global MapleStory（GMS）', `最低入場：Lv.${boss.minLevel}`, `ボスレベル：${boss.level}`, `難易度：${difficulties}`, `記録周期：${reset}`],
        },
        {
          title: `${boss.name}挑戦前の確認項目`,
          paragraphs: [
            'キャラクターレベル、前提クエスト、ワールド条件、パーティー人数、選択難易度を確認します。練習モードがある場合は、移動、生存、バースト、連携を先に試してください。',
            '日次と週次ではリセットが異なり、メンテナンスも挑戦可能時間に影響します。残り回数と制限単位がキャラクター、ワールド、アカウントのどれかをゲーム内で確認します。',
          ],
          bullets: ['正しい難易度を選ぶ。', '前提クエストを確認する。', '練習モードと残り回数を確認する。', 'GMSのリセットとメンテナンスを確認する。', '最新パッチと既知の問題を読む。'],
        },
        {
          title: `${boss.name}の難易度と準備度`,
          paragraphs: [
            '難易度によってHP、被ダメージ、制限時間、失敗条件、フェーズ、報酬資格が変わる場合があります。レベルだけでなく、生存、ギミック処理、バースト、支援、制限時間を総合して判断します。',
            'コミュニティの戦闘力目安は保証ではありません。職業、HEXA、装備、リンク、ユニオン、遅延、パーティー構成によって結果が変わるため、出典のない単一の推奨値は掲載しません。',
          ],
        },
        {
          title: `${boss.name}のリセット管理`,
          paragraphs: [
            `「${reset}」を予定作成の目安にし、最終的な残り回数はゲーム内で確認します。新しい難易度は周期の早い段階で練習し、装備や編成を見直す時間を残します。`,
            '討伐後は退出前に報酬、クエスト、受取条件を確認します。期間限定イベント報酬を恒常ドロップとして扱わないよう、ワールド、難易度、期間、出典日を区別します。',
          ],
        },
        {
          title: 'MPStorysの検証方針',
          paragraphs: [
            'GMS、ボス、難易度、日付、バージョンが確認できる情報だけを事実として扱います。公式パッチ、イベント告知、ゲーム内UI、Nexonの既知の問題が主な根拠です。',
            `他地域の情報は調査材料にはなりますが、そのままGMS仕様にはしません。${boss.name}の検索内容を増やす場合も、推測ではなく確認手順と出典を優先します。`,
          ],
        },
      ],
      faqTitle: `${boss.name} よくある質問`,
      faq: [
        { question: `完全な${boss.name}攻略ですか？`, answer: '現時点ではGMSの入場、難易度、リセット準備ガイドです。詳細は信頼できる出典の確認後に追加します。' },
        { question: `入場レベルは？`, answer: `現在の記録はLv.${boss.minLevel}です。前提クエストと難易度条件はGMSクライアントで確認してください。` },
        { question: `難易度は？`, answer: `${difficulties}を掲載しています。アップデート後はゲーム内表示を優先してください。` },
        { question: `クリア周期は？`, answer: `現在の記録は${reset}です。残り回数と実際のリセット時刻を確認してください。` },
        { question: '推奨戦闘力がない理由は？', answer: '職業、編成、パッチ、検証日がない単一数値は誤解を招くためです。' },
        { question: `最新変更の確認先は？`, answer: 'GMS公式ボスガイド、Nexonパッチノート、既知の問題を確認してください。' },
      ],
    };
  }

  const reset = weekly ? `주간 초기화 주기마다 ${resetCount}회` : `일일 초기화 주기마다 ${resetCount}회`;
  return {
    eyebrow: 'GMS 보스 준비',
    title: `${boss.name}: 검증되지 않은 수치 없이 준비하는 방법`,
    introduction: `이 페이지는 Global MapleStory의 ${boss.name} 도전을 위한 MPStorys 내부 준비 가이드입니다. 입장 레벨, 난이도, 초기화 주기처럼 확인 가능한 범위를 보여 주고, 출처가 부족한 전투력·보상·패턴·공략은 분리합니다. KMS나 다른 지역의 정보를 현재 GMS 사실처럼 옮기지 않습니다.`,
    noticeTitle: '세부 전투 정보는 검증 중입니다',
    noticeBody: `${boss.name}의 입장 및 초기화 정보만 공개 중입니다. 보상, 권장 전투력, 페이즈와 공략은 날짜와 버전이 확인되는 GMS 출처를 연결한 뒤 추가합니다.`,
    officialAction: 'GMS 공식 보스 가이드 열기',
    sections: [
      {
        title: `${boss.name} GMS 준비 요약`,
        paragraphs: [
          `현재 기록은 최소 입장 레벨 Lv.${boss.minLevel}, 보스 레벨 ${boss.level}, 난이도 ${difficulties}, 클리어 주기 ${reset}입니다. 최소 레벨이 모든 난이도의 클리어 가능 스펙을 의미하지는 않습니다.`,
          '도전 전에 게임 내 보스 UI에서 난이도, 선행 퀘스트, 파티 제한, 연습 모드, 남은 횟수를 다시 확인하세요. 날짜가 있는 GMS 공식 정보가 스크린샷이나 다른 지역 공략보다 우선합니다.',
        ],
        bullets: ['대상: Global MapleStory(GMS)', `최소 입장: Lv.${boss.minLevel}`, `보스 레벨: ${boss.level}`, `난이도: ${difficulties}`, `기록된 주기: ${reset}`],
      },
      {
        title: `${boss.name} 도전 전 확인 사항`,
        paragraphs: [
          '캐릭터 레벨, 선행 퀘스트, 월드 조건, 파티 인원, 선택 난이도를 확인합니다. 연습 모드가 있다면 실제 클리어 기회를 사용하기 전에 이동, 생존, 극딜 타이밍과 파티 합을 점검합니다.',
          '일일 보스와 주간 보스는 초기화 방식이 다르며 점검도 도전 가능 시간에 영향을 줍니다. 남은 횟수와 제한 단위가 캐릭터, 월드, 계정 중 무엇인지 게임에서 확인해야 합니다.',
        ],
        bullets: ['정확한 난이도 선택', '선행 퀘스트와 입장 메시지 확인', '연습 모드와 남은 횟수 확인', 'GMS 초기화 및 점검 시간 확인', '최근 패치와 알려진 문제 확인'],
      },
      {
        title: `${boss.name} 난이도와 준비도`,
        paragraphs: [
          '난이도에 따라 체력, 피해, 제한 시간, 실패 조건, 페이즈와 보상 조건이 달라질 수 있습니다. 레벨뿐 아니라 생존 안정성, 패턴 수행, 극딜, 파티 지원과 제한 시간을 함께 봐야 합니다.',
          '커뮤니티 전투력은 관찰값이지 보장이 아닙니다. 직업, HEXA, 장비, 링크, 유니온, 지연과 파티 구성에 따라 결과가 달라지므로 출처 없는 단일 권장 수치를 게시하지 않습니다.',
        ],
      },
      {
        title: `${boss.name} 초기화와 진행 계획`,
        paragraphs: [
          `「${reset}」을 일정 참고로 사용하되 실제 남은 횟수는 게임에서 확인합니다. 새 난이도는 주기 초반에 연습해 장비와 파티를 조정할 시간을 남기는 편이 안전합니다.`,
          '클리어 후에는 퇴장 전에 보상, 퀘스트, 수령 조건을 확인합니다. 이벤트 기간이나 월드·난이도에 따라 달라지는 보상은 영구 드롭과 구분해야 합니다.',
        ],
      },
      {
        title: 'MPStorys 검증 원칙',
        paragraphs: [
          'GMS, 보스, 난이도, 날짜와 버전이 확인되는 자료만 사실로 게시합니다. 공식 패치, 이벤트 공지, 게임 내 UI와 Nexon 알려진 문제가 주요 근거입니다.',
          `다른 지역 정보는 조사 단서로 사용할 수 있지만 곧바로 GMS 사실이 되지는 않습니다. ${boss.name} 페이지도 키워드 반복보다 출처와 확인 절차를 우선합니다.`,
        ],
      },
    ],
    faqTitle: `${boss.name} 자주 묻는 질문`,
    faq: [
      { question: `완전한 ${boss.name} 공략인가요?`, answer: '현재는 GMS 입장, 난이도, 초기화 준비 가이드입니다. 세부 정보는 신뢰 가능한 출처 검증 후 추가합니다.' },
      { question: `입장 레벨은?`, answer: `현재 기록은 Lv.${boss.minLevel}입니다. 선행 퀘스트와 난이도 조건은 GMS 클라이언트에서 확인하세요.` },
      { question: `난이도는?`, answer: `${difficulties}가 등록되어 있습니다. 업데이트 후에는 게임 내 UI를 우선하세요.` },
      { question: `클리어 주기는?`, answer: `현재 기록은 ${reset}입니다. 남은 횟수와 실제 초기화 시간을 확인하세요.` },
      { question: '권장 전투력이 없는 이유는?', answer: '직업, 파티, 패치와 검증일이 없는 단일 수치는 오해를 만들 수 있기 때문입니다.' },
      { question: `최신 변경은 어디서 확인하나요?`, answer: 'GMS 공식 보스 가이드, Nexon 패치 노트와 알려진 문제를 확인하세요.' },
    ],
  };
};

export const getBossPlanningContent = (
  boss: BossInfo,
  language: SupportedLanguage,
) => language === 'en' ? englishContent(boss) : localizedContent(boss, language);
