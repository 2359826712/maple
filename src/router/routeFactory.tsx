import type { ComponentType, ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import InternalRedirect from '@/components/feature/InternalRedirect';
import type { SeriesModule } from '@/pages/series/scope';
import {
  languagePathSegments,
  serverPathSegments,
  supportedLanguages,
  supportedServers,
} from '@/i18n/languageRouting';

export type RouteComponents = {
  AccountPage: ComponentType;
  AdminFeedbackPage: ComponentType;
  BossDetailPage: ComponentType;
  ChecklistPage: ComponentType;
  CommunityPage: ComponentType;
  EventsPage: ComponentType;
  FeedbackPage: ComponentType;
  GuideDetail: ComponentType;
  GuidesPage: ComponentType;
  Home: ComponentType;
  LevelGuidePage: ComponentType;
  LoginPage: ComponentType;
  MaplerHouse: ComponentType;
  MapsPage: ComponentType;
  NewsPage: ComponentType;
  NotFound: ComponentType;
  OfficialSourcePage: ComponentType;
  RankingsPage: ComponentType;
  SearchPage: ComponentType;
  SeriesResourceDetailPage: ComponentType;
  SeriesPage: ComponentType;
  SeriesModuleRoute: ComponentType<{ children: ReactNode; module: SeriesModule }>;
  ShopPage: ComponentType;
  ToolsPage: ComponentType;
  UpcomingUpdateDetailPage: ComponentType;
  UpcomingUpdatesPage: ComponentType;
  WikiArticlePage: ComponentType;
  WikiPage: ComponentType;
  WikiRedirectPage: ComponentType;
};

export function createRoutes(components: RouteComponents): RouteObject[] {
  const {
    AccountPage,
    AdminFeedbackPage,
    BossDetailPage,
    ChecklistPage,
    CommunityPage,
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
    SeriesModuleRoute,
    ShopPage,
    ToolsPage,
    UpcomingUpdateDetailPage,
    UpcomingUpdatesPage,
    WikiArticlePage,
    WikiPage,
    WikiRedirectPage,
  } = components;

  const localizableRoutes: RouteObject[] = [
    { path: '/', element: <Home /> },
    { path: '/updates', element: <SeriesModuleRoute module="news"><NewsPage /></SeriesModuleRoute> },
    { path: '/news', element: <InternalRedirect to="/updates" label="MapleStory updates" /> },
    { path: '/upcoming', element: <SeriesModuleRoute module="upcoming"><UpcomingUpdatesPage /></SeriesModuleRoute> },
    { path: '/upcoming/:postId', element: <UpcomingUpdateDetailPage /> },
    { path: '/search', element: <SearchPage /> },
    { path: '/source', element: <OfficialSourcePage /> },
    { path: '/series', element: <SeriesPage /> },
    { path: '/series/:seriesId', element: <SeriesPage /> },
    { path: '/series/:seriesId/:seriesModule', element: <SeriesPage /> },
    { path: '/series/:seriesId/:seriesModule/:slug', element: <SeriesResourceDetailPage /> },
    { path: '/content/:contentModule/:slug', element: <SeriesResourceDetailPage /> },
    { path: '/guides', element: <SeriesModuleRoute module="guides"><GuidesPage /></SeriesModuleRoute> },
    { path: '/guides/:id', element: <GuideDetail /> },
    { path: '/events', element: <SeriesModuleRoute module="events"><EventsPage /></SeriesModuleRoute> },
    {
      path: '/community',
      element: <SeriesModuleRoute module="community"><CommunityPage /></SeriesModuleRoute>,
    },
    { path: '/auth/login', element: <LoginPage /> },
    { path: '/account', element: <AccountPage /> },
    { path: '/maps', element: <MapsPage /> },
    { path: '/rankings', element: <SeriesModuleRoute module="rankings"><RankingsPage /></SeriesModuleRoute> },
    {
      path: '/rankings/classes',
      element: <InternalRedirect to="/tools#stats" label="Mapler House class rankings" />,
    },
    { path: '/mapler-house', element: <InternalRedirect to="/tools" label="MPStorys tools" /> },
    { path: '/wiki/redirect', element: <WikiRedirectPage /> },
    { path: '/wiki', element: <SeriesModuleRoute module="wiki"><WikiPage /></SeriesModuleRoute> },
    { path: '/checklist', element: <SeriesModuleRoute module="checklist"><ChecklistPage /></SeriesModuleRoute> },
    { path: '/guides/level', element: <LevelGuidePage /> },
    { path: '/tools', element: <SeriesModuleRoute module="tools"><MaplerHouse /></SeriesModuleRoute> },
    { path: '/shop', element: <SeriesModuleRoute module="shop"><ShopPage /></SeriesModuleRoute> },
    { path: '/feedback', element: <SeriesModuleRoute module="feedback"><FeedbackPage /></SeriesModuleRoute> },
    { path: '/admin/feedback', element: <AdminFeedbackPage /> },
  ];

  const appendLanguagePath = (path: string, segment: string) =>
    path === '/' ? `/${segment}` : `${path.replace(/\/+$/, '')}/${segment}`;

  const localizedRoutes: RouteObject[] = supportedLanguages.flatMap((language) => {
    const segment = languagePathSegments[language];
    return [
      ...localizableRoutes.map((route) => ({
        ...route,
        path: appendLanguagePath(route.path || '/', segment),
      })),
      { path: `/wiki/article/:articlePath/${segment}`, element: <WikiArticlePage /> },
      { path: `/wiki/boss/${segment}`, element: <BossDetailPage /> },
      { path: `/wiki/boss/:bossName/${segment}`, element: <BossDetailPage /> },
    ];
  });

  const localizedServerRoutes: RouteObject[] = supportedLanguages.flatMap((language) => {
    const languageSegment = languagePathSegments[language];
    return supportedServers.flatMap((server) => {
      const serverSegment = serverPathSegments[server];
      return [
        ...localizableRoutes.map((route) => ({
          ...route,
          path: `${appendLanguagePath(route.path || '/', languageSegment)}/${serverSegment}`,
        })),
        {
          path: `/wiki/article/:articlePath/${languageSegment}/${serverSegment}`,
          element: <WikiArticlePage />,
        },
        { path: `/wiki/boss/${languageSegment}/${serverSegment}`, element: <BossDetailPage /> },
        {
          path: `/wiki/boss/:bossName/${languageSegment}/${serverSegment}`,
          element: <BossDetailPage />,
        },
      ];
    });
  });

  return [
    ...localizableRoutes,
    { path: '/wiki/article/*', element: <WikiArticlePage /> },
    { path: '/wiki/boss/*', element: <BossDetailPage /> },
    ...localizedRoutes,
    ...localizedServerRoutes,
    { path: '*', element: <NotFound /> },
  ];
}
