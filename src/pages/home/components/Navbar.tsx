import { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useVersion, VERSIONS, type GameVersion } from '@/hooks/VersionContext';

const navLinkKeys = [
  { key: 'nav_news', href: '/news' },
  { key: 'nav_guides', href: '/guides' },
  { key: 'nav_events', href: '/events' },
  { key: 'nav_tools', href: '/mapler-house' },
  { key: 'nav_wiki', href: '/wiki' },
  { key: 'nav_rankings', href: '/rankings/classes' },
  { key: 'nav_community', href: '/community' },
];

const TOOL_FAVORITES_KEY = 'maplehub-tool-favorites';

const defaultToolSections = [
  { value: 'simulators', labelKey: 'mh_section_simulators', icon: 'ri-calculator-line' },
  { value: 'enhance', labelKey: 'mh_section_enhance', icon: 'ri-hammer-line' },
  { value: 'maps', labelKey: 'mh_section_maps', icon: 'ri-map-pin-line' },
  { value: 'char-lookup', labelKey: 'mh_section_char_lookup', icon: 'ri-user-search-line' },
  { value: 'growth', labelKey: 'mh_section_growth', icon: 'ri-line-chart-line' },
  { value: 'legion', labelKey: 'mh_section_legion', icon: 'ri-layout-grid-line' },
  { value: 'stats', labelKey: 'mh_section_stats', icon: 'ri-bar-chart-grouped-line' },
  { value: 'announcements', labelKey: 'mh_section_announcements', icon: 'ri-megaphone-line' },
  { value: 'fashion', labelKey: 'mh_section_fashion', icon: 'ri-t-shirt-line' },
];

interface NavbarProps {
  onOpenNotifications: () => void;
  unread: number;
  toolMenu?: {
    label: string;
    value: string;
    allLabel: string;
    favoritesLabel: string;
    emptyFavoritesLabel: string;
    options: Array<{ value: string; label: string; icon: string; favorite?: boolean; externalHref?: string }>;
    favoriteOptions: Array<{ value: string; label: string; icon: string; favorite?: boolean; externalHref?: string }>;
    onSelect: (value: string) => void;
    onToggleFavorite: (value: string) => void;
  };
}

