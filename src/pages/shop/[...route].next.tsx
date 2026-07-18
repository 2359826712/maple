import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import SeriesModuleRoute from '@/pages/series/SeriesModuleRoute';
import ShopPage from './page';

export default function ShopNextRoute(props: NextRoutePageProps) {
  return (
    <NextRoutePage
      {...props}
      initialRouteElement={<SeriesModuleRoute module="shop"><ShopPage /></SeriesModuleRoute>}
    />
  );
}

export const getServerSideProps = getServerSideRouteProps;
