import { useTranslation } from 'react-i18next';
import { communityLinks } from '@/constants/communityLinks';

const groups = [
  {
    titleKey: 'footer_group_explore',
    links: [
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
      { nameKey: 'footer_familiar_planner', href: '/mapler-house' },
      { nameKey: 'footer_mapler_house', href: '/mapler-house' },
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
  const { t } = useTranslation();

  return (
    <footer className="bg-gradient-to-b from-accent-950 to-foreground-950 border-t border-accent-800/30">
      <div className="w-full px-4 md:px-8 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center">
                <i className="ri-leaf-fill text-background-50 text-2xl leaf-sway"></i>
              </div>
              <div>
                <div className="font-heading text-xl font-semibold text-background-50">
                  MapleHub
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
                { icon: 'ri-discord-fill', href: communityLinks.discord },
                { icon: 'ri-reddit-line', href: communityLinks.reddit },
                { icon: 'ri-twitter-x-line', href: communityLinks.x },
                { icon: 'ri-twitch-fill', href: communityLinks.twitch },
                { icon: 'ri-youtube-fill', href: communityLinks.youtube },
              ].map((item) => (
                <a
                  key={item.icon}
                  href={item.href}
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
                      href={l.href}
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
      </div>
    </footer>
  );
}
