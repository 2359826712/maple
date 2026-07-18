import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import OfficialSourcePage from './page';

export default function SourceNextRoute(props: NextRoutePageProps) {
  return <NextRoutePage {...props} initialRouteElement={<OfficialSourcePage />} />;
}

export const getServerSideProps = getServerSideRouteProps;
