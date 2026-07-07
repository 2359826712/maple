import { useVersion } from '@/hooks/VersionContext';
import { useTranslation } from 'react-i18next';
import { heroStats, newsTicker } from '@/mocks/home';
import FloatingLeaves from '@/components/feature/FloatingLeaves';

export default function Hero() {
  const { versionInfo } = useVersion();
  const { t } = useTranslation();

  const filteredTicker = newsTicker.filter((item) => item.versions.includes(versionInfo.id));

  return (
    <section id="top" className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
      {/* === MAPLE WORLD BACKGROUND === */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('https://readdy.ai/api/search-image?query=Warm%20whimsical%20Maple%20World%20fantasy%20MMORPG%20landscape%20with%20a%20giant%20maple%20tree%20covered%20in%20fiery%20crimson%20autumn%20leaves%20overlooking%20lush%20rolling%20hills%2C%20cute%20mushroom%20shaped%20houses%20with%20round%20orange%20roofs%20and%20little%20windows%20nestled%20among%20the%20greenery%2C%20tiny%20adorable%20green%20slimes%20and%20orange%20mushroom%20monsters%20with%20cheerful%20expressions%20dotting%20the%20meadow%2C%20sparkling%20golden%20mesos%20coins%20floating%20in%20the%20air%2C%20soft%20dreamy%20bokeh%20light%20particles%2C%20painterly%20storybook%20illustration%20style%2C%20vibrant%20saturated%20warm%20orange%20amber%20gold%20tones%2C%20deep%20atmospheric%20depth%20with%20layers%20of%20misty%20distant%20forest%2C%20very%20wide%20cinematic%20composition%20with%20plenty%20of%20empty%20sky%20for%20text%20overlay%2C%20high%20fantasy%20aesthetic&width=1800&height=900&seq=maple-hero-world-v2&orientation=landscape')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      ></div>
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground-950/35 via-foreground-950/15 to-background-50"></div>

      {/* === FLOATING MAPLE LEAVES === */}
      <FloatingLeaves count={18} />

      <div className="relative w-full px-4 md:px-8 flex flex-col items-center text-center">
        {/* Version badge with maple leaf */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background-50/85 border border-primary-300/50 backdrop-blur mb-6 shadow-sm">
          <i className="ri-leaf-fill text-primary-500 text-sm leaf-sway"></i>
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-foreground-800 uppercase tracking-wider">
            {versionInfo.shortLabel} · {versionInfo.fullName} · {t('hero_badge')}
          </span>
          <i className="ri-leaf-fill text-primary-500 text-sm leaf-sway" style={{ animationDelay: '1.5s' }}></i>
        </div>

        <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-semibold text-background-50 max-w-4xl drop-shadow-lg">
          {t('hero_title_line1')}{' '}
          <span className="bg-gradient-to-r from-secondary-300 via-primary-300 to-accent-300 bg-clip-text text-transparent drop-shadow-md">
            {t('hero_title_maple_world')}
          </span>
          <br className="hidden md:block" />
          <span className="text-background-50/95">{t('hero_title_line2')}</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base md:text-lg text-background-50/85 drop-shadow">
          {t('hero_subtitle')}
        </p>

        {/* Search bar */}
        <div className="mt-8 w-full max-w-2xl">
          <form className="flex flex-col sm:flex-row gap-2 bg-background-50/95 border border-primary-200/40 backdrop-blur p-2 rounded-full shadow-md">
            <div className="flex items-center gap-2 flex-1 pl-3">
              <i className="ri-search-2-line text-foreground-500"></i>
              <input
                type="text"
                placeholder={t('hero_search_placeholder')}
                className="w-full h-10 bg-transparent text-sm text-foreground-900 placeholder:text-foreground-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-5 rounded-full bg-gradient-to-r from-primary-500 to-accent-600 hover:from-primary-600 hover:to-accent-700 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap shadow-sm"
            >
              {t('hero_search_button')}
            </button>
          </form>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-background-50/75">
            <span>{t('hero_search_try')}</span>
            {['Kanna funding', 'Kalos hard prep', 'Familiar tier list', 'Reboot mesos 20B'].map((chip) => (
              <button
                key={chip}
                className="px-2.5 py-1 rounded-full bg-background-50/20 backdrop-blur border border-background-50/25 hover:bg-background-50/35 hover:text-background-50 cursor-pointer whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Stats cards */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-4xl">
          {heroStats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-background-50/95 border border-primary-200/30 backdrop-blur p-4 md:p-5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                <i className={`${s.icon} text-primary-600 text-lg`}></i>
              </div>
              <div className="text-left">
                <div className="font-heading text-lg md:text-xl font-semibold text-foreground-950">
                  {s.value}
                </div>
                <div className="text-[11px] md:text-xs text-foreground-600">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === LIVE TICKER === */}
      <div className="relative mt-14 md:mt-16 border-y border-primary-200/20 bg-gradient-to-r from-background-100/95 via-background-50/95 to-background-100/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 md:px-8 py-3 overflow-hidden">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-600 text-background-50 dark:text-foreground-950 text-[11px] font-semibold whitespace-nowrap shadow-sm">
            <i className="ri-flashlight-line"></i>
            {t('hero_live_ticker')}
          </span>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee flex gap-10 whitespace-nowrap text-sm text-foreground-800">
              {[...filteredTicker, ...filteredTicker].map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                  <i className="ri-leaf-fill text-primary-500 text-[8px]"></i>
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}