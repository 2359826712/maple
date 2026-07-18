import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import ExternalRedirect from '@/components/feature/ExternalRedirect';
import { communityLinks } from '@/constants/communityLinks';
import SeriesModuleRoute from '@/pages/series/SeriesModuleRoute';

export default function CommunityNextRoute(props: NextRoutePageProps) {
  return (
    <NextRoutePage
      {...props}
      initialRouteElement={(
        <SeriesModuleRoute module="community">
          <ExternalRedirect
            to={communityLinks.reddit}
            message="Entering MapleStory Community"
            targetLabel="MapleStory Community"
          />
        </SeriesModuleRoute>
      )}
    />
  );
}

export const getServerSideProps = getServerSideRouteProps;
