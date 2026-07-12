import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ExternalRedirect from '@/components/feature/ExternalRedirect';

const wikiOrigin = 'https://maplestorywiki.net';

const safeWikiUrl = (value: string | null) => {
  if (!value) return `${wikiOrigin}/w/MapleStory_Wiki`;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    if (host !== 'maplestorywiki.net') return `${wikiOrigin}/w/MapleStory_Wiki`;
    return url.toString();
  } catch {
    return `${wikiOrigin}/w/MapleStory_Wiki`;
  }
};

export function WikiRedirectPage() {
  const [searchParams] = useSearchParams();
  const target = useMemo(() => safeWikiUrl(searchParams.get('to')), [searchParams]);

  return (
    <ExternalRedirect
      to={target}
      message="Entering MapleStory Wiki"
      targetLabel="MapleStory Wiki"
    />
  );
}

export function WikiArticleRedirectPage() {
  const { '*': titleParam } = useParams<{ '*': string }>();
  const target = useMemo(() => {
    const title = titleParam ? decodeURIComponent(titleParam).replace(/\s+/g, '_') : 'MapleStory_Wiki';
    return `${wikiOrigin}/w/${encodeURIComponent(title)}`;
  }, [titleParam]);

  return (
    <ExternalRedirect
      to={target}
      message="Entering MapleStory Wiki"
      targetLabel="MapleStory Wiki"
    />
  );
}
