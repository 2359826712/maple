import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useVersion, type GameVersion } from '@/hooks/VersionContext';
import { getSiteSearchResults, getPopularSearchTerms } from '@/services/siteSearch';
import SearchResultList from '@/components/search/SearchResultList';
import UniversalSearchDialog from '@/components/search/UniversalSearchDialog';
import { AUTO_LOGIN_ENABLED_KEY, clearAuthSession, useAuthSession } from '@/hooks/useAuthSession';
import { mapleSqlApi } from '@/services/mapleSqlApi';
import { clearAccountDataCache, collectAccountData } from '@/services/accountDataSync';
import { SITE_NAME, SITE_TAGLINE } from '@/constants/site';
import { localizeHref, normalizeLanguage, stripRouteSuffixes, withRouteSuffixes } from '@/i18n/languageRouting';
import { getLocalizedVersionPresentation } from '@/domain/versionPresentation';
import { prefetchRouteForPath } from '@/router/config';
import { getSeriesProduct, seriesProducts } from '@/pages/series/catalog';
import {
  getSeriesModuleHref,
  getSeriesRouteState,
  isSeriesModuleAvailable,
  scopeModuleHref,
} from '@/pages/series/scope';
import { getSeriesVersions, getSeriesVersionShortLabel } from '@/pages/series/versionConfig';

const navLinkKeys = [
  { key: 'nav_news', href: '/news' },
  { key: 'nav_upcoming', href: '/upcoming' },
  { key: 'nav_guides', href: '/guides' },
  { key: 'nav_events', href: '/events' },
  { key: 'nav_tools', href: '/mapler-house' },
  { key: 'nav_checklist', href: '/checklist' },
  { key: 'nav_wiki', href: '/wiki' },
  { key: 'nav_rankings', href: '/rankings' },
  { key: 'nav_shop', href: '/shop' },
  { key: 'nav_community', href: '/community' },
  { key: 'nav_feedback', href: '/feedback' },
];

const TOOL_FAVORITES_KEY = 'maplehub-tool-favorites';

const defaultToolSections = [
  { value: 'char-lookup', labelKey: 'mh_section_char_lookup', icon: 'ri-user-search-line', groupLabelKey: 'mh_tool_group_character' },
  { value: 'boss-plan', labelKey: 'mh_section_boss_plan', icon: 'ri-shield-flash-line', groupLabelKey: 'mh_tool_group_progression' },
  { value: 'growth', labelKey: 'mh_section_growth', icon: 'ri-line-chart-line', groupLabelKey: 'mh_tool_group_progression' },
  { value: 'hexa', labelKey: 'mh_section_hexa', icon: 'ri-hexagon-line', groupLabelKey: 'mh_tool_group_build' },
  { value: 'links', labelKey: 'mh_section_links', icon: 'ri-links-line', groupLabelKey: 'mh_tool_group_build' },
  { value: 'legion', labelKey: 'mh_section_legion', icon: 'ri-layout-grid-line', groupLabelKey: 'mh_tool_group_build' },
  { value: 'enhance', labelKey: 'mh_section_enhance', icon: 'ri-hammer-line', groupLabelKey: 'mh_tool_group_build' },
  { value: 'stats', labelKey: 'mh_section_stats', icon: 'ri-bar-chart-grouped-line', groupLabelKey: 'mh_tool_group_meta' },
  { value: 'fashion', labelKey: 'mh_section_fashion', icon: 'ri-t-shirt-line', groupLabelKey: 'mh_tool_group_cosmetic' },
];

type ToolMenuOption = {
  value: string;
  label: string;
  icon: string;
  favorite?: boolean;
  externalHref?: string;
  groupLabel?: string;
};

interface NavbarProps {
  onOpenNotifications: () => void;
  unread: number;
  guideMenu?: {
    value: string;
    options: Array<{ value: string; label: string; icon: string }>;
    onSelect: (value: string) => void;
  };
  toolMenu?: {
    label: string;
    value: string;
    allLabel: string;
    favoritesLabel: string;
    emptyFavoritesLabel: string;
    options: ToolMenuOption[];
    favoriteOptions: ToolMenuOption[];
    onSelect: (value: string) => void;
    onToggleFavorite: (value: string) => void;
  };
}

