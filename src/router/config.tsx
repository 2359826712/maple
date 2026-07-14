import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { communityLinks } from "@/constants/communityLinks";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import GuideDetail from "../pages/guides/detail/page";
import RankingsPage from "../pages/rankings/page";
import MaplerHouse from "../pages/mapler-house/page";
import NewsPage from "../pages/news/page";
import UpcomingUpdatesPage from "../pages/upcoming/page";
import UpcomingUpdateDetailPage from "../pages/upcoming/detail/page";
import GuidesPage from "../pages/guides/page";
import EventsPage from "../pages/events/page";
import MapsPage from "../pages/maps/page";
import WikiPage from "../pages/wiki/page";
import WikiArticlePage from "../pages/wiki/article";
import LoginPage from "../pages/auth/login/page";
import AccountPage from "../pages/account/page";
import SearchPage from "../pages/search/page";
import OfficialSourcePage from "../pages/source/page";
import ChecklistPage from "../pages/checklist/page";
import LevelGuidePage from "../pages/guides/level/page";
import ToolsPage from "../pages/tools/page";
import BossDetailPage from "../pages/wiki/boss";
import ExternalRedirect from "@/components/feature/ExternalRedirect";
import { WikiRedirectPage } from "../pages/wiki/redirect";
import { languagePathSegments, supportedLanguages } from "@/i18n/languageRouting";

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
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