export default function Navbar({ onOpenNotifications, unread, toolMenu }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const { version, versionInfo, setVersion } = useVersion();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [versionMenuOpen, setVersionMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [toolMenuTab, setToolMenuTab] = useState<'all' | 'favorites'>('all');
  const [defaultToolFavorites, setDefaultToolFavorites] = useState<string[]>(() => {
    try {
      const value = window.localStorage.getItem(TOOL_FAVORITES_KEY);
      return value ? JSON.parse(value) as string[] : [];
    } catch {
      return [];
    }
  });
  const searchRef = useRef<HTMLDivElement | null>(null);
  const versionRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<HTMLDivElement | null>(null);
  const toolMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileToolMenuRef = useRef<HTMLDivElement | null>(null);
  const toolMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (versionRef.current && !versionRef.current.contains(e.target as Node)) {
        setVersionMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      const target = e.target as Node;
      const insideDesktopTools = toolMenuRef.current?.contains(target);
      const insideMobileTools = mobileToolMenuRef.current?.contains(target);

      if (!insideDesktopTools && !insideMobileTools) {
        setToolMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => () => {
    if (toolMenuCloseTimer.current) clearTimeout(toolMenuCloseTimer.current);
  }, []);

  useEffect(() => {
    if (!toolMenu) {
      window.localStorage.setItem(TOOL_FAVORITES_KEY, JSON.stringify(defaultToolFavorites));
    }
  }, [defaultToolFavorites, toolMenu]);

  const suggestions = query
    ? [
        `Class guide: ${query}`,
        `Boss walkthrough matching "${query}"`,
        `Wiki entry — ${query}`,
        `Community threads about ${query}`,
      ]
    : ['Hexa nodes tier list', 'Kalos strategy', 'Familiar badges', 'Sunny Sunday times'];

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const switchLang = (lang: string) => {
    window.localStorage.setItem('i18nextLng', lang);
    window.localStorage.setItem('maplehub-language', lang);
    document.documentElement.lang = lang;
    i18n.changeLanguage(lang);
    setLangMenuOpen(false);
  };

  const handleVersionChange = (v: GameVersion) => {
    setVersion(v);
    setVersionMenuOpen(false);
  };

  const defaultToolValue = location.pathname === '/mapler-house'
    ? window.location.hash.replace('#', '') || 'dashboard'
    : '';

  const defaultToolOptions = useMemo(
    () =>
      defaultToolSections.map((section) => ({
        value: section.value,
        label: t(section.labelKey),
        icon: section.icon,
        favorite: defaultToolFavorites.includes(section.value),
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

  const toggleToolFavorite = (value: string) => {
    effectiveToolMenu.onToggleFavorite(value);
    openToolMenu();
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-background-50/97 backdrop-blur-md border-b border-primary-200/30"
      >
        <div className="w-full px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          {/* === MAPLE LEAF LOGO === */}
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group">
            <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center maple-pulse-glow group-hover:scale-105 transition-transform">
              <i className="ri-leaf-fill text-background-50 text-xl md:text-2xl leaf-sway"></i>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-secondary-400"></div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-lg md:text-xl font-semibold text-foreground-950 whitespace-nowrap">
                MapleHub
              </span>
              <span className="text-[10px] md:text-[11px] text-primary-600 tracking-wider whitespace-nowrap font-semibold">
                {versionInfo.shortLabel} COMMUNITY
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinkKeys.map((l) => {
              if (l.key === 'nav_tools') {
                return (
                  <div
                    key={l.href}
                    ref={toolMenuRef}
                    className="relative group"
                    onMouseEnter={openToolMenu}
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
                      className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1 ${
                        toolMenuOpen ? 'bg-primary-50 text-primary-700' : 'text-foreground-700 hover:text-primary-600 hover:bg-primary-50 group-hover:bg-primary-50 group-hover:text-primary-700'
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
                          {visibleToolOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-foreground-500">{effectiveToolMenu.emptyFavoritesLabel}</div>
                          ) : (
                            visibleToolOptions.map((option) => (
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
                                    aria-label={`open ${option.label}`}
                                    title={`Open ${option.label}`}
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
                                  aria-label={option.favorite ? 'remove favorite' : 'add favorite'}
                                >
                                  <i className={option.favorite ? 'ri-star-fill' : 'ri-star-line'}></i>
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={l.href}
                  to={l.href}
                  className="px-3 py-2 rounded-md text-sm font-medium text-foreground-700 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t(l.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-3 ml-2">
            <div ref={searchRef} className="relative hidden md:block">
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className={`h-10 flex items-center gap-2 rounded-full px-3 md:px-4 transition-all cursor-pointer whitespace-nowrap ${
                  searchOpen
                    ? 'bg-background-50 border border-primary-400/50 w-72'
                    : 'bg-background-100 border border-background-200 w-56 hover:border-primary-300/60'
                }`}
              >
                <i className="ri-search-line text-foreground-500 text-sm"></i>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={t('nav_search_placeholder')}
                  className="bg-transparent text-sm text-foreground-900 placeholder:text-foreground-500 outline-none w-full"
                />
                <span className="hidden md:inline text-[10px] text-foreground-500 border border-background-300 rounded px-1.5 py-0.5">
                  ⌘K
                </span>
              </button>
              {searchOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-background-50 border border-primary-200/40 rounded-xl overflow-hidden shadow-lg">
                  <div className="px-4 py-2 text-xs uppercase tracking-wider text-foreground-500 bg-background-100">
                    {query ? 'Best matches' : 'Popular right now'}
                  </div>
                  <ul className="py-2">
                    {suggestions.map((s) => (
                      <li key={s}>
                        <button
                          onClick={() => {
                            setQuery(s);
                            setSearchOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-foreground-800 hover:bg-primary-50 hover:text-primary-700 flex items-center gap-2 cursor-pointer"
                        >
                          <i className="ri-arrow-right-up-line text-foreground-500"></i>
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-2 text-[11px] text-foreground-600 bg-background-100 flex items-center gap-1 rounded-b-xl border-t border-background-200">
                    <i className="ri-leaf-fill text-primary-500 text-xs"></i>
                    {t('nav_search_filtered', { version: versionInfo.shortLabel })}
                  </div>
                </div>
              )}
            </div>

            {/* Version Selector */}
            <div ref={versionRef} className="relative hidden sm:block">
              <button
                onClick={() => setVersionMenuOpen((v) => !v)}
                className="h-10 flex items-center gap-1.5 rounded-full px-3 bg-background-100 border border-background-200 hover:border-primary-300/60 text-sm font-semibold text-foreground-800 cursor-pointer whitespace-nowrap"
                title={t('nav_version_label')}
              >
                <span className="w-5 h-5 rounded-md bg-gradient-to-br from-primary-500 to-accent-600 text-background-50 text-[10px] font-bold flex items-center justify-center">
                  {versionInfo.shortLabel[0]}
                </span>
                <span className="hidden lg:inline">{versionInfo.shortLabel}</span>
                <i className="ri-arrow-down-s-line text-foreground-500 text-xs"></i>
              </button>
              {versionMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-background-50 border border-primary-200/40 rounded-xl overflow-hidden z-50 shadow-lg">
                  <div className="px-4 py-2 text-xs uppercase tracking-wider text-foreground-500 bg-background-100 flex items-center gap-2">
                    <i className="ri-leaf-fill text-primary-500 text-xs"></i>
                    {t('nav_version_label')}
                  </div>
                  <ul className="py-1">
                    {VERSIONS.map((ver) => (
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
                            {ver.shortLabel[0]}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm leading-tight">{ver.name}</span>
                            <span className="text-[10px] text-foreground-500 leading-tight">{ver.region}</span>
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
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangMenuOpen((v) => !v)}
                className="h-10 flex items-center gap-1 rounded-full px-2.5 bg-background-100 border border-background-200 hover:border-primary-300/60 text-xs font-semibold text-foreground-800 cursor-pointer whitespace-nowrap"
                title={t('nav_lang_label')}
              >
                <i className="ri-global-line"></i>
                <span className="hidden lg:inline">{i18n.language === 'zh' ? '中文' : i18n.language === 'ja' ? '日本語' : i18n.language === 'zh-Hant' ? '繁體' : 'EN'}</span>
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

            {/* Notifications */}
            <button
              onClick={onOpenNotifications}
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-background-100 border border-background-200 hover:bg-primary-50 hover:border-primary-300/50 transition-colors cursor-pointer"
              aria-label="notifications"
            >
              <i className="ri-notification-3-line text-foreground-700 text-lg"></i>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-background-50 text-[10px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
              <span className="absolute inset-0 rounded-full border border-primary-400 animate-pulse-ring pointer-events-none"></span>
            </button>

            {/* Sign In Button */}
            <Link
              to="/auth/login"
              className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-full bg-gradient-to-r from-primary-500 to-accent-600 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:from-primary-600 hover:to-accent-700 transition-all cursor-pointer whitespace-nowrap shadow-sm hover:shadow-md"
            >
              <i className="ri-login-circle-line"></i>
              {t('nav_sign_in')}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-background-100 border border-background-200 cursor-pointer"
              aria-label="menu"
            >
              <i className={`${menuOpen ? 'ri-close-line' : 'ri-menu-line'} text-foreground-800 text-xl`}></i>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-background-50 border-t border-primary-200/20 px-4 py-3">
            <nav className="flex flex-col">
              {navLinkKeys.map((l) => {
                if (l.key === 'nav_tools') {
                  return (
                    <div key={l.href} ref={mobileToolMenuRef} className="py-1">
                      <button
                        type="button"
                        onClick={() => setToolMenuOpen((open) => !open)}
                        className="w-full py-2 text-sm font-semibold text-primary-700 cursor-pointer flex items-center justify-between"
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
                            {visibleToolOptions.length === 0 ? (
                              <div className="px-3 py-3 text-sm text-foreground-500">{effectiveToolMenu.emptyFavoritesLabel}</div>
                            ) : (
                              visibleToolOptions.map((option) => (
                                <div
                                  key={option.value}
                                  className={`flex items-center gap-1 px-1.5 py-1 ${
                                    option.value === effectiveToolMenu.value
                                      ? 'bg-primary-50 text-primary-700 font-semibold'
                                      : 'text-foreground-800 hover:bg-background-100'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => selectTool(option.value)}
                                    className="min-w-0 flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm cursor-pointer"
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
                                      className="h-8 w-8 shrink-0 rounded-md cursor-pointer flex items-center justify-center text-foreground-400 hover:text-primary-700 hover:bg-background-100"
                                      aria-label={`open ${option.label}`}
                                      title={`Open ${option.label}`}
                                    >
                                      <i className="ri-external-link-line"></i>
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => toggleToolFavorite(option.value)}
                                    className={`h-8 w-8 shrink-0 rounded-md cursor-pointer flex items-center justify-center ${
                                      option.favorite ? 'text-secondary-700 bg-secondary-100' : 'text-foreground-400 hover:text-secondary-700 hover:bg-background-100'
                                    }`}
                                    aria-label={option.favorite ? 'remove favorite' : 'add favorite'}
                                  >
                                    <i className={option.favorite ? 'ri-star-fill' : 'ri-star-line'}></i>
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={l.href}
                    to={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="py-2 text-sm font-medium text-foreground-800 hover:text-primary-600 cursor-pointer"
                  >
                    {t(l.key)}
                  </Link>
                );
              })}
              <div className="mt-3 pt-3 border-t border-background-200 flex flex-col gap-2">
                <div className="text-xs text-foreground-500 flex items-center gap-1.5">
                  <i className="ri-leaf-fill text-primary-500 text-xs"></i>
                  {t('nav_version_label')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {VERSIONS.map((ver) => (
                    <button
                      key={ver.id}
                      onClick={() => { setVersion(ver.id); setMenuOpen(false); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                        version === ver.id ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'bg-background-100 text-foreground-700 border border-background-200'
                      }`}
                    >
                      {ver.name}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-foreground-500 mt-1">{t('nav_lang_label')}</div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => switchLang('en')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      i18n.language === 'en' ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'bg-background-100 text-foreground-700 border border-background-200'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => switchLang('zh')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      i18n.language === 'zh' ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'bg-background-100 text-foreground-700 border border-background-200'
                    }`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => switchLang('ja')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      i18n.language === 'ja' ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'bg-background-100 text-foreground-700 border border-background-200'
                    }`}
                  >
                    日本語
                  </button>
                  <button
                    onClick={() => switchLang('zh-Hant')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      i18n.language === 'zh-Hant' ? 'bg-gradient-to-r from-primary-500 to-accent-600 text-background-50' : 'bg-background-100 text-foreground-700 border border-background-200'
                    }`}
                  >
                    繁體
                  </button>
                </div>
                <Link
                  to="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 h-10 px-4 rounded-full bg-gradient-to-r from-primary-500 to-accent-600 text-background-50 dark:text-foreground-950 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-login-circle-line"></i>
                  {t('nav_sign_in')}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
