import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { communityLinks } from '@/constants/communityLinks';
import { SITE_NAME } from '@/constants/site';
import { localizeHref } from '@/i18n/languageRouting';
import { useVersion } from '@/hooks/VersionContext';
import { getSeriesProduct } from '@/pages/series/catalog';
import { getSeriesIdFromSearch, scopeModuleHref } from '@/pages/series/scope';

const PRODUCT_HUNT_URL = 'https://www.producthunt.com/products/mpstorys?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-mpstorys';
const PRODUCT_HUNT_BADGE_URL = 'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1197969&theme=light&t=1784682160254';
const PRODUCT_HUNT_BADGE_ALT = 'MPStorys - MapleStory tools, MapleStory guides, MapleStory calculator | Product Hunt';
const AIBESTTOP_URL = 'https://aibesttop.com';
const OPENHUNTS_URL = 'https://openhunts.com';
const OPENHUNTS_BADGE_URL = 'https://cdn.openhunts.com/badges/club.webp';
const AIDIRS_URL = 'https://aidirs.best/item/mp-storys';
const AIDIRS_BADGE_URL = 'https://aidirs.best/light.svg';
const AI_AGENTS_DIRECTORY_URL = 'https://aiagentsdirectory.com';
const AI_AGENTS_DIRECTORY_BADGE_URL = 'https://aiagentsdirectory.com/featured-badge.svg?v=2024';
const AI_TOOL_FAME_URL = 'https://aitoolfame.com/item/mpstorys';
const AI_TOOL_FAME_BADGE_URL = 'https://aitoolfame.com/badge-light.svg';
const ARTIFICIN_URL = 'https://artificin.com?utm_source=badge&utm_medium=referral&utm_campaign=featured_badge';
const ARTIFICIN_BADGE_URL = 'https://artificin.com/badges/Artificin-badge.png';
const BESTSKY_TOOLS_URL = 'https://bestsky.tools?utm_source=badge';
const BESTSKY_TOOLS_BADGE_URL = 'https://assets.bestsky.tools/badges/featured-light.svg';
const DANG_URL = 'https://dang.ai';
const DANG_BADGE_URL = 'https://assets.dang.ai/badges/dang-verified-dark.png';
const DEEP_LAUNCH_URL = 'https://deeplaunch.io';
const DEEP_LAUNCH_BADGE_URL = 'https://deeplaunch.io/badge/badge_light.svg';
const DOFOLLOW_TOOLS_URL = 'https://dofollow.tools';
const DOFOLLOW_TOOLS_BADGE_URL = 'https://dofollow.tools/badge/badge_light.svg';
const DOMAINRANK_URL = 'https://domainrank.app';
const DOMAINRANK_BADGE_URL = 'https://domainrank.app/api/badge/mpstorys.com?style=small';
const FINDLY_URL = 'https://findly.tools/mpstorys?utm_source=mpstorys';
const FINDLY_BADGE_URL = 'https://findly.tools/badges/findly-tools-badge-light.svg';
const LOVABLE_APP_URL = 'https://lovableapp.org';
const LOVABLE_APP_BADGE_URL = 'https://lovableapp.org/lovable-app-badge.svg';
const MOSSAI_TOOLS_URL = 'https://mossai.org';
const SHOW_ME_BEST_AI_URL = 'https://showmebest.ai';
const SHOW_ME_BEST_AI_BADGE_URL = 'https://showmebest.ai/badge/feature-badge-white.webp';
const SAAS_FAME_URL = 'https://saasfame.com/item/mpstorys';
const SAAS_FAME_BADGE_URL = 'https://saasfame.com/badge-light.svg';
const STARTUP_FAST_URL = 'https://startupfa.st';
const STARTUP_FAST_BADGE_URL = 'https://startupfa.st/images/badges/powered-by-light.svg';
const YO_DIRECTORY_URL = 'https://yo.directory';
const SUBMIT_AI_TOOLS_URL = 'https://submitaitools.org';
const SUBMIT_AI_TOOLS_BADGE_URL = 'https://submitaitools.org/static_submitaitools/images/submitaitools.png';
const SUBMITO_URL = 'https://submito.net';
const SUBMITO_BADGE_URL = 'https://submito.net/badge/listed-light.svg';
const TOOL_FAME_URL = 'https://toolfame.com/item/mpstorys';
const TOOL_FAME_BADGE_URL = 'https://toolfame.com/badge-light.svg';
const TURBO0_URL = 'https://turbo0.com/item/mpstorys';
const TURBO0_BADGE_URL = 'https://img.turbo0.com/badge-listed-light.svg';
const WIRED_BUSINESS_URL = 'https://wired.business';
const WIRED_BUSINESS_BADGE_URL = 'https://wired.business/badge0-light.svg';
const VERIFIED_DR_URL = 'https://verifieddr.com/website/mpstorys-com';
const VERIFIED_DR_BADGE_URL = 'https://verifieddr.com/badge/mpstorys-com.svg?metric=truedr';
const BUILDWAY_URL = 'https://www.buildway.cc';
const BUILDWAY_LOGO_URL = 'https://www.buildway.cc/logo.png';
const FROG_DR_URL = 'https://frogdr.com/mpstorys.com?utm_source=mpstorys.com';
const FROG_DR_BADGE_URL = 'https://frogdr.com/mpstorys.com/badge-white.svg';
const FAZIER_URL = 'https://fazier.com/launches/mpstorys.com';
const FAZIER_BADGE_URL = 'https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=light';

