import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';

type PopularWikiItem = {
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  category: string;
  icon: string;
  i18nKey: string;
};

const popularWikiItems: PopularWikiItem[] = [
  {
    title: 'Classes',
    titleZh: '职业',
    description: 'Browse playable classes, branches, and job groups.',
    descriptionZh: '浏览可玩职业、职业分支与职业群。',
    category: 'Classes',
    icon: 'ri-sword-line',
    i18nKey: 'classes',
  },
  {
    title: 'Link Skill',
    titleZh: 'Link Skill',
    description: 'Reference for account-wide class link skills.',
    descriptionZh: '查看各职业可共享的 Link Skill。',
    category: 'Systems',
    icon: 'ri-link',
    i18nKey: 'link_skill',
  },
  {
    title: 'Legion System',
    titleZh: '联盟系统',
    description: 'Legion board, character blocks, and account progression.',
    descriptionZh: '联盟棋盘、角色方块与账号成长系统。',
    category: 'Systems',
    icon: 'ri-layout-grid-line',
    i18nKey: 'legion',
  },
  {
    title: 'Arcane River',
    titleZh: '奥术之河',
    description: 'Major level 200+ region and progression hub.',
    descriptionZh: '200 级后的核心区域与成长内容。',
    category: 'Locations',
    icon: 'ri-map-2-line',
    i18nKey: 'arcane-river',
  },
  {
    title: 'Grandis',
    titleZh: '格兰蒂斯',
    description: 'Modern high-level regions and story areas.',
    descriptionZh: '后期高等级区域与主线故事区域。',
    category: 'Locations',
    icon: 'ri-planet-line',
    i18nKey: 'grandis',
  },
  {
    title: 'Bosses',
    titleZh: 'Boss 列表',
    description: 'Boss entries, fight information, and related rewards.',
    descriptionZh: 'Boss 条目、战斗信息与相关奖励。',
    category: 'Bosses',
    icon: 'ri-skull-2-line',
    i18nKey: 'bosses',
  },
  {
    title: 'Black Mage',
    titleZh: '黑魔法师',
    description: 'One of MapleStory\'s central endgame bosses.',
    descriptionZh: '冒险岛核心终局 Boss 之一。',
    category: 'Bosses',
    icon: 'ri-magic-line',
    i18nKey: 'black-mage',
  },
  {
    title: 'Lucid',
    titleZh: '露希妲',
    description: 'Dream-themed Arcane River boss encounter.',
    descriptionZh: '梦境主题的奥术之河 Boss。',
    category: 'Bosses',
    icon: 'ri-moon-line',
    i18nKey: 'lucid',
  },
  {
    title: 'Will',
    titleZh: '威尔',
    description: 'Esfera boss and major Arcane River milestone.',
    descriptionZh: '埃斯佩拉 Boss 与奥术之河重要节点。',
    category: 'Bosses',
    icon: 'ri-spider-line',
    i18nKey: 'will',
  },
  {
    title: 'Lotus',
    titleZh: '斯乌',
    description: 'High-level boss in the Black Mage storyline.',
    descriptionZh: '黑魔法师剧情线中的高等级 Boss。',
    category: 'Bosses',
    icon: 'ri-sword-line',
    i18nKey: 'lotus',
  },
  {
    title: 'Gloom',
    titleZh: '真希拉',
    description: 'Arcane River boss with unique mechanics.',
    descriptionZh: '奥术之河 Boss，拥有独特机制。',
    category: 'Bosses',
    icon: 'ri-skull-line',
    i18nKey: 'gloom',
  },
  {
    title: 'Guardian Angel Slime',
    titleZh: '守护天使绿水灵',
    description: 'Popular endgame boss with high rewards.',
    descriptionZh: '热门终局 Boss，掉落奖励丰厚。',
    category: 'Bosses',
    icon: 'ri-shield-star-line',
    i18nKey: 'gas',
  },
  {
    title: 'Magnus',
    titleZh: '马格努斯',
    description: 'Classic high-level boss with timeless rewards.',
    descriptionZh: '经典高等级 Boss，经典奖励。',
    category: 'Bosses',
    icon: 'ri-fire-line',
    i18nKey: 'magnus',
  },
  {
    title: 'Damien',
    titleZh: '戴米安',
    description: 'Cygnus storyline boss with challenging mechanics.',
    descriptionZh: '骑士团剧情 Boss，机制极具挑战性。',
    category: 'Bosses',
    icon: 'ri-flashlight-line',
    i18nKey: 'damien',
  },
  {
    title: 'Star Force',
    titleZh: '星之力',
    description: 'Equipment enhancement system and progression reference.',
    descriptionZh: '装备强化系统与成长参考。',
    category: 'Equipment',
    icon: 'ri-star-line',
    i18nKey: 'star-force',
  },
  {
    title: 'Potential',
    titleZh: '潜能',
    description: 'Potential tiers, lines, and equipment stat upgrades.',
    descriptionZh: '潜能等级、词条与装备属性提升。',
    category: 'Equipment',
    icon: 'ri-gemini-line',
    i18nKey: 'potential',
  },
  {
    title: 'Hexa Matrix',
    titleZh: 'Hexa Matrix',
    description: '6th job progression system and core enhancements.',
    descriptionZh: '六转成长系统与核心强化。',
    category: 'Systems',
    icon: 'ri-hexagon-line',
    i18nKey: 'hexa-matrix',
  },
];

