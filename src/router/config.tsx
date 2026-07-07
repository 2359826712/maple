import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import GuideDetail from "../pages/guides/detail/page";
import ClassRankings from "../pages/rankings/classes/page";
import MaplerHouse from "../pages/mapler-house/page";
import NewsPage from "../pages/news/page";
import GuidesPage from "../pages/guides/page";
import EventsPage from "../pages/events/page";
import CommunityPage from "../pages/community/page";
import MapsPage from "../pages/maps/page";
import WikiPage from "../pages/wiki/page";
import LoginPage from "../pages/auth/login/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/news",
    element: <NewsPage />,
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
    element: <CommunityPage />,
  },
  {
    path: "/auth/login",
    element: <LoginPage />,
  },
  {
    path: "/maps",
    element: <MapsPage />,
  },
  {
    path: "/rankings/classes",
    element: <ClassRankings />,
  },
  {
    path: "/mapler-house",
    element: <MaplerHouse />,
  },
  {
    path: "/wiki",
    element: <WikiPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
