import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { rankingBoard } from '@/mocks/home';

const worlds = ['All Worlds', 'Bera', 'Scania', 'Kronos', 'Hyperion'];
const boards = ['Overall Level', 'Legion Power', 'Union Rank', 'Boss Damage'];

const trendIcon = { up: 'ri-arrow-up-line text-accent-600', down: 'ri-arrow-down-line text-primary-600', flat: 'ri-subtract-line text-foreground-500' };

export default function RankingBoard() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();
  const [world, setWorld] = useState('All Worlds');
  const [board, setBoard] = useState('Overall Level');

  return (
    <section id="rankings" className="py-14 md:py-20 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
              {t('rankings_title_eyebrow')}
            </div>
            <h2 className="mt-2 font-heading text-2xl md:text-4xl font-semibold text-foreground-950">
              {t('rankings_title')}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={world}
              onChange={(e) => setWorld(e.target.value)}
              className="h-10 px-3 rounded-full border border-background-300 bg-background-50 text-sm text-foreground-800 pr-8 outline-none focus:border-primary-400 cursor-pointer"
            >
              {worlds.map((w) => (
                <option key={w}>{w === 'All Worlds' ? t('rankings_worlds_all') : w}</option>
              ))}
            </select>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="h-10 px-3 rounded-full border border-background-300 bg-background-50 text-sm text-foreground-800 pr-8 outline-none focus:border-primary-400 cursor-pointer"
            >
              {boards.map((b) => (
                <option key={b}>{b === 'Overall Level' ? t('rankings_board_level') : b === 'Legion Power' ? t('rankings_board_legion') : b === 'Union Rank' ? t('rankings_board_union') : t('rankings_board_boss')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-xl border border-background-200 bg-background-50 overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 bg-background-100 text-[11px] uppercase tracking-wider text-foreground-600 font-semibold">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Character</div>
              <div className="col-span-3">Class · World</div>
              <div className="col-span-2 text-right">Level</div>
              <div className="col-span-2 text-right">Legion</div>
            </div>
            <ul>
              {rankingBoard.map((r) => (
                <li
                  key={r.rank}
                  className="grid grid-cols-12 px-5 py-3.5 items-center border-t border-background-200/70 hover:bg-background-100 transition-colors cursor-pointer"
                >
                  <div className="col-span-1">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center font-heading font-semibold text-sm ${
                        r.rank === 1
                          ? 'bg-primary-500 text-background-50'
                          : r.rank === 2
                          ? 'bg-secondary-400 text-secondary-950'
                          : r.rank === 3
                          ? 'bg-accent-400 text-accent-950'
                          : 'bg-background-100 text-foreground-700'
                      }`}
                    >
                      {r.rank}
                    </div>
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-200 text-primary-800 font-semibold text-sm flex items-center justify-center">
                      {r.name[0]}
                    </div>
                    <div>
                      <div className="font-heading font-semibold text-sm text-foreground-950">
                        {r.name}
                      </div>
                      <div className="text-[11px] text-foreground-600 flex items-center gap-1">
                        <i className={trendIcon[r.trend]}></i>
                        {r.trend === 'flat' ? t('rankings_no_change') : `${r.delta} ${r.trend === 'up' ? t('rankings_up_week') : t('rankings_down_week')}`}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 text-sm text-foreground-800">
                    {r.class} · <span className="text-foreground-600">{r.world}</span>
                  </div>
                  <div className="col-span-2 text-right font-heading font-semibold text-foreground-950">
                    Lv. {r.level}
                  </div>
                  <div className="col-span-2 text-right text-sm text-foreground-800">
                    {r.legion.toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-background-200 bg-background-100 p-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary-500 text-background-50 flex items-center justify-center">
                <i className="ri-line-chart-line"></i>
              </div>
              <div>
                <div className="font-heading font-semibold text-foreground-950">{t('rankings_your_card')}</div>
                <div className="text-xs text-foreground-600">
                  {t('rankings_track_hint')}
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-foreground-700">IGN</span>
                <input
                  placeholder={t('rankings_ign_placeholder')}
                  className="mt-1 w-full h-10 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-foreground-700">World</span>
                <select className="mt-1 w-full h-10 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 cursor-pointer">
                  {worlds.slice(1).map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </label>
              <button className="w-full h-10 rounded-md bg-secondary-500 hover:bg-secondary-600 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap">
                <i className="ri-add-line mr-1"></i>
                {t('rankings_track_btn')}
              </button>
            </div>
            <div className="mt-5 p-3 rounded-lg bg-background-50 border border-background-200 text-xs text-foreground-700 flex items-start gap-2">
              <i className="ri-shield-check-line text-accent-600 mt-0.5"></i>
              <span>
                {t('rankings_api_note')}
              </span>
            </div>
            <a
              href="/rankings/classes"
              className="mt-3 w-full h-10 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-bar-chart-grouped-line"></i>
              {t('tier_title_eyebrow')}
              <i className="ri-arrow-right-line"></i>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}