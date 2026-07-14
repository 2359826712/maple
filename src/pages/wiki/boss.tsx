import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { bosses } from '@/mocks/bosses';
import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion } from '@/domain/regionModel';
import ShareButton from '@/components/feature/ShareButton';
import { usePageMetadata } from '@/hooks/usePageMetadata';

const rarityColors: Record<string, string> = {
  Common: 'bg-background-100 text-foreground-950',
  Rare: 'bg-green-100 text-green-800',
  Epic: 'bg-amber-100 text-amber-800',
  Legendary: 'bg-red-100 text-red-800',
};

export default function BossDetailPage() {
  const { t } = useTranslation();
  const { '*': legacyBossParam, bossName: localizedBossParam } = useParams<{ '*': string; bossName: string }>();
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeDifficulty, setActiveDifficulty] = useState(0);
  const { version } = useVersion();

  const bossParam = localizedBossParam || legacyBossParam;
  const bossName = bossParam ? decodeURIComponent(bossParam).replace(/_/g, ' ') : '';

  const boss = useMemo(
    () =>
      bosses.find(
        (b) =>
          isAvailableInVersion(b.regions, version) && (
            b.name.toLowerCase() === bossName.toLowerCase() ||
            b.nameZh === bossName
          ),
      ) || null,
    [bossName, version],
  );
  usePageMetadata(
    boss ? `${boss.name} Boss Guide` : 'MapleStory Boss Guides',
    boss ? `Mechanics, requirements, rewards, and ${boss.difficulty.join('/')} strategies for ${boss.name}.` : 'MapleStory boss mechanics, requirements, and rewards.',
    {
      image: boss?.image || undefined,
      imageAlt: boss ? `${boss.name} Boss Guide` : 'MapleStory Boss Guides',
      type: 'article',
    },
  );

  // No boss name provided — show Boss listing index
  if (!bossName) {
    return <BossListingIndex notifOpen={notifOpen} setNotifOpen={setNotifOpen} />;
  }

  // Boss name given but not found
  if (!boss) {
    return (
      <div className="min-h-screen bg-background-50 text-foreground-950">
        <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
        <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center">
            <i className="ri-skull-2-line mb-4 block text-5xl text-background-300"></i>
            <h1 className="font-serif text-2xl">
              {t('boss_not_found')}
            </h1>
            <p className="mt-2 text-sm text-foreground-600">
              {t('boss_not_found_desc', { name: bossName })}
            </p>
            <Link
              to="/wiki/boss"
              className="mt-4 inline-block text-sm text-primary-600 hover:underline"
            >
              {t('boss_view_all')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentDiff = boss.difficulty[activeDifficulty];
  const isPlanningOnly = boss.dataSource.startsWith('Planning only');

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
          {/* Breadcrumb */}
          <div className="mb-4 text-sm text-foreground-600">
            <Link to="/wiki/boss" className="text-primary-600 hover:underline">
              {t('boss_all_bosses')}
            </Link>
            <span className="mx-2">/</span>
            <Link to="/checklist" className="text-foreground-600 hover:text-primary-600">
              {t('boss_checklist')}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground-950">{boss.name}</span>
          </div>

          {/* Header */}
          <div className="mb-6 grid gap-6 lg:grid-cols-[160px_1fr_280px]">
            {/* Boss Image */}
            {boss.image && (
              <div className="hidden lg:flex items-start justify-center">
                <div className="w-40 h-40 rounded border border-background-300 bg-white p-2 overflow-hidden flex items-center justify-center">
                  <img
                    src={boss.image}
                    alt={boss.name}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              </div>
            )}
            <div>
              {boss.image && (
                <div className="lg:hidden mb-4 flex justify-center">
                  <div className="w-32 h-32 rounded border border-background-300 bg-white p-2 overflow-hidden flex items-center justify-center">
                    <img
                      src={boss.image}
                      alt={boss.name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
              <h1 className="font-serif text-3xl font-normal text-foreground-950">
                {boss.name}
              </h1>
              <div className="mt-3">
                <ShareButton title={`${boss.name} Boss Guide`} text={`Mechanics, requirements, and rewards for ${boss.name}.`} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {boss.difficulty.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setActiveDifficulty(i)}
                    className={`rounded px-3 py-1 text-sm font-semibold ${
                      activeDifficulty === i
                        ? 'bg-primary-600 text-white'
                        : 'border border-background-300 bg-white text-foreground-950 hover:bg-background-100'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div className="rounded border border-background-300 bg-white p-4">
              <div className="mb-3 border-b border-background-100 pb-2 text-sm font-semibold text-foreground-950">
                {t('boss_info')} ({currentDiff})
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-foreground-600">{t('boss_level')}</dt>
                  <dd className="font-semibold">{boss.level}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground-600">{t('boss_min_level')}</dt>
                  <dd className="font-semibold">Lv.{boss.minLevel}</dd>
                </div>
                {!isPlanningOnly && (
                  <div className="flex justify-between">
                    <dt className="text-foreground-600">{t('boss_recommended_bp')}</dt>
                    <dd className="font-semibold">{boss.recommendedBp.toLocaleString()}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-foreground-600">
                    {boss.weeklyLimit > 0 ? t('boss_weekly_limit') : t('boss_daily_limit')}
                  </dt>
                  <dd className="font-semibold">
                    {boss.weeklyLimit > 0 ? boss.weeklyLimit : boss.dailyLimit}
                  </dd>
                </div>
                {!isPlanningOnly && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-foreground-600">{t('boss_exp')}</dt>
                      <dd className="font-semibold">{boss.expReward.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground-600">{t('boss_mesos')}</dt>
                      <dd className="font-semibold">{boss.mesoReward.toLocaleString()}</dd>
                    </div>
                  </>
                )}
              </dl>
              <div className="mt-3 flex items-center gap-2 border-t border-background-100 pt-2 text-[11px] text-foreground-600">
                <span className="flex items-center gap-0.5">
                  <i className="ri-database-2-line text-[10px]"></i>
                  {boss.dataSource}
                </span>
                <span className="text-foreground-400">·</span>
                <span className="flex items-center gap-0.5">
                  <i className="ri-time-line text-[10px] text-foreground-600"></i>
                  {t('boss_data_last_checked', 'Last checked')} {boss.lastVerified}
                </span>
                <span className="text-foreground-400">·</span>
                <a
                  href={`mailto:maplehub@proton.me?subject=${encodeURIComponent(`Boss data error: ${boss.name}`)}`}
                  className="flex items-center gap-0.5 text-primary-600 hover:underline"
                >
                  <i className="ri-error-warning-line text-[10px]"></i>
                  {t('boss_data_report', 'Report error')}
                </a>
              </div>
            </div>
          </div>

          {isPlanningOnly && (
            <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950">
              <div className="flex items-start gap-3">
                <i className="ri-information-line mt-0.5 text-xl text-amber-700" aria-hidden="true"></i>
                <div>
                  <h2 className="font-semibold">Verified details are not available yet</h2>
                  <p className="mt-1 text-sm leading-6">
                    MPStorys is showing entry and reset information only. Rewards, battle-power targets, mechanics, and strategies stay hidden until a trustworthy GMS source is connected.
                  </p>
                  {boss.sourceUrl && (
                    <a
                      href={boss.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900"
                    >
                      Open the official boss guide
                      <i className="ri-external-link-line" aria-hidden="true"></i>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Phases */}
          {boss.phases.length > 0 && <div className="mb-8">
            <h2 className="mb-4 border-b border-background-300 pb-2 font-serif text-xl font-normal">
              {t('boss_phases')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {boss.phases.map((phase, i) => (
                <div
                  key={i}
                  className="rounded border border-background-300 bg-white p-4"
                >
                  <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-foreground-950">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                      {i + 1}
                    </span>
                    {phase.name}
                  </h3>
                  <ul className="space-y-1.5 text-sm text-foreground-600">
                    {phase.mechanics.map((m, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <i className="ri-alert-line mt-0.5 text-accent-500"></i>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>}

          {/* Tips */}
          {boss.tips.length > 0 && <div className="mb-8">
            <h2 className="mb-4 border-b border-background-300 pb-2 font-serif text-xl font-normal">
              {t('boss_strategy')}
            </h2>
            <div className="space-y-2">
              {boss.tips.map((tip, i) => (
                <div
                  key={i}
                  className="rounded border-l-4 border-primary-600 bg-primary-50 px-4 py-2 text-sm text-foreground-950"
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>}

          {/* Drops */}
          {boss.drops.length > 0 && <div className="mb-8">
            <h2 className="mb-4 border-b border-background-300 pb-2 font-serif text-xl font-normal">
              {t('boss_drops')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {boss.drops.map((drop, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded border border-background-300 bg-white p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-background-50">
                    <i className="ri-gift-2-line text-primary-600"></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground-950">{drop.name}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${rarityColors[drop.rarity] || ''}`}
                      >
                        {drop.rarity}
                      </span>
                    </div>
                    <div className="text-xs text-foreground-600">{drop.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {/* Related bosses */}
          <div className="border-t border-background-100 pt-6">
            <h2 className="mb-4 font-serif text-lg font-normal text-foreground-950">
              {t('boss_related')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {bosses
                .filter((b) => b.id !== boss.id)
                .slice(0, 8)
                .map((b) => (
                  <Link
                    key={b.id}
                    to={`/wiki/boss/${encodeURIComponent(b.name)}`}
                    className="rounded border border-background-300 bg-white px-3 py-1.5 text-sm text-primary-600 hover:bg-background-100"
                  >
                    {b.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Boss Listing Index ──────────────────────────────────────

type BossType = 'daily' | 'weekly';

function getBossType(b: typeof bosses[number]): BossType {
  return b.weeklyLimit > 0 ? 'weekly' : 'daily';
}

function BossListingIndex({
  notifOpen,
  setNotifOpen,
}: {
  notifOpen: boolean;
  setNotifOpen: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = bosses.filter((boss) => isAvailableInVersion(boss.regions, version));
    if (filter !== 'all') {
      list = list.filter((b) => getBossType(b) === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.nameZh.includes(q),
      );
    }
    return list;
  }, [filter, search, version]);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary-600">
              {t('boss_index_subtitle')}
            </div>
            <h1 className="mt-1 font-serif text-2xl md:text-3xl font-normal text-foreground-950">
              {t('boss_index_title')}
            </h1>
            <p className="mt-1 text-sm text-foreground-600">
              {t('boss_index_desc')}
            </p>
          </div>

          {/* Filter + Search */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {(['all', 'daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded px-3 py-1.5 text-sm ${
                    filter === f
                      ? 'bg-primary-600 text-white'
                      : 'border border-background-300 bg-white text-foreground-950 hover:bg-background-100'
                  }`}
                >
                  {f === 'all'
                    ? t('boss_filter_all')
                    : f === 'daily'
                    ? t('boss_filter_daily')
                    : t('boss_filter_weekly')}
                </button>
              ))}
            </div>
            <div className="flex h-9 items-center border border-background-300 bg-white sm:w-64">
              <i className="ri-search-line px-2 text-foreground-600"></i>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('boss_search_placeholder')}
                className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
              />
            </div>
          </div>

          {/* Boss cards grid */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-foreground-600">
              {t('boss_no_results')}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((b) => (
                <Link
                  key={b.id}
                  to={`/wiki/boss/${encodeURIComponent(b.name)}`}
                  className="group rounded border border-background-300 bg-white transition-colors hover:border-primary-600 hover:bg-primary-50 overflow-hidden"
                >
                  {/* Boss image */}
                  {b.image && (
                    <div className="flex h-32 items-center justify-center bg-background-50 border-b border-background-100 overflow-hidden">
                      <img
                        src={b.image}
                        alt={b.name}
                        className="h-full w-full object-contain p-2"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground-950 group-hover:text-primary-600 transition-colors">
                          {b.name}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${
                          b.weeklyLimit > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {b.weeklyLimit > 0 ? t('boss_card_weekly') : t('boss_card_daily')}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {b.difficulty.map((d) => (
                        <span
                          key={d}
                          className="rounded bg-background-100 px-2 py-0.5 text-[11px] font-medium text-foreground-600"
                        >
                          {d}
                        </span>
                      ))}
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-foreground-600">
                      <div className="flex justify-between">
                        <dt>{t('boss_card_level')}</dt>
                        <dd className="font-semibold text-foreground-950">{b.level}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>{t('boss_card_min')}</dt>
                        <dd className="font-semibold text-foreground-950">Lv.{b.minLevel}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>BP</dt>
                        <dd className="font-semibold text-foreground-950">{b.recommendedBp > 0 ? b.recommendedBp.toLocaleString() : 'Pending'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>{t('boss_card_mesos')}</dt>
                        <dd className="font-semibold text-foreground-950">{b.mesoReward > 0 ? (b.mesoReward >= 1_000_000 ? `${(b.mesoReward / 1_000_000).toFixed(0)}M` : b.mesoReward.toLocaleString()) : 'Pending'}</dd>
                      </div>
                    </dl>

                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-foreground-600">
                      <span className="flex items-center gap-0.5">
                        <i className="ri-database-2-line text-[9px]"></i>
                        {b.dataSource}
                      </span>
                      <span className="text-foreground-400">·</span>
                      <span>{b.lastVerified}</span>
                    </div>

                    <div className="mt-3 flex items-center text-xs text-primary-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('boss_view_guide')}
                      <i className="ri-arrow-right-s-line ml-0.5"></i>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
