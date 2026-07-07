export const officialAnnouncements = [
  // GMS
  { id: 'oa1', title: '[Updated July 6] v.253 Known Issues & Hotfix Timeline', category: 'Patch Notes', date: '2026-07-06', summary: 'Kishin visual bug fixed on Kanna. Hayato Phantom Blade crash resolved. Solerian coin shop currency display corrected. Sol Janus Dust explosion not applying during certain boss mechanics — fix expected July 8.', source: 'GMS Official', versions: ['gms'] },
  { id: 'oa2', title: 'Sunny Sunday Schedule — July 2026', category: 'Event', date: '2026-07-05', summary: 'July 12: 2x EXP & Drop. July 19: 50% off Star Force 5/10/15. July 26: 30% off Ability Resets. All times 6 PM–10 PM PDT. Applies to all worlds including Reboot Kronos & Hyperion.', source: 'GMS Official', versions: ['gms'] },
  { id: 'oa3', title: 'Marvel Machine Returns — July 20 through August 3', category: 'Event', date: '2026-07-04', summary: 'Absolab weapon boxes, Arcane Umbra armor selectors, and Legacy Outfit boxes return. New items: Eternal Flame title (stats: +20 all stat, +10 atk/m.atk) and Solerian Damage Skin.', source: 'GMS Official', versions: ['gms'] },
  { id: 'oa4', title: 'Scheduled Maintenance — July 8, 2026', category: 'Maintenance', date: '2026-07-03', summary: 'All GMS worlds offline 6 AM–10 AM PDT. Server stability improvements. Cash Shop inventory expansion for Solerian coin items. Familiar badge UI tooltip update.', source: 'GMS Official', versions: ['gms'] },
  { id: 'oa5', title: 'GMS Class Popularity — June 2026 Statistics', category: 'Community', date: '2026-07-02', summary: 'Top 5 classes by level 250+ population: Night Lord (12.4%), Kanna (10.1%), Adele (9.7%), Hero (8.3%), Dawn Warrior (7.8%). Fastest growing: Lynn (+340% vs May), Khali (+210%).', source: 'GMS Rankings API', versions: ['gms'] },
  { id: 'oa6', title: 'Phantom Forest & Masteria Blockbuster — Permanent Content Update', category: 'Content', date: '2026-07-01', summary: 'Masteria Through Time blockbuster now available as permanent content. Phantom Forest daily quests offer bonus 6th job Sol Erda fragments. Crimsonwood Keep party quest revamped for levels 200+.', source: 'GMS Official', versions: ['gms'] },
  // KMS
  { id: 'oa-k1', title: '7월 7일 테스트 월드 v1.2.398 패치노트', category: 'Patch Notes', date: '2026-07-07', summary: '솔 에르다 조각 드롭률 15% 증가. 카링 하드 모드 버그 수정. 헥사 스탯 코어 최대 레벨 30으로 확장. 신규 이벤트: 썸머 아일랜드 탐험대.', source: 'KMS Official', versions: ['kms'] },
  { id: 'oa-k2', title: '썬데이 메이플 — 7월 일정 안내', category: 'Event', date: '2026-07-05', summary: '7월 12일: 경험치 2배 & 드롭 2배. 7월 19일: 스타포스 5/10/15 성공 시 1+1. 7월 26일: 어빌리티 재설정 50% 할인. 모든 이벤트 오전 10시~오후 10시.', source: 'KMS Official', versions: ['kms'] },
  { id: 'oa-k3', title: '2026 여름 대규모 업데이트 — 새로운 시작 챕터 2', category: 'Content', date: '2026-07-03', summary: '신규 지역: 카르시온 심층부 오픈. 신규 보스: 칼로스 엑스트림 모드 추가. 신규 6차 스킬: 마스터리 코어 III, 인핸스먼트 코어 IV. 이벤트 기간: 7월 17일~9월 10일.', source: 'KMS Official', versions: ['kms'] },
  { id: 'oa-k4', title: '정기 점검 안내 — 7월 10일(목)', category: 'Maintenance', date: '2026-07-06', summary: '전 서버 오전 6시~오전 10시 점검. 서버 안정화 작업 및 신규 이벤트 데이터 추가. 캐시아이템 일부 가격 조정. 몬스터 라이프 시즌 리셋.', source: 'KMS Official', versions: ['kms'] },
  { id: 'oa-k5', title: 'KMS 6월 직업 통계 — 아델 1위 탈환', category: 'Community', date: '2026-07-04', summary: '250레벨 이상 인구 TOP5: 아델(10.8%), 나이트로드(9.2%), 은월(8.7%), 히어로(8.1%), 소울마스터(7.5%). 가장 빠르게 성장 중: 카인(+420%), 라라(+280%).', source: 'KMS Rankings API', versions: ['kms'] },
  { id: 'oa-k6', title: '메이플 스토리 23주년 기념 — 히스토리 이벤트', category: 'Event', date: '2026-07-01', summary: '23주년 기념 히스토리 던전 오픈. 역대 보스 몬스터 컬렉션 이벤트. 23주년 기념 코인샵 한정 아이템: 레전드리 잠재능력 부여 주문서 100%, 23주년 기념 의자.', source: 'KMS Official', versions: ['kms'] },
  // CMS
  { id: 'oa-c1', title: '7月6日 V206版本更新公告 — 夏日狂欢季', category: 'Patch Notes', date: '2026-07-06', summary: '夏日狂欢季活动上线：每日签到送六转材料、夏日限定时装、特殊潜能魔方。修复双弩精灵连击Bug。新增国服专属BOSS：年兽(困难模式)。', source: 'CMS Official (盛大)', versions: ['cms'] },
  { id: 'oa-c2', title: '夏日大促 — 魔法宠物&皇家理发返场', category: 'Event', date: '2026-07-04', summary: '7月11日~7月25日：魔法宠物限时返场(死亡不掉亲密)。皇家理发券50%附加概率UP。永恒之塔礼包限时折扣(含22星强化券)。充值满额送神话潜能魔方。', source: 'CMS Official (盛大)', versions: ['cms'] },
  { id: 'oa-c3', title: '国服特色内容 — 武侠之路第二章开启', category: 'Content', date: '2026-07-02', summary: '武侠之路第二章：少林寺地下城开放(260+)。新国服专属装备：少林金钟罩(披风)、易筋经(称号)。门派系统优化：门派战跨服匹配开启。', source: 'CMS Official (盛大)', versions: ['cms'] },
  { id: 'oa-c4', title: '7月9日全区全服停机维护公告', category: 'Maintenance', date: '2026-07-05', summary: '7月9日 5:00~10:00 全区全服停机维护。数据库优化升级，减少卡顿。拍卖行搜索功能重构。部分区服合服准备(蓝蜗牛+蘑菇仔)。', source: 'CMS Official (盛大)', versions: ['cms'] },
  { id: 'oa-c5', title: 'CMS 6月人气职业排行 — 虎影登顶', category: 'Community', date: '2026-07-03', summary: '250级以上人口TOP5：虎影(13.2%), 阿黛尔(11.5%), 夜光(9.8%), 双弩精灵(9.1%), 圣骑士(8.0%). 虎影受益于国服特色氪金上限，Boss输出登顶。', source: 'CMS Community Stats', versions: ['cms'] },
  { id: 'oa-c6', title: '国服专属周年庆 — 冒险岛21周年', category: 'Event', date: '2026-07-01', summary: '21周年庆系列活动：周年庆专属地图、BOSS挑战赛(全服竞速)、周年庆纪念勋章(全属性+30)。累计登录送神话武器箱(可自选)。限时兑换：21周年纪念时装套装。', source: 'CMS Official (盛大)', versions: ['cms'] },
  // TMS
  { id: 'oa-t1', title: '7/6更新 V264版本 — 夏日海岛大冒险', category: 'Patch Notes', date: '2026-07-06', summary: '夏日海岛活动：钓鱼大赛、沙滩派对、椰子投掷迷你游戏。修复阴阳师灵力回复异常。新增伤害字型：萤火虫字型、海洋字型。商城新品：夏日泳装福袋。', source: 'TMS Official (游戏橘子)', versions: ['tms'] },
  { id: 'oa-t2', title: '橘子支付限定 — 储值满额三重送', category: 'Event', date: '2026-07-05', summary: '7月10日~8月10日：橘子支付储值满3000送神话潜能魔方×5。满5000加码送传说潜能100%卷。满10000送灭龙骑士铠甲选择箱。限量前500名，先储先得。', source: 'TMS Official (游戏橘子)', versions: ['tms'] },
  { id: 'oa-t3', title: '新枫之谷×进击的巨人 联名合作', category: 'Content', date: '2026-07-03', summary: '进击的巨人联名活动：立体机动装置骑宠、调查兵团披风、艾连/米卡莎/里维发型。联名副本：玛利亚之墙防卫战(每日1次)。限定武器：超硬质刃(双手剑外型)。', source: 'TMS Official (游戏橘子)', versions: ['tms'] },
  { id: 'oa-t4', title: '7月8日例行维护公告', category: 'Maintenance', date: '2026-07-07', summary: '7月8日 06:00~10:00 全伺服器停机维护。修正部分地图掉落异常。调整Reboot伺服器怪物HP倍率(下修5%)。公会技能初始化补偿发放。', source: 'TMS Official (游戏橘子)', versions: ['tms'] },
  { id: 'oa-t5', title: 'TMS 6月热门职业 — 影武者重回T0', category: 'Community', date: '2026-07-04', summary: '250等以上人口TOP5：影武者(11.8%), 夜使者(10.5%), 精灵游侠(9.2%), 杰诺(8.7%), 凯撒(8.1%)。受台服特色装备影响，影武者Boss输出重回T0。', source: 'TMS Community Stats', versions: ['tms'] },
  { id: 'oa-t6', title: '新枫之谷嘉年华 — 台南线下活动', category: 'Event', date: '2026-07-01', summary: '7月20日台南南纺购物中心：线下见面会。现场活动：真人Boss挑战赛、Cosplay大赛、限量周边贩售。线上同步直播，观看抽奖送轮回碑石(90天)。', source: 'TMS Official (游戏橘子)', versions: ['tms'] },
  // JMS
  { id: 'oa-j1', title: '7月7日更新 Ver.4.23 — 夏の思い出イベント', category: 'Patch Notes', date: '2026-07-07', summary: '夏の思い出イベント：花火大会、金魚すくいミニゲーム、浴衣コーデコンテスト。カンナ・ハヤトのスキルバランス調整(上方修正)。新ボス：カロス(ハードモード)実装。', source: 'JMS Official (ネクソン)', versions: ['jms'] },
  { id: 'oa-j2', title: 'サマーカムバックキャンペーン — 復帰者応援', category: 'Event', date: '2026-07-05', summary: '7月15日~8月31日：90日以上未ログインユーザー対象、復帰時経験値3倍(30日間)。タイフーングロースポーション×3プレゼント。フレンド招待で両方に報酬。', source: 'JMS Official (ネクソン)', versions: ['jms'] },
  { id: 'oa-j3', title: '戦国時代アップデート — 新エリア「倭城」', category: 'Content', date: '2026-07-03', summary: '新マップ倭城(265+)。カンナ・ハヤト専用ストーリークエスト追加。新装備：倭刀(カンナ専用), 無双槍(ハヤト専用)。新ボス：織田信長(週間)。', source: 'JMS Official (ネクソン)', versions: ['jms'] },
  { id: 'oa-j4', title: '定期メンテナンス — 7月10日', category: 'Maintenance', date: '2026-07-06', summary: '7月10日 8:00~14:00(JST) 全ワールドメンテナンス。サーバー機器交換作業。カンナの霊力システム不具合修正。イベントデータ事前投入。', source: 'JMS Official (ネクソン)', versions: ['jms'] },
  { id: 'oa-j5', title: 'JMS 6月人気職 — カンナ不動の1位', category: 'Community', date: '2026-07-04', summary: '250レベル以上人口TOP5：カンナ(16.2%), ハヤト(12.5%), ナイトロード(8.8%), アデル(7.6%), ビショップ(7.1%)。カンナの霊力改善でさらに人気上昇、ハヤトも戦国アップデートで復権。', source: 'JMS Rankings API', versions: ['jms'] },
  { id: 'oa-j6', title: 'メイプルストーリー×鬼滅の刃 コラボ第2弾', category: 'Event', date: '2026-07-01', summary: '鬼滅の刃コラボ第2弾：柱合会議イベント、日輪刀アバター武器(9種)、蝶屋敷マップ。炭治郎・禰豆子・善逸・伊之助の限定ペット復刻。コラボ期間：7月15日~9月15日。', source: 'JMS Official (ネクソン)', versions: ['jms'] },
  // MSEA
  { id: 'oa-m1', title: '[7 July] v243 Patch — Aqua Festival 2026', category: 'Patch Notes', date: '2026-07-06', summary: 'Aqua Festival event: Water Gun mini-game, Splash Damage weekly boss rush, Tropical Resort themed dungeon. New 6th job skill cores for all classes. Lynn skill balance: +15% damage on Nature\'s Wrath.', source: 'MSEA Official (PlayPark)', versions: ['msea'] },
  { id: 'oa-m2', title: 'Cash Shop Update — Royal Style & Petite Pets', category: 'Event', date: '2026-07-05', summary: 'New Royal Style: Ocean Explorer Set (M/F). Petite Luna Pets: Dreamy Luna, Twinkle Luna, Starlight Luna (all 3 buff pets). Premium Surprise Style Box rotation: Blossom Collection added.', source: 'MSEA Official (PlayPark)', versions: ['msea'] },
  { id: 'oa-m3', title: 'MSEA Roadmap — H2 2026 Content Preview', category: 'Content', date: '2026-07-02', summary: 'August: Solerian region complete, Kalos Extreme mode. September: New Archer class teaser. October: Halloween Night Troupe returns. November: Black Mage Remastered challenge. December: Winter mega-update with 7th job teaser.', source: 'MSEA Official (PlayPark)', versions: ['msea'] },
  { id: 'oa-m4', title: 'Game Patch & Maintenance — 9 July', category: 'Maintenance', date: '2026-07-05', summary: 'All MSEA worlds offline 7 AM–12 PM (GMT+8). Server hardware upgrade. Fix Aquila world channel lag issues. Auction House listing limit increased to 30 items.', source: 'MSEA Official (PlayPark)', versions: ['msea'] },
  { id: 'oa-m5', title: 'MSEA June Class Popularity — Adele #1 Streak Continues', category: 'Community', date: '2026-07-03', summary: 'Top 5 classes 250+: Adele (11.2%), Night Lord (9.8%), Hero (8.9%), Bishop (8.5%), Dawn Warrior (7.6%). Mega Burning event pushed Lyn population +390%, Khali +260%.', source: 'MSEA Community Stats', versions: ['msea'] },
  { id: 'oa-m6', title: 'PlayPark 17th Anniversary — MapleSEA Celebration', category: 'Event', date: '2026-07-01', summary: '17th Anniversary events: Daily gift box (Sol Erda fragments, cubes), Anniversary coin shop (17th anni medal, chairs, damage skins). Special: 17-star guaranteed enhancement scroll (once per account).', source: 'MSEA Official (PlayPark)', versions: ['msea'] },
];

