import { stripRouteSuffixes } from '@/i18n/languageRouting';

export const usesArticleContentStyles = (pathname: string) => {
  const route = stripRouteSuffixes(pathname);
  return route === '/wiki'
    || route.startsWith('/wiki/')
    || route === '/source'
    || route === '/guides'
    || route.startsWith('/guides/')
    || route.startsWith('/upcoming/');
};
