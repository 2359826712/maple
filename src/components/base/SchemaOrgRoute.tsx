import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getPathLanguage,
  getPathServer,
  stripRouteSuffixes,
  withRouteSuffixes,
  type SupportedLanguage,
} from '@/i18n/languageRouting';
import { SITE_NAME, SITE_URL } from '@/constants/site';
import type { SchemaOrgType } from '@/components/base/SchemaOrg';
import metadataCatalog from '@/seo/routeMetadata.json';

type SchemaEntry = {
  types: Extract<SchemaOrgType, 'WebSite' | 'WebPage'>[];
};

type MetadataCopy = {
  description: string;
  title: string;
};

type RouteSchemaEntry = {
  canonicalRoute?: string;
  copy: Record<string, MetadataCopy>;
  index: boolean;
  schema?: SchemaEntry;
};

const routes = metadataCatalog.routes as Record<string, RouteSchemaEntry>;

const organizationId = `${SITE_URL}/#organization`;
const websiteId = `${SITE_URL}/#website`;

const organizationSchemaData = {
  '@type': 'Organization',
  '@id': organizationId,
  name: SITE_NAME,
  alternateName: 'MapleStory Player Hub',
  url: `${SITE_URL}/`,
  logo: {
    '@type': 'ImageObject',
    contentUrl: `${SITE_URL}/mpstorys-icon-128.jpg`,
    width: 128,
    height: 128,
  },
};

const websiteSchemaData = {
  '@type': 'WebSite',
  '@id': websiteId,
  name: SITE_NAME,
  alternateName: 'MapleStory Player Hub',
  url: `${SITE_URL}/`,
  image: {
    '@type': 'ImageObject',
    contentUrl: `${SITE_URL}/og.png`,
    width: 1731,
    height: 909,
  },
  publisher: { '@id': organizationId },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const breadcrumbData = (
  route: string,
  language: SupportedLanguage,
  server: string,
) => {
  const routeSegments = route.split('/').filter(Boolean);
  const routeChain = [
    '/',
    ...routeSegments.map((_, index) => `/${routeSegments.slice(0, index + 1).join('/')}`),
  ].filter((candidate) => routes[candidate]?.index);

  return {
    itemListElement: routeChain.map((candidate, index) => {
      const copy = routes[candidate].copy[language] || routes[candidate].copy.en;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: copy.title,
        item: `${SITE_URL}${withRouteSuffixes(candidate, language, server)}`,
      };
    }),
  };
};

export default function SchemaOrgRoute() {
  const { pathname } = useLocation();
  const language = getPathLanguage(pathname) || 'en';
  const server = getPathServer(pathname) || 'gms';
  const routePathname = stripRouteSuffixes(pathname);
  const normalizedPath = routePathname.length > 1 ? routePathname.replace(/\/+$/, '') : routePathname;
  const metadata = routes[normalizedPath];
  const schemaGraph: Record<string, unknown>[] = [];

  if (metadata?.schema) {
    const copy = metadata.copy[language] || metadata.copy.en;
    const canonicalRoute = metadata.canonicalRoute || normalizedPath;
    const canonicalPath = withRouteSuffixes(canonicalRoute, language, server);
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;

    schemaGraph.push(organizationSchemaData, websiteSchemaData);
    if (metadata.schema.types.includes('WebPage')) {
      schemaGraph.push({
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        name: copy?.title || SITE_NAME,
        description: copy?.description || '',
        url: canonicalUrl,
        inLanguage: metadataCatalog.languages[language].htmlLang,
        isPartOf: { '@id': websiteId },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          contentUrl: `${SITE_URL}/og.png`,
          width: 1731,
          height: 909,
        },
      });
    }
    if (normalizedPath !== '/') {
      schemaGraph.push({
        '@type': 'BreadcrumbList',
        ...breadcrumbData(normalizedPath, language, server),
      });
    }
  }
  const schemaJson = schemaGraph.length > 0
    ? JSON.stringify({ '@context': 'https://schema.org', '@graph': schemaGraph }).replaceAll('<', '\\u003c')
    : '';

  useEffect(() => {
    document.head.querySelectorAll('script[data-seo-schema="route"]').forEach((element) => element.remove());
    if (!schemaJson) return;

    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.dataset.seoSchema = 'route';
    schema.textContent = schemaJson;
    document.head.appendChild(schema);
  }, [schemaJson]);

  return null;
}
