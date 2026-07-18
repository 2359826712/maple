import NextRoutePage from '@/next/NextRoutePage';
import type { NextRoutePageProps } from '@/next/routeData';
import { getServerSideRouteProps } from '@/next/serverRoute';
import AdminFeedbackPage from './feedback/page';

export default function AdminNextRoute(props: NextRoutePageProps) {
  return <NextRoutePage {...props} initialRouteElement={<AdminFeedbackPage />} />;
}

export const getServerSideProps = getServerSideRouteProps;
