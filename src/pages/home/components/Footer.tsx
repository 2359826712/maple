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
                  className="w-10 h-10 rounded-full bg-accent-900/40 border border-accent-700/30 hover:border-primary-400 hover:text-primary-400 text-accent-200/60 flex items-center justify-center cursor-pointer transition-colors"
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
                      className="text-sm text-accent-200/60 hover:text-primary-400 cursor-pointer transition-colors"
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
            <a href={communityLinks.terms} target="_blank" rel="noreferrer" className="hover:text-primary-400 cursor-pointer whitespace-nowrap transition-colors">{t('footer_terms')}</a>
            <a href={communityLinks.privacy} target="_blank" rel="noreferrer" className="hover:text-primary-400 cursor-pointer whitespace-nowrap transition-colors">{t('footer_privacy')}</a>
            <a href={communityLinks.contact} target="_blank" rel="noreferrer" className="hover:text-primary-400 cursor-pointer whitespace-nowrap transition-colors">{t('footer_contact')}</a>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3" aria-label="Featured listings">
          <a
            href={PRODUCT_HUNT_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MPStorys on Product Hunt"
            className="inline-flex max-w-full rounded-md transition-opacity hover:opacity-90"
          >
            <img
              alt={PRODUCT_HUNT_BADGE_ALT}
              width="250"
              height="54"
              src={PRODUCT_HUNT_BADGE_URL}
              loading="lazy"
              decoding="async"
              className="h-[54px] max-w-full object-contain"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
