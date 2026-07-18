import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import SeriesModuleRoute from '@/pages/series/SeriesModuleRoute';
import MaplerHouse from './page';

export default function MaplerHouseNextRoute(props: NextRoutePageProps) {
  return (
    <NextRoutePage
      {...props}
      initialRouteElement={<SeriesModuleRoute module="tools"><MaplerHouse /></SeriesModuleRoute>}
    />
  );
}

export const getServerSideProps = getServerSideRouteProps;