const previewSections = [
  {
    title: 'Class Progression',
    titleZh: '职业成长',
    body: 'MapleStory classes are grouped into Explorer, Cygnus Knights, Heroes, Resistance, Nova, Flora, Anima, Sengoku, Shine, and other special branches. Each class page on the wiki usually contains job advancement details, skill names, story background, and related systems.',
    bodyZh: 'MapleStory 职业通常分为冒险家、皇家骑士团、英雄、反抗者、诺巴、雷普、阿尼玛、战国、Shine 以及特殊职业等分支。Wiki 的职业页面一般包含转职、技能、职业背景与相关系统资料。',
    links: ['Classes', 'Link Skill', 'Legion System'],
    i18nKey: 'class-prog',
  },
  {
    title: 'Equipment Systems',
    titleZh: '装备系统',
    body: 'The most-used equipment references include Star Force, Potential, Bonus Potential, scrolling, flames, set effects, and boss accessories. These systems are often checked when planning upgrades or comparing gear.',
    bodyZh: '常用装备资料包括星之力、潜能、附加潜能、卷轴、火花、套装效果与 Boss 饰品。玩家规划强化路线或比较装备时通常会查这些页面。',
    links: ['Star Force', 'Potential', 'Equipment'],
    i18nKey: 'equip-sys',
  },
  {
    title: 'Bossing',
    titleZh: 'Boss 内容',
    body: 'Popular boss pages cover entry requirements, boss mechanics, related quests, and reward references. Common lookups include Lucid, Will, Black Mage, Damien, Lotus, Gloom, and Guardian Angel Slime.',
    bodyZh: '热门 Boss 页面通常包含入场条件、机制、相关任务与掉落奖励参考。常查条目包括露希妲、威尔、黑魔法师、戴米安、斯乌、真希拉、守护天使绿水灵等。',
    links: ['Bosses', 'Lucid', 'Lotus', 'Gloom', 'Guardian Angel Slime', 'Black Mage'],
    i18nKey: 'bossing',
  },
  {
    title: 'World And Regions',
    titleZh: '世界与地区',
    body: 'Location pages are useful for story progression, training, quest chains, and regional systems. Arcane River and Grandis are among the most important late-game region hubs.',
    bodyZh: '地图与地区页面适合查询剧情推进、练级区域、任务链与地区系统。奥术之河和格兰蒂斯是后期最重要的区域入口之一。',
    links: ['Arcane River', 'Grandis', 'Locations'],
    i18nKey: 'world',
  },
];

const localArticlePath = (title: string) =>
  `/wiki/article/${encodeURIComponent(title)}`;

export default function WikiPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');

  const openArticle = (title: string) => {
    navigate(localArticlePath(title));
  };

  const submitSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(localArticlePath(trimmed));
  };

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <div className="mx-auto w-full max-w-[1180px] px-4 md:px-8">
          <section className="min-w-0 bg-white px-4 py-5 md:px-8 md:py-7">
            <div className="mb-5 flex min-w-0 items-center gap-2">
              <div className="flex h-10 min-w-0 flex-1 items-center border border-background-300 bg-white md:max-w-md">
                <i className="ri-search-line px-2 text-foreground-600"></i>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submitSearch();
                  }}
                  placeholder={t('wiki_page_search_placeholder')}
                  className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
                />
              </div>
              <button
                type="button"
                onClick={submitSearch}
                className="h-10 border border-background-300 bg-background-50 px-4 text-sm font-semibold hover:bg-background-100"
              >
                {t('wiki_page_search_btn')}
              </button>
            </div>

            <div className="wiki-vector-article wiki-article-content">
              <div className="border-b border-background-300 pb-3">
                <h1 className="font-serif text-3xl font-normal leading-tight text-foreground-950 md:text-[2.1rem]">
                  {t('wiki_popular_title')}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-600">
                  {t('wiki_popular_desc')}
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {popularWikiItems.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => openArticle(item.title)}
                    className="group min-h-40 border border-background-300 bg-background-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary-600 hover:bg-primary-50 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-white text-2xl text-primary-600 ring-1 ring-background-100">
                        <i className={item.icon}></i>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-semibold text-primary-600 group-hover:underline">
                          {t('wiki_art_' + item.i18nKey)}
                        </span>
                        <span className="mt-1 inline-flex bg-background-100 px-2 py-0.5 text-xs text-foreground-600">
                          {item.category}
                        </span>
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-foreground-950">
                      {t('wiki_art_' + item.i18nKey + '_desc')}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mainpage-title mt-8">
                {t('wiki_preview_title')}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {previewSections.map((section) => (
                  <section key={section.title} className="border border-background-300 bg-white p-4">
                    <h2 className="font-serif text-xl font-normal text-foreground-950">
                      {t('wiki_prev_' + section.i18nKey)}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-foreground-950">
                      {t('wiki_prev_' + section.i18nKey + '_body')}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {section.links.map((link) => (
                        <button
                          key={link}
                          type="button"
                          onClick={() => openArticle(link)}
                          className="border border-background-300 bg-background-50 px-2.5 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50 hover:underline"
                        >
                          {link}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-6">
                <Link to="/" className="text-sm text-primary-600 hover:underline">
                  {t('wiki_back_home')}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
