import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import HelpCenterPage from './page';

export default function HelpNextRoute(props: NextRoutePageProps) {
  return <NextRoutePage {...props} initialRouteElement={<HelpCenterPage />} />;
}

export const getServerSideProps = getServerSideRouteProps;
