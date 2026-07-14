import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { lazy } from "react";
import { communityLinks } from "@/constants/communityLinks";
import ExternalRedirect from "@/components/feature/ExternalRedirect";
import { languagePathSegments, serverPathSegments, supportedLanguages, supportedServers } from "@/i18n/languageRouting";

const NotFound = lazy(() => import("../pages/NotFound"));
const Home = lazy(() => import("../pages/home/page"));
const GuideDetail = lazy(() => import("../pages/guides/detail/page"));
const RankingsPage = lazy(() => import("../pages/rankings/page"));
const MaplerHouse = lazy(() => import("../pages/mapler-house/page"));
const NewsPage = lazy(() => import("../pages/news/page"));
const UpcomingUpdatesPage = lazy(() => import("../pages/upcoming/page"));
const UpcomingUpdateDetailPage = lazy(() => import("../pages/upcoming/detail/page"));
const GuidesPage = lazy(() => import("../pages/guides/page"));
const EventsPage = lazy(() => import("../pages/events/page"));
const MapsPage = lazy(() => import("../pages/maps/page"));
const WikiPage = lazy(() => import("../pages/wiki/page"));
const WikiArticlePage = lazy(() => import("../pages/wiki/article"));
const LoginPage = lazy(() => import("../pages/auth/login/page"));
const AccountPage = lazy(() => import("../pages/account/page"));
const SearchPage = lazy(() => import("../pages/search/page"));
const OfficialSourcePage = lazy(() => import("../pages/source/page"));
const ChecklistPage = lazy(() => import("../pages/checklist/page"));
const LevelGuidePage = lazy(() => import("../pages/guides/level/page"));
const ToolsPage = lazy(() => import("../pages/tools/page"));
const FeedbackPage = lazy(() => import("../pages/feedback/page"));
const AdminFeedbackPage = lazy(() => import("../pages/admin/feedback/page"));
const BossDetailPage = lazy(() => import("../pages/wiki/boss"));
const WikiRedirectPage = lazy(() =>
  import("../pages/wiki/redirect").then((module) => ({ default: module.WikiRedirectPage })),
);

const localizableRoutes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/news",
    element: <NewsPage />,
  },
  {
    path: "/upcoming",
    element: <UpcomingUpdatesPage />,
  },
  {
    path: "/upcoming/:postId",
    element: <UpcomingUpdateDetailPage />,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
  {
    path: "/source",
    element: <OfficialSourcePage />,
  },
  {
    path: "/guides",
    element: <GuidesPage />,
  },
  {
    path: "/guides/:id",
    element: <GuideDetail />,
  },
  {
    path: "/events",
    element: <EventsPage />,
  },
  {
    path: "/community",
    element: <ExternalRedirect to={communityLinks.reddit} message="Entering MapleStory Community" targetLabel="MapleStory Community" />,
  },
  {
    path: "/auth/login",
    element: <LoginPage />,
  },
  {
    path: "/account",
    element: <AccountPage />,
  },
  {
    path: "/maps",
    element: <MapsPage />,
  },
  {
    path: "/rankings",
    element: <RankingsPage />,
  },
  {
    path: "/rankings/classes",
    element: <Navigate to="/mapler-house#stats" replace />,
  },
  {
    path: "/mapler-house",
    element: <MaplerHouse />,
  },
  {
    path: "/wiki/redirect",
    element: <WikiRedirectPage />,
  },
  {
    path: "/wiki",
    element: <WikiPage />,
  },
  {
    path: "/checklist",
    element: <ChecklistPage />,
  },
  {
    path: "/guides/level",
    element: <LevelGuidePage />,
  },
  {
    path: "/tools",
    element: <ToolsPage />,
  },
  {
    path: "/feedback",
    element: <FeedbackPage />,
  },
  {
    path: "/admin/feedback",
    element: <AdminFeedbackPage />,
  },
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
    {
      path: `/wiki/article/:articlePath/${segment}`,
      element: <WikiArticlePage />,
    },
    {
      path: `/wiki/boss/${segment}`,
      element: <BossDetailPage />,
    },
    {
      path: `/wiki/boss/:bossName/${segment}`,
      element: <BossDetailPage />,
    },
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
      {
        path: `/wiki/boss/${languageSegment}/${serverSegment}`,
        element: <BossDetailPage />,
      },
      {
        path: `/wiki/boss/:bossName/${languageSegment}/${serverSegment}`,
        element: <BossDetailPage />,
      },
    ];
  });
});

const routes: RouteObject[] = [
  ...localizableRoutes,
  {
    path: "/wiki/article/*",
    element: <WikiArticlePage />,
  },
  {
    path: "/wiki/boss/*",
    element: <BossDetailPage />,
  },
  ...localizedRoutes,
  ...localizedServerRoutes,
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
