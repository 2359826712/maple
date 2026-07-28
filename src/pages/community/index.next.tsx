import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import SeriesModuleRoute from '@/pages/series/SeriesModuleRoute';
import CommunityLandingPage from './CommunityLandingPage';

export default function CommunityIndexRoute(props: NextRoutePageProps) {
  return (
    <NextRoutePage
      {...props}
      initialRouteElement={<SeriesModuleRoute module="community"><CommunityLandingPage /></SeriesModuleRoute>}
    />
  );
}

export const getServerSideProps = getServerSideRouteProps;