export const classStatistics = [
  // GMS-specific
  { class: 'Night Lord', icon: 'ri-moon-line', popularity: 12.4, bossClear: 94, mobbing: 78, support: 12, trend: 'up', version: 'gms' },
  { class: 'Kanna', icon: 'ri-ghost-line', popularity: 10.1, bossClear: 88, mobbing: 92, support: 95, trend: 'flat', version: 'gms' },
  { class: 'Hayato', icon: 'ri-knife-line', popularity: 6.2, bossClear: 82, mobbing: 80, support: 8, trend: 'down', version: 'gms' },
  // KMS-specific
  { class: 'Adele', icon: 'ri-sword-line', popularity: 10.8, bossClear: 93, mobbing: 88, support: 18, trend: 'up', version: 'kms' },
  { class: 'Night Lord', icon: 'ri-moon-line', popularity: 9.2, bossClear: 90, mobbing: 72, support: 10, trend: 'flat', version: 'kms' },
  { class: 'Shade', icon: 'ri-ghost-smile-line', popularity: 8.7, bossClear: 87, mobbing: 80, support: 30, trend: 'up', version: 'kms' },
  { class: 'Hero', icon: 'ri-shield-line', popularity: 8.1, bossClear: 91, mobbing: 68, support: 8, trend: 'flat', version: 'kms' },
  { class: 'Dawn Warrior', icon: 'ri-sun-line', popularity: 7.5, bossClear: 85, mobbing: 84, support: 15, trend: 'up', version: 'kms' },
  { class: 'Bishop', icon: 'ri-heart-pulse-line', popularity: 6.8, bossClear: 72, mobbing: 62, support: 99, trend: 'up', version: 'kms' },
  { class: 'Kain', icon: 'ri-flashlight-line', popularity: 5.6, bossClear: 88, mobbing: 82, support: 12, trend: 'up', version: 'kms' },
  // CMS-specific
  { class: 'Hoyoung', icon: 'ri-brush-4-line', popularity: 13.2, bossClear: 96, mobbing: 90, support: 15, trend: 'up', version: 'cms' },
  { class: 'Adele', icon: 'ri-sword-line', popularity: 11.5, bossClear: 91, mobbing: 86, support: 16, trend: 'flat', version: 'cms' },
  { class: 'Luminous', icon: 'ri-sun-foggy-line', popularity: 9.8, bossClear: 85, mobbing: 92, support: 10, trend: 'up', version: 'cms' },
  { class: 'Mercedes', icon: 'ri-arrow-left-right-line', popularity: 9.1, bossClear: 80, mobbing: 78, support: 12, trend: 'down', version: 'cms' },
  { class: 'Paladin', icon: 'ri-shield-star-line', popularity: 8.0, bossClear: 76, mobbing: 62, support: 88, trend: 'up', version: 'cms' },
  { class: 'Night Lord', icon: 'ri-moon-line', popularity: 7.2, bossClear: 88, mobbing: 74, support: 8, trend: 'flat', version: 'cms' },
  // TMS-specific
  { class: 'Dual Blade', icon: 'ri-knife-blood-line', popularity: 11.8, bossClear: 95, mobbing: 82, support: 10, trend: 'up', version: 'tms' },
  { class: 'Night Lord', icon: 'ri-moon-line', popularity: 10.5, bossClear: 92, mobbing: 76, support: 10, trend: 'flat', version: 'tms' },
  { class: 'Mercedes', icon: 'ri-arrow-left-right-line', popularity: 9.2, bossClear: 82, mobbing: 80, support: 15, trend: 'up', version: 'tms' },
  { class: 'Xenon', icon: 'ri-cpu-line', popularity: 8.7, bossClear: 88, mobbing: 84, support: 8, trend: 'flat', version: 'tms' },
  { class: 'Kaiser', icon: 'ri-sword-fill', popularity: 8.1, bossClear: 84, mobbing: 78, support: 12, trend: 'down', version: 'tms' },
  { class: 'Adele', icon: 'ri-sword-line', popularity: 7.6, bossClear: 86, mobbing: 82, support: 14, trend: 'flat', version: 'tms' },
  // JMS-specific
  { class: 'Kanna', icon: 'ri-ghost-line', popularity: 16.2, bossClear: 94, mobbing: 96, support: 98, trend: 'up', version: 'jms' },
  { class: 'Hayato', icon: 'ri-knife-line', popularity: 12.5, bossClear: 90, mobbing: 88, support: 12, trend: 'up', version: 'jms' },
  { class: 'Night Lord', icon: 'ri-moon-line', popularity: 8.8, bossClear: 88, mobbing: 74, support: 8, trend: 'flat', version: 'jms' },
  { class: 'Adele', icon: 'ri-sword-line', popularity: 7.6, bossClear: 85, mobbing: 82, support: 14, trend: 'flat', version: 'jms' },
  { class: 'Bishop', icon: 'ri-heart-pulse-line', popularity: 7.1, bossClear: 70, mobbing: 64, support: 99, trend: 'up', version: 'jms' },
  { class: 'Shade', icon: 'ri-ghost-smile-line', popularity: 6.2, bossClear: 82, mobbing: 78, support: 28, trend: 'up', version: 'jms' },
  // MSEA-specific
  { class: 'Adele', icon: 'ri-sword-line', popularity: 11.2, bossClear: 92, mobbing: 87, support: 16, trend: 'flat', version: 'msea' },
  { class: 'Night Lord', icon: 'ri-moon-line', popularity: 9.8, bossClear: 91, mobbing: 76, support: 10, trend: 'flat', version: 'msea' },
  { class: 'Hero', icon: 'ri-shield-line', popularity: 8.9, bossClear: 90, mobbing: 70, support: 8, trend: 'up', version: 'msea' },
  { class: 'Bishop', icon: 'ri-heart-pulse-line', popularity: 8.5, bossClear: 74, mobbing: 66, support: 98, trend: 'up', version: 'msea' },
  { class: 'Dawn Warrior', icon: 'ri-sun-line', popularity: 7.6, bossClear: 84, mobbing: 82, support: 14, trend: 'down', version: 'msea' },
  { class: 'Lynn', icon: 'ri-leaf-line', popularity: 6.8, bossClear: 72, mobbing: 90, support: 88, trend: 'up', version: 'msea' },
  // Cross-version (all)
  { class: 'Marksman', icon: 'ri-crosshair-line', popularity: 4.8, bossClear: 82, mobbing: 68, support: 5, trend: 'flat', version: 'all' },
  { class: 'Shadower', icon: 'ri-eye-2-line', popularity: 4.5, bossClear: 80, mobbing: 72, support: 5, trend: 'flat', version: 'all' },
  { class: 'Wind Archer', icon: 'ri-windy-line', popularity: 4.2, bossClear: 78, mobbing: 74, support: 10, trend: 'down', version: 'all' },
  { class: 'Ice Lightning', icon: 'ri-snowy-line', popularity: 3.9, bossClear: 76, mobbing: 90, support: 8, trend: 'up', version: 'all' },
  { class: 'Fire Poison', icon: 'ri-fire-line', popularity: 3.5, bossClear: 80, mobbing: 86, support: 6, trend: 'up', version: 'all' },
  { class: 'Cannon Master', icon: 'ri-ship-line', popularity: 3.2, bossClear: 74, mobbing: 82, support: 12, trend: 'down', version: 'all' },
  { class: 'Mechanic', icon: 'ri-settings-3-line', popularity: 2.8, bossClear: 68, mobbing: 76, support: 45, trend: 'flat', version: 'all' },
  { class: 'Wild Hunter', icon: 'ri-pantone-line', popularity: 2.5, bossClear: 72, mobbing: 70, support: 8, trend: 'down', version: 'all' },
];