const groups = [
  {
    titleKey: 'footer_group_explore',
    links: [
      { nameKey: 'footer_series', href: '/' },
      { nameKey: 'footer_latest_news', href: '/news' },
      { nameKey: 'footer_guides_library', href: '/guides' },
      { nameKey: 'footer_events_calendar', href: '/events' },
      { nameKey: 'footer_update_videos', href: '/community' },
      { nameKey: 'footer_wiki', href: '/wiki' },
    ],
  },
  {
    titleKey: 'footer_group_tools',
    links: [
      { nameKey: 'footer_character_lookup', href: '/mapler-house#char-lookup' },
      { nameKey: 'footer_star_force_sim', href: '/mapler-house#enhance' },
      { nameKey: 'footer_cube_simulator', href: '/mapler-house#enhance' },
      { nameKey: 'footer_mapler_house', href: '/mapler-house' },
      { nameKey: 'footer_shop', href: '/shop' },
    ],
  },
  {
    titleKey: 'footer_group_community',
    links: [
      { nameKey: 'footer_forums', href: '/community' },
      { nameKey: 'footer_discord', href: communityLinks.discord },
      { nameKey: 'footer_reddit', href: communityLinks.reddit },
      { nameKey: 'footer_creators', href: '/community' },
      { nameKey: 'footer_party_finder', href: '/community' },
    ],
  },
  {
    titleKey: 'footer_group_about',
    links: [
      { nameKey: 'footer_about_maplehub', href: '/' },
      { nameKey: 'footer_content_policy', href: communityLinks.official },
      { nameKey: 'footer_careers', href: communityLinks.official },
      { nameKey: 'footer_contact', href: communityLinks.contact },
      { nameKey: 'footer_press_kit', href: communityLinks.official },
    ],
  },
];

