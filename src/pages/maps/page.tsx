import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';

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

export default function MapsPage() {
  const { t, i18n } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const isZh = i18n.language.startsWith('zh');

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
