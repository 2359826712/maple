import Head from 'next/head';
import { useLocation } from 'react-router-dom';
import { usesArticleContentStyles } from '@/next/routeStyles';

export default function RouteContentStylesheet() {
  const { pathname } = useLocation();

  if (!usesArticleContentStyles(pathname)) return null;

  return (
    <Head>
      <link key="article-content-styles" rel="stylesheet" href="/article-content.css" />
    </Head>
  );
}
