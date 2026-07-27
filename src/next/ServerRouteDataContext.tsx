import { createContext, useContext, type ReactNode } from 'react';
import type {
  EventItem,
  GrandisGuideSectionPage,
  GuideItem,
  NewsItem,
  OfficialArticleDocument,
  ToolResourceItem,
  WikiEntry,
} from '@/services/liveContent';
import type { UpcomingUpdateArticle, UpcomingUpdateFeed } from '@/services/upcomingUpdates';
import type { PublishedSeriesTranslation } from '@/services/publishedSeriesContent';

type ServerRouteData = {
  initialEvents: EventItem[];
  initialGuide: GuideItem | null;
  initialGuides: GuideItem[];
  initialGuideSection: GrandisGuideSectionPage | null;
  initialNews: NewsItem[];
  initialOfficialArticle: OfficialArticleDocument | null;
  initialSeriesTranslations: Record<string, PublishedSeriesTranslation>;
  initialTools: ToolResourceItem[];
  initialUpcomingArticle: UpcomingUpdateArticle | null;
  initialUpcomingFeed: UpcomingUpdateFeed | null;
  initialWikiEntry: WikiEntry | null;
  requestTitle?: string;
};

const emptyServerRouteData: ServerRouteData = {
  initialEvents: [],
  initialGuide: null,
  initialGuides: [],
  initialGuideSection: null,
  initialNews: [],
  initialOfficialArticle: null,
  initialSeriesTranslations: {},
  initialTools: [],
  initialUpcomingArticle: null,
  initialUpcomingFeed: null,
  initialWikiEntry: null,
};
const ServerRouteDataContext = createContext<ServerRouteData>(emptyServerRouteData);

export function ServerRouteDataProvider({
  children,
  initialEvents = [],
  initialGuide = null,
  initialGuides = [],
  initialGuideSection = null,
  initialNews = [],
  initialOfficialArticle = null,
  initialSeriesTranslations = {},
  initialTools = [],
  initialUpcomingArticle = null,
  initialUpcomingFeed = null,
  initialWikiEntry = null,
  requestTitle,
}: {
  children: ReactNode;
  initialEvents?: EventItem[];
  initialGuide?: GuideItem | null;
  initialGuides?: GuideItem[];
  initialGuideSection?: GrandisGuideSectionPage | null;
  initialNews?: NewsItem[];
  initialOfficialArticle?: OfficialArticleDocument | null;
  initialSeriesTranslations?: Record<string, PublishedSeriesTranslation>;
  initialTools?: ToolResourceItem[];
  initialUpcomingArticle?: UpcomingUpdateArticle | null;
  initialUpcomingFeed?: UpcomingUpdateFeed | null;
  initialWikiEntry?: WikiEntry | null;
  requestTitle?: string;
}) {
  return (
    <ServerRouteDataContext.Provider value={{
      initialEvents,
      initialGuide,
      initialGuides,
      initialGuideSection,
      initialNews,
      initialOfficialArticle,
      initialSeriesTranslations,
      initialTools,
      initialUpcomingArticle,
      initialUpcomingFeed,
      initialWikiEntry,
      requestTitle,
    }}>
      {children}
    </ServerRouteDataContext.Provider>
  );
}

export const useServerRouteData = () => useContext(ServerRouteDataContext);