export default function Navbar({ onOpenNotifications, unread, guideMenu, toolMenu }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const { version, versionInfo, setVersion } = useVersion();
  const navigate = useNavigate();
  const location = useLocation();
  const routePathname = stripRouteSuffixes(location.pathname);
  const { isSessionResolved, isSignedIn, isAdmin, displayName, session } = useAuthSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [versionMenuOpen, setVersionMenuOpen] = useState(false);
  const [seriesMenuOpen, setSeriesMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [guideMenuOpen, setGuideMenuOpen] = useState(false);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(unread);
  const [toolMenuTab, setToolMenuTab] = useState<'all' | 'favorites'>('all');
  const [defaultToolFavorites, setDefaultToolFavorites] = useState<string[]>(() => {
    try {
      const value = window.localStorage.getItem(TOOL_FAVORITES_KEY);
      if (!value) return [];
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  });
  const searchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const versionRef = useRef<HTMLDivElement | null>(null);
  const seriesRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);
  const guideMenuRef = useRef<HTMLDivElement | null>(null);
  const toolMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileToolMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const guideMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let frame = 0;
    const updateScrolled = () => {
      frame = 0;
      const nextScrolled = window.scrollY > 30;
      setScrolled((current) => current === nextScrolled ? current : nextScrolled);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrolled);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrolled();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(false);
        setMobileSearchOpen(false);
        setMenuOpen(false);
        setPaletteOpen((current) => !current);
      }
    };
    document.addEventListener('keydown', onShortcut);
    return () => document.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const searchTarget = e.target as Node;
      const insideDesktopSearch = searchRef.current?.contains(searchTarget);
      const insideMobileSearch = mobileSearchRef.current?.contains(searchTarget)
        || mobileSearchButtonRef.current?.contains(searchTarget);
      if (!insideDesktopSearch) {
        setSearchOpen(false);
      }
      if (!insideMobileSearch) setMobileSearchOpen(false);
      if (versionRef.current && !versionRef.current.contains(e.target as Node)) {
        setVersionMenuOpen(false);
      }
      if (seriesRef.current && !seriesRef.current.contains(e.target as Node)) {
        setSeriesMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      const target = e.target as Node;
      const insideGuideMenu = guideMenuRef.current?.contains(target);
      const insideDesktopTools = toolMenuRef.current?.contains(target);
      const insideMobileTools = mobileToolMenuRef.current?.contains(target);

      if (!insideGuideMenu) {
        setGuideMenuOpen(false);
      }
      if (!insideDesktopTools && !insideMobileTools) {
        setToolMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => setNotificationCount(unread), [unread]);

  useEffect(() => {
    if (!isSignedIn) {
      setNotificationCount(0);
      return undefined;
    }

    const refreshCount = () => {
      void mapleSqlApi.notifications
        .list(true)
        .then((items) => setNotificationCount(items.length))
        .catch(() => undefined);
    };

    refreshCount();
    window.addEventListener('focus', refreshCount);
    window.addEventListener('maplehub-notifications-changed', refreshCount);
    return () => {
      window.removeEventListener('focus', refreshCount);
      window.removeEventListener('maplehub-notifications-changed', refreshCount);
    };
  }, [isSignedIn]);

  useEffect(() => () => {
    if (guideMenuCloseTimer.current) clearTimeout(guideMenuCloseTimer.current);
    if (toolMenuCloseTimer.current) clearTimeout(toolMenuCloseTimer.current);
  }, []);

  useEffect(() => {
    if (!mobileSearchOpen) return undefined;
    const frame = window.requestAnimationFrame(() => mobileSearchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!toolMenu) {
      try {
        window.localStorage.setItem(TOOL_FAVORITES_KEY, JSON.stringify(defaultToolFavorites));
      } catch {
        // Storage can be blocked or full; favorites still work for this session.
      }
    }
  }, [defaultToolFavorites, toolMenu]);

  const searchResults = useMemo(
    () => getSiteSearchResults(query, i18n.language, versionInfo.id).slice(0, 5),
    [i18n.language, query, versionInfo.id],
  );
  const popularSearches = useMemo(
    () => getPopularSearchTerms(i18n.language, versionInfo.id, 5),
    [i18n.language, versionInfo.id],
  );

  const handleSignOut = () => {
    const accessToken = session?.accessToken;
    const accountData = collectAccountData();
    const persistAccountData = mapleSqlApi.accountData.save(accountData).catch(() => undefined);

    clearAccountDataCache();
    localStorage.removeItem(AUTO_LOGIN_ENABLED_KEY);
    clearAuthSession();
    setAccountMenuOpen(false);
    setMenuOpen(false);
    navigate('/');

    // Finish remote cleanup after the local UI has already signed out. The
    // captured token remains valid even though browser storage is now clear.
    void persistAccountData.finally(() => (
      mapleSqlApi.auth.logout(accessToken || undefined).catch(() => undefined)
    ));
  };

  const openGuideMenu = () => {
    if (!guideMenu) return;
    if (guideMenuCloseTimer.current) clearTimeout(guideMenuCloseTimer.current);
    setGuideMenuOpen(true);
  };

  const closeGuideMenuLater = () => {
    if (guideMenuCloseTimer.current) clearTimeout(guideMenuCloseTimer.current);
    guideMenuCloseTimer.current = setTimeout(() => setGuideMenuOpen(false), 250);
  };

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const switchLang = (lang: string) => {
    const language = normalizeLanguage(lang);
    window.localStorage.setItem('i18nextLng', language);
    window.localStorage.setItem('maplehub-language', language);
    document.documentElement.lang = language;
    void i18n.changeLanguage(language);
    navigate(
      {
        pathname: withRouteSuffixes(location.pathname, language, versionInfo.id),
        search: location.search,
        hash: location.hash,
      },
      { replace: true },
    );
    setLangMenuOpen(false);
  };

  const handleVersionChange = (v: GameVersion) => {
    setVersion(v);
    setVersionMenuOpen(false);
  };

  const seriesRoute = getSeriesRouteState(routePathname, location.search);
  const isSeriesChooser = routePathname === '/' || routePathname === '/series';
  const activeSeries = getSeriesProduct(seriesRoute.seriesId)
    || (isSeriesChooser ? undefined : getSeriesProduct('maplestory-pc'));
  const availableVersions = useMemo(() => getSeriesVersions(activeSeries?.id), [activeSeries?.id]);
  const activeVersionShortLabel = getSeriesVersionShortLabel(activeSeries?.id, version);

  useEffect(() => {
    if (!availableVersions.some((item) => item.id === version)) {
      setVersion(availableVersions[0]?.id || 'gms');
    }
  }, [activeSeries?.id, availableVersions, setVersion, version]);

  const handleSeriesChange = (seriesId?: string) => {
    const requestedModule = seriesRoute.module || 'news';
    const destinationModule = isSeriesModuleAvailable(seriesId, requestedModule) ? requestedModule : 'news';
    const href = seriesId
      ? getSeriesModuleHref(seriesId, destinationModule)
      : '/';
    setSeriesMenuOpen(false);
    navigate(localizeHref(href, i18n.language, versionInfo.id));
  };

  const getNavHref = (href: string) => scopeModuleHref(activeSeries?.id, href);
  const visibleNavLinkKeys = navLinkKeys.filter((link) => (
    isSeriesModuleAvailable(activeSeries?.id, getSeriesRouteState(link.href).module)
  ));

  const defaultToolValue = routePathname === '/mapler-house'
    ? (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '') || 'dashboard'
    : '';

  const defaultToolOptions = useMemo(
    () =>
      defaultToolSections.map((section) => ({
        value: section.value,
        label: t(section.labelKey),
        icon: section.icon,
        favorite: defaultToolFavorites.includes(section.value),
        groupLabel: t(section.groupLabelKey),
      })),
    [defaultToolFavorites, t],
  );

  const effectiveToolMenu = toolMenu ?? {
    label: t('mh_tool_jump'),
    value: defaultToolValue,
    allLabel: t('mh_tool_menu_all'),
    favoritesLabel: t('mh_tool_menu_favorites'),
    emptyFavoritesLabel: t('mh_no_favorites'),
    options: defaultToolOptions,
    favoriteOptions: defaultToolOptions.filter((option) => option.favorite),
    onSelect: (value: string) => navigate(`/mapler-house#${value}`),
    onToggleFavorite: (value: string) =>
      setDefaultToolFavorites((current) =>
        current.includes(value) ? current.filter((item) => item !== value) : [value, ...current],
      ),
  };

  const openToolMenu = () => {
    if (toolMenuCloseTimer.current) clearTimeout(toolMenuCloseTimer.current);
    setToolMenuOpen(true);
  };

  const closeToolMenuLater = () => {
    if (toolMenuCloseTimer.current) clearTimeout(toolMenuCloseTimer.current);
    toolMenuCloseTimer.current = setTimeout(() => setToolMenuOpen(false), 900);
  };

  const visibleToolOptions =
    toolMenuTab === 'favorites' ? effectiveToolMenu.favoriteOptions : effectiveToolMenu.options;

  const selectTool = (value: string) => {
    effectiveToolMenu.onSelect(value);
    setToolMenuOpen(false);
    setMenuOpen(false);
  };

  const selectGuide = (value: string) => {
    guideMenu?.onSelect(value);
    setGuideMenuOpen(false);
    setMenuOpen(false);
  };

  const toggleToolFavorite = (value: string) => {
    effectiveToolMenu.onToggleFavorite(value);
    openToolMenu();
  };

  const renderToolOption = (option: ToolMenuOption) => (
    <div
      key={option.value}
      className={`flex items-center gap-1 px-2 py-1 ${
        option.value === effectiveToolMenu.value
          ? 'bg-primary-50 text-primary-700 font-semibold'
          : 'text-foreground-800 hover:bg-background-100 hover:text-primary-700'
      }`}
    >
      <button
        type="button"
        onClick={() => selectTool(option.value)}
        className="min-w-0 flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors cursor-pointer"
      >
        <i className={`${option.icon} text-base`}></i>
        <span className="min-w-0 flex-1 truncate">{option.label}</span>
        {option.value === effectiveToolMenu.value && <i className="ri-check-line text-primary-600"></i>}
      </button>
      {option.externalHref && (
        <a
          href={option.externalHref}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="h-8 w-8 shrink-0 rounded-md cursor-pointer flex items-center justify-center text-foreground-400 hover:text-primary-700 hover:bg-background-50"
          aria-label={t('nav_tool_open', { name: option.label })}
          title={t('nav_tool_open', { name: option.label })}
        >
          <i className="ri-external-link-line"></i>
        </a>
      )}
      <button
        type="button"
        onClick={() => toggleToolFavorite(option.value)}
        className={`h-8 w-8 shrink-0 rounded-md cursor-pointer flex items-center justify-center ${
          option.favorite ? 'text-secondary-700 bg-secondary-100' : 'text-foreground-400 hover:text-secondary-700 hover:bg-background-50'
        }`}
        aria-label={option.favorite ? t('nav_tool_remove_favorite') : t('nav_tool_add_favorite')}
      >
        <i className={option.favorite ? 'ri-star-fill' : 'ri-star-line'}></i>
      </button>
    </div>
  );

  const renderToolMenuList = (options: ToolMenuOption[], emptyLabel: string, mobile = false) => {
    if (options.length === 0) {
      return <div className={`${mobile ? 'px-3' : 'px-4'} py-3 text-sm text-foreground-500`}>{emptyLabel}</div>;
    }

    let lastGroup = '';
    return options.map((option) => {
      const showGroup = Boolean(option.groupLabel && option.groupLabel !== lastGroup);
      if (option.groupLabel) lastGroup = option.groupLabel;

      return (
        <div key={option.value}>
          {showGroup && (
            <div className={`${mobile ? 'px-3' : 'px-4'} pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-foreground-500`}>
              {option.groupLabel}
            </div>
          )}
          {renderToolOption(option)}
        </div>
      );
    });
  };

  const submitSearch = (value = query) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setMenuOpen(false);
  };

  const renderSearchMenu = (className: string) => (
    <div className={className} data-testid="site-search-menu">
      <div className="px-4 py-2 text-xs uppercase tracking-wider text-foreground-500 bg-background-100">
        {query ? t('nav_search_best_matches') : t('nav_search_popular')}
      </div>
      {query ? (
        <SearchResultList
          results={searchResults}
          emptyLabel={t('nav_search_no_match')}
          onSelect={(result) => {
            navigate(result.href);
            setSearchOpen(false);
            setMobileSearchOpen(false);
          }}
        />
      ) : (
        <ul className="py-2">
          {popularSearches.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => submitSearch(suggestion)}
                className="w-full text-left px-4 py-2 text-sm text-foreground-800 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-arrow-right-up-line text-foreground-500"></i>
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="px-4 py-2 text-[11px] text-foreground-600 bg-background-100 flex items-center gap-1 rounded-b-xl border-t border-background-200">
        <i className="ri-leaf-fill text-primary-500 text-xs"></i>
        {t('nav_search_filtered', { version: versionInfo.shortLabel })}
      </div>
    </div>
  );

  const isNavActive = (href: string) => {
    if (href.startsWith('http')) return false;
    const destination = getNavHref(href);
    if (destination !== href) return routePathname === destination;
    if (href === '/') return routePathname === '/';
    if (href === '/mapler-house') {
      return routePathname === '/mapler-house' || routePathname === '/maps';
    }
    return routePathname === href || routePathname.startsWith(`${href}/`);
  };

  const prefetchNav = (href: string) => {
    if (!href.startsWith('http')) void prefetchRouteForPath(href);
  };

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-[100] -translate-y-16 rounded-lg bg-foreground-950 px-4 py-2 text-sm font-semibold text-background-50 shadow-lg transition-transform focus:translate-y-0"
      >
        {t('skip_to_content')}
      </a>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-background-50 border-b ${
          scrolled
            ? 'border-primary-300/50 shadow-md'
            : 'border-primary-300/40 shadow-sm'
        }`}
      >
        <div className="w-full px-4 md:px-8 xl:px-4 2xl:px-8 h-16 md:h-20 flex items-center justify-between">
          {/* === MAPLE LEAF LOGO === */}
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group">
            <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center maple-pulse-glow group-hover:scale-105 transition-transform">
              <i className="ri-leaf-fill text-background-50 text-xl md:text-2xl leaf-sway"></i>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-secondary-400"></div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-lg md:text-xl font-semibold text-foreground-950 whitespace-nowrap">
                {SITE_NAME}
              </span>
              <span className="text-[10px] md:text-[11px] text-primary-600 tracking-wider whitespace-nowrap font-semibold">
                {SITE_TAGLINE.toUpperCase()}
              </span>
            </div>
          </Link>

          <nav className="hidden 2xl:flex items-center gap-1">
            {visibleNavLinkKeys.map((l) => {
              const active = isNavActive(l.href);
              const destinationHref = getNavHref(l.href);

              if (l.key === 'nav_guides' && guideMenu) {
                return (
                  <div
                    key={l.href}
                    ref={guideMenuRef}
                    className="relative group"
                    onMouseEnter={() => {
                      prefetchNav(destinationHref);
                      openGuideMenu();
                    }}
                    onFocus={() => prefetchNav(destinationHref)}
                    onMouseLeave={closeGuideMenuLater}
                  >
                    <button
                      type="button"
                      onFocus={openGuideMenu}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setGuideMenuOpen(false);
                      }}
                      aria-haspopup="menu"
                      aria-expanded={guideMenuOpen}
                      aria-current={active ? 'page' : undefined}
                      className={`px-2 2xl:px-3 py-2 rounded-md text-xs 2xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1 ${
                        guideMenuOpen || active
                          ? 'bg-primary-100 text-primary-700 shadow-sm'
                          : 'text-foreground-800 hover:text-primary-600 hover:bg-primary-50 group-hover:bg-primary-50 group-hover:text-primary-700'
                      }`}
                    >
                      {t(l.key)}
                      <i className="ri-arrow-down-s-line text-xs"></i>
                    </button>

                    <div
                      className={`absolute left-0 top-full z-50 w-56 pt-2 transition-opacity duration-150 ${
                        guideMenuOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
                      }`}
                    >
                      <div className="overflow-hidden rounded-lg border border-background-200 bg-background-50 py-2 shadow-xl">
                        {guideMenu.options.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => selectGuide(option.value)}
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                              option.value === guideMenu.value
                                ? 'bg-primary-50 text-primary-700 font-semibold'
                                : 'text-foreground-800 hover:bg-background-100 hover:text-primary-700'
                            }`}
                          >
                            <i className={`${option.icon} text-base`}></i>
                            <span className="min-w-0 flex-1 truncate">{option.label}</span>
                            {option.value === guideMenu.value && <i className="ri-check-line text-primary-600"></i>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              if (l.key === 'nav_tools' && (!activeSeries || activeSeries.id === 'maplestory-pc')) {
                return (
                  <div
                    key={l.href}
                    ref={toolMenuRef}
                    className="relative group"
                    onMouseEnter={() => {
                      prefetchNav(destinationHref);
                      openToolMenu();
                    }}
                    onFocus={() => prefetchNav(destinationHref)}
                    onMouseLeave={closeToolMenuLater}
                  >
                    <button
                      type="button"
                      onFocus={openToolMenu}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setToolMenuOpen(false);
                      }}
                      aria-haspopup="menu"
                      aria-expanded={toolMenuOpen}
                      aria-current={active ? 'page' : undefined}
                      className={`px-2 2xl:px-3 py-2 rounded-md text-xs 2xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1 ${
                        toolMenuOpen || active
                          ? 'bg-primary-100 text-primary-700 shadow-sm'
                          : 'text-foreground-800 hover:text-primary-600 hover:bg-primary-50 group-hover:bg-primary-50 group-hover:text-primary-700'
                      }`}
                    >
                      {t(l.key)}
                      <i className="ri-arrow-down-s-line text-xs"></i>
                    </button>

                    <div className="invisible absolute left-0 top-full z-50 w-64 pt-2 opacity-0 pointer-events-none transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                      <div className="overflow-hidden rounded-lg border border-background-200 bg-background-50 shadow-xl">
                        <div className="flex border-b border-background-200 bg-background-100">
                          <button
                            type="button"
                            onClick={() => setToolMenuTab('all')}
                            className={`flex-1 px-4 py-2.5 text-sm font-semibold cursor-pointer ${
                              toolMenuTab === 'all' ? 'bg-background-50 text-primary-700 border-b-2 border-primary-600' : 'text-foreground-600 hover:text-primary-700'
                            }`}
                          >
                            {effectiveToolMenu.allLabel}
                          </button>
                          <button
                            type="button"
                            onClick={() => setToolMenuTab('favorites')}
                            className={`flex-1 px-4 py-2.5 text-sm font-semibold cursor-pointer ${
                              toolMenuTab === 'favorites' ? 'bg-background-50 text-primary-700 border-b-2 border-primary-600' : 'text-foreground-600 hover:text-primary-700'
                            }`}
                          >
                            {effectiveToolMenu.favoritesLabel}
                          </button>
                        </div>

                        <div className="py-2">
                          {renderToolMenuList(visibleToolOptions, effectiveToolMenu.emptyFavoritesLabel)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (l.href.startsWith('http')) {
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 2xl:px-3 py-2 rounded-md text-xs 2xl:text-sm font-semibold text-foreground-800 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {t(l.key)}
                  </a>
                );
              }

              return (
                <Link
                  key={l.href}
                  to={localizeHref(destinationHref, i18n.language, versionInfo.id)}
                  onMouseEnter={() => prefetchNav(destinationHref)}
                  onFocus={() => prefetchNav(destinationHref)}
                  onTouchStart={() => prefetchNav(destinationHref)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-2 2xl:px-3 py-2 rounded-md text-xs 2xl:text-sm transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-primary-100 text-primary-700 font-semibold shadow-sm'
                      : 'font-semibold text-foreground-800 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  {t(l.key)}
                </Link>
              );
            })}
          </nav>

          <div className="ml-2 flex items-center gap-2 md:gap-3 xl:ml-1 xl:gap-1 2xl:ml-2 2xl:gap-3">
            <div ref={searchRef} className="relative hidden md:block">
              {routePathname === '/' ? (
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-background-200 bg-background-100 text-foreground-600 hover:border-primary-300/60 hover:text-primary-700"
                  aria-label={t('search_palette_open')}
                  title={`${t('search_palette_open')} · ⌘/Ctrl K`}
                >
                  <i className="ri-search-line" aria-hidden="true"></i>
                </button>
              ) : <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
                }}
                className={`h-10 flex items-center gap-2 rounded-full px-3 md:px-4 transition-all cursor-pointer whitespace-nowrap ${
                  searchOpen
                    ? 'bg-background-50 border border-primary-400/50 w-44 2xl:w-72'
                    : 'bg-background-100 border border-background-200 w-32 2xl:w-56 hover:border-primary-300/60'
                }`}
              >
                <button
                  type="submit"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-foreground-500 hover:text-primary-600 cursor-pointer"
                  aria-label={t('nav_search_button')}
                >
                  <i className="ri-search-line text-sm"></i>
                </button>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={t('nav_search_placeholder')}
                  className="bg-transparent text-sm text-foreground-900 placeholder:text-foreground-500 outline-none w-full"
                />
                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="hidden rounded border border-background-300 px-1.5 py-0.5 text-[10px] text-foreground-500 hover:border-primary-300 hover:text-primary-700 md:inline"
                  aria-label={t('search_palette_open')}
                  title={t('search_palette_open')}
                >
                  ⌘/Ctrl K
                </button>
              </form>
              }
              {searchOpen && renderSearchMenu('absolute right-0 mt-2 w-80 bg-background-50 border border-primary-200/40 rounded-xl overflow-hidden shadow-lg')}
            </div>

            {/* Series Selector */}
            <div ref={seriesRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => {
                  setVersionMenuOpen(false);
                  setLangMenuOpen(false);
                  setSeriesMenuOpen((open) => !open);
                }}
                aria-haspopup="menu"
                aria-expanded={seriesMenuOpen}
                className="flex h-10 max-w-44 items-center gap-1.5 rounded-full border border-background-200 bg-background-100 px-2.5 text-sm font-semibold text-foreground-800 hover:border-primary-300/60"
                title={t('home_series_title')}
              >
                {activeSeries ? (
                  <img src={activeSeries.image} alt="" className="h-5 w-5 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                    <i className="ri-apps-2-line text-xs" aria-hidden="true" />
                  </span>
                )}
                <span className="hidden max-w-32 truncate lg:inline">{activeSeries?.name || t('nav_series')}</span>
                <i className="ri-arrow-down-s-line shrink-0 text-xs text-foreground-500" aria-hidden="true" />
              </button>
              {seriesMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border border-primary-200/40 bg-background-50 shadow-lg" role="menu">
                  <div className="flex items-center gap-2 bg-background-100 px-4 py-2 text-xs font-semibold uppercase text-foreground-500">
                    <i className="ri-apps-2-line text-primary-600" aria-hidden="true" />
                    {t('home_series_title')}
                  </div>
                  <ul className="max-h-[70vh] overflow-y-auto py-1">
                    <li>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleSeriesChange()}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                          !activeSeries ? 'bg-primary-50 font-semibold text-primary-700' : 'text-foreground-800 hover:bg-background-100'
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-200 text-foreground-700">
                          <i className="ri-layout-grid-line" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">{t('home_series_all')}</span>
                        {!activeSeries && <i className="ri-check-line text-primary-600" aria-hidden="true" />}
                      </button>
                    </li>
                    {seriesProducts.map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleSeriesChange(product.id)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                            activeSeries?.id === product.id
                              ? 'bg-primary-50 font-semibold text-primary-700'
                              : 'text-foreground-800 hover:bg-background-100'
                          }`}
                        >
                          <img src={product.image} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" loading="lazy" />
                          <span className="min-w-0 flex-1 truncate">{product.name}</span>
                          {activeSeries?.id === product.id && <i className="ri-check-line text-primary-600" aria-hidden="true" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Version Selector */}
            <div ref={versionRef} className="relative hidden sm:block">
              <button
                onClick={() => {
                  setSeriesMenuOpen(false);
                  setVersionMenuOpen((v) => !v);
                }}
                className="h-10 flex items-center gap-1.5 rounded-full px-3 bg-background-100 border border-background-200 hover:border-primary-300/60 text-sm font-semibold text-foreground-800 cursor-pointer whitespace-nowrap"
                title={t('nav_version_label')}
              >
                <span className="w-5 h-5 rounded-md bg-gradient-to-br from-primary-500 to-accent-600 text-background-50 text-[10px] font-bold flex items-center justify-center">
                  {activeVersionShortLabel[0]}
                </span>
                <span className="hidden lg:inline">{activeVersionShortLabel}</span>
                <i className="ri-arrow-down-s-line text-foreground-500 text-xs"></i>
              </button>
              {versionMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-background-50 border border-primary-200/40 rounded-xl overflow-hidden z-50 shadow-lg">
                  <div className="px-4 py-2 text-xs uppercase tracking-wider text-foreground-500 bg-background-100 flex items-center gap-2">
                    <i className="ri-leaf-fill text-primary-500 text-xs"></i>
                    {t('nav_version_label')}
                  </div>
                  <ul className="py-1">
                    {availableVersions.map((ver) => (
                      <li key={ver.id}>
                        <button
                          onClick={() => handleVersionChange(ver.id)}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 cursor-pointer transition-colors ${
                            version === ver.id
                              ? 'bg-primary-50 text-primary-700 font-semibold'
                              : 'text-foreground-800 hover:bg-background-100'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                            version === ver.id
                              ? 'bg-gradient-to-br from-primary-500 to-accent-600 text-background-50'
                              : 'bg-background-100 text-foreground-700'
                          }`}>
                            {getSeriesVersionShortLabel(activeSeries?.id, ver.id)[0]}
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm leading-tight">{activeSeries && activeSeries.id !== 'maplestory-pc' ? activeSeries.name : getLocalizedVersionPresentation(ver, t).name}</span>
                            <span className="flex items-center gap-1.5 text-[10px] leading-tight text-foreground-500">
                              {getSeriesVersionShortLabel(activeSeries?.id, ver.id)} · {getLocalizedVersionPresentation(ver, t).region}
                            </span>
                          </div>
                          {version === ver.id && (
                            <i className="ri-check-line text-primary-600 ml-auto"></i>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div ref={langRef} className="relative hidden sm:block">
              <button
                onClick={() => setLangMenuOpen((v) => !v)}
                className="h-10 flex items-center gap-1 rounded-full px-2.5 bg-background-100 border border-background-200 hover:border-primary-300/60 text-xs font-semibold text-foreground-800 cursor-pointer whitespace-nowrap"
                title={t('nav_lang_label')}
              >
                <i className="ri-global-line"></i>
                <span className="hidden lg:inline">{i18n.language === 'zh' ? '中文' : i18n.language === 'ja' ? '日本語' : i18n.language === 'ko' ? '한국어' : i18n.language === 'zh-Hant' ? '繁體' : 'EN'}</span>
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-background-50 border border-primary-200/40 rounded-xl overflow-hidden z-50 shadow-lg">
                  <div className="px-3 py-2 text-xs uppercase tracking-wider text-foreground-500 bg-background-100">
                    {t('nav_lang_label')}
                  </div>
                  <ul className="py-1">
                    <li>
                      <button
                        onClick={() => switchLang('en')}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer ${
                          i18n.language === 'en' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-foreground-800 hover:bg-background-100'
                        }`}
                      >
                        <span>🇺🇸</span> English
                        {i18n.language === 'en' && <i className="ri-check-line ml-auto text-primary-600"></i>}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => switchLang('zh')}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer ${
                          i18n.language === 'zh' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-foreground-800 hover:bg-background-100'
                        }`}
                      >
                        <span>🇨🇳</span> 中文
                        {i18n.language === 'zh' && <i className="ri-check-line ml-auto text-primary-600"></i>}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => switchLang('ko')}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer ${
                          i18n.language === 'ko' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-foreground-800 hover:bg-background-100'
                        }`}
                      >
                        <span>🇰🇷</span> 한국어
                        {i18n.language === 'ko' && <i className="ri-check-line ml-auto text-primary-600"></i>}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => switchLang('ja')}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer ${
                          i18n.language === 'ja' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-foreground-800 hover:bg-background-100'
                        }`}
                      >
                        <span>🇯🇵</span> 日本語
                        {i18n.language === 'ja' && <i className="ri-check-line ml-auto text-primary-600"></i>}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => switchLang('zh-Hant')}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer ${
                          i18n.language === 'zh-Hant' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-foreground-800 hover:bg-background-100'
                        }`}
                      >
                        <span>🇹🇼</span> 繁體中文
                        {i18n.language === 'zh-Hant' && <i className="ri-check-line ml-auto text-primary-600"></i>}
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Mobile Search */}
            <button
              ref={mobileSearchButtonRef}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setSearchOpen(false);
                setMobileSearchOpen((open) => !open);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-background-300 bg-background-100 text-foreground-800 transition-colors hover:border-primary-400 hover:bg-primary-50 md:hidden"
              aria-label={mobileSearchOpen ? t('nav_search_close') : t('nav_search_open')}
              aria-expanded={mobileSearchOpen}
              aria-controls="mobile-site-search"
            >
              <i className={`${mobileSearchOpen ? 'ri-close-line' : 'ri-search-line'} text-lg`}></i>
            </button>

            {/* Notifications */}
            <button
              onClick={onOpenNotifications}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-background-300 bg-background-100 text-foreground-800 transition-colors hover:border-primary-400 hover:bg-primary-50 cursor-pointer"
              aria-label={t('nav_notifications')}
            >
              <i className="ri-notification-3-line text-foreground-700 text-lg"></i>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-background-50 text-[10px] font-bold flex items-center justify-center">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
              <span className="absolute inset-0 rounded-full border border-primary-400 animate-pulse-ring pointer-events-none"></span>
            </button>

            {/* Account state */}
            {!isSessionResolved ? (
              <div className="hidden h-10 w-28 sm:block 2xl:w-36" aria-hidden="true" />
            ) : isSignedIn ? (
              <div ref={accountMenuRef} className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  className="flex h-10 max-w-32 2xl:max-w-44 items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 text-sm font-semibold text-primary-800 transition hover:border-primary-300 hover:bg-primary-100"
                  title={t('nav_account_signed_in', { name: displayName })}
                >
                  {session?.avatarUrl ? (
                    <img src={session.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-xs text-background-50">
                      {(displayName || '?').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate">{displayName}</span>
                  <i className="ri-arrow-down-s-line text-xs" aria-hidden="true" />
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-background-200 bg-background-50 py-1 shadow-xl" role="menu">
                    <Link
                      to="/account"
                      onClick={() => setAccountMenuOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground-800 hover:bg-background-100"
                    >
                      <i className="ri-user-settings-line" aria-hidden="true" />
                      {t('nav_account_dashboard')}
                    </Link>
                    {isAdmin && (
                      <Link
                        to={localizeHref('/admin/feedback', i18n.language, versionInfo.id)}
                        onClick={() => setAccountMenuOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-2 border-t border-background-200 px-4 py-2.5 text-sm font-medium text-foreground-800 hover:bg-background-100"
                      >
                        <i className="ri-feedback-line" aria-hidden="true" />
                        {t('nav_feedback_admin')}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      role="menuitem"
                      className="flex w-full items-center gap-2 border-t border-background-200 px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      <i className="ri-logout-circle-r-line" aria-hidden="true" />
                      {t('nav_sign_out')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-full bg-gradient-to-r from-primary-500 to-accent-600 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:from-primary-600 hover:to-accent-700 transition-all cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md"
              >
                <i className="ri-login-circle-line"></i>
                {t('nav_sign_in')}
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => {
                setSearchOpen(false);
                setMobileSearchOpen(false);
                setMenuOpen((v) => !v);
              }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-background-300 bg-background-100 text-foreground-800 2xl:hidden cursor-pointer"
              aria-label={menuOpen ? t('nav_menu_close') : t('nav_menu_open')}
            >
              <i className={`${menuOpen ? 'ri-close-line' : 'ri-menu-line'} text-foreground-800 text-xl`}></i>
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div
            id="mobile-site-search"
            ref={mobileSearchRef}
            className="border-t border-primary-200/20 bg-background-50 px-4 py-3 shadow-md md:hidden"
          >
            <form
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setMobileSearchOpen(false);
              }}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-background-300 bg-background-100 px-3 focus-within:border-primary-400"
            >
              <i className="ri-search-line text-foreground-500"></i>
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('nav_search_placeholder')}
                aria-label={t('nav_search_placeholder')}
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground-900 outline-none placeholder:text-foreground-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-foreground-700 hover:bg-background-200 hover:text-foreground-950"
                  aria-label={t('search_clear_btn')}
                >
                  <i className="ri-close-line"></i>
                </button>
              )}
            </form>
            {renderSearchMenu('mt-2 max-h-[min(60vh,28rem)] overflow-y-auto rounded-xl border border-primary-200/40 bg-background-50 shadow-lg')}
          </div>
        )}

        {menuOpen && (
          <div className="2xl:hidden bg-background-50 border-t border-primary-200/20 px-4 py-3">
            <nav className="flex flex-col">
              {visibleNavLinkKeys.map((l) => {
                const active = isNavActive(l.href);
                const destinationHref = getNavHref(l.href);

                if (l.key === 'nav_guides' && guideMenu) {
                  return (
                    <div key={l.href} className="py-1">
                      <button
                        type="button"
                        onClick={() => setGuideMenuOpen((open) => !open)}
                        aria-current={active ? 'page' : undefined}
                        className={`w-full rounded-md px-3 py-2 text-sm font-semibold cursor-pointer flex items-center justify-between ${
                          active ? 'bg-primary-100 text-primary-700' : 'text-primary-700 hover:bg-primary-50'
                        }`}
                      >
                        <span>{t(l.key)}</span>
                        <i className={`${guideMenuOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-base`}></i>
                      </button>
                      {guideMenuOpen && (
                        <div className="mt-1 overflow-hidden rounded-lg border border-background-200 bg-background-50 py-1">
                          {guideMenu.options.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => selectGuide(option.value)}
                              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm cursor-pointer ${
                                option.value === guideMenu.value
                                  ? 'bg-primary-50 text-primary-700 font-semibold'
                                  : 'text-foreground-800 hover:bg-background-100'
                              }`}
                            >
                              <i className={`${option.icon} text-base`}></i>
                              <span className="min-w-0 flex-1 truncate">{option.label}</span>
                              {option.value === guideMenu.value && <i className="ri-check-line text-primary-600"></i>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                if (l.key === 'nav_tools' && (!activeSeries || activeSeries.id === 'maplestory-pc')) {
                  return (
                    <div key={l.href} ref={mobileToolMenuRef} className="py-1">
                      <button
                        type="button"
                        onClick={() => setToolMenuOpen((open) => !open)}
                        aria-current={active ? 'page' : undefined}
                        className={`w-full rounded-md px-3 py-2 text-sm font-semibold cursor-pointer flex items-center justify-between ${
                          active ? 'bg-primary-100 text-primary-700' : 'text-primary-700 hover:bg-primary-50'
                        }`}
                      >
                        <span>{t(l.key)}</span>
                        <i className={`${toolMenuOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-base`}></i>
                      </button>
                      {toolMenuOpen && (
                        <div className="mt-1 overflow-hidden rounded-lg border border-background-200 bg-background-50">
                          <div className="flex border-b border-background-200 bg-background-100">
                            <button
                              type="button"
                              onClick={() => setToolMenuTab('all')}
                              className={`flex-1 px-3 py-2 text-sm font-semibold ${
                                toolMenuTab === 'all' ? 'bg-background-50 text-primary-700 border-b-2 border-primary-600' : 'text-foreground-600'
                              }`}
                            >
                              {effectiveToolMenu.allLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => setToolMenuTab('favorites')}
                              className={`flex-1 px-3 py-2 text-sm font-semibold ${
                                toolMenuTab === 'favorites' ? 'bg-background-50 text-primary-700 border-b-2 border-primary-600' : 'text-foreground-600'
                              }`}
                            >
                              {effectiveToolMenu.favoritesLabel}
                            </button>
                          </div>
                          <div className="py-1">
                            {renderToolMenuList(visibleToolOptions, effectiveToolMenu.emptyFavoritesLabel, true)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                if (l.href.startsWith('http')) {
                  return (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="py-2 text-sm font-medium text-foreground-800 hover:text-primary-600 cursor-pointer"
                    >
                      {t(l.key)}
                    </a>
                  );
                }

                return (
                  <Link
                    key={l.href}
                    to={localizeHref(destinationHref, i18n.language, versionInfo.id)}
                    onMouseEnter={() => prefetchNav(destinationHref)}
                    onFocus={() => prefetchNav(destinationHref)}
                    onTouchStart={() => prefetchNav(destinationHref)}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-md px-3 py-2 text-sm cursor-pointer ${
                      active
                        ? 'bg-primary-100 text-primary-700 font-semibold'
                        : 'font-medium text-foreground-800 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    {t(l.key)}
                  </Link>
                );
              })}
              <div className="mt-3 pt-3 border-t border-background-200 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-700">
                  <i className="ri-leaf-fill text-primary-500 text-xs"></i>
                  {t('nav_version_label')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableVersions.map((ver) => (
                    <button
                      key={ver.id}
                      onClick={() => { setVersion(ver.id); setMenuOpen(false); }}
                      className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        version === ver.id ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'border border-background-300 bg-background-100 text-foreground-800'
                      }`}
                    >
                      {ver.name}
                    </button>
                  ))}
                </div>
                <div className="mt-1 text-xs font-medium text-foreground-700">{t('nav_lang_label')}</div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => switchLang('en')}
                    className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      i18n.language === 'en' ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'border border-background-300 bg-background-100 text-foreground-800'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => switchLang('zh')}
                    className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      i18n.language === 'zh' ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'border border-background-300 bg-background-100 text-foreground-800'
                    }`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => switchLang('ko')}
                    className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      i18n.language === 'ko' ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'border border-background-300 bg-background-100 text-foreground-800'
                    }`}
                  >
                    한국어
                  </button>
                  <button
                    onClick={() => switchLang('ja')}
                    className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      i18n.language === 'ja' ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'border border-background-300 bg-background-100 text-foreground-800'
                    }`}
                  >
                    日本語
                  </button>
                  <button
                    onClick={() => switchLang('zh-Hant')}
                    className={`inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      i18n.language === 'zh-Hant' ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'border border-background-300 bg-background-100 text-foreground-800'
                    }`}
                  >
                    繁體
                  </button>
                </div>
                {!isSessionResolved ? (
                  <div className="mt-2 h-10" aria-hidden="true" />
                ) : isSignedIn ? (
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <Link
                      to="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 text-sm font-semibold text-primary-800"
                    >
                      <i className="ri-user-smile-line" />
                      <span className="truncate">{displayName}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-white px-3 text-sm font-semibold text-red-700"
                    >
                      <i className="ri-logout-circle-r-line" aria-hidden="true" />
                      {t('nav_sign_out')}
                    </button>
                    {isAdmin && (
                      <Link
                        to={localizeHref('/admin/feedback', i18n.language, versionInfo.id)}
                        onClick={() => setMenuOpen(false)}
                        className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 text-sm font-semibold text-primary-800"
                      >
                        <i className="ri-feedback-line" aria-hidden="true" />
                        {t('nav_feedback_admin')}
                      </Link>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 h-10 px-4 rounded-full bg-gradient-to-r from-primary-500 to-accent-600 text-background-50 dark:text-foreground-950 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-login-circle-line"></i>
                    {t('nav_sign_in')}
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
      <UniversalSearchDialog open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
