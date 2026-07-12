import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { levelRanges, type ContentItem } from '@/mocks/levelGuide';

const typeIcons: Record<ContentItem['type'], string> = {
  boss: 'ri-skull-2-line',
  quest: 'ri-scroll-line',
  dungeon: 'ri-building-line',
  'party-quest': 'ri-team-line',
  system: 'ri-settings-3-line',
  event: 'ri-calendar-event-line',
};

export default function LevelGuidePage() {
  const { t } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeRange, setActiveRange] = useState(0);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <div className="mx-auto flex w-full max-w-6xl">
          {/* Sidebar quick jumps */}
          <aside className="hidden w-52 shrink-0 px-4 py-6 lg:block">
            <div className="mb-4 border-b border-background-300 pb-3">
              <h2 className="text-sm font-semibold text-foreground-950">
                {t('level_quick_jumps')}
              </h2>
            </div>
            <nav className="space-y-0.5">
              {levelRanges.map((range, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActiveRange(i);
                    document.getElementById(`level-range-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`block w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                    activeRange === i
                      ? 'bg-background-100 font-semibold text-foreground-950'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Lv.{range.minLevel}-{range.maxLevel === 999 ? '270+' : range.maxLevel}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <section className="min-w-0 flex-1 border-l border-background-300 bg-white px-4 py-6 md:px-8">
            <h1 className="mb-2 font-serif text-2xl font-normal md:text-3xl">
              {t('level_title')}
            </h1>
            <p className="mb-6 text-sm text-foreground-600">
              {t('level_desc')}
            </p>

            {/* Mobile quick jumps */}
            <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
              {levelRanges.map((range, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActiveRange(i);
                    document.getElementById(`level-range-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`rounded px-2 py-1 text-xs ${
                    activeRange === i
                      ? 'bg-primary-600 text-white'
                      : 'border border-background-300 bg-white text-primary-600 hover:bg-background-100'
                  }`}
                >
                  {range.minLevel}-{range.maxLevel === 999 ? '270+' : range.maxLevel}
                </button>
              ))}
            </div>

            {/* Level ranges */}
            <div className="space-y-10">
              {levelRanges.map((range, i) => (
                <div key={i} id={`level-range-${i}`} className="scroll-mt-24">
                  {/* Range header */}
                  <div className="mb-4 border-b border-background-300 pb-2">
                    <h2 className="font-serif text-xl font-normal text-foreground-950">
                      {range.title}
                    </h2>
                    <p className="mt-1 text-sm text-foreground-600">
                      {range.summary}
                    </p>
                  </div>

                  {/* Two columns: recommended + optional */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recommended */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground-950">
                        <i className="ri-star-fill text-accent-500"></i>
                        {t('level_recommended')}
                      </h3>
                      <div className="space-y-3">
                        {range.recommended.map((item, j) => (
                          <div
                            key={j}
                            className="rounded border border-background-300 bg-white p-3"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <i className={`${typeIcons[item.type]} text-primary-600`}></i>
                              <span className="text-xs font-semibold text-foreground-600 uppercase">
                                {t('level_type_' + item.type)}
                              </span>
                            </div>
                            <div className="font-semibold text-foreground-950">
                              {item.name}
                            </div>
                            <p className="mt-1 text-xs text-foreground-600">
                              {item.description}
                            </p>
                            {item.rewards.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.rewards.map((r, k) => (
                                  <span
                                    key={k}
                                    className="rounded bg-background-50 px-1.5 py-0.5 text-xs text-foreground-600"
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Optional */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground-950">
                        <i className="ri-checkbox-circle-line text-foreground-600"></i>
                        {t('level_optional')}
                      </h3>
                      <div className="space-y-3">
                        {range.optional.map((item, j) => (
                          <div
                            key={j}
                            className="rounded border border-background-100 bg-background-50 p-3"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <i className={`${typeIcons[item.type]} text-foreground-600`}></i>
                              <span className="text-xs font-semibold text-foreground-500 uppercase">
                                {t('level_type_' + item.type)}
                              </span>
                            </div>
                            <div className="font-semibold text-foreground-950">
                              {item.name}
                            </div>
                            <p className="mt-1 text-xs text-foreground-600">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Grinding maps */}
                  {range.grindingMaps.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground-950">
                        <i className="ri-map-pin-line text-primary-600"></i>
                        {t('level_grinding_maps')}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {range.grindingMaps.map((map, j) => (
                          <div
                            key={j}
                            className="rounded border border-background-300 bg-white p-3 text-center"
                          >
                            <div className="font-semibold text-foreground-950">
                              {map.name}
                            </div>
                            <div className="mt-1 text-xs text-foreground-600">
                              {map.monster}
                            </div>
                            <div className="mt-1 text-xs text-foreground-500">
                              Lv.{map.levelRange}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