export const mockCharacters: Record<string, {
  ign: string;
  server: string;
  level: number;
  class: string;
  legion: number;
  popularity: number;
  guild: string;
  achievements: string[];
  version: string;
}> = {
  // GMS
  aurorakain: {
    ign: 'AuroraKain', server: 'Bera (GMS)', level: 292, class: 'Kain', legion: 12480, popularity: 8420, guild: 'Celestial',
    achievements: ['Black Mage Solo', 'Kalos Hard Clear', '10k Legion', 'Liberated Genesis Weapon'], version: 'gms',
  },
  luminight: {
    ign: 'LumiNite', server: 'Scania (GMS)', level: 285, class: 'Luminous', legion: 10400, popularity: 6100, guild: 'Moonlight',
    achievements: ['Verus Hilla Solo', 'Darknell Solo', '8k Legion'], version: 'gms',
  },
  shadowmage: {
    ign: 'ShadowMage', server: 'Kronos (GMS Reboot)', level: 282, class: 'Bishop', legion: 9800, popularity: 5400, guild: 'Divine',
    achievements: ['Verus Hilla Party', 'Lucid Hard Solo', '8.5k Legion'], version: 'gms',
  },
  dragonfist: {
    ign: 'DragonFist', server: 'Elysium (GMS)', level: 276, class: 'Buccaneer', legion: 8600, popularity: 3900, guild: 'PiratesCove',
    achievements: ['Lotus Solo', 'Damien Solo', '7k Legion'], version: 'gms',
  },
  thundergod: {
    ign: 'ThunderGod', server: 'Bera (GMS)', level: 290, class: 'Thunder Breaker', legion: 11200, popularity: 7800, guild: 'StormRiders',
    achievements: ['Black Mage Solo', 'Seren Hard', '10k Legion', 'Hexa Mastery I'], version: 'gms',
  },
  // KMS
  krflame: {
    ign: '불꽃전사', server: 'Scania (KMS)', level: 295, class: 'Hero', legion: 13500, popularity: 9200, guild: '전설',
    achievements: ['Kalos Extreme Clear', 'Karing Solo', 'Max Hexa Stat', 'Liberated Genesis Weapon'], version: 'kms',
  },
  krshadow: {
    ign: '달빛표창', server: 'Luna (KMS)', level: 290, class: 'Night Lord', legion: 12800, popularity: 8600, guild: '은하수',
    achievements: ['Black Mage Solo', 'Seren Hard', '11k Legion', 'Hexa Mastery II'], version: 'kms',
  },
  krshade: {
    ign: '잊혀진자', server: 'Elysium (KMS)', level: 288, class: 'Shade', legion: 11500, popularity: 7200, guild: '무명',
    achievements: ['Verus Hilla Solo', 'Darknell Hard', '10k Legion'], version: 'kms',
  },
  // CMS
  cnfrost: {
    ign: '冰霜魔導', server: 'Blue Snail (CMS)', level: 284, class: 'Ice Lightning', legion: 10200, popularity: 6600, guild: '冰封王座',
    achievements: ['Verus Hilla Solo', 'Darknell Hard', '8.8k Legion'], version: 'cms',
  },
  cnhoyoung: {
    ign: '虎影天下', server: 'Purple Cat (CMS)', level: 293, class: 'Hoyoung', legion: 13000, popularity: 9800, guild: '武林至尊',
    achievements: ['Kalos Solo', 'Karing Hard Clear', '12k Legion', 'Liberated Genesis'], version: 'cms',
  },
  cnadele: {
    ign: '剑舞飞扬', server: 'Red Snail (CMS)', level: 286, class: 'Adele', legion: 10800, popularity: 7200, guild: '星辰大海',
    achievements: ['Black Mage Party', 'Seren Solo', '9.5k Legion'], version: 'cms',
  },
  // TMS
  twstar: {
    ign: '星空劍士', server: 'Alicia (TMS)', level: 288, class: 'Dawn Warrior', legion: 11000, popularity: 7200, guild: '星河',
    achievements: ['Black Mage Party', 'Seren Hard', '9k Legion'], version: 'tms',
  },
  twshadow: {
    ign: '暗影之刃', server: 'Alicia (TMS)', level: 292, class: 'Dual Blade', legion: 12500, popularity: 8800, guild: '影武者聯盟',
    achievements: ['Kalos Hard Clear', 'Verus Hilla Solo', '11k Legion', 'Liberated Genesis'], version: 'tms',
  },
  // JMS
  jpkanna: {
    ign: '霊媒師カンナ', server: 'Yukari (JMS)', level: 290, class: 'Kanna', legion: 12000, popularity: 9500, guild: '桜花繚乱',
    achievements: ['Black Mage Solo', 'Seren Hard', '11k Legion', 'Max Spirit Flow'], version: 'jms',
  },
  jphayato: {
    ign: '剣豪ハヤト', server: 'Yukari (JMS)', level: 288, class: 'Hayato', legion: 11500, popularity: 8200, guild: '武士道',
    achievements: ['Kalos Party Clear', 'Darknell Solo', '10k Legion'], version: 'jms',
  },
  jpwind: {
    ign: '風のアーチャー', server: 'Yukari (JMS)', level: 274, class: 'Wind Archer', legion: 7500, popularity: 3100, guild: '桜吹雪',
    achievements: ['Lomien Solo', 'Gloom Party', '6k Legion'], version: 'jms',
  },
  // MSEA
  seastorm: {
    ign: 'SeaStorm', server: 'Aquila (MSEA)', level: 280, class: 'Buccaneer', legion: 9200, popularity: 4800, guild: 'TidalForce',
    achievements: ['Lomien Solo', 'Gloom Party Clear', '7.5k Legion'], version: 'msea',
  },
  seadele: {
    ign: 'xXAdeleQueenXx', server: 'Aquila (MSEA)', level: 290, class: 'Adele', legion: 11800, popularity: 7800, guild: 'RoyalFlush',
    achievements: ['Black Mage Solo', 'Seren Hard', '10.5k Legion', 'Liberated Genesis'], version: 'msea',
  },
};

