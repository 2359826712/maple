import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const destinations = [
  { href: '/', labelKey: 'dashboard_title', icon: 'ri-home-5-line' },
  { href: '/checklist', labelKey: 'nav_checklist', icon: 'ri-checkbox-circle-line' },
  { href: '/search', labelKey: 'nav_search_button', icon: 'ri-search-2-line' },
  { href: '/mapler-house', labelKey: 'nav_tools', icon: 'ri-tools-line' },
] as const;

function isDestinationActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobilePrimaryNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  if (pathname.startsWith('/auth/')) return null;

  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <nav
        aria-label={t('mobile_primary_navigation')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-background-300 bg-background-50/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 px-2 py-1.5">
          {destinations.map((destination) => {
            const active = isDestinationActive(pathname, destination.href);
            return (
              <NavLink
                key={destination.href}
                to={destination.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-semibold transition-colors ${
                  active
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-foreground-600 hover:bg-background-100 hover:text-primary-700'
                }`}
              >
                <i className={`${destination.icon} text-xl`} aria-hidden="true" />
                <span className="max-w-full truncate">{t(destination.labelKey)}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}

