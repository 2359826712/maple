import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { lazy } from "react";
import { communityLinks } from "@/constants/communityLinks";
import { RouteLoader } from "@/components/base/RouteLoadingFallback";

const NotFound = lazy(() => import("../pages/NotFound"));
const Home = lazy(() => import("../pages/home/page"));
const GuideDetail = lazy(() => import("../pages/guides/detail/page"));
const RankingsPage = lazy(() => import("../pages/rankings/page"));
const MaplerHouse = lazy(() => import("../pages/mapler-house/page"));
const NewsPage = lazy(() => import("../pages/news/page"));
const GuidesPage = lazy(() => import("../pages/guides/page"));
const EventsPage = lazy(() => import("../pages/events/page"));
const MapsPage = lazy(() => import("../pages/maps/page"));
const WikiPage = lazy(() => import("../pages/wiki/page"));
const WikiArticlePage = lazy(() => import("../pages/wiki/article"));
const LoginPage = lazy(() => import("../pages/auth/login/page"));
const SearchPage = lazy(() => import("../pages/search/page"));
const OfficialSourcePage = lazy(() => import("../pages/source/page"));
const ChecklistPage = lazy(() => import("../pages/checklist/page"));
const LevelGuidePage = lazy(() => import("../pages/guides/level/page"));
const ToolsPage = lazy(() => import("../pages/tools/page"));
const BossDetailPage = lazy(() => import("../pages/wiki/boss"));
const ExternalRedirect = lazy(() => import("@/components/feature/ExternalRedirect"));
const WikiRedirectPage = lazy(() => import("../pages/wiki/redirect").then((module) => ({ default: module.WikiRedirectPage })));

const routes: RouteObject[] = [
  {
    path: "/",
    element: <RouteLoader><Home /></RouteLoader>,
  },
  {
    path: "/news",
    element: <RouteLoader><NewsPage /></RouteLoader>,
  },
  {
    path: "/search",
    element: <RouteLoader><SearchPage /></RouteLoader>,
  },
  {
    path: "/source",
    element: <RouteLoader><OfficialSourcePage /></RouteLoader>,
  },
  {
    path: "/guides",
    element: <RouteLoader><GuidesPage /></RouteLoader>,
  },
  {
    path: "/guides/:id",
    element: <RouteLoader><GuideDetail /></RouteLoader>,
  },
  {
    path: "/events",
    element: <RouteLoader><EventsPage /></RouteLoader>,
  },
  {
    path: "/community",
    element: <RouteLoader><ExternalRedirect to={communityLinks.reddit} message="Entering MapleStory Community" targetLabel="MapleStory Community" /></RouteLoader>,
  },
  {
    path: "/auth/login",
    element: <RouteLoader><LoginPage /></RouteLoader>,
  },
  {
    path: "/maps",
    element: <RouteLoader><MapsPage /></RouteLoader>,
  },
  {
    path: "/rankings",
    element: <RouteLoader><RankingsPage /></RouteLoader>,
  },
  {
    path: "/rankings/classes",
    element: <Navigate to="/mapler-house#stats" replace />,
  },
  {
    path: "/mapler-house",
    element: <RouteLoader><MaplerHouse /></RouteLoader>,
  },
  {
    path: "/wiki/article/*",
    element: <RouteLoader><WikiArticlePage /></RouteLoader>,
  },
  {
    path: "/wiki/boss/*",
    element: <RouteLoader><BossDetailPage /></RouteLoader>,
  },
  {
    path: "/wiki/redirect",
    element: <RouteLoader><WikiRedirectPage /></RouteLoader>,
  },
  {
    path: "/wiki",
    element: <RouteLoader><WikiPage /></RouteLoader>,
  },
  {
    path: "/checklist",
    element: <RouteLoader><ChecklistPage /></RouteLoader>,
  },
  {
    path: "/guides/level",
    element: <RouteLoader><LevelGuidePage /></RouteLoader>,
  },
  {
    path: "/tools",
    element: <RouteLoader><ToolsPage /></RouteLoader>,
  },
  {
    path: "*",
    element: <RouteLoader><NotFound /></RouteLoader>,
  },
];

export default routes;
