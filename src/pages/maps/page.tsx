import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { useVersion } from '@/hooks/VersionContext';
import { bosses } from '@/mocks/bosses';
import { isAvailableInVersion, millisecondsUntilReset } from '@/domain/regionModel';
import MapExplorer from '@/pages/mapler-house/components/MapExplorer';

type TrainingSpot = {
  level: string;
  region: string;
  maps: string[];
  monsters: string;
  note: string;
  wikiTitle: string;
};

const trainingSpots: TrainingSpot[] = [
  { level: '1 – 30', region: 'Victoria Island', maps: ['Kerning City Subway', 'Ant Tunnel', 'Ellinia Tree Dungeon'], monsters: 'Slimes, Stumpys, Horned Mushrooms', note: 'Follow quests for fastest EXP; party quests at Lv.20+', wikiTitle: 'Victoria_Island' },
  { level: '30 – 60', region: 'Victoria Island / Orbis', maps: ['Kerning City PQ', 'Ludi PQ', 'Gold Beach'], monsters: 'Ligator, Wild Kargo, Trixter', note: 'Party Quests give strong EXP boosts at this range', wikiTitle: 'Orbis' },
  { level: '60 – 100', region: 'Leafre / Mu Lung', maps: ['Coolie Zombies', 'Bamboo Warriors', 'Panda Heroes'], monsters: 'Zombies, Bamboo Warrior, Master Robo', note: 'Coolie Zombies are a classic grind; Mu Lung Dojo starts here', wikiTitle: 'Leafre' },
  { level: '100 – 140', region: 'Temple of Time / Zipangu', maps: ['Gate to the Future', 'Pink Bean Temple', 'Showa Town'], monsters: 'Time Spirits, Eye of Time, Nightshadow', note: 'Temple of Time quests unlock boss pre-quests', wikiTitle: 'Temple_of_Time' },
  { level: '140 – 170', region: 'Edelstein / Kritias', maps: ['Leopard Path', 'Alien Base', 'Kritias Corrupted'], monsters: 'Roid, Security Cameras, Corrupted Magic Guards', note: 'Edelstein PQ + Kritias daily quests are efficient', wikiTitle: 'Edelstein' },
  { level: '170 – 200', region: 'Commerci / Ludibrium PQ', maps: ['Commerci Voyages', 'LMPQ', 'Root Abyss'], monsters: 'Various bosses, Chaos Velda, Pierre', note: 'Root Abyss (Normal) and Commerci dailies give strong growth', wikiTitle: 'Root_Abyss' },
  { level: '200 – 210', region: 'Arcane River: Vanishing Journey', maps: ['Slurpy Forest', 'Cave of Rest', 'Swamp of Memories'], monsters: 'Slurpy, Stonebug, Ratz', note: 'Start Arcane Symbols here; daily symbol quests', wikiTitle: 'Vanishing_Journey' },
  { level: '210 – 220', region: 'Arcane River: Chu Chu', maps: ['Chuchu Island', 'Muto\'s Forest', 'Slurpy Shoreline'], monsters: 'Muto, Chuchu, Flyoon', note: 'Chuchu food quest is mandatory for symbols', wikiTitle: 'Chu_Chu_Island' },
  { level: '220 – 225', region: 'Arcane River: Lachelein', maps: ['Dreamy Desert', 'Arcana\'s Library', 'Clocktower'], monsters: 'Wraith, Lucid mobs, Nightmare', note: 'Nightmare mobs give strong EXP with party buff', wikiTitle: 'Lachelein' },
  { level: '225 – 230', region: 'Arcane River: Arcana', maps: ['Cavern of the Wailing', 'Spirit\'s Realm', 'Under the Banyan Tree'], monsters: 'Spirit Veil, Guardian, Arachnid', note: 'High density maps, great for party grinding', wikiTitle: 'Arcana_(region)' },
  { level: '230 – 235', region: 'Arcane River: Morass', maps: ['Savage Terminal', 'Swamp of Dusk', 'Deep Morass'], monsters: 'Fox Spirit, Shade, Gloom mobs', note: 'Esfera pre-quest zone; good meso drops too', wikiTitle: 'Morass_of_the_Forest' },
  { level: '235 – 250', region: 'Esfera', maps: ['Mirror-Stormy Forest', 'Esfera\'s Edge', 'Pain\'s Forest'], monsters: 'Memory Keeper, Spirit Savage, Shadow Knight', note: 'Sacred Symbols needed; Mirror World bosses here', wikiTitle: 'Esfera' },
  { level: '250 – 260', region: 'Sellas / Moonbridge', maps: ['Sellas Deep Sea', 'Starlight Forest', 'Moonbridge Path'], monsters: 'Leviathan, Starlight mobs, Coral Golem', note: 'Sellas grinding is the meta for this range', wikiTitle: 'Sellas' },
  { level: '260 – 275', region: 'Grandis: Cernium', maps: ['Cernium Castle', 'Burning Cathedral', 'Sacred Tree'], monsters: 'Royal Guard, Cardinal mobs, Holy Knight', note: 'Grandis story region; Sacred Symbols start', wikiTitle: 'Cernium' },
  { level: '275+', region: 'Grandis: Hotel Arcus / Odium', maps: ['Arcus Lobby', 'Odium Ruins', 'Shangri-La'], monsters: 'Arcus mobs, Odium creatures, Sol Janus', note: '6th job content; highest EXP density in the game', wikiTitle: 'Hotel_Arcus' },
];

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return [
    days > 0 ? `${days}d` : '',
    `${String(hours).padStart(2, '0')}h`,
    `${String(minutes).padStart(2, '0')}m`,
    `${String(seconds).padStart(2, '0')}s`,
  ].filter(Boolean).join(' ');
};