export default function Footer() {
  const { t, i18n } = useTranslation();
  const { version } = useVersion();
  const { search } = useLocation();
  const activeSeriesId = getSeriesProduct(getSeriesIdFromSearch(search))?.id;
  const featuredListingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listings = featuredListingsRef.current;

    if (!listings) {
      return undefined;
    }

    const originalItems = Array.from(listings.children) as HTMLElement[];
    const clonedItems = originalItems.map((item) => {
      const clone = item.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('data-marquee-clone', 'true');

      if (clone instanceof HTMLAnchorElement) clone.tabIndex = -1;
      clone.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => { link.tabIndex = -1; });
      listings.appendChild(clone);
      return clone;
    });

    const firstOriginal = originalItems[0];
    const firstClone = clonedItems[0];
    const measuredCycleWidth = firstOriginal && firstClone
      ? firstClone.offsetLeft - firstOriginal.offsetLeft
      : 0;
    const cycleWidth = measuredCycleWidth > 0 ? measuredCycleWidth : listings.scrollWidth / 2;

    if (cycleWidth > 0) {
      listings.style.setProperty('--featured-listings-distance', `${cycleWidth}px`);
      listings.style.setProperty('--featured-listings-duration', `${cycleWidth / 45}s`);
      listings.setAttribute('data-marquee-ready', 'true');
    }

    return () => {
      listings.removeAttribute('data-marquee-ready');
      listings.style.removeProperty('--featured-listings-distance');
      listings.style.removeProperty('--featured-listings-duration');
      clonedItems.forEach((item) => item.remove());
    };
  }, []);

  return (
    <footer className="bg-gradient-to-b from-accent-950 to-foreground-950 dark:to-[#120e0b] border-t border-accent-800/30">
      <div className="w-full px-4 md:px-8 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                <i className="ri-leaf-fill text-background-50 text-2xl leaf-sway"></i>
              </div>
              <div>
                <div className="font-heading text-xl font-semibold text-background-50">
                  {SITE_NAME}
                </div>
                <div className="text-[11px] text-accent-300 tracking-wide">
                  {t('footer_tagline')}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-accent-200/70 max-w-sm leading-relaxed">
              {t('footer_desc')}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { icon: 'ri-discord-fill', href: communityLinks.discord, label: 'Discord' },
                { icon: 'ri-reddit-line', href: communityLinks.reddit, label: 'Reddit' },
                { icon: 'ri-twitter-x-line', href: communityLinks.x, label: 'X' },
                { icon: 'ri-twitch-fill', href: communityLinks.twitch, label: 'Twitch' },
                { icon: 'ri-youtube-fill', href: communityLinks.youtube, label: 'YouTube' },
              ].map((item) => (
                <a
                  key={item.icon}
                  href={item.href}
                  aria-label={item.label}
                  target="_blank"
                  rel="nofollow noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-accent-700/30 bg-accent-900/40 text-accent-200/70 transition-colors hover:border-primary-400 hover:text-primary-400"
                >
                  <i className={item.icon}></i>
                </a>
              ))}
            </div>
          </div>

          {groups.map((g) => (
            <div key={g.titleKey}>
              <div className="font-heading font-semibold text-background-50/90 mb-3 flex items-center gap-1.5">
                <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
                {t(g.titleKey)}
              </div>
              <ul className="space-y-2">
                {g.links.map((l) => {
                  const isExternal = l.href.startsWith('http');

                  return (
                    <li key={l.nameKey}>
                    <a
                      href={isExternal ? l.href : localizeHref(scopeModuleHref(activeSeriesId, l.href), i18n.language, version)}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noreferrer' : undefined}
                      className="inline-flex min-h-11 items-center text-sm text-accent-200/70 transition-colors hover:text-primary-400"
                    >
                      {t(l.nameKey)}
                    </a>
                  </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-accent-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-accent-200/50">
          <p className="flex items-center gap-1.5">
            <i className="ri-leaf-fill text-primary-600/70 text-xs"></i>
            {t('footer_copyright')}
          </p>
          <div className="flex flex-wrap gap-4">
            <a href={communityLinks.terms} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center whitespace-nowrap transition-colors hover:text-primary-400">{t('footer_terms')}</a>
            <a href={communityLinks.privacy} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center whitespace-nowrap transition-colors hover:text-primary-400">{t('footer_privacy')}</a>
            <a href={communityLinks.contact} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center whitespace-nowrap transition-colors hover:text-primary-400">{t('footer_contact')}</a>
          </div>
        </div>

        <div
          ref={featuredListingsRef}
          className="featured-listings-marquee mt-5 flex flex-nowrap items-center gap-2 overflow-hidden pb-1"
          aria-label="Featured listings"
          data-auto-scroll="true"
        >
          <a
            href={AIBESTTOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys on AIBestTop"
            className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded border border-accent-200/25 bg-background-50 px-2.5 text-[10px] font-medium text-foreground-950 transition-opacity hover:opacity-90"
          >
            {t('footer_listed_aibesttop')}
          </a>
          <a
            href={OPENHUNTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="OpenHunts Club"
            aria-label="MPStorys on OpenHunts"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="OpenHunts Club Member"
              width="111"
              height="24"
              src={OPENHUNTS_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={AIDIRS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys on Aidirs"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="MPStorys - MapleStory news and guide hub | Aidirs"
              width="86"
              height="24"
              src={AIDIRS_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={AI_AGENTS_DIRECTORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Discover AI Agents Directory"
            aria-label="MPStorys on AI Agents Directory"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on AI Agents Directory"
              width="96"
              height="24"
              src={AI_AGENTS_DIRECTORY_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={PRODUCT_HUNT_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys on Product Hunt"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt={PRODUCT_HUNT_BADGE_ALT}
              width="111"
              height="24"
              src={PRODUCT_HUNT_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={AI_TOOL_FAME_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys on AI Tool Fame"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on aitoolfame.com"
              width="84"
              height="24"
              src={AI_TOOL_FAME_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={ARTIFICIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys featured on Artificin"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on Artificin"
              width="84"
              height="24"
              src={ARTIFICIN_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={BESTSKY_TOOLS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys featured on BestskyTools"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on BestskyTools"
              width="74"
              height="24"
              src={BESTSKY_TOOLS_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={DANG_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys verified on DANG"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Verified on DANG!"
              width="66"
              height="24"
              src={DANG_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={DEEP_LAUNCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys featured on DeepLaunch.io"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on DeepLaunch.io"
              width="89"
              height="24"
              src={DEEP_LAUNCH_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={DOFOLLOW_TOOLS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys featured on Dofollow.Tools"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on Dofollow.Tools"
              width="89"
              height="24"
              src={DOFOLLOW_TOOLS_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={DOMAINRANK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys domain rating on DomainRank"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="mpstorys.com Domain Rating"
              width="149"
              height="24"
              src={DOMAINRANK_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={FINDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys featured on Findly.tools"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on Findly.tools"
              width="76"
              height="24"
              src={FINDLY_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={LOVABLE_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys on Lovable App"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Lovable App Badge"
              width="80"
              height="24"
              src={LOVABLE_APP_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={MOSSAI_TOOLS_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="MossAI Tools"
            aria-label="MPStorys on MossAI Tools"
            className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded border border-accent-200/25 bg-background-50 px-2.5 text-[10px] font-semibold text-foreground-950 transition-opacity hover:opacity-90"
          >
            MossAI Tools
          </a>
          <a
            href={SHOW_ME_BEST_AI_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys featured on ShowMeBestAI"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on ShowMeBestAI"
              width="96"
              height="24"
              src={SHOW_ME_BEST_AI_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={SAAS_FAME_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys featured on SaaSFame"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on saasfame.com"
              width="76"
              height="24"
              src={SAAS_FAME_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={STARTUP_FAST_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Powered by Startup Fast"
            aria-label="MPStorys powered by Startup Fast"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Powered by Startup Fast"
              width="57"
              height="24"
              src={STARTUP_FAST_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={YO_DIRECTORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Featured on Yo.directory"
            aria-label="MPStorys featured on Yo.directory"
            className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded border border-accent-200/25 bg-background-50 px-2.5 text-[10px] font-semibold text-foreground-950 transition-opacity hover:opacity-90"
          >
            Featured on Yo.directory
          </a>
          <a
            href={SUBMIT_AI_TOOLS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys on Submit AI Tools"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Submit AI Tools"
              width="72"
              height="24"
              src={SUBMIT_AI_TOOLS_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none rounded object-contain"
            />
          </a>
          <a
            href={SUBMITO_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Listed on Submito"
            aria-label="MPStorys listed on Submito"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Listed on Submito"
              width="84"
              height="24"
              src={SUBMITO_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={TOOL_FAME_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys featured on ToolFame"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on toolfame.com"
              width="71"
              height="24"
              src={TOOL_FAME_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={TURBO0_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys listed on Turbo0"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Listed on Turbo0"
              width="72"
              height="24"
              src={TURBO0_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={WIRED_BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys featured on Wired Business"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Featured on Wired Business"
              width="89"
              height="24"
              src={WIRED_BUSINESS_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={VERIFIED_DR_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Verified domain rating for MPStorys"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Verified DR - Verified Domain Rating for mpstorys.com"
              width="85"
              height="24"
              src={VERIFIED_DR_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={BUILDWAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys listed on BuildWay"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Listed on BuildWay"
              width="24"
              height="24"
              src={BUILDWAY_LOGO_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-6 max-w-none rounded object-contain"
            />
          </a>
          <a
            href={FROG_DR_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Monitor MPStorys domain rating with FrogDR"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Monitor your Domain Rating with FrogDR"
              width="111"
              height="24"
              src={FROG_DR_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
          <a
            href={FAZIER_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys featured on Fazier"
            className="inline-flex shrink-0 rounded transition-opacity hover:opacity-90"
          >
            <img
              alt="Fazier badge"
              width="111"
              height="24"
              src={FAZIER_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-6 w-auto max-w-none object-contain"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
