import { createElement, type ComponentType } from "react";
import { createRoutes } from './routeFactory';

type LazyRouteComponent = ComponentType & {
  preload: () => Promise<{ default: ComponentType }>;
};

export const lazyWithPreload = (loader: () => Promise<{ default: ComponentType }>) => {
  let preloadPromise: Promise<{ default: ComponentType }> | undefined;
  let LoadedComponent: ComponentType | undefined;
  let preloadError: unknown;
  const preload = () => {
    preloadPromise ??= loader().then((module) => {
      LoadedComponent = module.default;
      preloadError = undefined;
      return module;
    }).catch((error: unknown) => {
      preloadPromise = undefined;
      preloadError = error;
      throw error;
    });
    return preloadPromise;
  };
  const Component = ((props: object) => {
    if (preloadError) {
      const error = preloadError;
      preloadError = undefined;
      throw error;
    }
    if (!LoadedComponent) throw preload();
    return createElement(LoadedComponent, props);
  }) as LazyRouteComponent;
  Component.preload = preload;
  return Component;
};

const NotFound = lazyWithPreload(() => import("../pages/NotFound"));
const Home = lazyWithPreload(() => import("../pages/home/page"));
const GuideDetail = lazyWithPreload(() => import("../pages/guides/detail/page"));
const RankingsPage = lazyWithPreload(() => import("../pages/rankings/page"));
const MaplerHouse = lazyWithPreload(() => import("../pages/mapler-house/page"));
const NewsPage = lazyWithPreload(() => import("../pages/news/page"));
const UpcomingUpdatesPage = lazyWithPreload(() => import("../pages/upcoming/page"));
const UpcomingUpdateDetailPage = lazyWithPreload(() => import("../pages/upcoming/detail/page"));
const GuidesPage = lazyWithPreload(() => import("../pages/guides/page"));
const EventsPage = lazyWithPreload(() => import("../pages/events/page"));
const MapsPage = lazyWithPreload(() => import("../pages/maps/page"));
const WikiPage = lazyWithPreload(() => import("../pages/wiki/page"));
const WikiArticlePage = lazyWithPreload(() => import("../pages/wiki/article"));
const LoginPage = lazyWithPreload(() => import("../pages/auth/login/page"));
const AccountPage = lazyWithPreload(() => import("../pages/account/page"));
const SearchPage = lazyWithPreload(() => import("../pages/search/page"));
const OfficialSourcePage = lazyWithPreload(() => import("../pages/source/page"));
const ChecklistPage = lazyWithPreload(() => import("../pages/checklist/page"));
const LevelGuidePage = lazyWithPreload(() => import("../pages/guides/level/page"));
const ToolsPage = lazyWithPreload(() => import("../pages/tools/page"));
const ShopPage = lazyWithPreload(() => import("../pages/shop/page"));
const SeriesPage = lazyWithPreload(() => import("../pages/series/page"));
const SeriesResourceDetailPage = lazyWithPreload(() => import("../pages/series/SeriesResourceDetailPage"));
const FeedbackPage = lazyWithPreload(() => import("../pages/feedback/page"));
const AdminFeedbackPage = lazyWithPreload(() => import("../pages/admin/feedback/page"));
const BossDetailPage = lazyWithPreload(() => import("../pages/wiki/boss"));
const WikiRedirectPage = lazyWithPreload(() =>
  import("../pages/wiki/redirect").then((module) => ({ default: module.WikiRedirectPage })),
);

const routePrefetchers: Array<[string, LazyRouteComponent]> = [
  ["/upcoming/", UpcomingUpdateDetailPage],
  ["/guides/level", LevelGuidePage],
  ["/guides/", GuideDetail],
  ["/wiki/article/", WikiArticlePage],
  ["/wiki/boss", BossDetailPage],
  ["/news", NewsPage],
  ["/upcoming", UpcomingUpdatesPage],
  ["/search", SearchPage],
  ["/source", OfficialSourcePage],
  ["/guides", GuidesPage],
  ["/events", EventsPage],
  ["/auth/login", LoginPage],
  ["/account", AccountPage],
  ["/maps", MapsPage],
  ["/rankings", RankingsPage],
  ["/mapler-house", MaplerHouse],
  ["/wiki/redirect", WikiRedirectPage],
  ["/wiki", WikiPage],
  ["/checklist", ChecklistPage],
  ["/tools", ToolsPage],
  ["/shop", ShopPage],
  ["/series", SeriesPage],
  ["/content/", SeriesResourceDetailPage],
  ["/feedback", FeedbackPage],
  ["/admin/feedback", AdminFeedbackPage],
  ["/", Home],
];

export const idleRoutePrefetchPaths = [
  '/news',
  '/upcoming',
  '/guides',
  '/events',
  '/mapler-house',
  '/checklist',
  '/wiki',
  '/rankings',
  '/shop',
  '/series',
  '/feedback',
] as const;

export function prefetchRouteForPath(pathname: string) {
  const normalizedPathname = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const match = routePrefetchers.find(([prefix]) =>
    prefix === '/'
      ? normalizedPathname === '/'
      : normalizedPathname === prefix || normalizedPathname.startsWith(prefix),
  );
  return match?.[1].preload();
}

export default createRoutes({
  AccountPage,
  AdminFeedbackPage,
  BossDetailPage,
  ChecklistPage,
  EventsPage,
  FeedbackPage,
  GuideDetail,
  GuidesPage,
  Home,
  LevelGuidePage,
  LoginPage,
  MaplerHouse,
  MapsPage,
  NewsPage,
  NotFound,
  OfficialSourcePage,
  RankingsPage,
  SearchPage,
  SeriesResourceDetailPage,
  SeriesPage,
  ShopPage,
  ToolsPage,
  UpcomingUpdateDetailPage,
  UpcomingUpdatesPage,
  WikiArticlePage,
  WikiPage,
  WikiRedirectPage,
});