export default function MapsPage() {
  const { t, i18n } = useTranslation();
  const { version } = useVersion();
  const [notifOpen, setNotifOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const isZh = i18n.language.startsWith('zh');
  const regionBosses = useMemo(
    () => bosses.filter((boss) => isAvailableInVersion(boss.regions, version)),
    [version],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = filter
    ? trainingSpots.filter((s) =>
        s.level.includes(filter) || s.region.toLowerCase().includes(filter.toLowerCase()),
      )
    : trainingSpots;

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
          <MapExplorer />

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <i className="ri-map-pin-line text-2xl"></i>
              </div>
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-semibold text-foreground-950">
                  {isZh ? '练级地图推荐' : 'Training Spot Guide'}
                </h1>
                <p className="text-sm text-foreground-600 mt-1">
                  {isZh
                    ? '按等级段整理的高效练级地图，帮你找到最适合当前等级的区域。'
                    : 'Curated training maps by level range to help you find the best spots for your current level.'}
                </p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-center gap-2 flex-1 max-w-sm border border-background-300 rounded-lg bg-background-50 px-3 h-10">
                <i className="ri-search-line text-foreground-500 text-sm"></i>
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={isZh ? '按等级或区域筛选...' : 'Filter by level or region...'}
                  className="flex-1 bg-transparent text-sm outline-none text-foreground-900 placeholder:text-foreground-500"
                />
              </div>
              {filter && (
                <button
                  type="button"
                  onClick={() => setFilter('')}
                  className="text-xs text-foreground-500 hover:text-foreground-700"
                >
                  {isZh ? '清除' : 'Clear'}
                </button>
              )}
            </div>
          </div>

          {/* Training spots list */}
          <div className="space-y-4">
            {filtered.map((spot) => (
              <div
                key={spot.level}
                className="rounded-lg border border-background-200 bg-background-50 p-5 hover:border-primary-300 hover:shadow-sm transition"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Level badge */}
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200">
                      <i className="ri-sword-line text-primary-600 text-sm"></i>
                      <span className="text-sm font-bold text-primary-700">Lv. {spot.level}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-foreground-950">{spot.region}</h2>
                      <Link
                        to={`/wiki/article/${spot.wikiTitle}`}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        <i className="ri-external-link-line mr-0.5"></i>
                        Wiki
                      </Link>
                    </div>

                    <div className="mt-2 grid gap-x-6 gap-y-1 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-foreground-500 whitespace-nowrap">{isZh ? '地图:' : 'Maps:'}</span>
                        <span className="text-foreground-800">{spot.maps.join(', ')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-foreground-500 whitespace-nowrap">{isZh ? '怪物:' : 'Mobs:'}</span>
                        <span className="text-foreground-800">{spot.monsters}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-foreground-500 whitespace-nowrap">{isZh ? '备注:' : 'Note:'}</span>
                        <span className="text-foreground-700">{spot.note}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-foreground-500">
              <i className="ri-search-line text-3xl mb-3 block"></i>
              <p>{isZh ? '没有匹配的练级地图' : 'No matching training spots found'}</p>
            </div>
          )}

          <section id="boss-resets" className="mt-12 scroll-mt-24">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                  {isZh ? `${version.toUpperCase()} 服务器时间` : `${version.toUpperCase()} server time`}
                </p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground-950">
                  {isZh ? 'Boss 重置倒计时与主要掉落' : 'Boss reset countdowns and notable drops'}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-600">
                  {isZh
                    ? '这里显示每日或每周副本重置倒计时，不代表野外 Boss 的刷新时间；掉落信息来自站内 Boss 资料记录。'
                    : 'These timers track daily or weekly instance resets, not open-world respawn times. Drops come from the site boss records.'}
                </p>
              </div>
              <Link
                to="/checklist"
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700"
              >
                <i className="ri-checkbox-circle-line" aria-hidden="true" />
                {t('nav_checklist')}
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {regionBosses.map((boss) => {
                const resetType = boss.weeklyLimit > 0 ? 'weekly' : 'daily';
                const countdown = millisecondsUntilReset(resetType, version, now);
                return (
                  <article
                    key={boss.id}
                    className="rounded-xl border border-background-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-xl font-semibold text-foreground-950">
                          {isZh ? boss.nameZh : boss.name}
                        </h3>
                        <p className="mt-1 text-xs text-foreground-500">
                          {boss.difficulty.join(' / ')}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700">
                        {resetType === 'weekly'
                          ? (isZh ? '每周' : 'Weekly')
                          : (isZh ? '每日' : 'Daily')}
                      </span>
                    </div>

                    <div className="mt-4 rounded-lg bg-foreground-950 px-4 py-3 text-white">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                        {isZh ? '距离重置' : 'Resets in'}
                      </div>
                      <div className="mt-1 font-mono text-lg font-bold text-secondary-300" aria-live="off">
                        {formatCountdown(countdown)}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-foreground-500">
                        {t('boss_drops')}
                      </div>
                      {boss.drops.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {boss.drops.slice(0, 4).map((drop) => (
                            <li key={`${boss.id}-${drop.name}`} className="flex items-start justify-between gap-3 text-sm">
                              <span className="font-medium text-foreground-800">{drop.name}</span>
                              <span className="shrink-0 rounded bg-background-100 px-2 py-0.5 text-[11px] font-semibold text-foreground-600">
                                {drop.rarity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-foreground-500">
                          {isZh ? '暂无已验证掉落记录' : 'No verified drop records yet'}
                        </p>
                      )}
                    </div>

                    <Link
                      to={`/wiki/boss/${encodeURIComponent(boss.name)}`}
                      className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
                    >
                      {isZh ? '查看完整 Boss 资料与掉落' : 'View full boss guide and drops'}
                      <i className="ri-arrow-right-line" aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          {/* External resources */}
          <div className="mt-10 rounded-lg border border-background-200 bg-background-100 p-5">
            <h3 className="text-sm font-semibold text-foreground-800 mb-3">
              {isZh ? '更多地图资料' : 'More Map Resources'}
            </h3>
            <div className="flex flex-wrap gap-3 text-sm">
              <a
                href="https://maplestorywiki.net/w/Category:Locations"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary-600 hover:underline"
              >
                <i className="ri-book-open-line"></i>
                MapleStory Wiki Locations
              </a>
              <Link
                to="/guides/level"
                className="inline-flex items-center gap-1.5 text-primary-600 hover:underline"
              >
                <i className="ri-route-line"></i>
                {isZh ? '升级路线指南' : 'Leveling Route Guide'}
              </Link>
              <Link
                to="/wiki/article/Monster_Park"
                className="inline-flex items-center gap-1.5 text-primary-600 hover:underline"
              >
                <i className="ri-landscape-line"></i>
                Monster Park
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