export const growthData: Record<string, {
  potions: { name: string; icon: string; levels: string; chance: number; rarity: 'Rare' | 'Epic' | 'Legendary' }[];
  sixthJob: {
    stages: { name: string; solErda: number; solErdaFragment: number; hours: number }[];
    dailySolErda: number;
    dailySolErdaFragment: number;
  };
}> = {
  gms: {
    potions: [
      { name: 'Extreme Growth Potion', icon: 'ri-flask-line', levels: '1–10', chance: 100, rarity: 'Epic' },
      { name: 'Growth Potion (200–209)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: 'Growth Potion (200–219)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: 'Growth Potion (200–229)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Epic' },
      { name: 'Typhoon Growth Potion', icon: 'ri-tornado-line', levels: '1', chance: 100, rarity: 'Legendary' },
      { name: 'Magnificent Growth Potion', icon: 'ri-star-smile-line', levels: '1–10', chance: 100, rarity: 'Legendary' },
    ],
    sixthJob: {
      stages: [
        { name: 'Origin Skill (Lv1)', solErda: 100, solErdaFragment: 500, hours: 8 },
        { name: 'Mastery Core I', solErda: 150, solErdaFragment: 750, hours: 12 },
        { name: 'Mastery Core II', solErda: 200, solErdaFragment: 1000, hours: 16 },
        { name: 'Enhancement Core I', solErda: 250, solErdaFragment: 1250, hours: 20 },
        { name: 'Enhancement Core II', solErda: 300, solErdaFragment: 1500, hours: 24 },
        { name: 'Enhancement Core III', solErda: 350, solErdaFragment: 1750, hours: 28 },
        { name: 'HEXA Stat Core I', solErda: 400, solErdaFragment: 2000, hours: 32 },
        { name: 'HEXA Stat Core II', solErda: 500, solErdaFragment: 2500, hours: 40 },
      ],
      dailySolErda: 600,
      dailySolErdaFragment: 12,
    },
  },
  kms: {
    potions: [
      { name: '익스트림 성장의 비약', icon: 'ri-flask-line', levels: '1–10', chance: 100, rarity: 'Legendary' },
      { name: '성장의 비약 (200–209)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: '성장의 비약 (200–219)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: '성장의 비약 (200–229)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Epic' },
      { name: '태풍 성장의 비약', icon: 'ri-tornado-line', levels: '1', chance: 100, rarity: 'Legendary' },
      { name: '초월의 성장의 비약', icon: 'ri-star-smile-line', levels: '1–10', chance: 100, rarity: 'Legendary' },
    ],
    sixthJob: {
      stages: [
        { name: 'Origin Skill (Lv1)', solErda: 100, solErdaFragment: 500, hours: 6 },
        { name: 'Mastery Core I', solErda: 150, solErdaFragment: 750, hours: 10 },
        { name: 'Mastery Core II', solErda: 200, solErdaFragment: 1000, hours: 14 },
        { name: 'Enhancement Core I', solErda: 250, solErdaFragment: 1250, hours: 18 },
        { name: 'Enhancement Core II', solErda: 300, solErdaFragment: 1500, hours: 22 },
        { name: 'Enhancement Core III', solErda: 350, solErdaFragment: 1750, hours: 26 },
        { name: 'HEXA Stat Core I', solErda: 400, solErdaFragment: 2000, hours: 30 },
        { name: 'HEXA Stat Core II', solErda: 500, solErdaFragment: 2500, hours: 38 },
      ],
      dailySolErda: 800,
      dailySolErdaFragment: 18,
    },
  },
  cms: {
    potions: [
      { name: '极限成长秘药', icon: 'ri-flask-line', levels: '1–10', chance: 100, rarity: 'Epic' },
      { name: '成长秘药 (200–209)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: '成长秘药 (200–219)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: '成长秘药 (200–229)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Epic' },
      { name: '台风成长秘药', icon: 'ri-tornado-line', levels: '1', chance: 100, rarity: 'Legendary' },
    ],
    sixthJob: {
      stages: [
        { name: 'Origin Skill (Lv1)', solErda: 100, solErdaFragment: 500, hours: 7 },
        { name: 'Mastery Core I', solErda: 150, solErdaFragment: 750, hours: 11 },
        { name: 'Mastery Core II', solErda: 200, solErdaFragment: 1000, hours: 15 },
        { name: 'Enhancement Core I', solErda: 250, solErdaFragment: 1250, hours: 19 },
        { name: 'Enhancement Core II', solErda: 300, solErdaFragment: 1500, hours: 23 },
        { name: 'Enhancement Core III', solErda: 350, solErdaFragment: 1750, hours: 27 },
        { name: 'HEXA Stat Core I', solErda: 400, solErdaFragment: 2000, hours: 31 },
        { name: 'HEXA Stat Core II', solErda: 500, solErdaFragment: 2500, hours: 39 },
      ],
      dailySolErda: 700,
      dailySolErdaFragment: 15,
    },
  },
  tms: {
    potions: [
      { name: '終極成長密藥', icon: 'ri-flask-line', levels: '1–10', chance: 100, rarity: 'Epic' },
      { name: '成長密藥 (200–209)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: '成長密藥 (200–219)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: '成長密藥 (200–229)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Epic' },
      { name: '颱風成長密藥', icon: 'ri-tornado-line', levels: '1', chance: 100, rarity: 'Legendary' },
      { name: '輪迴成長密藥', icon: 'ri-star-smile-line', levels: '1–10', chance: 100, rarity: 'Legendary' },
    ],
    sixthJob: {
      stages: [
        { name: 'Origin Skill (Lv1)', solErda: 100, solErdaFragment: 500, hours: 8 },
        { name: 'Mastery Core I', solErda: 150, solErdaFragment: 750, hours: 12 },
        { name: 'Mastery Core II', solErda: 200, solErdaFragment: 1000, hours: 16 },
        { name: 'Enhancement Core I', solErda: 250, solErdaFragment: 1250, hours: 20 },
        { name: 'Enhancement Core II', solErda: 300, solErdaFragment: 1500, hours: 24 },
        { name: 'Enhancement Core III', solErda: 350, solErdaFragment: 1750, hours: 28 },
        { name: 'HEXA Stat Core I', solErda: 400, solErdaFragment: 2000, hours: 32 },
        { name: 'HEXA Stat Core II', solErda: 500, solErdaFragment: 2500, hours: 40 },
      ],
      dailySolErda: 650,
      dailySolErdaFragment: 14,
    },
  },
  jms: {
    potions: [
      { name: 'エクストリーム成長ポーション', icon: 'ri-flask-line', levels: '1–10', chance: 100, rarity: 'Epic' },
      { name: '成長ポーション (200–209)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: '成長ポーション (200–219)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: '成長ポーション (200–229)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Epic' },
      { name: '台風成長ポーション', icon: 'ri-tornado-line', levels: '1', chance: 100, rarity: 'Legendary' },
    ],
    sixthJob: {
      stages: [
        { name: 'Origin Skill (Lv1)', solErda: 100, solErdaFragment: 500, hours: 7 },
        { name: 'Mastery Core I', solErda: 150, solErdaFragment: 750, hours: 11 },
        { name: 'Mastery Core II', solErda: 200, solErdaFragment: 1000, hours: 15 },
        { name: 'Enhancement Core I', solErda: 250, solErdaFragment: 1250, hours: 19 },
        { name: 'Enhancement Core II', solErda: 300, solErdaFragment: 1500, hours: 23 },
        { name: 'Enhancement Core III', solErda: 350, solErdaFragment: 1750, hours: 27 },
        { name: 'HEXA Stat Core I', solErda: 400, solErdaFragment: 2000, hours: 31 },
        { name: 'HEXA Stat Core II', solErda: 500, solErdaFragment: 2500, hours: 39 },
      ],
      dailySolErda: 750,
      dailySolErdaFragment: 16,
    },
  },
  msea: {
    potions: [
      { name: 'Extreme Growth Potion', icon: 'ri-flask-line', levels: '1–10', chance: 100, rarity: 'Epic' },
      { name: 'Growth Potion (200–209)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: 'Growth Potion (200–219)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Rare' },
      { name: 'Growth Potion (200–229)', icon: 'ri-medicine-bottle-line', levels: '1', chance: 100, rarity: 'Epic' },
      { name: 'Typhoon Growth Potion', icon: 'ri-tornado-line', levels: '1', chance: 100, rarity: 'Legendary' },
      { name: 'Magnificent Growth Potion', icon: 'ri-star-smile-line', levels: '1–10', chance: 100, rarity: 'Legendary' },
    ],
    sixthJob: {
      stages: [
        { name: 'Origin Skill (Lv1)', solErda: 100, solErdaFragment: 500, hours: 8 },
        { name: 'Mastery Core I', solErda: 150, solErdaFragment: 750, hours: 12 },
        { name: 'Mastery Core II', solErda: 200, solErdaFragment: 1000, hours: 16 },
        { name: 'Enhancement Core I', solErda: 250, solErdaFragment: 1250, hours: 20 },
        { name: 'Enhancement Core II', solErda: 300, solErdaFragment: 1500, hours: 24 },
        { name: 'Enhancement Core III', solErda: 350, solErdaFragment: 1750, hours: 28 },
        { name: 'HEXA Stat Core I', solErda: 400, solErdaFragment: 2000, hours: 32 },
        { name: 'HEXA Stat Core II', solErda: 500, solErdaFragment: 2500, hours: 40 },
      ],
      dailySolErda: 600,
      dailySolErdaFragment: 12,
    },
  },
};

export const cubeTypes: Record<string, { name: string; icon: string; tierUpBase: number; primeLineBase: number; cost: string }[]> = {
  gms: [
    { name: 'Red Cube', icon: 'ri-contrast-drop-2-line', tierUpBase: 7.0, primeLineBase: 2.5, cost: '12M mesos' },
    { name: 'Black Cube', icon: 'ri-contrast-drop-line', tierUpBase: 14.0, primeLineBase: 5.0, cost: '22M mesos' },
    { name: 'Bonus Cube', icon: 'ri-sparkling-line', tierUpBase: 4.5, primeLineBase: 1.8, cost: '9M mesos' },
    { name: 'Violet Cube', icon: 'ri-magic-line', tierUpBase: 25.0, primeLineBase: 10.0, cost: '50M mesos' },
  ],
  kms: [
    { name: '레드 큐브', icon: 'ri-contrast-drop-2-line', tierUpBase: 6.0, primeLineBase: 2.0, cost: '9M mesos' },
    { name: '블랙 큐브', icon: 'ri-contrast-drop-line', tierUpBase: 12.0, primeLineBase: 4.0, cost: '18M mesos' },
    { name: '에디셔널 큐브', icon: 'ri-sparkling-line', tierUpBase: 4.0, primeLineBase: 1.5, cost: '7M mesos' },
    { name: '바이올렛 큐브', icon: 'ri-magic-line', tierUpBase: 22.0, primeLineBase: 8.0, cost: '40M mesos' },
  ],
  cms: [
    { name: '红色魔方', icon: 'ri-contrast-drop-2-line', tierUpBase: 8.0, primeLineBase: 3.0, cost: '15M mesos' },
    { name: '黑色魔方', icon: 'ri-contrast-drop-line', tierUpBase: 15.0, primeLineBase: 5.5, cost: '25M mesos' },
    { name: '附加魔方', icon: 'ri-sparkling-line', tierUpBase: 5.0, primeLineBase: 2.0, cost: '10M mesos' },
    { name: '神话魔方', icon: 'ri-magic-line', tierUpBase: 30.0, primeLineBase: 12.0, cost: '60M mesos' },
  ],
  tms: [
    { name: '紅色方塊', icon: 'ri-contrast-drop-2-line', tierUpBase: 7.5, primeLineBase: 2.8, cost: '14M mesos' },
    { name: '黑色方塊', icon: 'ri-contrast-drop-line', tierUpBase: 15.0, primeLineBase: 5.5, cost: '24M mesos' },
    { name: '附加方塊', icon: 'ri-sparkling-line', tierUpBase: 5.0, primeLineBase: 2.0, cost: '10M mesos' },
  ],
  jms: [
    { name: 'レッドキューブ', icon: 'ri-contrast-drop-2-line', tierUpBase: 6.5, primeLineBase: 2.2, cost: '10M mesos' },
    { name: 'ブラックキューブ', icon: 'ri-contrast-drop-line', tierUpBase: 13.0, primeLineBase: 4.5, cost: '20M mesos' },
    { name: 'ボーナスキューブ', icon: 'ri-sparkling-line', tierUpBase: 4.2, primeLineBase: 1.6, cost: '8M mesos' },
  ],
  msea: [
    { name: 'Red Cube', icon: 'ri-contrast-drop-2-line', tierUpBase: 7.0, primeLineBase: 2.5, cost: '12M mesos' },
    { name: 'Black Cube', icon: 'ri-contrast-drop-line', tierUpBase: 14.0, primeLineBase: 5.0, cost: '22M mesos' },
    { name: 'Bonus Cube', icon: 'ri-sparkling-line', tierUpBase: 4.5, primeLineBase: 1.8, cost: '9M mesos' },
  ],
};

export const cubeTierRates = [
  { from: 'Rare', to: 'Epic', red: 7.0, black: 14.0, bonus: 4.5, violet: 25.0 },
  { from: 'Epic', to: 'Unique', red: 3.5, black: 7.0, bonus: 2.0, violet: 12.0 },
  { from: 'Unique', to: 'Legendary', red: 1.0, black: 2.0, bonus: 0.5, violet: 4.0 },
];

export const starForceRates: Record<number, { success: number; fail: number; destroy: number; cost: string; cost_kms?: string; cost_cms?: string; cost_tms?: string; cost_jms?: string }> = {
  0: { success: 95, fail: 5, destroy: 0, cost: '5k', cost_kms: '4k', cost_cms: '6k', cost_tms: '5.5k' },
  5: { success: 80, fail: 20, destroy: 0, cost: '15k', cost_kms: '12k', cost_cms: '18k', cost_tms: '16k' },
  10: { success: 65, fail: 35, destroy: 0, cost: '50k', cost_kms: '40k', cost_cms: '55k', cost_tms: '52k' },
  12: { success: 55, fail: 45, destroy: 0, cost: '120k', cost_kms: '100k', cost_cms: '130k', cost_tms: '125k' },
  15: { success: 30, fail: 68, destroy: 2, cost: '350k', cost_kms: '300k', cost_cms: '380k', cost_tms: '360k' },
  17: { success: 30, fail: 67, destroy: 3, cost: '700k', cost_kms: '600k', cost_cms: '750k', cost_tms: '720k' },
  20: { success: 30, fail: 63, destroy: 7, cost: '1.5M', cost_kms: '1.3M', cost_cms: '1.6M', cost_tms: '1.55M' },
  22: { success: 30, fail: 60, destroy: 10, cost: '3M', cost_kms: '2.5M', cost_cms: '3.2M', cost_tms: '3.1M' },
  23: { success: 15, fail: 70, destroy: 15, cost: '5M', cost_kms: '4.5M', cost_cms: '5.5M', cost_tms: '5.2M' },
  24: { success: 10, fail: 70, destroy: 20, cost: '8M', cost_kms: '7M', cost_cms: '8.5M', cost_tms: '8.2M' },
};

export const flameTiers: Record<string, { name: string; icon: string; bonusRange: string; cost: string; baseChance: number }[]> = {
  gms: [
    { name: 'Powerful Rebirth Flame', icon: 'ri-fire-line', bonusRange: 'Tier 1–4', cost: '9M mesos', baseChance: 20 },
    { name: 'Eternal Rebirth Flame', icon: 'ri-fire-fill', bonusRange: 'Tier 1–5', cost: '30M mesos', baseChance: 35 },
    { name: 'Black Rebirth Flame', icon: 'ri-contrast-line', bonusRange: 'Tier 2–5', cost: '45M mesos', baseChance: 50 },
    { name: 'Rainbow Rebirth Flame', icon: 'ri-rainbow-line', bonusRange: 'Tier 3–6', cost: 'Event only', baseChance: 75 },
  ],
  kms: [
    { name: '강력한 환생의 불꽃', icon: 'ri-fire-line', bonusRange: 'Tier 1–4', cost: '7M mesos', baseChance: 22 },
    { name: '영원한 환생의 불꽃', icon: 'ri-fire-fill', bonusRange: 'Tier 1–5', cost: '25M mesos', baseChance: 38 },
    { name: '검은 환생의 불꽃', icon: 'ri-contrast-line', bonusRange: 'Tier 2–5', cost: '38M mesos', baseChance: 55 },
    { name: '레인보우 환생의 불꽃', icon: 'ri-rainbow-line', bonusRange: 'Tier 3–6', cost: '이벤트 전용', baseChance: 80 },
  ],
  cms: [
    { name: '强力涅槃火焰', icon: 'ri-fire-line', bonusRange: 'Tier 1–4', cost: '10M mesos', baseChance: 18 },
    { name: '永恒涅槃火焰', icon: 'ri-fire-fill', bonusRange: 'Tier 1–5', cost: '32M mesos', baseChance: 32 },
    { name: '黑暗涅槃火焰', icon: 'ri-contrast-line', bonusRange: 'Tier 2–5', cost: '48M mesos', baseChance: 48 },
    { name: '彩虹涅槃火焰', icon: 'ri-rainbow-line', bonusRange: 'Tier 3–6', cost: '活动限定', baseChance: 72 },
  ],
  tms: [
    { name: '強力重生火焰', icon: 'ri-fire-line', bonusRange: 'Tier 1–4', cost: '10M mesos', baseChance: 20 },
    { name: '永恆重生火焰', icon: 'ri-fire-fill', bonusRange: 'Tier 1–5', cost: '32M mesos', baseChance: 35 },
    { name: '黑色重生火焰', icon: 'ri-contrast-line', bonusRange: 'Tier 2–5', cost: '48M mesos', baseChance: 50 },
  ],
  jms: [
    { name: '強力な転生の炎', icon: 'ri-fire-line', bonusRange: 'Tier 1–4', cost: '8M mesos', baseChance: 21 },
    { name: '永遠の転生の炎', icon: 'ri-fire-fill', bonusRange: 'Tier 1–5', cost: '28M mesos', baseChance: 36 },
    { name: '黒の転生の炎', icon: 'ri-contrast-line', bonusRange: 'Tier 2–5', cost: '42M mesos', baseChance: 52 },
  ],
  msea: [
    { name: 'Powerful Rebirth Flame', icon: 'ri-fire-line', bonusRange: 'Tier 1–4', cost: '9M mesos', baseChance: 20 },
    { name: 'Eternal Rebirth Flame', icon: 'ri-fire-fill', bonusRange: 'Tier 1–5', cost: '30M mesos', baseChance: 35 },
    { name: 'Black Rebirth Flame', icon: 'ri-contrast-line', bonusRange: 'Tier 2–5', cost: '45M mesos', baseChance: 50 },
  ],
};

export const legionGridBlocks: Record<string, { class: string; shape: string; tier: 'S' | 'SS' | 'SSS'; stats: string }[]> = {
  all: [
    { class: 'Mercedes', shape: 'elbow', tier: 'SSS', stats: '-6% Skill Cooldown' },
    { class: 'Evan', shape: 'long', tier: 'SSS', stats: '+70% Rune Duration' },
    { class: 'Aran', shape: 'tall', tier: 'SSS', stats: '+12% Combo EXP' },
    { class: 'Phantom', shape: 'square', tier: 'SSS', stats: '+15% Crit Rate Buff' },
    { class: 'Luminous', shape: 'diamond', tier: 'SSS', stats: '+15% IED' },
    { class: 'Demon Avenger', shape: 'wide', tier: 'SS', stats: '+10% Boss Damage' },
    { class: 'Zero', shape: 'long', tier: 'SS', stats: '+12% EXP Obtained' },
    { class: 'Beast Tamer', shape: 'cross', tier: 'S', stats: '+5% Party EXP' },
  ],
  gms: [
    { class: 'Kain', shape: 'cross', tier: 'SSS', stats: '+80 LUK, +5% Boss' },
    { class: 'Kanna', shape: 'tall', tier: 'SS', stats: '+10% Damage' },
    { class: 'Hayato', shape: 'elbow', tier: 'SS', stats: '+10% Crit Damage' },
    { class: 'Lynn', shape: 'wind', tier: 'SS', stats: '+8% Party Heal' },
    { class: 'Shade', shape: 'wind', tier: 'SSS', stats: '+8% Survival Chance' },
  ],
  kms: [
    { class: 'Shade', shape: 'wind', tier: 'SSS', stats: '+8% Survival Chance' },
    { class: 'Kain', shape: 'cross', tier: 'SSS', stats: '+80 LUK, +5% Boss' },
    { class: 'Lara', shape: 'diamond', tier: 'SS', stats: '+5% Elemental Resist' },
  ],
  cms: [
    { class: 'Hoyoung', shape: 'tall', tier: 'SSS', stats: '+100 LUK, +8% Crit Damage' },
    { class: 'Kain', shape: 'cross', tier: 'SSS', stats: '+80 LUK, +5% Boss' },
  ],
  tms: [
    { class: 'Kain', shape: 'cross', tier: 'SSS', stats: '+80 LUK, +5% Boss' },
    { class: 'Shade', shape: 'wind', tier: 'SSS', stats: '+8% Survival Chance' },
  ],
  jms: [
    { class: 'Kanna', shape: 'tall', tier: 'SSS', stats: '+12% Damage, +5% Boss' },
    { class: 'Hayato', shape: 'elbow', tier: 'SSS', stats: '+12% Crit Damage' },
  ],
  msea: [
    { class: 'Kain', shape: 'cross', tier: 'SSS', stats: '+80 LUK, +5% Boss' },
    { class: 'Shade', shape: 'wind', tier: 'SSS', stats: '+8% Survival Chance' },
    { class: 'Lynn', shape: 'wind', tier: 'SS', stats: '+8% Party Heal' },
  ],
};

export const mapLocations = [
  { name: 'Limina — End of the World 1-4', minLevel: 255, maxLevel: 270, monsters: ['Ascendion', 'Foreberion', 'Embrion'], burning: 10, version: 'all', image: 'https://readdy.ai/api/search-image?query=Fantasy%20sci-fi%20cosmic%20world%20ending%20ruins%20with%20floating%20celestial%20bodies%20and%20ethereal%20glowing%20light%20fragments%2C%20vibrant%20maplestory%20game%20art%20style%2C%20soft%20warm%20tones%20and%20starry%20background%2C%20high%20detail%20isometric%20perspective%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-limina-01&orientation=landscape' },
  { name: 'Limina — End of the World 1-5', minLevel: 255, maxLevel: 270, monsters: ['Ascendion', 'Foreberion'], burning: 8, version: 'all', image: 'https://readdy.ai/api/search-image?query=Fantasy%20sci-fi%20cosmic%20void%20landscape%20with%20crumbling%20white%20marble%20pillars%20and%20purple%20energy%20streams%2C%20maplestory%20game%20art%20style%2C%20warm%20soft%20lighting%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-limina-02&orientation=landscape' },
  { name: 'Cernium — Royal Library 4', minLevel: 260, maxLevel: 275, monsters: ['Adept of Light', 'Scholar Ghost'], burning: 10, version: 'all', image: 'https://readdy.ai/api/search-image?query=Majestic%20fantasy%20royal%20library%20with%20towering%20bookshelves%20golden%20light%20streams%20and%20floating%20ancient%20scrolls%2C%20maplestory%20game%20art%20style%2C%20warm%20amber%20tones%2C%20isometric%20perspective%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-cernium-01&orientation=landscape' },
  { name: 'Cernium — Western City Ramparts 2', minLevel: 260, maxLevel: 275, monsters: ['Sword of Light', 'Shield of Light'], burning: 8, version: 'all', image: 'https://readdy.ai/api/search-image?query=Fantasy%20medieval%20city%20ramparts%20and%20battlements%20with%20glowing%20holy%20light%20orbs%20and%20armored%20statues%2C%20maplestory%20game%20art%20style%2C%20golden%20hour%20warm%20lighting%2C%20isometric%20perspective%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-cernium-02&orientation=landscape' },
  { name: 'Hotel Arcus — Rusty Corridor 4', minLevel: 270, maxLevel: 280, monsters: ['Desperate Thief', 'Steel Xenoroid'], burning: 10, version: 'all', image: 'https://readdy.ai/api/search-image?query=Futuristic%20steampunk%20corridor%20with%20rusted%20metal%20walls%20neon%20signs%20and%20glowing%20pipes%2C%20maplestory%20game%20art%20style%2C%20warm%20orange%20and%20copper%20tones%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-arcus-01&orientation=landscape' },
  { name: 'Odium — Laboratory 3', minLevel: 275, maxLevel: 285, monsters: ['Blinded Soldier', 'Blinded Mage'], burning: 10, version: 'all', image: 'https://readdy.ai/api/search-image?query=Dark%20futuristic%20laboratory%20interior%20with%20glass%20tanks%20pulsing%20energy%20cores%20and%20biomechanical%20equipment%2C%20maplestory%20game%20art%20style%2C%20cool%20blue%20and%20teal%20tones%20with%20warm%20accents%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-odium-01&orientation=landscape' },
  { name: 'Shangri-La — Peach Blossom Spring 1', minLevel: 280, maxLevel: 290, monsters: ['Spring Spirit', 'Autumn Spirit'], burning: 10, version: 'all', image: 'https://readdy.ai/api/search-image?query=Enchanting%20asian%20fantasy%20peach%20blossom%20spring%20with%20floating%20petals%20cherry%20trees%20and%20misty%20mountains%2C%20maplestory%20game%20art%20style%2C%20soft%20pink%20and%20warm%20peach%20tones%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-shangri-01&orientation=landscape' },
  { name: 'Solerian — Sunken Plaza 4', minLevel: 285, maxLevel: 295, monsters: ['Solerian Guard', 'Solerian Priest'], burning: 10, version: 'all', image: 'https://readdy.ai/api/search-image?query=Ancient%20sunken%20plaza%20ruins%20with%20overgrown%20crystalline%20structures%20and%20faint%20magical%20glow%20from%20below%2C%20maplestory%20game%20art%20style%2C%20warm%20amber%20and%20crystal%20light%20tones%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-solerian-01&orientation=landscape' },
  { name: 'Carsion — Desert Outpost 2', minLevel: 285, maxLevel: 300, monsters: ['Sand Giant', 'Crystal Scorpion'], burning: 10, version: 'all', image: 'https://readdy.ai/api/search-image?query=Fantasy%20desert%20outpost%20with%20giant%20sand%20dunes%20crystal%20formations%20and%20ancient%20ruined%20towers%2C%20maplestory%20game%20art%20style%2C%20warm%20golden%20desert%20tones%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-carsion-01&orientation=landscape' },
  { name: 'Commerci Republic — Rosa Coast 3', minLevel: 180, maxLevel: 210, monsters: ['Grosso Polpo', 'Aqua Patrol'], burning: 10, version: 'gms', image: 'https://readdy.ai/api/search-image?query=Charming%20fantasy%20coastal%20village%20with%20colorful%20roses%20white%20stone%20buildings%20and%20sparkling%20blue%20ocean%20water%2C%20maplestory%20game%20art%20style%2C%20warm%20sunny%20coastal%20tones%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-commerci-01&orientation=landscape' },
  { name: '카르시온 — 심연의 통로 3', minLevel: 290, maxLevel: 300, monsters: ['심연의 파수꾼', '어둠의 정령'], burning: 10, version: 'kms', image: 'https://readdy.ai/api/search-image?query=Deep%20abyss%20corridor%20with%20cracked%20obsidian%20walls%20purple%20void%20energy%20and%20glowing%20eye-shaped%20runes%2C%20maplestory%20game%20art%20style%2C%20dark%20mysterious%20tones%20with%20warm%20purple%20accents%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-kar-01&orientation=landscape' },
  { name: '少林寺 — 藏经阁', minLevel: 260, maxLevel: 275, monsters: ['扫地僧', '铜人'], burning: 10, version: 'cms', image: 'https://readdy.ai/api/search-image?query=Ancient%20chinese%20temple%20sutra%20pavilion%20with%20rows%20of%20golden%20scrolls%20incense%20smoke%20and%20bronze%20warrior%20statues%2C%20maplestory%20game%20art%20style%2C%20warm%20golden%20and%20earth%20tones%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-shaolin-01&orientation=landscape' },
  { name: '天空之城 — 雲海步道', minLevel: 200, maxLevel: 220, monsters: ['雲精靈', '雷鳥'], burning: 8, version: 'tms', image: 'https://readdy.ai/api/search-image?query=Magical%20sky%20city%20walkway%20above%20clouds%20with%20floating%20islands%20crystal%20bridges%20and%20thunder%20birds%2C%20maplestory%20game%20art%20style%2C%20soft%20blue%20and%20warm%20gold%20sky%20tones%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-sky-01&orientation=landscape' },
  { name: '倭城 — 天守閣', minLevel: 265, maxLevel: 280, monsters: ['侍大将', '忍者'], burning: 10, version: 'jms', image: 'https://readdy.ai/api/search-image?query=Japanese%20fantasy%20castle%20keep%20with%20pagoda%20roofs%20red%20lanterns%20and%20samurai%20armor%20displays%2C%20maplestory%20game%20art%20style%2C%20warm%20red%20and%20earth%20tones%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=800&height=450&seq=map-wajo-01&orientation=landscape' },
];

export const fashionItems = [
  { name: 'Royal Hair Coupon', icon: 'ri-scissors-line', category: 'Hair', rarity: 'Rare', versions: ['all'] },
  { name: 'Royal Face Coupon', icon: 'ri-emotion-line', category: 'Face', rarity: 'Rare', versions: ['all'] },
  { name: 'Premium Surprise Style Box', icon: 'ri-gift-2-line', category: 'Outfit', rarity: 'Epic', versions: ['all'] },
  { name: 'Transparent Face Accessory', icon: 'ri-eye-off-line', category: 'Face', rarity: 'Unique', versions: ['all'] },
  { name: 'Transparent Eye Accessory', icon: 'ri-eye-close-line', category: 'Eye', rarity: 'Unique', versions: ['all'] },
  { name: 'Permanent Pet Box', icon: 'ri-heart-2-line', category: 'Pet', rarity: 'Legendary', versions: ['all'] },
  { name: 'Damage Skin Extractor', icon: 'ri-paint-brush-line', category: 'Skin', rarity: 'Epic', versions: ['all'] },
  { name: 'Chair Bag Coupon', icon: 'ri-armchair-line', category: 'Chair', rarity: 'Rare', versions: ['all'] },
  { name: 'Mount Coupon', icon: 'ri-riding-line', category: 'Mount', rarity: 'Epic', versions: ['all'] },
  { name: 'Name Change Coupon', icon: 'ri-edit-line', category: 'Name', rarity: 'Legendary', versions: ['all'] },
  // GMS exclusive
  { name: 'Familiar Card Pack', icon: 'ri-stack-line', category: 'Familiar', rarity: 'Epic', versions: ['gms'] },
  { name: 'Gachapon Ticket (GMS)', icon: 'ri-gift-line', category: 'Gacha', rarity: 'Rare', versions: ['gms'] },
  // KMS exclusive
  { name: '몬스터 라이프 코인', icon: 'ri-coin-line', category: 'Farm', rarity: 'Rare', versions: ['kms'] },
  // CMS exclusive
  { name: '门派贡献令牌', icon: 'ri-vip-line', category: 'Faction', rarity: 'Epic', versions: ['cms'] },
  { name: '武侠时装礼盒', icon: 'ri-box-3-line', category: 'Outfit', rarity: 'Legendary', versions: ['cms'] },
  // TMS exclusive
  { name: '輪迴碑石 (90天)', icon: 'ri-hourglass-line', category: 'Equip', rarity: 'Legendary', versions: ['tms'] },
  // JMS exclusive
  { name: '戦国コスチュームBOX', icon: 'ri-box-3-line', category: 'Outfit', rarity: 'Legendary', versions: ['jms'] },
  { name: '霊力増幅のお守り', icon: 'ri-shield-star-line', category: 'Charm', rarity: 'Unique', versions: ['jms'] },
];

export const fashionSimOutfits = [
  { set: 'Sol Eternal Set', pieces: ['Sol Eternal Hat', 'Sol Eternal Suit', 'Sol Eternal Cape', 'Sol Eternal Wings', 'Sol Eternal Aura Ring'], rarity: 'Legendary', versions: ['gms'] },
  { set: 'Midnight Aristocrat Set', pieces: ['Obsidian Top Hat', 'Velvet Tailcoat', 'Silver Cravat', 'Monocle', 'Walking Cane'], rarity: 'Epic', versions: ['gms', 'kms', 'msea'] },
  { set: 'Cherry Blossom Festival Set', pieces: ['Blossom Hairpin', 'Sakura Kimono', 'Wooden Sandals', 'Paper Umbrella', 'Floral Fan'], rarity: 'Epic', versions: ['jms', 'tms'] },
  { set: 'Dragon Knight Set', pieces: ['Dragon Helm', 'Scale Armor', 'Dragon Wing Cape', 'Flame Gauntlets', 'Dragon Tail Boots'], rarity: 'Legendary', versions: ['kms', 'cms'] },
  // Additional version-specific sets
  { set: 'Cosmic Horoscope Set', pieces: ['Starlight Crown', 'Zodiac Robe', 'Galaxy Cape', 'Constellation Ring', 'Astral Staff'], rarity: 'Legendary', versions: ['gms'] },
  { set: '한복 정원 세트', pieces: ['비녀', '당의', '버선', '노리개', '부채'], rarity: 'Epic', versions: ['kms'] },
  { set: '武侠至尊套装', pieces: ['斗笠', '武侠长袍', '披风', '护腕', '长剑'], rarity: 'Legendary', versions: ['cms'] },
  { set: '元宵節燈籠套裝', pieces: ['燈籠頭飾', '錦衣', '繡花鞋', '花燈', '紙鳶'], rarity: 'Epic', versions: ['tms'] },
  { set: '戦国武将セット', pieces: ['兜', '鎧', '陣羽織', '軍配', '太刀'], rarity: 'Legendary', versions: ['jms'] },
  { set: 'Tropical Paradise Set', pieces: ['Flower Crown', 'Aloha Shirt', 'Board Shorts', 'Flip Flops', 'Coconut Drink'], rarity: 'Epic', versions: ['msea', 'gms'] },
];

export const monsterImages: Record<string, string> = {
  'Ascendion': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20celestial%20guardian%20creature%20with%20angelic%20wings%20and%20glowing%20white%20armor%20holding%20a%20luminous%20staff%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20soft%20golden%20and%20white%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-ascendion&orientation=squarish',
  'Foreberion': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20dark%20phantom%20knight%20creature%20with%20shadowy%20armor%20and%20glowing%20purple%20eyes%20floating%20ethereal%20chains%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20deep%20violet%20and%20dark%20blue%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-foreberion&orientation=squarish',
  'Embrion': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20fiery%20elemental%20spirit%20creature%20made%20of%20molten%20lava%20and%20orange%20flames%20with%20floating%20ember%20particles%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20warm%20orange%20and%20red%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-embrion&orientation=squarish',
  'Adept of Light': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20scholarly%20mage%20creature%20in%20white%20robes%20holding%20an%20open%20glowing%20spellbook%20with%20floating%20light%20runes%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20golden%20and%20cream%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-adept-light&orientation=squarish',
  'Scholar Ghost': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20translucent%20blue%20ghost%20creature%20wearing%20tiny%20spectacles%20and%20a%20scholar%20cap%20reading%20a%20floating%20ancient%20book%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20soft%20blue%20and%20teal%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-scholar-ghost&orientation=squarish',
  'Sword of Light': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20animated%20holy%20sword%20creature%20with%20a%20golden%20glowing%20blade%20floating%20upright%20with%20small%20angel%20wings%20on%20the%20hilt%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20bright%20gold%20and%20white%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-sword-light&orientation=squarish',
  'Shield of Light': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20animated%20holy%20shield%20creature%20with%20golden%20radiant%20surface%20and%20small%20ethereal%20wings%20floating%20with%20a%20determined%20face%20on%20the%20shield%20boss%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20warm%20gold%20and%20cream%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-shield-light&orientation=squarish',
  'Desperate Thief': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20rogue%20thief%20creature%20in%20a%20dark%20hooded%20cloak%20wielding%20dual%20daggers%20with%20a%20sly%20desperate%20expression%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20dark%20gray%20and%20muted%20purple%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-desp-thief&orientation=squarish',
  'Steel Xenoroid': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20mechanical%20robot%20creature%20with%20steel%20plated%20body%20glowing%20red%20eye%20sensor%20and%20extendable%20metallic%20arms%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20silver%20and%20gunmetal%20gray%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-steel-xeno&orientation=squarish',
  'Blinded Soldier': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20armored%20soldier%20creature%20with%20a%20blindfold%20over%20the%20eyes%20holding%20a%20chipped%20longsword%20with%20battle%20worn%20armor%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20muted%20steel%20and%20olive%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-blind-soldier&orientation=squarish',
  'Blinded Mage': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20robed%20mage%20creature%20with%20a%20blindfold%20crackling%20dark%20energy%20around%20trembling%20hands%20wearing%20tattered%20spellcaster%20robes%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20deep%20indigo%20and%20charcoal%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-blind-mage&orientation=squarish',
  'Spring Spirit': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20fairy%20spirit%20creature%20with%20cherry%20blossom%20petal%20wings%20wearing%20a%20floral%20crown%20surrounded%20by%20floating%20flower%20petals%20and%20soft%20pink%20glow%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20soft%20pink%20and%20mint%20green%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-spring-spirit&orientation=squarish',
  'Autumn Spirit': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20fairy%20spirit%20creature%20with%20orange%20maple%20leaf%20wings%20wearing%20an%20acorn%20hat%20surrounded%20by%20floating%20autumn%20leaves%20and%20warm%20golden%20glow%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20warm%20amber%20and%20burnt%20orange%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-autumn-spirit&orientation=squarish',
  'Solerian Guard': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20sun%20temple%20guardian%20creature%20in%20ornate%20golden%20armor%20holding%20a%20radiant%20spear%20with%20a%20sun%20emblem%20shield%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20warm%20gold%20and%20bronze%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-solerian-guard&orientation=squarish',
  'Solerian Priest': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20sun%20temple%20priest%20creature%20in%20flowing%20white%20and%20gold%20ceremonial%20robes%20holding%20a%20solar%20orb%20staff%20with%20radiating%20light%20beams%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20cream%20and%20soft%20gold%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-solerian-priest&orientation=squarish',
  'Sand Giant': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20giant%20sand%20golem%20creature%20made%20of%20compacted%20golden%20desert%20sand%20with%20glowing%20amber%20crystal%20core%20in%20chest%20and%20rocky%20fists%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20sandy%20beige%20and%20warm%20amber%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-sand-giant&orientation=squarish',
  'Crystal Scorpion': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20crystal%20scorpion%20creature%20with%20translucent%20turquoise%20crystalline%20body%20segments%20and%20glowing%20gem%20tipped%20stinger%20tail%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20teal%20and%20aquamarine%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-crystal-scorp&orientation=squarish',
  'Grosso Polpo': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20giant%20octopus%20creature%20with%20deep%20purple%20tentacles%20and%20large%20expressive%20eyes%20wearing%20a%20tiny%20pirate%20hat%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20ocean%20purple%20and%20coral%20pink%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-grosso-polpo&orientation=squarish',
  'Aqua Patrol': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20water%20guard%20creature%20in%20blue%20naval%20uniform%20armor%20carrying%20a%20trident%20with%20bubble%20effects%20and%20a%20determined%20expression%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20ocean%20blue%20and%20seafoam%20green%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-aqua-patrol&orientation=squarish',
  '심연의 파수꾼': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20abyss%20guardian%20creature%20with%20dark%20obsidian%20armor%20and%20glowing%20purple%20void%20energy%20core%20in%20chest%20holding%20a%20jagged%20dark%20blade%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20deep%20black%20and%20neon%20purple%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-abyss-guardian&orientation=squarish',
  '어둠의 정령': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20shadow%20spirit%20creature%20made%20of%20swirling%20dark%20smoke%20with%20two%20glowing%20cyan%20eyes%20and%20wispy%20ethereal%20form%20floating%20ominously%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20charcoal%20and%20cyan%20glow%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-dark-spirit&orientation=squarish',
  '扫地僧': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20shaolin%20sweeping%20monk%20creature%20in%20humble%20gray%20robes%20holding%20a%20wooden%20broom%20with%20a%20serene%20expression%20and%20faint%20golden%20aura%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20warm%20gray%20and%20earth%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-sweep-monk&orientation=squarish',
  '铜人': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20bronze%20warrior%20statue%20creature%20with%20metallic%20copper%20toned%20body%20in%20martial%20arts%20stance%20with%20glowing%20fist%20technique%20energy%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20bronze%20and%20copper%20metallic%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-bronze-man&orientation=squarish',
  '雲精靈': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20cloud%20spirit%20creature%20with%20fluffy%20white%20cloud%20body%20and%20rainbow%20colored%20inner%20glow%20floating%20gracefully%20with%20tiny%20lightning%20sparks%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20soft%20white%20and%20pastel%20rainbow%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-cloud-spirit&orientation=squarish',
  '雷鳥': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20thunderbird%20creature%20with%20electric%20yellow%20feathers%20and%20crackling%20lightning%20wing%20tips%20soaring%20with%20storm%20cloud%20aura%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20bright%20yellow%20and%20electric%20blue%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-thunder-bird&orientation=squarish',
  '侍大将': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20samurai%20general%20creature%20in%20elaborate%20red%20and%20gold%20armor%20wearing%20a%20kabuto%20helmet%20with%20crescent%20crest%20holding%20a%20gleaming%20katana%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20crimson%20and%20gold%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-samurai-gen&orientation=squarish',
  '忍者': 'https://readdy.ai/api/search-image?query=Cute%20pixel%20art%20ninja%20creature%20in%20dark%20navy%20shinobi%20outfit%20with%20a%20red%20scarf%20holding%20a%20kunai%20knife%20in%20combat%20pose%20with%20shuriken%20floating%20nearby%2C%20MapleStory%20style%202D%20side%20scrolling%20game%20sprite%2C%20dark%20navy%20and%20crimson%20tones%2C%20simple%20clean%20background%2C%20high%20detail%20sprite%20art%20for%20RPG%20game%20monster%20bestiary%20icon&width=200&height=200&seq=mon-ninja&orientation=squarish',
};