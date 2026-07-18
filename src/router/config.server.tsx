import AccountPage from '../pages/account/page';
import AdminFeedbackPage from '../pages/admin/feedback/page';
import LoginPage from '../pages/auth/login/page';
import ChecklistPage from '../pages/checklist/page';
import EventsPage from '../pages/events/page';
import FeedbackPage from '../pages/feedback/page';
import GuideDetail from '../pages/guides/detail/page';
import LevelGuidePage from '../pages/guides/level/page';
import GuidesPage from '../pages/guides/page';
import Home from '../pages/home/page';
import MaplerHouse from '../pages/mapler-house/page';
import MapsPage from '../pages/maps/page';
import NewsPage from '../pages/news/page';
import NotFound from '../pages/NotFound';
import RankingsPage from '../pages/rankings/page';
import SearchPage from '../pages/search/page';
import ShopPage from '../pages/shop/page';
import SeriesPage from '../pages/series/page';
import SeriesResourceDetailPage from '../pages/series/SeriesResourceDetailPage';
import OfficialSourcePage from '../pages/source/page';
import ToolsPage from '../pages/tools/page';
import UpcomingUpdateDetailPage from '../pages/upcoming/detail/page';
import UpcomingUpdatesPage from '../pages/upcoming/page';
import BossDetailPage from '../pages/wiki/boss';
import WikiArticlePage from '../pages/wiki/article';
import WikiPage from '../pages/wiki/page';
import { WikiRedirectPage } from '../pages/wiki/redirect';
import { createRoutes } from './routeFactory';

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
