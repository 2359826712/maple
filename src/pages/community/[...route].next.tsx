import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import SeriesModuleRoute from '@/pages/series/SeriesModuleRoute';
import CommunityPage from './page';

export default function CommunityNextRoute(props: NextRoutePageProps) {
  return (
    <NextRoutePage
      {...props}
      initialRouteElement={<SeriesModuleRoute module="community"><CommunityPage /></SeriesModuleRoute>}
    />
  );
}

export const getServerSideProps = getServerSideRouteProps;
