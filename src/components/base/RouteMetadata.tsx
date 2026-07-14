import { useLocation } from 'react-router-dom';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import {
  getPathLanguage,
  stripLanguageSuffix,
  withLanguageSuffix,
  type SupportedLanguage,
} from '@/i18n/languageRouting';
import metadataCatalog from '@/seo/routeMetadata.json';

type MetadataCopy = {
  description: string;
  title: string;
};

type RouteMetadataEntry = {
  canonicalRoute?: string;
  copy: Record<SupportedLanguage, MetadataCopy>;
  follow?: boolean;
  index: boolean;
};

const routes = metadataCatalog.routes as Record<string, RouteMetadataEntry>;
const notFoundCopy = metadataCatalog.notFound as Record<SupportedLanguage, MetadataCopy>;

const pageManagedRoutes = [
  /^\/events$/,
  /^\/guides\/(?!level$)[^/]+$/,
  /^\/source$/,
  /^\/upcoming(?:\/[^/]+)?$/,
  /^\/wiki\/article\//,
  /^\/wiki\/boss(?:\/.*)?$/,
];

function MetadataEffect({
  canonicalPath,
  copy,
  follow = true,
  index = true,
}: {
  canonicalPath?: string;
  copy: MetadataCopy;
  follow?: boolean;
  index?: boolean;
}) {
  usePageMetadata(copy.title, copy.description, {
    canonicalPath,
    includeAlternates: index,
    noFollow: !follow,
    noIndex: !index,
  });
  return null;
}

export default function RouteMetadata() {
  const { pathname } = useLocation();
  const language = getPathLanguage(pathname) || 'en';
  const routePathname = stripLanguageSuffix(pathname);
  const normalizedPath = routePathname.length > 1 ? routePathname.replace(/\/+$/, '') : routePathname;

  if (pageManagedRoutes.some((pattern) => pattern.test(normalizedPath))) return null;

  const metadata = routes[normalizedPath];
  if (metadata) {
    const canonicalPath = metadata.canonicalRoute
      ? withLanguageSuffix(metadata.canonicalRoute, language)
      : undefined;
    return (
      <MetadataEffect
        canonicalPath={canonicalPath}
        copy={metadata.copy[language] || metadata.copy.en}
        follow={metadata.follow}
        index={metadata.index}
      />
    );
  }

  return <MetadataEffect copy={notFoundCopy[language] || notFoundCopy.en} index={false} />;
}
